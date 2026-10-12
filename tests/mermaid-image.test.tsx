import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import { mermaidText } from '../hooks/mermaid'
import { diagramSvg, fitDiagram } from '../hooks/mermaid-image'
import { resolveStyle } from '../hooks/theme'

const SOURCE = 'flowchart LR\n A[Start] --> B[Build] --> C[Done]'
const reply = (source = SOURCE, columns = 100) => ({ plugin: 'prismantis', component: 'AssistantMessage' as const, props: { text: `\`\`\`mermaid\n${source}\n\`\`\``, isFirstOfReply: true }, viewport: { columns, rows: 40 }, surface: 'terminal' as const })
const KITTY = { TERM: 'xterm-kitty', TMPDIR: '/tmp/' }
const ITERM = { TERM_PROGRAM: 'iTerm.app', TERM: 'xterm-256color', TMPDIR: '/tmp/' }

const PNGS: Record<string, string> = {
  '432x96': 'iVBORw0KGgoAAAANSUhEUgAAAbAAAABgAQAAAABUfBocAAAAHElEQVR42u3BMQEAAADCoPVPbQwfoAAAAAAAPgYUoAABNSSQwQAAAABJRU5ErkJggg==',
  '288x64': 'iVBORw0KGgoAAAANSUhEUgAAASAAAABAAQAAAACSe5fDAAAAGUlEQVR42u3BMQEAAADCoPVPbQZ/oAAAeAwJQAABsSzkgQAAAABJRU5ErkJggg==',
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

for (const [terminal, env] of [['kitty', KITTY], ['Ghostty', { TERM_PROGRAM: 'ghostty' }], ['iTerm2 3.7.3', { ...ITERM, TERM_PROGRAM_VERSION: '3.7.3' }], ['iTerm2 3.10.0', { ...ITERM, TERM_PROGRAM_VERSION: '3.10.0' }]] as const) {
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
    mock.env(on, KITTY)
    const clock = mock.clock(on)
    const runs = renderer(on)
    const ui = await $.ui.mount(reply())
    await clock.settle()
    expect(await ui.find({ type: 'Image' })).toBeUndefined()
    expect(runs).toHaveLength(0)
    await ui.unmount()
  })
}

for (const [name, env] of [['unsupported terminal', { TERM_PROGRAM: 'Apple_Terminal' }], ['iTerm2 3.6.10', { ...ITERM, TERM_PROGRAM_VERSION: '3.6.10' }], ['iTerm2 3.7.2', { ...ITERM, TERM_PROGRAM_VERSION: '3.7.2' }], ['iTerm2 without a version', ITERM], ['tmux', { ...KITTY, TMUX: '/tmp/tmux' }], ['unknown terminal', {}]] as const) {
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
  mock.env(on, KITTY)
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

const DRAWS_ALT = 'the Image draws its alt here: the terminal draws no placeholder images (probe: graphics reply OK, terminal kitty 0.27.1)'

test('Mermaid falls back to text and stops converting when the terminal draws the alt', async ($, on) => {
  mock.env(on, KITTY)
  const clock = mock.clock(on)
  const runs = renderer(on)
  const blits: string[] = []
  on('ui.blit', (_, e) => {
    blits.push(e.key)
    return { value: { deny: DRAWS_ALT } }
  })
  const ui = await $.ui.mount(reply())
  await clock.settle()
  expect(blits).toEqual(['b0'])
  expect(await ui.find({ type: 'Image' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /Start/ })).toBeDefined()
  const next = await $.ui.mount(reply('graph TD\nA --> B'))
  await clock.settle()
  expect(runs).toHaveLength(1)
  expect(blits).toHaveLength(1)
  expect(await next.find({ type: 'Image' })).toBeUndefined()
  await ui.unmount()
  await next.unmount()
})

test('Mermaid keeps images once one draws, retrying while it mounts and while the terminal is unasked', async ($, on) => {
  mock.env(on, KITTY)
  const clock = mock.clock(on)
  renderer(on)
  const answers = ['nothing of this plugin is mounted there', 'the Image draws its alt here: the terminal draws no placeholder images (env: TERM=xterm-kitty, not asked yet)']
  let blits = 0
  on('ui.blit', () => {
    blits++
    const deny = answers.shift()
    return { value: deny ? { deny } : {} }
  })
  const ui = await $.ui.mount(reply())
  await clock.settle()
  await clock.advance(200)
  const next = await $.ui.mount(reply(SOURCE, 24))
  await clock.settle()
  expect(blits).toBe(3)
  expect(await ui.find({ type: 'Image' })).toBeDefined()
  expect(await next.find({ type: 'Image' })).toBeDefined()
  await ui.unmount()
  await next.unmount()
})

test('back-to-back diagram images share a wrapping row', async ($, on) => {
  mock.env(on, KITTY)
  const clock = mock.clock(on)
  renderer(on)
  const text = `\`\`\`mermaid\n${SOURCE}\n\`\`\`\n\n\`\`\`mermaid\n${SOURCE}\n\`\`\`\n\nAfter.`
  const ui = await $.ui.mount({ ...reply(), props: { text, isFirstOfReply: true } })
  await clock.settle()
  expect(await ui.findAll({ type: 'Image' })).toHaveLength(2)
  const rows = (await ui.findAll({ type: 'Box' })).filter(b => b.props.flexWrap === 'wrap')
  expect(rows).toHaveLength(1)
  expect(rows[0]?.text).not.toContain('After.')
  await ui.unmount()
})

test('identical diagrams share a conversion and a resize gets a fitted image', async ($, on) => {
  mock.env(on, KITTY)
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
    mock.env(on, KITTY)
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
  mock.env(on, KITTY)
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

for (const source of ['flowchart LR\n A[checkout] --> B[install]\n B --> C[lint]\n B --> D[test]\n B --> E[build]\n C --> F[package]\n D --> F\n E --> F\n F --> G[deploy]', 'flowchart TD\n A[Request] --> B{Cached?}\n B -->|Yes| C[Reply]\n B -->|No| D[Fetch upstream]\n D --> C', 'sequenceDiagram\n P->>C: Image (PNG)\n C->>T: kitty graphics\n T-->>C: draws image\n P->>C: blit check\n C-->>P: ok or deny', 'xychart-beta\n title "Test count"\n x-axis [main, branch, gate]\n bar [345, 345, 349]']) {
  test(`${source.split('\n')[0]} images take about as many rows as the text diagram`, () => {
    const image = fitDiagram(diagramSvg(source, {})!, 160)!
    const text = mermaidText(source, false, 160)!.split('\n').length
    expect(image.rows <= text + 2).toBe(true)
  })
}

const PALETTE = { link: '#111111', number: '#222222', heading: '#333333', emphasis: '#444444', quote: '#555555', diagram: '#999999', diagramText: '#eeeeee' }
const group = (svg: string, label: string) => new RegExp(`<g class="(?:node|actor)"[^>]*data-label="${label}"[\\s\\S]*?</g>`).exec(svg)?.[0] ?? ''

for (const source of ['flowchart LR\n A[one] --> B[two]\n B --> C[one]', 'sequenceDiagram\n participant A as one\n participant B as two\n A->>B: hi']) {
  test(`${source.split('\n')[0]} images give each label its own theme color in reading order`, () => {
    const svg = diagramSvg(source, PALETTE)!
    for (const [label, hue] of [['one', '#111111'], ['two', '#222222']] as const) {
      expect(group(svg, label)).toContain(`stroke="${hue}"`)
      expect(group(svg, label)).toMatch(new RegExp(`<text[^>]*fill="${hue}"`))
    }
    expect(svg).toContain('stroke="#999999"')
  })
}

test('a single bar series highlights its tallest bar and colors the axis numbers', () => {
  const svg = diagramSvg('xychart-beta\n x-axis [a, b, c]\n bar [1, 3, 2]', PALETTE)!
  expect(svg).toMatch(/data-value="3" style="fill:#444444;stroke:#444444"/)
  expect(svg).toMatch(/data-value="1" style="fill:#555555;stroke:#555555"/)
  expect(svg).toMatch(/style="fill:#222222">3<\/text>/)
  const series = diagramSvg('xychart-beta\n x-axis [a, b]\n bar [1, 3]\n bar [2, 2]', PALETTE)!
  expect(series).not.toContain('style="fill:#444444')
  expect(series).toContain('.xychart-bar.xychart-color-1 { stroke: #222222')
})

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
  mock.env(on, KITTY)
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
