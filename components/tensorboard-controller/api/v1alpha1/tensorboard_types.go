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

// TensorboardSpec defines the desired state of Tensorboard
type TensorboardSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file
	LogsPath string `json:"logspath"`
}

// TensorboardCondition defines the observed state of Tensorboard
type TensorboardCondition struct {
	// Deployment status, 'Available', 'Progressing', 'ReplicaFailure' .
	DeploymentState appsv1.DeploymentConditionType `json:"deploymentState"`

	// Last time we probed the condition.
	LastProbeTime metav1.Time `json:"lastProbeTime,omitempty"`
}

// TensorboardStatus defines the observed state of Tensorboard
type TensorboardStatus struct {
	// Conditions is an array of current conditions
	Conditions []TensorboardCondition `json:"conditions"`
	// ReadyReplicas defines the number of Tensorboard Servers
	// that are available to connect. The value of ReadyReplicas
	// can be either 0 or 1
	ReadyReplicas int32 `json:"readyReplicas"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status

// Tensorboard is the Schema for the tensorboards API
type Tensorboard struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   TensorboardSpec   `json:"spec,omitempty"`
	Status TensorboardStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// TensorboardList contains a list of Tensorboard
type TensorboardList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Tensorboard `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Tensorboard{}, &TensorboardList{})
}
