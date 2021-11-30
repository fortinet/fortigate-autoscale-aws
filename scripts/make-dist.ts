import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { CodePackman, CodePackmanModule, createModule } from './code-packman';

const REAL_PROJECT_ROOT = path.resolve(__dirname, '../');
const cpm = new CodePackman(REAL_PROJECT_ROOT, './dist');
interface BuildOptions {
    includeSource?: boolean;
    includeZip?: boolean;
    excludeList?: string[];
    finalize?: boolean;
}

const makeDistAWSLambdaFgtAsgHandler = async (
    buildOptions?: BuildOptions
): Promise<CodePackmanModule> => {
    console.info('Making distribution zip package for: AWS FortiGate Autoscale Handler function');
    await cpm.createpWorkSpace();
    const cleanPaths = ['node_modules', 'local*', 'test', '.nyc_output', '.vscode'];
    // NOTE: create fgt-as-handler
    const modCore = createModule(cpm, './core', 'core', cleanPaths);
    const modAws = createModule(cpm, './aws', 'aws', cleanPaths);
    // aws add core as local dependency
    await modAws.addMod(modCore);
    await modAws.install();

    const modAwsCfnResponse = createModule(
        cpm,
        './aws_cfn_response',
        'aws-cfn-response',
        cleanPaths
    );

    const modFgtAsgHandler = createModule(
        cpm,
        './aws_lambda_fgt_asg_handler',
        'fgt-as-handler',
        cleanPaths
    );
    // copy module to temp dir
    await modFgtAsgHandler.copy();
    // clean unused directories and files
    await modFgtAsgHandler.clean();
    // add local local modules as dependency
    await modFgtAsgHandler.addMod(modAws);
    await modFgtAsgHandler.addMod(modAwsCfnResponse);
    await modFgtAsgHandler.install();

    if (buildOptions && buildOptions.includeZip) {
        // zip the module
        await modFgtAsgHandler.zip();
        await modFgtAsgHandler.copyZipToDist();
    }
    if (buildOptions && buildOptions.includeSource) {
        await modFgtAsgHandler.copySrcToDist();
    }
    if (buildOptions && buildOptions.finalize) {
        // move all dist files to the dist folder.
        await cpm.finalize();
    }
    return modFgtAsgHandler;
};

const makeDistAWSLambdaFazHandler = async (
    buildOptions?: BuildOptions
): Promise<CodePackmanModule> => {
    console.info('Making distribution zip package for: AWS Lambda FAZ Handler function');
    await cpm.createpWorkSpace();
    const cleanPaths = ['node_modules', 'local*', 'test', '.nyc_output', '.vscode'];
    // NOTE: create module
    const modCore = createModule(cpm, './core', 'core', cleanPaths);
    const modAws = createModule(cpm, './aws', 'aws', cleanPaths);
    // aws add core as local dependency
    await modAws.addMod(modCore);
    await modAws.install();

    const modAwsCfnResponse = createModule(
        cpm,
        './aws_cfn_response',
        'aws-cfn-response',
        cleanPaths
    );

    const modFazHandler = createModule(cpm, './aws_lambda_faz_handler', 'faz-handler', cleanPaths);
    // copy module to temp dir
    await modFazHandler.copy();
    // clean unused directories and files
    await modFazHandler.clean();
    // add local local modules as dependency
    await modFazHandler.addMod(modAws);
    await modFazHandler.addMod(modAwsCfnResponse);
    await modFazHandler.install();

    if (buildOptions && buildOptions.includeZip) {
        // zip the module
        await modFazHandler.zip();
        await modFazHandler.copyZipToDist();
    }
    if (buildOptions && buildOptions.includeSource) {
        await modFazHandler.copySrcToDist();
    }
    if (buildOptions && buildOptions.finalize) {
        // move all dist files to the dist folder.
        await cpm.finalize();
    }
    return modFazHandler;
};

const makeDistAWSLambdaNicAttachment = async (
    buildOptions?: BuildOptions
): Promise<CodePackmanModule> => {
    console.info('Making distribution zip package for: AWS Lambda Nic attachment function');
    await cpm.createpWorkSpace();
    const cleanPaths = ['node_modules', 'local*', 'test', '.nyc_output', '.vscode'];
    // NOTE: create module
    const modCore = createModule(cpm, './core', 'core', cleanPaths);
    const modAws = createModule(cpm, './aws', 'aws', cleanPaths);
    // aws add core as local dependency
    await modAws.addMod(modCore);
    await modAws.install();

    const modAwsCfnResponse = createModule(
        cpm,
        './aws_cfn_response',
        'aws-cfn-response',
        cleanPaths
    );

    const modNicAttachment = createModule(
        cpm,
        './aws_lambda_nic_attachment',
        'nic-attachment',
        cleanPaths
    );
    // copy module to temp dir
    await modNicAttachment.copy();
    // clean unused directories and files
    await modNicAttachment.clean();
    // add local local modules as dependency
    await modNicAttachment.addMod(modAws);
    await modNicAttachment.addMod(modAwsCfnResponse);
    await modNicAttachment.install();

    if (buildOptions && buildOptions.includeZip) {
        // zip the module
        await modNicAttachment.zip();
        await modNicAttachment.copyZipToDist();
    }
    if (buildOptions && buildOptions.includeSource) {
        await modNicAttachment.copySrcToDist();
    }
    if (buildOptions && buildOptions.finalize) {
        // move all dist files to the dist folder.
        await cpm.finalize();
    }
    return modNicAttachment;
};

const makeDistAWSLambdaTgwVpnHandler = async (
    buildOptions?: BuildOptions
): Promise<CodePackmanModule> => {
    console.info(
        'Making distribution zip package for: AWS Lambda Transit Gateway VPN handler function'
    );
    await cpm.createpWorkSpace();
    const cleanPaths = ['node_modules', 'local*', 'test', '.nyc_output', '.vscode'];
    // NOTE: create module
    const modCore = createModule(cpm, './core', 'core', cleanPaths);
    const modAws = createModule(cpm, './aws', 'aws', cleanPaths);
    // aws add core as local dependency
    await modAws.addMod(modCore);
    await modAws.install();

    const modAwsCfnResponse = createModule(
        cpm,
        './aws_cfn_response',
        'aws-cfn-response',
        cleanPaths
    );

    const modTgwVpnHandler = createModule(
        cpm,
        './aws_lambda_tgw_vpn_handler',
        'tgw-vpn-handler',
        cleanPaths
    );
    // copy module to temp dir
    await modTgwVpnHandler.copy();
    // clean unused directories and files
    await modTgwVpnHandler.clean();
    // add local local modules as dependency
    await modTgwVpnHandler.addMod(modAws);
    await modTgwVpnHandler.addMod(modAwsCfnResponse);
    await modTgwVpnHandler.install();

    if (buildOptions && buildOptions.includeZip) {
        // zip the module
        await modTgwVpnHandler.zip();
        await modTgwVpnHandler.copyZipToDist();
    }
    if (buildOptions && buildOptions.includeSource) {
        await modTgwVpnHandler.copySrcToDist();
    }
    if (buildOptions && buildOptions.finalize) {
        // move all dist files to the dist folder.
        await cpm.finalize();
    }
    return modTgwVpnHandler;
};

const makeDistAwsCloudFormation = async (
    buildOptions?: BuildOptions
): Promise<CodePackmanModule> => {
    console.info('Making distribution zip package for: AWS Cloud Formation');
    let cleanPaths = ['node_modules', 'local*', 'test', '.nyc_output', '.vscode'];
    if (buildOptions && buildOptions.excludeList) {
        cleanPaths = [...cleanPaths, ...buildOptions.excludeList];
    }
    const excludeList = (buildOptions && buildOptions.excludeList) || [];
    await cpm.createpWorkSpace();
    // cloud formation directory
    const modAwsCloudFormation = createModule(
        cpm,
        './aws_cloudformation',
        'aws-cloudformation',
        cleanPaths
    );
    // copy module to temp dir
    await modAwsCloudFormation.copy();
    // remove unused directory and files
    await modAwsCloudFormation.clean();
    const rFunctionPackageDir = './functions/packages';
    modAwsCloudFormation.createSubDir(rFunctionPackageDir);
    const rFunctionSourceDir = './functions/source';
    if (buildOptions && buildOptions.includeSource) {
        modAwsCloudFormation.createSubDir(rFunctionSourceDir);
    }
    // module: fgt asg handler
    const modFgtAsgHandler = await makeDistAWSLambdaFgtAsgHandler({
        includeZip: false,
        includeSource: false,
        excludeList: excludeList
    });
    await modFgtAsgHandler.zip();
    await modFgtAsgHandler.copyZipTo(
        path.resolve(modAwsCloudFormation.tempSrcDir, rFunctionPackageDir)
    );
    if (buildOptions && buildOptions.includeSource) {
        await modFgtAsgHandler.copySrcTo(
            path.resolve(modAwsCloudFormation.tempSrcDir, rFunctionSourceDir)
        );
    }

    // module: nic attachment
    const modNicAttachment = await makeDistAWSLambdaNicAttachment({
        includeZip: false,
        includeSource: false,
        excludeList: excludeList
    });
    await modNicAttachment.zip();
    await modNicAttachment.copyZipTo(
        path.resolve(modAwsCloudFormation.tempSrcDir, rFunctionPackageDir)
    );
    if (buildOptions && buildOptions.includeSource) {
        await modNicAttachment.copySrcTo(
            path.resolve(modAwsCloudFormation.tempSrcDir, rFunctionSourceDir)
        );
    }

    // module: faz handler
    const modFazHandler = await makeDistAWSLambdaFazHandler({
        includeZip: false,
        includeSource: false,
        excludeList: excludeList
    });
    await modFazHandler.zip();
    await modFazHandler.copyZipTo(
        path.resolve(modAwsCloudFormation.tempSrcDir, rFunctionPackageDir)
    );
    if (buildOptions && buildOptions.includeSource) {
        await modFazHandler.copySrcTo(
            path.resolve(modAwsCloudFormation.tempSrcDir, rFunctionSourceDir)
        );
    }

    // module: vpn handler
    const modTgwVpnHandler = await makeDistAWSLambdaTgwVpnHandler({
        includeZip: false,
        includeSource: false,
        excludeList: excludeList
    });
    await modTgwVpnHandler.zip();
    await modTgwVpnHandler.copyZipTo(
        path.resolve(modAwsCloudFormation.tempSrcDir, rFunctionPackageDir)
    );
    if (buildOptions && buildOptions.includeSource) {
        await modTgwVpnHandler.copySrcTo(
            path.resolve(modAwsCloudFormation.tempSrcDir, rFunctionSourceDir)
        );
    }

    // zip module
    await modAwsCloudFormation.zip();
    await modAwsCloudFormation.copyZipToDist();
    if (buildOptions && buildOptions.finalize) {
        // move all dist files to the dist folder.
        await cpm.finalize();
    }
    return modAwsCloudFormation;
};

const makeDistAwsQuickStartGuide = async (
    buildOptions?: BuildOptions
): Promise<CodePackmanModule> => {
    console.info('Making distribution zip package for: AWS QuickStart Guide');
    let cleanPaths = [
        'node_modules',
        'local*',
        'test',
        '.nyc_output',
        '.vscode',
        'LICENSE',
        'README.md',
        'NOTICE.txt'
    ];
    if (buildOptions && buildOptions.excludeList) {
        cleanPaths = [...cleanPaths, ...buildOptions.excludeList];
    }
    const excludeList = (buildOptions && buildOptions.excludeList) || [];
    await cpm.createpWorkSpace();
    // cloud formation directory
    const modAwsCloudFormation = createModule(
        cpm,
        './aws_cloudformation',
        'aws-quickstart-guide',
        cleanPaths
    );
    // copy module to temp dir
    await modAwsCloudFormation.copy();
    // remove unused directory and files
    await modAwsCloudFormation.clean();
    const rFunctionPackageDir = './functions/packages';
    modAwsCloudFormation.createSubDir(rFunctionPackageDir);
    const rFunctionSourceDir = './functions/source';
    if (buildOptions && buildOptions.includeSource) {
        modAwsCloudFormation.createSubDir(rFunctionSourceDir);
    }
    // module: fgt asg handler
    const modFgtAsgHandler = await makeDistAWSLambdaFgtAsgHandler({
        includeZip: false,
        includeSource: false,
        excludeList: excludeList
    });
    await modFgtAsgHandler.zip();
    await modFgtAsgHandler.copyZipTo(
        path.resolve(modAwsCloudFormation.tempSrcDir, rFunctionPackageDir)
    );
    await modFgtAsgHandler.copySrcTo(
        path.resolve(modAwsCloudFormation.tempSrcDir, rFunctionSourceDir)
    );

    // module: nic attachment
    const modNicAttachment = await makeDistAWSLambdaNicAttachment({
        includeZip: false,
        includeSource: false,
        excludeList: excludeList
    });
    await modNicAttachment.zip();
    await modNicAttachment.copyZipTo(
        path.resolve(modAwsCloudFormation.tempSrcDir, rFunctionPackageDir)
    );
    await modNicAttachment.copySrcTo(
        path.resolve(modAwsCloudFormation.tempSrcDir, rFunctionSourceDir)
    );

    // module: faz handler
    const modFazHandler = await makeDistAWSLambdaFazHandler({
        includeZip: false,
        includeSource: false,
        excludeList: excludeList
    });
    await modFazHandler.zip();
    await modFazHandler.copyZipTo(
        path.resolve(modAwsCloudFormation.tempSrcDir, rFunctionPackageDir)
    );
    await modFazHandler.copySrcTo(
        path.resolve(modAwsCloudFormation.tempSrcDir, rFunctionSourceDir)
    );

    // module: vpn handler
    const modTgwVpnHandler = await makeDistAWSLambdaTgwVpnHandler({
        includeZip: false,
        includeSource: false,
        excludeList: excludeList
    });
    await modTgwVpnHandler.zip();
    await modTgwVpnHandler.copyZipTo(
        path.resolve(modAwsCloudFormation.tempSrcDir, rFunctionPackageDir)
    );
    await modTgwVpnHandler.copySrcTo(
        path.resolve(modAwsCloudFormation.tempSrcDir, rFunctionSourceDir)
    );

    // zip module
    await modAwsCloudFormation.zip();
    await modAwsCloudFormation.copyZipToDist();
    if (buildOptions && buildOptions.finalize) {
        // move all dist files to the dist folder.
        await cpm.finalize();
    }
    return modAwsCloudFormation;
};

const unzipAWSArtifacts = async (): Promise<void> => {
    const rDirDist = path.resolve(REAL_PROJECT_ROOT, './dist');
    const rDirDistAWS = path.resolve(REAL_PROJECT_ROOT, './distAWS');
    const allDistFiles = await fs.readdirSync(rDirDist);
    // create distAWS dir
    await cpm.makeDir(rDirDistAWS);
    for (const file of allDistFiles) {
        if (file.includes('aws')) {
            await cpm.unzip(path.resolve(rDirDist, file), rDirDistAWS);
        }
    }
};

const makeDistAzureFuncApp = async (buildOptions?: BuildOptions): Promise<CodePackmanModule> => {
    console.info('Making distribution zip package');
    await cpm.createpWorkSpace();
    const cleanPaths = [
        'node_modules',
        'local',
        'test',
        '.nyc_output',
        '.vscode',
        'bin',
        'obj',
        '*.csproj',
        'proxies.json',
        'host.json',
        'local.settings.json'
    ];
    // NOTE: create module
    const modCore = createModule(cpm, './core', 'core', cleanPaths);
    const modAzure = createModule(cpm, './azure', 'azure', cleanPaths);
    // azure add core as local dependency
    await modAzure.addMod(modCore);
    await modAzure.install();

    const modAzureFuncApp = createModule(
        cpm,
        './azure_funcapp',
        null, // passing a null to use the name in package.json
        cleanPaths
    );
    // copy module to temp dir
    await modAzureFuncApp.copy();
    // clean unused directories and files
    await modAzureFuncApp.clean();
    // add local local modules as dependency
    await modAzureFuncApp.addMod(modAzure);
    await modAzureFuncApp.install();

    if (buildOptions && buildOptions.includeZip) {
        // zip the module
        await modAzureFuncApp.zip();
        await modAzureFuncApp.copyZipToDist();
    }
    if (buildOptions && buildOptions.includeSource) {
        await modAzureFuncApp.copySrcToDist();
    }
    if (buildOptions && buildOptions.finalize) {
        // move all dist files to the dist folder.
        await cpm.finalize();
    }
    return modAzureFuncApp;
};

const makeDistAzureTemplateDeployment = async (
    buildOptions?: BuildOptions
): Promise<CodePackmanModule> => {
    console.info('Making Azure Template Deployment zip package');
    let cleanPaths = ['node_modules', 'local*', 'test', '.nyc_output', '.vscode'];
    if (buildOptions && buildOptions.excludeList) {
        cleanPaths = [...cleanPaths, ...buildOptions.excludeList];
    }
    const excludeList = (buildOptions && buildOptions.excludeList) || [];
    await cpm.createpWorkSpace();
    // cloud formation directory
    const modAzureDeploymentTemplate = createModule(
        cpm,
        './azure_template_deployment',
        'fortigate-autoscale-azure-template-deployment',
        cleanPaths
    );
    // copy module to temp dir
    await modAzureDeploymentTemplate.copy();
    // remove unused directory and files
    await modAzureDeploymentTemplate.clean();
    const rFunctionPackageDir = './functions/packages';
    modAzureDeploymentTemplate.createSubDir(rFunctionPackageDir);
    const rFunctionSourceDir = './functions/source';
    if (buildOptions && buildOptions.includeSource) {
        modAzureDeploymentTemplate.createSubDir(rFunctionSourceDir);
    }
    // module: azure func app
    const modAzureFuncApp = await makeDistAzureFuncApp({
        includeZip: false,
        includeSource: false,
        excludeList: excludeList
    });
    await modAzureFuncApp.zip();
    await modAzureFuncApp.copyZipTo(
        path.resolve(modAzureDeploymentTemplate.tempSrcDir, rFunctionPackageDir)
    );
    if (buildOptions && buildOptions.includeSource) {
        await modAzureFuncApp.copySrcTo(
            path.resolve(modAzureDeploymentTemplate.tempSrcDir, rFunctionSourceDir)
        );
    }

    // zip module
    await modAzureDeploymentTemplate.zip();
    await modAzureDeploymentTemplate.copyZipToDist();
    if (buildOptions && buildOptions.finalize) {
        // move all dist files to the dist folder.
        await cpm.finalize();
    }
    return modAzureDeploymentTemplate;
};

const program = new Command();
program.description('( ͡° ͜ʖ ͡°) FortiGate Autoscale make dist script.');

program
    .command('build-aws-lambda-fgt-as-handler')
    .description('build aws lambda function: fgt-as-handler.')
    .action(async () => {
        await makeDistAWSLambdaFgtAsgHandler({ includeZip: true, finalize: true });
    });

program
    .command('build-aws-lambda-faz-handler')
    .description('build aws lambda function: faz-handler.')
    .action(async () => {
        await makeDistAWSLambdaFazHandler({ includeZip: true, finalize: true });
    });

program
    .command('build-aws-lambda-nic-attachment')
    .description('build aws lambda function: nic-attachment.')
    .action(async () => {
        await makeDistAWSLambdaNicAttachment({ includeZip: true, finalize: true });
    });

program
    .command('build-aws-lambda-tgw-vpn-handler')
    .description('build aws lambda function: tgw-vpn-handler.')
    .action(async () => {
        await makeDistAWSLambdaTgwVpnHandler({ includeZip: true, finalize: true });
    });

program
    .command('build-aws-cloudformation')
    .description('build aws cloudformation deployment package.')
    .action(async () => {
        await makeDistAwsCloudFormation({ finalize: true });
    });

program
    .command('build-aws-quickstart-guide')
    .description('build aws quickstart guide deployment package.')
    .action(async () => {
        await makeDistAwsQuickStartGuide({ finalize: true });
    });

program
    .command('build-azure-template-deployment')
    .description('build Azure template deployment package.')
    .action(async () => {
        await makeDistAzureTemplateDeployment({ finalize: true });
    });

program
    .command('build-azure-funcapp')
    .description('build Azure Function.')
    .action(async () => {
        await makeDistAzureFuncApp({ includeZip: true, finalize: true });
    });

program
    .command('unzip-aws-artifacts')
    .description('unzip all aws build artifacts into distAWS directory.')
    .action(async () => {
        await unzipAWSArtifacts();
    });

program
    .command('build-all')
    .description('run all build commands, each at a time.')
    .action(async () => {
        await makeDistAWSLambdaFgtAsgHandler({ includeZip: true, finalize: true });
        await makeDistAWSLambdaFazHandler({ includeZip: true, finalize: true });
        await makeDistAWSLambdaNicAttachment({ includeZip: true, finalize: true });
        await makeDistAWSLambdaTgwVpnHandler({ includeZip: true, finalize: true });
        await makeDistAwsCloudFormation({ finalize: true });
        await makeDistAwsQuickStartGuide({ finalize: true });
        await makeDistAzureFuncApp({ includeZip: true, finalize: true });
        await makeDistAzureTemplateDeployment({ finalize: true });
    });

const main = async (): Promise<void> => {
    await program.parseAsync(process.argv);
    console.log('program ends.');
};

main();
