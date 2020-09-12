/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
    AwsTestMan,
    compare,
    createTestAwsApiGatewayEventHandler,
    MockAutoScaling,
    MockDocClient,
    MockEC2,
    MockElbv2,
    MockLambda,
    MockS3
} from 'autoscale-core';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import * as HttpStatusCode from 'http-status-codes';
import { describe, it } from 'mocha';
import * as path from 'path';
import Sinon from 'sinon';

describe('FortiGate first heartbeat sync.', () => {
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
    it('First heartbeat from the pending primary.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'heartbeat-first-primary-me-pending');
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-heartbeat-sync.json')
        );
        context = await awsTestMan.fakeLambdaContext();

        const {
            autoscale,
            env,
            platformAdaptee,
            platformAdapter,
            proxy
        } = await createTestAwsApiGatewayEventHandler(event, context);

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = platformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
        const spyPromisesPrimaryElectionResult = Sinon.spy(autoscale, 'handlePrimaryElection')
            .returnValues;

        const stubAdapterListPrimaryRoleVmId = Sinon.stub(platformAdapter, 'listPrimaryRoleVmId');

        stubAdapterListPrimaryRoleVmId.callsFake(async () => {
            const callCount = mockEC2.getStub('describeInstances').callCount;
            mockEC2.callSubOnNthFake(
                'describeInstances',
                callCount + 1,
                'i-0000000000byol001',
                true
            );
            stubAdapterListPrimaryRoleVmId.restore();
            return await platformAdapter.listPrimaryRoleVmId();
        });

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const primaryElectionResult = await spyPromisesPrimaryElectionResult[0];
        const candidate = primaryElectionResult.candidate;
        const newPrimary = primaryElectionResult.newPrimary;
        const newPrimaryRecord = primaryElectionResult.newPrimaryRecord;

        // ASSERT: new primary elected
        Sinon.assert.match(newPrimary !== null, true);
        // ASSERT: new primary should be done
        Sinon.assert.match(newPrimaryRecord.voteState, 'done');
        // ASSERT: candidate is the new primary
        Sinon.assert.match(compare(candidate).isEqualTo(newPrimary), true);

        // ASSERT: proxy responds with http code 200 and candidate's private ip as primary ip
        Sinon.assert.match(
            spyProxyFormatResponse.calledWith(
                HttpStatusCode.OK,
                JSON.stringify({ 'master-ip': candidate.primaryPrivateIpAddress })
            ),
            true
        );

        stubAdapterListPrimaryRoleVmId.restore();
        spyProxyFormatResponse.restore();
    });
    it('First heartbeat from secondary (BYOL). Primary election is pending.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'heartbeat-first-secondary-me-pending');
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-heartbeat-sync.json')
        );
        context = await awsTestMan.fakeLambdaContext();

        const {
            autoscale,
            env,
            platformAdaptee,
            platformAdapter,
            proxy
        } = await createTestAwsApiGatewayEventHandler(event, context);

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = platformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
        const spyPromisesPrimaryElectionResult = Sinon.spy(autoscale, 'handlePrimaryElection')
            .returnValues;

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const primaryElectionResult = await spyPromisesPrimaryElectionResult[0];
        const newPrimary = primaryElectionResult.newPrimary;
        const oldPrimary = primaryElectionResult.oldPrimary;
        const oldPrimaryRecord = primaryElectionResult.oldPrimaryRecord;

        // ASSERT: no new primary elected
        Sinon.assert.match(newPrimary, null);
        // ASSERT: old primary is available
        Sinon.assert.match(oldPrimary !== null, true);
        // ASSERT: old primary is still pending
        Sinon.assert.match(oldPrimaryRecord.voteState, 'pending');

        // ASSERT: proxy responds with http code 200 and empty body
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);
    });
    it('First heartbeat from secondary (BYOL). Primary election timed out.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'heartbeat-first-secondary-me-timed-out');
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-heartbeat-sync.json')
        );
        context = await awsTestMan.fakeLambdaContext();

        const {
            autoscale,
            env,
            platformAdaptee,
            platformAdapter,
            proxy
        } = await createTestAwsApiGatewayEventHandler(event, context);

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = platformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
        const spyPromisesPrimaryElectionResult = Sinon.spy(autoscale, 'handlePrimaryElection')
            .returnValues;

        const stubAdapterListPrimaryRoleVmId = Sinon.stub(platformAdapter, 'listPrimaryRoleVmId');

        stubAdapterListPrimaryRoleVmId.callsFake(async () => {
            const callCount = mockEC2.getStub('describeInstances').callCount;
            mockEC2.callSubOnNthFake(
                'describeInstances',
                callCount + 1,
                'i-0000000000byol001',
                true
            );
            stubAdapterListPrimaryRoleVmId.restore();
            return await platformAdapter.listPrimaryRoleVmId();
        });

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const primaryElectionResult = await spyPromisesPrimaryElectionResult[0];
        const candidate = primaryElectionResult.candidate;
        const newPrimary = primaryElectionResult.newPrimary;
        const oldPrimary = primaryElectionResult.oldPrimary;

        // ASSERT: new primary elected
        Sinon.assert.match(newPrimary !== null, true);
        // ASSERT: old primary is available
        Sinon.assert.match(oldPrimary !== null, true);
        // ASSERT: candidate is the new primary
        Sinon.assert.match(compare(candidate).isEqualTo(newPrimary), true);

        // ASSERT: proxy responds with http code 200 and candidate's private ip as primary ip
        Sinon.assert.match(
            spyProxyFormatResponse.calledWith(
                HttpStatusCode.OK,
                JSON.stringify({ 'master-ip': candidate.primaryPrivateIpAddress })
            ),
            true
        );
        spyProxyFormatResponse.restore();
    });
    it('First heartbeat from secondary (BYOL). Primary election is done. Primary is healthy.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'heartbeat-first-secondary-me-done-healthy');
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-heartbeat-sync.json')
        );
        context = await awsTestMan.fakeLambdaContext();

        const {
            autoscale,
            env,
            platformAdaptee,
            platformAdapter,
            proxy
        } = await createTestAwsApiGatewayEventHandler(event, context);

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = platformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
        const spyPromisesPrimaryElectionResult = Sinon.spy(autoscale, 'handlePrimaryElection')
            .returnValues;

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const primaryElectionResult = await spyPromisesPrimaryElectionResult[0];
        const newPrimary = primaryElectionResult.newPrimary;
        const oldPrimary = primaryElectionResult.oldPrimary;
        const oldPrimaryRecord = primaryElectionResult.oldPrimaryRecord;

        // ASSERT: no new primary elected
        Sinon.assert.match(newPrimary, null);
        // ASSERT: old primary is available
        Sinon.assert.match(oldPrimary !== null, true);
        // ASSERT: old primary is done
        Sinon.assert.match(oldPrimaryRecord.voteState, 'done');

        // ASSERT: proxy responds with http code 200 and oldPrimary's private ip as primary ip
        Sinon.assert.match(
            spyProxyFormatResponse.calledWith(
                HttpStatusCode.OK,
                JSON.stringify({ 'master-ip': oldPrimary.primaryPrivateIpAddress })
            ),
            true
        );
    });
    it('First heartbeat from secondary (BYOL). Primary election is done. Primary is unhealthy. Replace primary role.', async () => {
        mockDataDir = path.resolve(
            mockDataRootDir,
            'heartbeat-first-secondary-me-done-unhealthy-replaced'
        );
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-heartbeat-sync.json')
        );
        context = await awsTestMan.fakeLambdaContext();

        const {
            autoscale,
            env,
            platformAdaptee,
            platformAdapter,
            proxy
        } = await createTestAwsApiGatewayEventHandler(event, context);

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = platformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
        const spyPromisesPrimaryElectionResult = Sinon.spy(autoscale, 'handlePrimaryElection')
            .returnValues;

        const stubAdapterListPrimaryRoleVmId = Sinon.stub(platformAdapter, 'listPrimaryRoleVmId');

        stubAdapterListPrimaryRoleVmId.callsFake(async () => {
            const callCount = mockEC2.getStub('describeInstances').callCount;
            mockEC2.callSubOnNthFake(
                'describeInstances',
                callCount + 1,
                'i-0000000000byol001',
                true
            );
            stubAdapterListPrimaryRoleVmId.restore();
            return await platformAdapter.listPrimaryRoleVmId();
        });

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const primaryElectionResult = await spyPromisesPrimaryElectionResult[0];
        const candidate = primaryElectionResult.candidate;
        const newPrimary = primaryElectionResult.newPrimary;

        // ASSERT: new primary elected
        Sinon.assert.match(newPrimary !== null, true);
        // ASSERT: candidate is the new primary
        Sinon.assert.match(compare(candidate).isEqualTo(newPrimary), true);

        // ASSERT: proxy responds with http code 200 and candidate's private ip as primary ip
        Sinon.assert.match(
            spyProxyFormatResponse.calledWith(
                HttpStatusCode.OK,
                JSON.stringify({ 'master-ip': candidate.primaryPrivateIpAddress })
            ),
            true
        );
    });
    it('First heartbeat from secondary (PAYG). Primary election is done. Primary is unhealthy. stay primaryless role.', async () => {
        mockDataDir = path.resolve(
            mockDataRootDir,
            'heartbeat-first-secondary-me-done-unhealthy-unchanged'
        );
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-heartbeat-sync.json')
        );
        context = await awsTestMan.fakeLambdaContext();

        const {
            autoscale,
            env,
            platformAdaptee,
            platformAdapter,
            proxy
        } = await createTestAwsApiGatewayEventHandler(event, context);

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = platformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
        const spyPromisesPrimaryElectionResult = Sinon.spy(autoscale, 'handlePrimaryElection')
            .returnValues;

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);
        const primaryElectionResult = await spyPromisesPrimaryElectionResult[0];
        const newPrimary = primaryElectionResult.newPrimary;

        // ASSERT: no new primary elected
        Sinon.assert.match(newPrimary, null);

        // ASSERT: proxy responds with http code 200 and empty body
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);
    });
});

describe('FortiGate regular heartbeat sync.', () => {
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
    before(function() {
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
    it('Regular heartbeat from the primary. Arrives on-time.', async () => {
        mockDataDir = path.resolve(
            mockDataRootDir,
            'heartbeat-regular-primary-me-done-healthy-on-time'
        );
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-heartbeat-sync.json')
        );
        context = await awsTestMan.fakeLambdaContext();

        const {
            autoscale,
            env,
            platformAdaptee,
            platformAdapter,
            proxy
        } = await createTestAwsApiGatewayEventHandler(event, context);

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = platformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
        const spyPromisesPrimaryElectionResult = Sinon.spy(autoscale, 'handlePrimaryElection')
            .returnValues;

        const stubAdapterGetHealthCheckRecord = Sinon.stub(platformAdapter, 'getHealthCheckRecord');
        stubAdapterGetHealthCheckRecord.callsFake(async (vmId: string) => {
            stubAdapterGetHealthCheckRecord.restore();
            const record = await platformAdapter.getHealthCheckRecord(vmId);
            // overwrite the next heartbeat time to ensure no delay
            record.nextHeartbeatTime = platformAdapter.createTime;
            return record;
        });

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const primaryElectionResult = await spyPromisesPrimaryElectionResult[0];
        const newPrimary = primaryElectionResult.newPrimary;
        const oldPrimaryRecord = primaryElectionResult.oldPrimaryRecord;

        // ASSERT: no new primary elected
        Sinon.assert.match(newPrimary !== null, false);
        // ASSERT: old primary should be done
        Sinon.assert.match(oldPrimaryRecord.voteState, 'done');
        // ASSERT: target health check is healthy.
        Sinon.assert.match(env.targetHealthCheckRecord.healthy, true);
        // ASSERT: target health check no loss count
        Sinon.assert.match(env.targetHealthCheckRecord.heartbeatLossCount, 0);

        // ASSERT: proxy responds with http code 200 and empty body
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);
    });
    it('Regular heartbeat from the secondary. Arrives on-time.', async () => {
        mockDataDir = path.resolve(
            mockDataRootDir,
            'heartbeat-regular-secondary-me-done-healthy-on-time'
        );
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-heartbeat-sync.json')
        );
        context = await awsTestMan.fakeLambdaContext();

        const {
            autoscale,
            env,
            platformAdaptee,
            platformAdapter,
            proxy
        } = await createTestAwsApiGatewayEventHandler(event, context);

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = platformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
        const spyPromisesPrimaryElectionResult = Sinon.spy(autoscale, 'handlePrimaryElection')
            .returnValues;

        const stubAdapterGetHealthCheckRecord = Sinon.stub(platformAdapter, 'getHealthCheckRecord');
        stubAdapterGetHealthCheckRecord.callsFake(async (vmId: string) => {
            stubAdapterGetHealthCheckRecord.restore();
            const record = await platformAdapter.getHealthCheckRecord(vmId);
            // overwrite the next heartbeat time to ensure no delay
            record.nextHeartbeatTime = platformAdapter.createTime;
            return record;
        });

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const primaryElectionResult = await spyPromisesPrimaryElectionResult[0];
        const newPrimary = primaryElectionResult.newPrimary;
        const oldPrimaryRecord = primaryElectionResult.oldPrimaryRecord;

        // ASSERT: no new primary elected
        Sinon.assert.match(newPrimary !== null, false);
        // ASSERT: old primary should be done
        Sinon.assert.match(oldPrimaryRecord.voteState, 'done');
        // ASSERT: target health check is healthy.
        Sinon.assert.match(env.targetHealthCheckRecord.healthy, true);
        // ASSERT: target health check no loss count
        Sinon.assert.match(env.targetHealthCheckRecord.heartbeatLossCount, 0);

        // ASSERT: proxy responds with http code 200 and empty body
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);
    });
});

describe('FortiGate irregular heartbeat sync.', () => {
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
    before(function() {
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
    it('Primary heartbeat is late for the first time.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'heartbeat-primary-me-done-healthy-late-1');
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-heartbeat-sync.json')
        );
        context = await awsTestMan.fakeLambdaContext();

        const {
            autoscale,
            env,
            platformAdaptee,
            platformAdapter,
            proxy
        } = await createTestAwsApiGatewayEventHandler(event, context);

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = platformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
        const spyPromisesPrimaryElectionResult = Sinon.spy(autoscale, 'handlePrimaryElection')
            .returnValues;

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const primaryElectionResult = await spyPromisesPrimaryElectionResult[0];
        const newPrimary = primaryElectionResult.newPrimary;
        const oldPrimaryRecord = primaryElectionResult.oldPrimaryRecord;

        // ASSERT: no new primary elected
        Sinon.assert.match(newPrimary, null);
        // ASSERT: old primary should be done
        Sinon.assert.match(oldPrimaryRecord.voteState, 'done');
        // ASSERT: target health check is healthy.
        Sinon.assert.match(env.targetHealthCheckRecord.healthy, true);
        // ASSERT: target health check: heartbeat loss count increased to 1
        Sinon.assert.match(env.targetHealthCheckRecord.heartbeatLossCount, 1);

        // ASSERT: proxy responds with http code 200 and empty body
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);
    });
    it('Primary heartbeat loss count reached the max allowed value (999). Should delete it.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'heartbeat-primary-me-done-healthy-late-999');
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-heartbeat-sync.json')
        );
        context = await awsTestMan.fakeLambdaContext();

        const {
            autoscale,
            env,
            platformAdaptee,
            platformAdapter,
            proxy
        } = await createTestAwsApiGatewayEventHandler(event, context);

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = platformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
        const spyPromisesPrimaryElectionResult = Sinon.spy(autoscale, 'handlePrimaryElection')
            .returnValues;

        const spyPADeleteVmFromScalingGroup = Sinon.spy(
            platformAdapter,
            'deleteVmFromScalingGroup'
        );

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const primaryElectionResult = await spyPromisesPrimaryElectionResult[0];
        const newPrimary = primaryElectionResult.newPrimary;
        const oldPrimaryRecord = primaryElectionResult.oldPrimaryRecord;

        // ASSERT: no new primary elected
        Sinon.assert.match(newPrimary, null);
        // ASSERT: old primary should be done
        Sinon.assert.match(oldPrimaryRecord.voteState, 'done');
        // ASSERT: target health check is healthy.
        Sinon.assert.match(env.targetHealthCheckRecord.healthy, false);
        // ASSERT: target health check: heartbeat loss count increased to 999
        Sinon.assert.match(env.targetHealthCheckRecord.heartbeatLossCount, 999);
        // ASSERT: target health check sync-state is out-of-sync.
        Sinon.assert.match(env.targetHealthCheckRecord.syncState, 'out-of-sync');

        // ASSERT: should trigger a deletion of the target vm
        Sinon.assert.match(spyPADeleteVmFromScalingGroup.calledWith(env.targetVm.id), true);

        // ASSERT: proxy responds with http code 200 and empty body
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);
    });
    it('Secondary heartbeat is late for the first time.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'heartbeat-secondary-me-done-healthy-late-1');
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-heartbeat-sync.json')
        );
        context = await awsTestMan.fakeLambdaContext();

        const {
            autoscale,
            env,
            platformAdaptee,
            platformAdapter,
            proxy
        } = await createTestAwsApiGatewayEventHandler(event, context);

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = platformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
        const spyPromisesPrimaryElectionResult = Sinon.spy(autoscale, 'handlePrimaryElection')
            .returnValues;

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const primaryElectionResult = await spyPromisesPrimaryElectionResult[0];
        const newPrimary = primaryElectionResult.newPrimary;
        const oldPrimaryRecord = primaryElectionResult.oldPrimaryRecord;

        // ASSERT: no new primary elected
        Sinon.assert.match(newPrimary, null);
        // ASSERT: old primary should be done
        Sinon.assert.match(oldPrimaryRecord.voteState, 'done');
        // ASSERT: target health check is healthy.
        Sinon.assert.match(env.targetHealthCheckRecord.healthy, true);
        // ASSERT: target health check: heartbeat loss count increased to 1
        Sinon.assert.match(env.targetHealthCheckRecord.heartbeatLossCount, 1);

        // ASSERT: proxy responds with http code 200 and empty body
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);
    });
    it('Secondary heartbeat loss count reached the max allowed value (999). Should delete it.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'heartbeat-secondary-me-done-healthy-late-999');
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-heartbeat-sync.json')
        );
        context = await awsTestMan.fakeLambdaContext();

        const {
            autoscale,
            env,
            platformAdaptee,
            platformAdapter,
            proxy
        } = await createTestAwsApiGatewayEventHandler(event, context);

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = platformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
        const spyPromisesPrimaryElectionResult = Sinon.spy(autoscale, 'handlePrimaryElection')
            .returnValues;

        const spyPADeleteVmFromScalingGroup = Sinon.spy(
            platformAdapter,
            'deleteVmFromScalingGroup'
        );

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const primaryElectionResult = await spyPromisesPrimaryElectionResult[0];
        const newPrimary = primaryElectionResult.newPrimary;
        const oldPrimaryRecord = primaryElectionResult.oldPrimaryRecord;

        // ASSERT: no new primary elected
        Sinon.assert.match(newPrimary, null);
        // ASSERT: old primary should be done
        Sinon.assert.match(oldPrimaryRecord.voteState, 'done');
        // ASSERT: target health check is healthy.
        Sinon.assert.match(env.targetHealthCheckRecord.healthy, false);
        // ASSERT: target health check: heartbeat loss count increased to 999
        Sinon.assert.match(env.targetHealthCheckRecord.heartbeatLossCount, 999);
        // ASSERT: target health check sync-state is out-of-sync.
        Sinon.assert.match(env.targetHealthCheckRecord.syncState, 'out-of-sync');

        // ASSERT: should trigger a deletion of the target vm
        Sinon.assert.match(spyPADeleteVmFromScalingGroup.calledWith(env.targetVm.id), true);

        // ASSERT: proxy responds with http code 200 and empty body
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);
    });
});
