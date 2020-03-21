import * as path from 'path';
import { describe, it } from 'mocha';
import * as Sinon from 'sinon';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { AwsTestMan } from '../scripts/aws-testman';
import { handlerEx } from '../functions/fgt-as-handler/index';
import {
    VirtualMachine,
    HealthCheckRecord,
    MasterRecord,
    Settings,
    SettingItem,
    FortiGateAutoscaleSetting
} from 'autoscale-core';
import { EC2 } from 'aws-sdk';

const atm = new AwsTestMan();

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
describe('sanity test', () => {
    let event: APIGatewayProxyEvent;
    let context: Context;
    let settings: Settings;
    before(async function() {
        // enalbe local dev mode
        process.env.LOCAL_DEV_MODE = 'true';
        process.env.LOCAL_ASSESTS_DIR = 'node_modules/autoscale-core/fortigate-autoscale/assets';
        process.env.LOCAL_CUSTOM_ASSETS_DIR = 'test/mockup-data/';
        event = (await atm.readFileAsJson(
            path.resolve(__dirname, './mockup-data/fgt-get-config.json')
        )) as APIGatewayProxyEvent;
        context = await atm.fakeApiGatewayContext();
        settings = new Map<string, SettingItem>();
        settings.set(
            FortiGateAutoscaleSetting.MasterElectionTimeout,
            new SettingItem(
                FortiGateAutoscaleSetting.MasterElectionTimeout,
                '9999',
                '3',
                'false',
                'false'
            )
        );
        settings.set(
            FortiGateAutoscaleSetting.HeartbeatInterval,
            new SettingItem(
                FortiGateAutoscaleSetting.HeartbeatInterval,
                '999',
                '',
                'false',
                'false'
            )
        );
        settings.set(
            FortiGateAutoscaleSetting.EnableNic2,
            new SettingItem(FortiGateAutoscaleSetting.EnableNic2, 'true', '', 'false', 'false')
        );
        settings.set(
            FortiGateAutoscaleSetting.FortiGateInternalElbDns,
            new SettingItem(
                FortiGateAutoscaleSetting.FortiGateInternalElbDns,
                'fake-dns',
                '',
                'false',
                'false'
            )
        );
        settings.set(
            FortiGateAutoscaleSetting.FortiGateAdminPort,
            new SettingItem(
                FortiGateAutoscaleSetting.FortiGateAdminPort,
                '8888',
                '',
                'false',
                'false'
            )
        );
        settings.set(
            FortiGateAutoscaleSetting.FortiGateTrafficPort,
            new SettingItem(
                FortiGateAutoscaleSetting.FortiGateTrafficPort,
                '443',
                '',
                'false',
                'false'
            )
        );
        settings.set(
            FortiGateAutoscaleSetting.FortiGateSyncInterface,
            new SettingItem(
                FortiGateAutoscaleSetting.FortiGateSyncInterface,
                'port1',
                '',
                'false',
                'false'
            )
        );
        settings.set(
            FortiGateAutoscaleSetting.FortiGatePskSecret,
            new SettingItem(
                FortiGateAutoscaleSetting.FortiGatePskSecret,
                'fake-psksecret',
                '',
                'false',
                'false'
            )
        );
        settings.set(
            FortiGateAutoscaleSetting.AutoscaleHandlerUrl,
            new SettingItem(
                FortiGateAutoscaleSetting.AutoscaleHandlerUrl,
                'http://fake.url',
                '',
                'false',
                'false'
            )
        );
        settings.set(
            FortiGateAutoscaleSetting.AssetStorageContainer,
            new SettingItem(
                FortiGateAutoscaleSetting.AssetStorageContainer,
                'jliang01-fortigate-autoscale-us-west-2',
                '',
                'false',
                'false'
            )
        );
        settings.set(
            FortiGateAutoscaleSetting.AssetStorageDirectory,
            new SettingItem(
                FortiGateAutoscaleSetting.AssetStorageDirectory,
                'dev/assets',
                '',
                'false',
                'false'
            )
        );
        settings.set(
            FortiGateAutoscaleSetting.CustomConfigSetContainer,
            new SettingItem(
                FortiGateAutoscaleSetting.CustomConfigSetContainer,
                'jliang01-fortigate-autoscale-us-west-2',
                '',
                'false',
                'false'
            )
        );
        settings.set(
            FortiGateAutoscaleSetting.CustomConfigSetDirectory,
            new SettingItem(
                FortiGateAutoscaleSetting.CustomConfigSetDirectory,
                'custom-configset',
                '',
                'false',
                'false'
            )
        );
        settings.set(
            FortiGateAutoscaleSetting.CustomConfigSetName,
            new SettingItem(
                FortiGateAutoscaleSetting.CustomConfigSetName,
                'fgt-custom-configset-1 ,  fgt-custom-configset-2',
                '',
                'false',
                'false'
            )
        );
        settings.set(
            FortiGateAutoscaleSetting.EnableInternalElb,
            new SettingItem(
                FortiGateAutoscaleSetting.EnableInternalElb,
                'true',
                '',
                'false',
                'false'
            )
        );
        settings.set(
            FortiGateAutoscaleSetting.EnableFazIntegration,
            new SettingItem(
                FortiGateAutoscaleSetting.EnableFazIntegration,
                'true',
                '',
                'false',
                'false'
            )
        );
    });
    it('FortiGate Autoscale handler', async () => {
        const [autoscale, env, platform, platformAdapter, proxy] = await handlerEx(event, context);
        const stub1 = Sinon.stub(platformAdapter, 'getTargetVm').callsFake(
            async (): Promise<VirtualMachine> => {
                const instance = (await atm.readFileAsJson(
                    path.resolve(__dirname, './mockup-data/fgt-slave-instance.json')
                )) as EC2.Instance;
                const vm: VirtualMachine = {
                    instanceId: instance.InstanceId,
                    scalingGroupName: 'fake-scaling-group-name',
                    primaryPrivateIpAddress: instance.PrivateIpAddress,
                    primaryPublicIpAddress: instance.PublicIpAddress,
                    virtualNetworkId: instance.VpcId,
                    subnetId: instance.SubnetId
                };
                env.targetVm = vm;
                env.targetId = vm.instanceId;
                return vm;
            }
        );
        const stub2 = Sinon.stub(platformAdapter, 'getHealthCheckRecord').callsFake(async vm => {
            if (vm.instanceId === env.masterId) {
                const record = (await atm.readFileAsJson(
                    path.resolve(__dirname, './mockup-data/fgt-master-health-check-record.json')
                )) as HealthCheckRecord;
                env.targetHealthCheckRecord = record;
                return record;
            } else {
                return null;
            }
        });
        const stub3 = Sinon.stub(platformAdapter, 'getMasterVm').callsFake(
            async (): Promise<VirtualMachine> => {
                const instance = (await atm.readFileAsJson(
                    path.resolve(__dirname, './mockup-data/fgt-master-instance.json')
                )) as EC2.Instance;
                const vm: VirtualMachine = {
                    instanceId: instance.InstanceId,
                    scalingGroupName: 'fake-scaling-group-name',
                    primaryPrivateIpAddress: instance.PrivateIpAddress,
                    primaryPublicIpAddress: instance.PublicIpAddress,
                    virtualNetworkId: instance.VpcId,
                    subnetId: instance.SubnetId
                };
                env.masterVm = vm;
                env.masterId = vm.instanceId;
                return vm;
            }
        );
        const stub4 = Sinon.stub(platformAdapter, 'getMasterRecord').callsFake(async () => {
            const record = (await atm.readFileAsJson(
                path.resolve(__dirname, './mockup-data/fgt-master-record.json')
            )) as MasterRecord;
            env.masterRecord = record;
            return record;
        });
        const stub5 = Sinon.stub(platform, 'loadSettings').callsFake(() => {
            return Promise.resolve(settings);
        });

        await autoscale.handleCloudFunctionRequest(proxy, platformAdapter, env);
        Sinon.assert.match(stub1.called, true);
        Sinon.assert.match(stub2.called, true);
        Sinon.assert.match(stub3.called, true);
        Sinon.assert.match(stub4.called, true);
        Sinon.assert.match(stub5.called, true);
    });
    it('Nic attachment handler', () => {
        Sinon.assert.match(1, 1);
    });
});
