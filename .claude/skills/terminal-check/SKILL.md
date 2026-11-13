---
name: terminal-check
description: Run prismantis in the real terminals installed on this machine (Windows Terminal, conhost, Warp, WezTerm, Alacritty on Windows; Terminal, iTerm2, Ghostty, kitty, WezTerm, Alacritty, Warp on macOS), across a matrix of option sets and scripted scenarios that type keys and click, and screenshot each window into one comparison page. Use for a cross-terminal regression pass, before a release, after a change to RTL, colors, widths or buttons, or when a bug only shows in one terminal ("Warp on Windows reverses Hebrew").
---

# Terminal check

`live-check` draws through xterm.js, which has no bidi, no font fallback and no real mouse. Only a real terminal window shows what a person sees. This skill opens each installed terminal, starts `claude` in it, types and clicks the scenario, and saves a screenshot of that window.

## Run

From the repo or a worktree, on macOS or Windows:

```bash
node .claude/skills/terminal-check/check.mjs
```

Narrow it with flags. A full run takes about 25s per terminal × config × scenario:

```bash
node .claude/skills/terminal-check/check.mjs --only warp,windows-terminal --configs default,rtl-logical --scenarios demo-rtl
```

The script ends by printing the path of `index.html`. That page is a grid: one row per terminal, one column per config and scenario, with every screenshot in it. Read the PNGs themselves and check each Hebrew line right to left. `results.json` has the same data.

## What it sets up

- A throwaway `CLAUDE_CONFIG_DIR` under the output folder. The working copy is installed there from a local marketplace (the same trick as `drive-check`), so options apply and your own config is left alone. On Windows it copies `~/.claude/.credentials.json` there, so the session is logged in. On macOS the session shows "Not logged in". Slash commands such as `/prismantis demo` still run, so the scenarios stick to those.
- `CLAUDE_CODE_PLUGIN_DIRS` is unset, so a checkout your shell points at cannot load over the install.
- Before each launch, `settings.json` gets the config's options under `pluginConfigs`.

## Matrix

`matrix.json` beside the script, or `--matrix <file>`:

- `configs`: name → prismantis options, using the same keys as `/config`. Claude Code's own settings go in a nested `settings` key, such as `{ "settings": { "tui": "fullscreen" } }`.
- `scenarios`: name → steps `[seconds to wait, action]`. An action is one of:
  - keys, such as `"/prismantis demo"`. The named keys are `{Enter}` `{Down}` `{Up}` `{Left}` `{Right}` `{Tab}` `{Esc}` `{Backspace}` `{Space}`.
  - `{ "click": [x, y] }`, in pixels of the scenario's last screenshot. To aim a click, run the scenario once and read the coordinates off its PNG. Buttons get clicks only in a config with `"tui": "fullscreen"`. Otherwise the terminal keeps the click for itself. Coordinates hold for one terminal and window size, so keep click scenarios in your own `--matrix` file.
  - `{ "shot": "label" }`

Every scenario also ends with a shot named `end`.

## Permissions and safety

- **macOS:** the terminal you run the script from needs Accessibility (to type and click) and Screen Recording (to capture). Grant both in System Settings → Privacy & Security. Without Accessibility, the run reports `not allowed to send keystrokes`.
- **Windows:** no setup is needed.
- Before every key press or click, the script raises the test window and checks that it is the front window. If it is not, the scenario stops with `could not focus the window`, so keys never land in your own windows. Don't use the mouse or keyboard while it runs.
- Run it from Claude Code with the sandbox off for that one command. The sandbox blocks `open`, `osascript` and opening windows.

## Known gaps

- Linux has no launchers yet.
- On macOS, Terminal and iTerm2 keep the closed window open ("process completed"). Close those windows by hand.
- Nothing is diffed against a past run, because the cursor and clock change every capture. Compare the pages by eye.

Write each bug as terminal, OS, config, scenario, expected and got, with the PNG attached.
