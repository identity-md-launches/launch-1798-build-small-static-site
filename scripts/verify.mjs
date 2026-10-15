import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile('artifacts/worker-node.json', 'utf8'));
const html = await readFile('dist/index.html', 'utf8');
const expected = ['hostname', 'hostname -I', 'id', 'ss -ltn'];
assert.deepEqual(snapshot.commands.map((capture) => capture.invocation), expected);
assert.equal(snapshot.truncated, false);
assert.equal(snapshot.omitted, false);
let total = 0;
const escape = (value) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
for (const capture of snapshot.commands) {
  const raw = await readFile(`artifacts/${capture.file}`);
  assert.equal(capture.exitCode, 0);
  assert.equal(raw.length, capture.bytes);
  assert.equal(createHash('sha256').update(raw).digest('hex'), capture.sha256);
  assert.deepEqual(Buffer.from(capture.stdout), raw);
  assert.deepEqual(await readFile(`dist/artifacts/${capture.file}`), raw);
  assert.ok(html.includes(`<samp>${escape(capture.stdout)}</samp>`), `${capture.invocation} must be verbatim in the static HTML`);
  total += capture.bytes;
}
assert.equal(total, snapshot.stdoutBytes);
for (const name of ['worker-node.json', 'worker-node.txt']) {
  assert.deepEqual(await readFile(`artifacts/${name}`), await readFile(`dist/artifacts/${name}`));
}
const expectedReport = `${snapshot.title}\nCaptured: ${snapshot.startedAt}\nBuild-time snapshot. Outputs are unmodified.\n\n` +
  snapshot.commands.map(({ invocation, stdout }) => `${invocation}:\n${stdout}\n`).join('');
assert.deepEqual(await readFile('dist/artifacts/worker-node.txt'), Buffer.from(expectedReport));
assert.ok(html.includes('<title>Worker Node Reference</title>'));
for (const attribute of ['description', 'og:title', 'og:image']) assert.ok(html.includes(`"${attribute}"`));
for (const match of html.matchAll(/(?:href|src|content)="(\.\/[^"#]+)"/g)) {
  await readFile(`dist/${match[1].slice(2)}`);
}
assert.equal(/(?:href|src)="\/(?!\/)/.test(html), false, 'Asset URLs must be relative');
assert.equal(/https?:\/\//.test(html), false, 'The export must not depend on external services');
const manifest = JSON.parse(await readFile('artifacts/export-manifest.json', 'utf8'));
let exportBytes = 0;
for (const file of manifest.files) {
  const bytes = await readFile(`dist/${file.path}`);
  assert.equal(bytes.length, file.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
  exportBytes += bytes.length;
}
assert.equal(exportBytes, manifest.totalBytes);
assert.ok(exportBytes < 8 * 1024 * 1024);
console.log(`PASS: 4 captured outputs match raw bytes, hashes, JSON, HTML, and downloads. ${total} stdout bytes.`);
console.log(`PASS: metadata, relative assets, local-only resources, and export manifest. ${exportBytes} export bytes.`);
