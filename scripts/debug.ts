/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import path from 'path';
import { Command } from 'commander';
import { AwsTestMan } from 'autoscale-core';
import { AutoscaleHandler, ScheduledEventHandler } from '../functions/fgt-as-handler/func';

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
        await AutoscaleHandler(await atm.fakeApiGatewayRequest(args.event), context);
    } else if (args.type === 'event') {
        await ScheduledEventHandler(await atm.fakeScheduledEventRequest(args.event), context);
    }
};

const program = new Command();
program.description('( ͡° ͜ʖ ͡°) FortiGate Autoscale make dist script.');

program
    .description('Debug autoscaleHandler.')
    .requiredOption('--event <filepath>', 'The event json file to be loaded.')
    .requiredOption('--type <value>', "The event type: 'api', 'event', 'service'.")
    .option('--env <filepath>', 'The environment variables json file to be loaded.')
    .action(start);

const main = async (): Promise<void> => {
    await program.parseAsync(process.argv);
    console.log('program ends.');
};

main();
