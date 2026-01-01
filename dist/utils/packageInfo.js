import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
let cachedInfo = null;
function resolvePackageJsonPath() {
    const currentFilename = fileURLToPath(import.meta.url);
    const currentDirname = path.dirname(currentFilename);
    return path.join(currentDirname, '..', '..', 'package.json');
}
function normalizePackageInfo(raw) {
    return {
        name: raw.name ?? 'background-process-mcp',
        version: raw.version ?? '0.0.0',
    };
}
export async function getPackageInfo() {
    if (typeof BGPM_PACKAGE_INFO !== 'undefined') {
        return BGPM_PACKAGE_INFO;
    }
    if (cachedInfo) {
        return cachedInfo;
    }
    try {
        const packageJsonPath = resolvePackageJsonPath();
        const packageJsonContent = await fsPromises.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);
        cachedInfo = normalizePackageInfo(packageJson);
    }
    catch {
        cachedInfo = normalizePackageInfo({});
    }
    return cachedInfo;
}
