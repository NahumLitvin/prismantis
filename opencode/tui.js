// opencode/tui.ts
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join as join2 } from "node:path";
import { fileURLToPath } from "node:url";
import { bold, fg, StyledText, TextRenderable } from "@opentui/core";

// ../plugin/hooks/layout.ts
var WIDE = /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6\u{20000}-\u{3FFFD}\u20E3]|\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u;
var segmenter = new Intl.Segmenter();
var graphemes = (s) => [...segmenter.segment(s)].map((g) => g.segment);
var cells = (s) => /^[ -~]*$/.test(s) ? [...s] : graphemes(s).flatMap((g) => WIDE.test(g) ? [g, ""] : [g]);
var ZERO = /^[\p{M}\p{Default_Ignorable_Code_Point}]+$/u;
var width = (s) => /^[ -~]*$/.test(s) ? s.length : s.length === 1 ? ZERO.test(s) ? 0 : WIDE.test(s) ? 2 : 1 : graphemes(s).reduce((w, g) => ZERO.test(g) ? w : w + (WIDE.test(g) ? 2 : 1), 0);
var wrapRanges = (text, w) => {
  const br = text.indexOf("\n");
  if (br >= 0) return [...wrapRanges(text.slice(0, br), w), ...wrapRanges(text.slice(br + 1), w).map(([a, b]) => [a + br + 1, b + br + 1])];
  if (width(text) <= w) return [[0, text.length]];
  const out = [];
  let line2;
  let used = 0;
  for (const word of text.matchAll(/\S+/g)) {
    let start = word.index;
    const end = start + word[0].length;
    let size = width(word[0]);
    if (size > w) {
      if (line2) out.push(line2);
      line2 = void 0;
      let cut = start;
      let taken = 0;
      for (const g of graphemes(text.slice(start, end))) {
        const step = width(g);
        if (cut > start && taken + step > w) {
          out.push([start, cut]);
          start = cut;
          size -= taken;
          taken = 0;
          if (size <= w) break;
        }
        cut += g.length;
        taken += step;
      }
    }
    if (start === end) continue;
    const joined2 = line2 ? used + width(text.slice(line2[1], start)) + size : Infinity;
    if (line2 && joined2 <= w) {
      line2 = [line2[0], end];
      used = joined2;
    } else {
      if (line2) out.push(line2);
      line2 = [start, end];
      used = size;
    }
  }
  if (line2) out.push(line2);
  return out.length ? out : [[0, 0]];
};

// ../plugin/hooks/markdown.ts
var FIGURE_ROLES = ["accent", "warn", "ok", "note", "dim", "strong"];
var ROLE_MARKUP = new RegExp(`\\{(?:${FIGURE_ROLES.join("|")}):([^{}]*)\\}`, "g");
var PATH = /(?<![\p{L}\p{M}\p{N}_/.:])((?:~|\.{1,2})?\/[\p{L}\p{M}\p{N}_.@+-]+(?:\/[\p{L}\p{M}\p{N}_.@+-]*)*)/gu;
var WHOLE_PATH = new RegExp(`^(?:${PATH.source})$`, PATH.flags.replace("g", ""));
var PART = String.raw`[\p{L}\p{N}_@+-]+`;
var NAME = String.raw`\.?${PART}(?:\.${PART})*`;
var DRIVE_PATH = new RegExp(String.raw`[A-Za-z]:[\\/](?:${NAME}[\\/])*(?:${NAME})?`, "gu");
var NAMED = {
  amp: "&",
  AMP: "&",
  lt: "<",
  LT: "<",
  gt: ">",
  GT: ">",
  quot: '"',
  QUOT: '"',
  apos: "'",
  nbsp: "\xA0",
  COPY: "\xA9",
  REG: "\xAE",
  copy: "\xA9",
  reg: "\xAE",
  trade: "\u2122",
  mdash: "\u2014",
  ndash: "\u2013",
  hellip: "\u2026",
  minus: "\u2212",
  times: "\xD7",
  divide: "\xF7",
  plusmn: "\xB1",
  deg: "\xB0",
  middot: "\xB7",
  bull: "\u2022",
  sect: "\xA7",
  para: "\xB6",
  micro: "\xB5",
  laquo: "\xAB",
  raquo: "\xBB",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201C",
  rdquo: "\u201D",
  sbquo: "\u201A",
  bdquo: "\u201E",
  euro: "\u20AC",
  pound: "\xA3",
  yen: "\xA5",
  cent: "\xA2",
  frac12: "\xBD",
  frac14: "\xBC",
  frac34: "\xBE",
  sup2: "\xB2",
  sup3: "\xB3",
  larr: "\u2190",
  rarr: "\u2192",
  uarr: "\u2191",
  darr: "\u2193",
  harr: "\u2194",
  lArr: "\u21D0",
  rArr: "\u21D2",
  hArr: "\u21D4",
  le: "\u2264",
  ge: "\u2265",
  ne: "\u2260",
  asymp: "\u2248",
  infin: "\u221E",
  check: "\u2713",
  cross: "\u2717",
  star: "\u2606",
  hearts: "\u2665",
  ensp: "\u2002",
  emsp: "\u2003",
  thinsp: "\u2009"
};
var ENTITY = /&(?:#(\d{1,7})|#[xX]([\da-fA-F]{1,6})|([A-Za-z][A-Za-z\d]{1,31}));/g;
var codePoint = (n) => String.fromCodePoint(n > 0 && n <= 1114111 && (n < 55296 || n > 57343) ? n : 65533);
var decodeEntities = (text) => text.includes("&") ? text.replace(ENTITY, (m, dec, hex2, name) => name ? Object.hasOwn(NAMED, name) ? NAMED[name] : m : codePoint(dec ? Number(dec) : parseInt(hex2, 16))).replace(CONTROL, "") : text;
var scriptMap = (from, to) => new Map(Array.from(from).map((c, i) => [c, Array.from(to)[i]]));
var SUP = scriptMap("0123456789+-\u2212=()niabcdefghjklmoprstuvwxyzABDEGHIJKLMNOPRTUVW", "\u2070\xB9\xB2\xB3\u2074\u2075\u2076\u2077\u2078\u2079\u207A\u207B\u207B\u207C\u207D\u207E\u207F\u2071\u1D43\u1D47\u1D9C\u1D48\u1D49\u1DA0\u1D4D\u02B0\u02B2\u1D4F\u02E1\u1D50\u1D52\u1D56\u02B3\u02E2\u1D57\u1D58\u1D5B\u02B7\u02E3\u02B8\u1DBB\u1D2C\u1D2E\u1D30\u1D31\u1D33\u1D34\u1D35\u1D36\u1D37\u1D38\u1D39\u1D3A\u1D3C\u1D3E\u1D3F\u1D40\u1D41\u2C7D\u1D42");
var SUB = scriptMap("0123456789+-\u2212=()aehijklmnoprstuvx", "\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089\u208A\u208B\u208B\u208C\u208D\u208E\u2090\u2091\u2095\u1D62\u2C7C\u2096\u2097\u2098\u2099\u2092\u209A\u1D63\u209B\u209C\u1D64\u1D65\u2093");
var CONTROL = /\u001b\][^\u0007\u001b\n]{0,1024}(?:\u0007|\u001b\\)?|\u001b\[[0-?]*[ -/]*[@-~]|\u001b[@-_]?|[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g;
var TINT_ON = { "2": "dim", "3": "italic", "90": "gray", "36": "cyan", "32": "green", "33": "yellow" };
var TINT_KEYS = Object.keys(TINT_ON);

// ../plugin/hooks/render.tsx
var HTTP_LINKS_FROM = [2, 1, 289];
var EDITOR_LINKS_FROM = [2, 1, 294];
var CLICKABLE_MARKS_FROM = [2, 1, 295];
var MONO_TEXT_FROM = [2, 1, 299];
var releaseFrom = (from) => (base) => {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(base ?? "");
  if (!m) return false;
  const version = [Number(m[1]), Number(m[2]), Number(m[3])];
  const at = version.findIndex((n, i) => n !== from[i]);
  return at === -1 || version[at] > from[at];
};
var takesHttpLinks = releaseFrom(HTTP_LINKS_FROM);
var takesEditorLinks = releaseFrom(EDITOR_LINKS_FROM);
var takesClickableMarks = releaseFrom(CLICKABLE_MARKS_FROM);
var takesMonoText = releaseFrom(MONO_TEXT_FROM);
var LOOSE_PATH = new RegExp(String.raw`(?<![\p{L}\p{N}_/\\.:~@+-])(?:${DRIVE_PATH.source}|${NAME}(?:\/${NAME})*\/(?:${NAME})?|${PART}(?:\.${PART})+)(?![\p{L}\p{N}_/\\@+-]|\.[\p{L}\p{N}])`, "gu");
var KEPT_CHARS = 1e6;
var keptTotals = /* @__PURE__ */ new WeakMap();
var keptChars = (cache) => {
  const known = keptTotals.get(cache);
  if (known?.size === cache.size) return known.chars;
  let chars = 0;
  for (const key of cache.keys()) chars += key.length;
  return chars;
};
var remember = (cache, key, make, limit = 200) => {
  const hit = cache.get(key);
  if (hit !== void 0) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const value = make();
  let chars = keptChars(cache) + (cache.has(key) ? 0 : key.length);
  cache.set(key, value);
  for (const old of cache.keys()) {
    if (cache.size <= limit && (chars <= KEPT_CHARS || old === key)) break;
    chars -= old.length;
    cache.delete(old);
  }
  keptTotals.set(cache, { size: cache.size, chars });
  return value;
};
var BOX_INDENT = 2;
var SHELL_FRAME = BOX_INDENT + 4;

// ../plugin/hooks/figure.tsx
var FIGURE_MAX_COLUMNS = 100;
var FIGURE_SAFE_COLUMNS = 74;
var RAW_MAX_LINE = FIGURE_MAX_COLUMNS * 4;
var FIGURE_GLYPHS = "\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2550\u2551\u2192\u2190\u25BA\u25C4\u25B2\u25BC\u2713\u2717\u25CF\u25CB\u2588\u258F\u25A0\u25A1\xB7";
var FIGURE_HINT = [
  "A fenced block whose opening line is exactly ```figure is drawn as a text picture, as written.",
  "Prefer one over mermaid when position carries meaning: durations racing on a time axis, a screen layout, phases, before/after; mermaid stays for plain flows and charts; none for short answers, code changes or reports. The prose never retells the picture.",
  "When asked to explain, compare or plan something and pictures would help, build the reply around them, with the core on the first screen as a picture or a sentence.",
  "Figures only: color as {warn:disk full}, not nested: accent for lines, warn for risk, ok for healthy, note for time, dim for asides, strong for emphasis.",
  `At most ${FIGURE_SAFE_COLUMNS} columns, glyphs one column wide such as ${FIGURE_GLYPHS}, no emoji or tabs; markup takes no columns, so align on the drawn text and pad box rows to the top border. CJK letters take two columns, count them twice. Draw a time axis with edge ticks like \u258F\u2500\u2500\u2500\u258F\u2500\u2500\u2500\u258F, not \u251C\u253C\u2524: \u2588 fills its cell, \u251C\u253C\u2524 sit mid-cell.`
].join(" ");
var MARKUP = new RegExp(`\\{(${FIGURE_ROLES.join("|")})(?::([^{}]*)\\}|\\}([^{}]*)\\{\\/\\1\\})`, "g");
var TEXT_FORMS = { "\u25B6": "\u25BA", "\u25C0": "\u25C4" };
var isRole = (name) => FIGURE_ROLES.some((role) => role === name);
var textForm = (text) => text.replace(/[▶◀]/g, (glyph) => TEXT_FORMS[glyph] ?? glyph);
var figureRuns = (line2) => {
  const runs = [];
  let at = 0;
  for (const match of line2.matchAll(MARKUP)) {
    const [whole, role, colonText, tagText] = match;
    const text = colonText ?? tagText ?? "";
    if (match.index > at) runs.push({ text: textForm(line2.slice(at, match.index)) });
    if (text && isRole(role)) runs.push({ text: textForm(text), role });
    at = match.index + whole.length;
  }
  if (at < line2.length) runs.push({ text: textForm(line2.slice(at)) });
  return runs;
};
var TOP_LEFT = "\u250C\u2554\u256D";
var TOP_RIGHT = "\u2510\u2557\u256E";
var BOTTOM_LEFT = "\u2514\u255A\u2570";
var BOTTOM_RIGHT = "\u2518\u255D\u256F";
var SIDE = "\u2502\u2551\u251C\u2524\u253C\u255F\u2562\u2560\u2563";
var RULE = "\u2500\u2550";
var MAX_REFRAMES = 200;
var isOf = (set2, glyph) => !!glyph && set2.includes(glyph);
var cellsOf = (runs) => runs.flatMap((run) => cells(run.text).map((glyph) => ({ glyph, role: run.role })));
var runsOf = (row) => row.reduce((runs, cell) => {
  const last = runs.at(-1);
  if (last && last.role === cell.role) last.text += cell.glyph;
  else runs.push(cell.role ? { text: cell.glyph, role: cell.role } : { text: cell.glyph });
  return runs;
}, []);
var nearest = (row, from, target, set2) => {
  let best = -1;
  row.forEach((cell, column) => {
    if (column > from && isOf(set2, cell.glyph) && (best < 0 || Math.abs(column - target) < Math.abs(best - target))) best = column;
  });
  return best;
};
var frameAt = (grid, top, left) => {
  const row = grid[top];
  const corner = row.findIndex((cell, column) => column > left && (isOf(TOP_RIGHT, cell.glyph) || isOf(TOP_LEFT, cell.glyph)));
  if (corner < 0 || !isOf(TOP_RIGHT, row[corner]?.glyph)) return void 0;
  const edges = [corner];
  for (let line2 = top + 1; line2 < grid.length; line2++) {
    const cells2 = grid[line2];
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
    const rows2 = Array.from({ length: other.edges.length }, (_, i) => other.top + i);
    if (other.left <= frame.corner || !rows2.some((row) => pushed.has(row))) continue;
    if (other.top <= bottom && other.top + other.edges.length - 1 >= frame.top && rows2.every((row) => row >= frame.top && row <= bottom)) continue;
    for (const row of rows2) {
      if (pushed.has(row)) continue;
      grid[row].splice(other.left, 0, ...blanks(by, " "));
      pushed.add(row);
    }
  }
};
var fit = (grid, frame, frames) => {
  const last = frame.edges.length - 1;
  const rows2 = frame.edges.map((_, i) => grid[frame.top + i]);
  const fills = frame.edges.map((edge, i) => fillOf(rows2[i], edge, i === 0 || i === last));
  const reaches = frame.edges.map((edge, i) => i === 0 ? edge : edge - spareBefore(rows2[i], edge, fills[i]));
  const target = Math.max(frame.corner, ...reaches);
  const after = firstAfter(rows2[0], frame.corner);
  const shifts = frame.edges.map((edge, i) => after >= 0 && firstAfter(rows2[i], edge) === after ? edge - frame.corner : 0);
  const moved = frame.edges.map((edge, i) => place(rows2[i], edge, target, shifts[i], fills[i])).some(Boolean);
  if (target > frame.corner) pushRight(grid, frame, frames, target - frame.corner);
  return moved;
};
var reframe = (rows2) => {
  const grid = rows2.map(cellsOf);
  for (let pass = 0; pass < MAX_REFRAMES; pass++) {
    const frames = framesOf(grid);
    if (!frames.some((frame) => fit(grid, frame, frames))) break;
  }
  return grid.map(runsOf);
};

// ../plugin/hooks/charts.ts
var DAY = 864e5;
var STEPS = [1, 5, 15, 30, 60, 120, 360, 720, 1440, 2880, 10080, 20160, 43200, 129600, 525600].map((m) => m * 6e4);
var UNIT = { ms: 1, s: 1e3, m: 6e4, h: 36e5, d: DAY, w: 7 * DAY };
var TAGS = /^(done|active|crit|milestone)$/i;
var IGNORED = /^(dateformat|axisformat|tickinterval|excludes|includes|todaymarker|weekday|weekend|inclusiveenddates|topaxis|displaymode|acctitle|accdescr|click)\b/i;
var body = (source) => source.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("%%"));
var fit2 = (label, max) => {
  if (width(label) <= max) return label;
  let out = "";
  for (const g of graphemes(label)) {
    if (width(out + g) > max - 1) break;
    out += g;
  }
  return `${out.trimEnd()}\u2026`;
};
var pad = (text, size) => text + " ".repeat(Math.max(0, size - width(text)));
var clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
var QUADRANTS = " \u2598\u259D\u2580\u2596\u258C\u259E\u259B\u2597\u259A\u2590\u259C\u2584\u2599\u259F\u2588";
var quadrantCell = (sliceAt, cx, cy) => {
  let mask = 0;
  const votes = /* @__PURE__ */ new Map();
  for (const [bit, sx, sy] of [[1, 0, 0], [2, 1, 0], [4, 0, 1], [8, 1, 1]]) {
    const slice = sliceAt(cx + (sx + 0.5) / 2, 2 * cy + sy + 0.5);
    if (slice < 0) continue;
    mask |= bit;
    votes.set(slice, (votes.get(slice) ?? 0) + 1);
  }
  return [QUADRANTS[mask], mask ? [...votes].sort((a, b) => b[1] - a[1])[0][0] : -1];
};
var roundPie = (colors, title, slices, legend3, columns, aspect) => {
  const radius = Math.min(6, Math.floor((columns - 10 - Math.max(...legend3.map(width))) / (2 * aspect)));
  if (radius < 4 || slices.length > colors) return null;
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  let seen = 0;
  const bounds = slices.map((s) => seen += s.value / total);
  const sliceAt = (x, y) => {
    const dx = x - aspect * radius;
    const dy = (y - 2 * radius) * aspect / 2;
    if (dx * dx + dy * dy > aspect * aspect * radius * radius) return -1;
    const turn = (Math.atan2(dx, -dy) / (2 * Math.PI) + 1) % 1;
    return bounds.findIndex((b) => turn < b);
  };
  const cells2 = Array.from({ length: 2 * radius }, (_, cy) => Array.from({ length: Math.round(2 * aspect * radius) }, (_2, cx) => quadrantCell(sliceAt, cx, cy)));
  const rows2 = cells2.map((row) => row.map(([glyph]) => glyph).join(""));
  const hues = cells2.map((row) => row.map(([, hue]) => hue));
  const offset = Math.floor((rows2.length - legend3.length) / 2);
  legend3.forEach((line2, i) => {
    rows2[offset + i] += `   \u2588\u2588 ${line2}`;
    hues[offset + i].push(-1, -1, -1, i, i);
  });
  return { text: [...title ? [title.trim()] : [], ...rows2.map((r) => r.trimEnd())].join("\n"), slices: [...title ? [[]] : [], ...hues], pie: { bounds, radius, legend: legend3, title: title?.trim() || void 0 } };
};
var shares = (slices, showData) => {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const labelWidth = Math.max(...slices.map((s) => width(s.label)));
  const percents = slices.map((s) => {
    const pct = Math.round(s.value / total * 100);
    return `${pct === 0 && s.value > 0 ? "<1" : pct}%`;
  });
  const valueWidth = Math.max(...slices.map((s) => s.text.length));
  const pctWidth = Math.max(...percents.map((p) => p.length));
  return slices.map((s, i) => ({ label: pad(s.label, labelWidth), tail: `${showData ? `${s.text.padStart(valueWidth)}  ` : ""}${percents[i].padStart(pctWidth)}` }));
};
var barPie = (slices, rows2, ascii, columns) => {
  const max = slices[0].value;
  const bar = clamp(columns - 6 - width(rows2[0].label) - width(rows2[0].tail), 8, 40);
  return slices.map((s, i) => {
    const cells2 = s.value > 0 ? Math.max(1, Math.round(s.value / max * bar)) : 0;
    return `${rows2[i].label}  ${(ascii ? "#" : "\u2588").repeat(cells2).padEnd(bar)} ${rows2[i].tail}`;
  });
};
var unquote = (text) => text?.trim().replace(/^"(.*)"$/, "$1");
var pieLines = (lines, heading, data) => {
  let title = heading;
  let showData = data;
  const slices = [];
  for (const line2 of lines) {
    const named = /^title\s+(.*)$/i.exec(line2);
    if (named) title = unquote(named[1]);
    else if (/^showData$/i.test(line2)) showData = true;
    else if (!/^acc(Title|Descr)\b/.test(line2)) {
      const slice = /^"([^"]*)"\s*:\s*([\d.]+)$/.exec(line2);
      const value = Number(slice?.[2]);
      if (!slice || !Number.isFinite(value)) return null;
      slices.push({ label: fit2(slice[1], 20), text: slice[2], value });
    }
  }
  return slices.reduce((sum, s) => sum + s.value, 0) > 0 ? { title, showData, slices } : null;
};
var pieText = (source, ascii, columns, colors = 0, aspect = 2) => {
  const [first = "", ...rest] = body(source);
  const head = /^pie\b(\s+showData)?(?:\s+title\s+(.*))?$/i.exec(first);
  if (!head) return null;
  const parsed = pieLines(rest, unquote(head[2]), !!head[1]);
  if (!parsed) return null;
  const { title, showData, slices } = parsed;
  slices.sort((a, b) => b.value - a.value);
  const rows2 = shares(slices, showData);
  return roundPie(ascii ? 0 : colors, title, slices, rows2.map((r) => `${r.label} ${r.tail}`), columns, aspect) ?? { text: [...title ? [title.trim()] : [], ...barPie(slices, rows2, ascii, columns)].join("\n") };
};
var dateParser = (format) => {
  const order = [];
  let pattern = "";
  for (const [token, literal] of format.matchAll(/\[([^\]]*)\]|YYYY|MM|DD|HH|mm|ss|[\s\S]/g)) {
    if (token.length > 1 && literal === void 0) {
      order.push(token);
      pattern += token === "YYYY" ? "(\\d{4})" : "(\\d{1,2})";
    } else if (/^[YMDHhmsSAaXxQwk]$/.test(token)) return null;
    else pattern += (literal ?? token).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  const exact = new RegExp(`^${pattern}$`);
  return (text) => {
    const m = exact.exec(text);
    if (!m) return void 0;
    const part = (token, fallback) => order.includes(token) ? Number(m[order.indexOf(token) + 1]) : fallback;
    return Date.UTC(part("YYYY", 1970), part("MM", 1) - 1, part("DD", 1), part("HH", 0), part("mm", 0), part("ss", 0));
  };
};
var stamp = (t, span, sameYear) => {
  const iso = new Date(t).toISOString();
  return span < 2 * DAY ? iso.slice(11, 16) : sameYear ? iso.slice(5, 10) : iso.slice(0, 10);
};
var EIGHTHS = " \u258F\u258E\u258D\u258C\u258B\u258A\u2589";
var fineBar = (from, to, fallback) => {
  const half = from % 1 >= 0.25 && from % 1 < 0.75;
  const start = half ? Math.floor(from) + 1 : Math.round(from);
  const eighths = Math.round(to * 8);
  const whole = Math.floor(eighths / 8) - start;
  if (whole < 1) return " ".repeat(fallback) + "\u2588";
  return " ".repeat(start - (half ? 1 : 0)) + (half ? "\u2590" : "") + "\u2588".repeat(whole) + (eighths % 8 > 1 ? EIGHTHS[eighths % 8] : "");
};
var ganttText = (source, ascii, columns) => {
  const [first = "", ...rest] = body(source);
  if (!/^gantt$/i.test(first)) return null;
  const format = /^dateFormat\s+(.+)$/im.exec(rest.join("\n"))?.[1]?.trim() ?? "YYYY-MM-DD";
  const parse6 = dateParser(format);
  if (!parse6) return null;
  let title;
  const rows2 = [];
  const ends = /* @__PURE__ */ new Map();
  let previous;
  for (const line2 of rest) {
    const named = /^title\s+(.*)$/i.exec(line2);
    const section = /^section\s+(.*)$/i.exec(line2);
    if (named) title = named[1];
    else if (section) rows2.push({ section: fit2(section[1].trim(), 24) });
    else if (!IGNORED.test(line2)) {
      const colon = line2.indexOf(":");
      if (colon < 1) return null;
      const items = line2.slice(colon + 1).split(",").map((s) => s.trim());
      let milestone = false;
      while (items.length > 1 && TAGS.test(items[0])) milestone = /milestone/i.test(items.shift()) || milestone;
      if (items.length > 3) return null;
      const [id, from, to] = items.length === 3 ? items : items.length === 2 ? [void 0, ...items] : [void 0, void 0, items[0]];
      const after = /^after\s+(.+)$/i.exec(from ?? "");
      const start = from === void 0 ? previous : after ? Math.max(...after[1].split(/\s+/).map((ref) => ends.get(ref)?.end ?? NaN)) : parse6(from);
      if (start === void 0 || !Number.isFinite(start)) return null;
      const duration = /^(\d+(?:\.\d+)?)(ms|s|m|h|d|w)$/.exec(to ?? "");
      const until = /^until\s+(\S+)$/i.exec(to ?? "");
      const end = duration ? start + Number(duration[1]) * UNIT[duration[2]] : until ? ends.get(until[1])?.start : parse6(to ?? "");
      if (end === void 0 || end < start) return null;
      if (id) ends.set(id, { start, end });
      previous = end;
      rows2.push({ name: fit2(line2.slice(0, colon).trim(), 22), start, end, milestone });
    }
  }
  const tasks = rows2.flatMap((r) => "name" in r ? [r] : []);
  if (!tasks.length) return null;
  const min = Math.min(...tasks.map((t) => t.start));
  const max = Math.max(...tasks.map((t) => t.end));
  const span = max - min || DAY;
  const sameYear = new Date(min).getUTCFullYear() === new Date(max).getUTCFullYear();
  const labelWidth = Math.max(...rows2.map((r) => "name" in r ? width(r.name) + 2 : width(r.section)));
  const chart = clamp(columns - 6 - labelWidth, 10, 60);
  const col = (t) => Math.round((t - min) / span * chart);
  const tickText = stamp(min, span, sameYear).length;
  const room = Math.max(1, Math.floor(chart / (tickText + 3)));
  const step = STEPS.find((ms) => span / ms <= room) ?? span;
  const ticks = Array.from({ length: Math.floor(span / step) + 1 }, (_, i) => min + i * step);
  const axis = [...(ascii ? "-" : "\u2500").repeat(chart + 1)];
  const labels2 = [..." ".repeat(chart + 1)];
  let free = 0;
  for (const t of ticks) {
    const at = col(t);
    axis[at] = ascii ? "|" : "\u258F";
    const text = stamp(t, span, sameYear);
    const from = Math.min(at, chart + 1 - text.length);
    if (from < free) continue;
    labels2.splice(from, text.length, ...text);
    free = from + text.length + 1;
  }
  const lead = " ".repeat(labelWidth + 2);
  const lines = rows2.map((r) => {
    if (!("name" in r)) return r.section;
    const a = Math.min(col(r.start), chart - 1);
    const cells2 = r.milestone ? ascii ? "*" : "\u25C6" : ascii ? "#".repeat(Math.max(1, col(r.end) - a)) : null;
    return `${pad(`  ${r.name}`, labelWidth)}  ${cells2 === null ? fineBar((r.start - min) / span * chart, (r.end - min) / span * chart, a) : " ".repeat(a) + cells2}`;
  });
  return [...title ? [title.trim()] : [], lead + labels2.join("").trimEnd(), lead + axis.join(""), ...lines].join("\n");
};

// ../plugin/hooks/textart.ts
var LINE_HUE = -2;
var ARROW_HUE = -3;
var GOOD_HUE = -4;
var BAD_HUE = -5;
var fit3 = (label, max) => {
  if (width(label) <= max) return label;
  let out = "";
  for (const g of graphemes(label)) {
    if (width(out + g) > max - 1) break;
    out += g;
  }
  return `${out.trimEnd()}\u2026`;
};
var oneLine = (label) => label.replace(/<br\s*\/?>/gi, " ").replace(/\s+/g, " ").trim();
var unquote2 = (text) => text.trim().replace(/^"(.*)"$/, "$1");
var line = (...parts) => ({ text: parts.map(([t]) => t).join(""), hue: parts.flatMap(([t, h]) => cells(t).map(() => h)) });
var blank = (rows2, cols) => ({
  grid: Array.from({ length: rows2 }, () => Array(cols).fill(" ")),
  hues: Array.from({ length: rows2 }, () => Array(cols).fill(-1))
});
var paint = (c, row, col, text, hue) => cells(text).forEach((ch, k) => {
  c.grid[row][col + k] = ch;
  c.hues[row][col + k] = hue;
});
var rows = (c) => c.grid.map((row, r) => ({ text: row.join(""), hue: c.hues[r] }));
var art = (lines) => ({ text: lines.map((l) => l.text.trimEnd()).join("\n"), slices: lines.map((l) => l.hue) });
var wrap = (text, w, most) => {
  const lines = wrapRanges(text, w).map(([a, b]) => text.slice(a, b).trim());
  return lines.length > most ? [...lines.slice(0, most - 1), fit3(lines.slice(most - 1).join(" "), w)] : lines;
};
var withoutBlocks = (lines) => {
  let open = false;
  return lines.filter((l) => {
    const starts = /^accDescr\s*\{/i.test(l);
    const keep = !open && !starts;
    if (starts || open) open = !l.includes("}");
    return keep;
  });
};

// ../plugin/hooks/gitgraph.ts
var BOX = { h: "\u2500", v: "\u2502", cross: "\u253C", tee: ["\u251C", "\u2524"], end: ["\u2570", "\u256F"], open: "\u256E", dots: { normal: "\u25CF", highlight: "\u25A0", reverse: "\u2717" } };
var PLAIN = { h: "-", v: "|", cross: "+", tee: ["+", "+"], end: ["+", "+"], open: "+", dots: { normal: "*", highlight: "#", reverse: "x" } };
var IGNORED2 = /^(accTitle|accDescr|title)\b/i;
var FLIP = { "\u256E": "\u256F", "\u256F": "\u256E", "\u2570": "\u256D", "\u256D": "\u2570" };
var STEP = 3;
var optionsOf = (text) => Object.fromEntries([...text.matchAll(/(\w+):\s*("([^"]*)"|[^\s"]+)/g)].map((m) => [m[1].toLowerCase(), m[3] ?? m[2]]));
var markOf = (type) => {
  const mark = (type ?? "normal").toLowerCase();
  return mark === "normal" || mark === "highlight" || mark === "reverse" ? mark : null;
};
var commit = (g, rest, label) => {
  const o = optionsOf(rest);
  const mark = markOf(o.type);
  if (!mark || o.id && g.ids.has(o.id)) return false;
  if (o.id) g.ids.set(o.id, g.current);
  g.rows.push({ kind: "commit", lane: g.current, label: label ?? o.id ?? "", tag: o.tag, mark });
  return true;
};
var merge = (g, rest) => {
  const [, name = "", more = ""] = /^("[^"]*"|\S+)\s*(.*)$/.exec(rest) ?? [];
  const from = g.names.indexOf(unquote2(name));
  const o = optionsOf(more);
  const mark = markOf(o.type);
  if (from < 0 || from === g.current || !mark || o.id && g.ids.has(o.id)) return false;
  if (o.id) g.ids.set(o.id, g.current);
  g.rows.push({ kind: "merge", from, to: g.current, label: o.id ?? "", tag: o.tag, mark });
  return true;
};
var branch = (g, rest) => {
  const name = unquote2(rest.replace(/\s+order:\s*\d+\s*$/i, ""));
  if (!name || g.names.includes(name)) return false;
  g.names.push(name);
  g.rows.push({ kind: "fork", from: g.current, to: g.names.length - 1 });
  g.current = g.names.length - 1;
  return true;
};
var checkout = (g, rest) => {
  g.current = g.names.indexOf(unquote2(rest));
  return g.current >= 0;
};
var pick = (g, rest) => {
  const id = optionsOf(rest).id;
  return !!id && g.ids.has(id) && g.ids.get(id) !== g.current && commit(g, rest.replace(/\bid:\s*("[^"]*"|\S+)/, ""), `pick ${id}`);
};
var COMMANDS = { commit, merge, branch, checkout, switch: checkout, "cherry-pick": pick };
var parse = (source) => {
  const [first = "", ...rest] = withoutBlocks(source.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("%%")));
  const head = /^gitGraph(?:\s+(LR|TB|BT))?\s*:?$/i.exec(first);
  if (!head) return null;
  const g = { names: ["main"], current: 0, ids: /* @__PURE__ */ new Map(), rows: [], upward: head[1]?.toUpperCase() === "BT" };
  for (const text of rest) {
    if (IGNORED2.test(text)) continue;
    const [, word = "", args = ""] = /^(\S+)\s*(.*)$/.exec(text) ?? [];
    const key = word.toLowerCase();
    if (!Object.hasOwn(COMMANDS, key) || !COMMANDS[key](g, args)) return null;
  }
  return g.rows.some((r) => r.kind !== "fork") ? g : null;
};
var lanesOf = (row) => row.kind === "commit" ? [row.lane] : [row.from, row.to];
var spans = (g) => {
  const span = g.names.map((_, i) => [i ? Infinity : 0, 0]);
  g.rows.forEach((row, r) => {
    if (row.kind === "fork") span[row.to][0] = r;
    for (const lane of lanesOf(row)) span[lane][1] = r;
  });
  return span;
};
var across = (c, glyph, r, [from, to], hue, alive) => {
  const [low, high] = [Math.min(from, to), Math.max(from, to)];
  for (let x = low * STEP + 1; x < high * STEP; x++) {
    const crossed = x % STEP === 0 && alive(x / STEP, r);
    paint(c, r, x, crossed ? glyph.cross : glyph.h, crossed ? x / STEP : hue);
  }
};
var drawRow = (c, glyph, row, r, alive) => {
  if (row.kind === "commit") return paint(c, r, row.lane * STEP, glyph.dots[row.mark], row.lane);
  const hue = row.kind === "fork" ? row.to : row.from;
  across(c, glyph, r, [row.from, row.to], hue, alive);
  const side2 = row.from < row.to ? 0 : 1;
  paint(c, r, row.from * STEP, (alive(row.from, r + 1) ? glyph.tee : glyph.end)[side2], row.from);
  if (row.kind === "fork") paint(c, r, row.to * STEP, glyph.open, row.to);
  else paint(c, r, row.to * STEP, glyph.dots[row.mark], row.to);
};
var labelOf = (g, row, room) => {
  if (row.kind === "fork") return [[fit3(g.names[row.to], room), row.to]];
  const tag = row.tag ? fit3(` [${row.tag}]`, Math.max(1, room - 2)) : "";
  const auto = row.kind === "merge" && !row.label;
  const label = fit3(auto ? `merge ${g.names[row.from]}` : row.label, Math.max(1, room - width(tag)));
  return [
    [label, auto ? LINE_HUE : -1],
    [tag, ARROW_HUE]
  ];
};
var legend = (names, cols) => {
  const out = [];
  names.forEach((name, i) => {
    const last = out.at(-1);
    const next = fit3(name, cols);
    if (last && width(last.text) + 3 + width(next) <= cols) out[out.length - 1] = { text: `${last.text}   ${next}`, hue: [...last.hue, -1, -1, -1, ...line([next, i]).hue] };
    else out.push(line([next, i]));
  });
  return out;
};
var gitGraphText = (source, ascii, columns) => {
  const g = parse(source);
  if (!g) return null;
  const glyph = ascii ? PLAIN : BOX;
  const cols = Math.max(24, columns - 4);
  const span = spans(g);
  const alive = (lane, at) => span[lane][0] <= at && at <= span[lane][1];
  const width2 = g.names.length * STEP - 2;
  const c = blank(g.rows.length, width2);
  g.rows.forEach((row, r) => {
    g.names.forEach((_, lane) => alive(lane, r) && paint(c, r, lane * STEP, glyph.v, lane));
    drawRow(c, glyph, row, r, alive);
  });
  if (g.upward) c.grid.forEach((row) => row.forEach((ch, x) => row[x] = FLIP[ch] ?? ch));
  const room = Math.max(1, cols - width2 - 2);
  const drawn = rows(c).map((l, r) => {
    const parts = labelOf(g, g.rows[r], room);
    const rest = line(["  ", -1], ...parts);
    return { text: l.text + rest.text, hue: [...l.hue, ...rest.hue] };
  });
  return art([...g.upward ? drawn.reverse() : drawn, line(["", -1]), ...legend(g.names, cols)]);
};

// ../plugin/hooks/journey.ts
var ROUND = { h: "\u2500", v: "\u2502", fall: ["\u256E", "\u2570"], rise: ["\u256F", "\u256D"], dot: "\u25CF" };
var PLAIN2 = { h: "-", v: "|", fall: ["+", "+"], rise: ["+", "+"], dot: "o" };
var IGNORED3 = /^(accTitle|accDescr)\b/i;
var TASK = /^(.+?)\s*:\s*(\d+(?:\.\d+)?)\s*(?::(.*))?$/;
var GUTTER = 2;
var MIN_STEP = 8;
var MAX_STEP = 16;
var readLine = (j, text) => {
  const title = /^title\s+(.*)$/i.exec(text);
  const section = /^section\s+([^:]*)$/i.exec(text);
  if (title) j.title = unquote2(title[1]);
  if (section) j.sections.push(unquote2(section[1]));
  if (title || section) return true;
  if (IGNORED3.test(text)) return true;
  const m = TASK.exec(text);
  const score = Number(m?.[2]);
  if (!m || score < 1 || score > 5) return false;
  const actors = (m[3] ?? "").split(",").map((a) => a.trim()).filter(Boolean);
  j.tasks.push({ name: oneLine(unquote2(m[1])), score, actors, section: j.sections.length - 1 });
  return true;
};
var parse2 = (source) => {
  const lines = source.split("\n").map((l) => l.replace(/#.*$/, "").trim()).filter((l) => l && !l.startsWith("%%"));
  const [first = "", ...rest] = withoutBlocks(lines);
  if (!/^journey$/i.test(first)) return null;
  const j = { sections: [], tasks: [] };
  for (const text of rest) if (!readLine(j, text)) return null;
  return j.tasks.length ? j : null;
};
var level = (score) => 5 - Math.round(score);
var mood = (score) => score >= 4 ? GOOD_HUE : score <= 2 ? BAD_HUE : -1;
var link = (c, g, [r1, c1], [r2, c2]) => {
  if (r1 === r2) return paint(c, r1, c1 + 1, g.h.repeat(c2 - c1 - 1), LINE_HUE);
  const m = Math.floor((c1 + c2) / 2);
  const [turn, land] = r2 > r1 ? g.fall : g.rise;
  paint(c, r1, c1 + 1, g.h.repeat(m - c1 - 1) + turn, LINE_HUE);
  for (let r = Math.min(r1, r2) + 1; r < Math.max(r1, r2); r++) paint(c, r, m, g.v, LINE_HUE);
  paint(c, r2, m, land + g.h.repeat(c2 - m - 1), LINE_HUE);
};
var spans2 = (tasks) => tasks.reduce((out, t, i) => {
  const last = out.at(-1);
  if (last && last[0] === t.section) last[1]++;
  else out.push([t.section, 1, i]);
  return out;
}, []);
var sectionLine = (j, g, step) => {
  if (!j.sections.length) return [];
  const parts = spans2(j.tasks).map(([section, count]) => {
    const room = count * step - 1;
    const name = section < 0 ? "" : fit3(j.sections[section], room);
    const gap = room - width(name);
    const rule = name && gap >= 2 ? ` ${g.h.repeat(gap - 1)}` : " ".repeat(gap);
    return [`${name}${rule} `, section];
  });
  return [line([" ".repeat(GUTTER), -1], ...parts)];
};
var labels = (texts, step, hue) => {
  const wrapped = texts.map((t) => t ? wrap(t, step - 1, 2) : []);
  return Array.from(
    { length: Math.max(0, ...wrapped.map((w) => w.length)) },
    (_, r) => line(
      [" ".repeat(GUTTER), -1],
      ...wrapped.map((w) => {
        const text = w[r] ?? "";
        const left = Math.floor((step - 1 - width(text)) / 2);
        return [" ".repeat(left) + text + " ".repeat(step - left - width(text)), hue];
      })
    )
  );
};
var across2 = (j, g, cols) => {
  const step = Math.min(MAX_STEP, Math.floor((cols - GUTTER) / j.tasks.length));
  if (step < MIN_STEP) return null;
  const centre = (i) => GUTTER + i * step + Math.floor((step - 1) / 2);
  const c = blank(5, GUTTER + j.tasks.length * step);
  paint(c, 0, 0, "5", LINE_HUE);
  paint(c, 4, 0, "1", LINE_HUE);
  j.tasks.forEach((t, i) => {
    const next = j.tasks[i + 1];
    if (next) link(c, g, [level(t.score), centre(i)], [level(next.score), centre(i + 1)]);
    paint(c, level(t.score), centre(i), g.dot, mood(t.score));
  });
  return [...sectionLine(j, g, step), ...rows(c), ...labels(j.tasks.map((t) => t.name), step, -1), ...labels(j.tasks.map((t) => t.actors.join(", ")), step, LINE_HUE)];
};
var down = (j, g, cols) => {
  const indent = j.sections.length ? "  " : "";
  const nameWidth = Math.max(6, Math.min(Math.max(...j.tasks.map((t) => width(t.name))), cols - indent.length - 18));
  const scoreWidth = Math.max(...j.tasks.map((t) => String(t.score).length));
  return spans2(j.tasks).flatMap(([section, count, start]) => {
    const head = section < 0 ? [] : [line([fit3(j.sections[section], cols), section])];
    return [
      ...head,
      ...j.tasks.slice(start, start + count).map((t) => {
        const name = fit3(t.name, nameWidth);
        const used = indent.length + nameWidth + 13 + scoreWidth;
        const filled = 4 - level(t.score);
        return line(
          [indent + name + " ".repeat(nameWidth - width(name) + 1), -1],
          [g.h.repeat(2 * filled), LINE_HUE],
          [g.dot, mood(t.score)],
          [" ".repeat(2 * (4 - filled) + 1), -1],
          [String(t.score).padEnd(scoreWidth), mood(t.score)],
          [t.actors.length ? `  ${fit3(t.actors.join(", "), Math.max(1, cols - used))}` : "", LINE_HUE]
        );
      })
    ];
  });
};
var journeyText = (source, ascii, columns) => {
  const j = parse2(source);
  if (!j) return null;
  const g = ascii ? PLAIN2 : ROUND;
  const cols = Math.max(24, columns - 4);
  const title = j.title ? [line([fit3(j.title, cols), -1])] : [];
  return art([...title, ...across2(j, g, cols) ?? down(j, g, cols)]);
};

// ../plugin/hooks/kanban.ts
var ROUND2 = { h: "\u2500", v: "\u2502", corners: ["\u256D", "\u256E", "\u2570", "\u256F"], dot: "\xB7" };
var PLAIN3 = { h: "-", v: "|", corners: ["+", "+", "+", "+"], dot: "-" };
var GAP = 2;
var MIN_WIDTH = 16;
var MAX_WIDTH = 32;
var MOST_LINES = 4;
var URGENT = /^(very )?high$/i;
var textOf = (body2) => oneLine(unquote2(/^[^\s[\]]*\[(.*)\]$/.exec(body2)?.[1] ?? body2));
var metaOf = (body2) => Object.fromEntries([...body2.matchAll(/(\w+)\s*:\s*('[^']*'|"[^"]*"|[^,}]+)/g)].map((m) => [m[1].toLowerCase(), m[2].trim().replace(/^(['"])(.*)\1$/, "$2")]));
var nodeOf = (text) => {
  const at = text.indexOf("@{", Math.max(0, text.lastIndexOf("]")));
  const card = { text: textOf((at < 0 ? text : text.slice(0, at)).trim()), meta: at < 0 ? {} : metaOf(text.slice(at + 2)) };
  return card.text ? card : null;
};
var joined = (lines) => lines.reduce((out, l) => {
  const last = out.at(-1);
  if (last !== void 0 && /@\{[^}]*$/.test(last)) out[out.length - 1] = `${last} ${l.trim()}`;
  else out.push(l);
  return out;
}, []);
var parse3 = (source) => {
  const [first = "", ...rest] = joined(source.split("\n").filter((l) => l.trim() && !l.trim().startsWith("%%")));
  if (!/^kanban$/i.test(first.trim())) return null;
  const columns = [];
  let indent = -1;
  for (const raw of rest) {
    const node = nodeOf(raw.trim());
    const at = raw.replace(/\t/g, "    ").search(/\S/);
    if (!node) return null;
    if (columns.length && at > indent) columns.at(-1).cards.push(node);
    else {
      columns.push({ name: node.text, cards: [] });
      indent = at;
    }
  }
  return columns.length ? columns : null;
};
var metaRows = (card, room, dot) => {
  const { assigned, ticket, priority } = card.meta;
  const plain = [assigned, ticket].filter(Boolean).join(` ${dot} `);
  const urgency = URGENT.test(priority ?? "") ? BAD_HUE : LINE_HUE;
  const tail = plain && priority ? ` ${dot} ${priority}` : priority ?? "";
  if (width(plain) + width(tail) <= room) return plain || tail ? [[[plain, LINE_HUE], [tail, urgency]]] : [];
  return [plain, priority].flatMap((text, i) => text ? [[[fit3(text, room), i ? urgency : LINE_HUE]]] : []);
};
var cardLines = (card, size, hue, g) => {
  const room = size - 4;
  const edge = (l, r) => line([l + g.h.repeat(size - 2) + r, hue]);
  const row = (parts) => {
    const used = parts.reduce((sum, [t]) => sum + width(t), 0);
    return line([`${g.v} `, hue], ...parts, [`${" ".repeat(Math.max(0, room - used))} ${g.v}`, hue]);
  };
  return [
    edge(g.corners[0], g.corners[1]),
    ...wrap(card.text, room, MOST_LINES).map((t) => row([[t, -1]])),
    ...metaRows(card, room, g.dot).map(row),
    edge(g.corners[2], g.corners[3])
  ];
};
var columnLines = (column, i, size, g) => {
  const count = ` ${g.dot} ${column.cards.length}`;
  const head = line([fit3(column.name, size - width(count)), i], [count, i]);
  return [head, ...column.cards.flatMap((card) => cardLines(card, size, i, g))];
};
var join = (a, b) => ({ text: a.text + b.text, hue: [...a.hue, ...b.hue] });
var pad2 = (l, size) => {
  const text = l?.text ?? "";
  return join(l ?? line(["", -1]), line([" ".repeat(Math.max(0, size - width(text))), -1]));
};
var side = (columns, g, cols) => {
  const size = Math.min(MAX_WIDTH, Math.floor((cols + GAP) / columns.length) - GAP);
  if (size < MIN_WIDTH) return null;
  const drawn = columns.map((c, i) => columnLines(c, i, size, g));
  const gap = line([" ".repeat(GAP), -1]);
  return Array.from({ length: Math.max(...drawn.map((d) => d.length)) }, (_, r) => drawn.map((d) => pad2(d[r], size)).reduce((row, cell) => join(join(row, gap), cell)));
};
var stacked = (columns, g, cols) => columns.flatMap((c, i) => [...i ? [line(["", -1])] : [], ...columnLines(c, i, Math.min(cols, MAX_WIDTH * 2), g)]);
var kanbanText = (source, ascii, columns) => {
  const board = parse3(source);
  if (!board) return null;
  const g = ascii ? PLAIN3 : ROUND2;
  const cols = Math.max(MIN_WIDTH, columns - 4);
  return art(side(board, g, cols) ?? stacked(board, g, cols));
};

// ../plugin/hooks/mindmap.ts
var BOX2 = { h: "\u2500", v: "\u2502", top: "\u250C", mid: "\u251C", bottom: "\u2514", down: "\u252C", cross: "\u253C", side: "\u2524" };
var PLAIN4 = { h: "-", v: "|", top: "+", mid: "+", bottom: "`", down: "+", cross: "+", side: "+" };
var SHAPES = [
  ["((", "))"],
  ["))", "(("],
  ["{{", "}}"],
  ["(", ")"],
  [")", "("],
  ["[", "]"]
];
var shaped = (body2) => {
  for (const [open, close] of SHAPES) {
    const at = body2.indexOf(open);
    if (at < 0 || /\s/.test(body2.slice(0, at)) || !body2.endsWith(close) || body2.length < at + open.length + close.length) continue;
    return body2.slice(at + open.length, body2.length - close.length);
  }
  return body2;
};
var unmark = (text) => text.replace(/(\*\*|__)(.+?)\1|([*_])(.+?)\3/g, "$2$4");
var labelOf2 = (text) => {
  const body2 = unquote2(shaped(text.replace(/\s*:::[\w\s-]*$/, "")));
  const markdown = /^`(.*)`$/.exec(body2);
  return oneLine(markdown ? unmark(markdown[1]) : body2);
};
var attach = (stack, indent, node) => {
  while (stack.length && stack.at(-1)[0] >= indent) stack.pop();
  stack.at(-1)?.[1].kids.push(node);
  const root = !stack.length;
  stack.push([indent, node]);
  return root;
};
var parse4 = (source) => {
  const lines = source.split("\n").filter((l) => l.trim() && !l.trim().startsWith("%%"));
  if (!/^mindmap$/i.test(lines.shift()?.trim() ?? "")) return null;
  const stack = [];
  let root;
  for (const raw of lines) {
    if (/^::icon\(|^:::/.test(raw.trim())) continue;
    const label = labelOf2(raw.trim());
    if (!label) return null;
    const node = { label, kids: [], row: 0 };
    if (!attach(stack, raw.replace(/\t/g, "    ").search(/\S/), node)) continue;
    if (root) return null;
    root = node;
  }
  return root ?? null;
};
var placeRows = (n, next) => {
  if (!n.kids.length) return n.row = next.row++;
  const rows2 = n.kids.map((k) => placeRows(k, next));
  return n.row = Math.floor((rows2[0] + rows2.at(-1)) / 2);
};
var widths = (n, depth = 0, out = []) => {
  out[depth] = Math.max(out[depth] ?? 0, width(n.label));
  for (const k of n.kids) widths(k, depth + 1, out);
  return out;
};
var joint = (g, r, kid, [first, last, at]) => {
  if (first === last) return g.h;
  if (r === first) return r === at ? g.down : g.top;
  if (r === last) return g.bottom;
  if (kid) return r === at ? g.cross : g.mid;
  return r === at ? g.side : g.v;
};
var drawNode = (c, g, x, n, depth, hue) => {
  const left = x[depth];
  paint(c, n.row, left, n.label, depth === 0 ? ARROW_HUE : depth === 1 ? hue : -1);
  if (!n.kids.length) return;
  const arm = depth === 0 ? LINE_HUE : hue;
  const spine = x[depth + 1] - 3;
  const span = [n.kids[0].row, n.kids.at(-1).row, n.row];
  const kidRows = new Set(n.kids.map((k) => k.row));
  paint(c, n.row, left + width(n.label), ` ${g.h.repeat(spine - left - width(n.label) - 1)}`, arm);
  for (let r = span[0]; r <= span[1]; r++) paint(c, r, spine, joint(g, r, kidRows.has(r), span), arm);
  n.kids.forEach((k, i) => {
    const own = depth === 0 ? i : hue;
    paint(c, k.row, spine + 1, `${g.h} `, own);
    drawNode(c, g, x, k, depth + 1, own);
  });
};
var flat = (n, depth = 0) => [[n, depth], ...n.kids.flatMap((k) => flat(k, depth + 1))];
var across3 = (root, g, cols) => {
  const x = widths(root).reduce((at, size, d) => [...at, at[d] + size + 5], [0]);
  const span = Math.max(...flat(root).map(([n, d]) => x[d] + width(n.label)));
  if (span > cols) return null;
  const next = { row: 0 };
  placeRows(root, next);
  const c = blank(next.row, span);
  drawNode(c, g, x, root, 0, 0);
  return rows(c);
};
var outline = (root, g, cols) => {
  const out = [line([fit3(root.label, cols), ARROW_HUE])];
  const walk = (kids, prefix, depth, hue) => kids.forEach((k, i) => {
    const last = i === kids.length - 1;
    const own = hue ?? i;
    const glyph = depth === 1 ? LINE_HUE : own;
    const room = cols - prefix.reduce((sum, [t]) => sum + width(t), 0) - 3;
    out.push(line(...prefix, [last ? g.bottom : g.mid, glyph], [`${g.h} `, own], [fit3(k.label, Math.max(1, room)), depth === 1 ? own : -1]));
    walk(k.kids, [...prefix, [last ? "   " : `${g.v}  `, glyph]], depth + 1, own);
  });
  walk(root.kids, [], 1);
  return out;
};
var mindmapText = (source, ascii, columns) => {
  const root = parse4(source);
  if (!root) return null;
  const g = ascii ? PLAIN4 : BOX2;
  const cols = Math.max(20, columns - 4);
  return art(across3(root, g, cols) ?? outline(root, g, cols));
};

// ../plugin/hooks/quadrant.ts
var MARKS = "123456789abcdefghijklmnopqrstuvwxyz";
var IGNORED4 = /^(classDef|accTitle|accDescr)\b/i;
var POINT = /^(.+?)(?::::[\w-]+)?\s*:\s*\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]/;
var axisOf = (text) => {
  const [from = "", to] = text.split("-->").map(unquote2);
  return [from, to || void 0];
};
var pointOf = (line2) => {
  const m = POINT.exec(line2);
  if (!m) return void 0;
  const [x, y] = [Number(m[2]), Number(m[3])];
  return x >= 0 && x <= 1 && y >= 0 && y <= 1 ? { name: unquote2(m[1]), x, y } : null;
};
var readLine2 = (q, line2) => {
  const named = /^(title|x-axis|y-axis|quadrant-([1-4]))\s+(.*)$/i.exec(line2);
  if (named) {
    const [key, slot, text] = [named[1].toLowerCase(), named[2], named[3]];
    if (slot) q.names[Number(slot) - 1] = unquote2(text);
    else if (key === "title") q.title = unquote2(text);
    else q[key === "x-axis" ? "x" : "y"] = axisOf(text);
    return true;
  }
  if (IGNORED4.test(line2)) return true;
  const point = pointOf(line2);
  if (point) q.points.push(point);
  return !!point;
};
var parse5 = (source) => {
  const [first = "", ...rest] = source.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("%%"));
  if (!/^quadrantChart$/i.test(first)) return null;
  const q = { names: [], points: [] };
  for (const line2 of rest) if (!readLine2(q, line2)) return null;
  return q.points.length <= MARKS.length && (q.points.length || q.names.some(Boolean)) ? q : null;
};
var canvas = (rows2, cols) => ({
  grid: Array.from({ length: rows2 }, () => Array(cols).fill(" ")),
  hues: Array.from({ length: rows2 }, () => Array(cols).fill(-1)),
  taken: Array.from({ length: rows2 }, () => Array(cols).fill(false))
});
var put = (c, row, col, text, hue = -1) => cells(text).forEach((ch, k) => {
  if (col + k < 0 || col + k >= c.grid[row].length) return;
  c.grid[row][col + k] = ch;
  c.hues[row][col + k] = hue;
  c.taken[row][col + k] = true;
});
var drawAxes = (c, mid, middle, ascii) => {
  c.grid[middle].fill(ascii ? "-" : "\u2500");
  c.hues[middle].fill(LINE_HUE);
  c.grid.forEach((row, r) => {
    row[mid] = ascii ? "|" : "\u2502";
    c.hues[r][mid] = LINE_HUE;
  });
  c.grid[middle][mid] = ascii ? "+" : "\u253C";
};
var drawNames = (c, names, mid) => {
  const [rows2, cols] = [c.grid.length, c.grid[0].length];
  const room = mid - 3;
  const [q1, q2, q3, q4] = [0, 1, 2, 3].map((i) => fit3(names[i] ?? "", room));
  put(c, 0, 1, q2);
  put(c, 0, cols - 1 - width(q1), q1);
  put(c, rows2 - 1, 1, q3);
  put(c, rows2 - 1, cols - 1 - width(q4), q4);
};
var sameSide = (at, axis, side2) => at !== axis && (side2 === 0 || Math.sign(at - axis) === side2);
var nearest2 = (c, [row, col], [middle, mid], [down2, right]) => {
  let best;
  let far = Infinity;
  c.taken.forEach((line2, r) => {
    if (!sameSide(r, middle, down2)) return;
    line2.forEach((taken, k) => {
      const d = 4 * (r - row) ** 2 + (k - col) ** 2;
      if (d >= far || taken || line2[k - 1] || line2[k + 1] || !sameSide(k, mid, right)) return;
      best = [r, k];
      far = d;
    });
  });
  return best;
};
var place2 = (c, p, i, middle, mid) => {
  const [rows2, cols] = [c.grid.length, c.grid[0].length];
  const spot = nearest2(c, [Math.round((1 - p.y) * (rows2 - 1)), Math.round(p.x * (cols - 1))], [middle, mid], [Math.sign(0.5 - p.y), Math.sign(p.x - 0.5)]);
  if (spot) put(c, spot[0], spot[1], MARKS[i], i);
  return !!spot;
};
var centred = (text, at, cols) => Math.max(0, Math.min(at, cols - width(text)));
var pointing = (arrow, text, mid, cols) => line([" ".repeat(centred(`${arrow} ${text}`, mid, cols)), -1], [arrow, ARROW_HUE], [` ${text}`, -1]);
var yLines = (y, mid, cols, ascii) => {
  if (!y) return [];
  const low = fit3(y[0], cols - 2);
  if (!y[1]) return [void 0, line([" ".repeat(centred(low, mid - Math.floor(width(low) / 2), cols)) + low, -1])];
  return [pointing(ascii ? "^" : "\u25B2", fit3(y[1], cols - 2), mid, cols), pointing(ascii ? "v" : "\u25BC", low, mid, cols)];
};
var xLine = (x, cols, ascii) => {
  if (!x) return void 0;
  if (!x[1]) return line([" ".repeat(Math.max(0, Math.floor((cols - width(x[0])) / 2))) + fit3(x[0], cols), -1]);
  const half = Math.floor(cols / 2) - 1;
  const [left, right] = [` ${fit3(x[0], half - 2)}`, `${fit3(x[1], half - 2)} `];
  return line([ascii ? "<" : "\u25C4", ARROW_HUE], [left + " ".repeat(cols - 2 - width(left) - width(right)) + right, -1], [ascii ? ">" : "\u25BA", ARROW_HUE]);
};
var legend2 = (points, cols) => {
  const lines = [];
  let row = { text: "", hue: [] };
  points.forEach((p, i) => {
    const name = ` ${fit3(p.name, cols - 2)}`;
    if (row.text && width(`${row.text}   ${MARKS[i]}${name}`) > cols) {
      lines.push(row);
      row = { text: "", hue: [] };
    }
    const next = line([row.text ? "   " : "", -1], [MARKS[i], i], [name, -1]);
    row = { text: row.text + next.text, hue: [...row.hue, ...next.hue] };
  });
  return row.text ? [...lines, row] : lines;
};
var quadrantText = (source, ascii, columns) => {
  const q = parse5(source);
  const cols = Math.max(24, Math.min(64, columns - 4));
  if (!q) return null;
  const rows2 = Math.max(9, Math.min(15, Math.round(cols * 0.35) | 1));
  const [mid, middle] = [Math.floor(cols / 2), Math.floor(rows2 / 2)];
  const c = canvas(rows2, cols);
  drawAxes(c, mid, middle, ascii);
  drawNames(c, q.names, mid);
  if (!q.points.every((p, i) => place2(c, p, i, middle, mid))) return null;
  const [top, bottom] = yLines(q.y, mid, cols, ascii);
  const plot = rows(c);
  const out = [q.title ? line([fit3(q.title, cols), -1]) : void 0, top, ...plot, bottom, xLine(q.x, cols, ascii), ...legend2(q.points, cols)].filter((l) => !!l);
  return art(out);
};

// ../plugin/hooks/vendor/mermaid-text.js
function normalizeBrTags(label) {
  return (label.startsWith('"') && label.endsWith('"') ? label.slice(1, -1) : label).replace(/<br\s*\/?>/gi, `
`).replace(/\\n/g, `
`).replace(/<\/?(?:sub|sup|small|mark)\s*>/gi, "").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(?<!\*)\*([^\s*](?:[^*]*[^\s*])?)\*(?!\*)/g, "<i>$1</i>").replace(/~~(.+?)~~/g, "<s>$1</s>");
}
function parseMermaid(text) {
  let lines = text.split(`
`).map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith("%%"));
  if (lines.length === 0)
    throw new Error("Empty mermaid diagram");
  let header = lines[0];
  return /^stateDiagram(-v2)?\s*$/i.test(header) ? parseStateDiagram(lines) : parseFlowchart(lines);
}
function parseFlowchart(lines) {
  let headerMatch = lines[0].match(/^(?:graph|flowchart)\s+(TD|TB|LR|BT|RL)\s*$/i);
  if (!headerMatch)
    throw new Error(`Invalid mermaid header: "${lines[0]}". Expected "graph TD", "flowchart LR", "stateDiagram-v2", etc.`);
  let graph = {
    direction: headerMatch[1].toUpperCase(),
    nodes: /* @__PURE__ */ new Map(),
    edges: [],
    subgraphs: [],
    classDefs: /* @__PURE__ */ new Map(),
    classAssignments: /* @__PURE__ */ new Map(),
    nodeStyles: /* @__PURE__ */ new Map(),
    linkStyles: /* @__PURE__ */ new Map()
  }, subgraphStack = [];
  for (let i = 1; i < lines.length; i++) {
    let line2 = lines[i], classDefMatch = line2.match(/^classDef\s+(\w+)\s+(.+)$/);
    if (classDefMatch) {
      let name = classDefMatch[1], propsStr = classDefMatch[2], props = parseStyleProps(propsStr);
      graph.classDefs.set(name, props);
      continue;
    }
    let classAssignMatch = line2.match(/^class\s+([\w,-]+)\s+(\w+)$/);
    if (classAssignMatch) {
      let nodeIds = classAssignMatch[1].split(",").map((s) => s.trim()), className = classAssignMatch[2];
      for (let id of nodeIds)
        graph.classAssignments.set(id, className);
      continue;
    }
    let styleMatch = line2.match(/^style\s+([\w,-]+)\s+(.+)$/);
    if (styleMatch) {
      let nodeIds = styleMatch[1].split(",").map((s) => s.trim()), props = parseStyleProps(styleMatch[2]);
      for (let id of nodeIds)
        graph.nodeStyles.set(id, { ...graph.nodeStyles.get(id), ...props });
      continue;
    }
    let linkStyleMatch = line2.match(/^linkStyle\s+(default|[\d,\s]+)\s+(.+)$/);
    if (linkStyleMatch) {
      let target = linkStyleMatch[1].trim(), props = parseStyleProps(linkStyleMatch[2]);
      if (target === "default")
        graph.linkStyles.set("default", { ...graph.linkStyles.get("default"), ...props });
      else {
        let indices = target.split(",").map((s) => parseInt(s.trim(), 10));
        for (let idx of indices)
          isNaN(idx) || graph.linkStyles.set(idx, { ...graph.linkStyles.get(idx), ...props });
      }
      continue;
    }
    let dirMatch = line2.match(/^direction\s+(TD|TB|LR|BT|RL)\s*$/i);
    if (dirMatch && subgraphStack.length > 0) {
      subgraphStack[subgraphStack.length - 1].direction = dirMatch[1].toUpperCase();
      continue;
    }
    let subgraphMatch = line2.match(/^subgraph\s+(.+)$/);
    if (subgraphMatch) {
      let rest = subgraphMatch[1].trim(), bracketMatch = rest.match(/^([\w-]+)\s*\[(.+)\]$/), id, label;
      bracketMatch ? (id = bracketMatch[1], label = normalizeBrTags(bracketMatch[2])) : (label = normalizeBrTags(rest), id = rest.replace(/\s+/g, "_").replace(/[^\w]/g, ""));
      let sg = { id, label, nodeIds: [], children: [] };
      subgraphStack.push(sg);
      continue;
    }
    if (line2 === "end") {
      let completed = subgraphStack.pop();
      completed && (subgraphStack.length > 0 ? subgraphStack[subgraphStack.length - 1].children.push(completed) : graph.subgraphs.push(completed));
      continue;
    }
    parseEdgeLine(line2, graph, subgraphStack);
  }
  return graph;
}
function parseStateDiagram(lines) {
  let graph = {
    direction: "TD",
    nodes: /* @__PURE__ */ new Map(),
    edges: [],
    subgraphs: [],
    classDefs: /* @__PURE__ */ new Map(),
    classAssignments: /* @__PURE__ */ new Map(),
    nodeStyles: /* @__PURE__ */ new Map(),
    linkStyles: /* @__PURE__ */ new Map()
  }, compositeStack = [], compositeStateIds = /* @__PURE__ */ new Set(), startCount = 0, endCount = 0;
  for (let i = 1; i < lines.length; i++) {
    let line2 = lines[i], dirMatch = line2.match(/^direction\s+(TD|TB|LR|BT|RL)\s*$/i);
    if (dirMatch) {
      compositeStack.length > 0 ? compositeStack[compositeStack.length - 1].direction = dirMatch[1].toUpperCase() : graph.direction = dirMatch[1].toUpperCase();
      continue;
    }
    let linkStyleMatch = line2.match(/^linkStyle\s+(default|[\d,\s]+)\s+(.+)$/);
    if (linkStyleMatch) {
      let target = linkStyleMatch[1].trim(), props = parseStyleProps(linkStyleMatch[2]);
      if (target === "default")
        graph.linkStyles.set("default", { ...graph.linkStyles.get("default"), ...props });
      else {
        let indices = target.split(",").map((s) => parseInt(s.trim(), 10));
        for (let idx of indices)
          isNaN(idx) || graph.linkStyles.set(idx, { ...graph.linkStyles.get(idx), ...props });
      }
      continue;
    }
    let compositeMatch = line2.match(/^state\s+(?:"([^"]+)"\s+as\s+)?([\w\p{L}]+)\s*\{$/u);
    if (compositeMatch) {
      let label = compositeMatch[1] ?? compositeMatch[2], id = compositeMatch[2], sg = { id, label, nodeIds: [], children: [] };
      compositeStack.push(sg), compositeStateIds.add(id), graph.nodes.delete(id);
      continue;
    }
    if (line2 === "}") {
      let completed = compositeStack.pop();
      completed && (compositeStack.length > 0 ? compositeStack[compositeStack.length - 1].children.push(completed) : graph.subgraphs.push(completed));
      continue;
    }
    let stateAliasMatch = line2.match(/^state\s+"([^"]+)"\s+as\s+([\w\p{L}]+)\s*$/u);
    if (stateAliasMatch) {
      let label = normalizeBrTags(stateAliasMatch[1]), id = stateAliasMatch[2];
      registerStateNode(graph, compositeStack, { id, label, shape: "rounded" });
      continue;
    }
    let transitionMatch = line2.match(/^(\[\*\]|[\w\p{L}-]+)\s*(-->)\s*(\[\*\]|[\w\p{L}-]+)(?:\s*:\s*(.+))?$/u);
    if (transitionMatch) {
      let sourceId = transitionMatch[1], targetId = transitionMatch[3], rawTransitionLabel = transitionMatch[4]?.trim(), edgeLabel = rawTransitionLabel ? normalizeBrTags(rawTransitionLabel) : void 0;
      sourceId === "[*]" ? (startCount++, sourceId = `_start${startCount > 1 ? startCount : ""}`, registerStateNode(graph, compositeStack, { id: sourceId, label: "", shape: "state-start" })) : compositeStateIds.has(sourceId) || ensureStateNode(graph, compositeStack, sourceId), targetId === "[*]" ? (endCount++, targetId = `_end${endCount > 1 ? endCount : ""}`, registerStateNode(graph, compositeStack, { id: targetId, label: "", shape: "state-end" })) : compositeStateIds.has(targetId) || ensureStateNode(graph, compositeStack, targetId), graph.edges.push({
        source: sourceId,
        target: targetId,
        label: edgeLabel,
        style: "solid",
        hasArrowStart: false,
        hasArrowEnd: true
      });
      continue;
    }
    let stateDescMatch = line2.match(/^([\w\p{L}-]+)\s*:\s*(.+)$/u);
    if (stateDescMatch) {
      let id = stateDescMatch[1], label = normalizeBrTags(stateDescMatch[2].trim());
      registerStateNode(graph, compositeStack, { id, label, shape: "rounded" });
      continue;
    }
  }
  return graph;
}
function registerStateNode(graph, compositeStack, node) {
  if (!graph.nodes.has(node.id) && graph.nodes.set(node.id, node), compositeStack.length > 0) {
    let current = compositeStack[compositeStack.length - 1];
    current.nodeIds.includes(node.id) || current.nodeIds.push(node.id);
  }
}
function ensureStateNode(graph, compositeStack, id) {
  if (!graph.nodes.has(id))
    registerStateNode(graph, compositeStack, { id, label: id, shape: "rounded" });
  else if (compositeStack.length > 0) {
    let current = compositeStack[compositeStack.length - 1];
    current.nodeIds.includes(id) || current.nodeIds.push(id);
  }
}
function parseStyleProps(propsStr) {
  let cleaned = propsStr.replace(/;\s*$/, ""), props = {};
  for (let pair of cleaned.split(",")) {
    let colonIdx = pair.indexOf(":");
    if (colonIdx > 0) {
      let key = pair.slice(0, colonIdx).trim(), val = pair.slice(colonIdx + 1).trim();
      key && val && (props[key] = val);
    }
  }
  return props;
}
var ARROW_REGEX = /^(<)?(-->|-.->|==>|---|-\.-|===)(?:\|([^|]*)\|)?/;
var TEXT_ARROW_REGEX = /^(<)?(--|-\.|==)\s+(.+?)\s+(-->|---|\.\->|-\.\-|==>|===)/;
var NODE_PATTERNS = [
  // Triple delimiters (must be first)
  { regex: /^((?:\w|-(?![-.>]))+)\(\(\((.+?)\)\)\)/, shape: "doublecircle" },
  // A(((text)))
  // Double delimiters with mixed brackets
  { regex: /^((?:\w|-(?![-.>]))+)\(\[(.+?)\]\)/, shape: "stadium" },
  // A([text])
  { regex: /^((?:\w|-(?![-.>]))+)\(\((.+?)\)\)/, shape: "circle" },
  // A((text))
  { regex: /^((?:\w|-(?![-.>]))+)\[\[(.+?)\]\]/, shape: "subroutine" },
  // A[[text]]
  { regex: /^((?:\w|-(?![-.>]))+)\[\((.+?)\)\]/, shape: "cylinder" },
  // A[(text)]
  // Trapezoid variants — must come before plain [text]
  { regex: /^((?:\w|-(?![-.>]))+)\[\/(.+?)\\\]/, shape: "trapezoid" },
  // A[/text\]
  { regex: /^((?:\w|-(?![-.>]))+)\[\\(.+?)\/\]/, shape: "trapezoid-alt" },
  // A[\text/]
  // Asymmetric flag shape
  { regex: /^((?:\w|-(?![-.>]))+)>(.+?)\]/, shape: "asymmetric" },
  // A>text]
  // Double curly braces (hexagon) — must come before single {text}
  { regex: /^((?:\w|-(?![-.>]))+)\{\{(.+?)\}\}/, shape: "hexagon" },
  // A{{text}}
  // Single-char delimiters (last — most common, least specific)
  { regex: /^((?:\w|-(?![-.>]))+)\[(.+?)\]/, shape: "rectangle" },
  // A[text]
  { regex: /^((?:\w|-(?![-.>]))+)\((.+?)\)/, shape: "rounded" },
  // A(text)
  { regex: /^((?:\w|-(?![-.>]))+)\{(.+?)\}/, shape: "diamond" }
  // A{text}
];
var BARE_NODE_REGEX = /^((?:\w|-(?![-.>]))+)/;
var CLASS_SHORTHAND_REGEX = /^:::([\w][\w-]*)/;
function parseEdgeLine(line2, graph, subgraphStack) {
  let remaining = line2.trim(), firstGroup = consumeNodeGroup(remaining, graph, subgraphStack);
  if (!firstGroup || firstGroup.ids.length === 0) return;
  remaining = firstGroup.remaining.trim();
  let prevGroupIds = firstGroup.ids;
  for (; remaining.length > 0; ) {
    let hasArrowStart, style, hasArrowEnd, edgeLabel, arrowMatch = remaining.match(ARROW_REGEX);
    if (arrowMatch) {
      hasArrowStart = !!arrowMatch[1];
      let arrowOp = arrowMatch[2], rawEdgeLabel = arrowMatch[3]?.trim();
      edgeLabel = rawEdgeLabel ? normalizeBrTags(rawEdgeLabel) : void 0, remaining = remaining.slice(arrowMatch[0].length).trim(), style = arrowStyleFromOp(arrowOp), hasArrowEnd = arrowOp.endsWith(">");
    } else {
      let textMatch = remaining.match(TEXT_ARROW_REGEX);
      if (!textMatch) break;
      hasArrowStart = !!textMatch[1];
      let rawLabel = textMatch[3].trim();
      edgeLabel = rawLabel ? normalizeBrTags(rawLabel) : void 0;
      let openOp = textMatch[2], closeOp = textMatch[4];
      remaining = remaining.slice(textMatch[0].length).trim(), style = textArrowStyleFromOps(openOp, closeOp), hasArrowEnd = closeOp.endsWith(">");
    }
    let nextGroup = consumeNodeGroup(remaining, graph, subgraphStack);
    if (!nextGroup || nextGroup.ids.length === 0) break;
    remaining = nextGroup.remaining.trim();
    for (let sourceId of prevGroupIds)
      for (let targetId of nextGroup.ids)
        graph.edges.push({
          source: sourceId,
          target: targetId,
          label: edgeLabel,
          style,
          hasArrowStart,
          hasArrowEnd
        });
    prevGroupIds = nextGroup.ids;
  }
}
function consumeNodeGroup(text, graph, subgraphStack) {
  let first = consumeNode(text, graph, subgraphStack);
  if (!first) return null;
  let ids = [first.id], remaining = first.remaining.trim();
  for (; remaining.startsWith("&"); ) {
    remaining = remaining.slice(1).trim();
    let next = consumeNode(remaining, graph, subgraphStack);
    if (!next) break;
    ids.push(next.id), remaining = next.remaining.trim();
  }
  return { ids, remaining };
}
function consumeNode(text, graph, subgraphStack) {
  let id = null, remaining = text;
  for (let { regex, shape } of NODE_PATTERNS) {
    let match = text.match(regex);
    if (match) {
      id = match[1];
      let label = normalizeBrTags(match[2]);
      registerNode(graph, subgraphStack, { id, label, shape }), remaining = text.slice(match[0].length);
      break;
    }
  }
  if (id === null) {
    let bareMatch = text.match(BARE_NODE_REGEX);
    bareMatch && (id = bareMatch[1], graph.nodes.has(id) || registerNode(graph, subgraphStack, { id, label: id, shape: "rectangle" }), remaining = text.slice(bareMatch[0].length));
  }
  if (id === null) return null;
  let classMatch = remaining.match(CLASS_SHORTHAND_REGEX);
  return classMatch && (graph.classAssignments.set(id, classMatch[1]), remaining = remaining.slice(classMatch[0].length)), { id, remaining };
}
function registerNode(graph, subgraphStack, node) {
  !graph.nodes.has(node.id) && graph.nodes.set(node.id, node), trackInSubgraph(subgraphStack, node.id);
}
function trackInSubgraph(subgraphStack, nodeId) {
  if (subgraphStack.length > 0) {
    let current = subgraphStack[subgraphStack.length - 1];
    current.nodeIds.includes(nodeId) || current.nodeIds.push(nodeId);
  }
}
function arrowStyleFromOp(op) {
  return op === "-.->" || op === "-.-" ? "dotted" : op === "==>" || op === "===" ? "thick" : "solid";
}
function textArrowStyleFromOps(openOp, closeOp) {
  return openOp === "-." || closeOp === ".->" || closeOp === "-.-" ? "dotted" : openOp === "==" || closeOp === "==>" || closeOp === "===" ? "thick" : "solid";
}
var Up = { x: 1, y: 0 };
var Down = { x: 1, y: 2 };
var Left = { x: 0, y: 1 };
var Right = { x: 2, y: 1 };
var UpperRight = { x: 2, y: 0 };
var UpperLeft = { x: 0, y: 0 };
var LowerRight = { x: 2, y: 2 };
var LowerLeft = { x: 0, y: 2 };
var Middle = { x: 1, y: 1 };
function gridCoordEquals(a, b) {
  return a.x === b.x && a.y === b.y;
}
function drawingCoordEquals(a, b) {
  return a.x === b.x && a.y === b.y;
}
function gridCoordDirection(c, dir) {
  return { x: c.x + dir.x, y: c.y + dir.y };
}
function gridKey(c) {
  return `${c.x},${c.y}`;
}
var EMPTY_STYLE = { name: "", styles: {} };
var DEFAULT_ASCII_THEME = {
  fg: "#27272a",
  // zinc-800 — primary text
  border: "#a1a1aa",
  // zinc-400 — node borders (12% mix)
  line: "#71717a",
  // zinc-500 — edge lines (35% mix)
  arrow: "#52525b",
  // zinc-600 — arrowheads (60% mix)
  corner: "#71717a",
  // same as line
  junction: "#a1a1aa"
  // same as border
};
function detectColorMode() {
  let proc = globalThis.process;
  if (proc) {
    if (!proc.stdout?.isTTY)
      return "none";
    let colorTerm = proc.env?.COLORTERM?.toLowerCase() ?? "", term = proc.env?.TERM?.toLowerCase() ?? "";
    return colorTerm === "truecolor" || colorTerm === "24bit" ? "truecolor" : term.includes("256color") || term.includes("256") ? "ansi256" : term && term !== "dumb" ? "ansi16" : "none";
  }
  return typeof document < "u" ? "html" : "none";
}
function parseHex(hex2) {
  let h = hex2.replace("#", "");
  return h.length === 3 ? {
    r: parseInt(h[0] + h[0], 16),
    g: parseInt(h[1] + h[1], 16),
    b: parseInt(h[2] + h[2], 16)
  } : {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16)
  };
}
var ESC = "\x1B[";
var RESET = `${ESC}0m`;
function truecolorFg(hex2) {
  let { r, g, b } = parseHex(hex2);
  return `${ESC}38;2;${r};${g};${b}m`;
}
function rgbTo256(r, g, b) {
  let avg = (r + g + b) / 3;
  if (Math.max(Math.abs(r - avg), Math.abs(g - avg), Math.abs(b - avg)) < 10) {
    let gray = Math.round(avg / 255 * 23);
    return 232 + Math.min(23, Math.max(0, gray));
  }
  let toIndex = (v) => v < 48 ? 0 : v < 115 ? 1 : Math.min(5, Math.floor((v - 35) / 40)), ri = toIndex(r), gi = toIndex(g), bi = toIndex(b);
  return 16 + 36 * ri + 6 * gi + bi;
}
function ansi256Fg(hex2) {
  let { r, g, b } = parseHex(hex2), index = rgbTo256(r, g, b);
  return `${ESC}38;5;${index}m`;
}
function ansi16Fg(hex2) {
  let { r, g, b } = parseHex(hex2), luma = 0.299 * r + 0.587 * g + 0.114 * b, bright = luma > 100 ? 0 : 60, code;
  return r > 180 && g < 100 && b < 100 ? code = 31 : g > 180 && r < 100 && b < 100 ? code = 32 : r > 150 && g > 150 && b < 100 ? code = 33 : b > 180 && r < 100 && g < 100 ? code = 34 : r > 150 && b > 150 && g < 100 ? code = 35 : g > 150 && b > 150 && r < 100 ? code = 36 : luma > 200 ? code = 37 : luma < 50 ? code = 30 : code = 37, `${ESC}${code + bright}m`;
}
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function htmlSpan(hex2, text) {
  return `<span style="color:${hex2}">${escapeHtml(text)}</span>`;
}
function getRoleColor(role, theme) {
  switch (role) {
    case "text":
      return theme.fg;
    case "border":
      return theme.border;
    case "line":
      return theme.line;
    case "arrow":
      return theme.arrow;
    case "corner":
      return theme.corner ?? theme.line;
    case "junction":
      return theme.junction ?? theme.border;
    default:
      return theme.fg;
  }
}
function getAnsiColor(role, theme, mode) {
  if (mode === "none") return "";
  let hex2 = getRoleColor(role, theme);
  switch (mode) {
    case "truecolor":
      return truecolorFg(hex2);
    case "ansi256":
      return ansi256Fg(hex2);
    case "ansi16":
      return ansi16Fg(hex2);
    default:
      return "";
  }
}
function colorizeLine(chars, roles, theme, mode) {
  if (mode === "none")
    return chars.join("");
  if (mode === "html")
    return colorizeLineHtml(chars, roles, theme);
  let result = "", currentRole = null, buffer = "";
  for (let i = 0; i < chars.length; i++) {
    let char = chars[i], role = roles[i] ?? null;
    if (char === " ") {
      buffer.length > 0 && (currentRole !== null ? result += getAnsiColor(currentRole, theme, mode) + buffer + RESET : result += buffer, buffer = "", currentRole = null), result += char;
      continue;
    }
    if (role === currentRole) {
      buffer += char;
      continue;
    }
    buffer.length > 0 && (currentRole !== null ? result += getAnsiColor(currentRole, theme, mode) + buffer + RESET : result += buffer), buffer = char, currentRole = role;
  }
  return buffer.length > 0 && currentRole !== null ? result += getAnsiColor(currentRole, theme, mode) + buffer + RESET : buffer.length > 0 && (result += buffer), result;
}
function colorizeLineHtml(chars, roles, theme) {
  let result = "", currentRole = null, buffer = "", flush = () => {
    buffer.length !== 0 && (currentRole !== null ? result += htmlSpan(getRoleColor(currentRole, theme), buffer) : result += escapeHtml(buffer), buffer = "", currentRole = null);
  };
  for (let i = 0; i < chars.length; i++) {
    let char = chars[i], role = roles[i] ?? null;
    if (char === " ") {
      flush(), result += " ";
      continue;
    }
    if (role === currentRole) {
      buffer += char;
      continue;
    }
    flush(), buffer = char, currentRole = role;
  }
  return flush(), result;
}
function colorizeText(text, hex2, mode) {
  if (mode === "none" || text.length === 0) return text;
  if (mode === "html") return htmlSpan(hex2, text);
  let code;
  switch (mode) {
    case "truecolor":
      code = truecolorFg(hex2);
      break;
    case "ansi256":
      code = ansi256Fg(hex2);
      break;
    case "ansi16":
      code = ansi16Fg(hex2);
      break;
    default:
      return text;
  }
  return `${code}${text}${RESET}`;
}
function mkCanvas(x, y) {
  let canvas2 = [];
  for (let i = 0; i <= x; i++) {
    let col = [];
    for (let j = 0; j <= y; j++)
      col.push(" ");
    canvas2.push(col);
  }
  return canvas2;
}
function copyCanvas(source) {
  let [maxX, maxY] = getCanvasSize(source);
  return mkCanvas(maxX, maxY);
}
function mkRoleCanvas(x, y) {
  let roleCanvas = [];
  for (let i = 0; i <= x; i++) {
    let col = [];
    for (let j = 0; j <= y; j++)
      col.push(null);
    roleCanvas.push(col);
  }
  return roleCanvas;
}
function increaseRoleCanvasSize(roleCanvas, newX, newY) {
  let currX = roleCanvas.length - 1, currY = (roleCanvas[0]?.length ?? 1) - 1, targetX = Math.max(newX, currX), targetY = Math.max(newY, currY), grown = mkRoleCanvas(targetX, targetY);
  for (let x = 0; x < grown.length; x++)
    for (let y = 0; y < grown[0].length; y++)
      x < roleCanvas.length && y < roleCanvas[0].length && (grown[x][y] = roleCanvas[x][y]);
  return roleCanvas.length = 0, roleCanvas.push(...grown), roleCanvas;
}
function setRole(roleCanvas, x, y, role) {
  (x >= roleCanvas.length || y >= (roleCanvas[0]?.length ?? 0)) && increaseRoleCanvasSize(roleCanvas, x, y), roleCanvas[x][y] = role;
}
function getCanvasSize(canvas2) {
  return [canvas2.length - 1, (canvas2[0]?.length ?? 1) - 1];
}
function increaseSize(canvas2, newX, newY) {
  let [currX, currY] = getCanvasSize(canvas2), targetX = Math.max(newX, currX), targetY = Math.max(newY, currY), grown = mkCanvas(targetX, targetY);
  for (let x = 0; x < grown.length; x++)
    for (let y = 0; y < grown[0].length; y++)
      x < canvas2.length && y < canvas2[0].length && (grown[x][y] = canvas2[x][y]);
  return canvas2.length = 0, canvas2.push(...grown), canvas2;
}
var JUNCTION_CHARS = /* @__PURE__ */ new Set([
  "\u2500",
  "\u2502",
  "\u250C",
  "\u2510",
  "\u2514",
  "\u2518",
  "\u251C",
  "\u2524",
  "\u252C",
  "\u2534",
  "\u253C",
  "\u2574",
  "\u2575",
  "\u2576",
  "\u2577"
]);
function clearLabelGaps(canvas2, label) {
  for (let y = 0; y < (label[0]?.length ?? 0); y++) {
    let xs = label.map((col, x) => col[y] !== " " ? x : -1).filter((x) => x >= 0);
    if (xs.length !== 0)
      for (let x = xs[0]; x <= xs[xs.length - 1]; x++)
        label[x][y] === " " && !isAlphanumeric(canvas2[x][y]) && (canvas2[x][y] = " ");
  }
}
function isJunctionChar(c) {
  return JUNCTION_CHARS.has(c);
}
function isAlphanumeric(c) {
  return /^[a-zA-Z0-9]$/.test(c);
}
var JUNCTION_MAP = {
  "\u2500": { "\u2502": "\u253C", "\u250C": "\u252C", "\u2510": "\u252C", "\u2514": "\u2534", "\u2518": "\u2534", "\u251C": "\u253C", "\u2524": "\u253C", "\u252C": "\u252C", "\u2534": "\u2534" },
  "\u2502": { "\u2500": "\u253C", "\u250C": "\u251C", "\u2510": "\u2524", "\u2514": "\u251C", "\u2518": "\u2524", "\u251C": "\u251C", "\u2524": "\u2524", "\u252C": "\u253C", "\u2534": "\u253C" },
  "\u250C": { "\u2500": "\u252C", "\u2502": "\u251C", "\u2510": "\u252C", "\u2514": "\u251C", "\u2518": "\u253C", "\u251C": "\u251C", "\u2524": "\u253C", "\u252C": "\u252C", "\u2534": "\u253C" },
  "\u2510": { "\u2500": "\u252C", "\u2502": "\u2524", "\u250C": "\u252C", "\u2514": "\u253C", "\u2518": "\u2524", "\u251C": "\u253C", "\u2524": "\u2524", "\u252C": "\u252C", "\u2534": "\u253C" },
  "\u2514": { "\u2500": "\u2534", "\u2502": "\u251C", "\u250C": "\u251C", "\u2510": "\u253C", "\u2518": "\u2534", "\u251C": "\u251C", "\u2524": "\u253C", "\u252C": "\u253C", "\u2534": "\u2534" },
  "\u2518": { "\u2500": "\u2534", "\u2502": "\u2524", "\u250C": "\u253C", "\u2510": "\u2524", "\u2514": "\u2534", "\u251C": "\u253C", "\u2524": "\u2524", "\u252C": "\u253C", "\u2534": "\u2534" },
  "\u251C": { "\u2500": "\u253C", "\u2502": "\u251C", "\u250C": "\u251C", "\u2510": "\u253C", "\u2514": "\u251C", "\u2518": "\u253C", "\u2524": "\u253C", "\u252C": "\u253C", "\u2534": "\u253C" },
  "\u2524": { "\u2500": "\u253C", "\u2502": "\u2524", "\u250C": "\u253C", "\u2510": "\u2524", "\u2514": "\u253C", "\u2518": "\u2524", "\u251C": "\u253C", "\u252C": "\u253C", "\u2534": "\u253C" },
  "\u252C": { "\u2500": "\u252C", "\u2502": "\u253C", "\u250C": "\u252C", "\u2510": "\u252C", "\u2514": "\u253C", "\u2518": "\u253C", "\u251C": "\u253C", "\u2524": "\u253C", "\u2534": "\u253C" },
  "\u2534": { "\u2500": "\u2534", "\u2502": "\u253C", "\u250C": "\u253C", "\u2510": "\u253C", "\u2514": "\u2534", "\u2518": "\u2534", "\u251C": "\u253C", "\u2524": "\u253C", "\u252C": "\u253C" }
};
function mergeJunctions(c1, c2) {
  return JUNCTION_MAP[c1]?.[c2] ?? c1;
}
function mergeCanvases(base, offset, useAscii, ...overlays) {
  let [maxX, maxY] = getCanvasSize(base);
  for (let overlay of overlays) {
    let [oX, oY] = getCanvasSize(overlay);
    maxX = Math.max(maxX, oX + offset.x), maxY = Math.max(maxY, oY + offset.y);
  }
  let merged = mkCanvas(maxX, maxY);
  for (let x = 0; x <= maxX; x++)
    for (let y = 0; y <= maxY; y++)
      x < base.length && y < base[0].length && (merged[x][y] = base[x][y]);
  for (let overlay of overlays)
    for (let x = 0; x < overlay.length; x++)
      for (let y = 0; y < overlay[0].length; y++) {
        let c = overlay[x][y];
        if (c !== " ") {
          let mx = x + offset.x, my = y + offset.y, current = merged[mx][my];
          !useAscii && isJunctionChar(c) && isJunctionChar(current) ? merged[mx][my] = mergeJunctions(current, c) : isAlphanumeric(current) && isAlphanumeric(c) || (merged[mx][my] = c);
        }
      }
  return merged;
}
function canvasToString(canvas2, options) {
  let [maxX, maxY] = getCanvasSize(canvas2), lines = [], roleCanvas = options?.roleCanvas, colorMode = options?.colorMode ?? "none", theme = options?.theme ?? DEFAULT_ASCII_THEME;
  for (let y = 0; y <= maxY; y++)
    if (colorMode === "none" || !roleCanvas) {
      let line2 = "";
      for (let x = 0; x <= maxX; x++)
        line2 += canvas2[x][y];
      lines.push(line2);
    } else {
      let chars = [], roles = [];
      for (let x = 0; x <= maxX; x++)
        chars.push(canvas2[x][y]), roles.push(roleCanvas[x]?.[y] ?? null);
      lines.push(colorizeLine(chars, roles, theme, colorMode));
    }
  return lines.join(`
`);
}
var VERTICAL_FLIP_MAP = {
  // Unicode arrows
  "\u25B2": "\u25BC",
  "\u25BC": "\u25B2",
  "\u25E4": "\u25E3",
  "\u25E3": "\u25E4",
  "\u25E5": "\u25E2",
  "\u25E2": "\u25E5",
  // ASCII arrows
  "^": "v",
  v: "^",
  // Unicode corners
  "\u250C": "\u2514",
  "\u2514": "\u250C",
  "\u2510": "\u2518",
  "\u2518": "\u2510",
  // Unicode junctions (T-pieces flip vertically)
  "\u252C": "\u2534",
  "\u2534": "\u252C",
  // Box-start junctions (exit points from node boxes)
  "\u2575": "\u2577",
  "\u2577": "\u2575"
};
function flipCanvasVertically(canvas2) {
  for (let col of canvas2)
    col.reverse();
  for (let col of canvas2)
    for (let y = 0; y < col.length; y++) {
      let flipped = VERTICAL_FLIP_MAP[col[y]];
      flipped && (col[y] = flipped);
    }
  return canvas2;
}
function flipRoleCanvasVertically(roleCanvas) {
  for (let col of roleCanvas)
    col.reverse();
  return roleCanvas;
}
function drawText(canvas2, start, text, forceOverwrite = false) {
  increaseSize(canvas2, start.x + text.length, start.y);
  for (let i = 0; i < text.length; i++) {
    let x = start.x + i, current = canvas2[x][start.y];
    (forceOverwrite || current === " ") && (canvas2[x][start.y] = text[i]);
  }
}
function setCanvasSizeToGrid(canvas2, columnWidth, rowHeight) {
  let maxX = 0, maxY = 0;
  for (let w of columnWidth.values()) maxX += w;
  for (let h of rowHeight.values()) maxY += h;
  increaseSize(canvas2, maxX - 1, maxY - 1);
}
function setRoleCanvasSizeToGrid(roleCanvas, columnWidth, rowHeight) {
  let maxX = 0, maxY = 0;
  for (let w of columnWidth.values()) maxX += w;
  for (let h of rowHeight.values()) maxY += h;
  increaseRoleCanvasSize(roleCanvas, maxX - 1, maxY - 1);
}
function convertToAsciiGraph(parsed, config) {
  let nodeMap = /* @__PURE__ */ new Map(), index = 0;
  for (let [id, mNode] of parsed.nodes) {
    let asciiNode = {
      // Use the parser ID as the unique identity key to avoid collisions
      // when multiple nodes share the same label (e.g. A[Web Server], C[Web Server]).
      name: id,
      // The label is used for rendering inside the box.
      displayLabel: mNode.label,
      // Preserve shape from parser for shape-aware rendering
      shape: mNode.shape,
      index,
      gridCoord: null,
      drawingCoord: null,
      drawing: null,
      drawn: false,
      styleClassName: "",
      styleClass: EMPTY_STYLE
    };
    nodeMap.set(id, asciiNode), index++;
  }
  let nodes = [...nodeMap.values()], edges = [];
  for (let mEdge of parsed.edges) {
    let from = nodeMap.get(mEdge.source), to = nodeMap.get(mEdge.target);
    !from || !to || edges.push({
      from,
      to,
      text: mEdge.label ?? "",
      path: [],
      labelLine: [],
      startDir: { x: 0, y: 0 },
      endDir: { x: 0, y: 0 },
      style: mEdge.style,
      hasArrowStart: mEdge.hasArrowStart,
      hasArrowEnd: mEdge.hasArrowEnd
    });
  }
  let subgraphs = [];
  for (let mSg of parsed.subgraphs)
    convertSubgraph(mSg, null, nodeMap, subgraphs);
  deduplicateSubgraphNodes(parsed.subgraphs, subgraphs, nodeMap, parsed);
  for (let [nodeId, className] of parsed.classAssignments) {
    let node = nodeMap.get(nodeId), classDef = parsed.classDefs.get(className);
    node && classDef && (node.styleClassName = className, node.styleClass = { name: className, styles: classDef });
  }
  return {
    nodes,
    edges,
    canvas: mkCanvas(0, 0),
    roleCanvas: mkRoleCanvas(0, 0),
    grid: /* @__PURE__ */ new Map(),
    columnWidth: /* @__PURE__ */ new Map(),
    rowHeight: /* @__PURE__ */ new Map(),
    subgraphs,
    config,
    offsetX: 0,
    offsetY: 0,
    bundles: []
    // Populated by analyzeEdgeBundles() during layout
  };
}
function convertSubgraph(mSg, parent, nodeMap, allSubgraphs) {
  let normalizedDirection;
  mSg.direction && (normalizedDirection = mSg.direction === "LR" || mSg.direction === "RL" ? "LR" : "TD");
  let sg = {
    name: mSg.label,
    nodes: [],
    parent,
    children: [],
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
    direction: normalizedDirection
  };
  for (let nodeId of mSg.nodeIds) {
    let node = nodeMap.get(nodeId);
    node && sg.nodes.push(node);
  }
  allSubgraphs.push(sg);
  for (let childMSg of mSg.children) {
    let child = convertSubgraph(childMSg, sg, nodeMap, allSubgraphs);
    sg.children.push(child);
    for (let childNode of child.nodes)
      sg.nodes.includes(childNode) || sg.nodes.push(childNode);
  }
  return sg;
}
function deduplicateSubgraphNodes(mermaidSubgraphs, asciiSubgraphs, nodeMap, parsed) {
  let sgMap = /* @__PURE__ */ new Map();
  buildSgMap(mermaidSubgraphs, asciiSubgraphs, sgMap);
  let nodeOwner = /* @__PURE__ */ new Map();
  function claimNodes(mSg) {
    let asciiSg = sgMap.get(mSg);
    if (asciiSg) {
      for (let child of mSg.children)
        claimNodes(child);
      for (let nodeId of mSg.nodeIds)
        nodeOwner.has(nodeId) || nodeOwner.set(nodeId, asciiSg);
    }
  }
  for (let mSg of mermaidSubgraphs)
    claimNodes(mSg);
  for (let asciiSg of asciiSubgraphs)
    asciiSg.nodes = asciiSg.nodes.filter((node) => {
      let nodeId;
      for (let [id, n] of nodeMap)
        if (n === node) {
          nodeId = id;
          break;
        }
      if (!nodeId) return false;
      let owner = nodeOwner.get(nodeId);
      return owner ? isAncestorOrSelf(asciiSg, owner) : true;
    });
}
function isAncestorOrSelf(candidate, target) {
  let current = target;
  for (; current !== null; ) {
    if (current === candidate) return true;
    current = current.parent;
  }
  return false;
}
function buildSgMap(mSgs, aSgs, result) {
  let flatMermaid = [];
  function flatten(sgs) {
    for (let sg of sgs)
      flatMermaid.push(sg), flatten(sg.children);
  }
  flatten(mSgs);
  for (let i = 0; i < flatMermaid.length && i < aSgs.length; i++)
    result.set(flatMermaid[i], aSgs[i]);
}
var MinHeap = class {
  items = [];
  size() {
    return this.items.length;
  }
  push(item) {
    this.items.push(item), this.bubbleUp(this.items.length - 1);
  }
  pop() {
    if (this.items.length === 0) return;
    let top = this.items[0], last = this.items.pop();
    return this.items.length > 0 && (this.items[0] = last, this.sinkDown(0)), top;
  }
  bubbleUp(i) {
    for (; i > 0; ) {
      let parent = i - 1 >> 1;
      if (this.items[i].priority < this.items[parent].priority)
        [this.items[i], this.items[parent]] = [this.items[parent], this.items[i]], i = parent;
      else
        break;
    }
  }
  sinkDown(i) {
    let n = this.items.length;
    for (; ; ) {
      let smallest = i, left = 2 * i + 1, right = 2 * i + 2;
      if (left < n && this.items[left].priority < this.items[smallest].priority && (smallest = left), right < n && this.items[right].priority < this.items[smallest].priority && (smallest = right), smallest !== i)
        [this.items[i], this.items[smallest]] = [this.items[smallest], this.items[i]], i = smallest;
      else
        break;
    }
  }
};
function heuristic(a, b) {
  let absX = Math.abs(a.x - b.x), absY = Math.abs(a.y - b.y);
  return absX === 0 || absY === 0 ? absX + absY : absX + absY + 1;
}
var MOVE_DIRS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 }
];
function isFreeInGrid(grid, c) {
  return c.x < 0 || c.y < 0 ? false : !grid.has(gridKey(c));
}
function getPath(grid, from, to) {
  let pq = new MinHeap();
  pq.push({ coord: from, priority: 0 });
  let costSoFar = /* @__PURE__ */ new Map();
  costSoFar.set(gridKey(from), 0);
  let cameFrom = /* @__PURE__ */ new Map();
  cameFrom.set(gridKey(from), null);
  let steps = 0;
  for (; pq.size() > 0; ) {
    if (++steps > 5e4) throw new Error("mermaid edge routing gave up");
    let current = pq.pop().coord;
    if (gridCoordEquals(current, to)) {
      let path = [], c = current;
      for (; c !== null; )
        path.unshift(c), c = cameFrom.get(gridKey(c)) ?? null;
      return path;
    }
    let currentCost = costSoFar.get(gridKey(current));
    for (let dir of MOVE_DIRS) {
      let next = { x: current.x + dir.x, y: current.y + dir.y };
      if (!isFreeInGrid(grid, next) && !gridCoordEquals(next, to))
        continue;
      let newCost = currentCost + 1, nextKey = gridKey(next), existingCost = costSoFar.get(nextKey);
      if (existingCost === void 0 || newCost < existingCost) {
        costSoFar.set(nextKey, newCost);
        let priority = newCost + heuristic(next, to);
        pq.push({ coord: next, priority }), cameFrom.set(nextKey, current);
      }
    }
  }
  return null;
}
function mergePath(path) {
  if (path.length <= 2) return path;
  let toRemove = /* @__PURE__ */ new Set(), step0 = path[0], step1 = path[1];
  for (let idx = 2; idx < path.length; idx++) {
    let step2 = path[idx], prevDx = step1.x - step0.x, prevDy = step1.y - step0.y, dx = step2.x - step1.x, dy = step2.y - step1.y;
    prevDx === dx && prevDy === dy && toRemove.add(idx - 1), step0 = step1, step1 = step2;
  }
  return path.filter((_, i) => !toRemove.has(i));
}
function getOpposite(d) {
  return d === Up ? Down : d === Down ? Up : d === Left ? Right : d === Right ? Left : d === UpperRight ? LowerLeft : d === UpperLeft ? LowerRight : d === LowerRight ? UpperLeft : d === LowerLeft ? UpperRight : Middle;
}
function dirEquals(a, b) {
  return a.x === b.x && a.y === b.y;
}
function determineDirection(from, to) {
  return from.x === to.x ? from.y < to.y ? Down : Up : from.y === to.y ? from.x < to.x ? Right : Left : from.x < to.x ? from.y < to.y ? LowerRight : UpperRight : from.y < to.y ? LowerLeft : UpperLeft;
}
function selfReferenceDirection(graphDirection) {
  return graphDirection === "LR" ? [Right, Down, Down, Right] : [Down, Right, Right, Down];
}
function determineStartAndEndDir(edge, graphDirection) {
  if (edge.from === edge.to) return selfReferenceDirection(graphDirection);
  let d = determineDirection(edge.from.gridCoord, edge.to.gridCoord), preferredDir, preferredOppositeDir, alternativeDir, alternativeOppositeDir, isBackwards = graphDirection === "LR" ? dirEquals(d, Left) || dirEquals(d, UpperLeft) || dirEquals(d, LowerLeft) : dirEquals(d, Up) || dirEquals(d, UpperLeft) || dirEquals(d, UpperRight);
  return dirEquals(d, LowerRight) ? graphDirection === "LR" ? (preferredDir = Down, preferredOppositeDir = Left, alternativeDir = Right, alternativeOppositeDir = Up) : (preferredDir = Right, preferredOppositeDir = Up, alternativeDir = Down, alternativeOppositeDir = Left) : dirEquals(d, UpperRight) ? graphDirection === "LR" ? (preferredDir = Up, preferredOppositeDir = Left, alternativeDir = Right, alternativeOppositeDir = Down) : (preferredDir = Right, preferredOppositeDir = Down, alternativeDir = Up, alternativeOppositeDir = Left) : dirEquals(d, LowerLeft) ? graphDirection === "LR" ? (preferredDir = Down, preferredOppositeDir = Down, alternativeDir = Left, alternativeOppositeDir = Up) : (preferredDir = Left, preferredOppositeDir = Up, alternativeDir = Down, alternativeOppositeDir = Right) : dirEquals(d, UpperLeft) ? graphDirection === "LR" ? (preferredDir = Down, preferredOppositeDir = Down, alternativeDir = Left, alternativeOppositeDir = Down) : (preferredDir = Right, preferredOppositeDir = Right, alternativeDir = Up, alternativeOppositeDir = Right) : isBackwards ? graphDirection === "LR" && dirEquals(d, Left) ? (preferredDir = Down, preferredOppositeDir = Down, alternativeDir = Left, alternativeOppositeDir = Right) : graphDirection === "TD" && dirEquals(d, Up) ? (preferredDir = Right, preferredOppositeDir = Right, alternativeDir = Up, alternativeOppositeDir = Down) : (preferredDir = d, preferredOppositeDir = getOpposite(d), alternativeDir = d, alternativeOppositeDir = getOpposite(d)) : (preferredDir = d, preferredOppositeDir = getOpposite(d), alternativeDir = d, alternativeOppositeDir = getOpposite(d)), [preferredDir, preferredOppositeDir, alternativeDir, alternativeOppositeDir];
}
function determinePath(graph, edge) {
  let sourceSg = getNodeSubgraph(graph, edge.from), targetSg = getNodeSubgraph(graph, edge.to), effectiveDir = sourceSg && sourceSg === targetSg && sourceSg.direction ? sourceSg.direction : graph.config.graphDirection, [preferredDir, preferredOppositeDir, alternativeDir, alternativeOppositeDir] = determineStartAndEndDir(edge, effectiveDir), prefFrom = gridCoordDirection(edge.from.gridCoord, preferredDir), prefTo = gridCoordDirection(edge.to.gridCoord, preferredOppositeDir), preferredPath = getPath(graph.grid, prefFrom, prefTo), altFrom = gridCoordDirection(edge.from.gridCoord, alternativeDir), altTo = gridCoordDirection(edge.to.gridCoord, alternativeOppositeDir), alternativePath = getPath(graph.grid, altFrom, altTo);
  if (preferredPath !== null && alternativePath !== null) {
    preferredPath = mergePath(preferredPath), alternativePath = mergePath(alternativePath), preferredPath.length <= alternativePath.length ? (edge.startDir = preferredDir, edge.endDir = preferredOppositeDir, edge.path = preferredPath) : (edge.startDir = alternativeDir, edge.endDir = alternativeOppositeDir, edge.path = alternativePath);
    return;
  }
  if (preferredPath !== null) {
    edge.startDir = preferredDir, edge.endDir = preferredOppositeDir, edge.path = mergePath(preferredPath);
    return;
  }
  if (alternativePath !== null) {
    edge.startDir = alternativeDir, edge.endDir = alternativeOppositeDir, edge.path = mergePath(alternativePath);
    return;
  }
  edge.startDir = preferredDir, edge.endDir = preferredOppositeDir, edge.path = [prefFrom, prefTo];
}
function determineLabelLine(graph, edge) {
  if (edge.text.length === 0) return;
  let lenLabel = edge.text.length, pathLen = edge.path.length, isVerticalFlow = graph.config.graphDirection === "TD", segments = [];
  for (let i = 1; i < pathLen; i++) {
    let p1 = edge.path[i - 1], p2 = edge.path[i], line2 = [p1, p2], width2 = calculateLineWidth(graph, line2), isVertical = p1.x === p2.x;
    segments.push({ line: line2, width: width2, index: i, isVertical });
  }
  let suitableSegments = segments.filter((s) => s.width >= lenLabel && s.index > 1), largestLine;
  if (suitableSegments.length > 0)
    suitableSegments.sort((a, b) => b.index - a.index), largestLine = suitableSegments[0].line;
  else {
    let fallbackSegments = segments.filter((s) => s.width >= lenLabel);
    fallbackSegments.length > 0 ? (fallbackSegments.sort((a, b) => b.index - a.index), largestLine = fallbackSegments[0].line) : (segments.sort((a, b) => b.width - a.width), largestLine = segments[0]?.line ?? [edge.path[0], edge.path[1]]);
  }
  let minX = Math.min(largestLine[0].x, largestLine[1].x), maxX = Math.max(largestLine[0].x, largestLine[1].x), middleX = minX + Math.floor((maxX - minX) / 2), current = graph.columnWidth.get(middleX) ?? 0;
  graph.columnWidth.set(middleX, Math.max(current, lenLabel + 2)), edge.labelLine = [largestLine[0], largestLine[1]];
}
function calculateLineWidth(graph, line2) {
  let total = 0, startX = Math.min(line2[0].x, line2[1].x), endX = Math.max(line2[0].x, line2[1].x);
  for (let x = startX; x <= endX; x++)
    total += graph.columnWidth.get(x) ?? 0;
  return total;
}
function analyzeEdgeBundles(graph) {
  if (graph.config.graphDirection !== "TD")
    return [];
  let bundles = [], bundledEdges = /* @__PURE__ */ new Set(), edgesByTarget = /* @__PURE__ */ new Map();
  for (let edge of graph.edges) {
    if (edge.from === edge.to) continue;
    let existing = edgesByTarget.get(edge.to) ?? [];
    existing.push(edge), edgesByTarget.set(edge.to, existing);
  }
  for (let [target, edges] of edgesByTarget) {
    if (edges.length < 2 || !canBundle(edges, graph) || edges.some((e) => bundledEdges.has(e))) continue;
    let bundle = {
      type: "fan-in",
      edges: [...edges],
      sharedNode: target,
      otherNodes: edges.map((e) => e.from),
      junctionPoint: null,
      sharedPath: [],
      junctionDir: Middle,
      sharedNodeDir: Middle
    };
    for (let edge of edges)
      edge.bundle = bundle, bundledEdges.add(edge);
    bundles.push(bundle);
  }
  let edgesBySource = /* @__PURE__ */ new Map();
  for (let edge of graph.edges) {
    if (edge.from === edge.to || bundledEdges.has(edge)) continue;
    let existing = edgesBySource.get(edge.from) ?? [];
    existing.push(edge), edgesBySource.set(edge.from, existing);
  }
  for (let [source, edges] of edgesBySource) {
    if (edges.length < 2 || !canBundle(edges, graph)) continue;
    let bundle = {
      type: "fan-out",
      edges: [...edges],
      sharedNode: source,
      otherNodes: edges.map((e) => e.to),
      junctionPoint: null,
      sharedPath: [],
      junctionDir: Middle,
      sharedNodeDir: Middle
    };
    for (let edge of edges)
      edge.bundle = bundle, bundledEdges.add(edge);
    bundles.push(bundle);
  }
  return bundles;
}
function canBundle(edges, graph) {
  if (edges.length < 2) return false;
  let firstStyle = edges[0].style, firstFromSg = getNodeSubgraph(graph, edges[0].from), firstToSg = getNodeSubgraph(graph, edges[0].to);
  for (let edge of edges) {
    if (edge.style !== firstStyle || edge.text.length > 0) return false;
    let fromSg = getNodeSubgraph(graph, edge.from), toSg = getNodeSubgraph(graph, edge.to);
    if (fromSg !== firstFromSg || toSg !== firstToSg || fromSg !== toSg) return false;
  }
  return true;
}
function calculateJunctionPoint(graph, bundle) {
  let dir = graph.config.graphDirection, sharedCoord = bundle.sharedNode.gridCoord, otherCoords = bundle.otherNodes.map((n) => n.gridCoord);
  if (bundle.type === "fan-in") {
    let minX = Math.min(...otherCoords.map((c) => c.x)), maxX = Math.max(...otherCoords.map((c) => c.x)), minY = Math.min(...otherCoords.map((c) => c.y)), maxY = Math.max(...otherCoords.map((c) => c.y));
    if (dir === "TD") {
      let junctionY = sharedCoord.y - 1, centerX = Math.floor((minX + maxX) / 2) + 1;
      return { x: sharedCoord.x + 1, y: junctionY };
    } else {
      let junctionX = sharedCoord.x - 1, junctionY = sharedCoord.y + 1;
      return { x: junctionX, y: junctionY };
    }
  } else {
    let minX = Math.min(...otherCoords.map((c) => c.x)), maxX = Math.max(...otherCoords.map((c) => c.x)), minY = Math.min(...otherCoords.map((c) => c.y)), maxY = Math.max(...otherCoords.map((c) => c.y));
    if (dir === "TD") {
      let junctionY = sharedCoord.y + 3;
      return { x: sharedCoord.x + 1, y: junctionY };
    } else {
      let junctionX = sharedCoord.x + 3, junctionY = sharedCoord.y + 1;
      return { x: junctionX, y: junctionY };
    }
  }
}
function routeBundledEdges(graph, bundle) {
  let dir = graph.config.graphDirection;
  bundle.junctionPoint = calculateJunctionPoint(graph, bundle);
  let junction = bundle.junctionPoint;
  if (bundle.type === "fan-in") {
    bundle.junctionDir = dir === "TD" ? Up : Left, bundle.sharedNodeDir = dir === "TD" ? Down : Right;
    let targetCoord = bundle.sharedNode.gridCoord, targetEntry = dir === "TD" ? { x: targetCoord.x + 1, y: targetCoord.y } : { x: targetCoord.x, y: targetCoord.y + 1 }, sharedPath = getPath(graph.grid, junction, targetEntry);
    bundle.sharedPath = sharedPath ? mergePath(sharedPath) : [junction, targetEntry];
    for (let edge of bundle.edges) {
      let sourceCoord = edge.from.gridCoord, sourceExit = dir === "TD" ? { x: sourceCoord.x + 1, y: sourceCoord.y + 2 } : { x: sourceCoord.x + 2, y: sourceCoord.y + 1 }, pathToJunction = getPath(graph.grid, sourceExit, junction);
      edge.pathToJunction = pathToJunction ? mergePath(pathToJunction) : [sourceExit, junction], edge.startDir = dir === "TD" ? Down : Right, edge.endDir = dir === "TD" ? Up : Left, edge.path = [...edge.pathToJunction, ...bundle.sharedPath.slice(1)];
    }
  } else {
    bundle.junctionDir = dir === "TD" ? Down : Right, bundle.sharedNodeDir = dir === "TD" ? Up : Left;
    let sourceCoord = bundle.sharedNode.gridCoord, sourceExit = dir === "TD" ? { x: sourceCoord.x + 1, y: sourceCoord.y + 2 } : { x: sourceCoord.x + 2, y: sourceCoord.y + 1 }, sharedPath = getPath(graph.grid, sourceExit, junction);
    bundle.sharedPath = sharedPath ? mergePath(sharedPath) : [sourceExit, junction];
    for (let edge of bundle.edges) {
      let targetCoord = edge.to.gridCoord, targetEntry = dir === "TD" ? { x: targetCoord.x + 1, y: targetCoord.y } : { x: targetCoord.x, y: targetCoord.y + 1 }, pathToJunction = getPath(graph.grid, junction, targetEntry);
      edge.pathToJunction = pathToJunction ? mergePath(pathToJunction) : [junction, targetEntry], edge.startDir = dir === "TD" ? Down : Right, edge.endDir = dir === "TD" ? Up : Left, edge.path = [...bundle.sharedPath, ...edge.pathToJunction.slice(1)];
    }
  }
}
function processBundles(graph) {
  for (let bundle of graph.bundles)
    routeBundledEdges(graph, bundle);
}
function splitLines(label) {
  return label.split(`
`);
}
function maxLineWidth(label) {
  let lines = splitLines(label);
  return Math.max(...lines.map((l) => l.length), 0);
}
function lineCount(label) {
  return splitLines(label).length;
}
var SHAPE_CORNERS = {
  // Standard rectangular shapes
  rectangle: {
    unicode: { tl: "\u250C", tr: "\u2510", bl: "\u2514", br: "\u2518" },
    ascii: { tl: "+", tr: "+", bl: "+", br: "+" }
  },
  rounded: {
    unicode: { tl: "\u256D", tr: "\u256E", bl: "\u2570", br: "\u256F" },
    ascii: { tl: ".", tr: ".", bl: "'", br: "'" }
  },
  // Circular shapes - use circle markers at corners
  circle: {
    unicode: { tl: "\u25EF", tr: "\u25EF", bl: "\u25EF", br: "\u25EF" },
    ascii: { tl: "o", tr: "o", bl: "o", br: "o" }
  },
  doublecircle: {
    unicode: { tl: "\u25CE", tr: "\u25CE", bl: "\u25CE", br: "\u25CE" },
    ascii: { tl: "@", tr: "@", bl: "@", br: "@" }
  },
  // Diamond - decision nodes
  diamond: {
    unicode: { tl: "\u25C7", tr: "\u25C7", bl: "\u25C7", br: "\u25C7" },
    ascii: { tl: "<", tr: ">", bl: "<", br: ">" }
  },
  // Hexagon - process nodes (crop corners — monospace-safe, distinct from rectangle)
  hexagon: {
    unicode: { tl: "\u231C", tr: "\u231D", bl: "\u231E", br: "\u231F" },
    ascii: { tl: "*", tr: "*", bl: "*", br: "*" }
  },
  // Stadium/pill shape
  stadium: {
    unicode: { tl: "(", tr: ")", bl: "(", br: ")" },
    ascii: { tl: "(", tr: ")", bl: "(", br: ")" }
  },
  // Subroutine - double vertical bars
  subroutine: {
    unicode: { tl: "\u255F", tr: "\u2562", bl: "\u255F", br: "\u2562" },
    ascii: { tl: "|", tr: "|", bl: "|", br: "|" }
  },
  // Cylinder/database
  cylinder: {
    unicode: { tl: "\u256D", tr: "\u256E", bl: "\u2570", br: "\u256F" },
    ascii: { tl: ".", tr: ".", bl: "'", br: "'" }
  },
  // Asymmetric/flag - pointer on left side
  asymmetric: {
    unicode: { tl: "\u25B7", tr: "\u2510", bl: "\u25B7", br: "\u2518" },
    ascii: { tl: ">", tr: "+", bl: ">", br: "+" }
  },
  // Trapezoid - wider at bottom (top corners slope inward)
  trapezoid: {
    unicode: { tl: "/", tr: "\\", bl: "\u2514", br: "\u2518" },
    ascii: { tl: "/", tr: "\\", bl: "+", br: "+" }
  },
  // Trapezoid-alt - wider at top (bottom corners slope inward)
  "trapezoid-alt": {
    unicode: { tl: "\u250C", tr: "\u2510", bl: "\\", br: "/" },
    ascii: { tl: "+", tr: "+", bl: "\\", br: "/" }
  },
  // State diagram pseudostates (special handling, not corner-based)
  "state-start": {
    unicode: { tl: "\u25CF", tr: "\u25CF", bl: "\u25CF", br: "\u25CF" },
    ascii: { tl: "*", tr: "*", bl: "*", br: "*" }
  },
  "state-end": {
    unicode: { tl: "\u25C9", tr: "\u25C9", bl: "\u25C9", br: "\u25C9" },
    ascii: { tl: "@", tr: "@", bl: "@", br: "@" }
  }
};
function getCorners(shape, useAscii) {
  let corners = SHAPE_CORNERS[shape] ?? SHAPE_CORNERS.rectangle;
  return useAscii ? corners.ascii : corners.unicode;
}
function getBoxDimensions(label, options) {
  let lines = splitLines(label), maxLineWidth2 = Math.max(...lines.map((l) => l.length), 0), lineCount2 = lines.length, innerWidth = 2 * options.padding + maxLineWidth2, width2 = innerWidth + 2, rawInnerHeight = lineCount2 + 2 * options.padding, innerHeight = rawInnerHeight % 2 === 0 ? rawInnerHeight + 1 : rawInnerHeight, height = innerHeight + 2;
  return {
    width: width2,
    height,
    labelArea: {
      x: 1 + options.padding,
      y: 1 + options.padding,
      width: maxLineWidth2,
      height: lineCount2
    },
    // Grid layout: [border=1, content, border=1]
    gridColumns: [1, innerWidth, 1],
    gridRows: [1, innerHeight, 1]
  };
}
function renderBox(label, dimensions, corners, useAscii) {
  let { width: width2, height } = dimensions, canvas2 = mkCanvas(width2 - 1, height - 1), from = { x: 0, y: 0 }, to = { x: width2 - 1, y: height - 1 }, hLine = useAscii ? "-" : "\u2500", vLine = useAscii ? "|" : "\u2502";
  for (let x = from.x + 1; x < to.x; x++)
    canvas2[x][from.y] = hLine, canvas2[x][to.y] = hLine;
  for (let y = from.y + 1; y < to.y; y++)
    canvas2[from.x][y] = vLine, canvas2[to.x][y] = vLine;
  canvas2[from.x][from.y] = corners.tl, canvas2[to.x][from.y] = corners.tr, canvas2[from.x][to.y] = corners.bl, canvas2[to.x][to.y] = corners.br;
  let lines = splitLines(label), w = width2 - 1, h = height - 1, startY = Math.floor(h / 2) - Math.floor((lines.length - 1) / 2);
  for (let i = 0; i < lines.length; i++) {
    let line2 = lines[i], textX = Math.floor(w / 2) - Math.ceil(line2.length / 2) + 1;
    for (let j = 0; j < line2.length; j++) {
      let x = textX + j, y = startY + i;
      x >= 0 && x < canvas2.length && y >= 0 && y < canvas2[0].length && (canvas2[x][y] = line2[j]);
    }
  }
  return canvas2;
}
function getBoxAttachmentPoint(dir, dimensions, baseCoord) {
  let { width: width2, height } = dimensions, centerX = baseCoord.x + Math.floor(width2 / 2), centerY = baseCoord.y + Math.floor(height / 2);
  return dirEquals(dir, Up) ? { x: centerX, y: baseCoord.y } : dirEquals(dir, Down) ? { x: centerX, y: baseCoord.y + height - 1 } : dirEquals(dir, Left) ? { x: baseCoord.x, y: centerY } : dirEquals(dir, Right) ? { x: baseCoord.x + width2 - 1, y: centerY } : dirEquals(dir, UpperLeft) ? { x: baseCoord.x, y: baseCoord.y } : dirEquals(dir, UpperRight) ? { x: baseCoord.x + width2 - 1, y: baseCoord.y } : dirEquals(dir, LowerLeft) ? { x: baseCoord.x, y: baseCoord.y + height - 1 } : dirEquals(dir, LowerRight) ? { x: baseCoord.x + width2 - 1, y: baseCoord.y + height - 1 } : { x: centerX, y: centerY };
}
var rectangleRenderer = {
  getDimensions: getBoxDimensions,
  render(label, dimensions, options) {
    let corners = getCorners("rectangle", options.useAscii);
    return renderBox(label, dimensions, corners, options.useAscii);
  },
  getAttachmentPoint: getBoxAttachmentPoint
};
var diamondRenderer = {
  getDimensions: getBoxDimensions,
  render(label, dimensions, options) {
    let corners = getCorners("diamond", options.useAscii);
    return renderBox(label, dimensions, corners, options.useAscii);
  },
  getAttachmentPoint: getBoxAttachmentPoint
};
var circleRenderer = {
  getDimensions: getBoxDimensions,
  render(label, dimensions, options) {
    let corners = getCorners("circle", options.useAscii);
    return renderBox(label, dimensions, corners, options.useAscii);
  },
  getAttachmentPoint: getBoxAttachmentPoint
};
var stateStartRenderer = {
  getDimensions(_label, _options) {
    return {
      width: 5,
      height: 3,
      labelArea: { x: 2, y: 1, width: 1, height: 1 },
      gridColumns: [1, 3, 1],
      gridRows: [1, 1, 1]
    };
  },
  render(_label, dimensions, options) {
    let { width: width2, height } = dimensions, canvas2 = mkCanvas(width2 - 1, height - 1), centerX = Math.floor(width2 / 2);
    return options.useAscii ? (canvas2[0][0] = ".", canvas2[1][0] = "-", canvas2[2][0] = "-", canvas2[3][0] = "-", canvas2[4][0] = ".", canvas2[0][1] = "|", canvas2[centerX][1] = "*", canvas2[4][1] = "|", canvas2[0][2] = "'", canvas2[1][2] = "-", canvas2[2][2] = "-", canvas2[3][2] = "-", canvas2[4][2] = "'") : (canvas2[0][0] = "\u256D", canvas2[1][0] = "\u2500", canvas2[2][0] = "\u2500", canvas2[3][0] = "\u2500", canvas2[4][0] = "\u256E", canvas2[0][1] = "\u2502", canvas2[centerX][1] = "\u25CF", canvas2[4][1] = "\u2502", canvas2[0][2] = "\u2570", canvas2[1][2] = "\u2500", canvas2[2][2] = "\u2500", canvas2[3][2] = "\u2500", canvas2[4][2] = "\u256F"), canvas2;
  },
  getAttachmentPoint(dir, dimensions, baseCoord) {
    let { width: width2, height } = dimensions, centerX = baseCoord.x + Math.floor(width2 / 2), centerY = baseCoord.y + Math.floor(height / 2);
    return dirEquals(dir, Up) ? { x: centerX, y: baseCoord.y } : dirEquals(dir, Down) ? { x: centerX, y: baseCoord.y + height - 1 } : dirEquals(dir, Left) ? { x: baseCoord.x, y: centerY } : dirEquals(dir, Right) ? { x: baseCoord.x + width2 - 1, y: centerY } : { x: centerX, y: centerY };
  }
};
var stateEndRenderer = {
  getDimensions(_label, _options) {
    return {
      width: 5,
      height: 3,
      labelArea: { x: 2, y: 1, width: 1, height: 1 },
      gridColumns: [1, 3, 1],
      gridRows: [1, 1, 1]
    };
  },
  render(_label, dimensions, options) {
    let { width: width2, height } = dimensions, canvas2 = mkCanvas(width2 - 1, height - 1), centerX = Math.floor(width2 / 2);
    return options.useAscii ? (canvas2[0][0] = "#", canvas2[1][0] = "=", canvas2[2][0] = "=", canvas2[3][0] = "=", canvas2[4][0] = "#", canvas2[0][1] = "#", canvas2[centerX][1] = "*", canvas2[4][1] = "#", canvas2[0][2] = "#", canvas2[1][2] = "=", canvas2[2][2] = "=", canvas2[3][2] = "=", canvas2[4][2] = "#") : (canvas2[0][0] = "\u2554", canvas2[1][0] = "\u2550", canvas2[2][0] = "\u2550", canvas2[3][0] = "\u2550", canvas2[4][0] = "\u2557", canvas2[0][1] = "\u2551", canvas2[centerX][1] = "\u25CE", canvas2[4][1] = "\u2551", canvas2[0][2] = "\u255A", canvas2[1][2] = "\u2550", canvas2[2][2] = "\u2550", canvas2[3][2] = "\u2550", canvas2[4][2] = "\u255D"), canvas2;
  },
  getAttachmentPoint(dir, dimensions, baseCoord) {
    let { width: width2, height } = dimensions, centerX = baseCoord.x + Math.floor(width2 / 2), centerY = baseCoord.y + Math.floor(height / 2);
    return dirEquals(dir, Up) ? { x: centerX, y: baseCoord.y } : dirEquals(dir, Down) ? { x: centerX, y: baseCoord.y + height - 1 } : dirEquals(dir, Left) ? { x: baseCoord.x, y: centerY } : dirEquals(dir, Right) ? { x: baseCoord.x + width2 - 1, y: centerY } : { x: centerX, y: centerY };
  }
};
var roundedRenderer = {
  getDimensions: getBoxDimensions,
  render(label, dimensions, options) {
    let corners = getCorners("rounded", options.useAscii);
    return renderBox(label, dimensions, corners, options.useAscii);
  },
  getAttachmentPoint: getBoxAttachmentPoint
};
var stadiumRenderer = {
  getDimensions(label, options) {
    let lines = splitLines(label), maxLineWidth2 = Math.max(...lines.map((l) => l.length), 0), lineCount2 = lines.length, innerWidth = 2 * options.padding + maxLineWidth2, width2 = innerWidth + 4, innerHeight = lineCount2 + 2 * options.padding, height = Math.max(innerHeight + 2, 3);
    return {
      width: width2,
      height,
      labelArea: {
        x: 2 + options.padding,
        y: 1 + options.padding,
        width: maxLineWidth2,
        height: lineCount2
      },
      gridColumns: [2, innerWidth, 2],
      gridRows: [1, innerHeight, 1]
    };
  },
  render(label, dimensions, options) {
    let { width: width2, height } = dimensions, canvas2 = mkCanvas(width2 - 1, height - 1), centerY = Math.floor(height / 2), hChar = options.useAscii ? "-" : "\u2500";
    if (height === 3)
      canvas2[0][centerY] = "(", canvas2[width2 - 1][centerY] = ")";
    else if (options.useAscii) {
      for (let y = 0; y < height; y++)
        canvas2[0][y] = "(", canvas2[width2 - 1][y] = ")";
      for (let x = 1; x < width2 - 1; x++)
        canvas2[x][0] = hChar, canvas2[x][height - 1] = hChar;
    } else {
      canvas2[0][0] = "\u256D";
      for (let x = 1; x < width2 - 1; x++) canvas2[x][0] = hChar;
      canvas2[width2 - 1][0] = "\u256E";
      for (let y = 1; y < height - 1; y++)
        canvas2[0][y] = "\u2502", canvas2[width2 - 1][y] = "\u2502";
      canvas2[0][height - 1] = "\u2570";
      for (let x = 1; x < width2 - 1; x++) canvas2[x][height - 1] = hChar;
      canvas2[width2 - 1][height - 1] = "\u256F";
    }
    let lines = splitLines(label), startY = centerY - Math.floor((lines.length - 1) / 2);
    for (let i = 0; i < lines.length; i++) {
      let line2 = lines[i], textX = Math.floor(width2 / 2) - Math.floor(line2.length / 2);
      for (let j = 0; j < line2.length; j++) {
        let x = textX + j, y = startY + i;
        x > 0 && x < width2 - 1 && y >= 0 && y < height && (canvas2[x][y] = line2[j]);
      }
    }
    return canvas2;
  },
  getAttachmentPoint: getBoxAttachmentPoint
};
var hexagonRenderer = {
  getDimensions: getBoxDimensions,
  render(label, dimensions, options) {
    let corners = getCorners("hexagon", options.useAscii);
    return renderBox(label, dimensions, corners, options.useAscii);
  },
  getAttachmentPoint: getBoxAttachmentPoint
};
var subroutineRenderer = {
  getDimensions(label, options) {
    let lines = splitLines(label), maxLineWidth2 = Math.max(...lines.map((l) => l.length), 0), lineCount2 = lines.length, innerWidth = 2 * options.padding + maxLineWidth2, width2 = innerWidth + 4, innerHeight = lineCount2 + 2 * options.padding, height = innerHeight + 2;
    return {
      width: width2,
      height,
      labelArea: {
        x: 2 + options.padding,
        y: 1 + options.padding,
        width: maxLineWidth2,
        height: lineCount2
      },
      gridColumns: [2, innerWidth, 2],
      gridRows: [1, innerHeight, 1]
    };
  },
  render(label, dimensions, options) {
    let { width: width2, height } = dimensions, canvas2 = mkCanvas(width2 - 1, height - 1), hChar = options.useAscii ? "-" : "\u2500", vChar = options.useAscii ? "|" : "\u2502";
    canvas2[0][0] = options.useAscii ? "+" : "\u250C", canvas2[1][0] = options.useAscii ? "+" : "\u252C";
    for (let x = 2; x < width2 - 2; x++) canvas2[x][0] = hChar;
    canvas2[width2 - 2][0] = options.useAscii ? "+" : "\u252C", canvas2[width2 - 1][0] = options.useAscii ? "+" : "\u2510";
    for (let y = 1; y < height - 1; y++)
      canvas2[0][y] = vChar, canvas2[1][y] = vChar, canvas2[width2 - 2][y] = vChar, canvas2[width2 - 1][y] = vChar;
    canvas2[0][height - 1] = options.useAscii ? "+" : "\u2514", canvas2[1][height - 1] = options.useAscii ? "+" : "\u2534";
    for (let x = 2; x < width2 - 2; x++) canvas2[x][height - 1] = hChar;
    canvas2[width2 - 2][height - 1] = options.useAscii ? "+" : "\u2534", canvas2[width2 - 1][height - 1] = options.useAscii ? "+" : "\u2518";
    let lines = splitLines(label), startY = Math.floor(height / 2) - Math.floor((lines.length - 1) / 2);
    for (let i = 0; i < lines.length; i++) {
      let line2 = lines[i], textX = Math.floor(width2 / 2) - Math.floor(line2.length / 2);
      for (let j = 0; j < line2.length; j++) {
        let x = textX + j, y = startY + i;
        x > 1 && x < width2 - 2 && y > 0 && y < height - 1 && (canvas2[x][y] = line2[j]);
      }
    }
    return canvas2;
  },
  getAttachmentPoint: getBoxAttachmentPoint
};
var doublecircleRenderer = {
  getDimensions: getBoxDimensions,
  render(label, dimensions, options) {
    let corners = getCorners("doublecircle", options.useAscii);
    return renderBox(label, dimensions, corners, options.useAscii);
  },
  getAttachmentPoint: getBoxAttachmentPoint
};
var cylinderRenderer = {
  getDimensions(label, options) {
    let lines = splitLines(label), maxLineWidth2 = Math.max(...lines.map((l) => l.length), 0), lineCount2 = lines.length, innerWidth = 2 * options.padding + maxLineWidth2, width2 = innerWidth + 2, innerHeight = lineCount2 + 2 * options.padding + 2, height = innerHeight + 2;
    return {
      width: width2,
      height,
      labelArea: {
        x: 1 + options.padding,
        y: 2 + options.padding,
        width: maxLineWidth2,
        height: lineCount2
      },
      gridColumns: [1, innerWidth, 1],
      gridRows: [2, innerHeight - 2, 2]
    };
  },
  render(label, dimensions, options) {
    let { width: width2, height } = dimensions, canvas2 = mkCanvas(width2 - 1, height - 1), hChar = options.useAscii ? "-" : "\u2500", vChar = options.useAscii ? "|" : "\u2502";
    canvas2[0][0] = options.useAscii ? "." : "\u256D";
    for (let x = 1; x < width2 - 1; x++) canvas2[x][0] = hChar;
    canvas2[width2 - 1][0] = options.useAscii ? "." : "\u256E", canvas2[0][1] = vChar;
    for (let x = 1; x < width2 - 1; x++) canvas2[x][1] = hChar;
    canvas2[width2 - 1][1] = vChar;
    for (let y = 2; y < height - 2; y++)
      canvas2[0][y] = vChar, canvas2[width2 - 1][y] = vChar;
    canvas2[0][height - 2] = vChar;
    for (let x = 1; x < width2 - 1; x++) canvas2[x][height - 2] = hChar;
    canvas2[width2 - 1][height - 2] = vChar, canvas2[0][height - 1] = options.useAscii ? "'" : "\u2570";
    for (let x = 1; x < width2 - 1; x++) canvas2[x][height - 1] = hChar;
    canvas2[width2 - 1][height - 1] = options.useAscii ? "'" : "\u256F";
    let lines = splitLines(label), startY = Math.floor(height / 2) - Math.floor((lines.length - 1) / 2);
    for (let i = 0; i < lines.length; i++) {
      let line2 = lines[i], textX = Math.floor(width2 / 2) - Math.floor(line2.length / 2);
      for (let j = 0; j < line2.length; j++) {
        let x = textX + j, y = startY + i;
        x > 0 && x < width2 - 1 && y > 1 && y < height - 2 && (canvas2[x][y] = line2[j]);
      }
    }
    return canvas2;
  },
  getAttachmentPoint: getBoxAttachmentPoint
};
var asymmetricRenderer = {
  getDimensions: getBoxDimensions,
  render(label, dimensions, options) {
    let corners = getCorners("asymmetric", options.useAscii);
    return renderBox(label, dimensions, corners, options.useAscii);
  },
  getAttachmentPoint: getBoxAttachmentPoint
};
var trapezoidRenderer = {
  getDimensions: getBoxDimensions,
  render(label, dimensions, options) {
    let corners = getCorners("trapezoid", options.useAscii);
    return renderBox(label, dimensions, corners, options.useAscii);
  },
  getAttachmentPoint: getBoxAttachmentPoint
};
var trapezoidAltRenderer = {
  getDimensions: getBoxDimensions,
  render(label, dimensions, options) {
    let corners = getCorners("trapezoid-alt", options.useAscii);
    return renderBox(label, dimensions, corners, options.useAscii);
  },
  getAttachmentPoint: getBoxAttachmentPoint
};
var shapeRegistry = /* @__PURE__ */ new Map([
  // Core shapes
  ["rectangle", rectangleRenderer],
  ["rounded", roundedRenderer],
  ["diamond", diamondRenderer],
  ["stadium", stadiumRenderer],
  ["circle", circleRenderer],
  // Batch 1 additions
  ["subroutine", subroutineRenderer],
  ["doublecircle", doublecircleRenderer],
  ["hexagon", hexagonRenderer],
  // Batch 2 additions
  ["cylinder", cylinderRenderer],
  ["asymmetric", asymmetricRenderer],
  ["trapezoid", trapezoidRenderer],
  ["trapezoid-alt", trapezoidAltRenderer],
  // State diagram pseudo-states
  ["state-start", stateStartRenderer],
  ["state-end", stateEndRenderer]
]);
function getShapeRenderer(shape) {
  return shapeRegistry.get(shape) ?? rectangleRenderer;
}
function getShapeDimensions(shape, label, options) {
  return getShapeRenderer(shape).getDimensions(label, options);
}
function getShapeAttachmentPoint(shape, dir, dimensions, baseCoord) {
  return getShapeRenderer(shape).getAttachmentPoint(dir, dimensions, baseCoord);
}
function drawNode2(node, graph) {
  return drawBoxWithGridDimensions(node, graph);
}
function drawBoxWithGridDimensions(node, graph) {
  let gc = node.gridCoord, useAscii = graph.config.useAscii, w = 0;
  for (let i = 0; i < 2; i++)
    w += graph.columnWidth.get(gc.x + i) ?? 0;
  let h = 0;
  for (let i = 0; i < 2; i++)
    h += graph.rowHeight.get(gc.y + i) ?? 0;
  let from = { x: 0, y: 0 }, to = { x: w, y: h }, box = mkCanvas(Math.max(from.x, to.x), Math.max(from.y, to.y)), corners = getCorners(node.shape, useAscii), isDoubleBox = node.shape === "state-end", hChar = useAscii ? isDoubleBox ? "=" : "-" : isDoubleBox ? "\u2550" : "\u2500", vChar = useAscii ? isDoubleBox ? "\u2016" : "|" : isDoubleBox ? "\u2551" : "\u2502", effectiveCorners = isDoubleBox ? useAscii ? { tl: "#", tr: "#", bl: "#", br: "#" } : { tl: "\u2554", tr: "\u2557", bl: "\u255A", br: "\u255D" } : corners;
  for (let x = from.x + 1; x < to.x; x++) box[x][from.y] = hChar;
  for (let x = from.x + 1; x < to.x; x++) box[x][to.y] = hChar;
  for (let y = from.y + 1; y < to.y; y++) box[from.x][y] = vChar;
  for (let y = from.y + 1; y < to.y; y++) box[to.x][y] = vChar;
  box[from.x][from.y] = effectiveCorners.tl, box[to.x][from.y] = effectiveCorners.tr, box[from.x][to.y] = effectiveCorners.bl, box[to.x][to.y] = effectiveCorners.br;
  let label = node.displayLabel, lines = splitLines(label), startY = from.y + Math.floor(h / 2) - Math.floor((lines.length - 1) / 2);
  for (let i = 0; i < lines.length; i++) {
    let line2 = lines[i], textX = from.x + Math.floor(w / 2) - Math.ceil(line2.length / 2) + 1;
    for (let j = 0; j < line2.length; j++)
      textX + j >= 0 && textX + j < box.length && startY + i >= 0 && startY + i < box[0].length && (box[textX + j][startY + i] = line2[j]);
  }
  return box;
}
function drawBox(node, graph) {
  return drawNode2(node, graph);
}
function drawMultiBox(sections, useAscii, padding = 1) {
  let maxTextWidth = 0;
  for (let section of sections)
    for (let line2 of section)
      maxTextWidth = Math.max(maxTextWidth, line2.length);
  let boxWidth = maxTextWidth + 2 * padding + 2, totalLines = 0;
  for (let section of sections)
    totalLines += Math.max(section.length, 1);
  let numDividers = sections.length - 1, boxHeight = totalLines + numDividers + 2, hLine = useAscii ? "-" : "\u2500", vLine = useAscii ? "|" : "\u2502", tl = useAscii ? "+" : "\u250C", tr = useAscii ? "+" : "\u2510", bl = useAscii ? "+" : "\u2514", br = useAscii ? "+" : "\u2518", divL = useAscii ? "+" : "\u251C", divR = useAscii ? "+" : "\u2524", canvas2 = mkCanvas(boxWidth - 1, boxHeight - 1);
  canvas2[0][0] = tl;
  for (let x = 1; x < boxWidth - 1; x++) canvas2[x][0] = hLine;
  canvas2[boxWidth - 1][0] = tr, canvas2[0][boxHeight - 1] = bl;
  for (let x = 1; x < boxWidth - 1; x++) canvas2[x][boxHeight - 1] = hLine;
  canvas2[boxWidth - 1][boxHeight - 1] = br;
  for (let y = 1; y < boxHeight - 1; y++)
    canvas2[0][y] = vLine, canvas2[boxWidth - 1][y] = vLine;
  let row = 1;
  for (let s = 0; s < sections.length; s++) {
    let section = sections[s], lines = section.length > 0 ? section : [""];
    for (let line2 of lines) {
      let startX = 1 + padding;
      for (let i = 0; i < line2.length; i++)
        canvas2[startX + i][row] = line2[i];
      row++;
    }
    if (s < sections.length - 1) {
      canvas2[0][row] = divL;
      for (let x = 1; x < boxWidth - 1; x++) canvas2[x][row] = hLine;
      canvas2[boxWidth - 1][row] = divR, row++;
    }
  }
  return canvas2;
}
var LINE_CHARS = {
  solid: {
    h: { unicode: "\u2500", ascii: "-" },
    v: { unicode: "\u2502", ascii: "|" }
  },
  dotted: {
    h: { unicode: "\u2504", ascii: "." },
    v: { unicode: "\u2506", ascii: ":" }
  },
  thick: {
    h: { unicode: "\u2501", ascii: "=" },
    v: { unicode: "\u2503", ascii: "\u2016" }
  }
};
function drawLine(canvas2, from, to, offsetFrom, offsetTo, useAscii, style = "solid") {
  let dir = determineDirection(from, to), drawnCoords = [], chars = LINE_CHARS[style], hChar = useAscii ? chars.h.ascii : chars.h.unicode, vChar = useAscii ? chars.v.ascii : chars.v.unicode;
  if (dirEquals(dir, Up))
    for (let y = from.y - offsetFrom; y >= to.y - offsetTo; y--)
      drawnCoords.push({ x: from.x, y }), canvas2[from.x][y] = vChar;
  else if (dirEquals(dir, Down))
    for (let y = from.y + offsetFrom; y <= to.y + offsetTo; y++)
      drawnCoords.push({ x: from.x, y }), canvas2[from.x][y] = vChar;
  else if (dirEquals(dir, Left))
    for (let x = from.x - offsetFrom; x >= to.x - offsetTo; x--)
      drawnCoords.push({ x, y: from.y }), canvas2[x][from.y] = hChar;
  else if (dirEquals(dir, Right))
    for (let x = from.x + offsetFrom; x <= to.x + offsetTo; x++)
      drawnCoords.push({ x, y: from.y }), canvas2[x][from.y] = hChar;
  else if (dirEquals(dir, UpperLeft)) {
    for (let x = from.x - offsetFrom; x >= to.x; x--)
      drawnCoords.push({ x, y: from.y }), canvas2[x][from.y] = hChar;
    for (let y = from.y - 1; y >= to.y - offsetTo; y--)
      drawnCoords.push({ x: to.x, y }), canvas2[to.x][y] = vChar;
  } else if (dirEquals(dir, UpperRight)) {
    for (let x = from.x + offsetFrom; x <= to.x; x++)
      drawnCoords.push({ x, y: from.y }), canvas2[x][from.y] = hChar;
    for (let y = from.y - 1; y >= to.y - offsetTo; y--)
      drawnCoords.push({ x: to.x, y }), canvas2[to.x][y] = vChar;
  } else if (dirEquals(dir, LowerLeft)) {
    for (let x = from.x - offsetFrom; x >= to.x; x--)
      drawnCoords.push({ x, y: from.y }), canvas2[x][from.y] = hChar;
    for (let y = from.y + 1; y <= to.y + offsetTo; y++)
      drawnCoords.push({ x: to.x, y }), canvas2[to.x][y] = vChar;
  } else if (dirEquals(dir, LowerRight))
    if (to.x - from.x <= 1)
      for (let y = from.y + offsetFrom; y <= to.y + offsetTo; y++)
        drawnCoords.push({ x: from.x, y }), canvas2[from.x][y] = vChar;
    else {
      for (let x = from.x + offsetFrom; x <= to.x; x++)
        drawnCoords.push({ x, y: from.y }), canvas2[x][from.y] = hChar;
      for (let y = from.y + 1; y <= to.y + offsetTo; y++)
        drawnCoords.push({ x: to.x, y }), canvas2[to.x][y] = vChar;
    }
  return drawnCoords;
}
function drawArrow(graph, edge) {
  if (edge.path.length === 0) {
    let empty = copyCanvas(graph.canvas);
    return [empty, empty, empty, empty, empty, empty];
  }
  let labelCanvas = drawArrowLabel(graph, edge), [pathCanvas, linesDrawn, lineDirs] = drawPath(graph, edge.path, edge.style), boxStartCanvas = drawBoxStart(graph, edge.path, linesDrawn[0], edge.from.shape), arrowHeadEndCanvas;
  edge.hasArrowEnd ? arrowHeadEndCanvas = drawArrowHead(
    graph,
    linesDrawn[linesDrawn.length - 1],
    lineDirs[lineDirs.length - 1]
  ) : arrowHeadEndCanvas = copyCanvas(graph.canvas);
  let arrowHeadStartCanvas;
  if (edge.hasArrowStart && linesDrawn.length > 0) {
    let firstPoint = linesDrawn[0][0], startDir = reverseDirection(lineDirs[0]), arrowPos = { x: firstPoint.x, y: firstPoint.y };
    dirEquals(lineDirs[0], Right) ? arrowPos.x = firstPoint.x - 1 : dirEquals(lineDirs[0], Left) ? arrowPos.x = firstPoint.x + 1 : dirEquals(lineDirs[0], Down) ? arrowPos.y = firstPoint.y - 1 : dirEquals(lineDirs[0], Up) && (arrowPos.y = firstPoint.y + 1), arrowHeadStartCanvas = drawArrowHead(graph, [firstPoint, arrowPos], startDir);
  } else
    arrowHeadStartCanvas = copyCanvas(graph.canvas);
  let cornersCanvas = drawCorners(graph, edge.path);
  return [pathCanvas, boxStartCanvas, arrowHeadEndCanvas, arrowHeadStartCanvas, cornersCanvas, labelCanvas];
}
function reverseDirection(dir) {
  return dirEquals(dir, Up) ? Down : dirEquals(dir, Down) ? Up : dirEquals(dir, Left) ? Right : dirEquals(dir, Right) ? Left : dirEquals(dir, UpperLeft) ? LowerRight : dirEquals(dir, UpperRight) ? LowerLeft : dirEquals(dir, LowerLeft) ? UpperRight : dirEquals(dir, LowerRight) ? UpperLeft : Middle;
}
function drawPath(graph, path, style = "solid") {
  let canvas2 = copyCanvas(graph.canvas), previousCoord = path[0], linesDrawn = [], lineDirs = [];
  for (let i = 1; i < path.length; i++) {
    let nextCoord = path[i], prevDC = gridToDrawingCoord(graph, previousCoord), nextDC = gridToDrawingCoord(graph, nextCoord);
    if (drawingCoordEquals(prevDC, nextDC)) {
      previousCoord = nextCoord;
      continue;
    }
    let dir = determineDirection(previousCoord, nextCoord), segment = drawLine(canvas2, prevDC, nextDC, 1, -1, graph.config.useAscii, style);
    segment.length === 0 && segment.push(prevDC), linesDrawn.push(segment), lineDirs.push(dir), previousCoord = nextCoord;
  }
  return [canvas2, linesDrawn, lineDirs];
}
function drawBoxStart(graph, path, firstLine, sourceShape) {
  let canvas2 = copyCanvas(graph.canvas);
  if (graph.config.useAscii || sourceShape === "state-start" || sourceShape === "state-end")
    return canvas2;
  let from = firstLine[0], dir = determineDirection(path[0], path[1]);
  return dirEquals(dir, Up) ? canvas2[from.x][from.y + 1] = "\u2534" : dirEquals(dir, Down) ? canvas2[from.x][from.y - 1] = "\u252C" : dirEquals(dir, Left) ? canvas2[from.x + 1][from.y] = "\u2524" : dirEquals(dir, Right) && (canvas2[from.x - 1][from.y] = "\u251C"), canvas2;
}
function drawArrowHead(graph, lastLine, fallbackDir) {
  let canvas2 = copyCanvas(graph.canvas);
  if (lastLine.length === 0) return canvas2;
  let from = lastLine[0], lastPos = lastLine[lastLine.length - 1], dir = determineDirection(from, lastPos);
  (lastLine.length === 1 || dirEquals(dir, Middle)) && (dir = fallbackDir);
  let char;
  return graph.config.useAscii ? dirEquals(dir, Up) ? char = "^" : dirEquals(dir, Down) ? char = "v" : dirEquals(dir, Left) ? char = "<" : dirEquals(dir, Right) ? char = ">" : dirEquals(fallbackDir, Up) ? char = "^" : dirEquals(fallbackDir, Down) ? char = "v" : dirEquals(fallbackDir, Left) ? char = "<" : dirEquals(fallbackDir, Right) ? char = ">" : char = "*" : dirEquals(dir, Up) ? char = "\u25B2" : dirEquals(dir, Down) ? char = "\u25BC" : dirEquals(dir, Left) ? char = "\u25C4" : dirEquals(dir, Right) ? char = "\u25BA" : dirEquals(dir, UpperRight) ? char = "\u25E5" : dirEquals(dir, UpperLeft) ? char = "\u25E4" : dirEquals(dir, LowerRight) ? char = "\u25E2" : dirEquals(dir, LowerLeft) ? char = "\u25E3" : dirEquals(fallbackDir, Up) ? char = "\u25B2" : dirEquals(fallbackDir, Down) ? char = "\u25BC" : dirEquals(fallbackDir, Left) ? char = "\u25C4" : dirEquals(fallbackDir, Right) ? char = "\u25BA" : dirEquals(fallbackDir, UpperRight) ? char = "\u25E5" : dirEquals(fallbackDir, UpperLeft) ? char = "\u25E4" : dirEquals(fallbackDir, LowerRight) ? char = "\u25E2" : dirEquals(fallbackDir, LowerLeft) ? char = "\u25E3" : char = "\u25CF", canvas2[lastPos.x][lastPos.y] = char, canvas2;
}
function drawCorners(graph, path) {
  let canvas2 = copyCanvas(graph.canvas);
  for (let idx = 1; idx < path.length - 1; idx++) {
    let coord = path[idx], dc = gridToDrawingCoord(graph, coord), prevDir = determineDirection(path[idx - 1], coord), nextDir = determineDirection(coord, path[idx + 1]), corner;
    graph.config.useAscii ? corner = "+" : dirEquals(prevDir, Right) && dirEquals(nextDir, Down) || dirEquals(prevDir, Up) && dirEquals(nextDir, Left) ? corner = "\u2510" : dirEquals(prevDir, Right) && dirEquals(nextDir, Up) || dirEquals(prevDir, Down) && dirEquals(nextDir, Left) ? corner = "\u2518" : dirEquals(prevDir, Left) && dirEquals(nextDir, Down) || dirEquals(prevDir, Up) && dirEquals(nextDir, Right) ? corner = "\u250C" : dirEquals(prevDir, Left) && dirEquals(nextDir, Up) || dirEquals(prevDir, Down) && dirEquals(nextDir, Right) ? corner = "\u2514" : corner = "+", canvas2[dc.x][dc.y] = corner;
  }
  return canvas2;
}
function drawArrowLabel(graph, edge) {
  let canvas2 = copyCanvas(graph.canvas);
  if (edge.text.length === 0) return canvas2;
  let drawingLine = lineToDrawing(graph, edge.labelLine), isUpwardEdge;
  if (edge.path.length >= 2) {
    let startY = edge.path[0].y, endY = edge.path[edge.path.length - 1].y;
    endY < startY ? isUpwardEdge = true : endY > startY && (isUpwardEdge = false);
  }
  return drawTextOnLine(canvas2, drawingLine, edge.text, isUpwardEdge), canvas2;
}
function drawTextOnLine(canvas2, line2, label, isUpwardEdge) {
  if (line2.length < 2) return;
  let minX = Math.min(line2[0].x, line2[1].x), maxX = Math.max(line2[0].x, line2[1].x), minY = Math.min(line2[0].y, line2[1].y), maxY = Math.max(line2[0].y, line2[1].y), middleX = minX + Math.floor((maxX - minX) / 2), middleY = minY + Math.floor((maxY - minY) / 2);
  if (isUpwardEdge !== void 0 && minX === maxX) {
    let segmentHeight = maxY - minY, offset = Math.max(1, Math.floor(segmentHeight / 4));
    isUpwardEdge ? middleY = middleY + offset : middleY = middleY - offset;
  }
  let lines = splitLines(label), startY = middleY - Math.floor((lines.length - 1) / 2);
  for (let i = 0; i < lines.length; i++) {
    let lineText = lines[i], startX = middleX - Math.floor(lineText.length / 2);
    drawText(canvas2, { x: startX, y: startY + i }, lineText);
  }
}
function getNodeAttachmentPoint(graph, node, dir) {
  let gc = node.gridCoord, w = 0;
  for (let i = 0; i < 2; i++)
    w += graph.columnWidth.get(gc.x + i) ?? 0;
  let h = 0;
  for (let i = 0; i < 2; i++)
    h += graph.rowHeight.get(gc.y + i) ?? 0;
  let gridDimensions = {
    width: w + 1,
    height: h + 1,
    labelArea: { x: 0, y: 0, width: 0, height: 0 },
    gridColumns: [0, 0, 0],
    gridRows: [0, 0, 0]
  }, baseCoord = node.drawingCoord;
  return getShapeAttachmentPoint(node.shape, dir, gridDimensions, baseCoord);
}
function drawBundledEdgeSegment(graph, edge, bundle) {
  let empty = copyCanvas(graph.canvas);
  if (!edge.pathToJunction || edge.pathToJunction.length === 0)
    return [empty, empty, empty, empty, empty, empty];
  let pathCanvas = copyCanvas(graph.canvas), useAscii = graph.config.useAscii, drawingPath = edge.pathToJunction.map((gc, idx) => bundle.type === "fan-in" && idx === 0 ? getNodeAttachmentPoint(graph, edge.from, edge.startDir) : bundle.type === "fan-out" && idx === edge.pathToJunction.length - 1 ? getNodeAttachmentPoint(graph, edge.to, edge.endDir) : gridToDrawingCoord(graph, gc));
  for (let i = 1; i < drawingPath.length; i++) {
    let from = drawingPath[i - 1], to = drawingPath[i];
    drawingCoordEquals(from, to) || drawLine(pathCanvas, from, to, 1, -1, useAscii, edge.style);
  }
  let cornersCanvas = copyCanvas(graph.canvas);
  for (let idx = 1; idx < edge.pathToJunction.length - 1; idx++) {
    let coord = edge.pathToJunction[idx], dc = gridToDrawingCoord(graph, coord), prevDir = determineDirection(edge.pathToJunction[idx - 1], coord), nextDir = determineDirection(coord, edge.pathToJunction[idx + 1]), corner;
    useAscii ? corner = "+" : dirEquals(prevDir, Right) && dirEquals(nextDir, Down) || dirEquals(prevDir, Up) && dirEquals(nextDir, Left) ? corner = "\u2510" : dirEquals(prevDir, Right) && dirEquals(nextDir, Up) || dirEquals(prevDir, Down) && dirEquals(nextDir, Left) ? corner = "\u2518" : dirEquals(prevDir, Left) && dirEquals(nextDir, Down) || dirEquals(prevDir, Up) && dirEquals(nextDir, Right) ? corner = "\u250C" : dirEquals(prevDir, Left) && dirEquals(nextDir, Up) || dirEquals(prevDir, Down) && dirEquals(nextDir, Right) ? corner = "\u2514" : corner = "+", cornersCanvas[dc.x][dc.y] = corner;
  }
  let boxStartCanvas = copyCanvas(graph.canvas);
  if (bundle.type === "fan-in" && edge.pathToJunction.length >= 2) {
    let firstPoint = drawingPath[0], dir = determineDirection(edge.pathToJunction[0], edge.pathToJunction[1]);
    useAscii || (dirEquals(dir, Up) ? boxStartCanvas[firstPoint.x][firstPoint.y] = "\u2534" : dirEquals(dir, Down) ? boxStartCanvas[firstPoint.x][firstPoint.y] = "\u252C" : dirEquals(dir, Left) ? boxStartCanvas[firstPoint.x][firstPoint.y] = "\u2524" : dirEquals(dir, Right) && (boxStartCanvas[firstPoint.x][firstPoint.y] = "\u251C"));
  }
  let labelCanvas = copyCanvas(graph.canvas);
  return [pathCanvas, boxStartCanvas, empty, empty, cornersCanvas, labelCanvas];
}
function drawBundleSharedPath(graph, bundle) {
  let pathCanvas = copyCanvas(graph.canvas), cornersCanvas = copyCanvas(graph.canvas);
  if (bundle.sharedPath.length < 2)
    return [pathCanvas, cornersCanvas];
  let useAscii = graph.config.useAscii, style = bundle.edges[0]?.style ?? "solid", graphDir = graph.config.graphDirection, drawingPath = bundle.sharedPath.map((gc, idx) => {
    if (bundle.type === "fan-in" && idx === bundle.sharedPath.length - 1) {
      let entryDir = graphDir === "TD" ? Up : Left;
      return getNodeAttachmentPoint(graph, bundle.sharedNode, entryDir);
    }
    if (bundle.type === "fan-out" && idx === 0) {
      let exitDir = graphDir === "TD" ? Down : Right;
      return getNodeAttachmentPoint(graph, bundle.sharedNode, exitDir);
    }
    return gridToDrawingCoord(graph, gc);
  });
  for (let i = 1; i < drawingPath.length; i++) {
    let from = drawingPath[i - 1], to = drawingPath[i];
    drawingCoordEquals(from, to) || drawLine(pathCanvas, from, to, 1, -1, useAscii, style);
  }
  for (let idx = 1; idx < bundle.sharedPath.length - 1; idx++) {
    let coord = bundle.sharedPath[idx], dc = gridToDrawingCoord(graph, coord), prevDir = determineDirection(bundle.sharedPath[idx - 1], coord), nextDir = determineDirection(coord, bundle.sharedPath[idx + 1]), corner;
    useAscii ? corner = "+" : dirEquals(prevDir, Right) && dirEquals(nextDir, Down) || dirEquals(prevDir, Up) && dirEquals(nextDir, Left) ? corner = "\u2510" : dirEquals(prevDir, Right) && dirEquals(nextDir, Up) || dirEquals(prevDir, Down) && dirEquals(nextDir, Left) ? corner = "\u2518" : dirEquals(prevDir, Left) && dirEquals(nextDir, Down) || dirEquals(prevDir, Up) && dirEquals(nextDir, Right) ? corner = "\u250C" : dirEquals(prevDir, Left) && dirEquals(nextDir, Up) || dirEquals(prevDir, Down) && dirEquals(nextDir, Right) ? corner = "\u2514" : corner = "+", cornersCanvas[dc.x][dc.y] = corner;
  }
  return [pathCanvas, cornersCanvas];
}
function drawBundleArrowhead(graph, bundle) {
  let canvas2 = copyCanvas(graph.canvas);
  if (bundle.sharedPath.length < 2) return canvas2;
  let lastIdx = bundle.sharedPath.length - 1, secondLast = bundle.sharedPath[lastIdx - 1], last = bundle.sharedPath[lastIdx], dir = determineDirection(secondLast, last), graphDir = graph.config.graphDirection, entryDir = graphDir === "TD" ? Up : Left, dc = getNodeAttachmentPoint(graph, bundle.sharedNode, entryDir);
  graphDir === "TD" ? dc.y -= 1 : dc.x -= 1;
  let char;
  return graph.config.useAscii ? dirEquals(dir, Up) ? char = "^" : dirEquals(dir, Down) ? char = "v" : dirEquals(dir, Left) ? char = "<" : dirEquals(dir, Right) ? char = ">" : char = "v" : dirEquals(dir, Up) ? char = "\u25B2" : dirEquals(dir, Down) ? char = "\u25BC" : dirEquals(dir, Left) ? char = "\u25C4" : dirEquals(dir, Right) ? char = "\u25BA" : char = "\u25BC", canvas2[dc.x][dc.y] = char, canvas2;
}
function drawBundledEdgeArrowhead(graph, edge) {
  let canvas2 = copyCanvas(graph.canvas);
  if (!edge.pathToJunction || edge.pathToJunction.length < 2) return canvas2;
  let lastIdx = edge.pathToJunction.length - 1, secondLast = edge.pathToJunction[lastIdx - 1], last = edge.pathToJunction[lastIdx], dir = determineDirection(secondLast, last), graphDir = graph.config.graphDirection, entryDir = graphDir === "TD" ? Up : Left, dc = getNodeAttachmentPoint(graph, edge.to, entryDir);
  graphDir === "TD" ? dc.y -= 1 : dc.x -= 1;
  let char;
  return graph.config.useAscii ? dirEquals(dir, Up) ? char = "^" : dirEquals(dir, Down) ? char = "v" : dirEquals(dir, Left) ? char = "<" : dirEquals(dir, Right) ? char = ">" : char = "v" : dirEquals(dir, Up) ? char = "\u25B2" : dirEquals(dir, Down) ? char = "\u25BC" : dirEquals(dir, Left) ? char = "\u25C4" : dirEquals(dir, Right) ? char = "\u25BA" : char = "\u25BC", canvas2[dc.x][dc.y] = char, canvas2;
}
function drawJunctionCharacter(graph, bundle) {
  let canvas2 = copyCanvas(graph.canvas);
  if (!bundle.junctionPoint) return canvas2;
  let dc = gridToDrawingCoord(graph, bundle.junctionPoint), useAscii = graph.config.useAscii, hasUp = false, hasDown = false, hasLeft = false, hasRight = false;
  if (bundle.sharedPath.length >= 2) {
    let junctionIdx = bundle.type === "fan-in" ? 0 : bundle.sharedPath.length - 1, adjacentIdx = bundle.type === "fan-in" ? 1 : bundle.sharedPath.length - 2, sharedDir = determineDirection(
      bundle.sharedPath[junctionIdx],
      bundle.sharedPath[adjacentIdx]
    );
    dirEquals(sharedDir, Down) ? hasDown = true : dirEquals(sharedDir, Up) ? hasUp = true : dirEquals(sharedDir, Right) ? hasRight = true : dirEquals(sharedDir, Left) && (hasLeft = true);
  }
  for (let edge of bundle.edges)
    if (edge.pathToJunction && edge.pathToJunction.length >= 2) {
      let junctionIdx = bundle.type === "fan-in" ? edge.pathToJunction.length - 1 : 0, adjacentIdx = bundle.type === "fan-in" ? edge.pathToJunction.length - 2 : 1, arrivalDir = determineDirection(
        edge.pathToJunction[adjacentIdx],
        edge.pathToJunction[junctionIdx]
      );
      dirEquals(arrivalDir, Down) ? hasUp = true : dirEquals(arrivalDir, Up) ? hasDown = true : dirEquals(arrivalDir, Right) ? hasLeft = true : dirEquals(arrivalDir, Left) && (hasRight = true);
    }
  let char;
  return useAscii ? char = "+" : hasUp && hasDown && hasLeft && hasRight ? char = "\u253C" : hasDown && hasLeft && hasRight && !hasUp ? char = "\u252C" : hasUp && hasLeft && hasRight && !hasDown ? char = "\u2534" : hasUp && hasDown && hasRight && !hasLeft ? char = "\u251C" : hasUp && hasDown && hasLeft && !hasRight ? char = "\u2524" : hasLeft && hasRight ? char = "\u2500" : hasUp && hasDown ? char = "\u2502" : hasDown && hasRight ? char = "\u250C" : hasDown && hasLeft ? char = "\u2510" : hasUp && hasRight ? char = "\u2514" : hasUp && hasLeft ? char = "\u2518" : char = "\u253C", canvas2[dc.x][dc.y] = char, canvas2;
}
function drawSubgraphBox(sg, graph) {
  let width2 = sg.maxX - sg.minX, height = sg.maxY - sg.minY;
  if (width2 <= 0 || height <= 0) return mkCanvas(0, 0);
  let from = { x: 0, y: 0 }, to = { x: width2, y: height }, canvas2 = mkCanvas(width2, height);
  if (graph.config.useAscii) {
    for (let x = from.x + 1; x < to.x; x++) canvas2[x][from.y] = "-";
    for (let x = from.x + 1; x < to.x; x++) canvas2[x][to.y] = "-";
    for (let y = from.y + 1; y < to.y; y++) canvas2[from.x][y] = "|";
    for (let y = from.y + 1; y < to.y; y++) canvas2[to.x][y] = "|";
    canvas2[from.x][from.y] = "+", canvas2[to.x][from.y] = "+", canvas2[from.x][to.y] = "+", canvas2[to.x][to.y] = "+";
  } else {
    for (let x = from.x + 1; x < to.x; x++) canvas2[x][from.y] = "\u2500";
    for (let x = from.x + 1; x < to.x; x++) canvas2[x][to.y] = "\u2500";
    for (let y = from.y + 1; y < to.y; y++) canvas2[from.x][y] = "\u2502";
    for (let y = from.y + 1; y < to.y; y++) canvas2[to.x][y] = "\u2502";
    canvas2[from.x][from.y] = "\u250C", canvas2[to.x][from.y] = "\u2510", canvas2[from.x][to.y] = "\u2514", canvas2[to.x][to.y] = "\u2518";
  }
  return canvas2;
}
function drawSubgraphLabel(sg, graph) {
  let width2 = sg.maxX - sg.minX, height = sg.maxY - sg.minY;
  if (width2 <= 0 || height <= 0) return [mkCanvas(0, 0), { x: 0, y: 0 }];
  let canvas2 = mkCanvas(width2, height), lines = splitLines(sg.name);
  for (let i = 0; i < lines.length; i++) {
    let line2 = lines[i], labelY = 1 + i, labelX = Math.floor(width2 / 2) - Math.floor(line2.length / 2);
    labelX < 1 && (labelX = 1);
    for (let j = 0; j < line2.length; j++)
      labelX + j < width2 && labelY < height && (canvas2[labelX + j][labelY] = line2[j]);
  }
  return [canvas2, { x: sg.minX, y: sg.minY }];
}
function sortSubgraphsByDepth(subgraphs) {
  function getDepth(sg) {
    return sg.parent === null ? 0 : 1 + getDepth(sg.parent);
  }
  let sorted = [...subgraphs];
  return sorted.sort((a, b) => getDepth(a) - getDepth(b)), sorted;
}
function fillRolesFromCanvas(roleCanvas, canvas2, offset, role) {
  for (let x = 0; x < canvas2.length; x++)
    for (let y = 0; y < (canvas2[0]?.length ?? 0); y++) {
      let char = canvas2[x]?.[y];
      if (char && char !== " ") {
        let rx = x + offset.x, ry = y + offset.y;
        rx >= 0 && ry >= 0 && setRole(roleCanvas, rx, ry, role);
      }
    }
}
function fillRolesFromCanvases(roleCanvas, canvases, offset, role) {
  for (let canvas2 of canvases)
    fillRolesFromCanvas(roleCanvas, canvas2, offset, role);
}
function fillRolesForNodeBox(roleCanvas, canvas2, offset) {
  let isBorderChar = (c) => /^[┌┐└┘├┤┬┴┼│─╭╮╰╯+\-|.':]$/.test(c);
  for (let x = 0; x < canvas2.length; x++)
    for (let y = 0; y < (canvas2[0]?.length ?? 0); y++) {
      let char = canvas2[x]?.[y];
      if (char && char !== " ") {
        let rx = x + offset.x, ry = y + offset.y;
        rx >= 0 && ry >= 0 && setRole(roleCanvas, rx, ry, isBorderChar(char) ? "border" : "text");
      }
    }
}
function drawGraph(graph) {
  let useAscii = graph.config.useAscii, zero = { x: 0, y: 0 }, sortedSgs = sortSubgraphsByDepth(graph.subgraphs);
  for (let sg of sortedSgs) {
    let sgCanvas = drawSubgraphBox(sg, graph), offset = { x: sg.minX, y: sg.minY };
    graph.canvas = mergeCanvases(graph.canvas, offset, useAscii, sgCanvas), fillRolesFromCanvas(graph.roleCanvas, sgCanvas, offset, "border");
  }
  for (let node of graph.nodes)
    !node.drawn && node.drawingCoord && node.drawing && (graph.canvas = mergeCanvases(graph.canvas, node.drawingCoord, useAscii, node.drawing), fillRolesForNodeBox(graph.roleCanvas, node.drawing, node.drawingCoord), node.drawn = true);
  let lineCanvases = [], cornerCanvases = [], arrowHeadEndCanvases = [], arrowHeadStartCanvases = [], boxStartCanvases = [], labelCanvases = [], junctionCanvases = [], processedBundles = /* @__PURE__ */ new Set();
  for (let edge of graph.edges)
    if (edge.bundle && edge.pathToJunction) {
      let bundle = edge.bundle, [pathC, boxStartC, , , cornersC, labelC] = drawBundledEdgeSegment(graph, edge, bundle);
      if (lineCanvases.push(pathC), cornerCanvases.push(cornersC), boxStartCanvases.push(boxStartC), labelCanvases.push(labelC), !processedBundles.has(bundle)) {
        processedBundles.add(bundle);
        let [sharedPathC, sharedCornersC] = drawBundleSharedPath(graph, bundle);
        if (lineCanvases.push(sharedPathC), cornerCanvases.push(sharedCornersC), bundle.type === "fan-in") {
          let arrowHeadC = drawBundleArrowhead(graph, bundle);
          arrowHeadEndCanvases.push(arrowHeadC);
        }
        let junctionC = drawJunctionCharacter(graph, bundle);
        junctionCanvases.push(junctionC);
      }
      if (bundle.type === "fan-out" && edge.hasArrowEnd) {
        let arrowHeadC = drawBundledEdgeArrowhead(graph, edge);
        arrowHeadEndCanvases.push(arrowHeadC);
      }
    } else {
      let [pathC, boxStartC, arrowHeadEndC, arrowHeadStartC, cornersC, labelC] = drawArrow(graph, edge);
      lineCanvases.push(pathC), cornerCanvases.push(cornersC), arrowHeadEndCanvases.push(arrowHeadEndC), arrowHeadStartCanvases.push(arrowHeadStartC), boxStartCanvases.push(boxStartC), labelCanvases.push(labelC);
    }
  graph.canvas = mergeCanvases(graph.canvas, zero, useAscii, ...lineCanvases), fillRolesFromCanvases(graph.roleCanvas, lineCanvases, zero, "line"), graph.canvas = mergeCanvases(graph.canvas, zero, useAscii, ...cornerCanvases), fillRolesFromCanvases(graph.roleCanvas, cornerCanvases, zero, "corner"), graph.canvas = mergeCanvases(graph.canvas, zero, useAscii, ...junctionCanvases), fillRolesFromCanvases(graph.roleCanvas, junctionCanvases, zero, "junction"), graph.canvas = mergeCanvases(graph.canvas, zero, useAscii, ...arrowHeadEndCanvases), fillRolesFromCanvases(graph.roleCanvas, arrowHeadEndCanvases, zero, "arrow"), graph.canvas = mergeCanvases(graph.canvas, zero, useAscii, ...boxStartCanvases), fillRolesFromCanvases(graph.roleCanvas, boxStartCanvases, zero, "junction"), graph.canvas = mergeCanvases(graph.canvas, zero, useAscii, ...arrowHeadStartCanvases), fillRolesFromCanvases(graph.roleCanvas, arrowHeadStartCanvases, zero, "arrow"), graph.canvas = mergeCanvases(graph.canvas, zero, useAscii, ...labelCanvases);
  for (let label of labelCanvases) clearLabelGaps(graph.canvas, label);
  fillRolesFromCanvases(graph.roleCanvas, labelCanvases, zero, "text");
  for (let sg of graph.subgraphs) {
    if (sg.nodes.length === 0) continue;
    let [labelCanvas, offset] = drawSubgraphLabel(sg, graph);
    graph.canvas = mergeCanvases(graph.canvas, offset, useAscii, labelCanvas), fillRolesFromCanvas(graph.roleCanvas, labelCanvas, offset, "text");
  }
  return graph.canvas;
}
function gridToDrawingCoord(graph, c, dir) {
  let target = dir ? { x: c.x + dir.x, y: c.y + dir.y } : c, x = 0;
  for (let col = 0; col < target.x; col++)
    x += graph.columnWidth.get(col) ?? 0;
  let y = 0;
  for (let row = 0; row < target.y; row++)
    y += graph.rowHeight.get(row) ?? 0;
  let colW = graph.columnWidth.get(target.x) ?? 0, rowH = graph.rowHeight.get(target.y) ?? 0;
  return {
    x: x + Math.floor(colW / 2) + graph.offsetX,
    y: y + Math.floor(rowH / 2) + graph.offsetY
  };
}
function lineToDrawing(graph, line2) {
  return line2.map((c) => gridToDrawingCoord(graph, c));
}
function reserveSpotInGrid(graph, node, requested, effectiveDir) {
  let dir = effectiveDir ?? getEffectiveDirection2(graph, node);
  if (graph.grid.has(gridKey(requested)))
    return dir === "LR" ? reserveSpotInGrid(graph, node, { x: requested.x, y: requested.y + 4 }, dir) : reserveSpotInGrid(graph, node, { x: requested.x + 4, y: requested.y }, dir);
  for (let dx = 0; dx < 3; dx++)
    for (let dy = 0; dy < 3; dy++) {
      let reserved = { x: requested.x + dx, y: requested.y + dy };
      graph.grid.set(gridKey(reserved), node);
    }
  return node.gridCoord = requested, requested;
}
function setColumnWidth(graph, node) {
  let gc = node.gridCoord, padding = graph.config.boxBorderPadding, shapeDims = getShapeDimensions(node.shape, node.displayLabel, {
    useAscii: graph.config.useAscii,
    padding
  }), colWidths = shapeDims.gridColumns, rowHeights = shapeDims.gridRows;
  for (let idx = 0; idx < colWidths.length; idx++) {
    let xCoord = gc.x + idx, current = graph.columnWidth.get(xCoord) ?? 0;
    graph.columnWidth.set(xCoord, Math.max(current, colWidths[idx]));
  }
  for (let idx = 0; idx < rowHeights.length; idx++) {
    let yCoord = gc.y + idx, current = graph.rowHeight.get(yCoord) ?? 0;
    graph.rowHeight.set(yCoord, Math.max(current, rowHeights[idx]));
  }
  if (gc.x > 0) {
    let current = graph.columnWidth.get(gc.x - 1) ?? 0;
    graph.columnWidth.set(gc.x - 1, Math.max(current, graph.config.paddingX));
  }
  if (gc.y > 0) {
    let basePadding = graph.config.paddingY;
    hasIncomingEdgeFromOutsideSubgraph(graph, node) && (basePadding += 4);
    let current = graph.rowHeight.get(gc.y - 1) ?? 0;
    graph.rowHeight.set(gc.y - 1, Math.max(current, basePadding));
  }
}
function increaseGridSizeForPath(graph, path) {
  for (let c of path)
    graph.columnWidth.has(c.x) || graph.columnWidth.set(c.x, Math.floor(graph.config.paddingX / 2)), graph.rowHeight.has(c.y) || graph.rowHeight.set(c.y, Math.floor(graph.config.paddingY / 2));
}
function isNodeInAnySubgraph(graph, node) {
  return graph.subgraphs.some((sg) => sg.nodes.includes(node));
}
function getNodeSubgraph(graph, node) {
  let innermost = null;
  for (let sg of graph.subgraphs)
    sg.nodes.includes(node) && (!innermost || isAncestorOrSelf2(innermost, sg)) && (innermost = sg);
  return innermost;
}
function isAncestorOrSelf2(candidate, target) {
  let current = target;
  for (; current !== null; ) {
    if (current === candidate) return true;
    current = current.parent;
  }
  return false;
}
function getEffectiveDirection2(graph, node) {
  let sg = getNodeSubgraph(graph, node);
  return sg?.direction ? sg.direction : graph.config.graphDirection;
}
function hasIncomingEdgeFromOutsideSubgraph(graph, node) {
  let nodeSg = getNodeSubgraph(graph, node);
  if (!nodeSg) return false;
  let hasExternalEdge = false;
  for (let edge of graph.edges)
    if (edge.to === node && getNodeSubgraph(graph, edge.from) !== nodeSg) {
      hasExternalEdge = true;
      break;
    }
  if (!hasExternalEdge) return false;
  for (let otherNode of nodeSg.nodes) {
    if (otherNode === node || !otherNode.gridCoord) continue;
    let otherHasExternal = false;
    for (let edge of graph.edges)
      if (edge.to === otherNode && getNodeSubgraph(graph, edge.from) !== nodeSg) {
        otherHasExternal = true;
        break;
      }
    if (otherHasExternal && otherNode.gridCoord.y < node.gridCoord.y)
      return false;
  }
  return true;
}
function calculateSubgraphBoundingBox(graph, sg) {
  if (sg.nodes.length === 0) return;
  let minX = 1e6, minY = 1e6, maxX = -1e6, maxY = -1e6;
  for (let child of sg.children)
    calculateSubgraphBoundingBox(graph, child), child.nodes.length > 0 && (minX = Math.min(minX, child.minX), minY = Math.min(minY, child.minY), maxX = Math.max(maxX, child.maxX), maxY = Math.max(maxY, child.maxY));
  for (let node of sg.nodes) {
    if (!node.drawingCoord || !node.drawing) continue;
    let nodeMinX = node.drawingCoord.x, nodeMinY = node.drawingCoord.y, nodeMaxX = nodeMinX + node.drawing.length - 1, nodeMaxY = nodeMinY + node.drawing[0].length - 1;
    minX = Math.min(minX, nodeMinX), minY = Math.min(minY, nodeMinY), maxX = Math.max(maxX, nodeMaxX), maxY = Math.max(maxY, nodeMaxY);
  }
  let subgraphPadding = 2, subgraphLabelSpace = 2;
  sg.minX = minX - subgraphPadding, sg.minY = minY - subgraphPadding - subgraphLabelSpace, sg.maxX = maxX + subgraphPadding, sg.maxY = maxY + subgraphPadding;
}
function ensureSubgraphSpacing(graph) {
  let rootSubgraphs = graph.subgraphs.filter((sg) => sg.parent === null && sg.nodes.length > 0);
  for (let i = 0; i < rootSubgraphs.length; i++)
    for (let j = i + 1; j < rootSubgraphs.length; j++) {
      let sg1 = rootSubgraphs[i], sg2 = rootSubgraphs[j];
      sg1.minX < sg2.maxX && sg1.maxX > sg2.minX && (sg1.maxY >= sg2.minY - 1 && sg1.minY < sg2.minY ? sg2.minY = sg1.maxY + 1 + 1 : sg2.maxY >= sg1.minY - 1 && sg2.minY < sg1.minY && (sg1.minY = sg2.maxY + 1 + 1)), sg1.minY < sg2.maxY && sg1.maxY > sg2.minY && (sg1.maxX >= sg2.minX - 1 && sg1.minX < sg2.minX ? sg2.minX = sg1.maxX + 1 + 1 : sg2.maxX >= sg1.minX - 1 && sg2.minX < sg1.minX && (sg1.minX = sg2.maxX + 1 + 1));
    }
}
function calculateSubgraphBoundingBoxes(graph) {
  for (let sg of graph.subgraphs)
    calculateSubgraphBoundingBox(graph, sg);
  ensureSubgraphSpacing(graph);
}
function offsetDrawingForSubgraphs(graph) {
  if (graph.subgraphs.length === 0) return;
  let minX = 0, minY = 0;
  for (let sg of graph.subgraphs)
    minX = Math.min(minX, sg.minX), minY = Math.min(minY, sg.minY);
  let offsetX = -minX, offsetY = -minY;
  if (!(offsetX === 0 && offsetY === 0)) {
    graph.offsetX = offsetX, graph.offsetY = offsetY;
    for (let sg of graph.subgraphs)
      sg.minX += offsetX, sg.minY += offsetY, sg.maxX += offsetX, sg.maxY += offsetY;
    for (let node of graph.nodes)
      node.drawingCoord && (node.drawingCoord.x += offsetX, node.drawingCoord.y += offsetY);
  }
}
function createMapping(graph) {
  let dir = graph.config.graphDirection, highestPositionPerLevel = new Array(1e4).fill(0), nodesFound = /* @__PURE__ */ new Set(), initialRoots = [], targets = new Set(graph.edges.map((e) => e.to));
  for (let node of [...graph.nodes].sort((a, b) => Number(targets.has(a)) - Number(targets.has(b)))) {
    nodesFound.has(node.name) || initialRoots.push(node), nodesFound.add(node.name);
    for (let child of getChildren(graph, node))
      nodesFound.add(child.name);
  }
  let rootNodes = initialRoots.filter((node) => {
    let nodeSg = getNodeSubgraph(graph, node);
    if (!nodeSg) return true;
    for (let edge of graph.edges)
      if (edge.to === node && getNodeSubgraph(graph, edge.from) !== nodeSg)
        return false;
    return true;
  }), hasExternalRoots = false, hasSubgraphRootsWithEdges = false;
  for (let node of rootNodes)
    isNodeInAnySubgraph(graph, node) ? getChildren(graph, node).length > 0 && (hasSubgraphRootsWithEdges = true) : hasExternalRoots = true;
  let shouldSeparate = dir === "LR" && hasExternalRoots && hasSubgraphRootsWithEdges, externalRootNodes, subgraphRootNodes = [];
  shouldSeparate ? (externalRootNodes = rootNodes.filter((n) => !isNodeInAnySubgraph(graph, n)), subgraphRootNodes = rootNodes.filter((n) => isNodeInAnySubgraph(graph, n))) : externalRootNodes = rootNodes;
  for (let node of externalRootNodes) {
    let requested = dir === "LR" ? { x: 0, y: highestPositionPerLevel[0] } : { x: highestPositionPerLevel[0], y: 0 };
    reserveSpotInGrid(graph, graph.nodes[node.index], requested), highestPositionPerLevel[0] = highestPositionPerLevel[0] + 4;
  }
  if (shouldSeparate && subgraphRootNodes.length > 0)
    for (let node of subgraphRootNodes) {
      let requested = dir === "LR" ? { x: 4, y: highestPositionPerLevel[4] } : { x: highestPositionPerLevel[4], y: 4 };
      reserveSpotInGrid(graph, graph.nodes[node.index], requested), highestPositionPerLevel[4] = highestPositionPerLevel[4] + 4;
    }
  let placedCount = externalRootNodes.length + subgraphRootNodes.length;
  for (; placedCount < graph.nodes.length; ) {
    let prevCount = placedCount;
    for (let node of graph.nodes) {
      if (node.gridCoord === null) continue;
      let gc = node.gridCoord;
      for (let child of getChildren(graph, node)) {
        if (child.gridCoord !== null) continue;
        let parentSg = getNodeSubgraph(graph, node), childSg = getNodeSubgraph(graph, child), edgeDir = parentSg && parentSg === childSg && parentSg.direction ? parentSg.direction : graph.config.graphDirection, childLevel = edgeDir === "LR" ? gc.x + 4 : gc.y + 4, highestPosition;
        edgeDir !== graph.config.graphDirection ? highestPosition = edgeDir === "LR" ? gc.y : gc.x : highestPosition = highestPositionPerLevel[childLevel];
        let requested = edgeDir === "LR" ? { x: childLevel, y: highestPosition } : { x: highestPosition, y: childLevel };
        reserveSpotInGrid(graph, graph.nodes[child.index], requested, edgeDir), edgeDir === graph.config.graphDirection && (highestPositionPerLevel[childLevel] = highestPosition + 4), placedCount++;
      }
    }
    if (placedCount === prevCount) break;
  }
  for (let node of graph.nodes)
    setColumnWidth(graph, node);
  graph.bundles = analyzeEdgeBundles(graph), processBundles(graph);
  for (let edge of graph.edges) {
    if (edge.bundle && edge.path.length > 0) {
      increaseGridSizeForPath(graph, edge.path), determineLabelLine(graph, edge);
      continue;
    }
    determinePath(graph, edge), increaseGridSizeForPath(graph, edge.path), determineLabelLine(graph, edge);
  }
  for (let node of graph.nodes)
    node.drawingCoord = gridToDrawingCoord(graph, node.gridCoord), node.drawing = drawBox(node, graph);
  setCanvasSizeToGrid(graph.canvas, graph.columnWidth, graph.rowHeight), setRoleCanvasSizeToGrid(graph.roleCanvas, graph.columnWidth, graph.rowHeight), calculateSubgraphBoundingBoxes(graph), offsetDrawingForSubgraphs(graph);
}
function getEdgesFromNode(graph, node) {
  return graph.edges.filter((e) => e.from.name === node.name);
}
function getChildren(graph, node) {
  return getEdgesFromNode(graph, node).map((e) => e.to);
}
function parseSequenceDiagram(lines) {
  let diagram = {
    actors: [],
    messages: [],
    blocks: [],
    notes: []
  }, actorIds = /* @__PURE__ */ new Set(), blockStack = [];
  for (let i = 1; i < lines.length; i++) {
    let line2 = lines[i], actorMatch = line2.match(/^(participant|actor)\s+(\S+?)(?:\s+as\s+(.+))?$/);
    if (actorMatch) {
      let type = actorMatch[1], id = actorMatch[2], rawLabel = actorMatch[3]?.trim() ?? id, label = normalizeBrTags(rawLabel);
      actorIds.has(id) || (actorIds.add(id), diagram.actors.push({ id, label, type }));
      continue;
    }
    let noteMatch = line2.match(/^Note\s+(left of|right of|over)\s+([^:]+):\s*(.+)$/i);
    if (noteMatch) {
      let posStr = noteMatch[1].toLowerCase(), actorsStr = noteMatch[2].trim(), text = normalizeBrTags(noteMatch[3].trim()), noteActorIds = actorsStr.split(",").map((s) => s.trim());
      for (let aid of noteActorIds)
        ensureActor(diagram, actorIds, aid);
      let position = "over";
      posStr === "left of" ? position = "left" : posStr === "right of" && (position = "right"), diagram.notes.push({
        actorIds: noteActorIds,
        text,
        position,
        afterIndex: diagram.messages.length - 1
      });
      continue;
    }
    let blockMatch = line2.match(/^(loop|alt|opt|par|critical|break|rect)\s*(.*)$/);
    if (blockMatch) {
      let blockType = blockMatch[1], rawBlockLabel = blockMatch[2]?.trim() ?? "", label = normalizeBrTags(rawBlockLabel);
      blockStack.push({
        type: blockType,
        label,
        startIndex: diagram.messages.length,
        dividers: []
      });
      continue;
    }
    let dividerMatch = line2.match(/^(else|and)\s*(.*)$/);
    if (dividerMatch && blockStack.length > 0) {
      let rawDividerLabel = dividerMatch[2]?.trim() ?? "", label = normalizeBrTags(rawDividerLabel);
      blockStack[blockStack.length - 1].dividers.push({
        index: diagram.messages.length,
        label
      });
      continue;
    }
    if (line2 === "end" && blockStack.length > 0) {
      let completed = blockStack.pop();
      diagram.blocks.push({
        type: completed.type,
        label: completed.label,
        startIndex: completed.startIndex,
        endIndex: Math.max(diagram.messages.length - 1, completed.startIndex),
        dividers: completed.dividers
      });
      continue;
    }
    let msgMatch = line2.match(
      /^(\S+?)\s*(--?>?>|--?[)x]|--?>>|--?>)\s*([+-]?)(\S+?)\s*:\s*(.+)$/
    );
    if (msgMatch) {
      let from = msgMatch[1], arrow = msgMatch[2], activationMark = msgMatch[3], to = msgMatch[4], label = normalizeBrTags(msgMatch[5].trim());
      ensureActor(diagram, actorIds, from), ensureActor(diagram, actorIds, to);
      let lineStyle = arrow.startsWith("--") ? "dashed" : "solid", arrowHead = arrow.includes(">>") || arrow.includes("x") ? "filled" : "open", msg = {
        from,
        to,
        label,
        lineStyle,
        arrowHead
      };
      activationMark === "+" && (msg.activate = true), activationMark === "-" && (msg.deactivate = true), diagram.messages.push(msg);
      continue;
    }
    let simpleMsgMatch = line2.match(
      /^(\S+?)\s*(->>|-->>|-\)|--\)|-x|--x|->|-->)\s*([+-]?)(\S+?)\s*:\s*(.+)$/
    );
    if (simpleMsgMatch) {
      let from = simpleMsgMatch[1], arrow = simpleMsgMatch[2], activationMark = simpleMsgMatch[3], to = simpleMsgMatch[4], label = normalizeBrTags(simpleMsgMatch[5].trim());
      ensureActor(diagram, actorIds, from), ensureActor(diagram, actorIds, to);
      let lineStyle = arrow.startsWith("--") ? "dashed" : "solid", arrowHead = arrow.includes(">>") || arrow.includes("x") ? "filled" : "open", msg = { from, to, label, lineStyle, arrowHead };
      activationMark === "+" && (msg.activate = true), activationMark === "-" && (msg.deactivate = true), diagram.messages.push(msg);
      continue;
    }
  }
  return diagram;
}
function ensureActor(diagram, actorIds, id) {
  actorIds.has(id) || (actorIds.add(id), diagram.actors.push({ id, label: id, type: "participant" }));
}
function renderSequenceAscii(text, config, colorMode, theme) {
  let lines = text.split(`
`).map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith("%%")), diagram = parseSequenceDiagram(lines);
  if (diagram.actors.length === 0) return "";
  let useAscii = config.useAscii, H = useAscii ? "-" : "\u2500", V = useAscii ? "|" : "\u2502", TL = useAscii ? "+" : "\u250C", TR = useAscii ? "+" : "\u2510", BL = useAscii ? "+" : "\u2514", BR = useAscii ? "+" : "\u2518", JT = useAscii ? "+" : "\u252C", JB = useAscii ? "+" : "\u2534", JL = useAscii ? "+" : "\u251C", JR = useAscii ? "+" : "\u2524", actorIdx = /* @__PURE__ */ new Map();
  diagram.actors.forEach((a, i) => actorIdx.set(a.id, i));
  let boxPad = 1, halfBox = diagram.actors.map((a) => maxLineWidth(a.label) + 2 * boxPad + 2).map((w) => Math.ceil(w / 2)), actorBoxHeights = diagram.actors.map((a) => lineCount(a.label) + 2), actorBoxH = Math.max(...actorBoxHeights, 3), adjMaxWidth = new Array(Math.max(diagram.actors.length - 1, 0)).fill(0);
  for (let msg of diagram.messages) {
    let fi = actorIdx.get(msg.from), ti = actorIdx.get(msg.to);
    if (fi === ti) continue;
    let lo = Math.min(fi, ti), hi = Math.max(fi, ti), needed = maxLineWidth(msg.label) + 4, numGaps = hi - lo, perGap = Math.ceil(needed / numGaps);
    for (let g = lo; g < hi; g++)
      adjMaxWidth[g] = Math.max(adjMaxWidth[g], perGap);
  }
  let llX = [halfBox[0]];
  for (let i = 1; i < diagram.actors.length; i++) {
    let gap = Math.max(
      halfBox[i - 1] + halfBox[i] + 2,
      adjMaxWidth[i - 1] + 2,
      10
    );
    llX[i] = llX[i - 1] + gap;
  }
  let msgArrowY = [], msgLabelY = [], blockStartY = /* @__PURE__ */ new Map(), blockEndY = /* @__PURE__ */ new Map(), divYMap = /* @__PURE__ */ new Map(), notePositions = [], curY = actorBoxH;
  for (let m = 0; m < diagram.messages.length; m++) {
    for (let b = 0; b < diagram.blocks.length; b++)
      diagram.blocks[b].startIndex === m && (curY += 2, blockStartY.set(b, curY - 1));
    for (let b = 0; b < diagram.blocks.length; b++)
      for (let d = 0; d < diagram.blocks[b].dividers.length; d++)
        diagram.blocks[b].dividers[d].index === m && (curY += 1, divYMap.set(`${b}:${d}`, curY), curY += 1);
    curY += 1;
    let msg = diagram.messages[m], isSelf = msg.from === msg.to, msgLineCount = lineCount(msg.label);
    isSelf ? (msgLabelY[m] = curY + 1, msgArrowY[m] = curY, curY += 2 + msgLineCount) : (msgLabelY[m] = curY, msgArrowY[m] = curY + msgLineCount, curY += msgLineCount + 1);
    for (let n = 0; n < diagram.notes.length; n++)
      if (diagram.notes[n].afterIndex === m) {
        curY += 1;
        let note = diagram.notes[n], nLines = splitLines(note.text), nWidth = Math.max(...nLines.map((l) => l.length)) + 4, nHeight = nLines.length + 2, aIdx = actorIdx.get(note.actorIds[0]) ?? 0, nx;
        if (note.position === "left")
          nx = llX[aIdx] - nWidth - 1;
        else if (note.position === "right")
          nx = llX[aIdx] + 2;
        else if (note.actorIds.length >= 2) {
          let aIdx2 = actorIdx.get(note.actorIds[1]) ?? aIdx;
          nx = Math.floor((llX[aIdx] + llX[aIdx2]) / 2) - Math.floor(nWidth / 2);
        } else
          nx = llX[aIdx] - Math.floor(nWidth / 2);
        nx = Math.max(0, nx), notePositions.push({ x: nx, y: curY, width: nWidth, height: nHeight, lines: nLines }), curY += nHeight;
      }
    for (let b = 0; b < diagram.blocks.length; b++)
      diagram.blocks[b].endIndex === m && (curY += 1, blockEndY.set(b, curY), curY += 1);
  }
  curY += 1;
  let footerY = curY, totalH = footerY + actorBoxH, lastLL = llX[llX.length - 1] ?? 0, lastHalf = halfBox[halfBox.length - 1] ?? 0, totalW = lastLL + lastHalf + 2;
  for (let m = 0; m < diagram.messages.length; m++) {
    let msg = diagram.messages[m];
    if (msg.from === msg.to) {
      let fi = actorIdx.get(msg.from), selfRight = llX[fi] + 6 + 2 + msg.label.length;
      totalW = Math.max(totalW, selfRight + 1);
    }
  }
  for (let np of notePositions)
    totalW = Math.max(totalW, np.x + np.width + 1);
  let canvas2 = mkCanvas(totalW, totalH - 1), rc = mkRoleCanvas(totalW, totalH - 1);
  function setC(x, y, ch, role) {
    x >= 0 && x < canvas2.length && y >= 0 && y < (canvas2[0]?.length ?? 0) && (canvas2[x][y] = ch, setRole(rc, x, y, role));
  }
  function drawActorBox(cx, topY, label) {
    let lines2 = splitLines(label), maxW = maxLineWidth(label), w = maxW + 2 * boxPad + 2, h = lines2.length + 2, left = cx - Math.floor(w / 2);
    setC(left, topY, TL, "border");
    for (let x = 1; x < w - 1; x++) setC(left + x, topY, H, "border");
    setC(left + w - 1, topY, TR, "border");
    for (let i = 0; i < lines2.length; i++) {
      let row = topY + 1 + i;
      setC(left, row, V, "border"), setC(left + w - 1, row, V, "border");
      let line2 = lines2[i], ls = left + 1 + boxPad + Math.floor((maxW - line2.length) / 2);
      for (let j = 0; j < line2.length; j++)
        setC(ls + j, row, line2[j], "text");
    }
    let bottomY = topY + h - 1;
    setC(left, bottomY, BL, "border");
    for (let x = 1; x < w - 1; x++) setC(left + x, bottomY, H, "border");
    setC(left + w - 1, bottomY, BR, "border");
  }
  for (let i = 0; i < diagram.actors.length; i++) {
    let x = llX[i];
    for (let y = actorBoxH; y <= footerY; y++)
      setC(x, y, V, "line");
  }
  for (let i = 0; i < diagram.actors.length; i++) {
    let actor = diagram.actors[i];
    drawActorBox(llX[i], 0, actor.label), drawActorBox(llX[i], footerY, actor.label), useAscii || (setC(llX[i], actorBoxH - 1, JT, "junction"), setC(llX[i], footerY, JB, "junction"));
  }
  for (let m = 0; m < diagram.messages.length; m++) {
    let msg = diagram.messages[m], fi = actorIdx.get(msg.from), ti = actorIdx.get(msg.to), fromX = llX[fi], toX = llX[ti], isSelf = fi === ti, isDashed = msg.lineStyle === "dashed", isFilled = msg.arrowHead === "filled", lineChar = isDashed ? useAscii ? "." : "\u254C" : H;
    if (isSelf) {
      let y0 = msgArrowY[m], loopW = Math.max(4, 4);
      setC(fromX, y0, JL, "junction");
      for (let x = fromX + 1; x < fromX + loopW; x++) setC(x, y0, lineChar, "line");
      setC(fromX + loopW, y0, useAscii ? "+" : "\u2510", "corner"), setC(fromX + loopW, y0 + 1, V, "line");
      let labelX = fromX + loopW + 2;
      for (let i = 0; i < msg.label.length; i++)
        labelX + i < totalW && setC(labelX + i, y0 + 1, msg.label[i], "text");
      let arrowChar = isFilled ? useAscii ? "<" : "\u25C0" : useAscii ? "<" : "\u25C1";
      setC(fromX, y0 + 2, arrowChar, "arrow");
      for (let x = fromX + 1; x < fromX + loopW; x++) setC(x, y0 + 2, lineChar, "line");
      setC(fromX + loopW, y0 + 2, useAscii ? "+" : "\u2518", "corner");
    } else {
      let labelY = msgLabelY[m], arrowY = msgArrowY[m], leftToRight = fromX < toX, midX = Math.floor((fromX + toX) / 2), msgLines = splitLines(msg.label);
      for (let lineIdx = 0; lineIdx < msgLines.length; lineIdx++) {
        let line2 = msgLines[lineIdx], labelStart = midX - Math.floor(line2.length / 2), y = labelY + lineIdx;
        for (let i = 0; i < line2.length; i++) {
          let lx = labelStart + i;
          lx >= 0 && lx < totalW && setC(lx, y, line2[i], "text");
        }
      }
      if (leftToRight) {
        for (let x = fromX + 1; x < toX; x++) setC(x, arrowY, lineChar, "line");
        setC(toX, arrowY, isFilled ? useAscii ? ">" : "\u25B6" : useAscii ? ">" : "\u25B7", "arrow");
      } else {
        for (let x = toX + 1; x < fromX; x++) setC(x, arrowY, lineChar, "line");
        setC(toX, arrowY, isFilled ? useAscii ? "<" : "\u25C0" : useAscii ? "<" : "\u25C1", "arrow");
      }
    }
  }
  for (let b = 0; b < diagram.blocks.length; b++) {
    let block = diagram.blocks[b], topY = blockStartY.get(b), botY = blockEndY.get(b);
    if (topY === void 0 || botY === void 0) continue;
    let minLX = totalW, maxLX = 0;
    for (let m = block.startIndex; m <= block.endIndex && !(m >= diagram.messages.length); m++) {
      let msg = diagram.messages[m], f = actorIdx.get(msg.from) ?? 0, t = actorIdx.get(msg.to) ?? 0;
      minLX = Math.min(minLX, llX[Math.min(f, t)]), maxLX = Math.max(maxLX, llX[Math.max(f, t)]);
    }
    let bLeft = Math.max(0, minLX - 4), bRight = Math.min(totalW - 1, maxLX + 4);
    setC(bLeft, topY, TL, "border");
    for (let x = bLeft + 1; x < bRight; x++) setC(x, topY, H, "border");
    setC(bRight, topY, TR, "border");
    let hdrLabel = block.label ? `${block.type} [${block.label}]` : block.type, hdrLines = splitLines(hdrLabel);
    for (let lineIdx = 0; lineIdx < hdrLines.length && topY + lineIdx < botY; lineIdx++) {
      let line2 = hdrLines[lineIdx];
      for (let i = 0; i < line2.length && bLeft + 1 + i < bRight; i++)
        setC(bLeft + 1 + i, topY + lineIdx, line2[i], "text");
    }
    setC(bLeft, botY, BL, "border");
    for (let x = bLeft + 1; x < bRight; x++) setC(x, botY, H, "border");
    setC(bRight, botY, BR, "border");
    for (let y = topY + 1; y < botY; y++)
      setC(bLeft, y, V, "border"), setC(bRight, y, V, "border");
    for (let d = 0; d < block.dividers.length; d++) {
      let dY = divYMap.get(`${b}:${d}`);
      if (dY === void 0) continue;
      let dashChar = isDashedH();
      setC(bLeft, dY, JL, "junction");
      for (let x = bLeft + 1; x < bRight; x++) setC(x, dY, dashChar, "line");
      setC(bRight, dY, JR, "junction");
      let dLabel = block.dividers[d].label;
      if (dLabel) {
        let dStr = `[${dLabel}]`;
        for (let i = 0; i < dStr.length && bLeft + 1 + i < bRight; i++)
          setC(bLeft + 1 + i, dY, dStr[i], "text");
      }
    }
  }
  for (let np of notePositions) {
    increaseSize(canvas2, np.x + np.width, np.y + np.height), increaseRoleCanvasSize(rc, np.x + np.width, np.y + np.height), setC(np.x, np.y, TL, "border");
    for (let x = 1; x < np.width - 1; x++) setC(np.x + x, np.y, H, "border");
    setC(np.x + np.width - 1, np.y, TR, "border");
    for (let l = 0; l < np.lines.length; l++) {
      let ly = np.y + 1 + l;
      setC(np.x, ly, V, "border"), setC(np.x + np.width - 1, ly, V, "border");
      for (let i = 0; i < np.lines[l].length; i++)
        setC(np.x + 2 + i, ly, np.lines[l][i], "text");
    }
    let by = np.y + np.height - 1;
    setC(np.x, by, BL, "border");
    for (let x = 1; x < np.width - 1; x++) setC(np.x + x, by, H, "border");
    setC(np.x + np.width - 1, by, BR, "border");
  }
  return canvasToString(canvas2, { roleCanvas: rc, colorMode, theme });
  function isDashedH() {
    return useAscii ? "-" : "\u254C";
  }
}
function parseClassDiagram(lines) {
  let diagram = {
    classes: [],
    relationships: [],
    namespaces: []
  }, classMap = /* @__PURE__ */ new Map(), currentNamespace = null, currentClass = null, braceDepth = 0;
  for (let i = 1; i < lines.length; i++) {
    let line2 = lines[i];
    if (currentClass && braceDepth > 0) {
      if (line2 === "}") {
        braceDepth--, braceDepth === 0 && (currentClass = null);
        continue;
      }
      let annotMatch = line2.match(/^<<(\w+)>>$/);
      if (annotMatch) {
        currentClass.annotation = annotMatch[1];
        continue;
      }
      let member = parseMember(line2);
      member && (member.isMethod ? currentClass.methods.push(member.member) : currentClass.attributes.push(member.member));
      continue;
    }
    let nsMatch = line2.match(/^namespace\s+(\S+)\s*\{$/);
    if (nsMatch) {
      currentNamespace = { name: nsMatch[1], classIds: [] };
      continue;
    }
    if (line2 === "}" && currentNamespace) {
      diagram.namespaces.push(currentNamespace), currentNamespace = null;
      continue;
    }
    let classBlockMatch = line2.match(/^class\s+(\S+?)(?:\s*~(\w+)~)?\s*\{$/);
    if (classBlockMatch) {
      let id = classBlockMatch[1], generic = classBlockMatch[2], cls = ensureClass(classMap, id);
      generic && (cls.label = `${id}<${generic}>`), currentClass = cls, braceDepth = 1, currentNamespace && currentNamespace.classIds.push(id);
      continue;
    }
    let classOnlyMatch = line2.match(/^class\s+(\S+?)(?:\s*~(\w+)~)?\s*$/);
    if (classOnlyMatch) {
      let id = classOnlyMatch[1], generic = classOnlyMatch[2], cls = ensureClass(classMap, id);
      generic && (cls.label = `${id}<${generic}>`), currentNamespace && currentNamespace.classIds.push(id);
      continue;
    }
    let inlineAnnotMatch = line2.match(/^class\s+(\S+?)\s*\{\s*<<(\w+)>>\s*\}$/);
    if (inlineAnnotMatch) {
      let cls = ensureClass(classMap, inlineAnnotMatch[1]);
      cls.annotation = inlineAnnotMatch[2];
      continue;
    }
    let inlineAttrMatch = line2.match(/^(\S+?)\s*:\s*(.+)$/);
    if (inlineAttrMatch) {
      let rest = inlineAttrMatch[2];
      if (!rest.match(/<\|--|--|\*--|o--|-->|\.\.>|\.\.\|>/)) {
        let cls = ensureClass(classMap, inlineAttrMatch[1]), member = parseMember(rest);
        member && (member.isMethod ? cls.methods.push(member.member) : cls.attributes.push(member.member));
        continue;
      }
    }
    let rel = parseRelationship(line2);
    if (rel) {
      ensureClass(classMap, rel.from), ensureClass(classMap, rel.to), diagram.relationships.push(rel);
      continue;
    }
  }
  return diagram.classes = [...classMap.values()], diagram;
}
function ensureClass(classMap, id) {
  let cls = classMap.get(id);
  return cls || (cls = { id, label: id, attributes: [], methods: [] }, classMap.set(id, cls)), cls;
}
function parseMember(line2) {
  let trimmed = line2.trim().replace(/;$/, "");
  if (!trimmed) return null;
  let visibility = "", rest = trimmed;
  /^[+\-#~]/.test(rest) && (visibility = rest[0], rest = rest.slice(1).trim());
  let methodMatch = rest.match(/^(.+?)\(([^)]*)\)(?:\s*(.+))?$/);
  if (methodMatch) {
    let name2 = methodMatch[1].trim(), params = methodMatch[2]?.trim() || void 0, type2 = methodMatch[3]?.trim(), isStatic2 = name2.endsWith("$") || rest.includes("$"), isAbstract2 = name2.endsWith("*") || rest.includes("*");
    return {
      member: {
        visibility,
        name: name2.replace(/[$*]$/, ""),
        type: type2 || void 0,
        isStatic: isStatic2,
        isAbstract: isAbstract2,
        isMethod: true,
        params
      },
      isMethod: true
    };
  }
  let parts = rest.split(/\s+/), name, type;
  parts.length >= 2 ? (type = parts[0], name = parts.slice(1).join(" ")) : name = parts[0] ?? rest;
  let isStatic = name.endsWith("$"), isAbstract = name.endsWith("*");
  return {
    member: {
      visibility,
      name: name.replace(/[$*]$/, ""),
      type: type || void 0,
      isStatic,
      isAbstract,
      isMethod: false
    },
    isMethod: false
  };
}
function parseRelationship(line2) {
  let match = line2.match(
    /^(\S+?)\s+(?:"([^"]*?)"\s+)?(<\|--|<\|\.\.|\*--|o--|-->|--\*|--o|--\|>|\.\.>|\.\.\|>|<--|<\.\.?|--)\s+(?:"([^"]*?)"\s+)?(\S+?)(?:\s*:\s*(.+))?$/
  );
  if (!match) return null;
  let from = match[1], rawFromCardinality = match[2], fromCardinality = rawFromCardinality ? normalizeBrTags(rawFromCardinality) : void 0, arrow = match[3].trim(), rawToCardinality = match[4], toCardinality = rawToCardinality ? normalizeBrTags(rawToCardinality) : void 0, to = match[5], rawLabel = match[6]?.trim(), label = rawLabel ? normalizeBrTags(rawLabel) : void 0, parsed = parseArrow(arrow);
  return parsed ? { from, to, type: parsed.type, markerAt: parsed.markerAt, label, fromCardinality, toCardinality } : null;
}
function parseArrow(arrow) {
  switch (arrow.trim()) {
    case "<|--":
      return { type: "inheritance", markerAt: "from" };
    case "--|>":
      return { type: "inheritance", markerAt: "to" };
    case "<|..":
      return { type: "realization", markerAt: "from" };
    case "..|>":
      return { type: "realization", markerAt: "to" };
    case "*--":
      return { type: "composition", markerAt: "from" };
    case "--*":
      return { type: "composition", markerAt: "to" };
    case "o--":
      return { type: "aggregation", markerAt: "from" };
    case "--o":
      return { type: "aggregation", markerAt: "to" };
    case "-->":
      return { type: "association", markerAt: "to" };
    case "<--":
      return { type: "association", markerAt: "from" };
    case "..>":
      return { type: "dependency", markerAt: "to" };
    case "<..":
      return { type: "dependency", markerAt: "from" };
    case "--":
      return { type: "association", markerAt: "to" };
    default:
      return null;
  }
}
function classifyBoxChar(ch) {
  return /^[┌┐└┘├┤┬┴┼│─╭╮╰╯+\-|]$/.test(ch) ? "border" : "text";
}
function formatMember(m) {
  let vis = m.visibility || "", type = m.type ? `: ${m.type}` : "";
  return `${vis}${m.name}${type}`;
}
function buildClassSections(cls) {
  let header = [];
  cls.annotation && header.push(`<<${cls.annotation}>>`);
  let nameLines = splitLines(cls.label);
  header.push(...nameLines);
  let attrs = cls.attributes.map(formatMember), methods = cls.methods.map(formatMember);
  return attrs.length === 0 && methods.length === 0 ? [header] : methods.length === 0 ? [header, attrs] : [header, attrs, methods];
}
function getRelMarker(type, markerAt) {
  return { type, markerAt, dashed: type === "dependency" || type === "realization" };
}
function getMarkerShape(type, useAscii, direction) {
  switch (type) {
    case "inheritance":
    case "realization":
      return direction === "down" ? useAscii ? "^" : "\u25B3" : direction === "up" ? useAscii ? "v" : "\u25BD" : direction === "left" ? useAscii ? ">" : "\u25C1" : useAscii ? "<" : "\u25B7";
    case "composition":
      return useAscii ? "*" : "\u25C6";
    case "aggregation":
      return useAscii ? "o" : "\u25C7";
    case "association":
    case "dependency":
      return direction === "down" ? useAscii ? "v" : "\u25BC" : direction === "up" ? useAscii ? "^" : "\u25B2" : direction === "left" ? useAscii ? "<" : "\u25C0" : useAscii ? ">" : "\u25B6";
  }
}
function renderClassAscii(text, config, colorMode, theme) {
  let lines = text.split(`
`).map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith("%%")), diagram = parseClassDiagram(lines);
  if (diagram.classes.length === 0) return "";
  let useAscii = config.useAscii, hGap = 4, vGap = 3, classSections = /* @__PURE__ */ new Map(), classBoxW = /* @__PURE__ */ new Map(), classBoxH = /* @__PURE__ */ new Map();
  for (let cls of diagram.classes) {
    let sections = buildClassSections(cls);
    classSections.set(cls.id, sections);
    let maxTextW = 0;
    for (let section of sections)
      for (let line2 of section) maxTextW = Math.max(maxTextW, line2.length);
    let boxW = maxTextW + 4, totalLines = 0;
    for (let section of sections) totalLines += Math.max(section.length, 1);
    let boxH = totalLines + (sections.length - 1) + 2;
    classBoxW.set(cls.id, boxW), classBoxH.set(cls.id, boxH);
  }
  let classById = /* @__PURE__ */ new Map();
  for (let cls of diagram.classes) classById.set(cls.id, cls);
  let parents = /* @__PURE__ */ new Map(), children = /* @__PURE__ */ new Map();
  for (let rel of diagram.relationships) {
    let isHierarchical = rel.type === "inheritance" || rel.type === "realization", parentId = isHierarchical && rel.markerAt === "to" ? rel.to : rel.from, childId = isHierarchical && rel.markerAt === "to" ? rel.from : rel.to;
    parents.has(childId) || parents.set(childId, /* @__PURE__ */ new Set()), parents.get(childId).add(parentId), children.has(parentId) || children.set(parentId, /* @__PURE__ */ new Set()), children.get(parentId).add(childId);
  }
  let level2 = /* @__PURE__ */ new Map(), queue = diagram.classes.filter((c) => !parents.has(c.id) || parents.get(c.id).size === 0).map((c) => c.id);
  for (let id of queue) level2.set(id, 0);
  let levelCap = diagram.classes.length - 1, qi = 0;
  for (; qi < queue.length; ) {
    let id = queue[qi++], childSet = children.get(id);
    if (childSet)
      for (let childId of childSet) {
        let newLevel = (level2.get(id) ?? 0) + 1;
        newLevel > levelCap || (!level2.has(childId) || level2.get(childId) < newLevel) && (level2.set(childId, newLevel), queue.push(childId));
      }
  }
  for (let cls of diagram.classes)
    level2.has(cls.id) || level2.set(cls.id, 0);
  let maxLevel = Math.max(...level2.values(), 0), levelGroups = Array.from({ length: maxLevel + 1 }, () => []);
  for (let cls of diagram.classes)
    levelGroups[level2.get(cls.id)].push(cls.id);
  let placed = /* @__PURE__ */ new Map(), currentY = 0;
  for (let lv = 0; lv <= maxLevel; lv++) {
    let group = levelGroups[lv];
    if (group.length === 0) continue;
    let currentX = 0, maxH = 0;
    for (let id of group) {
      let cls = classById.get(id), w = classBoxW.get(id), h = classBoxH.get(id);
      placed.set(id, {
        cls,
        sections: classSections.get(id),
        x: currentX,
        y: currentY,
        width: w,
        height: h
      }), currentX += w + hGap, maxH = Math.max(maxH, h);
    }
    currentY += maxH + vGap;
  }
  let totalW = 0, totalH = 0;
  for (let p of placed.values())
    totalW = Math.max(totalW, p.x + p.width), totalH = Math.max(totalH, p.y + p.height);
  totalW += 4, totalH += 2;
  let canvas2 = mkCanvas(totalW - 1, totalH - 1), rc = mkRoleCanvas(totalW - 1, totalH - 1);
  function setC(x, y, ch, role) {
    x >= 0 && x < canvas2.length && y >= 0 && y < (canvas2[0]?.length ?? 0) && (canvas2[x][y] = ch, setRole(rc, x, y, role));
  }
  for (let p of placed.values()) {
    let boxCanvas = drawMultiBox(p.sections, useAscii);
    for (let bx = 0; bx < boxCanvas.length; bx++)
      for (let by = 0; by < boxCanvas[0].length; by++) {
        let ch = boxCanvas[bx][by];
        if (ch !== " ") {
          let cx = p.x + bx, cy = p.y + by;
          cx < totalW && cy < totalH && setC(cx, cy, ch, classifyBoxChar(ch));
        }
      }
  }
  let boxOccupancy = [];
  for (let p of placed.values())
    boxOccupancy.push({
      x1: p.x,
      x2: p.x + p.width - 1,
      y1: p.y,
      y2: p.y + p.height - 1
    });
  function isInsideBox(x, y, excludeIds) {
    for (let [id, p] of placed.entries())
      if (!excludeIds?.has(id) && x >= p.x && x <= p.x + p.width - 1 && y >= p.y && y <= p.y + p.height - 1)
        return true;
    return false;
  }
  function findClearColumn(startX, y1, y2, excludeIds) {
    let clear = true;
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++)
      if (isInsideBox(startX, y, excludeIds)) {
        clear = false;
        break;
      }
    if (clear) return startX;
    for (let offset = 1; offset < totalW + 10; offset++) {
      let rightX = startX + offset;
      clear = true;
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++)
        if (isInsideBox(rightX, y, excludeIds)) {
          clear = false;
          break;
        }
      if (clear) return rightX;
      let leftX = startX - offset;
      if (leftX >= 0) {
        clear = true;
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++)
          if (isInsideBox(leftX, y, excludeIds)) {
            clear = false;
            break;
          }
        if (clear) return leftX;
      }
    }
    return totalW + 2;
  }
  let H = useAscii ? "-" : "\u2500", V = useAscii ? "|" : "\u2502", dashH = useAscii ? "." : "\u254C", dashV = useAscii ? ":" : "\u250A";
  for (let rel of diagram.relationships) {
    let fromP = placed.get(rel.from), toP = placed.get(rel.to);
    if (!fromP || !toP) continue;
    let marker = getRelMarker(rel.type, rel.markerAt), lineH = marker.dashed ? dashH : H, lineV = marker.dashed ? dashV : V, excludeIds = /* @__PURE__ */ new Set([rel.from, rel.to]), fromCX = fromP.x + Math.floor(fromP.width / 2), fromBY = fromP.y + fromP.height - 1, toCX = toP.x + Math.floor(toP.width / 2), toTY = toP.y;
    if (fromBY < toTY) {
      let routeX = findClearColumn(fromCX, fromBY + 1, toTY - 1, excludeIds), needsDetour = routeX !== fromCX;
      if (routeX >= totalW && increaseSize(canvas2, routeX + 2, totalH), needsDetour) {
        let exitY = fromBY + 1, entryY = toTY - 1, lx1 = Math.min(fromCX, routeX), rx1 = Math.max(fromCX, routeX);
        for (let x = lx1; x <= rx1; x++)
          setC(x, exitY, lineH, "line");
        !useAscii && exitY < (canvas2[0]?.length ?? 0) && (fromCX < routeX ? (setC(fromCX, exitY, "\u2514", "corner"), setC(routeX, exitY, "\u2510", "corner")) : (setC(fromCX, exitY, "\u2518", "corner"), setC(routeX, exitY, "\u250C", "corner")));
        for (let y = exitY + 1; y <= entryY; y++)
          setC(routeX, y, lineV, "line");
        if (routeX !== toCX) {
          let lx2 = Math.min(routeX, toCX), rx2 = Math.max(routeX, toCX);
          for (let x = lx2; x <= rx2; x++)
            setC(x, entryY, lineH, "line");
          !useAscii && entryY < (canvas2[0]?.length ?? 0) && (routeX < toCX ? (setC(routeX, entryY, "\u2514", "corner"), setC(toCX, entryY, "\u2510", "corner")) : (setC(routeX, entryY, "\u2518", "corner"), setC(toCX, entryY, "\u250C", "corner")));
        }
        if (marker.markerAt === "to") {
          let markerChar = getMarkerShape(marker.type, useAscii, "down");
          setC(toCX, entryY, markerChar, "arrow");
        }
        if (marker.markerAt === "from") {
          let markerChar = getMarkerShape(marker.type, useAscii, "down");
          setC(fromCX, fromBY + 1, markerChar, "arrow");
        }
      } else {
        let midY = fromBY + Math.floor((toTY - fromBY) / 2);
        for (let y = fromBY + 1; y <= midY; y++)
          setC(fromCX, y, lineV, "line");
        if (fromCX !== toCX && midY < (canvas2[0]?.length ?? 0)) {
          let lx = Math.min(fromCX, toCX), rx = Math.max(fromCX, toCX);
          for (let x = lx; x <= rx; x++)
            setC(x, midY, lineH, "line");
          useAscii || (setC(fromCX, midY, fromCX < toCX ? "\u2514" : "\u2518", "corner"), setC(toCX, midY, fromCX < toCX ? "\u2510" : "\u250C", "corner"));
        }
        for (let y = midY + 1; y < toTY; y++)
          setC(toCX, y, lineV, "line");
        marker.markerAt === "to" && setC(toCX, toTY - 1, getMarkerShape(marker.type, useAscii, "down"), "arrow"), marker.markerAt === "from" && setC(fromCX, fromBY + 1, getMarkerShape(marker.type, useAscii, "down"), "arrow");
      }
    } else if (toP.y + toP.height - 1 < fromP.y) {
      let fromTY = fromP.y, toBY = toP.y + toP.height - 1, midY = toBY + Math.floor((fromTY - toBY) / 2);
      for (let y = fromTY - 1; y >= midY; y--)
        setC(fromCX, y, lineV, "line");
      if (fromCX !== toCX) {
        let lx = Math.min(fromCX, toCX), rx = Math.max(fromCX, toCX);
        for (let x = lx; x <= rx; x++)
          setC(x, midY, lineH, "line");
        !useAscii && midY >= 0 && midY < totalH && (setC(fromCX, midY, fromCX < toCX ? "\u250C" : "\u2510", "corner"), setC(toCX, midY, fromCX < toCX ? "\u2518" : "\u2514", "corner"));
      }
      for (let y = midY - 1; y > toBY; y--)
        setC(toCX, y, lineV, "line");
      if (marker.markerAt === "from") {
        let markerChar = getMarkerShape(marker.type, useAscii, "up"), my = fromTY - 1;
        for (let i = 0; i < markerChar.length; i++)
          setC(fromCX - Math.floor(markerChar.length / 2) + i, my, markerChar[i], "arrow");
      }
      if (marker.markerAt === "to") {
        let markerDir = marker.type === "inheritance" || marker.type === "realization" ? "down" : "up", markerChar = getMarkerShape(marker.type, useAscii, markerDir), my = toBY + 1;
        for (let i = 0; i < markerChar.length; i++)
          setC(toCX - Math.floor(markerChar.length / 2) + i, my, markerChar[i], "arrow");
      }
    } else {
      let detourY = Math.max(fromBY, toP.y + toP.height - 1) + 2;
      increaseSize(canvas2, totalW, detourY + 1), increaseRoleCanvasSize(rc, totalW, detourY + 1);
      for (let y = fromBY + 1; y <= detourY; y++)
        setC(fromCX, y, lineV, "line");
      let lx = Math.min(fromCX, toCX), rx = Math.max(fromCX, toCX);
      for (let x = lx; x <= rx; x++)
        setC(x, detourY, lineH, "line");
      for (let y = detourY - 1; y >= toP.y + toP.height; y--)
        setC(toCX, y, lineV, "line");
      if (marker.markerAt === "from") {
        let markerChar = getMarkerShape(marker.type, useAscii, "down"), my = fromBY + 1;
        for (let i = 0; i < markerChar.length; i++)
          setC(fromCX - Math.floor(markerChar.length / 2) + i, my, markerChar[i], "arrow");
      }
      if (marker.markerAt === "to") {
        let markerChar = getMarkerShape(marker.type, useAscii, "up"), my = toP.y + toP.height;
        for (let i = 0; i < markerChar.length; i++)
          setC(toCX - Math.floor(markerChar.length / 2) + i, my, markerChar[i], "arrow");
      }
    }
    if (rel.label) {
      let lines2 = splitLines(rel.label), maxLabelWidth = Math.max(...lines2.map((l) => l.length)) + 2, baseMidY, idealMidX;
      if (fromBY < toTY)
        baseMidY = Math.floor((fromBY + 1 + toTY - 1) / 2), idealMidX = Math.floor((fromCX + toCX) / 2);
      else if (toP.y + toP.height - 1 < fromP.y) {
        let toBY = toP.y + toP.height - 1;
        baseMidY = Math.floor((toBY + 1 + fromP.y - 1) / 2), idealMidX = Math.floor((fromCX + toCX) / 2);
      } else
        baseMidY = Math.max(fromBY, toP.y + toP.height - 1) + 2, idealMidX = Math.floor((fromCX + toCX) / 2);
      let labelY = baseMidY, halfHeight = Math.floor(lines2.length / 2), labelInBox = false;
      for (let i = 0; i < lines2.length; i++) {
        let y = labelY - halfHeight + i, idealLabelStart = idealMidX - Math.floor(maxLabelWidth / 2), labelStart = Math.max(0, idealLabelStart);
        for (let x = labelStart; x < labelStart + maxLabelWidth; x++)
          if (isInsideBox(x, y, excludeIds)) {
            labelInBox = true;
            break;
          }
        if (labelInBox) break;
      }
      if (labelInBox) {
        let gapTop = fromBY + 1, gapBottom = toTY - 1;
        for (let y = gapTop; y <= gapBottom; y++) {
          let clearRow = true, idealLabelStart = idealMidX - Math.floor(maxLabelWidth / 2), labelStart = Math.max(0, idealLabelStart);
          for (let x = labelStart; x < labelStart + maxLabelWidth; x++)
            if (isInsideBox(x, y, excludeIds)) {
              clearRow = false;
              break;
            }
          if (clearRow) {
            labelY = y;
            break;
          }
        }
      }
      let startY = labelY - halfHeight;
      for (let lineIdx = 0; lineIdx < lines2.length; lineIdx++) {
        let paddedLine = ` ${lines2[lineIdx]} `, idealLabelStart = idealMidX - Math.floor(paddedLine.length / 2), labelStart = Math.max(0, idealLabelStart), y = startY + lineIdx, labelEnd = labelStart + paddedLine.length;
        labelEnd > 0 && y >= 0 && (increaseSize(canvas2, Math.max(labelEnd, 1), Math.max(y + 1, 1)), increaseRoleCanvasSize(rc, Math.max(labelEnd, 1), Math.max(y + 1, 1)));
        for (let i = 0; i < paddedLine.length; i++) {
          let lx = labelStart + i;
          lx >= 0 && y >= 0 && setC(lx, y, paddedLine[i], "text");
        }
      }
    }
  }
  return canvasToString(canvas2, { roleCanvas: rc, colorMode, theme });
}
function parseErDiagram(lines) {
  let diagram = {
    entities: [],
    relationships: []
  }, entityMap = /* @__PURE__ */ new Map(), currentEntity = null;
  for (let i = 1; i < lines.length; i++) {
    let line2 = lines[i];
    if (currentEntity) {
      if (line2 === "}") {
        currentEntity = null;
        continue;
      }
      let attr = parseAttribute(line2);
      attr && currentEntity.attributes.push(attr);
      continue;
    }
    let entityBlockMatch = line2.match(/^(\S+)\s*\{$/);
    if (entityBlockMatch) {
      let id = entityBlockMatch[1];
      currentEntity = ensureEntity(entityMap, id);
      continue;
    }
    let rel = parseRelationshipLine(line2);
    if (rel) {
      ensureEntity(entityMap, rel.entity1), ensureEntity(entityMap, rel.entity2), diagram.relationships.push(rel);
      continue;
    }
  }
  return diagram.entities = [...entityMap.values()], diagram;
}
function ensureEntity(entityMap, id) {
  let entity = entityMap.get(id);
  return entity || (entity = { id, label: id, attributes: [] }, entityMap.set(id, entity)), entity;
}
function parseAttribute(line2) {
  let match = line2.match(/^(\S+)\s+(\S+)(?:\s+(.+))?$/);
  if (!match) return null;
  let type = match[1], name = match[2], rest = match[3]?.trim() ?? "", keys = [], comment, commentMatch = rest.match(/"([^"]*)"/);
  commentMatch && (comment = normalizeBrTags(commentMatch[1]));
  let restWithoutComment = rest.replace(/"[^"]*"/, "").trim();
  for (let part of restWithoutComment.split(/\s+/)) {
    let upper = part.toUpperCase();
    (upper === "PK" || upper === "FK" || upper === "UK") && keys.push(upper);
  }
  return { type, name, keys, comment };
}
function parseRelationshipLine(line2) {
  let match = line2.match(/^(\S+)\s+([|o}{]+(?:--|\.\.)[|o}{]+)\s+(\S+)\s*:\s*(.+)$/);
  if (!match) return null;
  let entity1 = match[1], cardinalityStr = match[2], entity2 = match[3], rawLabel = match[4].trim().replace(/^["']|["']$/g, ""), label = normalizeBrTags(rawLabel), lineMatch = cardinalityStr.match(/^([|o}{]+)(--|\.\.?)([|o}{]+)$/);
  if (!lineMatch) return null;
  let leftStr = lineMatch[1], lineStyle = lineMatch[2], rightStr = lineMatch[3], cardinality1 = parseCardinality(leftStr), cardinality2 = parseCardinality(rightStr), identifying = lineStyle === "--";
  return !cardinality1 || !cardinality2 ? null : { entity1, entity2, cardinality1, cardinality2, label, identifying };
}
function parseCardinality(str) {
  let sorted = str.split("").sort().join("");
  return sorted === "||" ? "one" : sorted === "o|" ? "zero-one" : sorted === "|}" || sorted === "{|" ? "many" : sorted === "{o" || sorted === "o{" ? "zero-many" : null;
}
function classifyBoxChar2(ch) {
  return /^[┌┐└┘├┤┬┴┼│─╭╮╰╯+\-|]$/.test(ch) ? "border" : "text";
}
function formatAttribute(attr) {
  return `${attr.keys.length > 0 ? attr.keys.join(",") + " " : "   "}${attr.type} ${attr.name}`;
}
function buildEntitySections(entity) {
  let header = splitLines(entity.label), attrs = entity.attributes.map(formatAttribute);
  return attrs.length === 0 ? [header] : [header, attrs];
}
function getCrowsFootChars(card, useAscii, isRight = false) {
  if (useAscii)
    switch (card) {
      case "one":
        return "|";
      case "zero-one":
        return "o|";
      case "many":
        return isRight ? "<" : ">";
      case "zero-many":
        return isRight ? "o<" : ">o";
    }
  else
    switch (card) {
      case "one":
        return "\u2502";
      case "zero-one":
        return "\u25CB\u2502";
      case "many":
        return isRight ? "\u255F" : "\u2562";
      case "zero-many":
        return isRight ? "\u25CB\u255F" : "\u2562\u25CB";
    }
}
function findConnectedComponents(diagram) {
  let visited = /* @__PURE__ */ new Set(), components = [], neighbors = /* @__PURE__ */ new Map();
  for (let ent of diagram.entities)
    neighbors.set(ent.id, /* @__PURE__ */ new Set());
  for (let rel of diagram.relationships)
    neighbors.get(rel.entity1)?.add(rel.entity2), neighbors.get(rel.entity2)?.add(rel.entity1);
  function dfs(startId, component) {
    let stack = [startId];
    for (; stack.length > 0; ) {
      let nodeId = stack.pop();
      if (!visited.has(nodeId)) {
        visited.add(nodeId), component.add(nodeId);
        for (let neighbor of neighbors.get(nodeId) ?? [])
          visited.has(neighbor) || stack.push(neighbor);
      }
    }
  }
  for (let ent of diagram.entities)
    if (!visited.has(ent.id)) {
      let component = /* @__PURE__ */ new Set();
      dfs(ent.id, component), component.size > 0 && components.push(component);
    }
  return components;
}
function renderErAscii(text, config, colorMode, theme) {
  let lines = text.split(`
`).map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith("%%")), diagram = parseErDiagram(lines);
  if (diagram.entities.length === 0) return "";
  let useAscii = config.useAscii, hGap = 6, vGap = 4, componentGap = 6, entitySections = /* @__PURE__ */ new Map(), entityBoxW = /* @__PURE__ */ new Map(), entityBoxH = /* @__PURE__ */ new Map(), entityById = /* @__PURE__ */ new Map();
  for (let ent of diagram.entities) {
    entityById.set(ent.id, ent);
    let sections = buildEntitySections(ent);
    entitySections.set(ent.id, sections);
    let maxTextW = 0;
    for (let section of sections)
      for (let line2 of section) maxTextW = Math.max(maxTextW, line2.length);
    let boxW = maxTextW + 4, totalLines = 0;
    for (let section of sections) totalLines += Math.max(section.length, 1);
    let boxH = totalLines + (sections.length - 1) + 2;
    entityBoxW.set(ent.id, boxW), entityBoxH.set(ent.id, boxH);
  }
  let components = findConnectedComponents(diagram), placed = /* @__PURE__ */ new Map(), currentY = 0;
  for (let component of components) {
    let componentEntities = diagram.entities.filter((e) => component.has(e.id)), maxPerRow = Math.max(2, Math.ceil(Math.sqrt(componentEntities.length))), currentX = 0, maxRowH = 0, colCount = 0, componentStartY = currentY;
    for (let ent of componentEntities) {
      let w = entityBoxW.get(ent.id), h = entityBoxH.get(ent.id);
      colCount >= maxPerRow && (currentY += maxRowH + vGap, currentX = 0, maxRowH = 0, colCount = 0), placed.set(ent.id, {
        entity: ent,
        sections: entitySections.get(ent.id),
        x: currentX,
        y: currentY,
        width: w,
        height: h
      }), currentX += w + hGap, maxRowH = Math.max(maxRowH, h), colCount++;
    }
    currentY += maxRowH + componentGap;
  }
  let totalW = 0, totalH = 0;
  for (let p of placed.values())
    totalW = Math.max(totalW, p.x + p.width), totalH = Math.max(totalH, p.y + p.height);
  totalW += 4, totalH += 2;
  let canvas2 = mkCanvas(totalW - 1, totalH - 1), rc = mkRoleCanvas(totalW - 1, totalH - 1);
  function setC(x, y, ch, role) {
    x >= 0 && x < canvas2.length && y >= 0 && y < (canvas2[0]?.length ?? 0) && (canvas2[x][y] = ch, setRole(rc, x, y, role));
  }
  for (let p of placed.values()) {
    let boxCanvas = drawMultiBox(p.sections, useAscii);
    for (let bx = 0; bx < boxCanvas.length; bx++)
      for (let by = 0; by < boxCanvas[0].length; by++) {
        let ch = boxCanvas[bx][by];
        if (ch !== " ") {
          let cx = p.x + bx, cy = p.y + by;
          cx < totalW && cy < totalH && setC(cx, cy, ch, classifyBoxChar2(ch));
        }
      }
  }
  let H = useAscii ? "-" : "\u2500", V = useAscii ? "|" : "\u2502", dashH = useAscii ? "." : "\u254C", dashV = useAscii ? ":" : "\u250A";
  for (let rel of diagram.relationships) {
    let e1 = placed.get(rel.entity1), e2 = placed.get(rel.entity2);
    if (!e1 || !e2) continue;
    let lineH = rel.identifying ? H : dashH, lineV = rel.identifying ? V : dashV, e1CX = e1.x + Math.floor(e1.width / 2), e1CY = e1.y + Math.floor(e1.height / 2), e2CX = e2.x + Math.floor(e2.width / 2), e2CY = e2.y + Math.floor(e2.height / 2);
    if (Math.abs(e1CY - e2CY) < Math.max(e1.height, e2.height)) {
      let [left, right] = e1CX < e2CX ? [e1, e2] : [e2, e1], [leftCard, rightCard] = e1CX < e2CX ? [rel.cardinality1, rel.cardinality2] : [rel.cardinality2, rel.cardinality1], startX = left.x + left.width, endX = right.x - 1, lineY = left.y + Math.floor(left.height / 2);
      for (let x = startX; x <= endX; x++)
        setC(x, lineY, lineH, "line");
      let leftChars = getCrowsFootChars(leftCard, useAscii, false);
      for (let i = 0; i < leftChars.length; i++)
        setC(startX + i, lineY, leftChars[i], "arrow");
      let rightChars = getCrowsFootChars(rightCard, useAscii, true);
      for (let i = 0; i < rightChars.length; i++)
        setC(endX - rightChars.length + 1 + i, lineY, rightChars[i], "arrow");
      if (rel.label) {
        let lines2 = splitLines(rel.label), gapMid = Math.floor((startX + endX) / 2);
        for (let lineIdx = 0; lineIdx < lines2.length; lineIdx++) {
          let line2 = lines2[lineIdx], labelStart = Math.max(startX, gapMid - Math.floor(line2.length / 2)), labelY = lineY + 1 + lineIdx;
          increaseSize(canvas2, Math.max(labelStart + line2.length, 1), Math.max(labelY + 1, 1)), increaseRoleCanvasSize(rc, Math.max(labelStart + line2.length, 1), Math.max(labelY + 1, 1));
          for (let i = 0; i < line2.length; i++) {
            let lx = labelStart + i;
            lx >= startX && lx <= endX && setC(lx, labelY, line2[i], "text");
          }
        }
      }
    } else {
      let [upper, lower] = e1CY < e2CY ? [e1, e2] : [e2, e1], [upperCard, lowerCard] = e1CY < e2CY ? [rel.cardinality1, rel.cardinality2] : [rel.cardinality2, rel.cardinality1], startY = upper.y + upper.height, endY = lower.y - 1, lineX = upper.x + Math.floor(upper.width / 2);
      for (let y = startY; y <= endY; y++)
        setC(lineX, y, lineV, "line");
      let lowerCX = lower.x + Math.floor(lower.width / 2);
      if (lineX !== lowerCX) {
        let midY = Math.floor((startY + endY) / 2), lx = Math.min(lineX, lowerCX), rx = Math.max(lineX, lowerCX);
        for (let x = lx; x <= rx; x++)
          setC(x, midY, lineH, "line");
        for (let y = midY + 1; y <= endY; y++)
          setC(lowerCX, y, lineV, "line");
      }
      let upperChars = getCrowsFootChars(upperCard, useAscii, false);
      for (let i = 0; i < upperChars.length; i++)
        setC(lineX - Math.floor(upperChars.length / 2) + i, startY, upperChars[i], "arrow");
      let targetX = lineX !== lowerCX ? lowerCX : lineX, lowerChars = getCrowsFootChars(lowerCard, useAscii, true);
      for (let i = 0; i < lowerChars.length; i++)
        setC(targetX - Math.floor(lowerChars.length / 2) + i, endY, lowerChars[i], "arrow");
      if (rel.label) {
        let lines2 = splitLines(rel.label), startLabelY = Math.floor((startY + endY) / 2) - Math.floor((lines2.length - 1) / 2);
        for (let lineIdx = 0; lineIdx < lines2.length; lineIdx++) {
          let line2 = lines2[lineIdx], labelX = lineX + 2, y = startLabelY + lineIdx;
          if (y >= 0)
            for (let i = 0; i < line2.length; i++) {
              let lx = labelX + i;
              lx >= 0 && (increaseSize(canvas2, lx + 1, y + 1), increaseRoleCanvasSize(rc, lx + 1, y + 1), setC(lx, y, line2[i], "text"));
            }
        }
      }
    }
  }
  return canvasToString(canvas2, { roleCanvas: rc, colorMode, theme });
}
function parseXYChart(lines) {
  let xAxis = {}, yAxis = {}, series = [], title, horizontal = false;
  for (let line2 of lines) {
    if (/^xychart(-beta)?\b/i.test(line2)) {
      /\bhorizontal\b/i.test(line2) && (horizontal = true);
      continue;
    }
    let titleMatch = line2.match(/^title\s+"([^"]+)"/);
    if (titleMatch) {
      title = titleMatch[1];
      continue;
    }
    let xCatMatch = line2.match(/^x-axis\s+(?:"([^"]*)"\s*)?\[([^\]]+)\]/);
    if (xCatMatch) {
      xCatMatch[1] && (xAxis.title = xCatMatch[1]), xAxis.categories = xCatMatch[2].split(",").map((s) => s.trim());
      continue;
    }
    let xRangeMatch = line2.match(/^x-axis\s+(?:"([^"]*)"\s+)?(-?\d+(?:\.\d+)?)\s*-->\s*(-?\d+(?:\.\d+)?)/);
    if (xRangeMatch) {
      xRangeMatch[1] && (xAxis.title = xRangeMatch[1]), xAxis.range = { min: parseFloat(xRangeMatch[2]), max: parseFloat(xRangeMatch[3]) };
      continue;
    }
    let yRangeMatch = line2.match(/^y-axis\s+(?:"([^"]*)"\s+)?(-?\d+(?:\.\d+)?)\s*-->\s*(-?\d+(?:\.\d+)?)/);
    if (yRangeMatch) {
      yRangeMatch[1] && (yAxis.title = yRangeMatch[1]), yAxis.range = { min: parseFloat(yRangeMatch[2]), max: parseFloat(yRangeMatch[3]) };
      continue;
    }
    let yTitleOnly = line2.match(/^y-axis\s+"([^"]+)"\s*$/);
    if (yTitleOnly) {
      yAxis.title = yTitleOnly[1];
      continue;
    }
    let barMatch = line2.match(/^bar\s+(?:"([^"]*)"\s*|([^\s"[]+)\s+)?\[([^\]]+)\]/);
    if (barMatch) {
      series.push({ type: "bar", name: barMatch[1] ?? barMatch[2], data: parseNumericArray(barMatch[3]) });
      continue;
    }
    let lineMatch = line2.match(/^line\s+(?:"([^"]*)"\s*|([^\s"[]+)\s+)?\[([^\]]+)\]/);
    if (lineMatch) {
      series.push({ type: "line", name: lineMatch[1] ?? lineMatch[2], data: parseNumericArray(lineMatch[3]) });
      continue;
    }
  }
  if (!yAxis.range && series.length > 0) {
    let allValues = series.flatMap((s) => s.data), min = Math.min(...allValues), max = Math.max(...allValues), span = max - min || 1;
    min = min - span * 0.1, max = max + span * 0.1, min > 0 && min < span * 0.5 && (min = 0), yAxis.range = { min, max };
  }
  return yAxis.range || (yAxis.range = { min: 0, max: 100 }), { title, horizontal, xAxis, yAxis, series };
}
function parseNumericArray(str) {
  return str.split(",").map((s) => parseFloat(s.trim()));
}
var CHART_ACCENT_FALLBACK = "#3b82f6";
function hexToHsl(hex2) {
  let h = hex2.replace("#", ""), ri = parseInt(h.substring(0, 2), 16) / 255, gi = parseInt(h.substring(2, 4), 16) / 255, bi = parseInt(h.substring(4, 6), 16) / 255, max = Math.max(ri, gi, bi), min = Math.min(ri, gi, bi), l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  let d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min), hue;
  return max === ri ? hue = ((gi - bi) / d + (gi < bi ? 6 : 0)) / 6 : max === gi ? hue = ((bi - ri) / d + 2) / 6 : hue = ((ri - gi) / d + 4) / 6, [hue * 360, s * 100, l * 100];
}
function hslToHex(h, s, l) {
  let si = s / 100, li = l / 100, c = (1 - Math.abs(2 * li - 1)) * si, x = c * (1 - Math.abs(h / 60 % 2 - 1)), m = li - c / 2, r, g, b;
  h < 60 ? (r = c, g = x, b = 0) : h < 120 ? (r = x, g = c, b = 0) : h < 180 ? (r = 0, g = c, b = x) : h < 240 ? (r = 0, g = x, b = c) : h < 300 ? (r = x, g = 0, b = c) : (r = c, g = 0, b = x);
  let toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function isValidHex(color) {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}
function isDarkBackground(bgHex) {
  return hexToHsl(bgHex)[2] < 50;
}
function getSeriesColor(index, accentColor, bgColor) {
  if (index === 0) return accentColor;
  let safeAccent = isValidHex(accentColor) ? accentColor : CHART_ACCENT_FALLBACK, safeBg = bgColor && isValidHex(bgColor) ? bgColor : void 0, [h, s] = hexToHsl(safeAccent), chartS = Math.max(55, Math.min(85, s)), tier = Math.ceil(index / 2), oddIndex = index % 2 === 1, dark = safeBg && isDarkBackground(safeBg) ? !oddIndex : oddIndex, l = dark ? Math.max(25, 48 - tier * 13) : Math.min(78, 55 + tier * 11), hShift = (dark ? -8 : 12) * tier, newH = ((h + hShift) % 360 + 360) % 360;
  return hslToHex(newH, chartS, l);
}
var PLOT_WIDTH = 60;
var PLOT_HEIGHT = 20;
var UNI = {
  hLine: "\u2500",
  vLine: "\u2502",
  origin: "\u253C",
  yTick: "\u2524",
  xTick: "\u252C",
  bar: "\u2588",
  grid: "\xB7",
  cornerTL: "\u256D",
  // top-left: down+right
  cornerTR: "\u256E",
  // top-right: down+left
  cornerBL: "\u2570",
  // bottom-left: up+right
  cornerBR: "\u256F"
  // bottom-right: up+left
};
var ASC = {
  hLine: "-",
  vLine: "|",
  origin: "+",
  yTick: "+",
  xTick: "+",
  bar: "#",
  grid: ".",
  cornerTL: "+",
  cornerTR: "+",
  cornerBL: "+",
  cornerBR: "+"
};
function getSeriesColors(total, theme) {
  let accent = theme.accent ?? CHART_ACCENT_FALLBACK;
  return total <= 1 ? [accent] : Array.from({ length: total }, (_, i) => getSeriesColor(i, accent, theme.bg));
}
function roleToHex(role, theme) {
  switch (role) {
    case "text":
      return theme.fg;
    case "border":
      return theme.border;
    case "line":
      return theme.line;
    case "arrow":
      return theme.arrow;
    case "corner":
      return theme.corner ?? theme.line;
    case "junction":
      return theme.junction ?? theme.border;
    default:
      return theme.fg;
  }
}
function renderXYChartAscii(text, config, colorMode, theme) {
  let lines = text.split(`
`).map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith("%%")), chart = parseXYChart(lines), ch = config.useAscii ? ASC : UNI;
  return chart.horizontal ? renderHorizontal(chart, ch, colorMode, theme) : renderVertical(chart, ch, colorMode, theme);
}
function renderVertical(chart, ch, colorMode, theme) {
  let dataCount = getDataCount(chart);
  if (dataCount === 0) return "";
  let yRange = chart.yAxis.range, rawTicks = niceTickValues(yRange.min, yRange.max), step = rawTicks.length > 1 ? rawTicks[1] - rawTicks[0] : Math.abs(yRange.max - yRange.min) || 1, lo = Math.floor(yRange.min / step + 1e-9) * step, hi = Math.max(lo + step, Math.ceil(yRange.max / step - 1e-9) * step), intervals = Math.round((hi - lo) / step), yTicks = Array.from({ length: intervals + 1 }, (_, i) => Math.round((lo + i * step) * 1e10) / 1e10), yLabels = yTicks.map((v) => formatTickValue(v)), yGutter = Math.max(...yLabels.map((l) => l.length)) + 1, plotW = Math.max(PLOT_WIDTH, dataCount * 6), perTick = Math.max(1, Math.round(PLOT_HEIGHT / intervals)), plotH = intervals * perTick, unit = step / perTick, level2 = (v) => (v - lo) / unit, base = level2(Math.min(Math.max(0, lo), hi)), zero = Math.round(base) - 1, bandW = Math.floor(plotW / dataCount), catLabels = getCategoryLabels(chart, dataCount), hasTitle = !!chart.title, hasXTitle = !!chart.xAxis.title, hasLegend = chart.series.length > 1, titleRow = hasTitle ? 0 : -1, plotTop = (hasTitle ? 2 : 0) + (hasLegend ? 1 : 0), plotLeft = yGutter + 1, totalW = plotLeft + bandW * dataCount + 2, xAxisRow = plotTop + plotH, xLabelRow = xAxisRow + 1, xTitleRow = hasXTitle ? xLabelRow + 1 : -1, totalH = xLabelRow + 1 + (hasXTitle ? 1 : 0) + 0, canvas2 = createCanvas(totalW, totalH), roles = createRoleCanvas(totalW, totalH), hexColors = createHexCanvas(totalW, totalH), seriesColors = getSeriesColors(chart.series.length, theme), valueToRow = (v) => Math.min(plotH - 1, Math.max(-1, Math.round(level2(v)) - 1)), bandCenter = (i) => plotLeft + Math.floor(bandW * (i + 0.5));
  hasTitle && titleRow >= 0 && writeText(canvas2, roles, titleRow, Math.floor(totalW / 2 - chart.title.length / 2), chart.title, "text"), hasLegend && drawLegend(canvas2, roles, hexColors, chart, hasTitle ? 1 : 0, totalW, ch, seriesColors);
  for (let row = 0; row < plotH; row++) {
    let displayRow = plotTop + (plotH - 1 - row);
    set(canvas2, roles, displayRow, plotLeft - 1, ch.vLine, "border");
  }
  set(canvas2, roles, xAxisRow, plotLeft - 1, ch.origin, "border");
  for (let tick of yTicks) {
    let row = Math.round(level2(tick)) - 1;
    if (row < -1 || row >= plotH) continue;
    let displayRow = plotTop + (plotH - 1 - row), label = formatTickValue(tick);
    set(canvas2, roles, displayRow, plotLeft - 1, row === -1 || row === zero ? ch.origin : ch.yTick, "border");
    let labelStart = yGutter - label.length;
    writeText(canvas2, roles, displayRow, Math.max(0, labelStart), label, "text");
  }
  for (let c = plotLeft; c < plotLeft + bandW * dataCount; c++)
    set(canvas2, roles, xAxisRow, c, ch.hLine, "border");
  for (let i = 0; i < dataCount; i++) {
    let cx = bandCenter(i);
    set(canvas2, roles, xAxisRow, cx, ch.xTick, "border");
    let label = catLabels[i], labelStart = cx - Math.floor(label.length / 2);
    writeText(canvas2, roles, xLabelRow, Math.max(0, labelStart), label, "text");
  }
  if (hasXTitle && xTitleRow >= 0) {
    let title = chart.xAxis.title;
    writeText(canvas2, roles, xTitleRow, Math.floor(totalW / 2 - title.length / 2), title, "text");
  }
  for (let tick of yTicks) {
    let row = Math.round(level2(tick)) - 1;
    if (row < 0 || row >= plotH) continue;
    let displayRow = plotTop + (plotH - 1 - row);
    for (let c = plotLeft; c < plotLeft + bandW * dataCount; c++)
      get(canvas2, displayRow, c) === " " && set(canvas2, roles, displayRow, c, row === zero ? ch.hLine : ch.grid, row === zero ? "border" : "line");
  }
  let barEntries = [];
  for (let si = 0; si < chart.series.length; si++)
    chart.series[si].type === "bar" && barEntries.push({ data: chart.series[si].data, globalIdx: si });
  if (barEntries.length > 0) {
    let barCount = barEntries.length, usable = Math.max(1, bandW - 2), singleBarW = Math.max(1, Math.min(Math.floor(usable / barCount), 8)), groupW = singleBarW * barCount + (barCount - 1);
    for (let bIdx = 0; bIdx < barEntries.length; bIdx++) {
      let entry = barEntries[bIdx], hexColor = seriesColors[entry.globalIdx];
      for (let i = 0; i < entry.data.length; i++) {
        let bx = bandCenter(i) - Math.floor(groupW / 2) + bIdx * (singleBarW + 1), exact = level2(entry.data[i]), value = exact < base ? Math.ceil(exact * 2 - 1e-9) / 2 : Math.floor(exact * 2 + 1e-9) / 2, from = Math.max(0, Math.min(base, value)), to = Math.min(plotH, Math.max(base, value));
        for (let row = -1; row < plotH; row++) {
          let low = from <= row + 0.5 + 1e-9 && to >= row + 1 - 1e-9, high = from <= row + 1 + 1e-9 && to >= row + 1.5 - 1e-9, glyph = ch === ASC ? (value < base ? high : low) && ch.bar : low && high ? ch.bar : low ? "\u2584" : high && "\u2580";
          if (!glyph) continue;
          let displayRow = plotTop + (plotH - 1 - row);
          for (let c = bx; c < bx + singleBarW; c++)
            set(canvas2, roles, displayRow, c, glyph, "arrow", hexColors, hexColor);
        }
      }
    }
  }
  let lineEntries = [];
  for (let si = 0; si < chart.series.length; si++)
    chart.series[si].type === "line" && lineEntries.push({ data: chart.series[si].data, globalIdx: si });
  for (let entry of lineEntries) {
    if (entry.data.length === 0) continue;
    let hexColor = seriesColors[entry.globalIdx];
    drawStaircaseLine(canvas2, roles, entry.data, bandCenter, valueToRow, plotTop, plotH, plotLeft, bandW * dataCount, ch, hexColors, hexColor);
  }
  return canvasToString2(canvas2, roles, hexColors, colorMode, theme);
}
function renderHorizontal(chart, ch, colorMode, theme) {
  let dataCount = getDataCount(chart);
  if (dataCount === 0) return "";
  let yRange = chart.yAxis.range, valueTicks = niceTickValues(yRange.min, yRange.max), catLabels = getCategoryLabels(chart, dataCount), catGutter = Math.max(...catLabels.map((l) => l.length)) + 1, plotW = Math.max(PLOT_WIDTH, 40), bandH = Math.max(2, Math.floor(PLOT_HEIGHT / dataCount)), plotH = bandH * dataCount, hasTitle = !!chart.title, hasYTitle = !!chart.yAxis.title, hasLegend = chart.series.length > 1, plotTop = (hasTitle ? 2 : 0) + (hasLegend ? 1 : 0), plotLeft = catGutter + 1, totalW = plotLeft + plotW + 2, totalH = plotTop + plotH + 2 + (hasYTitle ? 1 : 0), xAxisRow = plotTop + plotH, canvas2 = createCanvas(totalW, totalH), roles = createRoleCanvas(totalW, totalH), hexColors = createHexCanvas(totalW, totalH), seriesColors = getSeriesColors(chart.series.length, theme), valueToCol = (v) => {
    let t = (v - yRange.min) / (yRange.max - yRange.min || 1);
    return plotLeft + Math.round(t * (plotW - 1));
  }, bandMid = (i) => plotTop + Math.floor(bandH * (i + 0.5));
  hasTitle && writeText(canvas2, roles, 0, Math.floor(totalW / 2 - chart.title.length / 2), chart.title, "text"), hasLegend && drawLegend(canvas2, roles, hexColors, chart, hasTitle ? 1 : 0, totalW, ch, seriesColors);
  for (let r = plotTop; r < plotTop + plotH; r++)
    set(canvas2, roles, r, plotLeft - 1, ch.vLine, "border");
  set(canvas2, roles, xAxisRow, plotLeft - 1, ch.origin, "border");
  for (let i = 0; i < dataCount; i++) {
    let my = bandMid(i), label = catLabels[i], labelStart = catGutter - label.length;
    writeText(canvas2, roles, my, Math.max(0, labelStart), label, "text");
  }
  for (let c = plotLeft; c < plotLeft + plotW; c++)
    set(canvas2, roles, xAxisRow, c, ch.hLine, "border");
  for (let tick of valueTicks) {
    let cx = valueToCol(tick);
    if (cx < plotLeft || cx >= plotLeft + plotW) continue;
    set(canvas2, roles, xAxisRow, cx, ch.xTick, "border");
    let label = formatTickValue(tick);
    writeText(canvas2, roles, xAxisRow + 1, cx - Math.floor(label.length / 2), label, "text");
  }
  if (hasYTitle) {
    let title = chart.yAxis.title;
    writeText(canvas2, roles, totalH - 1, Math.floor(totalW / 2 - title.length / 2), title, "text");
  }
  for (let tick of valueTicks) {
    let cx = valueToCol(tick);
    if (!(cx < plotLeft || cx >= plotLeft + plotW))
      for (let r = plotTop; r < plotTop + plotH; r++)
        get(canvas2, r, cx) === " " && set(canvas2, roles, r, cx, ch.grid, "line");
  }
  let barEntries = [];
  for (let si = 0; si < chart.series.length; si++)
    chart.series[si].type === "bar" && barEntries.push({ data: chart.series[si].data, globalIdx: si });
  if (barEntries.length > 0) {
    let barCount = barEntries.length, singleBarH = 1, groupH = singleBarH * barCount + (barCount - 1), baseCol = valueToCol(Math.max(0, yRange.min));
    for (let bIdx = 0; bIdx < barEntries.length; bIdx++) {
      let entry = barEntries[bIdx], hexColor = seriesColors[entry.globalIdx];
      for (let i = 0; i < entry.data.length; i++) {
        let by = bandMid(i) - Math.floor(groupH / 2) + bIdx * (singleBarH + 1), valCol = valueToCol(entry.data[i]), fromCol = Math.min(baseCol, valCol), toCol = Math.max(baseCol, valCol);
        for (let r = by; r < by + singleBarH; r++)
          for (let c = fromCol; c <= toCol; c++)
            set(canvas2, roles, r, c, ch.bar, "arrow", hexColors, hexColor);
      }
    }
  }
  let lineEntries = [];
  for (let si = 0; si < chart.series.length; si++)
    chart.series[si].type === "line" && lineEntries.push({ data: chart.series[si].data, globalIdx: si });
  for (let entry of lineEntries) {
    if (entry.data.length === 0) continue;
    let hexColor = seriesColors[entry.globalIdx];
    drawHorizontalStaircaseLine(canvas2, roles, entry.data, bandMid, valueToCol, plotTop, plotH, plotLeft, plotW, ch, hexColors, hexColor);
  }
  return canvasToString2(canvas2, roles, hexColors, colorMode, theme);
}
function drawStaircaseLine(canvas2, roles, data, bandCenter, valueToRow, plotTop, plotH, plotLeft, plotTotalW, ch, hexCanvas, hexColor) {
  if (data.length === 0) return;
  let points = data.map((v, i) => ({
    col: bandCenter(i),
    row: valueToRow(v)
  })), drawAt = (col, row, char) => {
    let displayRow = plotTop + (plotH - 1 - row);
    displayRow >= 0 && col >= plotLeft && col < plotLeft + plotTotalW && ![ch.bar, "\u2580", "\u2584"].includes(get(canvas2, displayRow, col)) && set(canvas2, roles, displayRow, col, char, "arrow", hexCanvas, hexColor);
  };
  if (points.length === 1) {
    drawAt(points[0].col, points[0].row, ch.hLine);
    return;
  }
  for (let i = 0; i < points.length - 1; i++) {
    let p1 = points[i], p2 = points[i + 1];
    if (p1.row === p2.row) {
      for (let c = p1.col; c <= p2.col; c++)
        drawAt(c, p1.row, ch.hLine);
      continue;
    }
    let midCol = Math.round((p1.col + p2.col) / 2), goingUp = p2.row > p1.row;
    for (let c = p1.col; c < midCol; c++)
      drawAt(c, p1.row, ch.hLine);
    goingUp ? drawAt(midCol, p1.row, ch.cornerBR) : drawAt(midCol, p1.row, ch.cornerTR);
    let minRow = Math.min(p1.row, p2.row), maxRow = Math.max(p1.row, p2.row);
    for (let row = minRow + 1; row < maxRow; row++)
      drawAt(midCol, row, ch.vLine);
    goingUp ? drawAt(midCol, p2.row, ch.cornerTL) : drawAt(midCol, p2.row, ch.cornerBL);
    for (let c = midCol + 1; c <= p2.col; c++)
      drawAt(c, p2.row, ch.hLine);
    if (i === 0) {
      let leadStart = Math.max(plotLeft, p1.col - Math.floor((p2.col - p1.col) / 4));
      for (let c = leadStart; c < p1.col; c++)
        drawAt(c, p1.row, ch.hLine);
    }
    if (i === points.length - 2) {
      let trailEnd = Math.min(plotLeft + plotTotalW - 1, p2.col + Math.floor((p2.col - p1.col) / 4));
      for (let c = p2.col + 1; c <= trailEnd; c++)
        drawAt(c, p2.row, ch.hLine);
    }
  }
}
function drawHorizontalStaircaseLine(canvas2, roles, data, bandMid, valueToCol, plotTop, plotH, plotLeft, plotW, ch, hexCanvas, hexColor) {
  if (data.length === 0) return;
  let points = data.map((v, i) => ({
    row: bandMid(i),
    col: valueToCol(v)
  })), drawAt = (row, col, char) => {
    row >= plotTop && row < plotTop + plotH && col >= plotLeft && col < plotLeft + plotW && set(canvas2, roles, row, col, char, "arrow", hexCanvas, hexColor);
  };
  if (points.length === 1) {
    drawAt(points[0].row, points[0].col, ch.vLine);
    return;
  }
  for (let i = 0; i < points.length - 1; i++) {
    let p1 = points[i], p2 = points[i + 1];
    if (p1.col === p2.col) {
      for (let r = p1.row; r <= p2.row; r++)
        drawAt(r, p1.col, ch.vLine);
      continue;
    }
    let midRow = Math.round((p1.row + p2.row) / 2), goingRight = p2.col > p1.col;
    for (let r = p1.row; r < midRow; r++)
      drawAt(r, p1.col, ch.vLine);
    goingRight ? drawAt(midRow, p1.col, ch.cornerBL) : drawAt(midRow, p1.col, ch.cornerBR);
    let minCol = Math.min(p1.col, p2.col), maxCol = Math.max(p1.col, p2.col);
    for (let c = minCol + 1; c < maxCol; c++)
      drawAt(midRow, c, ch.hLine);
    goingRight ? drawAt(midRow, p2.col, ch.cornerTR) : drawAt(midRow, p2.col, ch.cornerTL);
    for (let r = midRow + 1; r <= p2.row; r++)
      drawAt(r, p2.col, ch.vLine);
  }
}
function drawLegend(canvas2, roles, hexCanvas, chart, row, totalW, ch, seriesColors) {
  let items = [], barIdx = 0, lineIdx = 0;
  for (let si = 0; si < chart.series.length; si++) {
    let s = chart.series[si];
    s.type === "bar" ? (items.push({ symbol: ch.bar, label: s.name || `Bar ${barIdx + 1}`, globalIdx: si }), barIdx++) : (items.push({ symbol: ch.hLine, label: s.name || `Line ${lineIdx + 1}`, globalIdx: si }), lineIdx++);
  }
  let totalLen = 0;
  for (let i = 0; i < items.length; i++)
    i > 0 && (totalLen += 2), totalLen += 2 + items[i].label.length;
  let col = Math.max(0, Math.floor(totalW / 2 - totalLen / 2));
  for (let i = 0; i < items.length; i++) {
    i > 0 && (col += 2);
    let item = items[i];
    set(canvas2, roles, row, col, item.symbol, "arrow", hexCanvas, seriesColors[item.globalIdx]), col += 1, col += 1, writeText(canvas2, roles, row, col, item.label, "text"), col += item.label.length;
  }
}
function createCanvas(width2, height) {
  return Array.from({ length: width2 }, () => Array.from({ length: height }, () => " "));
}
function createRoleCanvas(width2, height) {
  return Array.from({ length: width2 }, () => Array.from({ length: height }).fill(null));
}
function createHexCanvas(width2, height) {
  return Array.from({ length: width2 }, () => Array.from({ length: height }).fill(null));
}
function set(canvas2, roles, row, col, char, role, hexCanvas, hex2) {
  col >= 0 && col < canvas2.length && row >= 0 && row < canvas2[0].length && (canvas2[col][row] = char, roles[col][row] = role, hexCanvas && hex2 && (hexCanvas[col][row] = hex2));
}
function get(canvas2, row, col) {
  return col >= 0 && col < canvas2.length && row >= 0 && row < canvas2[0].length ? canvas2[col][row] : " ";
}
function writeText(canvas2, roles, row, startCol, text, role) {
  for (let i = 0; i < text.length; i++)
    set(canvas2, roles, row, startCol + i, text[i], role);
}
function canvasToString2(canvas2, roles, hexCanvas, colorMode, theme) {
  if (canvas2.length === 0) return "";
  let height = canvas2[0].length, width2 = canvas2.length, lines = [];
  for (let row = 0; row < height; row++) {
    let chars = [], rowRoles = [], rowHex = [];
    for (let col = 0; col < width2; col++)
      chars.push(canvas2[col][row]), rowRoles.push(roles[col][row]), rowHex.push(hexCanvas[col][row]);
    let end = chars.length - 1;
    for (; end >= 0 && chars[end] === " "; ) end--;
    end < 0 ? lines.push("") : lines.push(colorizeRow(
      chars.slice(0, end + 1),
      rowRoles.slice(0, end + 1),
      rowHex.slice(0, end + 1),
      theme,
      colorMode
    ));
  }
  for (; lines.length > 0 && lines[lines.length - 1] === ""; )
    lines.pop();
  return lines.join(`
`);
}
function colorizeRow(chars, roles, hexOverrides, theme, mode) {
  if (mode === "none") return chars.join("");
  let result = "", currentColor = null, buffer = "";
  for (let i = 0; i < chars.length; i++) {
    let char = chars[i];
    if (char === " ") {
      buffer.length > 0 && (result += currentColor ? colorizeText(buffer, currentColor, mode) : buffer, buffer = "", currentColor = null), result += " ";
      continue;
    }
    let hexOvr = hexOverrides[i] ?? null, roleVal = roles[i] ?? null, color = hexOvr ?? (roleVal ? roleToHex(roleVal, theme) : null);
    color === currentColor ? buffer += char : (buffer.length > 0 && (result += currentColor ? colorizeText(buffer, currentColor, mode) : buffer), buffer = char, currentColor = color);
  }
  return buffer.length > 0 && (result += currentColor ? colorizeText(buffer, currentColor, mode) : buffer), result;
}
function getDataCount(chart) {
  if (chart.xAxis.categories) return chart.xAxis.categories.length;
  for (let s of chart.series)
    if (s.data.length > 0) return s.data.length;
  return 0;
}
function getCategoryLabels(chart, count) {
  if (chart.xAxis.categories) return chart.xAxis.categories;
  if (chart.xAxis.range) {
    let { min, max } = chart.xAxis.range, step = count > 1 ? (max - min) / (count - 1) : 0;
    return Array.from({ length: count }, (_, i) => formatTickValue(min + step * i));
  }
  return Array.from({ length: count }, (_, i) => String(i + 1));
}
function niceTickValues(min, max) {
  let range = max - min;
  if (range <= 0) return [min];
  let rawInterval = range / 6, magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval))), residual = rawInterval / magnitude, niceInterval;
  residual <= 1.5 ? niceInterval = magnitude : residual <= 3 ? niceInterval = 2 * magnitude : residual <= 7 ? niceInterval = 5 * magnitude : niceInterval = 10 * magnitude;
  let start = Math.ceil(min / niceInterval) * niceInterval, ticks = [];
  for (let v = start; v <= max + niceInterval * 1e-3; v += niceInterval)
    ticks.push(Math.round(v * 1e10) / 1e10);
  return ticks;
}
function formatTickValue(v) {
  return Number.isInteger(v) ? String(v) : v.toFixed(Math.abs(v) < 10 ? 1 : 0);
}
var setChartSize = (width2, height) => {
  PLOT_WIDTH = width2, PLOT_HEIGHT = height;
};
function detectDiagramType(text) {
  let firstLine = text.trim().split(`
`)[0]?.trim().toLowerCase() ?? "";
  return /^xychart(-beta)?\b/.test(firstLine) ? "xychart" : /^sequencediagram\s*$/.test(firstLine) ? "sequence" : /^classdiagram\s*$/.test(firstLine) ? "class" : /^erdiagram\s*$/.test(firstLine) ? "er" : "flowchart";
}
function renderMermaidASCII(text, options = {}) {
  let config = {
    useAscii: options.useAscii ?? false,
    paddingX: options.paddingX ?? 5,
    paddingY: options.paddingY ?? 5,
    boxBorderPadding: options.boxBorderPadding ?? 1,
    graphDirection: "TD"
    // default, overridden for flowcharts below
  }, colorMode = options.colorMode === "auto" || options.colorMode === void 0 ? detectColorMode() : options.colorMode, theme = { ...DEFAULT_ASCII_THEME, ...options.theme };
  switch (detectDiagramType(text)) {
    case "xychart":
      return renderXYChartAscii(text, config, colorMode, theme);
    case "sequence":
      return renderSequenceAscii(text, config, colorMode, theme);
    case "class":
      return renderClassAscii(text, config, colorMode, theme);
    case "er":
      return renderErAscii(text, config, colorMode, theme);
    default: {
      let parsed = parseMermaid(text);
      parsed.direction === "LR" || parsed.direction === "RL" ? config.graphDirection = "LR" : config.graphDirection = "TD";
      let graph = convertToAsciiGraph(parsed, config);
      return createMapping(graph), drawGraph(graph), parsed.direction === "BT" && (flipCanvasVertically(graph.canvas), flipRoleCanvasVertically(graph.roleCanvas)), canvasToString(graph.canvas, {
        roleCanvas: graph.roleCanvas,
        colorMode,
        theme
      });
    }
  }
}
var renderMermaidAscii = renderMermaidASCII;

// ../plugin/hooks/mermaid.tsx
var MAX_LINES = 80;
var MAX_CHARS = 8e3;
var PAD = "\uFDD0";
var textCache = /* @__PURE__ */ new Map();
var chartSize = (columns, source = "") => {
  const labels2 = (/^\s*x-axis\b[^[\n]*\[([^\]\n]*)\]/m.exec(source)?.[1] ?? "").split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
  const fit4 = labels2.length * (Math.max(...labels2.map((l) => l.length)) + 2);
  const width2 = Math.max(24, Math.min(60, Math.max(Math.floor(columns / 6), fit4), columns - 12));
  return { width: width2, height: Math.max(8, Math.min(20, Math.round(width2 * 0.3))) };
};
var padWide = (source) => /^[\x00-\x7F]*$/.test(source) ? source : graphemes(source).map((g) => g.length === 1 && width(g) === 2 ? g + PAD : g).join("");
var unquoteCategories = (source) => source.replace(/^(\s*x-axis\b[^[\n]*\[)([^\]\n]*)\]/m, (_, head, items) => `${head}${items.replace(/"([^"]*)"/g, (_q, s) => s.replaceAll(",", " "))}]`);
var BLOCK = /[█▀▄]/;
var labelBars = (art2, source) => {
  const series = source.match(/^\s*(bar|line)\b.*$/gm) ?? [];
  const values = /^\s*bar\b[^[\n]*\[([^\]\n]*)\]/m.exec(source)?.[1]?.split(",").map((v) => v.trim());
  if (series.length !== 1 || !values || /^\s*xychart(-beta)?\s+horizontal/m.test(source)) return art2;
  const grid = ["", ...art2.split("\n")].map((l) => [...l]);
  const gutter = (r) => /^\s*(-?[\d.]+)[┤┼]/.exec(grid[r]?.join("") ?? "")?.[1];
  const axis = grid.findLastIndex((_, r) => gutter(r) !== void 0);
  const ticks = [...(grid[axis]?.join("") ?? "").matchAll(/┬|▀+/g)].map((m) => m.index + Math.floor(m[0].length / 2));
  if (ticks.length !== values.length) return art2;
  const zero = grid.findIndex((_, r) => gutter(r) === "0");
  const top = grid.findIndex((_, r) => gutter(r) !== void 0);
  const base = zero !== -1 ? zero : gutter(top)?.startsWith("-") ? top : axis;
  ticks.forEach((x, k) => {
    const filled = grid.flatMap((row2, r) => BLOCK.test(row2[x] ?? "") ? [r] : []);
    const y = Number(values[k]) < 0 ? (filled.at(-1) ?? base) + 1 : (filled[0] ?? base) - 1;
    const text = [...values[k]];
    const bar = grid[filled[0] ?? -1] ?? [];
    let [left, right] = [x, x];
    while (BLOCK.test(bar[left - 1] ?? "")) left--;
    while (BLOCK.test(bar[right + 1] ?? "")) right++;
    const from = left + Math.ceil((right - left + 1 - text.length) / 2);
    const row = y < axis ? grid[y] : void 0;
    if (!row) return;
    while (row.length < from + text.length) row.push(" ");
    if (!text.every((_, i) => /[ ·]/.test(row[from + i] ?? " "))) return;
    text.forEach((ch, i) => row[from + i] = ch);
  });
  return grid.map((row) => row.join("").trimEnd()).join("\n").replace(/^\n/, "");
};
var SIDEWAYS = /^(\s*(?:flowchart|graph)[ \t]+)(LR|RL)\b/;
var LABELED_EDGE = /\|[^|\n]+\||(?<![-.=])(?:--|==|-\.)[ \t]*[^-.=>\s]/;
var rowsBetween = (source) => /^\s*(?:flowchart|graph)\b/.test(source) && !SIDEWAYS.test(source) && LABELED_EDGE.test(source) ? 3 : 1;
var kindOf = (source) => source.replace(/^(\s*%%[^\n]*\n)+/, "").trim().split(/[\s:]/)[0] ?? "";
var OWN = {
  pie: pieText,
  gantt: (source, ascii, columns) => {
    const text = ganttText(source, ascii, columns);
    return text === null ? null : { text };
  },
  quadrantchart: quadrantText,
  mindmap: mindmapText,
  journey: journeyText,
  kanban: kanbanText,
  gitgraph: gitGraphText
};
var INLINE_TAG = /<\/?(?:b|i|u|s|em|strong|del|code|small|sub|sup|span|mark)\b[^<>\n]*>/gi;
var fitted = /* @__PURE__ */ new Map();
var artWidths = /* @__PURE__ */ new Map();
var artWidth = (art2) => remember(artWidths, art2, () => Math.max(...art2.split("\n").map(width)));
var mermaidArt = (source, ascii, columns, pieColors, aspect = 2) => remember(fitted, `${ascii}:${columns}:${pieColors}:${aspect}:${source}`, () => {
  source = source.replace(INLINE_TAG, "");
  if (source.length > MAX_CHARS || source.split("\n").length > MAX_LINES) return null;
  const own = OWN[kindOf(source).toLowerCase()];
  if (own) return own(labelEntities(source, false), ascii, columns, pieColors, aspect);
  const fits = (art3) => art3 === null || artWidth(art3) <= columns - 2;
  const wide = draw(source, ascii, columns);
  const art2 = fits(wide) ? wide : draw(source, ascii, columns, 1) ?? wide;
  const text = fits(art2) || !SIDEWAYS.test(source) ? art2 : draw(source.replace(SIDEWAYS, "$1TD"), ascii, columns) ?? art2;
  return text === null ? null : { text, series: chartSeries(source, ascii, columns) };
});
var MERMAID_ENTITY = /#(\d{1,7}|[A-Za-z][A-Za-z\d]{1,31});/g;
var SHIELD = '[]{}()|<>"';
var SHIELDED = /[\uf100-\uf109]/g;
var STYLE_LINE = /^\s*(?:style|classDef|linkStyle)\b/;
var shielded = (ch) => [...ch].map((c) => SHIELD.includes(c) ? String.fromCharCode(61696 + SHIELD.indexOf(c)) : c).join("");
var entityChar = (m, e, shield) => {
  const ch = decodeEntities(/^\d/.test(e) ? `&#${e};` : `&${e};`);
  if (ch === `&${e};` || ch.includes("\n")) return m;
  return shield ? shielded(ch) : ch;
};
var labelEntities = (source, shield) => !source.includes("#") ? source : source.split("\n").map((line2) => STYLE_LINE.test(line2) ? line2 : line2.replace(MERMAID_ENTITY, (m, e) => entityChar(m, e, shield))).join("\n");
var unshield = (text) => text.replace(SHIELDED, (c) => SHIELD[c.charCodeAt(0) - 61696]);
var prepared = (padded) => labelEntities(unquoteCategories(padded.replace(/^(\s*%%[^\n]*\n)+/, "")).replace(/(-->|-\.->|==>|---|-\.-|===)[ \t]+\|/g, "$1|"), true);
var NEUTRAL = "#808080";
var PROBE = { fg: NEUTRAL, border: NEUTRAL, line: NEUTRAL, arrow: NEUTRAL, corner: NEUTRAL, junction: NEUTRAL, accent: "#ff0000", bg: "#000000" };
var SGR = /\x1b\[([\d;]*)m/g;
var seriesOf = (colored) => {
  const hues = colored.split("\n").map((line2) => {
    const row = [];
    let hue;
    let at = 0;
    const take = (text) => graphemes(text).forEach(() => row.push(hue));
    for (const m of line2.matchAll(SGR)) {
      take(line2.slice(at, m.index));
      hue = m[1].startsWith("38;2;") && m[1] !== "38;2;128;128;128" ? m[1] : void 0;
      at = m.index + m[0].length;
    }
    take(line2.slice(at));
    return row;
  });
  const legend3 = hues.find((row) => row.some(Boolean)) ?? [];
  const order = [...new Set(legend3.filter((code) => code !== void 0))];
  return hues.map((row) => row.map((code) => code === void 0 ? -1 : order.indexOf(code)));
};
var seriesCache = /* @__PURE__ */ new Map();
var chartSeries = (source, ascii, columns) => {
  if (!/^\s*xychart/.test(source) || (source.match(/^\s*(bar|line)\b/gm) ?? []).length < 2) return void 0;
  const padded = padWide(source);
  const size = chartSize(columns, padded);
  return remember(seriesCache, `${ascii}:${size.width}:${source}`, () => {
    try {
      setChartSize(size.width, size.height);
      return seriesOf(renderMermaidAscii(prepared(padded), { useAscii: ascii, colorMode: "truecolor", theme: PROBE, paddingX: 3, paddingY: 1 }));
    } catch {
      return null;
    }
  }) ?? void 0;
};
var draw = (source, ascii, columns, gap = 3) => {
  const isChart = /^\s*xychart/.test(source);
  const padded = padWide(source);
  const size = chartSize(columns, isChart ? padded : "");
  const key = `${ascii}:${isChart ? size.width : 0}:${gap}:${source}`;
  return remember(textCache, key, () => {
    try {
      if (isChart) setChartSize(size.width, size.height);
      const art2 = renderMermaidAscii(prepared(padded), { useAscii: ascii, colorMode: "none", paddingX: gap, paddingY: rowsBetween(padded) }).replace(/[ \t]+$/gm, "").trimEnd().replace(/▶/g, "\u25BA").replace(/◀/g, "\u25C4");
      return unshield((isChart ? labelBars(art2, padded) : art2.split("\n").filter((l) => !/^[\s│|]*$/.test(l)).join("\n")).replaceAll(PAD, ""));
    } catch {
      return null;
    }
  });
};
var LINE = /[─-╿◇▏]/;
var ARROW = /[►◄▲▼]/;
var PART2 = /[▐▏▎▍▌▋▊▉]/;
var barStart = (row, c) => {
  const ch = row[c] ?? "";
  const solid = BLOCK.test(ch) ? ch : PART2.test(ch) && row[c + 1] === "\u2588" ? "\u2588" : PART2.test(ch) && row[c - 1] === "\u2588" ? "\u2588" : "";
  if (!solid) return -1;
  let start = BLOCK.test(ch) ? c : row[c + 1] === "\u2588" ? c + 1 : c - 1;
  while (row[start - 1] === solid) start--;
  return start;
};
var hueOf = (hex2) => {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex2.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const spread = max - Math.min(r, g, b);
  if (!max || spread / max < 0.25) return void 0;
  const sector = max === r ? (g - b) / spread : max === g ? 2 + (b - r) / spread : 4 + (r - g) / spread;
  return (sector * 60 + 360) % 360;
};
var clashes = (color, kept) => {
  const hue = hueOf(color);
  return hue !== void 0 && kept.some((other) => {
    const near = hueOf(other);
    return near !== void 0 && Math.min(Math.abs(hue - near), 360 - Math.abs(hue - near)) < 25;
  });
};
var distinctHues = (colors, reserve) => {
  const pool = [...reserve];
  return colors.reduce((kept, color) => {
    if (!clashes(color, kept)) return [...kept, color];
    const free = pool.findIndex((spare) => !clashes(spare, kept));
    return [...kept, free < 0 ? color : pool.splice(free, 1)[0]];
  }, []);
};
var diagramPalette = (t) => [.../* @__PURE__ */ new Set([t.link, t.number, t.heading, t.emphasis, t.path, t.codeFlag, t.accent])].filter((c) => c !== void 0);
var paint2 = (art2, t, series) => {
  const grid = art2.split("\n").map(cells);
  const cell = (r, c) => grid[r]?.[c] ?? "";
  const color = grid.map((row) => row.map(() => void 0));
  const palette = diagramPalette(t);
  const next = (i) => palette[i % palette.length];
  const labels2 = /* @__PURE__ */ new Map();
  const rects = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
      if (!/[┌╭(]/.test(cell(r, c))) continue;
      let c2 = c + 1;
      while (/[─┬┴┼▲▼]/.test(cell(r, c2))) c2++;
      if (!/[┐╮)]/.test(cell(r, c2)) || c2 === c + 1) continue;
      let r2 = r + 1;
      while (/[│├┤┼►◄]/.test(cell(r2, c))) r2++;
      if (!/[└╰(]/.test(cell(r2, c)) || !/[┘╯)]/.test(cell(r2, c2))) continue;
      rects.push({ r, c, r2, c2 });
    }
  }
  const inside = (a, b) => a !== b && b.r > a.r && b.r2 < a.r2 && b.c > a.c && b.c2 < a.c2;
  for (const box of rects.filter((a) => !rects.some((b) => inside(a, b)))) {
    const { r, c, r2, c2 } = box;
    const label = grid.slice(r + 1, r2).map((row) => row.slice(c + 1, c2).join("")).join(" ").trim();
    if (!labels2.has(label)) labels2.set(label, next(labels2.size));
    const hue = labels2.get(label);
    for (let y = r; y <= r2; y++) for (let x = c; x <= c2; x++) if (cell(y, x).trim()) color[y][x] = hue;
  }
  const bars = [...new Set(grid.flatMap((row) => row.flatMap((ch, c) => BLOCK.test(ch) && row[c - 1] !== ch ? [c] : [])))].sort((a, b) => a - b);
  const ends = bars.map((x) => {
    const row = grid.find((row2) => BLOCK.test(row2[x] ?? ""));
    let end = x;
    while (row[end + 1] === row[x]) end++;
    return end;
  });
  const tops = bars.map((x) => {
    const r = grid.findIndex((row) => BLOCK.test(row[x] ?? ""));
    return r * 2 + (grid[r][x] === "\u2584" ? 1 : 0);
  });
  const single = bars.length > 1 && bars.every((x, i) => i === 0 || x - ends[i - 1] > 2);
  const barColor = (i) => single ? tops[i] === Math.min(...tops) ? t.emphasis ?? t.accent : t.quote : next(i);
  series?.forEach((row, r) => row.forEach((owner, c) => owner >= 0 && grid[r]?.[c]?.trim() && (color[r][c] = next(owner))));
  grid.forEach(
    (row, r) => row.forEach((ch, c) => {
      if (color[r][c] !== void 0) return;
      const start = barStart(row, c);
      if (start >= 0) color[r][c] = barColor(bars.indexOf(start));
      else if (ch === "\xB7") color[r][c] = t.rule;
      else if (ARROW.test(ch)) color[r][c] = t.accent;
      else if (LINE.test(ch)) color[r][c] = t.diagram;
      else if (/^\d+[┤┼]/.test(row.slice(c).join(""))) color[r][c] = t.number;
      else color[r][c] = t.diagramText;
    })
  );
  return { grid, colors: color };
};
var paintPie = (art2, slices, t) => {
  const palette = diagramPalette(t);
  const grid = art2.split("\n").map(cells);
  const named = { [LINE_HUE]: t.diagram, [ARROW_HUE]: t.accent, [GOOD_HUE]: t.diffAdded, [BAD_HUE]: t.diffRemoved };
  const hue = (slice) => slice in named ? named[slice] : slice < 0 ? t.diagramText : palette[slice % palette.length];
  return { grid, colors: grid.map((row, r) => row.map((_, c) => hue(slices[r]?.[c] ?? -1))) };
};
var painted = /* @__PURE__ */ new WeakMap();
var piePainted = /* @__PURE__ */ new WeakMap();
var painting = (theme, art2, slices, series) => {
  if (!slices) {
    const cache2 = painted.get(theme) ?? /* @__PURE__ */ new Map();
    painted.set(theme, cache2);
    return remember(cache2, art2, () => paint2(art2, theme, series));
  }
  const cache = piePainted.get(theme) ?? /* @__PURE__ */ new WeakMap();
  piePainted.set(theme, cache);
  const done = cache.get(slices) ?? paintPie(art2, slices, theme);
  cache.set(slices, done);
  return done;
};
var chartCells = (source, columns, theme) => {
  const art2 = mermaidArt(source, false, columns, diagramPalette(theme).length);
  return art2 && artWidth(art2.text) <= columns ? painting(theme, art2.text, art2.slices, art2.series) : null;
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
var hex = (color) => `#${color.toInts().slice(0, 3).map((n) => n.toString(16).padStart(2, "0")).join("")}`;
var chartTheme = (theme) => {
  const feedback = theme.text.feedback;
  const [link2, number, heading, emphasis, path, codeFlag, accent] = distinctHues(
    [theme.markdown.link, theme.syntax.number, theme.markdown.heading, theme.markdown.emphasis, feedback.warning.base, theme.syntax.keyword, theme.markdown.listItem].map(hex),
    [feedback.info.base, feedback.success.base, feedback.error.base].map(hex)
  );
  return {
    link: link2,
    number,
    heading,
    emphasis,
    path,
    codeFlag,
    accent,
    quote: hex(theme.markdown.blockQuote),
    rule: hex(theme.markdown.horizontalRule),
    diagram: hex(theme.diff.text.hunkHeader),
    diagramText: hex(theme.text.base),
    diffAdded: hex(theme.diff.text.added),
    diffRemoved: hex(theme.diff.text.removed)
  };
};
var chartChunks = (theme, grid, colors) => grid.flatMap((row, r) => [...r ? [fg(theme.text.base)("\n")] : [], ...row.map((cell, c) => fg(colors[r][c] ?? theme.text.base)(cell))]);
var installThemes = () => {
  const from = fileURLToPath(new URL("./themes/", import.meta.url));
  const to = join2(process.env.XDG_CONFIG_HOME || join2(homedir(), ".config"), "opencode", "themes");
  mkdirSync(to, { recursive: true });
  const files = readdirSync(from).filter((file) => file.endsWith(".json"));
  for (const file of files) copyFileSync(join2(from, file), join2(to, file));
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
    const dropChart = context.markdown.registerCodeBlockRenderer("chart", (token) => {
      const painted2 = chartCells(token.text.replace(/\n+$/, ""), (process.stdout.columns || 80) - 4, chartTheme(context.theme));
      if (!painted2) return void 0;
      return new TextRenderable(context.renderer, {
        content: new StyledText(chartChunks(context.theme, painted2.grid, painted2.colors)),
        width: "100%",
        height: painted2.grid.length,
        wrapMode: "none",
        marginTop: 1
      });
    });
    const dropFigure = context.markdown.registerCodeBlockRenderer("figure", (token) => {
      const lines = token.text.replace(/\n+$/, "").split("\n");
      return new TextRenderable(context.renderer, {
        content: new StyledText(figureChunks(context.theme, lines)),
        width: "100%",
        height: lines.length,
        wrapMode: "none",
        marginTop: 1
      });
    });
    return () => {
      dropChart();
      dropFigure();
    };
  }
};
export {
  tui_default as default
};
