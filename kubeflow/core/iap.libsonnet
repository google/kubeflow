{
	parts(namespace, name):: {
	   local serviceName = name + "-esp",

	   // This is a service that will forward to the ESP side car that handles JWT verification
	   // selector is the label selector for the backing pods.
	   // targetPort should be the port the ESP side car is using
	   iapEspProxyService(selector, targetPort): {
		  "apiVersion": "v1", 
		  "kind": "Service", 
		  "metadata": {
		    "labels": selector, 
		    "name": serviceName,
		    namespace: namespace,
		  }, 
		  "spec": {
		    "ports": [
		      {
		        "name": "esp", 
		        "port": 80, 
		        "targetPort": targetPort,
		      }
		    ], 
		    "selector": selector,
		    "type": "NodePort",
		  }
	   },
	   ingress(secretName):: {
		  "apiVersion": "extensions/v1beta1", 
		  "kind": "Ingress", 
		  "metadata": {
		    "name": serviceName,
		    "namespace": namespace,
		  }, 
		  "spec": {
		    "rules": [
		      {
		        "http": {
		          "paths": [
		            {
		              "backend": {
		                "serviceName": serviceName, 
		                "servicePort": 80,
		              }, 
		              "path": "/*"
		            }
		          ]
		        }
		      }
		    ], 
		    "tls": [
		      {
		        "secretName": secretName,
		      }
		    ]
		  }
		}, // iapIngress
	}, // parts 
}