import { inlineText } from './markdown'
import type { TableCell, TableBlock } from './markdown'
import type { Theme } from './theme'

export type KvTable = 'off' | 'sources' | 'overrides' | 'full'

export type Kv = { sources: number; value: number; marks: boolean[] }

const OPTION = /^(?:options?|settings?|variables?|env)$/i

const SOURCE = /^(?:sources?|origins?|from|where)$/i

const VALUE = /^(?:values?|currents?)$/i

const DEFAULT = /^(?:defaults?|fallbacks?)$/i

type Source = 'env' | 'config' | 'unset'

const ENV = /(?:^|\W)(?:env|environment)(?:\W|$)/i

const CONFIG = /(?:^|\W)(?:config|settings?|flag|cli)(?:\W|$)/i

const UNSET = /(?:^|\W)(?:default|unset|none)(?:\W|$)/i

const SOURCE_TOKEN: Record<Source, 'link' | 'codeString' | 'codeComment'> = { env: 'link', config: 'codeString', unset: 'codeComment' }

const sourceOf = (cell: TableCell): Source | undefined => {
  const text = inlineText(cell).trim()
  if (ENV.test(text)) return 'env'
  if (CONFIG.test(text)) return 'config'
  if (UNSET.test(text)) return 'unset'
  return undefined
}

const columnOf = (block: TableBlock, names: RegExp): number =>
  block.header.findIndex(h => names.test(inlineText(h).trim()))

export const kvOf = (block: TableBlock, option: KvTable): Kv | undefined => {
  if (option === 'off' || block.rows.length < 2) return undefined
  if (!block.header.some(h => OPTION.test(inlineText(h).trim()))) return undefined
  const sources = columnOf(block, SOURCE)
  const value = columnOf(block, VALUE)
  const defaults = columnOf(block, DEFAULT)
  if (sources < 0 && (value < 0 || defaults < 0)) return undefined
  return {
    sources: option === 'overrides' ? -1 : sources,
    value: option === 'sources' ? -1 : value,
    marks: option === 'sources' || value < 0 || defaults < 0 ? [] : block.rows.map(row => inlineText(row[value]!).trim() !== inlineText(row[defaults]!).trim()),
  }
}

export const kvLook = (t: Theme, kv: Kv | undefined, at: number | undefined, c: number, cell: TableCell, plain: { color?: string } = {}): { color?: string } => {
  if (!kv) return plain
  if (c === kv.sources) {
    const source = sourceOf(cell)
    if (source) return { color: t[SOURCE_TOKEN[source]] }
  }
  if (c === kv.value && at !== undefined && kv.marks[at]) return { color: t.accent }
  return plain
}
