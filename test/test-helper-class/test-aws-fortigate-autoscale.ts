import {
    AwsFortiGateAutoscale,
    MasterElectionStrategy,
    BootstrapConfigurationStrategy,
    HeartbeatSyncStrategy
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
