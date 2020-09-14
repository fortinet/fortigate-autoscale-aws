# FortiGate Autoscale on AWS

The implementation for FortiGate Autoscale using [Fortinet Autoscale](https://github.com/fortinet/autoscale-core) on Amazon AWS platfrom.

This project provides a multi-group Auto Scaling functionality for Fortinet FortiGate EC2 instances to form an HA cluster with failover protection.

This project has the following features:

1. Multi-group Hybrid Licensing models:
   1. **Hybrid**: 1 fix-sized Auto Scaling group of 2 (and more) BYOL FortiGate Instances, and 1 dynamically scalable Auto Scaling group of (0 or more) On-Demand FortiGate Instances.
   2. **BYOL-Only**: 1 dynamically scalable Auto Scaling group of (0 or more) BYOL FortiGate Instances.
   3. **PAYG-Only**: 1 dynamically scalable Auto Scaling group of (0 or more) On-Demand FortiGate Instances.
2. AWS Transit Gateway Integration.

## Deployment packages

  * Download the **aws-cloudformation.zip** for the latest production version from [project release page](https://github.com/fortinet/fortigate-autoscale-aws/releases).
  * or, manually generate the deployment package:
    1. Chechkout the **main** branch of the project.
    2. Run `npm run build-artifacts` at the project root directory.
    3. Deployment packages **aws-cloudformation.zip** will be available in the **dist/artifacts** directory.

## Deployment guides

Deployment guides are available from the Fortinet Document Library:

  + [<NAME_PLACE_HOLDER>](<LINK_PLACE_HOLDER>)

## Launch a demo

| Non-TGW (new VPC) | Non-TGW (existing VPC) | TGW Integration (new VPC) |
| ------ | ------ | ------|
| <a href="https://console.aws.amazon.com/cloudformation/home?#/stacks/quickcreate?templateUrl=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Ffortinet-github-aws-release-artifacts%2Ffortigate-autoscale-aws%2Fmain%2Faws-cloudformation%2Ftemplates%2Fautoscale-new-vpc.template&param_S3BucketName=fortinet-github-aws-release-artifacts&param_S3KeyPrefix=fortigate-autoscale-aws%2Fmain%2Faws-cloudformation%2F&stackName=fortigate-autoscale-aws-new-vpc-demo&param_ResourceTagPrefix=fortigate-autoscale-aws-new-vpc-demo" target="_blank"> <img alt="Launch Stack" src="https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png"></a> | <a href="https://console.aws.amazon.com/cloudformation/home?#/stacks/quickcreate?templateUrl=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Ffortinet-github-aws-release-artifacts%2Ffortigate-autoscale-aws%2Fmain%2Faws-cloudformation%2Ftemplates%2Fautoscale-existing-vpc.template&param_S3BucketName=fortinet-github-aws-release-artifacts&param_S3KeyPrefix=fortigate-autoscale-aws%2Fmain%2Faws-cloudformation%2F&stackName=fortigate-autoscale-aws-existing-vpc-demo&param_ResourceTagPrefix=fortigate-autoscale-aws-existing-vpc-demo" target="_blank"> <img alt="Launch Stack" src="https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png"></a> | <a href="https://console.aws.amazon.com/cloudformation/home?#/stacks/quickcreate?templateUrl=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Ffortinet-github-aws-release-artifacts%2Ffortigate-autoscale-aws%2Fmain%2Faws-cloudformation%2Ftemplates%2Fautoscale-tgw-new-vpc.template&param_S3BucketName=fortinet-github-aws-release-artifacts&param_S3KeyPrefix=fortigate-autoscale-aws%2Fmain%2Faws-cloudformation%2F&stackName=fortigate-autoscale-aws-tgw-new-vpc-demo&param_ResourceTagPrefix=fortigate-autoscale-aws-tgw-new-vpc-demo" target="_blank"> <img alt="Launch Stack" src="https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png"></a> |

# Support
Fortinet-provided scripts in this and other GitHub projects do not fall under the regular Fortinet technical support scope and are not supported by FortiCare Support Services.
For direct issues, please refer to the [Issues](https://github.com/fortinet/fortigate-autoscale/issues) tab of this GitHub project.
For other questions related to this project, contact [github@fortinet.com](mailto:github@fortinet.com).

## License
[License](https://github.com/fortinet/fortigate-autoscale/blob/master/LICENSE) © Fortinet Technologies. All rights reserved.
