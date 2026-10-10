export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'strong'; children: Inline[] }
  | { kind: 'emphasis'; children: Inline[] }
  | { kind: 'strike'; children: Inline[] }
  | { kind: 'code'; text: string }
  | { kind: 'math'; text: string }
  | { kind: 'link'; text: string; href: string }
  | { kind: 'number'; text: string }
  | { kind: 'path'; text: string }
  | { kind: 'dim'; text: string }
  | { kind: 'footnote'; text: string }

export type Block = { raw: string } & (
  | { kind: 'heading'; level: number; inline: Inline[] }
  | { kind: 'paragraph'; inline: Inline[] }
  | { kind: 'list'; ordered: boolean; items: { marker: string; depth: number; task?: boolean; inline: Inline[] }[] }
  | { kind: 'code'; lang: string; lines: string[]; isOpen?: true }
  | { kind: 'quote'; inline: Inline[] }
  | { kind: 'alert'; level: AlertLevel; inline: Inline[] }
  | { kind: 'rule' }
  | { kind: 'table'; header: Inline[][]; align: ('left' | 'right' | 'center')[]; rows: Inline[][][] }
  | { kind: 'notes'; notes: { mark: string; inline: Inline[] }[] }
)

type Draft = Block extends infer B ? (B extends unknown ? Omit<B, 'raw'> : never) : never

export type AlertLevel = 'note' | 'tip' | 'important' | 'warning' | 'caution'
const ALERT = /^\[!(note|tip|important|warning|caution)\]\s*(.*)$/i

export type Highlight = { numbers: boolean; paths: boolean }

const MAX_INLINE = 4000
const TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/
const LIST_ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/
const FENCE = /^\s*(`{3,}|~{3,})\s*([\w+-]*)/
const NOTE_DEF = /^\[\^([^\]\s]+)\]:\s*(.*)$/
const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹'

const splitRow = (line: string): string[] => {
  const trimmed = line.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '')
  const cells: string[] = []
  let cell = ''
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i]
    if (ch === '\\' && trimmed[i + 1] === '|') {
      cell += '|'
      i++
    } else if (ch === '|') {
      cells.push(cell.trim())
      cell = ''
    } else {
      cell += ch
    }
  }
  cells.push(cell.trim())
  return cells
}

const INLINE = /(`+)(?!`)(.+?)(?<!`)\1(?!`)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+?)\*\*|(?<![\w_])__([^_]+?)__(?![\w_])|~~([^~]+?)~~|(?<![\w*])\*([^*\s][^*]*?)\*(?!\w)|(?<![\w_])_([^_\s][^_]*?)_(?!\w)|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])|(?<![\\$\w])\$(?=\S)((?:\\.|[^$\n\\])+?)(?<=\S)\$(?![\w$])|\[\^([^\]\s]+)\]/g
const NUMBER = /(?<![\w.#/-])(v?\d+(?:[.,:]\d+)*(?:%|ms|s|m|h|d|Gi|Mi|GB|MB|KB|x)?)(?![\w/])/g
const PATH = /(?<![\w/.:])((?:~|\.{1,2})?\/[\w.@+-]+(?:\/[\w.@+-]*)*)/g

const decorate = (text: string, hl: Highlight): Inline[] => {
  if (!hl.numbers && !hl.paths) return [{ kind: 'text', text }]
  const marks: { start: number; end: number; kind: 'number' | 'path' }[] = []
  if (hl.paths) for (const m of text.matchAll(PATH)) marks.push({ start: m.index, end: m.index + m[0].length, kind: 'path' })
  if (hl.numbers) {
    for (const m of text.matchAll(NUMBER)) {
      const start = m.index
      if (!marks.some(p => start < p.end && start + m[0].length > p.start)) {
        marks.push({ start, end: start + m[0].length, kind: 'number' })
      }
    }
  }
  marks.sort((a, b) => a.start - b.start)
  const out: Inline[] = []
  let at = 0
  for (const m of marks) {
    if (m.start > at) out.push({ kind: 'text', text: text.slice(at, m.start) })
    out.push({ kind: m.kind, text: text.slice(m.start, m.end) })
    at = m.end
  }
  if (at < text.length) out.push({ kind: 'text', text: text.slice(at) })
  return out
}

export const parseInline = (text: string, hl: Highlight): Inline[] => {
  if (text.length > MAX_INLINE) return [{ kind: 'text', text }]
  const out: Inline[] = []
  let at = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index > at) out.push(...decorate(text.slice(at, m.index), hl))
    if (m[2] !== undefined) out.push({ kind: 'code', text: m[2] })
    else if (m[3] !== undefined) out.push({ kind: 'link', text: m[3], href: m[4] ?? "" })
    else if (m[5] !== undefined || m[6] !== undefined) out.push({ kind: 'strong', children: parseInline(m[5] ?? m[6] ?? "", hl) })
    else if (m[7] !== undefined) out.push({ kind: 'strike', children: parseInline(m[7], hl) })
    else if (m[8] !== undefined || m[9] !== undefined) out.push({ kind: 'emphasis', children: parseInline(m[8] ?? m[9] ?? "", hl) })
    else if (m[10] !== undefined) out.push({ kind: 'link', text: m[10], href: m[10] })
    else if (m[11] !== undefined) out.push(...(isTex(m[11]) ? [{ kind: 'math' as const, text: texText(m[11]) }] : decorate(m[0], hl)))
    else if (m[12] !== undefined) out.push({ kind: 'footnote', text: m[12] })
    at = m.index + m[0].length
  }
  if (at < text.length) out.push(...decorate(text.slice(at), hl))
  return out
}

const TEX: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', Delta: 'Δ', epsilon: 'ε', theta: 'θ', lambda: 'λ', mu: 'μ', pi: 'π', rho: 'ρ', sigma: 'σ', Sigma: 'Σ', tau: 'τ', phi: 'φ', omega: 'ω', Omega: 'Ω',
  cdot: '·', times: '×', div: '÷', pm: '±', le: '≤', leq: '≤', ge: '≥', geq: '≥', neq: '≠', ne: '≠', approx: '≈', infty: '∞', to: '→', rightarrow: '→', Rightarrow: '⇒', sum: 'Σ', sqrt: '√', lceil: '⌈', rceil: '⌉', lfloor: '⌊', rfloor: '⌋',
}

const isTex = (tex: string) => /[\\^_={}]/.test(tex) || /^[A-Za-z]$/.test(tex)

const texText = (tex: string) =>
  tex
    .replace(/\\(?:text|mathrm|mathit|operatorname)\{([^{}]*)\}/g, '$1')
    .replace(/\\([A-Za-z]+)/g, (all, name: string) => TEX[name] ?? all)
    .replace(/\\[,;:! ]/g, ' ')
    .replace(/[{}]/g, '')

export const inlineText = (inline: Inline[]): string =>
  inline.map(n => ('children' in n ? inlineText(n.children) : n.text)).join('')

const mathAt = (lines: string[], start: number): { lines: string[]; end: number } | null => {
  const trimmed = (n: number) => (lines[n] ?? '').trim()
  const first = trimmed(start)
  if (!first.startsWith('$$')) return null
  const open = first.slice(2)
  let end = start
  if (!(open.length >= 2 && open.endsWith('$$'))) {
    end = start + 1
    while (end < lines.length && !trimmed(end).endsWith('$$')) {
      if (trimmed(end) === '') return null
      end++
    }
    if (end === lines.length) return null
  }
  const body = end === start ? [open.slice(0, -2)] : [open, ...lines.slice(start + 1, end), trimmed(end).slice(0, -2)]
  const tex = body.filter(line => line.trim() !== '').map((line, i, all) => (i === 0 || i === all.length - 1 ? line.trim() : line))
  return tex.length ? { lines: tex, end } : null
}

export const displayText = (inline: Inline[]): string =>
  inline.map(n => (n.kind === 'link' && n.text !== n.href ? `${n.text} (${n.href})` : 'children' in n ? displayText(n.children) : n.text)).join('')

export const isWebLink = (href: string): boolean => /^(https?:|mailto:)/i.test(href)

const markOf = (n: number) => [...String(n)].map(d => SUPERSCRIPT[Number(d)]).join('')

const numberNotes = (blocks: Block[], defs: Map<string, string>, hl: Highlight): Block[] => {
  const order = new Map<string, number>()
  const seen = (nodes: Inline[]): void => nodes.forEach(n => {
    if (n.kind === 'footnote' && defs.has(n.text) && !order.has(n.text)) order.set(n.text, order.size + 1)
    else if ('children' in n) seen(n.children)
  })
  const fix = (nodes: Inline[]): Inline[] => nodes.map(n =>
    n.kind === 'footnote' ? (order.has(n.text) ? { kind: 'footnote', text: markOf(order.get(n.text)!) } : { kind: 'text', text: `[^${n.text}]` })
    : 'children' in n ? { ...n, children: fix(n.children) } : n)
  const mapInlines = (b: Block, f: (nodes: Inline[]) => Inline[]): Block =>
    'inline' in b ? { ...b, inline: f(b.inline) }
    : b.kind === 'list' ? { ...b, items: b.items.map(it => ({ ...it, inline: f(it.inline) })) }
    : b.kind === 'table' ? { ...b, header: b.header.map(f), rows: b.rows.map(r => r.map(f)) }
    : b
  blocks.forEach(b => mapInlines(b, nodes => (seen(nodes), nodes)))
  for (const label of defs.keys()) if (!order.has(label)) order.set(label, order.size + 1)
  const out = blocks.map(b => mapInlines(b, fix))
  const notes = [...defs].sort(([a], [b]) => order.get(a)! - order.get(b)!).map(([label, text]) => ({ mark: markOf(order.get(label)!), inline: fix(parseInline(text, hl)) }))
  return defs.size ? [...out, { kind: 'notes', notes, raw: '' }] : out
}

export const parse = (source: string, hl: Highlight): Block[] => {
  const blocks = parseBlocks(source, hl)
  return source.includes('[^') ? numberNotes(blocks, notesOf(source), hl) : blocks
}

const notesOf = (source: string): Map<string, string> => {
  const defs = new Map<string, string>()
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  let fenced = false
  let last: string | undefined
  for (const line of lines) {
    if (FENCE.test(line)) fenced = !fenced
    const def = fenced ? null : NOTE_DEF.exec(line)
    if (def) {
      last = def[1]!
      if (!defs.has(last)) defs.set(last, def[2] ?? '')
    } else if (last !== undefined && /^\s{2,}\S/.test(line)) defs.set(last, `${defs.get(last)} ${line.trim()}`)
    else last = undefined
  }
  return defs
}

const parseBlocks = (source: string, hl: Highlight): Block[] => {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const at = (n: number) => lines[n] ?? ''
  const blocks: Block[] = []
  const add = (block: Draft, from: number, to: number) => blocks.push({ ...block, raw: lines.slice(from, to).join('\n') } as Block)
  let paraStart = 0
  let para: string[] = []

  const flush = (end: number) => {
    if (para.length) add({ kind: 'paragraph', inline: parseInline(para.join(' '), hl) }, paraStart, end)
    para = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = at(i)
    const fence = FENCE.exec(line)
    if (fence) {
      flush(i)
      const start = i
      const run = fence[1] ?? '```'
      const closer = new RegExp(`^\\s*\\${run[0]}{${run.length},}\\s*$`)
      const body: string[] = []
      i++
      while (i < lines.length && !closer.test(at(i))) body.push(at(i++))
      add({ kind: 'code', lang: fence[2] ?? '', lines: body, ...(i < lines.length ? {} : { isOpen: true as const }) }, start, i + 1)
      continue
    }
    const math = mathAt(lines, i)
    if (math) {
      flush(i)
      add({ kind: 'code', lang: 'math', lines: math.lines }, i, math.end + 1)
      i = math.end
      continue
    }
    if (line.trim() === '') {
      flush(i)
      continue
    }
    if (NOTE_DEF.test(line)) {
      flush(i)
      while (/^\s{2,}\S/.test(at(i + 1))) i++
      continue
    }
    const heading = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line)
    if (heading) {
      flush(i)
      add({ kind: 'heading', level: (heading[1] ?? '#').length, inline: parseInline(heading[2] ?? '', hl) }, i, i + 1)
      continue
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      flush(i)
      add({ kind: 'rule' }, i, i + 1)
      continue
    }
    if (line.includes('|') && i + 1 < lines.length && TABLE_SEP.test(at(i + 1))) {
      flush(i)
      const start = i
      const header = splitRow(line)
      const align = splitRow(at(i + 1)).map(c =>
        c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : 'left',
      )
      i += 2
      const rows: Inline[][][] = []
      while (i < lines.length && at(i).includes('|') && at(i).trim() !== '') {
        const cells = splitRow(at(i++))
        rows.push(header.map((_, c) => parseInline(cells[c] ?? '', hl)))
      }
      add({ kind: 'table', header: header.map(c => parseInline(c, { numbers: false, paths: false })), align, rows }, start, i)
      i--
      continue
    }
    if (/^\s*>/.test(line)) {
      flush(i)
      const start = i
      const body: string[] = []
      while (i < lines.length && /^\s*>/.test(at(i))) body.push(at(i++).replace(/^\s*>\s?/, ''))
      const alert = ALERT.exec(body[0] ?? '')
      if (alert) add({ kind: 'alert', level: alert[1]!.toLowerCase() as AlertLevel, inline: parseInline([alert[2]!, ...body.slice(1)].join(' ').trim(), hl) }, start, i)
      else add({ kind: 'quote', inline: parseInline(body.join(' '), hl) }, start, i)
      i--
      continue
    }
    const item = LIST_ITEM.exec(line)
    if (item) {
      flush(i)
      const start = i
      const ordered = /\d/.test(item[2] ?? '')
      const items: { marker: string; depth: number; task?: boolean; inline: Inline[] }[] = []
      const contentIndent: number[] = []
      while (i < lines.length) {
        const it = LIST_ITEM.exec(at(i))
        if (it) {
          contentIndent.push((it[1] ?? '').replace(/\t/g, '  ').length + (it[2] ?? '').length + 1)
          const task = /^\[([ xX])\]\s+(.*)$/.exec(it[3] ?? '')
          items.push({ marker: it[2] ?? '-', depth: Math.floor((it[1] ?? '').replace(/\t/g, '  ').length / 2), ...(task ? { task: task[1] !== ' ' } : {}), inline: parseInline(task ? task[2]! : it[3] ?? '', hl) })
        } else if (/^\s{2,}\S/.test(at(i)) && items.length) {
          const indent = (at(i).match(/^\s*/)?.[0] ?? '').replace(/\t/g, '  ').length
          let owner = items.length - 1
          while (owner > 0 && contentIndent[owner]! > indent) owner--
          const target = items[owner]!
          target.inline = [...target.inline, { kind: 'text', text: ' ' }, ...parseInline(at(i).trim(), hl)]
        } else {
          break
        }
        i++
      }
      add({ kind: 'list', ordered, items }, start, i)
      i--
      continue
    }
    if (!para.length) paraStart = i
    para.push(line.trim())
  }
  flush(lines.length)
  return blocks
}
