/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as path from 'path';
import { describe, it } from 'mocha';
import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { AwsPlatformAdapter, AutoscaleEnvironment } from 'autoscale-core';
import { AwsFortiGateAutoscale } from 'autoscale-core/dist/fortigate-autoscale/aws/aws-fortigate-autoscale';
import {
    AwsTestMan,
    MockEC2,
    MockS3,
    MockAutoScaling,
    MockElbv2,
    MockLambda,
    MockDocClient
} from 'autoscale-core/dist/scripts/aws-testman';

import { TestAwsPlatformAdaptee } from './test-helper-class/test-aws-platform-adaptee';
import { TestAwsApiGatewayEventProxy } from './test-helper-class/test-aws-api-gateway-event-proxy';

export const createAwsApiGatewayEventHandler = (
    event: APIGatewayProxyEvent,
    context: Context
): {
    autoscale: AwsFortiGateAutoscale<APIGatewayProxyEvent, Context, APIGatewayProxyResult>;
    env: AutoscaleEnvironment;
    platformAdaptee: TestAwsPlatformAdaptee;
    platformAdapter: AwsPlatformAdapter;
    proxy: TestAwsApiGatewayEventProxy;
} => {
    const env = {} as AutoscaleEnvironment;
    const proxy = new TestAwsApiGatewayEventProxy(event, context);
    const p = new TestAwsPlatformAdaptee();
    const pa = new AwsPlatformAdapter(p, proxy);
    const autoscale = new AwsFortiGateAutoscale<
        APIGatewayProxyEvent,
        Context,
        APIGatewayProxyResult
    >(pa, env, proxy);
    return {
        autoscale: autoscale,
        env: env,
        platformAdaptee: p,
        platformAdapter: pa,
        proxy: proxy
    };
};

describe('FortiGate get bootstrap configuration.', () => {
    let mockDataRootDir: string;
    let awsTestMan: AwsTestMan;
    let mockEC2: MockEC2;
    let mockS3: MockS3;
    let mockAutoscaling: MockAutoScaling;
    let mockElbv2: MockElbv2;
    let mockLambda: MockLambda;
    let mocDocClient: MockDocClient;
    let mockDataDir: string;
    let context: Context;
    let event: APIGatewayProxyEvent;
    let autoscale: AwsFortiGateAutoscale<APIGatewayProxyEvent, Context, APIGatewayProxyResult>;
    let env: AutoscaleEnvironment;
    let awsPlatformAdaptee: TestAwsPlatformAdaptee;
    let awsPlatformAdapter: AwsPlatformAdapter;
    let proxy: TestAwsApiGatewayEventProxy;
    before(function() {
        mockDataRootDir = path.resolve(__dirname, './mockup-data');
        awsTestMan = new AwsTestMan(mockDataRootDir);
        awsPlatformAdaptee = new TestAwsPlatformAdaptee();
    });
    after(function() {
        mockEC2.restoreAll();
        mockS3.restoreAll();
        mockElbv2.restoreAll();
        mockLambda.restoreAll();
        mockAutoscaling.restoreAll();
        mocDocClient.restoreAll();
    });
    it('Bootstrap from an instance in master group.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'bootstrap-master-group-instance');
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-get-config.json')
        );
        context = await awsTestMan.fakeApiGatewayContext();

        ({
            autoscale,
            env,
            platformAdaptee: awsPlatformAdaptee,
            platformAdapter: awsPlatformAdapter,
            proxy
        } = await createAwsApiGatewayEventHandler(event, context));

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = awsPlatformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        await autoscale.handleCloudFunctionRequest(proxy, awsPlatformAdapter, env);
        console.log('done');
    });
    it('Bootstrap from an instance in non-master group.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'bootstrap-non-master-group-instance');
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-get-config.json')
        );
        context = await awsTestMan.fakeApiGatewayContext();

        ({
            autoscale,
            env,
            platformAdaptee: awsPlatformAdaptee,
            platformAdapter: awsPlatformAdapter,
            proxy
        } = await createAwsApiGatewayEventHandler(event, context));

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = awsPlatformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        await autoscale.handleCloudFunctionRequest(proxy, awsPlatformAdapter, env);
        console.log('done');
    });
});
