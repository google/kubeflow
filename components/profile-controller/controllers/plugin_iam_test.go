package controllers

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type AWSTestCase struct {
	// Original document policy.
	policy string
	// Expected document policy
	expectedPolicy string
	// service account namespace
	serviceAccountNamespace string
	// service account name
	serviceAccountName string
}

func TestAddIAMRoleAnnotation(t *testing.T) {
	roleName := "arn:aws:iam::34892524:role/s3-reader"
	sa := &corev1.ServiceAccount{
		ObjectMeta: v1.ObjectMeta{
			Namespace: "default",
			Name:      "sa",
		},
	}

	addIAMRoleAnnotation(sa, roleName)
	assert.NotNil(t, sa.Annotations)
	assert.Equal(t, roleName, sa.Annotations[AWS_ANNOTATION_KEY])
}

func TestRemoveIAMRoleAnnotation(t *testing.T) {
	roleName := "arn:aws:iam::34892524:role/s3-reader"
	sa := &corev1.ServiceAccount{
		ObjectMeta: v1.ObjectMeta{
			Namespace:   "default",
			Name:        "sa",
			Annotations: map[string]string{AWS_ANNOTATION_KEY: roleName},
		},
	}

	addIAMRoleAnnotation(sa, roleName)
	assert.NotNil(t, sa.Annotations)
	assert.Empty(t, sa.Annotations[AWS_DEFAULT_AUDIENCE])
}

func TestGetIssuerUrlFromRoleArn(t *testing.T) {
	issuerUrl := "oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72"
	arn := fmt.Sprintf("arn:aws:iam::34892524:oidc-provider/%v", issuerUrl)
	result := getIssuerUrlFromProviderArn(arn)
	assert.Equal(t, result, issuerUrl)
}

func TestGetIAMRoleNameFromIAMRoleArn(t *testing.T) {
	roleName := "test-iam-role"
	arn := fmt.Sprintf("arn:aws:iam::34892524:role/%v", roleName)
	result := getIAMRoleNameFromIAMRoleArn(arn)
	assert.Equal(t, result, roleName)
}

func TestAddServiceAccountInAssumeRolePolicy(t *testing.T) {
	tests := []AWSTestCase{
		{
			policy: `
				{
				  "Version": "2012-10-17",
				  "Statement": [
					{
					  "Effect": "Allow",
					  "Principal": {
						"Federated": "arn:aws:iam::34892524:oidc-provider/oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72"
					  },
					  "Action": "sts:AssumeRoleWithWebIdentity",
					  "Condition": {
						"StringEquals": {
						  "oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72:aud": ["sts.amazonaws.com"]
						}
					  }
					}
				  ]
				}
				`,
			expectedPolicy: `
				{
				  "Version": "2012-10-17",
				  "Statement": [
					{
					  "Effect": "Allow",
					  "Principal": {
						"Federated": "arn:aws:iam::34892524:oidc-provider/oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72"
					  },
					  "Action": "sts:AssumeRoleWithWebIdentity",
					  "Condition": {
						"StringEquals": {
						  "oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72:aud": ["sts.amazonaws.com"],
						  "oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72:sub": ["system:serviceaccount:ns1:sa1"]
						}
					  }
					}
				  ]
				}
				`,
			serviceAccountNamespace: "ns1",
			serviceAccountName:      "sa1",
		},
		{
			policy: `
				{
				  "Version": "2012-10-17",
				  "Statement": [
					{
					  "Effect": "Allow",
					  "Principal": {
						"Federated": "arn:aws:iam::34892524:oidc-provider/oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72"
					  },
					  "Action": "sts:AssumeRoleWithWebIdentity",
					  "Condition": {
						"StringEquals": {
						  "oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72:aud": ["sts.amazonaws.com"],
							"oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72:sub":[]
						}
					  }
					}
				  ]
				}
				`,
			expectedPolicy: `
				{
				  "Version": "2012-10-17",
				  "Statement": [
					{
					  "Effect": "Allow",
					  "Principal": {
						"Federated": "arn:aws:iam::34892524:oidc-provider/oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72"
					  },
					  "Action": "sts:AssumeRoleWithWebIdentity",
					  "Condition": {
						"StringEquals": {
						  "oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72:aud": ["sts.amazonaws.com"],
						  "oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72:sub": ["system:serviceaccount:ns1:sa1"]
						}
					  }
					}
				  ]
				}
				`,
			serviceAccountNamespace: "ns1",
			serviceAccountName:      "sa1",
		},
		{
			policy: `
				{
				  "Version": "2012-10-17",
				  "Statement": [
					{
					  "Effect": "Allow",
					  "Principal": {
						"Federated": "arn:aws:iam::34892524:oidc-provider/oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72"
					  },
					  "Action": "sts:AssumeRoleWithWebIdentity",
					  "Condition": {
						"StringEquals": {
						  	"oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72:aud": ["sts.amazonaws.com"],
							"oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72:sub":["system:serviceaccount:ns1:sa2"]
						}
					  }
					}
				  ]
				}
				`,
			expectedPolicy: `
				{
				  "Version": "2012-10-17",
				  "Statement": [
					{
					  "Effect": "Allow",
					  "Principal": {
						"Federated": "arn:aws:iam::34892524:oidc-provider/oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72"
					  },
					  "Action": "sts:AssumeRoleWithWebIdentity",
					  "Condition": {
						"StringEquals": {
						  "oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72:aud": ["sts.amazonaws.com"],
						  "oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72:sub": ["system:serviceaccount:ns1:sa2", "system:serviceaccount:ns1:sa1"]
						}
					  }
					}
				  ]
				}
				`,
			serviceAccountNamespace: "ns1",
			serviceAccountName:      "sa1",
		},
	}

	for _, test := range tests {
		result, _ := addServiceAccountInAssumeRolePolicy(test.policy, test.serviceAccountNamespace, test.serviceAccountName)
		require.JSONEq(t, test.expectedPolicy, result)
	}
}

func TestRemoveServiceAccountInAssumeRolePolicy(t *testing.T) {
	tests := []AWSTestCase{
		{
			policy: `
				{
				  "Version": "2012-10-17",
				  "Statement": [
					{
					  "Effect": "Allow",
					  "Principal": {
						"Federated": "arn:aws:iam::34892524:oidc-provider/oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72"
					  },
					  "Action": [
						"sts:AssumeRoleWithWebIdentity"
					  ],
					  "Condition": {
						"StringEquals": {
 						  "oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72:aud": ["sts.amazonaws.com"],
						  "oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72:sub": ["system:serviceaccount:ns1:sa1", "system:serviceaccount:ns1:sa2"]
						}
					  }
					}
				  ]
				}`,
			expectedPolicy: `
				{
				  "Version": "2012-10-17",
				  "Statement": [
					{
					  "Effect": "Allow",
					  "Principal": {
						"Federated": "arn:aws:iam::34892524:oidc-provider/oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72"
					  },
					  "Action": "sts:AssumeRoleWithWebIdentity",
					  "Condition": {
						"StringEquals": {
						  "oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72:aud": ["sts.amazonaws.com"],
						  "oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72:sub": ["system:serviceaccount:ns1:sa1"]
						}
					  }
					}
				  ]
				}`,
			serviceAccountNamespace: "ns1",
			serviceAccountName:      "sa2",
		},
		{
			policy: `
				{
				  "Version": "2012-10-17",
				  "Statement": [
					{
					  "Effect": "Allow",
					  "Principal": {
						"Federated": "arn:aws:iam::34892524:oidc-provider/oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72"
					  },
					  "Action": [
						"sts:AssumeRoleWithWebIdentity"
					  ],
					  "Condition": {
						"StringEquals": {
						  "oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72:aud": ["sts.amazonaws.com"],
						  "oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72:sub": ["system:serviceaccount:ns1:sa2"]
						}
					  }
					}
				  ]
				}`,
			expectedPolicy: `
				{
				  "Version": "2012-10-17",
				  "Statement": [
					{
					  "Effect": "Allow",
					  "Principal": {
						"Federated": "arn:aws:iam::34892524:oidc-provider/oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72"
					  },
					  "Action": "sts:AssumeRoleWithWebIdentity",
					  "Condition": {
						"StringEquals": {
						  "oidc.beta.us-west-2.wesley.amazonaws.com/id/50D94CFC65139194EDC21891B611EF72:aud": ["sts.amazonaws.com"]
						}
					  }
					}
				  ]
				}`,
			serviceAccountNamespace: "ns1",
			serviceAccountName:      "sa2",
		},
	}

	for _, test := range tests {
		result, _ := removeServiceAccountInAssumeRolePolicy(test.policy, test.serviceAccountNamespace, test.serviceAccountName)
		require.JSONEq(t, test.expectedPolicy, result)
	}
}
