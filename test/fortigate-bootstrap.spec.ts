/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
    AutoscaleEnvironment,
    AwsFortiGateBootstrapTgwStrategy,
    AwsPlatformAdapter,
    AwsTestMan,
    createAwsApiGatewayEventHandler,
    createAwsTgwApiGatewayEventHandler,
    MockAutoScaling,
    MockDocClient,
    MockEC2,
    MockElbv2,
    MockLambda,
    MockS3,
    TestAwsApiGatewayEventProxy,
    TestAwsPlatformAdaptee,
    TestAwsTgwFortiGateAutoscale
} from 'autoscale-core';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import * as HttpStatusCode from 'http-status-codes';
import { describe, it } from 'mocha';
import * as path from 'path';
import Sinon from 'sinon';

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
    });
    it('Bootstrap from an instance in primary group.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'bootstrap-primary-group-instance');
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-get-config.json')
        );
        context = await awsTestMan.fakeLambdaContext();

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

        // change the s3 root dir
        mockS3.rootDir = mockDataDir;

        await autoscale.handleAutoscaleRequest(proxy, awsPlatformAdapter, env);
    });
    it('Bootstrap from an instance in non-primary group.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'bootstrap-non-primary-group-instance');
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-get-config.json')
        );
        context = await awsTestMan.fakeLambdaContext();

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

        // change the s3 root dir
        mockS3.rootDir = mockDataDir;

        await autoscale.handleAutoscaleRequest(proxy, awsPlatformAdapter, env);
    });
    it(
        'When FortiGate vm request the bootstrap config, it should include the port2config portion ' +
            '(enable-second-nic is set to true)',
        async () => {
            mockDataDir = path.resolve(mockDataRootDir, 'bootstrap-settings-switches');
            event = await awsTestMan.fakeApiGatewayRequest(
                path.resolve(mockDataDir, 'request/event-fgt-get-config.json')
            );
            context = await awsTestMan.fakeLambdaContext();

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

            // change the s3 root dir
            mockS3.rootDir = mockDataDir;

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

            await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

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
            context = await awsTestMan.fakeLambdaContext();

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

            // change the s3 root dir
            mockS3.rootDir = mockDataDir;

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

            await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

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
            context = await awsTestMan.fakeLambdaContext();

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

            // change the s3 root dir
            mockS3.rootDir = mockDataDir;

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

            await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

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
    it(
        'When FortiGate vm request the bootstrap config, it should include the addtional ' +
            " required configset(s) (provided by setting: 'additional-configset-name-list')",
        async () => {
            mockDataDir = path.resolve(mockDataRootDir, 'bootstrap-settings-switches');
            event = await awsTestMan.fakeApiGatewayRequest(
                path.resolve(mockDataDir, 'request/event-fgt-get-config.json')
            );
            context = await awsTestMan.fakeLambdaContext();

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

            // change the s3 root dir
            mockS3.rootDir = mockDataDir;

            const { bootstrapConfigStrategy } = autoscale.expose();

            const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
            const spyLoadConfig = Sinon.spy(bootstrapConfigStrategy, <any>'loadConfig');
            const spyLoadBatch = Sinon.spy(bootstrapConfigStrategy, <any>'loadBatch');

            await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

            const promisedConfig = await spyLoadConfig.returnValues[0];

            // ASSERT: bootstrap config strategy loadBatch() is called with expected name list.
            const expectedNameList = ['testconfigset1', 'testconfigset2', 'testconfigset3', '123'];
            Sinon.assert.match(spyLoadBatch.calledOnceWith(expectedNameList), true);
            // ASSERT: bootstrap config strategy loadBatch() should not throw errors despite
            // requiring non-existing configset file, which is the '123' in this case.
            Sinon.assert.match(spyLoadBatch.threw(), false);

            // ASSERT: configuration returned by bootstrap config strategy should include content of testconfigset1
            Sinon.assert.match(promisedConfig.includes('testconfigset1-content'), true);
            // ASSERT: configuration returned by bootstrap config strategy should include content of testconfigset2
            Sinon.assert.match(promisedConfig.includes('testconfigset2-content'), true);
            // ASSERT: configuration returned by bootstrap config strategy should include content of testconfigset3
            Sinon.assert.match(promisedConfig.includes('testconfigset3-content'), true);
            // ASSERT: configuration returned by bootstrap config strategy should NOT include content of 123
            // ASSERT: proxy responds with http code 200 and a string value
            Sinon.assert.match(
                spyProxyFormatResponse.calledWith(HttpStatusCode.OK, Sinon.match.string),
                true
            );

            spyProxyFormatResponse.restore();
            spyLoadConfig.restore();
            spyLoadBatch.restore();
        }
    );
    describe(
        'It should include the user custom configset(s) if provided by setting: ' +
            "'custom-asset-container' and 'custom-asset-directory'.",
        function() {
            let autoscale: TestAwsTgwFortiGateAutoscale<
                APIGatewayProxyEvent,
                Context,
                APIGatewayProxyResult
            >;
            let env: AutoscaleEnvironment;
            let platformAdaptee: TestAwsPlatformAdaptee;
            let platformAdapter: AwsPlatformAdapter;
            let proxy: TestAwsApiGatewayEventProxy;
            let bootstrapConfigStrategy: AwsFortiGateBootstrapTgwStrategy;
            let stubAdapteeLoadSettings: Sinon.SinonStub;
            before(async function() {
                mockDataDir = path.resolve(mockDataRootDir, 'bootstrap-settings-switches');
                event = await awsTestMan.fakeApiGatewayRequest(
                    path.resolve(mockDataDir, 'request/event-fgt-get-config.json')
                );
                context = await awsTestMan.fakeLambdaContext();

                ({
                    autoscale,
                    env,
                    platformAdaptee,
                    platformAdapter,
                    proxy
                } = await createAwsTgwApiGatewayEventHandler(event, context));

                ({
                    s3: mockS3,
                    ec2: mockEC2,
                    autoscaling: mockAutoscaling,
                    elbv2: mockElbv2,
                    lambda: mockLambda,
                    docClient: mocDocClient
                } = platformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

                // change the s3 root dir
                mockS3.rootDir = mockDataDir;

                ({ bootstrapConfigStrategy } = autoscale.expose());
            });
            beforeEach(function() {
                stubAdapteeLoadSettings = Sinon.stub(platformAdaptee, 'loadSettings');
            });
            afterEach(function() {
                stubAdapteeLoadSettings.restore();
            });
            it('User custom asset location contains configset files. Load every file.', async () => {
                stubAdapteeLoadSettings.callsFake(async () => {
                    const callCount = mocDocClient.getStub('scan').callCount;
                    mocDocClient.callSubOnNthFake(
                        'scan',
                        callCount + 1,
                        'user-custom-location1',
                        true
                    );
                    stubAdapteeLoadSettings.restore();
                    return await platformAdaptee.loadSettings();
                });

                const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
                const spyLoadConfig = Sinon.spy(bootstrapConfigStrategy, <any>'loadConfig');
                const spyLoadUserCustom = Sinon.spy(bootstrapConfigStrategy, <any>'loadUserCustom');

                await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);

                const promisedConfig = await spyLoadConfig.returnValues[0];
                const returnValues = await spyLoadUserCustom.returnValues[0];

                // ASSERT: bootstrap config strategy loadUserCustom() is called
                Sinon.assert.match(spyLoadUserCustom.called, true);
                // ASSERT: bootstrap config strategy loadUserCustom() should not throw errors.
                Sinon.assert.match(spyLoadUserCustom.threw(), false);

                // ASSERT: should have successfully loaded content of user-custom-configset1
                Sinon.assert.match(returnValues.includes('user-custom-configset1-content'), true);
                // ASSERT: should have successfully loaded content of user-custom-configset2
                Sinon.assert.match(returnValues.includes('user-custom-configset2-content'), true);

                // ASSERT: configuration returned by bootstrap config strategy should include content of user-custom-configset1
                Sinon.assert.match(promisedConfig.includes('user-custom-configset1-content'), true);
                // ASSERT: configuration returned by bootstrap config strategy should include content of user-custom-configset2
                Sinon.assert.match(promisedConfig.includes('user-custom-configset2-content'), true);

                // ASSERT: proxy responds with http code 200 and a string value
                Sinon.assert.match(
                    spyProxyFormatResponse.calledWith(HttpStatusCode.OK, Sinon.match.string),
                    true
                );

                spyProxyFormatResponse.restore();
                spyLoadConfig.restore();
                spyLoadUserCustom.restore();
            });
            it(
                'User custom asset location contains files with a dot prefix in its name.' +
                    'Do not load such files.',
                async () => {
                    stubAdapteeLoadSettings.callsFake(async () => {
                        const callCount = mocDocClient.getStub('scan').callCount;
                        mocDocClient.callSubOnNthFake(
                            'scan',
                            callCount + 1,
                            'user-custom-location2',
                            true
                        );
                        stubAdapteeLoadSettings.restore();
                        return await platformAdaptee.loadSettings();
                    });

                    const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
                    const spyLoadUserCustom = Sinon.spy(
                        bootstrapConfigStrategy,
                        <any>'loadUserCustom'
                    );

                    await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);
                    const returnValues = await spyLoadUserCustom.returnValues[0];

                    // ASSERT: bootstrap config strategy loadUserCustom() is called
                    Sinon.assert.match(spyLoadUserCustom.called, true);
                    // ASSERT: bootstrap config strategy loadUserCustom() should not throw errors.
                    Sinon.assert.match(spyLoadUserCustom.threw(), false);

                    // ASSERT: should have successfully loaded content of user-custom-configset1
                    Sinon.assert.match(
                        returnValues.includes('user-custom-configset1-content'),
                        true
                    );
                    // ASSERT: should have successfully loaded content of user-custom-configset2
                    Sinon.assert.match(
                        returnValues.includes('user-custom-configset2-content'),
                        true
                    );
                    // ASSERT: should have not loaded content of .user-custom-configset1
                    Sinon.assert.match(
                        returnValues.includes('dot-user-custom-configset2-content'),
                        false
                    );

                    // ASSERT: proxy responds with http code 200 and a string value
                    Sinon.assert.match(
                        spyProxyFormatResponse.calledWith(HttpStatusCode.OK, Sinon.match.string),
                        true
                    );

                    spyProxyFormatResponse.restore();
                    spyLoadUserCustom.restore();
                }
            );
            it('User custom asset location does not contain any file. Do not throw any error.', async () => {
                stubAdapteeLoadSettings.callsFake(async () => {
                    const callCount = mocDocClient.getStub('scan').callCount;
                    mocDocClient.callSubOnNthFake(
                        'scan',
                        callCount + 1,
                        'user-custom-location3',
                        true
                    );
                    stubAdapteeLoadSettings.restore();
                    return await platformAdaptee.loadSettings();
                });

                const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
                const spyLoadUserCustom = Sinon.spy(bootstrapConfigStrategy, <any>'loadUserCustom');

                await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);
                const returnValues = await spyLoadUserCustom.returnValues[0];

                // ASSERT: bootstrap config strategy loadUserCustom() is called
                Sinon.assert.match(spyLoadUserCustom.called, true);
                // ASSERT: bootstrap config strategy loadUserCustom() should not throw errors.
                Sinon.assert.match(spyLoadUserCustom.threw(), false);

                // ASSERT: should return an empty string
                Sinon.assert.match(returnValues === '', true);

                // ASSERT: proxy responds with http code 200 and a string value
                Sinon.assert.match(
                    spyProxyFormatResponse.calledWith(HttpStatusCode.OK, Sinon.match.string),
                    true
                );

                spyProxyFormatResponse.restore();
                spyLoadUserCustom.restore();
            });
            it('User custom asset location not exist. Do not throw any error.', async () => {
                stubAdapteeLoadSettings.callsFake(async () => {
                    const callCount = mocDocClient.getStub('scan').callCount;
                    mocDocClient.callSubOnNthFake(
                        'scan',
                        callCount + 1,
                        'user-custom-location-not-existed',
                        true
                    );
                    stubAdapteeLoadSettings.restore();
                    return await platformAdaptee.loadSettings();
                });

                const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');
                const spyLoadUserCustom = Sinon.spy(bootstrapConfigStrategy, <any>'loadUserCustom');

                await autoscale.handleAutoscaleRequest(proxy, platformAdapter, env);
                const returnValues = await spyLoadUserCustom.returnValues[0];

                // ASSERT: bootstrap config strategy loadUserCustom() is called
                Sinon.assert.match(spyLoadUserCustom.called, true);
                // ASSERT: bootstrap config strategy loadUserCustom() should not throw errors.
                Sinon.assert.match(spyLoadUserCustom.threw(), false);

                // ASSERT: should return an empty string
                Sinon.assert.match(returnValues === '', true);

                // ASSERT: proxy responds with http code 200 and a string value
                Sinon.assert.match(
                    spyProxyFormatResponse.calledWith(HttpStatusCode.OK, Sinon.match.string),
                    true
                );

                spyProxyFormatResponse.restore();
                spyLoadUserCustom.restore();
            });
        }
    );
});
