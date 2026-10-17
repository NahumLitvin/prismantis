import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

import { clockText, endedAt, sentAt } from '../hooks/clock'
import { FIGURE_HINT } from '../hooks/figure'
import { parse } from '../hooks/markdown'
import { PRESET_NAMES, PRESETS } from '../hooks/presets'
import { RANDOM_THEMES, pickTheme, resolveStyle } from '../hooks/theme'
import { ISSUE_HINT, SETUP_DONE, SETUP_PANE_KEYS, SETUP_PANE_OPENED, setupParts, setupSteps, setupText } from '../hooks/help'
import type { Theme } from '../hooks/theme'
import { EDIT_NOTES, bashEdits, columnWidths, contrast, describeShell, diffLines, diffTint, fullHue, movesTree, tint, errorReason, formatDuration, groupSummary, isReadOnlyCall, programsOf, refusalReason, rememberCall, shortTarget, shortenPaths, withoutBashEdits } from '../hooks/render'

const t = PRESETS['catppuccin-mocha']
const engine = (on: On) =>
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

const call = (tool: string, input: unknown, id: string) => ({ tool_use_id: id, tool, input, isRunning: false, isErrored: false, isInterrupted: false })

test('collapsed tool groups draw one summary line', { options: { toolStyle: 'classic' } }, async $ => {
  const ui = await $.ui.mount({
    plugin: 'prismantis',
    surface: 'terminal',
    component: 'ToolGroup',
    props: { calls: [call('Bash', { command: 'ls' }, 'a'), call('Bash', { command: 'pwd' }, 'b'), call('Read', { file_path: '/tmp/x' }, 'c')], isActive: false, isExpanded: false },
  })
  expect((await ui.find({ type: 'Text', text: /^Ran 2 commands, read 1 file$/ }))?.props.bold).toBe(true)
  await ui.unmount()
})

test('reads, searches and read-only shell commands count as read-only', () => {
  const shell = (command: string) => isReadOnlyCall('Bash', { command })
  expect(isReadOnlyCall('Read', { file_path: '/tmp/x' })).toBe(true)
  expect(isReadOnlyCall('Grep', { pattern: 'x' })).toBe(true)
  expect(shell('sed -n 40,135p tests/sheets.py; grep -n "^def " src/app.py')).toBe(true)
  expect(shell('cd /repo && ls -la docs/ | head -20')).toBe(true)
  expect(shell('grep -rn "C5" docs/ 2>/dev/null | cut -c1-300 | head -20; echo ---')).toBe(true)
  expect(shell('git log --oneline -5')).toBe(true)
  expect(shell('gh pr view 12 --json state')).toBe(true)
})

test('anything that can change files is not read-only', () => {
  const shell = (command: string) => isReadOnlyCall('Bash', { command })
  expect(isReadOnlyCall('Edit', { file_path: '/tmp/x' })).toBe(false)
  expect(shell('sed -i s/a/b/ app.py')).toBe(false)
  expect(shell('cat a > b')).toBe(false)
  expect(shell('find . -name "*.tmp" -delete')).toBe(false)
  expect(shell('ls && rm -rf build')).toBe(false)
  expect(shell('echo $(touch x)')).toBe(false)
  expect(shell('git commit -m x')).toBe(false)
  expect(shell('make test 2>&1 | tail -5')).toBe(false)
  expect(shell('cat x | tee y')).toBe(false)
})

test('quoted pipes, variables and harmless redirects do not break read-only detection', () => {
  const shell = (command: string) => isReadOnlyCall('Bash', { command })
  expect(shell('grep -n "cwd\\b\\|cwd:\\|root" types/index.d.ts | head -20')).toBe(true)
  expect(shell('T=types/index.d.ts; sed -n 3585,3602p $T; sed -n 2740,2750p $T')).toBe(true)
  expect(shell('grep -n "a > b" notes.md')).toBe(true)
  expect(shell('ls docs 2>&1 | head')).toBe(true)
  expect(shell("echo 'x' >> log.txt")).toBe(false)
  expect(describeShell('grep -n "cwd\\b\\|root" notes.md')).toBe('Searched notes.md for "cwd\\b\\|root"')
})

test('read-only shell commands are described in plain words with short paths', () => {
  const places = { cwd: '/home/dev/app', home: '/home/dev' }
  expect(shortTarget(places, '/home/dev/app/src/main.ts')).toBe('src/main.ts')
  expect(shortTarget(places, '/home/dev/notes.md')).toBe('~/notes.md')
  expect(shortTarget(places, '/private/tmp/build-501/run-3/cache/scratch/out.txt')).toBe('/private/tmp/…/scratch/out.txt')
  expect(describeShell('sed -n 40,135p /home/dev/app/tests/sheets.py', places)).toBe('Read tests/sheets.py lines 40–135')
  expect(describeShell('grep -rn "TODO" src/ | head -20', places)).toBe('Searched src/ for "TODO"')
  expect(describeShell('cd /home/dev/app && ls -la docs/', places)).toBe('Listed docs/')
  expect(describeShell('ls -A src', places)).toBe('Listed src')
  expect(describeShell('tree -L 2 src', places)).toBe('Listed src')
  expect(describeShell('test -f notes.md && cat notes.md', places)).toBe('Read notes.md')
  expect(describeShell('T=/home/dev/app/types/index.d.ts; sed -n 1,10p $T; grep -n "root" $T', places)).toBe('Read types/index.d.ts lines 1–10 · Searched types/index.d.ts for "root"')
  expect(describeShell('git log --oneline -5', places)).toBeUndefined()
  expect(describeShell('make test', places)).toBeUndefined()
  expect(describeShell('for f in a.py b.py; do sed -n 1,9p $f; done', places)).toBeUndefined()
  expect(describeShell('cat $NOTES', places)).toBeUndefined()
})

test('toolOutput quiet rows say what was read, and failed groups say why', { options: { toolOutput: 'quiet', toolStyle: 'classic' } }, async $ => {
  const row = await $.ui.mount({ plugin: 'prismantis', surface: 'terminal', component: 'ToolUse', props: call('Bash', { command: 'sed -n 1,12p hooks/theme.ts' }, 'd-1') })
  expect(await row.find({ type: 'Text', text: /^Read hooks\/theme\.ts lines 1–12$/ })).toBeDefined()
  await row.unmount()
  const described = await $.ui.mount({
    plugin: 'prismantis',
    surface: 'terminal',
    component: 'ToolUse',
    props: call('Bash', { command: 'R=a/b; for q in a b; do gh search issues "$q"; done | jq -s add', description: 'Search upstream issues about copy buttons' }, 'd-5'),
  })
  expect(await described.find({ type: 'Text', text: /^Search upstream issues about copy buttons · gh, jq$/ })).toBeDefined()
  await described.unmount()
  const failed = { ...call('Bash', { command: 'cat missing.txt' }, 'd-2'), isErrored: true, output: 'Exit code 1\ncat: missing.txt: No such file or directory' }
  const group = await $.ui.mount({
    plugin: 'prismantis',
    surface: 'terminal',
    component: 'ToolGroup',
    props: { calls: [call('Read', { file_path: 'AGENTS.md' }, 'd-3'), failed], isActive: false, isExpanded: false },
  })
  expect(await group.find({ type: 'Text', text: /^Read AGENTS\.md · Read missing\.txt$/ })).toBeDefined()
  expect(await group.find({ type: 'Text', text: /cat: missing\.txt: No such file or directory$/ })).toBeDefined()
  await group.unmount()
  const bare = await $.ui.mount({ plugin: 'prismantis', surface: 'terminal', component: 'ToolUse', props: call('Bash', { command: 'make test' }, 'd-6') })
  expect(await bare.find({ type: 'Text', text: /^Ran make test$/ })).toBeDefined()
  await bare.unmount()
  const searched = await $.ui.mount({ plugin: 'prismantis', surface: 'terminal', component: 'ToolUse', props: call('Grep', { pattern: 'TODO', path: 'src/' }, 'd-7') })
  expect(await searched.find({ type: 'Text', text: /^Searched src\/ for "TODO"$/ })).toBeDefined()
  await searched.unmount()
})

test('loops, gh search and read-only gh api count as reads; gh api with fields does not', () => {
  const shell = (command: string) => isReadOnlyCall('Bash', { command })
  expect(shell('R=a/b; for q in copy click; do gh search issues --repo $R "$q" --json number; done | jq -s add')).toBe(true)
  expect(shell('gh api repos/a/b/pulls/1/comments --jq ".[].body"')).toBe(true)
  expect(shell('gh api -X PATCH repos/a/b/issues/comments/1 -f body=x')).toBe(false)
  expect(shell('gh api repos/a/b/issues -f title=x')).toBe(false)
})

test('a shell call without a plain-words form shows its description and the programs it ran', () => {
  expect(programsOf('R=a/b; for q in a b; do gh search issues "$q"; done | jq -s add')).toEqual(['gh', 'jq'])
  expect(programsOf('cd app && .venv/bin/python -I run.py && make test && git status && npm ci')).toEqual(['python', 'make', 'git', '…'])
  expect(programsOf("python3 - <<'EOF'\nfrom pathlib import Path\nassert Path('x').exists()\nEOF\nmake test")).toEqual(['python3', 'make'])
  expect(programsOf('cat >> notes.md <<EOF\n### Built\nGebaut ist alles\nEOF')).toEqual(['cat'])
  expect(programsOf('python3 - <<-PY\n\timport os\n\tPY\ngit status')).toEqual(['python3', 'git'])
  expect(programsOf('cd app && pwd && test -f x')).toEqual([])
})

test('the failure reason is the last real line of the error', () => {
  expect(errorReason('Exit code 1\nstate: CLOSED\n(eval):1: ===== not found')).toBe('(eval):1: ===== not found')
  expect(errorReason({ stdout: 'ok\n', stderr: 'warning: x\nfatal: not a git repository\n' })).toBe('fatal: not a git repository')
})

test('commands that write through their arguments or in the background are not read-only', () => {
  const shell = (command: string) => isReadOnlyCall('Bash', { command })
  for (const command of [
    'ls & rm -rf build',
    'case x in *) rm -rf build;; esac',
    'sed -Ei s/a/b/ app.py',
    'sed -ni p app.py',
    "sed -n 'w out.txt' app.py",
    "sed 's/a/b/w out.txt' app.py",
    "sed -n -e 1p -e 'w out' app.py",
    'sort -o out.txt in.txt',
    'uniq in.txt out.txt',
    'awk \'{print > "out.txt"}\' in.txt',
    'find . -name x -fls out.txt',
    'pdftotext doc.pdf',
    'gh api --method=DELETE repos/a/b/issues/comments/1',
    'gh api repos/a/b/issues -ftitle=x',
    'gh api -XPOST repos/a/b/issues',
  ]) expect([command, shell(command)]).toEqual([command, false])
  for (const command of ['ls docs &>/dev/null', 'sort names.txt', 'uniq names.txt', 'pdftotext doc.pdf -', 'gh api --method GET repos/a/b/pulls']) {
    expect([command, shell(command)]).toEqual([command, true])
  }
})

test('line continuations and grep value flags do not leak into descriptions', () => {
  expect(describeShell('grep -rn "foo" \\\n  src/ tests/')).toBe('Searched src/, tests/ for "foo"')
  expect(describeShell('grep -rn --include "*.ts" foo src/')).toBe('Searched src/ for "foo"')
})

test('project and home prefixes are only shortened at the start of a path', () => {
  const places = { cwd: '/tmp/proj', home: '/Users/me' }
  expect(shortenPaths('see /tmp/proj/tests/x.py', places)).toBe('see tests/x.py')
  expect(shortenPaths('see /private/tmp/proj/tests/x.py', places)).toBe('see /private/tmp/proj/tests/x.py')
  expect(shortenPaths('open file:///Users/me/a.txt', places)).toBe('open file:///Users/me/a.txt')
})

test('the failure reason skips stack frames and runtime banners', () => {
  expect(errorReason('Exit code 1\nTypeError: boom\n    at run (app.js:3:9)\n    at main (app.js:9:1)\n\nNode.js v20.19.6')).toBe('TypeError: boom')
})

test('toolOutput quiet labels skills and PowerShell, and hides the skill result', { options: { toolOutput: 'quiet', toolStyle: 'classic' } }, async ($, on) => {
  engine(on)
  for (const surface of ['terminal', 'desktop'] as const) {
    const skill = await $.ui.mount({ plugin: 'prismantis', surface, component: 'ToolUse', props: call('Skill', { skill: 'kolibee:do-review', args: '--branch' }, `s-${surface}`) })
    expect(await skill.find({ type: 'Text', text: /^Loaded skill kolibee:do-review --branch$/ })).toBeDefined()
    const done = await $.ui.mount({ plugin: 'prismantis', surface, component: 'ToolResult', props: { tool_use_id: `s-${surface}`, tool: 'Skill', output: 'Successfully loaded skill', isErrored: false } })
    expect(await done.find({ type: 'Text', text: /^engine$/ })).toBeUndefined()
    await done.unmount()
    await skill.unmount()
    const pwsh = await $.ui.mount({ plugin: 'prismantis', surface, component: 'ToolUse', props: call('PowerShell', { command: 'cat C:\\Users\\me\\notes.md' }, `p-${surface}`) })
    expect(await pwsh.find({ type: 'Text', text: /^Ran cat C:\\Users\\me\\notes\.md$/ })).toBeDefined()
    await pwsh.unmount()
  }
})

test('toolOutput quiet leaves background and image shell results to the engine', { options: { toolOutput: 'quiet' } }, async ($, on) => {
  engine(on)
  for (const [id, output] of [['b-1', { stdout: '', stderr: '', backgroundTaskId: 'task-7' }], ['b-2', { stdout: 'iVBORw0KGgo', stderr: '', isImage: true }], ['b-3', { stdout: 'partial', stderr: '', interrupted: true }]] as const) {
    const use = await $.ui.mount({ plugin: 'prismantis', surface: 'terminal', component: 'ToolUse', props: call('Bash', { command: 'make watch' }, id) })
    const out = await $.ui.mount({ plugin: 'prismantis', surface: 'terminal', component: 'ToolResult', props: { tool_use_id: id, tool: 'Bash', output, isErrored: false } })
    expect(await out.find({ type: 'Text', text: /^engine$/ })).toBeDefined()
    await out.unmount()
    await use.unmount()
  }
})

const result = (tool: string, input: unknown, id: string) => [
  { plugin: 'prismantis', surface: 'terminal' as const, component: 'ToolUse' as const, props: call(tool, input, id) },
  { plugin: 'prismantis', surface: 'terminal' as const, component: 'ToolResult' as const, props: { tool_use_id: id, tool, output: { stdout: 'file contents' }, isErrored: false } },
] as const

test('toolOutput quiet hides the result of read-only calls only', { options: { toolOutput: 'quiet' } }, async ($, on) => {
  engine(on)
  const cases: [string, unknown, string, boolean][] = [
    ['Bash', { command: 'sed -n 1,20p app.py' }, 'q-1', false],
    ['Edit', { file_path: '/tmp/app.ts' }, 'q-2', true],
  ]
  for (const [tool, input, id, shown] of cases) {
    const [use, res] = result(tool, input, id)
    const row = await $.ui.mount(use)
    const out = await $.ui.mount(res)
    expect((await out.find({ type: 'Text', text: /^engine$/ })) !== undefined).toBe(shown)
    if (!shown) expect(await out.find({ type: 'Text', text: /file contents/ })).toBeUndefined()
    await out.unmount()
    await row.unmount()
  }
})

test('toolOutput quiet shows why a call failed instead of only its exit code', { options: { toolOutput: 'quiet' } }, async ($, on) => {
  engine(on)
  const out = await $.ui.mount({
    plugin: 'prismantis',
    surface: 'terminal',
    component: 'ToolResult',
    props: { tool_use_id: 'e-1', tool: 'Bash', output: 'Error: Exit code 1\ncat: missing.txt: No such file or directory', isErrored: true },
  })
  expect(await out.find({ type: 'Text', text: /No such file or directory$/ })).toBeDefined()
  expect(await out.find({ type: 'Text', text: /^engine$/ })).toBeUndefined()
  await out.unmount()
})

const REFUSED = 'Permission for this action was denied by the Claude Code auto mode classifier. Reason: Blocked by classifier. If you have other tasks that do not depend on this action, continue with those.'

test('a refused call keeps its whole reason, a failed command only its last line', () => {
  expect(refusalReason(REFUSED)).toBe(REFUSED)
  expect(refusalReason('The user doesn\'t want to proceed with this tool use.\nThe tool use was rejected.')).toBe('The user doesn\'t want to proceed with this tool use. The tool use was rejected.')
  expect(refusalReason('Exit code 1\ncat: missing.txt: No such file or directory')).toBeUndefined()
  expect(refusalReason({ stdout: '', stderr: 'denied' })).toBeUndefined()
  expect(refusalReason('Error: 405 Method Not Allowed\n<html>request blocked</html>')).toBeUndefined()
  expect(refusalReason('PreToolUse:Bash hook error: [protect-main.sh]: Blocked: HEAD is on main.')).toBe('PreToolUse:Bash hook error: [protect-main.sh]: Blocked: HEAD is on main.')
  expect(refusalReason('Error: PreToolUse:Bash hook error: ["$CLAUDE_PROJECT_DIR"/.claude/hooks/guard.sh]: Blocked: HEAD is on main.')).toBe('Error: PreToolUse:Bash hook error: ["$CLAUDE_PROJECT_DIR"/.claude/hooks/guard.sh]: Blocked: HEAD is on main.')
})

test('a refused call inside a collapsed quiet group keeps its whole reason too', { options: { toolOutput: 'quiet', toolStyle: 'classic' } }, async $ => {
  const refused = { ...call('Bash', { command: 'cat secrets.txt' }, 'g-2'), isErrored: true, output: REFUSED }
  const group = await $.ui.mount({
    plugin: 'prismantis',
    surface: 'terminal',
    component: 'ToolGroup',
    props: { calls: [call('Read', { file_path: 'AGENTS.md' }, 'g-1'), refused], isActive: false, isExpanded: false },
  })
  const text = await group.find({ type: 'Text', text: /Reason: Blocked by classifier\. If you have other tasks/ })
  expect(text).toBeDefined()
  expect(text?.props.wrap).toBe('wrap')
  await group.unmount()
})

test('toolOutput quiet shows the full reason of a refused call, wrapped and not cut', { options: { toolOutput: 'quiet' } }, async ($, on) => {
  engine(on)
  const out = await $.ui.mount({
    plugin: 'prismantis',
    surface: 'terminal',
    component: 'ToolResult',
    props: { tool_use_id: 'r-1', tool: 'Bash', output: REFUSED, isErrored: true },
  })
  const text = await out.find({ type: 'Text', text: /Reason: Blocked by classifier\. If you have other tasks/ })
  expect(text).toBeDefined()
  expect(text?.props.wrap).toBe('wrap')
  expect(await out.find({ type: 'Text', text: /^engine$/ })).toBeUndefined()
  await out.unmount()
})

test('the call memory is capped and forgets the oldest ids first', () => {
  const calls = new Set<string>()
  for (let i = 0; i < 5; i++) rememberCall(calls, `c${i}`, 3)
  expect([...calls]).toEqual(['c2', 'c3', 'c4'])
})

test('a collapsed quiet group still shows the first lines of a shell command that is not a read', { options: { toolOutput: 'quiet', toolStyle: 'classic' } }, async $ => {
  const read = { ...call('Bash', { command: 'sed -n 1,4p app.py' }, 'g-3'), output: { stdout: 'file contents\n', stderr: '' } }
  const tests = { ...call('Bash', { command: 'python3 -m unittest -v', description: 'Run the unit tests' }, 'g-4'), output: { stdout: '', stderr: 'test_one ... ok\ntest_two ... ok\n\nOK\n' } }
  const group = await $.ui.mount({ plugin: 'prismantis', surface: 'terminal', component: 'ToolGroup', props: { calls: [read, tests], isActive: false, isExpanded: false } })
  expect(await group.find({ type: 'Text', text: /^test_one \.\.\. ok$/ })).toBeDefined()
  expect(await group.find({ type: 'Text', text: /^… \+1 lines$/ })).toBeDefined()
  expect(await group.find({ type: 'Text', text: /file contents/ })).toBeUndefined()
  await group.unmount()
})

test('toolOutput quiet draws shell results itself, a few lines and no approval line', { options: { toolOutput: 'quiet' } }, async ($, on) => {
  engine(on)
  const use = await $.ui.mount({ plugin: 'prismantis', surface: 'terminal', component: 'ToolUse', props: call('Bash', { command: 'make test' }, 'w-1') })
  const out = await $.ui.mount({
    plugin: 'prismantis',
    surface: 'terminal',
    component: 'ToolResult',
    props: { tool_use_id: 'w-1', tool: 'Bash', output: { stdout: 'one\ntwo\nthree\nfour\nfive\n', stderr: '' }, isErrored: false },
  })
  expect(await out.find({ type: 'Text', text: /^one$/ })).toBeDefined()
  expect(await out.find({ type: 'Text', text: /^four$/ })).toBeUndefined()
  expect(await out.find({ type: 'Text', text: /^… \+2 lines$/ })).toBeDefined()
  expect(await out.find({ type: 'Text', text: /^engine$/ })).toBeUndefined()
  await out.unmount()
  await use.unmount()
})

test('toolOutput full leaves every result to the engine', async ($, on) => {
  engine(on)
  const [use, res] = result('Bash', { command: 'sed -n 1,20p app.py' }, 'f-1')
  const row = await $.ui.mount(use)
  const out = await $.ui.mount(res)
  expect(await out.find({ type: 'Text', text: /^engine$/ })).toBeDefined()
  await out.unmount()
  await row.unmount()
})

const expand = async ($: Parameters<TestBody>[0], id: string) => {
  const group = await $.ui.mount({
    plugin: 'prismantis',
    surface: 'terminal',
    component: 'ToolGroup',
    props: { calls: [call('Bash', { command: 'ls' }, id)], isActive: false, isExpanded: true },
  })
  await group.unmount()
}

test('expanded non-shell rows go back to the engine so their output shows', async ($, on) => {
  engine(on)
  await expand($, 'exp-1')
  const row = await $.ui.mount({
    plugin: 'prismantis',
    surface: 'terminal',
    component: 'ToolUse',
    props: { ...call('Read', { file_path: '/tmp/x' }, 'exp-1'), output: { stdout: 'file' } },
  })
  expect(await row.find({ type: 'Text', text: /^engine$/ })).toBeDefined()
  await row.unmount()
})

test('expanded shell rows color the command and show stdout and stderr', async ($, on) => {
  engine(on)
  await expand($, 'exp-2')
  const row = await $.ui.mount({
    plugin: 'prismantis',
    surface: 'terminal',
    component: 'ToolUse',
    props: { ...call('Bash', { command: 'gh run list --repo "a/b"' }, 'exp-2'), output: { stdout: 'in_progress\n', stderr: 'warn' } },
  })
  expect(await row.find({ type: 'Text', text: /^Bash\($/ })).toBeDefined()
  expect(await row.find({ type: 'Text', text: /^gh$/ })).toBeDefined()
  expect(await row.find({ type: 'Text', text: /^--repo$/ })).toBeDefined()
  expect(await row.find({ type: 'Text', text: /^"a\/b"$/ })).toBeDefined()
  expect(await row.find({ type: 'Text', text: /^in_progress$/ })).toBeDefined()
  expect(await row.find({ type: 'Text', text: /^warn$/ })).toBeDefined()
  await row.unmount()
})

test('expanded shell output is capped so a huge result cannot hit the node limit', async ($, on) => {
  engine(on)
  await expand($, 'exp-3')
  const stdout = Array.from({ length: 5000 }, (_, i) => `line ${i}`).join('\n')
  const row = await $.ui.mount({
    plugin: 'prismantis',
    surface: 'terminal',
    component: 'ToolUse',
    props: { ...call('Bash', { command: 'seq 5000' }, 'exp-3'), output: { stdout } },
  })
  expect(await row.find({ type: 'Text', text: /^… \+4880 lines$/ })).toBeDefined()
  await row.unmount()
})

test('an expanded shell row with no output says so', async ($, on) => {
  engine(on)
  await expand($, 'exp-4')
  const row = await $.ui.mount({
    plugin: 'prismantis',
    surface: 'terminal',
    component: 'ToolUse',
    props: { ...call('Bash', { command: 'true' }, 'exp-4'), output: { stdout: '', stderr: '' } },
  })
  expect(await row.find({ type: 'Text', text: /^\(No output\)$/ })).toBeDefined()
  await row.unmount()
})

test('standalone tool rows keep the prismantis look', async $ => {
  const ui = await $.ui.mount({
    plugin: 'prismantis',
    surface: 'terminal',
    component: 'ToolUse',
    props: { ...call('Bash', { command: 'ls' }, 'solo-1'), output: { stdout: 'file' } },
  })
  expect(await ui.find({ type: 'Text', text: /^Ran$/ })).toBeDefined()
  await ui.unmount()
})

test('group summaries count by kind', async () => {
  expect(groupSummary([{ tool: 'Grep' }, { tool: 'Grep' }, { tool: 'Edit' }])).toBe('Searched 2 patterns, edited 1 file')
  expect(groupSummary([{ tool: 'WebSearch' }])).toBe('Fetched 1 page')
})

test('turn footer formats durations', async () => {
  expect(formatDuration(3000)).toBe('3s')
  expect(formatDuration(380000)).toBe('6m 20s')
  expect(formatDuration(3720000)).toBe('1h 2m')
})

test('turn footer keeps the word and colors the duration', async $ => {
  const ui = await $.ui.mount({ plugin: 'prismantis', surface: 'terminal', component: 'TurnDuration', props: { word: 'Baked', durationMs: 380000 } })
  expect((await ui.find({ type: 'Text', text: /^6m 20s$/ }))?.props.color).toBe(t.number)
  await ui.unmount()
})

const local = (day: number, h: number, m: number, sec = 0) => new Date(2026, 9, day, h, m, sec).getTime()

test('clock times read as 24h or 12h, with the date when not today', () => {
  const now = local(10, 18, 0)
  expect(clockText(local(10, 14, 32, 5), now, '24h')).toBe('14:32')
  expect(clockText(local(10, 14, 32, 5), now, '12h')).toBe('2:32 PM')
  expect(clockText(local(10, 0, 5), now, '12h')).toBe('12:05 AM')
  expect(clockText(local(9, 23, 5), now, '24h')).toBe('Oct 9 23:05')
})

test('a row takes the newest matching time recorded before it was first drawn', () => {
  const list = [{ text: 'again', at: 1 }, { text: 'hi there', at: 2 }, { text: 'again', at: 3 }]
  expect(sentAt(list, 'again', 2)).toBe(1)
  expect(sentAt(list, ' hi   there\n', 2)).toBe(2)
  expect(sentAt(list, 'again', 3)).toBe(3)
  expect(sentAt(list, 'again', 0)).toBeUndefined()
  expect(sentAt(list, 'never sent', 9)).toBeUndefined()
  const ends = [{ durationMs: 5000, at: 10 }, { durationMs: 60000, at: 20 }, { durationMs: 5200, at: 30 }]
  expect(endedAt(ends, 5200, 30)).toBe(30)
  expect(endedAt(ends, 5200, 29)).toBe(10)
  expect(endedAt(ends, 60400, 30)).toBe(20)
  expect(endedAt(ends, 90000, 30)).toBeUndefined()
})

test('clock adds the end time to the turn footer', { options: { clock: '24h' } }, async ($, on) => {
  mock.clock(on, { now: local(10, 14, 32) })
  on('turn.complete', async (_$, e) => ({ text: e.answer }))
  await $.turn.complete({ answer: 'done', durationMs: 380000, isAborted: false, turnId: 't1', reason: 'answer' })
  const ui = await $.ui.mount({ plugin: 'prismantis', surface: 'terminal', component: 'TurnDuration', props: { word: 'Baked', durationMs: 380000 } })
  expect((await ui.find({ type: 'Text', text: /^14:32$/ }))?.props.color).toBe(t.number)
  await ui.unmount()
})

test('clock off, or a turn it never saw, leaves the turn footer as it was', async ($, on) => {
  mock.clock(on, { now: local(10, 14, 32) })
  on('turn.complete', async (_$, e) => ({ text: e.answer }))
  await $.turn.complete({ answer: 'done', durationMs: 380000, isAborted: false, turnId: 't1', reason: 'answer' })
  const ui = await $.ui.mount({ plugin: 'prismantis', surface: 'terminal', component: 'TurnDuration', props: { word: 'Baked', durationMs: 380000 } })
  expect(await ui.find({ type: 'Text', text: /^14:32$/ })).toBeUndefined()
  await ui.unmount()
})

test('an old turn line that redraws never takes a later end with a close duration', { options: { clock: '24h' } }, async ($, on) => {
  const clock = mock.clock(on, { now: local(10, 14, 0) })
  on('turn.complete', async (_$, e) => ({ text: e.answer }))
  const line = (id: string) => $.ui.mount({ plugin: 'prismantis', surface: 'terminal', component: 'TurnDuration', requestId: id, props: { word: 'Baked', durationMs: 5000 } })
  const old = await line('old')
  await clock.advance(60000)
  await $.turn.complete({ answer: 'done', durationMs: 5100, isAborted: false, turnId: 't2', reason: 'answer' })
  await old.redraw()
  expect(await old.find({ type: 'Text', text: /^14:01$/ })).toBeUndefined()
  const fresh = await line('new')
  expect(await fresh.find({ type: 'Text', text: /^14:01$/ })).toBeDefined()
  await old.unmount()
  await fresh.unmount()
})

test('slash command output renders as markdown, errors stay native', async ($, on) => {
  engine(on)
  const ok = await $.ui.mount({ plugin: 'prismantis', surface: 'terminal', component: 'CommandOutput', props: { command: 'cost', args: '', text: '| a | b |\n|---|---|\n| 1 | 2 |', isErrored: false } })
  expect((await ok.find({ type: 'Text', text: /^a$/ }))?.props.color).toBe(t.tableHeader)
  await ok.unmount()
  const bad = await $.ui.mount({ plugin: 'prismantis', surface: 'terminal', component: 'CommandOutput', props: { command: 'cost', args: '', text: 'boom', isErrored: true } })
  expect(await bad.find({ type: 'Text', text: /^engine$/ })).toBeDefined()
  await bad.unmount()
})

test('your prompts carry the render hint as model-only context', async ($, on) => {
  const seen: (readonly string[] | undefined)[] = []
  mock.env(on, {})
  on('prompt.submit', (_, e) => {
    seen.push(e.context)
    return { text: e.text, context: e.context }
  })
  await $.prompt.submit({ text: 'show me deploys per day', wait: false, origin: { kind: 'composer' } })
  expect(seen[0]?.some(c => c.includes('prismantis'))).toBe(true)
  expect(seen[0]?.some(c => c.includes('fenced block') && c.includes('copy button'))).toBe(true)
  expect(seen[0]).toContain(FIGURE_HINT)
})

test('prompts another plugin sends carry the render hint, framed or as your own words, notifications do not', async ($, on) => {
  const seen: (readonly string[] | undefined)[] = []
  mock.env(on, {})
  on('prompt.submit', (_, e) => {
    seen.push(e.context)
    return { text: e.text, context: e.context }
  })
  await $.prompt.submit({ text: 'next step', wait: false, origin: { kind: 'plugin', name: 'some-plugin', asUser: true } })
  await $.prompt.submit({ text: 'build finished', wait: false, origin: { kind: 'plugin', name: 'some-plugin' } })
  await $.prompt.submit({ text: 'task done', wait: false, origin: { kind: 'task-notification' } })
  expect(seen).toHaveLength(3)
  expect(seen[0]).toContain(FIGURE_HINT)
  expect(seen[1]).toContain(FIGURE_HINT)
  expect(seen[2] ?? []).not.toContain(FIGURE_HINT)
})

test('no render hint when diagramHints is off', { options: { diagramHints: false } }, async ($, on) => {
  const seen: (readonly string[] | undefined)[] = []
  mock.env(on, {})
  on('prompt.submit', (_, e) => {
    seen.push(e.context)
    return { text: e.text, context: e.context }
  })
  await $.prompt.submit({ text: 'hi', wait: false, origin: { kind: 'composer' } })
  expect(seen).toHaveLength(1)
  expect((seen[0] ?? []).filter(c => c !== ISSUE_HINT).some(c => c.includes('prismantis'))).toBe(false)
  expect(seen[0] ?? []).not.toContain(FIGURE_HINT)
})

test('no figure hint when mermaid is off', { options: { mermaid: false } }, async ($, on) => {
  const seen: (readonly string[] | undefined)[] = []
  mock.env(on, {})
  on('prompt.submit', (_, e) => {
    seen.push(e.context)
    return { text: e.text, context: e.context }
  })
  await $.prompt.submit({ text: 'hi', wait: false, origin: { kind: 'composer' } })
  expect(seen).toHaveLength(1)
  expect(seen[0] ?? []).not.toContain(FIGURE_HINT)
})

test('a continuation line joins the list item it is indented under', async () => {
  const [list] = parse('- parent\n  - child\n  more about parent', { numbers: false, paths: false })
  if (list?.kind !== 'list') throw new Error('not a list')
  expect(list.items.map(i => i.inline.map(n => ('text' in n ? n.text : '')).join(''))).toEqual(['parent more about parent', 'child'])
})

test('double-backtick code keeps single backticks inside', async () => {
  const [p] = parse('use ``a `b` c`` here', { numbers: false, paths: false })
  if (p?.kind !== 'paragraph') throw new Error('not a paragraph')
  expect(p.inline.filter(n => n.kind === 'code').map(n => ('text' in n ? n.text : ''))).toEqual(['a `b` c'])
})

test('wide characters take two columns in tables', async $ => {
  const ui = await $.ui.mount({
    plugin: 'prismantis',
    surface: 'terminal',
    component: 'AssistantMessage',
    props: { text: '| 名前 | n |\n|---|---|\n| 寿司 | 1 |', isFirstOfReply: true },
    viewport: { columns: 120, rows: 40 },
  })
  const cells = (await ui.findAll({ type: 'Box' })).filter(b => typeof b.props.width === 'number' && b.props.flexShrink === 0).slice(1)
  expect(cells[0]?.props.width).toBe(4)
  await ui.unmount()
})

test('short columns stay whole next to a very wide one, and a long path is not split', () => {
  expect(columnWidths([2, 5, 20, 161], 96, 3, [2, 3, 9, 38])).toEqual([2, 5, 20, 60])
  expect(columnWidths([2, 45, 80], 86, 3, [2, 45, 7])).toEqual([2, 45, 33])
})

test('a long word takes room from a column that would fit its share', () => {
  expect(columnWidths([100, 40], 90, 2, [60, 5])).toEqual([60, 28])
})

test('columns share the room equally when even the longest words do not fit', () => {
  expect(columnWidths([20, 20], 13, 3, [12, 12])).toEqual([5, 5])
  expect(columnWidths([20, 20, 20], 26, 3, [12, 12, 2])).toEqual([7, 7, 6])
})

test('a long path in a narrow table keeps its column wide enough to stay whole', async $ => {
  const table = [
    '| # | File | Change |',
    '|---|---|---|',
    '| 1 | src/services/reporting/exports/monthly_pdf.py | The monthly export now writes one summary file per region and uploads them after the nightly run |',
  ].join('\n')
  const ui = await $.ui.mount({
    plugin: 'prismantis',
    surface: 'terminal',
    component: 'AssistantMessage',
    props: { text: table, isFirstOfReply: true },
    viewport: { columns: 90, rows: 40 },
  })
  const cells = (await ui.findAll({ type: 'Box' })).filter(b => typeof b.props.width === 'number' && b.props.flexShrink === 0).slice(1, 4)
  expect(cells.map(c => c.props.width)).toEqual([1, 45, 30])
  await ui.unmount()
})

const FULL = [
  '# prismantis',
  '',
  'Status: 3 regions in 6m 20s, p95 82ms. Notes in ~/notes/today.md and https://example.com/docs',
  '',
  '| Name | Size |',
  '| :--- | ---: |',
  '| alpha | 5cm |',
  '',
  '1. first',
  '   - nested',
  '',
  '```mermaid',
  'graph LR',
  '  A --> B',
  '```',
  '',
  '```mermaid',
  'sequenceDiagram',
  '  A->>B: hi',
  '```',
  '',
  '```mermaid',
  'xychart-beta',
  '  x-axis [a, b]',
  '  bar [1, 2]',
  '```',
  '',
  '```ts',
  'const x = "y"',
  '```',
  '',
  '```bash',
  'ls -la',
  '```',
  '',
  '> a quote',
].join('\n')

test('a full reply draws every element itself, with the right copy buttons', async ($, on) => {
  engine(on)
  const ui = await $.ui.mount({
    plugin: 'prismantis',
    surface: 'terminal',
    component: 'AssistantMessage',
    props: { text: FULL, isFirstOfReply: true },
    viewport: { columns: 200, rows: 60 },
  })
  expect(await ui.find({ type: 'Text', text: /^engine$/ })).toBeUndefined()
  expect((await ui.find({ type: 'Text', text: /^Name$/ }))?.props.color).toBe(t.tableHeader)
  const labels = (await ui.findAll({ type: 'Button' })).map(b => b.props.label)
  expect(labels.filter(l => l === '⧉ copy').length).toBe(4)
  expect(labels.filter(l => l === '⧉ md').length).toBe(1)
  expect(labels.filter(l => l === '⧉ source').length).toBe(3)
  expect(labels.filter(l => l === '⧉ art').length).toBe(4)
  expect((await ui.findAll({ type: 'Box' })).some(b => b.props.flexWrap === 'wrap')).toBe(true)
  await ui.unmount()
})

test('headless runs get no render hint', async ($, on) => {
  const seen: (readonly string[] | undefined)[] = []
  mock.env(on, {})
  on('prompt.submit', (_, e) => {
    seen.push(e.context)
    return { text: e.text, context: e.context }
  })
  await $.prompt.submit({ text: 'hi', wait: false, origin: { kind: 'sdk' } })
  expect(seen).toHaveLength(1)
  expect((seen[0] ?? []).some(c => c.includes('prismantis'))).toBe(false)
  expect(seen[0] ?? []).not.toContain(FIGURE_HINT)
})

test('/prismantis theme <name> and /prismantis <name> switch the theme through config', async ($, on) => {
  const writes: { key: string; value: unknown }[] = []
  on('config.set', (_, e) => {
    writes.push({ key: e.key, value: e.value })
    return { value: e.value }
  })
  const result = await $.command.run({ command: 'prismantis', args: 'theme nord', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })
  expect(writes).toEqual([{ key: 'prismantis.theme', value: 'nord' }])
  expect(result.text).toBe('Theme set to nord.')
  const short = await $.command.run({ command: 'prismantis', args: 'random', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })
  expect(writes.at(-1)).toEqual({ key: 'prismantis.theme', value: 'random' })
  expect(short.text).toBe('Theme set to random.')
})

test('/prismantis random re-rolls on every call once the setting is random', { options: { theme: 'random' } }, async ($, on) => {
  on('config.set', (_, e) => ({ value: e.value }))
  const roll = async () => (await $.command.run({ command: 'prismantis', args: 'random', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })).text ?? ''
  const first = /^Theme set to random: (\S+) for now\.\nkeep it: \/prismantis theme \1$/.exec(await roll())?.[1]
  const second = /^Theme set to random: (\S+) for now\./.exec(await roll())?.[1]
  expect(RANDOM_THEMES).toContain(first)
  expect(RANDOM_THEMES).toContain(second)
  expect(second).not.toBe(first)
})

test('/prismantis rejects unknown themes and lists the real ones', async ($, on) => {
  const writes: unknown[] = []
  on('config.set', (_, e) => {
    writes.push(e.value)
    return { value: e.value }
  })
  const bad = await $.command.run({ command: 'prismantis', args: 'theme neon', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })
  expect(writes).toEqual([])
  expect(bad.text?.startsWith('Unknown theme "neon".')).toBe(true)
  const list = await $.command.run({ command: 'prismantis', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })
  expect(list.text?.includes('dracula')).toBe(true)
})

test('theme random can pick every dark color preset, never mono or a light one, and falls back on junk', async () => {
  const n = RANDOM_THEMES.length
  const picks = RANDOM_THEMES.map((_, i) => pickTheme('random', () => (i + 0.5) / n))
  expect(picks).toEqual([...RANDOM_THEMES])
  expect(RANDOM_THEMES).not.toContain('mono')
  expect(RANDOM_THEMES.some(t => /latte|light|dawn/.test(t))).toBe(false)
  expect(RANDOM_THEMES.length).toBeGreaterThan(5)
  expect(pickTheme('nord')).toBe('nord')
  expect(pickTheme('neon')).toBe('catppuccin-mocha')
})

test('/prismantis theme reports the random pick and how to keep it', { options: { theme: 'random' } }, async $ => {
  const run = () => $.command.run({ command: 'prismantis', args: 'theme', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })
  const first = (await run()).text ?? ''
  const name = /^current: (\S+) \(random\)\nkeep it: \/prismantis theme (\S+)$/.exec(first)
  expect(name?.[1]).toBe(name?.[2])
  expect((PRESET_NAMES as readonly string[]).includes(name?.[1] ?? '')).toBe(true)
  expect((await run()).text).toBe(first)
})

test('/prismantis theme reports a fixed theme without the random note', { options: { theme: 'nord' } }, async $ => {
  const result = await $.command.run({ command: 'prismantis', args: 'theme', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })
  expect(result.text).toBe('current: nord')
})

test('task list items parse as checked or open, nested ones too', async () => {
  const [list] = parse('- [ ] write tests\n- [x] ship it\n  - [X] nested done\n- plain', { numbers: false, paths: false })
  if (list?.kind !== 'list') throw new Error('not a list')
  expect(list.items.map(i => i.task)).toEqual([false, true, true, undefined])
  expect(list.items[0]?.inline).toEqual([{ kind: 'text', text: 'write tests' }])
})

test('task lists draw brackets and check marks, done items dimmed and struck through', async $ => {
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'prismantis', component: 'AssistantMessage', props: { text: '- [ ] todo\n- [x] done', isFirstOfReply: true }, viewport: { columns: 80, rows: 20 }, surface })
    expect((await ui.find({ type: 'Text', text: /^\[ \] $/ }))?.props.color).toBe(PRESETS['catppuccin-mocha'].bullet)
    expect(await ui.find({ type: 'Text', text: /^\[✓\] $/ })).toBeDefined()
    expect((await ui.find({ type: 'Text', text: /^done$/ }))?.props).toMatchObject({ dimColor: true, strikethrough: true })
    expect((await ui.find({ type: 'Text', text: /^todo$/ }))?.props.dimColor).toBeFalsy()
    await ui.unmount()
  }
})

const tasks = (surface: 'terminal' | 'desktop') => ({ plugin: 'prismantis', component: 'AssistantMessage' as const, props: { text: '- [ ] todo\n- [x] done', isFirstOfReply: true }, viewport: { columns: 80, rows: 20 }, surface })

test('taskStyle progress draws ticks under a done-count bar', { options: { taskStyle: 'progress' } }, async $ => {
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount(tasks(surface))
    expect(await ui.find({ type: 'Text', text: /^ 1\/2 done$/ })).toBeDefined()
    expect((await ui.find({ type: 'Text', text: /^━{10}$/ }))?.props.color).toBe(PRESETS['catppuccin-mocha'].accent)
    expect(await ui.find({ type: 'Text', text: /^○ $/ })).toBeDefined()
    expect((await ui.find({ type: 'Text', text: /^✓ $/ }))?.props.color).toBe(PRESETS['catppuccin-mocha'].accent)
    expect((await ui.find({ type: 'Text', text: /^done$/ }))?.props).toMatchObject({ dimColor: true, strikethrough: false })
    await ui.unmount()
  }
})

test('taskStyle box draws a box and a tick', { options: { taskStyle: 'box' } }, async $ => {
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount(tasks(surface))
    expect(await ui.find({ type: 'Text', text: /^□ $/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^✓ $/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^ 1\/2 done$/ })).toBeUndefined()
    expect((await ui.find({ type: 'Text', text: /^done$/ }))?.props.strikethrough).toBe(true)
    await ui.unmount()
  }
})

test('markdown links and bare URLs draw as clickable links', async $ => {
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'prismantis', component: 'AssistantMessage', props: { text: 'See [the docs](https://example.com/docs) or https://example.com/raw for more.', isFirstOfReply: true }, viewport: { columns: 100, rows: 20 }, surface })
    const links = await ui.findAll({ type: 'Link' })
    expect(links.map(l => l.props.href)).toEqual(['https://example.com/docs', 'https://example.com/raw'])
    expect((await ui.find({ type: 'Text', text: /^the docs$/ }))?.props.color).toBe(t.link)
    expect(await ui.find({ type: 'Text', text: /\(https:\/\/example\.com\/docs\)/ })).toBeUndefined()
    expect((await ui.find({ type: 'Text', text: /^https:\/\/example\.com\/raw$/ }))?.props.color).toBe(t.link)
    await ui.unmount()
  }
})

const run = (args: string) => ({ command: 'prismantis', args, origin: { kind: 'composer' as const }, presentation: { isFullscreen: false, columns: 120 } })

const transcript = (on: On, messages: { role: 'user' | 'assistant'; text: string }[]) => {
  const copied: string[] = []
  on('session.messages', () => ({ value: messages.map(m => ({ ...m, toolUses: [] })) }))
  on('ui.copy', (_, e) => {
    copied.push(e.text)
    return { value: { isCopied: true as const } }
  })
  return copied
}

test('/prismantis copy copies the last reply without a mouse', async ($, on) => {
  const copied = transcript(on, [{ role: 'user', text: 'hi' }, { role: 'assistant', text: 'old' }, { role: 'user', text: 'again' }, { role: 'assistant', text: 'שלום, the newest reply' }])
  const result = await $.command.run(run('copy'))
  expect(copied).toEqual(['שלום, the newest reply'])
  expect(result.text).toBe('Copied the last reply.')
})

test('/prismantis copy code copies the last code block of the last reply', async ($, on) => {
  const copied = transcript(on, [{ role: 'assistant', text: 'Run:\n\n```bash\nls\n```\n\nthen:\n\n```bash\nnpm test\n```' }])
  const result = await $.command.run(run('copy code'))
  expect(copied).toEqual(['npm test'])
  expect(result.text).toBe('Copied the last code block.')
})

test('/prismantis copy code finds a code block under a list item', async ($, on) => {
  const copied = transcript(on, [{ role: 'assistant', text: '1. Setup:\n   ```bash\n   npm i\n   ```\n2. Next' }])
  await $.command.run(run('copy code'))
  expect(copied).toEqual(['npm i'])
})

test('/prismantis copy code finds a code block inside a quote', async ($, on) => {
  const copied = transcript(on, [{ role: 'assistant', text: '> Try:\n>\n> ```bash\n> npm ci\n> ```' }])
  await $.command.run(run('copy code'))
  expect(copied).toEqual(['npm ci'])
})

test('/prismantis copy says so when there is nothing to copy', async ($, on) => {
  const copied = transcript(on, [{ role: 'assistant', text: 'no code here' }])
  expect((await $.command.run(run('copy code'))).text).toBe('The last reply has no code block.')
  expect(copied).toEqual([])
})

const prompt = (text: string, kind: 'composer' | 'task-notification' = 'composer', surface: 'terminal' | 'desktop' = 'terminal') =>
  ({ plugin: 'prismantis', component: 'UserMessage' as const, props: { text, origin: { kind } as never, isExpanded: true }, viewport: { columns: 80, rows: 10 }, surface })

test('your prompts draw in a rounded accent bubble by default', async $ => {
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount(prompt('how many frog raids?', 'composer', surface))
    const bubble = (await ui.findAll({ type: 'Box' })).find(b => b.props.borderStyle === 'round')
    expect(bubble?.props.borderColor).toBe(PRESETS['catppuccin-mocha'].accent)
    expect((await ui.find({ type: 'Text', text: /^how many frog raids\?$/ }))?.props.color).toBe(PRESETS['catppuccin-mocha'].heading)
    await ui.unmount()
  }
})

test('promptStyle bar draws an accent bar', { options: { promptStyle: 'bar' } }, async $ => {
  const ui = await $.ui.mount(prompt('hi'))
  expect((await ui.find({ type: 'Text', text: /^▌ $/ }))?.props.color).toBe(PRESETS['catppuccin-mocha'].accent)
  expect((await ui.findAll({ type: 'Box' })).some(b => b.props.borderStyle)).toBe(false)
  await ui.unmount()
})

test('promptStyle chevron draws a bold accent prompt', { options: { promptStyle: 'chevron' } }, async $ => {
  const ui = await $.ui.mount(prompt('hi'))
  expect(await ui.find({ type: 'Text', text: /^› $/ })).toBeDefined()
  expect((await ui.find({ type: 'Text', text: /^hi$/ }))?.props).toMatchObject({ bold: true, color: PRESETS['catppuccin-mocha'].accent })
  await ui.unmount()
})

test('promptStyle off and task notifications keep the engine look', { options: { promptStyle: 'off' } }, async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(prompt('hi'))
  expect(await ui.find({ type: 'Text', text: /^engine$/ })).toBeDefined()
  await ui.unmount()
})

test('clock puts the send time before your prompt', { options: { clock: '24h' } }, async ($, on) => {
  mock.clock(on, { now: local(10, 9, 7, 3) })
  on('prompt.submit', (_, e) => ({ text: e.text, context: e.context }))
  await $.prompt.submit({ text: 'how many frog raids?', wait: false, origin: { kind: 'composer' } })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...prompt('how many frog raids?', 'composer', surface), requestId: 'row-1' })
    expect((await ui.find({ type: 'Text', text: /^09:07 $/ }))?.props.color).toBe(t.codeComment)
    await ui.unmount()
  }
  const unsent = await $.ui.mount(prompt('typed before this session'))
  expect(await unsent.find({ type: 'Text', text: /^\d\d:\d\d $/ })).toBeUndefined()
  await unsent.unmount()
})

test('an old prompt row that redraws after a resume never takes a later send time', { options: { clock: '24h' } }, async ($, on) => {
  const clock = mock.clock(on, { now: local(10, 9, 0) })
  on('prompt.submit', (_, e) => ({ text: e.text, context: e.context }))
  const old = await $.ui.mount({ ...prompt('again'), requestId: 'old' })
  await clock.advance(60000)
  await $.prompt.submit({ text: 'again', wait: false, origin: { kind: 'composer' } })
  await old.redraw()
  expect(await old.find({ type: 'Text', text: /^\d\d:\d\d $/ })).toBeUndefined()
  const fresh = await $.ui.mount({ ...prompt('again'), requestId: 'new' })
  expect(await fresh.find({ type: 'Text', text: /^09:01 $/ })).toBeDefined()
  await old.unmount()
  await fresh.unmount()
})

test('clock with promptStyle off stamps the engine row', { options: { clock: '24h', promptStyle: 'off' } }, async ($, on) => {
  mock.clock(on, { now: local(10, 9, 7) })
  on('prompt.submit', (_, e) => ({ text: e.text, context: e.context }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>{e.component === 'UserMessage' ? String(e.props.text) : 'engine'}</Text>
  })
  await $.prompt.submit({ text: 'hi', wait: false, origin: { kind: 'composer' } })
  const ui = await $.ui.mount(prompt('hi'))
  expect(await ui.find({ type: 'Text', text: /^\[09:07\] hi$/ })).toBeDefined()
  await ui.unmount()
})

test('task notifications are not drawn as your prompt', async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(prompt('task done', 'task-notification'))
  expect(await ui.find({ type: 'Text', text: /^engine$/ })).toBeDefined()
  await ui.unmount()
})

test('a Hebrew prompt bubble sits on the right', { options: { rtl: 'warp' } }, async $ => {
  const ui = await $.ui.mount(prompt('כמה פשיטות היו השבוע?'))
  expect((await ui.findAll({ type: 'Box' })).find(b => b.props.borderStyle === 'round')?.props.alignSelf).toBe('flex-end')
  await ui.unmount()
})

test('an unstamped prompt is yours, a teammate message is not', async ($, on) => {
  engine(on)
  const mine = await $.ui.mount(prompt('typed on the command line', 'unclassified' as never))
  expect((await mine.findAll({ type: 'Box' })).some(b => b.props.borderStyle === 'round')).toBe(true)
  await mine.unmount()
  const peer = await $.ui.mount({ ...prompt('from a teammate', 'unclassified' as never), props: { text: 'from a teammate', origin: { kind: 'unclassified' } as never, isExpanded: true, from: { name: 'bob' } as never } })
  expect(await peer.find({ type: 'Text', text: /^engine$/ })).toBeDefined()
  await peer.unmount()
})

const readRow = { plugin: 'prismantis', component: 'ToolUse' as const, props: call('Read', { file_path: '/tmp/x' }, 'ts-1'), viewport: { columns: 100, rows: 10 }, surface: 'terminal' as const }

test('chat puts tool rows on the right, dimmed, by default', async $ => {
  const ui = await $.ui.mount(readRow)
  expect((await ui.findAll({ type: 'Box' })).some(b => b.props.justifyContent === 'flex-end')).toBe(true)
  expect(await ui.find({ type: 'Text', text: /⎿/ })).toBeUndefined()
  expect((await ui.findAll({ type: 'Text' })).find(t => t.props.wrap === 'truncate-end')?.props.dimColor).toBe(true)
  await ui.unmount()
})

test('toolStyle tree-dim tucks tool rows under the sentence', { options: { toolStyle: 'tree-dim' } }, async $ => {
  const ui = await $.ui.mount(readRow)
  expect((await ui.find({ type: 'Text', text: /^ {2}⎿ $/ }))?.props.color).toBe(PRESETS['catppuccin-mocha'].number)
  expect((await ui.findAll({ type: 'Text' })).find(t => t.props.wrap === 'truncate-end')?.props.dimColor).toBe(true)
  await ui.unmount()
})

test('toolStyle classic is the original look', { options: { toolStyle: 'classic' } }, async $ => {
  const ui = await $.ui.mount(readRow)
  expect(await ui.find({ type: 'Text', text: /⎿/ })).toBeUndefined()
  expect((await ui.findAll({ type: 'Text' })).find(t => t.props.wrap === 'truncate-end')?.props.dimColor).toBe(false)
  await ui.unmount()
})

test('toolStyle tree-bold draws one-line narration in bold', { options: { toolStyle: 'tree-bold' } }, async $ => {
  const one = await $.ui.mount({ plugin: 'prismantis', component: 'AssistantMessage', props: { text: 'Checking the tests next.', isFirstOfReply: true }, viewport: { columns: 80, rows: 10 }, surface: 'terminal' })
  expect((await one.find({ type: 'Text', text: /^Checking the tests next\.$/ }))?.props.bold).toBe(true)
  await one.unmount()
  const long = await $.ui.mount({ plugin: 'prismantis', component: 'AssistantMessage', props: { text: 'First.\n\nSecond.', isFirstOfReply: true }, viewport: { columns: 80, rows: 10 }, surface: 'terminal' })
  expect((await long.find({ type: 'Text', text: /^First\.$/ }))?.props.bold).toBeFalsy()
  await long.unmount()
})

test('slash command output with terminal escape codes is left to the engine', async ($, on) => {
  engine(on)
  const colored = await $.ui.mount({ plugin: 'prismantis', surface: 'terminal', component: 'CommandOutput', props: { command: 'context', args: '', text: '\u001b[1mContext Usage\u001b[22m\n\u001b[38;5;246m⛁ 3.8k tokens\u001b[39m', isErrored: false } })
  expect(await colored.find({ type: 'Text', text: /^engine$/ })).toBeDefined()
  await colored.unmount()
})

test('tool rows show paths relative to the project, and ~ for the home directory', async ($, on) => {
  mock.env(on, { HOME: '/home/demo' })
  on('session.root', () => ({ value: '/home/demo/tank-monitor' }))
  const row = async (file_path: string) => {
    const ui = await $.ui.mount({ plugin: 'prismantis', component: 'ToolUse', props: call('Read', { file_path }, `p-${file_path}`), viewport: { columns: 100, rows: 10 }, surface: 'terminal' })
    const text = (await ui.find({ type: 'Text', text: /^Read / }))?.text
    await ui.unmount()
    return text
  }
  expect(await row('/home/demo/tank-monitor/logs/hourly.csv')).toContain('Read logs/hourly.csv')
  expect(await row('/home/demo/notes/todo.md')).toContain('Read ~/notes/todo.md')
  expect(await row('/etc/hosts')).toContain('Read /etc/hosts')
  const group = await $.ui.mount({ plugin: 'prismantis', component: 'ToolGroup', props: { calls: [call('Read', { file_path: '/home/demo/tank-monitor/src/pool.ts' }, 'g1')], isActive: false, isExpanded: false }, viewport: { columns: 100, rows: 10 }, surface: 'terminal' })
  expect(await group.find({ type: 'Text', text: /last: src\/pool\.ts$/ })).toBeDefined()
  await group.unmount()
})

test('tool rows shorten Windows paths against a backslashed root, with USERPROFILE as home', async ($, on) => {
  mock.env(on, { USERPROFILE: 'C:\\Users\\demo' })
  on('session.root', () => ({ value: 'C:\\Users\\demo\\tank-monitor' }))
  const row = async (file_path: string) => {
    const ui = await $.ui.mount({ plugin: 'prismantis', component: 'ToolUse', props: call('Read', { file_path }, `w-${file_path}`), viewport: { columns: 100, rows: 10 }, surface: 'terminal' })
    const text = (await ui.find({ type: 'Text', text: /^Read / }))?.text
    await ui.unmount()
    return text
  }
  expect(await row('C:\\Users\\demo\\tank-monitor\\logs\\hourly.csv')).toContain('Read logs\\hourly.csv')
  expect(await row('c:\\users\\demo\\notes\\todo.md')).toContain('Read ~\\notes\\todo.md')
  expect(await row('D:\\other\\hosts')).toContain('Read D:\\other\\hosts')
})

test('drive-letter roots match case-insensitively and with any separator, POSIX roots stay exact', () => {
  const windows = { cwd: 'E:\\p\\app\\', home: 'E:\\p' }
  expect(shortTarget(windows, 'E:\\p\\app\\src\\main.ts')).toBe('src\\main.ts')
  expect(shortTarget(windows, 'e:/p/app/src/main.ts')).toBe('src/main.ts')
  expect(shortTarget(windows, 'E:\\p\\notes.md')).toBe('~\\notes.md')
  expect(shortTarget(windows, 'E:\\p\\app2\\x.ts')).toBe('~\\app2\\x.ts')
  expect(shortTarget(windows, 'D:\\p\\app\\x.ts')).toBe('D:\\p\\app\\x.ts')
  const posix = { cwd: '/home/dev/app', home: '/home/dev' }
  expect(shortTarget(posix, '/home/dev/App/x.ts')).toBe('~/App/x.ts')
  expect(shortTarget(posix, '/home/dev/app/x.ts')).toBe('x.ts')
})

test('git --output and awk -f are not reads, and an error starting with "at" is not stack noise', () => {
  const shell = (command: string) => isReadOnlyCall('Bash', { command })
  expect(shell('git log --oneline -5')).toBe(true)
  expect(shell('git log --output=log.txt')).toBe(false)
  expect(shell('git diff --output patch.diff')).toBe(false)
  expect(shell("awk -F, '{print $1}' data.csv")).toBe(true)
  expect(shell('awk -f transform.awk data.csv')).toBe(false)
  expect(errorReason('at least one tank id is required')).toBe('at least one tank id is required')
  expect(errorReason('TypeError: boom\n    at run (/app/src/pool.ts:12:5)\n    at main.js:3:1')).toBe('TypeError: boom')
})

test('tool row paths follow the project root after a worktree move', async ($, on) => {
  mock.env(on, { HOME: '/home/demo' })
  let root = '/home/demo/tank-monitor'
  on('session.root', () => ({ value: root }))
  const row = async (file_path: string, id: string) => {
    const ui = await $.ui.mount({ plugin: 'prismantis', component: 'ToolUse', props: call('Read', { file_path }, id), viewport: { columns: 100, rows: 10 }, surface: 'terminal' })
    const text = (await ui.find({ type: 'Text', text: /^Read / }))?.text
    await ui.unmount()
    return text
  }
  expect(await row('/home/demo/tank-monitor/src/pool.ts', 'w1')).toContain('Read src/pool.ts')
  root = '/home/demo/worktrees/tank-monitor-fix'
  expect(await row('/home/demo/worktrees/tank-monitor-fix/src/pool.ts', 'w2')).toContain('Read src/pool.ts')
})

test('/prismantis random redraws replies in the new pick', { options: { theme: 'random' } }, async ($, on) => {
  on('config.set', (_, e) => ({ value: e.value }))
  const heading = async () => {
    const ui = await $.ui.mount({ plugin: 'prismantis', surface: 'terminal', component: 'AssistantMessage', props: { text: '# Tanks', isFirstOfReply: true }, viewport: { columns: 120, rows: 40 } })
    const color = (await ui.find({ type: 'Text', text: /^Tanks$/ }))?.props.color
    await ui.unmount()
    return color
  }
  const run = await $.command.run({ command: 'prismantis', args: 'random', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })
  const picked = /^Theme set to random: (\S+) for now/.exec(run.text ?? '')?.[1] ?? ''
  const want = (PRESETS as Record<string, { heading?: string }>)[picked]?.heading
  expect(want).toBeDefined()
  expect(await heading()).toBe(want)
})

const patch = { filePath: '/tmp/app.ts', structuredPatch: [{ oldStart: 4, newStart: 4, lines: [' const a = 1', '-const b = 2', '+const b = 3', '+const c = 4'] }] }
const editResult = (surface: 'terminal' | 'desktop', tool: string, output: unknown, isErrored = false) =>
  ({ plugin: 'prismantis', surface, component: 'ToolResult' as const, props: { tool_use_id: `d-${surface}`, tool, output, isErrored } })

test('diff lines number old and new sides, and a new file is all additions', () => {
  expect(diffLines(patch)?.map(r => `${r.num}${r.mark}${r.text}`)).toEqual(['4 const a = 1', '5-const b = 2', '5+const b = 3', '6+const c = 4'])
  expect(diffLines({ type: 'create', content: 'one\ntwo\n' })?.map(r => r.mark + r.text)).toEqual(['+one', '+two'])
  expect(diffLines({ stdout: 'x' })).toBeUndefined()
  expect(diffLines('Updated file')).toBeUndefined()
})

for (const toolOutput of ['full', 'quiet'] as const) {
  test(`edits draw a diff card with counts and colored lines (toolOutput ${toolOutput})`, { options: { toolOutput } }, async ($, on) => {
    engine(on)
    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount(editResult(surface, 'Edit', patch))
      expect((await ui.find({ type: 'Text', text: /^\+2$/ }))?.props.color).toBe(t.number)
      expect((await ui.find({ type: 'Text', text: /^−1$/ }))?.props.color).toBe(t.codeFlag)
      expect((await ui.find({ type: 'Text', text: /^\+ $/ }))?.props.color).toBe(t.number)
      expect((await ui.find({ type: 'Text', text: /^- $/ }))?.props.color).toBe(t.codeFlag)
      expect((await ui.find({ type: 'Text', text: /^const a = 1$/ }))?.props.dimColor).toBe(true)
      const row = (text: RegExp) => ui.find({ type: 'Box', text })
      expect((await row(/^6 \+ const c = 4$/))?.props.backgroundColor).toBe(diffTint(t.codeText, t.number))
      expect((await row(/^5 - const b = 2$/))?.props.backgroundColor).toBe(diffTint(t.codeText, t.codeFlag))
      expect((await row(/^4   const a = 1$/))?.props.backgroundColor).toBeUndefined()
      expect((await ui.find({ type: 'Text', text: /^const c = 4$/ }))?.props.color).toBe(t.codeText)
      expect(await ui.find({ type: 'Text', text: /^engine$/ })).toBeUndefined()
      await ui.unmount()
    }
  })
}

test('a long diff card folds to 20 lines, opens on press up to 400, and folds back', async ($, on) => {
  engine(on)
  for (const surface of ['terminal', 'desktop'] as const) {
    const content = Array.from({ length: 25 }, (_, i) => `line ${i + 1}`).join('\n')
    const ui = await $.ui.mount(editResult(surface, 'Write', { type: 'create', filePath: '/tmp/new.txt', content }))
    expect(await ui.find({ type: 'Text', text: /^\+25$/ })).toBeDefined()
    expect((await ui.find({ type: 'Text', text: /^−0$/ }))?.props.dimColor).toBe(true)
    expect((await ui.find({ type: 'Text', text: /^\+25$/ }))?.props.dimColor).toBe(false)
    expect(await ui.find({ type: 'Text', text: /^line 20$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^line 21$/ })).toBeUndefined()
    expect((await ui.find({ key: 'fold' }))?.props.label).toBe('+5 more lines')
    await ui.press({ key: 'fold' })
    expect(await ui.find({ type: 'Text', text: /^line 25$/ })).toBeDefined()
    expect((await ui.find({ key: 'fold' }))?.props.label).toBe('show less')
    await ui.press({ key: 'fold' })
    expect(await ui.find({ type: 'Text', text: /^line 21$/ })).toBeUndefined()
    await ui.unmount()
  }
})

test('an opened diff card stops at 400 lines and counts the rest', async ($, on) => {
  engine(on)
  for (const surface of ['terminal', 'desktop'] as const) {
    const content = Array.from({ length: 450 }, (_, i) => `line ${i + 1}`).join('\n')
    const ui = await $.ui.mount(editResult(surface, 'Write', { type: 'create', filePath: '/tmp/big.txt', content }))
    await ui.press({ key: 'fold' })
    expect(await ui.find({ type: 'Text', text: /^line 400$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^line 401$/ })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /^… \+50 lines$/ })).toBeDefined()
    expect((await ui.findAll({})).length).toBeLessThan(2000)
    await ui.unmount()
  }
})

test('a long diff line wraps right of the gutter and mark', async ($, on) => {
  engine(on)
  for (const surface of ['terminal', 'desktop'] as const) {
    const long = Array.from({ length: 30 }, (_, i) => `word${i}`).join(' ')
    const ui = await $.ui.mount({ ...editResult(surface, 'Write', { type: 'create', filePath: '/tmp/w.txt', content: long }), viewport: { columns: 60, rows: 20 } })
    const line = await ui.find({ type: 'Text', text: long })
    expect(line?.props.wrap).not.toBe('truncate-end')
    expect(await ui.find({ type: 'Text', text: /^1 $/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^\+ $/ })).toBeDefined()
    await ui.unmount()
  }
})

test('edits the card cannot parse, failed edits and other tools go to the engine', async ($, on) => {
  engine(on)
  for (const surface of ['terminal', 'desktop'] as const) {
    for (const [tool, output, isErrored] of [['Edit', 'File updated', false], ['Write', patch, true], ['Read', patch, false]] as const) {
      const ui = await $.ui.mount(editResult(surface, tool, output, isErrored))
      expect(await ui.find({ type: 'Text', text: /^engine$/ })).toBeDefined()
      await ui.unmount()
    }
  }
})

test('edits keep the engine diff when tool rows are off', { options: { toolRows: false } }, async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(editResult('terminal', 'Edit', patch))
  expect(await ui.find({ type: 'Text', text: /^engine$/ })).toBeDefined()
  await ui.unmount()
})

const bashEdit = (stdout = '', more = 0) => ({
  stdout,
  stderr: '',
  interrupted: false,
  bashEditDiff: {
    files: [
      { filePath: '/home/demo/app/src/app.ts', hunks: patch.structuredPatch.map(h => ({ ...h, oldLines: 2, newLines: 3 })) },
      { filePath: '/home/demo/app/NOTES.md', hunks: [{ oldStart: 0, oldLines: 0, newStart: 1, newLines: 2, lines: ['+one', '+two'] }], created: true },
    ],
    moreFiles: more,
  },
})

test('shell edits read one diff per file and a count of files not shown', () => {
  expect(bashEdits(bashEdit('', 3))?.files.map(f => [f.path, f.rows.map(r => `${r.num}${r.mark}${r.text}`)])).toEqual([
    ['/home/demo/app/src/app.ts', ['4 const a = 1', '5-const b = 2', '5+const b = 3', '6+const c = 4']],
    ['/home/demo/app/NOTES.md', ['1+one', '2+two']],
  ])
  expect(bashEdits(bashEdit('', 3))?.more).toBe(3)
  expect(bashEdits({ stdout: 'x' })).toBeUndefined()
  expect(bashEdits({ bashEditDiff: { files: [], moreFiles: 0 } })).toBeUndefined()
  expect(bashEdits({ bashEditDiff: { files: [{ filePath: '/tmp/a' }], moreFiles: 0 } })).toBeUndefined()
  expect(bashEdits({ bashEditDiff: { files: [null], moreFiles: 0 } })).toBeUndefined()
  expect(withoutBashEdits(bashEdit('hi'))).toEqual({ stdout: 'hi', stderr: '', interrupted: false })
})

for (const toolOutput of ['full', 'quiet'] as const) {
  test(`shell edits draw the same diff card as the Edit tool, one per file (toolOutput ${toolOutput})`, { options: { toolOutput } }, async ($, on) => {
    engine(on)
    mock.env(on, { HOME: '/home/demo' })
    on('session.root', () => ({ value: '/home/demo/app' }))
    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount(editResult(surface, 'Bash', bashEdit('', 2)))
      expect((await ui.find({ type: 'Text', text: /^src\/app\.ts $/ }))?.props.color).toBe(t.path)
      expect((await ui.find({ type: 'Text', text: /^NOTES\.md $/ }))?.props.color).toBe(t.path)
      expect((await ui.find({ type: 'Text', text: /^\+2$/ }))?.props.color).toBe(t.number)
      expect((await ui.find({ type: 'Text', text: /^−1$/ }))?.props.color).toBe(t.codeFlag)
      expect((await ui.find({ type: 'Text', text: /^−0$/ }))?.props.dimColor).toBe(true)
      const row = (text: RegExp) => ui.find({ type: 'Box', text })
      expect((await row(/^6 \+ const c = 4$/))?.props.backgroundColor).toBe(diffTint(t.codeText, t.number))
      expect((await row(/^5 - const b = 2$/))?.props.backgroundColor).toBe(diffTint(t.codeText, t.codeFlag))
      expect((await row(/^2 \+ two$/))?.props.backgroundColor).toBe(diffTint(t.codeText, t.number))
      expect((await ui.find({ type: 'Text', text: /^const c = 4$/ }))?.props.color).toBe(t.codeText)
      expect((await ui.find({ type: 'Text', text: /^… \+2 more files$/ }))?.props.dimColor).toBe(true)
      expect(await ui.find({ type: 'Text', text: /^engine$/ })).toBeUndefined()
      expect((await ui.findAll({ type: 'Text', text: /^  ⎿  $/ })).length).toBe(1)
      await ui.unmount()
    }
  })
}

test('a shell edit with output keeps the engine output, without the engine diff, above the cards', async ($, on) => {
  const seen: unknown[] = []
  on('ui.render', ($, e) => {
    seen.push(e.props && 'output' in e.props ? e.props.output : undefined)
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    seen.length = 0
    const ui = await $.ui.mount(editResult(surface, 'Bash', bashEdit('patched 2 files')))
    expect(await ui.find({ type: 'Text', text: /^engine$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^\+2$/ })).toBeDefined()
    expect(seen).toEqual([{ stdout: 'patched 2 files', stderr: '', interrupted: false }])
    expect(await ui.find({ type: 'Text', text: /^ {5}$/ })).toBeDefined()
    await ui.unmount()
  }
})

test('toolOutput quiet keeps a shell edit diff under the first lines of its output', { options: { toolOutput: 'quiet' } }, async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(editResult('terminal', 'Bash', bashEdit('patched 2 files')))
  expect(await ui.find({ type: 'Text', text: /^patched 2 files$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^\+2$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^engine$/ })).toBeUndefined()
  await ui.unmount()
})

test('each shell edit card folds on its own', async ($, on) => {
  engine(on)
  const long = Array.from({ length: 25 }, (_, i) => `+line ${i + 1}`)
  const file = (name: string) => ({ filePath: `/tmp/${name}`, hunks: [{ oldStart: 0, oldLines: 0, newStart: 1, newLines: 25, lines: long }] })
  const ui = await $.ui.mount(editResult('terminal', 'Bash', { stdout: '', stderr: '', interrupted: false, bashEditDiff: { files: [file('a.txt'), file('b.txt')], moreFiles: 0 } }))
  expect((await ui.findAll({ type: 'Text', text: /^line 21$/ })).length).toBe(0)
  await ui.press({ key: 'fold1' })
  expect((await ui.findAll({ type: 'Text', text: /^line 21$/ })).length).toBe(1)
  expect((await ui.find({ key: 'fold0' }))?.props.label).toBe('+5 more lines')
  expect((await ui.find({ key: 'fold1' }))?.props.label).toBe('show less')
  await ui.unmount()
})

test('failed shell edits, diffs the card cannot read and tool rows off go to the engine', async ($, on) => {
  engine(on)
  for (const surface of ['terminal', 'desktop'] as const) {
    for (const [output, isErrored] of [[bashEdit(), true], [{ stdout: '', stderr: '', bashEditDiff: { files: [], moreFiles: 0, unavailable: true } }, false], [{ stdout: '', stderr: '', bashEditDiff: { files: [{ filePath: '/tmp/a', hunks: 'x' }], moreFiles: 0 } }, false]] as const) {
      const ui = await $.ui.mount(editResult(surface, 'Bash', output, isErrored))
      expect(await ui.find({ type: 'Text', text: /^engine$/ })).toBeDefined()
      await ui.unmount()
    }
  }
})

const HEX_COLOR = /^#[0-9a-f]{6}$/i

const lab = (hex: string): [number, number, number] => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [number, number, number]
  const f = (v: number) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116)
  const [x, y, z] = [(0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, 0.2126 * r + 0.7152 * g + 0.0722 * b, (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883].map(f) as [number, number, number]
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}

const deltaE = (p: string, q: string): number => {
  const rad = (d: number) => (d * Math.PI) / 180
  const [[l1, a1, b1], [l2, a2, b2]] = [lab(p), lab(q)]
  const cMean = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2
  const g = 0.5 * (1 - Math.sqrt(cMean ** 7 / (cMean ** 7 + 25 ** 7)))
  const [a1p, a2p] = [a1 * (1 + g), a2 * (1 + g)]
  const [c1, c2] = [Math.hypot(a1p, b1), Math.hypot(a2p, b2)]
  const [h1, h2] = [((Math.atan2(b1, a1p) * 180) / Math.PI + 360) % 360, ((Math.atan2(b2, a2p) * 180) / Math.PI + 360) % 360]
  const dh = c1 * c2 === 0 ? 0 : Math.abs(h2 - h1) <= 180 ? h2 - h1 : h2 > h1 ? h2 - h1 - 360 : h2 - h1 + 360
  const [dL, dC, dH] = [l2 - l1, c2 - c1, 2 * Math.sqrt(c1 * c2) * Math.sin(rad(dh / 2))]
  const [lMean, cpMean] = [(l1 + l2) / 2, (c1 + c2) / 2]
  const hMean = c1 * c2 === 0 ? h1 + h2 : Math.abs(h1 - h2) <= 180 ? (h1 + h2) / 2 : h1 + h2 < 360 ? (h1 + h2 + 360) / 2 : (h1 + h2 - 360) / 2
  const tt = 1 - 0.17 * Math.cos(rad(hMean - 30)) + 0.24 * Math.cos(rad(2 * hMean)) + 0.32 * Math.cos(rad(3 * hMean + 6)) - 0.2 * Math.cos(rad(4 * hMean - 63))
  const sl = 1 + (0.015 * (lMean - 50) ** 2) / Math.sqrt(20 + (lMean - 50) ** 2)
  const [sc, sh] = [1 + 0.045 * cpMean, 1 + 0.015 * cpMean * tt]
  const rt = -2 * Math.sqrt(cpMean ** 7 / (cpMean ** 7 + 25 ** 7)) * Math.sin(rad(60 * Math.exp(-(((hMean - 275) / 25) ** 2))))
  return Math.sqrt((dL / sl) ** 2 + (dC / sc) ** 2 + (dH / sh) ** 2 + rt * (dC / sc) * (dH / sh))
}

test('diff tints mix the line color\'s full hue into black on dark themes and white on light ones, keeping code text at 4.5:1', () => {
  expect(fullHue('#a6e3a1')).toBe('#13ff00')
  expect(fullHue('#808080')).toBe('#808080')
  expect(diffTint(t.codeText, t.number)).toBe('#064d00')
  expect(diffTint(t.codeText, t.number)).toBe(tint('#000000', fullHue(t.number), 0.3))
  const latte = PRESETS['catppuccin-latte']
  expect(diffTint(latte.codeText, latte.codeFlag)).toBe('#ffccd7')
  const solarized = PRESETS['solarized-light']
  expect([solarized.diffAdded, solarized.diffRemoved].some(c => diffTint(solarized.codeText, c) !== tint('#ffffff', fullHue(c!), 0.2))).toBe(true)
  expect(diffTint(undefined, t.number)).toBeUndefined()
  expect(diffTint(t.codeText, 'green')).toBeUndefined()
})

test('every color preset has its own diff green and red, readable on their tints and told apart by at least ΔE 13', () => {
  expect(deltaE('#000000', '#000000')).toBe(0)
  expect(Math.abs(deltaE('#ff0000', '#00ff00') - 86.6)).toBeLessThan(0.1)
  for (const [name, theme] of Object.entries(PRESETS) as [string, Theme][]) {
    if (!theme.codeText) continue
    const [added, removed] = [theme.diffAdded!, theme.diffRemoved!]
    const [addTint, removeTint] = [diffTint(theme.codeText, added)!, diffTint(theme.codeText, removed)!]
    expect([name, HEX_COLOR.test(added), HEX_COLOR.test(removed)]).toEqual([name, true, true])
    expect([name, contrast(theme.codeText, addTint) >= 4.5, contrast(theme.codeText, removeTint) >= 4.5, deltaE(addTint, removeTint) >= 13, deltaE(added, removed) >= 13])
      .toEqual([name, true, true, true, true])
  }
})

test('a diff card draws its counts, marks and tints in the theme\'s diff colors', { options: { theme: 'dracula' } }, async ($, on) => {
  engine(on)
  const dracula = PRESETS.dracula
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount(editResult(surface, 'Edit', patch))
    expect((await ui.find({ type: 'Text', text: /^\+2$/ }))?.props.color).toBe(dracula.diffAdded)
    expect((await ui.find({ type: 'Text', text: /^−1$/ }))?.props.color).toBe(dracula.diffRemoved)
    expect((await ui.find({ type: 'Text', text: /^\+ $/ }))?.props.color).toBe(dracula.diffAdded)
    expect((await ui.find({ type: 'Text', text: /^- $/ }))?.props.color).toBe(dracula.diffRemoved)
    expect((await ui.find({ type: 'Box', text: /^6 \+ const c = 4$/ }))?.props.backgroundColor).toBe(diffTint(dracula.codeText, dracula.diffAdded))
    expect((await ui.find({ type: 'Box', text: /^5 - const b = 2$/ }))?.props.backgroundColor).toBe(diffTint(dracula.codeText, dracula.diffRemoved))
    await ui.unmount()
  }
})

test('diffAddedColor and diffRemovedColor set the diff colors like any other token', { options: { diffAddedColor: '#22c55e', diffRemovedColor: 'red' } }, async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(editResult('terminal', 'Edit', patch))
  expect((await ui.find({ type: 'Text', text: /^\+ $/ }))?.props.color).toBe('#22c55e')
  expect((await ui.find({ type: 'Box', text: /^6 \+ const c = 4$/ }))?.props.backgroundColor).toBe(diffTint(t.codeText, '#22c55e'))
  expect((await ui.find({ type: 'Text', text: /^- $/ }))?.props.color).toBe('red')
  expect((await ui.find({ type: 'Box', text: /^5 - const b = 2$/ }))?.props.backgroundColor).toBeUndefined()
  await ui.unmount()
})

for (const diffStyle of ['card', 'full', 'marks', 'bar'] as const) {
  test(`diffStyle ${diffStyle} draws edit and shell edit diffs its way`, { options: { diffStyle } }, async ($, on) => {
    engine(on)
    const tinted = diffStyle === 'card' || diffStyle === 'full'
    for (const surface of ['terminal', 'desktop'] as const) {
      for (const [tool, output, changed] of [['Edit', patch, 3], ['Bash', bashEdit(), 5]] as const) {
        const ui = await $.ui.mount(editResult(surface, tool, output))
        const boxes = await ui.findAll({ type: 'Box' })
        const row = (text: RegExp) => ui.find({ type: 'Box', text })
        expect(boxes.some(b => b.props.borderStyle === 'round')).toBe(diffStyle === 'card')
        expect(boxes.some(b => b.props.flexGrow === 1)).toBe(diffStyle === 'full')
        expect(boxes.some(b => b.props.alignItems === 'flex-start')).toBe(diffStyle !== 'full')
        expect((await row(/^(▌ )?6 \+ const c = 4$/))?.props.backgroundColor).toBe(tinted ? diffTint(t.codeText, t.number) : undefined)
        expect((await row(/^(▌ )?5 - const b = 2$/))?.props.backgroundColor).toBe(tinted ? diffTint(t.codeText, t.codeFlag) : undefined)
        expect((await ui.find({ type: 'Text', text: /^const c = 4$/ }))?.props.color).toBe(diffStyle === 'marks' ? t.number : t.codeText)
        expect((await ui.find({ type: 'Text', text: /^const b = 2$/ }))?.props.color).toBe(diffStyle === 'marks' ? t.codeFlag : t.codeText)
        expect((await ui.findAll({ type: 'Text', text: /^▌ $/ })).length).toBe(diffStyle === 'bar' ? changed : 0)
        expect((await ui.find({ type: 'Text', text: /^\+2$/ }))?.props.color).toBe(t.number)
        expect((await ui.find({ type: 'Text', text: /^- $/ }))?.props.color).toBe(t.codeFlag)
        await ui.unmount()
      }
    }
  })
}

test('an unknown diffStyle draws the card', { options: { diffStyle: 'fancy' } }, async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(editResult('terminal', 'Edit', patch))
  expect((await ui.findAll({ type: 'Box' })).some(b => b.props.borderStyle === 'round')).toBe(true)
  await ui.unmount()
})

test('a git step that can move the working tree is told apart from other git calls', () => {
  for (const command of ['git checkout main', 'git -C repo switch feature', 'sudo git reset --hard HEAD~1', 'make && git stash pop', 'git -c core.pager=cat pull --rebase', 'FOO=1 git cherry-pick abc123'])
    expect(movesTree(command)).toBe(true)
  for (const command of ['git commit -m "checkout later"', 'git log --oneline', "echo 'git checkout main'", 'sed -i s/a/b/ notes.md', 'git diff --stat'])
    expect(movesTree(command)).toBe(false)
})

const shellEdit = (id: string, output: unknown) =>
  ({ plugin: 'prismantis', surface: 'terminal' as const, component: 'ToolResult' as const, props: { tool_use_id: id, tool: 'Bash', output, isErrored: false } })
const said = (text: string) => ({ type: 'Text' as const, text: `(${text})` })

test('shell edit cards carry the notes Claude Code gives its own diff', async ($, on) => {
  engine(on)
  const first = await $.ui.mount(shellEdit('n-1', bashEdit()))
  expect((await first.find(said(EDIT_NOTES.first)))?.props.dimColor).toBe(true)
  expect(await first.find(said(EDIT_NOTES.shared))).toBeUndefined()
  expect(await first.find(said(EDIT_NOTES.tree))).toBeUndefined()
  await first.unmount()
  const second = await $.ui.mount(shellEdit('n-2', { ...bashEdit(), bashEditDiff: { ...bashEdit().bashEditDiff, shared: true } }))
  expect(await second.find(said(EDIT_NOTES.first))).toBeUndefined()
  expect((await second.find(said(EDIT_NOTES.shared)))?.props.dimColor).toBe(true)
  await second.unmount()
  const row = await $.ui.mount({ plugin: 'prismantis', surface: 'terminal', component: 'ToolUse', props: call('Bash', { command: 'git checkout main && sed -i s/b/c/ src/app.ts' }, 'n-3') })
  const third = await $.ui.mount(shellEdit('n-3', bashEdit()))
  expect((await third.find(said(EDIT_NOTES.tree)))?.props.dimColor).toBe(true)
  await third.unmount()
  await row.unmount()
  const again = await $.ui.mount(shellEdit('n-1', bashEdit()))
  expect(await again.find(said(EDIT_NOTES.first))).toBeDefined()
  await again.unmount()
})

test('shell edits keep the engine diff when tool rows are off', { options: { toolRows: false } }, async ($, on) => {
  engine(on)
  const ui = await $.ui.mount(editResult('terminal', 'Bash', bashEdit()))
  expect(await ui.find({ type: 'Text', text: /^engine$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^\+2$/ })).toBeUndefined()
  await ui.unmount()
})

test('a root spelled with another case or separators prints as the dot, but only for drive letters', () => {
  expect(shortTarget({ cwd: 'E:\\projects\\example', home: 'E:\\u' }, 'e:\\projects\\example')).toBe('.')
  expect(shortTarget({ cwd: 'E:\\projects\\example', home: 'E:\\u' }, 'e:/projects/example/')).toBe('.')
  expect(shortTarget({ cwd: '/home/dev/app', home: '/home/dev' }, '/home/dev/app')).toBe('.')
  expect(shortTarget({ cwd: '/home/dev/app', home: '/home/dev' }, '/home/dev/App')).toBe('~/App')
})

test('an expanded shell row whose output is an error string shows that string', async ($, on) => {
  engine(on)
  await expand($, 'exp-err')
  const row = await $.ui.mount({
    plugin: 'prismantis',
    surface: 'terminal',
    component: 'ToolUse',
    props: { ...call('Bash', { command: 'cat /root/x' }, 'exp-err'), isErrored: true, output: 'Error: permission denied' },
  })
  expect(await row.find({ type: 'Text', text: /^engine$/ })).toBeDefined()
  await row.unmount()
})

const setupRun = ($: Parameters<TestBody>[0], args: string) => $.command.run({ command: 'prismantis', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })

test('/prismantis setup walks every step, saves each pick through config, and can restart or jump to a step', async ($, on) => {
  const writes: { key: string; value: unknown }[] = []
  paneStandIn(on, [])
  on('config.set', (_, e) => {
    writes.push({ key: e.key, value: e.value })
    return { value: e.value }
  })
  const steps = setupSteps(PRESET_NAMES)
  expect(steps.map(s => s.key)).toEqual(['theme', 'tableStyle', 'taskStyle', 'promptStyle', 'toolStyle', 'toolOutput'])
  for (const step of steps.slice(1)) for (const value of step.options) expect(resolveStyle({ [step.key]: value })[step.key]).toBe(value)
  expect(steps[0]!.options).toEqual(PRESET_NAMES)
  expect((await setupRun($, 'setup')).text).toBe(SETUP_PANE_OPENED)
  expect((await setupRun($, 'setup theme')).text).toBe(setupText(setupParts(PRESET_NAMES, 0)))
  expect((await setupRun($, 'setup theme nord')).text).toBe(`Theme set to nord.\n\n${setupText(setupParts(PRESET_NAMES, 1))}`)
  expect((await setupRun($, 'setup tables 3')).text).toBe(`Tables set to grid.\n\n${setupText(setupParts(PRESET_NAMES, 2))}`)
  expect((await setupRun($, 'setup tasks progress')).text?.startsWith('Tasks set to progress.')).toBe(true)
  expect((await setupRun($, 'setup prompts bar')).text?.startsWith('Your prompts set to bar.')).toBe(true)
  expect((await setupRun($, 'setup tools tree-bold')).text).toBe(`Tool rows set to tree-bold.\n\n${setupText(setupParts(PRESET_NAMES, 5))}`)
  expect((await setupRun($, 'setup output 2')).text).toBe(`Tool output set to quiet.\n\n${SETUP_DONE}`)
  expect(writes).toEqual([
    { key: 'prismantis.theme', value: 'nord' },
    { key: 'prismantis.tableStyle', value: 'grid' },
    { key: 'prismantis.taskStyle', value: 'progress' },
    { key: 'prismantis.promptStyle', value: 'bar' },
    { key: 'prismantis.toolStyle', value: 'tree-bold' },
    { key: 'prismantis.toolOutput', value: 'quiet' },
  ])
  expect((await setupRun($, 'setup tasks')).text).toBe(setupText(setupParts(PRESET_NAMES, 2)))
  expect((await setupRun($, 'setup tables 9')).text?.startsWith('Unknown tables pick "9".')).toBe(true)
  expect((await setupRun($, 'setup colors')).text?.startsWith('Unknown setup step "colors".')).toBe(true)
  expect(writes).toHaveLength(6)
  expect(setupText(setupParts(PRESET_NAMES, 4))).toContain('`tree-bold` or `classic`')
})

const paneStandIn = (on: Parameters<TestBody>[1], log: string[], surfaces: readonly ('terminal' | 'desktop')[] = ['terminal']) => {
  on('session.surfaces', () => ({ value: surfaces }))
  on('ui.open', (_, e) => {
    log.push(`open ${e.id}`)
    return { value: { isPlaced: true as const } }
  })
  on('ui.close', (_, e) => {
    log.push(`close ${e.id}`)
    return { value: undefined }
  })
}

const setupPane = ($: Parameters<TestBody>[0], surface: 'terminal' | 'desktop') =>
  $.ui.mount({ plugin: 'prismantis', surface, component: 'Pane', requestId: 'prismantis-setup', props: { title: 'prismantis setup', isFocused: true, bodyColumns: 90, placement: 'dock', scroll: { offset: 0, bodyRows: 48 }, view: {} }, viewport: { columns: 180, rows: 50 } })

test('/prismantis setup opens a pane in the terminal: arrows move through the styles with a preview of the one in focus, Enter saves it and shows the next step, the last pick closes the pane', async ($, on) => {
  const writes: { key: string; value: unknown }[] = []
  on('config.set', (_, e) => {
    writes.push({ key: e.key, value: e.value })
    return { value: e.value }
  })
  on('ui.focus', () => ({}))
  const panes: string[] = []
  paneStandIn(on, panes)
  expect((await setupRun($, 'setup')).text).toBe(SETUP_PANE_OPENED)
  expect(panes).toEqual(['open prismantis-setup'])
  const pane = await setupPane($, 'terminal')
  expect(await pane.find({ type: 'Text', text: /Setup 1\/6: Theme/ })).toBeTruthy()
  expect(await pane.find({ type: 'Text', text: new RegExp(SETUP_PANE_KEYS.slice(0, 20)) })).toBeTruthy()
  expect((await pane.findAll({ type: 'Button' })).map(b => b.props.key)).toHaveLength(PRESET_NAMES.length + 1)
  expect(await pane.find({ type: 'Button', key: 'pick:theme:catppuccin-mocha' })).toMatchObject({ props: { autoFocus: true, variant: 'primary' } })
  expect(await pane.find({ type: 'Text', text: /^\d+\. catppuccin-mocha/ })).toBeTruthy()
  expect(await pane.find({ type: 'Text', text: /^\d+\. nord/ })).toBeUndefined()
  await $.ui.focus({ component: 'Pane', requestId: 'prismantis-setup', element: 'pick:theme:nord', origin: { kind: 'person' } })
  expect(await pane.find({ type: 'Text', text: /^\d+\. nord/ })).toBeTruthy()
  expect(await pane.find({ type: 'Text', text: /^\d+\. catppuccin-mocha/ })).toBeUndefined()
  await pane.press({ key: 'pick:theme:nord' })
  expect(await pane.find({ type: 'Text', text: /Setup 2\/6: Tables/ })).toBeTruthy()
  for (const [step, value] of [['tables', 'grid'], ['tasks', 'progress'], ['prompts', 'bar'], ['tools', 'tree-bold']] as const) await pane.press({ key: `pick:${step}:${value}` })
  expect(await pane.find({ type: 'Text', text: /Setup 6\/6: Tool output/ })).toBeTruthy()
  await pane.press({ key: 'pick:output:quiet' })
  expect(writes.map(w => `${w.key}=${String(w.value)}`)).toEqual(['prismantis.theme=nord', 'prismantis.tableStyle=grid', 'prismantis.taskStyle=progress', 'prismantis.promptStyle=bar', 'prismantis.toolStyle=tree-bold', 'prismantis.toolOutput=quiet'])
  expect(panes).toEqual(['open prismantis-setup', 'close prismantis-setup'])
  await pane.unmount()
})

test('/prismantis setup in a session with no terminal, as the desktop app runs it, walks the steps in the transcript and opens no pane', async ($, on) => {
  const panes: string[] = []
  paneStandIn(on, panes, ['desktop'])
  expect((await setupRun($, 'setup')).text).toBe(setupText(setupParts(PRESET_NAMES, 0)))
  expect(panes).toEqual([])
})

test('/prismantis setup sent from a Remote Control client to a terminal session walks the steps in the transcript and opens no pane', async ($, on) => {
  const panes: string[] = []
  paneStandIn(on, panes, ['terminal', 'desktop'])
  const run = await $.command.run({ command: 'prismantis', args: 'setup', origin: { kind: 'bridge' }, presentation: { isFullscreen: false, columns: 120 } })
  expect(run.text).toBe(setupText(setupParts(PRESET_NAMES, 0)))
  expect(panes).toEqual([])
})

test('/prismantis setup in the pane stays on the step and keeps the pane open when a save is refused', async ($, on) => {
  on('config.set', () => ({ deny: 'managed' }))
  on('ui.focus', () => ({}))
  const toasts: string[] = []
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  const panes: string[] = []
  paneStandIn(on, panes)
  await setupRun($, 'setup')
  const pane = await setupPane($, 'terminal')
  await pane.press({ key: 'pick:theme:nord' })
  expect(await pane.find({ type: 'Text', text: /Setup 1\/6: Theme/ })).toBeTruthy()
  expect(await pane.find({ type: 'Button', key: 'pick:theme:nord' })).toMatchObject({ props: { variant: 'primary' } })
  expect(panes).toEqual(['open prismantis-setup'])
  expect(toasts.at(-1)).toBe('Could not switch theme: managed')
  await pane.unmount()
})

test('/prismantis setup in the pane keeps to the rows it is given when the list fits, so the arrows move the ring instead of scrolling', async ($, on) => {
  paneStandIn(on, [])
  await setupRun($, 'setup')
  const mount = (bodyRows: number) => $.ui.mount({ plugin: 'prismantis', surface: 'terminal', component: 'Pane', requestId: 'prismantis-setup', props: { title: 'prismantis setup', isFocused: true, bodyColumns: 90, placement: 'dock', scroll: { offset: 0, bodyRows }, view: {} }, viewport: { columns: 100, rows: 40 } })
  const fits = await mount(26)
  expect((await fits.findAll({ type: 'Box' })).filter(b => b.props.height === 26 && b.props.overflow === 'hidden')).toHaveLength(1)
  await fits.unmount()
  const tight = await mount(20)
  expect((await tight.findAll({ type: 'Box' })).filter(b => b.props.height !== undefined)).toHaveLength(0)
  await tight.unmount()
})

test('/prismantis setup in the pane opens again on the last step when its save is refused', async ($, on) => {
  on('config.set', (_, e) => (e.key === 'prismantis.toolOutput' ? { deny: 'managed' } : { value: e.value }))
  on('ui.focus', () => ({}))
  const toasts: string[] = []
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  const panes: string[] = []
  paneStandIn(on, panes)
  await setupRun($, 'setup')
  const pane = await setupPane($, 'terminal')
  for (const [step, value] of [['theme', 'nord'], ['tables', 'grid'], ['tasks', 'progress'], ['prompts', 'bar'], ['tools', 'tree-bold'], ['output', 'quiet']] as const) await pane.press({ key: `pick:${step}:${value}` })
  expect(panes).toEqual(['open prismantis-setup', 'close prismantis-setup', 'open prismantis-setup'])
  expect(await pane.find({ type: 'Text', text: /Setup 6\/6: Tool output/ })).toBeTruthy()
  expect(toasts.at(-1)).toBe('Could not save toolOutput: managed')
  await pane.unmount()
})

test('/prismantis setup in the pane shows the next step and its toast before the save returns, since a save that changes a value reloads the mod', async ($, on) => {
  on('config.set', () => new Promise(() => undefined))
  on('ui.focus', () => ({}))
  const toasts: string[] = []
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  paneStandIn(on, [])
  await setupRun($, 'setup')
  const pane = await setupPane($, 'terminal')
  await pane.press({ key: 'pick:theme:dracula' })
  expect(await pane.find({ type: 'Text', text: /Setup 2\/6: Tables/ })).toBeTruthy()
  expect(await pane.find({ type: 'Button', key: 'pick:tables:box' })).toMatchObject({ props: { variant: 'primary' } })
  expect(toasts).toEqual(['Theme set to dracula.'])
  await pane.unmount()
})

test('/prismantis setup walks the steps in the transcript and closes the pane when no surface can place it', async ($, on) => {
  const panes: string[] = []
  on('session.surfaces', () => ({ value: ['terminal' as const] }))
  on('ui.open', (_, e) => {
    panes.push(`open ${e.id}`)
    return { value: { isPlaced: false as const, reason: 'no-surface' } }
  })
  on('ui.close', (_, e) => {
    panes.push(`close ${e.id}`)
    return { value: undefined }
  })
  expect((await setupRun($, 'setup')).text).toBe(setupText(setupParts(PRESET_NAMES, 0)))
  expect(panes).toEqual(['open prismantis-setup', 'close prismantis-setup'])
})

test('/prismantis setup previews the theme random uses now when the ring is on random', { options: { theme: 'random' } }, async ($, on) => {
  on('ui.focus', () => ({}))
  paneStandIn(on, [])
  await setupRun($, 'setup')
  const pane = await setupPane($, 'terminal')
  expect(await pane.find({ type: 'Button', key: 'pick:theme:random' })).toMatchObject({ props: { autoFocus: true, variant: 'primary' } })
  expect(await pane.find({ type: 'Text', text: /Release notes/ })).toBeTruthy()
  await pane.unmount()
})

test('/prismantis setup stops on a refused save', async ($, on) => {
  on('config.set', () => ({ deny: 'managed' }))
  expect((await setupRun($, 'setup tables box')).text).toBe('Could not save tableStyle: managed')
})

test('/prismantis setup marks light themes for a light terminal', () => {
  const labels = setupParts(PRESET_NAMES, 0).options.map(o => o.text.split('\n')[0] ?? '')
  expect(labels.filter(l => l.endsWith('(for a light terminal)')).length).toBe(PRESET_NAMES.filter(t => /latte|light|dawn/.test(t)).length)
  expect(labels.find(l => l.includes('mono'))).not.toContain('light terminal')
})

test('/prismantis setup draws each sample in its own style', async $ => {
  const mount = async (at: number) =>
    $.ui.mount({ plugin: 'prismantis', surface: 'terminal', component: 'CommandOutput', props: { command: 'prismantis', args: 'setup', text: `Tables set to box.\n\n${setupText(setupParts(PRESET_NAMES, at))}`, isErrored: false }, viewport: { columns: 100, rows: 40 } })
  const themes = await mount(0)
  for (const name of ['nord', 'dracula']) {
    const heading = await themes.find({ type: 'Text', text: new RegExp(`${name}$`) })
    expect(heading?.props.color).toBe(PRESETS[name as keyof typeof PRESETS].accent)
  }
  await themes.unmount()
  const tasks = await mount(2)
  expect(await tasks.find({ type: 'Text', text: /^✓ $/ })).toBeTruthy()
  expect(await tasks.find({ type: 'Text', text: /\[✓\]/ })).toBeTruthy()
  await tasks.unmount()
  const prompts = await mount(3)
  expect(await prompts.findAll({ type: 'Text', text: /fix the failing test/ })).toHaveLength(4)
  await prompts.unmount()
  const tools = await mount(4)
  expect(await tools.find({ type: 'Text', text: /⎿/ })).toBeTruthy()
  expect(await tools.findAll({ type: 'Text', text: /^Read$/ })).toHaveLength(4)
  await tools.unmount()
  const output = await mount(5)
  expect(await output.findAll({ type: 'Text', text: /^Build the app · npm/ })).toHaveLength(1)
  expect(await output.findAll({ type: 'Text', text: /Error: Exit code 2/ })).toHaveLength(1)
  expect(await output.findAll({ type: 'Text', text: /error TS2322/ })).toHaveLength(7)
  expect(await output.findAll({ type: 'Text', text: /\+4 lines \(ctrl\+o to expand\)/ })).toHaveLength(1)
  expect(await output.findAll({ type: 'Text', text: /Found 10 errors in the same file/ })).toHaveLength(1)
  expect(await output.findAll({ type: 'Text', text: /On branch main/ })).toHaveLength(1)
  expect(await output.findAll({ type: 'Text', text: /Allowed by auto mode classifier/ })).toHaveLength(1)
  expect(await output.findAll({ type: 'Text', text: /\+3 lines \(ctrl\+o to expand\)/ })).toHaveLength(1)
  await output.unmount()
})

test('the issue hint rides the first prompt and every tenth, also with diagram hints off', async ($, on) => {
  const seen: (readonly string[] | undefined)[] = []
  mock.env(on, {})
  on('prompt.submit', (_, e) => {
    seen.push(e.context)
    return { text: e.text, context: e.context }
  })
  for (let i = 0; i < 11; i++) await $.prompt.submit({ text: `prompt ${i}`, wait: false, origin: { kind: 'composer' } })
  expect(seen.map(c => c?.includes(ISSUE_HINT) ?? false)).toEqual([true, false, false, false, false, false, false, false, false, false, true])
})

test('issueHint off leaves the issue hint out', { options: { issueHint: false } }, async ($, on) => {
  const seen: (readonly string[] | undefined)[] = []
  mock.env(on, {})
  on('prompt.submit', (_, e) => {
    seen.push(e.context)
    return { text: e.text, context: e.context }
  })
  await $.prompt.submit({ text: 'hi', wait: false, origin: { kind: 'composer' } })
  expect(seen[0]?.includes(ISSUE_HINT) ?? false).toBe(false)
})

test('with diagram hints off, the issue hint still goes out alone', { options: { diagramHints: false } }, async ($, on) => {
  const seen: (readonly string[] | undefined)[] = []
  mock.env(on, {})
  on('prompt.submit', (_, e) => {
    seen.push(e.context)
    return { text: e.text, context: e.context }
  })
  await $.prompt.submit({ text: 'hi', wait: false, origin: { kind: 'composer' } })
  expect(seen[0]).toEqual([ISSUE_HINT])
})

test('/prismantis demo adds a section in the language of LANG, and demo ko picks one', async ($, on) => {
  mock.env(on, { LANG: 'ko_KR.UTF-8' })
  expect((await setupRun($, 'demo')).text).toContain('## 한국어')
  expect((await setupRun($, 'demo ko')).text).toContain('자연어로 정의')
})

test('/prismantis demo stays English when LANG names no showcase language', async ($, on) => {
  mock.env(on, { LANG: 'en_US.UTF-8' })
  expect((await setupRun($, 'demo')).text).not.toContain('한국어')
})
