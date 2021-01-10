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
	"bytes"
	"errors"
	"fmt"
	"math/rand"
	"os"
	"os/exec"
	"path"
	"testing"
	"time"

	nbv1beta1 "github.com/kubeflow/kubeflow/components/notebook-controller/api/v1beta1"
	controllerruntime "sigs.k8s.io/controller-runtime"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	apiextensionsv1beta1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1beta1"
	"k8s.io/client-go/kubernetes/scheme"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/envtest/printer"
	// +kubebuilder:scaffold:imports
)

// These tests use Ginkgo (BDD-style Go testing framework). Refer to
// http://onsi.github.io/ginkgo/ to learn more about Ginkgo.

const (
	DefaultK3DDockerImage  = "docker.io/rancher/k3s:v1.16.14-k3s1" // image used for spinning k8s cluster.
	TestK3dDockerImage     = "TEST_K3D_DOCKER_IMAGE"
	TestUseExistingCluster = "TEST_USE_EXISTING_CLUSTER"
	TestImage              = "TEST_IMAGE"
)

var (
	useExistingCluster bool          // flag for using an existing cluster for testing.
	k8sClient          client.Client // You'll be using this client in your tests.
	clusterName        string        // cluster that was dynamically created.
	k3DockerImage      string
)

func init() {
	rand.Seed(time.Now().UnixNano())
	useExistingCluster = getEnvDefault(TestUseExistingCluster, "false") == "true"
	k3DockerImage = getEnvDefault(TestK3dDockerImage, DefaultK3DDockerImage)
	_ = apiextensionsv1beta1.AddToScheme(scheme.Scheme)
}

// randStringRunes is used for generating random string.
func randStringRunes(n int) string {
	letterRunes := []rune("abcdefghijklmnopqrstuvwxyz") // for generating random names for tests.
	b := make([]rune, n)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b)
}

// getEnvDefault returns the value of the given environment variable or a
// default value if the given environment variable is not set.
func getEnvDefault(variable string, defaultVal string) string {
	envVar, exists := os.LookupEnv(variable)
	if !exists {
		return defaultVal
	}
	return envVar
}

// Setting up the ENV. This will run once before all the tests.
var _ = SynchronizedBeforeSuite(func() []byte {
	logf.SetLogger(zap.LoggerTo(GinkgoWriter, true))
	By("Creating a k8s cluster.")
	if !useExistingCluster {
		err := bootstrapK3DCluster()
		Expect(err).NotTo(HaveOccurred())
	}
	restConfig, err := controllerruntime.GetConfig()
	Expect(err).ToNot(HaveOccurred())
	Expect(restConfig).ToNot(BeNil())

	err = nbv1beta1.AddToScheme(scheme.Scheme)
	Expect(err).NotTo(HaveOccurred())

	// Applying kustomizations from the config folder
	kustomizations := []string{
		"../config/default",
	}
	err = applyKustomizations(kustomizations)
	Expect(err).NotTo(HaveOccurred())

	// +kubebuilder:scaffold:scheme

	k8sClient, err = client.New(restConfig, client.Options{Scheme: scheme.Scheme})
	Expect(err).ToNot(HaveOccurred())
	Expect(k8sClient).ToNot(BeNil())

	return nil

}, func(data []byte) {
})

// Cleaning the ENV
var _ = SynchronizedAfterSuite(func() {
}, func() {
	if !useExistingCluster {
		By("Tearing down the test k8s cluster created by the test.")
		Expect(deleteK3DCluster(clusterName)).Should(BeNil())
	} else {
		By("Deleting the deployed CRD's in the existing cluster.")
		// Deleting CRD's that were deployed as part of the test.
		kustomizations := []string{
			"../config/default",
		}
		err := deleteKustomizations(kustomizations)
		Expect(err).Should(BeNil())
	}
})

// bootstrapK3DCluster creates a k3d cluster with a random name. Loads the docker image into the cluster.
// The docker image name retrieved from the ENV variable TestImage.
func bootstrapK3DCluster() error {
	clusterName = fmt.Sprintf("e2e-notebook-kf-cluster-%s", randStringRunes(6))

	cmd := exec.Command("k3d", "cluster", "create", clusterName, "-i", k3DockerImage,
		"--no-lb", "--wait", "--timeout", "5m",
		"--update-default-kubeconfig=false")
	cmd.Stderr, cmd.Stdout = os.Stderr, os.Stdout
	err := cmd.Run()

	if err != nil {
		return err
	}
	cmd = exec.Command("k3d", "kubeconfig", "write", clusterName)
	err = cmd.Run()

	if err != nil {
		return err
	}
	kubeconfigPath := path.Join(os.Getenv("HOME"), fmt.Sprintf(".k3d/kubeconfig-%s.yaml", clusterName))
	_ = os.Setenv("KUBECONFIG", kubeconfigPath)
	imageName := os.Getenv(TestImage)
	if len(imageName) == 0 {
		return errors.New("the env variable TEST_IMAGE is not set to load the image into the k3d cluster")
	}
	cmd = exec.Command("k3d", "image", "import", "-c", clusterName, imageName)
	cmd.Stderr, cmd.Stdout = os.Stderr, os.Stdout
	return cmd.Run()
}

// deleteK3DCluster deletes the dynamically created k3d cluster.
func deleteK3DCluster(clusterName string) error {
	return exec.Command("k3d", "cluster", "delete", clusterName).Run()
}

// applyKustomizations applies kustomizations into the k8s clusters.
func applyKustomizations(kustomizations []string) error {
	for _, kust := range kustomizations {
		out, err := exec.Command("kustomize", "build",
			kust).Output()

		if err != nil {
			return err
		}

		kubectlApply := exec.Command("kubectl", "apply", "-f", "-")
		kubectlApply.Stdin = bytes.NewReader(out)
		kubectlApply.Stdout, kubectlApply.Stderr = os.Stdout, os.Stderr
		err = kubectlApply.Run()

		if err != nil {
			return err
		}
	}
	return nil
}

// deleteKustomizations deletes the CRD,RBAC,Deployment and services of the notebook controller from the cluster.
func deleteKustomizations(kustomizations []string) error {
	for _, kust := range kustomizations {
		out, err := exec.Command("kustomize", "build", kust).Output()

		if err != nil {
			return err
		}

		kubectlApply := exec.Command("kubectl", "delete", "-f", "-")
		kubectlApply.Stdin = bytes.NewReader(out)
		kubectlApply.Stdout, kubectlApply.Stderr = os.Stdout, os.Stderr
		err = kubectlApply.Run()

		if err != nil {
			return err
		}
	}

	return nil
}
func TestAPIs(t *testing.T) {
	RegisterFailHandler(Fail)

	RunSpecsWithDefaultAndCustomReporters(t,
		"Controller Suite",
		[]Reporter{printer.NewlineReporter{}})
}
