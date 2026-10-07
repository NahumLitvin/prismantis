import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { load } from './load.mjs'

if (process.platform === 'win32') process.exit(0)

const { clipboardCommand } = await load()
const scratch = mkdtempSync(join(tmpdir(), 'prismantis-clipboard-'))
const capture = join(scratch, 'capture.json')
const marker = join(scratch, 'executed')
const html = `<table><tr><td>שלום 中文 $(touch ${marker}) \`touch ${marker}\`</td></tr></table>`
const helper = `#!${process.execPath}
const { readFileSync, writeFileSync } = require('node:fs')
const { spawn } = require('node:child_process')
const child = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)'], { stdio: 'inherit' })
child.unref()
writeFileSync(process.env.PRISMANTIS_CAPTURE, JSON.stringify({ argv: process.argv.slice(2), stdin: readFileSync(0, 'utf8'), pid: child.pid }))
process.exit(Number(process.env.PRISMANTIS_EXIT || 0))
`

try {
  for (const name of ['wl-copy', 'xclip']) writeFileSync(join(scratch, name), helper, { mode: 0o700 })
  for (const backend of ['wayland', 'x11']) {
    const command = clipboardCommand(backend, html, 'plain text')
    const expected = backend === 'wayland'
      ? ['--type', 'text/html']
      : ['-selection', 'clipboard', '-target', 'text/html', '-in', '-silent']
    for (const exitCode of [0, 1, 127]) {
      const result = spawnSync(command.argv[0], command.argv.slice(1), {
        input: command.stdin,
        encoding: 'utf8',
        timeout: 2000,
        env: { ...process.env, PATH: scratch, PRISMANTIS_CAPTURE: capture, PRISMANTIS_EXIT: String(exitCode) },
      })
      const received = JSON.parse(readFileSync(capture, 'utf8'))
      try {
        assert.equal(result.status, exitCode, result.error?.message)
        assert.deepEqual(received.argv, expected)
        assert.equal(received.stdin, html)
        assert.equal(existsSync(marker), false)
      } finally {
        process.kill(received.pid)
      }
    }
  }
  console.log('Linux clipboard commands preserve payloads and exit codes without waiting on background owners')
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
