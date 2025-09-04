/**
 * Create a systems manager session URL for the specified EC2 instance.
 * @param instanceId The ID of the EC2 instance.
 * @param region The AWS region where the instance is located.
 * @returns The session URL for the EC2 instance.
 */
export function createSSMSessionUrl(instanceId: string, region: string): string {
    return `https://${region}.console.aws.amazon.com/systems-manager/session-manager/${instanceId}?region=${region}`;
}