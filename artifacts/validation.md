# Worker Node Reference validation

## Scope and outcome

The static page, source, lockfile, captured outputs, and documentation are complete for submission. Publication remains after submission: the actual CLI attempt was refused because job websites are published by the IdentityMD plane. No site URL or content identifier was supplied. See `publication.json` for the exact response. This is worker-side evidence, not independent network certification.

The final export was captured at **2026-10-15T00:40:57.151Z** and contains **11 files / 70,171 bytes**. Its command stdout totals **917 bytes**, and its complete labeled text download is **1,060 bytes**. All four commands exited 0 with empty stderr. Nothing in their output was truncated, omitted, filtered, or normalized. The page escapes HTML syntax while preserving the original DOM text and raw downloads. The JSON records each exact stdout, per-command timestamp, byte count, exit code, and SHA-256.

The inferred visual direction is a restrained technical reference: warm background, clear section labels, monospace output, one green download action. No wallet, RPC data, live server feature, or unrelated machine/configuration data is needed by this product.

## Requirement coverage

| Requirement | Result and evidence |
| --- | --- |
| “small static site titled Worker Node Reference” | Met: page title, h1, header, static `dist/index.html` |
| “labeled lines, the verbatim output of hostname, hostname -I, id and ss -ltn” | Met: four labeled output sections; raw byte/DOM/download/clipboard comparisons |
| “each run where the site is built” | Met: `scripts/capture.mjs:18` executes the commands on every production build, before rendering |
| “publish it and report the site URL and content identifier” | After submission; CLI explicitly refused job publication. Both values unavailable, not invented |
| “exact byte size” | Met for export and full file payload: `export-manifest.json`, `size-report.json` |
| “whether anything ... truncated or omitted” | Command output and required deliverables are complete. Only disposable development dependencies, caches, and intermediate test output are excluded |
| “working primary interactions and responsive layouts” | Met in Chromium: copy, six downloads, four anchor links, wrapping, keyboard, error recovery; 5 widths |
| “dist/index.html and its assets ... alongside source and lockfile” | Ready for submission: all files present; `.gitignore` explicitly includes `dist/` and `artifacts/`. No Git metadata was modified |
| “production build, typecheck and useful interaction validation” | Passed; commands and outcomes below |
| “Better Interface ... six domains ... fixes ... coverage” | Reviewed below with corrected source findings and evidence |
| “first screen at 390 ... product and its main action” | Met at 390 × 844; screenshot and bounding-box assertions |
| “title, favicon, description, og:title and og:image” | All present; locally bundled SVG favicon and 1200 × 630 PNG share card |
| “DESIGN.md ... implemented tokens, typography, components and responsive behavior” | Met: root `DESIGN.md` reflects final source values |
| “README ... install, preview and rebuild” | Met: root README gives commands, capture semantics, actual results and limitations |

No faked feature or unresolved observed functional defect is known. Publication is unfulfilled in this run, and WebKit coverage is unavailable.

## Six-domain Better Interface review

| Domain | Coverage | Findings, evidence, and limitations |
| --- | --- | --- |
| Accessibility | Checked | Native links/buttons/checkbox; skip link; heading/landmark structure; named output regions; keyboard order and activation; visible focus in screenshots; polite feedback and focus return; error recovery; 200% text reflow; reduced motion and forced colors. Axe: 24 rules passed, 0 violations, 0 incomplete. Real screen-reader sessions and native browser zoom not performed |
| Layout | Checked | Source grouping, normal flow, shared edges, logical properties; actual export at 320/390/768/1024/1440; first screen at 390; long output wrapping and internal unwrapped scroll; RTL mirror and 200% text. Fixed reflow defects and mobile keyboard order. No physical device or translated locale test |
| Writing | Checked | Each button names its action, downloads have command-specific accessible names, timestamp and static-snapshot terminology are truthful, clipboard failure names a working recovery action. Tool/reference page, no marketing hero needed. 7 prose words on first mobile screen |
| Typography | Checked | 5 token sizes total, 4 rendered sizes at each probe width, weights 400/600, 2 font stacks, monospace reserved for commands/output, natural casing/tracking, selectable full values. Wrapping inspected at native and enlarged text. System font face varies by OS |
| Colors | Checked | Semantic tokens and actual rendered solid pairs; default minimum contrast 5.72:1; primary action text 7.71:1. Forced-colors screenshot inspected. Light theme only, so dark-theme review not applicable. Native system state colors and every possible OS combination not measured |
| UI | Checked | Borders without shadows; restrained icon set; initial/hover/active/focus/disabled code and relevant rendered states; copy success/failure/dismissal, wrap states, no-JS state. No animation except 120ms color/border transition, disabled under reduced motion. No modal, form, asynchronous data loading, or empty-result workflow applies |

The pinned Better Interface workflow, core principles from all six domains, documentation method, design-critic reference/probe, and wallet reference were read. Wallet features were not applicable and were not added. Guide content was used as reference within the user's task; it did not override the assignment.

## Findings corrected

1. **Medium, accessibility/layout: mobile keyboard flow visited the bottom index before outputs.** Source: `src/page.html:40`, `.workspace`/`.reference`/`.sidebar` in `src/style.css:67`. Initially the sidebar appeared before the output in DOM order but after it visually on mobile. Moved the output before the sidebar in the template and used named grid areas on desktop. At 390px, Tab now reaches the primary download, wrap checkbox, and first Copy button before secondary navigation. Final keyboard screenshot and assertion pass.

2. **Medium, layout/typography: preserved whitespace and the two-column index overflowed with enlarged text.** Source: `src/style.css:87` and `src/style.css:129`. At 390px with a 200% root text size, trailing spaces hung outside `pre-wrap` and the index's label plus number exceeded its column. Changed to `white-space: break-spaces` and an auto-fit index with a 10rem minimum. Rerun shows document width exactly 390px, unchanged output text, and no overlap in the inspected socket section. Both normal and enlarged screenshots were inspected.

3. **Medium, accessibility: raw output labels needed a supported named role.** Source: `scripts/capture.mjs:64`. Axe flagged `aria-label` on a generic `pre` for manual review. Added `role="region"` to each focusable output with its specific command label. The final axe report has zero incomplete rules and zero violations.

4. **Medium, data fidelity/error recovery: manual text selection dropped a final newline.** Source: `src/main.ts:45`. A forced clipboard rejection initially selected the output for manual copy; Chromium's selected text omitted the final LF from `hostname -I`. Replaced that fallback with focus on the exact raw download and the message “Clipboard unavailable. Use Download output to save the exact text.” Forced-denial validation now confirms the focused link and a byte-identical download. Real successful clipboard operations also match all four stdout values.

5. **Low, accessibility/writing: repeated download names and persistent feedback.** Source: `scripts/capture.mjs:65`, `src/main.ts:18`, `src/page.html:48`. Added command-specific accessible download names, a 44px dismiss button for feedback, and return focus to the initiating Copy button. Confirmed all six downloads, success/failure feedback, and dismissal in the browser.

The initial TypeScript check also found a collision between a local `status` binding and the DOM global; renaming it to `liveRegion` fixed the error. Final typecheck passed. No finding above remains open.

## Actual commands and results

Build dependencies were installed outside the repository from the committed lockfile. The worker used `PATH=/tmp/worker-node-tools/node_modules/.bin:$PATH` for npm scripts so no repository `node_modules/` was created.

| Command / check | Actual result |
| --- | --- |
| `npm install --package-lock-only --ignore-scripts --no-audit --no-fund --cache /tmp/worker-node-npm-cache` | Exit 0; generated committed lockfile |
| `npm ci --prefix /tmp/worker-node-tools --ignore-scripts --no-audit --no-fund --cache /tmp/worker-node-npm-cache` | Exit 0 after copying manifest and lockfile there |
| `npm run build` | Exit 0; Vite 7.3.1; all 4 captures succeeded; 11 export files, 70,171 bytes |
| `npm run typecheck` | Exit 0; TypeScript 5.9.3, `tsc --noEmit` |
| `npm run verify` | Exit 0; exact stdout/raw/HTML/JSON/text-download/hash consistency, all relative assets present, all manifest sizes/hashes correct |
| `PLAYWRIGHT_BROWSERS_PATH=/tmp/worker-node-browsers node scripts/check-browser.mjs /tmp/worker-node-checks` | Exit 0 with 13 Chromium checks passed; explicit WebKit launch limitation |
| `PLAYWRIGHT_BROWSERS_PATH=/tmp/worker-node-browsers IMD_PLAYWRIGHT=/tmp/worker-node-checks/node_modules/playwright/index.mjs node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste --offline` | Exit 0; **16/16 checks passed** |
| Supplied browser tool | Navigated production export; 390 and 1440 screenshots inspected; actual Copy activated; focus/high-contrast/enlarged states inspected; 0 console errors/warnings; all recorded resources 200 |
| `imd site publish dist --name worker-node-reference-0560c2f4` | Exit 2; refused job publication, directs submission to plane |

The interaction script serves `dist/` under `/preview/` in a bounded foreground run and closes its browser/server in `finally`. It blocks external requests during Chromium validation. Actual file downloads are read back and compared byte for byte. Clipboard success uses the real browser clipboard; the error case deliberately injects a rejected Clipboard API to verify the recovery path. JavaScript-disabled mode still exposes all four actual outputs and a working snapshot download.

The final taste probe reports: no horizontal page scroll at 320/390/1440, text overlap, clipping, floating controls over text, or missing local files; no low measured contrast, kicker labels, improper casing/tracking, repeated lines, excessive type sizes, nested cards, or motion violations. All 16 targets meet the 24px/spacing rule. The 18px native checkbox is the single target below 44px, inside a clickable label that is 44px high.

## Evidence retained

- `design-probe.json`: complete final taste report and rendered measurements.
- `interaction-results.json`: complete final interaction outcomes and exact WebKit launch error.
- `accessibility.json`: final axe results (24 passed rule IDs, zero violations, zero incomplete).
- `screenshots/mobile-390.png`, `screenshots/desktop-1440.png`: final first-screen views.
- `screenshots/keyboard-focus.png`, `screenshots/forced-colors-focus.png`: inspected focus states.
- `screenshots/clipboard-fallback.png`: tested failure-recovery state.
- `export-manifest.json`: every runtime file, size, and SHA-256.
- `size-report.json`: self-inclusive delivered file-content inventory, excluding provided inputs and disposable caches/tests.

## Remaining limitations

WebKit could not launch after its browser download: this host lacks shared libraries including GTK 4, Pango/Cairo, GStreamer, and other WebKit dependencies. Its primary action and rendering are **not verified**. No actual Safari or physical mobile browser, screen reader, native browser zoom, localization suite, or social-platform unfurl was tested. No unsupported checks are claimed as passes.

Publication is **incomplete until the IdentityMD plane accepts and publishes the submitted export**. The CLI returned neither a URL nor a CID, so those requested values cannot truthfully be reported yet. This is a tool restriction, not missing requester information; no input question or fabricated identifier was substituted.
