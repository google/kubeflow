""""Define the E2E workflows used to run unittests."""

import datetime
from kubeflow.testing import argo_build_util
import logging
import os
import uuid

# The name of the NFS volume claim to use for test files.
NFS_VOLUME_CLAIM = "nfs-external"
# The name to use for the volume to use to contain test data
DATA_VOLUME = "kubeflow-test-volume"

# This is the main dag with the entrypoint
E2E_DAG_NAME = "e2e"
EXIT_DAG_NAME = "exit-handler"

# This is a sub dag containing the suite of tests to run against
# Kubeflow deployment
TESTS_DAG_NAME = "gke-tests"

TEMPLATE_LABEL = "kfctl_e2e"

MAIN_REPO = "kubeflow/kubeflow"
EXTRA_REPOS = ["kubeflow/testing@HEAD", "kubeflow/tf-operator@HEAD"]

class Builder:
  def __init__(self, name=None, namespace=None,
               config_path=("https://raw.githubusercontent.com/kubeflow"
                            "/manifests/master/kfdef/kfctl_gcp_iap.yaml"),
               bucket="kubeflow-ci_temp",
               test_endpoint=False,
               use_basic_auth=False):
    self.name = name
    self.namespace = namespace
    self.bucket = bucket
    self.config_path = config_path
    #****************************************************************************
    # Define directory locations
    #****************************************************************************
    # mount_path is the directory where the volume to store the test data
    # should be mounted.
    self.mount_path = "/mnt/" + "test-data-volume"
    # test_dir is the root directory for all data for a particular test run.
    self.test_dir = self.mount_path + "/" + self.name
    # output_dir is the directory to sync to GCS to contain the output for this
    # job.
    self.output_dir = self.test_dir + "/output"

    # We prefix the artifacts directory with junit because
    # that's what spyglass/prow requires. This ensures multiple
    # instances of a workflow triggered by the same prow job
    # don't end up clobbering each other
    self.artifacts_dir = self.output_dir + "/artifacts/junit_{0}".format(name)

    # source directory where all repos should be checked out
    self.src_root_dir = self.test_dir + "/src"
    # The directory containing the kubeflow/kubeflow repo
    self.src_dir = self.src_root_dir + "/kubeflow/kubeflow"

    # Top level directories for python code
    self.kubeflow_py = self.src_dir

    # The directory within the kubeflow_testing submodule containing
    # py scripts to use.
    self.kubeflow_testing_py = self.src_root_dir + "/kubeflow/testing/py"

    self.tf_operator_root = os.path.join(self.src_root_dir,
                                         "kubeflow/tf-operator")
    self.tf_operator_py = os.path.join(self.tf_operator_root, "py")

    self.go_path = self.test_dir

    # Name for the Kubeflow app.
    # This needs to be unique for each test run because it is
    # used to name GCP resources
    # TODO(jlewi): Might be good to include pull number or build id in the name
    # Not sure if being non-deterministic is a good idea.
    # A better approach might be to hash the workflow name to generate a unique
    # name dependent on the workflow name. We know there will be one workflow
    # per cluster.
    now = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    self.uuid = "{0}-{1}".format(now, uuid.uuid4().hex[0:3])

    # Config name is the name of the config file. This is used to give junit
    # files unique names.
    self.config_name = os.path.splitext(os.path.basename(config_path))[0]

    # app_name is the name of the Kubeflow deployment.
    # This needs to be unique per run since we name GCP resources with it.
    self.app_name = "kfctl-" +  self.uuid;
    self.app_dir = os.path.join(self.test_dir, "apps", self.app_name)
    self.use_basic_auth = use_basic_auth

    # The name space we create KF artifacts in; e.g. TFJob and notebooks.
    # TODO(jlewi): These should no longer be running the system namespace but
    # should move into the namespace associated with the default profile.
    self.steps_namespace = "kubeflow"
    self.test_endpoint = test_endpoint

    self.kfctl_path = os.path.join(self.src_dir, "bootstrap/bin/kfctl")

  def _build_workflow(self):
    """Create the scaffolding for the Argo workflow"""
    workflow = {
      "apiVersion": "argoproj.io/v1alpha1",
      "kind": "Workflow",
      "metadata": {
        "name": self.name,
        "namespace": self.namespace,
        "labels": argo_build_util.add_dicts([{
            "workflow": self.name,
            "workflow_template": TEMPLATE_LABEL,
          }, argo_build_util.get_prow_labels()]),
      },
      "spec": {
        "entrypoint": E2E_DAG_NAME,
        # Have argo garbage collect old workflows otherwise we overload the API
        # server.
        "ttlSecondsAfterFinished": 7 * 24 * 60 * 60,
        "volumes": [
          {
            "name": "gcp-credentials",
            "secret": {
              "secretName": "kubeflow-testing-credentials",
            },
          },
          {
            "name": DATA_VOLUME,
            "persistentVolumeClaim": {
              "claimName": NFS_VOLUME_CLAIM,
            },
          },
        ],
        "onExit": EXIT_DAG_NAME,
        "templates": [
          {
           "dag": {
                "tasks": [],
                },
           "name": E2E_DAG_NAME,
          },
          {
           "dag":{
                 "tasks": [],
                },
           "name": TESTS_DAG_NAME,

          },
          {
            "dag": {
              "tasks": [],
              },
              "name": EXIT_DAG_NAME,
            }
        ],
      },  # spec
    } # workflow

    return workflow

  def _build_task_template(self):
    """Return a template for all the tasks"""

    task_template = {'activeDeadlineSeconds': 3000,
     'container': {'command': [],
      'env': [
        {"name": "GOOGLE_APPLICATION_CREDENTIALS",
         "value": "/secret/gcp-credentials/key.json"}
       ],
      'image': 'gcr.io/kubeflow-ci/test-worker:latest',
      'imagePullPolicy': 'Always',
      'name': '',
      'resources': {'limits': {'cpu': '4', 'memory': '4Gi'},
       'requests': {'cpu': '1', 'memory': '1536Mi'}},
      'volumeMounts': [{'mountPath': '/mnt/test-data-volume',
        'name': 'kubeflow-test-volume'},
       {'mountPath': '/secret/gcp-credentials', 'name': 'gcp-credentials'}]},
     'metadata': {'labels': {
       'workflow_template': TEMPLATE_LABEL}},
     'outputs': {}}

    # Define common environment variables to be added to all steps
    common_env = [
      {'name': 'PYTHONPATH',
       'value': ":".join([self.kubeflow_py, self.kubeflow_testing_py,
                          self.tf_operator_py])},
      {'name': 'GOPATH',
        'value': self.go_path},
      {'name': 'KUBECONFIG',
       'value': os.path.join(self.test_dir, 'kfctl_test/.kube/kubeconfig')},
    ]

    task_template["container"]["env"].extend(common_env)

    task_template = argo_build_util.add_prow_env(task_template)

    return task_template

  def _build_step(self, name, workflow, dag_name, task_template,
                  command, dependences):
    """Syntactic sugar to add a step to the workflow"""

    step = argo_build_util.deep_copy(task_template)

    step["name"] = name
    step["container"]["command"] = command

    argo_build_util.add_task_to_dag(workflow, dag_name, step, dependences)

    return step


  def _build_tests_dag(self):
    """Build the dag for the set of tests to run against a KF deployment."""

    task_template = self._build_task_template()

    #***************************************************************************
    # Test TFJob
    step_name = "tfjob-test"
    command = [
      "python",
      "-m",
      "kubeflow.tf_operator.simple_tfjob_tests",
      "--app_dir=" + os.path.join(self.tf_operator_root, "test/workflows"),
      "--tfjob_version=v1",
      # Name is used for the test case name so it should be unique across
      # all E2E tests.
      "--params=name=smoke-tfjob-" + self.config_name + ",namespace=" +
      self.steps_namespace,
      "--artifacts_path=" + self.artifacts_dir,
      # Skip GPU tests
      "--skip_tests=test_simple_tfjob_gpu",
    ]

    dependences = []
    tfjob_test = self._build_step(step_name, self.workflow, TESTS_DAG_NAME, task_template,
                                  command, dependences)

    #*************************************************************************
    # Test TFJob v1beta2
    step_name = "tfjbo-v1beta2"
    command = [
                "python",
                "-m",
                "kubeflow.tf_operator.simple_tfjob_tests",
                "--app_dir=" + self.tf_operator_root + "/test/workflows",
                "--tfjob_version=v1beta2",
                # Name is used for the test case name so it should be unique across
                # all E2E tests.
                "--params=name=smoke-tfjob-" + self.config_name
                + ",namespace=" + self.steps_namespace,
                "--artifacts_path=" +self.artifacts_dir,
                # Skip GPU tests
                "--skip_tests=test_simple_tfjob_gpu",
              ]

    dependences = []
    tfjob_v1beta2 = self._build_step(step_name, self.workflow, TESTS_DAG_NAME, task_template,
                                     command, dependences)

    #*************************************************************************
    # Test katib deploy
    step_name = "test-katib-deploy"
    command = ["python",
               "-m",
               "testing.test_deploy",
               "--project=kubeflow-ci",
               # TODO(jlewi): Do we need a GITHUB_TOKEN? I'm guessing that
               # was for ksonnet.
               # "--github_token=$(GITHUB_TOKEN)",
               "--namespace=" + self.steps_namespace,
               "--test_dir=" + self.test_dir,
               "--artifacts_dir=" + self.artifacts_dir,
               "--deploy_name=test-katib",
               "--workflow_name=" + self.name,
               "test_katib",
              ]

    dependences = []
    deploy_katib = self._build_step(step_name, self.workflow, TESTS_DAG_NAME, task_template,
                                    command, dependences)



    #*************************************************************************
    # Test pytorch job
    step_name = "pytorch-job-deploy"
    command = [ "python",
                "-m",
                "testing.test_deploy",
                "--project=kubeflow-ci",
                # TODO(jlewi): Do we still need a GITHUB_TOKEN?
                # "--github_token=$(GITHUB_TOKEN)",
                "--namespace=" + self.steps_namespace,
                "--test_dir=" + self.test_dir,
                "--artifacts_dir=" + self.artifacts_dir,
                "--deploy_name=pytorch-job",
                "--workflow_name=" + self.name,
                "deploy_pytorchjob",
                # TODO(jlewi): Does the image need to be updated?
                "--params=image=pytorch/pytorch:v0.2,num_workers=1"
             ]


    dependences = []
    pytorch_test = self._build_step(step_name, self.workflow, TESTS_DAG_NAME, task_template,
                                    command, dependences)

    #***************************************************************************
    # Test tfjob simple_tfjob_tests
    step_name = "tfjob-simple"
    command =  [
                "python",
                "-m",
                "testing.tf_job_simple_test",
                "--src_dir=" + self.src_dir,
                "--tf_job_version=v1",
                "--test_dir=" + self.test_dir,
                "--artifacts_dir=" + self.artifacts_dir,
              ]


    dependences = []
    tfjob_simple_test = self._build_step(step_name, self.workflow, TESTS_DAG_NAME, task_template,
                                         command, dependences)

    #***************************************************************************
    # Notebook test

    step_name = "notebook-test"
    command =  ["pytest",
                # I think -s mean stdout/stderr will print out to aid in debugging.
                # Failures still appear to be captured and stored in the junit file.
                "-s",
                "jupyter_test.py",
                "--namespace=" + self.steps_namespace,
                # Test timeout in seconds.
                "--timeout=500",
                "--junitxml=" + self.artifacts_dir + "/junit_jupyter-test.xml",
             ]

    dependences = []
    notebook_test = self._build_step(step_name, self.workflow, TESTS_DAG_NAME, task_template,
                                     command, dependences)


  def _build_exit_dag(self):
    """Build the exit handler dag"""
    task_template = self._build_task_template()
    task_template["container"]["workingDir"] = self.kfctl_path

    #***********************************************************************
    # Delete Kubeflow
    step_name = "kfctl-delete"
    command = [
        "pytest",
        "kfctl_delete_test.py",
        "-s",
        "--log-cli-level=info",
        "--timeout=1000",
        "--junitxml=" + self.artifacts_dir + "/junit_kfctl-go-delete-test.xml",
        "--app_path=" + self.app_dir,
        "--kfctl_path=" + self.kfctl_path,
      ]

    kfctl_delete = self._build_step(step_name, self.workflow, EXIT_DAG_NAME,
                                    task_template,
                                    command, [])

    step_name = "copy-artifacts"
    command = ["python",
               "-m",
               "kubeflow.testing.prow_artifacts",
               "--artifacts_dir=" +
               self.output_dir,
               "copy_artifacts",
               "--bucket=" + self.bucket,
               "--suffix=fakesuffix",]

    dependences = [kfctl_delete["name"]]

    copy_artifacts = self._build_step(step_name, self.workflow, EXIT_DAG_NAME, task_template,
                                      command, dependences)


    step_name = "test-dir-delete"
    command = ["python",
               "-m",
               "testing.run_with_retry",
               "--retries=5",
               "--",
               "rm",
               "-rf",
               self.test_dir,]
    dependences = [copy_artifacts["name"]]
    copy_artifacts = self._build_step(step_name, self.workflow, EXIT_DAG_NAME, task_template,
                                      command, dependences)

  def build(self):
    self.workflow = self._build_workflow()
    task_template = self._build_task_template()

    #**************************************************************************
    # Checkout

    # create the checkout step
    main_repo = argo_build_util.get_repo_from_prow_env()
    if not main_repo:
      logging.info("Prow environment variables for repo not set")
      main_repo = MAIN_REPO + "@HEAD"
    logging.info("Main repository: %s", main_repo)
    repos = [main_repo]

    repos.extend(EXTRA_REPOS)

    checkout = argo_build_util.deep_copy(task_template)

    checkout["name"] = "checkout"
    checkout["container"]["command"] = ["/usr/local/bin/checkout_repos.sh",
                                        "--repos=" + ",".join(repos),
                                        "--src_dir=" + self.src_root_dir]

    argo_build_util.add_task_to_dag(self.workflow, E2E_DAG_NAME, checkout, [])

    # Change the workfing directory for all subsequent steps
    task_template["container"]["workingDir"] = os.path.join(self.src_dir,
                                                            "testing/kfctl")

    #**************************************************************************
    # Run build_kfctl and deploy kubeflow

    step_name = "kfctl-build-deploy"
    command = [
        "pytest",
        "kfctl_go_test.py",
        # I think -s mean stdout/stderr will print out to aid in debugging.
        # Failures still appear to be captured and stored in the junit file.
        "-s",
        "--config_path=" + self.config_path,
        # Increase the log level so that info level log statements show up.
        # TODO(https://github.com/kubeflow/testing/issues/372): If we
        # set a unique artifacts dir for each workflow with the proper
        # prefix that should work.
        "--log-cli-level=info",
        "--junitxml=" + self.artifacts_dir + "/junit_kfctl-build-test"
        + self.config_name + ".xml",
        # TODO(jlewi) Test suite name needs to be unique based on parameters.
        #
        "-o", "junit_suite_name=test_kfctl_go_deploy_" + self.config_name,
        "--app_path=" + self.app_dir,
    ]

    dependences = [checkout["name"]]
    build_kfctl = self._build_step(step_name, self.workflow, E2E_DAG_NAME, task_template,
                                   command, dependences)

    #**************************************************************************
    # Wait for Kubeflow to be ready
    step_name = "kubeflow-is-ready"
    command = [
           "pytest",
           "kf_is_ready_test.py",
           # I think -s mean stdout/stderr will print out to aid in debugging.
           # Failures still appear to be captured and stored in the junit file.
           "-s",
           # TODO(jlewi): We should update kf_is_ready_test to take the config
           # path and then based on the KfDef spec kf_is_ready_test should
           # figure out what to do.
           "--use_basic_auth={0}".format(self.use_basic_auth),
           # TODO(jlewi): We should be using ISTIO always so can we stop
           # setting this
           "--use_istio=true",
           # Increase the log level so that info level log statements show up.
           "--log-cli-level=info",
           "--junitxml=" + os.path.join(self.artifacts_dir,
                                        "junit_kfctl-is-ready-test-" +
                                        self.config_name + ".xml"),
           # Test suite name needs to be unique based on parameters
           "-o", "junit_suite_name=test_kf_is_ready_" + self.config_name,
           "--app_path=" + self.app_dir,
         ]

    dependences = [build_kfctl["name"]]
    kf_is_ready = self._build_step(step_name, self.workflow, E2E_DAG_NAME, task_template,
                                   command, dependences)


    #**************************************************************************
    # Wait for endpoint to be ready
    if self.test_endpoint:
      step_name = "endpoint-is-ready"
      command = ["pytest",
                 "endpoint_ready_test.py",
                 # I think -s mean stdout/stderr will print out to aid in debugging.
                 # Failures still appear to be captured and stored in the junit file.
                 "-s",
                 # Increase the log level so that info level log statements show up.
                 "--log-cli-level=info",
                 "--junitxml=" + self.artifacts_dir + "/junit_endpoint-is-ready-test-" + self.config_name + ".xml",
                 # Test suite name needs to be unique based on parameters
                 "-o", "junit_suite_name=test_endpoint_is_ready_" + self.config_name,
                 "--app_path=" + self.app_dir,
                 "--app_name=" + self.app_name,
              ],

      dependences = []
      endpoint_ready = self._build_step(step_name, workflow, E2E_DAG_NAME, task_template,
                                        command, dependences)

    self._build_tests_dag()

    # Add a task to run the dag
    dependencies = [kf_is_ready["name"]]
    argo_build_util.add_task_only_to_dag(self.workflow, E2E_DAG_NAME, TESTS_DAG_NAME,
                                         TESTS_DAG_NAME,
                                         dependencies)

    #***************************************************************************
    # create_pr_symlink
    #***************************************************************************
    # TODO(jlewi): run_e2e_workflow.py should probably create the PR symlink
    step_name = "create-pr-symlink"
    command = ["python",
               "-m",
               "kubeflow.testing.prow_artifacts",
               "--artifacts_dir=" + self.output_dir,
               "create_pr_symlink",
               "--bucket=" + self.bucket,
               ]

    dependences = [checkout["name"]]
    symlink = self._build_step(step_name, self.workflow, E2E_DAG_NAME, task_template,
                               command, dependences)

    self._build_exit_dag()


    # Set the labels on all templates
    self.workflow = argo_build_util.set_task_template_labels(self.workflow)

    return self.workflow

def create_workflow(name=None, namespace=None, use_basic_auth=False,
                    bucket="kubeflow-ci_temp"): # pylint: disable=too-many-statements
  """Create workflow returns an Argo workflow to test kfctl upgrades.

  Args:
    name: Name to give to the workflow. This can also be used to name things
     associated with the workflow.
  """

  builder = Builder(name=name, namespace=namespace, bucket=bucket)

  return builder.build()