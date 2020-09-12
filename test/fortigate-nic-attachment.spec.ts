/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
    AutoscaleEnvironment,
    AwsPlatformAdapter,
    AwsTestMan,
    createTestAwsScheduledEventHandler,
    MockAutoScaling,
    MockDocClient,
    MockEC2,
    MockElbv2,
    MockLambda,
    MockS3,
    TestAwsFortiGateAutoscale,
    TestAwsPlatformAdaptee,
    TestAwsScheduledEventProxy
} from 'autoscale-core';
import { Context, ScheduledEvent } from 'aws-lambda';
import * as HttpStatusCode from 'http-status-codes';
import { describe, it } from 'mocha';
import * as path from 'path';
import Sinon from 'sinon';

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
        process.env.RESOURCE_TAG_PREFIX = '';
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
        context = await awsTestMan.fakeLambdaContext();

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

        await autoscale.handleAutoscaleRequest(proxy, awsPlatformAdapter, env);

        // ASSERT: proxy responds with http code 200 and empty body
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);
    });

    it('Attach the 2nd ENI to a FortiGate vm. Abandon the lifecycle hook if attachment failed.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'nic-attachment-launching');
        event = await awsTestMan.fakeLaunchingVmRequest(
            path.resolve(mockDataDir, 'request/event-launching-vm.json')
        );
        context = await awsTestMan.fakeLambdaContext();

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

        await autoscale.handleAutoscaleRequest(proxy, awsPlatformAdapter, env);

        // ASSERT: the launching lifecycle is abandonned.
        Sinon.assert.match(
            spyCompleteLifecycleAction.calledWith(Sinon.match(Sinon.match.any), false),
            true
        );

        // ASSERT: proxy responds with http code 200 and empty body
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);
    });
});
