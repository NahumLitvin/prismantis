import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = file => readFileSync(join(root, file), 'utf8')
const json = file => JSON.parse(read(file))
const here = file => existsSync(join(root, file))

const CODEX_THEMES = 'codex/skills/prismantis-themes/themes'
const GENERATED = 'generated from the Claude Code source by `npm --prefix scripts run build:codex`'

let bad = 0
const check = (name, run) => {
  try {
    const detail = run()
    console.log(`ok ${name}${detail ? ` (${detail})` : ''}`)
  } catch (error) {
    bad++
    console.error(`FAIL ${name}: ${error.message}`)
  }
}
const same = (was, now, what) => {
  if (was === now) return
  const brief = value => (typeof value === 'string' && value.length > 60 ? `${JSON.stringify(value.slice(0, 40))}... (${value.length} chars)` : JSON.stringify(value))
  let i = 0
  while (typeof was === 'string' && typeof now === 'string' && i < was.length && i < now.length && was[i] === now[i]) i++
  const diff = typeof was === 'string' && typeof now === 'string' ? ` at ${i}: ${JSON.stringify(was.slice(i, i + 24))} is not ${JSON.stringify(now.slice(i, i + 24))}` : ''
  throw new Error(`${what}: ${brief(was)} is not ${brief(now)}${diff}`)
}
const many = (list, want, what) => {
  for (const value of want) if (!String(list).includes(value)) throw new Error(`${what} is missing ${value}`)
}
const kinds = text => (text ?? '').split(/,|\s+and\s+/).map(item => item.trim()).filter(Boolean)
const stem = kind => (kind === 'xychart-beta' ? 'xychart' : kind === 'sequenceDiagram' ? 'sequence' : kind === 'stateDiagram-v2' ? 'state' : kind)
const parity = (one, other, what) => {
  const a = new Set(one.map(stem))
  const b = new Set(other.map(stem))
  const gone = [...a].filter(kind => !b.has(kind))
  const added = [...b].filter(kind => !a.has(kind))
  if (gone.length || added.length) throw new Error(`${what}: ${gone.map(kind => `-${kind}`).join(' ')} ${added.map(kind => `+${kind}`).join(' ')}`.trim())
}
const noteTail = text => text.slice(text.indexOf('\n\n') + 2)

const version = json('plugin/.claude-plugin/plugin.json').version
const codexThemes = readdirSync(join(root, CODEX_THEMES)).map(name => name.match(/^prismantis-(.+)\.tmTheme$/)?.[1]).filter(Boolean)
const opencodeThemes = readdirSync(join(root, 'opencode/themes')).map(name => name.match(/^prismantis-(.+)\.json$/)?.[1]).filter(Boolean)
const shared = noteTail(read('codex/hint.md'))

check('every surface names the plugin version', () => {
  for (const file of ['.codex-plugin/plugin.json', 'opencode/package.json', 'antigravity/plugin.json']) same(json(file).version, version, file)
  const agents = json('.agents/plugins/marketplace.json').plugins[0]
  same(agents.version, version, '.agents/plugins/marketplace.json version')
  same(read('opencode/README.md').match(/#(v\d+\.\d+\.\d+)::path:opencode/)?.[1], `v${version}`, 'opencode/README.md install pin')
  return version
})

check('every port points at the files it ships', () => {
  const codex = json('.codex-plugin/plugin.json')
  for (const file of [codex.hooks, codex.skills, 'codex/hint.md', 'codex/skills/prismantis/SKILL.md', 'codex/skills/prismantis-themes/SKILL.md']) if (!here(file)) throw new Error(`.codex-plugin points at no ${file}`)
  for (const file of ['server.js', 'tui.js']) if (!here(`opencode/${file}`)) throw new Error(`opencode/package.json points at no ${file}`)
  same(json('opencode/package.json').exports['.'], './server.js', 'opencode/package.json exports')
  const agy = json('antigravity/plugin.json')
  for (const file of ['assets/logo.png', 'rules/AGENTS.md', 'skills/prismantis/SKILL.md']) if (!here(`antigravity/${file}`)) throw new Error(`antigravity/plugin.json points at no ${file}`)
  return '4 surfaces'
})

check('OpenCode themes have a Codex twin in the same color', () => {
  for (const name of opencodeThemes) {
    if (!codexThemes.includes(name)) throw new Error(`opencode/themes/prismantis-${name}.json has no Codex theme`)
    const foreground = read(`${CODEX_THEMES}/prismantis-${name}.tmTheme`).match(/<key>foreground<\/key><string>(#[0-9a-fA-F]{6})<\/string>/)?.[1]
    same(json(`opencode/themes/prismantis-${name}.json`).theme?.text?.toLowerCase(), foreground?.toLowerCase(), `theme ${name} code color`)
  }
  return `${opencodeThemes.length} of ${codexThemes.length}`
})

check('every theme count in the port text matches its folder', () => {
  same(Number(json('.codex-plugin/plugin.json').description.match(/(\d+) prismantis syntax themes/)?.[1]), codexThemes.length, 'Codex manifest')
  same(Number(read('codex/skills/prismantis-themes/SKILL.md').match(/(\d+) of them/)?.[1]), codexThemes.length, 'Codex skill')
  same(Number(read('codex/README.md').match(/ships the (\d+) prismantis themes/)?.[1]), codexThemes.length, 'Codex README')
  same(Number(read('opencode/README.md').match(/ships (\d+) prismantis themes/)?.[1]), opencodeThemes.length, 'OpenCode README')
  return `${codexThemes.length} Codex, ${opencodeThemes.length} OpenCode`
})

check('Codex and Antigravity send the same note', () => {
  same(noteTail(read('antigravity/rules/AGENTS.md')), shared, 'the note after the port paragraph')
  if (!shared.startsWith('Replies in this session are drawn by the prismantis mod')) throw new Error('the shared note does not start with the Claude note')
  if (!shared.includes('A fenced block whose opening line is exactly ```figure')) throw new Error('the shared note has lost the figure hint')
  if (!read('codex/hint.md').startsWith('This session runs in OpenAI Codex')) throw new Error('codex/hint.md does not name Codex')
  if (!read('antigravity/rules/AGENTS.md').startsWith('This session runs in Google Antigravity')) throw new Error('antigravity/rules/AGENTS.md does not name Antigravity')
  return `${shared.length} chars`
})

check('OpenCode names the same mermaid kinds in its note, its demo and its README', () => {
  const bundle = read('opencode/server.js')
  const charts = JSON.parse(bundle.match(/var OPENCODE_CHARTS = (\[[^\]]+\])/)?.[1])
  const own = kinds(bundle.match(/mermaid only for ([^.]+)\./)?.[1])
  const demo = kinds(bundle.match(/\| ([^|\n]+?) \| OpenCode \|/)?.[1])
  const readme = read('opencode/README.md')
  const readmeOwn = kinds(readme.match(/Mermaid ([^(\n]+?) \(drawn by OpenCode\)/)?.[1])
  const readmeCharts = kinds(readme.match(/\| ([^|\n]+?) \(drawn by prismantis as ```chart\)/)?.[1])
  parity(own, demo, 'the kinds in the OpenCode demo')
  parity(own, readmeOwn, 'the kinds OpenCode draws')
  many(readmeCharts.join(' ').toLowerCase(), charts.map(stem).map(kind => kind.toLowerCase()), 'the chart row')
  return `${own.length} drawn by OpenCode, ${charts.length} by prismantis`
})

check('Antigravity names the same mermaid kinds in its rule and its README', () => {
  const rule = read('antigravity/rules/AGENTS.md')
  const readme = read('antigravity/README.md')
  parity(kinds(rule.match(/mermaid only for ([^.]+)\./)?.[1]), kinds(readme.match(/Mermaid ([^,\n]+ and [^,\n]+), drawn by Antigravity/)?.[1]), 'the kinds Antigravity draws')
  many(readme.match(/Mermaid ([^|\n]+?) \| source/)?.[1]?.toLowerCase(), ['state', 'class', 'er', 'gantt', 'gitgraph', 'timeline', 'pie', 'xychart'], 'the README source row')
  return 'flowchart and sequenceDiagram'
})

check('the generated folders say how they are made', () => {
  for (const file of ['codex/README.md', 'opencode/README.md', 'antigravity/README.md']) if (!read(file).includes(GENERATED)) throw new Error(`${file} has lost its generated line`)
  return '3 ports'
})

check('docs/compatibility.md agrees with the ports', () => {
  const doc = read('docs/compatibility.md')
  many(doc, ['Claude Code', 'Codex', 'OpenCode', 'Antigravity', 'compat:check'], 'the compatibility page')
  many(doc, kinds(read('codex/hint.md').match(/mermaid only for ([^.]+)\./)?.[1]), 'the Codex cell')
  many(doc.toLowerCase(), ['xychart', 'pie', 'quadrantchart', 'mindmap', 'journey', 'kanban', 'classdiagram', 'erdiagram'], 'the OpenCode cell')
  many(doc.toLowerCase(), ['flowchart', 'sequencediagram'], 'the Antigravity cell')
  if (!read('README.md').includes('docs/compatibility.md')) throw new Error('the README does not link the page')
  return 'every surface and kind'
})

if (bad) process.exit(1)
