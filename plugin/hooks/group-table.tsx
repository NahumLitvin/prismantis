import { inlineText } from './markdown'
import type { TableCell, TableBlock } from './markdown'
import type { Theme } from './theme'

export type GroupTable = 'off' | 'merge' | 'count' | 'full'

export type Group = { column: number; starts: boolean[]; sizes: number[] }

type Look = { color?: string }

const text = (cell: TableCell): string => inlineText(cell).trim()

const LETTER = /\p{L}/u

const startsOf = (labels: string[]): boolean[] => labels.map((label, r) => r === 0 || label !== labels[r - 1])

const sizesOf = (labels: string[]): number[] => {
  const sizes = labels.map(() => 0)
  let start = 0
  labels.forEach((label, r) => {
    if (r === 0 || label === labels[r - 1]) return
    for (let i = start; i < r; i++) sizes[i] = r - start
    start = r
  })
  for (let i = start; i < labels.length; i++) sizes[i] = labels.length - start
  return sizes
}

const runOf = (block: TableBlock, c: number): Group | undefined => {
  const labels = block.rows.map(row => text(row[c]!))
  if (labels.some(label => label === '' || !LETTER.test(label))) return undefined
  const starts = startsOf(labels)
  const sizes = sizesOf(labels)
  const runs = starts.filter(Boolean).length
  if (runs < 2 || runs === labels.length) return undefined
  if (starts.filter((start, r) => start && sizes[r]! >= 2).length < 2) return undefined
  return { column: c, starts, sizes }
}

export const groupOf = (block: TableBlock, option: GroupTable, statusGrouped: boolean): Group | undefined => {
  if (option === 'off' || statusGrouped || block.rows.length < 4) return undefined
  for (let c = 0; c < block.header.length; c++) {
    const group = runOf(block, c)
    if (group) return group
  }
  return undefined
}

export const groupRows = (block: TableBlock, group: Group | undefined, option: GroupTable): TableCell[][] => {
  if (!group) return block.rows
  return block.rows.map((cells, r) => {
    const label = group.starts[r] ? text(cells[group.column]!) : ''
    const shown = group.starts[r] && option !== 'merge' ? `${label} (${group.sizes[r]})` : label
    return cells.map((cell, c) => (c === group.column ? [{ kind: 'text' as const, text: shown }] : cell))
  })
}

export const groupLook = (t: Theme, group: Group | undefined, at: number | undefined, c: number, plain: Look = {}): Look =>
  group !== undefined && at !== undefined && c === group.column && group.starts[at] ? { color: t.accent } : plain

export const groupEdge = (option: GroupTable, group: Group | undefined, i: number, plain: string, heavy: string): string =>
  option === 'full' && group !== undefined && group.starts[i] === true ? heavy : plain

export const groupHeavy = (option: GroupTable, group: Group | undefined, i: number): boolean =>
  option === 'full' && group !== undefined && group.starts[i + 1] === true
