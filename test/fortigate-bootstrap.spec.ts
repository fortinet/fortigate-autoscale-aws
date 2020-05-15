/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as path from 'path';
import { describe, it } from 'mocha';
import * as HttpStatusCode from 'http-status-codes';
import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
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
import { TestAwsApiGatewayEventProxy } from './test-helper-class/test-aws-api-gateway-event-proxy';
import Sinon from 'sinon';
import {
    TestAwsFortiGateAutoscale,
    TestAwsTgwFortiGateAutoscale
} from './test-helper-class/test-aws-fortigate-autoscale';

export const createAwsApiGatewayEventHandler = (
    event: APIGatewayProxyEvent,
    context: Context
): {
    autoscale: TestAwsFortiGateAutoscale<APIGatewayProxyEvent, Context, APIGatewayProxyResult>;
    env: AutoscaleEnvironment;
    platformAdaptee: TestAwsPlatformAdaptee;
    platformAdapter: AwsPlatformAdapter;
    proxy: TestAwsApiGatewayEventProxy;
} => {
    const env = {} as AutoscaleEnvironment;
    const proxy = new TestAwsApiGatewayEventProxy(event, context);
    const p = new TestAwsPlatformAdaptee();
    const pa = new AwsPlatformAdapter(p, proxy);
    const autoscale = new TestAwsFortiGateAutoscale<
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

export const createAwsTgwApiGatewayEventHandler = (
    event: APIGatewayProxyEvent,
    context: Context
): {
    autoscale: TestAwsTgwFortiGateAutoscale<APIGatewayProxyEvent, Context, APIGatewayProxyResult>;
    env: AutoscaleEnvironment;
    platformAdaptee: TestAwsPlatformAdaptee;
    platformAdapter: AwsPlatformAdapter;
    proxy: TestAwsApiGatewayEventProxy;
} => {
    const env = {} as AutoscaleEnvironment;
    const proxy = new TestAwsApiGatewayEventProxy(event, context);
    const p = new TestAwsPlatformAdaptee();
    const pa = new AwsPlatformAdapter(p, proxy);
    const autoscale = new TestAwsTgwFortiGateAutoscale<
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
    });
    it('Bootstrap from an instance in master group.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'bootstrap-master-group-instance');
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-get-config.json')
        );
        context = await awsTestMan.fakeApiGatewayContext();

        const {
            autoscale,
            env,
            platformAdaptee: awsPlatformAdaptee,
            platformAdapter: awsPlatformAdapter,
            proxy
        } = await createAwsApiGatewayEventHandler(event, context);

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = awsPlatformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        await autoscale.handleCloudFunctionRequest(proxy, awsPlatformAdapter, env);
    });
    it('Bootstrap from an instance in non-master group.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'bootstrap-non-master-group-instance');
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-get-config.json')
        );
        context = await awsTestMan.fakeApiGatewayContext();

        const {
            autoscale,
            env,
            platformAdaptee: awsPlatformAdaptee,
            platformAdapter: awsPlatformAdapter,
            proxy
        } = await createAwsApiGatewayEventHandler(event, context);

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = awsPlatformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        await autoscale.handleCloudFunctionRequest(proxy, awsPlatformAdapter, env);
    });
    it(
        'When FortiGate vm request the bootstrap config, it should include the port2config portion ' +
            '(enable-second-nic is set to true)',
        async () => {
            mockDataDir = path.resolve(mockDataRootDir, 'bootstrap-settings-switches');
            event = await awsTestMan.fakeApiGatewayRequest(
                path.resolve(mockDataDir, 'request/event-fgt-get-config.json')
            );
            context = await awsTestMan.fakeApiGatewayContext();

            const {
                autoscale,
                env,
                platformAdaptee,
                platformAdapter,
                proxy
            } = await createAwsApiGatewayEventHandler(event, context);

            ({
                s3: mockS3,
                ec2: mockEC2,
                autoscaling: mockAutoscaling,
                elbv2: mockElbv2,
                lambda: mockLambda,
                docClient: mocDocClient
            } = platformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

            const { bootstrapConfigStrategy } = autoscale.expose();

            // mocDocClient.callSubOnNthFake('scan')
            const stubAdapteeLoadSettings = Sinon.stub(platformAdaptee, 'loadSettings');

            stubAdapteeLoadSettings.callsFake(async () => {
                const callCount = mocDocClient.getStub('scan').callCount;
                mocDocClient.callSubOnNthFake(
                    'scan',
                    callCount + 1,
                    'enable-second-nic-true',
                    true
                );
                stubAdapteeLoadSettings.restore();
                return await platformAdaptee.loadSettings();
            });

            const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
            const spyLoadConfig = Sinon.spy(bootstrapConfigStrategy, <any>'loadConfig');
            const spyLoadPort2Config = Sinon.spy(bootstrapConfigStrategy, <any>'loadPort2');

            await autoscale.handleCloudFunctionRequest(proxy, platformAdapter, env);

            const promisedConfig = await spyLoadConfig.returnValues[0];

            // ASSERT: bootstrap config strategy loadPort2() is called.
            Sinon.assert.match(spyLoadPort2Config.called, true);
            // ASSERT: bootstrap config strategy loadPort2() returns expected value
            Sinon.assert.match(
                promisedConfig.includes('config sys interface\n    edit "port2"'),
                true
            );
            // ASSERT: proxy responds with http code 200 and a string value
            Sinon.assert.match(
                spyProxyFormatResponse.calledWith(HttpStatusCode.OK, Sinon.match.string),
                true
            );
            stubAdapteeLoadSettings.restore();
            spyProxyFormatResponse.restore();
            spyLoadConfig.restore();
            spyLoadPort2Config.restore();
        }
    );
    it(
        'When FortiGate vm request the bootstrap config, it should include the port2config portion ' +
            '(enable-second-nic is set to false)',
        async () => {
            mockDataDir = path.resolve(mockDataRootDir, 'bootstrap-settings-switches');
            event = await awsTestMan.fakeApiGatewayRequest(
                path.resolve(mockDataDir, 'request/event-fgt-get-config.json')
            );
            context = await awsTestMan.fakeApiGatewayContext();

            const {
                autoscale,
                env,
                platformAdaptee,
                platformAdapter,
                proxy
            } = await createAwsApiGatewayEventHandler(event, context);

            ({
                s3: mockS3,
                ec2: mockEC2,
                autoscaling: mockAutoscaling,
                elbv2: mockElbv2,
                lambda: mockLambda,
                docClient: mocDocClient
            } = platformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

            const { bootstrapConfigStrategy } = autoscale.expose();

            // mocDocClient.callSubOnNthFake('scan')
            const stubAdapteeLoadSettings = Sinon.stub(platformAdaptee, 'loadSettings');

            stubAdapteeLoadSettings.callsFake(async () => {
                const callCount = mocDocClient.getStub('scan').callCount;
                mocDocClient.callSubOnNthFake(
                    'scan',
                    callCount + 1,
                    'enable-second-nic-false',
                    true
                );
                stubAdapteeLoadSettings.restore();
                return await platformAdaptee.loadSettings();
            });

            const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
            const spyLoadConfig = Sinon.spy(bootstrapConfigStrategy, <any>'loadConfig');
            const spyLoadPort2Config = Sinon.spy(bootstrapConfigStrategy, <any>'loadPort2');

            await autoscale.handleCloudFunctionRequest(proxy, platformAdapter, env);

            const promisedConfig = await spyLoadConfig.returnValues[0];

            // ASSERT: bootstrap config strategy loadPort2() isn't called.
            Sinon.assert.match(spyLoadPort2Config.called, false);
            // ASSERT: bootstrap config strategy loadPort2() returns expected value
            Sinon.assert.match(
                promisedConfig.includes('config sys interface\n    edit "port2"'),
                false
            );
            // ASSERT: proxy responds with http code 200 and a string value
            Sinon.assert.match(
                spyProxyFormatResponse.calledWith(HttpStatusCode.OK, Sinon.match.string),
                true
            );
            stubAdapteeLoadSettings.restore();
            spyProxyFormatResponse.restore();
            spyLoadConfig.restore();
            spyLoadPort2Config.restore();
        }
    );
    it(
        'When FortiGate vm request the bootstrap config, it should include the vpn portion ' +
            '(enable-transit-gateway-vpn is set to true)',
        async () => {
            mockDataDir = path.resolve(mockDataRootDir, 'bootstrap-settings-switches');
            event = await awsTestMan.fakeApiGatewayRequest(
                path.resolve(mockDataDir, 'request/event-fgt-get-config.json')
            );
            context = await awsTestMan.fakeApiGatewayContext();

            const {
                autoscale,
                env,
                platformAdaptee,
                platformAdapter,
                proxy
            } = await createAwsTgwApiGatewayEventHandler(event, context);

            ({
                s3: mockS3,
                ec2: mockEC2,
                autoscaling: mockAutoscaling,
                elbv2: mockElbv2,
                lambda: mockLambda,
                docClient: mocDocClient
            } = platformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

            const { bootstrapConfigStrategy } = autoscale.expose();

            // mocDocClient.callSubOnNthFake('scan')
            const stubAdapteeLoadSettings = Sinon.stub(platformAdaptee, 'loadSettings');

            stubAdapteeLoadSettings.callsFake(async () => {
                const callCount = mocDocClient.getStub('scan').callCount;
                mocDocClient.callSubOnNthFake(
                    'scan',
                    callCount + 1,
                    'enable-transit-gateway-vpn-true',
                    true
                );
                stubAdapteeLoadSettings.restore();
                return await platformAdaptee.loadSettings();
            });

            const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
            const spyLoadConfig = Sinon.spy(bootstrapConfigStrategy, <any>'loadConfig');
            const spyLoadVpnConfig = Sinon.spy(bootstrapConfigStrategy, <any>'loadVpn');

            await autoscale.handleCloudFunctionRequest(proxy, platformAdapter, env);

            const promisedConfig = await spyLoadConfig.returnValues[0];

            // ASSERT: bootstrap config strategy loadVpn() is called.
            Sinon.assert.match(spyLoadVpnConfig.called, true);
            // ASSERT: bootstrap config strategy loadVpn() returns expected value
            Sinon.assert.match(promisedConfig.includes('config vpn ipsec phase1-interface'), true);
            // ASSERT: proxy responds with http code 200 and a string value
            Sinon.assert.match(
                spyProxyFormatResponse.calledWith(HttpStatusCode.OK, Sinon.match.string),
                true
            );
            stubAdapteeLoadSettings.restore();
            spyProxyFormatResponse.restore();
            spyLoadConfig.restore();
            spyLoadVpnConfig.restore();
        }
    );
});
