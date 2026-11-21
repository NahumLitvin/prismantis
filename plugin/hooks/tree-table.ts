import { inlineText } from './markdown'
import type { TableBlock, TableCell } from './markdown'
import type { Theme } from './theme'

export type TreeTable = 'off' | 'branch' | 'full'

export type Tree = { depth: number; starts: boolean[][]; sizes: number[][]; marks: (Mark | undefined)[][]; leaf: string[] }

export type Mark = { lead: string; text: string }

const LETTER = /\p{L}/u

const text = (cell: TableCell): string => inlineText(cell).trim()

const sizesOf = (starts: boolean[]): number[] => {
  const sizes = starts.map(() => 0)
  let start = 0
  starts.forEach((isStart, r) => {
    if (r > 0 && isStart) {
      for (let i = start; i < r; i++) sizes[i] = r - start
      start = r
    }
  })
  for (let i = start; i < starts.length; i++) sizes[i] = starts.length - start
  return sizes
}

type Level = { labels: string[]; starts: boolean[]; sizes: number[] }

const levelOf = (labels: string[], parents: boolean[]): Level | undefined => {
  if (labels.some(label => label === '' || !LETTER.test(label))) return undefined
  const starts = labels.map((label, r) => r === 0 || label !== labels[r - 1] || parents[r] === true)
  const sizes = sizesOf(starts)
  const runs = starts.filter(Boolean).length
  if (runs < 2 || runs === labels.length) return undefined
  if (!starts.some((start, r) => start && sizes[r]! >= 2)) return undefined
  return { labels, starts, sizes }
}

const lastIn = (levels: Level[], c: number, r: number): boolean => {
  let end = r + 1
  while (end < levels[c]!.starts.length && !levels[c]!.starts[end]) end++
  if (end >= levels[c]!.starts.length) return true
  return c > 0 && levels[c - 1]!.starts[end] === true
}

const guides = (levels: Level[], upto: number, r: number): string =>
  Array.from({ length: upto }, (_, a) => (lastIn(levels, a + 1, r) ? '   ' : '│  ')).join('')

export const treeOf = (block: TableBlock, option: TreeTable, statusGrouped: boolean): Tree | undefined => {
  if (option === 'off' || statusGrouped || block.rows.length < 3 || block.header.length < 2) return undefined
  const levels: Level[] = []
  let parents: boolean[] = []
  for (let c = 0; c < block.header.length - 1; c++) {
    const level = levelOf(block.rows.map(row => text(row[c]!)), parents)
    if (!level) break
    levels.push(level)
    parents = level.starts
  }
  if (!levels.length) return undefined
  const depth = levels.length
  const rows = block.rows.length
  const marks = block.rows.map(() => block.header.map(() => undefined as Mark | undefined))
  const leaf = block.rows.map(() => '')
  levels.forEach((level, c) => {
    for (let r = 0; r < rows; r++) {
      if (!level.starts[r]) continue
      const label = level.labels[r]!
      const lead = c === 0 ? '' : `${guides(levels, c - 1, r)}${lastIn(levels, c, r) ? '└─ ' : '├─ '}`
      marks[r]![c] = { lead, text: label }
    }
  })
  const parent = levels[depth - 1]!
  for (let r = 0; r < rows; r++) {
    if (parent.starts[r]) continue
    const corner = r + 1 >= rows || parent.starts[r + 1] === true
    leaf[r] = `${guides(levels, depth - 1, r)}${corner ? '└─ ' : '├─ '}`
  }
  return { depth, starts: levels.map(level => level.starts), sizes: levels.map(level => level.sizes), marks, leaf }
}

export const treeRows = (block: TableBlock, tree: Tree | undefined): TableCell[][] => {
  if (!tree) return block.rows
  return block.rows.map((cells, r) => cells.map((cell, c) => {
    if (c < tree.depth) {
      const mark = tree.marks[r]![c]
      if (!mark) return [{ kind: 'text' as const, text: '' }]
      return mark.lead
        ? [{ kind: 'dim' as const, text: mark.lead }, { kind: 'text' as const, text: mark.text }]
        : [{ kind: 'text' as const, text: mark.text }]
    }
    if (c !== tree.depth || tree.leaf[r] === '') return cell
    return [{ kind: 'dim' as const, text: tree.leaf[r]! }, ...cell]
  }))
}

export const treeLook = (t: Theme, tree: Tree | undefined, at: number | undefined, c: number, plain: { color?: string } = {}): { color?: string } => {
  if (!tree || at === undefined || c >= tree.depth) return plain
  return tree.marks[at]![c]?.text ? { color: t.accent } : plain
}
