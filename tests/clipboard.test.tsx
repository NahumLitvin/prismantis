import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { MAC_TABLE_COPY } from '../hooks/clipboard'

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
  expect(payload.html).toContain('<code style="white-space: pre-wrap">$(ignored)</code>')
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

for (const variable of ['SSH_CONNECTION', 'SSH_TTY']) test(`${variable} table copying uses tab-separated cells on the surface clipboard`, async ($, on) => {
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
  expect(copies).toEqual(['Name\tValue\nשלום\t$(ignored)'])
  expect(toasts).toEqual(['Copied tab-separated cells; rich copying requires a local macOS or Linux graphical session'])
  await ui.unmount()
})

test('desktop table copying skips the native helper even on macOS', async ($, on) => {
  nativeClipboard(on)
  const surfaces: (string | undefined)[] = []
  let nativeCalls = 0
  on('process.run', () => {
    nativeCalls++
    return { deny: 'Must use the surface clipboard' }
  })
  on('ui.copy', (_, e) => {
    surfaces.push(e.surface)
    expect(e.text).toBe('Name\tValue\nשלום\t$(ignored)')
    return { value: { isCopied: true as const } }
  })
  const ui = await $.ui.mount({ ...mount, surface: 'desktop' })
  await ui.press({ key: 'html0' })
  expect(nativeCalls).toBe(0)
  expect(surfaces).toEqual(['desktop'])
  await ui.unmount()
})

for (const failure of ['unavailable', 'refused'] as const) test(`HTML fallback reports a ${failure} surface clipboard`, async ($, on) => {
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
  await ui.press({ key: 'html0' })
  expect(toasts).toEqual([failure === 'refused' ? 'Copy failed' : 'Copy failed: no-clipboard'])
  await ui.unmount()
})

const linuxClipboard = (on: On, environment: Record<string, string>) => {
  mock.env(on, environment)
  on('fs.stat', (_, e, next) => e.path === '/usr/bin/osascript' ? { deny: 'Not macOS' } : next(e))
}

for (const backend of ['wayland', 'x11'] as const) test(`Linux ${backend} copies HTML with the correct MIME type`, async ($, on) => {
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
  expect(calls[0]!.argv.slice(0, 4)).toEqual(['/bin/sh', '-c', 'exec "$@" >/dev/null 2>&1', 'prismantis-clipboard'])
  expect(calls[0]!.argv.slice(4)).toEqual(backend === 'wayland'
    ? ['wl-copy', '--type', 'text/html']
    : ['xclip', '-selection', 'clipboard', '-target', 'text/html', '-in', '-silent'])
  expect(calls[0]!.input).toContain('<strong>שלום</strong>')
  expect(calls[0]!.input).toContain('<code style="white-space: pre-wrap">$(ignored)</code>')
  expect(copies).toHaveLength(0)
  expect(toasts).toEqual(['Copied formatted table'])
  await ui.unmount()
})

for (const failure of ['missing', 'exit', 'timeout'] as const) test(`Linux clipboard ${failure} falls back to table cells`, async ($, on) => {
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
  expect(copies).toEqual(['Name\tValue\nשלום\t$(ignored)'])
  expect(toasts).toHaveLength(1)
  expect(toasts[0]).toContain('Copied tab-separated cells;')
  expect(toasts[0]).toContain(failure === 'timeout' ? 'Process timed out' : 'xclip failed; check xclip is installed and X11 is available')
  await ui.unmount()
})

for (const scenario of ['headless', 'ssh', 'desktop'] as const) test(`Linux ${scenario} skips native clipboard processes`, async ($, on) => {
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
  expect(copies).toEqual(['Name\tValue\nשלום\t$(ignored)'])
  await ui.unmount()
})
