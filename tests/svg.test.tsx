import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { PRESETS } from '../hooks/presets'
import { CELL_H, CELL_W, gridSvg } from '../hooks/svg'

const engine = (on: On) =>
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

const reply = (text: string, surface: 'terminal' | 'desktop' | 'vscode' | 'mobile' = 'desktop', columns = 100) => ({
  plugin: 'prismantis',
  surface,
  component: 'AssistantMessage' as const,
  props: { text, isFirstOfReply: true },
  viewport: { columns, rows: 40 },
})

const CHART = ['```mermaid', 'xychart-beta', '  x-axis [Mon, Tue, Wed, Thu]', '  y-axis "Count" 0 --> 10', '  bar [3, 6, 4, 9]', '```'].join('\n')
const FLOW = ['```mermaid', 'flowchart LR', '  A[Prompt] --> B[Hook adds context]', '  B --> C[Reply in markdown]', '```'].join('\n')
const TABLE = ['| Element | What you should see |', '|---|---|', '| **Table** | This grid, with `borders` |', '| Alert | The note box above |'].join('\n')
const FIGURE = ['```figure', '{accent:▏───────▏───────▏}', ' {ok:████████}{warn:████}', ' {strong:hook}    {strong:draw}', '```'].join('\n')

const svgsOf = async (ui: { findAll: (q: { type: 'Svg' }) => Promise<{ props: Record<string, unknown> }[]> }) =>
  (await ui.findAll({ type: 'Svg' })).map(node => String(node.props.source))

test('on desktop, a bar chart draws as one monospace svg with its bars as filled cells', async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(reply(CHART))
  const [svg, ...rest] = await svgsOf(ui)
  expect(rest).toHaveLength(0)
  expect(svg).toContain('monospace')
  expect(svg).toMatch(/<path d="M[^"]*h8v18h-8z/)
  expect(await ui.find({ type: 'Text', text: /█/ })).toBeUndefined()
  await ui.unmount()
})

test('on desktop, flowchart boxes are stroked lines, not glyphs', async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(reply(FLOW))
  const [svg] = await svgsOf(ui)
  expect(svg).toContain('stroke=')
  expect(svg).toContain('>Prompt</text>')
  expect(svg).not.toMatch(/[┌┐└┘─│]/)
  await ui.unmount()
})

test('on desktop, a table draws as svg with its header bold and inline code colored', async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(reply(TABLE))
  const [svg] = await svgsOf(ui)
  const t = PRESETS['catppuccin-mocha']
  expect(svg).toMatch(new RegExp(`fill="${t.tableHeader}" font-weight="700">Element</text>`))
  expect(svg).toContain(`fill="${t.inlineCode}">borders</text>`)
  await ui.unmount()
})

test('a table with a link keeps its text rows on desktop, so the link stays clickable', async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(reply('| a | b |\n|---|---|\n| [site](https://example.com) | x |'))
  expect(await svgsOf(ui)).toHaveLength(0)
  await ui.unmount()
})

test('on desktop, figure roles keep their colors in the svg', async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(reply(FIGURE))
  const [svg] = await svgsOf(ui)
  expect(svg).toContain('fill="#a6e3a1"')
  expect(svg).toContain('fill="#f38ba8"')
  expect(svg).toContain('font-weight="700">hook</text>')
  await ui.unmount()
})

for (const surface of ['vscode', 'mobile'] as const) {
  test(`${surface} draws the svg too`, async ($, on) => {
    engine(on)
    const ui = await $.ui.mount(reply(CHART, surface))
    expect(await svgsOf(ui)).toHaveLength(1)
    await ui.unmount()
  })
}

test('the terminal draws no svg', async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(reply([CHART, FLOW, TABLE, FIGURE].join('\n\n'), 'terminal'))
  expect(await svgsOf(ui)).toHaveLength(0)
  await ui.unmount()
})

test('desktopArt text keeps character rows on desktop', { options: { desktopArt: 'text' } }, async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(reply([CHART, TABLE, FIGURE].join('\n\n')))
  expect(await svgsOf(ui)).toHaveLength(0)
  await ui.unmount()
})

test('runs of line glyphs merge into one stroke and text is pinned to its cells', () => {
  const drawn = gridSvg([[{ text: '┌──┐', color: '#111111' }], [{ text: '│ab│', color: '#111111' }], [{ text: '└──┘', color: '#111111' }]], '#999999')!
  expect(drawn.width).toBe(4 * CELL_W)
  expect(drawn.height).toBe(3 * CELL_H)
  expect(drawn.source).toContain(`textLength="${2 * CELL_W}"`)
  expect(drawn.source).toContain(`x="${CELL_W}" y="${CELL_H + 13}"`)
  expect(drawn.source).toContain('M3.38 9H28.63')
  expect(drawn.source).toContain('M4 8.38V45.63')
})

test('a drawing past the size limit falls back to text', () => {
  const rows = Array.from({ length: 80 }, (_, r) => Array.from({ length: 100 }, (_, c) => ({ text: 'x', color: `#${String(r * 100 + c).padStart(6, '0')}` })))
  expect(gridSvg(rows, '#999999')).toBeNull()
})
