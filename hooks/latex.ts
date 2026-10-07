import type { FormulaPicture as Picture } from '../types'
import type { Block } from './markdown'
import type { Style } from './theme'

type Size = { width: number; height: number }
type Fit = { columns: number; rows: number }

const LATEX_SIZES = { small: 0.8, normal: 1, large: 1.4 } as const

export const LATEX_FONT_PX = 80
export const LATEX_DPR = 1
const PX_PER_ROW = LATEX_FONT_PX * LATEX_DPR
const CELL_RATIO = 0.5
const RATEX_MARGIN_PX = 10
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

const ANSI16 = ['000000', 'cd0000', '00cd00', 'cdcd00', '0000ee', 'cd00cd', '00cdcd', 'e5e5e5', '7f7f7f', 'ff0000', '00ff00', 'ffff00', '5c5cff', 'ff00ff', '00ffff', 'ffffff']
const ANSI_NAMES = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']

const hex = (...rgb: number[]): string => `#${rgb.map(n => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')).join('')}`

const ansi256 = (n: number): string => {
  if (n < 16) return `#${ANSI16[n]}`
  const level = (v: number) => (v ? 55 + v * 40 : 0)
  if (n < 232) return hex(level(Math.floor((n - 16) / 36)), level(Math.floor((n - 16) / 6) % 6), level((n - 16) % 6))
  const gray = 8 + (n - 232) * 10
  return hex(gray, gray, gray)
}

export const ratexColor = (color: string): string => {
  const c = color.trim()
  const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(c)
  if (rgb) return hex(...rgb.slice(1).map(Number))
  const ansi = /^ansi256\((\d+)\)$/i.exec(c)
  if (ansi) return ansi256(Number(ansi[1]))
  const name = /^(black|red|green|yellow|blue|magenta|cyan|white|gray|grey)(bright)?$/i.exec(c)
  if (!name?.[2]) return c
  const base = name[1]!.toLowerCase()
  return `#${ANSI16[base === 'gray' || base === 'grey' ? 8 : ANSI_NAMES.indexOf(base) + 8]}`
}

const MAX_FORMULAS = 50

export const keepFormulas = <T,>(store: Record<string, T>, fresh: readonly (readonly [string, T])[], wanted: ReadonlySet<string>): Record<string, T> => {
  const added = new Set(fresh.map(([key]) => key))
  const entries = [...Object.entries(store).filter(([key]) => !added.has(key)), ...fresh]
  const spare = entries.filter(([key]) => !wanted.has(key) && !added.has(key)).map(([key]) => key)
  const dropped = new Set(spare.slice(0, Math.max(0, entries.length - MAX_FORMULAS)))
  return Object.fromEntries(entries.filter(([key]) => !dropped.has(key)))
}

export const fitsImage = (base64: string): boolean => (base64.length * 3) / 4 <= MAX_IMAGE_BYTES

const naturalRows = (size: Size, style: Style): number => (size.height * LATEX_SIZES[style.latexSize]) / PX_PER_ROW

export const padFor = (size: Size, style: Style): { rows: number; fontSize: number; dpr: number } | null => {
  const natural = naturalRows(size, style)
  const below = Math.floor(natural)
  const above = Math.max(1, Math.ceil(natural))
  if ((below >= 1 && below / natural >= 0.9) || above / natural <= 1.05) return null
  const dpr = LATEX_DPR + ((above * PX_PER_ROW) / LATEX_SIZES[style.latexSize] - size.height) / (2 * RATEX_MARGIN_PX)
  return { rows: above, fontSize: PX_PER_ROW / dpr, dpr }
}

export const mathOf = (block: Block): string | null => {
  if (block.kind !== 'code' || block.lang.toLowerCase() !== 'math' || block.isOpen) return null
  const tex = block.lines.map(line => line.replace(/(^|[^\\])%.*$/, '$1')).join(' ').replace(/\s+/g, ' ').trim()
  return tex === '' || tex.startsWith('#') ? null : tex
}

export const pngSize = (base64: string): Size | null => {
  const head = atob(base64.slice(0, 32))
  if (!head.startsWith('\x89PNG')) return null
  const word = (at: number) => [0, 1, 2, 3].reduce((n, i) => n * 256 + head.charCodeAt(at + i), 0)
  return { width: word(16), height: word(20) }
}

const rowsOf = (size: Size, style: Style): number => Math.min(255, Math.max(1, Math.round(naturalRows(size, style))))

const fitFormula = (size: Size, style: Style, columns: number): Fit | null => {
  const aspect = size.width / size.height / CELL_RATIO
  const room = Math.min(255, columns - 2)
  let rows = rowsOf(size, style)
  while (rows > 1 && Math.round(aspect * rows) > room) rows--
  const width = Math.max(1, Math.round(aspect * rows))
  return width <= room ? { columns: width, rows } : null
}

export const pickFormula = (formula: Picture & { padded?: Picture }, style: Style, columns: number): { picture: Picture; fit: Fit } | null => {
  if (formula.padded) {
    const fit = fitFormula(formula.padded, style, columns)
    if (fit && fit.rows === rowsOf(formula.padded, style)) return { picture: formula.padded, fit }
  }
  const fit = fitFormula(formula, style, columns)
  return fit ? { picture: formula, fit } : null
}

export const renderedOf = (stdout: string): Set<number> => new Set([...stdout.matchAll(/^OK\s+(\d+)\s/gm)].map(m => Number(m[1])))
