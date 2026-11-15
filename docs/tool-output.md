# Tool output: quiet and rows

`toolOutput` picks how much of a call shows. The default, `full`, is what Claude Code shows. `quiet`, set in `/config` or as `"toolOutput": "quiet"` in `settings.json`, shows what Claude did, not what it read. `rows` is `quiet` with nothing under a call that worked. Needs `toolRows` on.

## quiet

- Read, Grep, Glob, web fetches and shell commands made only of read-only programs (`cat`, `grep`, `rg`, `ls`, `find`, `git log`, `gh pr view`, …) draw their row and nothing under it, and the row says it in plain words: `Read src/report.py lines 1–10`, `Searched src/ for "TODO"`, `Listed tests`.
- A shell call with no such form shows the description Claude gave it and the programs it ran: `Run the unit tests · python3`.
- Other shell commands show their first 3 lines and a count, without the approval line, also when Claude Code folded the call into a collapsed group.
- Edits keep their diff card, and a shell command that changed files keeps one card per file under its first lines. New, deleted and renamed files keep their preview, `Deleted` line and `Renamed` line.
- A failed call shows the last real line of its error instead of `Exit code 1`; a refused call (a permission rule, the auto mode classifier) shows its full reason.

## rows

`rows`, set as `"toolOutput": "rows"`, draws everything as `quiet` does, with these differences:

- A shell call that worked draws its row and nothing under it, read-only or not: `npm test` shows no first lines and no count.
- A shell command that changed files keeps one diff card per file, without its first lines above them.
- Any other call that worked, an MCP tool or an agent, draws only its row too.

These stay as in `quiet`:

- Edits keep their diff card.
- A failed call shows the last real line of its error, and a refused call its full reason.
- An expanded call, and the ctrl+o transcript, show the whole result.
- Background, image and interrupted shell results are left to Claude Code.

## What counts as read-only

A command counts as read-only only when every part of it is, after a quote-aware split on `;`, `&&`, `||`, `|`, `&` and newlines, with no redirect into a file, no `$(…)`, no heredoc and no write flags (`sed -i`, `find -delete`, …). In doubt, the result shows.
