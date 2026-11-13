---
name: terminal-check
description: Run prismantis in the real terminals installed on this machine (Windows Terminal, conhost, Warp, WezTerm, Alacritty on Windows; Terminal, iTerm2, Ghostty, kitty, WezTerm, Alacritty, Warp on macOS), across a matrix of option sets and scripted scenarios that type keys and click, and screenshot each window into one comparison page. Use for a cross-terminal regression pass, before a release, after a change to RTL, colors, widths or buttons, or when a bug only shows in one terminal ("Warp on Windows reverses Hebrew").
---

# Terminal check

`live-check` draws through xterm.js, which has no bidi, no font fallback and no real mouse. Only a real terminal window shows what a person sees. This skill opens one window per installed terminal, starts `claude` in it, plays every config and scenario in that window, and saves a screenshot after each scenario. Between configs it types `/exit`, and the window starts `claude` again with the new options. Between scenarios it runs `/clear`.

## Run

From the repo or a worktree, on macOS or Windows:

```bash
node .claude/skills/terminal-check/check.mjs
```

Narrow it with flags. On Windows the run waits until `claude` has drawn its screen, at most `--boot-limit <seconds>` (default 60). The screen counts as drawn once it holds the `--ready <text>` (default `Claude Code`) and has stopped changing. On macOS `--boot <seconds>` (default 12) is a fixed wait after each config change:

```bash
node .claude/skills/terminal-check/check.mjs --only warp,windows-terminal --configs default,rtl-logical --scenarios demo-rtl
```

The script ends by printing the path of `index.html`. That page is a grid: one row per terminal, one column per config and scenario, with every screenshot in it. Read the PNGs themselves and check each Hebrew line right to left. `results.json` has the same data. On Windows every screenshot has a `.txt` beside it with the text of the screen, in the order the session wrote it, so two runs can be diffed.

## What it sets up

- A throwaway `CLAUDE_CONFIG_DIR` under the output folder. The working copy is installed there from a local marketplace (the same trick as `drive-check`), so options apply and your own config is left alone. On Windows it copies `~/.claude/.credentials.json` there, so the session is logged in. On macOS the session shows "Not logged in". Slash commands such as `/prismantis demo` still run, so the scenarios stick to those.
- `CLAUDE_CODE_PLUGIN_DIRS` is unset, so a checkout your shell points at cannot load over the install.
- Before each launch, `settings.json` gets the config's options under `pluginConfigs`.
- The session has no claude.ai connectors (`ENABLE_CLAUDEAI_MCP_SERVERS=false`) and skips the Claude in Chrome prompt, so a scenario that reaches the model by mistake has no mail or browser tools. The copied credentials are deleted when the script exits, also after a crash or Ctrl+C.
- The calling session's markers are dropped before anything starts: `NO_COLOR`, the Claude Code session variables, and every terminal's own variables (`TERM_PROGRAM`, `WT_*`, `WARP_*`, `KITTY_WINDOW_ID` and the like). A run started from Claude Code or from another terminal still draws in color, and each window reports its own terminal. Settings such as `CLAUDE_CODE_USE_BEDROCK` stay.

## Matrix

`matrix.json` beside the script, or `--matrix <file>`:

- `configs`: name → prismantis options, using the same keys as `/config`. Claude Code's own settings go in a nested `settings` key, such as `{ "settings": { "tui": "fullscreen" } }`.
- `scenarios`: name → steps `[seconds to wait, action]`. An action is one of:
  - keys, such as `"/prismantis demo"`. The named keys are `{Enter}` `{Down}` `{Up}` `{Left}` `{Right}` `{Tab}` `{Esc}` `{Backspace}` `{Space}`.
  - `{ "click": [x, y] }`. `x` and `y` are the 1-based column and row, sent as a mouse report into the session. Buttons get clicks only in a config with `"tui": "fullscreen"`. Coordinates hold for one window size, so keep click scenarios in your own `--matrix` file.
  - `{ "press": "jjj" }`: keys that the screen does not echo, such as hotkeys in a pane. Plain keys of three characters or more must show up on the screen, `press` skips that check.
  - `{ "shot": "label" }`

Every scenario also ends with a shot named `end`. A scenario must leave the prompt empty: the run types `/clear` and `/exit` after it, and leftover text in front of them goes to the model as a message.

## Permissions and safety

- **macOS:** the run never takes focus, so you can keep using the Mac. `claude` runs under `keys.py`, a small pty proxy that reads keys and mouse reports from a FIFO, and `screencapture -l` captures the window even behind other windows. After a terminal opens its window, the app that was in front gets focus back. The terminal you run the script from needs Screen Recording. It needs `python3` on the PATH.
- **Windows:** no setup is needed and the run does not hold focus, so you can keep using the PC. Windows open without activation, and a guard hands focus back to the window you were in if a terminal takes it anyway; Warp, and now and then Windows Terminal, shows in front for about half a second. Keys and mouse reports are written into the window's console input (`AttachConsole` + `WriteConsoleInput`), and `PrintWindow` captures the window behind other windows. Typed text must show up on the screen and `claude` must be ready, or the scenario reports the failure in place of `ok`, with the first line of the screen.
- Run it from Claude Code with the sandbox off for that one command. The sandbox blocks `open`, `osascript` and opening windows.

## Known gaps

- Linux has no launchers yet.
- On macOS, Terminal and iTerm2 keep the closed window open ("process completed"). Close those windows by hand.
- Keys and clicks go to the session, not through the terminal, so a bug in how a terminal encodes a key or a click does not show.
- Capture of a window moved to another desktop is untested.
- Nothing is diffed against a past run, because the cursor and clock change every capture. Compare the pages by eye, or diff the `.txt` files on Windows.
- The `.txt` files hold what the session wrote, not what the terminal drew, so reversed Hebrew only shows in the PNG.
- macOS still waits a fixed time for `claude` and does not check that typed text arrived.

Write each bug as terminal, OS, config, scenario, expected and got, with the PNG attached.
