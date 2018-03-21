{
  // TODO(https://github.com/ksonnet/ksonnet/issues/222): Taking namespace as an argument is a work around for the fact that ksonnet
  // doesn't support automatically piping in the namespace from the environment to prototypes.

  // convert a list of two items into a map representing an environment variable
  listToMap:: function(v)
    {
      name: v[0],
      value: v[1],
    },

  // Function to turn comma separated list of prow environment variables into a dictionary.
  parseEnv:: function(v)
    local pieces = std.split(v, ",");
    if v != "" && std.length(pieces) > 0 then
      std.map(
        function(i) $.listToMap(std.split(i, "=")),
        std.split(v, ",")
      )
    else [],

  parts(namespace, name):: {
    // Workflow to run the e2e test.
    e2e(prow_env, bucket, platform="minikube"):
      // The name for the workspace to run the steps in
      local stepsNamespace = name;
      // mountPath is the directory where the volume to store the test data
      // should be mounted.
      local mountPath = "/mnt/" + "test-data-volume";
      // testDir is the root directory for all data for a particular test run.
      local testDir = mountPath + "/" + name;
      // outputDir is the directory to sync to GCS to contain the output for this job.
      local outputDir = testDir + "/output";
      local artifactsDir = outputDir + "/artifacts";
      // Source directory where all repos should be checked out
      local srcRootDir = testDir + "/src";
      // The directory containing the kubeflow/kubeflow repo
      local srcDir = srcRootDir + "/kubeflow/kubeflow";
      // DO NOT SUBMIT go back to latest.
      // local image = "gcr.io/kubeflow-ci/test-worker:latest";
      local image = "gcr.io/kubeflow-ci/test-worker:v20180320-d727f48-dirty-1ec8f6";
      // The name of the NFS volume claim to use for test files.
      local nfsVolumeClaim = "nfs-external";
      // The name to use for the volume to use to contain test data.
      local dataVolume = "kubeflow-test-volume";
      local kubeflowPy = srcDir;
      // The directory within the kubeflow_testing submodule containing
      // py scripts to use.
      local kubeflowTestingPy = srcRootDir + "/kubeflow/testing/py";
      local tfOperatorRoot = srcRootDir + "/kubeflow/tf-operator";
      local tfOperatorPy = tfOperatorRoot;

      // VM to use for minikube.
      local vmName = 
        if platform == "minikube" then
          if std.length(name) > 61 then
            // We append a letter becaue it must start with a lowercase letter.
            // We use a suffix because the suffix contains the random salt.
            "z" + std.substr(name, std.length(name) - 60, 60)
          else
            name
        else 
          "";

      // If we are using minikube we need to set KUBECONFIG to the location of the kubeconfig file.
      local kubeConfigEnv = if platform == "minikube" then
            [{
              name: "KUBECONFIG",
              value: testDir + "/.kube/config",
            },]
        else
        [];
      local project = "kubeflow-ci";
      // GKE cluster to use
      local cluster = 
        if platform == "gke" then
          "kubeflow-testing"
        else 
          "";
      local zone = "us-east1-d";
      // Build an Argo template to execute a particular command.
      // step_name: Name for the template
      // command: List to pass as the container command.
      local buildTemplate(step_name, command, env_vars=[], sidecars=[]) = {
        name: step_name,
        container: {
          command: command,
          image: image,
          env: [
            {
              // Add the source directories to the python path.
              name: "PYTHONPATH",
              value: kubeflowPy + ":" + kubeflowTestingPy + ":" + tfOperatorPy,
            },
            {
              name: "GOOGLE_APPLICATION_CREDENTIALS",
              value: "/secret/gcp-credentials/key.json",
            },
            {
              name: "GITHUB_TOKEN",
              valueFrom: {
                secretKeyRef: {
                  name: "github-token",
                  key: "github_token",
                },
              },
            },
          ] + prow_env + env_vars + kubeConfigEnv,
          volumeMounts: [
            {
              name: dataVolume,
              mountPath: mountPath,
            },
            {
              name: "github-token",
              mountPath: "/secret/github-token",
            },
            {
              name: "gcp-credentials",
              mountPath: "/secret/gcp-credentials",
            },
          ],
        },
        sidecars: sidecars,
      };  // buildTemplate
      {
        apiVersion: "argoproj.io/v1alpha1",
        kind: "Workflow",
        metadata: {
          name: name,
          namespace: namespace,
        },        
        spec: {
          entrypoint: "e2e",
          volumes: [
            {
              name: "github-token",
              secret: {
                secretName: "github-token",
              },
            },
            {
              name: "gcp-credentials",
              secret: {
                secretName: "kubeflow-testing-credentials",
              },
            },
            {
              name: dataVolume,
              persistentVolumeClaim: {
                claimName: nfsVolumeClaim,
              },
            },
          ],  // volumes
          // onExit specifies the template that should always run when the workflow completes.
          onExit: "exit-handler",
          templates: [
            {
              name: "e2e",
              steps: [
                [{
                  name: "checkout",
                  template: "checkout",
                }],
                [
                  {
                    name: "setup",
                    template: if platform == "gke" then
                      "setup" 
                      else "setup-minikube",
                  },
                  {
                    name: "create-pr-symlink",
                    template: "create-pr-symlink",
                  },
                ],
                [
                  {
                    name: "tfjob-test",
                    template: "tfjob-test",
                  },
                  {
                    name: "jsonnet-test",
                    template: "jsonnet-test",
                  },
                ],
              ],
            },
            {
              name: "exit-handler",
              steps: [
                [
                  {
                    name: "teardown",
                    template:
                      if platform == "gke" then
                        "teardown" 
                      else "teardown-minikube",
                  },
                ],
                [{
                  name: "copy-artifacts",
                  template: "copy-artifacts",
                }],
              ],
            },
            buildTemplate(
              "checkout",
              ["/usr/local/bin/checkout.sh", srcRootDir],
              [{
                name: "EXTRA_REPOS",
                // DO NOT SUBMIT GO BACK TO USING HEAD
                // value: "kubeflow/tf-operator@HEAD;kubeflow/testing@HEAD",
                value: "kubeflow/tf-operator@HEAD:485;kubeflow/testing@HEAD:76"
              }],
              [], // no sidecars
            ),
            // Setup and teardown using GKE.
            buildTemplate("setup", [
              "python",
              "-m",
              "testing.test_deploy",              
              "--zone=" + zone,
              "--project=" + project,
              "--namespace=" + stepsNamespace,
              "--test_dir=" + testDir,
              "--artifacts_dir=" + artifactsDir,
              "setup",
              "--cluster=" + cluster,
            ]),  // setup
            buildTemplate("teardown", [
              "python",
              "-m",
              "testing.test_deploy",
              "--project=" + project,              
              "--namespace=" + stepsNamespace,
              "--zone=" + zone,
              "--test_dir=" + testDir,
              "--artifacts_dir=" + artifactsDir,
              "teardown",
              "--cluster=" + cluster,
            ]),  // teardown
            // Setup and teardown using minikube
            buildTemplate("setup-minikube", [
              "python",
              "-m",
              "testing.test_deploy",              
              "--zone=" + zone,
              "--project=" + project,
              "--namespace=" + stepsNamespace,
              "--test_dir=" + testDir,
              "--artifacts_dir=" + artifactsDir,
              "deploy_minikube",
              "--vm_name=" + vmName,              
            ]),  // setup
            buildTemplate("teardown-minikube", [
              "python",
              "-m",
              "testing.test_deploy",
              "--project=" + project,
              "--namespace=" + stepsNamespace,
              "--zone=" + zone,
              "--test_dir=" + testDir,
              "--artifacts_dir=" + artifactsDir,
              "teardown_minikube",
              "--vm_name=" + vmName,
            ]),  // teardown
            buildTemplate("create-pr-symlink", [
              "python",
              "-m",
              "kubeflow.testing.prow_artifacts",
              "--artifacts_dir=" + outputDir,
              "create_pr_symlink",
              "--bucket=" + bucket,
            ]),  // create-pr-symlink
            buildTemplate("copy-artifacts", [
              "python",
              "-m",
              "kubeflow.testing.prow_artifacts",
              "--artifacts_dir=" + outputDir,
              "copy_artifacts",
              "--bucket=" + bucket,
            ]),  // copy-artifacts
            buildTemplate("jsonnet-test", [
              "python",
              "-m",
              "testing.test_jsonnet",
              "--artifacts_dir=" + artifactsDir,
              "--test_files_dir=" + srcDir + "/kubeflow/core/tests",
            ]),  // jsonnet-test
            buildTemplate("tfjob-test", [
              "python",
              "-m",
              "py.test_runner",
              "test",
              "--cluster=" + cluster,
              "--zone=" + zone,
              "--project=" + project,
              "--app_dir=" + tfOperatorRoot + "/test/workflows",
              "--component=simple_tfjob",
              "--params=name=simple-tfjob,namespace=" + stepsNamespace,
              "--junit_path=" + artifactsDir + "/junit_e2e.xml",
            ]),  // run tests
          ],  // templates
        },
      },  // e2e
  },  // parts
}
