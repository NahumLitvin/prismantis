# prismantis for Codex

Codex has no way for a plugin to redraw replies, so prismantis in Codex does two things: it gives Codex the same session note as Claude Code, so replies come back with tables, diagrams and figures, and it ships the 19 prismantis themes as Codex syntax themes.

| Codex alone | With prismantis |
|---|---|
| ![Codex in its default colors](../docs/compare/codex-before.png) | ![Codex in prismantis-dracula](../docs/compare/codex-after.png) |

## Install

```bash
codex plugin marketplace add NahumLitvin/prismantis && codex plugin add prismantis@prismantis
```

Trust its hook once in `/hooks`, run `$prismantis-themes` to install the themes, and pick one with `/theme`. `$prismantis` prints the demo.

## What works

Full parity with Claude Code waits on one Codex issue. Theme colors for prose ([openai/codex#53662](https://github.com/openai/codex/issues/53662), merged as [openai/codex#54217](https://github.com/openai/codex/pull/54217)) shipped in Codex 0.169.0, so headings, italic, lists, quotes and links take the prismantis theme colors there. [openai/codex#53663](https://github.com/openai/codex/issues/53663), plugins drawing their own fenced blocks, is open, with a proof of concept in [NahumLitvin/codex#1](https://github.com/NahumLitvin/codex/pull/1).

| Feature | Codex 0.169.0+ | After openai/codex#53663 |
|---|---|---|
| Code, inline code, table headers and mermaid boxes in the theme colors | ✓ | ✓ |
| The session note: tables, diagrams and figures in replies | ✓ | ✓ |
| Headings, bold, italic, quotes, lists and links in the theme colors | ✓ | ✓ |
| Figures and xychart bar and line charts drawn | | ✓ |
| Copy buttons, tool rows, diff cards, prompt styles, alert boxes, footnotes, right-to-left text | | |

The last row needs Codex to let plugins redraw its interface, as Claude Code does.

This folder is generated from the Claude Code source by `npm --prefix scripts run build:codex`. Edit the source, not these files.
