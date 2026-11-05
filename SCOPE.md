# Scope

prismantis draws Claude's replies so they're easy to read and easy to paste into Slack. You pick how it looks. It makes no network calls and runs nothing you didn't ask for.

That's the whole job, and each PR should serve one of those three things. I'm glad to take yours. This page says what fits, so you, or the agent writing your PR, can check before writing code. [AGENTS.md](AGENTS.md) has the how.

## Easy to read, easy to paste

Redrawing anything Claude Code already shows is in.

- Replies, your prompts, tool rows, diffs, tables, code, lists, quotes, alerts, footnotes, links, paths, math, mermaid diagrams, charts and figures.
- Copying what's drawn: Markdown, the drawn art, HTML tables and PNG pictures.
- Right to left text, and every surface Claude Code draws on: terminal, desktop, VS Code and mobile.
- More languages to highlight and diagram types to draw, when a vendored MIT library or a short parser covers them.
- `/prismantis` and its setup, `$.prismantis.markdown` for other mods, and the Codex and OpenCode ports built from the same source.

## You pick how it looks

Full customization is the product. A request to hide, toggle or tune part of the drawing gets a yes, unless security, a mod-API limit or a real cost says no.

- A look with more than one good style ships its top 3 or 4 behind one option, each a step in `/prismantis setup` with a README screenshot.
- Themes from published MIT palettes, credited in [plugin/THIRD_PARTY_NOTICES.md](plugin/THIRD_PARTY_NOTICES.md).
- New looks are opt-in. Today's look stays the default until I change it.
- Flags and knobs for anything other than the drawing don't go in.

## Nothing hidden

[What it runs, reads and changes](plugin/README.md#what-it-runs-reads-and-changes) lists everything prismantis does on your machine. That list only grows on purpose.

- No network calls, so no update checks and no telemetry.
- It doesn't change what Claude does: no tools, no permissions, no settings outside its own options, and nothing sent to the model beyond the hint notes.
- No code copied from other projects or mods, nothing under a license other than MIT, and no new runtime dependency when writing the code is reasonable.

## Ask first

Open an issue before writing code for these, so we agree on the shape first.

- New UI that neither Claude Code nor prismantis shows today, like a status line or a second pane next to `/prismantis setup`.
- Changing the default look on purpose. Fixing a look that draws wrong needs no issue.
- Running a program or reading a file that isn't on that list.
- Renaming or removing an option, which breaks people's settings.

## What a PR needs

- A bug fix ships a test that fails on `main` and passes on the branch, and for a drawing bug a before and after render.
- Anything that changes the drawing ships a `live-check` render, and a new feature ships a sample in `/prismantis demo`.
- The PR body says what changes for the user.

[AGENTS.md](AGENTS.md) has the full checklist.
