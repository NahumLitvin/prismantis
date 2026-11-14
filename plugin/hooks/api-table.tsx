import { inlineText } from './markdown'
import type { TableCell, TableBlock } from './markdown'
import type { Theme } from './theme'

export type ApiTable = 'off' | 'verbs' | 'auth' | 'full'

export type Api = { verbs: number; auth: number }

const METHOD = /^(?:methods?|verbs?|https?)$/i

const AUTH = /^(?:auth|authentication|authorization|permissions?|security|access)$/i

type Verb = 'read' | 'write' | 'del' | 'misc'

const VERB_TOKEN: Record<Verb, 'link' | 'codeString' | 'diffRemoved' | 'codeComment'> =
  { read: 'link', write: 'codeString', del: 'diffRemoved', misc: 'codeComment' }

const VERBS: Partial<Record<string, Verb>> = {}

for (const word of ['get', 'head']) VERBS[word] = 'read'

for (const word of ['post', 'put', 'patch']) VERBS[word] = 'write'

for (const word of ['delete']) VERBS[word] = 'del'

for (const word of ['options', 'trace', 'connect']) VERBS[word] = 'misc'

const SCHEME = /(?:^|\W)(?:bearer|oauth2?|api[ -]?key|jwt|token|basic|session)(?:\W|$)/i

const verbOf = (cell: TableCell): Verb | undefined => {
  const word = inlineText(cell).trim().toLowerCase().match(/^[a-z]+/)?.[0]
  return word ? VERBS[word] : undefined
}

const verbColumn = (block: TableBlock): number => {
  const named = block.header.findIndex(h => METHOD.test(inlineText(h).trim()))
  if (named >= 0) return named
  return block.header.findIndex((_, c) => block.rows.filter(row => verbOf(row[c]!)).length * 2 > block.rows.length)
}

const authColumn = (block: TableBlock): number =>
  block.header.findIndex(h => AUTH.test(inlineText(h).trim()))

export const apiOf = (block: TableBlock, option: ApiTable): Api | undefined => {
  if (option === 'off' || block.rows.length < 2) return undefined
  const verbs = verbColumn(block)
  if (verbs < 0) return undefined
  return { verbs: option === 'auth' ? -1 : verbs, auth: option === 'verbs' ? -1 : authColumn(block) }
}

export const apiLook = (t: Theme, api: Api | undefined, c: number, cell: TableCell, plain: { color?: string } = {}): { color?: string } => {
  if (!api) return plain
  if (c === api.verbs) {
    const verb = verbOf(cell)
    if (verb) return { color: t[VERB_TOKEN[verb]] }
  }
  if (c === api.auth && SCHEME.test(inlineText(cell))) return { color: t.accent }
  return plain
}
