import type { ElementTable, RenderElement } from 'claude-code'

import { ganttText, pieText } from './charts'
import { drawFigure, isFigureLang } from './figure'
import type { Block } from './markdown'
import type { Drawn } from './render'
import { cells, graphemes, heldLtr, mirrored, remember, width } from './render'
import { asIs, holdEngine, holdRow, holdVisual, led } from './rtl'
import type { Style, Theme } from './theme'
import { renderMermaidAscii, setChartSize } from './vendor/mermaid-text.js'

const MAX_LINES = 80
const PAD = '\uFDD0'
const textCache = new Map<string, string | null>()

export const chartSize = (columns: number, source = '') => {
  const labels = (/^\s*x-axis\b[^[\n]*\[([^\]\n]*)\]/m.exec(source)?.[1] ?? '').split(',').map(s => s.trim().replace(/^"|"$/g, ''))
  const fit = labels.length * (Math.max(...labels.map(l => l.length)) + 2)
  const width = Math.max(24, Math.min(60, Math.max(Math.floor(columns / 6), fit), columns - 12))
  return { width, height: Math.max(8, Math.min(20, Math.round(width * 0.3))) }
}

const padWide = (source: string) => (/^[\x00-\x7F]*$/.test(source) ? source : graphemes(source).map(g => (g.length === 1 && width(g) === 2 ? g + PAD : g)).join(''))

const unquoteCategories = (source: string) =>
  source.replace(/^(\s*x-axis\b[^[\n]*\[)([^\]\n]*)\]/m, (_, head: string, items: string) => `${head}${items.replace(/"([^"]*)"/g, (_q, s: string) => s.replaceAll(',', ' '))}]`)

const BLOCK = /[█▀▄]/

const labelBars = (art: string, source: string): string => {
  const series = source.match(/^\s*(bar|line)\b.*$/gm) ?? []
  const values = /^\s*bar\b[^[\n]*\[([^\]\n]*)\]/m.exec(source)?.[1]?.split(',').map(v => v.trim())
  if (series.length !== 1 || !values || /^\s*xychart(-beta)?\s+horizontal/m.test(source)) return art
  const grid = ['', ...art.split('\n')].map(l => [...l])
  const gutter = (r: number) => /^\s*(-?[\d.]+)[┤┼]/.exec(grid[r]?.join('') ?? '')?.[1]
  const axis = grid.findLastIndex((_, r) => gutter(r) !== undefined)
  const ticks = [...(grid[axis]?.join('') ?? '').matchAll(/┬|▀+/g)].map(m => m.index + Math.floor(m[0].length / 2))
  if (ticks.length !== values.length) return art
  const zero = grid.findIndex((_, r) => gutter(r) === '0')
  const top = grid.findIndex((_, r) => gutter(r) !== undefined)
  const base = zero !== -1 ? zero : gutter(top)?.startsWith('-') ? top : axis
  ticks.forEach((x, k) => {
    const filled = grid.flatMap((row, r) => (BLOCK.test(row[x] ?? '') ? [r] : []))
    const y = Number(values[k]) < 0 ? (filled.at(-1) ?? base) + 1 : (filled[0] ?? base) - 1
    const text = [...values[k]!]
    const bar = grid[filled[0] ?? -1] ?? []
    let [left, right] = [x, x]
    while (BLOCK.test(bar[left - 1] ?? '')) left--
    while (BLOCK.test(bar[right + 1] ?? '')) right++
    const from = left + Math.ceil((right - left + 1 - text.length) / 2)
    const row = y < axis ? grid[y] : undefined
    if (!row) return
    while (row.length < from + text.length) row.push(' ')
    if (!text.every((_, i) => /[ ·]/.test(row[from + i] ?? ' '))) return
    text.forEach((ch, i) => (row[from + i] = ch))
  })
  return grid.map(row => row.join('').trimEnd()).join('\n').replace(/^\n/, '')
}

const SIDEWAYS = /^(\s*(?:flowchart|graph)[ \t]+)(LR|RL)\b/

const SUPPORTED = /^(flowchart|graph|statediagram(-v2)?|xychart(-beta)?|sequencediagram|classdiagram|erdiagram|pie|gantt)$/i

const kindOf = (source: string) => source.replace(/^(\s*%%[^\n]*\n)+/, '').trim().split(/\s/)[0] ?? ''

const unsupportedKind = (source: string): string | undefined => {
  const kind = kindOf(source)
  return kind && !SUPPORTED.test(kind) ? kind : undefined
}

const OWN: Record<string, typeof pieText> = { pie: pieText, gantt: ganttText }

const INLINE_TAG = /<\/?(?:b|i|u|s|em|strong|del|code|small|sub|sup|span|mark)\b[^<>\n]*>/gi

type Mark = { italic?: boolean; bold?: boolean; underline?: boolean; strikethrough?: boolean }
const TAG_MARK: Record<string, keyof Mark> = { i: 'italic', em: 'italic', b: 'bold', strong: 'bold', u: 'underline', s: 'strikethrough', del: 'strikethrough' }

export const inlineMarks = (source: string): [string[], Mark][] =>
  [...source.matchAll(/<(i|em|b|strong|u|s|del)\b[^<>\n]*>([^<\n]+)<\/\1\s*>/gi)]
    .map(m => [cells(m[2]!.trim()), { [TAG_MARK[m[1]!.toLowerCase()]!]: true }] as [string[], Mark])

const fitted = new Map<string, string | null>()
const artWidths = new Map<string, number>()
const artWidth = (art: string) => remember(artWidths, art, () => Math.max(...art.split('\n').map(width)))

export const mermaidText = (source: string, ascii: boolean, columns: number): string | null =>
  remember(fitted, `${ascii}:${columns}:${source}`, () => {
    source = source.replace(INLINE_TAG, '')
    if (source.length > 8000 || source.split('\n').length > MAX_LINES) return null
    const own = OWN[kindOf(source).toLowerCase()]
    if (own) return own(source, ascii, columns)
    const art = draw(source, ascii, columns)
    if (art === null || artWidth(art) <= columns - 2 || !SIDEWAYS.test(source)) return art
    return draw(source.replace(SIDEWAYS, '$1TD'), ascii, columns) ?? art
  })

const draw = (source: string, ascii: boolean, columns: number): string | null => {
  const isChart = /^\s*xychart/.test(source)
  const padded = padWide(source)
  const size = chartSize(columns, isChart ? padded : '')
  const key = `${ascii}:${isChart ? size.width : 0}:${source}`
  return remember(textCache, key, () => {
    try {
      if (isChart) setChartSize(size.width, size.height)
      const art = renderMermaidAscii(unquoteCategories(padded.replace(/^(\s*%%[^\n]*\n)+/, '')).replace(/(-->|-\.->|==>|---|-\.-|===)[ \t]+\|/g, '$1|'), { useAscii: ascii, colorMode: 'none', paddingX: 3, paddingY: 1 }).replace(/[ \t]+$/gm, '').trimEnd().replace(/▶/g, '►').replace(/◀/g, '◄')
      return (isChart ? labelBars(art, padded) : art.split('\n').filter(l => !/^[\s│|]*$/.test(l)).join('\n')).replaceAll(PAD, '')
    } catch {
      return null
    }
  })
}

const LINE = /[─-╿◇▏]/
const ARROW = /[►◄▲▼]/

type Painted = { grid: string[][]; colors: (string | undefined)[][] }

const paint = (art: string, style: Style): Painted => {
  const t = style.theme
  const grid = art.split('\n').map(cells)
  const cell = (r: number, c: number) => grid[r]?.[c] ?? ''
  const color: (string | undefined)[][] = grid.map(row => row.map(() => undefined))
  const palette = [...new Set([t.link, t.number, t.heading, t.emphasis, t.path, t.codeFlag, t.accent])].filter((c): c is string => c !== undefined)
  const next = (i: number) => palette[i % palette.length]
  const labels = new Map<string, string | undefined>()

  const rects: { r: number; c: number; r2: number; c2: number }[] = []
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
      if (!/[┌╭(]/.test(cell(r, c))) continue
      let c2 = c + 1
      while (/[─┬┴┼▲▼]/.test(cell(r, c2))) c2++
      if (!/[┐╮)]/.test(cell(r, c2)) || c2 === c + 1) continue
      let r2 = r + 1
      while (/[│├┤┼►◄]/.test(cell(r2, c))) r2++
      if (!/[└╰(]/.test(cell(r2, c)) || !/[┘╯)]/.test(cell(r2, c2))) continue
      rects.push({ r, c, r2, c2 })
    }
  }
  const inside = (a: (typeof rects)[number], b: (typeof rects)[number]) => a !== b && b.r > a.r && b.r2 < a.r2 && b.c > a.c && b.c2 < a.c2
  for (const box of rects.filter(a => !rects.some(b => inside(a, b)))) {
    const { r, c, r2, c2 } = box
    const label = grid.slice(r + 1, r2).map(row => row.slice(c + 1, c2).join('')).join(' ').trim()
    if (!labels.has(label)) labels.set(label, next(labels.size))
    const hue = labels.get(label)
    for (let y = r; y <= r2; y++) for (let x = c; x <= c2; x++) if (cell(y, x).trim()) color[y]![x] = hue
  }

  const bars = [...new Set(grid.flatMap(row => row.flatMap((ch, c) => (BLOCK.test(ch) && row[c - 1] !== ch ? [c] : []))))].sort((a, b) => a - b)
  const ends = bars.map(x => {
    const row = grid.find(row => BLOCK.test(row[x] ?? ''))!
    let end = x
    while (row[end + 1] === row[x]) end++
    return end
  })
  const tops = bars.map(x => {
    const r = grid.findIndex(row => BLOCK.test(row[x] ?? ''))
    return r * 2 + (grid[r]![x] === '▄' ? 1 : 0)
  })
  const single = bars.length > 1 && bars.every((x, i) => i === 0 || x - ends[i - 1]! > 2)
  const barColor = (i: number) => (single ? (tops[i] === Math.min(...tops) ? t.emphasis ?? t.accent : t.quote) : next(i))
  grid.forEach((row, r) =>
    row.forEach((ch, c) => {
      if (color[r]![c] !== undefined) return
      if (BLOCK.test(ch)) {
        let start = c
        while (row[start - 1] === ch) start--
        color[r]![c] = barColor(bars.indexOf(start))
      } else if (ch === '·') color[r]![c] = t.rule
      else if (ARROW.test(ch)) color[r]![c] = t.accent
      else if (LINE.test(ch)) color[r]![c] = t.diagram
      else if (/^\d+[┤┼]/.test(row.slice(c).join(''))) color[r]![c] = t.number
      else color[r]![c] = t.diagramText
    }),
  )
  return { grid, colors: color }
}

const painted = new WeakMap<Theme, Map<string, Painted>>()

export const boxArt = ({ Box, Text }: ElementTable, style: Style, art: string, key: string, marks: [string[], Mark][] = []): RenderElement => {
  const cache = painted.get(style.theme) ?? new Map<string, Painted>()
  painted.set(style.theme, cache)
  const { grid, colors } = remember(cache, art, () => paint(art, style))
  return (
    <Box key={key} flexDirection="column" paddingLeft={mirrored(style) ? 0 : 2}>
      {grid.map((row, i) => {
        const { cells: chars, from } = mirrored(style) ? led(row, holdRow(row)) : style.shape === 'engine' ? holdEngine(row) : style.reorder && style.shape === 'visual' ? holdVisual(row) : asIs(row)
        const marked: (Mark | undefined)[] = row.map(() => undefined)
        for (const [phrase, mark] of marks)
          for (let c = 0; c + phrase.length <= row.length; c++)
            if (phrase.every((ch, k) => row[c + k] === ch)) for (let k = 0; k < phrase.length; k++) marked[c + k] = mark
        const hueAt = (p: number) => colors[i]?.[from[p]!]
        const markAt = (p: number) => marked[from[p]!]
        const parts: RenderElement[] = []
        let at = 0
        while (at < chars.length) {
          const hue = hueAt(at)
          const mark = markAt(at)
          let end = at + 1
          while (end < chars.length && hueAt(end) === hue && markAt(end) === mark) end++
          parts.push(<Text key={`t${parts.length}`} color={hue} {...mark}>{chars.slice(at, end).join('')}</Text>)
          at = end
        }
        return <Text key={`${key}.${i}`} {...heldLtr(style)}>{parts.length ? parts : ' '}</Text>
      })}
    </Box>
  )
}

const EDGE_LABEL = /(-[-.=]+\s*)"([^"\n]+)"(\s*[-.=]+>)|\|([^|\n]+)\|/g

const cap = (label: string, max: number) => {
  const flat = label.replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim()
  const chars = graphemes(flat)
  return chars.length > max ? `${chars.slice(0, max - 1).join('').trimEnd()}…` : flat
}

export const shortenEdgeLabels = (source: string, max: number): string =>
  source.replace(EDGE_LABEL, (m, open, quoted, close, piped) =>
    quoted !== undefined ? `${open}"${cap(quoted, max)}"${close}` : `|${cap(piped, max)}|`)

export const drawDiagrams = (el: ElementTable, style: Style, blocks: Block[], columns: number): Drawn => {
  const drawn: Drawn = new Map()
  if (style.mermaid) {
    for (const [i, block] of blocks.entries()) {
      if (block.kind !== 'code' || block.lang.toLowerCase() !== 'mermaid') continue
      const source = block.lines.join('\n')
      let narrowest = Infinity
      for (const max of [Infinity, 24, 12]) {
        const art = mermaidText(max === Infinity ? source : shortenEdgeLabels(source, max), style.mermaidAscii, columns)
        const wide = art === null ? Infinity : artWidth(art)
        narrowest = Math.min(narrowest, wide)
        if (art === null || wide > columns - 2) continue
        drawn.set(i, { element: boxArt(el, style, art, `b${i}`, inlineMarks(source)), art })
        break
      }
      if (!drawn.has(i) && !block.isOpen) {
        const kind = unsupportedKind(source)
        drawn.set(i, { note: kind ? `${kind} diagrams draw as source for now` : narrowest === Infinity ? 'diagram failed to render' : `diagram is ${narrowest} cols, terminal is ${columns}` })
      }
    }
  }
  for (const [i, block] of blocks.entries()) {
    if (block.kind !== 'code' || !isFigureLang(block.lang)) continue
    const figure = drawFigure(el, style, block, columns, `b${i}`)
    if (figure) drawn.set(i, figure)
  }
  return drawn
}
