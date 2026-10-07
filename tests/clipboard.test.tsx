import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { LINUX_TABLE_COPY, MAC_TABLE_COPY } from '../hooks/clipboard'
import { clipboardEnv } from './clipboard-env'

const source = '| Name | Value |\n|--|--:|\n| **שלום** | `$(ignored)` |'
const plain = 'Name\tValue\nשלום\t$(ignored)'
const mount = {
  plugin: 'prismantis',
  component: 'AssistantMessage' as const,
  props: { text: source, isFirstOfReply: true },
  viewport: { columns: 120, rows: 40 },
  surface: 'terminal' as const,
}

const nativeClipboard = (on: On) => clipboardEnv(on, 'macos')

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
  expect(payload.text).toBe(plain)
  expect(payload.html).toContain('<strong>שלום</strong>')
  expect(payload.html).toContain('<code style="white-space: pre-wrap">$(ignored)</code>')
  expect(plainCopies).toHaveLength(0)
  await ui.unmount()
})

for (const failure of ['exit', 'refused'] as const) test(`native clipboard ${failure} falls back to plain text`, async ($, on) => {
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
  expect(toasts).toEqual([`Copied as plain text (${failure === 'exit' ? 'Clipboard unavailable' : 'macOS clipboard helper failed'})`])
  expect(copies).toEqual([plain])
  await ui.unmount()
})

for (const variable of ['SSH_CONNECTION', 'SSH_TTY']) test(`${variable} formatted copying falls back to plain text`, async ($, on) => {
  mock.env(on, { [variable]: 'remote connection' })
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
  expect(copies).toEqual([plain])
  expect(toasts).toEqual(['Copied as plain text (HTML needs a local macOS or Linux graphical session)'])
  await ui.unmount()
})

test('desktop table copying copies plain text without the native helper even on macOS', async ($, on) => {
  nativeClipboard(on)
  const surfaces: (string | undefined)[] = []
  let nativeCalls = 0
  on('process.run', () => {
    nativeCalls++
    return { deny: 'Must use the surface clipboard' }
  })
  on('ui.copy', (_, e) => {
    surfaces.push(e.surface)
    expect(e.text).toBe(plain)
    return { value: { isCopied: true as const } }
  })
  const ui = await $.ui.mount({ ...mount, surface: 'desktop' })
  await ui.press({ key: 'html0' })
  expect(nativeCalls).toBe(0)
  expect(surfaces).toEqual(['desktop'])
  await ui.unmount()
})

for (const failure of ['unavailable', 'refused'] as const) test(`Markdown copying reports a ${failure} surface clipboard`, async ($, on) => {
  mock.env(on, { SSH_TTY: '/dev/pts/0' })
  const toasts: string[] = []
  on('ui.copy', () => failure === 'refused'
    ? { deny: 'Clipboard denied' }
    : { value: { isCopied: false as const, reason: 'no-clipboard' as const } })
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  const ui = await $.ui.mount(mount)
  await ui.press({ key: 'copy0' })
  expect(toasts).toEqual([failure === 'refused' ? 'Copy failed' : 'Copy failed: no-clipboard'])
  await ui.unmount()
})

const linuxClipboard = (on: On, environment: Record<string, string>) => clipboardEnv(on, 'other', environment)

for (const backend of ['wayland', 'x11'] as const) test(`Linux ${backend} copies HTML and plain text together`, async ($, on) => {
  linuxClipboard(on, backend === 'wayland' ? { WAYLAND_DISPLAY: 'wayland-0', DISPLAY: ':0' } : { DISPLAY: ':0' })
  const calls: { argv: readonly string[]; input: string }[] = []
  const copies: string[] = []
  const toasts: string[] = []
  on('process.run', (_, e) => {
    calls.push({ argv: e.argv, input: e.init?.stdin ?? '' })
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
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
  expect(calls).toHaveLength(0)
  await ui.press({ key: 'html0' })
  expect(calls).toHaveLength(1)
  expect(calls[0]!.argv).toEqual(['copyq', 'eval', LINUX_TABLE_COPY, '-'])
  const payload = JSON.parse(calls[0]!.input)
  expect(payload.text).toBe(plain)
  expect(payload.html).toContain('<strong>שלום</strong>')
  expect(payload.html).toContain('<code style="white-space: pre-wrap">$(ignored)</code>')
  expect(copies).toHaveLength(0)
  expect(toasts).toEqual(['Copied formatted table'])
  await ui.unmount()
})

for (const failure of ['missing', 'exit', 'timeout'] as const) test(`Linux clipboard ${failure} falls back to plain text`, async ($, on) => {
  linuxClipboard(on, { DISPLAY: ':0' })
  const copies: string[] = []
  const toasts: string[] = []
  on('process.run', () => {
    if (failure === 'timeout') return { deny: 'Process timed out' }
    return { value: { exitCode: failure === 'missing' ? 127 : 1, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
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
  expect(copies).toEqual([plain])
  expect(toasts).toEqual(['Copied as plain text (CopyQ failed; install and start CopyQ in the graphical session)'])
  await ui.unmount()
})

for (const scenario of ['headless', 'ssh', 'desktop'] as const) test(`Linux ${scenario} copies plain text without native clipboard processes`, async ($, on) => {
  linuxClipboard(on, scenario === 'headless' ? {} : { WAYLAND_DISPLAY: 'wayland-0', DISPLAY: ':0', ...(scenario === 'ssh' ? { SSH_CONNECTION: 'remote' } : {}) })
  let processes = 0
  const copies: string[] = []
  on('process.run', () => {
    processes++
    return { deny: 'Must use the surface clipboard' }
  })
  on('ui.copy', (_, e) => {
    copies.push(e.text)
    return { value: { isCopied: true as const } }
  })
  const ui = await $.ui.mount({ ...mount, surface: scenario === 'desktop' ? 'desktop' : 'terminal' })
  await ui.press({ key: 'html0' })
  expect(processes).toBe(0)
  expect(copies).toEqual([plain])
  await ui.unmount()
})

for (const failure of ['unavailable', 'refused'] as const) test(`HTML copying reports a ${failure} plain-text fallback`, async ($, on) => {
  linuxClipboard(on, { DISPLAY: ':0' })
  const toasts: string[] = []
  on('process.run', () => ({ value: { exitCode: 1, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }))
  on('ui.copy', () => failure === 'refused'
    ? { deny: 'Clipboard denied' }
    : { value: { isCopied: false as const, reason: 'no-clipboard' as const } })
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  const ui = await $.ui.mount(mount)
  await ui.press({ key: 'html0' })
  expect(toasts).toEqual([failure === 'refused' ? 'Copy failed' : 'Copy failed: no-clipboard'])
  await ui.unmount()
})
