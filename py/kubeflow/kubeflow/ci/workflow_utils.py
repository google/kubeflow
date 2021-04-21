import logging
import os
import random
import string

from kubeflow.testing import argo_build_util

# The name of the NFS volume claim to use for test files.
NFS_VOLUME_CLAIM = "nfs-external"
# The name to use for the volume to use to contain test data
DATA_VOLUME = "kubeflow-test-volume"

E2E_DAG_NAME = "e2e"
EXIT_DAG_NAME = "exit-handler"


LOCAL_TESTING = os.getenv("LOCAL_TESTING", "False")
DOCKER_CONFIG_VOLUME = {"name": "docker-config",
                        "configMap": {"name": "docker-config"}}
DOCKER_CONFIG_MOUNT = {"name": "docker-config",
                       "mountPath": "/kaniko/.docker/"}
AWS_CREDENTIALS_VOLUME = {"name": "aws-secret",
                          "secret": {"secretName": "aws-secret"}}
AWS_CREDENTIALS_MOUNT = {"mountPath": "/root/.aws/",
                         "name": "aws-secret"}

AWS_WORKER_IMAGE = "public.ecr.aws/j1r0q0g6/kubeflow-testing:latest"


class ArgoTestBuilder:
    def __init__(self, name=None, namespace=None, bucket=None,
                 test_target_name=None, release=False,
                 **kwargs):
        self.name = name
        self.namespace = namespace
        self.bucket = bucket
        self.template_label = "argo_test"
        self.test_target_name = test_target_name
        self.mkdir_task_name = "make-artifacts-dir"
        self.release = release

        # *********************************************************************
        #
        # Define directory locations
        #
        # *********************************************************************

        # mount_path is the directory where the volume to store the test data
        # should be mounted.
        self.mount_path = "/mnt/" + "test-data-volume"
        # test_dir is the root directory for all data for a particular test
        # run.
        self.test_dir = self.mount_path + "/" + self.name
        # output_dir is the directory to sync to GCS to contain the output for
        # this job.
        self.output_dir = self.test_dir + "/output"

        self.artifacts_dir = "%s/artifacts/junit_%s" % (self.output_dir, name)

        # source directory where all repos should be checked out
        self.src_root_dir = "%s/src" % self.test_dir
        # The directory containing the kubeflow/kubeflow repo
        self.src_dir = "%s/kubeflow/kubeflow" % self.src_root_dir

        # Root of testing repo.
        self.testing_src_dir = os.path.join(self.src_root_dir,
                                            "kubeflow/testing")

        # Top level directories for python code
        self.kubeflow_py = self.src_dir

        # The directory within the kubeflow_testing submodule containing
        # py scripts to use.
        self.kubeflow_testing_py = "%s/kubeflow/testing/py" % self.src_root_dir

        self.go_path = self.test_dir

    def _build_workflow(self, exit_dag=True):
        """Create a scaffolding CR for the Argo workflow"""
        volumes = [{
            "name": DATA_VOLUME,
            "persistentVolumeClaim": {
                "claimName": NFS_VOLUME_CLAIM
            },
        }]
        if LOCAL_TESTING == "False":
            volumes.append(AWS_CREDENTIALS_VOLUME)
            volumes.append(DOCKER_CONFIG_VOLUME)

        workflow = {
            "apiVersion": "argoproj.io/v1alpha1",
            "kind": "Workflow",
            "metadata": {
                "name": self.name,
                "namespace": self.namespace,
                "labels": argo_build_util.add_dicts([
                    {
                        "workflow": self.name,
                        "workflow_template": self.template_label,
                    },
                    argo_build_util.get_prow_labels()
                ]),
            },
            "spec": {
                "entrypoint": E2E_DAG_NAME,
                # Have argo garbage collect old workflows otherwise we overload
                # the API server.
                "volumes": volumes,
                "templates": [
                    {
                        "dag": {
                            "tasks": []
                        },
                        "name": E2E_DAG_NAME
                    },
                ],
            },  # spec
        }  # workflow

        if exit_dag:
            workflow["spec"]["onExit"] = EXIT_DAG_NAME
            workflow["spec"]["templates"].append({
                "dag": {
                    "tasks": []
                },
                "name": EXIT_DAG_NAME
            })

        return workflow

    def build_task_template(self, mem_override=None, deadline_override=None):
        """Return a template for all the tasks"""
        volume_mounts = [{
            "mountPath": "/mnt/test-data-volume",
            "name": DATA_VOLUME
        }]
        if LOCAL_TESTING == "False":
            volume_mounts.append(AWS_CREDENTIALS_MOUNT)
            volume_mounts.append(DOCKER_CONFIG_MOUNT)

        image = AWS_WORKER_IMAGE
        mem_lim = "4Gi"
        if mem_override:
            mem_lim = mem_override

        active_deadline_sec = 3000
        if deadline_override:
            active_deadline_sec = deadline_override

        task_template = {
            "activeDeadlineSeconds": active_deadline_sec,
            "container": {
                "command": [],
                "env": [],
                "image": image,
                "imagePullPolicy": "Always",
                "name": "",
                "resources": {
                    "limits": {
                        "cpu": "4",
                        "memory": mem_lim
                    },
                    "requests": {
                        "cpu": "1",
                        "memory": "1536Mi"
                    },
                },
                "volumeMounts": volume_mounts,
            },
            "metadata": {
                "labels": {
                    "workflow_template": self.template_label,
                }
            },
            "outputs": {},
        }

        # Define common environment variables to be added to all steps
        common_env = [
            {
                "name": "PYTHONPATH",
                "value": ":".join([self.kubeflow_py, self.kubeflow_testing_py])
            },
            {
                "name": "GOPATH",
                "value": self.go_path
            },
        ]

        task_template["container"]["env"].extend(common_env)

        if self.test_target_name:
            task_template["container"]["env"].append(
                {
                    "name": "TEST_TARGET_NAME",
                    "value": self.test_target_name
                }
            )

        task_template = argo_build_util.add_prow_env(task_template)

        return task_template

    # Common tasks
    def create_install_modules_task(self, task_template, workingDir):
        install = argo_build_util.deep_copy(task_template)

        install["name"] = "npm-modules-install"
        install["container"]["image"] = "node:12.20.1-stretch-slim"

        install["container"]["command"] = ["npm"]
        install["container"]["args"] = ["ci"]

        install["container"]["workingDir"] = workingDir

        return install

    def create_format_typescript_task(self, task_template, workingDir):
        format_task = argo_build_util.deep_copy(task_template)

        format_task["name"] = "check-frontend-formatting"
        format_task["container"]["image"] = "node:12.20.1-stretch-slim"

        format_task["container"]["command"] = ["npm"]
        format_task["container"]["args"] = ["run", "format:check"]

        format_task["container"]["workingDir"] = workingDir

        return format_task

    def create_format_python_task(self, task_template, workingDir):
        format_task = argo_build_util.deep_copy(task_template)

        format_task["name"] = "check-python-formatting"
        format_task["container"]["image"] = "python:3.7-slim-buster"

        format_task["container"]["command"] = ["/bin/sh", "-c"]
        format_task["container"]["args"] = ["pip install flake8 && flake8 ."]

        format_task["container"]["workingDir"] = workingDir

        return format_task

    def create_kaniko_task(self, task_template, dockerfile, context,
                           destination, no_push=False):
        """
        A task for building images inside a cluster container using Kaniko.
        If we are testing the workflow locally then we won't be pushing images
        to any registries. This will make it easier for people to try out and
        extend the code.
        """
        kaniko = argo_build_util.deep_copy(task_template)
        # for short UUID generation
        alphabet = string.ascii_lowercase + string.digits

        # append the tag base-commit[0:7]
        if ":" not in destination:
            if self.release:
                with open(os.path.join("/src/kubeflow/kubeflow",
                                       "releasing/version/VERSION")) as f:
                    version = f.read().strip()
                destination += ":%s" % version
            else:
                sha = os.getenv("PULL_BASE_SHA", "12341234kanikotest")
                base = os.getenv("PULL_BASE_REF", "master")
                destination += ":%s-%s" % (base, sha[0:8])

        # add short UUID to step name to ensure it is unique
        random_suffix = ''.join(random.choices(alphabet, k=8))
        kaniko["name"] = "kaniko-build-push-" + random_suffix
        kaniko["container"]["image"] = "gcr.io/kaniko-project/executor:v1.5.0"
        kaniko["container"]["command"] = ["/kaniko/executor"]
        kaniko["container"]["args"] = ["--dockerfile=%s" % dockerfile,
                                       "--context=%s" % context,
                                       "--destination=%s" % destination]

        # don't push the image to a registry if trying out the produced
        # Argo Workflow yaml locally
        if LOCAL_TESTING == "True" or no_push:
            kaniko["container"]["args"].append("--no-push")

        return kaniko

    def _create_checkout_task(self, task_template):
        """Checkout the kubeflow/testing and kubeflow/kubeflow code"""
        main_repo = argo_build_util.get_repo_from_prow_env()
        if not main_repo:
            logging.info("Prow environment variables for repo not set")
            main_repo = "kubeflow/testing@HEAD"
        logging.info("Main repository: %s", main_repo)
        repos = [main_repo]

        checkout = argo_build_util.deep_copy(task_template)

        checkout["name"] = "checkout"
        checkout["container"]["command"] = [
            "/usr/local/bin/checkout_repos.sh",
            "--repos=" + ",".join(repos),
            "--src_dir=" + self.src_root_dir,
        ]

        return checkout

    def _create_make_dir_task(self, task_template):
        """Create the directory to store the artifacts of each task"""
        # (jlewi)
        # pytest was failing trying to call makedirs. My suspicion is its
        # because the two steps ended up trying to create the directory at the
        # same time and classing. So we create a separate step to do it.
        mkdir_step = argo_build_util.deep_copy(task_template)

        mkdir_step["name"] = self.mkdir_task_name
        mkdir_step["container"]["command"] = ["mkdir", "-p",
                                              self.artifacts_dir]

        return mkdir_step

    def build_init_workflow(self, exit_dag=True):
        """Build the Argo workflow graph"""
        workflow = self._build_workflow(exit_dag)
        task_template = self.build_task_template()

        # checkout the code
        checkout_task = self._create_checkout_task(task_template)
        argo_build_util.add_task_to_dag(workflow, E2E_DAG_NAME, checkout_task,
                                        [])

        # create the artifacts directory
        mkdir_task = self._create_make_dir_task(task_template)
        argo_build_util.add_task_to_dag(workflow, E2E_DAG_NAME, mkdir_task,
                                        [checkout_task["name"]])

        return workflow

    # the following methods should be implemented from the test cases
    def build(self):
        """Build the Argo Worfklow for this test"""
        raise NotImplementedError("Subclasses should implement this!")

    def create_workflow(name=None, namespace=None, bucket=None, **kwargs):
        """Return the final dict with the Argo Workflow to be submitted"""
        raise NotImplementedError("Subclasses should implement this!")
