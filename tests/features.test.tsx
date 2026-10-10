import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

import { parse } from '../hooks/markdown'
import { PRESET_NAMES, PRESETS } from '../hooks/presets'
import { RANDOM_THEMES, pickTheme } from '../hooks/theme'
import { columnWidths, describeShell, errorReason, formatDuration, groupSummary, isReadOnlyCall, programsOf, refusalReason, rememberCall, shortTarget, shortenPaths } from '../hooks/render'

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
})

test('no render hint when diagramHints is off', { options: { diagramHints: false } }, async ($, on) => {
  const seen: (readonly string[] | undefined)[] = []
  mock.env(on, {})
  on('prompt.submit', (_, e) => {
    seen.push(e.context)
    return { text: e.text, context: e.context }
  })
  await $.prompt.submit({ text: 'hi', wait: false, origin: { kind: 'composer' } })
  expect((seen[0] ?? []).some(c => c.includes('prismantis'))).toBe(false)
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
  expect((seen[0] ?? []).some(c => c.includes('prismantis'))).toBe(false)
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
    expect((await ui.find({ type: 'Text', text: /^the docs$/ }))?.props.underline).toBe(true)
    expect(await ui.find({ type: 'Text', text: /\(https:\/\/example\.com\/docs\)/ })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /^https:\/\/example\.com\/raw$/ })).toBeUndefined()
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
