/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
    AwsTestMan,
    createAwsApiGatewayEventHandler,
    MockAutoScaling,
    MockDocClient,
    MockEC2,
    MockElbv2,
    MockLambda,
    MockS3,
    LicenseUsageRecord
} from 'autoscale-core';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import * as HttpStatusCode from 'http-status-codes';
import { describe, it } from 'mocha';
import * as path from 'path';
import Sinon from 'sinon';

describe('FortiGate BYOL license assignment.', () => {
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
    it('Assign the first available license. 4 lic. 0 stock. 0 used. assign #1.', async () => {
        mockDataDir = path.resolve(
            mockDataRootDir,
            'license-assignment-4-lic-0-stock-0-used-assign-1st'
        );
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-get-license.json')
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

        const stubUpdateLicenseStock = Sinon.stub(awsPlatformAdapter, 'updateLicenseStock');
        stubUpdateLicenseStock.callsFake(records => {
            stubUpdateLicenseStock.restore();
            const callCount = mocDocClient.getStub('scan').callCount;
            mocDocClient.callSubOnNthFake('scan', callCount + 2, 'updated', true);
            return awsPlatformAdapter.updateLicenseStock(records);
        });

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');

        // change the s3 root dir
        mockS3.rootDir = mockDataDir;

        await autoscale.handleLicenseRequest(proxy, awsPlatformAdapter, env);
        // ASSERT: proxy responds with http code 200 and expected license content
        Sinon.assert.match(
            spyProxyFormatResponse.calledWith(HttpStatusCode.OK, 'mockup-license1\n'),
            true
        );
        spyProxyFormatResponse.restore();
    });
    it('Assign the first available license. 4 lic. 4 stock. 1 used. #1 used, assign #2.', async () => {
        mockDataDir = path.resolve(
            mockDataRootDir,
            'license-assignment-4-lic-4-stock-1-used-assign-2nd'
        );
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-get-license.json')
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

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');

        // change the s3 root dir
        mockS3.rootDir = mockDataDir;

        await autoscale.handleLicenseRequest(proxy, awsPlatformAdapter, env);
        // ASSERT: proxy responds with http code 200 and expected license content
        Sinon.assert.match(
            spyProxyFormatResponse.calledWith(HttpStatusCode.OK, 'mockup-license2\n'),
            true
        );
        spyProxyFormatResponse.restore();
    });
    it('Assign the first available license. 4 lic. 4 stock. 1 used. #1 used (self), reassign #1.', async () => {
        mockDataDir = path.resolve(
            mockDataRootDir,
            'license-assignment-4-lic-4-stock-1-used-reassign-1st'
        );
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-get-license.json')
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

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');

        // change the s3 root dir
        mockS3.rootDir = mockDataDir;

        await autoscale.handleLicenseRequest(proxy, awsPlatformAdapter, env);
        // ASSERT: proxy responds with http code 200 and expected license content
        Sinon.assert.match(
            spyProxyFormatResponse.calledWith(HttpStatusCode.OK, 'mockup-license1\n'),
            true
        );
        spyProxyFormatResponse.restore();
    });
    it('Assign the first available license. 4 in stock. 4 used. #2 recyclable. assign #2.', async () => {
        mockDataDir = path.resolve(
            mockDataRootDir,
            'license-assignment-4-lic-4-stock-4-used-1-recyc-assign-2nd'
        );
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-get-license.json')
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

        const spySaveItemToDb = Sinon.spy(awsPlatformAdaptee, 'saveItemToDb');

        const stubUpdateLicenseUsage = Sinon.stub(awsPlatformAdapter, 'updateLicenseUsage');
        stubUpdateLicenseUsage.callsFake(records => {
            stubUpdateLicenseUsage.restore();
            const callCount = mocDocClient.getStub('scan').callCount;
            mocDocClient.callSubOnNthFake('scan', callCount + 2, 'updated', true);
            return awsPlatformAdapter.updateLicenseUsage(records);
        });

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');

        // change the s3 root dir
        mockS3.rootDir = mockDataDir;

        await autoscale.handleLicenseRequest(proxy, awsPlatformAdapter, env);
        // ASSERT: the expected usage record is saved to db
        const item = {
            algorithm: 'sha256',
            checksum: 'b118a0be644a301f4f62f99dc0f3ec7c43d641587340b09ef829594cd518753e',
            fileName: 'mockup-license2',
            productName: 'fortigate',
            vmId: 'i-0000000000byol001',
            scalingGroupName:
                'fortigate-autoscale-has-a-very-long-res-tag-prefix-69e58ed0-fortigate-byol-auto-scaling-group',
            assignedTime: 1588209959339,
            vmInSync: true
        };

        // the saved item contains the expected property values.
        const licenseItem: LicenseUsageRecord = spySaveItemToDb.args[
            spySaveItemToDb.args.length - 1
        ][1] as LicenseUsageRecord;
        Sinon.assert.match(item.algorithm === licenseItem.algorithm, true);
        Sinon.assert.match(item.checksum === licenseItem.checksum, true);
        Sinon.assert.match(item.fileName === licenseItem.fileName, true);
        Sinon.assert.match(item.productName === licenseItem.productName, true);
        Sinon.assert.match(item.vmId === licenseItem.vmId, true);
        Sinon.assert.match(item.scalingGroupName === licenseItem.scalingGroupName, true);

        // ASSERT: proxy responds with http code 200 and expected license content
        Sinon.assert.match(
            spyProxyFormatResponse.calledWith(HttpStatusCode.OK, 'mockup-license2\n'),
            true
        );

        spyProxyFormatResponse.restore();
        spySaveItemToDb.restore();
    });
    it('Continue to launch if run out of license. Return empty license content.', async () => {
        mockDataDir = path.resolve(
            mockDataRootDir,
            'license-assignment-4-lic-4-stock-4-used-0-recyc-not-assign'
        );
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-get-license.json')
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

        const stubUpdateLicenseUsage = Sinon.stub(awsPlatformAdapter, 'updateLicenseUsage');
        stubUpdateLicenseUsage.callsFake(records => {
            stubUpdateLicenseUsage.restore();
            const callCount = mocDocClient.getStub('scan').callCount;
            mocDocClient.callSubOnNthFake('scan', callCount + 2, 'updated', true);
            return awsPlatformAdapter.updateLicenseUsage(records);
        });

        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');

        // change the s3 root dir
        mockS3.rootDir = mockDataDir;

        await autoscale.handleLicenseRequest(proxy, awsPlatformAdapter, env);

        // ASSERT: proxy responds with http code 200 and empty license content
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);

        stubUpdateLicenseUsage.restore();
        spyProxyFormatResponse.restore();
    });
    it('No license file or license storage found. Continue to launch. Return empty license content.', async () => {
        mockDataDir = path.resolve(
            mockDataRootDir,
            'license-assignment-0-lic-4-stock-0-used-not-assign'
        );
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-get-license.json')
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

        const stubUpdateLicenseStock = Sinon.stub(awsPlatformAdapter, 'updateLicenseStock');
        stubUpdateLicenseStock.callsFake(records => {
            stubUpdateLicenseStock.restore();
            const callCount = mocDocClient.getStub('scan').callCount;
            mocDocClient.callSubOnNthFake('scan', callCount + 2, 'updated', true);
            return awsPlatformAdapter.updateLicenseStock(records);
        });

        const spyDeleteItemFromDb = Sinon.spy(awsPlatformAdaptee, 'deleteItemFromDb');
        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');

        // change the s3 root dir
        mockS3.rootDir = mockDataDir;

        await autoscale.handleLicenseRequest(proxy, awsPlatformAdapter, env);

        // ASSERT: the following items are removed from db table
        const items = [
            {
                algorithm: 'sha256',
                checksum: '0b8730303b3c0d2477ac8c78f50c4cf8068b8bfb1cb48090a0e0d10f520d2b09',
                fileName: 'mockup-license1',
                productName: 'fortigate'
            },
            {
                algorithm: 'sha256',
                checksum: 'b118a0be644a301f4f62f99dc0f3ec7c43d641587340b09ef829594cd518753e',
                fileName: 'mockup-license2',
                productName: 'fortigate'
            },
            {
                algorithm: 'sha256',
                checksum: 'f80604c4767664f340eade34f67bdd4827c7d3749c88bc1d8f4e0aa19f0b0c69',
                fileName: 'mockup-license3',
                productName: 'fortigate'
            },
            {
                algorithm: 'sha256',
                checksum: '059534f4c25da5b7e05bdebcb8d62f07dbf869fbca1487169a89cd26845febdc',
                fileName: 'mockup-license4',
                productName: 'fortigate'
            }
        ];
        Sinon.assert.match(spyDeleteItemFromDb.calledWith(Sinon.match.any, items[0]), true);
        Sinon.assert.match(spyDeleteItemFromDb.calledWith(Sinon.match.any, items[1]), true);
        Sinon.assert.match(spyDeleteItemFromDb.calledWith(Sinon.match.any, items[2]), true);
        Sinon.assert.match(spyDeleteItemFromDb.calledWith(Sinon.match.any, items[3]), true);

        // ASSERT: proxy responds with http code 200 and empty license content
        Sinon.assert.match(spyProxyFormatResponse.calledWith(HttpStatusCode.OK, ''), true);

        stubUpdateLicenseStock.restore();
        spyDeleteItemFromDb.restore();
        spyProxyFormatResponse.restore();
    });
    it(
        'License files are partially removed. ' +
            'Should remove corresponding records from license stock db table accordingly.',
        async () => {
            mockDataDir = path.resolve(
                mockDataRootDir,
                'license-assignment-2-lic-4-stock-0-used-assign-1st'
            );
            event = await awsTestMan.fakeApiGatewayRequest(
                path.resolve(mockDataDir, 'request/event-fgt-get-license.json')
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

            const stubUpdateLicenseStock = Sinon.stub(awsPlatformAdapter, 'updateLicenseStock');
            stubUpdateLicenseStock.callsFake(records => {
                stubUpdateLicenseStock.restore();
                const callCount = mocDocClient.getStub('scan').callCount;
                mocDocClient.callSubOnNthFake('scan', callCount + 2, 'updated', true);
                return awsPlatformAdapter.updateLicenseStock(records);
            });

            const spyDeleteItemFromDb = Sinon.spy(awsPlatformAdaptee, 'deleteItemFromDb');
            const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');

            // change the s3 root dir
            mockS3.rootDir = mockDataDir;

            await autoscale.handleLicenseRequest(proxy, awsPlatformAdapter, env);

            // ASSERT: the following items are removed from db table
            const items = [
                {
                    algorithm: 'sha256',
                    checksum: '0b8730303b3c0d2477ac8c78f50c4cf8068b8bfb1cb48090a0e0d10f520d2b09',
                    fileName: 'mockup-license1',
                    productName: 'fortigate'
                },
                {
                    algorithm: 'sha256',
                    checksum: '059534f4c25da5b7e05bdebcb8d62f07dbf869fbca1487169a89cd26845febdc',
                    fileName: 'mockup-license4',
                    productName: 'fortigate'
                }
            ];
            Sinon.assert.match(spyDeleteItemFromDb.calledWith(Sinon.match.any, items[0]), true);
            Sinon.assert.match(spyDeleteItemFromDb.calledWith(Sinon.match.any, items[1]), true);

            // ASSERT: proxy responds with http code 200 and expected license content
            Sinon.assert.match(
                spyProxyFormatResponse.calledWith(HttpStatusCode.OK, 'mockup-license2\n'),
                true
            );
            stubUpdateLicenseStock.restore();
            spyDeleteItemFromDb.restore();
            spyProxyFormatResponse.restore();
        }
    );
    it('Multiple license files which have identical content should be recorded once.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'license-assignment-4-lic-2-duplicate');
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-get-license.json')
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

        const stubUpdateLicenseStock = Sinon.stub(awsPlatformAdapter, 'updateLicenseStock');
        stubUpdateLicenseStock.callsFake(records => {
            stubUpdateLicenseStock.restore();
            const callCount = mocDocClient.getStub('scan').callCount;
            mocDocClient.callSubOnNthFake('scan', callCount + 2, 'updated', true);
            return awsPlatformAdapter.updateLicenseStock(records);
        });

        const spySaveItemToDb = Sinon.spy(awsPlatformAdaptee, 'saveItemToDb');
        const spyProxyFormatResponse = Sinon.spy(proxy, 'formatResponse');

        // change the s3 root dir
        mockS3.rootDir = mockDataDir;

        await autoscale.handleLicenseRequest(proxy, awsPlatformAdapter, env);

        // ASSERT: the following items are partially saved from db table
        const items = [
            {
                algorithm: 'sha256',
                checksum: '0b8730303b3c0d2477ac8c78f50c4cf8068b8bfb1cb48090a0e0d10f520d2b09',
                fileName: 'mockup-license1',
                productName: 'fortigate'
            },
            {
                algorithm: 'sha256',
                checksum: 'b118a0be644a301f4f62f99dc0f3ec7c43d641587340b09ef829594cd518753e',
                fileName: 'mockup-license2',
                productName: 'fortigate'
            },
            {
                algorithm: 'sha256',
                checksum: 'f80604c4767664f340eade34f67bdd4827c7d3749c88bc1d8f4e0aa19f0b0c69',
                fileName: 'mockup-license3',
                productName: 'fortigate'
            },
            {
                algorithm: 'sha256',
                checksum: '059534f4c25da5b7e05bdebcb8d62f07dbf869fbca1487169a89cd26845febdc',
                fileName: 'mockup-license4',
                productName: 'fortigate'
            }
        ];
        Sinon.assert.match(spySaveItemToDb.calledWith(Sinon.match.any, items[0]), false);
        Sinon.assert.match(spySaveItemToDb.calledWith(Sinon.match.any, items[1]), true);
        Sinon.assert.match(spySaveItemToDb.calledWith(Sinon.match.any, items[2]), true);
        Sinon.assert.match(spySaveItemToDb.calledWith(Sinon.match.any, items[3]), false);

        // ASSERT: proxy responds with http code 200 and expected license content
        Sinon.assert.match(
            spyProxyFormatResponse.calledWith(HttpStatusCode.OK, 'mockup-license2\n'),
            true
        );
        stubUpdateLicenseStock.restore();
        spySaveItemToDb.restore();
        spyProxyFormatResponse.restore();
    });
});
