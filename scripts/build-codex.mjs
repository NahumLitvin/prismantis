import { build } from 'esbuild'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'codex')

const bundled = await build({
  stdin: {
    contents: `export { HINT, showcaseText } from './hooks/help'
export { FIGURE_HINT } from './hooks/figure'
export { PRESETS, PRESET_NAMES } from './hooks/presets'
export { PRISM_COLORS } from './hooks/render'`,
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  external: ['claude-code'],
  logLevel: 'error',
})
const cc = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`)

const CODEX = [
  'This session runs in OpenAI Codex, not Claude Code. The notes after this paragraph are what prismantis tells Claude in Claude Code; follow them with these Codex differences.',
  'Codex draws markdown tables, headings, lists, links and fenced code itself, and mermaid only for flowchart, sequenceDiagram, stateDiagram-v2, classDiagram and erDiagram. Any other mermaid kind prints as source, so draw it as a figure instead.',
  'Codex also prints a diagram as source when it is wider than the terminal or a label, message or note holds ; or quotes or HTML: use flowchart TD past 4 steps, at most 4 nodes side by side, labels under 20 characters, and sequence diagrams with at most 4 one-word participants and messages under 16 characters.',
  'A figure block prints as written in a plain code block, so leave out the {role:text} color markup. There are no copy buttons and GitHub alerts draw as plain quotes.',
].join(' ')

const TEXTMATE = {
  comment: ['comment'], prolog: ['meta.preprocessor'], doctype: ['meta.tag.sgml.doctype'], cdata: ['string.unquoted.cdata'],
  string: ['string'], char: ['constant.character'], 'template-string': ['string.template'], 'attr-value': ['string.quoted.attribute-value'], url: ['markup.underline.link'],
  number: ['constant.numeric'], boolean: ['constant.language'], constant: ['constant', 'variable.other.constant'], symbol: ['constant.other.symbol'], inserted: ['markup.inserted'],
  keyword: ['keyword', 'storage', 'storage.type', 'storage.modifier'], important: ['keyword.other.important'], atrule: ['keyword.control.at-rule'], rule: ['keyword.other.rule'], deleted: ['markup.deleted'],
  function: ['entity.name.function', 'support.function'], 'class-name': ['entity.name.type', 'entity.name.class', 'support.type', 'support.class'], builtin: ['support.function.builtin'], key: ['support.type.property-name'], selector: ['entity.name.selector'],
  property: ['variable.other.property'], tag: ['entity.name.tag'], 'attr-name': ['entity.other.attribute-name'], variable: ['variable'], regex: ['string.regexp'],
}
const EXTRA = { inlineCode: ['markup.inline.raw.string.markdown', 'markup.raw.inline.markdown'], heading: ['markup.heading'], strong: ['markup.bold'], emphasis: ['markup.italic'], quote: ['markup.quote'], bullet: ['markup.list'], link: ['markup.underline.link'] }

const rule = (scopes, fg) => `\t\t<dict><key>scope</key><string>${scopes.join(', ')}</string><key>settings</key><dict><key>foreground</key><string>${fg}</string></dict></dict>`
const tmTheme = (name, t) => {
  const rules = []
  for (const [prism, slot] of Object.entries(cc.PRISM_COLORS)) if (t[slot] && TEXTMATE[prism]) rules.push(rule(TEXTMATE[prism], t[slot]))
  for (const [slot, scopes] of Object.entries(EXTRA)) if (t[slot]) rules.push(rule(scopes, t[slot]))
  const fg = t.codeText ? `<key>foreground</key><string>${t.codeText}</string>` : ''
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>name</key><string>${name}</string>
\t<key>settings</key>
\t<array>
\t\t<dict><key>settings</key><dict>${fg}</dict></dict>
${rules.join('\n')}
\t</array>
</dict>
</plist>
`
}

const skill = (name, description, body) => `---\nname: ${name}\ndescription: ${description}\n---\n\n${body}`

rmSync(out, { recursive: true, force: true })
await build({
  entryPoints: [join(root, 'scripts/codex-fence.mjs')],
  outfile: join(out, 'fence.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'node',
  jsx: 'transform',
  jsxFactory: 'h',
  jsxFragment: 'Fragment',
  external: ['claude-code'],
  logLevel: 'error',
})
const write = (path, text) => {
  mkdirSync(dirname(join(out, path)), { recursive: true })
  writeFileSync(join(out, path), text)
}

write('hint.md', `${CODEX}\n\n${cc.HINT}\n\n${cc.FIGURE_HINT}\n`)
write('hooks.json', `${JSON.stringify({ hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'cat "$PLUGIN_ROOT/codex/hint.md"', commandWindows: 'type "%PLUGIN_ROOT%\\codex\\hint.md"' }] }] } }, null, 2)}\n`)
write('skills/prismantis/SKILL.md', skill('prismantis', 'Show the prismantis demo. Use when the user runs $prismantis or asks what prismantis is or does.',
  `Reply with exactly the markdown between the START and END lines, nothing before or after it.\n\nSTART${cc.showcaseText(cc.PRESET_NAMES)}END\n`))
for (const name of cc.PRESET_NAMES) write(`skills/prismantis-themes/themes/prismantis-${name}.tmTheme`, tmTheme(`prismantis-${name}`, cc.PRESETS[name]))
write('skills/prismantis-themes/SKILL.md', skill('prismantis-themes', 'Install the prismantis color themes for code and diagrams. Use when the user runs $prismantis-themes or asks for prismantis themes in Codex.',
  `Copy every .tmTheme file from the themes folder next to this SKILL.md into "\${CODEX_HOME:-$HOME/.codex}/themes", creating that folder if needed, with one shell command. Then reply in one line: the themes are installed, and /theme picks one (they are named prismantis-<theme>, ${cc.PRESET_NAMES.length} of them).\n`))

const manifest = JSON.parse(readFileSync(join(root, '.claude-plugin/plugin.json'), 'utf8'))
mkdirSync(join(root, '.codex-plugin'), { recursive: true })
writeFileSync(join(root, '.codex-plugin/plugin.json'), `${JSON.stringify({ name: manifest.name, version: manifest.version, description: manifest.description, hooks: './codex/hooks.json', skills: './codex/skills', fenceRenderers: Object.fromEntries(['mermaid', 'figure'].map(lang => [lang, { command: `node "$PLUGIN_ROOT/codex/fence.mjs" ${lang}` }])) }, null, 2)}\n`)

const GEMINI = [
  'This session runs in Gemini CLI, not Claude Code. The notes after this paragraph are what prismantis tells Claude in Claude Code; follow them with these Gemini CLI differences.',
  'Gemini CLI draws markdown tables, headings, lists, links and fenced code itself, but not mermaid: a mermaid block prints as source, so draw flows, charts and timelines as a figure instead.',
  'A figure block prints as written in a plain code block, so leave out the {role:text} color markup. There are no copy buttons and GitHub alerts draw as plain quotes.',
].join(' ')

const geminiTheme = (name, t) => ({
  name: `prismantis-${name}`,
  type: 'custom',
  text: { primary: t.codeText, secondary: t.codeComment, link: t.link, accent: t.accent },
  status: { success: t.codeString, warning: t.heading, error: t.codeFlag },
  border: { default: t.tableRule, focused: t.accent },
  ui: { comment: t.codeComment, symbol: t.codeCommand, gradient: [t.accent, t.diagram, t.link].filter(Boolean) },
})

const gemini = join(root, 'gemini')
rmSync(gemini, { recursive: true, force: true })
mkdirSync(gemini, { recursive: true })
writeFileSync(join(gemini, 'GEMINI.md'), `${GEMINI}\n\n${cc.HINT}\n\n${cc.FIGURE_HINT}\n`)
mkdirSync(join(root, 'commands'), { recursive: true })
writeFileSync(join(root, 'commands/prismantis.toml'), `description = "Show the prismantis demo"\nprompt = '''\nReply with exactly the markdown between the START and END lines, nothing before or after it.\n\nSTART${cc.showcaseText(cc.PRESET_NAMES)}END\n'''\n`)
writeFileSync(join(root, 'gemini-extension.json'), `${JSON.stringify({
  name: manifest.name,
  version: manifest.version,
  description: manifest.description,
  contextFileName: 'gemini/GEMINI.md',
  themes: cc.PRESET_NAMES.filter(n => cc.PRESETS[n].codeText).map(n => geminiTheme(n, cc.PRESETS[n])),
  fenceRenderers: Object.fromEntries(['mermaid', 'figure'].map(lang => [lang, { command: `node "\${extensionPath}\${/}codex\${/}fence.mjs" ${lang} gemini` }])),
}, null, 2)}\n`)
