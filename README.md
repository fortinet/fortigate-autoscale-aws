# FortiGate Autoscale for AWS

An implementation of FortiGate Autoscale for the Amazon AWS platform API with a Dynamo DB storage backend.

This project provides multi-group Auto Scaling functionality for Fortinet FortiGate EC2 instances to form an HA cluster with failover protection. For deployment on other cloud platforms, visit the relevant repository:

* The **AliCloud** deployment is in the  [alicloud-autoscale](https://github.com/fortinet/alicloud-autoscale/) repository.
* The **Azure** deployment is in the [fortigate-autoscale](https://github.com/fortinet/fortigate-autoscale) repository.
* The **GCP** deployment is in the [fortigate-autoscale-gcp](https://github.com/fortinet/fortigate-autoscale-gcp) repository.

This project has the following features:

1. Multi-group Hybrid Licensing models:
   1. **BYOL-Only**: 1 dynamically scalable Auto Scaling group of (0 or more) Bring Your Own License (BYOL) FortiGate instances.
   2. **PAYG-Only**: 1 dynamically scalable Auto Scaling group of (0 or more) on-demand FortiGate instances.
   3. **Hybrid**: 1 fix-sized Auto Scaling group of 2 (or more) BYOL FortiGate instances, and 1 dynamically scalable Auto Scaling group of (0 or more) on-demand FortiGate instances.
2. AWS Transit Gateway integration.
3. FortiAnalyzer integration.

## Deployment packages

To obtain the deployment package, use one of the following:

  * Download the package **aws-cloudformation.zip** directly from the [project release page](https://github.com/fortinet/fortigate-autoscale-aws/releases).
  * Manually generate the deployment package in your local workspace:
    1. From the [project release page](https://github.com/fortinet/fortigate-autoscale-aws/releases), download the source code (.zip or .tar.gz) for the latest version.
    2. Extract the source code into the project directory in your local workspace.
    3. Run `npm install` to initialize the project at the project root directory.
    4. Run `npm run build-artifacts` to generate the local deployment package.
    5. The deployment package **aws-cloudformation.zip** will be available in the **dist/artifacts** directory.

## Deployment guide

Deployment guides are available from the Fortinet Document Library:

  + [ FortiGate / FortiOS 7.0 Deploying auto scaling on AWS](https://docs.fortinet.com/document/fortigate-public-cloud/7.0.0/aws-administration-guide/397979/deploying-auto-scaling-on-aws)
  + [ FortiGate / FortiOS 6.4 Deploying auto scaling on AWS](https://docs.fortinet.com/document/fortigate-public-cloud/6.4.0/aws-administration-guide/397979/deploying-auto-scaling-on-aws)
  + [ FortiGate / FortiOS 6.2 Deploying auto scaling on AWS](https://docs.fortinet.com/document/fortigate-public-cloud/6.2.0/aws-administration-guide/397979/deploying-auto-scaling-on-aws)


## Launch a demo

| New VPC, no-TGW | Existing VPC, no-TGW | TGW Integration (new VPC) |
| --- | --- | --- |
| <a href="https://console.aws.amazon.com/cloudformation/home?#/stacks/quickcreate?templateUrl=https%3A%2F%2Ffortinet-github-aws-release-artifacts.s3.us-west-2.amazonaws.com%2Ffortigate-autoscale-aws%2F3.5.1%2Faws-cloudformation%2Ftemplates%2Fautoscale-new-vpc.template.yaml&param_S3BucketName=fortinet-github-aws-release-artifacts&param_S3KeyPrefix=fortigate-autoscale-aws%2F3.5.1%2Faws-cloudformation%2F&stackName=fortigate-autoscale-aws-new-vpc-demo&param_ResourceTagPrefix=fortigate-autoscale-aws-new-vpc-demo" target="_blank"> <img alt="Launch Stack" src="https://cloudformation-examples.s3.amazonaws.com/cloudformation-launch-stack.png"></a> | <a href="https://console.aws.amazon.com/cloudformation/home?#/stacks/quickcreate?templateUrl=https%3A%2F%2Ffortinet-github-aws-release-artifacts.s3.us-west-2.amazonaws.com%2Ffortigate-autoscale-aws%2F3.5.1%2Faws-cloudformation%2Ftemplates%2Fautoscale-existing-vpc.template.yaml&param_S3BucketName=fortinet-github-aws-release-artifacts&param_S3KeyPrefix=fortigate-autoscale-aws%2F3.5.1%2Faws-cloudformation%2F&stackName=fortigate-autoscale-aws-existing-vpc-demo&param_ResourceTagPrefix=fortigate-autoscale-aws-existing-vpc-demo" target="_blank"> <img alt="Launch Stack" src="https://cloudformation-examples.s3.amazonaws.com/cloudformation-launch-stack.png"></a> | <a href="https://console.aws.amazon.com/cloudformation/home?#/stacks/quickcreate?templateUrl=https%3A%2F%2Ffortinet-github-aws-release-artifacts.s3.us-west-2.amazonaws.com%2Ffortigate-autoscale-aws%2F3.5.1%2Faws-cloudformation%2Ftemplates%2Fautoscale-tgw-new-vpc.template.yaml&param_S3BucketName=fortinet-github-aws-release-artifacts&param_S3KeyPrefix=fortigate-autoscale-aws%2F3.5.1%2Faws-cloudformation%2F&stackName=fortigate-autoscale-aws-tgw-new-vpc-demo&param_ResourceTagPrefix=fortigate-autoscale-aws-tgw-new-vpc-demo" target="_blank"> <img alt="Launch Stack" src="https://cloudformation-examples.s3.amazonaws.com/cloudformation-launch-stack.png"></a> |

# Support
Fortinet-provided scripts in this and other GitHub projects do not fall under the regular Fortinet technical support scope and are not supported by FortiCare Support Services.
For direct issues, please refer to the [Issues](https://github.com/fortinet/fortigate-autoscale-aws/issues) tab of this GitHub project.
For other questions related to this project, contact [github@fortinet.com](mailto:github@fortinet.com).

## License
[License](./LICENSE) © Fortinet Technologies. All rights reserved.
