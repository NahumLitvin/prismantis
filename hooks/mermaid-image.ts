import { ratexColor } from './latex'
import type { Block } from './markdown'
import { boxPalette, unsupportedKind } from './mermaid'
import { remember } from './render'
import type { Theme } from './theme'
import { renderMermaidSVG } from './vendor/mermaid-svg.js'

export type DiagramImage = { png: string; columns: number; rows: number }
export type DiagramResult = DiagramImage | { error: true }

const cache = new Map<string, string | null>()

export const diagramSource = (block: Block): string | null => {
  if (block.kind !== 'code' || block.lang.toLowerCase() !== 'mermaid' || block.isOpen) return null
  const source = block.lines.join('\n')
  return source.length > 8000 || block.lines.length > 80 || unsupportedKind(source) ? null : source
}

export const diagramKey = (source: string, theme: Theme, columns: number) => JSON.stringify([source, theme, columns])

const PAINT = /^(#[0-9a-f]{3,8}|[a-z]+)$/i
const BOX = /<g class="(?:node|actor|class-node|entity)"[^>]*>[\s\S]*?<\/g>/g
const LABEL = /data-label="([^"]*)"/
const AT = /<text\b[^>]*?\bx="([-\d.]+)"[^>]*?\by="([-\d.]+)"/
const BAR = /(<path d="[^"]*" class="xychart-bar xychart-color-(\d+)" data-value="([^"]*)")/g
const TICK = /(<text\b[^>]*class="xychart-label")>(-?[\d.,]+[kMG%]?)<\/text>/g

const paintBoxes = (svg: string, hue: (i: number) => string): string => {
  const boxes = [...svg.matchAll(BOX)].flatMap(([group]) => {
    const label = LABEL.exec(group)?.[1]
    const at = AT.exec(group)
    return label && at ? [{ label, x: Number(at[1]), y: Number(at[2]) }] : []
  })
  const hues = new Map<string, string>()
  for (const { label } of boxes.sort((a, b) => a.y - b.y || a.x - b.x)) if (!hues.has(label)) hues.set(label, hue(hues.size))
  return svg.replace(BOX, group => {
    const color = hues.get(LABEL.exec(group)?.[1] ?? '')
    if (!color) return group
    return group
      .replace(/(<(?:rect|polygon|path|ellipse|circle|line|polyline)\b[^>]*?\bstroke=")(?!none")[^"]*"/g, `$1${color}"`)
      .replace(/(<(?:text|tspan)\b[^>]*?\bfill=")[^"]*"/g, `$1${color}"`)
  })
}

const paintBars = (svg: string, { high, low, number }: Record<'high' | 'low' | 'number', string>): string => {
  const bars = [...svg.matchAll(BAR)]
  const top = Math.max(...bars.map(b => Number(b[3])))
  const single = bars.length > 1 && new Set(bars.map(b => b[2])).size === 1
  const painted = single ? svg.replace(BAR, (bar, _head, _series, value: string) => `${bar} style="fill:${Number(value) === top ? high : low};stroke:${Number(value) === top ? high : low}"`) : svg
  return painted.replace(TICK, (_, head: string, value: string) => `${head} style="fill:${number}">${value}</text>`)
}

export const diagramSvg = (source: string, theme: Theme): string | null => remember(cache, JSON.stringify([source, theme]), () => {
  try {
    const color = (value: string | undefined, fallback: string) => ratexColor(value ?? fallback)
    const fg = color(theme.diagramText, '#cdd6f4')
    const rgb = /^#[0-9a-f]{6}$/i.test(fg) ? [1, 3, 5].map(i => parseInt(fg.slice(i, i + 2), 16)) : [205, 214, 244]
    const bg = rgb[0]! * 0.299 + rgb[1]! * 0.587 + rgb[2]! * 0.114 > 128 ? '#181825' : '#ffffff'
    const colors: Record<string, string> = {
      bg, fg, _text: fg,
      _text_sec: color(theme.quote, fg), _text_muted: color(theme.quote, fg), _text_faint: color(theme.codeComment, fg),
      _line: color(theme.diagram, fg), _arrow: color(theme.accent, fg),
      _node_fill: bg, _node_stroke: color(theme.diagram, fg), _group_fill: bg,
      _group_hdr: bg, _inner_stroke: color(theme.rule, fg), _key_badge: bg,
      accent: color(theme.accent, fg),
    }
    const palette = boxPalette(theme).map(c => ratexColor(c)).filter(c => PAINT.test(c))
    const hue = (i: number) => palette[i % palette.length] ?? colors.accent!
    const drawn = renderMermaidSVG(source, { bg, fg, accent: colors.accent, font: 'sans-serif', padding: 16, transparent: true })
      .replace(/<style>[\s\S]*?<\/style>/g, css => {
        if (!css.includes('.xychart-')) return '<style>text{font-family:sans-serif}.mono{font-family:monospace}</style>'
        return css.replace(/svg\s*\{[^}]*\}/g, '')
          .replace(/var\(--xychart-(?:color|bar-fill)-(\d+)\)/g, (_, index: string) => hue(Number(index)))
          .replace('.xychart-bar {', '.xychart-bar { fill-opacity:0.85;')
      })
      .replace(/var\(--([\w-]+)\)/g, (_, key: string) => colors[key.replaceAll('-', '_')] ?? fg)
    const svg = paintBars(paintBoxes(drawn, hue), { high: color(theme.emphasis ?? theme.accent, fg), low: color(theme.quote, fg), number: color(theme.number, fg) })
    if (svg.length > 250000 || /<!|<(?:script|image|use|foreignObject)\b|(?:href|src)\s*=|@import|url\(\s*["']?(?!#)[^\s)]/i.test(svg)) return null
    return svg
  } catch {
    return null
  }
}, 20)

export const fitDiagram = (svg: string, available: number): { svg: string; columns: number; rows: number } | null => {
  const size = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)
  if (!size) return null
  const [width, height] = size.slice(1).map(Number) as [number, number]
  if (!(width > 0 && height > 0 && Number.isFinite(width) && Number.isFinite(height))) return null
  const scale = Math.min(1, Math.max(1, Math.min(255, available - 2)) * 8 / width, 48 * 16 / height)
  const columns = Math.max(1, Math.ceil(width * scale / 8))
  const rows = Math.max(1, Math.ceil(height * scale / 16))
  return { svg: svg.replace(/^(<svg\b[^>]*?) width="[^"]+" height="[^"]+"/, `$1 width="${columns * 16}" height="${rows * 32}"`), columns, rows }
}
