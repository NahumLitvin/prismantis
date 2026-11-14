import type { ChartArt } from './charts'
import { width } from './layout'
import { art, BAD_HUE, fit, LINE_HUE, type Line, line, oneLine, unquote, wrap } from './textart'

type Card = { text: string; meta: Record<string, string> }
type Column = { name: string; cards: Card[] }
type Glyphs = { h: string; v: string; corners: [string, string, string, string]; dot: string }

const ROUND: Glyphs = { h: '─', v: '│', corners: ['╭', '╮', '╰', '╯'], dot: '·' }
const PLAIN: Glyphs = { h: '-', v: '|', corners: ['+', '+', '+', '+'], dot: '-' }
const GAP = 2
const MIN_WIDTH = 16
const MAX_WIDTH = 32
const MOST_LINES = 4
const URGENT = /^(very )?high$/i

const textOf = (body: string) => oneLine(unquote(/^[^\s[\]]*\[(.*)\]$/.exec(body)?.[1] ?? body))

const metaOf = (body: string) =>
  Object.fromEntries([...body.matchAll(/(\w+)\s*:\s*('[^']*'|"[^"]*"|[^,}]+)/g)].map(m => [m[1]!.toLowerCase(), m[2]!.trim().replace(/^(['"])(.*)\1$/, '$2')]))

const nodeOf = (text: string): Card | null => {
  const at = text.indexOf('@{', Math.max(0, text.lastIndexOf(']')))
  const card = { text: textOf((at < 0 ? text : text.slice(0, at)).trim()), meta: at < 0 ? {} : metaOf(text.slice(at + 2)) }
  return card.text ? card : null
}

const joined = (lines: string[]) =>
  lines.reduce<string[]>((out, l) => {
    const last = out.at(-1)
    if (last !== undefined && /@\{[^}]*$/.test(last)) out[out.length - 1] = `${last} ${l.trim()}`
    else out.push(l)
    return out
  }, [])

const parse = (source: string): Column[] | null => {
  const [first = '', ...rest] = joined(source.split('\n').filter(l => l.trim() && !l.trim().startsWith('%%')))
  if (!/^kanban$/i.test(first.trim())) return null
  const columns: Column[] = []
  let indent = -1
  for (const raw of rest) {
    const node = nodeOf(raw.trim())
    const at = raw.replace(/\t/g, '    ').search(/\S/)
    if (!node) return null
    if (columns.length && at > indent) columns.at(-1)!.cards.push(node)
    else {
      columns.push({ name: node.text, cards: [] })
      indent = at
    }
  }
  return columns.length ? columns : null
}

const metaRows = (card: Card, room: number, dot: string): [string, number][][] => {
  const { assigned, ticket, priority } = card.meta
  const plain = [assigned, ticket].filter(Boolean).join(` ${dot} `)
  const urgency = URGENT.test(priority ?? '') ? BAD_HUE : LINE_HUE
  const tail = plain && priority ? ` ${dot} ${priority}` : (priority ?? '')
  if (width(plain) + width(tail) <= room) return plain || tail ? [[[plain, LINE_HUE], [tail, urgency]]] : []
  return [plain, priority].flatMap((text, i) => (text ? [[[fit(text, room), i ? urgency : LINE_HUE] as [string, number]]] : []))
}

const cardLines = (card: Card, size: number, hue: number, g: Glyphs): Line[] => {
  const room = size - 4
  const edge = (l: string, r: string) => line([l + g.h.repeat(size - 2) + r, hue])
  const row = (parts: [string, number][]) => {
    const used = parts.reduce((sum, [t]) => sum + width(t), 0)
    return line([`${g.v} `, hue], ...parts, [`${' '.repeat(Math.max(0, room - used))} ${g.v}`, hue])
  }
  return [
    edge(g.corners[0], g.corners[1]),
    ...wrap(card.text, room, MOST_LINES).map(t => row([[t, -1]])),
    ...metaRows(card, room, g.dot).map(row),
    edge(g.corners[2], g.corners[3]),
  ]
}

const columnLines = (column: Column, i: number, size: number, g: Glyphs): Line[] => {
  const count = ` ${g.dot} ${column.cards.length}`
  const head = line([fit(column.name, size - width(count)), i], [count, i])
  return [head, ...column.cards.flatMap(card => cardLines(card, size, i, g))]
}

const join = (a: Line, b: Line): Line => ({ text: a.text + b.text, hue: [...a.hue, ...b.hue] })

const pad = (l: Line | undefined, size: number): Line => {
  const text = l?.text ?? ''
  return join(l ?? line(['', -1]), line([' '.repeat(Math.max(0, size - width(text))), -1]))
}

const side = (columns: Column[], g: Glyphs, cols: number): Line[] | null => {
  const size = Math.min(MAX_WIDTH, Math.floor((cols + GAP) / columns.length) - GAP)
  if (size < MIN_WIDTH) return null
  const drawn = columns.map((c, i) => columnLines(c, i, size, g))
  const gap = line([' '.repeat(GAP), -1])
  return Array.from({ length: Math.max(...drawn.map(d => d.length)) }, (_, r) => drawn.map(d => pad(d[r], size)).reduce((row, cell) => join(join(row, gap), cell)))
}

const stacked = (columns: Column[], g: Glyphs, cols: number): Line[] =>
  columns.flatMap((c, i) => [...(i ? [line(['', -1])] : []), ...columnLines(c, i, Math.min(cols, MAX_WIDTH * 2), g)])

export const kanbanText = (source: string, ascii: boolean, columns: number): ChartArt | null => {
  const board = parse(source)
  if (!board) return null
  const g = ascii ? PLAIN : ROUND
  const cols = Math.max(MIN_WIDTH, columns - 4)
  return art(side(board, g, cols) ?? stacked(board, g, cols))
}
