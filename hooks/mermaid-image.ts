import { ratexColor } from './latex'
import type { Block } from './markdown'
import { unsupportedKind } from './mermaid'
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
    const svg = renderMermaidSVG(source, { bg, fg, accent: colors.accent, font: 'sans-serif', padding: 16, transparent: true })
      .replace(/<style>[\s\S]*?<\/style>/g, css => {
        if (!css.includes('.xychart-')) return '<style>text{font-family:sans-serif}.mono{font-family:monospace}</style>'
        const series = new Map([...css.matchAll(/--xychart-color-(\d+):\s*(#[0-9a-f]+|var\(--accent,[^)]+\))/gi)].map(m => [m[1], m[2]!.startsWith('var') ? colors.accent! : m[2]!]))
        return css.replace(/svg\s*\{[^}]*\}/g, '')
          .replace(/var\(--xychart-(?:color|bar-fill)-(\d+)\)/g, (_, index: string) => series.get(index) ?? colors.accent!)
          .replace('.xychart-bar {', '.xychart-bar { fill-opacity:0.25;')
      })
      .replace(/var\(--([\w-]+)\)/g, (_, key: string) => colors[key.replaceAll('-', '_')] ?? fg)
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
