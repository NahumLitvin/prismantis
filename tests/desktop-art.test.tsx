import { expect, test } from 'claude-code/testing'

import { artPicture } from '../hooks/clipboard'
import { takesMonoText } from '../hooks/render'
import { artSvg } from '../hooks/svg'
import { claudeAt } from './claude-version'

const ART = {
  diagram: '```mermaid\nflowchart LR\n    A[Reply] --> B[Draw]\n```',
  figure: '```figure\n┌──────┐\n│ cell │\n└──────┘\n```',
}

const reply = (text: string, surface: 'terminal' | 'desktop' | 'vscode') => ({
  plugin: 'prismantis',
  surface,
  component: 'AssistantMessage' as const,
  props: { text, isFirstOfReply: true },
  viewport: { columns: 100, rows: 40 },
})

const artRows = async (ui: { findAll: (q: { type: 'Text' }) => Promise<{ text: string; props: Record<string, unknown> }[]> }) =>
  (await ui.findAll({ type: 'Text' })).filter(t => t.props.color === undefined && /[┌└│]/.test(t.text) && !t.text.includes('\n'))

for (const [kind, source] of Object.entries(ART)) {
  test(`a ${kind} on desktop from Claude Code 2.1.299 draws its rows in the monospaced face; older engines refuse the prop`, async ($, on) => {
    claudeAt(on, '2.1.299')
    const mounting = $.ui.mount(reply(source, 'desktop'))
    const refused = await mounting.then(() => '', (error: unknown) => String(error))
    if (refused) {
      expect(refused).toMatch(/Text prop "mono" is not allowed/)
      return
    }
    const ui = await mounting
    const rows = await artRows(ui)
    expect(rows.length).toBeGreaterThan(1)
    expect(rows.every(t => t.props.mono === true)).toBe(true)
    await ui.unmount()
  })

  for (const [surface, base] of [['desktop', '2.1.296'], ['terminal', '2.1.299']] as const) test(`a ${kind} on ${surface} with Claude Code ${base} keeps the face of the reply`, async ($, on) => {
    claudeAt(on, base)
    const ui = await $.ui.mount(reply(source, surface))
    const rows = await artRows(ui)
    expect(rows.length).toBeGreaterThan(1)
    expect(rows.every(t => t.props.mono === undefined)).toBe(true)
    await ui.unmount()
  })
}

test('the monospaced face starts at Claude Code 2.1.299', () => {
  const versions = ['2.1.287', '2.1.296', '2.1.299', '2.1.300-dev', '2.2.0', '1.9.999', 'dev', undefined]
  expect(versions.map(takesMonoText)).toEqual([false, false, true, true, true, false, false, false])
})

for (const [surface, base, note] of [['terminal', '2.1.299', undefined], ['desktop', '2.1.299', 'figure is 100 cols, 84 fit'], ['desktop', '2.1.296', undefined]] as const) test(`a 100 column figure in a 110 column viewport on ${surface} with Claude Code ${base} ${note ? 'stays code, since the monospaced face fits fewer cells' : 'draws'}`, async ($, on) => {
  claudeAt(on, base)
  const ui = await $.ui.mount({ ...reply(`\`\`\`figure\n{accent:${'─'.repeat(100)}}\n\`\`\``, surface), viewport: { columns: 110, rows: 40 } })
  expect((await ui.find({ type: 'Text', text: /^figure is \d+ cols, \d+ fit$/ }))?.text).toBe(note)
  await ui.unmount()
})

for (const [kind, source] of Object.entries(ART)) for (const surface of ['terminal', 'desktop', 'vscode'] as const) test(`a ${kind} on ${surface} ${surface === 'vscode' ? 'draws as one picture in a monospaced face, its glyphs pinned to their columns' : 'draws its rows as text'}`, async ($, on) => {
  claudeAt(on, '2.1.296')
  const ui = await $.ui.mount(reply(source, surface))
  const pictures = await ui.findAll({ type: 'Svg' })
  if (surface === 'vscode') {
    expect(pictures).toHaveLength(1)
    const svg = String(pictures[0]!.props.source)
    expect(svg).toMatch(/^<svg [^>]*font-family="[^"]*monospace"/)
    expect(String(pictures[0]!.props.alt)).toMatch(/[┌│└]/)
    expect(await artRows(ui)).toHaveLength(0)
  } else {
    expect(pictures).toHaveLength(0)
    expect((await artRows(ui)).length).toBeGreaterThan(1)
  }
  await ui.unmount()
})

test('the VS Code picture of art pins each glyph to its column and draws a run of blocks as one rect', () => {
  const svg = artSvg(artPicture('███ x\n│ │', { foreground: '#ffffff', background: '#000000' }))
  expect(svg.match(/<rect /g)).toHaveLength(2)
  expect(svg).toContain('<text x="30" y="16" fill="#ffffff">x</text>')
  expect(svg).toContain('<text x="6 18" y="28" fill="#ffffff">││</text>')
})

for (const surface of ['terminal', 'desktop', 'vscode'] as const) test(`two diagrams in a row on ${surface} ${surface === 'vscode' ? 'shrink to the reply, since their pictures scale' : 'keep the width their art is drawn at'}`, async ($, on) => {
  claudeAt(on, '2.1.296')
  const ui = await $.ui.mount(reply(`${ART.diagram}\n\n${ART.diagram}`, surface))
  const shrink = surface === 'vscode' ? 1 : 0
  expect([(await ui.find({ key: 'f0' }))?.props.flexShrink, (await ui.find({ key: 'f1' }))?.props.flexShrink]).toEqual([shrink, shrink])
  await ui.unmount()
})
