import { expect, test } from 'claude-code/testing'

import { claudeAt, withMono } from './claude-version'
import { topEdgeWidth } from './table-edge'

const mount = (text: string, surface: 'terminal' | 'desktop') => ({
  plugin: 'prismantis',
  surface,
  component: 'AssistantMessage' as const,
  props: { text, isFirstOfReply: true },
  viewport: { columns: 153, rows: 54 },
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface} draws the borders and rules that depend on cell width in the monospaced face on desktop only`, { options: { tableStyle: 'box' } }, async ($, on) => {
    claudeAt(on, '2.1.299')
    const ui = await withMono($.ui.mount(mount('| a | b |\n|---|---|\n| x | y |\n\n---\n\ntext after', surface)))
    if (!ui) return
    const lines = (await ui.findAll({ type: 'Text' })).filter(t => /^[┌├└╞]/.test(t.text) || /^─+$/.test(t.text))
    expect(lines.length).toBeGreaterThanOrEqual(4)
    for (const line of lines) {
      expect(line.props.mono === true).toBe(surface === 'desktop')
      expect(line.props.size).toBeUndefined()
    }
    expect((await ui.find({ type: 'Text', text: /text after/ }))?.props.mono).toBeUndefined()
    await ui.unmount()
  })
}

for (const [surface, room] of [['terminal', 149], ['desktop', 124]] as const) {
  test(`${surface} lays a wide table out to the room its cells really have`, { options: { tableStyle: 'box' } }, async ($, on) => {
    claudeAt(on, '2.1.299')
    const long = 'word '.repeat(60).trim()
    const ui = await withMono($.ui.mount(mount(`| a | b |\n|---|---|\n| ${long} | ${long} |`, surface)))
    if (!ui) return
    expect(await topEdgeWidth(ui, 2)).toBe(room)
    await ui.unmount()
  })
}

for (const version of ['2.1.287', '2.1.296']) {
  test(`desktop on Claude Code ${version}, which refuses the mono prop, draws tables as before`, { options: { tableStyle: 'box' } }, async ($, on) => {
    claudeAt(on, version)
    const long = 'word '.repeat(60).trim()
    const ui = await $.ui.mount(mount(`| a | b |
|---|---|
| ${long} | ${long} |

---`, 'desktop'))
    expect((await ui.findAll({ type: 'Text' })).some(t => t.props.mono !== undefined)).toBe(false)
    expect(await topEdgeWidth(ui, 2)).toBe(149)
    await ui.unmount()
  })
}

test('a box table on desktop costs under two and a half times the nodes it costs on a terminal', { options: { tableStyle: 'box' } }, async ($, on) => {
  claudeAt(on, '2.1.299')
  const rows = Array.from({ length: 50 }, (_, i) => `| ${i} | svc-${i} | us-east | ${i * 3} | ${i % 90}ms |`).join('\n')
  const text = `| id | service | region | pods | p95 |\n|---|---|---|---|---|\n${rows}`
  const nodes = async (surface: 'terminal' | 'desktop') => {
    const ui = await withMono($.ui.mount(mount(text, surface)))
    if (!ui) return undefined
    const total = (await ui.findAll({ type: 'Box' })).length + (await ui.findAll({ type: 'Text' })).length
    await ui.unmount()
    return total
  }
  const terminal = await nodes('terminal')
  const desktop = await nodes('desktop')
  if (desktop === undefined) return
  expect(desktop).toBeLessThan(terminal! * 2.5)
})
