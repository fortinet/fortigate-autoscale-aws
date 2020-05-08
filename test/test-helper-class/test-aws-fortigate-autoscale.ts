import {
    AwsFortiGateAutoscale,
    MasterElectionStrategy,
    BootstrapConfigurationStrategy
} from 'autoscale-core';

export class TestAwsFortiGateAutoscale<TReq, TContext, TRes> extends AwsFortiGateAutoscale<
    TReq,
    TContext,
    TRes
> {
    expose(): {
        masterElectionStrategy: MasterElectionStrategy;
        bootstrapConfigStrategy: BootstrapConfigurationStrategy;
    } {
        return {
            masterElectionStrategy: this.masterElectionStrategy,
            bootstrapConfigStrategy: this.bootstrapConfigStrategy
        };
    }
}
