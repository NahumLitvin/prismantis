import type { ElementTable, RenderElement } from 'claude-code'

import { tableHtml, tableText } from './html'
import type { Block, Inline } from './markdown'
import { displayText, inlineText } from './markdown'
import { commentTail, commentVisual, flow, hasRtl, terminalLine } from './rtl'
import type { Style, Theme } from './theme'
import type { PrismToken } from './vendor/prism.js'
import { languages, tokenize } from './vendor/prism.js'

const WIDE = /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]|\p{Extended_Pictographic}/u
const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter() : undefined

export const graphemes = (s: string): string[] => (segmenter ? [...segmenter.segment(s)].map(g => g.segment) : [...s])

export const cells = (s: string): string[] => (/^[ -~]*$/.test(s) ? [...s] : graphemes(s).flatMap(g => (WIDE.test(g) ? [g, ''] : [g])))

export const width = (s: string): number =>
  /^[ -~]*$/.test(s) ? s.length : graphemes(s).reduce((w, g) => (/^\p{M}+$/u.test(g) ? w : w + (WIDE.test(g) ? 2 : 1)), 0)

const wrapRanges = (text: string, w: number): [number, number][] => {
  if (width(text) <= w) return [[0, text.length]]
  const out: [number, number][] = []
  let line: [number, number] | undefined
  let used = 0
  for (const word of text.matchAll(/\S+/g)) {
    let start = word.index
    const end = start + word[0].length
    let size = width(word[0])
    while (size > w) {
      if (line) out.push(line)
      line = undefined
      let cut = start
      let taken = 0
      for (const g of graphemes(text.slice(start, end))) {
        const step = width(g)
        if (cut > start && taken + step > w) break
        cut += g.length
        taken += step
      }
      out.push([start, cut])
      start = cut
      size -= taken
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

const mostLines = (text: string, w: number): number => (text.match(/\S+/g)?.length ?? 0) + Math.ceil(width(text) / w)

const wrapInline = (nodes: Inline[], w: number): Inline[][] => {
  const text = inlineText(nodes)
  return width(text) <= w ? [nodes] : wrapRanges(text, w).map(([a, b]) => sliceInline(nodes, a, b))
}

const flowOf = (style: Style, nodes: Inline[], columns: number) => (style.reorder ? flow(nodes, columns, width, style.shape) : null)

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
        return /^(https:|http:\/\/localhost\b)/i.test(n.href)
          ? n.text === n.href ? <el.Link key={key} href={n.href} /> : <el.Link key={key} href={n.href}><Text color={t.link} underline>{n.text}</Text></el.Link>
          : <Text key={key} color={t.link} underline>{n.text}</Text>
      case 'number':
        return <Text key={key} color={t.number}>{n.text}</Text>
      case 'path':
        return <Text key={key} color={t.path}>{n.text}</Text>
      case 'dim':
        return <Text key={key} dimColor>{n.text}</Text>
      case 'footnote':
        return <Text key={key} color={t.accent}>{n.text}</Text>
    }
  })
}

const renderFlow = (el: ElementTable, style: Style, lines: Inline[][], key: string, props: { italic?: boolean; color?: string; bold?: boolean } = {}) => {
  const { Text } = el
  return lines.map((line, i) => <Text key={`${key}.${i}`} {...props}>{renderInline(el, style, line, `${key}.${i}`)}</Text>)
}

const PRISM_COLORS: Record<string, keyof Theme> = {
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

export const tableArt = (block: Extract<Block, { kind: 'table' }>): string => {
  const cells = [block.header, ...block.rows].map(r => block.header.map((_, c) => displayText(r[c] ?? [])))
  const widths = columnWidths(
    block.header.map((_, c) => Math.max(...cells.map(r => width(r[c]!)))),
    ART_WIDTH - 4,
    3,
    block.header.map((_, c) => Math.max(...cells.map(r => longestWord(r[c]!)))),
  )
  const pad = (text: string, c: number, align: 'left' | 'right' | 'center') => {
    const room = widths[c]! - width(text)
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

const renderTable = (el: ElementTable, style: Style, block: Extract<Block, { kind: 'table' }>, columns: number, key: string, rtl: boolean) => {
  const { Box, Text } = el
  const t = style.theme
  const box = style.tableStyle === 'box'
  const gap = box ? 0 : style.tableStyle === 'grid' ? 3 : 2
  const natural = block.header.map((h, c) =>
    Math.max(width(displayText(h)), ...block.rows.map(r => width(displayText(r[c] ?? [])))),
  )
  const words = block.header.map((h, c) =>
    Math.max(longestWord(displayText(h)), ...block.rows.map(r => longestWord(displayText(r[c] ?? [])))),
  )
  const widths = box ? columnWidths(natural, columns - 4, 3, words) : columnWidths(natural, columns, gap, words)
  const order = natural.map((_, c) => c)
  if (rtl) order.reverse()
  const ruleChar = style.tableStyle === 'grid' ? '━' : '─'
  const justify = (c: number) =>
    block.align[c] === 'right' ? 'flex-end' : block.align[c] === 'center' ? 'center' : 'flex-start'

  const rule = (k: string, heavy: boolean) => (
    <Box key={k} flexDirection="row" columnGap={gap}>
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
  const clipped = (lines: number) => (k: string, text: string) => (
    <Box key={k} minWidth={width(text)}>
      <Box position="absolute" top={0} bottom={0} left={0} minWidth={width(text)} overflow="hidden">
        {bar(`${k}.b`, text, lines)}
      </Box>
    </Box>
  )
  const edge = (k: string, [left, fill, mid, right]: string) =>
    bar(k, left + order.map(c => fill!.repeat(widths[c]! + 2)).join(mid) + right)

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
      {box && border(`${k}.l`, '│ ')}
      {order.map((c, i) => {
        const w = widths[c]!
        const cell = flowOf(style, cells[c] ?? [], Infinity)
        const content = cell ? cell.lines[0]! : (cells[c] ?? [])
        const side = cell?.base === 'R' && block.align[c] !== 'center' ? 'flex-end' : justify(c)
        const cellBox = (
          <Box key={`${k}.${c}`} width={w} flexShrink={0} justifyContent={side}>
            {isHeader
              ? <Text bold color={t.tableHeader}>{inlineText(content)}</Text>
              : <Text>{renderInline(el, style, content, `${k}.${c}`)}</Text>}
          </Box>
        )
        return box && i > 0 ? [border(`${k}.${c}s`, ' │ '), cellBox] : cellBox
      })}
      {box && border(`${k}.r`, ' │')}
    </Box>
  )

  const wrappedRow = (cells: Inline[][], k: string, isHeader: boolean) => {
    if (!isHeader && cells.some(hasLink)) return [row(cells, k, isHeader, clipped(Math.max(1, ...widths.map((w, c) => mostLines(displayText(cells[c] ?? []), w)))))]
    const wrapped = widths.map((w, c) => {
      const content = cells[c] ?? []
      if (natural[c]! <= w) return [content]
      return wrapInline(isHeader ? [{ kind: 'text', text: inlineText(content) }] : content, w)
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
    return <Box key={key} flexDirection="column" {...(rtl ? { alignSelf: 'flex-end' as const } : {})}>{lines}</Box>
  }

  const body: RenderElement[] = [row(block.header, `${key}.h`, true), rule(`${key}.hr`, true)]
  block.rows.forEach((r, i) => {
    body.push(row(r, `${key}.r${i}`, false))
    if (style.tableStyle !== 'minimal' && i < block.rows.length - 1) body.push(rule(`${key}.r${i}r`, false))
  })
  return <Box key={key} flexDirection="column" {...(rtl ? { alignSelf: 'flex-end' as const } : {})}>{body}</Box>
}

const renderHeading = (el: ElementTable, style: Style, block: Extract<Block, { kind: 'heading' }>, key: string) => {
  const rtl = flowOf(style, block.inline, Infinity)
  if (!rtl) return drawHeading(el, style, block, block.inline, key)
  const heading = drawHeading(el, style, block, rtl.lines[0]!, key)
  return rtl.base === 'R' ? <el.Box key={key} alignSelf="flex-end">{heading}</el.Box> : heading
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

const renderParagraph = (el: ElementTable, style: Style, block: Extract<Block, { kind: 'paragraph' }>, columns: number, key: string) => {
  const { Box, Text } = el
  const rtl = flowOf(style, block.inline, columns)
  if (rtl?.base === 'R') return <Box key={key} flexDirection="column" alignItems="flex-end">{renderFlow(el, style, rtl.lines, key)}</Box>
  return <Text key={key} bold={style.narration}>{renderInline(el, style, rtl ? rtl.lines[0]! : block.inline, key)}</Text>
}

const renderQuote = (el: ElementTable, style: Style, block: Extract<Block, { kind: 'quote' }>, columns: number, key: string) => {
  const { Box, Text } = el
  const t = style.theme
  const rtl = flowOf(style, block.inline, columns - 2)
  if (rtl?.base === 'R') {
    return (
      <Box key={key} flexDirection="row" justifyContent="flex-end">
        <Box flexDirection="column" alignItems="flex-end">{renderFlow(el, style, rtl.lines, key, { italic: true, color: t.quote })}</Box>
        <Text color={t.accent}> │</Text>
      </Box>
    )
  }
  return (
    <Box key={key} flexDirection="row">
      <Text color={t.accent}>│ </Text>
      <Text italic color={t.quote}>{renderInline(el, style, rtl ? rtl.lines[0]! : block.inline, key)}</Text>
    </Box>
  )
}

const renderAlert = (el: ElementTable, style: Style, block: Extract<Block, { kind: 'alert' }>, columns: number, key: string) => {
  const { Box, Text } = el
  const color = ALERT_COLOR[block.level]
  const title = <Text bold color={color}>{block.level[0]!.toUpperCase() + block.level.slice(1)}</Text>
  const rtl = flowOf(style, block.inline, columns - 4)
  if (rtl?.base === 'R') {
    return (
      <Box key={key} flexDirection="column" alignSelf="flex-end" alignItems="flex-end" borderStyle="round" borderColor={color} paddingX={1}>
        {title}
        {renderFlow(el, style, rtl.lines, key)}
      </Box>
    )
  }
  const inline = rtl ? rtl.lines[0]! : block.inline
  return (
    <Box key={key} flexDirection="column" alignSelf="flex-start" borderStyle="round" borderColor={color} paddingX={1}>
      {title}
      {inline.length ? <Text>{renderInline(el, style, inline, key)}</Text> : null}
    </Box>
  )
}

const TASK_GLYPHS = { checks: ['[ ]', '[✓]'], ticks: ['○', '✓'], box: ['□', '✓'], progress: ['○', '✓'] } as const

const renderList = (el: ElementTable, style: Style, block: Extract<Block, { kind: 'list' }>, columns: number, key: string) => {
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
        const rtl = flowOf(style, item.inline, columns - item.depth * 2 - glyph.length - 1)
        if (rtl?.base === 'R') {
          return (
            <Box key={k} flexDirection="row" justifyContent="flex-end" paddingRight={item.depth * 2}>
              <Box flexDirection="column" alignItems="flex-end">{renderFlow(el, style, rtl.lines, k)}</Box>
              <Text color={glyphColor}>{` ${glyph}`}</Text>
            </Box>
          )
        }
        return (
          <Box key={k} flexDirection="row" paddingLeft={item.depth * 2}>
            <Text color={glyphColor}>{`${glyph} `}</Text>
            <Text dimColor={item.task === true} strikethrough={item.task === true && strike}>{renderInline(el, style, rtl ? rtl.lines[0]! : item.inline, k)}</Text>
          </Box>
        )
      })}
    </Box>
  )
}

export type CopyButton = (text: string | (() => string), key: string, label?: string, html?: () => string) => RenderElement | null
export type Drawn = Map<number, { element: RenderElement; art?: string }>
type Fold = (id: string, hidden: number, key: string) => { folded: boolean; element: RenderElement } | null

const NUMBER_AT = 10
const NUMBER_MAX = 400
const FOLD_AT = 30
const FOLD_SHOW = 20

const codeId = (lines: string[]): string => {
  let h = 5381
  for (const line of lines) for (let i = 0; i < line.length; i++) h = (h * 33 + line.charCodeAt(i)) | 0
  return `${lines.length}:${(h >>> 0).toString(36)}`
}

const copySource = (block: Block): string | undefined =>
  block.kind === 'code' ? block.lines.join('\n') : block.kind === 'table' || block.kind === 'list' ? block.raw : block.kind === 'quote' || block.kind === 'alert' ? block.raw.split('\n').map(line => line.replace(/^\s*>\s?/, '')).join('\n') : undefined

export const renderBlocks = (el: ElementTable, style: Style, blocks: Block[], columns: number, drawn: Drawn = new Map(), copy?: CopyButton, fold?: Fold): RenderElement[] => {
  const { Box, Text } = el
  const t = style.theme
  const rtlTables = blocks.map(block => style.reorder && block.kind === 'table' && isRtlTable(style, block))
  const rendered = blocks.map((block, b) => {
    const key = `b${b}`
    switch (block.kind) {
      case 'heading':
        return renderHeading(el, style, block, key)
      case 'paragraph':
        return renderParagraph(el, style, block, columns, key)
      case 'quote':
        return renderQuote(el, style, block, columns, key)
      case 'alert':
        return renderAlert(el, style, block, columns, key)
      case 'rule':
        return <Text key={key} color={t.rule} dimColor={!t.rule}>{'─'.repeat(Math.max(8, Math.min(columns, 80)))}</Text>
      case 'code': {
        const done = drawn.get(b)?.element
        if (done) return done
        const lines = block.lines
        const toggle = lines.length > FOLD_AT ? fold?.(codeId(lines), lines.length - FOLD_SHOW, `fold${b}`) : null
        const shown = toggle?.folded ? FOLD_SHOW : lines.length
        const rows = (isShellLang(block.lang) ? null : highlightBlock(el, style, lines, block.lang, key))?.slice(0, shown) ?? lines.slice(0, shown).map((line, i) => codeLine(el, style, line, block.lang, `${key}.${i}`))
        const gutter = String(lines.length).length
        return (
          <Box key={key} flexDirection="column" alignSelf="flex-start">
            <Box flexDirection="row" justifyContent="space-between" columnGap={4}>
              <Text color={t.codeComment}>{`── ${block.lang || 'code'}`}</Text>
              {copy?.(lines.join('\n'), `copy${b}`) ?? null}
            </Box>
            <Box flexDirection="column" paddingLeft={2}>
              {lines.length < NUMBER_AT || lines.length > NUMBER_MAX ? rows : rows.map((row, i) => row.type === 'Text' ? <Box key={`n${i}`} flexDirection="row"><Text color={t.codeComment} dimColor>{`${String(i + 1).padStart(gutter)}  `}</Text>{row}</Box> : row)}
              {toggle?.element ?? null}
            </Box>
          </Box>
        )
      }
      case 'list':
        return renderList(el, style, block, columns, key)
      case 'table':
        return renderTable(el, style, block, columns, key, rtlTables[b]!)
      case 'notes':
        return (
          <Box key={key} flexDirection="column">
            <Text dimColor>{'─'.repeat(Math.min(columns, 12))}</Text>
            {block.notes.map((note, i) => <Text key={`${key}.${i}`} dimColor>{note.mark} {renderInline(el, style, note.inline, `${key}.${i}`)}</Text>)}
          </Box>
        )
    }
  })
  const copied = rendered.map((element, b) => {
    const block = blocks[b]
    const text = block ? copySource(block) : undefined
    const isPlainCode = block?.kind === 'code' && !drawn.has(b)
    const art = drawn.get(b)?.art ?? (block?.kind === 'table' ? () => tableArt(block) : undefined)
    const first = text === undefined || isPlainCode ? null : copy?.(text, `copy${b}`, block?.kind === 'table' ? '⧉ md' : art === undefined ? undefined : '⧉ source')
    const second = first && art !== undefined ? copy?.(art, `art${b}`, '⧉ art') : null
    const html = first && block?.kind === 'table' ? copy?.(() => tableText(block), `html${b}`, '⧉ html', () => tableHtml(block)) : null
    const button = second ? (
      <el.Box key={`copies${b}`} flexDirection="row" columnGap={1}>
        {first}
        {second}
        {html}
      </el.Box>
    ) : first
    if (!button) return element
    const { Box } = el
    const rtl = style.reorder && block !== undefined && hasRtl(block.raw)
    return block?.kind === 'quote' || block?.kind === 'alert' ? (
      <Box key={`c${b}`} flexDirection="row" columnGap={2} {...(rtl ? { justifyContent: 'flex-end' as const } : {})}>
        {element}
        {button}
      </Box>
    ) : (
      <Box key={`c${b}`} flexDirection="column" {...(rtl && (block?.kind === 'list' || rtlTables[b]) ? {} : { alignSelf: 'flex-start' as const })}>
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

export const shortPath = (style: Places, path: string): string => {
  for (const [root, prefix] of [[style.cwd, ''], [style.home, '~/']] as const) {
    const base = root.replace(/\/+$/, '')
    if (base !== '' && path.startsWith(`${base}/`)) return prefix + path.slice(base.length + 1)
  }
  return path
}

const compactPath = (path: string): string => {
  const parts = path.split('/')
  if (!path.startsWith('/') || parts.length <= 6) return path
  return [...parts.slice(0, 3), '…', ...parts.slice(-2)].join('/')
}

export const shortTarget = (places: Places, path: string): string => (path === places.cwd ? '.' : path === places.home ? '~' : compactPath(shortPath(places, path)))


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

const NOISE_LINES = /^((Error:\s*)?Exit code \d+|at\s+(\S+\s+\()?\S+:\d+(:\d+)?\)?|Node\.js v\d.*|exit status \d+|\.\.\. \d+ more)$/i

const REFUSAL = /^(Error:\s*)?(The user doesn't want to proceed|Permission (for|to) .*\bdenied|The server-side auto mode classifier|\S+ hook error:)/i

export const refusalReason = (output: unknown): string | undefined => {
  if (typeof output !== 'string' || /^(Error:\s*)?Exit code \d+/m.test(output) || !REFUSAL.test(output)) return undefined
  return output.replace(/\s+/g, ' ').trim()
}

export const CALLS_REMEMBERED = 2000

export const rememberCall = (calls: Set<string>, id: string, limit = CALLS_REMEMBERED): void => {
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
  const { Box, Text } = el
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
  if (name in READ_SUBCOMMANDS) return READ_SUBCOMMANDS[name]!.test(args) && !(name === 'git' && rest.some(a => /^--output\b/.test(a)))
  if (!READ_COMMANDS.has(name)) return false
  if (name === 'sed') {
    const [script, ...files] = rest.filter(a => a !== '-n')
    return script !== undefined && /^\d+(,\d+)?p$/.test(script) && files.every(f => !f.startsWith('-'))
  }
  if (name === 'find') return !rest.some(a => /^-(delete|exec|execdir|ok|okdir|fprint|fprint0|fprintf|fls)$/.test(a))
  if (name === 'awk') return !rest.some(a => /^(-f|--file)/.test(a)) && !/system\s*\(|getline|[|>]/.test(args)
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

export const programsOf = (command: string, limit = 3): string[] => {
  const names: string[] = []
  for (const part of parseShell(command).segments) {
    const name = commandWords(part.words)[0]?.split('/').pop()
    if (name && !TRIVIAL_PROGRAMS.has(name) && !names.includes(name)) names.push(name)
  }
  return names.length > limit ? [...names.slice(0, limit), '…'] : names
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
  const { Box, Text } = el
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

export const renderTurnDuration = ({ Text }: ElementTable, style: Style, word: string, durationMs: number): RenderElement => (
  <Text color={style.theme.codeComment}>
    {`✻ ${word} for `}
    <Text color={style.theme.number}>{formatDuration(durationMs)}</Text>
  </Text>
)

export const renderUserPrompt = (el: ElementTable, style: Style, text: string, columns: number): RenderElement => {
  const { Box, Text } = el
  const t = style.theme
  const color = style.promptStyle === 'chevron' ? t.accent : t.heading
  const lines = text.split('\n').map(line => flowOf(style, [{ kind: 'text', text: line }], columns - 4))
  const rtl = lines.some(l => l?.base === 'R')
  const body = (
    <Box flexDirection="column" {...(rtl ? { alignItems: 'flex-end' as const } : {})}>
      {text.split('\n').map((line, i) => {
        const flow = lines[i]
        return flow ? renderFlow(el, style, flow.lines, `p${i}`, { color, bold: style.promptStyle === 'chevron' }) : <Text key={`p${i}`} color={color} bold={style.promptStyle === 'chevron'}>{line}</Text>
      })}
    </Box>
  )
  if (style.promptStyle === 'bubble') {
    return <Box borderStyle="round" borderColor={t.accent} paddingX={1} alignSelf={rtl ? 'flex-end' : 'flex-start'}>{body}</Box>
  }
  const mark = <Text color={t.accent} bold>{style.promptStyle === 'bar' ? (rtl ? ' ▐' : '▌ ') : rtl ? ' ‹' : '› '}</Text>
  return <Box flexDirection="row" {...(rtl ? { justifyContent: 'flex-end' as const } : {})}>{rtl ? body : mark}{rtl ? mark : body}</Box>
}
