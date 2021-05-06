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

package v1alpha1

import (
	appsv1 "k8s.io/api/apps/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// PVCViewerSpec defines the desired state of PVCViewer
type PVCViewerSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file
	PVCName     string `json:"pvcname"`
	ViewerImage string `json:"viewerimage"`
}

// PVCViewerCondition defines the observed state of PVCViewer
type PVCViewerCondition struct {
	// Deployment status, 'Available', 'Progressing', 'ReplicaFailure' .
	DeploymentState appsv1.DeploymentConditionType `json:"deploymentState"`

	// Last time we probed the condition.
	LastProbeTime metav1.Time `json:"lastProbeTime,omitempty"`
}

// PVCViewerStatus defines the observed state of PVCViewer
type PVCViewerStatus struct {
	// Conditions is an array of current conditions
	Conditions []PVCViewerCondition `json:"conditions"`
	// ReadyReplicas defines the number of PVCViewer Servers
	// that are available to connect. The value of ReadyReplicas
	// can be either 0 or 1
	ReadyReplicas int32 `json:"readyReplicas"`
	Ready         bool  `json:"ready"`
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:path=pvcviewers,scope=Namespaced
// +kubebuilder:subresource:status

// PVCViewer is the Schema for the pvcviewers API
type PVCViewer struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   PVCViewerSpec   `json:"spec,omitempty"`
	Status PVCViewerStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// PVCViewerList contains a list of PVCViewer
type PVCViewerList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []PVCViewer `json:"items"`
}

func init() {
	SchemeBuilder.Register(&PVCViewer{}, &PVCViewerList{})
}
