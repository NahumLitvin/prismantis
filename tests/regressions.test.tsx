import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { helpText, showcaseText } from '../hooks/help'
import { inlineText, parse } from '../hooks/markdown'
import { tableHtml, tableText } from '../hooks/html'
import { inlineMarks, mermaidText, shortenEdgeLabels } from '../hooks/mermaid'
import { isReadOnlyCall, tableArt, takesEditorLinks, takesHttpLinks, width } from '../hooks/render'
import { PRESETS } from '../hooks/presets'
import { claudeAt, linksHttp } from './claude-version'
import { clipboardEnv, recordCopies } from './clipboard-env'

const hl = { numbers: true, paths: true }

const tableOf = (source: string) => {
  const [table] = parse(source, hl)
  if (table?.kind !== 'table') throw new Error('not a table')
  return table
}

const mount = (text: string, columns = 120) => ({
  plugin: 'prismantis',
  component: 'AssistantMessage' as const,
  props: { text, isFirstOfReply: true },
  viewport: { columns, rows: 40 },
  surface: 'terminal' as const,
})

const drawn = (node: unknown): string =>
  typeof node === 'string' ? node : ((node as { children?: unknown[] }).children ?? []).map(drawn).join('')

const stubClipboard = (on: On) => {
  clipboardEnv(on, 'other')
  return recordCopies(on)
}

test('a long run of backticks parses in linear time', async () => {
  const started = Date.now()
  parse('`'.repeat(32000), hl)
  expect(Date.now() - started < 100).toBe(true)
})

test('a four-backtick fence keeps triple-backtick examples inside one code block', async () => {
  const blocks = parse('````md\n```bash\nls\n```\n````', hl)
  expect(blocks.map(b => b.kind)).toEqual(['code'])
  const [code] = blocks
  if (code?.kind !== 'code') throw new Error('not code')
  expect(code.lines).toEqual(['```bash', 'ls', '```'])
})

for (const [input, expected] of [
  ['## Using C#', [{ kind: 'text', text: 'Using C#' }]],
  ['## Title ##', [{ kind: 'text', text: 'Title' }]],
  ['[Foo](https://e.org/wiki/Foo_(bar)) ok', [{ kind: 'link', text: 'Foo', href: 'https://e.org/wiki/Foo_(bar)' }, { kind: 'text', text: ' ok' }]],
  ['see https://e.org/wiki/Foo_(bar) ok', [{ kind: 'text', text: 'see ' }, { kind: 'link', text: 'https://e.org/wiki/Foo_(bar)', href: 'https://e.org/wiki/Foo_(bar)' }, { kind: 'text', text: ' ok' }]],
  ['see (https://e.org/x) ok', [{ kind: 'text', text: 'see (' }, { kind: 'link', text: 'https://e.org/x', href: 'https://e.org/x' }, { kind: 'text', text: ') ok' }]],
  ['[`render.tsx`](hooks/render.tsx)', [{ kind: 'link', text: 'render.tsx', href: 'hooks/render.tsx' }]],
  ['call f(*args, **kwargs) now', [{ kind: 'text', text: 'call f(*args, **kwargs) now' }]],
  ['**a *b* c**', [{ kind: 'strong', children: [{ kind: 'text', text: 'a ' }, { kind: 'emphasis', children: [{ kind: 'text', text: 'b' }] }, { kind: 'text', text: ' c' }] }]],
  ['f(_a, _)', [{ kind: 'text', text: 'f(_a, _)' }]],
  ['f(*args, **kwargs) and **b**', [{ kind: 'text', text: 'f(*args, **kwargs) and ' }, { kind: 'strong', children: [{ kind: 'text', text: 'b' }] }]],
] as const) test(`inline markdown: ${input}`, async () => {
  const [block] = parse(input, hl)
  expect(block && 'inline' in block ? block.inline : block).toEqual(expected)
})

test('a one-dash delimiter row makes a table', async () => {
  const table = tableOf('| a | b |\n|-|-|\n| x | y |')
  expect(table.header.length).toBe(2)
  expect(table.rows.length).toBe(1)
})

test('an escaped trailing pipe stays in the cell', async () => {
  const [table] = parse('| a | b |\n|---|---|\n| x | y\\|', hl)
  if (table?.kind !== 'table') throw new Error('not a table')
  expect(table.rows[0]?.[1]?.map(n => ('text' in n ? n.text : '')).join('')).toBe('y|')
})

for (const surface of ['terminal', 'desktop'] as const) test(`tables copy their exact Markdown on ${surface}`, async ($, on) => {
  const copied = stubClipboard(on)
  const source = '| a | b |\n|:--|--:|\n| `x\\|y` | **2** |'
  const ui = await $.ui.mount({ ...mount(source), surface })
  await ui.press({ key: 'copy0' })
  expect(copied).toEqual([source])
  await ui.unmount()
})

test('tab-separated copying unescapes pipes and drops inline formatting', async () => {
  expect(tableText(tableOf('| a | b |\n|:--|--:|\n| `x\\|y` | **2** |'))).toBe('a\tb\nx|y\t2')
})

test('HTML table copying escapes content and preserves safe inline formatting', async () => {
  const source = '| <Title> | Link |\n|:--:|--|\n| **bold *italic*** ~~old~~ `x<y` & "quoted" | [go](https://example.com/?a=1&b="2") |\n| <script>alert | [bad](javascript:alert) |\n| short |'
  const html = tableHtml(tableOf(source))
  expect(html).toContain('<th style="text-align: center">&lt;Title&gt;</th>')
  expect(html).toContain('<em>italic</em>')
  expect(html).toContain('<del>old</del>')
  expect(html).toContain('<code style="white-space: pre-wrap">x&lt;y</code> &amp; &quot;quoted&quot;')
  expect(html).toContain('<a href="https://example.com/?a=1&amp;b=&quot;2&quot;">go</a>')
  expect(html).toContain('&lt;script&gt;alert')
  expect(html).not.toContain('javascript:')
  expect(html).toContain('<td style="text-align: left"></td>')
})

test('tab-separated copying quotes embedded separators and literal quotes', async () => {
  expect(tableText(tableOf('| Name | Value |\n|--|--|\n| `a\tb` | "quoted" |'))).toBe('Name\tValue\n"a\tb"\t"""quoted"""')
})

test('tab-separated copying keeps link targets', async () => {
  expect(tableText(tableOf('| Docs | Site |\n|--|--|\n| [guide](https://x.y/z) | https://a.b |'))).toBe('Docs\tSite\nguide (https://x.y/z)\thttps://a.b')
})

test('HTML copying preserves repeated spaces inside code', async () => {
  expect(tableHtml(tableOf('| Code |\n|--|\n| `a  b` |'))).toContain('<code style="white-space: pre-wrap">a  b</code>')
})

test('copying a list returns its exact markdown', async ($, on) => {
  const copied = stubClipboard(on)
  const source = '- **bold** item\n  - `code` child'
  const ui = await $.ui.mount(mount(source))
  const [button] = await ui.findAll({ type: 'Button' })
  await ui.press({ key: button!.key! })
  expect(copied).toEqual([source])
  await ui.unmount()
})

test('table columns never exceed the terminal width', async $ => {
  const ui = await $.ui.mount(mount('| a | bbbbbbbbbbbbbbbb | c | d | e |\n|---|---|---|---|---|\n| 1 | 2 | 3 | 4 | 5 |', 24))
  const cells = (await ui.findAll({ type: 'Box' })).filter(b => typeof b.props.width === 'number' && b.props.flexShrink === 0).slice(1)
  const firstRow = cells.slice(0, 5).map(b => b.props.width as number)
  expect(firstRow.reduce((a, b) => a + b, 0) + 2 * 4 <= 20).toBe(true)
  await ui.unmount()
})

test('a boxed row that wraps keeps its borders on every line', async $ => {
  const file = 'handoffs/handoff-scheduled-event-pushes-21082026.md'
  const evidence = 'Its blocking question is unanswered; BACKLOG row 16 cites it'
  const ui = await $.ui.mount(mount(`| File | Evidence |\n|---|---|\n| ${file} | ${evidence} |`, 40))
  const lines = await ui.findAll({ type: 'Text', text: /^│ $/ })
  const cells = (await ui.findAll({ type: 'Box' })).filter(b => typeof b.props.width === 'number' && b.props.flexShrink === 0).slice(-2 * (lines.length - 1))
  expect(lines.length > 3).toBe(true)
  expect(cells.every(b => drawn(b).length <= (b.props.width as number))).toBe(true)
  expect(cells.filter((_, i) => i % 2 === 0).map(drawn).join('')).toBe(file)
  expect(cells.filter((_, i) => i % 2 === 1).map(drawn).join(' ')).toBe('Its blocking question is unanswered; BACKLOG row 16 cites it')
  expect((await ui.find({ type: 'Text', text: /^16$/ }))?.props.color).toBe(PRESETS['catppuccin-mocha'].number)
  await ui.unmount()
})

for (const [kind, cell] of [
  ['named link', 'see [docs](https://github.com/org/repo/blob/main/docs/spec.md) for more'],
  ['bare URL', 'https://example.com/a/rather/long/path/that/cannot/fit/on/one/line'],
] as const) {
  test(`a boxed row with a ${kind} keeps the link whole and clips its borders to the row`, async $ => {
    const ui = await $.ui.mount(mount(`| n | link |\n|---|---|\n| 1 | ${cell} |`, 40))
    const links = await ui.findAll({ type: 'Link' })
    const clips = (await ui.findAll({ type: 'Box' })).filter(b => b.props.position === 'absolute' && b.props.overflow === 'hidden')
    expect(links.length).toBe(1)
    expect(clips.length).toBe(3)
    expect(clips.every(b => drawn(b).split('\n').length > 2)).toBe(true)
    await ui.unmount()
  })
}

test('a link column is sized for the URL it shows', async $ => {
  const url = 'https://example.com/a/rather/long/path'
  const ui = await $.ui.mount(mount(`| link | n |\n|---|---|\n| [go](${url}) | 1 |`))
  const cells = (await ui.findAll({ type: 'Box' })).filter(b => typeof b.props.width === 'number' && b.props.flexShrink === 0).slice(1)
  expect((cells[0]?.props.width as number) >= `go (${url})`.length).toBe(true)
  await ui.unmount()
})

test('highlight colors follow the theme in use: red', { options: { codeFlagColor: '#ff0000' } }, async $ => {
  const ui = await $.ui.mount(mount('```ts\nconst same = 1\n```'))
  expect((await ui.find({ type: 'Text', text: /^const$/ }))?.props.color).toBe('#ff0000')
  await ui.unmount()
})

test('highlight colors follow the theme in use: green', { options: { codeFlagColor: '#00ff00' } }, async $ => {
  const ui = await $.ui.mount(mount('```ts\nconst same = 1\n```'))
  expect((await ui.find({ type: 'Text', text: /^const$/ }))?.props.color).toBe('#00ff00')
  await ui.unmount()
})

test('presets stay intact', async () => {
  expect(PRESETS.dracula.tableHeader).toBe('#f1fa8c')
})

test('code blocks draw no frame, so a mouse selection copies only the code', async $ => {
  const ui = await $.ui.mount(mount('```bash\nls -la\n```'))
  expect((await ui.findAll({ type: 'Box' })).some(b => b.props.borderStyle !== undefined)).toBe(false)
  await ui.unmount()
})

test('stadium, cylinder and arrow-joined boxes get colors, containers stay plain', async $ => {
  const t = PRESETS['catppuccin-mocha']
  const source = '```mermaid\ngraph LR\n  subgraph S [Group]\n    A[Edge]\n  end\n  U([Users]) --> A\n  A --> DB[(db)]\n  B[Backup] --> A\n```'
  const ui = await $.ui.mount(mount(source, 160))
  const color = async (re: RegExp) => (await ui.find({ type: 'Text', text: re }))?.props.color
  for (const label of [/^Users$/, /^Edge$/, /^db$/, /^Backup$/]) {
    const c = await color(label)
    expect(c !== undefined && c !== t.diagramText).toBe(true)
  }
  const group = (await ui.findAll({ type: 'Text' })).find(s => s.text.trim() === 'Group' && s.props.color !== undefined)
  expect(group?.props.color).toBe(t.diagramText)
  await ui.unmount()
})

test('an edge label after a space still draws both nodes', async $ => {
  const ui = await $.ui.mount(mount('```mermaid\ngraph LR\n  A --> |deploy| B\n```', 160))
  expect(await ui.find({ type: 'Text', text: /^B$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /deploy/ })).toBeDefined()
  await ui.unmount()
})

test('copying a quote returns its text without the > markers', async ($, on) => {
  const copied = stubClipboard(on)
  const ui = await $.ui.mount(mount('> built a mod\n> with **colors**'))
  const [button] = await ui.findAll({ type: 'Button' })
  await ui.press({ key: button!.key! })
  expect(copied).toEqual(['built a mod\nwith **colors**'])
  await ui.unmount()
})

test('edge labels with spaces keep the line out of their gaps', async $ => {
  const ui = await $.ui.mount(mount('```mermaid\ngraph TD\n  A -->|push = build| B\n```', 160))
  const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text)
  expect(texts.some(t => t.includes('push = build'))).toBe(true)
  expect(texts.some(t => t.includes('push =│build'))).toBe(false)
  await ui.unmount()
})

test('a chart that opens with a %% comment still draws', async $ => {
  const ui = await $.ui.mount(mount('```mermaid\n%% weekly deploys\nxychart-beta\n  x-axis [a, b]\n  bar [1, 2]\n```', 160))
  expect((await ui.findAll({ type: 'Text' })).some(t => /^█+$/.test(t.text))).toBe(true)
  await ui.unmount()
})

test('a left-to-right flowchart too wide for the terminal draws top-down instead of as source', async () => {
  const chain = ['flowchart LR', ...['A', 'B', 'C', 'D', 'E'].map((n, i, a) => (i ? `  ${a[i - 1]} --> ${n}["step ${n} with a long label"]` : '')).filter(Boolean)].join('\n')
  const art = mermaidText(chain, false, 100)
  expect(art).not.toBeNull()
  expect(art!.split('\n').every(l => width(l) <= 98)).toBe(true)
  expect(art).toContain('▼')
})

test('a GitHub alert draws its title and body, and copies without the > markers', async ($, on) => {
  const copied = stubClipboard(on)
  const ui = await $.ui.mount(mount('> [!WARNING]\n> disk is almost full'))
  expect(await ui.find({ type: 'Text', text: /^Warning$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^disk is almost full$/ })).toBeDefined()
  const [button] = await ui.findAll({ type: 'Button' })
  await ui.press({ key: button!.key! })
  expect(copied).toEqual(['[!WARNING]\ndisk is almost full'])
  await ui.unmount()
})

test('a bar chart shows each value, drops label quotes and highlights the tallest bar', async $ => {
  const ui = await $.ui.mount(mount('```mermaid\nxychart-beta\n  x-axis ["Q1", "Q2", "Q3"]\n  bar [5, 12, 8]\n```', 160))
  const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text)
  expect(texts.some(t => /\b12\b/.test(t) && !t.includes('┤'))).toBe(true)
  expect(texts.some(t => t.includes('"'))).toBe(false)
  await ui.unmount()
})

test('H1 gets a box and H2 a heavy rule by default', async $ => {
  const ui = await $.ui.mount(mount('# Title\n\n## Section'))
  expect(await ui.find({ type: 'Text', text: /^━+$/ })).toBeDefined()
  expect(await ui.find({ type: 'Box', text: /Title/ })).toBeDefined()
  await ui.unmount()
})

test('chart labels never run together', async $ => {
  const ui = await $.ui.mount(mount('```mermaid\nxychart-beta\n  x-axis [Dog, Human, Pigeon, Shrimp]\n  bar [2, 3, 4, 16]\n```', 120))
  const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text)
  expect(texts.some(t => /Human\s+Pigeon\s+Shrimp/.test(t))).toBe(true)
  await ui.unmount()
})

const best = (fn: () => void, runs = 5) => {
  let min = Infinity
  for (let i = 0; i < runs; i++) {
    const t = performance.now()
    fn()
    min = Math.min(min, performance.now() - t)
  }
  return min
}

const rows = (n: number) => `| id | name | pods |\n|---|---|---|\n${Array.from({ length: n }, (_, i) => `| ${i} | svc-${i} | ${i * 3} |`).join('\n')}`
const prose = (n: number) => Array.from({ length: n }, (_, i) => `Paragraph ${i} with **bold**, \`code\`, 99.9% and ~/src/app.ts here.\n\n- item ${i}\n- item ${i + 1}`).join('\n\n')

test('parse cost grows linearly with reply size', async () => {
  for (const make of [rows, prose]) {
    parse(make(200), hl)
    const small = Math.max(best(() => parse(make(200), hl)), 0.05)
    const large = best(() => parse(make(2000), hl))
    expect(large < small * 40).toBe(true)
  }
})

test('parse stays inside a generous budget on a large reply', async () => {
  expect(best(() => parse(prose(2000), hl)) < 250).toBe(true)
  expect(best(() => parse(rows(2000), hl)) < 250).toBe(true)
})

test('a 300-row table draws inside its budget', async $ => {
  const started = performance.now()
  const ui = await $.ui.mount(mount(rows(300), 160))
  expect(performance.now() - started < 1500).toBe(true)
  await ui.unmount()
})

test('a 400-line highlighted code block stays under the engine node limit and its time budget', async $ => {
  const code = `\`\`\`ts\n${Array.from({ length: 400 }, (_, i) => `const v${i} = await fetch("/api/${i}", { retries: ${i % 5} })`).join('\n')}\n\`\`\``
  const started = performance.now()
  const ui = await $.ui.mount(mount(code, 160))
  expect(performance.now() - started < 1500).toBe(true)
  await ui.unmount()
})

test('a half-streamed reply with an open fence and a cut table still draws', async $ => {
  for (const text of ['intro\n\n```mermaid\nflowchart LR\n  A --> B', '| a | b |\n|---|', '```ts\nconst x =', '> [!NOTE', '**bold and `cod']) {
    const ui = await $.ui.mount(mount(text))
    expect(await ui.findAll({ type: 'Text' })).toBeDefined()
    await ui.unmount()
  }
})

test('the help screen shows every element prismantis draws', async () => {
  const blocks = parse(showcaseText(Object.keys(PRESETS)), hl)
  expect(showcaseText(Object.keys(PRESETS))).toContain('promptStyle')
  expect(showcaseText(Object.keys(PRESETS))).toContain('`clock`')
  expect(showcaseText([])).toContain('⧉ html')
  expect(showcaseText([])).toContain('<i>Reply</i>')
  expect(showcaseText([])).toContain('CopyQ')
  expect(showcaseText([])).toContain('plain text')
  expect(blocks.some(b => b.kind === 'table' && b.align.includes('right') && b.align.includes('center'))).toBe(true)
  const kinds = new Set(blocks.map(b => b.kind))
  for (const kind of ['heading', 'paragraph', 'list', 'code', 'quote', 'alert', 'rule', 'table']) expect(kinds.has(kind as never)).toBe(true)
  expect(new Set(blocks.flatMap(b => (b.kind === 'heading' ? [b.level] : []))).size >= 4).toBe(true)
  expect(new Set(blocks.flatMap(b => (b.kind === 'alert' ? [b.level] : []))).size).toBe(5)
  const langs = blocks.flatMap(b => (b.kind === 'code' ? [b.lang] : []))
  for (const lang of ['bash', 'json', 'mermaid', 'math']) expect(langs.includes(lang)).toBe(true)
  const links = blocks.flatMap(b => (b.kind === 'paragraph' ? b.inline.filter(n => n.kind === 'link') : []))
  expect(links.some(l => l.kind === 'link' && l.text !== l.href) && links.some(l => l.kind === 'link' && l.text === l.href)).toBe(true)
  expect(links.some(l => l.kind === 'link' && l.href.endsWith('Foo_(bar)')) && links.some(l => l.kind === 'link' && l.text === 'render.tsx')).toBe(true)
  expect(showcaseText([])).toContain('f(*args, **kwargs)')
  expect(blocks.some(b => b.kind === 'list' && b.items.some(i => i.task === true) && b.items.some(i => i.task === false) && b.items.some(i => i.depth > 0 && i.task !== undefined))).toBe(true)
  expect(kinds.has('notes')).toBe(true)
  expect(blocks.some(b => b.kind === 'table' && b.header.some(h => h.some(n => n.kind === 'footnote')))).toBe(true)
  expect(showcaseText([]).includes("toolStyle")).toBe(true)
  expect(showcaseText([]).includes("toolOutput")).toBe(true)
  expect(showcaseText([])).toContain('+M more lines')
  expect(showcaseText([])).toContain('```figure')
  expect(blocks.some(b => b.kind === 'code' && b.lines.length > 30)).toBe(true)
  expect(showcaseText([])).toContain('diff card headed `+N −M`')
})

test('mermaid boxes stay closed around wide labels', async () => {
  const column = (line: string, marks: RegExp, nth: number) => {
    const chars = [...line]
    const at = chars.flatMap((ch, i) => (marks.test(ch) ? [i] : []))[nth]
    return at === undefined ? -1 : width(chars.slice(0, at).join(''))
  }
  for (const source of ['graph LR\n  A[日本語テスト] --> B[終了]', 'flowchart TD\n  A[한글 라벨 상자] --> B{ko 섞인 판단}', 'sequenceDiagram\n  사용자->>서버: 요청']) {
    const art = mermaidText(source, false, 100)
    expect(art).not.toBeNull()
    expect(art!).not.toContain('\uFDD0')
    const lines = art!.split('\n')
    const top = lines.findIndex(l => l.includes('┐'))
    expect(column(lines[top + 1]!, /[│├┤]/, 1)).toBe(column(lines[top]!, /┐/, 0))
  }
})

test('flowchart edges written without spaces draw the same as with spaces', async () => {
  for (const [compact, spaced] of [
    ['flowchart LR\n  A-->B-->C', 'flowchart LR\n  A --> B --> C'],
    ['flowchart LR\n  my-node-->other-node', 'flowchart LR\n  my-node --> other-node'],
    ['graph TD\n  A-.->B==>C---D', 'graph TD\n  A -.-> B ==> C --- D'],
    ['flowchart LR\n  A-->|yes|B', 'flowchart LR\n  A -->|yes| B'],
    ['flowchart LR\n  A[Start]-->B{ok?}', 'flowchart LR\n  A[Start] --> B{ok?}'],
  ]) {
    const art = mermaidText(spaced!, false, 100)
    expect(art).not.toBeNull()
    expect(mermaidText(compact!, false, 100)).toBe(art)
  }
})

test('a mounted diagram with wide labels draws its box borders on the same column', async $ => {
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...mount('```mermaid\ngraph LR\n  A[한글 라벨] --> B[終了]\n```', 160), surface })
    const label = drawn(await ui.find({ type: 'Text', text: /한글 라벨/ }))
    const top = drawn(await ui.find({ type: 'Text', text: /┐/ }))
    expect(label).not.toContain('\uFDD0')
    expect(width(label.trimEnd())).toBe(width(top.trimEnd()))
    await ui.unmount()
  }
})

test('every diagram on the help screen draws as art', async () => {
  const diagrams = parse(showcaseText(Object.keys(PRESETS)), hl).flatMap(b => (b.kind === 'code' && b.lang === 'mermaid' ? [b.lines.join('\n')] : []))
  expect(diagrams.length).toBe(4)
  for (const source of diagrams) expect(mermaidText(source, false, 100)).not.toBeNull()
})

test('the help screen fits one screen: few blocks, two alerts, a table, a list and two drawn charts', async () => {
  const blocks = parse(helpText(Object.keys(PRESETS)), hl)
  expect(blocks.length <= 12).toBe(true)
  expect(blocks.filter(b => b.kind === 'alert').length).toBe(2)
  for (const kind of ['heading', 'table', 'list']) expect(blocks.some(b => b.kind === kind)).toBe(true)
  expect(blocks.some(b => b.kind === 'list' && b.items.some(i => i.task !== undefined))).toBe(true)
  expect(blocks.some(b => b.kind === 'paragraph' && b.inline.some(n => n.kind === 'link'))).toBe(true)
  expect(helpText(Object.keys(PRESETS))).toContain('/prismantis copy')
  expect(helpText([])).toContain('`random`')
  expect(showcaseText([])).toContain('/prismantis theme random')
  expect(helpText([])).toContain('HTML (macOS/Linux)')
  const diagrams = blocks.flatMap(b => (b.kind === 'code' && b.lang === 'mermaid' ? [b.lines.join('\n')] : []))
  expect(diagrams.length).toBe(2)
  for (const source of diagrams) expect(mermaidText(source, false, 100)).not.toBeNull()
})

test('the help screen draws as command output', async $ => {
  const ui = await $.ui.mount({
    plugin: 'prismantis',
    component: 'CommandOutput' as const,
    props: { command: 'prismantis', args: 'demo', text: showcaseText(Object.keys(PRESETS)), isErrored: false },
    viewport: { columns: 100, rows: 40 },
    surface: 'terminal' as const,
  })
  expect(await ui.find({ type: 'Box', text: /prismantis/ })).toBeDefined()
  await ui.unmount()
})

test('drawn replies add no emoji-capable glyphs', async $ => {
  const text = ['sequenceDiagram\n  A->>B: go\n  B-->>A: ok', 'classDiagram\n  direction LR\n  A <|-- B\n  C --> D', 'graph RL\n  A-->B'].map(d => '```mermaid\n' + d + '\n```').join('\n\n')
  const figure = ['```figure', 'a {accent:──▶} b {accent:◀──} c', '```'].join('\n')
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...mount(`${text}\n\n${figure}`), surface })
    expect((await ui.find({ type: 'Text', text: /\p{Extended_Pictographic}/u }))?.text).toBeUndefined()
    await ui.unmount()
  }
})

test('a table art button copies boxed text ready for Slack', async ($, on) => {
  const copied = stubClipboard(on)
  const ui = await $.ui.mount(mount('| Queue | Sent |\n|---|--:|\n| tasks-east | 24 |\n| west | 0 |'))
  const art = (await ui.findAll({ type: 'Button' }))[1]
  await ui.press({ key: art!.key! })
  expect(copied).toEqual([[
    '```',
    '┌────────────┬──────┐',
    '│   Queue    │ Sent │',
    '├────────────┼──────┤',
    '│ tasks-east │   24 │',
    '├────────────┼──────┤',
    '│ west       │    0 │',
    '└────────────┴──────┘',
    '```',
  ].join('\n')])
  await ui.unmount()
})

test('wide table art wraps long cells to stay 100 columns wide', async () => {
  const long = 'Wrong. With no default, databag_config raises No config key is found, so the render fails and nothing is applied, which is the fail-closed behaviour we want.'
  const [table] = parse(`| Codebot says | Verdict |\n|---|---|\n| A missing x_seen_by renders an empty value | ${long} |`, hl)
  if (table?.kind !== 'table') throw new Error('not a table')
  const lines = tableArt(table).split('\n')
  const body = lines.slice(1, -1)
  expect(body.every(l => [...l].length === [...body[0]!].length && [...l].length <= 100)).toBe(true)
  expect(body.length > 6).toBe(true)
  expect(body.filter(l => l.startsWith('│')).slice(1).map(l => l.split('│')[2]!.trim()).join(' ')).toBe(long)
})

test('short table columns keep their width next to a very wide one', async () => {
  const links = Array.from({ length: 4 }, (_, i) => `https://example.com/releases/${100 + i}/notes`).join(' , ')
  const [table] = parse(`| # | Pri | Task | Link |\n|---|---|---|---|\n| 10 | 🔵 P2 | Approved, not merged | ${links} |`, hl)
  if (table?.kind !== 'table') throw new Error('not a table')
  const cells = tableArt(table).split('\n').slice(1, -1).filter(l => l.startsWith('│')).map(l => l.split('│').slice(1, 4).map(c => c.trim()))
  expect(cells[1]).toEqual(['10', '🔵 P2', 'Approved, not merged'])
})

test('table art keeps a long path whole when the other wide column can give way', async () => {
  const path = 'src/services/reporting/exports/monthly_pdf_writer.py'
  const change = 'The monthly export now writes one summary file per region and uploads them after the nightly run is done'
  const [table] = parse(`| # | File | Change |\n|---|---|---|\n| 1 | ${path} | ${change} |`, hl)
  if (table?.kind !== 'table') throw new Error('not a table')
  expect(tableArt(table).split('\n').some(l => l.includes(path))).toBe(true)
})

test('copy reply copies the whole reply as written, Hebrew in reading order', { options: { rtl: 'warp' } }, async ($, on) => {
  const copied = stubClipboard(on)
  const text = 'שלום חברים, זו הדגמה של prismantis.\n\n| a | b |\n|---|---|\n| 1 | 2 |'
  const ui = await $.ui.mount(mount(text))
  const reply = (await ui.findAll({ type: 'Button' })).find(b => b.props.label === '⧉ copy reply')
  await ui.press({ key: reply!.key! })
  expect(copied).toEqual([text])
  await ui.unmount()
})

test('a one-paragraph English block gets no copy reply button', async $ => {
  const ui = await $.ui.mount(mount('Checking the tests next.'))
  expect((await ui.findAll({ type: 'Button' })).some(b => b.props.label === '⧉ copy reply')).toBe(false)
  await ui.unmount()
})

test('only http and https links become terminal hyperlinks', async ($, on) => {
  claudeAt(on, '2.1.289')
  if (!(await linksHttp($.ui.mount(mount('[x](http://example.com)'))))) return
  const ui = await $.ui.mount(mount('[docs](https://example.com) [dev](http://localhost:3000) [plain](http://example.com) [mail](mailto:a@example.com) [run](javascript:alert(1)) [disk](file:///etc/passwd)'))
  const links = (await ui.findAll({ type: 'Link' })).map(l => l.props.href)
  expect(links).toEqual(['https://example.com', 'http://localhost:3000', 'http://example.com'])
  expect(await ui.find({ type: 'Text', text: /^run \(javascript:alert\(1\)\)$/ })).toBeDefined()
  await ui.unmount()
})

test('a named link drops its own underline so the terminal hyperlink style shows', async $ => {
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...mount('[prismantis on GitHub](https://github.com/NahumLitvin/prismantis)'), surface })
    const [link] = await ui.findAll({ type: 'Link' })
    const label = await ui.find({ type: 'Text', text: /^prismantis on GitHub$/ })
    expect(link?.props.href).toBe('https://github.com/NahumLitvin/prismantis')
    expect(label?.props.color).toBe(PRESETS['catppuccin-mocha'].link)
    expect(label?.props.underline).toBeFalsy()
    await ui.unmount()
  }
})

test('plain http links and bare URLs are hyperlinks drawn in the link color on the terminal', async ($, on) => {
  claudeAt(on, '2.1.289')
  if (!(await linksHttp($.ui.mount(mount('[x](http://example.com)'))))) return
  const ui = await $.ui.mount(mount('[plain http](http://example.com) http://example.org/raw https://example.com/raw'))
  expect((await ui.findAll({ type: 'Link' })).map(l => l.props.href)).toEqual(['http://example.com', 'http://example.org/raw', 'https://example.com/raw'])
  for (const text of [/^plain http$/, /^http:\/\/example\.org\/raw$/, /^https:\/\/example\.com\/raw$/]) {
    const drawnText = await ui.find({ type: 'Text', text })
    expect(drawnText?.props.color).toBe(PRESETS['catppuccin-mocha'].link)
    expect(drawnText?.props.underline).toBeFalsy()
  }
  await ui.unmount()
})

for (const [where, surface, base] of [
  ['on desktop, which links only https', 'desktop', '2.1.289'],
  ['on Claude Code 2.1.288, which refuses http hyperlinks', 'terminal', '2.1.288'],
  ['when the Claude Code version is unknown', 'terminal', undefined],
] as const) {
  test(`plain http links draw as plain text ${where}`, async ($, on) => {
    if (base) claudeAt(on, base)
    const ui = await $.ui.mount({ ...mount('[plain http](http://example.com) http://example.org/raw https://example.com/raw'), surface })
    expect((await ui.findAll({ type: 'Link' })).map(l => l.props.href)).toEqual(['https://example.com/raw'])
    for (const text of [/^plain http \(http:\/\/example\.com\)$/, /^http:\/\/example\.org\/raw$/]) {
      const drawnText = await ui.find({ type: 'Text', text })
      expect(drawnText).toBeDefined()
      expect(drawnText?.props.color).toBeUndefined()
    }
    expect((await ui.find({ type: 'Text', text: /^https:\/\/example\.com\/raw$/ }))?.props.color).toBe(PRESETS['catppuccin-mocha'].link)
    await ui.unmount()
  })
}

test('http hyperlinks start at Claude Code 2.1.289', () => {
  for (const base of ['2.1.289', '2.1.289-dev', '2.1.296', '2.1.1000', '2.2.0', '3.0.0']) expect(takesHttpLinks(base)).toBe(true)
  for (const base of ['2.1.288', '2.1.287', '2.0.999', '1.9.400', 'dev', '', undefined]) expect(takesHttpLinks(base)).toBe(false)
})

const EDITOR_LINKS = '[note](vscode://file/C:/src/notes.md:12) [insiders](vscode-insiders://file/home/me/app.ts) [clone](vscode://vscode.git/clone?url=https://example.com/x.git)'

test('VS Code file links become terminal hyperlinks from Claude Code 2.1.294', async ($, on) => {
  claudeAt(on, '2.1.294')
  if (!(await linksHttp($.ui.mount(mount('[x](vscode://file/C:/x.md)'))))) return
  const ui = await $.ui.mount(mount(EDITOR_LINKS))
  expect((await ui.findAll({ type: 'Link' })).map(l => l.props.href)).toEqual(['vscode://file/C:/src/notes.md:12', 'vscode-insiders://file/home/me/app.ts'])
  expect(await ui.find({ type: 'Text', text: /^clone \(vscode:\/\/vscode\.git\/clone\?url=https:\/\/example\.com\/x\.git\)$/ })).toBeDefined()
  await ui.unmount()
})

for (const [where, surface, base] of [
  ['on desktop, which links only https', 'desktop', '2.1.294'],
  ['on Claude Code 2.1.293', 'terminal', '2.1.293'],
  ['when the Claude Code version is unknown', 'terminal', undefined],
] as const) {
  test(`VS Code file links draw as plain text ${where}`, async ($, on) => {
    if (base) claudeAt(on, base)
    const ui = await $.ui.mount({ ...mount(EDITOR_LINKS), surface })
    expect(await ui.findAll({ type: 'Link' })).toHaveLength(0)
    expect(await ui.find({ type: 'Text', text: /^note \(vscode:\/\/file\/C:\/src\/notes\.md:12\)$/ })).toBeDefined()
    await ui.unmount()
  })
}

test('VS Code file hyperlinks start at Claude Code 2.1.294', () => {
  for (const base of ['2.1.294', '2.1.294-dev', '2.1.296', '2.1.1000', '2.2.0', '3.0.0']) expect(takesEditorLinks(base)).toBe(true)
  for (const base of ['2.1.293', '2.1.289', '2.1.287', '2.0.999', 'dev', '', undefined]) expect(takesEditorLinks(base)).toBe(false)
})

test('links that cannot be clicked draw as plain text with their target, as Claude Code draws them', async $ => {
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...mount('[mail](mailto:someone@example.com) [someone@example.com](mailto:someone@example.com) [disk](file:///etc/passwd)'), surface })
    expect(await ui.findAll({ type: 'Link' })).toHaveLength(0)
    for (const text of ['mail (someone@example.com)', 'someone@example.com', 'disk (file:///etc/passwd)']) {
      const drawnText = await ui.find({ type: 'Text', text: new RegExp(`^${text.replace(/[.()]/g, '\\$&')}$`) })
      expect(drawnText).toBeDefined()
      expect(drawnText?.props.color).toBeUndefined()
      expect(drawnText?.props.underline).toBeFalsy()
    }
    await ui.unmount()
  }
})

test('copying a table keeps its links as written', async ($, on) => {
  const copied = stubClipboard(on)
  const source = '| who | site |\n|---|---|\n| [mail](mailto:someone@example.com) | [docs](https://example.com) |'
  const ui = await $.ui.mount(mount(source))
  const button = (await ui.findAll({ type: 'Button' })).find(b => b.props.label === '⧉ md')
  await ui.press({ key: button!.key! })
  expect(copied).toEqual([source])
  await ui.unmount()
})

for (const tableStyle of ['box', 'rules'] as const) {
  test(`a ${tableStyle} table cell link that cannot be clicked draws as plain text and its column fits it`, { options: { tableStyle } }, async $ => {
    const ui = await $.ui.mount(mount('| who | n |\n|---|---|\n| [mail](mailto:someone@example.com) | 1 |'))
    expect(await ui.findAll({ type: 'Link' })).toHaveLength(0)
    const cell = await ui.find({ type: 'Text', text: /^mail \(someone@example\.com\)$/ })
    expect(cell).toBeDefined()
    expect(cell?.props.color).toBeUndefined()
    expect(cell?.props.underline).toBeFalsy()
    const widths = (await ui.findAll({ type: 'Box' })).filter(b => typeof b.props.width === 'number' && b.props.flexShrink === 0).map(b => b.props.width as number)
    expect(Math.max(...widths) >= 'mail (someone@example.com)'.length).toBe(true)
    await ui.unmount()
  })
}

test('double underscores inside a word stay literal, as in mcp__serena__activate_project', async () => {
  const [block] = parse('Call mcp__serena__activate_project, not __this__.', hl)

  expect(block?.kind === 'paragraph' ? inlineText(block.inline) : null).toBe('Call mcp__serena__activate_project, not this.')
})

test('a flowchart whose long edge label makes it too wide draws with the label shortened, not as source', async ($, on) => {
  const source = [
    'flowchart TD',
    '  A["Tank sensor<br/>posts a reading every 10s"] --> B["POST to ingest :8080"]',
    '  B --> C["writeReading(tankId, tempC, ph)"]',
    '  C --> D{"pool.connect()<br/>free connection within 2000ms?"}',
    '  D -- yes --> E["INSERT INTO readings"]',
    '  D -- no --> X1["BLOCKED: acquire timeout<br/>pool 4/4 busy, reading fails"]',
    '  E --> F["client.release() back to pool"]',
    '  E -. "slow INSERT holds the connection<br/>(no query timeout in code)" .-> X2["BLOCKED: connection held,<br/>starves the pool"]',
    '  F --> G[("readings table<br/>tanks-db.internal")]',
    '  G --> H["Dashboard polls readings"]',
  ].join('\n')
  expect(mermaidText(source, false, 108)!.split('\n').some(l => width(l) > 106)).toBe(true)
  expect(shortenEdgeLabels(source, 24)).toContain('-. "slow INSERT holds the c…" .->')
  expect(shortenEdgeLabels('graph LR\n  A -->|a very long edge label here| B', 12)).toContain('|a very long…|')
  const ui = await $.ui.mount(mount('```mermaid\n' + source + '\n```', 112))
  expect(await ui.find({ type: 'Text', text: /Tank sensor/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /flowchart TD/ })).toBeUndefined()
  await ui.unmount()
})

test('inline HTML tags in mermaid labels draw as italic and bold, not as tags', async ($, on) => {
  const art = mermaidText('flowchart TD\n  A["metrics-server<br/><i>one slow scrape</i>"] --> B["<b>kubelet</b>"]', false, 80)!
  expect(art).toContain('one slow scrape')
  expect(art).toContain('kubelet')
  expect(art).not.toMatch(/<\/?[ib]>/)
  expect(inlineMarks('A["x<br/><i>one slow</i>"] --> B["<b>kubelet</b>"]')).toEqual([[[...'one slow'], { italic: true }], [[...'kubelet'], { bold: true }]])
  const ui = await $.ui.mount(mount('```mermaid\nflowchart TD\n  A["metrics-server<br/><i>one slow scrape</i>"] --> B["<b>kubelet</b>"]\n```', 80))
  expect((await ui.find({ type: 'Text', text: /^scrape$/ }))?.props.italic).toBe(true)
  expect((await ui.find({ type: 'Text', text: /^kubelet$/ }))?.props.bold).toBe(true)
  await ui.unmount()
})

test('inline $…$ math draws without its dollar signs, prices and shell variables stay text', async () => {
  const shown = (s: string) => {
    const [block] = parse(s, hl)
    return block?.kind === 'paragraph' ? block.inline.map(n => (n.kind === 'math' ? `[${n.text}]` : 'children' in n ? inlineText(n.children) : n.text)).join('') : ''
  }
  expect(shown('runs at ($\\rho = 4.3 / 5$) with $L = \\lambda \\cdot W$')).toBe('runs at ([ρ = 4.3 / 5]) with [L = λ · W]')
  expect(shown('costs $5 and $10 today')).toBe('costs $5 and $10 today')
  expect(shown('echo $HOME and $PATH')).toBe('echo $HOME and $PATH')
})

test('chart y-axis ticks sit an even number of rows apart', async () => {
  const charts = [
    'xychart-beta\n  x-axis ["11:00", "12:00", "13:00", "14:00", "15:00", "16:00"]\n  y-axis "ms" 0 --> 2500\n  bar [45, 47, 46, 2029, 2032, 2007]',
    'xychart-beta\n  x-axis [text, head, num, code, diag]\n  y-axis "options" 0 --> 8\n  bar [7, 3, 2, 6, 2]',
  ]
  for (const chart of charts) for (const columns of [40, 80, 100, 160, 260]) {
    const rows = mermaidText(chart, false, columns)!.split('\n').flatMap((l, i) => (/^\s*[\d.]+\s*[┤┼]/.test(l) ? [i] : []))
    expect(new Set(rows.slice(1).map((r, i) => r - rows[i]!)).size).toBe(1)
  }
})

const barColumns = (axis: string) => [...axis.matchAll(/┬|▀+/g)].map(m => m.index + Math.floor(m[0].length / 2))
const block = (ch = '') => /[█▀▄]/.test(ch)

for (const [values, axisRange] of [[[400, 1200, 1900, 2500, 800], '0 --> 2500'], [[12, 10, 8], '0 --> 14']] as const) {
  test(`a bar stands on the axis line, reaches the gridlines at or below its value and stops on its own, with its value centered on top: ${values.join(', ')}`, () => {
    for (const title of ['\n  title "Sizes"', ''])
    for (const columns of [60, 120, 200]) {
      const chart = `xychart-beta${title}\n  x-axis [${values.map((_, i) => `b${i + 1}`).join(', ')}]\n  y-axis ${axisRange}\n  bar [${values.join(', ')}]`
      const lines = mermaidText(chart, false, columns)!.split('\n')
      const axis = lines.find(l => /^\s*0┼─/.test(l)) ?? ''
      const bars = barColumns(axis)
      expect(bars.length).toBe(values.length)
      bars.forEach(c => expect(axis[c]).toBe('▀'))
      for (const line of lines) {
        const tick = line.match(/^\s*(\d+)┤/)?.[1]
        if (tick === undefined) continue
        bars.forEach((c, i) => {
          expect(block(line[c])).toBe(Number(tick) <= values[i]!)
          if (Number(tick) === values[i]) expect(line[c]).toBe('▄')
        })
      }
      bars.forEach((c, i) => {
        const label = String(values[i])
        const top = lines.findIndex(l => block(l[c]))
        const bar = lines[top]!
        let [left, right] = [c, c]
        while (block(bar[left - 1])) left--
        while (block(bar[right + 1])) right++
        const from = lines[top - 1]!.indexOf(label, left - label.length)
        expect(from).toBeGreaterThan(-1)
        expect([0, 1]).toContain(from - left - (right - (from + label.length - 1)))
      })
    }
  })
}

for (const values of [[-5, 3, 8, -2, 0], [-6, 6, -2, 2], [-5, -3, -8]]) {
  test(`bars with negatives grow both ways from a solid 0 line, stop on their own gridline and keep their value at their end: ${values.join(', ')}`, () => {
    const chart = `xychart-beta\n  x-axis [${values.map((_, i) => `b${i + 1}`).join(', ')}]\n  bar [${values.join(', ')}]`
    for (const columns of [60, 120, 200]) {
      const lines = mermaidText(chart, false, columns)!.split('\n')
      const ticks = lines.flatMap((l, r) => {
        const tick = l.match(/^\s*(-?[\d.]+)[┤┼]/)?.[1]
        return tick === undefined ? [] : [{ r, tick: Number(tick) }]
      })
      const axis = ticks.at(-1)!.r
      const bars = barColumns(lines[axis]!)
      expect(bars.length).toBe(values.length)
      const [hi, lo] = [ticks[0]!.tick, ticks.at(-1)!.tick]
      const base = Math.min(Math.max(0, lo), hi)
      const baseRow = ticks.find(t => t.tick === base)!.r
      expect(lines[baseRow]).toMatch(/^\s*-?[\d.]+┼[─▀▄]+$/)
      bars.forEach((c, i) => expect(lines[baseRow]![c]).toBe(values[i] === base ? '─' : values[i]! > base ? '▀' : '▄'))
      for (const { r, tick } of ticks.filter(t => t.r !== axis && t.r !== baseRow)) {
        bars.forEach((c, i) => {
          expect(block(lines[r]![c])).toBe((base < tick && tick <= values[i]!) || (values[i]! <= tick && tick < base))
          if (tick === values[i]) expect(lines[r]![c]).toBe(tick > base ? '▄' : '▀')
        })
      }
      bars.forEach((c, i) => {
        const label = String(values[i])
        const filled = lines.flatMap((l, r) => (block(l[c]) ? [r] : []))
        const row = values[i]! < 0 ? (filled.at(-1) ?? baseRow) + 1 : (filled[0] ?? baseRow) - 1
        if (row < axis) expect(lines[row]!.slice(c - label.length, c + label.length)).toContain(label)
      })
    }
  })
}

test('a line at 0 runs along the axis line', () => {
  for (const columns of [60, 120, 200]) {
    const lines = mermaidText('xychart-beta\n  x-axis [a, b, c]\n  y-axis 0 --> 100\n  line [0, 60, 100]', false, columns)!.split('\n')
    const axis = lines.findIndex(l => /^\s*0┼/.test(l))
    expect(lines[axis]).toMatch(/^\s*0┼─+╯/)
    expect(lines[axis - 1]).not.toMatch(/─/)
  }
})

test('a line over a bar chart passes behind the bars and leaves their heights alone', () => {
  const bars = 'xychart-beta\n  x-axis [a, b, c, d]\n  y-axis 0 --> 100\n  bar [20, 50, 80, 40]'
  for (const ascii of [false, true])
  for (const columns of [60, 120, 200]) {
    const cells = (chart: string) => {
      const lines = mermaidText(chart, ascii, columns)!.split('\n')
      const top = lines.findIndex(l => /^\s*\d+[┤+]/.test(l))
      const axis = lines.findIndex(l => /^\s*0[┼+]/.test(l))
      return lines.slice(top, axis + 1).flatMap((l, r) => [...l].flatMap((ch, c) => (/[█▀▄#]/.test(ch) ? [`${axis - top - r}:${c}`] : [])))
    }
    for (const line of ['line [20, 50, 80, 40]', 'line [0, 50, 100, 25]']) expect(cells(`${bars}\n  ${line}`)).toEqual(cells(bars))
  }
})

test('footnotes number by first reference, collect at the end, and undefined ones stay literal', () => {
  const blocks = parse('Two[^b] and one[^a] and ghost[^x].\n\n[^a]: first\n    more\n[^b]: second\n\n```\n[^c]: not a note\n```', hl)
  const [para, code, notes] = blocks
  expect(blocks).toHaveLength(3)
  expect(code).toMatchObject({ kind: 'code' })
  expect(para?.kind === 'paragraph' ? inlineText(para.inline) : '').toBe('Two¹ and one² and ghost[^x].')
  expect(notes?.kind === 'notes' ? notes.notes.map(n => `${n.mark} ${inlineText(n.inline)}`) : []).toEqual(['¹ second', '² first more'])
  expect(parse('plain [^1] text', hl)[0]).toMatchObject({ kind: 'paragraph' })
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`footnote marks and the notes block draw on ${surface}`, async ($) => {
    const ui = await $.ui.mount({ ...mount('Fast[^a].\n\n[^a]: Measured twice.'), surface })
    expect(await ui.find({ type: 'Text', text: /^¹$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /¹ Measured twice\./ })).toBeDefined()
    await ui.unmount()
  })

  for (const tableStyle of ['box', 'rules'] as const) {
    test(`footnote marks in table cells draw in the paragraph mark color on ${surface}, ${tableStyle}`, { options: { tableStyle } }, async ($) => {
      const accent = PRESETS['catppuccin-mocha'].accent
      const ui = await $.ui.mount({ ...mount('Fast[^a].\n\n| Metric[^b] | **Value**[^c] | A long header that has to wrap[^a] |\n|---|---|---|\n| p99[^a] | 40ms[^b] | x |\n\n[^a]: A.\n[^b]: B.\n[^c]: C.', 40), surface })
      const marks = await ui.findAll({ type: 'Text', text: /^[¹²³]$/ })
      expect(new Set(marks.map(m => m.text))).toEqual(new Set(['¹', '²', '³']))
      expect(marks.filter(m => m.props.color !== accent).map(m => m.text)).toEqual([])
      expect(marks.length).toBe(6)
      expect((await ui.find({ type: 'Text', text: /^Metric²$/ }))?.props).toMatchObject({ bold: true, color: PRESETS['catppuccin-mocha'].tableHeader })
      await ui.unmount()
    })
  }
}

const chartRows = async (ui: { findAll: (q: { type: 'Text' }) => Promise<{ text: string }[]> }) => {
  const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text)
  const axis = texts.find(t => /^\s*0┼─/.test(t)) ?? ''
  const gutter = axis.indexOf('┼')
  const rows = texts.filter(t => t.length > gutter + 1 && /[┤│┼]/.test(t[gutter] ?? '') && /^[\s\d.]*$/.test(t.slice(0, gutter)))
  return { rows, columns: barColumns(axis) }
}

for (const surface of ['terminal', 'desktop'] as const) {
  for (const kind of ['bar', 'line'] as const) {
    for (const values of [[3, 7, 5], [2, 3, 4, 16], [400, 1200, 1900, 2500, 800]]) {
      test(`${kind} chart heights follow their values on ${surface}: ${values.join(', ')}`, async $ => {
        const labels = values.map((_, i) => `L${i + 1}`).join(', ')
        const ui = await $.ui.mount({ ...mount(`\`\`\`mermaid\nxychart-beta\n  x-axis [${labels}]\n  y-axis 0 --> ${Math.max(...values) + 2}\n  ${kind} [${values.join(', ')}]\n\`\`\``), surface })
        const { rows, columns } = await chartRows(ui)
        expect(columns.length).toBe(values.length)
        if (kind === 'bar') {
          for (const row of rows) {
            const tick = row.match(/^\s*(\d+)┤/)?.[1]
            if (tick !== undefined) columns.forEach((c, i) => expect(block(row[c])).toBe(Number(tick) <= values[i]!))
          }
        } else {
          const got = columns.map(c => rows.length - 1 - rows.findIndex(r => /[╭╮╯╰│─]/.test(r[c] ?? '')))
          const tallest = Math.max(...got)
          values.forEach((v, i) => expect(Math.abs(got[i]! - (tallest * v) / Math.max(...values)) <= 1).toBe(true))
        }
        await ui.unmount()
      })
    }
  }
}

test('a diagram too wide for the terminal shows its source under a note with its width', async $ => {
  const workers = Array.from({ length: 16 }, (_, i) => `W${i + 1}[Worker ${i + 1}]`).join(' & ')
  const ui = await $.ui.mount(mount('```mermaid\nflowchart TD\n  Q[Queue] --> ' + workers + '\n```'))
  expect(await ui.find({ type: 'Text', text: /^diagram is \d+ cols, terminal is \d+$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^── mermaid$/ })).toBeDefined()
  await ui.unmount()
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`the fallback note is drawn in the comment color like the label on ${surface}`, async $ => {
    const workers = Array.from({ length: 16 }, (_, i) => `W${i + 1}[Worker ${i + 1}]`).join(' & ')
    const ui = await $.ui.mount({ ...mount('```mermaid\nflowchart TD\n  Q[Queue] --> ' + workers + '\n```'), surface })
    const note = await ui.find({ type: 'Text', text: /^diagram is/ })
    const label = await ui.find({ type: 'Text', text: /^── mermaid$/ })
    expect(note?.props.color).toBe(PRESETS['catppuccin-mocha'].codeComment)
    expect(note?.props).toEqual(label?.props)
    await ui.unmount()
  })
}

test('a diagram the renderer cannot draw shows its source under a failure note', async $ => {
  const ui = await $.ui.mount(mount('```mermaid\nflowchart TD\n' + '  A --> B\n'.repeat(900) + '```'))
  expect(await ui.find({ type: 'Text', text: /^diagram failed to render$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^── mermaid$/ })).toBeDefined()
  await ui.unmount()
})

test('a diagram type the renderer has no drawing for says so instead of failing', async $ => {
  for (const kind of ['pie', 'gantt', 'mindmap', 'timeline', 'journey', 'gitGraph']) {
    const ui = await $.ui.mount(mount('```mermaid\n' + kind + '\n  title T\n```'))
    expect(await ui.find({ type: 'Text', text: `${kind} diagrams draw as source for now` })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^diagram failed to render$/ })).toBeUndefined()
    await ui.unmount()
  }
})

test('a half-streamed diagram shows no note until its fence closes', async $ => {
  const open = await $.ui.mount(mount('```mermaid\npie\n  "a" : 3'))
  expect(await open.find({ type: 'Text', text: /diagram|draw as source/ })).toBeUndefined()
  await open.unmount()
  const closed = await $.ui.mount(mount('```mermaid\npie\n  "a" : 3\n```'))
  expect(await closed.find({ type: 'Text', text: /^pie diagrams draw as source for now$/ })).toBeDefined()
  await closed.unmount()
})

test('a diagram that fits draws without a note', async $ => {
  const ui = await $.ui.mount(mount('```mermaid\nflowchart LR\n  A --> B\n```'))
  expect(await ui.find({ type: 'Text', text: /^diagram (is|failed)/ })).toBeUndefined()
  await ui.unmount()
})

const STEPS = '1. Setup:\n   ```bash\n   npm i\n   ```\n   Then build.\n2. Next'

const listOf = (source: string) => {
  const [list] = parse(source, hl)
  if (list?.kind !== 'list') throw new Error('not a list')
  return list
}

test('a fence under a list item is a code block inside that item, and text after it stays in the item', async () => {
  const list = listOf(STEPS)
  expect(list.items.map(i => [i.marker, inlineText(i.inline)])).toEqual([['1.', 'Setup:'], ['2.', 'Next']])
  const [code, after] = list.items[0]?.blocks ?? []
  expect(code?.kind === 'code' && [code.lang, code.lines, code.isOpen]).toEqual(['bash', ['npm i'], undefined])
  expect(after?.kind === 'paragraph' && inlineText(after.inline)).toBe('Then build.')
  expect(list.raw).toBe(STEPS)
})

test('a blank line inside a fence under a list item keeps the list and the rest of the reply intact', async () => {
  const blocks = parse('1. Setup:\n   ```bash\n   a\n\n   b\n   ```\n2. Next\n\n## Phase 3\ntext', hl)
  expect(blocks.map(b => b.kind)).toEqual(['list', 'heading', 'paragraph'])
  const list = blocks[0]
  if (list?.kind !== 'list') throw new Error('not a list')
  expect(list.items.map(i => i.marker)).toEqual(['1.', '2.'])
  const code = list.items[0]?.blocks?.[0]
  expect(code?.kind === 'code' && code.lines).toEqual(['a', '', 'b'])
})

test('an unindented fence after a list ends the list', async () => {
  expect(parse('1. a\n```bash\nx\n```', hl).map(b => b.kind)).toEqual(['list', 'code'])
})

test('a fence under an item ends where the item does when it never closes', async () => {
  const blocks = parse('1. Setup:\n   ```bash\n   npm i\n\n## Next\ntext', hl)
  expect(blocks.map(b => b.kind)).toEqual(['list', 'heading', 'paragraph'])
  const code = blocks[0]?.kind === 'list' ? blocks[0].items[0]?.blocks?.[0] : undefined
  expect(code?.kind === 'code' && [code.lines, code.isOpen]).toEqual([['npm i'], undefined])
})

test('a half-streamed fence under a list item is an open code block in the item', async () => {
  const code = listOf('1. Setup:\n   ```bash\n   npm i').items[0]?.blocks?.[0]
  expect(code?.kind === 'code' && [code.lines, code.isOpen]).toEqual([['npm i'], true])
})

test('footnotes after a fence inside a list item are numbered', async () => {
  const [list] = parse('1. a\n   ```\n   x\n   ```\n   see[^n]\n\n[^n]: note', hl)
  const after = list?.kind === 'list' ? list.items[0]?.blocks?.[1] : undefined
  expect(after?.kind === 'paragraph' && after.inline.some(n => n.kind === 'footnote' && n.text === '¹')).toBe(true)
})

test('a code block under a list item draws indented inside the list with its own copy button', async ($, on) => {
  const copied = recordCopies(on)
  for (const surface of ['terminal', 'desktop'] as const) {
    copied.length = 0
    const ui = await $.ui.mount({ ...mount(STEPS), surface })
    const header = await ui.find({ type: 'Text', text: /^── bash$/ })
    expect(header).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^2\. $/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^Then build\.$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /```/ })).toBeUndefined()
    const indented = (await ui.findAll({ type: 'Box' })).find(b => b.props.paddingLeft === 3 && b.text?.includes('npm i'))
    expect(indented?.text).toContain('Then build.')
    await ui.press({ key: 'b0.0.copy0' })
    expect(copied).toEqual(['npm i'])
    await ui.unmount()
  }
})

test('terminal control sequences in a reply never reach the drawn text', async $ => {
  const text = [
    'copy this \x1b]52;c;cm0gLXJmIH4=\x07 now',
    'a [link](https://example.com) and \x1b]8;;https://evil.test\x1b\\hidden\x1b]8;;\x1b\\',
    '| col \x1b[31mred\x1b[0m |\n|---|\n| \x1b[2J cell |',
    '```sh\necho \x1b]52;c;eA==\x07 done\n```',
  ].join('\n\n')
  const ui = await $.ui.mount(mount(text))
  const all = (await ui.findAll({ type: 'Text' })).map(drawn).join('\n')
  await ui.unmount()
  expect(all).toContain('copy this')
  expect(all).toContain('hidden')
  expect(all).not.toMatch(/evil\.test|\]52;|\]8;;|\[2J|\[31m/)
  expect(/[\x00-\x08\x0b-\x1f\x7f]/.test(all)).toBe(false)
})

test('a localhost lookalike host stays link text on desktop, which links plain http only for localhost', async $ => {
  const ui = await $.ui.mount({ ...mount('[a](http://localhost@evil.example/) [b](http://localhost.evil.example/) [c](http://localhost:3000/x) [d](http://localhost)'), surface: 'desktop' })
  expect((await ui.findAll({ type: 'Link' })).map(l => l.props.href)).toEqual(['http://localhost:3000/x', 'http://localhost'])
  await ui.unmount()
})

test('awk that edits a file in place is not read-only', async () => {
  expect(isReadOnlyCall('Bash', { command: "awk -i inplace '{sub(/a/,\"b\")}1' f.txt" })).toBe(false)
  expect(isReadOnlyCall('Bash', { command: "awk --include=inplace '{print}' f.txt" })).toBe(false)
  expect(isReadOnlyCall('Bash', { command: "awk '{print $1}' f.txt" })).toBe(true)
})

test('table art fits wide characters into columns too narrow for them', async () => {
  const cols = 26
  const art = tableArt(tableOf(`|${' h |'.repeat(cols)}\n|${'---|'.repeat(cols)}\n|${' 中文中文 |'.repeat(cols)}`))
  expect(art.split('\n').length > 3).toBe(true)
})

for (const [text, cols] of [['©', 1], ['™', 1], ['↔', 1], ['▶', 1], ['⚠', 1], ['⚠️', 2], ['✅', 2], ['🙂', 2], ['🇮🇱', 2], ['1️⃣', 2], ['𠀀', 2], ['中', 2], ['é', 1]] as const) test(`${text} takes ${cols} terminal column${cols > 1 ? 's' : ''}`, async () => {
  expect(width(text)).toBe(cols)
})

test('a mermaid box around a text-style symbol closes', async () => {
  const art = mermaidText('flowchart TD\n  A[sync ↔ async] --> B[done]', false, 80)!
  const box = art.split("\n").slice(0, 3).map(l => [...l.trimEnd()].length)
  expect(new Set(box).size).toBe(1)
})

test('a long unbroken table cell wraps in linear time', async () => {
  const cost = (n: number) => best(() => tableArt(tableOf(`| h |\n|---|\n| ${'a'.repeat(n)} |`)), 3)
  cost(1000)
  expect(cost(40000) / Math.max(cost(10000), 0.05) < 8).toBe(true)
})

for (const command of ['toString', 'constructor', '__proto__', 'hasOwnProperty x']) test(`a command named ${command} is not read-only and does not throw`, async () => {
  expect(isReadOnlyCall('Bash', { command })).toBe(false)
})

for (const command of [`awk '@include "inplace"; {sub(/a/,"b")} 1' f.txt`, `awk '@load "inplace"; 1' f.txt`, 'awk -E prog.awk f.txt', 'awk --exec=prog.awk f.txt', "awk -l inplace -e '1' f.txt"]) test(`${command} is not read-only`, async () => {
  expect(isReadOnlyCall('Bash', { command })).toBe(false)
})

test('localhost links with a query or a hash stay clickable on desktop', async $ => {
  const ui = await $.ui.mount({ ...mount('[a](http://localhost:5173?debug=1) [b](http://localhost#/home) [c](http://localhost.evil.example/)'), surface: 'desktop' })
  expect((await ui.findAll({ type: 'Link' })).map(l => l.props.href)).toEqual(['http://localhost:5173?debug=1', 'http://localhost#/home'])
  await ui.unmount()
})

test('a footnote definition inside a four-backtick fence stays code', async () => {
  const blocks = parse('````text\n```\n[^x]: inside code\n````\n\nSee[^x]', hl)
  expect(blocks.some(b => b.kind === 'notes')).toBe(false)
})
