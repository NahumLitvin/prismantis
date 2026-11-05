// node_modules/beautiful-mermaid/src/multiline-utils.ts
function dt(t) {
  return (t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1) : t).replace(/<br\s*\/?>/gi, `
`).replace(/\\n/g, `
`).replace(/<\/?(?:sub|sup|small|mark)\s*>/gi, "").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(?<!\*)\*([^\s*](?:[^*]*[^\s*])?)\*(?!\*)/g, "<i>$1</i>").replace(/~~(.+?)~~/g, "<s>$1</s>");
}

// node_modules/beautiful-mermaid/src/parser.ts
function Le(t) {
  let e = t.split(`
`).map((o) => o.trim()).filter((o) => o.length > 0 && !o.startsWith("%%"));
  if (e.length === 0)
    throw new Error("Empty mermaid diagram");
  let n = e[0];
  return /^stateDiagram(-v2)?\s*$/i.test(n) ? Un(e) : Jn(e);
}
function Jn(t) {
  let e = t[0].match(/^(?:graph|flowchart)\s+(TD|TB|LR|BT|RL)\s*$/i);
  if (!e)
    throw new Error(`Invalid mermaid header: "${t[0]}". Expected "graph TD", "flowchart LR", "stateDiagram-v2", etc.`);
  let o = {
    direction: e[1].toUpperCase(),
    nodes: /* @__PURE__ */ new Map(),
    edges: [],
    subgraphs: [],
    classDefs: /* @__PURE__ */ new Map(),
    classAssignments: /* @__PURE__ */ new Map(),
    nodeStyles: /* @__PURE__ */ new Map(),
    linkStyles: /* @__PURE__ */ new Map()
  }, s = [];
  for (let r = 1; r < t.length; r++) {
    let i = t[r], a = i.match(/^classDef\s+(\w+)\s+(.+)$/);
    if (a) {
      let u = a[1], m = a[2], p = Vt(m);
      o.classDefs.set(u, p);
      continue;
    }
    let c = i.match(/^class\s+([\w,-]+)\s+(\w+)$/);
    if (c) {
      let u = c[1].split(",").map((p) => p.trim()), m = c[2];
      for (let p of u)
        o.classAssignments.set(p, m);
      continue;
    }
    let l = i.match(/^style\s+([\w,-]+)\s+(.+)$/);
    if (l) {
      let u = l[1].split(",").map((p) => p.trim()), m = Vt(l[2]);
      for (let p of u)
        o.nodeStyles.set(p, { ...o.nodeStyles.get(p), ...m });
      continue;
    }
    let d = i.match(/^linkStyle\s+(default|[\d,\s]+)\s+(.+)$/);
    if (d) {
      let u = d[1].trim(), m = Vt(d[2]);
      if (u === "default")
        o.linkStyles.set("default", { ...o.linkStyles.get("default"), ...m });
      else {
        let p = u.split(",").map((b) => parseInt(b.trim(), 10));
        for (let b of p)
          isNaN(b) || o.linkStyles.set(b, { ...o.linkStyles.get(b), ...m });
      }
      continue;
    }
    let h = i.match(/^direction\s+(TD|TB|LR|BT|RL)\s*$/i);
    if (h && s.length > 0) {
      s[s.length - 1].direction = h[1].toUpperCase();
      continue;
    }
    let f = i.match(/^subgraph\s+(.+)$/);
    if (f) {
      let u = f[1].trim(), m = u.match(/^([\w-]+)\s*\[(.+)\]$/), p, b;
      m ? (p = m[1], b = dt(m[2])) : (b = dt(u), p = u.replace(/\s+/g, "_").replace(/[^\w]/g, ""));
      let A = { id: p, label: b, nodeIds: [], children: [] };
      s.push(A);
      continue;
    }
    if (i === "end") {
      let u = s.pop();
      u && (s.length > 0 ? s[s.length - 1].children.push(u) : o.subgraphs.push(u));
      continue;
    }
    tr(i, o, s);
  }
  return o;
}
function Un(t) {
  let e = {
    direction: "TD",
    nodes: /* @__PURE__ */ new Map(),
    edges: [],
    subgraphs: [],
    classDefs: /* @__PURE__ */ new Map(),
    classAssignments: /* @__PURE__ */ new Map(),
    nodeStyles: /* @__PURE__ */ new Map(),
    linkStyles: /* @__PURE__ */ new Map()
  }, n = [], o = /* @__PURE__ */ new Set(), s = 0, r = 0;
  for (let i = 1; i < t.length; i++) {
    let a = t[i], c = a.match(/^direction\s+(TD|TB|LR|BT|RL)\s*$/i);
    if (c) {
      n.length > 0 ? n[n.length - 1].direction = c[1].toUpperCase() : e.direction = c[1].toUpperCase();
      continue;
    }
    let l = a.match(/^linkStyle\s+(default|[\d,\s]+)\s+(.+)$/);
    if (l) {
      let m = l[1].trim(), p = Vt(l[2]);
      if (m === "default")
        e.linkStyles.set("default", { ...e.linkStyles.get("default"), ...p });
      else {
        let b = m.split(",").map((A) => parseInt(A.trim(), 10));
        for (let A of b)
          isNaN(A) || e.linkStyles.set(A, { ...e.linkStyles.get(A), ...p });
      }
      continue;
    }
    let d = a.match(/^state\s+(?:"([^"]+)"\s+as\s+)?([\w\p{L}]+)\s*\{$/u);
    if (d) {
      let m = d[1] ?? d[2], p = d[2], b = { id: p, label: m, nodeIds: [], children: [] };
      n.push(b), o.add(p), e.nodes.delete(p);
      continue;
    }
    if (a === "}") {
      let m = n.pop();
      m && (n.length > 0 ? n[n.length - 1].children.push(m) : e.subgraphs.push(m));
      continue;
    }
    let h = a.match(/^state\s+"([^"]+)"\s+as\s+([\w\p{L}]+)\s*$/u);
    if (h) {
      let m = dt(h[1]), p = h[2];
      Ot(e, n, { id: p, label: m, shape: "rounded" });
      continue;
    }
    let f = a.match(/^(\[\*\]|[\w\p{L}-]+)\s*(-->)\s*(\[\*\]|[\w\p{L}-]+)(?:\s*:\s*(.+))?$/u);
    if (f) {
      let m = f[1], p = f[3], b = f[4]?.trim(), A = b ? dt(b) : void 0;
      m === "[*]" ? (s++, m = `_start${s > 1 ? s : ""}`, Ot(e, n, { id: m, label: "", shape: "state-start" })) : o.has(m) || Se(e, n, m), p === "[*]" ? (r++, p = `_end${r > 1 ? r : ""}`, Ot(e, n, { id: p, label: "", shape: "state-end" })) : o.has(p) || Se(e, n, p), e.edges.push({
        source: m,
        target: p,
        label: A,
        style: "solid",
        hasArrowStart: !1,
        hasArrowEnd: !0
      });
      continue;
    }
    let u = a.match(/^([\w\p{L}-]+)\s*:\s*(.+)$/u);
    if (u) {
      let m = u[1], p = dt(u[2].trim());
      Ot(e, n, { id: m, label: p, shape: "rounded" });
      continue;
    }
  }
  return e;
}
function Ot(t, e, n) {
  if (!t.nodes.has(n.id) && t.nodes.set(n.id, n), e.length > 0) {
    let s = e[e.length - 1];
    s.nodeIds.includes(n.id) || s.nodeIds.push(n.id);
  }
}
function Se(t, e, n) {
  if (!t.nodes.has(n))
    Ot(t, e, { id: n, label: n, shape: "rounded" });
  else if (e.length > 0) {
    let o = e[e.length - 1];
    o.nodeIds.includes(n) || o.nodeIds.push(n);
  }
}
function Vt(t) {
  let e = t.replace(/;\s*$/, ""), n = {};
  for (let o of e.split(",")) {
    let s = o.indexOf(":");
    if (s > 0) {
      let r = o.slice(0, s).trim(), i = o.slice(s + 1).trim();
      r && i && (n[r] = i);
    }
  }
  return n;
}
var qn = /^(<)?(-->|-.->|==>|---|-\.-|===)(?:\|([^|]*)\|)?/, Vn = /^(<)?(--|-\.|==)\s+(.+?)\s+(-->|---|\.\->|-\.\-|==>|===)/, Kn = [
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
], Qn = /^((?:\w|-(?![-.>]))+)/, Zn = /^:::([\w][\w-]*)/;
function tr(t, e, n) {
  let o = t.trim(), s = Re(o, e, n);
  if (!s || s.ids.length === 0) return;
  o = s.remaining.trim();
  let r = s.ids;
  for (; o.length > 0; ) {
    let i, a, c, l, d = o.match(qn);
    if (d) {
      i = !!d[1];
      let f = d[2], u = d[3]?.trim();
      l = u ? dt(u) : void 0, o = o.slice(d[0].length).trim(), a = nr(f), c = f.endsWith(">");
    } else {
      let f = o.match(Vn);
      if (!f) break;
      i = !!f[1];
      let u = f[3].trim();
      l = u ? dt(u) : void 0;
      let m = f[2], p = f[4];
      o = o.slice(f[0].length).trim(), a = rr(m, p), c = p.endsWith(">");
    }
    let h = Re(o, e, n);
    if (!h || h.ids.length === 0) break;
    o = h.remaining.trim();
    for (let f of r)
      for (let u of h.ids)
        e.edges.push({
          source: f,
          target: u,
          label: l,
          style: a,
          hasArrowStart: i,
          hasArrowEnd: c
        });
    r = h.ids;
  }
}
function Re(t, e, n) {
  let o = De(t, e, n);
  if (!o) return null;
  let s = [o.id], r = o.remaining.trim();
  for (; r.startsWith("&"); ) {
    r = r.slice(1).trim();
    let i = De(r, e, n);
    if (!i) break;
    s.push(i.id), r = i.remaining.trim();
  }
  return { ids: s, remaining: r };
}
function De(t, e, n) {
  let o = null, s = t;
  for (let { regex: i, shape: a } of Kn) {
    let c = t.match(i);
    if (c) {
      o = c[1];
      let l = dt(c[2]);
      Te(e, n, { id: o, label: l, shape: a }), s = t.slice(c[0].length);
      break;
    }
  }
  if (o === null) {
    let i = t.match(Qn);
    i && (o = i[1], e.nodes.has(o) || Te(e, n, { id: o, label: o, shape: "rectangle" }), s = t.slice(i[0].length));
  }
  if (o === null) return null;
  let r = s.match(Zn);
  return r && (e.classAssignments.set(o, r[1]), s = s.slice(r[0].length)), { id: o, remaining: s };
}
function Te(t, e, n) {
  !t.nodes.has(n.id) && t.nodes.set(n.id, n), er(e, n.id);
}
function er(t, e) {
  if (t.length > 0) {
    let n = t[t.length - 1];
    n.nodeIds.includes(e) || n.nodeIds.push(e);
  }
}
function nr(t) {
  return t === "-.->" || t === "-.-" ? "dotted" : t === "==>" || t === "===" ? "thick" : "solid";
}
function rr(t, e) {
  return t === "-." || e === ".->" || e === "-.-" ? "dotted" : t === "==" || e === "==>" || e === "===" ? "thick" : "solid";
}

// node_modules/beautiful-mermaid/src/ascii/types.ts
var _ = { x: 1, y: 0 }, Y = { x: 1, y: 2 }, j = { x: 0, y: 1 }, P = { x: 2, y: 1 }, wt = { x: 2, y: 0 }, Mt = { x: 0, y: 0 }, Rt = { x: 2, y: 2 }, vt = { x: 0, y: 2 }, Gt = { x: 1, y: 1 };
function ae(t, e) {
  return t.x === e.x && t.y === e.y;
}
function Kt(t, e) {
  return t.x === e.x && t.y === e.y;
}
function Ft(t, e) {
  return { x: t.x + e.x, y: t.y + e.y };
}
function It(t) {
  return `${t.x},${t.y}`;
}
var Ee = { name: "", styles: {} };

// node_modules/beautiful-mermaid/src/ascii/ansi.ts
var Zt = {
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
function ke() {
  let t = globalThis.process;
  if (t) {
    if (!t.stdout?.isTTY)
      return "none";
    let e = t.env?.COLORTERM?.toLowerCase() ?? "", n = t.env?.TERM?.toLowerCase() ?? "";
    return e === "truecolor" || e === "24bit" ? "truecolor" : n.includes("256color") || n.includes("256") ? "ansi256" : n && n !== "dumb" ? "ansi16" : "none";
  }
  return typeof document < "u" ? "html" : "none";
}
function le(t) {
  let e = t.replace("#", "");
  return e.length === 3 ? {
    r: parseInt(e[0] + e[0], 16),
    g: parseInt(e[1] + e[1], 16),
    b: parseInt(e[2] + e[2], 16)
  } : {
    r: parseInt(e.substring(0, 2), 16),
    g: parseInt(e.substring(2, 4), 16),
    b: parseInt(e.substring(4, 6), 16)
  };
}
var te = "\x1B[", Qt = `${te}0m`;
function Ge(t) {
  let { r: e, g: n, b: o } = le(t);
  return `${te}38;2;${e};${n};${o}m`;
}
function or(t, e, n) {
  let o = (t + e + n) / 3;
  if (Math.max(Math.abs(t - o), Math.abs(e - o), Math.abs(n - o)) < 10) {
    let l = Math.round(o / 255 * 23);
    return 232 + Math.min(23, Math.max(0, l));
  }
  let r = (l) => l < 48 ? 0 : l < 115 ? 1 : Math.min(5, Math.floor((l - 35) / 40)), i = r(t), a = r(e), c = r(n);
  return 16 + 36 * i + 6 * a + c;
}
function Ie(t) {
  let { r: e, g: n, b: o } = le(t), s = or(e, n, o);
  return `${te}38;5;${s}m`;
}
function Ne(t) {
  let { r: e, g: n, b: o } = le(t), s = 0.299 * e + 0.587 * n + 0.114 * o, r = s > 100 ? 0 : 60, i;
  return e > 180 && n < 100 && o < 100 ? i = 31 : n > 180 && e < 100 && o < 100 ? i = 32 : e > 150 && n > 150 && o < 100 ? i = 33 : o > 180 && e < 100 && n < 100 ? i = 34 : e > 150 && o > 150 && n < 100 ? i = 35 : n > 150 && o > 150 && e < 100 ? i = 36 : s > 200 ? i = 37 : s < 50 ? i = 30 : i = 37, `${te}${i + r}m`;
}
function Ye(t) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function $e(t, e) {
  return `<span style="color:${t}">${Ye(e)}</span>`;
}
function Be(t, e) {
  switch (t) {
    case "text":
      return e.fg;
    case "border":
      return e.border;
    case "line":
      return e.line;
    case "arrow":
      return e.arrow;
    case "corner":
      return e.corner ?? e.line;
    case "junction":
      return e.junction ?? e.border;
    default:
      return e.fg;
  }
}
function ce(t, e, n) {
  if (n === "none") return "";
  let o = Be(t, e);
  switch (n) {
    case "truecolor":
      return Ge(o);
    case "ansi256":
      return Ie(o);
    case "ansi16":
      return Ne(o);
    default:
      return "";
  }
}
function Xe(t, e, n, o) {
  if (o === "none")
    return t.join("");
  if (o === "html")
    return ir(t, e, n);
  let s = "", r = null, i = "";
  for (let a = 0; a < t.length; a++) {
    let c = t[a], l = e[a] ?? null;
    if (c === " ") {
      i.length > 0 && (r !== null ? s += ce(r, n, o) + i + Qt : s += i, i = "", r = null), s += c;
      continue;
    }
    if (l === r) {
      i += c;
      continue;
    }
    i.length > 0 && (r !== null ? s += ce(r, n, o) + i + Qt : s += i), i = c, r = l;
  }
  return i.length > 0 && r !== null ? s += ce(r, n, o) + i + Qt : i.length > 0 && (s += i), s;
}
function ir(t, e, n) {
  let o = "", s = null, r = "", i = () => {
    r.length !== 0 && (s !== null ? o += $e(Be(s, n), r) : o += Ye(r), r = "", s = null);
  };
  for (let a = 0; a < t.length; a++) {
    let c = t[a], l = e[a] ?? null;
    if (c === " ") {
      i(), o += " ";
      continue;
    }
    if (l === s) {
      r += c;
      continue;
    }
    i(), r = c, s = l;
  }
  return i(), o;
}
function ee(t, e, n) {
  if (n === "none" || t.length === 0) return t;
  if (n === "html") return $e(e, t);
  let o;
  switch (n) {
    case "truecolor":
      o = Ge(e);
      break;
    case "ansi256":
      o = Ie(e);
      break;
    case "ansi16":
      o = Ne(e);
      break;
    default:
      return t;
  }
  return `${o}${t}${Qt}`;
}

// node_modules/beautiful-mermaid/src/ascii/canvas.ts
function it(t, e) {
  let n = [];
  for (let o = 0; o <= t; o++) {
    let s = [];
    for (let r = 0; r <= e; r++)
      s.push(" ");
    n.push(s);
  }
  return n;
}
function ht(t) {
  let [e, n] = Jt(t);
  return it(e, n);
}
function $t(t, e) {
  let n = [];
  for (let o = 0; o <= t; o++) {
    let s = [];
    for (let r = 0; r <= e; r++)
      s.push(null);
    n.push(s);
  }
  return n;
}
function Nt(t, e, n) {
  let o = t.length - 1, s = (t[0]?.length ?? 1) - 1, r = Math.max(e, o), i = Math.max(n, s), a = $t(r, i);
  for (let c = 0; c < a.length; c++)
    for (let l = 0; l < a[0].length; l++)
      c < t.length && l < t[0].length && (a[c][l] = t[c][l]);
  return t.length = 0, t.push(...a), t;
}
function Bt(t, e, n, o) {
  (e >= t.length || n >= (t[0]?.length ?? 0)) && Nt(t, e, n), t[e][n] = o;
}
function Jt(t) {
  return [t.length - 1, (t[0]?.length ?? 1) - 1];
}
function Tt(t, e, n) {
  let [o, s] = Jt(t), r = Math.max(e, o), i = Math.max(n, s), a = it(r, i);
  for (let c = 0; c < a.length; c++)
    for (let l = 0; l < a[0].length; l++)
      c < t.length && l < t[0].length && (a[c][l] = t[c][l]);
  return t.length = 0, t.push(...a), t;
}
var sr = /* @__PURE__ */ new Set([
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
function He(t, e) {
  for (let n = 0; n < (e[0]?.length ?? 0); n++) {
    let o = e.map((s, r) => s[n] !== " " ? r : -1).filter((s) => s >= 0);
    if (o.length !== 0)
      for (let s = o[0]; s <= o[o.length - 1]; s++)
        e[s][n] === " " && !fe(t[s][n]) && (t[s][n] = " ");
  }
}
function Pe(t) {
  return sr.has(t);
}
function fe(t) {
  return /^[a-zA-Z0-9]$/.test(t);
}
var ar = {
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
function cr(t, e) {
  return ar[t]?.[e] ?? t;
}
function Lt(t, e, n, ...o) {
  let [s, r] = Jt(t);
  for (let a of o) {
    let [c, l] = Jt(a);
    s = Math.max(s, c + e.x), r = Math.max(r, l + e.y);
  }
  let i = it(s, r);
  for (let a = 0; a <= s; a++)
    for (let c = 0; c <= r; c++)
      a < t.length && c < t[0].length && (i[a][c] = t[a][c]);
  for (let a of o)
    for (let c = 0; c < a.length; c++)
      for (let l = 0; l < a[0].length; l++) {
        let d = a[c][l];
        if (d !== " ") {
          let h = c + e.x, f = l + e.y, u = i[h][f];
          !n && Pe(d) && Pe(u) ? i[h][f] = cr(u, d) : fe(u) && fe(d) || (i[h][f] = d);
        }
      }
  return i;
}
function Pt(t, e) {
  let [n, o] = Jt(t), s = [], r = e?.roleCanvas, i = e?.colorMode ?? "none", a = e?.theme ?? Zt;
  for (let c = 0; c <= o; c++)
    if (i === "none" || !r) {
      let l = "";
      for (let d = 0; d <= n; d++)
        l += t[d][c];
      s.push(l);
    } else {
      let l = [], d = [];
      for (let h = 0; h <= n; h++)
        l.push(t[h][c]), d.push(r[h]?.[c] ?? null);
      s.push(Xe(l, d, a, i));
    }
  return s.join(`
`);
}
var lr = {
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
function We(t) {
  for (let e of t)
    e.reverse();
  for (let e of t)
    for (let n = 0; n < e.length; n++) {
      let o = lr[e[n]];
      o && (e[n] = o);
    }
  return t;
}
function _e(t) {
  for (let e of t)
    e.reverse();
  return t;
}
function de(t, e, n, o = !1) {
  Tt(t, e.x + n.length, e.y);
  for (let s = 0; s < n.length; s++) {
    let r = e.x + s, i = t[r][e.y];
    (o || i === " ") && (t[r][e.y] = n[s]);
  }
}
function je(t, e, n) {
  let o = 0, s = 0;
  for (let r of e.values()) o += r;
  for (let r of n.values()) s += r;
  Tt(t, o - 1, s - 1);
}
function ze(t, e, n) {
  let o = 0, s = 0;
  for (let r of e.values()) o += r;
  for (let r of n.values()) s += r;
  Nt(t, o - 1, s - 1);
}

// node_modules/beautiful-mermaid/src/ascii/converter.ts
function Oe(t, e) {
  let n = /* @__PURE__ */ new Map(), o = 0;
  for (let [a, c] of t.nodes) {
    let l = {
      // Use the parser ID as the unique identity key to avoid collisions
      // when multiple nodes share the same label (e.g. A[Web Server], C[Web Server]).
      name: a,
      // The label is used for rendering inside the box.
      displayLabel: c.label,
      // Preserve shape from parser for shape-aware rendering
      shape: c.shape,
      index: o,
      gridCoord: null,
      drawingCoord: null,
      drawing: null,
      drawn: !1,
      styleClassName: "",
      styleClass: Ee
    };
    n.set(a, l), o++;
  }
  let s = [...n.values()], r = [];
  for (let a of t.edges) {
    let c = n.get(a.source), l = n.get(a.target);
    !c || !l || r.push({
      from: c,
      to: l,
      text: a.label ?? "",
      path: [],
      labelLine: [],
      startDir: { x: 0, y: 0 },
      endDir: { x: 0, y: 0 },
      style: a.style,
      hasArrowStart: a.hasArrowStart,
      hasArrowEnd: a.hasArrowEnd
    });
  }
  let i = [];
  for (let a of t.subgraphs)
    Fe(a, null, n, i);
  fr(t.subgraphs, i, n, t);
  for (let [a, c] of t.classAssignments) {
    let l = n.get(a), d = t.classDefs.get(c);
    l && d && (l.styleClassName = c, l.styleClass = { name: c, styles: d });
  }
  return {
    nodes: s,
    edges: r,
    canvas: it(0, 0),
    roleCanvas: $t(0, 0),
    grid: /* @__PURE__ */ new Map(),
    columnWidth: /* @__PURE__ */ new Map(),
    rowHeight: /* @__PURE__ */ new Map(),
    subgraphs: i,
    config: e,
    offsetX: 0,
    offsetY: 0,
    bundles: []
    // Populated by analyzeEdgeBundles() during layout
  };
}
function Fe(t, e, n, o) {
  let s;
  t.direction && (s = t.direction === "LR" || t.direction === "RL" ? "LR" : "TD");
  let r = {
    name: t.label,
    nodes: [],
    parent: e,
    children: [],
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
    direction: s
  };
  for (let i of t.nodeIds) {
    let a = n.get(i);
    a && r.nodes.push(a);
  }
  o.push(r);
  for (let i of t.children) {
    let a = Fe(i, r, n, o);
    r.children.push(a);
    for (let c of a.nodes)
      r.nodes.includes(c) || r.nodes.push(c);
  }
  return r;
}
function fr(t, e, n, o) {
  let s = /* @__PURE__ */ new Map();
  ur(t, e, s);
  let r = /* @__PURE__ */ new Map();
  function i(a) {
    let c = s.get(a);
    if (c) {
      for (let l of a.children)
        i(l);
      for (let l of a.nodeIds)
        r.has(l) || r.set(l, c);
    }
  }
  for (let a of t)
    i(a);
  for (let a of e)
    a.nodes = a.nodes.filter((c) => {
      let l;
      for (let [h, f] of n)
        if (f === c) {
          l = h;
          break;
        }
      if (!l) return !1;
      let d = r.get(l);
      return d ? dr(a, d) : !0;
    });
}
function dr(t, e) {
  let n = e;
  for (; n !== null; ) {
    if (n === t) return !0;
    n = n.parent;
  }
  return !1;
}
function ur(t, e, n) {
  let o = [];
  function s(r) {
    for (let i of r)
      o.push(i), s(i.children);
  }
  s(t);
  for (let r = 0; r < o.length && r < e.length; r++)
    n.set(o[r], e[r]);
}

// node_modules/beautiful-mermaid/src/ascii/pathfinder.ts
var ue = class {
  items = [];
  get length() {
    return this.items.length;
  }
  push(e) {
    this.items.push(e), this.bubbleUp(this.items.length - 1);
  }
  pop() {
    if (this.items.length === 0) return;
    let e = this.items[0], n = this.items.pop();
    return this.items.length > 0 && (this.items[0] = n, this.sinkDown(0)), e;
  }
  bubbleUp(e) {
    for (; e > 0; ) {
      let n = e - 1 >> 1;
      if (this.items[e].priority < this.items[n].priority)
        [this.items[e], this.items[n]] = [this.items[n], this.items[e]], e = n;
      else
        break;
    }
  }
  sinkDown(e) {
    let n = this.items.length;
    for (; ; ) {
      let o = e, s = 2 * e + 1, r = 2 * e + 2;
      if (s < n && this.items[s].priority < this.items[o].priority && (o = s), r < n && this.items[r].priority < this.items[o].priority && (o = r), o !== e)
        [this.items[e], this.items[o]] = [this.items[o], this.items[e]], e = o;
      else
        break;
    }
  }
};
function hr(t, e) {
  let n = Math.abs(t.x - e.x), o = Math.abs(t.y - e.y);
  return n === 0 || o === 0 ? n + o : n + o + 1;
}
var gr = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 }
];
function mr(t, e) {
  return e.x < 0 || e.y < 0 ? !1 : !t.has(It(e));
}
function Ht(t, e, n) {
  let o = new ue();
  o.push({ coord: e, priority: 0 });
  let s = /* @__PURE__ */ new Map();
  s.set(It(e), 0);
  let r = /* @__PURE__ */ new Map();
  r.set(It(e), null);
  let i = 0;
  for (; o.length > 0; ) {
    if (++i > 5e4) throw new Error("mermaid edge routing gave up");
    let a = o.pop().coord;
    if (ae(a, n)) {
      let l = [], d = a;
      for (; d !== null; )
        l.unshift(d), d = r.get(It(d)) ?? null;
      return l;
    }
    let c = s.get(It(a));
    for (let l of gr) {
      let d = { x: a.x + l.x, y: a.y + l.y };
      if (!mr(t, d) && !ae(d, n))
        continue;
      let h = c + 1, f = It(d), u = s.get(f);
      if (u === void 0 || h < u) {
        s.set(f, h);
        let m = h + hr(d, n);
        o.push({ coord: d, priority: m }), r.set(f, a);
      }
    }
  }
  return null;
}
function Yt(t) {
  if (t.length <= 2) return t;
  let e = /* @__PURE__ */ new Set(), n = t[0], o = t[1];
  for (let s = 2; s < t.length; s++) {
    let r = t[s], i = o.x - n.x, a = o.y - n.y, c = r.x - o.x, l = r.y - o.y;
    i === c && a === l && e.add(s - 1), n = o, o = r;
  }
  return t.filter((s, r) => !e.has(r));
}

// node_modules/beautiful-mermaid/src/ascii/edge-routing.ts
function ne(t) {
  return t === _ ? Y : t === Y ? _ : t === j ? P : t === P ? j : t === wt ? vt : t === Mt ? Rt : t === Rt ? Mt : t === vt ? wt : Gt;
}
function x(t, e) {
  return t.x === e.x && t.y === e.y;
}
function pt(t, e) {
  return t.x === e.x ? t.y < e.y ? Y : _ : t.y === e.y ? t.x < e.x ? P : j : t.x < e.x ? t.y < e.y ? Rt : wt : t.y < e.y ? vt : Mt;
}
function pr(t) {
  return t === "LR" ? [P, Y, Y, P] : [Y, P, P, Y];
}
function xr(t, e) {
  if (t.from === t.to) return pr(e);
  let n = pt(t.from.gridCoord, t.to.gridCoord), o, s, r, i, a = e === "LR" ? x(n, j) || x(n, Mt) || x(n, vt) : x(n, _) || x(n, Mt) || x(n, wt);
  return x(n, Rt) ? e === "LR" ? (o = Y, s = j, r = P, i = _) : (o = P, s = _, r = Y, i = j) : x(n, wt) ? e === "LR" ? (o = _, s = j, r = P, i = Y) : (o = P, s = Y, r = _, i = j) : x(n, vt) ? e === "LR" ? (o = Y, s = Y, r = j, i = _) : (o = j, s = _, r = Y, i = P) : x(n, Mt) ? e === "LR" ? (o = Y, s = Y, r = j, i = Y) : (o = P, s = P, r = _, i = P) : a ? e === "LR" && x(n, j) ? (o = Y, s = Y, r = j, i = P) : e === "TD" && x(n, _) ? (o = P, s = P, r = _, i = Y) : (o = n, s = ne(n), r = n, i = ne(n)) : (o = n, s = ne(n), r = n, i = ne(n)), [o, s, r, i];
}
function Je(t, e) {
  let n = yt(t, e.from), o = yt(t, e.to), s = n && n === o && n.direction ? n.direction : t.config.graphDirection, [r, i, a, c] = xr(e, s), l = Ft(e.from.gridCoord, r), d = Ft(e.to.gridCoord, i), h = Ht(t.grid, l, d), f = Ft(e.from.gridCoord, a), u = Ft(e.to.gridCoord, c), m = Ht(t.grid, f, u);
  if (h !== null && m !== null) {
    h = Yt(h), m = Yt(m), h.length <= m.length ? (e.startDir = r, e.endDir = i, e.path = h) : (e.startDir = a, e.endDir = c, e.path = m);
    return;
  }
  if (h !== null) {
    e.startDir = r, e.endDir = i, e.path = Yt(h);
    return;
  }
  if (m !== null) {
    e.startDir = a, e.endDir = c, e.path = Yt(m);
    return;
  }
  e.startDir = r, e.endDir = i, e.path = [l, d];
}
function he(t, e) {
  if (e.text.length === 0) return;
  let n = e.text.length, o = e.path.length, s = t.config.graphDirection === "TD", r = [];
  for (let f = 1; f < o; f++) {
    let u = e.path[f - 1], m = e.path[f], p = [u, m], b = br(t, p), A = u.x === m.x;
    r.push({ line: p, width: b, index: f, isVertical: A });
  }
  let i = r.filter((f) => f.width >= n && f.index > 1), a;
  if (i.length > 0)
    i.sort((f, u) => u.index - f.index), a = i[0].line;
  else {
    let f = r.filter((u) => u.width >= n);
    f.length > 0 ? (f.sort((u, m) => m.index - u.index), a = f[0].line) : (r.sort((u, m) => m.width - u.width), a = r[0]?.line ?? [e.path[0], e.path[1]]);
  }
  let c = Math.min(a[0].x, a[1].x), l = Math.max(a[0].x, a[1].x), d = c + Math.floor((l - c) / 2), h = t.columnWidth.get(d) ?? 0;
  t.columnWidth.set(d, Math.max(h, n + 2)), e.labelLine = [a[0], a[1]];
}
function br(t, e) {
  let n = 0, o = Math.min(e[0].x, e[1].x), s = Math.max(e[0].x, e[1].x);
  for (let r = o; r <= s; r++)
    n += t.columnWidth.get(r) ?? 0;
  return n;
}

// node_modules/beautiful-mermaid/src/ascii/edge-bundling.ts
function qe(t) {
  if (t.config.graphDirection !== "TD")
    return [];
  let e = [], n = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Map();
  for (let r of t.edges) {
    if (r.from === r.to) continue;
    let i = o.get(r.to) ?? [];
    i.push(r), o.set(r.to, i);
  }
  for (let [r, i] of o) {
    if (i.length < 2 || !Ue(i, t) || i.some((c) => n.has(c))) continue;
    let a = {
      type: "fan-in",
      edges: [...i],
      sharedNode: r,
      otherNodes: i.map((c) => c.from),
      junctionPoint: null,
      sharedPath: [],
      junctionDir: Gt,
      sharedNodeDir: Gt
    };
    for (let c of i)
      c.bundle = a, n.add(c);
    e.push(a);
  }
  let s = /* @__PURE__ */ new Map();
  for (let r of t.edges) {
    if (r.from === r.to || n.has(r)) continue;
    let i = s.get(r.from) ?? [];
    i.push(r), s.set(r.from, i);
  }
  for (let [r, i] of s) {
    if (i.length < 2 || !Ue(i, t)) continue;
    let a = {
      type: "fan-out",
      edges: [...i],
      sharedNode: r,
      otherNodes: i.map((c) => c.to),
      junctionPoint: null,
      sharedPath: [],
      junctionDir: Gt,
      sharedNodeDir: Gt
    };
    for (let c of i)
      c.bundle = a, n.add(c);
    e.push(a);
  }
  return e;
}
function Ue(t, e) {
  if (t.length < 2) return !1;
  let n = t[0].style, o = yt(e, t[0].from), s = yt(e, t[0].to);
  for (let r of t) {
    if (r.style !== n || r.text.length > 0) return !1;
    let i = yt(e, r.from), a = yt(e, r.to);
    if (i !== o || a !== s || i !== a) return !1;
  }
  return !0;
}
function yr(t, e) {
  let n = t.config.graphDirection, o = e.sharedNode.gridCoord, s = e.otherNodes.map((r) => r.gridCoord);
  if (e.type === "fan-in") {
    let r = Math.min(...s.map((l) => l.x)), i = Math.max(...s.map((l) => l.x)), a = Math.min(...s.map((l) => l.y)), c = Math.max(...s.map((l) => l.y));
    if (n === "TD") {
      let l = o.y - 1, d = Math.floor((r + i) / 2) + 1;
      return { x: o.x + 1, y: l };
    } else {
      let l = o.x - 1, d = o.y + 1;
      return { x: l, y: d };
    }
  } else {
    let r = Math.min(...s.map((l) => l.x)), i = Math.max(...s.map((l) => l.x)), a = Math.min(...s.map((l) => l.y)), c = Math.max(...s.map((l) => l.y));
    if (n === "TD") {
      let l = o.y + 3;
      return { x: o.x + 1, y: l };
    } else {
      let l = o.x + 3, d = o.y + 1;
      return { x: l, y: d };
    }
  }
}
function Cr(t, e) {
  let n = t.config.graphDirection;
  e.junctionPoint = yr(t, e);
  let o = e.junctionPoint;
  if (e.type === "fan-in") {
    e.junctionDir = n === "TD" ? _ : j, e.sharedNodeDir = n === "TD" ? Y : P;
    let s = e.sharedNode.gridCoord, r = n === "TD" ? { x: s.x + 1, y: s.y } : { x: s.x, y: s.y + 1 }, i = Ht(t.grid, o, r);
    e.sharedPath = i ? Yt(i) : [o, r];
    for (let a of e.edges) {
      let c = a.from.gridCoord, l = n === "TD" ? { x: c.x + 1, y: c.y + 2 } : { x: c.x + 2, y: c.y + 1 }, d = Ht(t.grid, l, o);
      a.pathToJunction = d ? Yt(d) : [l, o], a.startDir = n === "TD" ? Y : P, a.endDir = n === "TD" ? _ : j, a.path = [...a.pathToJunction, ...e.sharedPath.slice(1)];
    }
  } else {
    e.junctionDir = n === "TD" ? Y : P, e.sharedNodeDir = n === "TD" ? _ : j;
    let s = e.sharedNode.gridCoord, r = n === "TD" ? { x: s.x + 1, y: s.y + 2 } : { x: s.x + 2, y: s.y + 1 }, i = Ht(t.grid, r, o);
    e.sharedPath = i ? Yt(i) : [r, o];
    for (let a of e.edges) {
      let c = a.to.gridCoord, l = n === "TD" ? { x: c.x + 1, y: c.y } : { x: c.x, y: c.y + 1 }, d = Ht(t.grid, o, l);
      a.pathToJunction = d ? Yt(d) : [o, l], a.startDir = n === "TD" ? Y : P, a.endDir = n === "TD" ? _ : j, a.path = [...e.sharedPath, ...a.pathToJunction.slice(1)];
    }
  }
}
function Ve(t) {
  for (let e of t.bundles)
    Cr(t, e);
}

// node_modules/beautiful-mermaid/src/ascii/multiline-utils.ts
function rt(t) {
  return t.split(`
`);
}
function re(t) {
  let e = rt(t);
  return Math.max(...e.map((n) => n.length), 0);
}
function ge(t) {
  return rt(t).length;
}

// node_modules/beautiful-mermaid/src/ascii/shapes/corners.ts
var Ke = {
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
function xt(t, e) {
  let n = Ke[t] ?? Ke.rectangle;
  return e ? n.ascii : n.unicode;
}

// node_modules/beautiful-mermaid/src/ascii/shapes/rectangle.ts
function At(t, e) {
  let n = rt(t), o = Math.max(...n.map((d) => d.length), 0), s = n.length, r = 2 * e.padding + o, i = r + 2, a = s + 2 * e.padding, c = a % 2 === 0 ? a + 1 : a, l = c + 2;
  return {
    width: i,
    height: l,
    labelArea: {
      x: 1 + e.padding,
      y: 1 + e.padding,
      width: o,
      height: s
    },
    // Grid layout: [border=1, content, border=1]
    gridColumns: [1, r, 1],
    gridRows: [1, c, 1]
  };
}
function St(t, e, n, o) {
  let { width: s, height: r } = e, i = it(s - 1, r - 1), a = { x: 0, y: 0 }, c = { x: s - 1, y: r - 1 }, l = o ? "-" : "\u2500", d = o ? "|" : "\u2502";
  for (let b = a.x + 1; b < c.x; b++)
    i[b][a.y] = l, i[b][c.y] = l;
  for (let b = a.y + 1; b < c.y; b++)
    i[a.x][b] = d, i[c.x][b] = d;
  i[a.x][a.y] = n.tl, i[c.x][a.y] = n.tr, i[a.x][c.y] = n.bl, i[c.x][c.y] = n.br;
  let h = rt(t), f = s - 1, u = r - 1, p = Math.floor(u / 2) - Math.floor((h.length - 1) / 2);
  for (let b = 0; b < h.length; b++) {
    let A = h[b], B = Math.floor(f / 2) - Math.ceil(A.length / 2) + 1;
    for (let v = 0; v < A.length; v++) {
      let H = B + v, L = p + b;
      H >= 0 && H < i.length && L >= 0 && L < i[0].length && (i[H][L] = A[v]);
    }
  }
  return i;
}
function gt(t, e, n) {
  let { width: o, height: s } = e, r = n.x + Math.floor(o / 2), i = n.y + Math.floor(s / 2);
  return x(t, _) ? { x: r, y: n.y } : x(t, Y) ? { x: r, y: n.y + s - 1 } : x(t, j) ? { x: n.x, y: i } : x(t, P) ? { x: n.x + o - 1, y: i } : x(t, Mt) ? { x: n.x, y: n.y } : x(t, wt) ? { x: n.x + o - 1, y: n.y } : x(t, vt) ? { x: n.x, y: n.y + s - 1 } : x(t, Rt) ? { x: n.x + o - 1, y: n.y + s - 1 } : { x: r, y: i };
}
var me = {
  getDimensions: At,
  render(t, e, n) {
    let o = xt("rectangle", n.useAscii);
    return St(t, e, o, n.useAscii);
  },
  getAttachmentPoint: gt
};

// node_modules/beautiful-mermaid/src/ascii/shapes/diamond.ts
var Qe = {
  getDimensions: At,
  render(t, e, n) {
    let o = xt("diamond", n.useAscii);
    return St(t, e, o, n.useAscii);
  },
  getAttachmentPoint: gt
};

// node_modules/beautiful-mermaid/src/ascii/shapes/circle.ts
var Ze = {
  getDimensions: At,
  render(t, e, n) {
    let o = xt("circle", n.useAscii);
    return St(t, e, o, n.useAscii);
  },
  getAttachmentPoint: gt
};

// node_modules/beautiful-mermaid/src/ascii/shapes/state.ts
var tn = {
  getDimensions(t, e) {
    return {
      width: 5,
      height: 3,
      labelArea: { x: 2, y: 1, width: 1, height: 1 },
      gridColumns: [1, 3, 1],
      gridRows: [1, 1, 1]
    };
  },
  render(t, e, n) {
    let { width: o, height: s } = e, r = it(o - 1, s - 1), i = Math.floor(o / 2);
    return n.useAscii ? (r[0][0] = ".", r[1][0] = "-", r[2][0] = "-", r[3][0] = "-", r[4][0] = ".", r[0][1] = "|", r[i][1] = "*", r[4][1] = "|", r[0][2] = "'", r[1][2] = "-", r[2][2] = "-", r[3][2] = "-", r[4][2] = "'") : (r[0][0] = "\u256D", r[1][0] = "\u2500", r[2][0] = "\u2500", r[3][0] = "\u2500", r[4][0] = "\u256E", r[0][1] = "\u2502", r[i][1] = "\u25CF", r[4][1] = "\u2502", r[0][2] = "\u2570", r[1][2] = "\u2500", r[2][2] = "\u2500", r[3][2] = "\u2500", r[4][2] = "\u256F"), r;
  },
  getAttachmentPoint(t, e, n) {
    let { width: o, height: s } = e, r = n.x + Math.floor(o / 2), i = n.y + Math.floor(s / 2);
    return x(t, _) ? { x: r, y: n.y } : x(t, Y) ? { x: r, y: n.y + s - 1 } : x(t, j) ? { x: n.x, y: i } : x(t, P) ? { x: n.x + o - 1, y: i } : { x: r, y: i };
  }
}, en = {
  getDimensions(t, e) {
    return {
      width: 5,
      height: 3,
      labelArea: { x: 2, y: 1, width: 1, height: 1 },
      gridColumns: [1, 3, 1],
      gridRows: [1, 1, 1]
    };
  },
  render(t, e, n) {
    let { width: o, height: s } = e, r = it(o - 1, s - 1), i = Math.floor(o / 2);
    return n.useAscii ? (r[0][0] = "#", r[1][0] = "=", r[2][0] = "=", r[3][0] = "=", r[4][0] = "#", r[0][1] = "#", r[i][1] = "*", r[4][1] = "#", r[0][2] = "#", r[1][2] = "=", r[2][2] = "=", r[3][2] = "=", r[4][2] = "#") : (r[0][0] = "\u2554", r[1][0] = "\u2550", r[2][0] = "\u2550", r[3][0] = "\u2550", r[4][0] = "\u2557", r[0][1] = "\u2551", r[i][1] = "\u25CE", r[4][1] = "\u2551", r[0][2] = "\u255A", r[1][2] = "\u2550", r[2][2] = "\u2550", r[3][2] = "\u2550", r[4][2] = "\u255D"), r;
  },
  getAttachmentPoint(t, e, n) {
    let { width: o, height: s } = e, r = n.x + Math.floor(o / 2), i = n.y + Math.floor(s / 2);
    return x(t, _) ? { x: r, y: n.y } : x(t, Y) ? { x: r, y: n.y + s - 1 } : x(t, j) ? { x: n.x, y: i } : x(t, P) ? { x: n.x + o - 1, y: i } : { x: r, y: i };
  }
};

// node_modules/beautiful-mermaid/src/ascii/shapes/rounded.ts
var nn = {
  getDimensions: At,
  render(t, e, n) {
    let o = xt("rounded", n.useAscii);
    return St(t, e, o, n.useAscii);
  },
  getAttachmentPoint: gt
};

// node_modules/beautiful-mermaid/src/ascii/shapes/stadium.ts
var rn = {
  getDimensions(t, e) {
    let n = rt(t), o = Math.max(...n.map((l) => l.length), 0), s = n.length, r = 2 * e.padding + o, i = r + 4, a = s + 2 * e.padding, c = Math.max(a + 2, 3);
    return {
      width: i,
      height: c,
      labelArea: {
        x: 2 + e.padding,
        y: 1 + e.padding,
        width: o,
        height: s
      },
      gridColumns: [2, r, 2],
      gridRows: [1, a, 1]
    };
  },
  render(t, e, n) {
    let { width: o, height: s } = e, r = it(o - 1, s - 1), i = Math.floor(s / 2), a = n.useAscii ? "-" : "\u2500";
    if (s === 3)
      r[0][i] = "(", r[o - 1][i] = ")";
    else if (n.useAscii) {
      for (let d = 0; d < s; d++)
        r[0][d] = "(", r[o - 1][d] = ")";
      for (let d = 1; d < o - 1; d++)
        r[d][0] = a, r[d][s - 1] = a;
    } else {
      r[0][0] = "\u256D";
      for (let d = 1; d < o - 1; d++) r[d][0] = a;
      r[o - 1][0] = "\u256E";
      for (let d = 1; d < s - 1; d++)
        r[0][d] = "\u2502", r[o - 1][d] = "\u2502";
      r[0][s - 1] = "\u2570";
      for (let d = 1; d < o - 1; d++) r[d][s - 1] = a;
      r[o - 1][s - 1] = "\u256F";
    }
    let c = rt(t), l = i - Math.floor((c.length - 1) / 2);
    for (let d = 0; d < c.length; d++) {
      let h = c[d], f = Math.floor(o / 2) - Math.floor(h.length / 2);
      for (let u = 0; u < h.length; u++) {
        let m = f + u, p = l + d;
        m > 0 && m < o - 1 && p >= 0 && p < s && (r[m][p] = h[u]);
      }
    }
    return r;
  },
  getAttachmentPoint: gt
};

// node_modules/beautiful-mermaid/src/ascii/shapes/hexagon.ts
var on = {
  getDimensions: At,
  render(t, e, n) {
    let o = xt("hexagon", n.useAscii);
    return St(t, e, o, n.useAscii);
  },
  getAttachmentPoint: gt
};

// node_modules/beautiful-mermaid/src/ascii/shapes/special.ts
var sn = {
  getDimensions(t, e) {
    let n = rt(t), o = Math.max(...n.map((l) => l.length), 0), s = n.length, r = 2 * e.padding + o, i = r + 4, a = s + 2 * e.padding, c = a + 2;
    return {
      width: i,
      height: c,
      labelArea: {
        x: 2 + e.padding,
        y: 1 + e.padding,
        width: o,
        height: s
      },
      gridColumns: [2, r, 2],
      gridRows: [1, a, 1]
    };
  },
  render(t, e, n) {
    let { width: o, height: s } = e, r = it(o - 1, s - 1), i = n.useAscii ? "-" : "\u2500", a = n.useAscii ? "|" : "\u2502";
    r[0][0] = n.useAscii ? "+" : "\u250C", r[1][0] = n.useAscii ? "+" : "\u252C";
    for (let h = 2; h < o - 2; h++) r[h][0] = i;
    r[o - 2][0] = n.useAscii ? "+" : "\u252C", r[o - 1][0] = n.useAscii ? "+" : "\u2510";
    for (let h = 1; h < s - 1; h++)
      r[0][h] = a, r[1][h] = a, r[o - 2][h] = a, r[o - 1][h] = a;
    r[0][s - 1] = n.useAscii ? "+" : "\u2514", r[1][s - 1] = n.useAscii ? "+" : "\u2534";
    for (let h = 2; h < o - 2; h++) r[h][s - 1] = i;
    r[o - 2][s - 1] = n.useAscii ? "+" : "\u2534", r[o - 1][s - 1] = n.useAscii ? "+" : "\u2518";
    let c = rt(t), d = Math.floor(s / 2) - Math.floor((c.length - 1) / 2);
    for (let h = 0; h < c.length; h++) {
      let f = c[h], u = Math.floor(o / 2) - Math.floor(f.length / 2);
      for (let m = 0; m < f.length; m++) {
        let p = u + m, b = d + h;
        p > 1 && p < o - 2 && b > 0 && b < s - 1 && (r[p][b] = f[m]);
      }
    }
    return r;
  },
  getAttachmentPoint: gt
}, an = {
  getDimensions: At,
  render(t, e, n) {
    let o = xt("doublecircle", n.useAscii);
    return St(t, e, o, n.useAscii);
  },
  getAttachmentPoint: gt
}, cn = {
  getDimensions(t, e) {
    let n = rt(t), o = Math.max(...n.map((l) => l.length), 0), s = n.length, r = 2 * e.padding + o, i = r + 2, a = s + 2 * e.padding + 2, c = a + 2;
    return {
      width: i,
      height: c,
      labelArea: {
        x: 1 + e.padding,
        y: 2 + e.padding,
        width: o,
        height: s
      },
      gridColumns: [1, r, 1],
      gridRows: [2, a - 2, 2]
    };
  },
  render(t, e, n) {
    let { width: o, height: s } = e, r = it(o - 1, s - 1), i = n.useAscii ? "-" : "\u2500", a = n.useAscii ? "|" : "\u2502";
    r[0][0] = n.useAscii ? "." : "\u256D";
    for (let h = 1; h < o - 1; h++) r[h][0] = i;
    r[o - 1][0] = n.useAscii ? "." : "\u256E", r[0][1] = a;
    for (let h = 1; h < o - 1; h++) r[h][1] = i;
    r[o - 1][1] = a;
    for (let h = 2; h < s - 2; h++)
      r[0][h] = a, r[o - 1][h] = a;
    r[0][s - 2] = a;
    for (let h = 1; h < o - 1; h++) r[h][s - 2] = i;
    r[o - 1][s - 2] = a, r[0][s - 1] = n.useAscii ? "'" : "\u2570";
    for (let h = 1; h < o - 1; h++) r[h][s - 1] = i;
    r[o - 1][s - 1] = n.useAscii ? "'" : "\u256F";
    let c = rt(t), d = Math.floor(s / 2) - Math.floor((c.length - 1) / 2);
    for (let h = 0; h < c.length; h++) {
      let f = c[h], u = Math.floor(o / 2) - Math.floor(f.length / 2);
      for (let m = 0; m < f.length; m++) {
        let p = u + m, b = d + h;
        p > 0 && p < o - 1 && b > 1 && b < s - 2 && (r[p][b] = f[m]);
      }
    }
    return r;
  },
  getAttachmentPoint: gt
}, ln = {
  getDimensions: At,
  render(t, e, n) {
    let o = xt("asymmetric", n.useAscii);
    return St(t, e, o, n.useAscii);
  },
  getAttachmentPoint: gt
}, fn = {
  getDimensions: At,
  render(t, e, n) {
    let o = xt("trapezoid", n.useAscii);
    return St(t, e, o, n.useAscii);
  },
  getAttachmentPoint: gt
}, dn = {
  getDimensions: At,
  render(t, e, n) {
    let o = xt("trapezoid-alt", n.useAscii);
    return St(t, e, o, n.useAscii);
  },
  getAttachmentPoint: gt
};

// node_modules/beautiful-mermaid/src/ascii/shapes/index.ts
var Mr = /* @__PURE__ */ new Map([
  // Core shapes
  ["rectangle", me],
  ["rounded", nn],
  ["diamond", Qe],
  ["stadium", rn],
  ["circle", Ze],
  // Batch 1 additions
  ["subroutine", sn],
  ["doublecircle", an],
  ["hexagon", on],
  // Batch 2 additions
  ["cylinder", cn],
  ["asymmetric", ln],
  ["trapezoid", fn],
  ["trapezoid-alt", dn],
  // State diagram pseudo-states
  ["state-start", tn],
  ["state-end", en]
]);
function un(t) {
  return Mr.get(t) ?? me;
}
function hn(t, e, n) {
  return un(t).getDimensions(e, n);
}
function gn(t, e, n, o) {
  return un(t).getAttachmentPoint(e, n, o);
}

// node_modules/beautiful-mermaid/src/ascii/draw.ts
function wr(t, e) {
  return vr(t, e);
}
function vr(t, e) {
  let n = t.gridCoord, o = e.config.useAscii, s = 0;
  for (let v = 0; v < 2; v++)
    s += e.columnWidth.get(n.x + v) ?? 0;
  let r = 0;
  for (let v = 0; v < 2; v++)
    r += e.rowHeight.get(n.y + v) ?? 0;
  let i = { x: 0, y: 0 }, a = { x: s, y: r }, c = it(Math.max(i.x, a.x), Math.max(i.y, a.y)), l = xt(t.shape, o), d = t.shape === "state-end", h = o ? d ? "=" : "-" : d ? "\u2550" : "\u2500", f = o ? d ? "\u2016" : "|" : d ? "\u2551" : "\u2502", m = d ? o ? { tl: "#", tr: "#", bl: "#", br: "#" } : { tl: "\u2554", tr: "\u2557", bl: "\u255A", br: "\u255D" } : l;
  for (let v = i.x + 1; v < a.x; v++) c[v][i.y] = h;
  for (let v = i.x + 1; v < a.x; v++) c[v][a.y] = h;
  for (let v = i.y + 1; v < a.y; v++) c[i.x][v] = f;
  for (let v = i.y + 1; v < a.y; v++) c[a.x][v] = f;
  c[i.x][i.y] = m.tl, c[a.x][i.y] = m.tr, c[i.x][a.y] = m.bl, c[a.x][a.y] = m.br;
  let p = t.displayLabel, b = rt(p), B = i.y + Math.floor(r / 2) - Math.floor((b.length - 1) / 2);
  for (let v = 0; v < b.length; v++) {
    let H = b[v], L = i.x + Math.floor(s / 2) - Math.ceil(H.length / 2) + 1;
    for (let q = 0; q < H.length; q++)
      L + q >= 0 && L + q < c.length && B + v >= 0 && B + v < c[0].length && (c[L + q][B + v] = H[q]);
  }
  return c;
}
function pn(t, e) {
  return wr(t, e);
}
function oe(t, e, n = 1) {
  let o = 0;
  for (let v of t)
    for (let H of v)
      o = Math.max(o, H.length);
  let r = o + 2 * n + 2, i = 0;
  for (let v of t)
    i += Math.max(v.length, 1);
  let a = t.length - 1, c = i + a + 2, l = e ? "-" : "\u2500", d = e ? "|" : "\u2502", h = e ? "+" : "\u250C", f = e ? "+" : "\u2510", u = e ? "+" : "\u2514", m = e ? "+" : "\u2518", p = e ? "+" : "\u251C", b = e ? "+" : "\u2524", A = it(r - 1, c - 1);
  A[0][0] = h;
  for (let v = 1; v < r - 1; v++) A[v][0] = l;
  A[r - 1][0] = f, A[0][c - 1] = u;
  for (let v = 1; v < r - 1; v++) A[v][c - 1] = l;
  A[r - 1][c - 1] = m;
  for (let v = 1; v < c - 1; v++)
    A[0][v] = d, A[r - 1][v] = d;
  let B = 1;
  for (let v = 0; v < t.length; v++) {
    let H = t[v], L = H.length > 0 ? H : [""];
    for (let q of L) {
      let ut = 1 + n;
      for (let O = 0; O < q.length; O++)
        A[ut + O][B] = q[O];
      B++;
    }
    if (v < t.length - 1) {
      A[0][B] = p;
      for (let q = 1; q < r - 1; q++) A[q][B] = l;
      A[r - 1][B] = b, B++;
    }
  }
  return A;
}
var Ar = {
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
function xe(t, e, n, o, s, r, i = "solid") {
  let a = pt(e, n), c = [], l = Ar[i], d = r ? l.h.ascii : l.h.unicode, h = r ? l.v.ascii : l.v.unicode;
  if (x(a, _))
    for (let f = e.y - o; f >= n.y - s; f--)
      c.push({ x: e.x, y: f }), t[e.x][f] = h;
  else if (x(a, Y))
    for (let f = e.y + o; f <= n.y + s; f++)
      c.push({ x: e.x, y: f }), t[e.x][f] = h;
  else if (x(a, j))
    for (let f = e.x - o; f >= n.x - s; f--)
      c.push({ x: f, y: e.y }), t[f][e.y] = d;
  else if (x(a, P))
    for (let f = e.x + o; f <= n.x + s; f++)
      c.push({ x: f, y: e.y }), t[f][e.y] = d;
  else if (x(a, Mt)) {
    for (let f = e.x - o; f >= n.x; f--)
      c.push({ x: f, y: e.y }), t[f][e.y] = d;
    for (let f = e.y - 1; f >= n.y - s; f--)
      c.push({ x: n.x, y: f }), t[n.x][f] = h;
  } else if (x(a, wt)) {
    for (let f = e.x + o; f <= n.x; f++)
      c.push({ x: f, y: e.y }), t[f][e.y] = d;
    for (let f = e.y - 1; f >= n.y - s; f--)
      c.push({ x: n.x, y: f }), t[n.x][f] = h;
  } else if (x(a, vt)) {
    for (let f = e.x - o; f >= n.x; f--)
      c.push({ x: f, y: e.y }), t[f][e.y] = d;
    for (let f = e.y + 1; f <= n.y + s; f++)
      c.push({ x: n.x, y: f }), t[n.x][f] = h;
  } else if (x(a, Rt))
    if (n.x - e.x <= 1)
      for (let u = e.y + o; u <= n.y + s; u++)
        c.push({ x: e.x, y: u }), t[e.x][u] = h;
    else {
      for (let u = e.x + o; u <= n.x; u++)
        c.push({ x: u, y: e.y }), t[u][e.y] = d;
      for (let u = e.y + 1; u <= n.y + s; u++)
        c.push({ x: n.x, y: u }), t[n.x][u] = h;
    }
  return c;
}
function Sr(t, e) {
  if (e.path.length === 0) {
    let d = ht(t.canvas);
    return [d, d, d, d, d, d];
  }
  let n = Er(t, e), [o, s, r] = Dr(t, e.path, e.style), i = Tr(t, e.path, s[0], e.from.shape), a;
  e.hasArrowEnd ? a = mn(
    t,
    s[s.length - 1],
    r[r.length - 1]
  ) : a = ht(t.canvas);
  let c;
  if (e.hasArrowStart && s.length > 0) {
    let h = s[0][0], f = Rr(r[0]), u = { x: h.x, y: h.y };
    x(r[0], P) ? u.x = h.x - 1 : x(r[0], j) ? u.x = h.x + 1 : x(r[0], Y) ? u.y = h.y - 1 : x(r[0], _) && (u.y = h.y + 1), c = mn(t, [h, u], f);
  } else
    c = ht(t.canvas);
  let l = Lr(t, e.path);
  return [o, i, a, c, l, n];
}
function Rr(t) {
  return x(t, _) ? Y : x(t, Y) ? _ : x(t, j) ? P : x(t, P) ? j : x(t, Mt) ? Rt : x(t, wt) ? vt : x(t, vt) ? wt : x(t, Rt) ? Mt : Gt;
}
function Dr(t, e, n = "solid") {
  let o = ht(t.canvas), s = e[0], r = [], i = [];
  for (let a = 1; a < e.length; a++) {
    let c = e[a], l = Et(t, s), d = Et(t, c);
    if (Kt(l, d)) {
      s = c;
      continue;
    }
    let h = pt(s, c), f = xe(o, l, d, 1, -1, t.config.useAscii, n);
    f.length === 0 && f.push(l), r.push(f), i.push(h), s = c;
  }
  return [o, r, i];
}
function Tr(t, e, n, o) {
  let s = ht(t.canvas);
  if (t.config.useAscii || o === "state-start" || o === "state-end")
    return s;
  let r = n[0], i = pt(e[0], e[1]);
  return x(i, _) ? s[r.x][r.y + 1] = "\u2534" : x(i, Y) ? s[r.x][r.y - 1] = "\u252C" : x(i, j) ? s[r.x + 1][r.y] = "\u2524" : x(i, P) && (s[r.x - 1][r.y] = "\u251C"), s;
}
function mn(t, e, n) {
  let o = ht(t.canvas);
  if (e.length === 0) return o;
  let s = e[0], r = e[e.length - 1], i = pt(s, r);
  (e.length === 1 || x(i, Gt)) && (i = n);
  let a;
  return t.config.useAscii ? x(i, _) ? a = "^" : x(i, Y) ? a = "v" : x(i, j) ? a = "<" : x(i, P) ? a = ">" : x(n, _) ? a = "^" : x(n, Y) ? a = "v" : x(n, j) ? a = "<" : x(n, P) ? a = ">" : a = "*" : x(i, _) ? a = "\u25B2" : x(i, Y) ? a = "\u25BC" : x(i, j) ? a = "\u25C4" : x(i, P) ? a = "\u25BA" : x(i, wt) ? a = "\u25E5" : x(i, Mt) ? a = "\u25E4" : x(i, Rt) ? a = "\u25E2" : x(i, vt) ? a = "\u25E3" : x(n, _) ? a = "\u25B2" : x(n, Y) ? a = "\u25BC" : x(n, j) ? a = "\u25C4" : x(n, P) ? a = "\u25BA" : x(n, wt) ? a = "\u25E5" : x(n, Mt) ? a = "\u25E4" : x(n, Rt) ? a = "\u25E2" : x(n, vt) ? a = "\u25E3" : a = "\u25CF", o[r.x][r.y] = a, o;
}
function Lr(t, e) {
  let n = ht(t.canvas);
  for (let o = 1; o < e.length - 1; o++) {
    let s = e[o], r = Et(t, s), i = pt(e[o - 1], s), a = pt(s, e[o + 1]), c;
    t.config.useAscii ? c = "+" : x(i, P) && x(a, Y) || x(i, _) && x(a, j) ? c = "\u2510" : x(i, P) && x(a, _) || x(i, Y) && x(a, j) ? c = "\u2518" : x(i, j) && x(a, Y) || x(i, _) && x(a, P) ? c = "\u250C" : x(i, j) && x(a, _) || x(i, Y) && x(a, P) ? c = "\u2514" : c = "+", n[r.x][r.y] = c;
  }
  return n;
}
function Er(t, e) {
  let n = ht(t.canvas);
  if (e.text.length === 0) return n;
  let o = bn(t, e.labelLine), s;
  if (e.path.length >= 2) {
    let r = e.path[0].y, i = e.path[e.path.length - 1].y;
    i < r ? s = !0 : i > r && (s = !1);
  }
  return kr(n, o, e.text, s), n;
}
function kr(t, e, n, o) {
  if (e.length < 2) return;
  let s = Math.min(e[0].x, e[1].x), r = Math.max(e[0].x, e[1].x), i = Math.min(e[0].y, e[1].y), a = Math.max(e[0].y, e[1].y), c = s + Math.floor((r - s) / 2), l = i + Math.floor((a - i) / 2);
  if (o !== void 0 && s === r) {
    let f = a - i, u = Math.max(1, Math.floor(f / 4));
    o ? l = l + u : l = l - u;
  }
  let d = rt(n), h = l - Math.floor((d.length - 1) / 2);
  for (let f = 0; f < d.length; f++) {
    let u = d[f], m = c - Math.floor(u.length / 2);
    de(t, { x: m, y: h + f }, u);
  }
}
function jt(t, e, n) {
  let o = e.gridCoord, s = 0;
  for (let c = 0; c < 2; c++)
    s += t.columnWidth.get(o.x + c) ?? 0;
  let r = 0;
  for (let c = 0; c < 2; c++)
    r += t.rowHeight.get(o.y + c) ?? 0;
  let i = {
    width: s + 1,
    height: r + 1,
    labelArea: { x: 0, y: 0, width: 0, height: 0 },
    gridColumns: [0, 0, 0],
    gridRows: [0, 0, 0]
  }, a = e.drawingCoord;
  return gn(e.shape, n, i, a);
}
function Gr(t, e, n) {
  let o = ht(t.canvas);
  if (!e.pathToJunction || e.pathToJunction.length === 0)
    return [o, o, o, o, o, o];
  let s = ht(t.canvas), r = t.config.useAscii, i = e.pathToJunction.map((d, h) => n.type === "fan-in" && h === 0 ? jt(t, e.from, e.startDir) : n.type === "fan-out" && h === e.pathToJunction.length - 1 ? jt(t, e.to, e.endDir) : Et(t, d));
  for (let d = 1; d < i.length; d++) {
    let h = i[d - 1], f = i[d];
    Kt(h, f) || xe(s, h, f, 1, -1, r, e.style);
  }
  let a = ht(t.canvas);
  for (let d = 1; d < e.pathToJunction.length - 1; d++) {
    let h = e.pathToJunction[d], f = Et(t, h), u = pt(e.pathToJunction[d - 1], h), m = pt(h, e.pathToJunction[d + 1]), p;
    r ? p = "+" : x(u, P) && x(m, Y) || x(u, _) && x(m, j) ? p = "\u2510" : x(u, P) && x(m, _) || x(u, Y) && x(m, j) ? p = "\u2518" : x(u, j) && x(m, Y) || x(u, _) && x(m, P) ? p = "\u250C" : x(u, j) && x(m, _) || x(u, Y) && x(m, P) ? p = "\u2514" : p = "+", a[f.x][f.y] = p;
  }
  let c = ht(t.canvas);
  if (n.type === "fan-in" && e.pathToJunction.length >= 2) {
    let d = i[0], h = pt(e.pathToJunction[0], e.pathToJunction[1]);
    r || (x(h, _) ? c[d.x][d.y] = "\u2534" : x(h, Y) ? c[d.x][d.y] = "\u252C" : x(h, j) ? c[d.x][d.y] = "\u2524" : x(h, P) && (c[d.x][d.y] = "\u251C"));
  }
  let l = ht(t.canvas);
  return [s, c, o, o, a, l];
}
function Ir(t, e) {
  let n = ht(t.canvas), o = ht(t.canvas);
  if (e.sharedPath.length < 2)
    return [n, o];
  let s = t.config.useAscii, r = e.edges[0]?.style ?? "solid", i = t.config.graphDirection, a = e.sharedPath.map((c, l) => {
    if (e.type === "fan-in" && l === e.sharedPath.length - 1) {
      let d = i === "TD" ? _ : j;
      return jt(t, e.sharedNode, d);
    }
    if (e.type === "fan-out" && l === 0) {
      let d = i === "TD" ? Y : P;
      return jt(t, e.sharedNode, d);
    }
    return Et(t, c);
  });
  for (let c = 1; c < a.length; c++) {
    let l = a[c - 1], d = a[c];
    Kt(l, d) || xe(n, l, d, 1, -1, s, r);
  }
  for (let c = 1; c < e.sharedPath.length - 1; c++) {
    let l = e.sharedPath[c], d = Et(t, l), h = pt(e.sharedPath[c - 1], l), f = pt(l, e.sharedPath[c + 1]), u;
    s ? u = "+" : x(h, P) && x(f, Y) || x(h, _) && x(f, j) ? u = "\u2510" : x(h, P) && x(f, _) || x(h, Y) && x(f, j) ? u = "\u2518" : x(h, j) && x(f, Y) || x(h, _) && x(f, P) ? u = "\u250C" : x(h, j) && x(f, _) || x(h, Y) && x(f, P) ? u = "\u2514" : u = "+", o[d.x][d.y] = u;
  }
  return [n, o];
}
function Nr(t, e) {
  let n = ht(t.canvas);
  if (e.sharedPath.length < 2) return n;
  let o = e.sharedPath.length - 1, s = e.sharedPath[o - 1], r = e.sharedPath[o], i = pt(s, r), a = t.config.graphDirection, c = a === "TD" ? _ : j, l = jt(t, e.sharedNode, c);
  a === "TD" ? l.y -= 1 : l.x -= 1;
  let d;
  return t.config.useAscii ? x(i, _) ? d = "^" : x(i, Y) ? d = "v" : x(i, j) ? d = "<" : x(i, P) ? d = ">" : d = "v" : x(i, _) ? d = "\u25B2" : x(i, Y) ? d = "\u25BC" : x(i, j) ? d = "\u25C4" : x(i, P) ? d = "\u25BA" : d = "\u25BC", n[l.x][l.y] = d, n;
}
function Yr(t, e) {
  let n = ht(t.canvas);
  if (!e.pathToJunction || e.pathToJunction.length < 2) return n;
  let o = e.pathToJunction.length - 1, s = e.pathToJunction[o - 1], r = e.pathToJunction[o], i = pt(s, r), a = t.config.graphDirection, c = a === "TD" ? _ : j, l = jt(t, e.to, c);
  a === "TD" ? l.y -= 1 : l.x -= 1;
  let d;
  return t.config.useAscii ? x(i, _) ? d = "^" : x(i, Y) ? d = "v" : x(i, j) ? d = "<" : x(i, P) ? d = ">" : d = "v" : x(i, _) ? d = "\u25B2" : x(i, Y) ? d = "\u25BC" : x(i, j) ? d = "\u25C4" : x(i, P) ? d = "\u25BA" : d = "\u25BC", n[l.x][l.y] = d, n;
}
function $r(t, e) {
  let n = ht(t.canvas);
  if (!e.junctionPoint) return n;
  let o = Et(t, e.junctionPoint), s = t.config.useAscii, r = !1, i = !1, a = !1, c = !1;
  if (e.sharedPath.length >= 2) {
    let d = e.type === "fan-in" ? 0 : e.sharedPath.length - 1, h = e.type === "fan-in" ? 1 : e.sharedPath.length - 2, f = pt(
      e.sharedPath[d],
      e.sharedPath[h]
    );
    x(f, Y) ? i = !0 : x(f, _) ? r = !0 : x(f, P) ? c = !0 : x(f, j) && (a = !0);
  }
  for (let d of e.edges)
    if (d.pathToJunction && d.pathToJunction.length >= 2) {
      let h = e.type === "fan-in" ? d.pathToJunction.length - 1 : 0, f = e.type === "fan-in" ? d.pathToJunction.length - 2 : 1, u = pt(
        d.pathToJunction[f],
        d.pathToJunction[h]
      );
      x(u, Y) ? r = !0 : x(u, _) ? i = !0 : x(u, P) ? a = !0 : x(u, j) && (c = !0);
    }
  let l;
  return s ? l = "+" : r && i && a && c ? l = "\u253C" : i && a && c && !r ? l = "\u252C" : r && a && c && !i ? l = "\u2534" : r && i && c && !a ? l = "\u251C" : r && i && a && !c ? l = "\u2524" : a && c ? l = "\u2500" : r && i ? l = "\u2502" : i && c ? l = "\u250C" : i && a ? l = "\u2510" : r && c ? l = "\u2514" : r && a ? l = "\u2518" : l = "\u253C", n[o.x][o.y] = l, n;
}
function Br(t, e) {
  let n = t.maxX - t.minX, o = t.maxY - t.minY;
  if (n <= 0 || o <= 0) return it(0, 0);
  let s = { x: 0, y: 0 }, r = { x: n, y: o }, i = it(n, o);
  if (e.config.useAscii) {
    for (let a = s.x + 1; a < r.x; a++) i[a][s.y] = "-";
    for (let a = s.x + 1; a < r.x; a++) i[a][r.y] = "-";
    for (let a = s.y + 1; a < r.y; a++) i[s.x][a] = "|";
    for (let a = s.y + 1; a < r.y; a++) i[r.x][a] = "|";
    i[s.x][s.y] = "+", i[r.x][s.y] = "+", i[s.x][r.y] = "+", i[r.x][r.y] = "+";
  } else {
    for (let a = s.x + 1; a < r.x; a++) i[a][s.y] = "\u2500";
    for (let a = s.x + 1; a < r.x; a++) i[a][r.y] = "\u2500";
    for (let a = s.y + 1; a < r.y; a++) i[s.x][a] = "\u2502";
    for (let a = s.y + 1; a < r.y; a++) i[r.x][a] = "\u2502";
    i[s.x][s.y] = "\u250C", i[r.x][s.y] = "\u2510", i[s.x][r.y] = "\u2514", i[r.x][r.y] = "\u2518";
  }
  return i;
}
function Xr(t, e) {
  let n = t.maxX - t.minX, o = t.maxY - t.minY;
  if (n <= 0 || o <= 0) return [it(0, 0), { x: 0, y: 0 }];
  let s = it(n, o), r = rt(t.name);
  for (let i = 0; i < r.length; i++) {
    let a = r[i], c = 1 + i, l = Math.floor(n / 2) - Math.floor(a.length / 2);
    l < 1 && (l = 1);
    for (let d = 0; d < a.length; d++)
      l + d < n && c < o && (s[l + d][c] = a[d]);
  }
  return [s, { x: t.minX, y: t.minY }];
}
function Pr(t) {
  function e(o) {
    return o.parent === null ? 0 : 1 + e(o.parent);
  }
  let n = [...t];
  return n.sort((o, s) => e(o) - e(s)), n;
}
function pe(t, e, n, o) {
  for (let s = 0; s < e.length; s++)
    for (let r = 0; r < (e[0]?.length ?? 0); r++) {
      let i = e[s]?.[r];
      if (i && i !== " ") {
        let a = s + n.x, c = r + n.y;
        a >= 0 && c >= 0 && Bt(t, a, c, o);
      }
    }
}
function _t(t, e, n, o) {
  for (let s of e)
    pe(t, s, n, o);
}
function Hr(t, e, n) {
  let o = (s) => /^[┌┐└┘├┤┬┴┼│─╭╮╰╯+\-|.':]$/.test(s);
  for (let s = 0; s < e.length; s++)
    for (let r = 0; r < (e[0]?.length ?? 0); r++) {
      let i = e[s]?.[r];
      if (i && i !== " ") {
        let a = s + n.x, c = r + n.y;
        a >= 0 && c >= 0 && Bt(t, a, c, o(i) ? "border" : "text");
      }
    }
}
function xn(t) {
  let e = t.config.useAscii, n = { x: 0, y: 0 }, o = Pr(t.subgraphs);
  for (let f of o) {
    let u = Br(f, t), m = { x: f.minX, y: f.minY };
    t.canvas = Lt(t.canvas, m, e, u), pe(t.roleCanvas, u, m, "border");
  }
  for (let f of t.nodes)
    !f.drawn && f.drawingCoord && f.drawing && (t.canvas = Lt(t.canvas, f.drawingCoord, e, f.drawing), Hr(t.roleCanvas, f.drawing, f.drawingCoord), f.drawn = !0);
  let s = [], r = [], i = [], a = [], c = [], l = [], d = [], h = /* @__PURE__ */ new Set();
  for (let f of t.edges)
    if (f.bundle && f.pathToJunction) {
      let u = f.bundle, [m, p, , , b, A] = Gr(t, f, u);
      if (s.push(m), r.push(b), c.push(p), l.push(A), !h.has(u)) {
        h.add(u);
        let [B, v] = Ir(t, u);
        if (s.push(B), r.push(v), u.type === "fan-in") {
          let L = Nr(t, u);
          i.push(L);
        }
        let H = $r(t, u);
        d.push(H);
      }
      if (u.type === "fan-out" && f.hasArrowEnd) {
        let B = Yr(t, f);
        i.push(B);
      }
    } else {
      let [u, m, p, b, A, B] = Sr(t, f);
      s.push(u), r.push(A), i.push(p), a.push(b), c.push(m), l.push(B);
    }
  t.canvas = Lt(t.canvas, n, e, ...s), _t(t.roleCanvas, s, n, "line"), t.canvas = Lt(t.canvas, n, e, ...r), _t(t.roleCanvas, r, n, "corner"), t.canvas = Lt(t.canvas, n, e, ...d), _t(t.roleCanvas, d, n, "junction"), t.canvas = Lt(t.canvas, n, e, ...i), _t(t.roleCanvas, i, n, "arrow"), t.canvas = Lt(t.canvas, n, e, ...c), _t(t.roleCanvas, c, n, "junction"), t.canvas = Lt(t.canvas, n, e, ...a), _t(t.roleCanvas, a, n, "arrow"), t.canvas = Lt(t.canvas, n, e, ...l);
  for (let f of l) He(t.canvas, f);
  _t(t.roleCanvas, l, n, "text");
  for (let f of t.subgraphs) {
    if (f.nodes.length === 0) continue;
    let [u, m] = Xr(f, t);
    t.canvas = Lt(t.canvas, m, e, u), pe(t.roleCanvas, u, m, "text");
  }
  return t.canvas;
}

// node_modules/beautiful-mermaid/src/ascii/grid.ts
function Et(t, e, n) {
  let o = n ? { x: e.x + n.x, y: e.y + n.y } : e, s = 0;
  for (let c = 0; c < o.x; c++)
    s += t.columnWidth.get(c) ?? 0;
  let r = 0;
  for (let c = 0; c < o.y; c++)
    r += t.rowHeight.get(c) ?? 0;
  let i = t.columnWidth.get(o.x) ?? 0, a = t.rowHeight.get(o.y) ?? 0;
  return {
    x: s + Math.floor(i / 2) + t.offsetX,
    y: r + Math.floor(a / 2) + t.offsetY
  };
}
function bn(t, e) {
  return e.map((n) => Et(t, n));
}
function Ut(t, e, n, o) {
  let s = o ?? jr(t, e);
  if (t.grid.has(It(n)))
    return s === "LR" ? Ut(t, e, { x: n.x, y: n.y + 4 }, s) : Ut(t, e, { x: n.x + 4, y: n.y }, s);
  for (let r = 0; r < 3; r++)
    for (let i = 0; i < 3; i++) {
      let a = { x: n.x + r, y: n.y + i };
      t.grid.set(It(a), e);
    }
  return e.gridCoord = n, n;
}
function Wr(t, e) {
  let n = e.gridCoord, o = t.config.boxBorderPadding, s = hn(e.shape, e.displayLabel, {
    useAscii: t.config.useAscii,
    padding: o
  }), r = s.gridColumns, i = s.gridRows;
  for (let a = 0; a < r.length; a++) {
    let c = n.x + a, l = t.columnWidth.get(c) ?? 0;
    t.columnWidth.set(c, Math.max(l, r[a]));
  }
  for (let a = 0; a < i.length; a++) {
    let c = n.y + a, l = t.rowHeight.get(c) ?? 0;
    t.rowHeight.set(c, Math.max(l, i[a]));
  }
  if (n.x > 0) {
    let a = t.columnWidth.get(n.x - 1) ?? 0;
    t.columnWidth.set(n.x - 1, Math.max(a, t.config.paddingX));
  }
  if (n.y > 0) {
    let a = t.config.paddingY;
    zr(t, e) && (a += 4);
    let c = t.rowHeight.get(n.y - 1) ?? 0;
    t.rowHeight.set(n.y - 1, Math.max(c, a));
  }
}
function yn(t, e) {
  for (let n of e)
    t.columnWidth.has(n.x) || t.columnWidth.set(n.x, Math.floor(t.config.paddingX / 2)), t.rowHeight.has(n.y) || t.rowHeight.set(n.y, Math.floor(t.config.paddingY / 2));
}
function be(t, e) {
  return t.subgraphs.some((n) => n.nodes.includes(e));
}
function yt(t, e) {
  let n = null;
  for (let o of t.subgraphs)
    o.nodes.includes(e) && (!n || _r(n, o)) && (n = o);
  return n;
}
function _r(t, e) {
  let n = e;
  for (; n !== null; ) {
    if (n === t) return !0;
    n = n.parent;
  }
  return !1;
}
function jr(t, e) {
  let n = yt(t, e);
  return n?.direction ? n.direction : t.config.graphDirection;
}
function zr(t, e) {
  let n = yt(t, e);
  if (!n) return !1;
  let o = !1;
  for (let s of t.edges)
    if (s.to === e && yt(t, s.from) !== n) {
      o = !0;
      break;
    }
  if (!o) return !1;
  for (let s of n.nodes) {
    if (s === e || !s.gridCoord) continue;
    let r = !1;
    for (let i of t.edges)
      if (i.to === s && yt(t, i.from) !== n) {
        r = !0;
        break;
      }
    if (r && s.gridCoord.y < e.gridCoord.y)
      return !1;
  }
  return !0;
}
function Cn(t, e) {
  if (e.nodes.length === 0) return;
  let n = 1e6, o = 1e6, s = -1e6, r = -1e6;
  for (let c of e.children)
    Cn(t, c), c.nodes.length > 0 && (n = Math.min(n, c.minX), o = Math.min(o, c.minY), s = Math.max(s, c.maxX), r = Math.max(r, c.maxY));
  for (let c of e.nodes) {
    if (!c.drawingCoord || !c.drawing) continue;
    let l = c.drawingCoord.x, d = c.drawingCoord.y, h = l + c.drawing.length - 1, f = d + c.drawing[0].length - 1;
    n = Math.min(n, l), o = Math.min(o, d), s = Math.max(s, h), r = Math.max(r, f);
  }
  let i = 2, a = 2;
  e.minX = n - i, e.minY = o - i - a, e.maxX = s + i, e.maxY = r + i;
}
function Or(t) {
  let n = t.subgraphs.filter((o) => o.parent === null && o.nodes.length > 0);
  for (let o = 0; o < n.length; o++)
    for (let s = o + 1; s < n.length; s++) {
      let r = n[o], i = n[s];
      r.minX < i.maxX && r.maxX > i.minX && (r.maxY >= i.minY - 1 && r.minY < i.minY ? i.minY = r.maxY + 1 + 1 : i.maxY >= r.minY - 1 && i.minY < r.minY && (r.minY = i.maxY + 1 + 1)), r.minY < i.maxY && r.maxY > i.minY && (r.maxX >= i.minX - 1 && r.minX < i.minX ? i.minX = r.maxX + 1 + 1 : i.maxX >= r.minX - 1 && i.minX < r.minX && (r.minX = i.maxX + 1 + 1));
    }
}
function Fr(t) {
  for (let e of t.subgraphs)
    Cn(t, e);
  Or(t);
}
function Jr(t) {
  if (t.subgraphs.length === 0) return;
  let e = 0, n = 0;
  for (let r of t.subgraphs)
    e = Math.min(e, r.minX), n = Math.min(n, r.minY);
  let o = -e, s = -n;
  if (!(o === 0 && s === 0)) {
    t.offsetX = o, t.offsetY = s;
    for (let r of t.subgraphs)
      r.minX += o, r.minY += s, r.maxX += o, r.maxY += s;
    for (let r of t.nodes)
      r.drawingCoord && (r.drawingCoord.x += o, r.drawingCoord.y += s);
  }
}
function Mn(t) {
  let e = t.config.graphDirection, n = new Array(100).fill(0), o = /* @__PURE__ */ new Set(), s = [];
  for (let f of t.nodes) {
    o.has(f.name) || s.push(f), o.add(f.name);
    for (let u of ye(t, f))
      o.add(u.name);
  }
  let r = s.filter((f) => {
    let u = yt(t, f);
    if (!u) return !0;
    for (let m of t.edges)
      if (m.to === f && yt(t, m.from) !== u)
        return !1;
    return !0;
  }), i = !1, a = !1;
  for (let f of r)
    be(t, f) ? ye(t, f).length > 0 && (a = !0) : i = !0;
  let c = e === "LR" && i && a, l, d = [];
  c ? (l = r.filter((f) => !be(t, f)), d = r.filter((f) => be(t, f))) : l = r;
  for (let f of l) {
    let u = e === "LR" ? { x: 0, y: n[0] } : { x: n[0], y: 0 };
    Ut(t, t.nodes[f.index], u), n[0] = n[0] + 4;
  }
  if (c && d.length > 0)
    for (let u of d) {
      let m = e === "LR" ? { x: 4, y: n[4] } : { x: n[4], y: 4 };
      Ut(t, t.nodes[u.index], m), n[4] = n[4] + 4;
    }
  let h = l.length + d.length;
  for (; h < t.nodes.length; ) {
    let f = h;
    for (let u of t.nodes) {
      if (u.gridCoord === null) continue;
      let m = u.gridCoord;
      for (let p of ye(t, u)) {
        if (p.gridCoord !== null) continue;
        let b = yt(t, u), A = yt(t, p), B = b && b === A && b.direction ? b.direction : t.config.graphDirection, v = B === "LR" ? m.x + 4 : m.y + 4, H;
        B !== t.config.graphDirection ? H = B === "LR" ? m.y : m.x : H = n[v];
        let L = B === "LR" ? { x: v, y: H } : { x: H, y: v };
        Ut(t, t.nodes[p.index], L, B), B === t.config.graphDirection && (n[v] = H + 4), h++;
      }
    }
    if (h === f) break;
  }
  for (let f of t.nodes)
    Wr(t, f);
  t.bundles = qe(t), Ve(t);
  for (let f of t.edges) {
    if (f.bundle && f.path.length > 0) {
      yn(t, f.path), he(t, f);
      continue;
    }
    Je(t, f), yn(t, f.path), he(t, f);
  }
  for (let f of t.nodes)
    f.drawingCoord = Et(t, f.gridCoord), f.drawing = pn(f, t);
  je(t.canvas, t.columnWidth, t.rowHeight), ze(t.roleCanvas, t.columnWidth, t.rowHeight), Fr(t), Jr(t);
}
function Ur(t, e) {
  return t.edges.filter((n) => n.from.name === e.name);
}
function ye(t, e) {
  return Ur(t, e).map((n) => n.to);
}

// node_modules/beautiful-mermaid/src/sequence/parser.ts
function wn(t) {
  let e = {
    actors: [],
    messages: [],
    blocks: [],
    notes: []
  }, n = /* @__PURE__ */ new Set(), o = [];
  for (let s = 1; s < t.length; s++) {
    let r = t[s], i = r.match(/^(participant|actor)\s+(\S+?)(?:\s+as\s+(.+))?$/);
    if (i) {
      let f = i[1], u = i[2], m = i[3]?.trim() ?? u, p = dt(m);
      n.has(u) || (n.add(u), e.actors.push({ id: u, label: p, type: f }));
      continue;
    }
    let a = r.match(/^Note\s+(left of|right of|over)\s+([^:]+):\s*(.+)$/i);
    if (a) {
      let f = a[1].toLowerCase(), u = a[2].trim(), m = dt(a[3].trim()), p = u.split(",").map((A) => A.trim());
      for (let A of p)
        qt(e, n, A);
      let b = "over";
      f === "left of" ? b = "left" : f === "right of" && (b = "right"), e.notes.push({
        actorIds: p,
        text: m,
        position: b,
        afterIndex: e.messages.length - 1
      });
      continue;
    }
    let c = r.match(/^(loop|alt|opt|par|critical|break|rect)\s*(.*)$/);
    if (c) {
      let f = c[1], u = c[2]?.trim() ?? "", m = dt(u);
      o.push({
        type: f,
        label: m,
        startIndex: e.messages.length,
        dividers: []
      });
      continue;
    }
    let l = r.match(/^(else|and)\s*(.*)$/);
    if (l && o.length > 0) {
      let f = l[2]?.trim() ?? "", u = dt(f);
      o[o.length - 1].dividers.push({
        index: e.messages.length,
        label: u
      });
      continue;
    }
    if (r === "end" && o.length > 0) {
      let f = o.pop();
      e.blocks.push({
        type: f.type,
        label: f.label,
        startIndex: f.startIndex,
        endIndex: Math.max(e.messages.length - 1, f.startIndex),
        dividers: f.dividers
      });
      continue;
    }
    let d = r.match(
      /^(\S+?)\s*(--?>?>|--?[)x]|--?>>|--?>)\s*([+-]?)(\S+?)\s*:\s*(.+)$/
    );
    if (d) {
      let f = d[1], u = d[2], m = d[3], p = d[4], b = dt(d[5].trim());
      qt(e, n, f), qt(e, n, p);
      let A = u.startsWith("--") ? "dashed" : "solid", B = u.includes(">>") || u.includes("x") ? "filled" : "open", v = {
        from: f,
        to: p,
        label: b,
        lineStyle: A,
        arrowHead: B
      };
      m === "+" && (v.activate = !0), m === "-" && (v.deactivate = !0), e.messages.push(v);
      continue;
    }
    let h = r.match(
      /^(\S+?)\s*(->>|-->>|-\)|--\)|-x|--x|->|-->)\s*([+-]?)(\S+?)\s*:\s*(.+)$/
    );
    if (h) {
      let f = h[1], u = h[2], m = h[3], p = h[4], b = dt(h[5].trim());
      qt(e, n, f), qt(e, n, p);
      let A = u.startsWith("--") ? "dashed" : "solid", B = u.includes(">>") || u.includes("x") ? "filled" : "open", v = { from: f, to: p, label: b, lineStyle: A, arrowHead: B };
      m === "+" && (v.activate = !0), m === "-" && (v.deactivate = !0), e.messages.push(v);
      continue;
    }
  }
  return e;
}
function qt(t, e, n) {
  e.has(n) || (e.add(n), t.actors.push({ id: n, label: n, type: "participant" }));
}

// node_modules/beautiful-mermaid/src/ascii/sequence.ts
function vn(t, e, n, o) {
  let s = t.split(`
`).map((g) => g.trim()).filter((g) => g.length > 0 && !g.startsWith("%%")), r = wn(s);
  if (r.actors.length === 0) return "";
  let i = e.useAscii, a = i ? "-" : "\u2500", c = i ? "|" : "\u2502", l = i ? "+" : "\u250C", d = i ? "+" : "\u2510", h = i ? "+" : "\u2514", f = i ? "+" : "\u2518", u = i ? "+" : "\u252C", m = i ? "+" : "\u2534", p = i ? "+" : "\u251C", b = i ? "+" : "\u2524", A = /* @__PURE__ */ new Map();
  r.actors.forEach((g, y) => A.set(g.id, y));
  let B = 1, H = r.actors.map((g) => re(g.label) + 2 * B + 2).map((g) => Math.ceil(g / 2)), L = r.actors.map((g) => ge(g.label) + 2), q = Math.max(...L, 3), ut = new Array(Math.max(r.actors.length - 1, 0)).fill(0);
  for (let g of r.messages) {
    let y = A.get(g.from), E = A.get(g.to);
    if (y === E) continue;
    let T = Math.min(y, E), k = Math.max(y, E), R = re(g.label) + 4, J = k - T, G = Math.ceil(R / J);
    for (let S = T; S < k; S++)
      ut[S] = Math.max(ut[S], G);
  }
  let O = [H[0]];
  for (let g = 1; g < r.actors.length; g++) {
    let y = Math.max(
      H[g - 1] + H[g] + 2,
      ut[g - 1] + 2,
      10
    );
    O[g] = O[g - 1] + y;
  }
  let ft = [], I = [], U = /* @__PURE__ */ new Map(), C = /* @__PURE__ */ new Map(), F = /* @__PURE__ */ new Map(), V = [], K = q;
  for (let g = 0; g < r.messages.length; g++) {
    for (let k = 0; k < r.blocks.length; k++)
      r.blocks[k].startIndex === g && (K += 2, U.set(k, K - 1));
    for (let k = 0; k < r.blocks.length; k++)
      for (let R = 0; R < r.blocks[k].dividers.length; R++)
        r.blocks[k].dividers[R].index === g && (K += 1, F.set(`${k}:${R}`, K), K += 1);
    K += 1;
    let y = r.messages[g], E = y.from === y.to, T = ge(y.label);
    E ? (I[g] = K + 1, ft[g] = K, K += 2 + T) : (I[g] = K, ft[g] = K + T, K += T + 1);
    for (let k = 0; k < r.notes.length; k++)
      if (r.notes[k].afterIndex === g) {
        K += 1;
        let R = r.notes[k], J = rt(R.text), G = Math.max(...J.map(($) => $.length)) + 4, S = J.length + 2, z = A.get(R.actorIds[0]) ?? 0, D;
        if (R.position === "left")
          D = O[z] - G - 1;
        else if (R.position === "right")
          D = O[z] + 2;
        else if (R.actorIds.length >= 2) {
          let $ = A.get(R.actorIds[1]) ?? z;
          D = Math.floor((O[z] + O[$]) / 2) - Math.floor(G / 2);
        } else
          D = O[z] - Math.floor(G / 2);
        D = Math.max(0, D), V.push({ x: D, y: K, width: G, height: S, lines: J }), K += S;
      }
    for (let k = 0; k < r.blocks.length; k++)
      r.blocks[k].endIndex === g && (K += 1, C.set(k, K), K += 1);
  }
  K += 1;
  let at = K, ct = at + q, ot = O[O.length - 1] ?? 0, st = H[H.length - 1] ?? 0, w = ot + st + 2;
  for (let g = 0; g < r.messages.length; g++) {
    let y = r.messages[g];
    if (y.from === y.to) {
      let E = A.get(y.from), T = O[E] + 6 + 2 + y.label.length;
      w = Math.max(w, T + 1);
    }
  }
  for (let g of V)
    w = Math.max(w, g.x + g.width + 1);
  let X = it(w, ct - 1), N = $t(w, ct - 1);
  function M(g, y, E, T) {
    g >= 0 && g < X.length && y >= 0 && y < (X[0]?.length ?? 0) && (X[g][y] = E, Bt(N, g, y, T));
  }
  function W(g, y, E) {
    let T = rt(E), k = re(E), R = k + 2 * B + 2, J = T.length + 2, G = g - Math.floor(R / 2);
    M(G, y, l, "border");
    for (let z = 1; z < R - 1; z++) M(G + z, y, a, "border");
    M(G + R - 1, y, d, "border");
    for (let z = 0; z < T.length; z++) {
      let D = y + 1 + z;
      M(G, D, c, "border"), M(G + R - 1, D, c, "border");
      let $ = T[z], tt = G + 1 + B + Math.floor((k - $.length) / 2);
      for (let Z = 0; Z < $.length; Z++)
        M(tt + Z, D, $[Z], "text");
    }
    let S = y + J - 1;
    M(G, S, h, "border");
    for (let z = 1; z < R - 1; z++) M(G + z, S, a, "border");
    M(G + R - 1, S, f, "border");
  }
  for (let g = 0; g < r.actors.length; g++) {
    let y = O[g];
    for (let E = q; E <= at; E++)
      M(y, E, c, "line");
  }
  for (let g = 0; g < r.actors.length; g++) {
    let y = r.actors[g];
    W(O[g], 0, y.label), W(O[g], at, y.label), i || (M(O[g], q - 1, u, "junction"), M(O[g], at, m, "junction"));
  }
  for (let g = 0; g < r.messages.length; g++) {
    let y = r.messages[g], E = A.get(y.from), T = A.get(y.to), k = O[E], R = O[T], J = E === T, G = y.lineStyle === "dashed", S = y.arrowHead === "filled", z = G ? i ? "." : "\u254C" : a;
    if (J) {
      let D = ft[g], $ = Math.max(4, 4);
      M(k, D, p, "junction");
      for (let et = k + 1; et < k + $; et++) M(et, D, z, "line");
      M(k + $, D, i ? "+" : "\u2510", "corner"), M(k + $, D + 1, c, "line");
      let tt = k + $ + 2;
      for (let et = 0; et < y.label.length; et++)
        tt + et < w && M(tt + et, D + 1, y.label[et], "text");
      let Z = S ? i ? "<" : "\u25C0" : i ? "<" : "\u25C1";
      M(k, D + 2, Z, "arrow");
      for (let et = k + 1; et < k + $; et++) M(et, D + 2, z, "line");
      M(k + $, D + 2, i ? "+" : "\u2518", "corner");
    } else {
      let D = I[g], $ = ft[g], tt = k < R, Z = Math.floor((k + R) / 2), et = rt(y.label);
      for (let nt = 0; nt < et.length; nt++) {
        let lt = et[nt], mt = Z - Math.floor(lt.length / 2), Dt = D + nt;
        for (let Ct = 0; Ct < lt.length; Ct++) {
          let kt = mt + Ct;
          kt >= 0 && kt < w && M(kt, Dt, lt[Ct], "text");
        }
      }
      if (tt) {
        for (let lt = k + 1; lt < R; lt++) M(lt, $, z, "line");
        M(R, $, S ? i ? ">" : "\u25B6" : i ? ">" : "\u25B7", "arrow");
      } else {
        for (let lt = R + 1; lt < k; lt++) M(lt, $, z, "line");
        M(R, $, S ? i ? "<" : "\u25C0" : i ? "<" : "\u25C1", "arrow");
      }
    }
  }
  for (let g = 0; g < r.blocks.length; g++) {
    let y = r.blocks[g], E = U.get(g), T = C.get(g);
    if (E === void 0 || T === void 0) continue;
    let k = w, R = 0;
    for (let D = y.startIndex; D <= y.endIndex && !(D >= r.messages.length); D++) {
      let $ = r.messages[D], tt = A.get($.from) ?? 0, Z = A.get($.to) ?? 0;
      k = Math.min(k, O[Math.min(tt, Z)]), R = Math.max(R, O[Math.max(tt, Z)]);
    }
    let J = Math.max(0, k - 4), G = Math.min(w - 1, R + 4);
    M(J, E, l, "border");
    for (let D = J + 1; D < G; D++) M(D, E, a, "border");
    M(G, E, d, "border");
    let S = y.label ? `${y.type} [${y.label}]` : y.type, z = rt(S);
    for (let D = 0; D < z.length && E + D < T; D++) {
      let $ = z[D];
      for (let tt = 0; tt < $.length && J + 1 + tt < G; tt++)
        M(J + 1 + tt, E + D, $[tt], "text");
    }
    M(J, T, h, "border");
    for (let D = J + 1; D < G; D++) M(D, T, a, "border");
    M(G, T, f, "border");
    for (let D = E + 1; D < T; D++)
      M(J, D, c, "border"), M(G, D, c, "border");
    for (let D = 0; D < y.dividers.length; D++) {
      let $ = F.get(`${g}:${D}`);
      if ($ === void 0) continue;
      let tt = Q();
      M(J, $, p, "junction");
      for (let et = J + 1; et < G; et++) M(et, $, tt, "line");
      M(G, $, b, "junction");
      let Z = y.dividers[D].label;
      if (Z) {
        let et = `[${Z}]`;
        for (let nt = 0; nt < et.length && J + 1 + nt < G; nt++)
          M(J + 1 + nt, $, et[nt], "text");
      }
    }
  }
  for (let g of V) {
    Tt(X, g.x + g.width, g.y + g.height), Nt(N, g.x + g.width, g.y + g.height), M(g.x, g.y, l, "border");
    for (let E = 1; E < g.width - 1; E++) M(g.x + E, g.y, a, "border");
    M(g.x + g.width - 1, g.y, d, "border");
    for (let E = 0; E < g.lines.length; E++) {
      let T = g.y + 1 + E;
      M(g.x, T, c, "border"), M(g.x + g.width - 1, T, c, "border");
      for (let k = 0; k < g.lines[E].length; k++)
        M(g.x + 2 + k, T, g.lines[E][k], "text");
    }
    let y = g.y + g.height - 1;
    M(g.x, y, h, "border");
    for (let E = 1; E < g.width - 1; E++) M(g.x + E, y, a, "border");
    M(g.x + g.width - 1, y, f, "border");
  }
  return Pt(X, { roleCanvas: N, colorMode: n, theme: o });
  function Q() {
    return i ? "-" : "\u254C";
  }
}

// node_modules/beautiful-mermaid/src/class/parser.ts
function Sn(t) {
  let e = {
    classes: [],
    relationships: [],
    namespaces: []
  }, n = /* @__PURE__ */ new Map(), o = null, s = null, r = 0;
  for (let i = 1; i < t.length; i++) {
    let a = t[i];
    if (s && r > 0) {
      if (a === "}") {
        r--, r === 0 && (s = null);
        continue;
      }
      let m = a.match(/^<<(\w+)>>$/);
      if (m) {
        s.annotation = m[1];
        continue;
      }
      let p = An(a);
      p && (p.isMethod ? s.methods.push(p.member) : s.attributes.push(p.member));
      continue;
    }
    let c = a.match(/^namespace\s+(\S+)\s*\{$/);
    if (c) {
      o = { name: c[1], classIds: [] };
      continue;
    }
    if (a === "}" && o) {
      e.namespaces.push(o), o = null;
      continue;
    }
    let l = a.match(/^class\s+(\S+?)(?:\s*~(\w+)~)?\s*\{$/);
    if (l) {
      let m = l[1], p = l[2], b = zt(n, m);
      p && (b.label = `${m}<${p}>`), s = b, r = 1, o && o.classIds.push(m);
      continue;
    }
    let d = a.match(/^class\s+(\S+?)(?:\s*~(\w+)~)?\s*$/);
    if (d) {
      let m = d[1], p = d[2], b = zt(n, m);
      p && (b.label = `${m}<${p}>`), o && o.classIds.push(m);
      continue;
    }
    let h = a.match(/^class\s+(\S+?)\s*\{\s*<<(\w+)>>\s*\}$/);
    if (h) {
      let m = zt(n, h[1]);
      m.annotation = h[2];
      continue;
    }
    let f = a.match(/^(\S+?)\s*:\s*(.+)$/);
    if (f) {
      let m = f[2];
      if (!m.match(/<\|--|--|\*--|o--|-->|\.\.>|\.\.\|>/)) {
        let p = zt(n, f[1]), b = An(m);
        b && (b.isMethod ? p.methods.push(b.member) : p.attributes.push(b.member));
        continue;
      }
    }
    let u = qr(a);
    if (u) {
      zt(n, u.from), zt(n, u.to), e.relationships.push(u);
      continue;
    }
  }
  return e.classes = [...n.values()], e;
}
function zt(t, e) {
  let n = t.get(e);
  return n || (n = { id: e, label: e, attributes: [], methods: [] }, t.set(e, n)), n;
}
function An(t) {
  let e = t.trim().replace(/;$/, "");
  if (!e) return null;
  let n = "", o = e;
  /^[+\-#~]/.test(o) && (n = o[0], o = o.slice(1).trim());
  let s = o.match(/^(.+?)\(([^)]*)\)(?:\s*(.+))?$/);
  if (s) {
    let d = s[1].trim(), h = s[2]?.trim() || void 0, f = s[3]?.trim(), u = d.endsWith("$") || o.includes("$"), m = d.endsWith("*") || o.includes("*");
    return {
      member: {
        visibility: n,
        name: d.replace(/[$*]$/, ""),
        type: f || void 0,
        isStatic: u,
        isAbstract: m,
        isMethod: !0,
        params: h
      },
      isMethod: !0
    };
  }
  let r = o.split(/\s+/), i, a;
  r.length >= 2 ? (a = r[0], i = r.slice(1).join(" ")) : i = r[0] ?? o;
  let c = i.endsWith("$"), l = i.endsWith("*");
  return {
    member: {
      visibility: n,
      name: i.replace(/[$*]$/, ""),
      type: a || void 0,
      isStatic: c,
      isAbstract: l,
      isMethod: !1
    },
    isMethod: !1
  };
}
function qr(t) {
  let e = t.match(
    /^(\S+?)\s+(?:"([^"]*?)"\s+)?(<\|--|<\|\.\.|\*--|o--|-->|--\*|--o|--\|>|\.\.>|\.\.\|>|<--|<\.\.?|--)\s+(?:"([^"]*?)"\s+)?(\S+?)(?:\s*:\s*(.+))?$/
  );
  if (!e) return null;
  let n = e[1], o = e[2], s = o ? dt(o) : void 0, r = e[3].trim(), i = e[4], a = i ? dt(i) : void 0, c = e[5], l = e[6]?.trim(), d = l ? dt(l) : void 0, h = Vr(r);
  return h ? { from: n, to: c, type: h.type, markerAt: h.markerAt, label: d, fromCardinality: s, toCardinality: a } : null;
}
function Vr(t) {
  switch (t.trim()) {
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

// node_modules/beautiful-mermaid/src/ascii/class-diagram.ts
function Kr(t) {
  return /^[┌┐└┘├┤┬┴┼│─╭╮╰╯+\-|]$/.test(t) ? "border" : "text";
}
function Rn(t) {
  let e = t.visibility || "", n = t.type ? `: ${t.type}` : "";
  return `${e}${t.name}${n}`;
}
function Qr(t) {
  let e = [];
  t.annotation && e.push(`<<${t.annotation}>>`);
  let n = rt(t.label);
  e.push(...n);
  let o = t.attributes.map(Rn), s = t.methods.map(Rn);
  return o.length === 0 && s.length === 0 ? [e] : s.length === 0 ? [e, o] : [e, o, s];
}
function Zr(t, e) {
  return { type: t, markerAt: e, dashed: t === "dependency" || t === "realization" };
}
function Wt(t, e, n) {
  switch (t) {
    case "inheritance":
    case "realization":
      return n === "down" ? e ? "^" : "\u25B3" : n === "up" ? e ? "v" : "\u25BD" : n === "left" ? e ? ">" : "\u25C1" : e ? "<" : "\u25B7";
    case "composition":
      return e ? "*" : "\u25C6";
    case "aggregation":
      return e ? "o" : "\u25C7";
    case "association":
    case "dependency":
      return n === "down" ? e ? "v" : "\u25BC" : n === "up" ? e ? "^" : "\u25B2" : n === "left" ? e ? "<" : "\u25C0" : e ? ">" : "\u25B6";
  }
}
function Dn(t, e, n, o) {
  let s = t.split(`
`).map((w) => w.trim()).filter((w) => w.length > 0 && !w.startsWith("%%")), r = Sn(s);
  if (r.classes.length === 0) return "";
  let i = e.useAscii, a = 4, c = 3, l = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Map(), h = /* @__PURE__ */ new Map();
  for (let w of r.classes) {
    let X = Qr(w);
    l.set(w.id, X);
    let N = 0;
    for (let g of X)
      for (let y of g) N = Math.max(N, y.length);
    let M = N + 4, W = 0;
    for (let g of X) W += Math.max(g.length, 1);
    let Q = W + (X.length - 1) + 2;
    d.set(w.id, M), h.set(w.id, Q);
  }
  let f = /* @__PURE__ */ new Map();
  for (let w of r.classes) f.set(w.id, w);
  let u = /* @__PURE__ */ new Map(), m = /* @__PURE__ */ new Map();
  for (let w of r.relationships) {
    let X = w.type === "inheritance" || w.type === "realization", N = X && w.markerAt === "to" ? w.to : w.from, M = X && w.markerAt === "to" ? w.from : w.to;
    u.has(M) || u.set(M, /* @__PURE__ */ new Set()), u.get(M).add(N), m.has(N) || m.set(N, /* @__PURE__ */ new Set()), m.get(N).add(M);
  }
  let p = /* @__PURE__ */ new Map(), A = r.classes.filter((w) => !u.has(w.id) || u.get(w.id).size === 0).map((w) => w.id);
  for (let w of A) p.set(w, 0);
  let B = r.classes.length - 1, v = 0;
  for (; v < A.length; ) {
    let w = A[v++], X = m.get(w);
    if (X)
      for (let N of X) {
        let M = (p.get(w) ?? 0) + 1;
        M > B || (!p.has(N) || p.get(N) < M) && (p.set(N, M), A.push(N));
      }
  }
  for (let w of r.classes)
    p.has(w.id) || p.set(w.id, 0);
  let H = Math.max(...p.values(), 0), L = Array.from({ length: H + 1 }, () => []);
  for (let w of r.classes)
    L[p.get(w.id)].push(w.id);
  let q = /* @__PURE__ */ new Map(), ut = 0;
  for (let w = 0; w <= H; w++) {
    let X = L[w];
    if (X.length === 0) continue;
    let N = 0, M = 0;
    for (let W of X) {
      let Q = f.get(W), g = d.get(W), y = h.get(W);
      q.set(W, {
        cls: Q,
        sections: l.get(W),
        x: N,
        y: ut,
        width: g,
        height: y
      }), N += g + a, M = Math.max(M, y);
    }
    ut += M + c;
  }
  let O = 0, ft = 0;
  for (let w of q.values())
    O = Math.max(O, w.x + w.width), ft = Math.max(ft, w.y + w.height);
  O += 4, ft += 2;
  let I = it(O - 1, ft - 1), U = $t(O - 1, ft - 1);
  function C(w, X, N, M) {
    w >= 0 && w < I.length && X >= 0 && X < (I[0]?.length ?? 0) && (I[w][X] = N, Bt(U, w, X, M));
  }
  for (let w of q.values()) {
    let X = oe(w.sections, i);
    for (let N = 0; N < X.length; N++)
      for (let M = 0; M < X[0].length; M++) {
        let W = X[N][M];
        if (W !== " ") {
          let Q = w.x + N, g = w.y + M;
          Q < O && g < ft && C(Q, g, W, Kr(W));
        }
      }
  }
  let F = [];
  for (let w of q.values())
    F.push({
      x1: w.x,
      x2: w.x + w.width - 1,
      y1: w.y,
      y2: w.y + w.height - 1
    });
  function V(w, X, N) {
    for (let [M, W] of q.entries())
      if (!N?.has(M) && w >= W.x && w <= W.x + W.width - 1 && X >= W.y && X <= W.y + W.height - 1)
        return !0;
    return !1;
  }
  function K(w, X, N, M) {
    let W = !0;
    for (let Q = Math.min(X, N); Q <= Math.max(X, N); Q++)
      if (V(w, Q, M)) {
        W = !1;
        break;
      }
    if (W) return w;
    for (let Q = 1; Q < O + 10; Q++) {
      let g = w + Q;
      W = !0;
      for (let E = Math.min(X, N); E <= Math.max(X, N); E++)
        if (V(g, E, M)) {
          W = !1;
          break;
        }
      if (W) return g;
      let y = w - Q;
      if (y >= 0) {
        W = !0;
        for (let E = Math.min(X, N); E <= Math.max(X, N); E++)
          if (V(y, E, M)) {
            W = !1;
            break;
          }
        if (W) return y;
      }
    }
    return O + 2;
  }
  let at = i ? "-" : "\u2500", ct = i ? "|" : "\u2502", ot = i ? "." : "\u254C", st = i ? ":" : "\u250A";
  for (let w of r.relationships) {
    let X = q.get(w.from), N = q.get(w.to);
    if (!X || !N) continue;
    let M = Zr(w.type, w.markerAt), W = M.dashed ? ot : at, Q = M.dashed ? st : ct, g = /* @__PURE__ */ new Set([w.from, w.to]), y = X.x + Math.floor(X.width / 2), E = X.y + X.height - 1, T = N.x + Math.floor(N.width / 2), k = N.y;
    if (E < k) {
      let R = K(y, E + 1, k - 1, g), J = R !== y;
      if (R >= O && Tt(I, R + 2, ft), J) {
        let G = E + 1, S = k - 1, z = Math.min(y, R), D = Math.max(y, R);
        for (let $ = z; $ <= D; $++)
          C($, G, W, "line");
        !i && G < (I[0]?.length ?? 0) && (y < R ? (C(y, G, "\u2514", "corner"), C(R, G, "\u2510", "corner")) : (C(y, G, "\u2518", "corner"), C(R, G, "\u250C", "corner")));
        for (let $ = G + 1; $ <= S; $++)
          C(R, $, Q, "line");
        if (R !== T) {
          let $ = Math.min(R, T), tt = Math.max(R, T);
          for (let Z = $; Z <= tt; Z++)
            C(Z, S, W, "line");
          !i && S < (I[0]?.length ?? 0) && (R < T ? (C(R, S, "\u2514", "corner"), C(T, S, "\u2510", "corner")) : (C(R, S, "\u2518", "corner"), C(T, S, "\u250C", "corner")));
        }
        if (M.markerAt === "to") {
          let $ = Wt(M.type, i, "down");
          C(T, S, $, "arrow");
        }
        if (M.markerAt === "from") {
          let $ = Wt(M.type, i, "down");
          C(y, E + 1, $, "arrow");
        }
      } else {
        let G = E + Math.floor((k - E) / 2);
        for (let S = E + 1; S <= G; S++)
          C(y, S, Q, "line");
        if (y !== T && G < (I[0]?.length ?? 0)) {
          let S = Math.min(y, T), z = Math.max(y, T);
          for (let D = S; D <= z; D++)
            C(D, G, W, "line");
          i || (C(y, G, y < T ? "\u2514" : "\u2518", "corner"), C(T, G, y < T ? "\u2510" : "\u250C", "corner"));
        }
        for (let S = G + 1; S < k; S++)
          C(T, S, Q, "line");
        M.markerAt === "to" && C(T, k - 1, Wt(M.type, i, "down"), "arrow"), M.markerAt === "from" && C(y, E + 1, Wt(M.type, i, "down"), "arrow");
      }
    } else if (N.y + N.height - 1 < X.y) {
      let R = X.y, J = N.y + N.height - 1, G = J + Math.floor((R - J) / 2);
      for (let S = R - 1; S >= G; S--)
        C(y, S, Q, "line");
      if (y !== T) {
        let S = Math.min(y, T), z = Math.max(y, T);
        for (let D = S; D <= z; D++)
          C(D, G, W, "line");
        !i && G >= 0 && G < ft && (C(y, G, y < T ? "\u250C" : "\u2510", "corner"), C(T, G, y < T ? "\u2518" : "\u2514", "corner"));
      }
      for (let S = G - 1; S > J; S--)
        C(T, S, Q, "line");
      if (M.markerAt === "from") {
        let S = Wt(M.type, i, "up"), z = R - 1;
        for (let D = 0; D < S.length; D++)
          C(y - Math.floor(S.length / 2) + D, z, S[D], "arrow");
      }
      if (M.markerAt === "to") {
        let z = M.type === "inheritance" || M.type === "realization" ? "down" : "up", D = Wt(M.type, i, z), $ = J + 1;
        for (let tt = 0; tt < D.length; tt++)
          C(T - Math.floor(D.length / 2) + tt, $, D[tt], "arrow");
      }
    } else {
      let R = Math.max(E, N.y + N.height - 1) + 2;
      Tt(I, O, R + 1), Nt(U, O, R + 1);
      for (let S = E + 1; S <= R; S++)
        C(y, S, Q, "line");
      let J = Math.min(y, T), G = Math.max(y, T);
      for (let S = J; S <= G; S++)
        C(S, R, W, "line");
      for (let S = R - 1; S >= N.y + N.height; S--)
        C(T, S, Q, "line");
      if (M.markerAt === "from") {
        let S = Wt(M.type, i, "down"), z = E + 1;
        for (let D = 0; D < S.length; D++)
          C(y - Math.floor(S.length / 2) + D, z, S[D], "arrow");
      }
      if (M.markerAt === "to") {
        let S = Wt(M.type, i, "up"), z = N.y + N.height;
        for (let D = 0; D < S.length; D++)
          C(T - Math.floor(S.length / 2) + D, z, S[D], "arrow");
      }
    }
    if (w.label) {
      let R = rt(w.label), J = Math.max(...R.map((Z) => Z.length)) + 2, G, S;
      if (E < k)
        G = Math.floor((E + 1 + k - 1) / 2), S = Math.floor((y + T) / 2);
      else if (N.y + N.height - 1 < X.y) {
        let Z = N.y + N.height - 1;
        G = Math.floor((Z + 1 + X.y - 1) / 2), S = Math.floor((y + T) / 2);
      } else
        G = Math.max(E, N.y + N.height - 1) + 2, S = Math.floor((y + T) / 2);
      let z = G, D = Math.floor(R.length / 2), $ = !1;
      for (let Z = 0; Z < R.length; Z++) {
        let et = z - D + Z, nt = S - Math.floor(J / 2), lt = Math.max(0, nt);
        for (let mt = lt; mt < lt + J; mt++)
          if (V(mt, et, g)) {
            $ = !0;
            break;
          }
        if ($) break;
      }
      if ($) {
        let Z = E + 1, et = k - 1;
        for (let nt = Z; nt <= et; nt++) {
          let lt = !0, mt = S - Math.floor(J / 2), Dt = Math.max(0, mt);
          for (let Ct = Dt; Ct < Dt + J; Ct++)
            if (V(Ct, nt, g)) {
              lt = !1;
              break;
            }
          if (lt) {
            z = nt;
            break;
          }
        }
      }
      let tt = z - D;
      for (let Z = 0; Z < R.length; Z++) {
        let et = ` ${R[Z]} `, nt = S - Math.floor(et.length / 2), lt = Math.max(0, nt), mt = tt + Z, Dt = lt + et.length;
        Dt > 0 && mt >= 0 && (Tt(I, Math.max(Dt, 1), Math.max(mt + 1, 1)), Nt(U, Math.max(Dt, 1), Math.max(mt + 1, 1)));
        for (let Ct = 0; Ct < et.length; Ct++) {
          let kt = lt + Ct;
          kt >= 0 && mt >= 0 && C(kt, mt, et[Ct], "text");
        }
      }
    }
  }
  return Pt(I, { roleCanvas: U, colorMode: n, theme: o });
}

// node_modules/beautiful-mermaid/src/er/parser.ts
function Ln(t) {
  let e = {
    entities: [],
    relationships: []
  }, n = /* @__PURE__ */ new Map(), o = null;
  for (let s = 1; s < t.length; s++) {
    let r = t[s];
    if (o) {
      if (r === "}") {
        o = null;
        continue;
      }
      let c = to(r);
      c && o.attributes.push(c);
      continue;
    }
    let i = r.match(/^(\S+)\s*\{$/);
    if (i) {
      let c = i[1];
      o = Ce(n, c);
      continue;
    }
    let a = eo(r);
    if (a) {
      Ce(n, a.entity1), Ce(n, a.entity2), e.relationships.push(a);
      continue;
    }
  }
  return e.entities = [...n.values()], e;
}
function Ce(t, e) {
  let n = t.get(e);
  return n || (n = { id: e, label: e, attributes: [] }, t.set(e, n)), n;
}
function to(t) {
  let e = t.match(/^(\S+)\s+(\S+)(?:\s+(.+))?$/);
  if (!e) return null;
  let n = e[1], o = e[2], s = e[3]?.trim() ?? "", r = [], i, a = s.match(/"([^"]*)"/);
  a && (i = dt(a[1]));
  let c = s.replace(/"[^"]*"/, "").trim();
  for (let l of c.split(/\s+/)) {
    let d = l.toUpperCase();
    (d === "PK" || d === "FK" || d === "UK") && r.push(d);
  }
  return { type: n, name: o, keys: r, comment: i };
}
function eo(t) {
  let e = t.match(/^(\S+)\s+([|o}{]+(?:--|\.\.)[|o}{]+)\s+(\S+)\s*:\s*(.+)$/);
  if (!e) return null;
  let n = e[1], o = e[2], s = e[3], r = e[4].trim().replace(/^["']|["']$/g, ""), i = dt(r), a = o.match(/^([|o}{]+)(--|\.\.?)([|o}{]+)$/);
  if (!a) return null;
  let c = a[1], l = a[2], d = a[3], h = Tn(c), f = Tn(d), u = l === "--";
  return !h || !f ? null : { entity1: n, entity2: s, cardinality1: h, cardinality2: f, label: i, identifying: u };
}
function Tn(t) {
  let e = t.split("").sort().join("");
  return e === "||" ? "one" : e === "o|" ? "zero-one" : e === "|}" || e === "{|" ? "many" : e === "{o" || e === "o{" ? "zero-many" : null;
}

// node_modules/beautiful-mermaid/src/ascii/er-diagram.ts
function no(t) {
  return /^[┌┐└┘├┤┬┴┼│─╭╮╰╯+\-|]$/.test(t) ? "border" : "text";
}
function ro(t) {
  return `${t.keys.length > 0 ? t.keys.join(",") + " " : "   "}${t.type} ${t.name}`;
}
function oo(t) {
  let e = rt(t.label), n = t.attributes.map(ro);
  return n.length === 0 ? [e] : [e, n];
}
function ie(t, e, n = !1) {
  if (e)
    switch (t) {
      case "one":
        return "|";
      case "zero-one":
        return "o|";
      case "many":
        return n ? "<" : ">";
      case "zero-many":
        return n ? "o<" : ">o";
    }
  else
    switch (t) {
      case "one":
        return "\u2502";
      case "zero-one":
        return "\u25CB\u2502";
      case "many":
        return n ? "\u255F" : "\u2562";
      case "zero-many":
        return n ? "\u25CB\u255F" : "\u2562\u25CB";
    }
}
function io(t) {
  let e = /* @__PURE__ */ new Set(), n = [], o = /* @__PURE__ */ new Map();
  for (let r of t.entities)
    o.set(r.id, /* @__PURE__ */ new Set());
  for (let r of t.relationships)
    o.get(r.entity1)?.add(r.entity2), o.get(r.entity2)?.add(r.entity1);
  function s(r, i) {
    let a = [r];
    for (; a.length > 0; ) {
      let c = a.pop();
      if (!e.has(c)) {
        e.add(c), i.add(c);
        for (let l of o.get(c) ?? [])
          e.has(l) || a.push(l);
      }
    }
  }
  for (let r of t.entities)
    if (!e.has(r.id)) {
      let i = /* @__PURE__ */ new Set();
      s(r.id, i), i.size > 0 && n.push(i);
    }
  return n;
}
function En(t, e, n, o) {
  let s = t.split(`
`).map((I) => I.trim()).filter((I) => I.length > 0 && !I.startsWith("%%")), r = Ln(s);
  if (r.entities.length === 0) return "";
  let i = e.useAscii, a = 6, c = 4, l = 6, d = /* @__PURE__ */ new Map(), h = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Map();
  for (let I of r.entities) {
    u.set(I.id, I);
    let U = oo(I);
    d.set(I.id, U);
    let C = 0;
    for (let at of U)
      for (let ct of at) C = Math.max(C, ct.length);
    let F = C + 4, V = 0;
    for (let at of U) V += Math.max(at.length, 1);
    let K = V + (U.length - 1) + 2;
    h.set(I.id, F), f.set(I.id, K);
  }
  let m = io(r), p = /* @__PURE__ */ new Map(), b = 0;
  for (let I of m) {
    let U = r.entities.filter((ct) => I.has(ct.id)), C = Math.max(2, Math.ceil(Math.sqrt(U.length))), F = 0, V = 0, K = 0, at = b;
    for (let ct of U) {
      let ot = h.get(ct.id), st = f.get(ct.id);
      K >= C && (b += V + c, F = 0, V = 0, K = 0), p.set(ct.id, {
        entity: ct,
        sections: d.get(ct.id),
        x: F,
        y: b,
        width: ot,
        height: st
      }), F += ot + a, V = Math.max(V, st), K++;
    }
    b += V + l;
  }
  let A = 0, B = 0;
  for (let I of p.values())
    A = Math.max(A, I.x + I.width), B = Math.max(B, I.y + I.height);
  A += 4, B += 2;
  let v = it(A - 1, B - 1), H = $t(A - 1, B - 1);
  function L(I, U, C, F) {
    I >= 0 && I < v.length && U >= 0 && U < (v[0]?.length ?? 0) && (v[I][U] = C, Bt(H, I, U, F));
  }
  for (let I of p.values()) {
    let U = oe(I.sections, i);
    for (let C = 0; C < U.length; C++)
      for (let F = 0; F < U[0].length; F++) {
        let V = U[C][F];
        if (V !== " ") {
          let K = I.x + C, at = I.y + F;
          K < A && at < B && L(K, at, V, no(V));
        }
      }
  }
  let q = i ? "-" : "\u2500", ut = i ? "|" : "\u2502", O = i ? "." : "\u254C", ft = i ? ":" : "\u250A";
  for (let I of r.relationships) {
    let U = p.get(I.entity1), C = p.get(I.entity2);
    if (!U || !C) continue;
    let F = I.identifying ? q : O, V = I.identifying ? ut : ft, K = U.x + Math.floor(U.width / 2), at = U.y + Math.floor(U.height / 2), ct = C.x + Math.floor(C.width / 2), ot = C.y + Math.floor(C.height / 2);
    if (Math.abs(at - ot) < Math.max(U.height, C.height)) {
      let [w, X] = K < ct ? [U, C] : [C, U], [N, M] = K < ct ? [I.cardinality1, I.cardinality2] : [I.cardinality2, I.cardinality1], W = w.x + w.width, Q = X.x - 1, g = w.y + Math.floor(w.height / 2);
      for (let T = W; T <= Q; T++)
        L(T, g, F, "line");
      let y = ie(N, i, !1);
      for (let T = 0; T < y.length; T++)
        L(W + T, g, y[T], "arrow");
      let E = ie(M, i, !0);
      for (let T = 0; T < E.length; T++)
        L(Q - E.length + 1 + T, g, E[T], "arrow");
      if (I.label) {
        let T = rt(I.label), k = Math.floor((W + Q) / 2);
        for (let R = 0; R < T.length; R++) {
          let J = T[R], G = Math.max(W, k - Math.floor(J.length / 2)), S = g + 1 + R;
          Tt(v, Math.max(G + J.length, 1), Math.max(S + 1, 1)), Nt(H, Math.max(G + J.length, 1), Math.max(S + 1, 1));
          for (let z = 0; z < J.length; z++) {
            let D = G + z;
            D >= W && D <= Q && L(D, S, J[z], "text");
          }
        }
      }
    } else {
      let [w, X] = at < ot ? [U, C] : [C, U], [N, M] = at < ot ? [I.cardinality1, I.cardinality2] : [I.cardinality2, I.cardinality1], W = w.y + w.height, Q = X.y - 1, g = w.x + Math.floor(w.width / 2);
      for (let R = W; R <= Q; R++)
        L(g, R, V, "line");
      let y = X.x + Math.floor(X.width / 2);
      if (g !== y) {
        let R = Math.floor((W + Q) / 2), J = Math.min(g, y), G = Math.max(g, y);
        for (let S = J; S <= G; S++)
          L(S, R, F, "line");
        for (let S = R + 1; S <= Q; S++)
          L(y, S, V, "line");
      }
      let E = ie(N, i, !1);
      for (let R = 0; R < E.length; R++)
        L(g - Math.floor(E.length / 2) + R, W, E[R], "arrow");
      let T = g !== y ? y : g, k = ie(M, i, !0);
      for (let R = 0; R < k.length; R++)
        L(T - Math.floor(k.length / 2) + R, Q, k[R], "arrow");
      if (I.label) {
        let R = rt(I.label), G = Math.floor((W + Q) / 2) - Math.floor((R.length - 1) / 2);
        for (let S = 0; S < R.length; S++) {
          let z = R[S], D = g + 2, $ = G + S;
          if ($ >= 0)
            for (let tt = 0; tt < z.length; tt++) {
              let Z = D + tt;
              Z >= 0 && (Tt(v, Z + 1, $ + 1), Nt(H, Z + 1, $ + 1), L(Z, $, z[tt], "text"));
            }
        }
      }
    }
  }
  return Pt(v, { roleCanvas: H, colorMode: n, theme: o });
}

// node_modules/beautiful-mermaid/src/xychart/parser.ts
function Gn(t) {
  let e = {}, n = {}, o = [], s, r = !1;
  for (let i of t) {
    if (/^xychart(-beta)?\b/i.test(i)) {
      /\bhorizontal\b/i.test(i) && (r = !0);
      continue;
    }
    let a = i.match(/^title\s+"([^"]+)"/);
    if (a) {
      s = a[1];
      continue;
    }
    let c = i.match(/^x-axis\s+(?:"([^"]*)"\s*)?\[([^\]]+)\]/);
    if (c) {
      c[1] && (e.title = c[1]), e.categories = c[2].split(",").map((m) => m.trim());
      continue;
    }
    let l = i.match(/^x-axis\s+(?:"([^"]*)"\s+)?(-?\d+(?:\.\d+)?)\s*-->\s*(-?\d+(?:\.\d+)?)/);
    if (l) {
      l[1] && (e.title = l[1]), e.range = { min: parseFloat(l[2]), max: parseFloat(l[3]) };
      continue;
    }
    let d = i.match(/^y-axis\s+(?:"([^"]*)"\s+)?(-?\d+(?:\.\d+)?)\s*-->\s*(-?\d+(?:\.\d+)?)/);
    if (d) {
      d[1] && (n.title = d[1]), n.range = { min: parseFloat(d[2]), max: parseFloat(d[3]) };
      continue;
    }
    let h = i.match(/^y-axis\s+"([^"]+)"\s*$/);
    if (h) {
      n.title = h[1];
      continue;
    }
    let f = i.match(/^bar\s+(?:"([^"]*)"\s*|([^\s"[]+)\s+)?\[([^\]]+)\]/);
    if (f) {
      o.push({ type: "bar", name: f[1] ?? f[2], data: kn(f[3]) });
      continue;
    }
    let u = i.match(/^line\s+(?:"([^"]*)"\s*|([^\s"[]+)\s+)?\[([^\]]+)\]/);
    if (u) {
      o.push({ type: "line", name: u[1] ?? u[2], data: kn(u[3]) });
      continue;
    }
  }
  if (!n.range && o.length > 0) {
    let i = o.flatMap((d) => d.data), a = Math.min(...i), c = Math.max(...i), l = c - a || 1;
    a = a - l * 0.1, c = c + l * 0.1, a > 0 && a < l * 0.5 && (a = 0), n.range = { min: a, max: c };
  }
  return n.range || (n.range = { min: 0, max: 100 }), { title: s, horizontal: r, xAxis: e, yAxis: n, series: o };
}
function kn(t) {
  return t.split(",").map((e) => parseFloat(e.trim()));
}

// node_modules/beautiful-mermaid/src/xychart/colors.ts
var Me = "#3b82f6";
function Nn(t) {
  let e = t.replace("#", ""), n = parseInt(e.substring(0, 2), 16) / 255, o = parseInt(e.substring(2, 4), 16) / 255, s = parseInt(e.substring(4, 6), 16) / 255, r = Math.max(n, o, s), i = Math.min(n, o, s), a = (r + i) / 2;
  if (r === i) return [0, 0, a * 100];
  let c = r - i, l = a > 0.5 ? c / (2 - r - i) : c / (r + i), d;
  return r === n ? d = ((o - s) / c + (o < s ? 6 : 0)) / 6 : r === o ? d = ((s - n) / c + 2) / 6 : d = ((n - o) / c + 4) / 6, [d * 360, l * 100, a * 100];
}
function so(t, e, n) {
  let o = e / 100, s = n / 100, r = (1 - Math.abs(2 * s - 1)) * o, i = r * (1 - Math.abs(t / 60 % 2 - 1)), a = s - r / 2, c, l, d;
  t < 60 ? (c = r, l = i, d = 0) : t < 120 ? (c = i, l = r, d = 0) : t < 180 ? (c = 0, l = r, d = i) : t < 240 ? (c = 0, l = i, d = r) : t < 300 ? (c = i, l = 0, d = r) : (c = r, l = 0, d = i);
  let h = (f) => Math.round((f + a) * 255).toString(16).padStart(2, "0");
  return `#${h(c)}${h(l)}${h(d)}`;
}
function In(t) {
  return /^#[0-9a-fA-F]{6}$/.test(t);
}
function ao(t) {
  return Nn(t)[2] < 50;
}
function Yn(t, e, n) {
  if (t === 0) return e;
  let o = In(e) ? e : Me, s = n && In(n) ? n : void 0, [r, i] = Nn(o), a = Math.max(55, Math.min(85, i)), c = Math.ceil(t / 2), l = t % 2 === 1, d = s && ao(s) ? !l : l, h = d ? Math.max(25, 48 - c * 13) : Math.min(78, 55 + c * 11), f = (d ? -8 : 12) * c, u = ((r + f) % 360 + 360) % 360;
  return so(u, a, h);
}

// node_modules/beautiful-mermaid/src/ascii/xychart.ts
var we = 60, ve = 20, co = {
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
}, $n = {
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
function Bn(t, e) {
  let n = e.accent ?? Me;
  return t <= 1 ? [n] : Array.from({ length: t }, (o, s) => Yn(s, n, e.bg));
}
function lo(t, e) {
  switch (t) {
    case "text":
      return e.fg;
    case "border":
      return e.border;
    case "line":
      return e.line;
    case "arrow":
      return e.arrow;
    case "corner":
      return e.corner ?? e.line;
    case "junction":
      return e.junction ?? e.border;
    default:
      return e.fg;
  }
}
function Xn(t, e, n, o) {
  let s = t.split(`
`).map((a) => a.trim()).filter((a) => a.length > 0 && !a.startsWith("%%")), r = Gn(s), i = e.useAscii ? $n : co;
  return r.horizontal ? uo(r, i, n, o) : fo(r, i, n, o);
}
function fo(t, e, n, o) {
  let s = zn(t);
  if (s === 0) return "";
  let r = t.yAxis.range, i = Fn(r.min, r.max), a = i.length > 1 ? i[1] - i[0] : Math.abs(r.max - r.min) || 1, c = Math.floor(r.min / a + 1e-9) * a, l = Math.max(c + a, Math.ceil(r.max / a - 1e-9) * a), d = Math.round((l - c) / a), h = Array.from({ length: d + 1 }, (g, y) => Math.round((c + y * a) * 1e10) / 1e10), f = h.map((g) => se(g)), u = Math.max(...f.map((g) => g.length)) + 1, m = Math.max(we, s * 6), p = Math.max(1, Math.round(ve / d)), b = d * p, A = a / p, B = (g) => (g - c) / A, v = B(Math.min(Math.max(0, c), l)), H = Math.round(v) - 1, L = Math.floor(m / s), q = On(t, s), ut = !!t.title, O = !!t.xAxis.title, ft = t.series.length > 1, I = ut ? 0 : -1, U = (ut ? 2 : 0) + (ft ? 1 : 0), C = u + 1, F = C + L * s + 2, V = U + b, K = V + 1, at = O ? K + 1 : -1, ct = K + 1 + (O ? 1 : 0) + 0, ot = Hn(F, ct), st = Wn(F, ct), w = _n(F, ct), X = Bn(t.series.length, o), N = (g) => Math.min(b - 1, Math.max(-1, Math.round(B(g)) - 1)), M = (g) => C + Math.floor(L * (g + 0.5));
  ut && I >= 0 && Xt(ot, st, I, Math.floor(F / 2 - t.title.length / 2), t.title, "text"), ft && Pn(ot, st, w, t, ut ? 1 : 0, F, e, X);
  for (let g = 0; g < b; g++) {
    let y = U + (b - 1 - g);
    bt(ot, st, y, C - 1, e.vLine, "border");
  }
  bt(ot, st, V, C - 1, e.origin, "border");
  for (let g of h) {
    let y = Math.round(B(g)) - 1;
    if (y < -1 || y >= b) continue;
    let E = U + (b - 1 - y), T = se(g);
    bt(ot, st, E, C - 1, y === -1 || y === H ? e.origin : e.yTick, "border");
    let k = u - T.length;
    Xt(ot, st, E, Math.max(0, k), T, "text");
  }
  for (let g = C; g < C + L * s; g++)
    bt(ot, st, V, g, e.hLine, "border");
  for (let g = 0; g < s; g++) {
    let y = M(g);
    bt(ot, st, V, y, e.xTick, "border");
    let E = q[g], T = y - Math.floor(E.length / 2);
    Xt(ot, st, K, Math.max(0, T), E, "text");
  }
  if (O && at >= 0) {
    let g = t.xAxis.title;
    Xt(ot, st, at, Math.floor(F / 2 - g.length / 2), g, "text");
  }
  for (let g of h) {
    let y = Math.round(B(g)) - 1;
    if (y < 0 || y >= b) continue;
    let E = U + (b - 1 - y);
    for (let T = C; T < C + L * s; T++)
      Ae(ot, E, T) === " " && bt(ot, st, E, T, y === H ? e.hLine : e.grid, y === H ? "border" : "line");
  }
  let W = [];
  for (let g = 0; g < t.series.length; g++)
    t.series[g].type === "bar" && W.push({ data: t.series[g].data, globalIdx: g });
  if (W.length > 0) {
    let g = W.length, y = Math.max(1, L - 2), E = Math.max(1, Math.min(Math.floor(y / g), 8)), T = E * g + (g - 1);
    for (let k = 0; k < W.length; k++) {
      let R = W[k], J = X[R.globalIdx];
      for (let G = 0; G < R.data.length; G++) {
        let D = M(G) - Math.floor(T / 2) + k * (E + 1), $ = B(R.data[G]), tt = $ < v ? Math.ceil($ * 2 - 1e-9) / 2 : Math.floor($ * 2 + 1e-9) / 2, Z = Math.max(0, Math.min(v, tt)), et = Math.min(b, Math.max(v, tt));
        for (let nt = -1; nt < b; nt++) {
          let lt = Z <= nt + 0.5 + 1e-9 && et >= nt + 1 - 1e-9, mt = Z <= nt + 1 + 1e-9 && et >= nt + 1.5 - 1e-9, Dt = e === $n ? (tt < v ? mt : lt) && e.bar : lt && mt ? e.bar : lt ? "\u2584" : mt && "\u2580";
          if (!Dt) continue;
          let Ct = U + (b - 1 - nt);
          for (let kt = D; kt < D + E; kt++)
            bt(ot, st, Ct, kt, Dt, "arrow", w, J);
        }
      }
    }
  }
  let Q = [];
  for (let g = 0; g < t.series.length; g++)
    t.series[g].type === "line" && Q.push({ data: t.series[g].data, globalIdx: g });
  for (let g of Q) {
    if (g.data.length === 0) continue;
    let y = X[g.globalIdx];
    ho(ot, st, g.data, M, N, U, b, C, L * s, e, w, y);
  }
  return jn(ot, st, w, n, o);
}
function uo(t, e, n, o) {
  let s = zn(t);
  if (s === 0) return "";
  let r = t.yAxis.range, i = Fn(r.min, r.max), a = On(t, s), c = Math.max(...a.map((C) => C.length)) + 1, l = Math.max(we, 40), d = Math.max(2, Math.floor(ve / s)), h = d * s, f = !!t.title, u = !!t.yAxis.title, m = t.series.length > 1, p = (f ? 2 : 0) + (m ? 1 : 0), b = c + 1, A = b + l + 2, B = p + h + 2 + (u ? 1 : 0), v = p + h, H = Hn(A, B), L = Wn(A, B), q = _n(A, B), ut = Bn(t.series.length, o), O = (C) => {
    let F = (C - r.min) / (r.max - r.min || 1);
    return b + Math.round(F * (l - 1));
  }, ft = (C) => p + Math.floor(d * (C + 0.5));
  f && Xt(H, L, 0, Math.floor(A / 2 - t.title.length / 2), t.title, "text"), m && Pn(H, L, q, t, f ? 1 : 0, A, e, ut);
  for (let C = p; C < p + h; C++)
    bt(H, L, C, b - 1, e.vLine, "border");
  bt(H, L, v, b - 1, e.origin, "border");
  for (let C = 0; C < s; C++) {
    let F = ft(C), V = a[C], K = c - V.length;
    Xt(H, L, F, Math.max(0, K), V, "text");
  }
  for (let C = b; C < b + l; C++)
    bt(H, L, v, C, e.hLine, "border");
  for (let C of i) {
    let F = O(C);
    if (F < b || F >= b + l) continue;
    bt(H, L, v, F, e.xTick, "border");
    let V = se(C);
    Xt(H, L, v + 1, F - Math.floor(V.length / 2), V, "text");
  }
  if (u) {
    let C = t.yAxis.title;
    Xt(H, L, B - 1, Math.floor(A / 2 - C.length / 2), C, "text");
  }
  for (let C of i) {
    let F = O(C);
    if (!(F < b || F >= b + l))
      for (let V = p; V < p + h; V++)
        Ae(H, V, F) === " " && bt(H, L, V, F, e.grid, "line");
  }
  let I = [];
  for (let C = 0; C < t.series.length; C++)
    t.series[C].type === "bar" && I.push({ data: t.series[C].data, globalIdx: C });
  if (I.length > 0) {
    let C = I.length, F = 1, V = F * C + (C - 1), K = O(Math.max(0, r.min));
    for (let at = 0; at < I.length; at++) {
      let ct = I[at], ot = ut[ct.globalIdx];
      for (let st = 0; st < ct.data.length; st++) {
        let N = ft(st) - Math.floor(V / 2) + at * (F + 1), M = O(ct.data[st]), W = Math.min(K, M), Q = Math.max(K, M);
        for (let g = N; g < N + F; g++)
          for (let y = W; y <= Q; y++)
            bt(H, L, g, y, e.bar, "arrow", q, ot);
      }
    }
  }
  let U = [];
  for (let C = 0; C < t.series.length; C++)
    t.series[C].type === "line" && U.push({ data: t.series[C].data, globalIdx: C });
  for (let C of U) {
    if (C.data.length === 0) continue;
    let F = ut[C.globalIdx];
    go(H, L, C.data, ft, O, p, h, b, l, e, q, F);
  }
  return jn(H, L, q, n, o);
}
function ho(t, e, n, o, s, r, i, a, c, l, d, h) {
  if (n.length === 0) return;
  let f = n.map((m, p) => ({
    col: o(p),
    row: s(m)
  })), u = (m, p, b) => {
    let A = r + (i - 1 - p);
    A >= 0 && m >= a && m < a + c && ![l.bar, "\u2580", "\u2584"].includes(Ae(t, A, m)) && bt(t, e, A, m, b, "arrow", d, h);
  };
  if (f.length === 1) {
    u(f[0].col, f[0].row, l.hLine);
    return;
  }
  for (let m = 0; m < f.length - 1; m++) {
    let p = f[m], b = f[m + 1];
    if (p.row === b.row) {
      for (let L = p.col; L <= b.col; L++)
        u(L, p.row, l.hLine);
      continue;
    }
    let A = Math.round((p.col + b.col) / 2), B = b.row > p.row;
    for (let L = p.col; L < A; L++)
      u(L, p.row, l.hLine);
    B ? u(A, p.row, l.cornerBR) : u(A, p.row, l.cornerTR);
    let v = Math.min(p.row, b.row), H = Math.max(p.row, b.row);
    for (let L = v + 1; L < H; L++)
      u(A, L, l.vLine);
    B ? u(A, b.row, l.cornerTL) : u(A, b.row, l.cornerBL);
    for (let L = A + 1; L <= b.col; L++)
      u(L, b.row, l.hLine);
    if (m === 0) {
      let L = Math.max(a, p.col - Math.floor((b.col - p.col) / 4));
      for (let q = L; q < p.col; q++)
        u(q, p.row, l.hLine);
    }
    if (m === f.length - 2) {
      let L = Math.min(a + c - 1, b.col + Math.floor((b.col - p.col) / 4));
      for (let q = b.col + 1; q <= L; q++)
        u(q, b.row, l.hLine);
    }
  }
}
function go(t, e, n, o, s, r, i, a, c, l, d, h) {
  if (n.length === 0) return;
  let f = n.map((m, p) => ({
    row: o(p),
    col: s(m)
  })), u = (m, p, b) => {
    m >= r && m < r + i && p >= a && p < a + c && bt(t, e, m, p, b, "arrow", d, h);
  };
  if (f.length === 1) {
    u(f[0].row, f[0].col, l.vLine);
    return;
  }
  for (let m = 0; m < f.length - 1; m++) {
    let p = f[m], b = f[m + 1];
    if (p.col === b.col) {
      for (let L = p.row; L <= b.row; L++)
        u(L, p.col, l.vLine);
      continue;
    }
    let A = Math.round((p.row + b.row) / 2), B = b.col > p.col;
    for (let L = p.row; L < A; L++)
      u(L, p.col, l.vLine);
    B ? u(A, p.col, l.cornerBL) : u(A, p.col, l.cornerBR);
    let v = Math.min(p.col, b.col), H = Math.max(p.col, b.col);
    for (let L = v + 1; L < H; L++)
      u(A, L, l.hLine);
    B ? u(A, b.col, l.cornerTR) : u(A, b.col, l.cornerTL);
    for (let L = A + 1; L <= b.row; L++)
      u(L, b.col, l.vLine);
  }
}
function Pn(t, e, n, o, s, r, i, a) {
  let c = [], l = 0, d = 0;
  for (let m = 0; m < o.series.length; m++) {
    let p = o.series[m];
    p.type === "bar" ? (c.push({ symbol: i.bar, label: p.name || `Bar ${l + 1}`, globalIdx: m }), l++) : (c.push({ symbol: i.hLine, label: p.name || `Line ${d + 1}`, globalIdx: m }), d++);
  }
  let h = 0;
  for (let m = 0; m < c.length; m++)
    m > 0 && (h += 2), h += 2 + c[m].label.length;
  let u = Math.max(0, Math.floor(r / 2 - h / 2));
  for (let m = 0; m < c.length; m++) {
    m > 0 && (u += 2);
    let p = c[m];
    bt(t, e, s, u, p.symbol, "arrow", n, a[p.globalIdx]), u += 1, u += 1, Xt(t, e, s, u, p.label, "text"), u += p.label.length;
  }
}
function Hn(t, e) {
  return Array.from({ length: t }, () => Array.from({ length: e }, () => " "));
}
function Wn(t, e) {
  return Array.from({ length: t }, () => Array.from({ length: e }).fill(null));
}
function _n(t, e) {
  return Array.from({ length: t }, () => Array.from({ length: e }).fill(null));
}
function bt(t, e, n, o, s, r, i, a) {
  o >= 0 && o < t.length && n >= 0 && n < t[0].length && (t[o][n] = s, e[o][n] = r, i && a && (i[o][n] = a));
}
function Ae(t, e, n) {
  return n >= 0 && n < t.length && e >= 0 && e < t[0].length ? t[n][e] : " ";
}
function Xt(t, e, n, o, s, r) {
  for (let i = 0; i < s.length; i++)
    bt(t, e, n, o + i, s[i], r);
}
function jn(t, e, n, o, s) {
  if (t.length === 0) return "";
  let r = t[0].length, i = t.length, a = [];
  for (let c = 0; c < r; c++) {
    let l = [], d = [], h = [];
    for (let u = 0; u < i; u++)
      l.push(t[u][c]), d.push(e[u][c]), h.push(n[u][c]);
    let f = l.length - 1;
    for (; f >= 0 && l[f] === " "; ) f--;
    f < 0 ? a.push("") : a.push(mo(
      l.slice(0, f + 1),
      d.slice(0, f + 1),
      h.slice(0, f + 1),
      s,
      o
    ));
  }
  for (; a.length > 0 && a[a.length - 1] === ""; )
    a.pop();
  return a.join(`
`);
}
function mo(t, e, n, o, s) {
  if (s === "none") return t.join("");
  let r = "", i = null, a = "";
  for (let c = 0; c < t.length; c++) {
    let l = t[c];
    if (l === " ") {
      a.length > 0 && (r += i ? ee(a, i, s) : a, a = "", i = null), r += " ";
      continue;
    }
    let d = n[c] ?? null, h = e[c] ?? null, f = d ?? (h ? lo(h, o) : null);
    f === i ? a += l : (a.length > 0 && (r += i ? ee(a, i, s) : a), a = l, i = f);
  }
  return a.length > 0 && (r += i ? ee(a, i, s) : a), r;
}
function zn(t) {
  if (t.xAxis.categories) return t.xAxis.categories.length;
  for (let e of t.series)
    if (e.data.length > 0) return e.data.length;
  return 0;
}
function On(t, e) {
  if (t.xAxis.categories) return t.xAxis.categories;
  if (t.xAxis.range) {
    let { min: n, max: o } = t.xAxis.range, s = e > 1 ? (o - n) / (e - 1) : 0;
    return Array.from({ length: e }, (r, i) => se(n + s * i));
  }
  return Array.from({ length: e }, (n, o) => String(o + 1));
}
function Fn(t, e) {
  let n = e - t;
  if (n <= 0) return [t];
  let o = n / 6, s = Math.pow(10, Math.floor(Math.log10(o))), r = o / s, i;
  r <= 1.5 ? i = s : r <= 3 ? i = 2 * s : r <= 7 ? i = 5 * s : i = 10 * s;
  let a = Math.ceil(t / i) * i, c = [];
  for (let l = a; l <= e + i * 1e-3; l += i)
    c.push(Math.round(l * 1e10) / 1e10);
  return c;
}
function se(t) {
  return Number.isInteger(t) ? String(t) : t.toFixed(Math.abs(t) < 10 ? 1 : 0);
}
var po = (t, e) => {
  we = t, ve = e;
};

// node_modules/beautiful-mermaid/src/ascii/index.ts
function xo(t) {
  let e = t.trim().split(`
`)[0]?.trim().toLowerCase() ?? "";
  return /^xychart(-beta)?\b/.test(e) ? "xychart" : /^sequencediagram\s*$/.test(e) ? "sequence" : /^classdiagram\s*$/.test(e) ? "class" : /^erdiagram\s*$/.test(e) ? "er" : "flowchart";
}
function bo(t, e = {}) {
  let n = {
    useAscii: e.useAscii ?? !1,
    paddingX: e.paddingX ?? 5,
    paddingY: e.paddingY ?? 5,
    boxBorderPadding: e.boxBorderPadding ?? 1,
    graphDirection: "TD"
    // default, overridden for flowcharts below
  }, o = e.colorMode === "auto" || e.colorMode === void 0 ? ke() : e.colorMode, s = { ...Zt, ...e.theme };
  switch (xo(t)) {
    case "xychart":
      return Xn(t, n, o, s);
    case "sequence":
      return vn(t, n, o, s);
    case "class":
      return Dn(t, n, o, s);
    case "er":
      return En(t, n, o, s);
    default: {
      let i = Le(t);
      i.direction === "LR" || i.direction === "RL" ? n.graphDirection = "LR" : n.graphDirection = "TD";
      let a = Oe(i, n);
      return Mn(a), xn(a), i.direction === "BT" && (We(a.canvas), _e(a.roleCanvas)), Pt(a.canvas, {
        roleCanvas: a.roleCanvas,
        colorMode: o,
        theme: s
      });
    }
  }
}
var yo = bo;
export {
  yo as renderMermaidAscii,
  po as setChartSize
};
