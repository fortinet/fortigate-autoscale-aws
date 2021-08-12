#!/usr/bin/env node

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import semver from 'semver';
// NOTE: aws-cfn-extension is copied from https://github.com/fortinet/fortigate-autoscale-cicd
import { parseYAML, stringifyYAML, Template } from './aws-cfn-extension';

const rootDir = path.resolve(path.basename(__filename), '../');
const packageInfo = JSON.parse(String(fs.readFileSync(path.resolve(rootDir, 'package.json'))));
const verStr = packageInfo.version;

// validate version arg
if (!semver.valid(verStr)) {
    throw new Error(`${verStr} isn't a valid semver. Expect a valid semver from the 1st argument.`);
}

let workingDir = './templates';

if (process.argv.length > 2 && process.argv[1] === '--dir' && process.argv[2]) {
    if (path.resolve(rootDir, process.argv[2]).startsWith(rootDir) === false) {
        throw new Error(
            `Working directory: ${process.argv[2]} does not reside in the project root.`
        );
    } else {
        workingDir = process.argv[2];
    }
}

const version = semver.parse(verStr);

console.log(`Package version:, ${chalk.green(version.version)}`);

function syncVersionInTemplates(templateDir: string, newVersion: semver.SemVer): void {
    // update AWS templates version
    const files = fs.readdirSync(templateDir);
    files
        .filter(file => {
            const stat = fs.statSync(path.resolve(templateDir, file));
            return stat.isFile();
        })
        .forEach(file => {
            const changeCount = 0;
            const filePath = path.resolve(templateDir, file);
            const buffer = fs.readFileSync(filePath);
            const parsedFile = parseYAML(String(buffer));
            if (typeof parsedFile !== 'object') {
                console.warn(`File is not a valid YAML format. skipped. File: ${filePath}`);
                return;
            }
            const templateYAML: Template = parsedFile as Template;
            // update template descriptions
            if (templateYAML.Description) {
                // replace with pattern
                const descriptionPattern = /^FortiGate Autoscale Solution \(version [0-9a-zA-Z.-]*\)/gim;
                const [ref] = templateYAML.Description.match(descriptionPattern) || [];
                if (ref) {
                    templateYAML.Description = templateYAML.Description.replace(
                        ref,
                        `FortiGate Autoscale Solution (version ${newVersion.version})`
                    );
                    console.log(
                        `Version updateded on template description, file: ${chalk.green(filePath)}.`
                    );
                }
            }
            // update version in the outputs
            if (templateYAML.Outputs) {
                Object.keys(templateYAML.Outputs).forEach(key => {
                    // locate the output: deploymentPackageVersion
                    if (key === 'DeploymentPackageVersion') {
                        templateYAML.Outputs[key].Value = version.version;
                    }
                });
            }
            fs.writeFileSync(filePath, JSON.stringify(templateYAML, null, 4));
            fs.writeFileSync(filePath, stringifyYAML(templateYAML, 4));
            console.log(`${changeCount} changes have been applied.`);
        });
}

function syncVersionOnReadMe(newVersion: semver.SemVer): void {
    const filePath = path.resolve(rootDir, './README.md');
    console.log(`updating ${filePath}`);
    const readmeContent = fs.readFileSync(filePath).toString();
    // const regexVersion = /fortigate-autoscale-aws%2F([0-9a-zA-Z.-]*)%2Faws-cloudformation/m;
    const versionPattern = 'fortigate-autoscale-aws%2F([0-9a-zA-Z.-]*)%2Faws-cloudformation';
    const [, currentVersion] = readmeContent.match(new RegExp(versionPattern, 'm')) || [];
    console.log(`current version found on README is ${chalk.yellow(currentVersion)}.`);
    console.log(`new version is set to: ${chalk.green(newVersion.version)}.`);
    const newContent = readmeContent.replace(
        new RegExp(versionPattern, 'gm'),
        `fortigate-autoscale-aws%2F${newVersion.version}%2Faws-cloudformation`
    );
    fs.writeFileSync(filePath, newContent);
    console.log(`${filePath} has been updated.`);
}

// sync version on azure templates
syncVersionInTemplates(path.resolve(rootDir, workingDir), version);

// sync version on README.md
syncVersionOnReadMe(version);
console.log('Sync version completed.');
