import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import {
    AutoscaleEnvironment,
    AwsLambdaProxy,
    AwsPlatform,
    AwsPlatformAdapter,
    FortiGateAutoscaleAws
} from 'autoscale-core';
export const handler = (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    const env = {} as AutoscaleEnvironment;
    const proxy = new AwsLambdaProxy(event, context);
    const platform = new AwsPlatformAdapter(new AwsPlatform(), proxy);
    const autoscale = new FortiGateAutoscaleAws(platform, env, proxy);
    return autoscale.handleCloudFunctionRequest(proxy, platform, env);
};

export const handlerEx = (
    event: APIGatewayProxyEvent,
    context: Context
): [
    FortiGateAutoscaleAws,
    AutoscaleEnvironment,
    AwsPlatform,
    AwsPlatformAdapter,
    AwsLambdaProxy
] => {
    const env = {} as AutoscaleEnvironment;
    const proxy = new AwsLambdaProxy(event, context);
    const p = new AwsPlatform();
    const pa = new AwsPlatformAdapter(p, proxy);
    const autoscale = new FortiGateAutoscaleAws(pa, env, proxy);
    return [autoscale, env, p, pa, proxy];
};
