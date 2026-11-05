# Scope

prismantis makes Claude Code's replies nicer to read. It's a side project I keep small on purpose, and I'm glad to take your PR. This page says what fits, so you, or the agent writing your PR, can check before writing code. [AGENTS.md](AGENTS.md) has the how.

## In scope

The rule of thumb: redrawing anything Claude Code already shows is in.

- Drawing the transcript: replies, your prompts, tool rows, diffs, tables, code, lists, quotes, alerts, footnotes, links, paths, math, mermaid diagrams, charts and figures.
- Looks. A look with more than one plausible style ships its top 3 or 4 styles behind one option, each a step in `/prismantis setup` with a README screenshot.
- Hiding, toggling or tuning any part of the drawing. Full customization is the product, so the answer is yes unless there is a concrete reason against it: security, a mod-API limit or a real cost. Feature flags and knobs for anything else are not.
- Themes from published palettes under MIT, credited in [plugin/THIRD_PARTY_NOTICES.md](plugin/THIRD_PARTY_NOTICES.md).
- Copying what is drawn: Markdown, the drawn art, HTML tables and PNG pictures.
- Right to left text, and every surface Claude Code draws on: terminal, desktop, VS Code and mobile.
- `/prismantis` and its setup, `$.prismantis.markdown` for other mods, and the Codex and OpenCode ports generated from the same source.
- Language highlighting and diagram types, when a vendored MIT library or a short parser covers them.

## Out of scope

- Network calls of any kind, including update checks and telemetry.
- Changing what Claude does: tools, permissions, settings outside prismantis's own options, or prompts beyond the model-only hint notes.
- Code copied from other projects or mods, non-MIT code or palettes, and a new runtime dependency where writing it is reasonable.

## Ask first

Open an issue before writing code for these, so we agree on the shape first.

- New UI that neither Claude Code nor prismantis shows today, like a status line or a second pane next to `/prismantis setup`.
- An intentional change to the default look. New looks are opt-in, and I pick the defaults. Fixing a look that draws wrong needs no issue.
- Running a program or reading a file beyond those listed in [What it runs, reads and changes](plugin/README.md#what-it-runs-reads-and-changes).
- Renaming or removing an option, which breaks existing settings.

## What a PR needs

A bug fix ships a test that fails on `main` and passes on the branch, and for a drawing bug a before and after render. Anything that changes the drawing ships a `live-check` render, and a new feature ships a sample in `/prismantis demo`. The PR body says what changes for the user. [AGENTS.md](AGENTS.md) has the full checklist.
