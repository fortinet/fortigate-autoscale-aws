import path from 'path';
import CodePackman from './code-packman';
(async () => {
    const projectRoot = path.resolve(path.dirname(__filename), '../../');
    const outDir = path.resolve(projectRoot, 'out');
    const cpm = new CodePackman(projectRoot);
    await cpm.buildTypeScriptProject();
    await cpm.makeDir(outDir);
    await cpm.moveBuildArtifact(outDir);
})();
