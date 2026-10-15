import { readdir, readFile, writeFile } from 'node:fs/promises';

const budgetBytes = 8_388_608;
const reportPath = 'artifacts/size-report.json';
const excludedNames = new Set(['.git', '.github', '.imd', 'node_modules', '.vite', '.cache', '.npm', '.pnpm-store', '.playwright-mcp', 'coverage', 'playwright-report', 'test-results']);
const files = [];
async function visit(path = '') {
  for (const entry of (await readdir(path || '.', { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    if (excludedNames.has(entry.name) || entry.name === '.env' || entry.name.startsWith('.env.')) continue;
    const name = path ? `${path}/${entry.name}` : entry.name;
    if (name === 'test/scratch' || name === reportPath) continue;
    if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink: ${name}`);
    if (entry.isDirectory()) await visit(name);
    else files.push({ path: name, bytes: (await readFile(name)).length });
  }
}
await visit();
let ownSize = 0;
let result;
let serialized;
for (let iteration = 0; iteration < 20; iteration++) {
  const allFiles = [...files, { path: reportPath, bytes: ownSize }].sort((a, b) => a.path.localeCompare(b.path, 'en'));
  const totalBytes = allFiles.reduce((total, file) => total + file.bytes, 0);
  result = {
    scope: 'All deliverable file contents, including this report. Excludes repository metadata, provided inputs, dependencies/caches, and disposable test/scratch.',
    totalBytes,
    exportBytes: files.filter((file) => file.path.startsWith('dist/')).reduce((total, file) => total + file.bytes, 0),
    budgetBytes,
    remainingBytes: budgetBytes - totalBytes,
    truncated: false,
    omitted: false,
    files: allFiles,
  };
  serialized = JSON.stringify(result, null, 2) + '\n';
  const nextSize = Buffer.byteLength(serialized);
  if (nextSize === ownSize) break;
  ownSize = nextSize;
}
if (Buffer.byteLength(serialized) !== ownSize) throw new Error('Size report did not converge.');
if (result.totalBytes >= budgetBytes) throw new Error(`Deliverable exceeds ${budgetBytes} bytes.`);
await writeFile(reportPath, serialized);
console.log(`All deliverable file contents: ${result.totalBytes} bytes. Static export: ${result.exportBytes} bytes. Budget: ${budgetBytes} bytes.`);
