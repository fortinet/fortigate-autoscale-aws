/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as path from 'path';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import * as HttpStatusCode from 'http-status-codes';
import { ScheduledEvent, Context } from 'aws-lambda';
import { AwsPlatformAdapter, AutoscaleEnvironment } from 'autoscale-core';
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
import { TestAwsFortiGateAutoscale } from './test-helper-class/test-aws-fortigate-autoscale';
import { TestAwsScheduledEventProxy } from './test-helper-class/test-aws-scheduled-event-proxy';

export const createTestAwsScheduledEventHandler = (
    event: ScheduledEvent,
    context: Context
): {
    autoscale: TestAwsFortiGateAutoscale<ScheduledEvent, Context, void>;
    env: AutoscaleEnvironment;
    platformAdaptee: TestAwsPlatformAdaptee;
    platformAdapter: AwsPlatformAdapter;
    proxy: TestAwsScheduledEventProxy;
} => {
    const env = {} as AutoscaleEnvironment;
    const proxy = new TestAwsScheduledEventProxy(event, context);
    const p = new TestAwsPlatformAdaptee();
    const pa = new AwsPlatformAdapter(p, proxy);
    const autoscale = new TestAwsFortiGateAutoscale<ScheduledEvent, Context, void>(pa, env, proxy);
    return {
        autoscale: autoscale,
        env: env,
        platformAdaptee: p,
        platformAdapter: pa,
        proxy: proxy
    };
};

describe('FortiGate secondary ENI attachment.', () => {
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
    let event: ScheduledEvent;
    let autoscale: TestAwsFortiGateAutoscale<ScheduledEvent, Context, void>;
    let env: AutoscaleEnvironment;
    let awsPlatformAdaptee: TestAwsPlatformAdaptee;
    let awsPlatformAdapter: AwsPlatformAdapter;
    let proxy: TestAwsScheduledEventProxy;
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
        Sinon.restore();
    });
    it('Attach the 2nd ENI to a FortiGate vm. Continue if attachment succeeded.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'nic-attachment-launching');
        event = await awsTestMan.fakeLaunchingVmRequest(
            path.resolve(mockDataDir, 'request/event-launching-vm.json')
        );
        context = await awsTestMan.fakeApiGatewayContext();

        ({
            autoscale,
            env,
            platformAdaptee: awsPlatformAdaptee,
            platformAdapter: awsPlatformAdapter,
            proxy
        } = await createTestAwsScheduledEventHandler(event, context));

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = awsPlatformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');

        mockEC2.hookOnStub('attachNetworkInterface', testFixture => {
            const callCount = mockEC2.getStub('describeNetworkInterfaces').callCount;
            // to emulate the state changes of the eni attachment.
            mockEC2.callSubOnNthFake('describeNetworkInterfaces', callCount + 2, 'attaching', true);
            mockEC2.callSubOnNthFake('describeNetworkInterfaces', callCount + 4, 'attached', true);
        });

        await autoscale.handleCloudFunctionRequest(proxy, awsPlatformAdapter, env);

        // ASSERT: proxy responds with http code 200 and empty body
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);
    });

    it('Attach the 2nd ENI to a FortiGate vm. Terminate the instance if attachment failed.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'nic-attachment-launching');
        event = await awsTestMan.fakeLaunchingVmRequest(
            path.resolve(mockDataDir, 'request/event-launching-vm.json')
        );
        context = await awsTestMan.fakeApiGatewayContext();

        ({
            autoscale,
            env,
            platformAdaptee: awsPlatformAdaptee,
            platformAdapter: awsPlatformAdapter,
            proxy
        } = await createTestAwsScheduledEventHandler(event, context));

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = awsPlatformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
        const spyCompleteLifecycleAction = Sinon.spy(awsPlatformAdapter, 'completeLifecycleAction');

        // let attachingEniId: string;

        mockEC2.hookOnStub('attachNetworkInterface', testFixture => {
            const callCount = mockEC2.getStub('describeNetworkInterfaces').callCount;
            // to emulate the state changes of the eni attachment.
            // make it never become attached
            mockEC2.callSubOnNthFake(
                'describeNetworkInterfaces',
                callCount + 2,
                'attaching',
                false // make this redirecting to the sub call a permanent change
            );
        });

        await autoscale.handleCloudFunctionRequest(proxy, awsPlatformAdapter, env);

        // ASSERT: the launching lifecycle is abandonned.
        Sinon.assert.match(
            spyCompleteLifecycleAction.calledWith(Sinon.match(Sinon.match.any), false),
            true
        );

        // ASSERT: proxy responds with http code 200 and empty body
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);
    });
});
