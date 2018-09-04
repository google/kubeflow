{
  local k = import "k.libsonnet",
  local util = import "kubeflow/core/util.libsonnet",
  new(_env, _params):: self {
    local params = _env + _params {
      namespace: if std.objectHas(_params, "namespace") && _params.namespace != "null" then
        _params.namespace else _env.namespace,
      reportUsageBool: util.toBool(_params.reportUsage),
    },

    // Spartakus needs to be able to get information about the cluster to create a report.
    local clusterRole = {
      apiVersion: "rbac.authorization.k8s.io/v1beta1",
      kind: "ClusterRole",
      metadata: {
        labels: {
          app: "spartakus",
        },
        name: "spartakus",
      },
      rules: [
        {
          apiGroups: [
            "",
          ],
          resources: [
            "nodes",
          ],
          verbs: [
            "get",
            "list",
          ],
        },
      ],
    },  // role

    local clusterRoleBinding = {
      apiVersion: "rbac.authorization.k8s.io/v1beta1",
      kind: "ClusterRoleBinding",
      metadata: {
        labels: {
          app: "spartakus",
        },
        name: "spartakus",
      },
      roleRef: {
        apiGroup: "rbac.authorization.k8s.io",
        kind: "ClusterRole",
        name: "spartakus",
      },
      subjects: [
        {
          kind: "ServiceAccount",
          name: "spartakus",
          namespace: params.namespace,
        },
      ],
    },  // operator-role binding

    local serviceAccount = {
      apiVersion: "v1",
      kind: "ServiceAccount",
      metadata: {
        labels: {
          app: "spartakus",
        },
        name: "spartakus",
        namespace: params.namespace,
      },
    },

    local volunteer = {
      apiVersion: "extensions/v1beta1",
      kind: "Deployment",
      metadata: {
        name: "spartakus-volunteer",
        namespace: params.namespace,
        labels: {
          app: "spartakus",
        },
      },
      spec: {
        replicas: 1,
        template: {
          metadata: {
            labels: {
              app: "spartakus-volunteer",
            },
          },
          spec: {
            containers: [
              {
                image: "gcr.io/google_containers/spartakus-amd64:v1.0.0",
                name: "volunteer",
                args: [
                  "volunteer",
                  "--cluster-id=" + params.usageId,
                  "--database=https://stats-collector.kubeflow.org",
                ],
              },
            ],
            serviceAccountName: "spartakus",
          },  // spec
        },
      },
    },  // deployment

    local allResources = if params.reportUsageBool then ([
                                                           clusterRole,
                                                           clusterRoleBinding,
                                                           serviceAccount,
                                                           volunteer,
                                                         ]) else [],

    list:: util.list(
      allResources,
    ),
  },
}
