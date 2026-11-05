// opencode/tui.ts
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { bold, fg, StyledText, TextRenderable } from "@opentui/core";

// ../plugin/hooks/layout.ts
var WIDE = /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6\u{20000}-\u{3FFFD}\u20E3]|\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u;
var segmenter = new Intl.Segmenter();
var graphemes = (s) => [...segmenter.segment(s)].map((g) => g.segment);
var cells = (s) => /^[ -~]*$/.test(s) ? [...s] : graphemes(s).flatMap((g) => WIDE.test(g) ? [g, ""] : [g]);

// ../plugin/hooks/markdown.ts
var FIGURE_ROLES = ["accent", "warn", "ok", "note", "dim", "strong"];
var ROLE_MARKUP = new RegExp(`\\{(?:${FIGURE_ROLES.join("|")}):([^{}]*)\\}`, "g");
var scriptMap = (from, to) => new Map(Array.from(from).map((c, i) => [c, Array.from(to)[i]]));
var SUP = scriptMap("0123456789+-\u2212=()niabcdefghjklmoprstuvwxyzABDEGHIJKLMNOPRTUVW", "\u2070\xB9\xB2\xB3\u2074\u2075\u2076\u2077\u2078\u2079\u207A\u207B\u207B\u207C\u207D\u207E\u207F\u2071\u1D43\u1D47\u1D9C\u1D48\u1D49\u1DA0\u1D4D\u02B0\u02B2\u1D4F\u02E1\u1D50\u1D52\u1D56\u02B3\u02E2\u1D57\u1D58\u1D5B\u02B7\u02E3\u02B8\u1DBB\u1D2C\u1D2E\u1D30\u1D31\u1D33\u1D34\u1D35\u1D36\u1D37\u1D38\u1D39\u1D3A\u1D3C\u1D3E\u1D3F\u1D40\u1D41\u2C7D\u1D42");
var SUB = scriptMap("0123456789+-\u2212=()aehijklmnoprstuvx", "\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089\u208A\u208B\u208B\u208C\u208D\u208E\u2090\u2091\u2095\u1D62\u2C7C\u2096\u2097\u2098\u2099\u2092\u209A\u1D63\u209B\u209C\u1D64\u1D65\u2093");
var TINT_ON = { "2": "dim", "3": "italic", "90": "gray", "36": "cyan", "32": "green", "33": "yellow" };
var TINT_KEYS = Object.keys(TINT_ON);

// ../plugin/hooks/figure.tsx
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
var TEXT_FORMS = { "\u25B6": "\u25BA", "\u25C0": "\u25C4" };
var isRole = (name) => FIGURE_ROLES.some((role) => role === name);
var textForm = (text) => text.replace(/[▶◀]/g, (glyph) => TEXT_FORMS[glyph] ?? glyph);
var figureRuns = (line) => {
  const runs = [];
  let at = 0;
  for (const match of line.matchAll(MARKUP)) {
    const [whole, role, colonText, tagText] = match;
    const text = colonText ?? tagText ?? "";
    if (match.index > at) runs.push({ text: textForm(line.slice(at, match.index)) });
    if (text && isRole(role)) runs.push({ text: textForm(text), role });
    at = match.index + whole.length;
  }
  if (at < line.length) runs.push({ text: textForm(line.slice(at)) });
  return runs;
};
var TOP_LEFT = "\u250C\u2554\u256D";
var TOP_RIGHT = "\u2510\u2557\u256E";
var BOTTOM_LEFT = "\u2514\u255A\u2570";
var BOTTOM_RIGHT = "\u2518\u255D\u256F";
var SIDE = "\u2502\u2551\u251C\u2524\u253C\u255F\u2562\u2560\u2563";
var RULE = "\u2500\u2550";
var MAX_REFRAMES = 200;
var isOf = (set, glyph) => !!glyph && set.includes(glyph);
var cellsOf = (runs) => runs.flatMap((run) => cells(run.text).map((glyph) => ({ glyph, role: run.role })));
var runsOf = (row) => row.reduce((runs, cell) => {
  const last = runs.at(-1);
  if (last && last.role === cell.role) last.text += cell.glyph;
  else runs.push(cell.role ? { text: cell.glyph, role: cell.role } : { text: cell.glyph });
  return runs;
}, []);
var nearest = (row, from, target, set) => {
  let best = -1;
  row.forEach((cell, column) => {
    if (column > from && isOf(set, cell.glyph) && (best < 0 || Math.abs(column - target) < Math.abs(best - target))) best = column;
  });
  return best;
};
var frameAt = (grid, top, left) => {
  const row = grid[top];
  const corner = row.findIndex((cell, column) => column > left && (isOf(TOP_RIGHT, cell.glyph) || isOf(TOP_LEFT, cell.glyph)));
  if (corner < 0 || !isOf(TOP_RIGHT, row[corner]?.glyph)) return void 0;
  const edges = [corner];
  for (let line = top + 1; line < grid.length; line++) {
    const cells2 = grid[line];
    const start = cells2[left]?.glyph;
    if (isOf(BOTTOM_LEFT, start)) {
      const end = nearest(cells2, left, corner, BOTTOM_RIGHT);
      return end < 0 ? void 0 : { top, left, corner, edges: [...edges, end] };
    }
    if (!isOf(SIDE, start)) return void 0;
    const edge = nearest(cells2, left, corner, SIDE);
    if (edge < 0) return void 0;
    edges.push(edge);
  }
  return void 0;
};
var framesOf = (grid) => grid.flatMap((row, top) => row.flatMap((cell, left) => isOf(TOP_LEFT, cell.glyph) ? [frameAt(grid, top, left)] : [])).filter((frame) => frame !== void 0).sort((a, b) => a.corner - a.left - (b.corner - b.left));
var fillOf = (row, edge, border) => {
  const before = row[edge - 1]?.glyph;
  return before && isOf(RULE, before) ? before : border ? "\u2500" : " ";
};
var spareBefore = (row, edge, fill) => {
  let run = 0;
  while (row[edge - 1 - run]?.glyph === fill) run++;
  return Math.max(0, run - 1);
};
var blanks = (count, glyph, role) => Array.from({ length: count }, () => glyph === " " || !role ? { glyph } : { glyph, role });
var spacesAfter = (row, edge, most) => {
  let run = 0;
  while (run < most && row[edge + 1 + run]?.glyph === " ") run++;
  return run;
};
var firstAfter = (row, column) => row.findIndex((cell, at) => at > column && cell.glyph !== " " && cell.glyph !== "");
var place = (row, edge, target, shift, fill) => {
  if (target < edge) row.splice(target, edge - target);
  if (target > edge) row.splice(edge, 0, ...blanks(target - edge, fill, row[edge]?.role));
  if (shift > 0) row.splice(target + 1, 0, ...blanks(shift, " "));
  if (shift < 0) row.splice(target + 1, spacesAfter(row, target, -shift));
  return target !== edge || shift !== 0;
};
var pushRight = (grid, frame, frames, by) => {
  const bottom = frame.top + frame.edges.length - 1;
  const pushed = new Set(Array.from({ length: frame.edges.length }, (_, i) => frame.top + i));
  for (const other of [...frames].sort((a, b) => a.left - b.left)) {
    const rows = Array.from({ length: other.edges.length }, (_, i) => other.top + i);
    if (other.left <= frame.corner || !rows.some((row) => pushed.has(row))) continue;
    if (other.top <= bottom && other.top + other.edges.length - 1 >= frame.top && rows.every((row) => row >= frame.top && row <= bottom)) continue;
    for (const row of rows) {
      if (pushed.has(row)) continue;
      grid[row].splice(other.left, 0, ...blanks(by, " "));
      pushed.add(row);
    }
  }
};
var fit = (grid, frame, frames) => {
  const last = frame.edges.length - 1;
  const rows = frame.edges.map((_, i) => grid[frame.top + i]);
  const fills = frame.edges.map((edge, i) => fillOf(rows[i], edge, i === 0 || i === last));
  const reaches = frame.edges.map((edge, i) => i === 0 ? edge : edge - spareBefore(rows[i], edge, fills[i]));
  const target = Math.max(frame.corner, ...reaches);
  const after = firstAfter(rows[0], frame.corner);
  const shifts = frame.edges.map((edge, i) => after >= 0 && firstAfter(rows[i], edge) === after ? edge - frame.corner : 0);
  const moved = frame.edges.map((edge, i) => place(rows[i], edge, target, shifts[i], fills[i])).some(Boolean);
  if (target > frame.corner) pushRight(grid, frame, frames, target - frame.corner);
  return moved;
};
var reframe = (rows) => {
  const grid = rows.map(cellsOf);
  for (let pass = 0; pass < MAX_REFRAMES; pass++) {
    const frames = framesOf(grid);
    if (!frames.some((frame) => fit(grid, frame, frames))) break;
  }
  return grid.map(runsOf);
};

// opencode/tui.ts
var roleColor = (theme, role) => ({
  accent: theme.markdown.link,
  warn: theme.text.feedback.error.base,
  ok: theme.text.feedback.success.base,
  note: theme.text.feedback.info.base,
  dim: theme.text.muted,
  strong: theme.markdown.strong
})[role];
var figureChunks = (theme, lines) => reframe(lines.map(figureRuns)).flatMap((runs, index) => [
  ...index ? [fg(theme.markdown.codeBlock)("\n")] : [],
  ...runs.map((run) => {
    if (!run.role) return fg(theme.markdown.codeBlock)(run.text);
    const chunk = fg(roleColor(theme, run.role))(run.text);
    return run.role === "strong" ? bold(chunk) : chunk;
  })
]);
var installThemes = () => {
  const from = fileURLToPath(new URL("./themes/", import.meta.url));
  const to = join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "opencode", "themes");
  mkdirSync(to, { recursive: true });
  const files = readdirSync(from).filter((file) => file.endsWith(".json"));
  for (const file of files) copyFileSync(join(from, file), join(to, file));
  process.emit("SIGUSR2");
  return files.length;
};
var tui_default = {
  id: "prismantis",
  setup(context) {
    context.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "prismantis.themes",
          title: "Install prismantis themes",
          group: "prismantis",
          palette: true,
          slash: { name: "prismantis-themes" },
          run: () => {
            const count = installThemes();
            context.ui.toast.show({ message: `${count} prismantis themes installed, pick one in settings > Theme`, variant: "success" });
          }
        }
      ]
    }));
    return context.markdown.registerCodeBlockRenderer("figure", (token) => {
      const lines = token.text.replace(/\n+$/, "").split("\n");
      return new TextRenderable(context.renderer, {
        content: new StyledText(figureChunks(context.theme, lines)),
        width: "100%",
        height: lines.length,
        wrapMode: "none",
        marginTop: 1
      });
    });
  }
};
export {
  tui_default as default
};
