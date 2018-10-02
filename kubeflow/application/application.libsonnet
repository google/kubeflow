{
  local k8s = import "k8s.libsonnet",
  local util = import "kubeflow/core/util.libsonnet",
  local crd = k8s.apiextensions.v1beta1.customResourceDefinition,

  new(_env, _params):: {
    local params = _env + _params {
      namespace:
        if std.objectHas(_params, "namespace") &&
           _params.namespace != "null" then
          _params.namespace else _env.namespace,
      labels: {
        app: _params.name,
      },
    },

    local compositeController = {
      apiVersion: 'apiextensions.k8s.io/v1beta1',
      kind: 'CustomResourceDefinition',
      metadata: {
        name: 'compositecontrollers.metacontroller.k8s.io',
      },
      spec: {
        group: 'metacontroller.k8s.io',
        version: 'v1alpha1',
        scope: 'Cluster',
        names: {
          plural: 'compositecontrollers',
          singular: 'compositecontroller',
          kind: 'CompositeController',
          shortNames: [
            'cc',
            'cctl',
          ],
        },
      },
    },
    compositeController:: compositeController,

    local decoratorController = {
      apiVersion: 'apiextensions.k8s.io/v1beta1',
      kind: 'CustomResourceDefinition',
      metadata: {
        name: 'decoratorcontrollers.metacontroller.k8s.io',
      },
      spec: {
        group: 'metacontroller.k8s.io',
        version: 'v1alpha1',
        scope: 'Cluster',
        names: {
          plural: 'decoratorcontrollers',
          singular: 'decoratorcontroller',
          kind: 'DecoratorController',
          shortNames: [
            'dec',
            'decorators',
          ],
        },
      },
    },
    decoratorController:: decoratorController,

    local controllerRevisions = {
      apiVersion: 'apiextensions.k8s.io/v1beta1',
      kind: 'CustomResourceDefinition',
      metadata: {
        name: 'controllerrevisions.metacontroller.k8s.io',
      },
      spec: {
        group: 'metacontroller.k8s.io',
        version: 'v1alpha1',
        scope: 'Cluster',
        names: {
          plural: 'controllerrevisions',
          singular: 'controllerrevision',
          kind: 'ControllerRevision',
        },
      },
    },
    controllerRevisions:: controllerRevisions,

    local metaControllerServiceAccount = {
      apiVersion: 'v1',
      kind: 'ServiceAccount',
      metadata: {
        name: 'meta-controller-service',
        namespace: params.namespace,
      },
    },
    metaControllerServiceAccount:: metaControllerServiceAccount,

    local metaControllerClusterRoleBinding = {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'ClusterRoleBinding',
      metadata: {
        name: 'meta-controller-cluster-role-binding',
      },
      roleRef: {
        kind: 'ClusterRole',
        name: 'cluster-admin',
        apiGroup: 'rbac.authorization.k8s.io',
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: 'meta-controller-service',
          namespace: params.namespace,
        },
      ],
    },
    metaControllerClusterRoleBinding:: metaControllerClusterRoleBinding,

    local metaControllerStatefulSet = {
      apiVersion: 'apps/v1beta2',
      kind: 'StatefulSet',
      metadata: {
        name: 'metacontroller',
        namespace: params.namespace,
        labels: {
          app: 'metacontroller',
        },
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: 'metacontroller',
          },
        },
        serviceName: '',
        template: {
          metadata: {
            labels: {
              app: 'metacontroller',
            },
          },
          spec: {
            serviceAccountName: 'meta-controller-service',
            containers: [
              {
                name: 'metacontroller',
                command: [
                  '/usr/bin/metacontroller',
                  '--logtostderr',
                  '-v=4',
                  '--discovery-interval=20s',
                ],
                image: 'metacontroller/metacontroller:0.2.0',
                ports: [
                  {
                    containerPort: 2345,
                  },
                ],
                imagePullPolicy: 'Always',
                resources: {
                  limits: {
                    cpu: '4',
                    memory: '4Gi',
                  },
                  requests: {
                    cpu: '500m',
                    memory: '1Gi',
                  },
                },
                securityContext: {
                  privileged: true,
                  allowPrivilegeEscalation: true,
                },
              },
            ],
          },
        },
      },
    },
    metaControllerStatefulSet:: metaControllerStatefulSet,

    local openApiV3Schema = {
      properties: {
        apiVersion: {
          type: "string",
        },
        kind: {
          type: "string",
        },
        metadata: {
          type: "object",
        },
        spec: {
          type: "object",
          properties: {
            selector: {
              type: "object",
            },
            assemblyPhase: {
              type: "string",
            },
            componentKinds: {
              items: {
                type: "object",
              },
              type: "array",
            },
            description: {
              type: "string",
            },
            info: {
              items: {
                properties: {
                  name: {
                    type: "string",
                  },
                  type: {
                    type: "string",
                  },
                  value: {
                    type: "string",
                  },
                  valueFrom: {
                    properties: {
                      configMapKeyRef: {
                        properties: {
                          key: {
                            type: "string",
                          },
                        },
                        type: "object",
                      },
                      ingressRef: {
                        properties: {
                          host: {
                            type: "string",
                          },
                          path: {
                            type: "string",
                          },
                        },
                        type: "object",
                      },
                      secretKeyRef: {
                        properties: {
                          key: {
                            type: "string",
                          },
                        },
                        type: "object",
                      },
                      serviceRef: {
                        properties: {
                          path: {
                            type: "string",
                          },
                          port: {
                            type: "int32",
                          },
                        },
                        type: "object",
                      },
                      type: {
                        type: "string",
                      },
                    },
                    type: "object",
                  },
                },
                type: "object",
              },
              type: "array",
            },
            descriptor: {
              type: "object",
              properties: {
                keywords: {
                  items: {
                    type: "string",
                  },
                  type: "array",
                },
                links: {
                  items: {
                    properties: {
                      description: {
                        type: "string",
                      },
                      url: {
                        type: "string",
                      },
                    },
                    type: "object",
                  },
                  type: "array",
                },
                maintainers: {
                  items: {
                    properties: {
                      email: {
                        type: "string",
                      },
                      name: {
                        type: "string",
                      },
                      url: {
                        type: "string",
                      },
                    },
                    type: "object",
                  },
                  type: "array",
                },
                notes: {
                  type: "string",
                },
                owners: {
                  items: {
                    type: "string",
                  },
                  type: "array",
                },
                type: {
                  type: "string",
                },
                version: {
                  type: "string",
                },
              },
            },
          },
        },
        status: {
          properties: {
            observedGeneration: {
              type: "string",
              format: "int64",
            },
          },
          type: "object",
        },
      },
    },

    local applicationCrd =
      crd.new() + crd.mixin.metadata.
        withName("applications.app.k8s.io").
        withNamespace(params.namespace).
        withLabelsMixin({
        api: "default",
        "kubebuilder.k8s.io": "0.1.10",
      }) +
      crd.mixin.spec.
        withGroup("app.k8s.io").
        withVersion("v1beta1").
        withScope("Namespaced") +
      crd.mixin.spec.names.
        withKind("Application").
        withPlural("applications").
        withSingular("application") +
      crd.mixin.spec.validation.
        withOpenApiV3Schema(openApiV3Schema),
    applicationCrd:: applicationCrd,

    local generateComponentTuples(resource) = {
      local name =
        if std.objectHas(resource.metadata, "name") then
          resource.metadata.name
        else null,
      local gname = std.split(resource.apiVersion, "/")[0],
      local groupKindAndResource = {
        tuple: [
          { name: name },
          if gname != "v1" then {
            group: gname,
            kind: resource.kind,
          } else {
            kind: resource.kind,
          },
          resource,
        ],
      },
      return:: groupKindAndResource,
    }.return,

    local perComponent(name) = {
      local list = std.extVar("__ksonnet/components")[name],
      return:: std.map(generateComponentTuples, list.items),
    }.return,

    local byResource(wrapper) = {
      local tuple = wrapper.tuple,
      local resource = tuple[2],
      return:: resource {
        metadata+: {
          annotations+: {
            "kubernetes.io/application": params.name,
          },
          labels+: {
            app: params.name,
            component: resource.metadata.name,
          },
        },
      },
    }.return,

    local byComponent(wrapper) = {
      local tuple = wrapper.tuple,
      local name = tuple[0].name,
      local groupKind = tuple[1],
      local component = {
        [name]: groupKind,
      },
      return:: component,
    }.return,

    local getComponents = {
      local isEmpty =
        if std.length(params.components) == 0 then
          true
        else
          false,
      local exclude(name) = {
        return::
          if name == params.name then
            false
          else
            true,
      }.return,
      return::
        if isEmpty then
          std.filter(exclude, std.objectFields(std.extVar("__ksonnet/components")))
        else
          params.components,
    }.return,

    local tuples = std.flattenArrays(std.map(perComponent, getComponents)),

    local application = {
      apiVersion: "app.k8s.io/v1beta1",
      kind: "Application",
      metadata: {
        name: params.name,
        labels: {
          app: params.name,
        },
        namespace: params.namespace,
      },
      spec: {
        selector: {
          matchLabels: {
            "app.kubernetes.io/name": params.type,
          },
        },
        componentKinds+: std.map(byComponent, tuples),
        descriptor: {
          type: params.type,
          version: params.version,
          description: "",
          icons: [],
          maintainers: [],
          owners: [],
          keywords: [],
          links: [],
          notes: "",
        },
        assemblyPhase: "Pending",
        info: [],
      },
    },
    application:: application,

    local components = std.map(byResource, tuples),

    local syncApplication =
      "function(request) {\n" +
      "  local desired = " + std.manifestJsonEx(components, "  ") + ",\n" +
      "children: desired,\n" +
      "status: {\n" +
      "  observedGeneration: '1',\n" +
      "  installed: [],\n" +
      "  ready: true,\n" +
      "},\n" +
      "}\n",

    local applicationConfigmap = {
      apiVersion: "v1",
      kind: "ConfigMap",
      metadata: {
        name: "application-operator-hooks",
        namespace: params.namespace,
      },
      data: {
        "sync-application.jsonnet": syncApplication,
      },
    },
    applicationConfigmap:: applicationConfigmap,

    local applicationDeployment = {
      apiVersion: "apps/v1beta1",
      kind: "Deployment",
      metadata: {
        name: "application-operator",
        namespace: params.namespace,
      },
      spec: {
        selector: {
          matchLabels: {
            app: "application-operator",
          },
        },
        template: {
          metadata: {
            labels: {
              app: "application-operator",
            },
          },
          spec: {
            containers: [
              {
                name: "hooks",
                image: "metacontroller/jsonnetd:0.1",
                imagePullPolicy: "Always",
                workingDir: "/opt/isolation/operator/hooks",
                volumeMounts: [
                  {
                    name: "hooks",
                    mountPath: "/opt/isolation/operator/hooks",
                  },
                ],
              },
            ],
            volumes: [
              {
                name: "hooks",
                configMap: {
                  name: "application-operator-hooks",
                },
              },
            ],
          },
        },
      },
    },
    applicationDeployment:: applicationDeployment,

    local applicationService = {
      apiVersion: "v1",
      kind: "Service",
      metadata: {
        name: "application-operator",
        namespace: params.namespace,
      },
      spec: {
        selector: {
          app: "application-operator",
        },
        ports: [
          {
            port: 80,
            targetPort: 8080,
          },
        ],
      },
    },
    applicationService:: applicationService,

    local forChildResources(wrapper) = {
      local tuple = wrapper.tuple,
      local resource = tuple[2],
      local childResource = {
        apiVersion: resource.apiVersion,
        resource: std.asciiLower(resource.kind) + "s",
      },
      return:: childResource,
    }.return,

    local makeKey(resource) =
      resource.resource + "." + resource.apiVersion,

    local applicationController = {
      apiVersion: "metacontroller.k8s.io/v1alpha1",
      kind: "CompositeController",
      metadata: {
        name: "application-controller",
        namespace: params.namespace,
      },
      spec: {
        generateSelector: true,
        parentResource: {
          apiVersion: "app.k8s.io/v1beta1",
          resource: "applications",
        },
        local childResources = std.map(forChildResources, tuples),
        local childResourcesMap = util.foldl(makeKey, childResources),
        childResources: [childResourcesMap[key] for key in std.objectFields(childResourcesMap)],
        hooks: {
          sync: {
            webhook: {
              url: "http://application-operator." + params.namespace + "/sync-application",
            },
          },
        },
      },
    },
    applicationController:: applicationController,

    local all = [
      self.compositeController,
      self.decoratorController,
      self.controllerRevisions,
      self.metaControllerServiceAccount,
      self.metaControllerClusterRoleBinding,
      self.metaControllerStatefulSet,
      self.applicationCrd,
      self.application,
      self.applicationConfigmap,
      self.applicationDeployment,
      self.applicationService,
      self.applicationController,
    ],

    all:: all,

    list(obj=self.all):: util.list(obj),
  },
}
