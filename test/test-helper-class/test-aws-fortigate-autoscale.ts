import { AwsFortiGateAutoscale, MasterElectionStrategy } from 'autoscale-core';

export class TestAwsFortiGateAutoscale<TReq, TContext, TRes> extends AwsFortiGateAutoscale<
    TReq,
    TContext,
    TRes
> {
    expose(): {
        masterElectionStrategy: MasterElectionStrategy;
    } {
        return {
            masterElectionStrategy: this.masterElectionStrategy
        };
    }
}
