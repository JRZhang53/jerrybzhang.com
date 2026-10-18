import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const app = resolve(root, 'apps/tree-of-life');
const output = resolve(root, 'dist/fun/tree-of-life');

if (!existsSync(resolve(app, 'package.json')) || !existsSync(resolve(app, 'node_modules'))) {
  throw new Error('Tree of Life is not initialized. Run npm run setup:projects, then build again.');
}
if (!process.env.npm_execpath) {
  throw new Error('Run this script through npm run build so it uses the configured npm runtime.');
}
// Use the same Node/npm pair on Windows and CI; no shell-specific copy commands.
const result = spawnSync(process.execPath, [process.env.npm_execpath, 'run', 'verify'], {
  cwd: app,
  stdio: 'inherit',
  env: process.env,
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
if (!existsSync(resolve(app, 'dist/index.html'))) {
  throw new Error('Tree of Life must produce dist/index.html.');
}
if (existsSync(output)) {
  throw new Error('The Tree of Life output path is already owned by a portfolio route or public asset.');
}
mkdirSync(dirname(output), { recursive: true });
cpSync(resolve(app, 'dist'), output, { recursive: true });
console.log('Assembled Tree of Life at /fun/tree-of-life/');
