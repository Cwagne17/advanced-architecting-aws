import { App } from "aws-cdk-lib";
import { ACCOUNT, REGION } from "./constants";
import { Lab1SecureS3EndpointStack } from "./stacks/lab1-secure-s3-endpoint";
import { Lab2TransitGatewayStack } from "./stacks/lab2-transit-gateway";
import { Lab3ECSFargateAppStack } from "./stacks/lab3-ecs-fargate-app";
import { Lab4LakeFormationStack } from "./stacks/lab4-lake-formation";
import { Lab5NFSDataSyncStack } from "./stacks/lab5-nfs-data-sync";

const stackProps = {
  env: {
    account: ACCOUNT,
    region: REGION,
  }
};

const app = new App();

new Lab1SecureS3EndpointStack(app, "Lab1", stackProps);
new Lab2TransitGatewayStack(app, "Lab2", stackProps);
new Lab3ECSFargateAppStack(app, "Lab3", stackProps);
new Lab4LakeFormationStack(app, "Lab4", stackProps);
new Lab5NFSDataSyncStack(app, "Lab5", stackProps);

app.synth();