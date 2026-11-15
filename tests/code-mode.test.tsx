import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { register } from '../hooks/register'
import { width } from '../hooks/layout'
import { PRESETS } from '../hooks/presets'
import { setupSteps } from '../hooks/help'
import { resolveStyle } from '../hooks/theme'

const t = PRESETS['catppuccin-mocha']

const engine = (on: On) =>
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

const call = (tool: string, input: unknown, id: string, over: Record<string, unknown> = {}) => ({ tool_use_id: id, tool, input, isRunning: false, isErrored: false, isInterrupted: false, ...over })

const script = (code: string, over: Record<string, unknown> = {}, id = 'toolu_A') => call('REPL', { code, description: 'Count the files' }, id, over)

const inner = (id: string, over: Record<string, unknown> = {}) => call('Bash', { command: 'ls -la' }, id, over)

type Props = ReturnType<typeof call> & { isExpanded?: boolean }

const row = (props: Props, surface: 'terminal' | 'desktop' = 'terminal', columns = 100) => ({ plugin: 'prismantis', surface, component: 'ToolUse' as const, props, viewport: { columns, rows: 40 } })

const group = (calls: ReturnType<typeof call>[], isExpanded = false) => ({ plugin: 'prismantis', surface: 'terminal' as const, component: 'ToolGroup' as const, props: { calls, isActive: false, isExpanded }, viewport: { columns: 100, rows: 40 } })

type Node = { type?: string; props?: Record<string, unknown>; children?: unknown[] }

const buttonFace = (node: Node): string => (node.props?.plain ? String(node.props.label) : `[ ${String(node.props?.label)} ]`)

const textOf = (node: unknown): string => {
  if (typeof node === 'string') return node
  const { type, children = [] } = (node ?? {}) as Node
  return type === 'Button' && children.length === 0 ? buttonFace(node as Node) : children.map(textOf).join('')
}

const lines = (n: number) => Array.from({ length: n }, (_, i) => `log("line ${i + 1}")`).join('\n')

type Mounted = { drawn: () => Promise<unknown> }

const drawnText = async (ui: Mounted) => textOf(await ui.drawn())

const hasCard = async (ui: Mounted) => (await drawnText(ui)).includes('Code · ')

const hooksOf = (options: Record<string, unknown>): string[] => {
  const seen: string[] = []
  const on = (name: string, ...rest: unknown[]) => {
    const filter = rest.length > 1 ? (rest[0] as { component?: string }) : undefined
    seen.push(filter?.component ? `${name}:${filter.component}` : name)
  }
  register(on as never, options as never)
  return seen
}

const kids = (node: Node): Node[] => (node.children ?? []).filter((c): c is Node => c !== null && typeof c === 'object')

const nodes = (node: unknown): Node[] => (node !== null && typeof node === 'object' ? [node as Node, ...kids(node as Node).flatMap(nodes)] : [])

const drawnWidth = (node: Node): number => {
  if (node.type === 'Button' || node.type === 'Text') return width(textOf(node))
  if (typeof node.props?.width === 'number') return node.props.width
  return kids(node).reduce((w, child) => w + drawnWidth(child), 0)
}

const frameOf = async (ui: Mounted) => {
  const frame = nodes(await ui.drawn()).find(n => n.type === 'Box' && typeof n.props?.width === 'number' && textOf(kids(n)[0] ?? {}).startsWith('╭─ '))
  if (!frame) throw new Error('no frame drawn')
  return { wide: frame.props!.width as number, lines: kids(frame).map(line => ({ text: textOf(line), width: line.type === 'Text' ? width(textOf(line)) : kids(line).reduce((w, child) => w + drawnWidth(child), 0) })) }
}

test('prismantis registers no tool.call, tool.check or Placed hook, and keeps its row hooks when toolRows is off', () => {
  for (const toolRows of [true, false]) {
    for (const runningDot of ['blink', 'ring']) {
      const hooks = hooksOf({ toolRows, runningDot })
      expect(hooks.filter(name => name.startsWith('tool.'))).toEqual([])
      expect(hooks).toContain('ui.render:ToolUse')
      expect(hooks).toContain('ui.render:ToolGroup')
      expect(hooks).not.toContain('ui.render:Placed')
      expect(hooks.includes('ui.render:ToolResult')).toBe(toolRows)
    }
  }
})

test('a REPL row draws its own script above what Claude Code draws for it, expanded or not, on the terminal and the desktop', async ($, on) => {
  engine(on)
  for (const surface of ['terminal', 'desktop'] as const) {
    for (const isExpanded of [true, false]) {
      const ui = await $.ui.mount(row({ ...script('const a = 1\nreturn a', { isRunning: true }), isExpanded }, surface))
      const text = await drawnText(ui)
      expect(text).toContain('Code · 2 lines')
      expect(surface === 'terminal' ? text : String((await ui.find({ type: 'Code' }))?.props.source)).toContain('const a = 1')
      expect(text.endsWith('engine')).toBe(true)
      expect(text.indexOf('Code · 2 lines')).toBeLessThan(text.indexOf('engine'))
      expect((await ui.find({ type: 'Text', text: /^Code · 2 lines$/ }))?.props.color).toBe(t.codeComment)
      expect((await ui.findAll({ type: 'Button' })).some(b => b.props.label === '⧉ copy')).toBe(true)
      if (surface === 'terminal') {
        expect(text.startsWith('╭─ Code · 2 lines')).toBe(true)
        expect((await ui.find({ type: 'Text', text: /^const$/ }))?.props.color).toBe(t.codeFlag)
      } else expect((await ui.find({ type: 'Code' }))?.props).toMatchObject({ language: 'javascript' })
      await ui.redraw({ ...script('const a = 1\nreturn a'), isExpanded })
      expect((await drawnText(ui)).indexOf('Code · 2 lines')).toBeLessThan((await drawnText(ui)).indexOf('engine'))
      await ui.unmount()
    }
  }
})

test('rows that are not a REPL row draw as before and take no card', async ($, on) => {
  engine(on)
  const plain = await $.ui.mount(row(inner('repl_a1')))
  expect(await hasCard(plain)).toBe(false)
  expect(await drawnText(plain)).toContain('ls -la')
  expect(await drawnText(plain)).not.toBe('engine')
  await plain.unmount()
  const open = await $.ui.mount(row({ ...inner('repl_a2'), isExpanded: true }))
  expect(await hasCard(open)).toBe(false)
  expect(await drawnText(open)).toContain('ls -la')
  await open.unmount()
  const read = await $.ui.mount(row(call('Read', { file_path: '/tmp/x', code: 'return 1' }, 'toolu_read')))
  expect(await hasCard(read)).toBe(false)
  await read.unmount()
  const grouped = await $.ui.mount(group([call('Read', { file_path: '/tmp/x' }, 'repl_g1'), call('Grep', { pattern: 'x' }, 'repl_g2')]))
  expect(await hasCard(grouped)).toBe(false)
  await grouped.unmount()
  const expanded = await $.ui.mount(group([call('Read', { file_path: '/tmp/x' }, 'repl_g3')], true))
  expect(await drawnText(expanded)).toBe('engine')
  await expanded.unmount()
})

test('a REPL row with no code yet draws only what Claude Code draws', async ($, on) => {
  engine(on)
  for (const input of [{}, { description: 'Count the files' }, { code: '' }, { code: '  \n ' }, { code: 42 }, '{"code": "const a', null]) {
    for (const isExpanded of [true, false]) {
      const ui = await $.ui.mount(row({ ...call('REPL', input, 'toolu_stream', { isRunning: true }), isExpanded }))
      expect(await drawnText(ui)).toBe('engine')
      await ui.unmount()
    }
  }
})

test('toolRows off leaves the REPL row to Claude Code', { options: { toolRows: false } }, async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(row(script('return 1')))
  expect(await drawnText(ui)).toBe('engine')
  await ui.unmount()
})

test('a script over 30 lines shows its first 30, opens on its toggle and folds back, on the terminal and the desktop', async ($, on) => {
  engine(on)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount(row(script(lines(42), {}, `toolu_long_${surface}`), surface))
    const text = async () => JSON.stringify(await ui.drawn())
    expect(await ui.find({ type: 'Text', text: /^Code · 42 lines$/ })).toBeDefined()
    expect(await text()).toContain('line 30')
    expect(await text()).not.toContain('line 31')
    expect((await ui.find({ key: 'fold' }))?.props).toMatchObject({ variant: 'secondary', label: '+12 more lines' })
    await ui.press({ key: 'fold' })
    expect(await text()).toContain('line 42')
    expect((await ui.find({ key: 'fold' }))?.props.label).toBe('show less')
    await ui.press({ key: 'fold' })
    expect(await text()).not.toContain('line 31')
    await ui.unmount()
  }
})

test('folds open starts a long script open', { options: { folds: 'open' } }, async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(row(script(lines(42), {}, 'toolu_open')))
  expect(JSON.stringify(await ui.drawn())).toContain('line 42')
  expect((await ui.find({ key: 'fold' }))?.props.label).toBe('show less')
  await ui.unmount()
})

test('a script of exactly 30 lines draws whole with no toggle', async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(row(script(lines(30), {}, 'toolu_30')))
  expect(JSON.stringify(await ui.drawn())).toContain('line 30')
  expect(await ui.find({ key: 'fold' })).toBeUndefined()
  await ui.unmount()
})

test('scriptStyle defaults to frame and falls back to frame on an unknown value, and is a setup step', () => {
  expect(resolveStyle({}).scriptStyle).toBe('frame')
  expect(resolveStyle({ scriptStyle: 'zigzag' }).scriptStyle).toBe('frame')
  for (const value of ['frame', 'rail', 'bar', 'chip']) expect(resolveStyle({ scriptStyle: value }).scriptStyle).toBe(value)
  expect(setupSteps([]).find(s => s.key === 'scriptStyle')?.options).toEqual(['frame', 'rail', 'bar', 'chip'])
})

test('scriptStyle frame draws a rounded border in the code border color with the title in its top line', async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(row(script('const a = 1\nreturn a')))
  const card = (await drawnText(ui)).split('engine')[0]!
  expect(card.startsWith('╭─ Code · 2 lines')).toBe(true)
  expect(card).toContain('─╮')
  expect(card).toContain('│ ')
  expect(card).toMatch(/╰─+╯$/)
  expect((await ui.find({ type: 'Text', text: /^╭─ $/ }))?.props.color).toBe((t as { codeBorder?: string }).codeBorder ?? t.accent)
  await ui.unmount()
})

test('scriptStyle rail draws a bar before the header and every line', { options: { scriptStyle: 'rail' } }, async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(row(script('const a = 1\nreturn a')))
  const bars = await ui.findAll({ type: 'Text', text: /^▌ $/ })
  expect(bars.length).toBe(3)
  expect(bars[0]?.props.color).toBe(t.accent)
  expect(await drawnText(ui)).not.toContain('╭')
  expect((await drawnText(ui)).endsWith('engine')).toBe(true)
  await ui.unmount()
})

test('scriptStyle bar says running, done or failed from the REPL row itself', { options: { scriptStyle: 'bar' } }, async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(row(script('return 1', { isRunning: true })))
  const strip = async () => (await ui.find({ type: 'Text', text: /^▶ Code · / }))?.text
  expect(await strip()).toBe('▶ Code · 1 line · running')
  expect((await ui.find({ type: 'Text', text: /^▶ Code · / }))?.props).toMatchObject({ inverse: true, color: t.accent })
  await ui.redraw(script('return 1'))
  expect(await strip()).toBe('▶ Code · 1 line · done')
  await ui.redraw(script('return 1', { isErrored: true }))
  expect(await strip()).toBe('▶ Code · 1 line · failed')
  await ui.redraw(script('return 1', { isInterrupted: true }))
  expect(await strip()).toBe('▶ Code · 1 line · failed')
  await ui.unmount()
})

test('scriptStyle chip draws one folded line that opens the script on a click', { options: { scriptStyle: 'chip' } }, async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(row(script('\nconst a = 1\nreturn a')))
  const text = (await drawnText(ui)).split('engine')[0]!
  expect(text).toBe('▸ Code · 3 lines · const a = 1 …')
  expect((await ui.findAll({ type: 'Button' })).some(b => b.props.label === '⧉ copy')).toBe(false)
  await ui.press({ key: 'chip' })
  const open = await drawnText(ui)
  expect(open.startsWith('▾ Code · 3 lines')).toBe(true)
  expect(open).toContain('return a')
  expect((await ui.findAll({ type: 'Button' })).some(b => b.props.label === '⧉ copy')).toBe(true)
  await ui.unmount()
})

test('scriptStyle chip cuts a first line of wide letters to the pane by display width', { options: { scriptStyle: 'chip' } }, async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(row(script(`const s = "${'漢字'.repeat(40)}"\nreturn s`), 'terminal', 60))
  const face = (await drawnText(ui)).split('engine')[0]!
  expect(face.endsWith('… …')).toBe(true)
  expect(width(face)).toBeLessThanOrEqual(58)
  expect(width(face)).toBeGreaterThan(50)
  await ui.unmount()
})

const WIDTH_CASES: [string, string, number][] = [
  ['code narrower than the title', 'x', 100],
  ['code wider than the title', '(await $`git branch --show-current`).stdout.trim()', 100],
  ['folded lines', lines(42), 100],
  ['wide letters', `const s = "${'漢字'.repeat(12)}"\nreturn s`, 100],
  ['lines longer than the pane', `const s = "${'x'.repeat(240)}"\nreturn s`, 100],
  ['a pane too narrow for the copy button', 'return 1', 30],
  ['a pane too narrow for the title', 'return 1', 22],
]

for (const options of [{}, { copyButtonStyle: 'inline' }, { copyButtonStyle: 'hover' }, { copyButtons: false }] as Record<string, string | boolean>[]) {
  test(`scriptStyle frame draws every line of its box the same width, ${JSON.stringify(options)}`, { options }, async ($, on) => {
    engine(on)
    for (const [name, code, columns] of WIDTH_CASES) {
      const ui = await $.ui.mount(row(script(code, {}, `toolu_w${columns}`), 'terminal', columns))
      const { wide, lines: drawn } = await frameOf(ui)
      expect({ name, widths: [...new Set(drawn.map(line => line.width))] }).toEqual({ name, widths: [wide] })
      expect(wide).toBeLessThanOrEqual(Math.max(20, columns - 4) - 2)
      expect(drawn[0]!.text.endsWith('─╮')).toBe(true)
      expect(drawn.at(-1)!.text).toMatch(/^╰─+╯$/)
      await ui.unmount()
    }
  })
}

test('scriptStyle frame counts a dim copy button as the label it draws', async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(row(script('(await $`git branch --show-current`).stdout.trim()')))
  const { wide, lines: drawn } = await frameOf(ui)
  expect(drawn[0]!.text).toBe(`╭─ Code · 1 line ${'─'.repeat(wide - 27)} ⧉ copy ─╮`)
  expect((await ui.find({ type: 'Button' }))?.props).toMatchObject({ plain: true, label: '⧉ copy' })
  await ui.unmount()
})

const blinking = { options: { toolStyle: 'classic', runningDot: 'blink' } }

test('runningDot blink counts running calls from row draws, up and down', blinking, async ($, on) => {
  engine(on)
  const clock = mock.clock(on)
  const a = call('Bash', { command: 'make a' }, 'up-a', { isRunning: true })
  const b = call('Bash', { command: 'make b' }, 'up-b', { isRunning: true })
  const rowA = await $.ui.mount(row(a))
  const rowB = await $.ui.mount(row(b))
  await clock.settle()
  const dot = async () => (await rowB.find({ type: 'Text', text: /^[●◌ ]$/ }))?.children?.[0]
  const seen = [await dot()]
  await clock.advance(500)
  seen.push(await dot())
  const doneA = await $.ui.mount(row({ ...a, isRunning: false }))
  for (let i = 0; i < 2; i++) {
    await clock.advance(500)
    seen.push(await dot())
  }
  expect(seen).toEqual(['●', ' ', '●', ' '])
  const doneB = await $.ui.mount(row({ ...b, isRunning: false }))
  for (let i = 0; i < 2; i++) {
    await clock.advance(500)
    seen.push(await dot())
  }
  expect(seen.slice(4)).toEqual(['●', '●'])
  for (const ui of [rowA, rowB, doneA, doneB]) await ui.unmount()
})

test('runningDot blink counts a live group\'s running calls too', blinking, async ($, on) => {
  engine(on)
  const clock = mock.clock(on)
  const live = call('Read', { file_path: '/tmp/x' }, 'grp-1', { isRunning: true })
  const group = await $.ui.mount({ plugin: 'prismantis', surface: 'terminal', component: 'ToolGroup', props: { calls: [live], isActive: true, isExpanded: false } })
  const witness = await $.ui.mount(row(live))
  await clock.settle()
  const dot = async () => (await witness.find({ type: 'Text', text: /^[●◌ ]$/ }))?.children?.[0]
  await clock.advance(500)
  expect(await dot()).toBe(' ')
  await group.redraw({ calls: [{ ...live, isRunning: false }], isActive: false, isExpanded: false })
  const seen: unknown[] = []
  for (let i = 0; i < 2; i++) {
    await clock.advance(500)
    seen.push(await dot())
  }
  expect(seen).toEqual(['●', '●'])
  await witness.unmount()
  await group.unmount()
})

test('turn.complete stops the blink of a call that never drew finished', blinking, async ($, on) => {
  engine(on)
  const clock = mock.clock(on)
  on('turn.complete', async (_$, e) => ({ text: e.answer }))
  const ui = await $.ui.mount(row(call('Bash', { command: 'make test' }, 'stuck-1', { isRunning: true })))
  await clock.settle()
  const dot = async () => (await ui.find({ type: 'Text', text: /^[●◌ ]$/ }))?.children?.[0]
  await clock.advance(500)
  expect(await dot()).toBe(' ')
  await $.turn.complete({ answer: 'done', durationMs: 1000, isAborted: true, turnId: 't1', reason: 'answer' })
  const seen: unknown[] = []
  for (let i = 0; i < 2; i++) {
    await clock.advance(500)
    seen.push(await dot())
  }
  expect(seen).toEqual(['●', '●'])
  await ui.unmount()
})
