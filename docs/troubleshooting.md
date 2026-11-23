# Troubleshooting and limits

[← README](../README.md)

## Troubleshooting

- **A setting or update didn't take:** run `/reload`. A session keeps what it loaded.
- **A diagram shows as code:** its source is over 80 lines or 8,000 characters, it's wider than the window, it doesn't parse, or `mermaid` is off. Widen the terminal or split the diagram.
- **A figure shows as code:** it is still streaming, it has more than 80 lines, a line is wider than the window or than 100 columns, or a line holds a glyph, character or markup that would not draw as written; the dim line above it names the line (see [Figures](diagrams.md#figures)). A frame that is slightly off draws as written, never as code. Widen the terminal, or ask Claude to fix the glyph or the markup.
- **No `⧉ html` on tables:** you're over SSH, in the desktop app or VS Code, or on Linux with no graphical session. `⧉ md` and `⧉ art` still work.
- **`⧉ html` copied plain text only:** CopyQ isn't running, or the clipboard helper failed. The toast says why.
- **Clicking a copy button selects the word "copy":** your terminal copies on select. Use `/prismantis copy`.
- **Fills look flat gray in tmux:** Claude Code draws 256 colors inside tmux, which turns dark fills gray. Set `CLAUDE_CODE_TMUX_TRUECOLOR=1` in the environment Claude Code starts in.
- **`You ●` instead of `You ⬤` in tmux, screen or Zellij:** on purpose. The large dot can draw across two cells in the terminal outside, which leaves half dots behind and over the next letter.

## Limits

- The parser covers what Claude writes (headings, lists, tables, fences, quotes, emphasis, links). It's not full CommonMark: HTML draws as plain text, and a quote ends at the first line without `>`.
- Widths count CJK and emoji as two columns. Terminals disagree on a few emoji, so those can still be off by one.
- Languages outside the 24 listed under [Code](appearance.md#code) draw in `codeText`.
- `desktopColors` needs Claude Code 2.1.324+ and paints only the desktop app's Code tab; it shares the one desktop theme per session with other mods.
- Tested by hand in the macOS terminal; CI runs the tests on macOS, Linux and Windows. The desktop app, VS Code and mobile use the same mod API but are not checked by hand yet.
