import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd])
const HEAD = Buffer.from('// Claude Code function hooks')

const version = execFileSync('claude', ['--version'], { encoding: 'utf8' }).match(/\d+\.\d+\.\d+/)?.[0]
const binary = readFileSync(realpathSync(execFileSync('which', ['claude'], { encoding: 'utf8' }).trim()))
for (let at = binary.indexOf(MAGIC); at !== -1; at = binary.indexOf(MAGIC, at + MAGIC.length)) {
  const { stdout } = spawnSync('zstd', ['-dcq', '--no-check'], { input: binary.subarray(at, at + 4_000_000), maxBuffer: 64_000_000 })
  if (!stdout?.subarray(0, HEAD.length).equals(HEAD)) continue
  const dir = join(ROOT, 'plugin', '.claude-plugin', 'types', 'claude-code')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.d.ts'), `// Written by Claude Code ${version}.\n${stdout}\n`)
  console.log(`laid the Claude Code ${version} mod API types from its binary`)
  process.exit(0)
}
console.error(`no mod API types found in the Claude Code ${version} binary`)
process.exit(1)
