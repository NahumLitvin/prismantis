import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

const dir = mkdtempSync(join(tmpdir(), 'prismantis-test-'))
try {
  cpSync(join(ROOT, 'plugin'), dir, { recursive: true })
  cpSync(join(ROOT, 'tests'), join(dir, 'tests'), { recursive: true })
  const windows = process.platform === 'win32'
  const args = ['plugin', 'test', dir, ...process.argv.slice(2)]
  const run = spawnSync('claude', windows ? args.map(a => `"${a}"`) : args, { stdio: 'inherit', shell: windows })
  process.exitCode = run.status ?? 1
} finally {
  rmSync(dir, { recursive: true, force: true })
}
