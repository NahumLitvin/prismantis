import { inlineText } from './markdown'
import type { TableCell, TableBlock } from './markdown'
import type { CellLook, Theme } from './theme'

export type CompareTable = 'off' | 'rank' | 'pick' | 'full'

export type Compare = { rank: number; score: number; marks: boolean[] }

const SCORE = /^(?:scores?|ratings?|points?|stars?)$/i

const RANK = /^(?:ranks?|places?|positions?)$/i

const TOP = /^(?:1|1st|first|winners?|best)$/i

const MEDAL = /^(?:2|3|2nd|3rd|seconds?|thirds?)$/i

const number = (cell: TableCell): number => {
  const read = /-?\d+(?:\.\d+)?/.exec(inlineText(cell))
  return read ? parseFloat(read[0]) : NaN
}

const columnOf = (block: TableBlock, names: RegExp): number =>
  block.header.findIndex(h => names.test(inlineText(h).trim()))

export const compareOf = (block: TableBlock, option: CompareTable): Compare | undefined => {
  if (option === 'off' || block.rows.length < 2) return undefined
  const score = columnOf(block, SCORE)
  const rank = columnOf(block, RANK)
  if (score < 0 || rank < 0) return undefined
  const scores = block.rows.map(row => number(row[score]!))
  const best = Math.max(...scores)
  return {
    rank: option === 'pick' ? -1 : rank,
    score: option === 'rank' ? -1 : score,
    marks: scores.map(s => s === best),
  }
}

export const compareLook = (t: Theme, compare: Compare | undefined, at: number | undefined, c: number, cell: TableCell, plain: CellLook = {}): CellLook => {
  if (!compare) return plain
  if (c === compare.rank) {
    const text = inlineText(cell).trim().toLowerCase()
    if (TOP.test(text)) return { color: t.accent }
    if (MEDAL.test(text)) return { color: t.link }
  }
  if (c === compare.score && at !== undefined && compare.marks[at]) return { color: t.diffAdded, bold: true }
  return plain
}
