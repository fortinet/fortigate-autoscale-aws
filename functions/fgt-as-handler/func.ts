import {
    AwsApiGatewayEventProxy,
    AwsCloudFormationCustomResourceEventProxy,
    AwsFortiGateAutoscale,
    AwsFortiGateAutoscaleServiceProvider,
    AwsFortiGateAutoscaleTgw,
    AwsPlatformAdaptee,
    AwsPlatformAdapter,
    AwsScheduledEventProxy
} from 'autoscale-core';
import { AutoscaleEnvironment } from 'autoscale-core/dist/autoscale-environment';
import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    CloudFormationCustomResourceEvent,
    Context,
    ScheduledEvent
} from 'aws-lambda';

// API Gateway event handler for http requests coming from FortiGate callback
export async function autoscaleHandler(
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> {
    console.log(event);
    const env = {} as AutoscaleEnvironment;
    const proxy = new AwsApiGatewayEventProxy(event, context);
    const platform = new AwsPlatformAdapter(new AwsPlatformAdaptee(), proxy);
    const autoscale = new AwsFortiGateAutoscale<
        APIGatewayProxyEvent,
        Context,
        APIGatewayProxyResult
    >(platform, env, proxy);
    return await autoscale.handleAutoscaleRequest(proxy, platform, env);
}

// to handle cloudwatch scheduled event
export async function scheduledEventHandler(
    event: ScheduledEvent,
    context: Context
): Promise<void> {
    console.log(event);
    const env = {} as AutoscaleEnvironment;
    const proxy = new AwsScheduledEventProxy(event, context);
    const platform = new AwsPlatformAdapter(new AwsPlatformAdaptee(), proxy);
    const autoscale = new AwsFortiGateAutoscale<ScheduledEvent, Context, void>(
        platform,
        env,
        proxy
    );
    await autoscale.handleAutoscaleRequest(proxy, platform, env);
    return Promise.resolve();
}

// Transit Gateway Integration
// API Gateway event handler for http requests coming from FortiGate callback
export async function autoscaleTgwHandler(
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> {
    console.log(event);
    const env = {} as AutoscaleEnvironment;
    const proxy = new AwsApiGatewayEventProxy(event, context);
    const platform = new AwsPlatformAdapter(new AwsPlatformAdaptee(), proxy);
    const autoscale = new AwsFortiGateAutoscaleTgw<
        APIGatewayProxyEvent,
        Context,
        APIGatewayProxyResult
    >(platform, env, proxy);
    return await autoscale.handleAutoscaleRequest(proxy, platform, env);
}

export async function scheduledEventTgwHandler(
    event: ScheduledEvent,
    context: Context
): Promise<void> {
    console.log(event);
    const env = {} as AutoscaleEnvironment;
    const proxy = new AwsScheduledEventProxy(event, context);
    const platform = new AwsPlatformAdapter(new AwsPlatformAdaptee(), proxy);
    const autoscale = new AwsFortiGateAutoscaleTgw<ScheduledEvent, Context, void>(
        platform,
        env,
        proxy
    );
    await autoscale.handleAutoscaleRequest(proxy, platform, env);
    return Promise.resolve();
}

// to handle license assignment event
// NOTE: both TGW integrated class and non-TGW integrated class share the same license assignment
// logics. It's okay to use the non-TGW class for both.
export async function licenseHandler(
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> {
    console.log(event);
    const env = {} as AutoscaleEnvironment;
    const proxy = new AwsApiGatewayEventProxy(event, context);
    const platform = new AwsPlatformAdapter(new AwsPlatformAdaptee(), proxy);
    const autoscale = new AwsFortiGateAutoscale<
        APIGatewayProxyEvent,
        Context,
        APIGatewayProxyResult
    >(platform, env, proxy);
    return await autoscale.handleLicenseRequest(proxy, platform, env);
}

// CloudFormation Custom Resource service provider
// NOTE: both TGW integrated class and non-TGW integrated class share the same license assignment
// logics. It's okay to use the non-TGW class for both.
export async function cfnServiceEventHandler(
    event: CloudFormationCustomResourceEvent,
    context: Context
): Promise<void> {
    console.log(event);
    const env = {} as AutoscaleEnvironment;
    const proxy = new AwsCloudFormationCustomResourceEventProxy(event, context);
    const platform = new AwsPlatformAdapter(new AwsPlatformAdaptee(), proxy);
    const autoscale = new AwsFortiGateAutoscale<CloudFormationCustomResourceEvent, Context, void>(
        platform,
        env,
        proxy
    );
    const serviceProvider: AwsFortiGateAutoscaleServiceProvider = new AwsFortiGateAutoscaleServiceProvider(
        autoscale
    );
    return await serviceProvider.handleServiceRequest();
}
