/*

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package controllers

import (
	"context"
	"fmt"
	"os"
	"reflect"
	"strings"

	"github.com/go-logr/logr"
	"github.com/gogo/protobuf/proto"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	apierrs "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/intstr"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	reconcilehelper "github.com/kubeflow/kubeflow/components/common/reconcilehelper"
	tensorboardv1alpha1 "github.com/kubeflow/kubeflow/components/tensorboard-controller/api/v1alpha1"
)

// TensorboardReconciler reconciles a Tensorboard object
type TensorboardReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
}

// Reconcile reads that state of the cluster for a Tensorboard object and makes changes based on the state read
// and what is in the Tensorboard.Spec
// +kubebuilder:rbac:groups=tensorboard.kubeflow.org,resources=tensorboards,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=tensorboard.kubeflow.org,resources=tensorboards/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=apps,resources=deployments,verbs=get;list;watch;create;update
// +kubebuilder:rbac:groups=core,resources=services,verbs=get;list;watch;create;update
// +kubebuilder:rbac:groups=networking.istio.io,resources=virtualservices,verbs=get;list;watch;create;update
// +kubebuilder:rbac:groups=core,resources=persistentvolumeclaims,verbs=get;list;watch
// +kubebuilder:rbac:groups=core,resources=pods,verbs=get;list;watch

func (r *TensorboardReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	logger := r.Log.WithValues("tensorboard", req.NamespacedName)

	instance := &tensorboardv1alpha1.Tensorboard{}
	err := r.Get(ctx, req.NamespacedName, instance)
	if err != nil {
		if errors.IsNotFound(err) {
			// Object not found, return.  Created objects are automatically garbage collected.
			// For additional cleanup logic use finalizers.
			return reconcile.Result{}, nil
		}
		// Error reading the object - requeue the request.
		return reconcile.Result{}, err
	}

	// Reconcile k8s deployment.
	deployment, err := generateDeployment(instance, logger, r)
	if err != nil {
		return ctrl.Result{}, err
	}
	if err := ctrl.SetControllerReference(instance, deployment, r.Scheme); err != nil {
		return ctrl.Result{}, err
	}
	if err := Deployment(ctx, r, deployment, logger); err != nil {
		return ctrl.Result{}, err
	}

	// Reconcile k8s service.
	service := generateService(instance)
	if err := ctrl.SetControllerReference(instance, service, r.Scheme); err != nil {
		return ctrl.Result{}, err
	}
	if err := reconcilehelper.Service(ctx, r, service, logger); err != nil {
		return ctrl.Result{}, err
	}

	// Reconcile istio virtual service.
	virtualService, err := generateVirtualService(instance)
	if err := ctrl.SetControllerReference(instance, virtualService, r.Scheme); err != nil {
		return ctrl.Result{}, err
	}
	if err := reconcilehelper.VirtualService(ctx, r, virtualService.GetName(), virtualService.GetNamespace(), virtualService, logger); err != nil {
		return ctrl.Result{}, err
	}

	foundDeployment := &appsv1.Deployment{}
	//Update the instance.Status.ReadyReplicas if the foundDeployment.Status.ReadyReplicas
	//has changed.
	_err := r.Get(ctx, types.NamespacedName{Name: deployment.Name, Namespace: deployment.Namespace}, foundDeployment)

	if _err != nil {
		if apierrs.IsNotFound(err) {
			logger.Info("Deployment not found...", "deployment", deployment.Name)
		} else {
			return ctrl.Result{}, _err
		}
	} else {
		if len(foundDeployment.Status.Conditions) > 0 {
			condition := tensorboardv1alpha1.TensorboardCondition{
				DeploymentState: foundDeployment.Status.Conditions[0].Type,
				LastProbeTime:   foundDeployment.Status.Conditions[0].LastUpdateTime,
			}
			clen := len(instance.Status.Conditions)
			if clen == 0 || instance.Status.Conditions[clen-1].DeploymentState != condition.DeploymentState {
				instance.Status.Conditions = append(instance.Status.Conditions, condition)
			}
			logger.Info("instance condition..", "condition", instance)
		}

		if foundDeployment.Status.ReadyReplicas != instance.Status.ReadyReplicas {
			logger.Info("Updating Status", "namespace", instance.Namespace, "name", instance.Name)
			instance.Status.ReadyReplicas = foundDeployment.Status.ReadyReplicas
		}

		_err = r.Status().Update(ctx, instance)
		if _err != nil {
			return ctrl.Result{}, _err
		}
	}

	return ctrl.Result{}, nil
}

func (r *TensorboardReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&tensorboardv1alpha1.Tensorboard{}).
		Owns(&appsv1.Deployment{}).
		Complete(r)
}

func generateDeployment(tb *tensorboardv1alpha1.Tensorboard, log logr.Logger, r *TensorboardReconciler) (*appsv1.Deployment, error) {
	var volumeMounts []corev1.VolumeMount
	var volumes []corev1.Volume
	var mountpath, subpath string = tb.Spec.LogsPath, ""
	var affinity = &corev1.Affinity{}

	//In this case, a PVC is used as a log storage for the Tensorboard server.
	if !isCloudPath(tb.Spec.LogsPath) {
		var pvcname string

		//General case, in which tb.Spec.LogsPath follows the format: "pvc://<pvc-name>/<local-path>".
		if isPVCPath(tb.Spec.LogsPath) {
			pvcname = extractPVCName(tb.Spec.LogsPath)
			mountpath = "/tensorboard_logs/"
			subpath = extractPVCSubPath(tb.Spec.LogsPath)
		} else {
			//Maintaining backwards compatibility with previous version of the controller.
			pvcname = "tb-volume"
			subpath = ""
		}

		volumeMounts = append(volumeMounts, corev1.VolumeMount{
			Name:      "tbpd",
			ReadOnly:  true,
			MountPath: mountpath,
			SubPath:   subpath,
		})
		volumes = append(volumes, corev1.Volume{
			Name: "tbpd",
			VolumeSource: corev1.VolumeSource{
				PersistentVolumeClaim: &corev1.PersistentVolumeClaimVolumeSource{
					ClaimName: pvcname,
				},
			},
		})

		if err, sch := rwoPVCScheduling(); err != nil {
			return nil, err
		} else if sch {
			//If 'RWO_PVC_SCHEDULING' env var is set to "true", an extra scheduling functionality is added,
			//for the case that the Tensorboard Server is using a RWO PVC (as a log storage)
			//and the PVC is already mounted by another pod.

			//Get the PVC that will be accessed by the Tensorboard Server.
			var pvc = &corev1.PersistentVolumeClaim{}
			if err := r.Get(context.Background(), client.ObjectKey{
				Namespace: tb.Namespace,
				Name:      pvcname,
			}, pvc); err != nil {
				return nil, fmt.Errorf("Get PersistentVolumeClaim error: %v", err)
			}

			//If the PVC is mounted as a ReadWriteOnce volume by a pod that is running on a node X,
			//then we find the NodeName of X so that the Tensorboard server
			//(that must access the volume) will be deployed on X using nodeAffinity.
			if pvc.Status.AccessModes[0] == corev1.ReadWriteOnce {
				if err := generateNodeAffinity(affinity, pvcname, r, tb); err != nil {
					return nil, err
				}
			}
		}
	} else if isGoogleCloudPath(tb.Spec.LogsPath) {
		//In this case, a Google cloud bucket is used as a log storage for the Tensorboard server.
		volumeMounts = append(volumeMounts, corev1.VolumeMount{
			Name:      "gcp-creds",
			ReadOnly:  true,
			MountPath: "/secret/gcp",
		})
		volumes = append(volumes, corev1.Volume{
			Name: "gcp-creds",
			VolumeSource: corev1.VolumeSource{
				Secret: &corev1.SecretVolumeSource{
					SecretName: "user-gcp-sa",
				},
			},
		})
	}

	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      tb.Name,
			Namespace: tb.Namespace,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: proto.Int32(1),
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": tb.Name,
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{"app": tb.Name},
				},
				Spec: corev1.PodSpec{
					Affinity:      affinity,
					RestartPolicy: corev1.RestartPolicyAlways,
					Containers: []corev1.Container{
						{
							Name:            "tensorboard",
							Image:           "tensorflow/tensorflow:2.1.0",
							ImagePullPolicy: "IfNotPresent",
							Command:         []string{"/usr/local/bin/tensorboard"},
							WorkingDir:      "/",
							Args: []string{
								"--logdir=" + mountpath,
							},
							Ports: []corev1.ContainerPort{
								{
									ContainerPort: 6006,
								},
							},
							VolumeMounts: volumeMounts,
						},
					},
					Volumes: volumes,
				},
			},
		},
	}, nil
}

func generateService(tb *tensorboardv1alpha1.Tensorboard) *corev1.Service {
	return &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:      tb.Name,
			Namespace: tb.Namespace,
		},
		Spec: corev1.ServiceSpec{
			Type:     "ClusterIP",
			Selector: map[string]string{"app": tb.Name},
			Ports: []corev1.ServicePort{
				corev1.ServicePort{
					Name:       "http-" + tb.Name,
					Port:       80,
					TargetPort: intstr.FromInt(6006),
				},
			},
		},
	}
}

func generateVirtualService(tb *tensorboardv1alpha1.Tensorboard) (*unstructured.Unstructured, error) {
	prefix := fmt.Sprintf("/tensorboard/%s/%s/", tb.Namespace, tb.Name)
	rewrite := "/"
	service := fmt.Sprintf("%s.%s.svc.cluster.local", tb.Name, tb.Namespace)

	vsvc := &unstructured.Unstructured{}
	vsvc.SetAPIVersion("networking.istio.io/v1alpha3")
	vsvc.SetKind("VirtualService")
	vsvc.SetName(tb.Name)
	vsvc.SetNamespace(tb.Namespace)
	if err := unstructured.SetNestedStringSlice(vsvc.Object, []string{"*"}, "spec", "hosts"); err != nil {
		return nil, fmt.Errorf("Set .spec.hosts error: %v", err)
	}
	if err := unstructured.SetNestedStringSlice(vsvc.Object, []string{"kubeflow/kubeflow-gateway"},
		"spec", "gateways"); err != nil {
		return nil, fmt.Errorf("Set .spec.gateways error: %v", err)
	}

	http := []interface{}{
		map[string]interface{}{
			"match": []interface{}{
				map[string]interface{}{
					"uri": map[string]interface{}{
						"prefix": prefix,
					},
				},
			},
			"rewrite": map[string]interface{}{
				"uri": rewrite,
			},
			"route": []interface{}{
				map[string]interface{}{
					"destination": map[string]interface{}{
						"host": service,
						"port": map[string]interface{}{
							"number": int64(80),
						},
					},
				},
			},
			"timeout": "300s",
		},
	}
	if err := unstructured.SetNestedSlice(vsvc.Object, http, "spec", "http"); err != nil {
		return nil, fmt.Errorf("Set .spec.http error: %v", err)
	}

	return vsvc, nil
}

func isCloudPath(path string) bool {
	return isGoogleCloudPath(path) || strings.HasPrefix(path, "s3://") || strings.HasPrefix(path, "/cns/")
}

func isGoogleCloudPath(path string) bool {
	return strings.HasPrefix(path, "gs://")
}

func isPVCPath(path string) bool {
	return strings.HasPrefix(path, "pvc://")
}

func extractPVCName(path string) string {
	trimmed := strings.TrimPrefix(path, "pvc://") //removing "pvc://" prefix
	ending := strings.Index(trimmed, "/")         //finding ending index of pvc-name string
	if ending == -1 {
		return trimmed
	} else {
		return trimmed[0:ending]
	}
}

func extractPVCSubPath(path string) string {
	trimmed := strings.TrimPrefix(path, "pvc://") //removing "pvc://" prefix
	start := strings.Index(trimmed, "/")          //finding starting index of local path inside PVC
	if start == -1 || len(trimmed) == start+1 {
		return ""
	} else {
		return trimmed[start+1:]
	}
}

//Searches a corev1.PodList for running pods and returns
//a running corev1.Pod (if exists)
func findRunningPod(pods *corev1.PodList) corev1.Pod {
	for _, pod := range pods.Items {
		if pod.Status.Phase == "Running" {
			return pod
		}
	}

	return corev1.Pod{}
}

func extractNodeName(pod corev1.Pod) string {
	return pod.Spec.NodeName
}

func generateNodeAffinity(affinity *corev1.Affinity, pvcname string, r *TensorboardReconciler, tb *tensorboardv1alpha1.Tensorboard) error {
	var nodename string
	var pods = &corev1.PodList{}
	var pod corev1.Pod

	//List all pods that access the PVC that has ClaimName: pvcname.
	//NOTE: We use only one custom field selector to filter out pods that don't use this PVC.
	if err := r.List(context.Background(), pods, client.InNamespace(tb.Namespace), client.MatchingFields{"spec.volumes.persistentvolumeclaim.claimname": pvcname}); err != nil {
		return fmt.Errorf("List pods error: %v", err)
	}

	//Find a running pod that uses the PVC.
	pod = findRunningPod(pods)

	//If there is no running pod that uses the PVC, then: nodename == "".
	//Else, nodename contains the name of the node that the pod is running on.
	nodename = extractNodeName(pod)

	//In this case, there is a running pod that uses the PVC, therefore we create
	//a nodeAffinity field so that the Tensorboard server will be scheduled (if possible)
	//on the same node as the running pod.
	if nodename == "" {
		return nil
	}
	*affinity = corev1.Affinity{
		NodeAffinity: &corev1.NodeAffinity{
			PreferredDuringSchedulingIgnoredDuringExecution: []corev1.PreferredSchedulingTerm{
				{
					Weight: 100,
					Preference: corev1.NodeSelectorTerm{
						MatchExpressions: []corev1.NodeSelectorRequirement{
							{
								Key:      "kubernetes.io/hostname",
								Operator: "In",
								Values:   []string{nodename},
							},
						},
					},
				},
			},
		},
	}
	return nil
}

//Checks the value of 'RWO_PVC_SCHEDULING' env var (if present in the environment) and returns
//'true' or 'false' accordingly. If 'RWO_PVC_SCHEDULING' is NOT present, then the value of the
//returned boolean is set to 'false', so that the scheduling functionality is off by default.
func rwoPVCScheduling() (error, bool) {
	if value, exists := os.LookupEnv("RWO_PVC_SCHEDULING"); !exists || value == "false" || value == "False" || value == "FALSE" {
		return nil, false
	} else if value == "true" || value == "True" || value == "TRUE" {
		return nil, true
	}

	//If 'RWO_PVC_SCHEDULING' is present in the environment but has an invalid value,
	//then an error is returned.
	return fmt.Errorf("Invalid value for 'RWO_PVC_SCEDULING' env var."), false
}

func Deployment(ctx context.Context, r client.Client, deployment *appsv1.Deployment, log logr.Logger) error {
	foundDeployment := &appsv1.Deployment{}
	justCreated := false
	if err := r.Get(ctx, types.NamespacedName{Name: deployment.Name, Namespace: deployment.Namespace}, foundDeployment); err != nil {
		if apierrs.IsNotFound(err) {
			log.Info("Creating Deployment", "namespace", deployment.Namespace, "name", deployment.Name)
			if err := r.Create(ctx, deployment); err != nil {
				log.Error(err, "unable to create deployment")
				return err
			}
			justCreated = true
		} else {
			log.Error(err, "error getting deployment")
			return err
		}
	}
	if !justCreated && CopyDeploymentSetFields(deployment, foundDeployment) {
		log.Info("Updating Deployment", "namespace", deployment.Namespace, "name", deployment.Name)
		if err := r.Update(ctx, foundDeployment); err != nil {
			log.Error(err, "unable to update deployment")
			return err
		}
	}

	return nil
}

func CopyDeploymentSetFields(from, to *appsv1.Deployment) bool {
	requireUpdate := false
	for k, v := range to.Labels {
		if from.Labels[k] != v {
			requireUpdate = true
		}
	}
	to.Labels = from.Labels

	if *from.Spec.Replicas != *to.Spec.Replicas {
		to.Spec.Replicas = from.Spec.Replicas
		requireUpdate = true
	}

	if !reflect.DeepEqual(to.Spec.Template.Spec.Affinity, from.Spec.Template.Spec.Affinity) {
		requireUpdate = true
	}
	to.Spec.Template.Spec.Affinity = from.Spec.Template.Spec.Affinity

	return requireUpdate
}
