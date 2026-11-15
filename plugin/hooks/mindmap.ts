import type { ChartArt } from './charts'
import { cells, width } from './layout'
import { ARROW_HUE, fit, LINE_HUE, type Line, line, oneLine, unquote } from './textart'

type Node = { label: string; kids: Node[]; row: number }
type Glyphs = { h: string; v: string; top: string; mid: string; bottom: string; down: string; cross: string; side: string }
type Canvas = { grid: string[][]; hues: number[][] }

const BOX: Glyphs = { h: '─', v: '│', top: '┌', mid: '├', bottom: '└', down: '┬', cross: '┼', side: '┤' }
const PLAIN: Glyphs = { h: '-', v: '|', top: '+', mid: '+', bottom: '`', down: '+', cross: '+', side: '+' }
const SHAPES = [
  ['((', '))'],
  ['))', '(('],
  ['{{', '}}'],
  ['(', ')'],
  [')', '('],
  ['[', ']'],
] as const

const shaped = (body: string) => {
  for (const [open, close] of SHAPES) {
    const at = body.indexOf(open)
    if (at < 0 || /\s/.test(body.slice(0, at)) || !body.endsWith(close) || body.length < at + open.length + close.length) continue
    return body.slice(at + open.length, body.length - close.length)
  }
  return body
}

const unmark = (text: string) => text.replace(/(\*\*|__)(.+?)\1|([*_])(.+?)\3/g, '$2$4')

const labelOf = (text: string) => {
  const body = unquote(shaped(text.replace(/\s*:::[\w\s-]*$/, '')))
  const markdown = /^`(.*)`$/.exec(body)
  return oneLine(markdown ? unmark(markdown[1]!) : body)
}

const attach = (stack: [number, Node][], indent: number, node: Node) => {
  while (stack.length && stack.at(-1)![0] >= indent) stack.pop()
  stack.at(-1)?.[1].kids.push(node)
  const root = !stack.length
  stack.push([indent, node])
  return root
}

const parse = (source: string): Node | null => {
  const lines = source.split('\n').filter(l => l.trim() && !l.trim().startsWith('%%'))
  if (!/^mindmap$/i.test(lines.shift()?.trim() ?? '')) return null
  const stack: [number, Node][] = []
  let root: Node | undefined
  for (const raw of lines) {
    if (/^::icon\(|^:::/.test(raw.trim())) continue
    const label = labelOf(raw.trim())
    if (!label) return null
    const node: Node = { label, kids: [], row: 0 }
    if (!attach(stack, raw.replace(/\t/g, '    ').search(/\S/), node)) continue
    if (root) return null
    root = node
  }
  return root ?? null
}

const placeRows = (n: Node, next: { row: number }): number => {
  if (!n.kids.length) return (n.row = next.row++)
  const rows = n.kids.map(k => placeRows(k, next))
  return (n.row = Math.floor((rows[0]! + rows.at(-1)!) / 2))
}

const widths = (n: Node, depth = 0, out: number[] = []): number[] => {
  out[depth] = Math.max(out[depth] ?? 0, width(n.label))
  for (const k of n.kids) widths(k, depth + 1, out)
  return out
}

const put = (c: Canvas, row: number, col: number, text: string, hue: number) =>
  cells(text).forEach((ch, k) => {
    c.grid[row]![col + k] = ch
    c.hues[row]![col + k] = hue
  })

const joint = (g: Glyphs, r: number, kid: boolean, [first, last, at]: number[]) => {
  if (first === last) return g.h
  if (r === first) return r === at ? g.down : g.top
  if (r === last) return g.bottom
  if (kid) return r === at ? g.cross : g.mid
  return r === at ? g.side : g.v
}

const drawNode = (c: Canvas, g: Glyphs, x: number[], n: Node, depth: number, hue: number) => {
  const left = x[depth]!
  put(c, n.row, left, n.label, depth === 0 ? ARROW_HUE : depth === 1 ? hue : -1)
  if (!n.kids.length) return
  const arm = depth === 0 ? LINE_HUE : hue
  const spine = x[depth + 1]! - 3
  const span = [n.kids[0]!.row, n.kids.at(-1)!.row, n.row]
  const rows = new Set(n.kids.map(k => k.row))
  put(c, n.row, left + width(n.label), ` ${g.h.repeat(spine - left - width(n.label) - 1)}`, arm)
  for (let r = span[0]!; r <= span[1]!; r++) put(c, r, spine, joint(g, r, rows.has(r), span), arm)
  n.kids.forEach((k, i) => {
    const own = depth === 0 ? i : hue
    put(c, k.row, spine + 1, `${g.h} `, own)
    drawNode(c, g, x, k, depth + 1, own)
  })
}

const flat = (n: Node, depth = 0): [Node, number][] => [[n, depth], ...n.kids.flatMap(k => flat(k, depth + 1))]

const across = (root: Node, g: Glyphs, cols: number): Line[] | null => {
  const x = widths(root).reduce<number[]>((at, size, d) => [...at, at[d]! + size + 5], [0])
  const span = Math.max(...flat(root).map(([n, d]) => x[d]! + width(n.label)))
  if (span > cols) return null
  const next = { row: 0 }
  placeRows(root, next)
  const blank = <T>(fill: T) => Array.from({ length: next.row }, () => Array<T>(span).fill(fill))
  const c: Canvas = { grid: blank(' '), hues: blank(-1) }
  drawNode(c, g, x, root, 0, 0)
  return c.grid.map((row, r) => ({ text: row.join(''), hue: c.hues[r]! }))
}

const outline = (root: Node, g: Glyphs, cols: number): Line[] => {
  const out: Line[] = [line([fit(root.label, cols), ARROW_HUE])]
  const walk = (kids: Node[], prefix: [string, number][], depth: number, hue?: number) =>
    kids.forEach((k, i) => {
      const last = i === kids.length - 1
      const own = hue ?? i
      const glyph = depth === 1 ? LINE_HUE : own
      const room = cols - prefix.reduce((sum, [t]) => sum + width(t), 0) - 3
      out.push(line(...prefix, [last ? g.bottom : g.mid, glyph], [`${g.h} `, own], [fit(k.label, Math.max(1, room)), depth === 1 ? own : -1]))
      walk(k.kids, [...prefix, [last ? '   ' : `${g.v}  `, glyph]], depth + 1, own)
    })
  walk(root.kids, [], 1)
  return out
}

export const mindmapText = (source: string, ascii: boolean, columns: number): ChartArt | null => {
  const root = parse(source)
  if (!root) return null
  const g = ascii ? PLAIN : BOX
  const cols = Math.max(20, columns - 4)
  const out = across(root, g, cols) ?? outline(root, g, cols)
  return { text: out.map(l => l.text.trimEnd()).join('\n'), slices: out.map(l => l.hue) }
}
