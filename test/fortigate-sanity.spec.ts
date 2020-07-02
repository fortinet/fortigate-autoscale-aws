/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as path from 'path';
import { describe, it } from 'mocha';
import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import {
    AwsPlatformAdapter,
    AutoscaleEnvironment,
    AwsFortiGateAutoscaleSetting
} from 'autoscale-core';
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

describe('FortiGate sanity test.', () => {
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
    it('Setting key match the keys in saveSettings.', async () => {
        mockDataDir = path.resolve(mockDataRootDir, 'bootstrap-master-group-instance');
        event = await awsTestMan.fakeApiGatewayRequest(
            path.resolve(mockDataDir, 'request/event-fgt-get-config.json')
        );
        context = await awsTestMan.fakeApiGatewayContext();

        const {
            autoscale,
            platformAdaptee: awsPlatformAdaptee,
            platformAdapter: awsPlatformAdapter
        } = await createAwsApiGatewayEventHandler(event, context);

        ({
            s3: mockS3,
            ec2: mockEC2,
            autoscaling: mockAutoscaling,
            elbv2: mockElbv2,
            lambda: mockLambda,
            docClient: mocDocClient
        } = awsPlatformAdaptee.stubAwsServices(path.resolve(mockDataDir, 'aws-api')));

        const spySaveSettingItem = Sinon.spy(awsPlatformAdapter, 'saveSettingItem');

        // change the s3 root dir
        mockS3.rootDir = mockDataDir;

        const settingsToSave: { [key: string]: string } = {};
        Object.values({ ...AwsFortiGateAutoscaleSetting }).forEach(value => {
            const settingKey = value.toLowerCase().replace(new RegExp('-', 'g'), '');
            settingsToSave[settingKey] = value;
            return settingsToSave;
        });

        const result = await autoscale.saveSettings(settingsToSave);
        // ASSERT: saveSettings() completes sucessfully without any error.
        Sinon.assert.match(result, true);
        // ASSERT: saveSettings() completes sucessfully without any error.
        Sinon.assert.match(spySaveSettingItem.threw(), false);
        // ASSERT: each key has been processed and saved.
        const savedKeys = await Promise.all(spySaveSettingItem.returnValues);
        const keyNotSaved = Object.values(settingsToSave).filter(value => {
            return !savedKeys.includes(value);
        });
        if (savedKeys.length !== Object.keys(settingsToSave).length) {
            console.log('The following keys not processed: ', keyNotSaved);
        }
        Sinon.assert.match(savedKeys.length, Object.keys(settingsToSave).length);
    });
});
