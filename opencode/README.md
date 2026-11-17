# prismantis for OpenCode

OpenCode lets a plugin draw its own fenced blocks, so prismantis in OpenCode draws ```figure blocks in color and mermaid xychart-beta and pie in ```chart blocks. It gives OpenCode the same session note as Claude Code, so replies come back with tables, diagrams, figures and charts, and ships 18 prismantis themes that color code and prose.

## Install

Needs OpenCode 2.2.5 or later.

```bash
opencode plugin add 'github:NahumLitvin/prismantis#v0.47.0::path:opencode'
```

Run `/prismantis-themes` to install the themes, and pick one in settings > Theme. `/prismantis` prints the demo.

## What works

| Feature | OpenCode |
|---|---|
| The session note: tables, diagrams, figures and charts in replies | ✓ |
| Code, headings, bold, italic, quotes, lists and links in the theme colors | ✓ |
| Figures drawn with their colors | ✓ |
| Mermaid flowchart, sequence, state, gantt, gitGraph and timeline (drawn by OpenCode) | ✓ |
| Mermaid xychart bar and line charts, and pie, in a `chart` fence | ✓ |
| Copy buttons, tool rows, diff cards, prompt styles, alert boxes, footnotes, right-to-left text | |

`chart` fences hold mermaid xychart-beta and pie source, the two kinds OpenCode leaves as source; every other fence stays as written.

This folder is generated from the Claude Code source by `npm --prefix scripts run build:codex`. Edit the source, not these files.
