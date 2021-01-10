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

package e2e

import (
	"context"
	"fmt"
	"time"

	nbv1beta1 "github.com/kubeflow/kubeflow/components/notebook-controller/api/v1beta1"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	appsv1 "k8s.io/api/apps/v1"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

var _ = Describe("E2E TEST:Notebook controller", func() {

	Name := fmt.Sprintf("test-notebook-%s", randStringRunes(6))
	// Define utility constants for object names and testing timeouts/durations and intervals.
	const (
		Namespace = "default"
		timeout   = time.Minute * 10
		interval  = time.Millisecond * 250
	)
	Context("E2E TEST:When validating the notebook controller", func() {
		It("Should create replicas", func() {
			By("By creating a new Notebook")
			ctx := context.Background()
			notebook := &nbv1beta1.Notebook{
				ObjectMeta: metav1.ObjectMeta{
					Name:      Name,
					Namespace: Namespace,
				},
				Spec: nbv1beta1.NotebookSpec{
					Template: nbv1beta1.NotebookTemplateSpec{
						Spec: v1.PodSpec{Containers: []v1.Container{{
							Name:  "nginx",
							Image: "k8s.gcr.io/nginx-slim:0.8",
							Ports: []v1.ContainerPort{{
								ContainerPort: 80,
								Name:          "web",
							}},
						}}}},
				}}
			Expect(k8sClient.Create(ctx, notebook)).Should(Succeed())

			notebookLookupKey := types.NamespacedName{Name: Name, Namespace: Namespace}
			createdNotebook := &nbv1beta1.Notebook{}

			Eventually(func() bool {
				err := k8sClient.Get(ctx, notebookLookupKey, createdNotebook)
				return err == nil
			}, timeout, interval).Should(BeTrue())
			By("By checking that the Notebook has statefulset")
			Eventually(func() (bool, error) {
				sts := &appsv1.StatefulSet{ObjectMeta: metav1.ObjectMeta{
					Name:      Name,
					Namespace: Namespace,
				}}
				err := k8sClient.Get(ctx, notebookLookupKey, sts)
				if err != nil {
					return false, err
				}
				return true, nil
			}, timeout, interval).Should(BeTrue())
			By("By checking that there is a Pod that is in Running state")
			Eventually(func() (bool, error) {
				name := fmt.Sprintf("%s-0", Name)
				podLookupKey := types.NamespacedName{Name: name, Namespace: Namespace}
				p := &v1.Pod{ObjectMeta: metav1.ObjectMeta{
					Name:      name,
					Namespace: Namespace,
				}}
				err := k8sClient.Get(ctx, podLookupKey, p)
				if err != nil {
					return false, err
				}
				return p.Status.Phase == v1.PodRunning, nil
			}, timeout, interval).Should(BeTrue())
		})
	})
})
