import type { ElementTable, RenderElement } from 'claude-code'

import { tableHtml, tableText } from './html'
import type { Block, Inline } from './markdown'
import { mathOf } from './latex'
import { displayText, inlineText, isWebLink, texText } from './markdown'
import type { Flow } from './rtl'
import { ROW_MARK, ROW_MARK_TEXT, WALL, commentTail, commentVisual, containsRtl, flow, hasRtl, terminalLine } from './rtl'
import type { Style, Theme } from './theme'
import type { PrismToken } from './vendor/prism.js'
import { languages, tokenize } from './vendor/prism.js'

const WIDE = /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6\u{20000}-\u{3FFFD}\u20E3]|\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u
const segmenter = new Intl.Segmenter()

export const graphemes = (s: string): string[] => [...segmenter.segment(s)].map(g => g.segment)

export const cells = (s: string): string[] => (/^[ -~]*$/.test(s) ? [...s] : graphemes(s).flatMap(g => (WIDE.test(g) ? [g, ''] : [g])))

export const width = (s: string): number =>
  /^[ -~]*$/.test(s) ? s.length
  : s.length === 1 ? (/\p{M}/u.test(s) ? 0 : WIDE.test(s) ? 2 : 1)
  : graphemes(s).reduce((w, g) => (/^\p{M}+$/u.test(g) ? w : w + (WIDE.test(g) ? 2 : 1)), 0)

const wrapRanges = (text: string, w: number): [number, number][] => {
  if (width(text) <= w) return [[0, text.length]]
  const out: [number, number][] = []
  let line: [number, number] | undefined
  let used = 0
  for (const word of text.matchAll(/\S+/g)) {
    let start = word.index
    const end = start + word[0].length
    let size = width(word[0])
    if (size > w) {
      if (line) out.push(line)
      line = undefined
      let cut = start
      let taken = 0
      for (const g of graphemes(text.slice(start, end))) {
        const step = width(g)
        if (cut > start && taken + step > w) {
          out.push([start, cut])
          start = cut
          size -= taken
          taken = 0
          if (size <= w) break
        }
        cut += g.length
        taken += step
      }
    }
    if (start === end) continue
    const joined = line ? used + width(text.slice(line[1], start)) + size : Infinity
    if (line && joined <= w) {
      line = [line[0], end]
      used = joined
    } else {
      if (line) out.push(line)
      line = [start, end]
      used = size
    }
  }
  if (line) out.push(line)
  return out.length ? out : [[0, 0]]
}

const sliceInline = (nodes: Inline[], from: number, to: number): Inline[] => {
  const out: Inline[] = []
  let at = 0
  for (const n of nodes) {
    const length = inlineText([n]).length
    const a = Math.max(from - at, 0)
    const b = Math.min(to - at, length)
    at += length
    if (a >= b) continue
    if ('children' in n) out.push({ ...n, children: sliceInline(n.children, a, b) })
    else out.push({ ...n, text: n.text.slice(a, b) })
  }
  return out
}

const hasLink = (nodes: Inline[]): boolean => nodes.some(n => n.kind === 'link' || ('children' in n && hasLink(n.children)))

const headerRuns = (nodes: Inline[]): Inline[] =>
  nodes.flatMap(n => (n.kind === 'footnote' ? [n] : 'children' in n ? headerRuns(n.children) : [{ kind: 'text' as const, text: n.text }]))
    .reduce<Inline[]>((out, n) => {
      const last = out[out.length - 1]
      return n.kind === 'text' && last?.kind === 'text' ? [...out.slice(0, -1), { kind: 'text', text: last.text + n.text }] : [...out, n]
    }, [])

const HTTP_LINKS_FROM = [2, 1, 289]
const EDITOR_LINKS_FROM = [2, 1, 294]
const CLICKABLE_MARKS_FROM = [2, 1, 295]

const releaseFrom = (from: readonly number[]) => (base?: string): boolean => {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(base ?? '')
  if (!m) return false
  const version = [Number(m[1]), Number(m[2]), Number(m[3])]
  const at = version.findIndex((n, i) => n !== from[i])
  return at === -1 || version[at]! > from[at]!
}

export const takesHttpLinks = releaseFrom(HTTP_LINKS_FROM)

export const takesEditorLinks = releaseFrom(EDITOR_LINKS_FROM)

export const takesClickableMarks = releaseFrom(CLICKABLE_MARKS_FROM)

const isHyperlink = (href: string, http: boolean, editor: boolean): boolean =>
  (http ? /^https?:/i : /^(https:|http:\/\/localhost(:\d+)?([/?#]|$))/i).test(href) || (editor && /^vscode(-insiders)?:\/\/file\//i.test(href))

const plainLink = (text: string, href: string): string => {
  const target = href.replace(/^mailto:/i, '')
  return text === target || `http://${text}` === target ? target : `${text} (${target})`
}

const unlink = (nodes: Inline[], http: boolean, editor: boolean): Inline[] =>
  nodes.map(node => {
    const n: Inline = node.kind === 'image' && isWebLink(node.src) ? { kind: 'link', text: node.text, href: node.src } : node
    return n.kind === 'link' && !isHyperlink(n.href, http, editor) ? { kind: 'text', text: plainLink(n.text, n.href) } : 'children' in n ? { ...n, children: unlink(n.children, http, editor) } : n
  })

const unlinkBlock = (block: Block, http: boolean, editor: boolean): Block => {
  const plain = (nodes: Inline[]) => unlink(nodes, http, editor)
  switch (block.kind) {
    case 'heading':
    case 'paragraph':
      return { ...block, inline: plain(block.inline) }
    case 'list':
      return { ...block, items: block.items.map(item => ({ ...item, inline: plain(item.inline) })) }
    case 'table':
      return { ...block, header: block.header.map(plain), rows: block.rows.map(r => r.map(plain)) }
    case 'notes':
      return { ...block, notes: block.notes.map(note => ({ ...note, inline: plain(note.inline) })) }
    default:
      return block
  }
}

const unlinked = new WeakMap<Block, Block[]>()

const drawable = (block: Block, http: boolean, editor: boolean): Block => {
  const cached = unlinked.get(block) ?? []
  unlinked.set(block, cached)
  return (cached[+http + 2 * +editor] ??= unlinkBlock(block, http, editor))
}

const mostLines = (text: string, w: number): number => (text.match(/\S+/g)?.length ?? 0) + Math.ceil(width(text) / w)

const textRows = (text: string, w: number): number => (width(text) <= w ? 1 : mostLines(text, Math.max(1, w)))

const heightOf = (blocks: Block[], w: number): number => blocks.reduce((sum, block, b) => sum + (b ? 1 : 0) + blockHeight(block, w), 0)

const blockHeight = (block: Block, w: number): number => {
  switch (block.kind) {
    case 'heading':
      return 2 * textRows(displayText(block.inline), w - 4) + 2
    case 'paragraph':
      return textRows(displayText(block.inline), w)
    case 'list':
      return block.items.reduce((sum, item) => {
        const pad = item.depth * 2 + item.marker.length + 4
        return sum + textRows(displayText(item.inline), w - pad) + (item.blocks ? heightOf(item.blocks, w - pad) + 1 : 0)
      }, textRows(`${'━'.repeat(20)} ${block.items.length}/${block.items.length} done`, w))
    case 'code':
      return block.lines.reduce((sum, line) => sum + textRows(line, w - 8), 3)
    case 'table': {
      const { natural, words } = tableSize(block)
      const widths = columnWidths(natural, w - 4, 3, words)
      const tallest = (cells: Inline[][]) => Math.max(1, ...widths.map((cw, c) => textRows(displayText(cells[c] ?? []), cw)))
      return block.rows.reduce((sum, row) => sum + 1 + tallest(row), 4 + tallest(block.header))
    }
    case 'quote':
      return Math.max(1, heightOf(block.blocks, w - 2))
    case 'alert':
      return 3 + heightOf(block.blocks, w - 4)
    case 'rule':
      return 1
    case 'notes':
      return block.notes.reduce((sum, note) => sum + textRows(`${note.mark} ${displayText(note.inline)}`, w), 1)
  }
}

const wrapInline = (nodes: Inline[], w: number): Inline[][] => {
  const text = inlineText(nodes)
  return width(text) <= w ? [nodes] : wrapRanges(text, w).map(([a, b]) => sliceInline(nodes, a, b))
}

export const mirrored = (style: Style) => style.shape === 'mirror'

export const heldLtr = (style: Style) => (style.shape === 'engine' ? { dir: 'ltr' as const } : {})

const flows = new Map<string, Flow | null>()
const flowOf = (style: Style, nodes: Inline[], columns: number, mark = !(style.inside && mirrored(style))) =>
  style.reorder && containsRtl(nodes) ? remember(flows, `${style.shape}\0${mark}\0${columns}\0${JSON.stringify(nodes)}`, () => flow(nodes, columns, width, style.shape, mark), 2000) : null

const noteHover = (style: Style, note: number | undefined) =>
  note === undefined || style.noteKey === undefined ? {} : { hover: { scope: `fn:${style.noteKey}:${note}`, inverse: true } }

const renderInline = (el: ElementTable, style: Style, nodes: Inline[], keyBase: string): RenderElement[] => {
  const { Text } = el
  const t = style.theme
  return nodes.map((n, i) => {
    const key = `${keyBase}.${i}`
    switch (n.kind) {
      case 'text':
        return <Text key={key}>{n.text}</Text>
      case 'strong':
        return <Text key={key} bold color={t.strong}>{renderInline(el, style, n.children, key)}</Text>
      case 'emphasis':
        return <Text key={key} italic color={t.emphasis}>{renderInline(el, style, n.children, key)}</Text>
      case 'strike':
        return <Text key={key} strikethrough dimColor>{renderInline(el, style, n.children, key)}</Text>
      case 'code':
        return <Text key={key} color={t.inlineCode}>{n.text}</Text>
      case 'math':
        return <Text key={key} italic color={t.emphasis}>{n.text}</Text>
      case 'link':
        return n.text === n.href ? <Text key={key} color={t.link}><el.Link href={n.href} /></Text> : <el.Link key={key} href={n.href}><Text color={t.link}>{n.text}</Text></el.Link>
      case 'image':
        return <Text key={key} color={t.link}>{n.text}</Text>
      case 'number':
        return <Text key={key} color={t.number}>{n.text}</Text>
      case 'path':
        return <Text key={key} color={t.path}>{n.text}</Text>
      case 'dim':
        return n === ROW_MARK ? <Text key={key} color={t.rule}>{n.text}</Text> : <Text key={key} dimColor>{n.text}</Text>
      case 'footnote':
        return <Text key={key} color={t.accent} {...noteHover(style, n.note)}>{n.text}</Text>
    }
  })
}

const renderFlow = (el: ElementTable, style: Style, lines: Inline[][], key: string, props: TextLook = {}) => {
  const { Text } = el
  return lines.map((line, i) => <Text key={`${key}.${i}`} {...props}>{renderInline(el, style, line, `${key}.${i}`)}</Text>)
}

type Mark = { start: number; end: number; text: string; note: number }
type TextLook = { italic?: boolean; color?: string; bold?: boolean; dimColor?: boolean; strikethrough?: boolean }

const marksIn = (nodes: Inline[], at = 0): Mark[] => {
  const out: Mark[] = []
  for (const n of nodes) {
    const length = inlineText([n]).length
    if (n.kind === 'footnote' && n.note !== undefined) out.push({ start: at, end: at + length, text: n.text, note: n.note })
    else if ('children' in n) out.push(...marksIn(n.children, at))
    at += length
  }
  return out
}

const piecesOf = (text: string, a: number, b: number, columns: number, marks: Mark[]): (readonly [number, number])[] => {
  if (width(text.slice(a, b)) <= columns) return [[a, b]]
  const out: [number, number][] = []
  let start = a
  let at = a
  let taken = 0
  for (const g of graphemes(text.slice(a, b))) {
    const step = width(g)
    if (at > start && taken + step > columns) {
      const cut = marks.find(m => m.start < at && at < m.end)?.start ?? at
      if (cut > start) {
        out.push([start, cut])
        taken = width(text.slice(cut, at))
        start = cut
      }
    }
    at += g.length
    taken += step
  }
  out.push([start, b])
  return out
}

const pressInline = (el: ElementTable, style: Style, nodes: Inline[], columns: number, key: string, tip: Tip | undefined, look: TextLook = {}, box: { justifyContent?: 'flex-start' | 'flex-end' | 'center' } = {}): RenderElement | null => {
  const marks = tip ? marksIn(nodes).flatMap(m => {
    const press = tip(m.note)
    return press ? [{ ...m, press }] : []
  }) : []
  if (!marks.length) return null
  const { Box, Text, Button } = el
  const run = (a: number, b: number) => <Text key={`${key}.t${a}`} {...look}>{renderInline(el, style, sliceInline(nodes, a, b), `${key}.t${a}`)}</Text>
  const text = inlineText(nodes)
  const words = [...text.matchAll(/\s*\S+\s*/g)].flatMap(m => piecesOf(text, m.index, m.index + m[0].length, Math.max(1, columns), marks))
  return (
    <Box key={key} flexDirection="row" flexWrap="wrap" {...box}>
      {words.map(([a, b]) => {
        const inside = marks.filter(m => m.start >= a && m.end <= b)
        if (!inside.length) return run(a, b)
        const parts: RenderElement[] = []
        let at = a
        for (const m of inside) {
          if (m.start > at) parts.push(run(at, m.start))
          parts.push(
            <Button key={`${key}.n${m.start}`} plain {...noteHover(style, m.note)} onPress={m.press}>
              <Text color={style.theme.accent} bold={look.bold}>{m.text}</Text>
            </Button>,
          )
          at = m.end
        }
        if (at < b) parts.push(run(at, b))
        return <Box key={`${key}.w${a}`} flexDirection="row" flexShrink={0}>{parts}</Box>
      })}
    </Box>
  )
}

export const PRISM_COLORS: Record<string, keyof Theme> = {
  comment: 'codeComment', prolog: 'codeComment', doctype: 'codeComment', cdata: 'codeComment',
  string: 'codeString', char: 'codeString', 'template-string': 'codeString', 'attr-value': 'codeString', url: 'codeString',
  number: 'number', boolean: 'number', constant: 'number', symbol: 'number', inserted: 'number',
  keyword: 'codeFlag', important: 'codeFlag', atrule: 'codeFlag', rule: 'codeFlag', deleted: 'codeFlag',
  function: 'codeCommand', 'class-name': 'codeCommand', builtin: 'codeCommand', key: 'codeCommand', selector: 'codeCommand',
  property: 'link', tag: 'link', 'attr-name': 'emphasis', variable: 'emphasis', regex: 'path',
}

type Segment = { text: string; color?: string; italic: boolean }

const flatten = (tokens: PrismToken[], style: Style, color?: string, italic = false): Segment[] =>
  tokens.flatMap(token => {
    if (typeof token === 'string') return [{ text: token, color, italic }]
    const names = [token.type, ...(Array.isArray(token.alias) ? token.alias : token.alias ? [token.alias] : [])]
    const slot = names.map(n => PRISM_COLORS[n]).find(Boolean)
    const inner = Array.isArray(token.content) ? token.content : [token.type === 'comment' && typeof token.content === 'string' && style.reorder ? commentVisual(token.content, style.shape) : token.content]
    return flatten(inner, style, slot ? style.theme[slot] : color, italic || token.type === 'comment')
  })

export const remember = <T,>(cache: Map<string, T>, key: string, make: () => T, limit = 200): T => {
  const hit = cache.get(key)
  if (hit !== undefined) {
    cache.delete(key)
    cache.set(key, hit)
    return hit
  }
  const value = make()
  cache.set(key, value)
  if (cache.size > limit) cache.delete(cache.keys().next().value!)
  return value
}

const highlighted = new WeakMap<Theme, Map<string, Segment[][]>>()

const grammarFor = (lang: string) => {
  const name = lang.toLowerCase()
  const grammar = Object.hasOwn(languages, name) ? languages[name] : undefined
  return grammar !== null && typeof grammar === 'object' ? grammar : undefined
}

export const highlightBlock = ({ Text }: ElementTable, style: Style, lines: string[], lang: string, key: string): RenderElement[] | null => {
  const grammar = grammarFor(lang)
  if (!grammar) return null
  const code = lines.join('\n')
  const cache = highlighted.get(style.theme) ?? new Map<string, Segment[][]>()
  highlighted.set(style.theme, cache)
  const rows = remember(cache, `${style.reorder ? style.shape : ''}\0${lang}\0${code}`, () => {
    const out: Segment[][] = [[]]
    for (const seg of flatten(tokenize(code, grammar), style)) {
      seg.text.split('\n').forEach((piece, i) => {
        if (i > 0) out.push([])
        if (piece) out[out.length - 1]!.push({ ...seg, text: piece })
      })
    }
    return out
  })
  return rows.map((row, r) => (
    <Text key={`${key}.${r}`} color={style.theme.codeText}>
      {row.length ? row.map((s, i) => <Text key={`${key}.${r}.${i}`} color={s.color} italic={s.italic}>{s.text}</Text>) : ' '}
    </Text>
  ))
}

const isShellLang = (lang: string) => lang === '' || /^(sh|bash|zsh|shell|console|fish|powershell|ps1)$/i.test(lang)

export const codeLine = (el: ElementTable, style: Style, line: string, lang: string, key: string): RenderElement => {
  const { Text } = el
  const t = style.theme
  const isShell = isShellLang(lang)
  if (/[\u2500-\u257F]/.test(line)) return <Text key={key} color={t.codeText}>{line}</Text>
  const comment = style.reorder ? commentTail(line, style.shape) : null
  if (comment) {
    return (
      <Text key={key} color={t.codeText}>
        {comment.head ? codeLine(el, style, comment.head, lang, `${key}.h`) : null}
        <Text color={t.codeComment}>{comment.marker + comment.tail}</Text>
      </Text>
    )
  }
  if (!isShell) return <Text key={key} color={t.codeText}>{line || ' '}</Text>
  if (/^\s*#/.test(line)) return <Text key={key} color={t.codeComment}>{line}</Text>
  const parts = line.split(/("[^"]*"|'[^']*'|\s+)/).filter(p => p !== '')
  let seenCommand = false
  return (
    <Text key={key} color={t.codeText}>
      {parts.map((p, i) => {
        if (/^\s+$/.test(p)) return <Text key={`${key}.${i}`}>{p}</Text>
        if (/^["']/.test(p)) return <Text key={`${key}.${i}`} color={t.codeString}>{p}</Text>
        if (/^--?[\w-]/.test(p)) return <Text key={`${key}.${i}`} color={t.codeFlag}>{p}</Text>
        if (!seenCommand && !/^[$>|&;]+$/.test(p)) {
          seenCommand = true
          return <Text key={`${key}.${i}`} color={t.codeCommand}>{p}</Text>
        }
        if (/^(\||&&|;|\|\|)$/.test(p)) seenCommand = false
        return <Text key={`${key}.${i}`}>{p}</Text>
      })}
    </Text>
  )
}

const longestWord = (text: string): number => Math.max(0, ...text.split(/\s+/).map(width))

export const columnWidths = (natural: number[], available: number, gap: number, words: number[] = []): number[] => {
  const room = Math.max(natural.length, available - gap * (natural.length - 1))
  const total = natural.reduce((a, b) => a + b, 0)
  if (total <= room) return natural
  const minimum = natural.map((w, c) => Math.min(w, Math.max(1, words[c] ?? 1)))
  const widths = natural.map(() => 0)
  let open = natural.map((_, c) => c)
  let left = room
  for (let fixed = [-1]; fixed.length; ) {
    const share = Math.floor(left / open.length)
    const claim = (c: number) => (natural[c]! <= share ? natural[c]! : minimum[c]!)
    const minimumsFit = open.reduce((a, c) => a + minimum[c]!, 0) <= left
    const needed = open.reduce((a, c) => a + claim(c), 0)
    fixed = open.filter(c => natural[c]! <= share)
    if (minimumsFit && (!fixed.length || needed > left)) fixed = open.filter(c => minimum[c]! > share)
    fixed.forEach(c => (widths[c] = claim(c), left -= widths[c]!))
    open = open.filter(c => !fixed.includes(c))
  }
  open.forEach((c, i) => (widths[c] = Math.max(1, Math.floor(left / open.length) + (i < left % open.length ? 1 : 0))))
  while (widths.reduce((a, b) => a + b, 0) > room) {
    const widest = widths.indexOf(Math.max(...widths))
    if (widths[widest]! <= 1) break
    widths[widest]!--
  }
  return widths
}

const isRtlTable = (style: Style, block: Extract<Block, { kind: 'table' }>): boolean => {
  const cells = [...block.header, ...block.rows.flat()].filter(cell => displayText(cell).trim() !== '')
  return cells.filter(cell => flowOf(style, cell, Infinity)?.base === 'R').length * 2 > cells.length
}

const ART_WIDTH = 100

const tableSize = (block: Extract<Block, { kind: 'table' }>) => {
  const cells = [block.header, ...block.rows].map(r => block.header.map((_, c) => displayText(r[c] ?? [])))
  const column = (measure: (s: string) => number) => block.header.map((_, c) => Math.max(...cells.map(r => measure(r[c]!))))
  return { natural: column(width), words: column(longestWord) }
}

export const tableArt = (block: Extract<Block, { kind: 'table' }>): string => {
  const cells = [block.header, ...block.rows].map(r => block.header.map((_, c) => displayText(r[c] ?? [])))
  const { natural, words } = tableSize(block)
  const widths = columnWidths(natural, ART_WIDTH - 4, 3, words)
  const pad = (text: string, c: number, align: 'left' | 'right' | 'center') => {
    const room = Math.max(0, widths[c]! - width(text))
    const left = align === 'right' ? room : align === 'center' ? Math.floor(room / 2) : 0
    return ' '.repeat(left) + text + ' '.repeat(room - left)
  }
  const line = (l: string, m: string, r: string) => l + widths.map(w => '─'.repeat(w + 2)).join(m) + r
  const row = (r: string[], header: boolean) => {
    const lines = r.map((text, c) => wrapRanges(text, widths[c]!).map(([a, b]) => text.slice(a, b)))
    return Array.from({ length: Math.max(...lines.map(l => l.length)) }, (_, i) =>
      `│ ${lines.map((l, c) => pad(l[i] ?? '', c, header ? 'center' : block.align[c] ?? 'left')).join(' │ ')} │`)
  }
  const art = [line('┌', '┬', '┐'), ...row(cells[0]!, true), ...cells.slice(1).flatMap(r => [line('├', '┼', '┤'), ...row(r, false)]), line('└', '┴', '┘')]
  return ['```', ...art, '```'].join('\n')
}

const clip = ({ Box }: ElementTable, w: number, drawn: RenderElement, key?: string) => (
  <Box key={key} flexDirection="column" minWidth={w}>
    <Box height={0} flexGrow={1} overflow="hidden">
      {drawn}
    </Box>
  </Box>
)

const renderTable = (el: ElementTable, style: Style, block: Extract<Block, { kind: 'table' }>, columns: number, key: string, rtl: boolean, tip?: Tip) => {
  const { Box, Text } = el
  const t = style.theme
  const box = style.tableStyle === 'box'
  const gap = box ? 0 : style.tableStyle === 'grid' ? 3 : 2
  const { natural, words } = tableSize(block)
  const widths = box ? columnWidths(natural, columns - 4, 3, words) : columnWidths(natural, columns, gap, words)
  const order = natural.map((_, c) => c)
  const mirror = rtl && mirrored(style)
  const flip = rtl && !mirror
  if (flip) order.reverse()
  const lead = (k: string) => (mirror ? <Text key={`${k}.m`} color={t.rule}>{ROW_MARK_TEXT}</Text> : null)
  const ruleChar = style.tableStyle === 'grid' ? '━' : '─'
  const justify = (c: number) =>
    block.align[c] === 'right' ? 'flex-end' : block.align[c] === 'center' ? 'center' : 'flex-start'

  const rule = (k: string, heavy: boolean) => (
    <Box key={k} flexDirection="row" columnGap={gap}>
      {lead(k)}
      {order.map(c => (
        <Text key={`${k}.${c}`} color={t.tableRule} dimColor={!heavy && !t.tableRule}>
          {(heavy ? ruleChar : '─').repeat(widths[c]!)}
        </Text>
      ))}
    </Box>
  )

  const bar = (k: string, text: string, lines = 1) => (
    <Text key={k} color={t.tableRule} dimColor={!t.tableRule}>{Array.from({ length: lines }, () => text).join('\n')}</Text>
  )
  const wall = (text: string) => (mirror ? text.replace('│', WALL) : text)
  const clipped = (lines: number) => (k: string, text: string) => clip(el, width(text), bar(`${k}.b`, text, lines), k)
  const edge = (k: string, [left, fill, mid, right]: string) =>
    bar(k, (mirror ? WALL : left) + order.map(c => fill!.repeat(widths[c]! + 2)).join(mid) + (mirror ? WALL : right))

  const terminalRow = (cells: Inline[][], k: string, isHeader: boolean) => {
    const parts: Inline[] = box ? [{ kind: 'dim', text: '│ ' }] : []
    order.forEach((c, i) => {
      if (i > 0) parts.push(box ? { kind: 'dim', text: ' │ ' } : { kind: 'text', text: ' '.repeat(gap) })
      const cell = flowOf({ ...style, shape: 'visual' }, cells[c] ?? [], Infinity)
      const content = cell ? cell.lines[0]! : (cells[c] ?? [])
      const pad = Math.max(0, widths[c]! - width(inlineText(content)))
      const side = cell?.base === 'R' && block.align[c] !== 'center' ? 'flex-end' : justify(c)
      const before = side === 'flex-end' ? pad : side === 'center' ? Math.floor(pad / 2) : 0
      parts.push({ kind: 'text', text: ' '.repeat(before) }, ...(isHeader ? [{ kind: 'strong' as const, children: content }] : content), { kind: 'text', text: ' '.repeat(pad - before) })
    })
    if (box) parts.push({ kind: 'dim', text: ' │' })
    return <Text key={k}>{renderInline(el, style, terminalLine(parts), k)}</Text>
  }

  const row = (cells: Inline[][], k: string, isHeader: boolean, border: (k: string, text: string) => RenderElement = bar) => rtl && style.shape === 'inverse' ? terminalRow(cells, k, isHeader) : (
    <Box key={k} flexDirection="row" columnGap={gap} alignItems="stretch">
      {!box && lead(k)}
      {box && border(`${k}.l`, wall('│ '))}
      {order.map((c, i) => {
        const w = widths[c]!
        const cell = flowOf(style, cells[c] ?? [], Infinity, !mirror)
        const content = cell ? cell.lines[0]! : (cells[c] ?? [])
        const side = mirror ? (block.align[c] === 'center' ? 'center' : 'flex-start') : cell?.base === 'R' && block.align[c] !== 'center' ? 'flex-end' : justify(c)
        const runs = isHeader ? headerRuns(content) : content
        const cellBox = (
          <Box key={`${k}.${c}`} width={w} flexShrink={0} justifyContent={side}>
            {pressInline(el, style, runs, w, `${k}.${c}.p`, tip, isHeader ? { bold: true, color: t.tableHeader } : {}, { justifyContent: side })
              ?? (isHeader
                ? <Text bold color={t.tableHeader}>{runs.some(n => n.kind === 'footnote') ? renderInline(el, style, runs, `${k}.${c}`) : inlineText(runs)}</Text>
                : mirror && inlineText(content).trim() === '' ? <Text>{' '.repeat(w)}</Text>
                : <Text>{renderInline(el, style, content, `${k}.${c}`)}</Text>)}
          </Box>
        )
        return box && i > 0 ? [border(`${k}.${c}s`, wall(' │ ')), cellBox] : cellBox
      })}
      {box && border(`${k}.r`, wall(' │'))}
    </Box>
  )

  const wrappedRow = (cells: Inline[][], k: string, isHeader: boolean) => {
    if (!isHeader && cells.some(hasLink)) return [row(cells, k, isHeader, clipped(Math.max(1, ...widths.map((w, c) => mostLines(displayText(cells[c] ?? []), w)))))]
    const wrapped = widths.map((w, c) => {
      const content = cells[c] ?? []
      if (natural[c]! <= w) return [content]
      return wrapInline(isHeader ? headerRuns(content) : content, w)
    })
    return Array.from({ length: Math.max(...wrapped.map(l => l.length)) }, (_, i) =>
      row(wrapped.map(l => l[i] ?? []), `${k}.${i}`, isHeader))
  }

  if (box) {
    const lines: RenderElement[] = [edge(`${key}.t`, '┌─┬┐'), ...wrappedRow(block.header, `${key}.h`, true), edge(`${key}.hr`, '╞═╪╡')]
    block.rows.forEach((r, i) => {
      if (i > 0) lines.push(edge(`${key}.r${i}r`, '├─┼┤'))
      lines.push(...wrappedRow(r, `${key}.r${i}`, false))
    })
    lines.push(edge(`${key}.b`, '└─┴┘'))
    return <Box key={key} flexDirection="column" {...(flip ? { alignSelf: 'flex-end' as const } : {})}>{lines}</Box>
  }

  const body: RenderElement[] = [row(block.header, `${key}.h`, true), rule(`${key}.hr`, true)]
  block.rows.forEach((r, i) => {
    body.push(row(r, `${key}.r${i}`, false))
    if (style.tableStyle !== 'minimal' && i < block.rows.length - 1) body.push(rule(`${key}.r${i}r`, false))
  })
  return <Box key={key} flexDirection="column" {...(flip ? { alignSelf: 'flex-end' as const } : {})}>{body}</Box>
}

const renderHeading = (el: ElementTable, style: Style, block: Extract<Block, { kind: 'heading' }>, key: string) => {
  const rtl = flowOf(style, block.inline, Infinity)
  if (!rtl) return drawHeading(el, style, block, block.inline, key)
  if (rtl.base === 'R' && mirrored(style) && style.headingStyle === 'banner' && block.level <= 2) return mirroredBanner(el, style, block.level, rtl.lines[0]!, key)
  const heading = drawHeading(el, style, block, rtl.lines[0]!, key)
  return rtl.base === 'R' && !mirrored(style) ? <el.Box key={key} alignSelf="flex-end">{heading}</el.Box> : heading
}

const mirroredBanner = (el: ElementTable, style: Style, level: number, inline: Inline[], key: string) => {
  const { Box, Text } = el
  const color = style.theme.heading
  const text = <Text key={`${key}.h`} bold underline={level === 2} color={color}>{level === 1 ? `${WALL} ` : ''}{renderInline(el, style, inline, key)}{level === 1 ? ` ${WALL}` : ''}</Text>
  if (level === 2) return text
  const edge = (k: string) => <Text key={k} color={color}>{WALL + '━'.repeat(width(inlineText(inline)) + 2) + WALL}</Text>
  return <Box key={key} flexDirection="column">{edge(`${key}.t`)}{text}{edge(`${key}.b`)}</Box>
}

const drawHeading = (el: ElementTable, style: Style, block: Extract<Block, { kind: 'heading' }>, inline: Inline[], key: string) => {
  const { Box, Text } = el
  const t = style.theme
  const color = block.level <= 2 ? t.heading : t.accent ?? t.heading
  const label = inlineText(inline)
  switch (style.headingStyle) {
    case 'uppercase':
      return <Text key={key} bold color={color}>{block.level === 1 ? label.toUpperCase() : label}</Text>
    case 'underline':
      return <Text key={key} bold underline={block.level <= 2} color={color}>{label}</Text>
    case 'banner':
      if (block.level === 1) return <Box key={key} alignSelf="flex-start" borderStyle="bold" borderColor={color} paddingX={1}><Text bold color={color}>{renderInline(el, style, inline, key)}</Text></Box>
      return block.level === 2
        ? <Box key={key} flexDirection="column" alignSelf="flex-start"><Text bold color={color}>{renderInline(el, style, inline, key)}</Text><Text color={color}>{'━'.repeat(width(label))}</Text></Box>
        : <Text key={key} bold color={block.level === 3 ? color : t.strong}>{renderInline(el, style, inline, key)}</Text>
    default:
      return <Text key={key} bold color={color}>{renderInline(el, style, inline, key)}</Text>
  }
}

const ALERT_COLOR = { note: 'blue', tip: 'green', important: 'magenta', warning: 'yellow', caution: 'red' } as const

const prose = (style: Style) => (style.inside === 'quote' ? { italic: true, color: style.theme.quote } : {})

const renderParagraph = (el: ElementTable, style: Style, block: Extract<Block, { kind: 'paragraph' }>, columns: number, key: string, tip?: Tip) => {
  const { Box, Text } = el
  const rtl = flowOf(style, block.inline, columns)
  if (rtl?.base === 'R') return <Box key={key} flexDirection="column" {...(mirrored(style) ? {} : { alignItems: 'flex-end' as const })}>{renderFlow(el, style, rtl.lines, key, prose(style))}</Box>
  const inline = rtl ? rtl.lines[0]! : block.inline
  return pressInline(el, style, inline, columns, key, tip, { ...(style.narration ? { bold: true } : {}), ...prose(style) }) ?? <Text key={key} bold={style.narration} {...prose(style)}>{renderInline(el, style, inline, key)}</Text>
}

const leadInline = (blocks: Block[]): Inline[] => {
  const first = blocks[0]
  if (first?.kind === 'paragraph' || first?.kind === 'heading') return first.inline
  if (first?.kind === 'list') return first.items[0]?.inline ?? []
  return first?.kind === 'quote' || first?.kind === 'alert' ? leadInline(first.blocks) : []
}

const renderNested = (el: ElementTable, style: Style, blocks: Block[], columns: number, key: string, copy?: CopyButton, fold?: Fold, tip?: Tip) =>
  renderBlocks(el, style, blocks, columns, drawMath(el, style, blocks), copy && ((text, id, label, html) => copy(text, `${key}.${id}`, label, html)), fold && ((id, hidden, k) => fold(id, hidden, `${key}.${k}`)), tip)

const quoteBar = (el: ElementTable, text: string, color: string | undefined, lines: number) =>
  lines <= 1 ? <el.Text color={color}>{text}</el.Text> : clip(el, width(text), <el.Text color={color}>{Array.from({ length: lines }, () => text).join('\n')}</el.Text>)

const renderQuote = (el: ElementTable, style: Style, block: Extract<Block, { kind: 'quote' }>, columns: number, key: string, copy?: CopyButton, fold?: Fold, tip?: Tip) => {
  const { Box } = el
  const t = style.theme
  const inner = columns - 2
  const lines = heightOf(block.blocks, inner)
  const body = <Box flexDirection="column" rowGap={1}>{renderNested(el, { ...style, inside: 'quote' }, block.blocks, inner, key, copy, fold, tip)}</Box>
  if (!mirrored(style) && flowOf(style, leadInline(block.blocks), inner)?.base === 'R') {
    return (
      <Box key={key} flexDirection="row" justifyContent="flex-end" alignItems="stretch">
        {body}
        {quoteBar(el, ' │', t.accent, lines)}
      </Box>
    )
  }
  return (
    <Box key={key} flexDirection="row" alignItems="stretch">
      {quoteBar(el, mirrored(style) ? ROW_MARK_TEXT : '│ ', t.accent, lines)}
      {body}
    </Box>
  )
}

const renderAlert = (el: ElementTable, style: Style, block: Extract<Block, { kind: 'alert' }>, columns: number, key: string, copy?: CopyButton, fold?: Fold, tip?: Tip) => {
  const { Box, Text } = el
  const color = ALERT_COLOR[block.level]
  const inner = columns - 4
  const hebrew = flowOf(style, leadInline(block.blocks), inner)?.base === 'R'
  const label = block.level[0]!.toUpperCase() + block.level.slice(1)
  const body = block.blocks.length ? <Box flexDirection="column" rowGap={1}>{renderNested(el, { ...style, inside: 'alert' }, block.blocks, inner, key, copy, fold, tip)}</Box> : null
  if (hebrew && mirrored(style)) {
    const lines = 1 + (block.blocks.length ? 1 + heightOf(block.blocks, inner) : 0)
    const edge = (k: string) => <Text key={k} color={color}>{WALL + '─'.repeat(inner + 2) + WALL}</Text>
    return (
      <Box key={key} flexDirection="column" alignSelf="flex-start">
        {edge(`${key}.t`)}
        <Box flexDirection="row" alignItems="stretch">
          {quoteBar(el, ROW_MARK_TEXT, color, lines)}
          <Box flexDirection="column" width={inner}>
            <Text bold color={color}>{label}</Text>
            {body}
          </Box>
          {quoteBar(el, ` ${WALL}`, color, lines)}
        </Box>
        {edge(`${key}.b`)}
      </Box>
    )
  }
  return (
    <Box key={key} flexDirection="column" alignSelf={hebrew ? 'flex-end' : 'flex-start'} {...(hebrew ? { alignItems: 'flex-end' as const } : {})} borderStyle="round" borderColor={color} paddingX={1}>
      <Text bold color={color}>{label}</Text>
      {body}
    </Box>
  )
}

const TASK_GLYPHS = { checks: ['[ ]', '[✓]'], ticks: ['○', '✓'], box: ['□', '✓'], progress: ['○', '✓'] } as const

const renderList = (el: ElementTable, style: Style, block: Extract<Block, { kind: 'list' }>, columns: number, key: string, copy?: CopyButton, fold?: Fold, tip?: Tip) => {
  const { Box, Text } = el
  const t = style.theme
  const tasks = block.items.filter(item => item.task !== undefined)
  const done = tasks.filter(item => item.task).length
  const filled = tasks.length ? Math.round((done / tasks.length) * 20) : 0
  const strike = style.taskStyle === 'checks' || style.taskStyle === 'box'
  const tick = style.taskStyle === 'ticks' || style.taskStyle === 'progress'
  return (
    <Box key={key} flexDirection="column">
      {style.taskStyle === 'progress' && tasks.length > 0 && (
        <Text>
          <Text color={t.accent}>{'━'.repeat(filled)}</Text>
          <Text color={t.bullet} dimColor>{'─'.repeat(20 - filled)}</Text>
          <Text color={t.bullet}>{` ${done}/${tasks.length} done`}</Text>
        </Text>
      )}
      {block.items.map((item, i) => {
        const k = `${key}.${i}`
        const glyph = item.task !== undefined ? TASK_GLYPHS[style.taskStyle][item.task ? 1 : 0] : /\d/.test(item.marker) ? item.marker : item.depth ? '◦' : '•'
        const glyphColor = item.task && tick ? t.accent : t.bullet
        const pad = item.depth * 2 + glyph.length + 1
        const rtl = flowOf(style, item.inline, columns - pad)
        const look = { ...(item.task === true ? { dimColor: true, strikethrough: strike } : {}), ...prose(style) }
        const row = rtl?.base === 'R' && mirrored(style) ? (
          <Box key={k} flexDirection="row">
            <Text color={glyphColor}>{`${' '.repeat(item.depth * 2)}${glyph} `}</Text>
            <Box flexDirection="column">{renderFlow(el, style, rtl.lines, k, look)}</Box>
          </Box>
        ) : rtl?.base === 'R' ? (
          <Box key={k} flexDirection="row" justifyContent="flex-end" paddingRight={item.depth * 2}>
            <Box flexDirection="column" alignItems="flex-end">{renderFlow(el, style, rtl.lines, k, look)}</Box>
            <Text color={glyphColor}>{` ${glyph}`}</Text>
          </Box>
        ) : (
          <Box key={k} flexDirection="row" paddingLeft={item.depth * 2}>
            <Text color={glyphColor}>{`${glyph} `}</Text>
            {pressInline(el, style, rtl ? rtl.lines[0]! : item.inline, columns - pad, `${k}.i`, tip, look) ?? <Text dimColor={item.task === true} strikethrough={item.task === true && strike} {...prose(style)}>{renderInline(el, style, rtl ? rtl.lines[0]! : item.inline, k)}</Text>}
          </Box>
        )
        if (!item.blocks) return row
        return (
          <Box key={k} flexDirection="column">
            {row}
            <Box flexDirection="column" paddingLeft={pad}>{renderNested(el, style, item.blocks, columns - pad, k, copy, fold, tip)}</Box>
          </Box>
        )
      })}
    </Box>
  )
}

export type CopyButton = (text: string | (() => string), key: string, label?: string, html?: () => string) => RenderElement | null
export type Drawn = Map<number, { element?: RenderElement; art?: string; note?: string }>
export type Fold = (id: string, hidden: number, key: string) => { folded: boolean; element: RenderElement } | null
export type Tip = (note: number) => (() => void) | undefined

export const instanceKey = (id: string): string => {
  let h = 5381
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

export const noteTip = (blocks: Block[], toast: (text: string) => void): Tip | undefined => {
  const notes = blocks.find(block => block.kind === 'notes')
  if (notes?.kind !== 'notes') return undefined
  const text = new Map(notes.notes.map(note => [note.note, `${note.mark} ${inlineText(note.inline)}`]))
  return note => {
    const line = text.get(note)
    return line === undefined ? undefined : () => toast(line)
  }
}

const NUMBER_AT = 10
const NUMBER_MAX = 400
const FOLD_AT = 30
const FOLD_SHOW = 20

const codeId = (lines: string[]): string => {
  let h = 5381
  for (const line of lines) {
    for (let i = 0; i < line.length; i++) h = (h * 33 + line.charCodeAt(i)) | 0
    h = (h * 33 + 10) | 0
  }
  return `${lines.length}:${(h >>> 0).toString(36)}`
}

const copySource = (style: Style, block: Block): string | undefined =>
  block.kind === 'code' ? block.lines.join('\n')
  : block.kind === 'table' ? block.raw
  : style.inside ? undefined
  : block.kind === 'list' ? block.raw
  : block.kind === 'quote' || block.kind === 'alert' ? block.raw.split('\n').map(line => line.replace(/^\s*>\s?/, '')).join('\n')
  : undefined

export const drawMath = (el: ElementTable, style: Style, blocks: Block[], drawn: Drawn = new Map()): Drawn => {
  for (const [i, block] of blocks.entries()) {
    const tex = drawn.has(i) ? null : mathOf(block)
    const text = tex === null ? null : texText(tex)
    if (text && !text.includes('\\')) drawn.set(i, { element: <el.Box key={`b${i}`} paddingLeft={2}><el.Text italic color={style.theme.emphasis}>{text}</el.Text></el.Box> })
  }
  return drawn
}

const opensWithCopy = (block: Block): boolean =>
  block.kind === 'quote' && (block.blocks[0]?.kind === 'code' || block.blocks[0]?.kind === 'table' || (block.blocks[0] !== undefined && opensWithCopy(block.blocks[0])))

const holdsOnlyEmptyCode = (block: Block): boolean =>
  block.kind === 'quote' && block.blocks.length === 1 && ((block.blocks[0]!.kind === 'code' && block.blocks[0]!.lines.length === 0) || holdsOnlyEmptyCode(block.blocks[0]!))

export const renderBlocks = (el: ElementTable, style: Style, blocks: Block[], columns: number, drawn: Drawn = new Map(), copy?: CopyButton, fold?: Fold, tip?: Tip): RenderElement[] => {
  const { Box, Text } = el
  const t = style.theme
  const hover = style.copyButtonStyle === 'hover'
  const reserved = (buttons: (RenderElement | null | undefined)[]): number =>
    buttons.reduce<number>((w, button) => (button?.type === 'Button' ? w + (w ? 1 : 0) + width(`[ ${button.props.label} ]`) : w), 0)
  const floating = (button: RenderElement | null | undefined, parts: (RenderElement | null | undefined)[], low = false, start = false) => (button ? {
    minWidth: reserved(parts),
    element: <Box position="absolute" {...(low ? { bottom: 0 } : { top: 0 })} {...(start ? { left: 0 } : { right: 0 })} display="none" hover={{ display: 'flex' }}>{button}</Box>,
  } : null)
  const shown = blocks.map(block => drawable(block, style.httpLinks, style.editorLinks))
  const rtlTables = shown.map(block => style.reorder && block.kind === 'table' && isRtlTable(style, block))
  const buttons = blocks.map((block, b) => {
    const text = hover && holdsOnlyEmptyCode(block) ? undefined : copySource(style, block)
    const isPlainCode = block.kind === 'code' && !drawn.get(b)?.element
    const art = drawn.get(b)?.art ?? (block.kind === 'table' ? () => tableArt(block) : undefined)
    const first = text === undefined || isPlainCode ? null : copy?.(text, `copy${b}`, block.kind === 'table' ? '⧉ md' : art === undefined ? undefined : '⧉ source')
    const second = first && art !== undefined ? copy?.(art, `art${b}`, '⧉ art') : null
    const html = first && block.kind === 'table' ? copy?.(() => tableText(block), `html${b}`, '⧉ html', () => tableHtml(block)) : null
    return { first, second, html }
  })
  const beside = (b: number) => (hover || !buttons[b]!.first ? columns : columns - reserved([buttons[b]!.first]) - 2)
  const rendered = shown.map((block, b) => {
    const key = `b${b}`
    switch (block.kind) {
      case 'heading':
        return renderHeading(el, style, block, key)
      case 'paragraph':
        return drawn.get(b)?.element ?? renderParagraph(el, style, block, columns, key, tip)
      case 'quote':
        return renderQuote(el, style, block, beside(b), key, copy, fold, tip)
      case 'alert':
        return renderAlert(el, style, block, beside(b), key, copy, fold, tip)
      case 'rule':
        return <Text key={key} color={t.rule} dimColor={!t.rule}>{'─'.repeat(Math.max(8, Math.min(columns, 80)))}</Text>
      case 'code': {
        const done = drawn.get(b)?.element
        if (done) return done
        const note = drawn.get(b)?.note
        const lines = block.lines
        const toggle = lines.length > FOLD_AT ? fold?.(codeId(lines), lines.length - FOLD_SHOW, `fold${b}`) : null
        const shown = toggle?.folded ? FOLD_SHOW : lines.length
        const numbered = lines.length >= NUMBER_AT && lines.length <= NUMBER_MAX
        const drawnRows = (isShellLang(block.lang) ? null : highlightBlock(el, style, lines, block.lang, key))?.slice(0, shown) ?? lines.slice(0, shown).map((line, i) => codeLine(el, style, line, block.lang, `${key}.${i}`))
        const rows = style.nativeCode ? [<el.Code key="code" source={lines.slice(0, shown).join('\n') || ' '} {...(block.lang ? { language: block.lang } : {})} {...(numbered ? { startLine: 1 } : {})} />]
          : style.shape === 'engine' ? drawnRows.map((row, i) => <Text key={`${key}.ltr${i}`} {...heldLtr(style)}>{row}</Text>) : drawnRows
        const gutter = String(lines.length).length
        const button = copy?.(lines.join('\n'), `copy${b}`) ?? null
        const float = hover ? floating(button, [button]) : null
        return (
          <Box key={key} flexDirection="column" alignSelf="flex-start" minWidth={float?.minWidth}>
            {note ? <Text color={t.codeComment}>{note}</Text> : null}
            <Box flexDirection="row" justifyContent="space-between" columnGap={4}>
              <Text color={t.codeComment}>{`── ${block.lang || 'code'}`}</Text>
              {float ? float.element : button}
            </Box>
            <Box flexDirection="column" paddingLeft={2}>
              {!numbered || style.nativeCode ? rows : rows.map((row, i) => row.type === 'Text' ? <Box key={`n${i}`} flexDirection="row"><Text color={t.codeComment} dimColor>{`${String(i + 1).padStart(gutter)}  `}</Text>{row}</Box> : row)}
              {toggle?.element ?? null}
            </Box>
          </Box>
        )
      }
      case 'list':
        return renderList(el, style, block, columns, key, copy, fold, tip)
      case 'table':
        return renderTable(el, style, block, columns, key, rtlTables[b]!, tip)
      case 'notes':
        return (
          <Box key={key} flexDirection="column">
            <Text dimColor>{'─'.repeat(Math.min(columns, 12))}</Text>
            {block.notes.map((note, i) => <Text key={`${key}.${i}`} dimColor {...noteHover(style, note.note)}>{note.mark} {renderInline(el, style, note.inline, `${key}.${i}`)}</Text>)}
          </Box>
        )
    }
  })
  const copied = rendered.map((element, b) => {
    const block = blocks[b]!
    const { first, second, html } = buttons[b]!
    const button = second ? (
      <el.Box key={`copies${b}`} flexDirection="row" columnGap={1}>
        {first}
        {second}
        {html}
      </el.Box>
    ) : first
    if (!button) return element
    const { Box } = el
    const hebrew = style.reorder && hasRtl(block.raw)
    const rtl = hebrew && !mirrored(style)
    const mirror = hebrew && mirrored(style)
    if (hover) {
      const wide = rtl && (block.kind === 'list' || block.kind === 'quote' || block.kind === 'alert' || rtlTables[b])
      const start = wide && (rtlTables[b] || flowOf(style, leadInline([block]), columns)?.base === 'R')
      const float = floating(button, second ? [first, second, html] : [first], opensWithCopy(block), start)!
      return (
        <Box key={`c${b}`} flexDirection="column" minWidth={float.minWidth} {...(start ? {} : { alignSelf: 'flex-start' as const })}>
          {element}
          {float.element}
        </Box>
      )
    }
    return (block.kind === 'quote' || block.kind === 'alert') && !mirrored(style) ? (
      <Box key={`c${b}`} flexDirection="row" columnGap={2} {...(rtl ? { justifyContent: 'flex-end' as const } : {})}>
        {element}
        {opensWithCopy(block) ? <Box alignSelf="flex-end">{button}</Box> : button}
      </Box>
    ) : (
      <Box key={`c${b}`} flexDirection="column" {...(mirror ? { width: '100%' } : rtl && (block.kind === 'list' || rtlTables[b]) ? {} : { alignSelf: 'flex-start' as const })}>
        <Box justifyContent="flex-end">{button}</Box>
        {element}
      </Box>
    )
  })
  const isFigure = (b: number) => blocks[b]?.kind === 'table' || drawn.get(b)?.art !== undefined
  const out: RenderElement[] = []
  for (let b = 0; b < rendered.length; b++) {
    if (!isFigure(b) || !isFigure(b + 1)) {
      out.push(copied[b]!)
      continue
    }
    const start = b
    while (isFigure(b + 1)) b++
    out.push(
      <Box key={`row${start}`} flexDirection="row" flexWrap="wrap" columnGap={4} rowGap={1}>
        {copied.slice(start, b + 1).map((figure, i) => <Box key={`f${start + i}`} flexShrink={0}>{figure}</Box>)}
      </Box>,
    )
  }
  return out
}

export type ToolRow = { tool: string; input: unknown; isRunning: boolean; isErrored: boolean; isInterrupted: boolean }

const VERBS: Record<string, string> = {
  Bash: 'Ran', PowerShell: 'Ran', Read: 'Read', Write: 'Wrote', Edit: 'Edited', MultiEdit: 'Edited', NotebookEdit: 'Edited',
  Grep: 'Searched', Glob: 'Listed', WebFetch: 'Fetched', WebSearch: 'Searched the web for', Agent: 'Delegated', Task: 'Delegated',
}

const field = (input: unknown, ...keys: string[]): string | undefined => {
  if (input === null || typeof input !== 'object') return undefined
  for (const k of keys) {
    const v = (input as Record<string, unknown>)[k]
    if (typeof v === 'string' && v.trim() !== '') return v
  }
  return undefined
}

const TARGET_FIELDS = ['file_path', 'notebook_path', 'path', 'pattern', 'url', 'query', 'description']

const statusColor = (t: Theme, row: ToolRow) =>
  row.isErrored ? t.codeFlag : row.isInterrupted ? t.codeComment : row.isRunning ? t.accent : t.number

const toolDim = (style: Style) => style.toolStyle !== "classic"

const toolGutter = ({ Box, Text }: ElementTable, style: Style, color: string | undefined, running: boolean) =>
  style.toolStyle.startsWith("tree")
    ? <Box width={4} flexShrink={0}><Text color={color}>{'  ⎿ '}</Text></Box>
    : <Box width={2} flexShrink={0}><Text color={color}>{running ? '◌' : '●'}</Text></Box>

const toolLayout = (el: ElementTable, style: Style, columns: number, label: string, color: string | undefined, running: boolean, text: RenderElement) => {
  const { Box, Text } = el
  if (style.toolStyle !== "chat") return <Box flexDirection="row">{toolGutter(el, style, color, running)}{text}</Box>
  const w = Math.min(width(label) + 2, Math.max(20, Math.floor(columns * 0.6)))
  return (
    <Box flexDirection="row" justifyContent="flex-end" width="100%">
      <Box width={w} flexDirection="row">{text}<Text color={color}>{running ? " ◌" : " ●"}</Text></Box>
    </Box>
  )
}

type Places = Pick<Style, 'cwd' | 'home'>

const slashes = (path: string): string => path.replace(/\\/g, '/').replace(/\/+$/, '')

const folded = (path: string): string => (/^[a-z]:(\/|$)/i.test(path) ? path.toLowerCase() : path)

export const shortPath = (style: Places, path: string): string => {
  const target = folded(slashes(path))
  for (const [root, home] of [[style.cwd, false], [style.home, true]] as const) {
    const base = folded(slashes(root))
    if (base !== '' && target.startsWith(`${base}/`)) return home ? `~${path.slice(base.length)}` : path.slice(base.length + 1)
  }
  return path
}

const compactPath = (path: string): string => {
  const parts = path.split('/')
  if (!path.startsWith('/') || parts.length <= 6) return path
  return [...parts.slice(0, 3), '…', ...parts.slice(-2)].join('/')
}

const sameDir = (a: string, b: string): boolean => a !== '' && folded(slashes(a)) === folded(slashes(b))

export const shortTarget = (places: Places, path: string): string => (sameDir(places.cwd, path) ? '.' : sameDir(places.home, path) ? '~' : compactPath(shortPath(places, path)))


const PATH_FIELDS = ['file_path', 'notebook_path', 'path']

const targetOf = (style: Style, input: unknown, fields: string[]): { target?: string; isPathField: boolean } => {
  const target = field(input, ...fields)
  const isPathField = target !== undefined && PATH_FIELDS.some(k => field(input, k) === target)
  return { target: isPathField ? shortPath(style, target!) : target, isPathField }
}

const RESULT_LINES = 3

export const renderShellResult = (el: ElementTable, style: Style, output: unknown): RenderElement => {
  const { Box, Text } = el
  const out = output !== null && typeof output === 'object' ? (output as Record<string, unknown>) : {}
  const shown = [...lines(out.stdout), ...lines(out.stderr)]
  const head = shown.slice(0, RESULT_LINES).map(l => shortenPaths(l, style))
  return (
    <Box flexDirection="row">
      <Text dimColor>{'  ⎿  '}</Text>
      <Box flexDirection="column">
        {head.length === 0 ? <Text dimColor>(No output)</Text> : head.map((l, i) => <Text key={`l${i}`} wrap="truncate-end">{l === '' ? ' ' : l}</Text>)}
        {shown.length > head.length ? <Text dimColor>{`… +${shown.length - head.length} lines`}</Text> : null}
      </Box>
    </Box>
  )
}

const DIFF_LINES = 20
const DIFF_MAX = 400

type DiffLine = { mark: '+' | '-' | ' '; num: number; text: string }

const HEX = /^#[0-9a-f]{6}$/i

const channels = (hex: string): number[] => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))

export const tint = (base: string | undefined, color: string | undefined, share: number): string | undefined => {
  if (!base || !color || !HEX.test(base) || !HEX.test(color)) return undefined
  const [b, c] = [channels(base), channels(color)]
  return `#${b.map((v, i) => Math.round(v * (1 - share) + c[i]! * share).toString(16).padStart(2, '0')).join('')}`
}

const luminance = (hex: string): number => {
  const [r, g, b] = channels(hex).map(v => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

export const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

const TEXT_CONTRAST = 4.5

export const fullHue = (hex: string): string => {
  const [r, g, b] = channels(hex).map(v => v / 255) as [number, number, number]
  const max = Math.max(r, g, b)
  const spread = max - Math.min(r, g, b)
  const lightness = (max + max - spread) / 2
  if (spread === 0 || spread / (1 - Math.abs(2 * lightness - 1)) < 0.1) return hex
  const sector = max === r ? ((g - b) / spread + 6) % 6 : max === g ? (b - r) / spread + 2 : (r - g) / spread + 4
  const x = 1 - Math.abs((sector % 2) - 1)
  const pure = [[1, x, 0], [x, 1, 0], [0, 1, x], [0, x, 1], [x, 0, 1], [1, 0, x]][Math.floor(sector)]!
  return `#${pure.map(v => Math.round(v! * 255).toString(16).padStart(2, '0')).join('')}`
}

export const diffTint = (text: string | undefined, color: string | undefined): string | undefined => {
  if (!text || !color || !HEX.test(text) || !HEX.test(color)) return undefined
  const dark = contrast(text, '#000000') >= contrast(text, '#ffffff')
  const base = dark ? '#000000' : '#ffffff'
  const hue = fullHue(color)
  let share = dark ? 0.3 : 0.2
  while (share > 0.05 && contrast(text, tint(base, hue, share)!) < TEXT_CONTRAST) share -= 0.01
  return tint(base, hue, share)
}

export const diffLines = (output: unknown): DiffLine[] | undefined => {
  if (output === null || typeof output !== 'object') return undefined
  const out = output as { type?: unknown; content?: unknown; structuredPatch?: unknown }
  if (out.type === 'create' && typeof out.content === 'string') return lines(out.content).map((text, i) => ({ mark: '+', num: i + 1, text }))
  if (!Array.isArray(out.structuredPatch) || out.structuredPatch.length === 0) return undefined
  const rows: DiffLine[] = []
  for (const hunk of out.structuredPatch as { oldStart?: unknown; newStart?: unknown; lines?: unknown }[]) {
    if (typeof hunk?.oldStart !== 'number' || typeof hunk.newStart !== 'number' || !Array.isArray(hunk.lines)) return undefined
    let [o, n] = [hunk.oldStart, hunk.newStart]
    for (const l of hunk.lines) {
      if (typeof l !== 'string' || l.startsWith('\\')) continue
      const mark = l[0] === '+' || l[0] === '-' ? l[0] : ' '
      let num: number
      if (mark === '-') num = o++
      else {
        if (mark === ' ') o++
        num = n++
      }
      rows.push({ mark, num, text: l.slice(1) })
    }
  }
  return rows
}

const diffBox = (el: ElementTable, style: Style, rows: DiffLine[], fold: Fold, id: string, key: string, title?: string): RenderElement => {
  const { Box, Text } = el
  const t = style.theme
  const added = rows.filter(r => r.mark === '+').length
  const removed = rows.filter(r => r.mark === '-').length
  const toggle = rows.length > DIFF_LINES ? fold?.(id, rows.length - DIFF_LINES, `fold${key}`) : null
  const shown = rows.slice(0, toggle?.folded === false ? DIFF_MAX : DIFF_LINES)
  const gutter = String(Math.max(0, ...shown.map(r => r.num))).length
  const [addColor, removeColor] = [t.diffAdded ?? t.number, t.diffRemoved ?? t.codeFlag]
  const color = (mark: DiffLine['mark']) => (mark === '+' ? addColor : mark === '-' ? removeColor : undefined)
  const look = style.diffStyle
  const tinted = look === 'card' || look === 'full'
  const tints = { '+': tinted ? diffTint(t.codeText, addColor) : undefined, '-': tinted ? diffTint(t.codeText, removeColor) : undefined, ' ': undefined }
  const frame = look === 'card' ? { borderStyle: 'round', borderColor: t.rule, paddingX: 1 } : {}
  return (
    <Box key={`card${key}`} flexDirection="column" flexShrink={1} {...frame}>
      <Text>
        {title === undefined ? null : <Text color={t.path}>{`${title} `}</Text>}
        <Text color={addColor} dimColor={added === 0}>{`+${added}`}</Text>
        <Text> </Text>
        <Text color={removeColor} dimColor={removed === 0}>{`−${removed}`}</Text>
      </Text>
      {shown.map((r, i) => {
        const bg = tints[r.mark]
        return (
          <Box key={`d${i}`} flexDirection="row" {...(bg ? { backgroundColor: bg } : {})}>
            {look === 'bar' ? <Text color={color(r.mark)}>{r.mark === ' ' ? '  ' : '▌ '}</Text> : null}
            <Text dimColor>{`${String(r.num).padStart(gutter)} `}</Text>
            <Text color={color(r.mark)} dimColor={r.mark === ' '}>{`${r.mark} `}</Text>
            <Text color={bg || look === 'bar' ? t.codeText : color(r.mark)} dimColor={r.mark === ' '}>{r.text === '' ? ' ' : r.text}</Text>
          </Box>
        )
      })}
      {rows.length > shown.length && toggle?.folded !== true ? <Text dimColor>{`… +${rows.length - shown.length} lines`}</Text> : null}
      {toggle?.element ?? null}
    </Box>
  )
}

const diffRow = (el: ElementTable, style: Style, cards: RenderElement[], below: boolean): RenderElement => (
  <el.Box flexDirection="row">
    <el.Text dimColor>{below ? '     ' : '  ⎿  '}</el.Text>
    <el.Box flexDirection="column" flexShrink={1} {...(style.diffStyle === 'full' ? { flexGrow: 1 } : { alignItems: 'flex-start' as const })}>{cards}</el.Box>
  </el.Box>
)

export const renderDiffCard = (el: ElementTable, style: Style, output: unknown, fold: Fold, id: string): RenderElement | undefined => {
  const rows = diffLines(output)
  return rows === undefined ? undefined : diffRow(el, style, [diffBox(el, style, rows, fold, id, '')], false)
}

type EditedFile = { path: string; rows: DiffLine[] }

export type BashEdits = { files: EditedFile[]; more: number; shared: boolean }

export const EDIT_NOTES = {
  first: 'every file that changed while this ran, by this command or anything else: a view of the changes, not an audit of the command',
  shared: 'another command ran in this repository at the same time, so changes by either may show under either one',
  tree: 'a git step in this command can move the working tree, so these may be its changes rather than edits',
} as const

export const bashEdits = (output: unknown): BashEdits | undefined => {
  if (output === null || typeof output !== 'object') return undefined
  const diff = (output as { bashEditDiff?: unknown }).bashEditDiff
  if (diff === null || typeof diff !== 'object') return undefined
  const { files, moreFiles, shared } = diff as { files?: unknown; moreFiles?: unknown; shared?: unknown }
  if (!Array.isArray(files) || files.length === 0) return undefined
  const edited: EditedFile[] = []
  for (const file of files as ({ filePath?: unknown; hunks?: unknown } | null)[]) {
    const rows = diffLines({ structuredPatch: file?.hunks })
    if (typeof file?.filePath !== 'string' || rows === undefined) return undefined
    edited.push({ path: file.filePath, rows })
  }
  return { files: edited, more: typeof moreFiles === 'number' && moreFiles > 0 ? moreFiles : 0, shared: shared === true }
}

export const withoutBashEdits = (output: unknown): unknown => {
  if (output === null || typeof output !== 'object') return output
  const { bashEditDiff: _, ...rest } = output as Record<string, unknown>
  return rest
}

export const hasShellOutput = (output: unknown): boolean => {
  const out = output !== null && typeof output === 'object' ? (output as Record<string, unknown>) : {}
  return lines(out.stdout).length + lines(out.stderr).length > 0
}

export const renderBashEdits = (el: ElementTable, style: Style, edits: BashEdits, fold: Fold, id: string, below = false, notes: readonly string[] = []): RenderElement => {
  const cards = edits.files.map((file, i) => diffBox(el, style, file.rows, fold, `${id}:${i}`, String(i), shortPath(style, file.path)))
  const more = edits.more ? [<el.Text key="more" dimColor>{`… +${edits.more} more ${edits.more === 1 ? 'file' : 'files'}`}</el.Text>] : []
  const said = notes.map((note, i) => <el.Text key={`note${i}`} dimColor>{`(${note})`}</el.Text>)
  return diffRow(el, style, [...cards, ...more, ...said], below)
}

const TREE_MOVERS = new Set(['checkout', 'switch', 'stash', 'pull', 'merge', 'rebase', 'reset', 'restore', 'clean', 'cherry-pick', 'revert'])

const gitSubcommand = (args: string[]): string | undefined => {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!
    if (!arg.startsWith('-')) return arg
    if (arg === '-C' || arg === '-c') i++
  }
  return undefined
}

export const editNotes = (edits: BashEdits, first: boolean, command?: string): string[] => [
  ...(first ? [EDIT_NOTES.first] : []),
  ...(edits.shared ? [EDIT_NOTES.shared] : []),
  ...(command !== undefined && movesTree(command) ? [EDIT_NOTES.tree] : []),
]

export const movesTree = (command: string): boolean =>
  parseShell(command).segments.some(({ words }) => {
    const argv = commandWords(words)
    const [name, ...rest] = argv[0] === 'sudo' ? argv.slice(1) : argv
    return name?.split('/').pop() === 'git' && TREE_MOVERS.has(gitSubcommand(rest) ?? '')
  })

const NOISE_LINES = /^((Error:\s*)?Exit code \d+|at\s+(\S+\s+\()?\S+:\d+(:\d+)?\)?|Node\.js v\d.*|exit status \d+|\.\.\. \d+ more)$/i

const REFUSAL = /^(Error:\s*)?(The user doesn't want to proceed|Permission (for|to) .*\bdenied|The server-side auto mode classifier|\S+ hook error:)/i

export const refusalReason = (output: unknown): string | undefined => {
  if (typeof output !== 'string' || /^(Error:\s*)?Exit code \d+/m.test(output) || !REFUSAL.test(output)) return undefined
  return output.replace(/\s+/g, ' ').trim()
}

export const rememberCall = (calls: Set<string>, id: string, limit = 2000): void => {
  calls.delete(id)
  calls.add(id)
  if (calls.size > limit) calls.delete(calls.values().next().value!)
}

export const errorReason = (output: unknown): string | undefined => {
  const out = output !== null && typeof output === 'object' ? (output as Record<string, unknown>) : {}
  const text = typeof output === 'string' ? output : typeof out.stderr === 'string' && out.stderr.trim() ? out.stderr : out.stdout
  if (typeof text !== 'string') return undefined
  return text.split('\n').map(l => l.trim()).filter(l => l !== '' && !NOISE_LINES.test(l)).at(-1)
}

export const renderFailure = (el: ElementTable, style: Style, output: unknown, key?: string): RenderElement | undefined => {
  const refusal = refusalReason(output)
  const reason = refusal ?? errorReason(output)
  if (reason === undefined) return undefined
  const chat = style.toolStyle === 'chat'
  return (
    <el.Box key={key} flexDirection="row" width="100%" justifyContent={chat ? 'flex-end' : 'flex-start'}>
      <el.Text color={style.theme.codeFlag} wrap={refusal === undefined ? 'truncate-middle' : 'wrap'}>{`${chat ? '' : '  ⎿ '}${refusal ?? shortenPaths(reason, style)}`}</el.Text>
    </el.Box>
  )
}

const callLabel = (call: ToolRow, style: Style): string => {
  const isShell = call.tool === 'Bash' || call.tool === 'PowerShell'
  if (isShell) {
    const command = field(call.input, 'command') ?? ''
    const plain = call.tool === 'Bash' ? describeShell(command, style) : undefined
    if (plain) return plain
    const description = field(call.input, 'description')
    if (description === undefined) return `Ran ${shortenPaths(command.split('\n')[0]!, style)}`
    const programs = call.tool === 'Bash' ? programsOf(command) : []
    return programs.length ? `${description} · ${programs.join(', ')}` : description
  }
  if (call.tool === 'Grep') {
    const pattern = field(call.input, 'pattern')
    const path = field(call.input, 'path')
    if (pattern !== undefined) return `Searched ${path === undefined ? '.' : shortTarget(style, path)} for "${pattern}"`
  }
  const verb = call.tool === 'Skill' ? 'Loaded skill' : VERBS[call.tool] ?? call.tool.replace(/^mcp__([^_]+)__/, '$1 ')
  const target = field(call.input, 'skill', ...TARGET_FIELDS)
  const args = call.tool === 'Skill' ? field(call.input, 'args') : undefined
  return target === undefined ? verb : `${verb} ${shortTarget(style, target)}${args ? ` ${args}` : ''}`
}

const quietToolRow = (el: ElementTable, style: Style, row: ToolRow, columns: number): RenderElement => {
  const t = style.theme
  const dot = statusColor(t, row)
  const what = callLabel(row, style)
  const label = `${what}${row.isInterrupted ? ' interrupted' : row.isErrored ? ' failed' : ''}`
  return toolLayout(el, style, columns, label, dot, row.isRunning, (
    <el.Text wrap="truncate-end" dimColor={toolDim(style)}>
      {what}
      {row.isInterrupted ? <el.Text dimColor> interrupted</el.Text> : row.isErrored ? <el.Text color={t.codeFlag}> failed</el.Text> : null}
    </el.Text>
  ))
}

export const renderToolRow = (el: ElementTable, style: Style, row: ToolRow, columns = 100): RenderElement => {
  if (style.toolOutput === 'quiet') return quietToolRow(el, style, row, columns)
  const { Text } = el
  const t = style.theme
  const isShell = row.tool === 'Bash' || row.tool === 'PowerShell'
  const verb = VERBS[row.tool] ?? row.tool.replace(/^mcp__([^_]+)__/, '$1 ')
  const found = isShell ? { target: field(row.input, 'command')?.split('\n')[0], isPathField: false } : targetOf(style, row.input, TARGET_FIELDS)
  const target = found.target
  const dot = statusColor(t, row)
  const isPath = target !== undefined && (found.isPathField || /^(~|\.{0,2}\/|[A-Za-z]:\\)/.test(target))

  const label = `${verb}${target === undefined ? "" : ` ${target}`}${row.isInterrupted ? " interrupted" : row.isErrored ? " failed" : ""}`
  return toolLayout(el, style, columns, label, dot, row.isRunning, (
      <Text wrap="truncate-end" dimColor={toolDim(style)}>
        <Text bold={!toolDim(style)} dimColor={toolDim(style)}>{verb}</Text>
        {target === undefined ? null : <Text> </Text>}
        {target === undefined ? null : isShell ? codeLine(el, style, target, 'bash', 'cmd') : <Text color={isPath ? t.path : t.inlineCode} dimColor={toolDim(style)}>{target}</Text>}
        {row.isInterrupted ? <Text dimColor> interrupted</Text> : row.isErrored ? <Text color={t.codeFlag}> failed</Text> : null}
      </Text>
  ))
}

const READ_TOOLS = new Set(['Read', 'Grep', 'Glob', 'LS', 'NotebookRead', 'WebFetch', 'WebSearch', 'Skill'])

const READ_COMMANDS = new Set([
  'awk', 'basename', 'cat', 'cd', 'column', 'cut', 'diff', 'dirname', 'du', 'echo', 'file', 'find', 'grep', 'head', 'jq', 'less',
  'ls', 'nl', 'pdftotext', 'printf', 'pwd', 'readlink', 'realpath', 'rg', 'sed', 'sort', 'stat', 'tail', 'test', 'tr', 'tree',
  'true', 'uniq', 'wc', 'which',
])

const READ_SUBCOMMANDS: Record<string, RegExp> = {
  git: /^(log|show|diff|status|blame|grep|ls-files|rev-parse|branch --show-current)\b/,
  gh: /^((pr|issue|run|release) (view|list|diff|checks)|search)\b/,
}

const flagValue = (args: string[], i: number, flag: string): string => {
  const arg = args[i]!
  return arg === flag ? (args[i + 1] ?? '') : arg.slice(flag.length).replace(/^=/, '')
}

const ghApiReadsOnly = (rest: string[]): boolean =>
  !rest.some((a, i) => {
    if (/^(-[fF]|--field|--raw-field|--input)/.test(a)) return true
    if (!/^(-X|--method)/.test(a)) return false
    return !/^GET$/i.test(flagValue(rest, i, a.startsWith('--') ? '--method' : '-X'))
  })

type ShellPart = { words: string[]; piped: boolean }

const HEREDOC = /<<(?!<)-?\s*(['"]?)([A-Za-z_][\w-]*)\1/g

const dropHeredocBodies = (command: string): string => {
  const lines = command.split('\n')
  const out: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    out.push(line)
    for (const [, , end] of line.matchAll(HEREDOC)) {
      while (i + 1 < lines.length && lines[i + 1]!.trim() !== end) i++
      i++
    }
  }
  return out.join('\n')
}

const parseShell = (source: string): { segments: ShellPart[]; redirects: boolean } => {
  const command = dropHeredocBodies(source)
  const segments: ShellPart[] = [{ words: [], piped: false }]
  let word = ''
  let quote = ''
  let started = false
  let redirects = false
  const current = () => segments[segments.length - 1]!
  const endWord = () => {
    if (started) current().words.push(word)
    word = ''
    started = false
  }
  const endSegment = (piped: boolean) => {
    endWord()
    if (current().words.length) segments.push({ words: [], piped })
    else current().piped = piped
  }
  for (let i = 0; i < command.length; i++) {
    const ch = command[i]!
    if (quote) {
      if (ch === quote) quote = ''
      else if (ch === '\\' && quote === '"' && /[$`"\\\n]/.test(command[i + 1] ?? '')) word += command[++i]
      else word += ch
    } else if (ch === '"' || ch === "'") {
      quote = ch
      started = true
    } else if (ch === '\\' && command[i + 1] === '\n') {
      i++
    } else if (ch === '\\' && i + 1 < command.length) {
      word += command[++i]
      started = true
    } else if (ch === '\n' || ch === ';') {
      endSegment(false)
    } else if (ch === '&' && command[i + 1] === '&') {
      i++
      endSegment(false)
    } else if (ch === '&' && command[i + 1] !== '>' && command[i - 1] !== '|' && command[i - 1] !== '>') {
      endSegment(false)
    } else if (ch === '|') {
      const or = command[i + 1] === '|'
      if (or) i++
      endSegment(!or)
    } else if (ch === '>' || ch === '<') {
      const harmless = ch === '>' && /^(&\d|\s*\/dev\/null)/.exec(command.slice(i + 1))
      if (harmless) i += harmless[0].length
      else redirects = true
      if (/^(\d|&)$/.test(word)) {
        word = ''
        started = false
      }
      endWord()
    } else if (/\s/.test(ch)) {
      endWord()
    } else {
      word += ch
      started = true
    }
  }
  endWord()
  return { segments: segments.filter(s => s.words.length), redirects }
}

const isAssignment = (word: string) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(word)

const LEADING_KEYWORDS = new Set(['do', 'then', 'else', 'elif', 'if', 'while', 'until', '!', '{', '(', 'time'])
const HEADER_KEYWORDS = new Set(['for', 'select', 'done', 'fi', 'esac', '}', ')'])

const commandWords = (words: string[]) => {
  let i = 0
  while (i < words.length && (isAssignment(words[i]!) || LEADING_KEYWORDS.has(words[i]!))) i++
  return HEADER_KEYWORDS.has(words[i] ?? '') ? [] : words.slice(i)
}

const readsOnly = ({ words }: ShellPart): boolean => {
  const [name, ...rest] = commandWords(words)
  if (name === undefined) return true
  const args = rest.join(' ')
  if (name === 'gh' && rest[0] === 'api') return ghApiReadsOnly(rest.slice(1))
  if (Object.hasOwn(READ_SUBCOMMANDS, name)) return READ_SUBCOMMANDS[name]!.test(args) && !(name === 'git' && rest.some(a => /^--output\b/.test(a)))
  if (!READ_COMMANDS.has(name)) return false
  if (name === 'sed') {
    const [script, ...files] = rest.filter(a => a !== '-n')
    return script !== undefined && /^\d+(,\d+)?p$/.test(script) && files.every(f => !f.startsWith('-'))
  }
  if (name === 'find') return !rest.some(a => /^-(delete|exec|execdir|ok|okdir|fprint|fprint0|fprintf|fls)$/.test(a))
  if (name === 'awk') return !rest.some(a => /^(-f|--file|-i|--include|-E|--exec|-l|--load)/.test(a)) && !/system\s*\(|getline|@(include|load)|[|>]/.test(args)
  if (name === 'sort') return !rest.some(a => /^(-[A-Za-z]*o|--output)/.test(a))
  if (name === 'uniq') return operandsOf(name, rest).length < 2
  if (name === 'tree') return !rest.some(a => /^(-o|--output)/.test(a))
  if (name === 'rg') return !rest.some(a => /^--pre/.test(a))
  if (name === 'pdftotext') return rest.at(-1) === '-'
  return true
}

export const isReadOnlyCall = (tool: string, input: unknown): boolean => {
  if (READ_TOOLS.has(tool)) return true
  if (tool !== 'Bash' && tool !== 'PowerShell') return false
  const command = field(input, 'command')
  if (command === undefined) return false
  if (/\$\(|`|<<|\btee\b/.test(command)) return false
  const shell = parseShell(command)
  return !shell.redirects && shell.segments.every(readsOnly)
}

const TRIVIAL_PROGRAMS = new Set(['cd', 'echo', 'export', 'printf', 'pwd', 'set', 'test', 'true'])

export const programsOf = (command: string): string[] => {
  const names: string[] = []
  for (const part of parseShell(command).segments) {
    const name = commandWords(part.words)[0]?.split('/').pop()
    if (name && !TRIVIAL_PROGRAMS.has(name) && !names.includes(name)) names.push(name)
  }
  return names.length > 3 ? [...names.slice(0, 3), '…'] : names
}

export const shortenPaths = (text: string, places: Places): string => {
  const prefix = (path: string) => new RegExp(`(?<![\\w.~:/-])${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`, 'g')
  let out = text
  if (places.cwd) out = out.replace(prefix(places.cwd), '')
  if (places.home) out = out.replace(prefix(places.home), '~/')
  return out.replace(/(?<![\w.~:/-])\/[^\s'"`;|&<>()]+/g, compactPath)
}

const VALUE_FLAGS: Record<string, Set<string>> = {
  grep: new Set(['-A', '-B', '-C', '-m', '-e', '-f', '--max-count', '--include', '--exclude', '--exclude-dir']),
  rg: new Set(['-A', '-B', '-C', '-m', '-e', '-f', '-g', '-t', '--type', '--glob', '--max-count', '--max-depth']),
  tree: new Set(['-L', '-P', '-I']),
  uniq: new Set(['-f', '-s', '-w']),
}

const operandsOf = (name: string, args: string[]): string[] => {
  const valued = VALUE_FLAGS[name]
  const out: string[] = []
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!
    if (valued?.has(a)) i++
    else if (!a.startsWith('-')) out.push(a)
  }
  return out
}

const describeCommand = (name: string, args: string[], places: Places): string | undefined => {
  const files = (list: string[]) => list.map(f => shortTarget(places, f)).join(', ')
  const ops = operandsOf(name, args)
  if (TRIVIAL_PROGRAMS.has(name)) return ''
  if (name === 'sed') {
    const range = args.find(a => /^\d+(,\d+)?p$/.test(a))
    const targets = ops.filter(a => a !== range)
    if (!range || !targets.length) return undefined
    const [from, to] = range.slice(0, -1).split(',')
    return `Read ${files(targets)} lines ${from}${to ? `–${to}` : ''}`
  }
  if (name === 'cat' || name === 'less' || name === 'nl') return ops.length ? `Read ${files(ops)}` : undefined
  if (name === 'pdftotext') return ops.length ? `Read ${files(ops.slice(0, 1))}` : undefined
  if (name === 'head' || name === 'tail') {
    const targets = ops.filter(a => !/^\d+$/.test(a))
    return targets.length ? `Read ${name === 'head' ? 'start' : 'end'} of ${files(targets)}` : undefined
  }
  if (name === 'grep' || name === 'rg') {
    const e = args.indexOf('-e')
    const pattern = e >= 0 ? args[e + 1] : ops[0]
    const paths = e >= 0 ? ops : ops.slice(1)
    return pattern === undefined ? undefined : `Searched ${paths.length ? files(paths) : '.'} for "${pattern}"`
  }
  if (name === 'ls' || name === 'tree') return `Listed ${ops.length ? files(ops) : '.'}`
  if (name === 'find') return `Listed ${args[0] && !args[0].startsWith('-') ? files([args[0]]) : '.'}`
  if (name === 'wc') return ops.length ? `Counted ${files(ops)}` : undefined
  return undefined
}

export const describeShell = (command: string, places: Places = { cwd: '', home: '' }): string | undefined => {
  if (!isReadOnlyCall('Bash', { command })) return undefined
  const vars = new Map<string, string>()
  const expand = (w: string) => w.replace(/\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g, (m, v: string) => vars.get(v) ?? m)
  const parts: string[] = []
  for (const segment of parseShell(command).segments) {
    const words = commandWords(segment.words)
    if (!words.length) {
      for (const w of segment.words.filter(isAssignment)) vars.set(w.slice(0, w.indexOf('=')), expand(w.slice(w.indexOf('=') + 1)))
      continue
    }
    if (segment.piped) continue
    const [name, ...args] = words.map(expand)
    if (args.some(a => /\$\{?[A-Za-z_]/.test(a))) return undefined
    const text = describeCommand(name!, args, places)
    if (text === undefined) return undefined
    if (text) parts.push(text)
  }
  return parts.length ? parts.join(' · ') : undefined
}

const OUTPUT_LINES = 120

const lines = (value: unknown): string[] => (typeof value === 'string' && value !== '' ? value.replace(/\n$/, '').split('\n') : [])

export const renderExpandedShell = (el: ElementTable, style: Style, row: ToolRow & { output?: unknown }): RenderElement => {
  const { Box, Text } = el
  const t = style.theme
  const command = (field(row.input, 'command') ?? '').split('\n')
  const out = row.output !== null && typeof row.output === 'object' ? (row.output as Record<string, unknown>) : {}
  const stdout = lines(out.stdout)
  const stderr = lines(out.stderr)
  const shown = [...stdout.map(text => ({ text, color: undefined as string | undefined })), ...stderr.map(text => ({ text, color: t.codeFlag as string | undefined }))]
  const visible = shown.slice(0, OUTPUT_LINES)
  const dot = statusColor(t, row)
  return (
    <Box flexDirection="column">
      <Box flexDirection="row">
        <Box width={2} flexShrink={0}>
          <Text color={dot}>{row.isRunning ? '◌' : '●'}</Text>
        </Box>
        <Box flexDirection="column">
          {command.map((line, i) => (
            <Text key={`c${i}`}>
              {i === 0 ? <Text bold>{`${row.tool}(`}</Text> : null}
              {codeLine(el, style, line, 'bash', `cmd${i}`)}
              {i === command.length - 1 ? <Text bold>)</Text> : null}
            </Text>
          ))}
        </Box>
      </Box>
      {row.isRunning ? null : (
        <Box paddingLeft={2}>
          <Box flexDirection="column" alignSelf="flex-start" borderStyle="round" borderColor={t.codeComment} paddingX={1}>
            {visible.length === 0 ? <Text dimColor>(No output)</Text> : visible.map((l, i) => <Text key={`o${i}`} color={l.color}>{l.text === '' ? ' ' : l.text}</Text>)}
            {shown.length > visible.length ? <Text dimColor>{`\u2026 +${shown.length - visible.length} lines`}</Text> : null}
          </Box>
        </Box>
      )}
    </Box>
  )
}

const GROUPS: [RegExp, string, string][] = [
  [/^(Bash|PowerShell)$/, 'ran', 'command'],
  [/^Read$/, 'read', 'file'],
  [/^(Write|Edit|MultiEdit|NotebookEdit)$/, 'edited', 'file'],
  [/^(Grep|Glob)$/, 'searched', 'pattern'],
  [/^(WebFetch|WebSearch)$/, 'fetched', 'page'],
  [/^(Agent|Task)$/, 'delegated', 'task'],
]

export const groupSummary = (calls: readonly { tool: string }[]): string => {
  const counts = new Map<string, number>()
  for (const call of calls) {
    const [, verb, noun] = GROUPS.find(([re]) => re.test(call.tool)) ?? [, 'used', call.tool.replace(/^mcp__([^_]+)__/, '$1 ')]
    const label = `${verb} ${noun}`
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  const parts = [...counts].map(([label, n]) => {
    const [verb, ...noun] = label.split(' ')
    const name = noun.join(' ')
    return `${verb} ${n} ${n === 1 ? name : name.endsWith('h') ? `${name}es` : `${name}s`}`
  })
  const text = parts.join(', ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const quietToolGroup = (el: ElementTable, style: Style, calls: readonly (ToolRow & { output?: unknown })[], isActive: boolean, columns: number): RenderElement => {
  const t = style.theme
  const failed = calls.filter(c => c.isErrored)
  const running = isActive && calls.some(c => c.isRunning)
  const dot = failed.length ? t.codeFlag : running ? t.accent : t.number
  const labels = calls.map(c => callLabel(c, style)).filter((l, i, all) => l !== all[i - 1])
  const label = labels.join(' · ')
  const reasons = failed.map((c, i) => renderFailure(el, style, c.output, `r${i}`)).filter((r): r is RenderElement => r !== undefined)
  const isShell = (c: ToolRow) => c.tool === 'Bash' || c.tool === 'PowerShell'
  const results = calls.flatMap((c, i) => (c.isErrored || c.output === undefined || !isShell(c) || isReadOnlyCall(c.tool, c.input) ? [] : [<el.Box key={`o${i}`}>{renderShellResult(el, style, c.output)}</el.Box>]))
  const row = toolLayout(el, style, columns, label, dot, running, (
    <el.Text wrap="truncate-end" dimColor={toolDim(style)}>{label}</el.Text>
  ))
  if (!reasons.length && !results.length) return row
  return (
    <el.Box flexDirection="column">
      {row}
      {reasons}
      {results}
    </el.Box>
  )
}

export const renderToolGroup = (el: ElementTable, style: Style, calls: readonly (ToolRow & { output?: unknown })[], isActive: boolean, columns = 100): RenderElement => {
  if (style.toolOutput === 'quiet') return quietToolGroup(el, style, calls, isActive, columns)
  const { Text } = el
  const t = style.theme
  const failed = calls.filter(c => c.isErrored).length
  const running = isActive && calls.some(c => c.isRunning)
  const dot = failed ? t.codeFlag : running ? t.accent : t.number
  const last = calls[calls.length - 1]
  const lastTarget = last ? targetOf(style, last.input, ['command', ...TARGET_FIELDS]).target?.split('\n')[0] : undefined
  const summary = groupSummary(calls)
  const label = `${summary}${failed ? ` · ${failed} failed` : ""}${lastTarget ? ` · last: ${lastTarget}` : ""}`
  return toolLayout(el, style, columns, label, dot, running, (
      <Text wrap="truncate-end" dimColor={toolDim(style)}>
        <Text bold={!toolDim(style)} dimColor={toolDim(style)}>{summary}</Text>
        {failed ? <Text color={t.codeFlag}>{` · ${failed} failed`}</Text> : null}
        {lastTarget ? <Text dimColor>{` · last: ${lastTarget}`}</Text> : null}
      </Text>
  ))
}

export const formatDuration = (ms: number): string => {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${Math.max(s, 0)}s`
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
}

export const renderTurnDuration = ({ Text }: ElementTable, style: Style, word: string, durationMs: number, time?: string): RenderElement => (
  <Text color={style.theme.codeComment}>
    {`✻ ${word} for `}
    <Text color={style.theme.number}>{formatDuration(durationMs)}</Text>
    {time === undefined ? null : ' · '}
    {time === undefined ? null : <Text color={style.theme.number}>{time}</Text>}
  </Text>
)

export const renderUserPrompt = (el: ElementTable, style: Style, text: string, columns: number, time?: string): RenderElement => {
  const { Box, Text } = el
  const t = style.theme
  const color = style.promptStyle === 'chevron' ? t.accent : t.heading
  const lines = text.split('\n').map(line => flowOf(style, [{ kind: 'text', text: line }], columns - 4 - (time === undefined ? 0 : time.length + 1)))
  const hebrew = lines.some(l => l?.base === 'R')
  const rtl = hebrew && !mirrored(style)
  const body = (
    <Box flexDirection="column" {...(rtl ? { alignItems: 'flex-end' as const } : {})}>
      {text.split('\n').map((line, i) => {
        const flow = lines[i]
        return flow ? renderFlow(el, style, flow.lines, `p${i}`, { color, bold: style.promptStyle === 'chevron' }) : <Text key={`p${i}`} color={color} bold={style.promptStyle === 'chevron'}>{line}</Text>
      })}
    </Box>
  )
  const stamp = time === undefined ? null : <Text color={t.codeComment}>{rtl ? ` ${time}` : `${time} `}</Text>
  const content = stamp === null ? body : <Box flexDirection="row">{rtl ? body : stamp}{rtl ? stamp : body}</Box>
  if (style.promptStyle === 'bubble') {
    return <Box borderStyle="round" borderColor={t.accent} paddingX={1} alignSelf={rtl ? 'flex-end' : 'flex-start'} {...(hebrew && mirrored(style) ? { width: '100%' } : {})}>{content}</Box>
  }
  const mark = <Text color={t.accent} bold>{style.promptStyle === 'bar' ? (rtl ? ' ▐' : '▌ ') : rtl ? ' ‹' : '› '}</Text>
  return <Box flexDirection="row" {...(rtl ? { justifyContent: 'flex-end' as const } : {})}>{rtl ? content : mark}{rtl ? mark : content}</Box>
}
