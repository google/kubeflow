package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"strings"

	awssdk "github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/iam"
	"github.com/go-logr/logr"
	profilev1 "github.com/kubeflow/kubeflow/components/profile-controller/api/v1"
	"github.com/tidwall/gjson"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/types"
)

const (
	// plugin kind
	KIND_AWS_IAM_FOR_SERVICE_ACCOUNT = "AwsIamForServiceAccount"
	AWS_ANNOTATION_KEY               = "eks.amazonaws.com/role-arn"
	AWS_TRUST_IDENTITY_SUBJECT       = "system:serviceaccount:%s:%s"
	AWS_DEFAULT_AUDIENCE             = "sts.amazonaws.com"
)

type AwsIAMForServiceAccount struct {
	AwsIAMRole string `json:"awsIamRole,omitempty"`
}

// ApplyPlugin annotate service account with the ARN of the IAM role and update trust relationship of IAM role
func (aws *AwsIAMForServiceAccount) ApplyPlugin(r *ProfileReconciler, profile *profilev1.Profile) error {
	logger := r.Log.WithValues("profile", profile.Name)
	if err := aws.patchAnnotation(r, profile.Name, DEFAULT_EDITOR, addIAMRoleAnnotation, logger); err != nil {
		return err
	}
	logger.Info("Setting up iam roles and policy for service account.", "ServiceAccount", aws.AwsIAMRole)
	return aws.updateIAMForServiceAccount(profile.Name, DEFAULT_EDITOR, addServiceAccountInAssumeRolePolicy)
}

// RevokePlugin remove role in service account annotation and delete service account record in IAM trust relationship.
func (aws *AwsIAMForServiceAccount) RevokePlugin(r *ProfileReconciler, profile *profilev1.Profile) error {
	logger := r.Log.WithValues("profile", profile.Name)
	if err := aws.patchAnnotation(r, profile.Name, DEFAULT_EDITOR, removeIAMRoleAnnotation, logger); err != nil {
		return err
	}
	logger.Info("Clean up AWS IAM Role for Service Account.", "ServiceAccount", aws.AwsIAMRole)
	return aws.updateIAMForServiceAccount(profile.Name, DEFAULT_EDITOR, removeServiceAccountInAssumeRolePolicy)
}

// patchAnnotation will patch annotation to k8s service account in order to pair up with GCP identity
func (aws *AwsIAMForServiceAccount) patchAnnotation(r *ProfileReconciler, namespace string, ksa string, annotationFunc func(*corev1.ServiceAccount, string), logger logr.Logger) error {
	ctx := context.Background()
	found := &corev1.ServiceAccount{}
	err := r.Get(ctx, types.NamespacedName{Name: ksa, Namespace: namespace}, found)
	if err != nil {
		return err
	}

	annotationFunc(found, aws.AwsIAMRole)
	logger.Info("Patch Annotation for service account: ", "namespace ", namespace, "name ", ksa)
	return r.Update(ctx, found)
}

// updateIAMForServiceAccount update AWS IAM Roles trust relationship with namespace and service account
func (aws *AwsIAMForServiceAccount) updateIAMForServiceAccount(serviceAccountNamespace, serviceAccountName string, updateAssumeRolePolicy func(string, string, string) (string, error)) error {
	sess, err := session.NewSession()
	if err != nil {
		return fmt.Errorf("error getting AWS session while retrieving region: %v", err)
	}
	svc := iam.New(sess)
	roleName := getIAMRoleNameFromIAMRoleArn(aws.AwsIAMRole)
	roleInput := &iam.GetRoleInput{
		RoleName: awssdk.String(roleName),
	}

	output, err := svc.GetRole(roleInput)
	if err != nil {
		return err
	}

	// Seems AssumeRolePolicyDocument is URL encoded
	decodeValue, err := url.QueryUnescape(awssdk.StringValue(output.Role.AssumeRolePolicyDocument))
	if err != nil {
		return err
	}

	updatedRolePolicy, err := updateAssumeRolePolicy(decodeValue, serviceAccountNamespace, serviceAccountName)
	if err != nil {
		if _, ok := err.(*ConditionExistError); ok {
			// we just skip role update here
			return nil
		}
	}

	input := &iam.UpdateAssumeRolePolicyInput{
		RoleName:       awssdk.String(roleName),
		PolicyDocument: awssdk.String(updatedRolePolicy),
	}
	if _, err = svc.UpdateAssumeRolePolicy(input); err != nil {
		return err
	}

	return nil
}

// addIAMRoleAnnotation add `eks.amazonaws.com/role-arn:roleArn` to service account annotations
func addIAMRoleAnnotation(sa *corev1.ServiceAccount, iamRoleArn string) {
	if sa.Annotations == nil {
		sa.Annotations = map[string]string{AWS_ANNOTATION_KEY: iamRoleArn}
	} else {
		sa.Annotations[AWS_ANNOTATION_KEY] = iamRoleArn
	}
}

// removeIAMRoleAnnotation remove `eks.amazonaws.com/role-arn:roleArn` in service account annotations
func removeIAMRoleAnnotation(sa *corev1.ServiceAccount, iamRoleArn string) {
	if sa.Annotations == nil {
	} else {
		if _, ok := sa.Annotations[AWS_ANNOTATION_KEY]; ok {
			delete(sa.Annotations, AWS_ANNOTATION_KEY)
		}
	}
}

// add serviceAccountNamespace/serviceAccountName in assumeRolePolicy
func addServiceAccountInAssumeRolePolicy(policyDocument, serviceAccountNamespace, serviceAccountName string) (string, error) {
	var oldDoc MapOfInterfaces
	err := json.Unmarshal([]byte(policyDocument), &oldDoc)
	if err != nil {
		return "", err
	}
	var statements []MapOfInterfaces
	statementInBytes, err := json.Marshal(oldDoc["Statement"])
	if err != nil {
		return "", err
	}
	json.Unmarshal(statementInBytes, &statements)

	oidcRoleArn := gjson.Get(policyDocument, "Statement.0.Principal.Federated").String()
	issuerUrlWithProtocol := getIssuerUrlFromProviderArn(oidcRoleArn)

	key := fmt.Sprintf("%s:sub", issuerUrlWithProtocol)
	trustIdentity := fmt.Sprintf(AWS_TRUST_IDENTITY_SUBJECT, serviceAccountNamespace, serviceAccountName)

	// We assume we only operator on first statement, don't add/remove new statement
	statement := statements[0]
	statementInBytes, err = json.Marshal(statement)
	if err != nil {
		return "", err
	}
	identities := gjson.Get(string(statementInBytes), "Condition.StringEquals").Map()

	var originalIdentities []string
	val, ok := identities[key]
	if ok {
		for _, identity := range val.Array() {
			if identity.Str == trustIdentity {
				// check if trustIdentity is in the list, if so, we skip add it
				return policyDocument, &ConditionExistError{}
			}
			originalIdentities = append(originalIdentities, identity.Str)
		}
	}

	// add new serviceAccountNamespace/serviceAccountName record
	originalIdentities = append(originalIdentities, fmt.Sprintf(AWS_TRUST_IDENTITY_SUBJECT, serviceAccountNamespace, serviceAccountName))
	document := MakeAssumeRoleWithWebIdentityPolicyDocument(oidcRoleArn, MapOfInterfaces{
		"StringEquals": map[string][]string{
			issuerUrlWithProtocol + ":aud": []string{AWS_DEFAULT_AUDIENCE},
			issuerUrlWithProtocol + ":sub": originalIdentities,
		},
	})

	newAssumeRolePolicyDocument := MakePolicyDocument(document)
	newPolicyDoc, err := json.Marshal(newAssumeRolePolicyDocument)
	if err != nil {
		return "", err
	}
	return string(newPolicyDoc), nil
}

func removeServiceAccountInAssumeRolePolicy(policyDocument, serviceAccountNamespace, serviceAccountName string) (string, error) {
	var oldDoc MapOfInterfaces
	json.Unmarshal([]byte(policyDocument), &oldDoc)
	var statements []MapOfInterfaces
	statementInBytes, err := json.Marshal(oldDoc["Statement"])
	if err != nil {
		return "", err
	}
	json.Unmarshal(statementInBytes, &statements)

	oidcRoleArn := gjson.Get(policyDocument, "Statement.0.Principal.Federated").String()
	issuerUrlWithProtocol := getIssuerUrlFromProviderArn(oidcRoleArn)

	key := fmt.Sprintf("%s:sub", issuerUrlWithProtocol)
	trustIdentity := fmt.Sprintf(AWS_TRUST_IDENTITY_SUBJECT, serviceAccountNamespace, serviceAccountName)
	statement := statements[0]

	statementInBytes, err = json.Marshal(statement)
	if err != nil {
		return "", err
	}
	identities := gjson.Get(string(statementInBytes), "Condition.StringEquals").Map()

	var newIdentities []string
	val, ok := identities[key]
	if ok {
		for _, identity := range val.Array() {
			if identity.Str != trustIdentity {
				newIdentities = append(newIdentities, identity.Str)
			}
		}
	}

	// The reason we use this way is because if newIdentities is empty and Marshal will give a null which break policy regulation
	var conditions MapOfInterfaces
	if len(newIdentities) == 0 {
		conditions = MapOfInterfaces{
			"StringEquals": map[string][]string{
				issuerUrlWithProtocol + ":aud": []string{AWS_DEFAULT_AUDIENCE},
			},
		}
	} else {
		conditions = MapOfInterfaces{
			"StringEquals": map[string][]string{
				issuerUrlWithProtocol + ":aud": []string{AWS_DEFAULT_AUDIENCE},
				issuerUrlWithProtocol + ":sub": newIdentities,
			},
		}
	}

	document := MakeAssumeRoleWithWebIdentityPolicyDocument(oidcRoleArn, conditions)

	newAssumeRolePolicyDocument := MakePolicyDocument(document)
	newPolicyDoc, err := json.Marshal(newAssumeRolePolicyDocument)
	if err != nil {
		return "", err
	}
	return string(newPolicyDoc), nil
}

// getIssuerUrlFromProviderArn parse issuerUrl from Arn: arn:aws:iam::${accountId}:oidc-provider/${issuerUrl}
func getIssuerUrlFromProviderArn(arn string) string {
	return arn[strings.Index(arn, "/")+1:]
}

func getIAMRoleNameFromIAMRoleArn(arn string) string {
	return arn[strings.LastIndex(arn, "/")+1:]
}

// MakeAssumeRoleWithWebIdentityPolicyDocument constructs a trust policy for given a web identity provider with given conditions
func MakeAssumeRoleWithWebIdentityPolicyDocument(providerARN string, condition MapOfInterfaces) MapOfInterfaces {
	return MapOfInterfaces{
		"Effect": "Allow",
		"Action": "sts:AssumeRoleWithWebIdentity",
		"Principal": map[string]string{
			"Federated": providerARN,
		},
		"Condition": condition,
	}
}

// MakePolicyDocument constructs a policy with given statements
func MakePolicyDocument(statements ...MapOfInterfaces) MapOfInterfaces {
	return MapOfInterfaces{
		"Version":   "2012-10-17",
		"Statement": statements,
	}
}

type (
	// MapOfInterfaces is an alias for map[string]interface{}
	MapOfInterfaces = map[string]interface{}
)

type IAMRole struct {
	AssumeRolePolicyDocument MapOfInterfaces `json:",omitempty"`
}

type ConditionExistError struct {
	msg string
}

func (e *ConditionExistError) Error() string {
	return e.msg
}
