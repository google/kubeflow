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

package main

import (
	"flag"
	"io/ioutil"
	"os"

	"github.com/ghodss/yaml"
	profilev1 "github.com/kubeflow/kubeflow/components/profile-controller/api/v1"
	"github.com/kubeflow/kubeflow/components/profile-controller/controllers"
	istioSecurityClient "istio.io/client-go/pkg/apis/security/v1beta1"
	"k8s.io/apimachinery/pkg/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	_ "k8s.io/client-go/plugin/pkg/client/auth/gcp"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
	// +kubebuilder:scaffold:imports
)

const USERIDHEADER = "userid-header"
const USERIDPREFIX = "userid-prefix"
const WORKLOADIDENTITY = "workload-identity"
const DEFAULTNAMESPACELABELSPATH = "namespace-labels-path"

var (
	scheme   = runtime.NewScheme()
	setupLog = ctrl.Log.WithName("setup")
)

func init() {
	_ = clientgoscheme.AddToScheme(scheme)

	_ = profilev1.AddToScheme(scheme)
	_ = istioSecurityClient.AddToScheme(scheme)
	// +kubebuilder:scaffold:scheme
}

func main() {
	var metricsAddr, leaderElectionNamespace string
	var enableLeaderElection bool
	var userIdHeader string
	var userIdPrefix string
	var workloadIdentity string
	var defaultNamespaceLabelsPath string

	flag.StringVar(&metricsAddr, "metrics-addr", ":8080", "The address the metric endpoint binds to.")
	flag.BoolVar(&enableLeaderElection, "enable-leader-election", false,
		"Enable leader election for controller manager. Enabling this will ensure there is only one active controller manager.")
	flag.StringVar(&leaderElectionNamespace, "leader-election-namespace", "",
		"Determines the namespace in which the leader election configmap will be created.")
	flag.StringVar(&userIdHeader, USERIDHEADER, "x-goog-authenticated-user-email", "Key of request header containing user id")
	flag.StringVar(&userIdPrefix, USERIDPREFIX, "accounts.google.com:", "Request header user id common prefix")
	flag.StringVar(&workloadIdentity, WORKLOADIDENTITY, "", "Default identity (GCP service account) for workload_identity plugin")
	flag.StringVar(&defaultNamespaceLabelsPath, DEFAULTNAMESPACELABELSPATH, "/etc/profile-controller/namespace-labels.yaml", "A list of default labels to be set on namespaces")

	flag.Parse()

	ctrl.SetLogger(zap.Logger(true))

	mgr, err := ctrl.NewManager(ctrl.GetConfigOrDie(), ctrl.Options{
		Scheme:                  scheme,
		MetricsBindAddress:      metricsAddr,
		LeaderElection:          enableLeaderElection,
		LeaderElectionNamespace: leaderElectionNamespace,
		LeaderElectionID:        "kubeflow-profile-controller",
	})
	if err != nil {
		setupLog.Error(err, "unable to start manager")
		os.Exit(1)
	}

	// Read namespace labels from file.
	var defaultKubeflowNamespaceLabels = readDefaultLabelsFromFile(
		defaultNamespaceLabelsPath,
	)

	if err = (&controllers.ProfileReconciler{
		Client:                 mgr.GetClient(),
		Scheme:                 mgr.GetScheme(),
		Log:                    ctrl.Log.WithName("controllers").WithName("Profile"),
		UserIdHeader:           userIdHeader,
		UserIdPrefix:           userIdPrefix,
		WorkloadIdentity:       workloadIdentity,
		DefaultNamespaceLabels: defaultKubeflowNamespaceLabels,
	}).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "Profile")
		os.Exit(1)
	}
	// +kubebuilder:scaffold:builder

	setupLog.Info("starting manager")
	if err := mgr.Start(ctrl.SetupSignalHandler()); err != nil {
		setupLog.Error(err, "problem running manager")
		os.Exit(1)
	}
}

func readDefaultLabelsFromFile(path string) (labels map[string]string) {
	dat, err := ioutil.ReadFile(path)
	if err != nil {
		setupLog.Info("namespace labels properties file doesn't exist, using default value")
	}

	errYaml := yaml.Unmarshal(dat, &labels)
	if errYaml != nil {
		setupLog.Error(errYaml, "Unable to parse default namespace labels.")
		os.Exit(1)
	}

	return
}
