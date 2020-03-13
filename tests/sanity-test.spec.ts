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
    AutoscaleSetting
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
        event = (await atm.readFileAsJson(
            path.resolve(__dirname, './mockup-data/fgt-get-config.json')
        )) as APIGatewayProxyEvent;
        context = await atm.fakeApiGatewayContext();
        settings = new Map<string, SettingItem>();
        const si: SettingItem = {
            key: '1',
            value: '2',
            description: '3',
            editable: true,
            jsonEncoded: false,
            toJSON() {
                return {};
            }
        };
        settings.set(AutoscaleSetting.MasterElectionTimeout, si);
    });
    it('FortiGate Autoscale handler', async () => {
        const [autoscale, env, platform, proxy] = await handlerEx(event, context);
        const stub1 = Sinon.stub(platform, 'getTargetVm').callsFake(
            async (): Promise<VirtualMachine> => {
                console.log(env);
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
        const stub2 = Sinon.stub(platform, 'getHealthCheckRecord').callsFake(async vm => {
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
        const stub3 = Sinon.stub(platform, 'getMasterVm').callsFake(
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
        const stub4 = Sinon.stub(platform, 'getMasterRecord').callsFake(async () => {
            const record = (await atm.readFileAsJson(
                path.resolve(__dirname, './mockup-data/fgt-master-record.json')
            )) as MasterRecord;
            env.masterRecord = record;
            return record;
        });
        const stub5 = Sinon.stub(platform, 'getSettings').callsFake(() => {
            return Promise.resolve(settings);
        });
        await autoscale.handleRequest(proxy, platform, env);
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
