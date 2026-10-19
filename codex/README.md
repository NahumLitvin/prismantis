# prismantis for Codex

Codex has no way for a plugin to redraw replies, so prismantis in Codex does two things: it gives Codex the same session note as Claude Code, so replies come back with tables, diagrams and figures, and it ships the 16 prismantis themes as Codex syntax themes.

| Codex alone | With prismantis |
|---|---|
| ![Codex in its default colors](../docs/compare/codex-before.png) | ![Codex in prismantis-dracula](../docs/compare/codex-after.png) |

## Install

```bash
codex plugin marketplace add NahumLitvin/prismantis && codex plugin add prismantis@prismantis
```

Trust its hook once in `/hooks`, run `$prismantis-themes` to install the themes, and pick one with `/theme`. `$prismantis` prints the demo.

## What works

Full parity with Claude Code waits on two Codex issues. [openai/codex#53662](https://github.com/openai/codex/issues/53662), theme colors for prose, was accepted and merged as [openai/codex#54217](https://github.com/openai/codex/pull/54217) on 2026-10-15. It is not in a Codex release yet; a Codex built from main already colors headings, italic, lists, quotes and links in the prismantis themes. [openai/codex#53663](https://github.com/openai/codex/issues/53663), plugins drawing their own fenced blocks, is open, with a proof of concept in [NahumLitvin/codex#1](https://github.com/NahumLitvin/codex/pull/1).

| Feature | Codex today | After openai/codex#53662 | After openai/codex#53663 |
|---|---|---|---|
| Code, inline code, table headers and mermaid boxes in the theme colors | ✓ | ✓ | ✓ |
| The session note: tables, diagrams and figures in replies | ✓ | ✓ | ✓ |
| Headings, bold, italic, quotes, lists and links in the theme colors | | ✓ | ✓ |
| Figures and xychart bar and line charts drawn | | | ✓ |
| Copy buttons, tool rows, diff cards, prompt styles, alert boxes, footnotes, right-to-left text | | | |

The themes already carry the prose colors, so they show up in the first Codex release that includes #54217, with no prismantis update. The last row needs Codex to let plugins redraw its interface, as Claude Code does.

This folder is generated from the Claude Code source by `npm --prefix scripts run build:codex`. Edit the source, not these files.
