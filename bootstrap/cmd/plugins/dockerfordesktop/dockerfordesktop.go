package main

import (
	kftypes "github.com/kubeflow/kubeflow/bootstrap/v2/pkg/apis/apps"
	cltypes "github.com/kubeflow/kubeflow/bootstrap/v2/pkg/apis/apps/kfdef/v1alpha1"
	"github.com/kubeflow/kubeflow/bootstrap/v2/pkg/kfapp/dockerfordesktop"
)

func GetKfApp(client *cltypes.KfDef) kftypes.KfApp {
	return dockerfordesktop.GetKfApp(client)
}
