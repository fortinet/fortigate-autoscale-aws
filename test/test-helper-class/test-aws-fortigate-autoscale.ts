import {
    AwsFortiGateAutoscale,
    MasterElectionStrategy,
    BootstrapConfigurationStrategy,
    HeartbeatSyncStrategy,
    AwsFortiGateAutoscaleTgw,
    AwsFortiGateBootstrapTgwStrategy,
    LicensingStrategy
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
        licensingStrategy: LicensingStrategy;
    } {
        return {
            masterElectionStrategy: this.masterElectionStrategy,
            heartbeatSyncStrategy: this.heartbeatSyncStrategy,
            bootstrapConfigStrategy: this.bootstrapConfigStrategy,
            licensingStrategy: this.licensingStrategy
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
