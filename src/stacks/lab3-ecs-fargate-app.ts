import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Instance, InstanceClass, InstanceSize, InstanceType, MachineImage, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { Cluster, ContainerImage } from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { Construct } from "constructs";
import { createSSMSessionUrl } from "../shared/create-session-url";

export class Lab3ECSFargateAppStack extends Stack {
    vpc: Vpc;
    commandHost: Instance;
    repository: Repository;
    cluster: Cluster;
    service: ApplicationLoadBalancedFargateService;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        // Create an IPv4 VPC with one public subnet across two availability zones
        this.vpc = new Vpc(this, "Vpc", {
            maxAzs: 2,
            natGateways: 0,
            subnetConfiguration: [
                {
                    name: "lab3-public-subnet",
                    subnetType: SubnetType.PUBLIC,
                }
            ],
            restrictDefaultSecurityGroup: false
        });

        // Create a Command Host for running lab commands
        this.commandHost = new Instance(this, "CommandHost", {
            vpc: this.vpc,
            vpcSubnets: { subnetType: SubnetType.PUBLIC },
            instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.NANO),
            machineImage: MachineImage.latestAmazonLinux2023(),
        });
        this.commandHost.addUserData(
            "yum update -y",
            "yum install -y docker",
            "systemctl enable docker",
            "usermod -aG docker $USER",
        );

        // Create an ECR repository
        const repository = new Repository(this, "Web2048Repository", {
            repositoryName: "web-2048",
            emptyOnDelete: true,
            removalPolicy: RemovalPolicy.DESTROY,
        });
        repository.grantPullPush(this.commandHost.role);

        this.cluster = new Cluster(this, "EcsCluster", {
            vpc: this.vpc,
            enableFargateCapacityProviders: true,
        });

        this.service = new ApplicationLoadBalancedFargateService(this, "Web2048Service", {
            serviceName: "web2048",
            cluster: this.cluster,
            taskImageOptions: {
                containerName: "web2048",
                family: "web2048",
                image: ContainerImage.fromEcrRepository(repository),
                enableLogging: false,
            },
            desiredCount: 1,
        });

        // Output the following information for the lab
        new CfnOutput(this, "CommandHostSessionURL", {
            value: createSSMSessionUrl(this.commandHost.instanceId, this.region),
            description: "SSM Session URL for Command Host",
        });

        new CfnOutput(this, "PublicSubnetIDs", {
            value: this.vpc.publicSubnets.map(subnet => subnet.subnetId).join(","),
            description: "Public Subnet IDs",
        });

        new CfnOutput(this, "Region", {
            value: this.region,
            description: "AWS Region",
        });

        new CfnOutput(this, "AlbPublicDnsUrl", {
            value: this.service.loadBalancer.loadBalancerDnsName,
            description: "Application Load Balancer Public DNS URL",
        });

        new CfnOutput(this, "EcsSecurityGroup", {
            value: this.service.service.connections.securityGroups[0].securityGroupId,
            description: "ECS Service Security Group",
        });

        if (this.service.taskDefinition.executionRole) {
            new CfnOutput(this, "EcsTaskExecutionRoleArn", {
                value: this.service.taskDefinition.executionRole.roleArn,
                description: "ECS Task Execution Role ARN",
            });
        }

        new CfnOutput(this, "AlbTargetGroupArn", {
            value: this.service.targetGroup.targetGroupArn,
            description: "Application Load Balancer Target Group ARN",
        });
    }
}