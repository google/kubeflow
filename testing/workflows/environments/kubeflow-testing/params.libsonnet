local params = import '../../components/params.libsonnet';

params {
  components+: {
    kfctl_Test+: {
      namespace: 'kubeflow-test-infra',
      name: 'jlewi-kfctl-test-1308-0539',
      prow_env: 'JOB_NAME=kfctl-test,JOB_TYPE=presubmit,REPO_NAME=kubeflow,REPO_OWNER=kubeflow,BUILD_NUMBER=0539,PULL_NUMBER=1308',
    },
    kfctl_test+: {
      namespace: 'kubeflow-test-infra',
      name: 'jlewi-kfctl-test-1308-0806-134419',
      prow_env: 'JOB_NAME=kfctl-test,JOB_TYPE=presubmit,REPO_NAME=kubeflow,REPO_OWNER=kubeflow,BUILD_NUMBER=0806-134419,PULL_NUMBER=1308',
    },
  },
}