import type { ElementTable, RenderElement } from 'claude-code'

import { cells, graphemes, remember, width } from './render'
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

const labelBars = (art: string, source: string): string => {
  const series = source.match(/^\s*(bar|line)\b.*$/gm) ?? []
  const values = /^\s*bar\b[^[\n]*\[([^\]\n]*)\]/m.exec(source)?.[1]?.split(',').map(v => v.trim())
  if (series.length !== 1 || !values || /^\s*xychart(-beta)?\s+horizontal/m.test(source)) return art
  const grid = art.split('\n').map(l => [...l])
  const axis = grid.findLastIndex(row => row.includes('┬'))
  const ticks = grid[axis]?.flatMap((ch, x) => (ch === '┬' ? [x] : [])) ?? []
  if (ticks.length !== values.length) return art
  ticks.forEach((x, k) => {
    const top = grid.findIndex(row => row[x] === '█')
    const y = top === -1 ? axis - 1 : top - 1
    const text = [...values[k]!]
    const from = x - Math.floor((text.length - 1) / 2)
    const row = grid[y]
    if (!row || y < 0) return
    while (row.length < from + text.length) row.push(' ')
    if (!text.every((_, i) => /[ ·]/.test(row[from + i] ?? ' '))) return
    text.forEach((ch, i) => (row[from + i] = ch))
  })
  return grid.map(row => row.join('').trimEnd()).join('\n')
}

const SIDEWAYS = /^(\s*(?:flowchart|graph)[ \t]+)(LR|RL)\b/

const SUPPORTED = /^(flowchart|graph|statediagram(-v2)?|xychart(-beta)?|sequencediagram|classdiagram|erdiagram)$/i

export const unsupportedKind = (source: string): string | undefined => {
  const kind = source.replace(/^(\s*%%[^\n]*\n)+/, '').trim().split(/\s/)[0] ?? ''
  return kind && !SUPPORTED.test(kind) ? kind : undefined
}

export const mermaidText = (source: string, ascii: boolean, columns: number): string | null => {
  if (source.length > 8000 || source.split('\n').length > MAX_LINES) return null
  const art = draw(source, ascii, columns)
  const fits = (a: string) => a.split('\n').every(l => width(l) <= columns - 2)
  if (art === null || fits(art) || !SIDEWAYS.test(source)) return art
  return draw(source.replace(SIDEWAYS, '$1TD'), ascii, columns) ?? art
}

const evenTicks = (art: string) => {
  const rows = art.split('\n').flatMap((line, i) => (/^\s*-?[\d.,]+[kMG%]?\s*[┤┼+|]/.test(line) ? [i] : []))
  return rows.slice(2).every((row, i) => row - rows[i + 1]! === rows[1]! - rows[0]!)
}

const draw = (source: string, ascii: boolean, columns: number): string | null => {
  const isChart = /^\s*xychart/.test(source)
  const padded = padWide(source)
  const size = chartSize(columns, isChart ? padded : '')
  const key = `${ascii}:${isChart ? size.width : 0}:${source}`
  return remember(textCache, key, () => {
    try {
      const render = () => renderMermaidAscii(unquoteCategories(padded.replace(/^(\s*%%[^\n]*\n)+/, '')).replace(/(-->|-\.->|==>|---|-\.-|===)[ \t]+\|/g, '$1|'), { useAscii: ascii, colorMode: 'none', paddingX: 3, paddingY: 1 }).replace(/[ \t]+$/gm, '').trimEnd().replace(/▶/g, '►').replace(/◀/g, '◄')
      let art = ''
      for (const height of isChart ? [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8, -8].map(d => size.height + d).filter(h => h >= 6) : [0]) {
        if (isChart) setChartSize(size.width, height)
        art = render()
        if (!isChart || evenTicks(art)) break
      }
      if (isChart && !evenTicks(art)) {
        setChartSize(size.width, size.height)
        art = render()
      }
      return (isChart ? labelBars(art, padded) : art.split('\n').filter(l => !/^[\s│|]*$/.test(l)).join('\n')).replaceAll(PAD, '')
    } catch {
      return null
    }
  })
}

const LINE = /[─-╿◇]/
const ARROW = /[►◄▲▼]/

const paint = (art: string, style: Style): (string | undefined)[][] => {
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

  const bars = [...new Set(grid.flatMap(row => row.flatMap((ch, c) => (ch === '█' && row[c - 1] !== '█' ? [c] : []))))].sort((a, b) => a - b)
  const ticks = grid.findLast(row => row.includes('┬'))?.filter(ch => ch === '┬').length ?? 0
  const tops = bars.map(x => grid.findIndex(row => row[x] === '█'))
  const single = bars.length > 1 && bars.length <= ticks
  const barColor = (i: number) => (single ? (tops[i] === Math.min(...tops) ? t.emphasis ?? t.accent : t.quote) : next(i))
  grid.forEach((row, r) =>
    row.forEach((ch, c) => {
      if (color[r]![c] !== undefined) return
      if (ch === '█') {
        let start = c
        while (row[start - 1] === '█') start--
        color[r]![c] = barColor(bars.indexOf(start))
      } else if (ch === '·') color[r]![c] = t.rule
      else if (ARROW.test(ch)) color[r]![c] = t.accent
      else if (LINE.test(ch)) color[r]![c] = t.diagram
      else if (/^\d+[┤┼]/.test(row.slice(c).join(''))) color[r]![c] = t.number
      else color[r]![c] = t.diagramText
    }),
  )
  return color
}

const painted = new WeakMap<Theme, Map<string, (string | undefined)[][]>>()

export const boxArt = ({ Box, Text }: ElementTable, style: Style, art: string, key: string): RenderElement => {
  const cache = painted.get(style.theme) ?? new Map<string, (string | undefined)[][]>()
  painted.set(style.theme, cache)
  const colors = remember(cache, art, () => paint(art, style))
  return (
    <Box key={key} flexDirection="column" paddingLeft={2}>
      {art.split('\n').map((line, i) => {
        const chars = cells(line)
        const parts: RenderElement[] = []
        let at = 0
        while (at < chars.length) {
          const hue = colors[i]?.[at]
          let end = at + 1
          while (end < chars.length && colors[i]?.[end] === hue) end++
          parts.push(<Text key={`t${parts.length}`} color={hue}>{chars.slice(at, end).join('')}</Text>)
          at = end
        }
        return <Text key={`${key}.${i}`}>{parts.length ? parts : ' '}</Text>
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
