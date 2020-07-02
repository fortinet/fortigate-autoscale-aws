import {
    AwsFortiGateAutoscale,
    MasterElectionStrategy,
    BootstrapConfigurationStrategy,
    HeartbeatSyncStrategy,
    AwsFortiGateAutoscaleTgw,
    AwsFortiGateBootstrapTgwStrategy
} from 'autoscale-core';

export class TestAwsFortiGateAutoscale<TReq, TContext, TRes> extends AwsFortiGateAutoscale<
    TReq,
    TContext,
    TRes
> {
    expose(): {
        masterElectionStrategy: MasterElectionStrategy;
        heartbeatSyncStrategy: HeartbeatSyncStrategy;
        bootstrapConfigStrategy: BootstrapConfigurationStrategy;
    } {
        return {
            masterElectionStrategy: this.masterElectionStrategy,
            heartbeatSyncStrategy: this.heartbeatSyncStrategy,
            bootstrapConfigStrategy: this.bootstrapConfigStrategy
        };
    }
}

export class TestAwsTgwFortiGateAutoscale<TReq, TContext, TRes> extends AwsFortiGateAutoscaleTgw<
    TReq,
    TContext,
    TRes
> {
    expose(): {
        masterElectionStrategy: MasterElectionStrategy;
        heartbeatSyncStrategy: HeartbeatSyncStrategy;
        bootstrapConfigStrategy: AwsFortiGateBootstrapTgwStrategy;
    } {
        return {
            masterElectionStrategy: this.masterElectionStrategy,
            heartbeatSyncStrategy: this.heartbeatSyncStrategy,
            bootstrapConfigStrategy: this
                .bootstrapConfigStrategy as AwsFortiGateBootstrapTgwStrategy
        };
    }
}
