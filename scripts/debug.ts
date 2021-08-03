/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { AwsTestMan } from '@fortinet/fortigate-autoscale/dist/aws/test-helper';
import { Command } from 'commander';
import path from 'path';
import {
    autoscaleHandler,
    autoscaleTgwHandler,
    licenseHandler,
    scheduledEventHandler,
    scheduledEventTgwHandler,
    tgwLambdaPeerInvocationHandler
} from '../functions/fgt-as-handler/func';

const REAL_PROJECT_ROOT = path.resolve(__dirname, '../../');
const atm = new AwsTestMan(REAL_PROJECT_ROOT);

const start = async (args: any): Promise<void> => {
    await atm.loadEnvironmentVariables(args.env);
    console.log(process.env);
    // const event =
    //     (args.type === 'api' && (await atm.fakeApiGatewayRequest(args.event))) ||
    //     (args.type === 'event' && (await atm.fakeScheduledEventRequest(args.event))) ||
    //     (args.type === 'service' && (await atm.fakeCfnCustomResourceRequest(args.event)));
    const context = await atm.fakeLambdaContext();

    if (args.type === 'api') {
        if (args.tgw) {
            await autoscaleTgwHandler(await atm.fakeApiGatewayRequest(args.event), context);
        } else {
            await autoscaleHandler(await atm.fakeApiGatewayRequest(args.event), context);
        }
    } else if (args.type === 'event') {
        if (args.tgw) {
            await scheduledEventTgwHandler(
                await atm.fakeScheduledEventRequest(args.event),
                context
            );
        } else {
            await scheduledEventHandler(await atm.fakeScheduledEventRequest(args.event), context);
        }
    } else if (args.type === 'peerinvocation') {
        await tgwLambdaPeerInvocationHandler(await atm.fakeCustomRequest(args.event), context);
    } else if (args.type === 'license') {
        await licenseHandler(await atm.fakeApiGatewayRequest(args.event), context);
    }
};

const program = new Command();
program.description('( ͡° ͜ʖ ͡°) FortiGate Autoscale make dist script.');

program
    .description('Debug autoscaleHandler.')
    .requiredOption('--event <filepath>', 'The event json file to be loaded.')
    .requiredOption('--type <value>', "The event type: 'api', 'event', 'service'.")
    .option('--env <filepath>', 'The environment variables json file to be loaded.')
    .option('--tgw', 'with Transit Gateway Integration?')
    .action(start);

const main = async (): Promise<void> => {
    await program.parseAsync(process.argv);
    console.log('program ends.');
};

main();
