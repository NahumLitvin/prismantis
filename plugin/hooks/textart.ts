import { cells, graphemes, width } from './layout'

export type Line = { text: string; hue: number[] }

export const LINE_HUE = -2
export const ARROW_HUE = -3

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
