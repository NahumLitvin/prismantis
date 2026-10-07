import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { load } from './load.mjs'

assert.equal(process.platform, 'linux')
assert.ok(process.env.DISPLAY, 'Run under xvfb-run to isolate the X11 clipboard')
const { clipboardCommand } = await load()
const scratch = mkdtempSync(join(tmpdir(), 'prismantis-wayland-'))
const config = join(scratch, 'sway.conf')
writeFileSync(config, 'xwayland disable\nseat seat0 fallback true\n')
const env = { ...process.env, XDG_RUNTIME_DIR: scratch, WLR_BACKENDS: 'headless', WLR_RENDERER: 'pixman', WLR_LIBINPUT_NO_DEVICES: '1' }
delete env.WAYLAND_DISPLAY
const compositor = spawn('sway', ['--config', config], { env, stdio: ['ignore', 'ignore', 'pipe'] })
let diagnostics = ''
compositor.stderr.on('data', data => { diagnostics += data })
compositor.on('error', error => { diagnostics += error.message })

try {
  for (let attempt = 0; attempt < 100; attempt++) {
    const socket = readdirSync(scratch, { withFileTypes: true }).find(entry => entry.isSocket() && entry.name.startsWith('wayland-'))
    if (socket) {
      env.WAYLAND_DISPLAY = socket.name
      break
    }
    if (compositor.exitCode !== null || compositor.signalCode !== null) throw new Error(diagnostics)
    await setTimeout(100)
  }
  assert.ok(env.WAYLAND_DISPLAY, `Wayland did not start: ${diagnostics}`)
  const html = `<table><tr><th>Name</th></tr>${'<tr><td>Żółć &amp; שלום 中文</td></tr>'.repeat(3000)}</table>`
  for (const backend of ['wayland', 'x11']) {
    const command = clipboardCommand(backend, html, 'plain text')
    const copy = spawnSync(command.argv[0], command.argv.slice(1), { input: command.stdin, env, encoding: 'utf8', timeout: 5000 })
    assert.equal(copy.status, 0, copy.error?.message || copy.stderr || command.failure)
    const paste = backend === 'wayland'
      ? ['wl-paste', '--type', 'text/html', '--no-newline']
      : ['xclip', '-selection', 'clipboard', '-target', 'text/html', '-out']
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = spawnSync(paste[0], paste.slice(1), { env, encoding: 'utf8', timeout: 5000 })
      assert.equal(result.status, 0, result.error?.message || result.stderr)
      assert.equal(result.stdout, html)
    }
    console.log(`${backend}: Unicode HTML survives two pastes after the copy command exits`)
  }
} finally {
  if (compositor.exitCode === null && compositor.signalCode === null && compositor.pid) {
    const exited = new Promise(resolve => compositor.once('exit', resolve))
    compositor.kill()
    await exited
  }
  rmSync(scratch, { recursive: true, force: true })
}
