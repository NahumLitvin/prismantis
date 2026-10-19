import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { helpText, showcaseText } from '../hooks/help'
import { inlineText, parse } from '../hooks/markdown'
import { tableHtml, tableText } from '../hooks/html'
import { inlineMarks, mermaidText, shortenEdgeLabels } from '../hooks/mermaid'
import { isReadOnlyCall, tableArt, takesClickableMarks, takesEditorLinks, takesHttpLinks, width } from '../hooks/render'
import { PRESETS } from '../hooks/presets'
import { claudeAt, linksHttp } from './claude-version'
import { clipboardEnv, recordCopies, recordToasts } from './clipboard-env'

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
    const boxes = await ui.findAll({ type: 'Box' })
    const clips = boxes.filter(b => b.props.overflow === 'hidden' && b.props.height === 0)
    expect(links.length).toBe(1)
    expect(clips.length).toBe(3)
    expect(clips.every(b => drawn(b).split('\n').length > 2)).toBe(true)
    expect(boxes.some(b => b.props.position === 'absolute' && drawn(b).includes('│'))).toBe(false)
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
const quoted = (n: number) => prose(n).split('\n').map((line, i) => `${i % 3 ? '> > ' : '> '}${line}`).join('\n')

test('parse cost grows linearly with reply size', async () => {
  for (const make of [rows, prose, quoted]) {
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
  for (const text of ['intro\n\n```mermaid\nflowchart LR\n  A --> B', '| a | b |\n|---|', '```ts\nconst x =', '> [!NOTE', '**bold and `cod', '> - item\n> ```ts\n> const x =', '> | a | b |\n> |---|', '> > [!NOTE', '> [!TIP]\n>']) {
    const ui = await $.ui.mount(mount(text))
    expect(await ui.findAll({ type: 'Text' })).toBeDefined()
    await ui.unmount()
  }
})

test('a line holding only a tag draws dim on its own, never as a path or joined to the paragraph next to it', () => {
  const blocks = parse('Answer text.\n\n<tldr>\n- First point, see /tmp/example.\n\nA closing sentence.\n</tldr>', hl)
  expect(blocks.map(b => b.kind)).toEqual(['paragraph', 'paragraph', 'list', 'paragraph', 'paragraph'])
  expect(blocks[1]).toMatchObject({ inline: [{ kind: 'dim', text: '<tldr>' }], raw: '<tldr>' })
  expect(blocks[3]?.raw).toBe('A closing sentence.')
  expect(blocks[4]).toMatchObject({ inline: [{ kind: 'dim', text: '</tldr>' }], raw: '</tldr>' })
  expect(parse('a <b>bold</b> word\n<br/>', hl).map(b => b.kind === 'paragraph' && b.inline.some(n => n.kind === 'dim'))).toEqual([false])
})

test('the help screen shows every element prismantis draws', async () => {
  const blocks = parse(showcaseText(Object.keys(PRESETS)), hl)
  expect(showcaseText(Object.keys(PRESETS))).toContain('promptStyle')
  expect(showcaseText(Object.keys(PRESETS))).toContain('`clock`')
  expect(showcaseText([])).toContain('⧉ html')
  expect(showcaseText([])).toContain('<i>Reply</i>')
  expect(showcaseText([])).toContain('CopyQ')
  expect(showcaseText([])).toContain('plain text')
  expect(showcaseText([])).toContain('line "east" [')
  expect(blocks.some(b => b.kind === 'table' && b.align.includes('right') && b.align.includes('center'))).toBe(true)
  const kinds = new Set(blocks.map(b => b.kind))
  for (const kind of ['heading', 'paragraph', 'list', 'code', 'quote', 'alert', 'rule', 'table']) expect(kinds.has(kind as never)).toBe(true)
  expect(blocks.some(b => b.kind === 'quote' && b.blocks.filter(c => c.kind === 'paragraph').length >= 2 && b.blocks.some(c => c.kind === 'list') && b.blocks.some(c => c.kind === 'quote'))).toBe(true)
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
  expect(blocks.some(b => b.kind === 'paragraph' && b.inline.length === 1 && b.inline[0]?.kind === 'dim' && b.raw === '</summary>')).toBe(true)
  expect(blocks.some(b => b.kind === 'table' && b.header.some(h => h.some(n => n.kind === 'footnote')))).toBe(true)
  expect(showcaseText([])).toContain('Click a mark to see its note')
  expect(showcaseText([]).includes("toolStyle")).toBe(true)
  expect(showcaseText([]).includes("toolOutput")).toBe(true)
  expect(showcaseText([])).toContain('copyButtonStyle')
  expect(showcaseText([])).toContain('+M more lines')
  expect(showcaseText([])).toContain('```figure')
  expect(showcaseText([])).toContain('pie showData')
  expect(showcaseText([])).toContain('Release  :milestone')
  expect(blocks.some(b => b.kind === 'code' && b.lines.length > 30)).toBe(true)
  expect(showcaseText([])).toContain('diff card headed `+N −M`')
  expect(showcaseText([])).toContain('Files a shell command changes')
  expect(showcaseText([])).toContain('Set `diffStyle` in `/config` for the look: `card`, `full`, `marks` or `bar`')
  expect(showcaseText([])).toContain('Set `pieStyle` to `bars` in `/config` for one bar per slice')
  expect(showcaseText([])).not.toContain('diffAddedColor')
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
  expect(diagrams.length).toBe(7)
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
  expect(helpText([])).toContain('`/prismantis setup`')
  expect(showcaseText([])).toContain('`/prismantis setup`')
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

test('a flowchart whose long edge label makes it too wide draws with the label shortened, not as source', async $ => {
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

test('inline HTML tags in mermaid labels draw as italic and bold, not as tags', async $ => {
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

const CLICKABLE = '2.1.295'
const NOTED = 'Fast[^a].\n\n[^a]: Measured twice.'
const DEMO = { plugin: 'prismantis', component: 'CommandOutput' as const, props: { command: 'prismantis', args: 'demo', text: showcaseText([]), isErrored: false }, viewport: { columns: 120, rows: 40 } }
type DrawnNode = { hover?: { scope?: string }; children?: unknown[] }
const hoverScopes = (node: DrawnNode): string[] => [
  ...(node.hover?.scope ? [node.hover.scope] : []),
  ...(node.children ?? []).flatMap(child => (child && typeof child === 'object' ? hoverScopes(child as DrawnNode) : [])),
]

for (const surface of ['terminal', 'desktop'] as const) {
  test(`footnote marks and the notes block draw on ${surface}`, async ($) => {
    const ui = await $.ui.mount({ ...mount('Fast[^a].\n\n[^a]: Measured twice.'), surface })
    expect(await ui.find({ type: 'Text', text: /^¹$/ })).toBeDefined()
    expect(await ui.find({ text: /^¹ Measured twice\.$/ })).toBeDefined()
    await ui.unmount()
  })

  test(`two identical replies light only their own footnote marks on ${surface}`, async ($) => {
    const scopes: string[][] = []
    for (const requestId of ['m1', 'm2']) {
      const ui = await $.ui.mount({ ...mount(NOTED), surface, requestId })
      scopes.push(hoverScopes((await ui.drawn()) as DrawnNode))
      await ui.unmount()
    }
    expect(scopes.map(s => s.length)).toEqual([2, 2])
    expect(scopes.map(s => new Set(s).size)).toEqual([1, 1])
    expect(scopes[1]!.some(s => scopes[0]!.includes(s))).toBe(false)
  })

  test(`/prismantis demo run twice lights only its own footnote marks on ${surface}`, async ($) => {
    const scopes: string[][] = []
    for (const requestId of ['c1', 'c2']) {
      const ui = await $.ui.mount({ ...DEMO, surface, requestId })
      scopes.push(hoverScopes((await ui.drawn()) as DrawnNode))
      await ui.unmount()
    }
    expect(scopes.map(s => s.length)).toEqual([6, 6])
    expect(scopes.map(s => new Set(s).size)).toEqual([3, 3])
    expect(scopes[1]!.some(s => scopes[0]!.includes(s))).toBe(false)
  })

  for (const tableStyle of ['box', 'rules'] as const) {
    for (const base of [undefined, CLICKABLE]) {
      test(`footnote marks in table cells draw in the paragraph mark color on ${surface}, ${tableStyle}${base ? `, Claude Code ${base}` : ''}`, { options: { tableStyle } }, async ($, on) => {
        if (base) claudeAt(on, base)
        if (base && !(await linksHttp($.ui.mount({ ...mount(NOTED), surface })))) return
        const accent = PRESETS['catppuccin-mocha'].accent
        const ui = await $.ui.mount({ ...mount('Fast[^a].\n\n| Metric[^b] | **Value**[^c] | A long header that has to wrap[^a] |\n|---|---|---|\n| p99[^a] | 40ms[^b] | x |\n\n[^a]: A.\n[^b]: B.\n[^c]: C.', 40), surface })
        const marks = await ui.findAll({ type: 'Text', text: /^[¹²³]$/ })
        expect(new Set(marks.map(m => m.text))).toEqual(new Set(['¹', '²', '³']))
        expect(marks.filter(m => m.props.color !== accent).map(m => m.text)).toEqual([])
        expect(marks.length).toBe(6)
        const header = await ui.findAll({ type: 'Text', text: /^Metric²?$/ })
        expect(header.some(h => h.props.bold === true && h.props.color === PRESETS['catppuccin-mocha'].tableHeader)).toBe(true)
        await ui.unmount()
      })
    }
  }

  test(`footnote marks stay plain text before Claude Code 2.1.295 on ${surface}`, async ($, on) => {
    claudeAt(on, '2.1.294')
    const ui = await $.ui.mount({ ...mount('Fast[^a].\n\n| M[^a] | V |\n|---|---|\n| x | 1 |\n\n[^a]: Measured twice.'), surface })
    expect(await ui.findAll({ type: 'Button', text: /^¹$/ })).toEqual([])
    expect((await ui.findAll({ type: 'Text', text: /^¹$/ })).map(m => m.props.color)).toEqual([PRESETS['catppuccin-mocha'].accent, PRESETS['catppuccin-mocha'].accent])
    await ui.unmount()
  })

  test(`a click on a footnote mark in a sentence, list, quote or table shows its note on ${surface}`, async ($, on) => {
    claudeAt(on, CLICKABLE)
    const toasts = recordToasts(on)
    if (!(await linksHttp($.ui.mount({ ...mount(NOTED), surface })))) return
    const ui = await $.ui.mount({ ...mount('Fast[^a] and steady.\n\n- Cold[^b] start\n\n> Quiet[^a] release.\n\n| M | V |\n|---|---|\n| p99 | 40ms[^b] |\n\n[^a]: Measured twice.\n[^b]: First request.'), surface })
    const marks = await ui.findAll({ type: 'Button', text: /^[¹²]$/ })
    expect(marks.map(m => m.text)).toEqual(['¹', '²', '¹', '²'])
    for (const mark of marks) await ui.press({ key: mark.key! })
    expect(toasts).toEqual(['¹ Measured twice.', '² First request.', '¹ Measured twice.', '² First request.'])
    expect((await ui.find({ type: 'Text', text: /^Quiet$/ }))?.props).toMatchObject({ italic: true, color: PRESETS['catppuccin-mocha'].quote })
    await ui.unmount()
  })

  test(`a mark after a word wider than the line stays at the word's end on ${surface}`, async ($, on) => {
    claudeAt(on, CLICKABLE)
    if (!(await linksHttp($.ui.mount({ ...mount(NOTED), surface })))) return
    const long = 'supercalifragilisticexpialidocious-extra-long-token'
    const ui = await $.ui.mount({ ...mount(`Token ${long}[^a] here.\n\n- item ${long}[^a] end\n\n[^a]: The long token.`, 40), surface })
    const words = (await ui.findAll({ type: 'Box' })).filter(b => b.props.flexShrink === 0 && b.text.includes('¹'))
    expect(words.map(w => w.text.trim().endsWith('token¹'))).toEqual([true, true])
    expect(words.filter(w => width(w.text.trimEnd()) > 38).map(w => w.text)).toEqual([])
    await ui.unmount()
  })

  test(`/prismantis demo footnote marks are clickable on ${surface}`, async ($, on) => {
    claudeAt(on, CLICKABLE)
    const toasts = recordToasts(on)
    if (!(await linksHttp($.ui.mount({ ...mount(NOTED), surface })))) return
    const ui = await $.ui.mount({ ...DEMO, surface })
    const marks = await ui.findAll({ type: 'Button', text: /^[¹²³]$/ })
    expect(marks.map(m => m.text)).toEqual(['¹', '²', '³'])
    await ui.press({ key: marks[0]!.key! })
    expect(toasts).toEqual(['¹ Counted at close.'])
    await ui.unmount()
  })
}

test('footnote clicks need Claude Code 2.1.295 or later', () => {
  const versions = ['2.1.287', '2.1.294', '2.1.295', '2.1.296-dev.20261013.t101500.sha1a2b3c4', '2.2.0', '3.0.0', '1.9.999', 'dev']
  expect(versions.map(takesClickableMarks)).toEqual([false, false, true, true, true, true, false, false])
})

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
  for (const kind of ['mindmap', 'timeline', 'journey', 'gitGraph']) {
    const ui = await $.ui.mount(mount('```mermaid\n' + kind + '\n  title T\n```'))
    expect(await ui.find({ type: 'Text', text: `${kind} diagrams draw as source for now` })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^diagram failed to render$/ })).toBeUndefined()
    await ui.unmount()
  }
})

test('a half-streamed diagram shows no note until its fence closes', async $ => {
  const open = await $.ui.mount(mount('```mermaid\nmindmap\n  root'))
  expect(await open.find({ type: 'Text', text: /diagram|draw as source/ })).toBeUndefined()
  await open.unmount()
  const closed = await $.ui.mount(mount('```mermaid\nmindmap\n  root\n```'))
  expect(await closed.find({ type: 'Text', text: /^mindmap diagrams draw as source for now$/ })).toBeDefined()
  await closed.unmount()
})

test('a pie chart draws one bar per slice, largest first, with its share', () => {
  const art = mermaidText('pie showData title Pets\n  "Cats" : 85\n  "Dogs" : 386\n  "Rats" : 0\n  "Mice" : 0.5', false, 80)!.split('\n')
  expect(art[0]).toBe('Pets')
  expect(art.slice(1).map(l => l.split(' ')[0])).toEqual(['Dogs', 'Cats', 'Mice', 'Rats'])
  expect(art[1]).toMatch(/█ 386  82%$/)
  expect(art[3]).toMatch(/<1%$/)
  expect(art[4]).not.toContain('█')
  expect(new Set(art.slice(1).map(l => width(l))).size).toBe(1)
})

test('a round pie draws a circle with a legend, largest slice first', () => {
  const art = mermaidText('pie showData title Pets\n  "Cats" : 85\n  "Dogs" : 386\n  "Rats" : 15', false, 80, 7)!.split('\n')
  expect(art[0]).toBe('Pets')
  expect(art).toHaveLength(13)
  expect(art[1]).toMatch(/^ +▄▄▟█+▙▄▄$/)
  expect(art[12]).toMatch(/^ +▀▀▜█+▛▀▀$/)
  expect(art.slice(5, 8).map(l => l.split('   ██ ')[1])).toEqual(['Dogs 386  79%', 'Cats  85  17%', 'Rats  15   3%'])
})

test('a round pie falls back to bars in ascii mode, past seven slices and when the terminal is too narrow', () => {
  const pie = 'pie\n  "Dogs" : 386\n  "Cats" : 85'
  const many = `pie\n${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `  "s${n}" : ${n}`).join('\n')}`
  for (const [source, ascii, columns] of [[pie, true, 80], [many, false, 80], [pie, false, 30]] as const)
    expect(mermaidText(source, ascii, columns, 7)).toBe(mermaidText(source, ascii, columns, 0))
  expect(mermaidText(pie, false, 80, 7)).toContain('▟')
})

test('each round pie slice and its legend swatch share one color', async $ => {
  const source = '```mermaid\npie title Pets\n  "Dogs" : 386\n  "Cats" : 85\n  "Rats" : 15\n```'
  const ui = await $.ui.mount(mount(source))
  const texts = await ui.findAll({ type: 'Text' })
  const swatches = [' Dogs 79%', ' Cats 17%', ' Rats  3%'].map(label => texts[texts.findIndex(n => n.text === label) - 1]?.props.color)
  expect(new Set(swatches).size).toBe(3)
  expect((await ui.find({ type: 'Text', text: /^▜█+▛$/ }))?.props.color).toBe(swatches[0])
  await ui.unmount()
})

const runs = async (ui: { findAll: (q: { type: string }) => Promise<{ text?: string; props: { color?: string } }[]> }) => (await ui.findAll({ type: 'Text' })).map(n => `${n.text}|${n.props.color}`)

const fiveSlices = '```mermaid\npie\n  "a" : 5\n  "b" : 4\n  "c" : 3\n  "d" : 2\n  "e" : 1\n```'
const fourSlices = '```mermaid\npie\n  "a" : 4\n  "b" : 3\n  "c" : 2\n  "d" : 1\n```'

for (const [theme, source, round] of [['dracula', fiveSlices, false], ['dracula', fourSlices, true], ['mono', fourSlices, false], ['catppuccin-mocha', fiveSlices, true]] as const)
  test(`a round pie of ${source === fiveSlices ? 5 : 4} slices in ${theme} draws ${round ? 'round' : 'bars'}, since each slice needs its own theme color`, { options: { theme } }, async $ => {
    const ui = await $.ui.mount(mount(source))
    expect(!!(await ui.find({ type: 'Text', text: /▟/ }))).toBe(round)
    await ui.unmount()
  })

test('two pies that draw the same art but split it differently each keep their own slice colors', async $ => {
  const pie = (a: number, b: number) => '```mermaid\npie\n  "A" : ' + a + '\n  "B" : ' + b + '\n```'
  const drawn: string[][] = []
  for (const [a, b] of [[5103, 4897], [5104, 4896], [5103, 4897]] as const) {
    const ui = await $.ui.mount(mount(pie(a, b)))
    drawn.push(await runs(ui))
    await ui.unmount()
  }
  expect(drawn[0]!.filter(r => !r.includes('|undefined')).join()).not.toBe(drawn[1]!.filter(r => !r.includes('|undefined')).join())
  expect(drawn[2]).toEqual(drawn[0])
})

test('pieStyle bars draws one bar per slice', { options: { pieStyle: 'bars' } }, async $ => {
  const ui = await $.ui.mount(mount('```mermaid\npie title Pets\n  "Dogs" : 386\n  "Cats" : 85\n```'))
  expect(await ui.find({ type: 'Text', text: /▟/ })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /^Dogs  / })).toBeDefined()
  await ui.unmount()
})

test('a gantt chart places each task on a shared time axis', () => {
  const art = mermaidText('gantt\n  dateFormat YYYY-MM-DD\n  section Build\n  Parse :p, 2026-10-01, 7d\n  Draw :after p, 7d\n  Ship :milestone, 2026-10-15, 0d', false, 80)!.split('\n')
  expect(art[0]!.trim().startsWith('10-01')).toBe(true)
  expect(art[1]!.trim()).toMatch(/^▏(─+▏)+$/)
  const span = (line: string) => [line.indexOf('█'), line.lastIndexOf('█')]
  const [parse, draw] = [span(art[3]!), span(art[4]!)]
  expect(draw[0]).toBe(parse[1]! + 1)
  expect(draw[1]! - draw[0]!).toBe(parse[1]! - parse[0]!)
  expect(art[5]!.indexOf('◆')).toBe(draw[1])
  expect(art[2]).toBe('Build')
})

const FINE_GANTT = 'gantt\n  dateFormat YYYY-MM-DD\n  section Build\n  Two days :a, 2026-10-01, 2d\n  Two and a bit :b, 2026-10-01, 2.4d\n  Two and a half :c, 2026-10-01, 2.5d\n  Rest :d, after a, 5d'

test('gantt bars end on an eighth of a cell and start on a half, so close durations draw apart', () => {
  const art = mermaidText(FINE_GANTT, false, 80)!.split('\n')
  const bar = (name: string) => art.find(l => l.trimStart().startsWith(name))!.slice(18)
  expect(new Set(['Two days', 'Two and a bit', 'Two and a half'].map(bar)).size).toBe(3)
  expect(bar('Two days')).toMatch(/^█+[▎▍▌▋▊▉]$/)
  expect(bar('Rest').trimStart()).toMatch(/^▐█+$/)
  expect(mermaidText('gantt\n  dateFormat YYYY-MM-DD\n  A :a, 2026-10-01, 2d', true, 80)).not.toMatch(/[▐▏▎▍▌▋▊▉]/)
})

test('a gantt bar end drawn in part of a cell takes its bar color, while axis ticks keep theirs', async $ => {
  const ui = await $.ui.mount(mount('```mermaid\n' + FINE_GANTT + '\n```', 80))
  expect(await ui.find({ type: 'Text', text: /^█+[▎▍▌▋▊▉]$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^▐█+$/ })).toBeDefined()
  expect((await ui.find({ type: 'Text', text: /^▏(─+▏)+─*$/ }))?.props.color).toBe(PRESETS['catppuccin-mocha'].diagram)
  await ui.unmount()
})

test('pie and gantt sources the chart cannot read show a failure note, not a broken chart', async $ => {
  for (const source of ['pie\n  "a" : -1', 'pie\n  "a" : 0', 'gantt\n  Task : 3d', 'gantt\n  dateFormat X\n  Task : 1, 2', 'gantt\n  Task : after nope, 1d']) {
    expect(mermaidText(source, false, 80)).toBeNull()
    const ui = await $.ui.mount(mount('```mermaid\n' + source + '\n```'))
    expect(await ui.find({ type: 'Text', text: /^diagram failed to render$/ })).toBeDefined()
    await ui.unmount()
  }
})

test('pie and gantt charts shrink to a narrow terminal and use plain glyphs in ascii mode', () => {
  const pie = 'pie\n  "A very long slice label that goes on" : 3\n  "b" : 1'
  const gantt = 'gantt\n  dateFormat HH:mm\n  Deploy : 10:00, 45m\n  Verify : 30m'
  for (const source of [pie, gantt]) {
    expect(Math.max(...mermaidText(source, false, 50)!.split('\n').map(width)) <= 48).toBe(true)
    expect(mermaidText(source, true, 80)).not.toMatch(/[█▏─◆]/)
  }
  expect(mermaidText(gantt, false, 80)).toContain('10:00')
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
  const ratios = Array.from({ length: 5 }, () => cost(40000) / Math.max(cost(10000), 0.05))
  expect(Math.min(...ratios)).toBeLessThan(8)
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

const exact = (text: string) => new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)

const barLines = async (ui: { findAll: (query: { type: string; text: RegExp }) => Promise<{ text: string }[]> }) =>
  (await ui.findAll({ type: 'Text', text: /^(│ \n)*│ $/ })).map(bar => bar.text.split('\n').length)

const DRAFT = [
  '> Yeah agreed, definitely a POC. It does check the dispatcher which nothing else does right now.',
  '>',
  '> It also does a few things worth carrying into whatever replaces it:',
  "> - **RoutableServiceNames** reproduces 0.2.0's grammar from reading `dispatcher.py`.",
  "> - That routing check doesn't need a server.",
  '>',
  '> The rest is fine to drop.',
  '>',
  '> *-- Drafted with Claude (Opus 5.5)*',
].join('\n')

for (const surface of ['terminal', 'desktop'] as const) test(`a quote keeps its paragraphs, list rows and styling on ${surface}`, async ($, on) => {
  const copied = stubClipboard(on)
  const t = PRESETS['catppuccin-mocha']
  const ui = await $.ui.mount({ ...mount(DRAFT), surface })
  for (const text of ['Yeah agreed, definitely a POC. It does check the dispatcher which nothing else does right now.', 'It also does a few things worth carrying into whatever replaces it:', 'The rest is fine to drop.', '-- Drafted with Claude (Opus 5.5)']) {
    expect((await ui.find({ type: 'Text', text: exact(text) }))?.props).toMatchObject({ italic: true, color: t.quote })
  }
  expect(await ui.findAll({ type: 'Text', text: /^• $/ })).toHaveLength(2)
  expect(await ui.find({ type: 'Text', text: exact("RoutableServiceNames reproduces 0.2.0's grammar from reading dispatcher.py.") })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: exact("That routing check doesn't need a server.") })).toBeDefined()
  expect((await ui.find({ type: 'Text', text: /^RoutableServiceNames$/ }))?.props).toMatchObject({ bold: true, color: t.strong })
  expect((await ui.find({ type: 'Text', text: /^dispatcher\.py$/ }))?.props.color).toBe(t.inlineCode)
  expect(Math.max(...(await barLines(ui))) >= 10).toBe(true)
  const buttons = await ui.findAll({ type: 'Button' })
  expect(buttons.map(b => b.props.label)).toEqual(['⧉ copy'])
  await ui.press({ key: buttons[0]!.key! })
  expect(copied).toEqual([DRAFT.split('\n').map(line => line.replace(/^>\s?/, '')).join('\n')])
  await ui.unmount()
})

for (const surface of ['terminal', 'desktop'] as const) test(`a nested quote draws with its own bar inside the outer one on ${surface}`, async $ => {
  const ui = await $.ui.mount({ ...mount('> outer\n>\n> > inner one\n> > inner two\n>\n> after'), surface })
  for (const text of [/^outer$/, /^inner one inner two$/, /^after$/]) expect(await ui.find({ type: 'Text', text })).toBeDefined()
  expect(await ui.find({ type: 'Box', text: /^│ inner one inner two$/ })).toBeDefined()
  expect(Math.max(...(await barLines(ui))) >= 5).toBe(true)
  await ui.unmount()
})

for (const surface of ['terminal', 'desktop'] as const) test(`an alert keeps a list in its body on ${surface}`, async ($, on) => {
  const copied = stubClipboard(on)
  const source = '> [!NOTE]\n> Before you merge:\n> - run the tests\n> - update the CHANGELOG'
  const ui = await $.ui.mount({ ...mount(source), surface })
  expect(await ui.find({ type: 'Text', text: /^Note$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^Before you merge:$/ })).toBeDefined()
  expect(await ui.findAll({ type: 'Text', text: /^• $/ })).toHaveLength(2)
  for (const text of [/^run the tests$/, /^update the CHANGELOG$/]) expect(await ui.find({ type: 'Text', text })).toBeDefined()
  expect((await ui.findAll({ type: 'Box' })).find(b => b.props.borderStyle === 'round')?.text).toContain('update the CHANGELOG')
  const buttons = await ui.findAll({ type: 'Button' })
  expect(buttons.map(b => b.props.label)).toEqual(['⧉ copy'])
  await ui.press({ key: buttons[0]!.key! })
  expect(copied).toEqual(['[!NOTE]\nBefore you merge:\n- run the tests\n- update the CHANGELOG'])
  await ui.unmount()
})

for (const surface of ['terminal', 'desktop'] as const) test(`a code block and a table inside a quote fit beside the bar and copy their own source on ${surface}`, async ($, on) => {
  const copied = stubClipboard(on)
  const t = PRESETS['catppuccin-mocha']
  const table = `| Check | Result |\n|---|---|\n| lint | ${'passes on every package '.repeat(4).trim()} |`
  const source = `Before.\n\n> Run it:\n>\n> \`\`\`bash\n> npm test\n> \`\`\`\n>\n${table.split('\n').map(line => `> ${line}`).join('\n')}`
  const ui = await $.ui.mount({ ...mount(source, 60), surface })
  expect(await ui.find({ type: 'Text', text: /^── bash$/ })).toBeDefined()
  if (surface === 'desktop') expect((await ui.find({ type: 'Code' }))?.props.source).toBe('npm test')
  else expect((await ui.find({ type: 'Text', text: /^npm$/ }))?.props.color).toBe(t.codeCommand)
  expect((await ui.find({ type: 'Text', text: /^Check$/ }))?.props.color).toBe(t.tableHeader)
  const edge = await ui.find({ type: 'Text', text: /^┌[─┬]+┐$/ })
  expect(width('│ ') + width(edge!.text) + 2 + width('[ ⧉ copy ]') <= 60 - 4).toBe(true)
  const labels = (await ui.findAll({ type: 'Button' })).map(b => b.props.label)
  expect(labels.filter(l => l === '⧉ copy')).toHaveLength(2)
  expect(labels.filter(l => l === '⧉ md')).toHaveLength(1)
  await ui.press({ key: 'b1.copy1' })
  await ui.press({ key: 'b1.copy2' })
  await ui.press({ key: 'reply' })
  expect(copied).toEqual(['npm test', table, source])
  await ui.unmount()
})

for (const surface of ['terminal', 'desktop'] as const) test(`footnotes number and links stay readable inside a quote on ${surface}`, async $ => {
  const t = PRESETS['catppuccin-mocha']
  const source = '> Intro.\n>\n> - Latency fell[^lat], see [run](javascript:alert(1)) and [docs](https://example.com).\n>\n> [^q]: Quoted note.\n\nAlso[^q].\n\n[^lat]: Median of 50 runs.'
  const ui = await $.ui.mount({ ...mount(source), surface })
  expect(await ui.find({ type: 'Text', text: /^Latency fell¹, see run \(javascript:alert\(1\)\) and / })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^run \(javascript:alert\(1\)\)$/ })).toBeDefined()
  expect((await ui.find({ type: 'Text', text: /^¹$/ }))?.props.color).toBe(t.accent)
  expect((await ui.findAll({ type: 'Link' })).map(l => l.props.href)).toEqual(['https://example.com'])
  expect(await ui.find({ type: 'Text', text: /^Also²\.$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^¹ Median of 50 runs\.$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^² Quoted note\.$/ })).toBeDefined()
  expect((await ui.find({ type: 'Box', key: 'b0' }))?.text).not.toContain('Quoted note')
  await ui.unmount()
})

for (const copyButtons of [true, false]) test(`a quote ${copyButtons ? 'beside its copy button' : 'without a copy button'} sizes its bar for the width left`, { options: { copyButtons } }, async $ => {
  const ui = await $.ui.mount(mount(`> ${'word '.repeat(10)}end`, 60))
  expect(Math.max(...(await barLines(ui))) > 1).toBe(copyButtons)
  await ui.unmount()
})

test('a quote bar covers a wrapped banner heading and its rule', { options: { headingStyle: 'banner', copyButtons: false } }, async $ => {
  const ui = await $.ui.mount(mount(`> ## ${'A'.repeat(300)}`, 60))
  expect(Math.max(...(await barLines(ui))) >= 2 * Math.ceil(300 / (60 - 4 - 2))).toBe(true)
  await ui.unmount()
})

test('a quote bar covers a task list progress line that wraps', { options: { taskStyle: 'progress', copyButtons: false } }, async $ => {
  const ui = await $.ui.mount(mount('> - [ ] x', 24))
  expect(Math.max(...(await barLines(ui))) >= 3).toBe(true)
  await ui.unmount()
})

for (const surface of ['terminal', 'desktop'] as const) test(`a quote bar stays in the flow, clipped to the quote's rows, on ${surface}`, async $ => {
  const ui = await $.ui.mount({ ...mount(DRAFT), surface })
  const boxes = await ui.findAll({ type: 'Box' })
  const clips = boxes.filter(b => b.props.overflow === 'hidden' && b.props.height === 0 && b.props.flexGrow === 1)
  expect(clips.some(b => /^(│ \n){9,}│ $/.test(drawn(b)))).toBe(true)
  expect(boxes.some(b => b.props.position === 'absolute' && drawn(b).includes('│'))).toBe(false)
  await ui.unmount()
})

test('footnotes follow quotes and fences: a quoted fence marker inside code makes no note, and an unclosed quoted fence hides none', async () => {
  const marks = (source: string) => parse(source, hl).flatMap(b => (b.kind === 'notes' ? b.notes.map(n => `${n.mark} ${inlineText(n.inline)}`) : []))
  expect(marks('```md\n> ```\n[^fake]: Not a real note\n```\n\nReal[^real].\n\n[^real]: Real note')).toEqual(['¹ Real note'])
  expect(marks('> ```\n> [^x]: in code\n\nTop[^top].\n\n[^top]: Top note')).toEqual(['¹ Top note'])
  expect(marks('> a[^q]\n>\n> > [^q]: Nested note\n> >   continued')).toEqual(['¹ Nested note continued'])
})

for (const copyButtonStyle of ['inline', 'hover'] as const) test(`a quote that opens with code puts its own ${copyButtonStyle} copy button on its last row`, { options: { copyButtonStyle } }, async $ => {
  const ui = await $.ui.mount(mount('> ```bash\n> npm test\n> ```\n>\n> Run that first.\n\n> One line.'))
  const boxes = await ui.findAll({ type: 'Box' })
  const low = boxes.filter(b => (copyButtonStyle === 'hover' ? b.props.display === 'none' && b.props.bottom === 0 && b.props.right === 0 && b.text !== '⧉ copy reply' : b.props.alignSelf === 'flex-end' && b.key !== 'reply'))
  expect(low.map(b => b.text)).toEqual(['⧉ copy'])
  expect(boxes.filter(b => b.props.position === 'absolute' && b.props.top === 0 && b.props.display === 'none').map(b => b.text)).toEqual(copyButtonStyle === 'hover' ? ['⧉ copy', '⧉ copy'] : [])
  await ui.unmount()
})

type FloatNode = { type?: string; props?: Record<string, unknown>; children?: unknown[] }
const floatKids = (node: FloatNode) => (node.children ?? []).filter((child): child is FloatNode => !!child && typeof child === 'object')
const floatLabels = (node: FloatNode): string[] => (node.type === 'Button' ? [String(node.props?.label)] : floatKids(node).flatMap(floatLabels))
const floatRoom = (node: FloatNode, room = 0): { labels: string[]; needs: number; room: number }[] => {
  if (node.props?.position === 'absolute' && node.props.display === 'none') {
    const labels = floatLabels(node)
    return [{ labels, needs: labels.reduce((w, label) => w + (w ? 1 : 0) + width(`[ ${label} ]`), 0), room }]
  }
  const here = typeof node.props?.minWidth === 'number' ? node.props.minWidth : room
  return floatKids(node).flatMap(child => floatRoom(child, here))
}
const hoverFloats = async (ui: { findAll: (query: { type: string }) => Promise<{ props: Record<string, unknown>; text?: string }[]> }) =>
  (await ui.findAll({ type: 'Box' })).filter(b => b.props.position === 'absolute' && b.props.display === 'none' && b.text !== '⧉ copy reply')

test('copyButtonStyle hover reserves every floating button\'s width on the block it floats over', { options: { copyButtonStyle: 'hover' } }, async $ => {
  const ui = await $.ui.mount(mount('| a |\n|---|\n| 1 |\n\n```\nx\n```\n\n- y\n\n> z\n\n> [!NOTE]\n> w\n\n> ```\n> q\n> ```\n\n- item\n  ```\n  v\n  ```\n\n```mermaid\nflowchart LR\n  A --> B\n```'))
  const floats = floatRoom((await ui.drawn()) as FloatNode).filter(f => !f.labels.includes('⧉ copy reply'))
  expect(floats.length).toBeGreaterThanOrEqual(9)
  for (const float of floats) expect({ ...float, fits: float.room >= float.needs }).toMatchObject({ fits: true })
  await ui.unmount()
})

test('copyButtonStyle hover puts the button of a quote whose nested quote opens with code on its last row, clear of the code\'s own', { options: { copyButtonStyle: 'hover' } }, async $ => {
  const ui = await $.ui.mount(mount('> > ```bash\n> > ls\n> > ```\n>\n> text'))
  const floats = await hoverFloats(ui)
  expect(floats.filter(b => b.props.top === 0).map(b => b.text)).toEqual(['⧉ copy'])
  expect(floats.filter(b => b.props.bottom === 0).map(b => b.text)).toEqual(['⧉ copy'])
  await ui.unmount()
})

test('copyButtonStyle hover gives a quote holding only an empty code block one button, so two never share its single row', { options: { copyButtonStyle: 'hover' } }, async $ => {
  for (const text of ['> ```\n> ```', '> > ```\n> > ```']) {
    const ui = await $.ui.mount(mount(text))
    expect((await hoverFloats(ui)).map(b => b.text)).toEqual(['⧉ copy'])
    await ui.unmount()
  }
})

test('copyButtonStyle hover keeps Hebrew quotes and alerts on the right, as inline does', { options: { copyButtonStyle: 'hover', rtl: 'warp' } }, async $ => {
  for (const text of ['> שלום עולם', '> [!NOTE]\n> שלום עולם']) {
    const ui = await $.ui.mount(mount(text))
    expect((await ui.find({ key: 'c0' }))?.props.alignSelf).toBeUndefined()
    await ui.unmount()
  }
})

test('copyButtonStyle hover anchors the buttons of a right-to-left block at its left, where its lines end', { options: { copyButtonStyle: 'hover', rtl: 'warp' } }, async $ => {
  const anchors = async (text: string) => {
    const ui = await $.ui.mount(mount(text))
    const sides = (await hoverFloats(ui)).map(b => (b.props.left === 0 && b.props.right === undefined ? 'left' : b.props.right === 0 && b.props.left === undefined ? 'right' : 'both'))
    await ui.unmount()
    return sides
  }
  expect(await anchors('- שלום עולם\n- עוד פריט')).toEqual(['left'])
  expect(await anchors('> שלום עולם')).toEqual(['left'])
  expect(await anchors('> [!NOTE]\n> שלום עולם')).toEqual(['left'])
  expect(await anchors('| שם | ערך |\n|---|---|\n| אחד | שתיים |')).toEqual(['left'])
  expect(await anchors('- hello שלום\n- world')).toEqual(['right'])
  expect(await anchors('- hello\n- world')).toEqual(['right'])
})

for (const surface of ['terminal', 'desktop'] as const) test(`display math inside a quote or a list item draws as text on ${surface}`, async $ => {
  const ui = await $.ui.mount({ ...mount('> $$\n> E = mc^2 \\cdot \\alpha\n> $$\n\n- energy:\n  ```math\n  \\pi r^2\n  ```'), surface })
  expect((await ui.find({ type: 'Text', text: /^E = mc² · α$/ }))?.props).toMatchObject({ italic: true, color: PRESETS['catppuccin-mocha'].emphasis })
  expect(await ui.find({ type: 'Text', text: /^πr²$|^π r²$/ })).toBeDefined()
  await ui.unmount()
})

test('a quote with nothing to draw is left out', async () => {
  expect(parse('> [^q]: A note.\n\nSee[^q].', hl).map(b => b.kind)).toEqual(['paragraph', 'notes'])
  expect(parse('>\n> \n\ntext', hl).map(b => b.kind)).toEqual(['paragraph'])
  expect(parse('> [!NOTE]', hl).map(b => b.kind)).toEqual(['alert'])
})

test('quotes nested past eight levels keep their text and parse in linear time', async () => {
  const started = Date.now()
  const [block] = parse(`${'>'.repeat(20000)} deep`, hl)
  expect(Date.now() - started < 100).toBe(true)
  let depth = 0
  let at = block
  while (at?.kind === 'quote') {
    depth++
    at = at.blocks[0]
  }
  expect(depth).toBe(8)
  expect(at?.kind === 'paragraph' && inlineText(at.inline).endsWith('> deep')).toBe(true)
})
