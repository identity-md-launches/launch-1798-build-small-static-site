import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const snapshot = JSON.parse(await readFile('artifacts/worker-node.json', 'utf8'));
await mkdir('dist/artifacts', { recursive: true });
for (const file of ['worker-node.json', 'worker-node.txt', ...snapshot.commands.map((capture) => capture.file)]) {
  await copyFile(`artifacts/${file}`, `dist/artifacts/${file}`);
}

export async function inventory(root, prefix = '') {
  const entries = await readdir(`${root}/${prefix}`, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink: ${path}`);
    if (entry.isDirectory()) files.push(...await inventory(root, path));
    else {
      const data = await readFile(`${root}/${path}`);
      files.push({ path, bytes: (await stat(`${root}/${path}`)).size, sha256: createHash('sha256').update(data).digest('hex') });
    }
  }
  return files;
}
const files = await inventory('dist');
const totalBytes = files.reduce((total, file) => total + file.bytes, 0);
await writeFile('artifacts/export-manifest.json', JSON.stringify({ totalBytes, files }, null, 2) + '\n');
console.log(`Production export: ${files.length} files, exactly ${totalBytes} bytes.`);
