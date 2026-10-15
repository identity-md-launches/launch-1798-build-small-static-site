import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const definitions = [
  { id: 'hostname', label: 'Host name', command: 'hostname', args: [], file: 'hostname.stdout.txt' },
  { id: 'addresses', label: 'Host addresses', command: 'hostname', args: ['-I'], file: 'hostname-I.stdout.txt' },
  { id: 'identity', label: 'User identity', command: 'id', args: [], file: 'id.stdout.txt' },
  { id: 'listeners', label: 'Listening TCP sockets', command: 'ss', args: ['-ltn'], file: 'ss-ltn.stdout.txt' },
];

export const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

const startedAt = new Date().toISOString();
const captures = definitions.map((definition) => {
  const result = spawnSync(definition.command, definition.args, {
    encoding: null,
    timeout: 10_000,
    maxBuffer: 32 * 1024 * 1024,
    shell: false,
  });
  if (result.error || result.status !== 0 || result.signal || result.stderr.length) {
    throw new Error(`Capture failed for ${definition.command} ${definition.args.join(' ')}. No partial snapshot was written.`, {
      cause: result.error ?? new Error(result.stderr?.toString('utf8') || `Exit ${result.status}`),
    });
  }
  // Reject invalid UTF-8 instead of changing the captured bytes through replacement characters.
  const stdout = new TextDecoder('utf-8', { fatal: true }).decode(result.stdout);
  if (!Buffer.from(stdout, 'utf8').equals(result.stdout)) throw new Error('UTF-8 round-trip failed.');
  return {
    ...definition,
    invocation: [definition.command, ...definition.args].join(' '),
    capturedAt: new Date().toISOString(),
    exitCode: result.status,
    bytes: result.stdout.length,
    sha256: createHash('sha256').update(result.stdout).digest('hex'),
    stdout,
  };
});

const snapshot = {
  title: 'Worker Node Reference',
  startedAt,
  completedAt: new Date().toISOString(),
  kind: 'build-time snapshot',
  truncated: false,
  omitted: false,
  stdoutBytes: captures.reduce((total, capture) => total + capture.bytes, 0),
  commands: captures,
};
const report = Buffer.from(
  `${snapshot.title}\nCaptured: ${snapshot.startedAt}\nBuild-time snapshot. Outputs are unmodified.\n\n` +
  captures.map(({ invocation, stdout }) => `${invocation}:\n${stdout}\n`).join(''),
);
const copyIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/></svg>';
const sections = captures.map((capture, i) => `
      <section class="command-section" id="${capture.id}" aria-labelledby="${capture.id}-heading">
        <div class="command-heading">
          <div class="command-label"><span class="index" aria-hidden="true">0${i + 1}</span><div><h2 id="${capture.id}-heading">${capture.label}</h2><p class="command-name"><code>${escapeHtml(capture.invocation)}</code></p></div></div>
          <button type="button" class="button copy-button" data-copy="${capture.id}-output" aria-label="Copy ${escapeHtml(capture.invocation)} output" hidden>${copyIcon}<span>Copy</span></button>
        </div>
        <pre class="output" id="${capture.id}-output" tabindex="0" role="region" aria-label="${escapeHtml(capture.invocation)} output"><samp>${escapeHtml(capture.stdout)}</samp></pre>
        <div class="output-meta"><span>${capture.bytes.toLocaleString('en-US')} bytes · Exit ${capture.exitCode}</span><a href="./artifacts/${capture.file}" download aria-label="Download output for ${escapeHtml(capture.invocation)}">Download output<span aria-hidden="true"> ↗</span></a></div>
      </section>`).join('\n');

const template = await readFile('src/page.html', 'utf8');
const formattedTime = startedAt.replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
const replacements = {
  '{{COMMAND_SECTIONS}}': sections,
  '{{CAPTURE_TIME}}': startedAt,
  '{{CAPTURE_LABEL}}': formattedTime,
  '{{OUTPUT_BYTES}}': snapshot.stdoutBytes.toLocaleString('en-US'),
  '{{REPORT_BYTES}}': report.length.toLocaleString('en-US'),
};
let page = template;
for (const [key, value] of Object.entries(replacements)) page = page.replaceAll(key, value);
if (/\{\{[A-Z_]+\}\}/.test(page)) throw new Error('Unresolved page token.');

await mkdir('artifacts', { recursive: true });
for (const capture of captures) await writeFile(`artifacts/${capture.file}`, Buffer.from(capture.stdout));
await writeFile('artifacts/worker-node.json', JSON.stringify(snapshot, null, 2) + '\n');
await writeFile('artifacts/worker-node.txt', report);
await writeFile('index.html', page);
console.log(`Captured 4 commands: ${snapshot.stdoutBytes} stdout bytes, ${report.length} report bytes. Nothing truncated or omitted.`);
