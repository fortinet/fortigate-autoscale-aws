import { Command } from 'commander';
import { parse as CommentJsonParse } from 'comment-json';
import fs from 'fs';
import path from 'path';
import { CodePackman } from './code-packman';

let projectRoot: string;
let tsConfigJson: {
    compilerOptions: { outDir: string; [key: string]: unknown };
    [key: string]: unknown;
};
let cpm: CodePackman;

const init = (command: Command): Promise<void> => {
    projectRoot = path.resolve(command.projectRoot);
    console.log(projectRoot, command);
    tsConfigJson = CommentJsonParse(
        fs.readFileSync(path.resolve(projectRoot, 'tsconfig.json')).toString()
    );
    console.log(tsConfigJson);
    cpm = new CodePackman(projectRoot, tsConfigJson.compilerOptions.outDir);
    return Promise.resolve();
};

const makeDistAwsCloudFormation = async (): Promise<boolean> => {
    console.info('Making distribution zip package for: AWS Cloud Formation');
    // cpm.projectRoot = path.resolve(cpm.projectRoot, '../');
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
    .requiredOption('--project-root <value>', 'set the project root to run this script.')
    .action(async command => {
        await init(command);
        await makeDistAwsCloudFormation();
    });

program
    .command('build-all')
    .description('run all build commands, each at a time.')
    .requiredOption('--project-root <value>', 'set the project root to run this script.')
    .action(async command => {
        await init(command);
        await makeDistAwsCloudFormation();
    });

const main = async (): Promise<void> => {
    await program.parseAsync(process.argv);
    console.log('program ends.');
};

main();
