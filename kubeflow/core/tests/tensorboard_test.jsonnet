local tensorboard = import "kubeflow/tensorboard/tensorboard.libsonnet";

local params = {
  name: "tensorboard",
  logDir: "logs",
  targetPort: "6010",
  servicePort: "9050",
  serviceType: "LoadBalancer",
  defaultTbImage: "tensorflow/tensorflow:1.9.0",
};
local env = {
  namespace:: "test-kf-001",
};

local instance = tensorboard.new(env, params);

std.assertEqual(
  instance.tbService,
  {
     "apiVersion": "v1",
     "kind": "Service",
     "metadata": {
        "annotations": {
           "getambassador.io/config": "---\napiVersion: ambassador/v0\nkind:  Mapping\nname: tb-mapping-tensorboard-get\nprefix: /tensorboard/ tensorboard/\nrewrite: /\nmethod: GET\nservice: tensorboard.test-kf-001:9050"
        },
        "labels": {
           "app": "tensorboard"
        },
        "name": "tensorboard",
        "namespace": "test-kf-001"
     },
     "spec": {
        "ports": [
           {
              "name": "tb",
              "port": "9050",
              "targetPort": "6010"
           }
        ],
        "selector": {
           "app": "tensorboard"
        },
        "type": "LoadBalancer"
     }
  }
) &&

std.assertEqual(
  instance.tbDeployment,
  {
     "apiVersion": "apps/v1beta1",
     "kind": "Deployment",
     "metadata": {
        "labels": {
           "app": "tensorboard"
        },
        "name": "tensorboard",
        "namespace": "test-kf-001"
     },
     "spec": {
        "replicas": 1,
        "template": {
           "metadata": {
              "labels": {
                 "app": "tensorboard"
              }
           },
           "spec": {
              "containers": [
                 {
                    "args": [
                       "--logdir=logs",
                       "--port=6010"
                    ],
                    "command": [
                       "/usr/local/bin/tensorboard"
                    ],
                    "image": "tensorflow/tensorflow:1.9.0",
                    "imagePullPolicy": "IfNotPresent",
                    "name": "tensorboard",
                    "ports": [
                       {
                          "containerPort": "6010"
                       }
                    ],
                    "resources": {
                       "limits": {
                          "cpu": "4",
                          "memory": "4Gi"
                       },
                       "requests": {
                          "cpu": "1",
                          "memory": "1Gi"
                       }
                    }
                 }
              ]
           }
        }
     }
  }
)
