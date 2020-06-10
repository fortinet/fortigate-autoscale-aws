import {
    AutoscaleEnvironment,
    AwsFortiGateAutoscaleTgw,
    AwsPlatformAdaptee,
    AwsPlatformAdapter
} from 'autoscale-core/dist';
import { AwsScheduledEventProxy } from 'autoscale-core/dist/fortigate-autoscale/aws/aws-cloud-function-proxy';
import { Context, ScheduledEvent } from 'aws-lambda';

// to handle cloudwatch scheduled event
export const tgwVpnHandler = (event: ScheduledEvent, context: Context): Promise<void> => {
    const env = {} as AutoscaleEnvironment;
    const proxy = new AwsScheduledEventProxy(event, context);
    const platform = new AwsPlatformAdapter(new AwsPlatformAdaptee(), proxy);
    const autoscale = new AwsFortiGateAutoscaleTgw<ScheduledEvent, Context, void>(
        platform,
        env,
        proxy
    );
    autoscale.handleAutoscaleRequest(proxy, platform, env);
    return Promise.resolve();
};
