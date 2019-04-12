/*
Copyright The Kubernetes Authors.

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

package kustomize

import (
	"bufio"
	"encoding/json"
	"fmt"
	"github.com/ghodss/yaml"
	kfapis "github.com/kubeflow/kubeflow/bootstrap/pkg/apis"
	kftypes "github.com/kubeflow/kubeflow/bootstrap/pkg/apis/apps"
	cltypes "github.com/kubeflow/kubeflow/bootstrap/pkg/apis/apps/kfdef/v1alpha1"
	kftypesv2 "github.com/kubeflow/kubeflow/bootstrap/v2/pkg/apis/apps"
	cltypesv2 "github.com/kubeflow/kubeflow/bootstrap/v2/pkg/apis/apps/kfdef/v1alpha1"
	log "github.com/sirupsen/logrus"
	"io/ioutil"
	"k8s.io/api/v2/core/v1"
	metav1 "k8s.io/apimachinery/v2/pkg/apis/meta/v1"
	"k8s.io/apimachinery/v2/pkg/runtime/schema"
	"k8s.io/apimachinery/v2/pkg/runtime/serializer"
	"k8s.io/client-go/v2/discovery"
	"k8s.io/client-go/v2/discovery/cached"
	"k8s.io/client-go/v2/kubernetes/scheme"
	"k8s.io/client-go/v2/rest"
	"k8s.io/client-go/v2/restmapper"
	clientcmdapi "k8s.io/client-go/v2/tools/clientcmd/api"
	"os"
	"path"
	"path/filepath"
	"regexp"
	application "sigs.k8s.io/application/v2/pkg/apis/app/v1beta1"
	"sigs.k8s.io/kustomize/v2/k8sdeps"
	"sigs.k8s.io/kustomize/v2/pkg/factory"
	"sigs.k8s.io/kustomize/v2/pkg/fs"
	"sigs.k8s.io/kustomize/v2/pkg/loader"
	"sigs.k8s.io/kustomize/v2/pkg/target"
	"sigs.k8s.io/kustomize/v2/pkg/types"
	"strings"
)

// Kustomize implements KfApp Interface
// It should include functionality needed for the kustomize platform
// In addition to `kustomize build`, there is `kustomize edit ...`
// As noted below there are lots of different ways to use edit
//  kustomize edit add configmap my-configmap --from-file=my-key=file/path --from-literal=my-literal=12345
//  kustomize edit add configmap my-configmap --from-file=file/path
//  kustomize edit add configmap my-configmap --from-env-file=env/path.env
//  kustomize edit add configmap NAME --from-literal=k=v
//  kustomize edit add resource <filepath>
//  kustomize edit add patch <filepath>
//  kustomize edit add base <filepath1>,<filepath2>,<filepath3>
//  kustomize edit set nameprefix <prefix-value>

// A good example is kustomize/pkg/examplelayout/simple
// which creates an instance from a package, this may be the most similar to ksonnet packages
// and is taken from [Declarative Application Management in Kubernetes]
// (https://docs.google.com/document/d/1cLPGweVEYrVqQvBLJg6sxV-TrE5Rm2MNOBA_cxZP2WU)
type kustomize struct {
	cltypesv2.KfDef
	factory    *factory.KustFactory
	fsys       fs.FileSystem
	out        *os.File
	err        *os.File
	componentMap map[string]string
	packageMap map[string][]string
	application *application.Application
	restConfig *rest.Config
	apiConfig  *clientcmdapi.Config
}

const (
	outputDir    = "kustomize"
	yamlSeparator = "(?m)^---[ \t]*$"
)

func GetKfApp(kfdef *cltypes.KfDef) kftypes.KfApp {
	kfdef2 := cltypesv2.KfDef {
		TypeMeta: metav1.TypeMeta{
			Kind: kfdef.TypeMeta.Kind,
			APIVersion: kfdef.TypeMeta.APIVersion,
		},
		ObjectMeta: metav1.ObjectMeta{
			Name: kfdef.Name,
			Namespace: kfdef.Namespace,
			Labels: kfdef.Labels,
			Annotations: kfdef.Annotations,
			ClusterName: kfdef.ClusterName,
		},
		Spec: kfdef.Spec,
	}
	_kustomize := &kustomize{
		KfDef: kfdef2,
		factory:    k8sdeps.NewFactory(),
		fsys:       fs.MakeRealFS(),
		out:        os.Stdout,
		err:        os.Stderr,
		packageMap: make(map[string][]string),
	}
	if _kustomize.Spec.ManifestsRepo != "" {
		for _, packageName := range _kustomize.Spec.Packages {
			_kustomize.packageMap[packageName] = []string{}
		}
		_kustomize.componentMap = _kustomize.mapDirs(_kustomize.Spec.ManifestsRepo, true, make(map[string]string))
	}
	_kustomize.application = &application.Application{}

	// build restConfig and apiConfig using $HOME/.kube/config if the file exist
	_kustomize.restConfig = kftypesv2.GetConfig()
	_kustomize.apiConfig = kftypesv2.GetKubeConfig()
	return _kustomize
}

func (kustomize *kustomize) Apply(resources kftypes.ResourceEnum) error {
	if kustomize.restConfig == nil || kustomize.apiConfig == nil {
		return &kfapis.KfError{
			Code:    int(kfapis.INVALID_ARGUMENT),
			Message: "Error: ksApp has nil restConfig or apiConfig, exit",
		}
	}
	clientset := kftypesv2.GetClientset(kustomize.restConfig)
	namespace := kustomize.ObjectMeta.Namespace
	log.Infof(string(kftypes.NAMESPACE)+": %v", namespace)
	_, nsMissingErr := clientset.CoreV1().Namespaces().Get(namespace, metav1.GetOptions{})
	if nsMissingErr != nil {
		log.Infof("Creating namespace: %v", namespace)
		nsSpec := &v1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: namespace}}
		_, nsErr := clientset.CoreV1().Namespaces().Create(nsSpec)
		if nsErr != nil {
			return &kfapis.KfError{
				Code: int(kfapis.INVALID_ARGUMENT),
				Message: fmt.Sprintf("couldn't create %v %v Error: %v",
					string(kftypes.NAMESPACE), namespace, nsErr),
			}
		}
	}
	continuation := func() func(string, schema.GroupKind, map[string]interface{}) {
		componentGroupKindsMap := make(map[string]metav1.GroupKind)
		callback := func(namespace string, sgk schema.GroupKind, obj map[string]interface{}) {
			gk := metav1.GroupKind {
				Kind: sgk.Kind,
				Group: sgk.Group,
			}
			if namespace == kustomize.Namespace {
				switch gk.Kind {
				case kustomize.application.Kind:
					spec := obj["spec"].(map[string]interface{})
					spec["componentGroupKinds"] = kustomize.application.Spec.ComponentGroupKinds
				default:
					encoded := gk.Group + "-" + gk.Kind
					if _, exists := componentGroupKindsMap[encoded]; !exists {
						componentGroupKindsMap[encoded] = gk
						kustomize.application.Spec.ComponentGroupKinds =
							append(kustomize.application.Spec.ComponentGroupKinds, gk)
					}
				}
			}
		}
		return callback
	}

	kustomizeDir := path.Join(kustomize.Spec.AppDir, outputDir)
	for _, compName := range kustomize.Spec.Components {
		kustomizeFile := filepath.Join(kustomizeDir, compName+".yaml")
		if _, err := os.Stat(kustomizeFile); err == nil {
			resourcesErr := kustomize.deployResources(kustomize.restConfig, kustomizeFile, continuation())
			if resourcesErr != nil {
				return &kfapis.KfError{
					Code:    int(kfapis.INTERNAL_ERROR),
					Message: fmt.Sprintf("couldn't create resources from %v Error: %v", kustomizeFile, resourcesErr),
				}
			}
		}
	}
	return nil
}

// TODO COPIED from bootstrap/app/k8sUtil.go. Need to merge.
// CreateResourceFromFile creates resources from a file, just like `kubectl create -f filename`
// We use some libraries in an old way (e.g. the RestMapper is in discovery instead of restmapper)
// because ksonnet (one of our dependency) is using the old library version.
// TODO: it can't handle "kind: list" yet.
func (kustomize *kustomize) deployResources(config *rest.Config, filename string,
	callback func(string, schema.GroupKind, map[string]interface{})) error {
	// Create a restmapper to determine the resource type.
	_discoveryClient, err := discovery.NewDiscoveryClientForConfig(config)
	if err != nil {
		return err
	}
	_cached := cached.NewMemCacheClient(_discoveryClient)
	_cached.Invalidate()
	mapper := restmapper.NewDeferredDiscoveryRESTMapper(_cached)

	data, err := ioutil.ReadFile(filename)
	if err != nil {
		return err
	}
	splitter := regexp.MustCompile(yamlSeparator)
	objects := splitter.Split(string(data), -1)

	var o map[string]interface{}
	for _, object := range objects {
		if err = yaml.Unmarshal([]byte(object), &o); err != nil {
			return err
		}
		a := o["apiVersion"]
		if a == nil {
			log.Warnf("Unknown resource: %v", object)
			continue
		}
		apiVersion := strings.Split(a.(string), "/")
		var group, version string
		if len(apiVersion) == 1 {
			// core v1, no group. e.g. namespace
			group, version = "", apiVersion[0]
		} else {
			group, version = apiVersion[0], apiVersion[1]
		}
		kind := o["kind"].(string)
		gk := schema.GroupKind{
			Group: group,
			Kind:  kind,
		}
		result, err := mapper.RESTMapping(gk, version)
		// result.resource is the resource we need (e.g. pods, services)
		if err != nil {
			return err
		}

		// build config for restClient
		c := rest.CopyConfig(config)
		c.GroupVersion = &schema.GroupVersion{
			Group:   group,
			Version: version,
		}
		c.NegotiatedSerializer = serializer.DirectCodecFactory{CodecFactory: scheme.Codecs}
		if group == "" {
			c.APIPath = "/api"
		} else {
			c.APIPath = "/apis"
		}
		restClient, err := rest.RESTClientFor(c)
		if err != nil {
			return err
		}

		// build the request
		metadata := o["metadata"].(map[string]interface{})
		if metadata["name"] != nil {
			name := metadata["name"].(string)
			log.Infof("creating %v\n", name)

			var namespace string
			if metadata["namespace"] != nil {
				namespace = metadata["namespace"].(string)
			} else {
				namespace = "default"
			}
			if callback != nil {
				callback(namespace, gk, o)
			}
			body, err := json.Marshal(o)
			if err != nil {
				return err
			}
			request := restClient.Post().Resource(result.Resource.Resource).Body(body)
			if result.Scope.Name() == "namespace" {
				request = request.Namespace(namespace)
			}
			result := request.Do()
			if result.Error() != nil {
				return result.Error()
			}
		} else {
			log.Warnf("object with kind %v has no name\n", metadata["kind"])
		}

	}
	return nil
}

func (kustomize *kustomize) deleteGlobalResources() error {
	apiextclientset := kftypesv2.GetApiExtClientset(kustomize.restConfig)
	do := &metav1.DeleteOptions{}
	lo := metav1.ListOptions{
		LabelSelector: kftypes.DefaultAppLabel + "=" + kustomize.Name,
	}
	crdsErr := apiextclientset.CustomResourceDefinitions().DeleteCollection(do, lo)
	if crdsErr != nil {
		return &kfapis.KfError{
			Code:    int(kfapis.INVALID_ARGUMENT),
			Message: fmt.Sprintf("couldn't delete customresourcedefinitions Error: %v", crdsErr),
		}
	}
	clientset := kftypesv2.GetClientset(kustomize.restConfig)
	crbsErr := clientset.RbacV1().ClusterRoleBindings().DeleteCollection(do, lo)
	if crbsErr != nil {
		return &kfapis.KfError{
			Code:    int(kfapis.INVALID_ARGUMENT),
			Message: fmt.Sprintf("couldn't get list of clusterrolebindings Error: %v", crbsErr),
		}
	}
	crsErr := clientset.RbacV1().ClusterRoles().DeleteCollection(do, lo)
	if crsErr != nil {
		return &kfapis.KfError{
			Code:    int(kfapis.INVALID_ARGUMENT),
			Message: fmt.Sprintf("couldn't delete clusterroles Error: %v", crsErr),
		}
	}
	return nil
}

func (kustomize *kustomize) Delete(resources kftypes.ResourceEnum) error {
	if kustomize.restConfig == nil || kustomize.apiConfig == nil {
		return &kfapis.KfError{
			Code:    int(kfapis.INVALID_ARGUMENT),
			Message: "Error: nil restConfig or apiConfig, exit",
		}
	}
	clientset := kftypesv2.GetClientset(kustomize.restConfig)
    kustomize.deleteGlobalResources()
	namespace := kustomize.Namespace
	log.Infof("deleting namespace: %v", namespace)
	ns, nsMissingErr := clientset.CoreV1().Namespaces().Get(namespace, metav1.GetOptions{})
	if nsMissingErr == nil {
		nsErr := clientset.CoreV1().Namespaces().Delete(ns.Name, metav1.NewDeleteOptions(int64(100)))
		if nsErr != nil {
			return &kfapis.KfError{
				Code:    int(kfapis.INVALID_ARGUMENT),
				Message: fmt.Sprintf("couldn't delete namespace %v Error: %v", namespace, nsErr),
			}
		}
	}
	return nil
}

func (kustomize *kustomize) Generate(resources kftypes.ResourceEnum) error {
	generate := func() error {
		updateParamFilesErr := kustomize.updateParamFiles()
		if updateParamFilesErr != nil {
			return updateParamFilesErr
		}
		kustomizeDir := path.Join(kustomize.Spec.AppDir, outputDir)
		kustomizeDirErr := os.Mkdir(kustomizeDir, os.ModePerm)
		if kustomizeDirErr != nil {
			log.Fatalf("couldn't create directory %v Error %v", kustomizeDir, kustomizeDirErr)
		}
		for _, compName := range kustomize.Spec.Components {
			if compPath, ok := kustomize.componentMap[compName]; ok {
				writeKustomizationFileErr := kustomize.writeKustomizationFile(compPath)
				if writeKustomizationFileErr != nil {
					return writeKustomizationFileErr
				}
				_loader, loaderErr := loader.NewLoader(kustomize.Spec.ManifestsRepo, kustomize.fsys)
				if loaderErr != nil {
					return fmt.Errorf("could not load kustomize loader: %v", loaderErr)
				}
				defer _loader.Cleanup()
				kt, err := target.NewKustTarget(_loader, kustomize.factory.ResmapF, kustomize.factory.TransformerF)
				if err != nil {
					return err
				}
				allResources, err := kt.MakeCustomizedResMap()
				if err != nil {
					return err
				}
				// Output the objects.
				res, err := allResources.EncodeAsYaml()
				if err != nil {
					return err
				}
				kustomizeFile := filepath.Join(kustomizeDir, compName+".yaml")
				kustomizeFileErr := kustomize.fsys.WriteFile(kustomizeFile, res)
				if kustomizeFileErr != nil {
					return kustomizeFileErr
				}
			}
		}

		return nil
	}

	switch resources {
	case kftypes.PLATFORM:
	case kftypes.ALL:
		fallthrough
	case kftypes.K8S:
		generateErr := generate()
		if generateErr != nil {
			return fmt.Errorf("kustomize generate failed Error: %v", generateErr)
		}
	}
	return nil
}

func (kustomize *kustomize) Init(resources kftypes.ResourceEnum) error {
	parts := strings.Split(kustomize.Spec.PackageManager, "@")
	version := "master"
	if len(parts) == 2 {
		version = parts[1]
	}
	cacheDir, cacheDirErr := kftypes.DownloadToCache(kustomize.Spec.AppDir, kftypes.ManifestsRepo, version)
	if cacheDirErr != nil || cacheDir == "" {
		log.Fatalf("could not download repo to cache Error %v", cacheDirErr)
	}
	kustomize.Spec.ManifestsRepo = cacheDir
	createConfigErr := kustomize.writeConfigFile()
	if createConfigErr != nil {
		return fmt.Errorf("cannot create config file app.yaml in %v", kustomize.Spec.AppDir)
	}
	return nil
}

func (kustomize *kustomize) mapDirs(dirPath string, root bool, leafMap map[string]string) map[string]string {
	files, err := ioutil.ReadDir(dirPath)
	if err != nil {
		return leafMap
	}
	hasDir := false
	for _, f := range files {
		if f.IsDir() {
			hasDir = true
			leafDir := path.Join(dirPath, f.Name())
			kustomize.mapDirs(leafDir, false, leafMap)
		}
	}
	if !hasDir && !root {
		componentPath := extractSuffix(kustomize.Spec.ManifestsRepo, dirPath)
		packageName := strings.Split(componentPath, "/")[0]
		if components, exists := kustomize.packageMap[packageName]; exists {
			leafMap[path.Base(dirPath)] = componentPath
			components = append(components, componentPath)
		}
	}
	return leafMap
}

func (kustomize *kustomize) writeConfigFile() error {
	buf, bufErr := yaml.Marshal(kustomize)
	if bufErr != nil {
		return bufErr
	}
	cfgFilePath := filepath.Join(kustomize.Spec.AppDir, kftypes.KfConfigFile)
	cfgFilePathErr := ioutil.WriteFile(cfgFilePath, buf, 0644)
	if cfgFilePathErr != nil {
		return cfgFilePathErr
	}
	return nil
}

func (kustomize *kustomize) writeKustomizationFile(compPath string) error {
	bases := []string{compPath}
	kustomization := &types.Kustomization{
		TypeMeta: types.TypeMeta{
			Kind: types.KustomizationKind,
			APIVersion: types.KustomizationVersion,
		},
		Bases: bases,
		CommonLabels: map[string]string{
			kftypes.DefaultAppLabel: kustomize.Name,
		},
		Namespace: kustomize.Namespace,
	}
	buf, bufErr := yaml.Marshal(kustomization)
	if bufErr != nil {
		return bufErr
	}
	cfgFilePath := filepath.Join(kustomize.Spec.ManifestsRepo, kftypes.KustomizationFile)
	cfgFilePathErr := ioutil.WriteFile(cfgFilePath, buf, 0644)
	if cfgFilePathErr != nil {
		return cfgFilePathErr
	}
	return nil
}

func (kustomize *kustomize) updateParamFiles() error {
	for _, compName := range kustomize.Spec.Components {
		if val, ok := kustomize.Spec.ComponentParams[compName]; ok {
			paramMap := make(map[string]string)
			for _, nv := range val {
				paramMap[nv.Name] = nv.Value
			}
			compDir := kustomize.componentMap[compName]
			paramFile := filepath.Join(path.Join(kustomize.Spec.ManifestsRepo, compDir), kftypes.KustomizationParamFile)
			if _, err := os.Stat(paramFile); err == nil {
				params, paramFileErr := readLines(paramFile)
				if paramFileErr != nil {
					return &kfapis.KfError{
						Code:    int(kfapis.INVALID_ARGUMENT),
						Message: fmt.Sprintf("could not open %v. Error: %v", paramFile, paramFileErr),
					}
				}
				for i, param := range params {
					paramName := strings.Split(param, "=")[0]
					if val, ok := paramMap[paramName]; ok {
						params[i] = paramName + "=" + val
					}
				}
				paramFileErr = writeLines(params, paramFile)
				if paramFileErr != nil {
					return &kfapis.KfError{
						Code:    int(kfapis.INTERNAL_ERROR),
						Message: fmt.Sprintf("could not update %v. Error: %v", paramFile, paramFileErr),
					}
				}
			}
		}
	}
	return nil
}

func readLines(path string) ([]string, error) {
	var file, err = os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var lines []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	return lines, scanner.Err()
}

// writeLines writes the lines to the given file.
func writeLines(lines []string, path string) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	w := bufio.NewWriter(file)
	for _, line := range lines {
		fmt.Fprintln(w, line)
	}
	return w.Flush()
}

func extractSuffix(dirPath string, subDirPath string) string {
	suffix := strings.TrimPrefix(subDirPath, dirPath)[1:]
	return suffix
}
