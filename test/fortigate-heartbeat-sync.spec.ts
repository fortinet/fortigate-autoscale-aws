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
    it('First heartbeat from the pending master.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'heartbeat-first-master-me-pending');
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
        const spyPromisesMasterElectionResult = Sinon.spy(autoscale, 'handleMasterElection')
            .returnValues;

        const stubAdapterListMasterRoleVmId = Sinon.stub(platformAdapter, 'listMasterRoleVmId');

        stubAdapterListMasterRoleVmId.callsFake(async () => {
            const callCount = mockEC2.getStub('describeInstances').callCount;
            mockEC2.callSubOnNthFake(
                'describeInstances',
                callCount + 1,
                'i-0000000000byol001',
                true
            );
            stubAdapterListMasterRoleVmId.restore();
            return await platformAdapter.listMasterRoleVmId();
        });

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const masterElectionResult = await spyPromisesMasterElectionResult[0];
        const candidate = masterElectionResult.candidate;
        const newMaster = masterElectionResult.newMaster;
        const newMasterRecord = masterElectionResult.newMasterRecord;

        // ASSERT: new master elected
        Sinon.assert.match(newMaster !== null, true);
        // ASSERT: new master should be done
        Sinon.assert.match(newMasterRecord.voteState, 'done');
        // ASSERT: candidate is the new master
        Sinon.assert.match(compare(candidate).isEqualTo(newMaster), true);

        // ASSERT: proxy responds with http code 200 and candidate's private ip as master ip
        Sinon.assert.match(
            spyProxyFormatResponse.calledWith(
                HttpStatusCode.OK,
                JSON.stringify({ 'master-ip': candidate.primaryPrivateIpAddress })
            ),
            true
        );

        stubAdapterListMasterRoleVmId.restore();
        spyProxyFormatResponse.restore();
    });
    it('First heartbeat from slave (BYOL). Master election is pending.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'heartbeat-first-slave-me-pending');
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
        const spyPromisesMasterElectionResult = Sinon.spy(autoscale, 'handleMasterElection')
            .returnValues;

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const masterElectionResult = await spyPromisesMasterElectionResult[0];
        const newMaster = masterElectionResult.newMaster;
        const oldMaster = masterElectionResult.oldMaster;
        const oldMasterRecord = masterElectionResult.oldMasterRecord;

        // ASSERT: no new master elected
        Sinon.assert.match(newMaster, null);
        // ASSERT: old master is available
        Sinon.assert.match(oldMaster !== null, true);
        // ASSERT: old master is still pending
        Sinon.assert.match(oldMasterRecord.voteState, 'pending');

        // ASSERT: proxy responds with http code 200 and empty body
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);
    });
    it('First heartbeat from slave (BYOL). Master election timed out.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'heartbeat-first-slave-me-timed-out');
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
        const spyPromisesMasterElectionResult = Sinon.spy(autoscale, 'handleMasterElection')
            .returnValues;

        const stubAdapterListMasterRoleVmId = Sinon.stub(platformAdapter, 'listMasterRoleVmId');

        stubAdapterListMasterRoleVmId.callsFake(async () => {
            const callCount = mockEC2.getStub('describeInstances').callCount;
            mockEC2.callSubOnNthFake(
                'describeInstances',
                callCount + 1,
                'i-0000000000byol001',
                true
            );
            stubAdapterListMasterRoleVmId.restore();
            return await platformAdapter.listMasterRoleVmId();
        });

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const masterElectionResult = await spyPromisesMasterElectionResult[0];
        const candidate = masterElectionResult.candidate;
        const newMaster = masterElectionResult.newMaster;
        const oldMaster = masterElectionResult.oldMaster;

        // ASSERT: new master elected
        Sinon.assert.match(newMaster !== null, true);
        // ASSERT: old master is available
        Sinon.assert.match(oldMaster !== null, true);
        // ASSERT: candidate is the new master
        Sinon.assert.match(compare(candidate).isEqualTo(newMaster), true);

        // ASSERT: proxy responds with http code 200 and candidate's private ip as master ip
        Sinon.assert.match(
            spyProxyFormatResponse.calledWith(
                HttpStatusCode.OK,
                JSON.stringify({ 'master-ip': candidate.primaryPrivateIpAddress })
            ),
            true
        );
        spyProxyFormatResponse.restore();
    });
    it('First heartbeat from slave (BYOL). Master election is done. Master is healthy.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'heartbeat-first-slave-me-done-healthy');
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
        const spyPromisesMasterElectionResult = Sinon.spy(autoscale, 'handleMasterElection')
            .returnValues;

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const masterElectionResult = await spyPromisesMasterElectionResult[0];
        const newMaster = masterElectionResult.newMaster;
        const oldMaster = masterElectionResult.oldMaster;
        const oldMasterRecord = masterElectionResult.oldMasterRecord;

        // ASSERT: no new master elected
        Sinon.assert.match(newMaster, null);
        // ASSERT: old master is available
        Sinon.assert.match(oldMaster !== null, true);
        // ASSERT: old master is done
        Sinon.assert.match(oldMasterRecord.voteState, 'done');

        // ASSERT: proxy responds with http code 200 and oldMaster's private ip as master ip
        Sinon.assert.match(
            spyProxyFormatResponse.calledWith(
                HttpStatusCode.OK,
                JSON.stringify({ 'master-ip': oldMaster.primaryPrivateIpAddress })
            ),
            true
        );
    });
    it('First heartbeat from slave (BYOL). Master election is done. Master is unhealthy. Replace master role.', async () => {
        mockDataDir = path.resolve(
            mockDataRootDir,
            'heartbeat-first-slave-me-done-unhealthy-replaced'
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
        const spyPromisesMasterElectionResult = Sinon.spy(autoscale, 'handleMasterElection')
            .returnValues;

        const stubAdapterListMasterRoleVmId = Sinon.stub(platformAdapter, 'listMasterRoleVmId');

        stubAdapterListMasterRoleVmId.callsFake(async () => {
            const callCount = mockEC2.getStub('describeInstances').callCount;
            mockEC2.callSubOnNthFake(
                'describeInstances',
                callCount + 1,
                'i-0000000000byol001',
                true
            );
            stubAdapterListMasterRoleVmId.restore();
            return await platformAdapter.listMasterRoleVmId();
        });

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const masterElectionResult = await spyPromisesMasterElectionResult[0];
        const candidate = masterElectionResult.candidate;
        const newMaster = masterElectionResult.newMaster;

        // ASSERT: new master elected
        Sinon.assert.match(newMaster !== null, true);
        // ASSERT: candidate is the new master
        Sinon.assert.match(compare(candidate).isEqualTo(newMaster), true);

        // ASSERT: proxy responds with http code 200 and candidate's private ip as master ip
        Sinon.assert.match(
            spyProxyFormatResponse.calledWith(
                HttpStatusCode.OK,
                JSON.stringify({ 'master-ip': candidate.primaryPrivateIpAddress })
            ),
            true
        );
    });
    it('First heartbeat from slave (PAYG). Master election is done. Master is unhealthy. stay masterless role.', async () => {
        mockDataDir = path.resolve(
            mockDataRootDir,
            'heartbeat-first-slave-me-done-unhealthy-unchanged'
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
        const spyPromisesMasterElectionResult = Sinon.spy(autoscale, 'handleMasterElection')
            .returnValues;

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);
        const masterElectionResult = await spyPromisesMasterElectionResult[0];
        const newMaster = masterElectionResult.newMaster;

        // ASSERT: no new master elected
        Sinon.assert.match(newMaster, null);

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
    it('Regular heartbeat from the master. Arrives on-time.', async () => {
        mockDataDir = path.resolve(
            mockDataRootDir,
            'heartbeat-regular-master-me-done-healthy-on-time'
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
        const spyPromisesMasterElectionResult = Sinon.spy(autoscale, 'handleMasterElection')
            .returnValues;

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const masterElectionResult = await spyPromisesMasterElectionResult[0];
        const newMaster = masterElectionResult.newMaster;
        const oldMasterRecord = masterElectionResult.oldMasterRecord;

        // ASSERT: no new master elected
        Sinon.assert.match(newMaster !== null, false);
        // ASSERT: old master should be done
        Sinon.assert.match(oldMasterRecord.voteState, 'done');
        // ASSERT: target health check is healthy.
        Sinon.assert.match(env.targetHealthCheckRecord.healthy, true);
        // ASSERT: target health check no loss count
        Sinon.assert.match(env.targetHealthCheckRecord.heartbeatLossCount, 0);

        // ASSERT: proxy responds with http code 200 and empty body
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);
    });
    it('Regular heartbeat from the slave. Arrives on-time.', async () => {
        mockDataDir = path.resolve(
            mockDataRootDir,
            'heartbeat-regular-slave-me-done-healthy-on-time'
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
        const spyPromisesMasterElectionResult = Sinon.spy(autoscale, 'handleMasterElection')
            .returnValues;

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const masterElectionResult = await spyPromisesMasterElectionResult[0];
        const newMaster = masterElectionResult.newMaster;
        const oldMasterRecord = masterElectionResult.oldMasterRecord;

        // ASSERT: no new master elected
        Sinon.assert.match(newMaster !== null, false);
        // ASSERT: old master should be done
        Sinon.assert.match(oldMasterRecord.voteState, 'done');
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
    it('Master heartbeat is late for the first time.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'heartbeat-master-me-done-healthy-late-1');
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
        const spyPromisesMasterElectionResult = Sinon.spy(autoscale, 'handleMasterElection')
            .returnValues;

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const masterElectionResult = await spyPromisesMasterElectionResult[0];
        const newMaster = masterElectionResult.newMaster;
        const oldMasterRecord = masterElectionResult.oldMasterRecord;

        // ASSERT: no new master elected
        Sinon.assert.match(newMaster, null);
        // ASSERT: old master should be done
        Sinon.assert.match(oldMasterRecord.voteState, 'done');
        // ASSERT: target health check is healthy.
        Sinon.assert.match(env.targetHealthCheckRecord.healthy, true);
        // ASSERT: target health check: heartbeat loss count increased to 1
        Sinon.assert.match(env.targetHealthCheckRecord.heartbeatLossCount, 1);

        // ASSERT: proxy responds with http code 200 and empty body
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);
    });
    it('Master heartbeat loss count reached the max allowed value (999). Should delete it.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'heartbeat-master-me-done-healthy-late-999');
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
        const spyPromisesMasterElectionResult = Sinon.spy(autoscale, 'handleMasterElection')
            .returnValues;

        const spyPADeleteVmFromScalingGroup = Sinon.spy(
            platformAdapter,
            'deleteVmFromScalingGroup'
        );

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const masterElectionResult = await spyPromisesMasterElectionResult[0];
        const newMaster = masterElectionResult.newMaster;
        const oldMasterRecord = masterElectionResult.oldMasterRecord;

        // ASSERT: no new master elected
        Sinon.assert.match(newMaster, null);
        // ASSERT: old master should be done
        Sinon.assert.match(oldMasterRecord.voteState, 'done');
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
    it('Slave heartbeat is late for the first time.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'heartbeat-slave-me-done-healthy-late-1');
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
        const spyPromisesMasterElectionResult = Sinon.spy(autoscale, 'handleMasterElection')
            .returnValues;

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const masterElectionResult = await spyPromisesMasterElectionResult[0];
        const newMaster = masterElectionResult.newMaster;
        const oldMasterRecord = masterElectionResult.oldMasterRecord;

        // ASSERT: no new master elected
        Sinon.assert.match(newMaster, null);
        // ASSERT: old master should be done
        Sinon.assert.match(oldMasterRecord.voteState, 'done');
        // ASSERT: target health check is healthy.
        Sinon.assert.match(env.targetHealthCheckRecord.healthy, true);
        // ASSERT: target health check: heartbeat loss count increased to 1
        Sinon.assert.match(env.targetHealthCheckRecord.heartbeatLossCount, 1);

        // ASSERT: proxy responds with http code 200 and empty body
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);
    });
    it('Slave heartbeat loss count reached the max allowed value (999). Should delete it.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'heartbeat-slave-me-done-healthy-late-999');
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
        const spyPromisesMasterElectionResult = Sinon.spy(autoscale, 'handleMasterElection')
            .returnValues;

        const spyPADeleteVmFromScalingGroup = Sinon.spy(
            platformAdapter,
            'deleteVmFromScalingGroup'
        );

        await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

        const masterElectionResult = await spyPromisesMasterElectionResult[0];
        const newMaster = masterElectionResult.newMaster;
        const oldMasterRecord = masterElectionResult.oldMasterRecord;

        // ASSERT: no new master elected
        Sinon.assert.match(newMaster, null);
        // ASSERT: old master should be done
        Sinon.assert.match(oldMasterRecord.voteState, 'done');
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
