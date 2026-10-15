# Worker Node Reference

A small static reference page with the verbatim output of `hostname`, `hostname -I`, `id`, and `ss -ltn`, captured on the machine that runs the production build. The page supports individual copy actions, exact-byte downloads, line wrapping, and in-page navigation. All four outputs and downloads work without JavaScript.

The finished website is in **`dist/`**, alongside its source and lockfile. Its 11 files total **70,171 bytes**, without compression. The captured command outputs total **917 bytes**; the labeled text download is **1,060 bytes**. No command output was truncated, filtered, redacted, normalized, or omitted. [The export manifest](artifacts/export-manifest.json) lists every runtime file's exact byte length and SHA-256. [The size report](artifacts/size-report.json) measures all delivered file contents, including documentation and review evidence, against the 8,388,608-byte budget.

## Publication

Publication is awaiting IdentityMD's submission plane. No public site URL or IPFS content identifier has been issued in this run. The actual publication attempt and verbatim response are recorded in [artifacts/publication.json](artifacts/publication.json).

`imd site publish dist --name worker-node-reference-0560c2f4` exited **2**: the CLI refuses to publish a job's work and says that the plane hosts the supplied `dist/` after the job completes. The local preview address is not a public website. No URL or CID has been invented.

## Install, preview, and rebuild

Use Node.js 22.12 or newer and npm. Rebuilding also requires Linux commands `hostname`, `id`, and `ss` on `PATH` (`ss` is typically supplied by iproute2).

```sh
npm ci
npm run preview
```

Open the local address printed by Vite. Preview serves the existing production snapshot without recapturing the machine.

```sh
npm run build
npm run typecheck
npm run verify
npm run size
```

The build executes the four commands directly, without a shell, then renders their output into `index.html`. Vite bundles the small TypeScript enhancement and stylesheet using `base: './'`. Finalization copies the raw outputs and downloads into `dist/artifacts/` and records exact runtime sizes and hashes. Rebuilding creates a new timestamped snapshot and may change addresses, identity, listening ports, hashes, and byte sizes. `npm run size` should be rerun after documentation or evidence changes.

`npm run dev` starts the source preview. Edit `src/page.html`, `src/style.css`, or `src/main.ts`; `index.html` is generated, so template changes require `npm run build` (or `node scripts/capture.mjs`) before previewing them.

The capture fails on a command error, timeout, buffer limit, nonempty stderr, or invalid UTF-8 instead of publishing a partial result. Raw files contain stdout only. The text report adds explicit labels and separators around each unchanged stdout value. JSON also carries timestamps, exit codes, byte counts, and hashes. The page is a historical snapshot, with no live monitoring, API calls, wallet integration, external fonts, or analytics.

## Source layout

| Path | Purpose |
| --- | --- |
| `src/page.html` | Page template, semantics, labels, and share metadata |
| `src/main.ts` | Clipboard actions, wrap toggle, and dismissible feedback |
| `src/style.css` | Tokens, component styles, focus, responsive layout |
| `src/share.svg` | Editable source for the locally bundled share image |
| `public/` | Favicon and 1200 × 630 PNG share image |
| `scripts/capture.mjs` | Run exactly the four requested commands and generate HTML/artifacts |
| `scripts/finalize.mjs` | Complete the static export and hash its files |
| `scripts/verify.mjs` | Byte fidelity, metadata, relative assets, and manifest checks |
| `scripts/check-browser.mjs` | Bounded interaction tests against the export at `/preview/` |
| `scripts/measure.mjs` | Self-inclusive deliverable size inventory |
| `dist/` | Complete static website for the submission publisher |
| `artifacts/` | Raw outputs, manifests, actual check results, and final screenshots |
| `DESIGN.md` | Implemented design system |

## Actual validation

The final production build, `tsc --noEmit`, and `npm run verify` passed on 2026-10-15. Every captured stdout matches the HTML DOM, raw files, JSON, SHA-256, clipboard, and download comparisons, including trailing spaces and final newlines.

Chromium checks passed at 320, 390, 768, 1024, and 1440 CSS pixels. The checks exercised all four copy buttons, six actual downloads, four anchor links, wrap/unwrapped states, keyboard activation, message dismissal, denied clipboard access, no-JavaScript operation, text enlargement, reduced motion, and forced colors. There were no script errors, failed local resources, or external requests. The page was also opened and inspected through the supplied browser tool. The pinned `taste@1` probe passed **16/16** checks; axe reported **24 passes, 0 violations, 0 incomplete rules**. See [the consolidated review](artifacts/validation.md) for corrections, coverage of all six Better Interface domains, and precise limitations.

WebKit was installed but could not launch because required system libraries are missing; its interactions remain unverified. Physical devices, actual screen readers, native browser zoom, and real social-network unfurls were not tested. Clipboard copy requires browser support and permission; a denied or unavailable clipboard focuses the exact-byte download with a clear message.

The worker installed build/check tools in `/tmp`, keeping dependency directories outside this repository. To reproduce the browser checks without adding repository dependencies:

```sh
npm install --prefix /tmp/worker-node-checks playwright@1.61.1 @axe-core/playwright@4.11.1
PLAYWRIGHT_BROWSERS_PATH=/tmp/worker-node-browsers /tmp/worker-node-checks/node_modules/.bin/playwright install chromium webkit
PLAYWRIGHT_BROWSERS_PATH=/tmp/worker-node-browsers node scripts/check-browser.mjs /tmp/worker-node-checks
```

While the pinned review input is available, its exact probe command is:

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/worker-node-browsers IMD_PLAYWRIGHT=/tmp/worker-node-checks/node_modules/playwright/index.mjs node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste --offline
```

The provided `.imd/reads/` inputs and disposable `test/scratch/` are not required for a production rebuild. Final evidence is preserved separately in `artifacts/`.

## Packaging and attribution

The explicit path budget for `.gitignore` is **512 bytes**. It excludes generated dependency/cache directories at any depth and disposable test output, while explicitly including `dist/` and `artifacts/`. No dependency archives, registry mirror, submodule, source maps, or dependency directories are shipped. The unused share-image SVG is retained as source; only its PNG is in the runtime export. Development caches, transient previews, and intermediate test screenshots are excluded from delivery; no requested source, runtime asset, or captured command output is omitted.

Design guidance was adapted from Jakub Krehel's Better Interface (MIT), pinned commit `267330e1adfc66a718fb65fa6918c1f06d0a689e`. Documentation guidance was adapted from Paul Bakaus's Impeccable (Apache-2.0), commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`. The supplied license texts are preserved in [artifacts/design-guidance-LICENSE.txt](artifacts/design-guidance-LICENSE.txt); the application does not bundle these guides at runtime.
