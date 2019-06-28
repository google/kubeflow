package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	log "github.com/golang/glog"
	"github.com/kubeflow/kubeflow/bootstrap/cmd/bootstrap/app"
	"github.com/kubeflow/kubeflow/bootstrap/pkg/kfapp/gcp"
	kfdefsv2 "github.com/kubeflow/kubeflow/bootstrap/v2/pkg/apis/apps/kfdef/v1alpha1"
	"github.com/pkg/errors"
	"golang.org/x/oauth2"
	// log "github.com/sirupsen/logrus"
	"golang.org/x/oauth2/google"
	dm "google.golang.org/api/deploymentmanager/v2"
)

func init() {
	// Add filename as one of the fields of the structured log message
	//filenameHook := filename.NewHook()
	//filenameHook.Field = "filename"
	//log.AddHook(filenameHook)
}

// ServerOption is the main context object for the controller manager.
type ServerOption struct {
	Project  string
	Name     string
	Config   string
	Endpoint string
}

// NewServerOption creates a new CMServer with a default config.
func NewServerOption() *ServerOption {
	s := ServerOption{}
	return &s
}

// AddFlags adds flags for a specific Server to the specified FlagSet
func (s *ServerOption) AddFlags(fs *flag.FlagSet) {

	fs.StringVar(&s.Config, "config", "", "Path to a YAML file describing an app to create on startup.")
	fs.StringVar(&s.Name, "name", "", "Name for the deployment.")
	fs.StringVar(&s.Project, "project", "", "Project.")
	fs.StringVar(&s.Endpoint, "endpoint", "", "The endpoint e.g. http://localhost:8080.")

}

func checkAccess(project string, token string) {
	// Verify that user has access. We shouldn't do any processing until verifying access.
	ts := oauth2.StaticTokenSource(&oauth2.Token{
		AccessToken: token,
	})

	isValid, err := app.CheckProjectAccess(project, ts)

	if err != nil || !isValid {
		log.Fatalf("CheckProjectAccess failed; error %v", err)
	}

	log.Infof("You have access to project %v", project)
}
func run(opt *ServerOption) error {
	if opt.Name == "" {
		return fmt.Errorf("--name is required.")
	}
	d, err := kfdefsv2.LoadKFDefFromURI(opt.Config)

	if err != nil {
		return errors.WithStack(err)
	}

	d.Spec.Project = opt.Project
	d.Name = opt.Name

	fmt.Printf("Connecting to server: %v", opt.Endpoint)
	c, err := app.NewKfctlClient(opt.Endpoint)

	if err != nil {
		log.Errorf("There was a problem connecting to the server %+v", err)
		return err
	}

	ts, err := google.DefaultTokenSource(context.Background(), dm.CloudPlatformScope)

	if err != nil {
		return err
	}

	token, err := ts.Token()

	if err != nil {
		return err
	}

	d.SetSecret(kfdefsv2.Secret{
		Name: gcp.GcpAccessTokenName,
		SecretSource: &kfdefsv2.SecretSource{
			LiteralSource: &kfdefsv2.LiteralSource{
				Value: token.AccessToken,
			},
		},
	})

	pKfDef, _ := Pformat(d)

	fmt.Printf("Spec to create:\n%v", pKfDef)

	checkAccess(opt.Project, token.AccessToken)

	ctx := context.Background()
	res, err := c.CreateDeployment(ctx, *d)

	if err != nil {
		log.Errorf("CreateDeployment failed; error %v", err)
		return err
	}

	pResult, _ := Pformat(res)
	log.Infof("Create succedeed. Result:\n%v", pResult)
	return nil
}

// Pformat returns a pretty format output of any value.
func Pformat(value interface{}) (string, error) {
	if s, ok := value.(string); ok {
		return s, nil
	}
	valueJson, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return "", err
	}
	return string(valueJson), nil
}

func main() {
	s := NewServerOption()
	s.AddFlags(flag.CommandLine)

	flag.Parse()

	err := run(s)

	if err != nil {
		log.Errorf("Create deployment failed; error %v", err)
	}
}