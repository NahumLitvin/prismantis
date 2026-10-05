import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { MAC_TABLE_COPY } from '../hooks/html'

const source = '| Name | Value |\n|--|--:|\n| **שלום** | `$(ignored)` |'
const mount = {
  plugin: 'prismantis',
  component: 'AssistantMessage' as const,
  props: { text: source, isFirstOfReply: true },
  viewport: { columns: 120, rows: 40 },
  surface: 'terminal' as const,
}

const nativeClipboard = (on: On) => {
  mock.env(on, {})
  on('fs.stat', (_, e, next) => e.path === '/usr/bin/osascript'
    ? { value: { kind: 'file' as const, size: 0, mtimeMs: 0, isLink: false } }
    : next(e))
}

test('HTML copying on macOS writes HTML and plain text through the native helper', async ($, on) => {
  nativeClipboard(on)
  const calls: { argv: readonly string[]; input: string }[] = []
  const plainCopies: string[] = []
  on('process.run', (_, e) => {
    calls.push({ argv: e.argv, input: e.init?.stdin ?? '' })
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('ui.copy', (_, e) => {
    plainCopies.push(e.text)
    return { value: { isCopied: true as const } }
  })
  const ui = await $.ui.mount(mount)
  expect(calls).toHaveLength(0)
  await ui.press({ key: 'html0' })
  expect(calls).toHaveLength(1)
  expect(calls[0]!.argv).toEqual(['/usr/bin/osascript', '-l', 'JavaScript', '-e', MAC_TABLE_COPY])
  const payload = JSON.parse(calls[0]!.input)
  expect(payload.text).toBe('Name\tValue\nשלום\t$(ignored)')
  expect(payload.html).toContain('<strong>שלום</strong>')
  expect(payload.html).toContain('<code>$(ignored)</code>')
  expect(plainCopies).toHaveLength(0)
  await ui.unmount()
})

for (const failure of ['exit', 'refused'] as const) test(`native clipboard ${failure} copies table cells and explains the failure`, async ($, on) => {
  nativeClipboard(on)
  const toasts: string[] = []
  const copies: string[] = []
  on('process.run', () => {
    if (failure === 'refused') return { deny: 'Cannot start helper' }
    return { value: { exitCode: 1, stdout: '', stderr: 'Clipboard unavailable', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('ui.copy', (_, e) => {
    copies.push(e.text)
    return { value: { isCopied: true as const } }
  })
  const ui = await $.ui.mount(mount)
  await ui.press({ key: 'html0' })
  expect(toasts).toHaveLength(1)
  expect(toasts[0]).toContain('Copied tab-separated cells;')
  expect(toasts[0]).toContain(failure === 'exit' ? 'Clipboard unavailable' : 'Cannot start helper')
  expect(copies).toEqual(['Name\tValue\nשלום\t$(ignored)'])
  await ui.unmount()
})

test('SSH table copying uses tab-separated cells on the surface clipboard', async ($, on) => {
  mock.env(on, { SSH_CONNECTION: 'remote connection' })
  const copies: string[] = []
  const toasts: string[] = []
  let nativeCalls = 0
  on('process.run', () => {
    nativeCalls++
    return { deny: 'Must not write the remote host clipboard' }
  })
  on('ui.copy', (_, e) => {
    copies.push(e.text)
    return { value: { isCopied: true as const } }
  })
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  const ui = await $.ui.mount(mount)
  await ui.press({ key: 'html0' })
  expect(nativeCalls).toBe(0)
  expect(copies).toEqual(['Name\tValue\nשלום\t$(ignored)'])
  expect(toasts).toEqual(['Copied tab-separated cells; rich copying requires a local macOS terminal'])
  await ui.unmount()
})
