import path from 'path';
import CodePackman from './code-packman';

const PROJECT_ROOT = path.resolve(path.dirname(__filename), '../');
const FUNCTION_DIR = path.resolve(PROJECT_ROOT, './functions');
/**
 * build fgt-as-handler function
 */
(async () => {
    const projectRoot = path.resolve(FUNCTION_DIR, 'fgt-as-handler');
    const outDir = path.resolve(projectRoot, 'out');
    const cpm = new CodePackman(projectRoot);
    await cpm.buildTypeScriptProject();
    await cpm.makeDir(outDir);
    await cpm.moveBuildArtifact(outDir);
})();
