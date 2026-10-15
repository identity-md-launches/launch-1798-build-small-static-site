# Worker Node Reference design

## Overview

This is a compact technical reference for readers who need to inspect or save the build machine's command output. A warm paper background, plain sans-serif labels, and monospace output keep the captured text central. The one filled green action downloads the complete snapshot. The desktop layout has a narrow command index beside four consistently structured output sections; on small screens the outputs precede the secondary navigation.

The source of truth is `src/style.css`, `src/page.html`, the section renderer in `scripts/capture.mjs`, and the behaviors in `src/main.ts`. This is static HTML with a small TypeScript enhancement, not a client-rendered application shell.

## Colors

Primitives and semantic aliases are defined at `src/style.css:1`. The implemented palette uses hex values consistently and only supports a light theme; OS forced colors are supported separately.

| Semantic token | Primitive / exact value | Role |
| --- | --- | --- |
| `--color-page` | `--stone-50`, `#f6f5f1` | Page background |
| `--color-surface` | `--white`, `#ffffff` | Output sections and secondary buttons |
| `--color-subtle` | `--stone-100`, `#eeede7` | Hover, active, and disabled neutral surfaces |
| `--color-border` | `--stone-200`, `#d8d9d0` | Structural borders and separators |
| `--color-text` | `--stone-900`, `#232b25` | Main text, output, notification background |
| `--color-muted` | `--stone-600`, `#5d625b` | Metadata and supporting copy |
| `--color-action` | `--green-700`, `#305c3d` | Primary action, checked checkbox, text selection |
| `--color-action-hover` | `--green-800`, `#22472d` | Primary hover and press |
| `--color-on-action` | `--white`, `#ffffff` | Text on filled action and selection |
| `--color-focus` | `--green-700`, `#305c3d` | Keyboard focus on light surfaces |

The rendered probe measured a minimum default text contrast of **5.72:1** (muted text on the page). Muted text on white measured **6.24:1**, primary button text **7.71:1**, primary text on the page **13.33:1**, and output text on white **14.55:1**. These are measured default-state pairs, not a claim about every native/system state. The notification's close control uses an inset white focus outline on its dark surface. Forced-colors mode uses the system `Highlight` focus color and `ButtonText` button border.

## Typography

The prose stack is `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Code and output use `"SFMono-Regular", Consolas, "Liberation Mono", monospace`. There are no downloaded fonts; the actual face depends on the operating system. Only normal and semibold weights (400, 600) are requested. Font synthesis is disabled.

| Token | Size at a 16px root | Use |
| --- | --- | --- |
| `--text-small` | 14px / 0.875rem | Metadata, controls, commands, output |
| `--text-body` | 16px / 1rem | Description, brand |
| `--text-section` | 18px / 1.125rem | Section headings |
| `--text-title-mobile` | 32px / 2rem | Title at widths up to 65rem |
| `--text-title` | 44px / 2.75rem | Desktop title |

Body line height is 1.5, title 1.1, section heading 1.4, output 1.7, and supporting notes 1.6. The title uses -0.045em tracking and balanced wrapping; other text has natural spacing. The small-screen description has a 32ch maximum measure. Numeric metadata uses tabular figures. Output remains selectable, unellipsized, left-to-right, and preserves every character. `white-space: break-spaces` and `overflow-wrap: anywhere` allow exact text to reflow. Turning wrapping off uses `white-space: pre` and an explicitly scrollable output region.

## Layout

The spacing tokens `--space-1`, `2`, `3`, `4`, `6`, `8`, `12` are 4, 8, 12, 16, 24, 32, 48px at the default root size. Related labels use 4–12px gaps, controls typically 8–16px, output section padding 24px, and larger groups 32–48px.

`.shell` is at most 1168px wide with 40px side margins. Above 65rem the desktop grid is `208px minmax(0, 1fr)` with a 48px gap. At 65rem or below the index becomes 176px and the gap 32px. At 48rem or below the layout becomes a column, margins become 20px, output padding becomes 16px, the main action sits under the title, and the command index follows the outputs. Its navigation uses auto-fit columns with a 10rem minimum so enlarged text gets one column. At 22rem or below margins are 16px, the Copy icon is omitted but its text remains, and the index uses one column.

The first mobile screen contains the product name, plain description, primary download, capture metadata, wrap control, and complete first output. Screenshots and layout checks cover 320, 390, 768, 1024, and 1440px widths. A 200% root text size reflows without document overflow at 390px. Native browser zoom and physical-device safe-area behavior remain untested. No sticky sidebar or fixed action obscures the data; only dismissible copy feedback is fixed.

## Elevation & depth

The design is flat. White output sections have a 1px structural border on the warm page; they have no shadows. Thin rules separate each stdout block from its label and download metadata. The dark notification floats at z-index 2; the focused skip link uses z-index 3. Output blocks have no nested card treatment.

## Shapes

`--radius-control: 0.5rem` gives controls an 8px radius. `--radius-panel: 0.75rem` gives output sections a 12px radius. The capture marker is a 6px neutral circle paired with text, never a live-status signal. Icons are local SVGs: 20px and 1.5px strokes normally, 18px and 2px strokes within semibold buttons, with a 32px terminal mark in the brand. No image masks or clipped text are used.

## Components

| Pattern | Source | Behavior |
| --- | --- | --- |
| Page shell and intro | `src/page.html`, `.shell`, `.intro` | One h1, semantic header/main/footer, first-focusable skip link; compact mobile heading and download |
| Primary download | `.button.primary-button` | Native link with `download`, 48px minimum height; green hover/active states; no JavaScript dependency |
| Output section | `scripts/capture.mjs:58`, `.command-section` | Descriptive h2, exact command label, independently focusable named output region, byte count, exit code, exact raw download |
| Copy action | `src/main.ts:32`, `.copy-button` | 44px minimum height; native disabled/busy state during clipboard work; polite success or recovery message; hidden without JavaScript |
| Wrap control | `src/main.ts:25`, `.wrap-control` | Native labeled checkbox in a 44px-high label; toggles only presentation; does not alter DOM content |
| Command index | `.sidebar nav` | Native anchors, 48px rows, focus/hover feedback; secondary navigation follows the outputs in DOM order |
| Notification | `src/main.ts:8`, `.notification` | Stable polite live region; dismiss button stays reachable; dismissal restores focus to the last Copy control |

All ordinary keyboard focus indicators are 3px solid outlines with a 4px offset. Copy failure focuses the matching raw download and says how to recover; text selection is not used as an exact-byte fallback because browsers can drop final newlines. No form, wallet, loading data fetch, modal, theme switch, or empty-result state is present. A build capture failure stops the build rather than generating an invented empty state.

The only motion is a 120ms ease-out transition on button background and border colors. It is enabled only under `prefers-reduced-motion: no-preference`. There are no entrance animations, autoplay, infinite animations, or `transition: all`. Hover styling is limited to devices with hover capability.

## Do's and don'ts

- Reuse `.shell`, the type tokens, and the existing output pattern for another reference page. Keep the primary download near its title.
- Preserve command text and whitespace in `samp`; apply wrapping through CSS only. Keep the raw download available independently of JavaScript.
- Use semantic color aliases by role. Reserve the filled green treatment for the primary action.
- Keep control names specific to their command and preserve visible keyboard focus. Let errors explain a working recovery path.
- Do not replace the system fonts with runtime network requests, add decorative dashboards, or imply that a build snapshot is live.

The consolidated coverage, corrected findings, browser limitations, and evidence are in `artifacts/validation.md`. Guidance attribution and license texts are in the README and `artifacts/design-guidance-LICENSE.txt`.
