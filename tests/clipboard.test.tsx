import { expect, mock, test } from 'claude-code/testing'

import { LINUX_TABLE_COPY, MAC_TABLE_COPY } from '../hooks/clipboard'
import { clipboardEnv, recordCopies, recordToasts, runResult, startSession } from './clipboard-env'

const source = '| Name | Value |\n|--|--:|\n| **שלום** | `$(ignored)` |'
const plain = 'Name\tValue\nשלום\t$(ignored)'
const mount = {
  plugin: 'prismantis',
  component: 'AssistantMessage' as const,
  props: { text: source, isFirstOfReply: true },
  viewport: { columns: 120, rows: 40 },
  surface: 'terminal' as const,
}

const backends = {
  macos: { platform: 'macos', env: {}, argv: ['/usr/bin/osascript', '-l', 'JavaScript', '-e', MAC_TABLE_COPY] },
  wayland: { platform: 'other', env: { WAYLAND_DISPLAY: 'wayland-0', DISPLAY: ':0' }, argv: ['copyq', 'eval', LINUX_TABLE_COPY, '-'] },
  x11: { platform: 'other', env: { DISPLAY: ':0' }, argv: ['copyq', 'eval', LINUX_TABLE_COPY, '-'] },
} as const

for (const [backend, setup] of Object.entries(backends)) test(`${backend} copies HTML and plain text together`, async ($, on) => {
  clipboardEnv(on, setup.platform, setup.env)
  const calls: { argv: readonly string[]; input: string }[] = []
  on('process.run', (_, e) => {
    calls.push({ argv: e.argv, input: e.init?.stdin ?? '' })
    return runResult(0)
  })
  const copies = recordCopies(on)
  const toasts = recordToasts(on)
  await startSession($, on)
  const ui = await $.ui.mount(mount)
  expect((await ui.findAll({ type: 'Button' })).map(button => button.props.label).filter(label => label !== '⧉ copy reply')).toEqual(['⧉ md', '⧉ art', '⧉ html'])
  expect(calls).toHaveLength(0)
  await ui.press({ key: 'html0' })
  expect(calls).toHaveLength(1)
  expect(calls[0]!.argv).toEqual(setup.argv)
  const payload = JSON.parse(calls[0]!.input)
  expect(payload.text).toBe(plain)
  expect(payload.html).toContain('<strong>שלום</strong>')
  expect(payload.html).toContain('<code style="white-space: pre-wrap">$(ignored)</code>')
  expect(copies).toHaveLength(0)
  expect(toasts).toEqual(['Copied formatted table'])
  await ui.unmount()
})

for (const failure of ['exit', 'refused'] as const) test(`native clipboard ${failure} falls back to plain text`, async ($, on) => {
  clipboardEnv(on, 'macos')
  on('process.run', () => failure === 'refused' ? { deny: 'Cannot start helper' } : runResult(1, 'Clipboard unavailable'))
  const copies = recordCopies(on)
  const toasts = recordToasts(on)
  await startSession($, on)
  const ui = await $.ui.mount(mount)
  await ui.press({ key: 'html0' })
  expect(toasts).toEqual([`Copied as plain text (${failure === 'exit' ? 'Clipboard unavailable' : 'macOS clipboard helper failed'})`])
  expect(copies).toEqual([plain])
  await ui.unmount()
})

for (const failure of ['missing', 'exit', 'timeout'] as const) test(`Linux clipboard ${failure} falls back to plain text`, async ($, on) => {
  clipboardEnv(on, 'other', { DISPLAY: ':0' })
  on('process.run', () => failure === 'timeout' ? { deny: 'Process timed out' } : runResult(failure === 'missing' ? 127 : 1))
  const copies = recordCopies(on)
  const toasts = recordToasts(on)
  await startSession($, on)
  const ui = await $.ui.mount(mount)
  await ui.press({ key: 'html0' })
  expect(copies).toEqual([plain])
  expect(toasts).toEqual(['Copied as plain text (CopyQ failed; install and start CopyQ in the graphical session)'])
  await ui.unmount()
})

const hidden = {
  'over SSH_CONNECTION': { platform: 'macos', env: { SSH_CONNECTION: 'remote connection' }, surface: 'terminal' },
  'over SSH_TTY': { platform: 'macos', env: { SSH_TTY: '/dev/ttys001' }, surface: 'terminal' },
  'over SSH with a forwarded display': { platform: 'other', env: { SSH_CONNECTION: 'remote connection', DISPLAY: 'localhost:10.0' }, surface: 'terminal' },
  'without a graphical session': { platform: 'other', env: {}, surface: 'terminal' },
  'on desktop': { platform: 'macos', env: {}, surface: 'desktop' },
  'on desktop in Linux': { platform: 'other', env: { WAYLAND_DISPLAY: 'wayland-0' }, surface: 'desktop' },
} as const

for (const [where, setup] of Object.entries(hidden)) test(`the HTML action is hidden ${where}`, async ($, on) => {
  clipboardEnv(on, setup.platform, setup.env)
  let processes = 0
  on('process.run', () => {
    processes++
    return { deny: 'Must not run the native helper' }
  })
  const copies = recordCopies(on)
  await startSession($, on)
  const ui = await $.ui.mount({ ...mount, surface: setup.surface })
  expect((await ui.findAll({ type: 'Button' })).map(button => button.props.label).filter(label => label !== '⧉ copy reply')).toEqual(['⧉ md', '⧉ art'])
  await ui.press({ key: 'copy0' })
  expect(copies).toEqual([source])
  expect(processes).toBe(0)
  await ui.unmount()
})

test('the HTML check runs once, on session start or on the first prompt after a reload', async ($, on) => {
  let checks = 0
  mock.env(on, {})
  on('fs.stat', (_, e, next) => {
    if (!e.path.replace(/\\/g, '/').endsWith('/usr/bin/osascript')) return next(e)
    checks++
    return { value: { kind: 'file' as const, size: 0, mtimeMs: 0, isLink: false } }
  })
  on('prompt.submit', (_, e) => ({ text: e.text, context: e.context }))
  on('session.start', () => ({ cwd: '/tmp' }))
  const before = await $.ui.mount(mount)
  expect((await before.findAll({ type: 'Button' })).map(button => button.props.label).filter(label => label !== '⧉ copy reply')).toEqual(['⧉ md', '⧉ art'])
  await before.unmount()
  await $.prompt.submit({ text: 'hi', wait: false, origin: { kind: 'composer' } })
  await $.prompt.submit({ text: 'again', wait: false, origin: { kind: 'composer' } })
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  const after = await $.ui.mount(mount)
  expect((await after.findAll({ type: 'Button' })).map(button => button.props.label).filter(label => label !== '⧉ copy reply')).toEqual(['⧉ md', '⧉ art', '⧉ html'])
  expect(checks).toBe(1)
  await after.unmount()
})

for (const key of ['copy0', 'html0']) for (const failure of ['unavailable', 'refused'] as const) test(`${key} reports a ${failure} surface clipboard`, async ($, on) => {
  clipboardEnv(on, 'macos')
  on('process.run', () => runResult(1))
  on('ui.copy', () => failure === 'refused'
    ? { deny: 'Clipboard denied' }
    : { value: { isCopied: false as const, reason: 'no-clipboard' as const } })
  const toasts = recordToasts(on)
  await startSession($, on)
  const ui = await $.ui.mount(mount)
  await ui.press({ key })
  expect(toasts).toEqual([failure === 'refused' ? 'Copy failed' : 'Copy failed: no-clipboard'])
  await ui.unmount()
})
