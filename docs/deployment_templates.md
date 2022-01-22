# CloudFormation deployment templates

There are three deployment templates provided as entry template. They are located the /templates directory. They are used in three different deployment scenarios.

## Deploy Autoscale into a new VPC

### Scenario

The deployment template creates a new VPC and will deploy the Autoscale and related components into this new VPC.

### Template

[/templates/autoscale-new-vpc.template.yaml](/templates/autoscale-new-vpc.template.yaml)

### Table of template parameters

The parameters are listed in alphabetical order in the table below, but the display order differs on AWS CloudFormation deployment console during template deployment.

_Name_: The name of the parameter defined and used in the template file.

_Label_: The label for the parameter displayed on AWS CloudFormation deployment console during template deployment.

_Default_: The default value for this parameter.

_Description_: Description of the parameter.

Required parameters will have a bold font on their label column in the table below.

| Name | Label | Default | Description |
| --- | --- | --- | --- |
| AutoscaleNotificationSubscriberEmail | Autoscale notifications subscriber email | | The email address (AWS SNS Topic subscriber) to receive Autoscale notifications. If provided, the template can only accept one email address. An email will be sent to the address to confirm the subscription. |
| AvailabilityZones | **Availability Zones** | |  List of Availability Zones to use for the subnets in the VPC. The FortiGate Autoscale solution uses two Availability Zones from your list and preserves the logical order you specify. | | CustomAssetContainer | **Custom asset S3 bucket** | |  The name of the S3 bucket which contains your custom assets. Required if **use custom asset location** is set to **yes**. |
| CustomAssetDirectory | **Custom asset folder** | |  The sub path within the **custom asset container** which serves as the top level directory of all your custom assets. If **use custom asset location** is set to **yes**, and this value is left empty, the **custom asset container** will serve as the top level directory. |
| CustomIdentifier | **Resource name prefix** | fgtASG | An alternative name prefix to be used on a resource that the **Resource tag prefix** cannot apply to. Can only contain numbers, lowercase letters, and uppercase letters. Max length is 10. |
| FgtAsgCooldown | Scaling cooldown period | 300 | The Auto Scaling group waits for the cooldown period (in seconds) to complete before resuming scaling activities. Minimum is 60. Maximum is 3600. |
| FgtAsgDesiredCapacityByol | Desired capacity (BYOL) | 2 | The number of FortiGate instances the BYOL Auto Scaling group should have at any time. For High Availability in BYOL-only and Hybrid use cases, ensure at least 2 FortiGates are in the group. For specific use cases, set to 0 for On-Demand-only, and \&gt;= 2 for BYOL-only or hybrid licensing. |
| FgtAsgDesiredCapacityPayg | Desired capacity (On-Demand) | 0 | The number of FortiGate instances the On-Demand Auto Scaling group should have at any time. For High Availability in a On-Demand-only use case, ensure at least 2 FortiGates are in the group. For specific use cases, set to 0 for BYOL-only, \&gt;= 2 for On-Demand-only, and \&gt;= 0 for hybrid licensing. |
| FgtAsgHealthCheckGracePeriod | Health check grace period | 300 | The length of time (in seconds) that Auto Scaling waits before checking an instance**s health status. Minimum is 60. |
| FgtAsgMaxSizeByol | Maximum group size (BYOL) | 2 | Maximum number of FortiGate instances in the BYOL Auto Scaling group. For specific use cases, set to 0 for On-Demand-only, and \&gt;= 2 for BYOL-only or hybrid licensing. This number must be greater than or equal to the Minimum group size (BYOL). |
| FgtAsgMaxSizePayg | Maximum group size (On-Demand) | 6 | Maximum number of FortiGate instances in the On-Demand Auto Scaling group. For specific use cases, set to 0 for BYOL-only, \&gt;= 2 for On-Demand-only, and \&gt;= 0 for hybrid licensing. This number must be greater than or equal to the Minimum group size (On-Demand). |
| FgtAsgMinSizeByol | Minimum group size (BYOL) | 2 | Minimum number of FortiGate instances in the BYOL Auto Scaling group. For specific use cases, set to 0 for On-Demand-only, and \&gt;= 2 for BYOL-only or hybrid licensing. |
| FgtAsgMinSizePayg | Minimum group size (On-Demand) | 0 | Minimum number of FortiGate instances in the On-Demand Auto Scaling group. For specific use cases, set to 0 for BYOL-only, \&gt;= 2 for On-Demand-only, and \&gt;= 0 for hybrid licensing. |
| FgtAsgScaleInThreshold | Scale-in threshold | 25 | The threshold (in percentage) for the FortiGate Auto Scaling group to scale-in (remove) 1 instance. Minimum is 1. Maximum is 100. |
| FgtAsgScaleOutThreshold | Scale-out threshold | 80 | The threshold (in percentage) for the FortiGate Auto Scaling group to scale-out (add) 1 instance. Minimum is 1. Maximum is 100. |
| FortiAnalyzerAutoscaleAdminPassword | Autoscale admin password | | The password for the **Autoscale admin username**. The password must conform to the FortiAnalyzer password policy and have a min length of 8 and a max length 128. If you need to enable KMS encryption, refer to the documentation. |
| FortiAnalyzerAutoscaleAdminUsername | Autoscale admin username | | The name of the secondary administrator level account in the FortiAnalyzer, which Fortinet FortiGate Auto Scaling uses to connect to the FortiAnalyzer to authorize any FortiGate device in the Auto Scaling group. To conform to the FortiAnalyzer naming policy, the username can only contain numbers, lowercase letters, uppercase letters, and hyphens. It cannot start or end with a hyphen (-). |
| FortiAnalyzerCustomPrivateIpAddress | FortiAnalyzer private IP address | | The custom private IP address to be used by the FortiAnalyzer. Must be within the Public subnet 1 CIDR range. Required if **FortiAnalyzer Integration** is set to **yes**. If **FortiAnalyzer Integration** is set to **no**, any input will be ignored. |
| FortiAnalyzerInstanceType | FortiAnalyzer instance type | m5/large | Instance type to launch as FortiAnalyzer. Instance types are available with different vCPU sizes and bandwidths. For more information, see [Instance Types](https://aws.amazon.com/ec2/instance-types/). |
| FortiAnalyzerIntegrationOptions | FortiAnalyzer integration | yes | Choose **yes** to incorporate FortiAnalyzer into Fortinet FortiGate Auto Scaling to use extended features that include storing logs into FortiAnalyzer. |
| FortiAnalyzerVersion | FortiAnalyzer version | 6.4.7 | The FortiAnalyzer version supported by Fortinet FortiGate Auto Scaling. \*\*IMPORTANT!\*\* Requires a subscription to the Fortinet FortiAnalyzer Centralized Logging/Reporting (10 managed devices) AMI. |
| FortiGateAdminCidr | Admin CIDR block | | CIDR block for external admin management access. \*\*WARNING!\*\* 0.0.0.0/0 accepts connections from any IP address. We recommend that you use a constrained CIDR range to reduce the potential of inbound attacks from unknown IP addresses. |
| FortiGateAdminPort | Admin port | 8443 | A port number for FortiGate administration. Minimum is 1. Maximum is 65535. Do not use the FortiGate reserved ports 443, 541, 514, or 703. |
| FortiGateInstanceType | Instance type | C5.xlarge | Instance type for the FortiGates in the Auto Scaling group. Instance types are available with different vCPU sizes and bandwidths. For more information, see [Instance Types](https://aws.amazon.com/ec2/instance-types/). |
| FortiGatePskSecret | **FortiGate PSK secret** | |  A secret key for the FortiGate instances to securely communicate with each other. Must contain numbers and letters and may contain special characters. Max length is 128. |
| FortiOSVersion | FortiOS version | 7.0.3 | FortiOS version supported by FortiGate Autoscale for AWS. |
| GetLicenseGracePeriod | Get license grace period | 300 | The minimum time (in seconds) permitted before a distributed license can be revoked from a non-responsive FortiGate and re-distributed. Minimum is 300. |
| HeartBeatDelayAllowance | Heart beat delay allowance | 2 | The maximum amount of time (in seconds) allowed for network latency of the FortiGate heartbeat arriving at the Autoscale handler. Minimum is 0. |
| HeartBeatInterval | Heart beat interval | 30 | The length of time (in seconds) that a FortiGate instance waits between sending heartbeat requests to the Autoscale handler. Minimum is 30. Maximum is 90. |
| HeartBeatLossCount | Heart beat loss count | 10 | Number of consecutively lost heartbeats. When the Heartbeat Loss Count has been reached, the VM is deemed unhealthy and fail-over activities will commence. |
| InternalLoadBalancerDnsName | Internal ELB DNS name | | Optional. Specify the DNS Name of an existing internal load balancer used to route traffic from a FortiGate to targets in a specified target group. Leave it blank if you don**t use an existing load balancer. |
| InternalLoadBalancingOptions | Internal ELB options | add a new internal load balancer | (Optional) Add a predefined Elastic Load Balancer (ELB) to route traffic to web service in the private subnets. You can optionally use your own one or decide to not need one. |
| InternalTargetGroupHealthCheckPath | Health check path | / | Optional. The destination path for health checks. This path must begin with a **/** character, and can be at most 1024 characters in length. |
| KeyPairName | **Key pair name** | |  Amazon EC2 Key Pair for admin access. |
| LifecycleHookTimeout | Instance lifecycle timeout | 480 | The amount of time (in seconds) that can elapse before the FortiGate Autoscale lifecycle hook times out. Minimum is 60. Maximum is 3600. |
| LoadBalancingHealthCheckThreshold | Health check threshold | 3 | The number of consecutive health check failures required before considering a FortiGate instance unhealthy. Minimum is 3. |
| LoadBalancingTrafficPort | Traffic port | 443 | Balance web service traffic over this port if the internal web-service load balancer is enabled. Minimum is 1. Maximum is 65535. |
| LoadBalancingTrafficProtocol | Traffic protocol | HTTPS | Balance web service traffic using this protocol. |
| PrimaryElectionTimeout | Primary election timeout | 300 | The maximum time (in seconds) to wait for the election of the primary instance to complete. Minimum is 30. Maximum is 3600. |
| PrivateSubnet1Cidr | Private subnet 1 CIDR | 192.168.2.0/24 | The CIDR block for the private subnet located in Availability Zone 1 where it is protected by the FortiGates in the public subnet of the same AZ. |
| PrivateSubnet2Cidr | Private subnet 2 CIDR | 192.168.3.0/24 | The CIDR block for the private subnet located in Availability Zone 2 where it is protected by the FortiGates in the public subnet of the same AZ. |
| PublicSubnet1Cidr | Autoscale subnet 1 CIDR | 192.168.0.0/24 | The CIDR block for the subnet located in Availability Zone 1 where the FortiGate Autoscale instances will be deployed to. |
| PublicSubnet2Cidr | Autoscale subnet 2 CIDR | 192.168.1.0/24 | The CIDR block for the subnet located in Availability Zone 2 where the FortiGate Autoscale instances will be deployed to. |
| ResourceTagPrefix | **Resource tag prefix** | |  The ResourceGroup Tag Key used on all resources and as the name prefix of all applicable resources. Can only contain numbers, lowercase letters, uppercase letters, ampersat(@), hyphens (-), period (.), and hash (#). Max length is 50. |
| S3BucketName | **S3 bucket name** | |  Name of the S3 bucket that contains the FortiGate Autoscale deployment package. Can only contain numbers, lowercase letters, uppercase letters, period (.), and hyphens (-). It cannot start or end with a hyphen (-). |
| S3KeyPrefix | **S3 resource folder** | |  Name of the S3 folder that stores the FortiGate Autoscale deployment resources. Can only contain numbers, lowercase letters, uppercase letters, hyphens (-), period (.), and forward slashes (/). If provided, it must end with a forward slash (/). |
| SyncRecoveryCount | Autoscale sync recovery count | 3 | Number of consecutive on-time heartbeats required for a VM to become healthy again. This parameter is only used when **Terminate unhealthy VM** is set to **no** and allows for the VM to recover from an unhealthy state. |
| TerminateUnhealthyVm | Terminate unhealthy VM | no | Terminate any VM that is deemed unhealthy by the Autoscale. |
| UseCustomAssetLocation | Use custom asset location | no | Set to yes to use a custom S3 location for custom assets such as licenses and customized configsets. |
| VpcCidr | **VPC CIDR** | |  Classless Inter-Domain Routing (CIDR) block for the FortiGate Autoscale VPC. |

## Deploy Autoscale into an existing VPC

### Scenario

The deployment template requires an existing VPC to deploy the Autoscale and related components into the existing VPC.

### Template

[/templates/autoscale-existing-vpc.template.yaml](/templates/autoscale-existing-vpc.template.yaml)

### Table of template parameters

The parameters are listed in alphabetical order in the table below, but the display order differs on AWS CloudFormation deployment console during template deployment.

_Name_: The name of the parameter defined and used in the template file.

_Label_: The label for the parameter displayed on AWS CloudFormation deployment console during template deployment.

_Default_: The default value for this parameter.

_Description_: Description of the parameter.

Required parameters will have a bold font on their label column in the table below.

| Name | Label | Default | Description |
| --- | --- | --- | --- |
| AutoscaleNotificationSubscriberEmail | Autoscale notifications subscriber email | | The email address (AWS SNS Topic subscriber) to receive Autoscale notifications. If provided, the template can only accept one email address. An email will be sent to the address to confirm the subscription. |
| CustomAssetContainer | **Custom asset S3 bucket** | |  The name of the S3 bucket which contains your custom assets. Required if **use custom asset location** is set to **yes**. |
| CustomAssetDirectory | **Custom asset folder** | |  The sub path within the **custom asset container** which serves as the top level directory of all your custom assets. If **use custom asset location** is set to **yes**, and this value is left empty, the **custom asset container** will serve as the top level directory. |
| CustomIdentifier | **Resource name prefix** | fgtASG | An alternative name prefix to be used on a resource that the **Resource tag prefix** cannot apply to. Can only contain numbers, lowercase letters, and uppercase letters. Max length is 10. |
| FgtAsgCooldown | Scaling cooldown period | 300 | The Auto Scaling group waits for the cooldown period (in seconds) to complete before resuming scaling activities. Minimum is 60. Maximum is 3600. |
| FgtAsgDesiredCapacityByol | Desired capacity (BYOL) | 2 | The number of FortiGate instances the BYOL Auto Scaling group should have at any time. For High Availability in BYOL-only and Hybrid use cases, ensure at least 2 FortiGates are in the group. For specific use cases, set to 0 for On-Demand-only, and \&gt;= 2 for BYOL-only or hybrid licensing. |
| FgtAsgDesiredCapacityPayg | Desired capacity (On-Demand) | 0 | The number of FortiGate instances the On-Demand Auto Scaling group should have at any time. For High Availability in a On-Demand-only use case, ensure at least 2 FortiGates are in the group. For specific use cases, set to 0 for BYOL-only, \&gt;= 2 for On-Demand-only, and \&gt;= 0 for hybrid licensing. |
| FgtAsgHealthCheckGracePeriod | Health check grace period | 300 | The length of time (in seconds) that Auto Scaling waits before checking an instance**s health status. Minimum is 60. |
| FgtAsgMaxSizeByol | Maximum group size (BYOL) | 2 | Maximum number of FortiGate instances in the BYOL Auto Scaling group. For specific use cases, set to 0 for On-Demand-only, and \&gt;= 2 for BYOL-only or hybrid licensing. This number must be greater than or equal to the Minimum group size (BYOL). |
| FgtAsgMaxSizePayg | Maximum group size (On-Demand) | 6 | Maximum number of FortiGate instances in the On-Demand Auto Scaling group. For specific use cases, set to 0 for BYOL-only, \&gt;= 2 for On-Demand-only, and \&gt;= 0 for hybrid licensing. This number must be greater than or equal to the Minimum group size (On-Demand). |
| FgtAsgMinSizeByol | Minimum group size (BYOL) | 2 | Minimum number of FortiGate instances in the BYOL Auto Scaling group. For specific use cases, set to 0 for On-Demand-only, and \&gt;= 2 for BYOL-only or hybrid licensing. |
| FgtAsgMinSizePayg | Minimum group size (On-Demand) | 0 | Minimum number of FortiGate instances in the On-Demand Auto Scaling group. For specific use cases, set to 0 for BYOL-only, \&gt;= 2 for On-Demand-only, and \&gt;= 0 for hybrid licensing. |
| FgtAsgScaleInThreshold | Scale-in threshold | 25 | The threshold (in percentage) for the FortiGate Auto Scaling group to scale-in (remove) 1 instance. Minimum is 1. Maximum is 100. |
| FgtAsgScaleOutThreshold | Scale-out threshold | 80 | The threshold (in percentage) for the FortiGate Auto Scaling group to scale-out (add) 1 instance. Minimum is 1. Maximum is 100. |
| FortiAnalyzerAutoscaleAdminPassword | Autoscale admin password | | The password for the **Autoscale admin username**. The password must conform to the FortiAnalyzer password policy and have a min length of 8 and a max length 128. If you need to enable KMS encryption, refer to the documentation. |
| FortiAnalyzerAutoscaleAdminUsername | Autoscale admin username | | The name of the secondary administrator level account in the FortiAnalyzer, which Fortinet FortiGate Auto Scaling uses to connect to the FortiAnalyzer to authorize any FortiGate device in the Auto Scaling group. To conform to the FortiAnalyzer naming policy, the username can only contain numbers, lowercase letters, uppercase letters, and hyphens. It cannot start or end with a hyphen (-). |
| FortiAnalyzerCustomPrivateIpAddress | FortiAnalyzer private IP address | | The custom private IP address to be used by the FortiAnalyzer. Must be within the Public subnet 1 CIDR range. Required if **FortiAnalyzer Integration** is set to **yes**. If **FortiAnalyzer Integration** is set to **no**, any input will be ignored. |
| FortiAnalyzerInstanceType | FortiAnalyzer instance type | m5/large | Instance type to launch as FortiAnalyzer. Instance types are available with different vCPU sizes and bandwidths. For more information, see [Instance Types](https://aws.amazon.com/ec2/instance-types/) |
| FortiAnalyzerIntegrationOptions | FortiAnalyzer integration | yes | Choose **yes** to incorporate FortiAnalyzer into Fortinet FortiGate Auto Scaling to use extended features that include storing logs into FortiAnalyzer. |
| FortiAnalyzerVersion | FortiAnalyzer version | 6.4.7 | The FortiAnalyzer version supported by Fortinet FortiGate Auto Scaling. \*\*IMPORTANT!\*\* Requires a subscription to the Fortinet FortiAnalyzer Centralized Logging/Reporting (10 managed devices) AMI. |
| FortiGateAdminCidr | Admin CIDR block | | CIDR block for external admin management access. \*\*WARNING!\*\* 0.0.0.0/0 accepts connections from any IP address. We recommend that you use a constrained CIDR range to reduce the potential of inbound attacks from unknown IP addresses. |
| FortiGateAdminPort | Admin port | 8443 | A port number for FortiGate administration. Minimum is 1. Maximum is 65535. Do not use the FortiGate reserved ports 443, 541, 514, or 703. |
| FortiGateInstanceType | Instance type | C5.xlarge | Instance type for the FortiGates in the Auto Scaling group. Instance types are available with different vCPU sizes and bandwidths. For more information, see [Instance Types](https://aws.amazon.com/ec2/instance-types/) |
| FortiGatePskSecret | **FortiGate PSK secret** | |  A secret key for the FortiGate instances to securely communicate with each other. Must contain numbers and letters and may contain special characters. Max length is 128. |
| FortiOSVersion | FortiOS version | 7.0.3 | FortiOS version supported by FortiGate Autoscale for AWS. |
| GetLicenseGracePeriod | Get license grace period | 300 | The minimum time (in seconds) permitted before a distributed license can be revoked from a non-responsive FortiGate and re-distributed. Minimum is 300. |
| HeartBeatDelayAllowance | Heart beat delay allowance | 2 | The maximum amount of time (in seconds) allowed for network latency of the FortiGate heartbeat arriving at the Autoscale handler. Minimum is 0. |
| HeartBeatInterval | Heart beat interval | 30 | The length of time (in seconds) that a FortiGate instance waits between sending heartbeat requests to the Autoscale handler. Minimum is 30. Maximum is 90. |
| HeartBeatLossCount | Heart beat loss count | 10 | Number of consecutively lost heartbeats. When the Heartbeat Loss Count has been reached, the VM is deemed unhealthy and fail-over activities will commence. |
| InternalLoadBalancerDnsName | Internal ELB DNS name | | Optional. Specify the DNS Name of an existing internal load balancer used to route traffic from a FortiGate to targets in a specified target group. Leave it blank if you don**t use an existing load balancer. |
| InternalLoadBalancingOptions | Internal ELB options | add a new internal load balancer | (Optional) Add a predefined Elastic Load Balancer (ELB) to route traffic to web service in the private subnets. You can optionally use your own one or decide to not need one. |
| InternalTargetGroupHealthCheckPath | Health check path | / | (Optional) The destination path for health checks. This path must begin with a **/** character, and can be at most 1024 characters in length. |
| KeyPairName | **Key pair name** | |  Amazon EC2 Key Pair for admin access. |
| LifecycleHookTimeout | Instance lifecycle timeout | 480 | The amount of time (in seconds) that can elapse before the FortiGate Autoscale lifecycle hook times out. Minimum is 60. Maximum is 3600. |
| LoadBalancingHealthCheckThreshold | Health check threshold | 3 | The number of consecutive health check failures required before considering a FortiGate instance unhealthy. Minimum is 3. |
| LoadBalancingTrafficPort | Traffic port | 443 | Balance web service traffic over this port if the internal web-service load balancer is enabled. Minimum is 1. Maximum is 65535. |
| LoadBalancingTrafficProtocol | Traffic protocol | HTTPS | Balance web service traffic using this protocol. |
| PrimaryElectionTimeout | Primary election timeout | 300 | Maximum time (in seconds) to wait for the election of the primary instance to complete. Minimum is 30. Maximum is 3600. |
| PrivateSubnet1 | **Private subnet 1 ID** | |  ID of the private subnet 1 located in Availability Zone 1 of the selected existing VPC. This subnet will be protected by the FortiGate-VMs in the public subnet of the same Availability Zone. |
| PrivateSubnet2 | **Private subnet 2 ID** | |  ID of the private subnet 2 located in Availability Zone 2 of the selected existing VPC. This subnet will be protected by the FortiGate-VMs in the public subnet of the same Availability Zone. |
| PrivateSubnetRouteTable | **Private subnet route table** | |  ID of the route table associated with the two private subnets. |
| PublicSubnet1 | **Autoscale subnet 1 ID** | |  ID of the public subnet 1 located in Availability Zone 1 of the selected existing VPC. The FortiGate Autoscale instances will be deployed here. |
| PublicSubnet2 | **Autoscale subnet 2 ID** | |  ID of the public subnet 2 located in Availability Zone 2 of the selected existing VPC. The FortiGate Autoscale instances will be deployed here. |
| ResourceTagPrefix | **Resource tag prefix** | |  The ResourceGroup Tag Key used on all resources and as the name prefix of all applicable resources. Can only contain numbers, lowercase letters, uppercase letters, ampersat(@), hyphens (-), period (.), and hash (#). Max length is 50. |
| S3BucketName | **S3 bucket name** | |  Name of the S3 bucket that contains the FortiGate Autoscale deployment package. Can only contain numbers, lowercase letters, uppercase letters, period (.), and hyphens (-). It cannot start or end with a hyphen (-). |
| S3KeyPrefix | **S3 resource folder** | |  Name of the S3 folder that stores the FortiGate Autoscale deployment resources. Can only contain numbers, lowercase letters, uppercase letters, hyphens (-), period (.), and forward slashes (/). If provided, it must end with a forward slash (/). |
| SyncRecoveryCount | Autoscale sync recovery count | 3 | Number of consecutive on-time heartbeats required for a VM to become healthy again. This parameter is only used when **Terminate unhealthy VM** is set to **no** and allows for the VM to recover from an unhealthy state. |
| TerminateUnhealthyVm | Terminate unhealthy VM | no | Terminate any VM that is deemed unhealthy by the Autoscale. |
| UseCustomAssetLocation | Use custom asset location | no | Set to yes to use a custom S3 location for custom assets such as licenses and customized configsets. |
| VpcCidr | **VPC CIDR** | |  Classless Inter-Domain Routing (CIDR) block for the FortiGate Autoscale VPC. |
| VpcEndpointId | **Private VPC Endpoint ID** | |  ID of the Private VPC Endpoint associated with the existing VPC. The Private VPC Endpoint must has enabled the **Private DNS names**. |
| VpcId | **VPC ID** | |  ID of the existing VPC where FortiGate Autoscale will be deployed. The VPC must have the option DNS hostnames enabled and each of the two Availability Zones in the VPC must have at least 1 public subnet and at least 1 private subnet. |

## Deploy Autoscale into a new VPC with Transit Gateway Integration

### Scenario

The deployment template creates a new VPC and will deploy the Autoscale with Transit Gateway integration and related components with into this new VPC.

### Template

[/templates/autoscale-tgw-new-vpc.template.yaml](/templates/autoscale-tgw-new-vpc.template.yaml)

### Table of template parameters

The parameters are listed in alphabetical order in the table below, but the display order differs on AWS CloudFormation deployment console during template deployment.

_Name_: The name of the parameter defined and used in the template file.

_Label_: The label for the parameter displayed on AWS CloudFormation deployment console during template deployment.

_Default_: The default value for this parameter.

_Description_: Description of the parameter.

Required parameters will have a bold font on their label column in the table below.

| Name | Label | Default | Description |
| --- | --- | --- | --- |
| AutoscaleNotificationSubscriberEmail | Autoscale notifications subscriber email | | The email address (AWS SNS Topic subscriber) to receive Autoscale notifications. If provided, the template can only accept one email address. An email will be sent to the address to confirm the subscription. |
| AvailabilityZones | **Availability Zones** | |  List of Availability Zones to use for the subnets in the VPC. The FortiGate Autoscale solution uses two Availability Zones from your list and preserves the logical order you specify. |
| BGP ASN | **BgpAsn** | 65000 | The Border Gateway Protocol (BGP) Autonomous System Number (ASN) of the Customer Gateway of each FortiGate-VM instance in the Auto Scaling group. This value ranges from 64512 to 65534. |
| CustomAssetContainer | **Custom asset S3 bucket** | |  The name of the S3 bucket which contains your custom assets. Required if **use custom asset location** is set to **yes**. |
| CustomAssetDirectory | **Custom asset folder** | |  The sub path within the **custom asset container** which serves as the top level directory of all your custom assets. If **use custom asset location** is set to **yes**, and this value is left empty, the **custom asset container** will serve as the top level directory. |
| CustomIdentifier | **Resource name prefix** | fgtASG | An alternative name prefix to be used on a resource that the **Resource tag prefix** cannot apply to. Can only contain numbers, lowercase letters, and uppercase letters. Max length is 10. |
| FgtAsgCooldown | Scaling cooldown period | 300 | The Auto Scaling group waits for the cooldown period (in seconds) to complete before resuming scaling activities. Minimum is 60. Maximum is 3600. |
| FgtAsgDesiredCapacityByol | Desired capacity (BYOL) | 2 | The number of FortiGate instances the BYOL Auto Scaling group should have at any time. For High Availability in BYOL-only and Hybrid use cases, ensure at least 2 FortiGates are in the group. For specific use cases, set to 0 for On-Demand-only, and \&gt;= 2 for BYOL-only or hybrid licensing. |
| FgtAsgDesiredCapacityPayg | Desired capacity (On-Demand) | 0 | The number of FortiGate instances the On-Demand Auto Scaling group should have at any time. For High Availability in a On-Demand-only use case, ensure at least 2 FortiGates are in the group. For specific use cases, set to 0 for BYOL-only, \&gt;= 2 for On-Demand-only, and \&gt;= 0 for hybrid licensing. |
| FgtAsgHealthCheckGracePeriod | Health check grace period | 300 | The length of time (in seconds) that Auto Scaling waits before checking an instance**s health status. Minimum is 60. |
| FgtAsgMaxSizeByol | Maximum group size (BYOL) | 2 | Maximum number of FortiGate instances in the BYOL Auto Scaling group. For specific use cases, set to 0 for On-Demand-only, and \&gt;= 2 for BYOL-only or hybrid licensing. This number must be greater than or equal to the Minimum group size (BYOL). |
| FgtAsgMaxSizePayg | Maximum group size (On-Demand) | 6 | Maximum number of FortiGate instances in the On-Demand Auto Scaling group. For specific use cases, set to 0 for BYOL-only, \&gt;= 2 for On-Demand-only, and \&gt;= 0 for hybrid licensing. This number must be greater than or equal to the Minimum group size (On-Demand). |
| FgtAsgMinSizeByol | Minimum group size (BYOL) | 2 | Minimum number of FortiGate instances in the BYOL Auto Scaling group. For specific use cases, set to 0 for On-Demand-only, and \&gt;= 2 for BYOL-only or hybrid licensing. |
| FgtAsgMinSizePayg | Minimum group size (On-Demand) | 0 | Minimum number of FortiGate instances in the On-Demand Auto Scaling group. For specific use cases, set to 0 for BYOL-only, \&gt;= 2 for On-Demand-only, and \&gt;= 0 for hybrid licensing. |
| FgtAsgScaleInThreshold | Scale-in threshold | 25 | The threshold (in percentage) for the FortiGate Auto Scaling group to scale-in (remove) 1 instance. Minimum is 1. Maximum is 100. |
| FgtAsgScaleOutThreshold | Scale-out threshold | 80 | The threshold (in percentage) for the FortiGate Auto Scaling group to scale-out (add) 1 instance. Minimum is 1. Maximum is 100. |
| FortiAnalyzerAutoscaleAdminPassword | Autoscale admin password | | The password for the **Autoscale admin username**. The password must conform to the FortiAnalyzer password policy and have a min length of 8 and a max length 128. If you need to enable KMS encryption, refer to the documentation. |
| FortiAnalyzerAutoscaleAdminUsername | Autoscale admin username | | The name of the secondary administrator level account in the FortiAnalyzer, which Fortinet FortiGate Auto Scaling uses to connect to the FortiAnalyzer to authorize any FortiGate device in the Auto Scaling group. To conform to the FortiAnalyzer naming policy, the username can only contain numbers, lowercase letters, uppercase letters, and hyphens. It cannot start or end with a hyphen (-). |
| FortiAnalyzerCustomPrivateIpAddress | FortiAnalyzer private IP address | | The custom private IP address to be used by the FortiAnalyzer. Must be within the Public subnet 1 CIDR range. Required if **FortiAnalyzer Integration** is set to **yes**. If **FortiAnalyzer Integration** is set to **no**, any input will be ignored. |
| FortiAnalyzerInstanceType | FortiAnalyzer instance type | m5/large | Instance type to launch as FortiAnalyzer. Instance types are available with different vCPU sizes and bandwidths. For more information, see [Instance Types](https://aws.amazon.com/ec2/instance-types/). |
| FortiAnalyzerIntegrationOptions | FortiAnalyzer integration | yes | Choose **yes** to incorporate FortiAnalyzer into Fortinet FortiGate Auto Scaling to use extended features that include storing logs into FortiAnalyzer. |
| FortiAnalyzerVersion | FortiAnalyzer version | 6.4.7 | The FortiAnalyzer version supported by Fortinet FortiGate Auto Scaling. \*\*IMPORTANT!\*\* Requires a subscription to the Fortinet FortiAnalyzer Centralized Logging/Reporting (10 managed devices) AMI. |
| FortiGateAdminCidr | Admin CIDR block | | CIDR block for external admin management access. \*\*WARNING!\*\* 0.0.0.0/0 accepts connections from any IP address. We recommend that you use a constrained CIDR range to reduce the potential of inbound attacks from unknown IP addresses. |
| FortiGateAdminPort | Admin port | 8443 | A port number for FortiGate administration. Minimum is 1. Maximum is 65535. Do not use the FortiGate reserved ports 443, 541, 514, or 703. |
| FortiGateInstanceType | Instance type | C5.xlarge | Instance type for the FortiGates in the Auto Scaling group. Instance types are available with different vCPU sizes and bandwidths. For more information, see [Instance Types](https://aws.amazon.com/ec2/instance-types/). |
| FortiGatePskSecret | **FortiGate PSK secret** | |  A secret key for the FortiGate instances to securely communicate with each other. Must contain numbers and letters and may contain special characters. Max length is 128. |
| FortiOSVersion | FortiOS version | 7.0.3 | FortiOS version supported by FortiGate Autoscale for AWS. |
| GetLicenseGracePeriod | Get license grace period | 300 | The minimum time (in seconds) permitted before a distributed license can be revoked from a non-responsive FortiGate and re-distributed. Minimum is 300. |
| HeartBeatDelayAllowance | Heart beat delay allowance | 2 | The maximum amount of time (in seconds) allowed for network latency of the FortiGate heartbeat arriving at the Autoscale handler. Minimum is 0. |
| HeartBeatInterval | Heart beat interval | 30 | The length of time (in seconds) that a FortiGate instance waits between sending heartbeat requests to the Autoscale handler. Minimum is 30. Maximum is 90. |
| HeartBeatLossCount | Heart beat loss count | 10 | Number of consecutively lost heartbeats. When the Heartbeat Loss Count has been reached, the VM is deemed unhealthy and fail-over activities will commence. |
| KeyPairName | **Key pair name** | |  Amazon EC2 Key Pair for admin access. |
| LifecycleHookTimeout | Instance lifecycle timeout | 480 | The amount of time (in seconds) that can elapse before the FortiGate Autoscale lifecycle hook times out. Minimum is 60. Maximum is 3600. |
| PrimaryElectionTimeout | Primary election timeout | 300 | The maximum time (in seconds) to wait for the election of the primary instance to complete. Minimum is 30. Maximum is 3600. |
| PublicSubnet1Cidr | Autoscale subnet 1 CIDR | 192.168.0.0/24 | The CIDR block for the subnet located in Availability Zone 1 where the FortiGate Autoscale instances will be deployed to. |
| PublicSubnet2Cidr | Autoscale subnet 2 CIDR | 192.168.1.0/24 | The CIDR block for the subnet located in Availability Zone 2 where the FortiGate Autoscale instances will be deployed to. |
| ResourceTagPrefix | **Resource tag prefix** | |  The ResourceGroup Tag Key used on all resources and as the name prefix of all applicable resources. Can only contain numbers, lowercase letters, uppercase letters, ampersat(@), hyphens (-), period (.), and hash (#). Max length is 50. |
| S3BucketName | **S3 bucket name** | |  Name of the S3 bucket that contains the FortiGate Autoscale deployment package. Can only contain numbers, lowercase letters, uppercase letters, period (.), and hyphens (-). It cannot start or end with a hyphen (-). |
| S3KeyPrefix | **S3 resource folder** | |  Name of the S3 folder that stores the FortiGate Autoscale deployment resources. Can only contain numbers, lowercase letters, uppercase letters, hyphens (-), period (.), and forward slashes (/). If provided, it must end with a forward slash (/). |
| SyncRecoveryCount | Autoscale sync recovery count | 3 | Number of consecutive on-time heartbeats required for a VM to become healthy again. This parameter is only used when **Terminate unhealthy VM** is set to **no** and allows for the VM to recover from an unhealthy state. |
| TerminateUnhealthyVm | Terminate unhealthy VM | no | Terminate any VM that is deemed unhealthy by the Autoscale. |
| TransitGatewayId | Transit Gateway ID | | ID of the Transit Gateway that the FortiGate Autoscale VPC will be attached to. Required when Transit Gateway support is set to &quot;use an existing one&quot;. |
| TransitGatewaySupportOptions | Transit Gateway support | create one | Create a Transit Gateway for the FortiGate Autoscale VPC to attach to, or specify to use an existing one. |
| UseCustomAssetLocation | Use custom asset location | no | Set to yes to use a custom S3 location for custom assets such as licenses and customized configsets. |
| VpcCidr | **VPC CIDR** | |  Classless Inter-Domain Routing (CIDR) block for the FortiGate Autoscale VPC. |
