# prismantis

A Claude Code mod that redraws Claude's replies in color: tables, headings, lists, quotes, highlighted code, numbers, paths and links, mermaid diagrams and charts, and tool rows, in 17 themes, with copy buttons. Run `/prismantis setup` to pick a look, or `/prismantis demo` to see everything it draws.

Screenshots, every option and the changelog are in the [full README](https://github.com/NahumLitvin/prismantis#readme).

## What it runs, reads and changes

Prismantis makes no network calls. Everything below stays on your machine.

- **Programs.** Clicking `⧉ html` or `▣ png` runs the clipboard helper with the copied table, diagram or figure on stdin: `osascript` on macOS, `powershell.exe` on Windows (it reads `SystemRoot` to find it), or `copyq` on Linux. With `latex` on, it runs `ratex-render` from your `PATH` with the reply's formulas on stdin. It runs nothing else.
- **Files.** It reads a local PNG that a reply links as a Markdown image, up to 2 MB, to draw it in kitty or Ghostty. It reads back the PNGs `ratex-render` writes to `$TMPDIR/prismantis-latex-<session>-<id>`. It writes no files itself.
- **Settings.** `/prismantis setup` and `/prismantis theme` save your pick through `/config`, only into prismantis's own options (`prismantis.theme`, `prismantis.tableStyle` and the other setup steps). Nothing else in your settings changes.
- **Desktop app colors.** Only while `desktopColors` is `match`: at session start and on `/prismantis theme`, it sets the desktop app's colors for the session through `$.theme.set`, from the current palette. Turning `desktopColors` back to `off` calls `$.theme.clear()` once. It never clears at session start or on a reload.
- **Hooks.** It draws through `ui.render`, answers the `/prismantis` command through `command.run`, watches its own `desktopColors` row in `config.set`, adds the model-only [diagram hints](https://github.com/NahumLitvin/prismantis/blob/main/docs/model-hints.md#diagram-hints) note and, with `keyPointHint` on, the key points note in `prompt.submit`, and adds `$.prismantis.markdown` for [other mods](https://github.com/NahumLitvin/prismantis/blob/main/docs/development.md#other-mods) in `engine.create`. `prismantis.markdown` is that call's own event.

## License

[MIT](LICENSE), by Nahum Litvin. Bundled third-party code and palettes are credited in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
