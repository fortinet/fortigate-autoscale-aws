import fs from 'fs';
import * as commentJson from 'comment-json';
import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { EC2 } from 'aws-sdk';

export type ApiGatewayRequestHandler = (
    event: APIGatewayProxyEvent,
    context: Context
) => Promise<APIGatewayProxyResult>;

export class AwsTestMan {
    readFileAsJson(filePath: string): Promise<{ [key: string]: any }> {
        const buffer = fs.readFileSync(filePath);
        return Promise.resolve(commentJson.parse(buffer.toString('utf-8')));
    }

    fakeApiGatewayContext(): Promise<Context> {
        return Promise.resolve({
            callbackWaitsForEmptyEventLoop: false,
            functionName: 'fake-caller',
            functionVersion: '1.0.0',
            invokedFunctionArn: 'arn::',
            memoryLimitInMB: '128',
            awsRequestId: 'fake-aws-request-id',
            logGroupName: 'fake-log-group-name',
            logStreamName: 'fake-log-stream-name'
        } as Context);
    }
    async makeApiGatewayRequest(
        requestHandler: ApiGatewayRequestHandler,
        requestEvent: APIGatewayProxyEvent,
        requestContext?: Context
    ): Promise<void> {
        await requestHandler.call(
            requestHandler,
            requestEvent,
            requestContext || (await this.fakeApiGatewayContext())
        );
    }

    fakeDescribeInstance(instances: EC2.Instance[]): Promise<EC2.DescribeInstancesResult> {
        const result: EC2.DescribeInstancesResult = {
            Reservations: [
                {
                    Groups: [],
                    Instances: instances,
                    OwnerId: 'fake-owner-id',
                    RequesterId: 'fake-request-id',
                    ReservationId: 'fake-reservation-id'
                }
            ]
        };
        return Promise.resolve(result);
    }
}
