import type { ElementTable, RenderElement } from 'claude-code'

import { cells } from './render'
import type { Style } from './theme'

export type GridRun = {
  text: string
  color?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  dim?: boolean
}

export const CELL_W = 8
export const CELL_H = 18
const FONT_PX = 13
const BASELINE = 13
const MAX_SOURCE = 131072
const FONT = "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Monaco, Consolas, 'DejaVu Sans Mono', monospace"

const ARMS: Record<string, [number, number, number, number]> = {
  '─': [0, 1, 0, 1], '│': [1, 0, 1, 0], '┌': [0, 1, 1, 0], '┐': [0, 0, 1, 1], '└': [1, 1, 0, 0], '┘': [1, 0, 0, 1],
  '├': [1, 1, 1, 0], '┤': [1, 0, 1, 1], '┬': [0, 1, 1, 1], '┴': [1, 1, 0, 1], '┼': [1, 1, 1, 1],
  '╭': [0, 1, 1, 0], '╮': [0, 0, 1, 1], '╰': [1, 1, 0, 0], '╯': [1, 0, 0, 1],
  '╴': [0, 0, 0, 1], '╵': [1, 0, 0, 0], '╶': [0, 1, 0, 0], '╷': [0, 0, 1, 0],
  '━': [0, 2, 0, 2], '┃': [2, 0, 2, 0], '┏': [0, 2, 2, 0], '┓': [0, 0, 2, 2], '┗': [2, 2, 0, 0], '┛': [2, 0, 0, 2],
  '┣': [2, 2, 2, 0], '┫': [2, 0, 2, 2], '┳': [0, 2, 2, 2], '┻': [2, 2, 0, 2], '╋': [2, 2, 2, 2],
  '═': [0, 3, 0, 3], '║': [3, 0, 3, 0], '╔': [0, 3, 3, 0], '╗': [0, 0, 3, 3], '╚': [3, 3, 0, 0], '╝': [3, 0, 0, 3],
  '╠': [3, 3, 3, 0], '╣': [3, 0, 3, 3], '╦': [0, 3, 3, 3], '╩': [3, 3, 0, 3], '╬': [3, 3, 3, 3],
  '╞': [1, 3, 1, 0], '╡': [1, 0, 1, 3], '╪': [1, 3, 1, 3], '╟': [3, 1, 3, 0], '╢': [3, 0, 3, 1], '╫': [3, 1, 3, 1],
  '╤': [0, 3, 1, 3], '╧': [1, 3, 0, 3], '╥': [0, 1, 3, 1], '╨': [3, 1, 0, 1],
  '┝': [1, 2, 1, 0], '┥': [1, 0, 1, 2], '┿': [1, 2, 1, 2], '┯': [0, 2, 1, 2], '┷': [1, 2, 0, 2],
}

const BLOCKS: Record<string, [number, number, number, number, number?]> = {
  '█': [0, 0, 8, 8], '▀': [0, 0, 8, 4], '▄': [0, 4, 8, 4], '▌': [0, 0, 4, 8], '▐': [4, 0, 4, 8],
  '▏': [0, 0, 1, 8], '▕': [7, 0, 1, 8], '▁': [0, 7, 8, 1], '▔': [0, 0, 8, 1],
  '▂': [0, 6, 8, 2], '▃': [0, 5, 8, 3], '▅': [0, 3, 8, 5], '▆': [0, 2, 8, 6], '▇': [0, 1, 8, 7],
  '▎': [0, 0, 2, 8], '▍': [0, 0, 3, 8], '▋': [0, 0, 5, 8], '▊': [0, 0, 6, 8], '▉': [0, 0, 7, 8],
  '░': [0, 0, 8, 8, 0.25], '▒': [0, 0, 8, 8, 0.5], '▓': [0, 0, 8, 8, 0.75],
}

const STROKE = [0, 1.25, 2.5, 1] as const
const DOUBLE_GAP = 1.5

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

type Paint = { fill: string; opacity: number }
type TextStyle = Omit<GridRun, 'text'>

const styleKey = (s: TextStyle) => `${s.color ?? ''}|${s.bold ? 1 : 0}${s.italic ? 1 : 0}${s.underline ? 1 : 0}${s.strikethrough ? 1 : 0}${s.dim ? 1 : 0}`

export const gridSvg = (rows: readonly (readonly GridRun[])[], fallback: string): { source: string; width: number; height: number } | null => {
  const paint = (s: TextStyle): Paint => ({ fill: s.color ?? fallback, opacity: s.dim ? 0.55 : 1 })
  const horizontal = new Map<string, Map<number, [number, number][]>>()
  const vertical = new Map<string, Map<number, [number, number][]>>()
  const rects = new Map<string, string[]>()
  const texts: string[] = []
  let columns = 0

  const segment = (into: typeof horizontal, key: string, line: number, from: number, to: number) => {
    const byLine = into.get(key) ?? new Map<number, [number, number][]>()
    into.set(key, byLine)
    const spans = byLine.get(line) ?? []
    byLine.set(line, spans)
    const last = spans.at(-1)
    if (last && Math.abs(last[1] - from) < 0.01) last[1] = to
    else spans.push([from, to])
  }

  rows.forEach((runs, r) => {
    let c = 0
    let pending: { start: number; text: string[]; style: TextStyle } | null = null
    const flush = () => {
      if (!pending) return
      const { start, text, style } = pending
      pending = null
      const p = paint(style)
      const deco = [style.underline && 'underline', style.strikethrough && 'line-through'].filter(Boolean).join(' ')
      const attrs =
        ` fill="${escape(p.fill)}"${p.opacity < 1 ? ` fill-opacity="${p.opacity}"` : ''}${style.bold ? ' font-weight="700"' : ''}` +
        `${style.italic ? ' font-style="italic"' : ''}${deco ? ` text-decoration="${deco}"` : ''}`
      const whole = Boolean(deco)
      let i = 0
      while (i < text.length) {
        if (text[i] === ' ') { i++; continue }
        let end = i
        while (end < text.length && (whole || text[end] !== ' ')) end++
        while (whole && end > i && text[end - 1] === ' ') end--
        const word = text.slice(i, end).join('')
        if (word.trim()) texts.push(`<text x="${(start + i) * CELL_W}" y="${r * CELL_H + BASELINE}" textLength="${(end - i) * CELL_W}" lengthAdjust="spacingAndGlyphs"${attrs}>${escape(word)}</text>`)
        i = whole ? text.length : Math.max(end, i + 1)
      }
    }
    for (const run of runs) {
      const style: TextStyle = { color: run.color, bold: run.bold, italic: run.italic, underline: run.underline, strikethrough: run.strikethrough, dim: run.dim }
      const p = paint(style)
      const key = `${p.fill}|${p.opacity}`
      for (const ch of cells(run.text)) {
        if (ch === '') { if (pending) pending.text.push(''); c++; continue } // second half of a wide glyph
        const arms = ARMS[ch]
        const block = BLOCKS[ch]
        if (arms || block) {
          flush()
          const x = c * CELL_W
          const y = r * CELL_H
          if (block) {
            const [bx, by, bw, bh, alpha] = block
            const k = `${p.fill}|${p.opacity * (alpha ?? 1)}`
            const list = rects.get(k) ?? []
            rects.set(k, list)
            list.push(`M${x + (bx * CELL_W) / 8} ${y + (by * CELL_H) / 8}h${(bw * CELL_W) / 8}v${(bh * CELL_H) / 8}h${(-bw * CELL_W) / 8}z`)
          } else if (arms) {
            const cx = x + CELL_W / 2
            const cy = y + CELL_H / 2
            const [up, right, down, left] = arms
            const reach = (weight: number, other: number) => (weight === 3 || other === 3 ? 0 : STROKE[Math.max(weight, other)]! / 2)
            const h = Math.max(left, right)
            if (h) {
              const offsets = h === 3 ? [-DOUBLE_GAP, DOUBLE_GAP] : [0]
              for (const o of offsets) {
                const from = left ? x : cx - reach(h, Math.max(up, down))
                const to = right ? x + CELL_W : cx + reach(h, Math.max(up, down))
                segment(horizontal, `${key}|${h}`, cy + o, from, to)
              }
            }
            const v = Math.max(up, down)
            if (v) {
              const offsets = v === 3 ? [-DOUBLE_GAP, DOUBLE_GAP] : [0]
              for (const o of offsets) {
                const from = up ? y : cy - reach(v, h)
                const to = down ? y + CELL_H : cy + reach(v, h)
                segment(vertical, `${key}|${v}`, cx + o, from, to)
              }
            }
          }
          c++
          continue
        }
        if (!pending || styleKey(pending.style) !== styleKey(style)) {
          flush()
          pending = { start: c, text: [], style }
        }
        pending.text.push(ch)
        c++
      }
    }
    flush()
    columns = Math.max(columns, c)
  })

  const paths: string[] = []
  const strokes = (key: string, d: string) => {
    const [fill, opacity, weight] = key.split('|')
    paths.push(`<path d="${d}" stroke="${escape(fill!)}"${Number(opacity) < 1 ? ` stroke-opacity="${opacity}"` : ''} stroke-width="${STROKE[Number(weight)]}" fill="none"/>`)
  }
  const merge = (spans: [number, number][]) => {
    const sorted = [...spans].sort((a, b) => a[0] - b[0])
    const out: [number, number][] = []
    for (const s of sorted) {
      const last = out.at(-1)
      if (last && s[0] <= last[1] + 0.01) last[1] = Math.max(last[1], s[1])
      else out.push([...s])
    }
    return out
  }
  const round = (n: number) => Math.round(n * 100) / 100
  for (const [key, byLine] of horizontal)
    strokes(key, [...byLine].flatMap(([y, spans]) => merge(spans).map(([a, b]) => `M${round(a)} ${round(y)}H${round(b)}`)).join(''))
  for (const [key, byLine] of vertical)
    strokes(key, [...byLine].flatMap(([x, spans]) => merge(spans).map(([a, b]) => `M${round(x)} ${round(a)}V${round(b)}`)).join(''))
  for (const [key, list] of rects) {
    const [fill, opacity] = key.split('|')
    paths.push(`<path d="${list.join('')}" fill="${escape(fill!)}"${Number(opacity) < 1 ? ` fill-opacity="${opacity}"` : ''} shape-rendering="crispEdges"/>`)
  }

  const width = Math.max(1, columns) * CELL_W
  const height = Math.max(1, rows.length) * CELL_H
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<g font-family="${escape(FONT)}" font-size="${FONT_PX}" xml:space="preserve" style="white-space:pre">${paths.join('')}${texts.join('')}</g></svg>`
  return source.length > MAX_SOURCE ? null : { source, width, height }
}

export const artSvg = (el: ElementTable, style: Style, rows: GridRun[][], alt: string, key: string, paddingLeft = 2): RenderElement | null => {
  const { Box, Svg } = el as ElementTable & Partial<Pick<ElementTable<'desktop'>, 'Svg'>>
  if (!style.svgArt || !Svg) return null
  const drawn = gridSvg(rows, style.theme.diagramText ?? style.theme.codeText ?? '#9a9a9a')
  if (!drawn) return null
  return (
    <Box key={key} paddingLeft={paddingLeft} flexShrink={0}>
      <Svg source={drawn.source} alt={alt} />
    </Box>
  )
}
