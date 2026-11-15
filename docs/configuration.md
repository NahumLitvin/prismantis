# Configuration

[← README](../README.md)

## Guided setup

Run `/prismantis setup` to pick a theme and the five styles that change every session (prompts, replies, tables, code blocks and tool output) from drawn samples, and `/prismantis demo` for a tour of the main features. `/prismantis setup more` goes on through the other 19 styles, from diffs and headings to tables of test results. In a terminal, setup opens a pane: the arrows or Tab move through the styles of a step with a preview of the one in focus, Enter saves it and shows the next step. Where the session has no terminal, as in the desktop app, it walks the same steps in the transcript.

## Configure

Open `/config` and look for the **prismantis** rows, or set values in `~/.claude/settings.json`:

```json
{
  "pluginConfigs": {
    "prismantis@prismantis": {
      "options": {
        "theme": "tokyo-night",
        "tableStyle": "grid",
        "headingStyle": "banner",
        "tableHeaderColor": "#ffcc00",
        "numberColor": "cyan"
      }
    }
  }
}
```

Options sit under `options`, keyed by the plugin's install name. Project settings are not read for plugin options.

| Option | Values | Default |
| --- | --- | --- |
| `enabled` | `true`, `false` | `true` |
| `surfaces` | `all`, or a comma-separated list of `terminal`, `desktop`, `vscode`, `mobile` (like `terminal,vscode`); the rest use Claude Code's own renderer | `all` |
| `theme` | see [Themes](appearance.md#themes), or `random` for a new dark color preset each time the mod loads | `catppuccin-mocha` |
| `desktopColors` | `match` (the Claude Code desktop app takes the theme's colors, light mode for a light theme; Claude Code 2.1.324+, see [Full app themes for Claude Code desktop](appearance.md#full-app-themes-for-claude-code-desktop)), `off` (the default, the app keeps its own look) | `off` |
| `tableStyle` | `box`, `rules`, `grid`, `minimal` | `box` |
| `tableLayout` | `classic` (today's look, the default), `auto` (stack to cards when the longest words do not fit), `compact` (columns at their longest word), `stacked` (always cards) | `classic` |
| `statusMatrix` | `color` (status cells in theme colors), `summary` (adds a count line under the table), `group` (also reorders rows by status with a heavy rule), `off` (the default) | `off` |
| `testMatrix` | `report` (a line under a table of test results with the share that passed, the other results and the total time), `off` (the default) | `off` |
| `benchTable` | `trend` (changes colored by improvement under a sparkline of the runs), `color` (just the changes colored green for an improvement and red for a regression), `off` (the default) | `off` |
| `schemaTable` | `full` (type cells colored by family and constraint cells marked), `types` (just the type cells), `keys` (just the constraint cells: PK in the accent color, FK in the link color, unique and index cells in gray), `off` (the default) | `off` |
| `compareTable` | `full` (rank cells colored as a medal and the top score marked), `rank` (just the rank cells: 1 in the accent color, 2 and 3 in the link color), `pick` (just the score cell of the top score, in the improvement green and bold), `off` (the default) | `off` |
| `apiTable` | `full` (method cells colored by verb and auth scheme cells marked), `verbs` (just the method cells), `auth` (just the scheme cells: Bearer, OAuth, API key, JWT and Basic in the accent color), `off` (the default) | `off` |
| `kvTable` | `full` (source cells colored by origin and values that moved off their default marked), `sources` (just the source cells: env in the link color, config in the string color, default in gray), `overrides` (just the value cells that differ from their default, in the accent color), `off` (the default) | `off` |
| `groupTable` | `full` (each group labeled once in the accent color, its size beside the label and a heavy rule between groups), `count` (the label plus the group's size), `merge` (just the label once), `off` (the default) | `off` |
| `heatTable` | `bars` (each number by its place in its column, with a block glyph by the same four steps), `color` (each number colored by its place in its column: the lowest in the table's text color, the next in the number color, the next in the accent color and the highest in the accent color and bold), `off` (the default) | `off` |
| `treeTable` | `full` (each run of a column labeled once, its rows as branches, and a heavy rule between top-level groups), `branch` (the labels and branches), `off` (the default) | `off` |
| `pivotTable` | `transpose` (rows and columns swapped, periods down the side and metrics across), `off` (the default) | `off` |
| `taskStyle` | `checks` (`[ ]` `[✓]`, done struck through), `ticks` (`○` `✓`), `box` (`□` `✓`), `progress` (ticks with a done-count bar) | `checks` |
| `listMarker` | `dots` (`•` then `◦` nested), `dash` (`-` at every level, pastes as a markdown list) | `dots` |
| `promptStyle` | `bubble`, `framed`, `wide`, `bar`, `chevron`, `off` | `bubble` |
| `replyStyle` | `auto` (`bubble` while `promptStyle` is `bubble`, else `off`), `bubble`, `solid`, `framed`, `off` | `auto` |
| `bubbleLabels` | `large` (`⬤`), `small` (`●`), `off` (no labels) | `large` |
| `clock` | `off`, `24h`, `12h` | `off` |
| `headingStyle` | `banner`, `bold`, `underline`, `uppercase` | `banner` |
| `highlightNumbers` | `true`, `false` | `true` |
| `highlightPaths` | `true`, `false` | `true` |
| `fullPaths` | `true` (a path that opens on click shows as its absolute path, so `src/app.ts` reads `/work/app/src/app.ts`), `false` | `false` |
| `folds` | `closed` (long blocks start folded to their first lines), `open` (they start whole, with `show less`) | `closed` |
| `toolRows` | `true`, `false` | `true` |
| `toolStyle` | `chat`, `tree-dim`, `tree-bold`, `classic` | `chat` |
| `toolOutput` | `full`, `quiet`, `rows` | `full` |
| `runningDot` | `ring` (a still `◌`), `blink` (`●` on and off every half second) | `ring` |
| `unreadPrompts` | `true` (a prompt stays grey and blinks until the model starts on it), `false` | `false` |
| `copyButtons` | `true`, `false` | `true` |
| `copyButtonStyle` | `dim`, `inline`, `hover` | `dim` |
| `textCopyButtons` | `true`, `false` | `true` |
| `sectionCopyButtons` | `true`, `false` | `false` |
| `promptCopyButtons` | `true`, `false` | `false` |
| `diagramHints` | `true`, `false` | `true` |
| `issueHint` | `true`, `false` | `true` |
| `keyPointHint` | `true` (each prompt carries a model-only note asking for each reply's key points in bold), `false` | `false` |
| `rtl` | `auto`, a terminal (`warp`, `kitty`, `apple-terminal`, `iterm`, `ghostty`, `wezterm`, `vscode`, `alacritty`, `windows-terminal`, `gnome`, `konsole`), `off` | `auto` |
| `mermaid` | `true`, `false` | `true` |
| `mermaidAscii` | `true`, `false` | `false` |
| `codeStyle` | `plain` (no frame), `framed` (a rounded box), `filled` (a background, or the box in a theme with no colors), `card` (a rounded box on a background) | `plain` |
| `planStyle` | `off` (Claude Code's own plain plan), `bare` (an approved plan drawn like a reply, with a `copy plan` button), `card` (the same in a rounded frame); see [Plans](tool-output.md#plans) | `off` |
| `pieStyle` | `round` (a circle with a legend), `bars` (one bar per slice) | `round` |
| `latex` | `true`, `false` | `false` |
| `<token>Color` | any color, see below | theme |
| `diffStyle` | `card` (rounded box, tinted lines), `full` (no box, lines tinted across the width), `marks` (no tint, colored `+` and `−` marks), `bar` (no tint, a colored `▌` before each changed line) | `card` |
| `scriptStyle` | `frame` (a rounded box, title in its top border), `rail` (a colored `▌` before every line), `bar` (a filled strip with the script's state), `chip` (one folded line) | `frame` |

A color is hex (`#a6e3a1`, `#fc0`), `rgb(166,227,161)`, `ansi256(114)` or a name (`green`, `cyanBright`). Values that don't parse are ignored. Every token has a `<token>Color` option and a row in `/config`:

| Token | Colors |
| --- | --- |
| `accent` | reply bullet, H3+ headings, quote bar, running tool dots |
| `heading` | H1 and H2 |
| `strong` | **bold** text, `strong` in figures |
| `emphasis` | *italic* text, variables, attribute names |
| `inlineCode` | `inline code` |
| `codeText` | code block text |
| `codeFill` | the fill behind code blocks with `codeStyle: filled` or `card` (a shade a step off the background) |
| `codeBorder` | the frame around code blocks with `codeStyle: framed` or `card` (the `rule` color) |
| `codeCommand` | shell commands, functions, class names, keys |
| `codeFlag` | `--flags`, keywords, failures |
| `codeString` | strings |
| `codeComment` | comments, the code block's language label, `dim` in figures |
| `link` | links, URLs, properties, tags |
| `path` | file paths, regexes |
| `number` | numbers, versions, durations, done dots |
| `quote` | quote text |
| `rule` | rules, diff card borders, chart gridlines |
| `tableHeader` | table header cells |
| `tableRule` | table rules |
| `tableText` | plain text in table body cells, on screen and in the `▣ png` copy (the terminal's own text color) |
| `bullet` | list bullets and numbers |
| `diagram` | diagram lines, `accent` in figures |
| `diagramText` | diagram labels, LaTeX formulas and figure text |
| `diffAdded` | added diff lines: their tint, `+` marks and count (the theme's own green) |
| `diffRemoved` | removed diff lines: their tint, `−` marks and count (the theme's own red) |
| `promptFill` | the fill behind your prompts with `promptStyle: bubble` (a deep shade of the theme's green, a pale one in a light theme) |
| `promptBorder` | the frame and `You ⬤` label of your prompts with `promptStyle: bubble` or `framed`, and the hue of their default fill (the `diffAdded` green) |
| `promptText` | the text of your prompts with `promptStyle: bubble` or `framed` (the `heading` color, or `codeText` where that would not read on the fill) |
| `replyFill` | the fill behind Claude's replies with `replyStyle: bubble` or `solid` (a midnight blue a step off the background, a pale one in a light theme) |
| `alertNote` | the box, bar and label of `> [!NOTE]` alerts (the terminal's blue) |
| `alertTip` | the box, bar and label of `> [!TIP]` alerts (the terminal's green) |
| `alertImportant` | the box, bar and label of `> [!IMPORTANT]` alerts (the terminal's magenta) |
| `alertWarning` | the box, bar and label of `> [!WARNING]` alerts (the terminal's yellow) |
| `alertCaution` | the box, bar and label of `> [!CAUTION]` alerts (the terminal's red) |
| `replyBorder` | the frame and `⬤ Claude` label of Claude's replies with `replyStyle: bubble` or `framed` (Claude Code's own Claude orange) |
| `pngBackground` | the background of the `▣ png` copy (the theme's background, white when it has none) |
