import { inlineText } from './markdown'
import type { TableAlign, TableBlock, TableCell } from './markdown'

export type PivotTable = 'off' | 'transpose'

const LETTER = /\p{L}/u

const NUMBER = /^-?\d+(?:\.\d+)?[^\d]*$/

const text = (cell: TableCell): string => inlineText(cell).trim()

const isNumber = (cell: TableCell): boolean => NUMBER.test(text(cell))

export const pivotOf = (block: TableBlock, option: PivotTable): TableBlock | undefined => {
  if (option === 'off' || block.rows.length < 2 || block.rows.length >= block.header.length - 1) return undefined
  if (block.header.some(cell => text(cell) === '')) return undefined
  if (block.rows.some(row => !LETTER.test(text(row[0]!)))) return undefined
  const values = block.rows.flatMap(row => row.slice(1))
  const numbers = values.filter(isNumber).length
  if (numbers * 10 < values.length * 6) return undefined
  if (block.rows.some(row => !row.slice(1).some(isNumber))) return undefined
  const header = [block.header[0]!, ...block.rows.map(row => row[0]!)]
  const rows = block.header.slice(1).map((label, c) => [label, ...block.rows.map(row => row[c + 1] ?? [])])
  const align: TableAlign[] = [block.align[0] ?? 'left', ...block.rows.map(() => 'right' as const)]
  return { ...block, header, rows, align }
}
