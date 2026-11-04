// ../hooks/markdown.ts
var FIGURE_ROLES = ["accent", "warn", "ok", "note", "dim", "strong"];
var ROLE_MARKUP = new RegExp(`\\{(?:${FIGURE_ROLES.join("|")}):([^{}]*)\\}`, "g");
var scriptMap = (from, to) => new Map(Array.from(from).map((c, i) => [c, Array.from(to)[i]]));
var SUP = scriptMap("0123456789+-\u2212=()niabcdefghjklmoprstuvwxyzABDEGHIJKLMNOPRTUVW", "\u2070\xB9\xB2\xB3\u2074\u2075\u2076\u2077\u2078\u2079\u207A\u207B\u207B\u207C\u207D\u207E\u207F\u2071\u1D43\u1D47\u1D9C\u1D48\u1D49\u1DA0\u1D4D\u02B0\u02B2\u1D4F\u02E1\u1D50\u1D52\u1D56\u02B3\u02E2\u1D57\u1D58\u1D5B\u02B7\u02E3\u02B8\u1DBB\u1D2C\u1D2E\u1D30\u1D31\u1D33\u1D34\u1D35\u1D36\u1D37\u1D38\u1D39\u1D3A\u1D3C\u1D3E\u1D3F\u1D40\u1D41\u2C7D\u1D42");
var SUB = scriptMap("0123456789+-\u2212=()aehijklmnoprstuvx", "\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089\u208A\u208B\u208B\u208C\u208D\u208E\u2090\u2091\u2095\u1D62\u2C7C\u2096\u2097\u2098\u2099\u2092\u209A\u1D63\u209B\u209C\u1D64\u1D65\u2093");
var TINT_ON = { "2": "dim", "3": "italic", "90": "gray", "36": "cyan", "32": "green", "33": "yellow" };
var TINT_KEYS = Object.keys(TINT_ON);

// ../hooks/figure.tsx
var FIGURE_MAX_COLUMNS = 100;
var FIGURE_SAFE_COLUMNS = 74;
var RAW_MAX_LINE = FIGURE_MAX_COLUMNS * 4;
var FIGURE_GLYPHS = "\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2550\u2551\u2192\u2190\u25BA\u25C4\u25B2\u25BC\u2713\u2717\u25CF\u25CB\u2588\u258F\u25A0\u25A1\xB7";
var FIGURE_HINT = [
  "A fenced block whose opening line is exactly ```figure is drawn as a text picture, as written.",
  "Prefer one over mermaid when position carries meaning: durations racing on a time axis, a screen layout, phases, before/after; mermaid stays for plain flows and charts; none for short answers, code changes or reports. The prose never retells the picture.",
  "When asked to explain, compare or plan something and pictures would help, build the reply around them, with the core on the first screen as a picture or a sentence.",
  "Figures only: color with {role:text}, not nested: accent for lines, warn for risk, ok for healthy, note for time, dim for asides, strong for emphasis.",
  `At most ${FIGURE_SAFE_COLUMNS} columns, glyphs one column wide such as ${FIGURE_GLYPHS}, no emoji or tabs; markup takes no columns, so align on the drawn text and pad box rows to the top border. CJK letters take two columns, count them twice. Draw a time axis with edge ticks like \u258F\u2500\u2500\u2500\u258F\u2500\u2500\u2500\u258F, not \u251C\u253C\u2524: \u2588 fills its cell, \u251C\u253C\u2524 sit mid-cell.`
].join(" ");
var MARKUP = new RegExp(`\\{(${FIGURE_ROLES.join("|")})(?::([^{}]*)\\}|\\}([^{}]*)\\{\\/\\1\\})`, "g");

// ../hooks/presets.ts
var PRESETS = {
  "catppuccin-mocha": {
    accent: "#cba6f7",
    heading: "#f9e2af",
    tableHeader: "#f9e2af",
    strong: "#ffffff",
    emphasis: "#f5c2e7",
    inlineCode: "#89dceb",
    codeText: "#cdd6f4",
    codeCommand: "#89b4fa",
    codeFlag: "#f38ba8",
    codeString: "#a6e3a1",
    codeComment: "#6c7086",
    link: "#89b4fa",
    path: "#89dceb",
    number: "#a6e3a1",
    quote: "#9399b2",
    rule: "#45475a",
    tableRule: "#585b70",
    bullet: "#cba6f7",
    diagram: "#89b4fa",
    diagramText: "#cdd6f4",
    diffAdded: "#a6e3a1",
    diffRemoved: "#f38ba8"
  },
  "catppuccin-latte": {
    accent: "#8839ef",
    heading: "#df8e1d",
    tableHeader: "#df8e1d",
    strong: "#11111b",
    emphasis: "#ea76cb",
    inlineCode: "#04a5e5",
    codeText: "#4c4f69",
    codeCommand: "#1e66f5",
    codeFlag: "#d20f39",
    codeString: "#40a02b",
    codeComment: "#9ca0b0",
    link: "#1e66f5",
    path: "#209fb5",
    number: "#40a02b",
    quote: "#6c6f85",
    rule: "#bcc0cc",
    tableRule: "#acb0be",
    bullet: "#8839ef",
    diagram: "#1e66f5",
    diagramText: "#4c4f69",
    diffAdded: "#3f9e2b",
    diffRemoved: "#d20f39"
  },
  dracula: {
    accent: "#bd93f9",
    heading: "#bd93f9",
    tableHeader: "#f1fa8c",
    strong: "#f8f8f2",
    emphasis: "#ff79c6",
    inlineCode: "#8be9fd",
    codeText: "#f8f8f2",
    codeCommand: "#50fa7b",
    codeFlag: "#ff79c6",
    codeString: "#f1fa8c",
    codeComment: "#6272a4",
    link: "#8be9fd",
    path: "#ffb86c",
    number: "#bd93f9",
    quote: "#6272a4",
    rule: "#44475a",
    tableRule: "#6272a4",
    bullet: "#ff79c6",
    diagram: "#bd93f9",
    diagramText: "#f8f8f2",
    diffAdded: "#50fa7b",
    diffRemoved: "#ff5555"
  },
  nord: {
    accent: "#88c0d0",
    heading: "#88c0d0",
    tableHeader: "#ebcb8b",
    strong: "#eceff4",
    emphasis: "#b48ead",
    inlineCode: "#8fbcbb",
    codeText: "#d8dee9",
    codeCommand: "#88c0d0",
    codeFlag: "#81a1c1",
    codeString: "#a3be8c",
    codeComment: "#4c566a",
    link: "#88c0d0",
    path: "#8fbcbb",
    number: "#b48ead",
    quote: "#81a1c1",
    rule: "#3b4252",
    tableRule: "#4c566a",
    bullet: "#88c0d0",
    diagram: "#81a1c1",
    diagramText: "#d8dee9",
    diffAdded: "#a3be8c",
    diffRemoved: "#bf616a"
  },
  "tokyo-night": {
    accent: "#bb9af7",
    heading: "#7dcfff",
    tableHeader: "#e0af68",
    strong: "#c0caf5",
    emphasis: "#f7768e",
    inlineCode: "#7dcfff",
    codeText: "#a9b1d6",
    codeCommand: "#7aa2f7",
    codeFlag: "#bb9af7",
    codeString: "#9ece6a",
    codeComment: "#565f89",
    link: "#73daca",
    path: "#2ac3de",
    number: "#ff9e64",
    quote: "#9aa5ce",
    rule: "#414868",
    tableRule: "#565f89",
    bullet: "#bb9af7",
    diagram: "#7aa2f7",
    diagramText: "#c0caf5",
    diffAdded: "#9ece6a",
    diffRemoved: "#f7768e"
  },
  "gruvbox-dark": {
    accent: "#d3869b",
    heading: "#fabd2f",
    tableHeader: "#fabd2f",
    strong: "#fbf1c7",
    emphasis: "#d3869b",
    inlineCode: "#8ec07c",
    codeText: "#ebdbb2",
    codeCommand: "#83a598",
    codeFlag: "#fe8019",
    codeString: "#b8bb26",
    codeComment: "#928374",
    link: "#83a598",
    path: "#8ec07c",
    number: "#d3869b",
    quote: "#a89984",
    rule: "#3c3836",
    tableRule: "#504945",
    bullet: "#fe8019",
    diagram: "#83a598",
    diagramText: "#ebdbb2",
    diffAdded: "#b8bb26",
    diffRemoved: "#fb4934"
  },
  "gruvbox-light": {
    accent: "#8f3f71",
    heading: "#b57614",
    tableHeader: "#b57614",
    strong: "#282828",
    emphasis: "#8f3f71",
    inlineCode: "#427b58",
    codeText: "#3c3836",
    codeCommand: "#076678",
    codeFlag: "#af3a03",
    codeString: "#79740e",
    codeComment: "#928374",
    link: "#076678",
    path: "#427b58",
    number: "#8f3f71",
    quote: "#7c6f64",
    rule: "#ebdbb2",
    tableRule: "#a89984",
    bullet: "#af3a03",
    diagram: "#076678",
    diagramText: "#3c3836",
    diffAdded: "#79740e",
    diffRemoved: "#9d0006"
  },
  "rose-pine": {
    accent: "#c4a7e7",
    heading: "#c4a7e7",
    tableHeader: "#f6c177",
    strong: "#e0def4",
    emphasis: "#ebbcba",
    inlineCode: "#9ccfd8",
    codeText: "#e0def4",
    codeCommand: "#9ccfd8",
    codeFlag: "#eb6f92",
    codeString: "#f6c177",
    codeComment: "#6e6a86",
    link: "#c4a7e7",
    path: "#9ccfd8",
    number: "#ebbcba",
    quote: "#908caa",
    rule: "#26233a",
    tableRule: "#6e6a86",
    bullet: "#eb6f92",
    diagram: "#c4a7e7",
    diagramText: "#e0def4",
    diffAdded: "#9ccfd8",
    diffRemoved: "#eb6f92"
  },
  "rose-pine-dawn": {
    accent: "#907aa9",
    heading: "#907aa9",
    tableHeader: "#ea9d34",
    strong: "#464261",
    emphasis: "#d7827e",
    inlineCode: "#56949f",
    codeText: "#464261",
    codeCommand: "#56949f",
    codeFlag: "#b4637a",
    codeString: "#ea9d34",
    codeComment: "#9893a5",
    link: "#907aa9",
    path: "#286983",
    number: "#d7827e",
    quote: "#797593",
    rule: "#f2e9e1",
    tableRule: "#9893a5",
    bullet: "#b4637a",
    diagram: "#907aa9",
    diagramText: "#464261",
    diffAdded: "#56949f",
    diffRemoved: "#b4637a"
  },
  everforest: {
    accent: "#a7c080",
    heading: "#e69875",
    tableHeader: "#dbbc7f",
    strong: "#d3c6aa",
    emphasis: "#d699b6",
    inlineCode: "#83c092",
    codeText: "#d3c6aa",
    codeCommand: "#7fbbb3",
    codeFlag: "#e67e80",
    codeString: "#a7c080",
    codeComment: "#859289",
    link: "#7fbbb3",
    path: "#83c092",
    number: "#d699b6",
    quote: "#9da9a0",
    rule: "#475258",
    tableRule: "#7a8478",
    bullet: "#e69875",
    diagram: "#7fbbb3",
    diagramText: "#d3c6aa",
    diffAdded: "#a7c080",
    diffRemoved: "#e67e80"
  },
  "github-dark": {
    accent: "#d2a8ff",
    heading: "#79c0ff",
    tableHeader: "#ffa657",
    strong: "#e6edf3",
    emphasis: "#d2a8ff",
    inlineCode: "#79c0ff",
    codeText: "#e6edf3",
    codeCommand: "#d2a8ff",
    codeFlag: "#ff7b72",
    codeString: "#a5d6ff",
    codeComment: "#7d8590",
    link: "#58a6ff",
    path: "#7ee787",
    number: "#79c0ff",
    quote: "#7d8590",
    rule: "#30363d",
    tableRule: "#8b949e",
    bullet: "#ff7b72",
    diagram: "#58a6ff",
    diagramText: "#e6edf3",
    diffAdded: "#3fb950",
    diffRemoved: "#f85149"
  },
  "github-light": {
    accent: "#8250df",
    heading: "#0550ae",
    tableHeader: "#953800",
    strong: "#1f2328",
    emphasis: "#8250df",
    inlineCode: "#0550ae",
    codeText: "#1f2328",
    codeCommand: "#8250df",
    codeFlag: "#cf222e",
    codeString: "#0a3069",
    codeComment: "#6e7781",
    link: "#0969da",
    path: "#116329",
    number: "#0550ae",
    quote: "#656d76",
    rule: "#d0d7de",
    tableRule: "#6e7781",
    bullet: "#cf222e",
    diagram: "#0969da",
    diagramText: "#1f2328",
    diffAdded: "#1a7f37",
    diffRemoved: "#cf222e"
  },
  "one-dark": {
    accent: "#c678dd",
    heading: "#e06c75",
    tableHeader: "#e5c07b",
    strong: "#d19a66",
    emphasis: "#c678dd",
    inlineCode: "#56b6c2",
    codeText: "#abb2bf",
    codeCommand: "#61afef",
    codeFlag: "#e06c75",
    codeString: "#98c379",
    codeComment: "#5c6370",
    link: "#61afef",
    path: "#56b6c2",
    number: "#d19a66",
    quote: "#828997",
    rule: "#3a3f4b",
    tableRule: "#5c6370",
    bullet: "#c678dd",
    diagram: "#61afef",
    diagramText: "#abb2bf",
    diffAdded: "#98c379",
    diffRemoved: "#e06c75"
  },
  "solarized-dark": {
    accent: "#6c71c4",
    heading: "#b58900",
    tableHeader: "#b58900",
    strong: "#eee8d5",
    emphasis: "#d33682",
    inlineCode: "#2aa198",
    codeText: "#93a1a1",
    codeCommand: "#268bd2",
    codeFlag: "#cb4b16",
    codeString: "#859900",
    codeComment: "#586e75",
    link: "#268bd2",
    path: "#2aa198",
    number: "#859900",
    quote: "#657b83",
    rule: "#073642",
    tableRule: "#586e75",
    bullet: "#6c71c4",
    diagram: "#268bd2",
    diagramText: "#93a1a1",
    diffAdded: "#859900",
    diffRemoved: "#dc322f"
  },
  "solarized-light": {
    accent: "#6c71c4",
    heading: "#b58900",
    tableHeader: "#b58900",
    strong: "#073642",
    emphasis: "#d33682",
    inlineCode: "#2aa198",
    codeText: "#586e75",
    codeCommand: "#268bd2",
    codeFlag: "#cb4b16",
    codeString: "#859900",
    codeComment: "#93a1a1",
    link: "#268bd2",
    path: "#2aa198",
    number: "#859900",
    quote: "#839496",
    rule: "#eee8d5",
    tableRule: "#93a1a1",
    bullet: "#6c71c4",
    diagram: "#268bd2",
    diagramText: "#586e75",
    diffAdded: "#849800",
    diffRemoved: "#dc322f"
  },
  neon: {
    accent: "#00e5ff",
    heading: "#00e5ff",
    tableHeader: "#00e5ff",
    strong: "#00e5ff",
    emphasis: "#a77bff",
    inlineCode: "#ffcc33",
    codeText: "#c9d4f2",
    codeCommand: "#a77bff",
    codeFlag: "#ff3ea5",
    codeString: "#3dff9a",
    codeComment: "#66708f",
    link: "#a77bff",
    path: "#ffcc33",
    number: "#3dff9a",
    quote: "#c9d4f2",
    rule: "#343c5c",
    tableRule: "#343c5c",
    bullet: "#8b95b8",
    diagram: "#66708f",
    diagramText: "#c9d4f2",
    diffAdded: "#3dff9a",
    diffRemoved: "#ff4d6d"
  },
  mono: {}
};
var PRESET_NAMES = Object.keys(PRESETS);

// ../hooks/theme.ts
var RANDOM_THEMES = PRESET_NAMES.filter((t) => !/latte|light|dawn/.test(t) && t !== "mono");

// ../hooks/help.ts
var HINT = [
  "Replies in this session are drawn by the prismantis mod, which runs inside Claude Code and is not a command or tool to call: when the user asks to show something with prismantis, write it as markdown in the reply.",
  "Markdown tables, GitHub alerts (> [!WARNING], > [!NOTE]), fenced code with a language tag, and ```mermaid blocks render as colored terminal graphics:",
  'flowcharts, sequence diagrams, xychart-beta bar or line charts (name each series for the legend: line "east" [..]), pie charts and gantt schedules.',
  "When a reply carries a numeric series or a flow that is easier to see than read, add a small diagram or chart with short labels, not a second picture of what a figure already shows.",
  "Skip diagrams and pictures for short or simple answers.",
  "Put any command or snippet the user may run or copy in a fenced block with a language tag, never inline code: fenced blocks get a copy button, inline code does not."
].join(" ");
var showcaseText = (themes) => `
# prismantis

Colored markdown for Claude Code replies: **bold**, *italic*, ~~struck~~, \`inline code\`, a [link](https://github.com/NahumLitvin/prismantis) and a bare URL https://github.com/NahumLitvin/prismantis/issues, both clickable, numbers like 99.9% and 250ms, paths like ~/src/app.ts.

Paths like ~/src/app.ts, ./README.md and /tmp/app.ts open on click in a terminal that draws hyperlinks, and so does a local link that shows its own path, like [/tmp/notes.md](file:///tmp/notes.md), while slash commands like /config stay text. A local link with any other name, like [notes](file:///tmp/notes.md), draws as its name and target, so it cannot hide where a click goes.

Paths written without ./, like docs/guide/ or src/app.ts:42, and Windows paths like C:\\work\\plan.md link too, once a check finds them on disk; prose like and/or stays text.

Programs and launchers stay plain text, so a click never runs one: ./install.sh, ~/Desktop/setup.command and /Applications/Calculator.app keep the path color without a link.

Obsidian links that open a note open on click, like [a note](obsidian://open?vault=notes&file=todo), while one that writes, like [a new note](obsidian://new?vault=notes&name=x&content=y), and other app links like [diagnostics](ms-msdt:/id) stay text.

Code-shaped prose stays as written: f(*args, **kwargs), a link with parentheses [Foo_(bar)](https://en.wikipedia.org/wiki/Foo_(bar)), a file link [\`render.tsx\`](https://github.com/NahumLitvin/prismantis/blob/main/hooks/render.tsx) and **bold with *italic* inside**.

## Commands

| Command | Does |
|---------|------|
| \`/prismantis\` | This screen |
| \`/prismantis theme <name>\` | Switch theme on the spot (\`/prismantis <name>\` works too), \`random\` for a new dark one now and each time the mod loads |
| \`/prismantis copy\` | Copy the last reply, or \`copy code\` for its last code block |
| \`/prismantis setup\` | Pick a theme and how tables, tasks, headings, copy buttons, prompts, replies, bubble labels, times, tool rows, tool output, diffs and pie charts look, from drawn samples |
| \`/config\` | Edit any option |

> [!NOTE]
> ${themes.length} themes ship with it. \`mono\` uses no color, only bold and dim.

### Pick a theme

\`\`\`bash
/prismantis theme nord
/prismantis theme github-light
/prismantis theme random
\`\`\`

1. Dark: ${themes.filter((t) => RANDOM_THEMES.includes(t)).join(", ")}
2. Light: ${themes.filter((t) => /latte|light|dawn/.test(t)).join(", ")}
3. Plain
   - mono

> [!TIP]
> Any color slot beats the theme. Set \`headingColor\` or \`numberColor\` to a hex value in \`/config\`.

## Everything it draws

### Copy tables

Use \`\u29C9 md\` for Markdown, \`\u29C9 art\` for chat, or \`\u29C9 html\` for a formatted table. \`\u29C9 html\` shows in a local macOS, Linux or Windows terminal and writes HTML and tab-separated plain text together; Linux needs CopyQ running. Pasted into Slack it makes a native table; Slack keeps cell text but drops bold, links and alignment. If that fails, it copies the plain text alone. \`\u25A3 png\` puts a picture of the drawn table, diagram or chart on the clipboard in the theme's colors, ready to paste into Slack, docs or slides; it shows in a local macOS or Windows terminal. Set \`copyButtonStyle\` to \`hover\` in \`/config\` and each block shows a dim \u29C9 instead: point at it for its buttons. Set \`textCopyButtons\` to \`false\` to keep only the buttons on code, tables, diagrams and the reply.

| Item | Quantity[^count] | Status |
|:-----|---------:|:------:|
| **Apples** | 3 | *Ready* |
| Oranges | 5 | Pending |

### Alerts

> [!IMPORTANT]
> After updating the plugin, open sessions need \`/reload\`.

> [!WARNING]
> Terminals that copy on select (Warp) can turn a click on a copy button into a selection. Use the keyboard shortcut.
> Selecting a typeset formula copies blank cells. Its copy button copies the LaTeX.

> [!CAUTION]
> Claude Code refuses trees over 20000 nodes. A code block past about 500 highlighted lines falls back to plain text.

### Task lists

- [x] Parse the reply
- [x] Draw it
  - [x] Tables and code
  - [ ] Diagrams on the desktop app
- [ ] Ship the next release

Set \`listMarker\` to dash in \`/config\` and bullets draw as \`-\`, so a list you select with the mouse pastes as markdown.

### Your prompts

Scroll up: what you typed sits on the right under \`You \u2B24\` and Claude's replies on the left under \`\u2B24 Claude\`, each in a bubble of its own, like a chat app. \`promptStyle\` switches to \`wide\`, \`bar\`, \`chevron\` or \`off\` in \`/config\`, which also brings back the dot before Claude's replies; \`replyStyle\` picks \`solid\`, \`framed\` or \`off\` for Claude's side, and \`bubbleLabels\` draws both labels with a \`small\` dot or turns them \`off\`. Set \`clock\` to \`24h\` or \`12h\` and each prompt shows when you sent it, and each turn's last line when it finished. A paste of 4 lines or more draws in a double frame of its own, folded to one button that opens it as highlighted code.

### Tool rows

Tool calls draw as one line, dimmed on the right by default, and the file each one read or edited opens on click in a terminal that draws hyperlinks. Set \`toolStyle\` in \`/config\` to \`chat\`, \`tree-dim\`, \`tree-bold\` or \`classic\`. \`toolOutput: quiet\` in \`/config\` hides what Claude only read and says in plain words what each call did: \`Read src/app.ts lines 1\u201340\`, \`Searched src/ for "TODO"\`. A call still running shows a still \`\u25CC\`; \`runningDot: blink\` makes it a \`\u25CF\` that blinks every half second, and \`unreadPrompts\` keeps each prompt you send grey and blinking until Claude starts on it, so one queued mid-turn stands out.

Each edit draws as a diff card headed \`+N \u2212M\`: code highlighted in the file's language, added and removed lines on a tint of the theme's own green and red with the changed words in a deeper tint, kept readable in every theme, long lines wrapped, the first 20 lines and a \`+K more lines\` button that opens the rest, as does a click anywhere on the card. Files a shell command changes (\`sed -i\`, a script) get the same card, one per file, headed by its path. Set \`diffStyle\` in \`/config\` for the look: \`card\`, \`full\`, \`marks\` or \`bar\`.

A file Write creates shows its first 10 lines as numbered code in the theme's colors with no diff marks, and a click on it or on \`+K more lines\` opens the rest. A file an Edit or a shell command creates shows its first 10 lines as added lines under \`Created\`. A file a shell command removes is one \`Deleted\` line that opens to its removed lines on a click, and a file moved unchanged is one \`Renamed old \u2192 new\` line.

### Quotes and rules

> A quote keeps its text when you copy it, without the \`> \` markers.
>
> It keeps its paragraphs and lists too:
> - **bold** and \`inline code\` stay styled
> - each item gets its own row
>
> > A nested quote draws inside the bar.

<summary>
A line that holds only a tag draws dim, so wrapper tags show the reply's structure.
</summary>

---

### Code

\`\`\`json
{ "theme": "dracula", "headingStyle": "banner", "mermaid": true }
\`\`\`

Blocks of 10 lines or more get line numbers. Past 30 lines they fold to the first 20 and a \`+M more lines\` button, \`show less\` folds them back; \`\u29C9 copy\` still copies the whole block. Set \`folds\` to \`open\` in \`/config\` and long blocks start whole instead, with \`show less\` to fold them again.

\`\`\`ts
type Item = { name: string; price: number; qty: number }

const basket: Item[] = [
  { name: 'apples', price: 1.2, qty: 3 },
  { name: 'oranges', price: 0.8, qty: 5 },
  { name: 'pears', price: 1.5, qty: 2 },
  { name: 'plums', price: 2.1, qty: 4 },
  { name: 'grapes', price: 3.4, qty: 1 },
  { name: 'lemons', price: 0.6, qty: 6 },
  { name: 'melons', price: 4.0, qty: 1 },
  { name: 'cherries', price: 5.5, qty: 2 },
  { name: 'figs', price: 2.8, qty: 3 },
  { name: 'limes', price: 0.5, qty: 8 },
  { name: 'peaches', price: 1.9, qty: 4 },
  { name: 'kiwis', price: 0.9, qty: 6 },
]

const total = (items: Item[]): number =>
  items.reduce((sum, item) => sum + item.price * item.qty, 0)

const cheapest = (items: Item[]): Item | undefined =>
  [...items].sort((a, b) => a.price - b.price)[0]

const byName = (items: Item[]): Item[] =>
  [...items].sort((a, b) => a.name.localeCompare(b.name))

const receipt = (items: Item[]): string[] =>
  byName(items).map(item => \`\${item.name.padEnd(10)} \${item.qty} x \${item.price.toFixed(2)}\`)

console.log(receipt(basket).join('\\n'))
console.log('total', total(basket).toFixed(2))
console.log('cheapest', cheapest(basket)?.name)
\`\`\`

#### Math

$$
\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}
$$

#### Images

In kitty and Ghostty a PNG on a line of its own draws as a picture: a local path, \`~/\`, \`file://\` or a \`data:\` URL. Web images stay links, prismantis downloads nothing. Other terminals show the alt text in link color.

![prism band](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAAoCAIAAAAAIrR+AAACdElEQVR42u3TewcQBgAA8ZNkkkySJEmSJJOWrW3t/cyWJJlMkmQmSZIkSSaTJEmSJEmStLS0trX3smVLkiRJkiTJZCZJdrNvsP0xNu73Fc4hOBAfwyH4OA7HkTgax+J4nIiTcQpOw+k4A1/EV/FNfBtn41x8F9/DhbgY38eluBxX4mpci+vxQ/wIN+NW3I47cTfuxf14EA/jUTyOJ/EUfo3f44/4M57DC3gJr+A1vIG38A7+ir/hfXyIf/BIHsjvck/uym25KdflqlyWi3JezsoZOS3fyVfyuZyQY3JEDskB2Sd7ZJfskG2yRTbJRtkg62SNrJIVskw+kCWySBbIfJknc2SWzJQ35BV5QZ6Vp2SqPCGTZIKMkzEySkbIMBkqg2WQDPgrwAAchINxKA7DETgKx+A4nICT8Amcik/hM/g8voyv40ychXNwHs7HBbgIl+AHuAxX4Cpcg+twA27ETbgFt+EO3IV7cB8ewEN4BI/hCfwMv8Rv8TSewbN4Hi/iZbyK1/Em3sa7eA9/xwf4iD/kodyX3+RXuSO35IZckytySS7IOflFfpIf5Bs5JSfluByVw3JQ9ste2S07Zbtslc3ykXwo62WtrJaVslyWyvuyWBbKe/KuzJXZ8o68Ja/JSzJDpss0mSKTZaKMl7EyWkbKcHlchshjMvDvHvAkPo3P/TsHfIyf4Kf4xT88YABJ/rcaOGngJA2cpIGTBk7SwEkaOEkDJw2cpIGTNHDSwEkaOEkDJ2ngpIGTNHCSBk7SwEkDJ2ngJA2cNHCSBk7SwEkaOGngJA2cpIGTNHDSwEkaOEkDJw2cpIGTNHCSBk4aOMl/yZ8SRd1gPq93WQAAAABJRU5ErkJggg==)

#### Footnotes

Latency fell to 120ms[^lat] after the cache change[^cache].

Click a mark to see its note. Point at a note to light the marks that cite it. Both need Claude Code 2.1.295 or later.

[^count]: Counted at close.
[^lat]: Median of 50 runs.
[^cache]: Entries expire after 10m.

#### Diagrams

\`\`\`mermaid
flowchart LR
    R["<i>Reply</i>"] --> P["<b>Parse</b>"]
    P --> D["<u>Draw</u>"]
    D --> S["<s>Screen</s>"]
\`\`\`

\`\`\`mermaid
sequenceDiagram
    participant U as You
    participant C as Claude
    participant P as prismantis
    U->>C: prompt
    C->>P: markdown
    P-->>U: colored reply
\`\`\`

\`\`\`mermaid
xychart-beta
    title "Color options per group"
    x-axis [text, head, num, code, diag]
    y-axis "options" 0 --> 8
    bar [7, 3, 2, 6, 2]
\`\`\`

Name each series and the legend says which line is which:

\`\`\`mermaid
xychart-beta
    title "Replies per hour"
    x-axis [09, 10, 11, 12, 13]
    y-axis 0 --> 40
    line "east" [30, 34, 22, 26, 31]
    line "west" [12, 18, 25, 20, 14]
\`\`\`

A pie draws round with a legend, as a smooth picture in kitty and Ghostty. Set \`pieStyle\` to \`bars\` in \`/config\` for one bar per slice:

\`\`\`mermaid
pie showData title Time per reply stage
    "Parse" : 3
    "Draw" : 9
    "Paint" : 5
\`\`\`

\`\`\`mermaid
gantt
    title Release week
    dateFormat YYYY-MM-DD
    section Build
    Parser   :p, 2026-10-05, 2d
    Renderer :r, after p, 3d
    section Ship
    Review   :after r, 2d
    Release  :milestone, 2026-10-12, 0d
\`\`\`

A diagram wider than the terminal stays source, with a dim line saying why:

\`\`\`mermaid
flowchart TD
    Q[Queue] --> W1[Worker 1] & W2[Worker 2] & W3[Worker 3] & W4[Worker 4] & W5[Worker 5] & W6[Worker 6] & W7[Worker 7] & W8[Worker 8] & W9[Worker 9] & W10[Worker 10] & W11[Worker 11] & W12[Worker 12] & W13[Worker 13] & W14[Worker 14] & W15[Worker 15] & W16[Worker 16]
\`\`\`

A figure draws as written, its markup colored by role:

\`\`\`figure
{dim:timeout at 10 s, handler books at 12 s, retry books again}
          {note:0 s}           {note:10 s}  {note:12 s}              {note:later}
          {accent:\u258F\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u258F\u2500\u2500\u2500\u2500\u2500\u258F\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u258F}
Provider  {accent:\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588}{warn:\u2717} timeout               {accent:\u2588} retry
Handler   {ok:\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588} 200, nobody waits
Bookings  0                   {ok:1}                 {warn:2 twice}
\`\`\`

A box whose rows slip off its frame is lined up with its corner:

\`\`\`figure
{accent:\u250C\u2500 queue \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510}
{accent:\u2502} {ok:\u25CF worker 1} {accent:\u2502}
{accent:\u2502} {warn:\u25B2 worker 2 slow}      {accent:\u2502}
{accent:\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518}
\`\`\`
`;
var THEME_PREVIEW = [
  "#### Release notes",
  "",
  "**Bold**, `inline code`, 250ms and ~/src/app.ts.",
  "",
  "| Service | Status | p95 |",
  "|:--|:--|--:|",
  "| api | healthy | 120ms |",
  "| billing | degraded | 840ms |",
  "",
  "```ts",
  "const total = items.reduce((sum, item) => sum + item.qty, 0)",
  "```"
].join("\n");

// opencode/server.ts
var OPENCODE = [
  "This session runs in OpenCode, not Claude Code. The notes after this paragraph are what prismantis tells Claude in Claude Code; follow them with these OpenCode differences.",
  "OpenCode draws markdown tables, headings, lists, links and fenced code itself, and mermaid only for flowchart, sequenceDiagram, stateDiagram-v2, gantt, gitGraph and timeline. xychart-beta and pie print as source, so draw those as a figure instead.",
  "Figure blocks are drawn with their {role:text} colors. There are no copy buttons and GitHub alerts draw as plain quotes."
].join(" ");
var SYSTEM = `${OPENCODE}

${HINT}

${FIGURE_HINT}`;
var DEMO = `Reply with exactly the markdown between the START and END lines, nothing before or after it.

START
> This is the Claude Code demo. In OpenCode, copy buttons, tool rows, diff cards, alert boxes, footnotes, xychart and pie charts are not drawn yet: see opencode/README.md in the prismantis repo.
${showcaseText(PRESET_NAMES)}END`;
var server_default = {
  id: "prismantis",
  async setup(ctx) {
    await ctx.session.hook("context", (event) => {
      event.system.push({ type: "text", text: SYSTEM });
    });
    await ctx.command.transform((editor) => {
      editor.add({
        name: "prismantis",
        description: "Show the prismantis demo",
        execute: ({ sessionID, prompt, delivery }) => ctx.session.prompt({ ...prompt, sessionID, text: DEMO, delivery })
      });
    });
  }
};
export {
  server_default as default
};
