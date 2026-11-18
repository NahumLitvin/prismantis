import type { ArtPicture } from './clipboard'
import { escapeHtml } from './html'
import { hex } from './latex'

const SIZE = 10
const CELL = 6
const LINE = 12
const PAD = 6
const PIXELS = 1.4
const FACE = "ui-monospace, 'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', monospace"

export const SVG_CELL_ASPECT = LINE / CELL

type Glyph = ArtPicture['lines'][number][number]

type Rect = { x: number; y: number; w: number; h: number; ink: string }

const px = (n: number) => String(Math.round(n * 100) / 100)

const fills = (line: readonly Glyph[], row: number, foreground: readonly number[]): Rect[] =>
  line.flatMap(glyph => (glyph.fill ?? []).map(([x0, y0, x1, y1]) => ({ x: glyph.at + x0!, y: row + y0!, w: x1! - x0!, h: y1! - y0!, ink: hex(...(glyph.color ?? foreground)) })))

const joined = (rects: readonly Rect[], line: (rect: Rect) => string, at: 'x' | 'y', size: 'w' | 'h'): Rect[] =>
  [...rects].sort((a, b) => line(a).localeCompare(line(b)) || a[at] - b[at]).reduce<Rect[]>((out, rect) => {
    const last = out.at(-1)
    if (last && line(last) === line(rect) && last[at] + last[size] === rect[at]) last[size] += rect[size]
    else out.push({ ...rect })
    return out
  }, [])

const merged = (rects: readonly Rect[]): Rect[] => joined(joined(rects, r => `${r.y}:${r.h}:${r.ink}`, 'x', 'w'), r => `${r.x}:${r.w}:${r.ink}`, 'y', 'h')

const rect = ({ x, y, w, h, ink }: Rect) => `<rect x="${px(PAD + x * CELL)}" y="${px(PAD + y * LINE)}" width="${px(w * CELL)}" height="${px(h * LINE)}" fill="${ink}"/>`

const look = (glyph: Glyph, foreground: readonly number[]) => `fill="${hex(...(glyph.color ?? foreground))}"${glyph.bold ? ' font-weight="bold"' : ''}${glyph.italic ? ' font-style="italic"' : ''}`

const sameLook = (a: Glyph, b: Glyph) => a.color?.join() === b.color?.join() && a.bold === b.bold && a.italic === b.italic

const runs = (line: readonly Glyph[]): Glyph[][] =>
  line.filter(glyph => !glyph.fill).reduce<Glyph[][]>((out, glyph) => {
    const last = out.at(-1)
    if (last && sameLook(last[0]!, glyph)) last.push(glyph)
    else out.push([glyph])
    return out
  }, [])

const text = (run: readonly Glyph[], row: number, foreground: readonly number[]) =>
  `<text x="${run.map(glyph => px(PAD + glyph.at * CELL)).join(' ')}" y="${px(PAD + row * LINE + SIZE)}" ${look(run[0]!, foreground)}>${escapeHtml(run.map(glyph => glyph.text).join(''))}</text>`

export const artSvg = ({ lines, columns, foreground, background }: ArtPicture): string => {
  const width = columns * CELL + 2 * PAD
  const height = lines.length * LINE + 2 * PAD
  const marks = [...merged(lines.flatMap((line, row) => fills(line, row, foreground))).map(rect), ...lines.flatMap((line, row) => runs(line).map(run => text(run, row, foreground)))]
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px(width * PIXELS)}" height="${px(height * PIXELS)}" viewBox="0 0 ${width} ${height}" font-family="${FACE}" font-size="${SIZE}" shape-rendering="crispEdges"><rect width="100%" height="100%" rx="6" fill="${hex(...background)}"/>${marks.join('')}</svg>`
}
