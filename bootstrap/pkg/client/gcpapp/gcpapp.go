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

package gcpapp

import (
	"fmt"
	kftypes "github.com/kubeflow/kubeflow/bootstrap/pkg/apis/apps"
	"github.com/kubeflow/kubeflow/bootstrap/pkg/client/ksapp"
	"reflect"
)

// GcpApp implements KfApp Interface
// It includes the KsApp along with additional Gcp types
type GcpApp struct {
	ksApp kftypes.KfApp
	//TODO add additional types required for gcp platform
}

func GetKfApp(options map[string]interface{}) kftypes.KfApp {
	_gcpapp := &GcpApp{
		ksApp: ksapp.GetKfApp(options),
	}
	for k, v := range options {
		x := reflect.ValueOf(_gcpapp.ksApp).Elem().FieldByName(k)
		x.Set(reflect.ValueOf(v))
	}
	return _gcpapp
}

func (gcpApp *GcpApp) writeConfigFile() error {
	//TODO write files under gcp_config, k8s_specs
	return nil
}

func (gcpApp *GcpApp) Apply() error {
	ksApplyErr := gcpApp.ksApp.Apply()
	if ksApplyErr != nil {
		return fmt.Errorf("gcp apply failed for ksapp: %v", ksApplyErr)
	}
	return nil
}

func (gcpApp *GcpApp) Delete() error {
	return nil
}

func (gcpApp *GcpApp) Generate(resources kftypes.ResourceEnum) error {
	ksGenerateErr := gcpApp.ksApp.Generate(resources)
	if ksGenerateErr != nil {
		return fmt.Errorf("gcp generate failed for ksapp: %v", ksGenerateErr)
	}
	return nil
}

func (gcpApp *GcpApp) Init() error {
	ksInitErr := gcpApp.ksApp.Init()
	if ksInitErr != nil {
		return fmt.Errorf("gcp init failed for ksapp: %v", ksInitErr)
	}
	return nil
}
