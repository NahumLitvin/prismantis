# prismantis for Antigravity

Antigravity draws replies itself and keeps its own color scheme, so prismantis in Antigravity does not color anything. It gives Antigravity the same session note as Claude Code, so replies come back with tables, diagrams and figures, and adds a `/prismantis` demo.

## Install

```bash
git clone https://github.com/NahumLitvin/prismantis && agy plugin install ./prismantis/antigravity
```

Or copy this folder to `.agents/plugins/prismantis/` in a workspace, or to `~/.gemini/config/plugins/prismantis/` for every workspace. `/prismantis` prints the demo.

## What works

| Feature | Antigravity |
|---|---|
| The session note: tables, diagrams and figures in replies | ✓ |
| Tables, headings, lists, links and fenced code, in the Antigravity color scheme | ✓ |
| Mermaid flowchart and sequenceDiagram, drawn by Antigravity | ✓ |
| Figure blocks, printed as the text pictures they are | ✓ |
| Mermaid state, class, ER, gantt, gitGraph, timeline, pie and xychart | source, so the note asks for a figure instead |
| prismantis themes, copy buttons, tool rows, diff cards, prompt styles, alert boxes, footnotes, right-to-left text | not in Antigravity |

This folder is generated from the Claude Code source by `npm --prefix scripts run build:codex`. Edit the source, not these files.
