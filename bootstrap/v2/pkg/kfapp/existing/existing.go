package existing

import (
	"context"
	"fmt"
	kftypes "github.com/kubeflow/kubeflow/bootstrap/pkg/apis/apps"
	kfapisv2 "github.com/kubeflow/kubeflow/bootstrap/v2/pkg/apis"
	kftypesv2 "github.com/kubeflow/kubeflow/bootstrap/v2/pkg/apis/apps"
	kfdefs "github.com/kubeflow/kubeflow/bootstrap/v2/pkg/apis/apps/kfdef/v1alpha1"
	"github.com/kubeflow/kubeflow/bootstrap/v2/pkg/utils"
	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
	"html/template"
	corev1 "k8s.io/api/v2/core/v1"
	apierrors "k8s.io/apimachinery/v2/pkg/api/errors"
	metav1 "k8s.io/apimachinery/v2/pkg/apis/meta/v1"
	"k8s.io/apimachinery/v2/pkg/types"
	"k8s.io/client-go/rest"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
	"math/rand"
	"os"
	"path"
	"sigs.k8s.io/controller-runtime/v2/pkg/client"
	"strings"
	"time"
)

const (
	KUBEFLOW_USER_EMAIL = "KUBEFLOW_USER_EMAIL"
	KUBEFLOW_ENDPOINT   = "KUBEFLOW_ENDPOINT"
	OIDC_ENDPOINT       = "OIDC_ENDPOINT"
)

type Existing struct {
	kfdefs.KfDef
	istioManifests    []manifest
	authOIDCManifests []manifest
}

func GetPlatform(kfdef *kfdefs.KfDef) (kftypes.Platform, error) {

	log.Info("Repo Dir:", kfdef.Spec.Repo)
	istioManifestsDir := path.Join(path.Dir(kfdef.Spec.Repo), "deployment/existing/istio")
	istioManifests := []manifest{
		{
			name: "Istio CRDs",
			path: path.Join(istioManifestsDir, "crds.yaml"),
		},
		{
			name: "Istio Control Plane",
			path: path.Join(istioManifestsDir, "istio-noauth.yaml"),
		},
	}

	authOIDCManifestsDir := path.Join(path.Dir(kfdef.Spec.Repo), "deployment/existing/auth_oidc")
	authOIDCManifests := []manifest{
		{
			name: "Istio Gateway",
			path: path.Join(authOIDCManifestsDir, "gateway.yaml"),
		},
		{
			name: "Istio Ext-Auth Envoy Filter",
			path: path.Join(authOIDCManifestsDir, "envoy-filter.yaml"),
		},
		{
			name: "Dex",
			path: path.Join(authOIDCManifestsDir, "dex.yaml"),
		},
		{
			name: "AuthService",
			path: path.Join(authOIDCManifestsDir, "authservice.yaml"),
		},
	}

	existing := &Existing{
		KfDef:             *kfdef,
		istioManifests:    istioManifests,
		authOIDCManifests: authOIDCManifests,
	}
	return existing, nil
}

func (existing *Existing) GetK8sConfig() (*rest.Config, *clientcmdapi.Config) {
	return nil, nil
}

func (existing *Existing) Init(resources kftypes.ResourceEnum) error {
	return nil
}

func (existing *Existing) Generate(resources kftypes.ResourceEnum) error {
	return nil
}

func (existing *Existing) Apply(resources kftypes.ResourceEnum) error {
	// Apply extra components
	config := kftypesv2.GetConfig()

	// Create namespace
	// Get a K8s client
	kubeclient, err := client.New(config, client.Options{})
	if err != nil {
		return internalError(errors.WithStack(err))
	}

	// Create KFApp's namespace
	ns := &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: existing.Namespace,
		},
	}
	log.Infof("Creating namespace: %v", ns.Name)

	err = kubeclient.Create(context.TODO(), ns)
	if err != nil && !apierrors.IsAlreadyExists(err) {
		log.Errorf("Error creating namespace %v", ns.Name)
		return internalError(errors.WithStack(err))
	}

	// Install Istio
	if err := applyManifests(existing.istioManifests); err != nil {
		return internalError(errors.WithStack(err))
	}

	// Get Kubeflow and Dex Endpoints
	kfEndpoint, oidcEndpoint, err := getEndpoints(kubeclient)
	if err != nil {
		return internalError(errors.WithStack(err))
	}

	// Get the kubeflow user to add
	log.Info("Getting the Kubeflow User")
	kubeflowUser, err := getKubeflowUser()
	if err != nil {
		return internalError(errors.WithStack(err))
	}

	data := struct {
		KubeflowEndpoint        string
		OIDCEndpoint            string
		AuthServiceClientSecret string
		KubeflowUser            *kfUser
	}{
		KubeflowEndpoint:        kfEndpoint,
		OIDCEndpoint:            oidcEndpoint,
		AuthServiceClientSecret: genRandomString(32),
		KubeflowUser:            kubeflowUser,
	}

	// Generate YAML from the dex, authservice templates
	authOIDCManifestsDir := path.Join(path.Dir(existing.Spec.Repo), "deployment/existing/auth_oidc")
	err = generateFromGoTemplate(
		path.Join(authOIDCManifestsDir, "authservice.tmpl"),
		path.Join(authOIDCManifestsDir, "authservice.yaml"),
		data,
	)
	if err != nil {
		return internalError(errors.WithStack(err))
	}

	err = generateFromGoTemplate(
		path.Join(authOIDCManifestsDir, "dex.tmpl"),
		path.Join(authOIDCManifestsDir, "dex.yaml"),
		data,
	)
	if err != nil {
		return internalError(errors.WithStack(err))
	}

	// Install OIDC Authentication
	if err := applyManifests(existing.authOIDCManifests); err != nil {
		return internalError(errors.WithStack(err))
	}

	return nil
}

func (existing *Existing) Delete(resources kftypes.ResourceEnum) error {

	config := kftypesv2.GetConfig()
	kubeclient, err := client.New(config, client.Options{})
	if err != nil {
		return internalError(errors.WithStack(err))
	}

	ns := &corev1.Namespace{}
	for {
		err := kubeclient.Get(context.TODO(), types.NamespacedName{Name: existing.Namespace}, ns)
		// If Namespace has been deleted, break
		if apierrors.IsNotFound(err) {
			break
		}
		// If an unknown error occured, return
		if err != nil {
			return internalError(errors.WithStack(err))
		}
		// If Namespace exists, delete it
		if ns.DeletionTimestamp == nil {
			if err := kubeclient.Delete(context.TODO(), ns); err != nil {
				return internalError(errors.WithStack(err))
			}
		}
		log.Info("Waiting for namespace deletion to finish...")
		time.Sleep(5 * time.Second)
	}

	rev := func(manifests []manifest) []manifest {
		r := []manifest{}
		max := len(manifests) - 1
		for i := 0; i < max; i++ {
			r = append(r, manifests[max-1-i])
		}
		return r
	}

	if err := deleteManifests(rev(existing.authOIDCManifests)); err != nil {
		return internalError(errors.WithStack(err))
	}
	if err := deleteManifests(rev(existing.istioManifests)); err != nil {
		return internalError(errors.WithStack(err))
	}
	return nil
}

func internalError(err error) error {
	return &kfapisv2.KfError{
		Code:    int(kfapisv2.INTERNAL_ERROR),
		Message: fmt.Sprintf("%+v", err),
	}
}

type kfUser struct {
	UserEmail    string
	Username     string
	PasswordHash string
}

func getKubeflowUser() (*kfUser, error) {
	kfUserEmail := os.Getenv(KUBEFLOW_USER_EMAIL)
	kfPassword := os.Getenv(kftypes.KUBEFLOW_PASSWORD)
	kfUsername := ""

	if kfUserEmail == "" || kfPassword == "" {
		log.Warn("KUBEFLOW_USER_EMAIL or KUBEFLOW_PASSWORD not given. Starting without creating a user.")
		log.Warn("If you want to create a user, edit the dex ConfigMap.")
		return nil, nil
	} else if !strings.Contains(kfUserEmail, "@") {
		return nil, fmt.Errorf("KUBEFLOW_USER_EMAIL is not a valid email (does not contain '@')")
	}
	kfUsername = kfUserEmail[0:strings.Index(kfUserEmail, "@")]
	kfPasswordHash, err := bcrypt.GenerateFromPassword([]byte(kfPassword), 13)
	if err != nil {
		return nil, err
	}
	log.Infof("Kubeflow user with email %s will be created", kfUserEmail)
	return &kfUser{
		UserEmail:    kfUserEmail,
		Username:     kfUsername,
		PasswordHash: string(kfPasswordHash),
	}, nil
}

func getEndpoints(kubeclient client.Client) (string, string, error) {

	// Get Istio IngressGateway Service LoadBalancer IP
	kfEndpoint := os.Getenv(KUBEFLOW_ENDPOINT)
	oidcEndpoint := os.Getenv(OIDC_ENDPOINT)

	if kfEndpoint == "" {
		lbIP, err := getLBIP(kubeclient)
		if err != nil {
			return "", "", err
		}
		kfEndpoint = fmt.Sprintf("http://%s", lbIP)
		log.Infof("KUBEFLOW_ENDPOINT not set, using %s", kfEndpoint)
	}
	if oidcEndpoint == "" {
		oidcEndpoint = fmt.Sprintf("%s:5556/dex", kfEndpoint)
		log.Infof("OIDC_ENDPOINT not set, using %s", oidcEndpoint)
	}

	return kfEndpoint, oidcEndpoint, nil
}

func getLBIP(kubeclient client.Client) (string, error) {
	// Get IngressGateway Service's ExternalIP
	const maxRetries = 20
	var lbIP string
	svc := &corev1.Service{}
	for i := 0; ; i++ {
		log.Info("Trying to get istio-ingressgateway Service External IP")

		err := kubeclient.Get(
			context.TODO(),
			types.NamespacedName{Name: "istio-ingressgateway", Namespace: "istio-system"},
			svc,
		)

		if err != nil {
			log.Errorf("Error trying to get istio-ingressgateway service")
			return "", err
		}
		if svc.Status.LoadBalancer.Ingress != nil {
			lbIP = svc.Status.LoadBalancer.Ingress[0].IP
			break
		}
		if i == maxRetries {
			return "", fmt.Errorf("timed out while waiting to get istio-ingressgateway Service ExternalIP")
		}
		time.Sleep(10 * time.Second)
	}
	log.Infof("Found Istio Gateway's External IP: %s", lbIP)
	return lbIP, nil
}

type manifest struct {
	name              string
	path              string
	namespaceOverride string
}

func applyManifests(manifests []manifest) error {
	config := kftypesv2.GetConfig()
	for _, m := range manifests {
		log.Infof("Installing %s...", m.name)
		err := utils.CreateResourceFromFile(
			config,
			m.path,
		)
		if err != nil {
			log.Errorf("Failed to create %s: %v", m.name, err)
			return err
		}
	}
	return nil
}

func deleteManifests(manifests []manifest) error {
	config := kftypesv2.GetConfig()
	for _, m := range manifests {
		log.Infof("Deleting %s...", m.name)
		err := utils.DeleteResourceFromFile(
			config,
			m.path,
		)
		if err != nil {
			log.Errorf("Failed to delete %s: %+v", m.name, err)
			return err
		}
	}
	return nil
}

func generateFromGoTemplate(tmplPath, outPath string, data interface{}) error {
	tmpl := template.Must(template.ParseFiles(tmplPath))
	f, err := os.Create(outPath)
	if err != nil {
		return err
	}
	err = tmpl.Execute(f, data)
	if err != nil {
		return err
	}
	return nil
}

var seededRand = rand.New(
	rand.NewSource(time.Now().UnixNano()))

func genRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

	b := make([]byte, length)
	for i := range b {
		b[i] = charset[seededRand.Intn(len(charset))]
	}
	return string(b)
}
