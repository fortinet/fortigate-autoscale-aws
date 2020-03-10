import * as ShellJs from 'shelljs';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import * as commentJson from 'comment-json';
export enum ExitCode {
    Ok,
    Error
}
export type CodePackmanOptions = {
    printStdOut?: boolean;
    printStdError?: boolean;
    suppressError?: boolean;
};

export type NpmInstallOptions = {
    save?: boolean;
    dev?: boolean;
};

interface TsConfig {
    compilerOptions: {
        outDir: string;
        sourceMap: boolean;
    };
}

const defaultOptions: CodePackmanOptions = {
    printStdOut: true,
    printStdError: true,
    suppressError: false
};
export default class CodePackman {
    private _tempDir: string;
    private _projectRoot: string;
    private _options: CodePackmanOptions;
    _buildArtifact: string;

    /**
     * @returns {CodePackman} an instance of CodePackman
     */
    static spawn(): CodePackman {
        return new CodePackman();
    }

    constructor(projectRoot?: string | null, options: CodePackmanOptions = defaultOptions) {
        if (projectRoot) {
            this._projectRoot = projectRoot;
        }
        if (options) {
            this._options = options;
        }
    }

    get projectRoot(): string {
        return this._projectRoot;
    }

    set projectRoot(projectRoot: string) {
        this._projectRoot = projectRoot;
    }

    private createShCmd(cmd: string, args: string[]): string {
        return `${cmd}${(args.length > 0 && ' ') || ''}${args.join(' ')}`;
    }

    shExec(
        cmd: string,
        args?: string[],
        cwd = process.cwd(),
        options = defaultOptions
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            this.pushd(cwd, options).then(() => {
                const c = (args && this.createShCmd(cmd, args)) || cmd;
                console.info(`${chalk.cyan('run command:')} ${c}\n`);
                ShellJs.exec(c, async (code: number, stdout: string, stderr: string) => {
                    await this.popd(options);
                    if (options.printStdOut && stdout !== '') {
                        console.log(chalk.cyan('std output: \n'), stdout);
                    }
                    if (code === ExitCode.Ok) {
                        resolve(stdout.trim());
                    } else {
                        if (options.printStdError && stderr !== '') {
                            console.error(chalk.cyan('std error: \n'), chalk.red(stderr));
                        }
                        if (options.suppressError) {
                            resolve(stdout.trim());
                        } else {
                            reject(code);
                        }
                    }
                });
            });
        });
    }

    isSafeDir(dir: string): boolean {
        let resolvedPath: string;
        let inProjectRoot = false;
        let inTempDir = false;
        if (this._projectRoot) {
            resolvedPath = path.resolve(dir, this._projectRoot);
            inProjectRoot = resolvedPath.startsWith(this._projectRoot);
        }
        if (this._tempDir) {
            resolvedPath = path.resolve(dir, this._tempDir);
            inTempDir = resolvedPath.startsWith(this._tempDir);
        }
        return inProjectRoot || inTempDir;
    }

    private mkdir(dir: string, check?: boolean): Promise<string> {
        if (check && !this.isSafeDir(dir)) {
            const message = chalk.red(
                'Outside of allowed directories.\n' +
                    `[${dir}] isn't within project root nor tempdir [${this._tempDir}]`
            );
            throw new Error(message);
        }
        const { code, stdout, stderr } = ShellJs.mkdir('-p', dir);
        if (code === 0) {
            return Promise.resolve(stdout.trim());
        } else {
            throw new Error(stderr);
        }
    }

    async makeDir(dir: string, options?: CodePackmanOptions | null): Promise<ExitCode> {
        options = options || this._options;
        try {
            await this.mkdir(dir, true);
            console.info(`${chalk.cyan('make dir:')} ${dir}\n`);
            return ExitCode.Ok;
        } catch (error) {
            const err = error && error.message ? error : new Error(error);
            if (options.printStdError) {
                console.error(chalk.cyan('std error: \n'), chalk.red(err.message));
            }
            if (options.suppressError) {
                return ExitCode.Error;
            } else {
                throw err;
            }
        }
    }

    async makeTempDir(options?: CodePackmanOptions | null): Promise<string> {
        if (!this._tempDir) {
            options = options || this._options;
            const tempDir = path.resolve(ShellJs.tempdir(), `codepackman${Date.now()}`);
            try {
                await this.mkdir(tempDir, false);
                this._tempDir = tempDir;
                console.info(`${chalk.cyan('make temp dir:')} ${tempDir}\n`);
            } catch (error) {
                const err = error && error.message ? error : new Error(error);
                if (options.printStdError) {
                    console.error(chalk.cyan('std error: \n'), chalk.red(err.message));
                }
                if (options.suppressError) {
                    return '';
                } else {
                    throw err;
                }
            }
        }
        return Promise.resolve(this._tempDir);
    }

    removeDir(dir: string, options?: CodePackmanOptions | null): Promise<ExitCode> {
        options = options || this._options;
        if (!this.isSafeDir(dir)) {
            const message = chalk.red(
                'Outside of allowed directories.\n' +
                    `[${dir}] isn't within project root nor tempdir [${this._tempDir}]`
            );
            if (options.printStdError) {
                console.error(chalk.cyan('std error: \n'), chalk.red(message));
            }
            if (options.suppressError) {
                return Promise.resolve(ExitCode.Error);
            } else {
                throw new Error(message);
            }
        }
        const { code, stdout, stderr } = ShellJs.rm('-rf', dir);
        if (options.printStdOut && stdout !== '') {
            console.log(chalk.cyan('std output: \n'), stdout);
        }
        if (code === ExitCode.Ok) {
            return Promise.resolve(ExitCode.Ok);
        } else {
            if (options.printStdError && stderr !== '') {
                console.error(chalk.cyan('std error: \n'), chalk.red(stderr));
            }
            if (options.suppressError) {
                return Promise.resolve(ExitCode.Error);
            } else {
                throw new Error(stderr);
            }
        }
    }

    async removeTempDir(options?: CodePackmanOptions | null): Promise<ExitCode> {
        if (this._tempDir) {
            return await this.removeDir(this._tempDir, options);
        }
        return Promise.resolve(ExitCode.Ok);
    }

    pushd(dir: string, options?: CodePackmanOptions | null): Promise<ExitCode> {
        options = options || this._options;
        try {
            const silentState = ShellJs.config.silent;
            ShellJs.config.silent = true;
            ShellJs.pushd(dir);
            ShellJs.config.silent = silentState;
            if (options.printStdOut) {
                console.info(`${chalk.cyan('change working dir:')} ${dir}\n`);
            }
            return Promise.resolve(ExitCode.Ok);
        } catch (error) {
            if (options.printStdError) {
                console.error(chalk.cyan('std error: \n'), chalk.red(error.message || error));
            }
            if (options.suppressError) {
                return Promise.resolve(ExitCode.Ok);
            } else {
                throw (error.message && error) || new Error(error);
            }
        }
    }

    popd(options?: CodePackmanOptions | null): Promise<ExitCode> {
        options = options || this._options;
        try {
            const silentState = ShellJs.config.silent;
            ShellJs.config.silent = true;
            const dirList = ShellJs.popd();
            ShellJs.config.silent = silentState;
            if (options.printStdOut) {
                console.info(`${chalk.cyan('change working dir:')} ${dirList[0]}\n`);
            }
            return Promise.resolve(ExitCode.Ok);
        } catch (error) {
            if (options.printStdError) {
                console.error(chalk.cyan('std error: \n'), chalk.red(error.message || error));
            }
            if (options.suppressError) {
                return Promise.resolve(ExitCode.Ok);
            } else {
                throw (error.message && error) || new Error(error);
            }
        }
    }

    readJson(filePath: string, options?: CodePackmanOptions | null): Promise<{}> {
        try {
            options = options || this._options;
            if (options.printStdOut) {
                console.info(`read JSON file from: ${filePath}`);
            }
            const buffer = fs.readFileSync(path.resolve(filePath));
            return commentJson.parse(buffer.toString('utf-8'));
        } catch (error) {
            if (options.printStdError) {
                console.error(error);
            }
            if (options.suppressError) {
                return Promise.resolve({});
            } else {
                throw error;
            }
        }
    }

    readPackageJson(dir: string, options?: CodePackmanOptions | null): Promise<{}> {
        return this.readJson(path.resolve(dir, 'package.json'), options);
    }

    readTsConfig(dir: string, options?: CodePackmanOptions | null): Promise<{}> {
        return this.readJson(path.resolve(dir, 'tsconfig.json'), options);
    }

    copyProject(dest: string, options?: CodePackmanOptions | null): Promise<ExitCode> {
        try {
            options = options || this._options;
            ShellJs.cp('-Rf', `${path.resolve(this._projectRoot, '*')}`, path.resolve(dest));
            return Promise.resolve(ExitCode.Ok);
        } catch (error) {
            if (options.printStdError) {
                console.error(error);
            }
            if (options.suppressError) {
                return Promise.resolve(ExitCode.Ok);
            } else {
                throw error;
            }
        }
    }

    async runNpmCommand(
        command: string,
        args?: string[],
        options?: CodePackmanOptions | null
    ): Promise<string> {
        return await this.shExec(
            `npm ${command}`,
            args || [],
            process.cwd(),
            options || this._options
        );
    }

    async npmInstall(
        packageName?: string,
        opts?: NpmInstallOptions | null,
        options?: CodePackmanOptions | null
    ): Promise<ExitCode> {
        const args = [];
        if (packageName) {
            args.push(packageName);
        }
        if (opts && opts.save) {
            args.push(`--save${(opts.dev && '-dev') || ''}`);
        } else if (opts && opts.dev) {
            args.push('--dev');
        }
        await this.runNpmCommand('install', args, options || this._options);
        return ExitCode.Ok;
    }

    async npmPrune(production = true, options?: CodePackmanOptions | null): Promise<ExitCode> {
        const args = (production && ['--production']) || [];
        await this.runNpmCommand('prune', args, options || this._options);
        return ExitCode.Ok;
    }

    async npmPack(options?: CodePackmanOptions | null): Promise<string> {
        return await this.runNpmCommand('pack', [], options || this._options);
    }

    async buildTypeScriptProject(withDefFile = true): Promise<ExitCode> {
        // check if tsconfig.json exists or not
        const tsConfig: TsConfig = (await this.readTsConfig(this.projectRoot)) as TsConfig;
        if (!tsConfig.compilerOptions) {
            const message = chalk.red(
                'tsconfig.json not found. Is there a ' +
                    `typescript project in the directory?\n${this._projectRoot}`
            );
            throw new Error(message);
        }
        // copy the entire project into a temp dir
        const tempDir = await this.makeTempDir();
        const outDir = tsConfig.compilerOptions.outDir;
        await this.copyProject(tempDir);
        // change cwd to the tempdir
        await this.pushd(tempDir, this._options);
        // run npm install
        await this.npmInstall();
        // install typescript as dev dependency
        await this.npmInstall('typescript', { save: true, dev: true });
        // clear the dist folder
        await this.removeDir(path.resolve(tempDir, outDir));
        const tsc = path.resolve(tempDir, 'node_modules/typescript/bin/tsc');
        // transpile TS files there with type definitions
        await this.shExec(`${tsc}${withDefFile ? ' -d' : ''}`);
        // run npm pack
        const buildArtifact = await this.npmPack();
        this._buildArtifact = path.resolve(process.cwd(), buildArtifact);
        // done
        await this.popd(this._options);
        return ExitCode.Ok;
    }

    moveBuildArtifact(dest: string): Promise<ExitCode> {
        try {
            if (!this._buildArtifact) {
                throw new Error(chalk.red('No build artifact.'));
            }
            const stat = fs.statSync(this._buildArtifact);
            if (!stat.isFile()) {
                throw new Error('Build artifact file not found.');
            }
            const { code, stdout, stderr } = ShellJs.mv(
                this._buildArtifact,
                (dest.endsWith('/') && dest) || `${dest}/`
            );
            if (this._options.printStdOut) {
                console.info(
                    chalk.cyan(`move build artifact: [${this._buildArtifact}] to [${dest}]\n`)
                );
                if (stdout !== '') {
                    console.log(chalk.cyan('std output: \n'), stdout);
                }
            }
            if (code === ExitCode.Ok) {
                this._buildArtifact = undefined;
                return Promise.resolve(ExitCode.Ok);
            } else {
                if (this._options.printStdError && stderr !== '') {
                    console.error(chalk.cyan('std error: \n'), chalk.red(stderr));
                }
                if (this._options.suppressError) {
                    return Promise.resolve(ExitCode.Error);
                } else {
                    throw new Error(stderr);
                }
            }
        } catch (error) {
            if (this._options.suppressError) {
                if (this._options.printStdError) {
                    console.error(chalk.red(error.message));
                }
                return Promise.resolve(ExitCode.Error);
            } else {
                throw error;
            }
        }
    }
}
