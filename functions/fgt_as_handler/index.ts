import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import {
    FortiGateAutoscale,
    AutoscaleEnvironment,
    AwsLambdaProxy,
    AwsPlatformAdapter,
    AwsPlatform
} from 'autoscale-core';
export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    const env = {} as AutoscaleEnvironment;
    const autoscale = new FortiGateAutoscale<
        APIGatewayProxyEvent,
        Context,
        APIGatewayProxyResult
    >();
    const proxy = new AwsLambdaProxy(event, context);
    const platform = new AwsPlatformAdapter(new AwsPlatform(), proxy);
    return await autoscale.handleRequest(proxy, platform, env);
};
