import type { ChartArt } from './charts'
import { cells, width } from './layout'
import { ARROW_HUE, fit, LINE_HUE, type Line, line, unquote } from './textart'

type Point = { name: string; x: number; y: number }
type Axis = [string, string | undefined]
type Quadrant = { title?: string; x?: Axis; y?: Axis; names: string[]; points: Point[] }
type Canvas = { grid: string[][]; hues: number[][]; taken: boolean[][] }

const MARKS = '123456789abcdefghijklmnopqrstuvwxyz'
const IGNORED = /^(classDef|accTitle|accDescr)\b/i
const POINT = /^(.+?)(?::::[\w-]+)?\s*:\s*\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]/

const axisOf = (text: string): Axis => {
  const [from = '', to] = text.split('-->').map(unquote)
  return [from, to || undefined]
}

const pointOf = (line: string): Point | null | undefined => {
  const m = POINT.exec(line)
  if (!m) return undefined
  const [x, y] = [Number(m[2]), Number(m[3])]
  return x >= 0 && x <= 1 && y >= 0 && y <= 1 ? { name: unquote(m[1]!), x, y } : null
}

const readLine = (q: Quadrant, line: string): boolean => {
  const named = /^(title|x-axis|y-axis|quadrant-([1-4]))\s+(.*)$/i.exec(line)
  if (named) {
    const [key, slot, text] = [named[1]!.toLowerCase(), named[2], named[3]!]
    if (slot) q.names[Number(slot) - 1] = unquote(text)
    else if (key === 'title') q.title = unquote(text)
    else q[key === 'x-axis' ? 'x' : 'y'] = axisOf(text)
    return true
  }
  if (IGNORED.test(line)) return true
  const point = pointOf(line)
  if (point) q.points.push(point)
  return !!point
}

const parse = (source: string): Quadrant | null => {
  const [first = '', ...rest] = source.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'))
  if (!/^quadrantChart$/i.test(first)) return null
  const q: Quadrant = { names: [], points: [] }
  for (const line of rest) if (!readLine(q, line)) return null
  return q.points.length <= MARKS.length && (q.points.length || q.names.some(Boolean)) ? q : null
}

const canvas = (rows: number, cols: number): Canvas => ({
  grid: Array.from({ length: rows }, () => Array<string>(cols).fill(' ')),
  hues: Array.from({ length: rows }, () => Array<number>(cols).fill(-1)),
  taken: Array.from({ length: rows }, () => Array<boolean>(cols).fill(false)),
})

const put = (c: Canvas, row: number, col: number, text: string, hue = -1) =>
  cells(text).forEach((ch, k) => {
    if (col + k < 0 || col + k >= c.grid[row]!.length) return
    c.grid[row]![col + k] = ch
    c.hues[row]![col + k] = hue
    c.taken[row]![col + k] = true
  })

const drawAxes = (c: Canvas, mid: number, middle: number, ascii: boolean) => {
  c.grid[middle]!.fill(ascii ? '-' : '─')
  c.hues[middle]!.fill(LINE_HUE)
  c.grid.forEach((row, r) => {
    row[mid] = ascii ? '|' : '│'
    c.hues[r]![mid] = LINE_HUE
  })
  c.grid[middle]![mid] = ascii ? '+' : '┼'
}

const drawNames = (c: Canvas, names: string[], mid: number) => {
  const [rows, cols] = [c.grid.length, c.grid[0]!.length]
  const room = mid - 3
  const [q1, q2, q3, q4] = [0, 1, 2, 3].map(i => fit(names[i] ?? '', room))
  put(c, 0, 1, q2!)
  put(c, 0, cols - 1 - width(q1!), q1!)
  put(c, rows - 1, 1, q3!)
  put(c, rows - 1, cols - 1 - width(q4!), q4!)
}

const sameSide = (at: number, axis: number, side: number) => at !== axis && (side === 0 || Math.sign(at - axis) === side)

const nearest = (c: Canvas, [row, col]: [number, number], [middle, mid]: [number, number], [down, right]: [number, number]): [number, number] | undefined => {
  let best: [number, number] | undefined
  let far = Infinity
  c.taken.forEach((line, r) => {
    if (!sameSide(r, middle, down)) return
    line.forEach((taken, k) => {
      const d = 4 * (r - row) ** 2 + (k - col) ** 2
      if (d >= far || taken || line[k - 1] || line[k + 1] || !sameSide(k, mid, right)) return
      best = [r, k]
      far = d
    })
  })
  return best
}

const place = (c: Canvas, p: Point, i: number, middle: number, mid: number) => {
  const [rows, cols] = [c.grid.length, c.grid[0]!.length]
  const spot = nearest(c, [Math.round((1 - p.y) * (rows - 1)), Math.round(p.x * (cols - 1))], [middle, mid], [Math.sign(0.5 - p.y), Math.sign(p.x - 0.5)])
  if (spot) put(c, spot[0], spot[1], MARKS[i]!, i)
  return !!spot
}

const centred = (text: string, at: number, cols: number) => Math.max(0, Math.min(at, cols - width(text)))

const pointing = (arrow: string, text: string, mid: number, cols: number) => line([' '.repeat(centred(`${arrow} ${text}`, mid, cols)), -1], [arrow, ARROW_HUE], [` ${text}`, -1])

const yLines = (y: Axis | undefined, mid: number, cols: number, ascii: boolean): (Line | undefined)[] => {
  if (!y) return []
  const low = fit(y[0], cols - 2)
  if (!y[1]) return [undefined, line([' '.repeat(centred(low, mid - Math.floor(width(low) / 2), cols)) + low, -1])]
  return [pointing(ascii ? '^' : '▲', fit(y[1], cols - 2), mid, cols), pointing(ascii ? 'v' : '▼', low, mid, cols)]
}

const xLine = (x: Axis | undefined, cols: number, ascii: boolean): Line | undefined => {
  if (!x) return undefined
  if (!x[1]) return line([' '.repeat(Math.max(0, Math.floor((cols - width(x[0])) / 2))) + fit(x[0], cols), -1])
  const half = Math.floor(cols / 2) - 1
  const [left, right] = [` ${fit(x[0], half - 2)}`, `${fit(x[1], half - 2)} `]
  return line([ascii ? '<' : '◄', ARROW_HUE], [left + ' '.repeat(cols - 2 - width(left) - width(right)) + right, -1], [ascii ? '>' : '►', ARROW_HUE])
}

const legend = (points: Point[], cols: number): Line[] => {
  const lines: Line[] = []
  let row: Line = { text: '', hue: [] }
  points.forEach((p, i) => {
    const name = ` ${fit(p.name, cols - 2)}`
    if (row.text && width(`${row.text}   ${MARKS[i]}${name}`) > cols) {
      lines.push(row)
      row = { text: '', hue: [] }
    }
    const next = line([row.text ? '   ' : '', -1], [MARKS[i]!, i], [name, -1])
    row = { text: row.text + next.text, hue: [...row.hue, ...next.hue] }
  })
  return row.text ? [...lines, row] : lines
}

export const quadrantText = (source: string, ascii: boolean, columns: number): ChartArt | null => {
  const q = parse(source)
  const cols = Math.max(24, Math.min(64, columns - 4))
  if (!q) return null
  const rows = Math.max(9, Math.min(15, Math.round(cols * 0.35) | 1))
  const [mid, middle] = [Math.floor(cols / 2), Math.floor(rows / 2)]
  const c = canvas(rows, cols)
  drawAxes(c, mid, middle, ascii)
  drawNames(c, q.names, mid)
  if (!q.points.every((p, i) => place(c, p, i, middle, mid))) return null
  const [top, bottom] = yLines(q.y, mid, cols, ascii)
  const plot = c.grid.map((row, r) => ({ text: row.join(''), hue: c.hues[r]! }))
  const out = [q.title ? line([fit(q.title, cols), -1]) : undefined, top, ...plot, bottom, xLine(q.x, cols, ascii), ...legend(q.points, cols)].filter((l): l is Line => !!l)
  return { text: out.map(l => l.text.trimEnd()).join('\n'), slices: out.map(l => l.hue) }
}
