# Scope

What prismantis takes and what it turns down, so a contributor, or the agent writing their PR, can check before writing code. [AGENTS.md](AGENTS.md) has the how; this file has the what.

prismantis redraws what Claude Code already shows. It does not add behavior to Claude Code itself.

## In scope

- Drawing the transcript: replies, your prompts, tool rows, diffs, tables, code, lists, quotes, alerts, footnotes, links, paths, math, mermaid diagrams, charts and figures.
- Looks. A look with more than one plausible style ships its top 3 or 4 styles behind one option, each a step in `/prismantis setup` with a README screenshot.
- Hiding, toggling or tuning any part of the drawing. Full customization is the product, so these are accepted unless there is a concrete cost.
- Themes from published palettes under MIT, credited in [plugin/THIRD_PARTY_NOTICES.md](plugin/THIRD_PARTY_NOTICES.md).
- Copying what is drawn: Markdown, the drawn art, HTML tables and PNG pictures.
- Right to left text, and every surface Claude Code draws on: terminal, desktop, VS Code and mobile.
- `$.prismantis.markdown` for other mods, and the Codex and OpenCode ports generated from the same source.
- Language highlighting and diagram types, when a vendored MIT library or a short parser covers them.

## Out of scope

These get closed with a pointer to a better home.

- Network calls of any kind, including update checks and telemetry.
- Running programs beyond the four listed in the README (`osascript`, `powershell.exe`, CopyQ, `ratex-render`), or reading and writing files beyond what it lists.
- Changing what Claude does: tools, permissions, settings outside prismantis's own options, or prompts beyond the model-only diagram hints note.
- Features that are not drawing: status lines, notifications, session or workflow tools. Those belong in a mod of their own.
- Code copied from other projects or mods, non-MIT code or palettes, and a new runtime dependency where writing it is reasonable.
- Code comments. The why goes in the PR description.

## Maintainer decisions

Open an issue first for these; the maintainer decides before code is written.

- Any change to the default look. New looks are opt-in, and only the maintainer moves a default.
- A new external program, file access or option that changes what the mod reads.
- Anything that grows the diagram hints note, since every user pays its tokens on every prompt.
- Renaming or removing an option, which breaks existing settings.

## What a PR needs

One change per PR. A bug fix ships a test that fails on `main` and passes on the branch. Anything that changes the drawing ships a `live-check` render. The PR body says what changes for the user.
