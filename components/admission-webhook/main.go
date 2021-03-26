/*
Copyright 2018 The Kubernetes Authors.

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
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"net/http"
	"reflect"
	"strings"

	settingsapi "github.com/kubeflow/kubeflow/components/admission-webhook/pkg/apis/settings/v1alpha1"
	"github.com/mattbaird/jsonpatch"
	"k8s.io/api/admission/v1beta1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	utilerrors "k8s.io/apimachinery/pkg/util/errors"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/klog"
)

const (
	annotationPrefix = "poddefault.admission.kubeflow.org"
)

// Config contains the server (the webhook) cert and key.
type Config struct {
	CertFile string
	KeyFile  string
}

func (c *Config) addFlags() {
	flag.StringVar(&c.CertFile, "tls-cert-file", c.CertFile, ""+
		"File containing the default x509 Certificate for HTTPS. (CA cert, if any, concatenated "+
		"after server cert).")
	flag.StringVar(&c.KeyFile, "tls-private-key-file", c.KeyFile, ""+
		"File containing the default x509 private key matching --tls-cert-file.")
}

func toAdmissionResponse(err error) *v1beta1.AdmissionResponse {
	return &v1beta1.AdmissionResponse{
		Result: &metav1.Status{
			Message: err.Error(),
		},
	}
}

func filterPodDefaults(list []settingsapi.PodDefault, pod *corev1.Pod) ([]*settingsapi.PodDefault, error) {
	var matchingPDs []*settingsapi.PodDefault

	for _, pd := range list {
		selector, err := metav1.LabelSelectorAsSelector(&pd.Spec.Selector)
		if err != nil {
			return nil, fmt.Errorf("label selector conversion failed: %v for selector: %v", pd.Spec.Selector, err)
		}

		// check if the pod labels match the selector
		if !selector.Matches(labels.Set(pod.Labels)) {
			klog.V(6).Infof("PodDefault '%s' does NOT match pod '%s' labels", pd.GetName(), pod.GetName())
			continue
		}
		// check if the pod namespace match the poddefault's namespace
		if pd.GetNamespace() != pod.GetNamespace() {
			klog.Infof("PodDefault '%s' is not in the namespcae of pod '%s' ", pd.GetName(), pod.GetName())
			continue
		}
		klog.V(4).Infof("PodDefault '%s' matches pod '%s' labels", pd.GetName(), pod.GetName())
		// create pointer to a non-loop variable
		newPD := pd
		matchingPDs = append(matchingPDs, &newPD)
	}
	return matchingPDs, nil
}

// safeToApplyPodDefaultsOnPod determines if there is any conflict in information
// injected by given PodDefaults in the Pod.
func safeToApplyPodDefaultsOnPod(pod *corev1.Pod, podDefaults []*settingsapi.PodDefault) error {
	var errs []error

	// volumes attribute is defined at the Pod level, so determine if volumes
	// injection is causing any conflict.
	if _, err := mergeVolumes(pod.Spec.Volumes, podDefaults); err != nil {
		errs = append(errs, err)
	}

	if _, err := mergeTolerations(pod.Spec.Tolerations, podDefaults); err != nil {
		errs = append(errs, err)
	}

	for _, ctr := range pod.Spec.Containers {
		if err := safeToApplyPodDefaultsOnContainer(&ctr, podDefaults); err != nil {
			errs = append(errs, err)
		}
	}

	var (
		defaultAnnotations = make([]*map[string]string, len(podDefaults))
		defaultLabels      = make([]*map[string]string, len(podDefaults))
	)
	for i, pd := range podDefaults {
		defaultAnnotations[i] = &pd.Spec.Annotations
		defaultLabels[i] = &pd.Spec.Labels
	}
	if _, err := mergeMap(pod.Annotations, defaultAnnotations); err != nil {
		errs = append(errs, err)
	}
	if _, err := mergeMap(pod.Labels, defaultLabels); err != nil {
		errs = append(errs, err)
	}
	return utilerrors.NewAggregate(errs)
}

// safeToApplyPodDefaultsOnContainer determines if there is any conflict in
// information injected by given PodDefaults in the given container.
func safeToApplyPodDefaultsOnContainer(ctr *corev1.Container, podDefaults []*settingsapi.PodDefault) error {
	var errs []error
	// check if it is safe to merge env vars and volume mounts from given poddefaults and
	// container's existing env vars.
	if _, err := mergeEnv(ctr.Env, podDefaults); err != nil {
		errs = append(errs, err)
	}
	if _, err := mergeVolumeMounts(ctr.VolumeMounts, podDefaults); err != nil {
		errs = append(errs, err)
	}

	return utilerrors.NewAggregate(errs)
}

// mergeEnv merges a list of env vars with the env vars injected by given list podDefaults.
// It returns an error if it detects any conflict during the merge.
func mergeEnv(envVars []corev1.EnvVar, podDefaults []*settingsapi.PodDefault) ([]corev1.EnvVar, error) {
	origEnv := map[string]corev1.EnvVar{}
	for _, v := range envVars {
		origEnv[v.Name] = v
	}

	mergedEnv := make([]corev1.EnvVar, len(envVars))
	copy(mergedEnv, envVars)

	var errs []error

	for _, pd := range podDefaults {
		for _, v := range pd.Spec.Env {
			found, ok := origEnv[v.Name]
			if !ok {
				// if we don't already have it append it and continue
				origEnv[v.Name] = v
				mergedEnv = append(mergedEnv, v)
				continue
			}

			// make sure they are identical or throw an error
			if !reflect.DeepEqual(found, v) {
				errs = append(errs, fmt.Errorf("merging env for %s has a conflict on %s: \n%#v\ndoes not match\n%#v\n in container", pd.GetName(), v.Name, v, found))
			}
		}
	}

	err := utilerrors.NewAggregate(errs)
	if err != nil {
		klog.Error(err)
		return nil, err
	}

	return mergedEnv, err
}

func mergeEnvFrom(envSources []corev1.EnvFromSource, podDefaults []*settingsapi.PodDefault) ([]corev1.EnvFromSource, error) {
	var mergedEnvFrom []corev1.EnvFromSource

	mergedEnvFrom = append(mergedEnvFrom, envSources...)
	for _, pd := range podDefaults {
		mergedEnvFrom = append(mergedEnvFrom, pd.Spec.EnvFrom...)
	}

	return mergedEnvFrom, nil
}

// mergeVolumeMounts merges given list of VolumeMounts with the volumeMounts
// injected by given podDefaults. It returns an error if it detects any conflict during the merge.
func mergeVolumeMounts(volumeMounts []corev1.VolumeMount, podDefaults []*settingsapi.PodDefault) ([]corev1.VolumeMount, error) {

	origVolumeMounts := map[string]corev1.VolumeMount{}
	volumeMountsByPath := map[string]corev1.VolumeMount{}
	for _, v := range volumeMounts {
		origVolumeMounts[v.Name] = v
		volumeMountsByPath[v.MountPath] = v
	}

	mergedVolumeMounts := make([]corev1.VolumeMount, len(volumeMounts))
	copy(mergedVolumeMounts, volumeMounts)

	var errs []error

	for _, pd := range podDefaults {
		for _, v := range pd.Spec.VolumeMounts {
			found, ok := origVolumeMounts[v.Name]
			if !ok {
				// if we don't already have it append it and continue
				origVolumeMounts[v.Name] = v
				mergedVolumeMounts = append(mergedVolumeMounts, v)

			} else {
				// make sure they are identical or throw an error
				// shall we throw an error for identical volumeMounts ?
				if !reflect.DeepEqual(found, v) {
					errs = append(errs, fmt.Errorf("merging volume mounts for %s has a conflict on %s: \n%#v\ndoes not match\n%#v\n in container", pd.GetName(), v.Name, v, found))
				}
			}

			found, ok = volumeMountsByPath[v.MountPath]
			if !ok {
				// if we don't already have it append it and continue
				volumeMountsByPath[v.MountPath] = v

			} else {
				// make sure they are identical or throw an error
				if !reflect.DeepEqual(found, v) {
					errs = append(errs, fmt.Errorf("merging volume mounts for %s has a conflict on mount path %s: \n%#v\ndoes not match\n%#v\n in container", pd.GetName(), v.MountPath, v, found))
				}
			}
		}
	}

	err := utilerrors.NewAggregate(errs)
	if err != nil {
		klog.Error(err)
		return nil, err
	}

	return mergedVolumeMounts, err
}

// mergeVolumes merges given list of Volumes with the volumes injected by given
// podDefaults. It returns an error if it detects any conflict during the merge.
func mergeVolumes(volumes []corev1.Volume, podDefaults []*settingsapi.PodDefault) ([]corev1.Volume, error) {
	origVolumes := map[string]corev1.Volume{}
	for _, v := range volumes {
		origVolumes[v.Name] = v
	}

	mergedVolumes := make([]corev1.Volume, len(volumes))
	copy(mergedVolumes, volumes)

	var errs []error

	for _, pd := range podDefaults {
		for _, v := range pd.Spec.Volumes {
			found, ok := origVolumes[v.Name]
			if !ok {
				// if we don't already have it append it and continue
				origVolumes[v.Name] = v
				mergedVolumes = append(mergedVolumes, v)
				continue
			}

			// make sure they are identical or throw an error
			if !reflect.DeepEqual(found, v) {
				errs = append(errs, fmt.Errorf("merging volumes for %s has a conflict on %s: \n%#v\ndoes not match\n%#v\n in container", pd.GetName(), v.Name, v, found))
			}
		}
	}

	err := utilerrors.NewAggregate(errs)
	if err != nil {
		klog.Error(err)
		return nil, err
	}

	if len(mergedVolumes) == 0 {
		return nil, nil
	}

	return mergedVolumes, err
}

// mergeTolerations merges given list of Tolerations with the tolerations injected by given
// podDefaults. It returns an error if it detects any conflict during the merge.
func mergeTolerations(tolerations []corev1.Toleration, podDefaults []*settingsapi.PodDefault) ([]corev1.Toleration, error) {
	origTolerations := map[string]corev1.Toleration{}
	for _, t := range tolerations {
		origTolerations[t.Key] = t
	}

	mergedTolerations := make([]corev1.Toleration, len(tolerations))
	copy(mergedTolerations, tolerations)

	var errs []error

	for _, pd := range podDefaults {
		for _, t := range pd.Spec.Tolerations {
			found, ok := origTolerations[t.Key]
			if !ok {
				// if we don't already have it append it and continue
				origTolerations[t.Key] = t
				mergedTolerations = append(mergedTolerations, t)
				continue
			}

			// make sure they are identical or throw an error
			if !reflect.DeepEqual(found, t) {
				errs = append(errs, fmt.Errorf("merging tolerations for %s has a conflict on %s: \n%#v\ndoes not match\n%#v\n in container", pd.GetName(), t.Key, t, found))
			}
		}
	}

	err := utilerrors.NewAggregate(errs)
	if err != nil {
		klog.Error(err)
		return nil, err
	}

	if len(mergedTolerations) == 0 {
		return nil, nil
	}

	return mergedTolerations, err
}

// mergeMap copies the existing map and adds the keys in defaults. It returns
// an error if it detects any conflict during the merge.
func mergeMap(existing map[string]string, defaults []*map[string]string) (map[string]string, error) {
	var (
		out  = map[string]string{}
		errs []error
	)
	for k, v := range existing {
		out[k] = v
	}
	for _, def := range defaults {
		for k, v := range *def {
			ov, ok := out[k]
			if !ok {
				out[k] = v
				continue
			}
			if ov != v {
				errs = append(errs, fmt.Errorf("merging has conflict on %s: \n%#v\ndoes not match\n%#v\n in pod", k, v, ov))
			}
		}
	}
	return out, utilerrors.NewAggregate(errs)
}

// applyPodDefaultsOnPod updates the PodSpec with merged information from all the
// applicable PodDefaults. It ignores the errors of merge functions because merge
// errors have already been checked in safeToApplyPodDefaultsOnPod function.
func applyPodDefaultsOnPod(pod *corev1.Pod, podDefaults []*settingsapi.PodDefault) {
	klog.Info(fmt.Sprintf("mutating pod: %s", pod.ObjectMeta.Name))

	if len(podDefaults) == 0 {
		return
	}

	volumes, err := mergeVolumes(pod.Spec.Volumes, podDefaults)
	if err != nil {
		klog.Error(err)
	}
	pod.Spec.Volumes = volumes

	tolerations, err := mergeTolerations(pod.Spec.Tolerations, podDefaults)
	if err != nil {
		klog.Error(err)
	}
	pod.Spec.Tolerations = tolerations

	var (
		defaultAnnotations = make([]*map[string]string, len(podDefaults))
		defaultLabels      = make([]*map[string]string, len(podDefaults))
	)
	for i, pd := range podDefaults {
		defaultAnnotations[i] = &pd.Spec.Annotations
		defaultLabels[i] = &pd.Spec.Labels
	}
	annotations, err := mergeMap(pod.Annotations, defaultAnnotations)
	if err != nil {
		klog.Error(err)
	}
	pod.ObjectMeta.Annotations = annotations

	labels, err := mergeMap(pod.Labels, defaultLabels)
	if err != nil {
		klog.Error(err)
	}
	pod.ObjectMeta.Labels = labels

	for i, ctr := range pod.Spec.Containers {
		applyPodDefaultsOnContainer(&ctr, podDefaults)
		pod.Spec.Containers[i] = ctr
	}

	if pod.ObjectMeta.Annotations == nil {
		pod.ObjectMeta.Annotations = map[string]string{}
	}

	// add annotation information to mark poddefault mutation has occurred
	for _, pd := range podDefaults {
		pod.ObjectMeta.Annotations[fmt.Sprintf("%s/poddefault-%s", annotationPrefix, pd.GetName())] = pd.GetResourceVersion()
	}
}

// applyPodDefaultsOnContainer injects envVars, VolumeMounts and envFrom from
// given podDefaults in to the given container. It ignores conflict errors
// because it assumes those have been checked already by the caller.
func applyPodDefaultsOnContainer(ctr *corev1.Container, podDefaults []*settingsapi.PodDefault) {
	envVars, _ := mergeEnv(ctr.Env, podDefaults)

	ctr.Env = envVars

	volumeMounts, err := mergeVolumeMounts(ctr.VolumeMounts, podDefaults)
	if err != nil {
		klog.Error(err)
	}
	ctr.VolumeMounts = volumeMounts
	envFrom, err := mergeEnvFrom(ctr.EnvFrom, podDefaults)
	if err != nil {
		klog.Error(err)
	}
	ctr.EnvFrom = envFrom
}

func mutatePods(ar v1beta1.AdmissionReview) *v1beta1.AdmissionResponse {
	klog.Info("Entering mutatePods in mutating webhook")
	podResource := metav1.GroupVersionResource{Group: "", Version: "v1", Resource: "pods"}
	if ar.Request.Resource != podResource {
		klog.Errorf("expect resource to be %s", podResource)
		return nil
	}

	raw := ar.Request.Object.Raw
	pod := corev1.Pod{}
	deserializer := codecs.UniversalDeserializer()
	if _, _, err := deserializer.Decode(raw, nil, &pod); err != nil {
		klog.Error(err)
		return toAdmissionResponse(err)
	}
	reviewResponse := v1beta1.AdmissionResponse{}
	reviewResponse.Allowed = true
	podCopy := pod.DeepCopy()
	klog.V(1).Infof("Examining pod: %v\n", pod.GetName())

	// Ignore if exclusion annotation is present
	if podAnnotations := pod.GetAnnotations(); podAnnotations != nil {
		klog.Info(fmt.Sprintf("Looking at pod annotations, found: %v", podAnnotations))
		if podAnnotations[fmt.Sprintf("%s/exclude", annotationPrefix)] == "true" {
			return &reviewResponse
		}
		if _, isMirrorPod := podAnnotations[corev1.MirrorPodAnnotationKey]; isMirrorPod {
			return &reviewResponse
		}
	}

	crdclient := getCrdClient()
	list := &settingsapi.PodDefaultList{}
	err := crdclient.List(context.TODO(), &client.ListOptions{Namespace: pod.Namespace}, list)
	if meta.IsNoMatchError(err) {
		klog.Errorf("%v (has the CRD been loaded?)", err)
		return toAdmissionResponse(err)
	} else if err != nil {
		klog.Errorf("error fetching poddefaults: %v", err)
		return toAdmissionResponse(err)
	}

	klog.Info(fmt.Sprintf("fetched %d poddefault(s) in namespace %s", len(list.Items), pod.Namespace))
	if len(list.Items) == 0 {
		klog.V(5).Infof("No pod defaults created, so skipping pod %v", pod.Name)
		return &reviewResponse
	}

	matchingPDs, err := filterPodDefaults(list.Items, &pod)
	if err != nil {
		klog.Errorf("filtering pod defaults failed: %v", err)
		return toAdmissionResponse(err)
	}

	if len(matchingPDs) == 0 {
		klog.V(5).Infof("No matching pod defaults, so skipping pod %v", pod.Name)
		return &reviewResponse
	}
	klog.Infof("%d matching pod defaults, for pod %v", len(matchingPDs), pod.Name)
	defaultNames := make([]string, len(matchingPDs))
	for i, pd := range matchingPDs {
		defaultNames[i] = pd.GetName()
	}

	klog.Info(fmt.Sprintf("Matching PD detected of count %v, patching spec", len(matchingPDs)))

	// detect merge conflict
	err = safeToApplyPodDefaultsOnPod(&pod, matchingPDs)
	if err != nil {
		// conflict, ignore the error, but raise an event
		msg := fmt.Errorf("conflict occurred while applying poddefaults: %s on pod: %v err: %v",
			strings.Join(defaultNames, ","), pod.GetName(), err)
		klog.Warning(msg)
		return toAdmissionResponse(msg)
	}

	applyPodDefaultsOnPod(&pod, matchingPDs)

	klog.Infof("applied poddefaults: %s successfully on Pod: %+v ", strings.Join(defaultNames, ","), pod.GetName())

	podCopyJSON, err := json.Marshal(podCopy)
	if err != nil {
		return toAdmissionResponse(err)
	}
	podJSON, err := json.Marshal(pod)
	if err != nil {
		return toAdmissionResponse(err)
	}
	jsonPatch, err := jsonpatch.CreatePatch(podCopyJSON, podJSON)
	if err != nil {
		return toAdmissionResponse(err)
	}
	jsonPatchBytes, _ := json.Marshal(jsonPatch)

	reviewResponse.Patch = jsonPatchBytes
	pt := v1beta1.PatchTypeJSONPatch
	reviewResponse.PatchType = &pt

	return &reviewResponse
}

type admitFunc func(v1beta1.AdmissionReview) *v1beta1.AdmissionResponse

func serve(w http.ResponseWriter, r *http.Request, admit admitFunc) {
	var body []byte
	if r.Body != nil {
		if data, err := ioutil.ReadAll(r.Body); err == nil {
			body = data
		}
	}

	// verify the content type is accurate
	contentType := r.Header.Get("Content-Type")
	if contentType != "application/json" {
		klog.Errorf("contentType=%s, expect application/json", contentType)
		return
	}

	var reviewResponse *v1beta1.AdmissionResponse
	ar := v1beta1.AdmissionReview{}
	deserializer := codecs.UniversalDeserializer()
	if _, _, err := deserializer.Decode(body, nil, &ar); err != nil {
		klog.Error(err)
		reviewResponse = toAdmissionResponse(err)
	} else {
		reviewResponse = admit(ar)
	}

	response := v1beta1.AdmissionReview{}
	if reviewResponse != nil {
		response.Response = reviewResponse
		response.Response.UID = ar.Request.UID
	}
	// reset the Object and OldObject, they are not needed in a response.
	ar.Request.Object = runtime.RawExtension{}
	ar.Request.OldObject = runtime.RawExtension{}

	resp, err := json.Marshal(response)
	if err != nil {
		klog.Error(err)
	}
	if _, err := w.Write(resp); err != nil {
		klog.Error(err)
	}
}

func serveMutatePods(w http.ResponseWriter, r *http.Request) {
	serve(w, r, mutatePods)
}

func main() {
	var config Config
	flag.StringVar(&config.CertFile, "tlsCertFile", "/etc/webhook/certs/cert.pem", "File containing the x509 Certificate for HTTPS.")
	flag.StringVar(&config.KeyFile, "tlsKeyFile", "/etc/webhook/certs/key.pem", "File containing the x509 private key to --tlsCertFile.")
	flag.Parse()
	klog.InitFlags(nil)

	http.HandleFunc("/apply-poddefault", serveMutatePods)

	server := &http.Server{
		Addr:      ":4443",
		TLSConfig: configTLS(config),
	}
	klog.Info(fmt.Sprintf("About to start serving webhooks: %#v", server))
	server.ListenAndServeTLS("", "")
}
