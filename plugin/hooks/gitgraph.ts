import type { ChartArt } from './charts'
import { width as cellWidth } from './layout'
import { ARROW_HUE, art, blank, type Canvas, fit, LINE_HUE, type Line, line, paint, rows, unquote, withoutBlocks } from './textart'

type Mark = 'normal' | 'highlight' | 'reverse'
type Row =
  | { kind: 'commit'; lane: number; label: string; tag?: string; mark: Mark }
  | { kind: 'fork'; from: number; to: number }
  | { kind: 'merge'; from: number; to: number; label: string; tag?: string; mark: Mark }
type Graph = { names: string[]; current: number; ids: Map<string, number>; rows: Row[]; upward: boolean }
type Glyphs = { h: string; v: string; cross: string; tee: [string, string]; end: [string, string]; open: string; dots: Record<Mark, string> }

const BOX: Glyphs = { h: '─', v: '│', cross: '┼', tee: ['├', '┤'], end: ['╰', '╯'], open: '╮', dots: { normal: '●', highlight: '■', reverse: '✗' } }
const PLAIN: Glyphs = { h: '-', v: '|', cross: '+', tee: ['+', '+'], end: ['+', '+'], open: '+', dots: { normal: '*', highlight: '#', reverse: 'x' } }
const IGNORED = /^(accTitle|accDescr|title)\b/i
const FLIP: Record<string, string> = { '╮': '╯', '╯': '╮', '╰': '╭', '╭': '╰' }
const STEP = 3

const optionsOf = (text: string) => Object.fromEntries([...text.matchAll(/(\w+):\s*("([^"]*)"|[^\s"]+)/g)].map(m => [m[1]!.toLowerCase(), m[3] ?? m[2]!]))

const markOf = (type?: string): Mark | null => {
  const mark = (type ?? 'normal').toLowerCase()
  return mark === 'normal' || mark === 'highlight' || mark === 'reverse' ? mark : null
}

const commit = (g: Graph, rest: string, label?: string): boolean => {
  const o = optionsOf(rest)
  const mark = markOf(o.type)
  if (!mark || (o.id && g.ids.has(o.id))) return false
  if (o.id) g.ids.set(o.id, g.current)
  g.rows.push({ kind: 'commit', lane: g.current, label: label ?? o.id ?? '', tag: o.tag, mark })
  return true
}

const merge = (g: Graph, rest: string): boolean => {
  const [, name = '', more = ''] = /^("[^"]*"|\S+)\s*(.*)$/.exec(rest) ?? []
  const from = g.names.indexOf(unquote(name))
  const o = optionsOf(more)
  const mark = markOf(o.type)
  if (from < 0 || from === g.current || !mark || (o.id && g.ids.has(o.id))) return false
  if (o.id) g.ids.set(o.id, g.current)
  g.rows.push({ kind: 'merge', from, to: g.current, label: o.id ?? '', tag: o.tag, mark })
  return true
}

const branch = (g: Graph, rest: string): boolean => {
  const name = unquote(rest.replace(/\s+order:\s*\d+\s*$/i, ''))
  if (!name || g.names.includes(name)) return false
  g.names.push(name)
  g.rows.push({ kind: 'fork', from: g.current, to: g.names.length - 1 })
  g.current = g.names.length - 1
  return true
}

const checkout = (g: Graph, rest: string): boolean => {
  g.current = g.names.indexOf(unquote(rest))
  return g.current >= 0
}

const pick = (g: Graph, rest: string): boolean => {
  const id = optionsOf(rest).id
  return !!id && g.ids.has(id) && g.ids.get(id) !== g.current && commit(g, rest.replace(/\bid:\s*("[^"]*"|\S+)/, ''), `pick ${id}`)
}

const COMMANDS: Record<string, (g: Graph, rest: string) => boolean> = { commit, merge, branch, checkout, switch: checkout, 'cherry-pick': pick }

const parse = (source: string): Graph | null => {
  const [first = '', ...rest] = withoutBlocks(source.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%')))
  const head = /^gitGraph(?:\s+(LR|TB|BT))?\s*:?$/i.exec(first)
  if (!head) return null
  const g: Graph = { names: ['main'], current: 0, ids: new Map(), rows: [], upward: head[1]?.toUpperCase() === 'BT' }
  for (const text of rest) {
    if (IGNORED.test(text)) continue
    const [, word = '', args = ''] = /^(\S+)\s*(.*)$/.exec(text) ?? []
    const key = word.toLowerCase()
    if (!Object.hasOwn(COMMANDS, key) || !COMMANDS[key]!(g, args)) return null
  }
  return g.rows.some(r => r.kind !== 'fork') ? g : null
}

const lanesOf = (row: Row) => (row.kind === 'commit' ? [row.lane] : [row.from, row.to])

const spans = (g: Graph) => {
  const span = g.names.map((_, i): [number, number] => [i ? Infinity : 0, 0])
  g.rows.forEach((row, r) => {
    if (row.kind === 'fork') span[row.to]![0] = r
    for (const lane of lanesOf(row)) span[lane]![1] = r
  })
  return span
}

const across = (c: Canvas, glyph: Glyphs, r: number, [from, to]: [number, number], hue: number, alive: (lane: number, at: number) => boolean) => {
  const [low, high] = [Math.min(from, to), Math.max(from, to)]
  for (let x = low * STEP + 1; x < high * STEP; x++) {
    const crossed = x % STEP === 0 && alive(x / STEP, r)
    paint(c, r, x, crossed ? glyph.cross : glyph.h, crossed ? x / STEP : hue)
  }
}

const drawRow = (c: Canvas, glyph: Glyphs, row: Row, r: number, alive: (lane: number, at: number) => boolean) => {
  if (row.kind === 'commit') return paint(c, r, row.lane * STEP, glyph.dots[row.mark], row.lane)
  const hue = row.kind === 'fork' ? row.to : row.from
  across(c, glyph, r, [row.from, row.to], hue, alive)
  const side = row.from < row.to ? 0 : 1
  paint(c, r, row.from * STEP, (alive(row.from, r + 1) ? glyph.tee : glyph.end)[side]!, hue)
  if (row.kind === 'fork') paint(c, r, row.to * STEP, glyph.open, row.to)
  else paint(c, r, row.to * STEP, glyph.dots[row.mark], row.to)
}

const labelOf = (g: Graph, row: Row, room: number): [string, number][] => {
  if (row.kind === 'fork') return [[fit(g.names[row.to]!, room), row.to]]
  const tag = row.tag ? fit(` [${row.tag}]`, Math.max(1, room - 2)) : ''
  const auto = row.kind === 'merge' && !row.label
  const label = fit(auto ? `merge ${g.names[row.from]}` : row.label, Math.max(1, room - cellWidth(tag)))
  return [
    [label, auto ? LINE_HUE : -1],
    [tag, ARROW_HUE],
  ]
}

const legend = (names: string[], cols: number): Line[] => {
  const out: Line[] = []
  names.forEach((name, i) => {
    const last = out.at(-1)
    const next = fit(name, cols)
    if (last && cellWidth(last.text) + 3 + cellWidth(next) <= cols) out[out.length - 1] = { text: `${last.text}   ${next}`, hue: [...last.hue, -1, -1, -1, ...line([next, i]).hue] }
    else out.push(line([next, i]))
  })
  return out
}

export const gitGraphText = (source: string, ascii: boolean, columns: number): ChartArt | null => {
  const g = parse(source)
  if (!g) return null
  const glyph = ascii ? PLAIN : BOX
  const cols = Math.max(24, columns - 4)
  const span = spans(g)
  const alive = (lane: number, at: number) => span[lane]![0] <= at && at <= span[lane]![1]
  const width = g.names.length * STEP - 2
  const c = blank(g.rows.length, width)
  g.rows.forEach((row, r) => {
    g.names.forEach((_, lane) => alive(lane, r) && paint(c, r, lane * STEP, glyph.v, lane))
    drawRow(c, glyph, row, r, alive)
  })
  if (g.upward) c.grid.forEach(row => row.forEach((ch, x) => (row[x] = FLIP[ch] ?? ch)))
  const room = Math.max(1, cols - width - 2)
  const drawn = rows(c).map((l, r) => {
    const parts = labelOf(g, g.rows[r]!, room)
    const rest = line(['  ', -1], ...parts)
    return { text: l.text + rest.text, hue: [...l.hue, ...rest.hue] }
  })
  return art([...(g.upward ? drawn.reverse() : drawn), line(['', -1]), ...legend(g.names, cols)])
}
