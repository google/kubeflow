package controllers

import (
	"reflect"
	"testing"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type namespaceLabelSuite struct {
	current  corev1.Namespace
	labels   map[string]string
	expected corev1.Namespace
}

func TestEnforceNamespaceLabelsFromConfig(t *testing.T) {
	name := "test-namespace"
	tests := []namespaceLabelSuite{
		namespaceLabelSuite{
			corev1.Namespace{
				ObjectMeta: metav1.ObjectMeta{
					Name: name,
				},
			},
			map[string]string{
				"katib-metricscollector-injection":      "enabled",
				"serving.kubeflow.org/inferenceservice": "enabled",
				"pipelines.kubeflow.org/enabled":        "true",
				"app.kubernetes.io/part-of":             "kubeflow-profile",
			},
			corev1.Namespace{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"katib-metricscollector-injection":      "enabled",
						"serving.kubeflow.org/inferenceservice": "enabled",
						"pipelines.kubeflow.org/enabled":        "true",
						"app.kubernetes.io/part-of":             "kubeflow-profile",
					},
					Name: name,
				},
			},
		},
		namespaceLabelSuite{
			corev1.Namespace{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"user-name":                             "Jim",
						"serving.kubeflow.org/inferenceservice": "disabled",
					},
					Name: name,
				},
			},
			map[string]string{
				"katib-metricscollector-injection":      "enabled",
				"serving.kubeflow.org/inferenceservice": "enabled",
				"pipelines.kubeflow.org/enabled":        "true",
				"app.kubernetes.io/part-of":             "kubeflow-profile",
			},
			corev1.Namespace{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"user-name":                             "Jim",
						"katib-metricscollector-injection":      "enabled",
						"serving.kubeflow.org/inferenceservice": "disabled",
						"pipelines.kubeflow.org/enabled":        "true",
						"app.kubernetes.io/part-of":             "kubeflow-profile",
					},
					Name: name,
				},
			},
		},
		namespaceLabelSuite{
			corev1.Namespace{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"user-name":     "Jim",
						"removal-label": "enabled",
					},
					Name: name,
				},
			},
			map[string]string{
				"katib-metricscollector-injection":      "enabled",
				"serving.kubeflow.org/inferenceservice": "enabled",
				"pipelines.kubeflow.org/enabled":        "true",
				"app.kubernetes.io/part-of":             "kubeflow-profile",
				"removal-label":                         "",
			},
			corev1.Namespace{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"user-name":                             "Jim",
						"katib-metricscollector-injection":      "enabled",
						"serving.kubeflow.org/inferenceservice": "enabled",
						"pipelines.kubeflow.org/enabled":        "true",
						"app.kubernetes.io/part-of":             "kubeflow-profile",
					},
					Name: name,
				},
			},
		},
	}
	for _, test := range tests {
		setNamespaceLabels(&test.current, test.labels)
		if !reflect.DeepEqual(&test.expected, &test.current) {
			t.Errorf("Expect:\n%v; Output:\n%v", &test.expected, &test.current)
		}
	}
}
