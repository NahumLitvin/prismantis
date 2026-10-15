import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { load } from './load.mjs'

if (process.platform !== 'win32') {
  console.log('Skipped native clipboard bridge check: Windows required')
  process.exit(0)
}

const { parse, tableHtml, clipboardCommand } = await load()
const table = parse('| Name | Value |\n|--|--|\n| Żółć & שלום | ✅ 中文 |', { numbers: false, paths: false }).find(block => block.kind === 'table')
assert.ok(table)
const html = tableHtml(table)
const text = 'Name\tValue\nŻółć & שלום\t✅ 中文'
const command = clipboardCommand('windows', html, text, process.env.SystemRoot)
const write = spawnSync(command.argv[0], command.argv.slice(1), { input: command.stdin, encoding: 'utf8', timeout: 10000 })
assert.equal(write.status, 0, write.stderr || write.error?.message)

const read = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$data = [System.Windows.Forms.Clipboard]::GetDataObject()
$utf8 = New-Object Text.UTF8Encoding($false)
foreach ($format in 'HTML Format', 'UnicodeText') {
  [Console]::Out.WriteLine([Convert]::ToBase64String($utf8.GetBytes([string]$data.GetData($format))))
}
`
const readback = spawnSync(command.argv[0], ['-NoProfile', '-NonInteractive', '-STA', '-Command', read], { encoding: 'utf8', timeout: 30000 })
assert.equal(readback.status, 0, readback.stderr || readback.error?.message)
const [cf, unicode] = readback.stdout.trim().split(/\r?\n/).map(line => Buffer.from(line, 'base64'))

const header = cf.toString('latin1', 0, cf.indexOf('<html'))
const offset = name => Number(new RegExp(`^${name}:(\\d+)\\r?$`, 'm').exec(header)?.[1])
const [startHtml, endHtml, startFragment, endFragment] = ['StartHTML', 'EndHTML', 'StartFragment', 'EndFragment'].map(offset)
const fragment = Buffer.from(html)
assert.equal(cf.toString('utf8', startHtml, startHtml + 6), '<html>')
assert.deepEqual(cf.subarray(startFragment, endFragment), fragment)
assert.ok(cf.subarray(0, startFragment).toString('utf8').endsWith('<!--StartFragment-->\n'))
assert.ok(cf.subarray(endFragment).toString('utf8').startsWith('\n<!--EndFragment-->'))
assert.ok(cf.subarray(startHtml, endHtml).toString('utf8').endsWith('</html>'))
assert.ok(cf.length === endHtml || (cf.length === endHtml + 1 && cf[endHtml] === 0))
for (const cell of ['Żółć', 'שלום', '✅', '中文']) assert.ok(cf.toString('utf8', startFragment, endFragment).includes(cell), `${cell} missing from clipboard`)
assert.equal(unicode.toString('utf8'), text.replace(/\n/g, '\r\n'))
console.log('Windows clipboard holds CF_HTML with byte offsets and CRLF Unicode text')
