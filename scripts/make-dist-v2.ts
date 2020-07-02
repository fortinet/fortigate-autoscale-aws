import path from 'path';
import { Command } from 'commander';
import { CodePackman } from 'autoscale-core';

const REAL_PROJECT_ROOT = path.resolve(__dirname, '../');
const cpm = new CodePackman(REAL_PROJECT_ROOT, './dist');

const makeDistAwsCloudFormation = async (): Promise<boolean> => {
    console.info('Making distribution zip package for: AWS Cloud Formation');
    cpm.projectRoot = path.resolve(cpm.projectRoot, '../');
    try {
        await cpm.buildWithPackmanConfig();
        return true;
    } catch (error) {
        return false;
    }
};

const program = new Command();
program.description('( ͡° ͜ʖ ͡°) FortiGate Autoscale make dist script.');

program
    .command('build-aws-cloudformation')
    .description('build aws cloudformation deployment package.')
    .action(async () => {
        await makeDistAwsCloudFormation();
    });

program
    .command('build-all')
    .description('run all build commands, each at a time.')
    .action(async () => {
        await makeDistAwsCloudFormation();
    });

const main = async (): Promise<void> => {
    await program.parseAsync(process.argv);
    console.log('program ends.');
};

main();
