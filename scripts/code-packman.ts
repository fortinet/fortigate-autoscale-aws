import archiver from 'archiver';
import chalk from 'chalk';
import * as commentJson from 'comment-json';
import decompress from 'decompress';
import fs from 'fs';
import path from 'path';
import * as ShellJs from 'shelljs';

export type JSONable = {
    [key in string | number]: string | number | boolean | JSONable | JSONable[];
};

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

export interface TsConfig extends JSONable {
    compilerOptions: {
        outDir: string;
        sourceMap: boolean;
    };
}

export interface PackmanCopyList extends JSONable {
    name: string;
    location: string;
    relativeDir?: 'source' | 'project' | 'bundle';
    renameAs?: string;
}

export interface PackmanReference extends JSONable {
    name: string;
    ref: string;
}

export interface PackmanConfigPackage extends JSONable {
    name: string;
    staticFile: {
        name: string;
        copyFrom: string;
        saveTo: string;
        includeSubDir?: boolean;
    }[];
    function?: PackmanReference[];
    functionGroup?: PackmanReference[];
    saveFunctionSource: boolean;
    functionSourceDir?: string;
    functionPackageDir: string;
}

export type PackmanConfigBundle = {
    filenamePrefix?: string;
    filenameSuffix?: string;
};

export type PackmanConigOutput = {
    outDir: string;
    packageDir: string;
};

export interface PackmanConfigFunction extends JSONable {
    name: string;
    source: {
        filename: string;
        location: string;
    };
    output: {
        filename: string;
        location: string;
    };
    copyList?: PackmanCopyList[];
    syncVersion?: boolean;
}

export interface PackmanConfigFunctionGroup extends JSONable {
    name: string;
    functions: PackmanReference[];
    copyList?: PackmanCopyList[];
    syncVersion?: boolean;
}

export interface ZipResource {
    name?: string;
    zipFile: string;
    resourceLocation: string;
}
export interface PackmanConfig extends JSONable {
    function?: PackmanConfigFunction[];
    functionGroup?: PackmanConfigFunctionGroup[];
    bundle: PackmanConfigBundle;
    package: PackmanConfigPackage[];
    output: PackmanConigOutput;
}

export enum ArchiverType {
    file,
    directory,
    globPattern
}

export interface ArchiverInput {
    name: string;
    type: ArchiverType;
}

export interface LibraryInput {
    name: string;
    path: string;
    relative?: boolean;
}

const defaultOptions: CodePackmanOptions = {
    printStdOut: true,
    printStdError: true,
    suppressError: false
};

export interface Stats extends fs.Stats {
    name: string;
}

export class CodePackmanModule {
    private cpm: CodePackman;
    private rPath: string;
    private rLibPath: string;
    private srcDir: string;
    private _tempSrcDir: string;
    private _zipFilePath: string;
    private _copied: boolean;
    private _installed: boolean;
    private cleanPaths: string[];
    private _cleaned: boolean;
    private _moduleName: string;
    packageJson: JSONable;
    _zipped: boolean;
    get copied(): boolean {
        return this._copied;
    }
    get installed(): boolean {
        return this._installed;
    }
    get cleaned(): boolean {
        return this._cleaned;
    }
    get zipFilePath(): string {
        return this._zipFilePath;
    }
    get tempSrcDir(): string {
        return this._tempSrcDir;
    }
    get moduleName(): string {
        return this._moduleName;
    }
    constructor(cpm: CodePackman, relativePath: string, name?: string, cleanPaths?: string[]) {
        this.cpm = cpm;
        this.rPath = relativePath;
        this._moduleName = name;
        this.srcDir = path.resolve(this.cpm.projectRoot, this.rPath);
        this.cleanPaths = cleanPaths;
    }

    async copy(): Promise<ExitCode> {
        if (!this.cpm.workSpace) {
            throw new Error('Cannot copy. Work space not created.');
        }
        if (!this._copied) {
            // get package json
            this.packageJson = await this.cpm.readPackageJson(this.srcDir, {
                suppressError: true
            });
            if (!this._moduleName) {
                this._moduleName = this.packageJson.name as string;
            }
            // set module temp dir name
            this._tempSrcDir = path.resolve(this.cpm.tempSrcDir, this._moduleName);
            let code: ExitCode = ExitCode.Ok;
            // check if the module is copied already
            if (!ShellJs.test('-e', this._tempSrcDir)) {
                // create module dir inside temp src dir
                await this.cpm.makeDir(this._tempSrcDir);
                // copy module to temp src dir
                code = await this.cpm.copyDir(this.srcDir, this._tempSrcDir);
            }

            this._copied = true;
            return code;
        } else {
            return ExitCode.Ok;
        }
    }

    async install(): Promise<ExitCode> {
        if (!this._installed) {
            this.cpm.enterDir(this._tempSrcDir);
            await this.cpm.npmPrune(true);
            const code = await this.cpm.npmInstallProd();
            this._installed = true;
            this.cpm.leaveDir();
            return code;
        } else {
            return ExitCode.Ok;
        }
    }

    async clean(): Promise<ExitCode> {
        if (!this._cleaned) {
            this.cpm.enterDir(this._tempSrcDir);
            const code = await this.cpm.remove(this.cleanPaths);
            this._cleaned = true;
            return code;
        } else {
            return ExitCode.Ok;
        }
    }

    async remove(pathList: string[]): Promise<ExitCode> {
        this.cpm.enterDir(this._tempSrcDir);
        const code = await this.cpm.remove(pathList);
        this._cleaned = true;
        return code;
    }

    async addMod(mod: CodePackmanModule): Promise<ExitCode> {
        if (!this.copied) {
            await this.copy();
        }
        if (!this.cleaned) {
            await this.clean();
        }
        if (!mod.copied) {
            await mod.copy();
        }
        if (!mod.cleaned) {
            await mod.clean();
        }
        if (!mod.installed) {
            await mod.install();
        }

        let rModPath = '';
        if (!this.rLibPath) {
            const rLibPath = './lib';
            await this.cpm.makeDir(path.resolve(this._tempSrcDir, rLibPath));
            this.rLibPath = rLibPath;
        }
        rModPath = path.posix.join(this.rLibPath, mod.moduleName);
        // copy mod from its temp src dir into this lib dir
        await this.cpm.copyDir(mod._tempSrcDir, path.resolve(this._tempSrcDir, rModPath));

        this.cpm.enterDir(this._tempSrcDir);
        await this.cpm.npmInstall(rModPath);
        this.cpm.leaveDir();
        // clear the zip file if exists
        if (this._zipFilePath && ShellJs.test('-e', this._zipFilePath)) {
            await this.cpm.remove([this._zipFilePath]);
            this._zipped = false;
            this._zipFilePath = undefined;
        }
        return ExitCode.Ok;
    }

    async zip(): Promise<ExitCode> {
        if (!this._zipped) {
            this.cpm.enterDir(this.cpm.tempDir);
            const zipFIlePath = path.resolve(this.cpm.tempDir, `${this._moduleName}.zip`);
            const code = await this.cpm.zip(
                [
                    {
                        name: this._tempSrcDir,
                        type: ArchiverType.directory
                    }
                ],
                zipFIlePath
            );
            this.cpm.leaveDir();
            this._zipFilePath = zipFIlePath;
            return code;
        } else {
            return ExitCode.Ok;
        }
    }

    async createSubDir(relativeDirPath: string): Promise<ExitCode> {
        return await this.cpm.makeDir(path.resolve(this.tempSrcDir, relativeDirPath));
    }

    copyZipToDist(): Promise<ExitCode> {
        return this.copyZipTo(this.cpm.tempDistDir);
    }

    // copy to temp dist dir
    async copySrcToDist(): Promise<ExitCode> {
        return await this.copySrcTo(this.cpm.tempDistDir);
    }

    async copyZipTo(dest: string): Promise<ExitCode> {
        if (!this.cpm.safeDirCheck(dest)) {
            return ExitCode.Error;
        }
        await this.zip();
        await this.cpm.cp([this.zipFilePath], dest);
        return ExitCode.Ok;
    }

    async copySrcTo(dest: string): Promise<ExitCode> {
        if (!this.cpm.safeDirCheck(dest)) {
            return ExitCode.Error;
        }
        return await this.cpm.cp([this.tempSrcDir], dest);
    }
}

export class CodePackman {
    private _tempDir: string;
    private _projectRoot: string;
    private _options: CodePackmanOptions;
    private _directories: string[] = [];
    private _childProcess = false;
    _buildArtifact: string;
    _distDir: string;
    _workSpace: boolean;

    static spawn(
        projectRoot: string,
        relativeDistPath: string,
        options?: CodePackmanOptions
    ): CodePackman {
        const c = new CodePackman(projectRoot, relativeDistPath, options || { ...defaultOptions });
        c._childProcess = true;
        return c;
    }

    constructor(
        projectRoot: string,
        relativeDistPath: string,
        options: CodePackmanOptions = defaultOptions
    ) {
        this._projectRoot = projectRoot;
        this._distDir = path.resolve(this._projectRoot, relativeDistPath);
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

    get cwd(): string {
        return this._directories[this._directories.length - 1];
    }

    get tempDir(): string {
        return this._tempDir;
    }

    get tempProjectRoot(): string {
        return path.resolve(this._tempDir, 'project');
    }

    get tempDistDir(): string {
        return path.resolve(this._tempDir, 'dist');
    }

    get tempSrcDir(): string {
        return path.resolve(this._tempDir, 'src');
    }

    get distDir(): string {
        return this._distDir;
    }

    get childProcess(): boolean {
        return this._childProcess;
    }

    get workSpace(): boolean {
        return this._workSpace;
    }

    private createShCmd(cmd: string, args: string[]): string {
        return `${cmd}${(args.length > 0 && ' ') || ''}${args.join(' ')}`;
    }

    exec(cmd: string, args?: string[], pwd?: string, options = defaultOptions): Promise<string> {
        return new Promise((resolve, reject) => {
            const c = (args && this.createShCmd(cmd, args)) || cmd;
            console.info(`${chalk.cyan('run command:')} ${c}\n`);
            this.pushd(pwd);
            ShellJs.pushd(this.cwd);
            const { code, stdout, stderr } = ShellJs.exec(c);
            ShellJs.popd();
            this.popd();
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
    }

    /**
     * call to ensure the directory to operate on is within the project or the temp dir created
     * during this process.
     *
     * @param {string} dir the directory or file path to operate on.
     * @returns {boolean} true if it's good to do the operations on the dir or file.
     */
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

    safeDirCheck(dir: string, options?: CodePackmanOptions): boolean {
        if (!this.isSafeDir(dir)) {
            const message = chalk.red(
                'Outside of allowed directories.\n' +
                    `[${dir}] isn't within project root nor tempdir [${this._tempDir}]`
            );
            if (options && options.printStdError) {
                console.error(chalk.cyan('std error: \n'), chalk.red(message));
            }
            if (!options || (options && options.suppressError)) {
                return false;
            } else {
                throw new Error(message);
            }
        } else {
            return true;
        }
    }

    private mkdir(dir: string, check?: boolean): string {
        if (check) {
            this.safeDirCheck(dir, {
                printStdError: true,
                suppressError: false
            });
        }
        const { code, stdout, stderr } = ShellJs.mkdir('-p', dir);
        if (code === 0) {
            return stdout.trim();
        } else {
            throw new Error(stderr);
        }
    }

    async makeDir(dir: string, options?: CodePackmanOptions): Promise<ExitCode> {
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

    makeTempDir(options?: CodePackmanOptions): string {
        if (!this._tempDir) {
            options = options || this._options;
            const tempDir = path.resolve(ShellJs.tempdir(), `codepackman${Date.now()}`);
            try {
                this.mkdir(tempDir, false);
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
        return this._tempDir;
    }

    removeDir(dir: string, options?: CodePackmanOptions): ExitCode {
        options = options || this._options;
        this.safeDirCheck(dir, options);
        const { code, stdout, stderr } = ShellJs.rm('-rf', dir);
        if (options.printStdOut && stdout !== '') {
            console.log(chalk.cyan('std output: \n'), stdout);
        }
        if (code === ExitCode.Ok) {
            return ExitCode.Ok;
        } else {
            if (options.printStdError && stderr !== '') {
                console.error(chalk.cyan('std error: \n'), chalk.red(stderr));
            }
            if (options.suppressError) {
                return ExitCode.Error;
            } else {
                throw new Error(stderr);
            }
        }
    }

    removeTempDir(options?: CodePackmanOptions): ExitCode {
        if (this._tempDir) {
            this.pushd(this._projectRoot, options);
            return this.removeDir(this._tempDir, options);
        }
        return ExitCode.Ok;
    }

    async remove(pathList: string[], options?: CodePackmanOptions): Promise<ExitCode> {
        const fList: string[] = [];
        const pList: string[] = [];
        let errorOccurred: boolean;
        let errorMessages = '';
        pathList.forEach(p => {
            if (this.safeDirCheck(p, options)) {
                const pa = path.resolve(this.cwd, p);
                try {
                    const stat = fs.statSync(pa);
                    if (stat.isFile()) {
                        fList.push(pa);
                    } else {
                        pList.push(pa);
                    }
                } catch (error) {
                    pList.push(pa);
                }
            }
            return true;
        });
        const taskList = pList.map(p => {
            return new Promise(resolve1 => {
                try {
                    ShellJs.rm('-rf', p);
                    resolve1(true);
                } catch (error) {
                    errorOccurred = true;
                    errorMessages = `${errorMessages}${error.message}\n`;
                    if (options.printStdError) {
                        console.error(
                            chalk.cyan('std error: \n'),
                            chalk.red(error.message || error)
                        );
                    }
                    return resolve1(true);
                }
            });
        });
        await Promise.all([
            new Promise(resolve1 => {
                try {
                    if (fList.length > 0) {
                        ShellJs.rm(fList);
                    }
                    resolve1(true);
                } catch (error) {
                    errorOccurred = true;
                    if (options.printStdError) {
                        console.error(
                            chalk.cyan('std error: \n'),
                            chalk.red(error.message || error)
                        );
                    }
                    return resolve1(true);
                }
            }),
            ...taskList
        ]);
        if (errorOccurred && !options.suppressError) {
            throw new Error(`Error occurred: ${errorMessages}`);
        } else {
            return (errorOccurred && ExitCode.Error) || ExitCode.Ok;
        }
    }

    async cp(
        pathList: string[],
        dest: string,
        deepCopy = true,
        options?: CodePackmanOptions
    ): Promise<ExitCode> {
        const fList: string[] = [];
        const pList: string[] = [];
        let errorOccurred: boolean;
        let errorMessages = '';

        pathList.forEach(p => {
            if (this.safeDirCheck(p, options)) {
                const pa = path.resolve(this.cwd, p);
                try {
                    const stat = fs.statSync(pa);
                    if (stat.isFile()) {
                        fList.push(pa);
                    } else if (stat.isDirectory()) {
                        // if deep copy, copy recursively
                        if (deepCopy) {
                            pList.push(pa);
                        } else {
                            ShellJs.ls('-l', [p]).forEach((s: unknown) => {
                                const stat1: Stats = s as Stats;
                                if (stat1.isFile()) {
                                    fList.push(path.resolve(pa, stat1.name));
                                }
                            });
                        }
                    }
                } catch (error) {
                    pList.push(pa);
                }
            }
            return true;
        });
        const taskList = pList.map(p => {
            return new Promise(resolve1 => {
                try {
                    ShellJs.cp('-R', p, dest);
                    resolve1(true);
                } catch (error) {
                    errorOccurred = true;
                    errorMessages = `${errorMessages}${error.message}\n`;
                    if (options.printStdError) {
                        console.error(
                            chalk.cyan('std error: \n'),
                            chalk.red(error.message || error)
                        );
                    }
                    return resolve1(true);
                }
            });
        });
        await Promise.all([
            new Promise(resolve1 => {
                try {
                    if (fList.length > 0) {
                        ShellJs.cp(fList, dest);
                    }
                    resolve1(true);
                } catch (error) {
                    errorOccurred = true;
                    if (options.printStdError) {
                        console.error(
                            chalk.cyan('std error: \n'),
                            chalk.red(error.message || error)
                        );
                    }
                    return resolve1(true);
                }
            }),
            ...taskList
        ]);
        if (errorOccurred && !options.suppressError) {
            throw new Error(`Error occurred: ${errorMessages}`);
        } else {
            return (errorOccurred && ExitCode.Error) || ExitCode.Ok;
        }
    }

    cpfile(filePath: string, dest: string, options?: CodePackmanOptions): Promise<ExitCode> {
        if (!this.safeDirCheck(filePath, options)) {
            return Promise.resolve(ExitCode.Error);
        }
        if (!this.safeDirCheck(dest, options)) {
            return Promise.resolve(ExitCode.Error);
        }
        const pa = path.resolve(this.cwd, filePath);
        const result = ShellJs.cp(pa, dest);
        if (result.code !== ExitCode.Ok) {
            if (options.printStdError) {
                console.error(chalk.cyan('std error: \n'), chalk.red(result.stderr));
            }
            if (options.suppressError) {
                return Promise.resolve(ExitCode.Ok);
            } else {
                throw new Error(result.stderr);
            }
        } else {
            return Promise.resolve(ExitCode.Ok);
        }
    }

    mv(filePath: string, dest: string, options?: CodePackmanOptions): Promise<ExitCode> {
        if (!this.safeDirCheck(filePath, options)) {
            return Promise.resolve(ExitCode.Error);
        }
        if (!this.safeDirCheck(dest, options)) {
            return Promise.resolve(ExitCode.Error);
        }
        const pa = path.resolve(this.cwd, filePath);
        const result = ShellJs.mv([pa], dest);
        if (result.code !== ExitCode.Ok) {
            if (options.printStdError) {
                console.error(chalk.cyan('std error: \n'), chalk.red(result.stderr));
            }
            if (options.suppressError) {
                return Promise.resolve(ExitCode.Ok);
            } else {
                throw new Error(result.stderr);
            }
        } else {
            return Promise.resolve(ExitCode.Ok);
        }
    }

    // alias: pushd
    enterDir(dir: string, options?: CodePackmanOptions): ExitCode {
        return this.pushd(dir, options);
    }
    pushd(dir: string, options?: CodePackmanOptions): ExitCode {
        options = options || this._options;
        const opt = { ...options };
        opt.suppressError = false;
        this.safeDirCheck(dir, opt);
        this._directories.push(dir);
        if (options.printStdOut) {
            console.info(`${chalk.cyan('change working dir:')} ${dir}\n`);
        }
        return ExitCode.Ok;
    }

    // alias: popd
    leaveDir(options?: CodePackmanOptions): ExitCode {
        return this.popd(options);
    }
    popd(options?: CodePackmanOptions): ExitCode {
        options = options || this._options;
        const opt = { ...options };
        opt.suppressError = false;
        const cwd = this.cwd;
        // make sure the cwd is at last either the temp dir or project root
        if (!this._directories.pop()) {
            if (cwd.startsWith(this._tempDir)) {
                this._directories.push(this._tempDir);
            } else {
                this._directories.push(this._projectRoot);
            }
        }
        if (options.printStdOut) {
            console.info(`${chalk.cyan('change working dir:')} ${this.cwd}\n`);
        }
        return ExitCode.Ok;
    }

    readJson(filePath: string, options?: CodePackmanOptions): Promise<JSONable> {
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

    readPackageJson(dir: string, options?: CodePackmanOptions): Promise<JSONable> {
        return this.readJson(path.resolve(dir, 'package.json'), options);
    }

    writePackageJson(
        dir: string,
        content: JSONable,
        options?: CodePackmanOptions
    ): Promise<ExitCode> {
        try {
            options = options || this._options;
            if (this.safeDirCheck(dir, options)) {
                fs.writeFileSync(
                    path.resolve(dir, 'package.json'),
                    JSON.stringify(content, null, 4)
                );
            }
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

    readTsConfig(dir: string, options?: CodePackmanOptions): Promise<JSONable> {
        return this.readJson(path.resolve(dir, 'tsconfig.json'), options);
    }

    copyDir(src: string, dest: string, options?: CodePackmanOptions): Promise<ExitCode> {
        try {
            options = options || this._options;
            if (this.safeDirCheck(src, options) && this.safeDirCheck(dest, options)) {
                ShellJs.mkdir('-p', dest);
                ShellJs.cp('-Rf', `${path.resolve(src, '*')}`, path.resolve(dest));
            }
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

    zip(
        inputs: ArchiverInput[],
        zipFilePath: string,
        options?: CodePackmanOptions
    ): Promise<ExitCode> {
        options = options || this._options;
        const opt = { ...options };
        opt.suppressError = true;
        const unsafeDirs: ArchiverInput[] = inputs.filter(
            input => input.type === ArchiverType.directory && !this.safeDirCheck(input.name, opt)
        );
        if (unsafeDirs.length > 0 && options && !options.suppressError) {
            throw new Error(
                "Cannot make archive. One or more directories aren't allowed to operate on."
            );
        }

        if (!this.safeDirCheck(zipFilePath, opt) && options && !options.suppressError) {
            throw new Error(
                'Cannot make archive. The output file must be in a directory permitted to operate on.'
            );
        }

        return new Promise((resolve, reject) => {
            const archive = archiver('zip', { zlib: { level: 9 } });
            const output = fs.createWriteStream(path.resolve(this.cwd, zipFilePath));
            let errorOccurred: boolean;
            output.on('close', () => {
                if (options && options.printStdOut) {
                    console.log(`${archive.pointer()} total bytes`);
                    console.log('archive has been finalized.');
                }
                resolve((errorOccurred && ExitCode.Error) || ExitCode.Ok);
            });
            output.on('end', () => {
                if (options && options.printStdOut) {
                    console.log('Data has been drained');
                }
            });
            archive.on('warning', err => {
                if (err.code === 'ENOENT') {
                    // log warning
                    if (options && options.printStdError) {
                        chalk.red(err.message);
                        chalk.red(err.stack);
                    }
                } else {
                    errorOccurred = true;
                    // throw error
                    if (options && options.printStdError) {
                        chalk.red(err.message);
                        chalk.red(err.stack);
                    }
                    if (options && !options.suppressError) {
                        reject(err);
                    }
                }
            });
            archive.on('error', err => {
                errorOccurred = true;
                if (options && options.printStdError) {
                    chalk.red(err.message);
                    chalk.red(err.stack);
                }
                if (options && !options.suppressError) {
                    reject(err);
                }
            });
            // pipe archive data to the file
            archive.pipe(output);
            inputs.forEach(input => {
                if (input.type === ArchiverType.file) {
                    archive.append(fs.createReadStream(path.resolve(this.cwd, input.name)));
                } else if (input.type === ArchiverType.directory) {
                    archive.directory(input.name, false);
                } else {
                    archive.glob(input.name);
                }
            });
            archive.finalize();
        });
    }

    async unzip(src: string, dest: string, options?: CodePackmanOptions): Promise<void> {
        if (!(this.safeDirCheck(src, options) && this.safeDirCheck(dest, options))) {
            const errorMessage =
                'Cannot unarchive. The source file or destination must be ' +
                'in a directory permitted to operate on.';
            if (options && !options.suppressError) {
                throw new Error(errorMessage);
            } else {
                console.error(errorMessage);
                return;
            }
        }
        await decompress(src, dest);
    }

    async runNpmCommand(
        command: string,
        args?: string[],
        options?: CodePackmanOptions
    ): Promise<string> {
        return await this.exec(`npm ${command}`, args || [], this.cwd, options || this._options);
    }

    async npmInstall(
        packageName?: string,
        opts?: NpmInstallOptions | null,
        options?: CodePackmanOptions
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

    async npmInstallProd(options?: CodePackmanOptions): Promise<ExitCode> {
        await this.runNpmCommand('install', ['--production'], options);
        return ExitCode.Ok;
    }

    async npmPrune(production = true, options?: CodePackmanOptions): Promise<ExitCode> {
        const args = (production && ['--production']) || [];
        await this.runNpmCommand('prune', args, options || this._options);
        return ExitCode.Ok;
    }

    async npmPack(options?: CodePackmanOptions): Promise<string> {
        return await this.runNpmCommand('pack', [], options || this._options);
    }

    async installLibrary(libraries: LibraryInput[]): Promise<ExitCode> {
        await this.pushd(this._tempDir); // depth 0
        for (const lib of libraries) {
            const dest = path.resolve(this.tempProjectRoot, 'lib', lib.name);
            const libPath = path.resolve(lib.relative ? this.projectRoot : this.cwd, lib.path);
            await this.makeDir(dest);
            await this.copyDir(libPath, dest);
            await this.pushd(this.tempProjectRoot); // depth 1
            // install
            await this.npmInstall(path.relative(this.cwd, dest));
            await this.popd(); // depth 0
        }
        return ExitCode.Ok;
    }

    async zipProject(): Promise<ExitCode> {
        await this.pushd(this._tempDir);
        const packageJson = await this.readPackageJson(this.tempProjectRoot);
        return await this.zip(
            [
                {
                    name: this.tempProjectRoot,
                    type: ArchiverType.directory
                }
            ],
            `${packageJson.name as string}.zip`
        );
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
        await this.copyDir(this.projectRoot, tempDir);
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
        await this.exec(`${tsc}${withDefFile ? ' -d' : ''}`);
        // run npm pack
        const buildArtifact = await this.npmPack();
        this._buildArtifact = path.resolve(this.cwd, buildArtifact);
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
    async createpWorkSpace(): Promise<ExitCode> {
        if (!this._workSpace) {
            await this.makeTempDir();
            // create temp src dir
            await this.makeDir(this.tempSrcDir);
            // create temp dist dir
            await this.makeDir(this.tempDistDir);
            // create real dist dir
            await this.makeDir(this.distDir);
            this._workSpace = true;
        }
        return ExitCode.Ok;
    }

    createModule(relativePath: string, name?: string, cleanPaths?: string[]): CodePackmanModule {
        return new CodePackmanModule(this, relativePath, name, cleanPaths);
    }

    async finalize(): Promise<ExitCode> {
        return await this.copyDir(this.tempDistDir, this.distDir);
    }

    async readPackmanConfig(): Promise<PackmanConfig> {
        return (await this.readJson(
            path.resolve(this._projectRoot, 'packman.config.json')
        )) as PackmanConfig;
    }

    async buildWithPackmanConfig(): Promise<boolean> {
        try {
            const config = await this.readPackmanConfig();
            const results = await Promise.all(
                config.package.map(pkg => {
                    return this.pack(pkg, config).catch(error => {
                        console.error(`Error in packing [${chalk.cyan(pkg.name)}]`, error);
                        return false;
                    });
                })
            );
            console.log(`${chalk.cyan('( ͡° ͜ʖ ͡°) ')}completed!`);
            return results.filter(r => !!r).length === 0;
        } catch (error) {
            console.error('Failed to build with packman config. See error:', error);
            return false;
        }
    }

    private async pack(pkg: PackmanConfigPackage, config: PackmanConfig): Promise<boolean> {
        const tempDir = this.makeTempDir();
        const pkgDir = path.resolve(tempDir, pkg.name);
        const functionPackageDir = path.resolve(pkgDir, pkg.functionPackageDir);
        const functionSourceDir =
            (pkg.saveFunctionSource && path.resolve(pkgDir, pkg.functionSourceDir)) || null;
        const functionOutDir = path.resolve(this.projectRoot, config.output.packageDir);
        await this.makeDir(pkgDir);
        await this.makeDir(functionPackageDir);
        await this.makeDir(functionOutDir);
        if (pkg.saveFunctionSource) {
            await this.makeDir(functionSourceDir);
        }

        let zipResources: ZipResource[] = [];
        // pack functions
        if (pkg.function) {
            zipResources = (
                await Promise.all(
                    pkg.function.map(funcRef => {
                        return this.packFunction(funcRef, config);
                    })
                )
            ).filter(r => !!r);

            for (const func of zipResources) {
                await this.cp([func.zipFile], functionPackageDir);
                if (pkg.saveFunctionSource) {
                    await this.cp([func.resourceLocation], functionSourceDir);
                }
            }
        }
        // pack function group
        if (pkg.functionGroup) {
            zipResources = (
                await Promise.all(
                    pkg.functionGroup.map(groupRef => {
                        return this.packFunctionGroup(groupRef, config);
                    })
                )
            ).filter(r => !!r);

            for (const group of zipResources) {
                await this.cp([group.zipFile], functionPackageDir);
                if (pkg.saveFunctionSource) {
                    await this.cp([group.resourceLocation], functionSourceDir);
                }
            }
        }
        // pack static files
        for (const staticFile of pkg.staticFile) {
            const fromPath = path.resolve(this.projectRoot, staticFile.copyFrom);
            const toPath = path.resolve(pkgDir, staticFile.saveTo);
            await this.makeDir(toPath);
            await this.cp([fromPath], toPath, staticFile.includeSubDir !== false);
        }
        // zip it
        const archiveInput: ArchiverInput = {
            name: pkgDir,
            type: ArchiverType.directory
        };
        const pkgFilename = `${pkg.name}.zip`;
        await this.pushd(tempDir);
        await this.zip([archiveInput], pkgFilename);
        await this.popd();
        // copy to dest
        await this.cp([path.resolve(tempDir, pkgFilename)], functionOutDir);
        console.log(
            `${chalk.cyan('package saved to:')}${path.resolve(functionOutDir, pkgFilename)}`
        );
        return true;
    }

    private async packFunction(ref: PackmanReference, config: PackmanConfig): Promise<ZipResource> {
        const [funcConfig] = config.function.filter(c => c.name === ref.ref);
        if (!funcConfig) {
            return null;
        }
        const bundleOutDir = path.resolve(this.projectRoot, config.output.outDir);
        const funcSrcDir = path.resolve(this.projectRoot, funcConfig.source.location);
        const funcOutDir = path.resolve(this.tempDir, funcConfig.output.location);
        const bundleFileName =
            `${config.bundle.filenamePrefix || ''}` +
            `${funcConfig.name}${config.bundle.filenameSuffix || ''}.js`;

        const copyList = (funcConfig.copyList && [...funcConfig.copyList]) || [];

        copyList.push({
            name: 'bundled-index',
            location: bundleFileName,
            relativeDir: 'bundle',
            renameAs: 'index.js'
        });

        // copy all required files into function output dir.
        await this.makeDir(funcOutDir);
        await this.pushd(funcOutDir);
        // copy each item in the copyList
        await Promise.all(
            copyList.map(c => {
                let relativeDir: string;
                switch (c.relativeDir) {
                    case 'project':
                        relativeDir = this.projectRoot;
                        break;
                    case 'bundle':
                        relativeDir = bundleOutDir;
                        break;
                    case 'source':
                    default:
                        relativeDir = funcSrcDir;
                        break;
                }
                const src = path.resolve(relativeDir, c.location);
                // need rename?
                if (c.renameAs) {
                    return this.cpfile(src, path.resolve(funcOutDir, c.renameAs));
                } else {
                    return this.cp([src], funcOutDir);
                }
            })
        );

        // update the package json if package.json file exists in the outDir
        const options = { ...this._options };
        options.suppressError = true;
        // ASSERT: if package.json not exists, it rturns {}, no error
        const funcPackage = await this.readPackageJson(funcOutDir, options);
        if (Object.keys(funcPackage).length > 0) {
            funcPackage.main = 'index.js';
            if (funcConfig.syncVersion) {
                const projectPackage = await this.readPackageJson(this.projectRoot);
                funcPackage.version = projectPackage.version;
            }
            await this.writePackageJson(funcOutDir, funcPackage);
        }

        // zip it
        const archiveInput: ArchiverInput = {
            name: funcOutDir,
            type: ArchiverType.directory
        };
        const zipFilename = `${ref.name}.zip`;
        await this.pushd(this.tempDir);
        await this.zip([archiveInput], zipFilename);
        await this.popd();

        return Promise.resolve({
            name: ref.name,
            zipFile: path.resolve(this.tempDir, zipFilename),
            resourceLocation: funcOutDir
        });
    }

    private async packFunctionGroup(
        ref: PackmanReference,
        config: PackmanConfig
    ): Promise<ZipResource> {
        const [funcGroupConfig] = config.functionGroup.filter(c => c.name === ref.ref);
        if (!funcGroupConfig) {
            return null;
        }

        const outDir = path.resolve(this.tempDir, ref.name);
        const copyList = (funcGroupConfig.copyList && [...funcGroupConfig.copyList]) || [];
        // pack each function in the group
        const functionZips: ZipResource[] = await Promise.all(
            funcGroupConfig.functions.map(funcRef => {
                return this.packFunction(funcRef, config);
            })
        );

        // take the zip resource location as copy source
        functionZips.forEach(funcZipRes => {
            copyList.push({
                name: funcZipRes.name,
                location: funcZipRes.resourceLocation
            });
        });

        // copy all required files into function output dir.
        await this.makeDir(outDir);
        await this.pushd(outDir);
        // copy each item in the copyList
        await Promise.all(
            copyList.map(c => {
                const src = path.resolve(this.projectRoot, c.location);
                // need rename?
                if (c.renameAs) {
                    return this.cpfile(src, path.resolve(outDir, c.renameAs));
                } else {
                    return this.cp([src], outDir);
                }
            })
        );

        // update the package json if package.json file exists in the outDir
        const options = { ...this._options };
        options.suppressError = true;
        // ASSERT: if package.json not exists, it rturns {}, no error
        const funcPackage = await this.readPackageJson(outDir, options);
        if (Object.keys(funcPackage).length > 0) {
            funcPackage.main = 'index.js';
            if (funcGroupConfig.syncVersion) {
                const projectPackage = await this.readPackageJson(this.projectRoot);
                funcPackage.version = projectPackage.version;
            }
            await this.writePackageJson(outDir, funcPackage);
        }

        // zip it
        const archiveInput: ArchiverInput = {
            name: outDir,
            type: ArchiverType.directory
        };
        const zipFilename = `${ref.name}.zip`;
        await this.pushd(this.tempDir);
        await this.zip([archiveInput], zipFilename);
        await this.popd();

        return Promise.resolve({
            name: ref.name,
            zipFile: path.resolve(this.tempDir, zipFilename),
            resourceLocation: outDir
        });
    }
}
