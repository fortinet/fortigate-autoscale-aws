/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
    AwsTestMan,
    createTestAwsTgwScheduledEventHandler,
    MockAutoScaling,
    MockDocClient,
    MockEC2,
    MockElbv2,
    MockLambda,
    MockS3
} from '@fortinet/fortigate-autoscale/dist/aws/test-helper';
import { Context, ScheduledEvent } from 'aws-lambda';
import * as HttpStatusCode from 'http-status-codes';
import { describe, it } from 'mocha';
import * as path from 'path';
import Sinon from 'sinon';

describe('FortiGate Transit Gateway VPN attachment.', () => {
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
    before(function() {
        process.env.RESOURCE_TAG_PREFIX = '';
        mockDataRootDir = path.resolve(__dirname, './mockup-data');
        awsTestMan = new AwsTestMan(mockDataRootDir);
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
    it('Customer Gateway creation, VPN creation, VPN attachment during launching. Continue if all succeeded.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'aws-tgw-vpn-attachment-launching');
        event = await awsTestMan.fakeLaunchingVmRequest(
            path.resolve(mockDataDir, 'request/event-launching-vm.json')
        );
        context = await awsTestMan.fakeLambdaContext();

        const {
            autoscale,
            env,
            platformAdaptee: awsPlatformAdaptee,
            platformAdapter: awsPlatformAdapter,
            proxy
        } = await createTestAwsTgwScheduledEventHandler(event, context);

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = awsPlatformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');

        // enable it to use a sequential mockup data for each call fake
        mockEC2.enableSequentialFakeCall('describeTransitGatewayAttachments');

        await autoscale.handleAutoscaleRequest(proxy, awsPlatformAdapter, env);

        // ASSERT: proxy responds with http code 200 and empty body
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);
    });
    it(
        'Customer Gateway creation, VPN creation, VPN attachment during launching. ' +
            'Abandon the lifecycle hook if attachment failed.',
        async () => {
            mockDataDir = path.resolve(mockDataRootDir, 'aws-tgw-vpn-attachment-launching');
            event = await awsTestMan.fakeLaunchingVmRequest(
                path.resolve(mockDataDir, 'request/event-launching-vm.json')
            );
            context = await awsTestMan.fakeLambdaContext();

            const {
                autoscale,
                env,
                platformAdaptee: awsPlatformAdaptee,
                platformAdapter: awsPlatformAdapter,
                proxy
            } = await createTestAwsTgwScheduledEventHandler(event, context);

            ({
                s3: mockS3,
                ec2: mockEC2,
                autoscaling: mockAutoscaling,
                elbv2: mockElbv2,
                lambda: mockLambda,
                docClient: mocDocClient
            } = awsPlatformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

            const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
            const spyCompleteLifecycleAction = Sinon.spy(
                awsPlatformAdapter,
                'completeLifecycleAction'
            );

            // make the attachment never available in order to fail
            mockEC2.callSubOnNthFake(
                'describeTransitGatewayAttachments',
                1,
                'unavailable',
                false // make this redirecting to the sub call a permanent change
            );

            await autoscale.handleAutoscaleRequest(proxy, awsPlatformAdapter, env);

            // ASSERT: the launching lifecycle is abandonned.
            Sinon.assert.match(
                spyCompleteLifecycleAction.calledWith(Sinon.match(Sinon.match.any), false),
                true
            );

            // ASSERT: proxy responds with http code 200 and empty body
            Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);
        }
    );
    it('Customer Gateway deletion, VPN deletion, VPN detachment during terminating. ', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'aws-tgw-vpn-attachment-terminating');
        event = await awsTestMan.fakeLaunchingVmRequest(
            path.resolve(mockDataDir, 'request/event-terminating-vm.json')
        );
        context = await awsTestMan.fakeLambdaContext();

        const {
            autoscale,
            env,
            platformAdaptee: awsPlatformAdaptee,
            platformAdapter: awsPlatformAdapter,
            proxy
        } = await createTestAwsTgwScheduledEventHandler(event, context);

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = awsPlatformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        const { heartbeatSyncStrategy } = autoscale.expose();
        const stubHartbeatSyncStrategy = Sinon.stub(heartbeatSyncStrategy, 'forceOutOfSync');
        stubHartbeatSyncStrategy.callsFake(async () => {
            stubHartbeatSyncStrategy.restore();
            const callCount = mocDocClient.getStub('get').callCount;
            mocDocClient.callSubOnNthFake('get', callCount + 3, 'out-of-sync', true);
            return await heartbeatSyncStrategy.forceOutOfSync();
        });

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
        const spyDeleteTgwVpnAttachmentRecord = Sinon.spy(
            awsPlatformAdapter,
            'deleteTgwVpnAttachmentRecord'
        );
        const spyAutoscaleHandleVpnDetachmentReturn = await Sinon.spy(
            autoscale,
            'handleVpnDetachment'
        ).returnValues;

        const vpnAttachmentRecordReturn = Sinon.spy(awsPlatformAdapter, 'getTgwVpnAttachmentRecord')
            .returnValues;

        await autoscale.handleAutoscaleRequest(proxy, awsPlatformAdapter, env);

        const vpnAttachmentRecord = await vpnAttachmentRecordReturn[0];
        const handleVpnDetachmentResult = await spyAutoscaleHandleVpnDetachmentReturn[0];

        // ASSERT: delete vpn connection is called.
        Sinon.assert.match(mockEC2.getStub('deleteVpnConnection').callCount, 1);
        // ASSERT: delete customer gateway is called.
        Sinon.assert.match(mockEC2.getStub('deleteCustomerGateway').callCount, 1);
        // ASSERT: delete tgw vpn attachment record.
        Sinon.assert.match(
            spyDeleteTgwVpnAttachmentRecord.calledWith(
                vpnAttachmentRecord.vmId,
                vpnAttachmentRecord.ip
            ),
            true
        );
        // ASSERT: handle vpn detachment returns empty string.
        Sinon.assert.match(handleVpnDetachmentResult, 'should-continue');
        // ASSERT: proxy responds with http code 200 and empty body
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);
    });
});
