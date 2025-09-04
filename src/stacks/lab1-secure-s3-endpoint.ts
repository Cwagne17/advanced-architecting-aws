import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { GatewayVpcEndpointAwsService, Instance, InstanceClass, InstanceSize, InstanceType, InterfaceVpcEndpointAwsService, MachineImage, SubnetType, UserData, Vpc } from "aws-cdk-lib/aws-ec2";
import { AnyPrincipal, Effect, InstanceProfile, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { join } from "path";
import { createSSMSessionUrl } from "../shared/create-session-url";

export class Lab1SecureS3EndpointStack extends Stack {
    vpc: Vpc;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        // Create VPC in one AZ with SSM and S3 endpoints
        this.vpc = new Vpc(this, "Lab1VPC", {
            maxAzs: 1,
            natGateways: 0,
            subnetConfiguration: Vpc.DEFAULT_SUBNETS_NO_NAT,
            restrictDefaultSecurityGroup: false,
        });
        this.vpc.addInterfaceEndpoint("SSMEndpoint", {
            service: InterfaceVpcEndpointAwsService.SSM,
            subnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
        });
        const s3GatewayEndpoint = this.vpc.addGatewayEndpoint("S3Endpoint", {
            service: GatewayVpcEndpointAwsService.S3,
            subnets: [{ subnetType: SubnetType.PRIVATE_ISOLATED }],
        });

        // Create S3 buckets
        const labBucket = this.createS3Bucket(`lab-bucket-${this.account}-${this.region}`);
        const labLoggingBucket = this.createS3Bucket(`lab-logging-bucket-${this.account}-${this.region}`);

        // Create demo.txt file and upload to LabBucket
        new BucketDeployment(this, "DeployDemoFile", {
            sources: [Source.asset(join(__dirname, "..", "..", "public", "demo.txt"))],
            destinationBucket: labBucket,
        });

        // Create policy for S3 Gateway Endpoint
        s3GatewayEndpoint.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            principals: [new AnyPrincipal()],
            actions: ["s3:*"],
            resources: [
                labBucket.bucketArn,
                `${labBucket.bucketArn}/*`,
            ],
        }));
        s3GatewayEndpoint.addToPolicy(new PolicyStatement({
            effect: Effect.DENY,
            principals: [new AnyPrincipal()],
            actions: ["s3:*"],
            resources: [
                labLoggingBucket.bucketArn,
                `${labLoggingBucket.bucketArn}/*`,
            ],
        }));

        // IAM role for EC2 instances to use Session Manager and S3
        const ec2Role = new Role(this, "EC2Role", {
            assumedBy: new ServicePrincipal("amazonaws.com"),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
            ],
            inlinePolicies: {
                S3Access: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            effect: Effect.ALLOW,
                            actions: ["s3:*"],
                            resources: ["*"],
                        }),
                    ],
                }),
            },
        });
        new InstanceProfile(this, "EC2InstanceProfile", {
            role: ec2Role,
        });

        // Create command hosts
        const publicCommandHost = this.createCommandHost(ec2Role, SubnetType.PUBLIC);
        const privateCommandHost = this.createCommandHost(ec2Role, SubnetType.PRIVATE_ISOLATED);

        // Outputs
        new CfnOutput(this, "VPCId", {
            value: this.vpc.vpcId,
            description: "VPC ID for Lab 1",
        });

        new CfnOutput(this, "PublicCommandHostSessionURL", {
            value: createSSMSessionUrl(publicCommandHost.instanceId, this.region),
            description: "Public Command Host Session URL",
        });

        new CfnOutput(this, "PrivateCommandHostSessionURL", {
            value: createSSMSessionUrl(privateCommandHost.instanceId, this.region),
            description: "Private Command Host Session URL",
        });

        new CfnOutput(this, "LabBucketName", {
            value: labBucket.bucketName,
            description: "Lab Bucket Name",
        });

        new CfnOutput(this, "LabLoggingBucketName", {
            value: labLoggingBucket.bucketName,
            description: "Lab Logging Bucket Name",
        });

        new CfnOutput(this, "S3GatewayEndpointId", {
            value: s3GatewayEndpoint.vpcEndpointId,
            description: "S3 Gateway Endpoint ID",
        });
    }

    private createCommandHost(role: Role, subnetType: SubnetType): Instance {
        return new Instance(this, "PrivateCommandHost", {
            vpc: this.vpc,
            vpcSubnets: { subnetType },
            instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
            machineImage: MachineImage.latestAmazonLinux2023(),
            role,
            userData: UserData.forLinux(),
        });
    }

    private createS3Bucket(bucketName: string): Bucket {
        return new Bucket(this, bucketName, {
            bucketName: bucketName,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        });
    }
}