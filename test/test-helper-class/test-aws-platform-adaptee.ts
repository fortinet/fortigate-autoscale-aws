import { AwsPlatformAdaptee } from 'autoscale-core';
import {
    MockEC2,
    MockS3,
    MockAutoScaling,
    MockElbv2,
    MockLambda,
    MockDocClient
} from 'autoscale-core/dist/scripts/aws-testman';
export class TestAwsPlatformAdaptee extends AwsPlatformAdaptee {
    stubAwsServices(
        mockDataDir: string
    ): {
        s3: MockS3;
        ec2: MockEC2;
        autoscaling: MockAutoScaling;
        elbv2: MockElbv2;
        lambda: MockLambda;
        docClient: MockDocClient;
    } {
        const ec2TestFixture = new MockEC2(this.ec2, mockDataDir);
        const s3TestFixture = new MockS3(this.s3, mockDataDir);
        const autoscalingTestFixture = new MockAutoScaling(this.autoscaling, mockDataDir);
        const elbv2TestFixture = new MockElbv2(this.elbv2, mockDataDir);
        const lambdaTestFixture = new MockLambda(this.lambda, mockDataDir);
        const docClientTestFixture = new MockDocClient(this.docClient, mockDataDir);
        return {
            s3: s3TestFixture,
            ec2: ec2TestFixture,
            autoscaling: autoscalingTestFixture,
            elbv2: elbv2TestFixture,
            lambda: lambdaTestFixture,
            docClient: docClientTestFixture
        };
    }
}
