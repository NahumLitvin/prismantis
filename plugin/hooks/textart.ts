import { cells, graphemes, width } from './layout'

export type Line = { text: string; hue: number[] }
export type Canvas = { grid: string[][]; hues: number[][] }

export const LINE_HUE = -2
export const ARROW_HUE = -3
export const GOOD_HUE = -4
export const BAD_HUE = -5

export const fit = (label: string, max: number) => {
  if (width(label) <= max) return label
  let out = ''
  for (const g of graphemes(label)) {
    if (width(out + g) > max - 1) break
    out += g
  }
  return `${out.trimEnd()}…`
}

export const oneLine = (label: string) => label.replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim()

export const unquote = (text: string) => text.trim().replace(/^"(.*)"$/, '$1')

export const line = (...parts: [string, number][]): Line => ({ text: parts.map(([t]) => t).join(''), hue: parts.flatMap(([t, h]) => cells(t).map(() => h)) })

export const blank = (rows: number, cols: number): Canvas => ({
  grid: Array.from({ length: rows }, () => Array<string>(cols).fill(' ')),
  hues: Array.from({ length: rows }, () => Array<number>(cols).fill(-1)),
})

export const paint = (c: Canvas, row: number, col: number, text: string, hue: number) =>
  cells(text).forEach((ch, k) => {
    c.grid[row]![col + k] = ch
    c.hues[row]![col + k] = hue
  })

export const rows = (c: Canvas): Line[] => c.grid.map((row, r) => ({ text: row.join(''), hue: c.hues[r]! }))

export const art = (lines: Line[]) => ({ text: lines.map(l => l.text.trimEnd()).join('\n'), slices: lines.map(l => l.hue) })
