import path from 'path';
import { CodePackman } from 'autoscale-core';
(async (): Promise<void> => {
    const projectRoot = path.resolve(path.dirname(__filename), '../../');
    const outDir = path.resolve(projectRoot, 'out');
    const cpm = new CodePackman(projectRoot, './dist');
    await cpm.buildTypeScriptProject();
    await cpm.makeDir(outDir);
    await cpm.moveBuildArtifact(outDir);
})();
