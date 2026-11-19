import { inlineText } from './markdown'
import type { Inline, TableBlock, TableCell } from './markdown'
import type { CellLook, Theme } from './theme'

export type HeatTable = 'off' | 'color' | 'bars'

export type Heat = { steps: number[][] }

const NUMBER = /^(-?\d+(?:\.\d+)?)([^\d]*)$/

const BLOCKS = ['▁', '▄', '▆', '█']

const COLORS: (keyof Theme)[] = ['tableText', 'number', 'accent']

const read = (cell: TableCell): { value: number; suffix: string } | undefined => {
  const match = NUMBER.exec(inlineText(cell).trim())
  return match ? { value: parseFloat(match[1]!), suffix: match[2]! } : undefined
}

type Column = { column: number; values: (number | undefined)[]; low: number; high: number }

const columnOf = (block: TableBlock, c: number): Column | undefined => {
  const reads = block.rows.map(row => read(row[c]!))
  const filled = reads.filter((r): r is { value: number; suffix: string } => r !== undefined)
  if (filled.length < 2 || filled.length * 2 <= block.rows.length) return undefined
  const suffix = filled[0]!.suffix
  if (filled.some(r => r.suffix !== suffix)) return undefined
  const values = reads.map(r => r?.value)
  const numbers = filled.map(r => r.value)
  return { column: c, values, low: Math.min(...numbers), high: Math.max(...numbers) }
}

export const heatOf = (block: TableBlock, option: HeatTable): Heat | undefined => {
  if (option === 'off' || block.rows.length < 2) return undefined
  const columns: Column[] = []
  for (let c = 0; c < block.header.length; c++) {
    const column = columnOf(block, c)
    if (column) columns.push(column)
  }
  const numbers = columns.reduce((sum, column) => sum + column.values.filter(value => value !== undefined).length, 0)
  if (columns.length < 2 || numbers < 4) return undefined
  const steps = block.rows.map(() => block.header.map(() => -1))
  for (const column of columns) {
    if (column.low === column.high) continue
    column.values.forEach((value, r) => {
      if (value === undefined) return
      steps[r]![column.column] = Math.min(3, Math.floor(((value - column.low) / (column.high - column.low)) * 4))
    })
  }
  return { steps }
}

const lead = (cell: TableCell): Inline[] => {
  const kept: Inline[] = []
  for (const node of cell) {
    if (node.kind !== 'dim') break
    kept.push(node)
  }
  return kept
}

export const heatRows = (block: TableBlock, heat: Heat | undefined, option: HeatTable): TableCell[][] => {
  if (!heat || option === 'off') return block.rows
  return block.rows.map((cells, r) => cells.map((cell, c) => {
    const step = heat.steps[r]![c]!
    if (step < 0) return cell
    const kept = lead(cell)
    const text = inlineText(cell.slice(kept.length)).trim()
    return [...kept, { kind: 'text' as const, text: option === 'bars' ? text + BLOCKS[step] : text }]
  }))
}

export const heatLook = (t: Theme, heat: Heat | undefined, at: number | undefined, c: number, plain: CellLook = {}): CellLook => {
  if (!heat || at === undefined) return plain
  const step = heat.steps[at]?.[c] ?? -1
  if (step < 0) return plain
  if (plain.color !== undefined && plain.color !== t.tableText) return plain
  return step === 3 ? { color: t.accent, bold: true } : { color: t[COLORS[step]!] }
}
