import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import { diagramSvg, fitDiagram } from '../hooks/mermaid-image'
import { resolveStyle } from '../hooks/theme'

const SOURCE = 'flowchart LR\n A[Start] --> B[Done]'
const reply = (source = SOURCE, columns = 100) => ({ plugin: 'prismantis', component: 'AssistantMessage' as const, props: { text: `\`\`\`mermaid\n${source}\n\`\`\``, isFirstOfReply: true }, viewport: { columns, rows: 40 }, surface: 'terminal' as const })
const ITERM = { TERM_PROGRAM: 'iTerm.app', TERM: 'xterm-256color', TMPDIR: '/tmp/' }

const PNGS: Record<string, string> = {
  '496x224': 'iVBORw0KGgoAAAANSUhEUgAAAfAAAADgAQAAAADUdglkAAAAJUlEQVR4nO3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAADgzwA3IAAB4tETBwAAAABJRU5ErkJggg==',
  '288x160': 'iVBORw0KGgoAAAANSUhEUgAAASAAAACgAQAAAACEP4xBAAAAHElEQVR4nO3BAQEAAACCIP+vbkhAAQAAAADAnwEXIAABxaxvyQAAAABJRU5ErkJggg==',
}

const renderer = (on: On, exitCode = 0, hold?: Promise<void>, invalid = false) => {
  const runs: { argv: readonly string[]; svg: string; timeout?: number }[] = []
  on('process.run', async (_, e) => {
    runs.push({ argv: e.argv, svg: e.init?.stdin ?? '', timeout: e.init?.timeoutMs })
    await hold
    return { value: { exitCode, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('fs.read', (_, e) => {
    const run = runs.at(-1)!
    expect(e.path).toBe(run.argv[run.argv.indexOf('--output') + 1])
    const size = / width="(\d+)" height="(\d+)"/.exec(run.svg)!
    return { value: { base64: invalid ? btoa('invalid PNG') : PNGS[`${size[1]}x${size[2]}`]! } }
  })
  return runs
}

for (const [terminal, env] of [['iTerm2', ITERM], ['kitty', { TERM: 'xterm-kitty' }], ['Ghostty', { TERM_PROGRAM: 'ghostty' }]] as const) {
  for (const surface of ['terminal', 'desktop'] as const) {
    test(`Mermaid images detect ${terminal} on ${surface}`, async ($, on) => {
      mock.env(on, env)
      const clock = mock.clock(on)
      const runs = renderer(on)
      const ui = await $.ui.mount({ ...reply(), surface })
      await clock.settle()
      const picture = await ui.find({ type: 'Image' })
      if (surface === 'terminal') {
        expect(picture?.props.alt).toBe(SOURCE)
        expect(runs).toHaveLength(1)
        expect(runs[0]?.argv[0]).toBe('rsvg-convert')
        expect(runs[0]?.timeout).toBe(5000)
        expect(runs[0]?.svg).toContain('<svg')
      } else {
        expect(picture).toBeUndefined()
        expect(runs).toHaveLength(0)
      }
      await ui.unmount()
    })
  }
}

for (const key of ['mermaidImages', 'mermaid'] as const) {
  test(`Mermaid images respect ${key}`, { options: { [key]: false } }, async ($, on) => {
    mock.env(on, ITERM)
    const clock = mock.clock(on)
    const runs = renderer(on)
    const ui = await $.ui.mount(reply())
    await clock.settle()
    expect(await ui.find({ type: 'Image' })).toBeUndefined()
    expect(runs).toHaveLength(0)
    await ui.unmount()
  })
}

for (const [name, env] of [['unsupported terminal', { TERM_PROGRAM: 'Apple_Terminal' }], ['tmux', { ...ITERM, TMUX: '/tmp/tmux' }], ['unknown terminal', {}]] as const) {
  test(`Mermaid images skip ${name}`, async ($, on) => {
    mock.env(on, env)
    const clock = mock.clock(on)
    const runs = renderer(on)
    const ui = await $.ui.mount(reply())
    await clock.settle()
    expect(runs).toHaveLength(0)
    expect(await ui.find({ type: 'Image' })).toBeUndefined()
    await ui.unmount()
  })
}

test('Mermaid draws text while the PNG is pending, then redraws and copies its source', async ($, on) => {
  mock.env(on, ITERM)
  const clock = mock.clock(on)
  let release = () => {}
  const hold = new Promise<void>(resolve => (release = resolve))
  renderer(on, 0, hold)
  const copied: string[] = []
  on('ui.copy', (_, e) => { copied.push(e.text); return { value: { isCopied: true as const } } })
  const ui = await $.ui.mount(reply())
  expect(await ui.find({ type: 'Image' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /Start/ })).toBeDefined()
  release()
  await clock.settle()
  expect(await ui.find({ type: 'Image' })).toBeDefined()
  const button = (await ui.findAll({ type: 'Button' })).find(b => b.props.label === '⧉ copy')
  await ui.press({ key: String(button?.key) })
  expect(copied).toEqual([SOURCE])
  await ui.unmount()
})

test('identical diagrams share a conversion and a resize gets a fitted image', async ($, on) => {
  mock.env(on, ITERM)
  const clock = mock.clock(on)
  const runs = renderer(on)
  const first = await $.ui.mount(reply())
  const second = await $.ui.mount(reply())
  await clock.settle()
  expect(runs).toHaveLength(1)
  expect(await second.find({ type: 'Image' })).toBeDefined()
  const narrow = await $.ui.mount(reply(SOURCE, 24))
  await clock.settle()
  expect(runs).toHaveLength(2)
  expect(Number((await narrow.find({ type: 'Image' }))?.props.columns) <= 18).toBe(true)
  await first.unmount()
  await second.unmount()
  await narrow.unmount()
})

for (const [name, code, invalid] of [['missing renderer', 127, false], ['failed conversion', 1, false], ['invalid PNG', 0, true]] as const) {
  test(`Mermaid keeps text after ${name} without retrying on redraw`, async ($, on) => {
    mock.env(on, ITERM)
    const clock = mock.clock(on)
    const runs = renderer(on, code, undefined, invalid)
    const ui = await $.ui.mount(reply())
    await clock.settle()
    const again = await $.ui.mount(reply())
    await clock.settle()
    expect(runs).toHaveLength(1)
    expect(await ui.find({ type: 'Image' })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /Start/ })).toBeDefined()
    await ui.unmount()
    await again.unmount()
  })
}

test('Mermaid skips incomplete, unsupported and oversized diagrams', async ($, on) => {
  mock.env(on, ITERM)
  const clock = mock.clock(on)
  const runs = renderer(on)
  for (const text of ['```mermaid\nflowchart LR\nA --> B', '```mermaid\npie\n"A" : 5\n```', `\`\`\`mermaid\ngraph TD\nA[${'x'.repeat(8000)}]\n\`\`\``]) {
    const ui = await $.ui.mount({ ...reply(), props: { text, isFirstOfReply: true } })
    await clock.settle()
    expect(await ui.find({ type: 'Image' })).toBeUndefined()
    await ui.unmount()
  }
  expect(runs).toHaveLength(0)
})

for (const source of [SOURCE, 'stateDiagram-v2\n[*] --> Ready\nReady --> [*]', 'sequenceDiagram\nAlice->>Bob: Hello', 'classDiagram\nAnimal <|-- Dog\nAnimal : +int age', 'erDiagram\nCUSTOMER ||--o{ ORDER : places', 'xychart-beta\nx-axis [Jan, Feb]\nbar [3, 5]']) {
  test(`SVG renders ${source.split('\n')[0]} in the mod sandbox`, () => {
    const svg = diagramSvg(source, { diagramText: '#112233', diagram: '#445566', accent: '#778899' })
    expect(svg).toContain('<svg')
    expect(svg).toContain('#112233')
    expect(svg?.includes('var(')).toBe(false)
    expect(svg?.includes('@import')).toBe(false)
    expect(fitDiagram(svg!, 40)?.columns! <= 38).toBe(true)
    expect(fitDiagram(svg!, 40)?.rows! <= 48).toBe(true)
  })
}

test('SVG rejects external paint references and keys theme colors separately', () => {
  expect(diagramSvg('graph TD\nA --> B\nstyle A fill:url(file:///tmp/private.svg)', {})).toBeNull()
  const first = diagramSvg(SOURCE, { diagramText: '#112233' })
  const second = diagramSvg(SOURCE, { diagramText: '#aabbcc' })
  expect(first).toContain('#112233')
  expect(second).toContain('#aabbcc')
})

test('Mermaid image options default to auto and reject a false-like string safely', () => {
  expect(resolveStyle({}).mermaidImages).toBe(true)
  expect(resolveStyle({ mermaidImages: false }).mermaidImages).toBe(false)
  expect(resolveStyle({ mermaidImages: 'false' }).mermaidImages).toBe(true)
})


test('chart SVG retains static series and label styles for librsvg', () => {
  const svg = diagramSvg('xychart-beta\nx-axis [Jan, Feb]\nbar [3, 5]\nline [2, 4]', { diagramText: '#112233', accent: '#778899' })!
  expect(svg).toContain('.xychart-bar')
  expect(svg).toContain('.xychart-label { fill: #112233; }')
  expect(svg).toContain('stroke: #778899')
  expect(svg.includes('var(')).toBe(false)
  expect(svg.includes('color-mix(')).toBe(false)
})

test('Mermaid keeps text after a thrown renderer timeout and stops retrying', async ($, on) => {
  mock.env(on, ITERM)
  const clock = mock.clock(on)
  let runs = 0
  on('process.run', () => { runs++; throw new Error('timeout') })
  const first = await $.ui.mount(reply())
  await clock.settle()
  const second = await $.ui.mount(reply('graph TD\nA --> B'))
  await clock.settle()
  expect(runs).toBe(1)
  expect(await first.find({ type: 'Image' })).toBeUndefined()
  expect(await first.find({ type: 'Text', text: /Start/ })).toBeDefined()
  await first.unmount()
  await second.unmount()
})
