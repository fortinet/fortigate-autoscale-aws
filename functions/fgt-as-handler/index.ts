import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import {
    FortiGateAutoscale,
    AutoscaleEnvironment,
    AwsLambdaProxy,
    AwsPlatformAdapter,
    AwsPlatform
} from 'autoscale-core';
import FortiGateAutoscaleAws from 'autoscale-core/fortigate-autoscale/aws/fortigate-autoscale-aws';
export const handler = (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    const env = {} as AutoscaleEnvironment;
    const proxy = new AwsLambdaProxy(event, context);
    const platform = new AwsPlatformAdapter(new AwsPlatform(), proxy);
    const autoscale = new FortiGateAutoscale<APIGatewayProxyEvent, Context, APIGatewayProxyResult>(
        platform,
        env,
        proxy
    );
    return autoscale.handleRequest(proxy, platform, env);
};

export const handlerEx = (
    event: APIGatewayProxyEvent,
    context: Context
): [
    FortiGateAutoscale<APIGatewayProxyEvent, Context, APIGatewayProxyResult>,
    AutoscaleEnvironment,
    AwsPlatformAdapter,
    AwsLambdaProxy
] => {
    const env = {} as AutoscaleEnvironment;
    const proxy = new AwsLambdaProxy(event, context);
    const pa = new AwsPlatformAdapter(new AwsPlatform(), proxy);
    const autoscale = new FortiGateAutoscaleAws(pa, env, proxy);
    return [autoscale, env, pa, proxy];
};
