# Scope

prismantis makes Claude Code's replies nicer to read. It's a side project I keep small on purpose, and I'm glad to take your PR. This page says what fits, so you, or the agent writing your PR, can check before writing code. [AGENTS.md](AGENTS.md) has the how.

## In scope

The rule of thumb: redrawing anything Claude Code already shows is in.

- Drawing the transcript: replies, your prompts, tool rows, diffs, tables, code, lists, quotes, alerts, footnotes, links, paths, math, mermaid diagrams, charts and figures.
- Looks. A look with more than one plausible style ships its top 3 or 4 styles behind one option, each a step in `/prismantis setup` with a README screenshot.
- Hiding, toggling or tuning any part of the drawing. Full customization is the product, so the answer is yes unless there is a concrete cost.
- Themes from published palettes under MIT, credited in [plugin/THIRD_PARTY_NOTICES.md](plugin/THIRD_PARTY_NOTICES.md).
- Copying what is drawn: Markdown, the drawn art, HTML tables and PNG pictures.
- Right to left text, and every surface Claude Code draws on: terminal, desktop, VS Code and mobile.
- `/prismantis` and its setup, `$.prismantis.markdown` for other mods, and the Codex and OpenCode ports generated from the same source.
- Language highlighting and diagram types, when a vendored MIT library or a short parser covers them.

## Out of scope

- Network calls of any kind, including update checks and telemetry.
- Running programs or reading files beyond those listed in [What it runs, reads and changes](plugin/README.md#what-it-runs-reads-and-changes).
- Changing what Claude does: tools, permissions, settings outside prismantis's own options, or prompts beyond the model-only hint notes.
- Code copied from other projects or mods, non-MIT code or palettes, and a new runtime dependency where writing it is reasonable.

## Ask first

Open an issue before writing code for these, so we agree on the shape first.

- New UI that Claude Code doesn't show today, like a new panel or status line.
- Any change to the default look. New looks are opt-in, and I pick the defaults.
- A new external program, file access or option that changes what the mod reads.
- Renaming or removing an option, which breaks existing settings.

## What a PR needs

A bug fix ships a test that fails on `main` and passes on the branch. Anything that changes the drawing ships a `live-check` render. The PR body says what changes for the user.
