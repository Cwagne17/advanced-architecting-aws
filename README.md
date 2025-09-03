# Advanced Architecting on AWS Labs

This repository contains AWS CDK code for the labs in the "Advanced Architecting on AWS" course. Each lab is implemented as a separate stack in the `src/stacks` directory.

## Lab 1: Securing Amazon S3 VPC Endpoint Communications

![Lab 1 Architecture Diagram](./assets/lab1-architecture.png)

### Lab overview

Data security is crucial and should always be your first priority. Amazon Web Services (AWS) offers several solutions and best practices to help secure your data. Understanding how to make the best decisions to secure your data can be challenging. Running applications in private subnets, which have no route to the internet, provides data security by limiting the attack surface to only internal traffic. This strategy is a great security measure.However, it can cause problems when your application must access data from services such as Amazon Simple Storage Service (Amazon S3).

To solve this problem, AWS provides Amazon Virtual Private Cloud (Amazon VPC) endpoints. With a VPC endpoint, you can privately connect your VPC to supported AWS services. This private connection is possible without requiring an internet gateway, a NAT gateway, a VPN connection, or an AWS Direct Connect connection. Communication through the VPC endpoint does not require resources in your VPC to have public IP addresses. Thus, traffic through your VPC endpoint can stay within the Amazon network.

In this lab, you create VPC endpoints. You then use these endpoints to access Amazon S3 from an Amazon Elastic Compute Cloud (Amazon EC2) instance that is located in a private subnet. To further improve data security, you create a VPC endpoint policy to restrict use of the endpoint to specific resources.

### Objectives

After completing this lab, you will be able to:

- Understand private and public subnets and why they can or cannot communicate with Amazon S3.
- Configure VPC endpoints using the AWS Management Console and AWS Command Line Interface (AWS CLI).
- Interact with Amazon S3 through a VPC endpoint in a private subnet.
- Create a VPC endpoint policy to restrict resource access.

## Lab 2: Configuring Transit Gateways

## Lab 3: Deploying an Application with Amazon ECS on Fargate

## Lab 4: Setting Up a Data Lake with Lake Formation

## Lab 5: Migrating an On-Premises NFS Share Using AWS DataSync and Storage Gateway
