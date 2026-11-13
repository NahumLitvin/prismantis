import { execFileSync, spawn } from 'node:child_process'
import { closeSync, constants, cpSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync, writeSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i < 0 ? fallback : args[i + 1]
}
const list = name => (flag(name, '') ? flag(name, '').split(',') : null)
const repo = resolve(flag('repo', join(here, '../../..')))
const matrix = JSON.parse(readFileSync(resolve(flag('matrix', join(here, 'matrix.json'))), 'utf8'))
const pick = (obj, names) => Object.entries(obj).filter(([k]) => !names || names.includes(k))
const configs = pick(matrix.configs, list('configs'))
const scenarios = pick(matrix.scenarios, list('scenarios'))
const only = list('only')
const out = resolve(flag('out', join(homedir(), '.prismantis-terminal-check', new Date().toISOString().replace(/[:.]/g, '-'))))
const boot = Number(flag('boot', 12))
const os = platform()
const win = os === 'win32'
const sleep = s => new Promise(r => setTimeout(r, s * 1000))
const run = (cmd, argv, env) => execFileSync(cmd, argv, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: win && cmd === 'claude', env: { ...process.env, ...env } })
const tryRun = (cmd, argv) => {
  try {
    return run(cmd, argv)
  } catch {
    return null
  }
}
const onPath = name => !!tryRun(win ? 'where' : 'which', [name])
const app = name => existsSync(`/Applications/${name}.app`)
const started = []
const detached = (cmd, argv) => {
  const child = spawn(cmd, argv, { detached: true, stdio: 'ignore', cwd: repo })
  child.unref()
  started.push(child.pid)
}
const programs = win ? [process.env.ProgramFiles, process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Programs')].filter(Boolean) : []
const winExe = (...parts) => programs.map(p => join(p, ...parts)).find(existsSync)

const warpConfigDir = win ? join(process.env.APPDATA ?? '', 'warp', 'Warp', 'data', 'launch_configurations') : join(homedir(), '.warp', 'launch_configurations')
const warpLaunch = launcher => {
  mkdirSync(warpConfigDir, { recursive: true })
  const name = 'prismantis-terminal-check'
  writeFileSync(join(warpConfigDir, `${name}.yaml`), `---\nname: ${name}\nwindows:\n  - tabs:\n      - layout:\n          cwd: ${JSON.stringify(repo)}\n          commands:\n            - exec: ${JSON.stringify(launcher)}\n`)
  if (win) detached('cmd', ['/c', 'start', '', `warp://launch/${name}`])
  else detached('open', [`warp://launch/${name}`])
}

const shell = file => (win ? `powershell -NoProfile -ExecutionPolicy Bypass -File "${file}"` : `sh '${file}'`)
const psFile = f => ['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', f]

const TERMINALS = [
  { id: 'apple-terminal', os: 'darwin', owner: 'Terminal', found: () => existsSync('/System/Applications/Utilities/Terminal.app'), launch: f => detached('osascript', ['-e', `tell application "Terminal" to do script "${shell(f)}"`]) },
  { id: 'iterm', os: 'darwin', owner: 'iTerm2', found: () => app('iTerm'), launch: f => detached('osascript', ['-e', `tell application "iTerm" to create window with default profile command "${shell(f)}"`]) },
  { id: 'ghostty', os: 'darwin', owner: 'Ghostty', found: () => app('Ghostty'), launch: f => detached('open', ['-na', 'Ghostty', '--args', '--quit-after-last-window-closed=true', `--command=${shell(f)}`]) },
  { id: 'kitty', os: 'darwin', owner: 'kitty', found: () => app('kitty'), launch: f => detached('/Applications/kitty.app/Contents/MacOS/kitty', ['sh', f]) },
  { id: 'wezterm', os: 'darwin', owner: 'wezterm-gui', found: () => app('WezTerm'), launch: f => detached('/Applications/WezTerm.app/Contents/MacOS/wezterm', ['start', '--always-new-process', '--', 'sh', f]) },
  { id: 'alacritty', os: 'darwin', owner: 'alacritty', found: () => app('Alacritty'), launch: f => detached('/Applications/Alacritty.app/Contents/MacOS/alacritty', ['-e', 'sh', f]) },
  { id: 'warp', os: 'darwin', owner: 'Warp', found: () => app('Warp'), launch: f => warpLaunch(shell(f)) },
  { id: 'windows-terminal', os: 'win32', owner: 'WindowsTerminal', found: () => onPath('wt'), launch: f => detached('wt', ['-w', 'new', 'new-tab', '-d', repo, ...psFile(f)]) },
  { id: 'conhost', os: 'win32', owner: 'conhost', found: () => true, launch: f => detached('conhost', psFile(f)) },
  { id: 'wezterm', os: 'win32', owner: 'wezterm-gui', found: () => onPath('wezterm') || !!winExe('WezTerm', 'wezterm.exe'), launch: f => detached(winExe('WezTerm', 'wezterm.exe') ?? 'wezterm', ['start', '--always-new-process', '--', ...psFile(f)]) },
  { id: 'alacritty', os: 'win32', owner: 'alacritty', found: () => onPath('alacritty') || !!winExe('Alacritty', 'alacritty.exe'), launch: f => detached(winExe('Alacritty', 'alacritty.exe') ?? 'alacritty', ['-e', ...psFile(f)]) },
  { id: 'warp', os: 'win32', owner: 'warp', found: () => !!winExe('Warp', 'warp.exe'), launch: f => warpLaunch(shell(f)) },
]

const MAC = `ObjC.import('CoreGraphics')
ObjC.import('AppKit')
function run(argv) {
  const [mode, a] = argv
  if (mode === 'front') return $.NSWorkspace.sharedWorkspace.frontmostApplication.bundleIdentifier.js
  const all = ObjC.deepUnwrap(ObjC.castRefToObject($.CGWindowListCopyWindowInfo($.kCGWindowListOptionOnScreenOnly, 0)))
  return JSON.stringify(all.filter(w => w.kCGWindowLayer === 0 && w.kCGWindowOwnerName === a && w.kCGWindowBounds.Width > 200).map(w => ({ id: String(w.kCGWindowNumber) })))
}`

const WIN_API = `Add-Type -AssemblyName System.Windows.Forms
Add-Type -ReferencedAssemblies System.Drawing @'
using System; using System.Collections.Generic; using System.Diagnostics; using System.Drawing; using System.Runtime.InteropServices; using System.Threading;
public static class Wins {
  delegate bool Cb(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(Cb cb, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern bool PrintWindow(IntPtr h, IntPtr dc, uint flags);
  [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] static extern void mouse_event(uint f, uint x, uint y, uint d, UIntPtr e);
  [DllImport("user32.dll")] static extern void keybd_event(byte k, byte s, uint f, UIntPtr e);
  public struct RECT { public int L, T, R, B; }
  public static string List(string owner) {
    SetProcessDPIAware(); var ids = new List<string>();
    EnumWindows((h, l) => { uint pid; GetWindowThreadProcessId(h, out pid); RECT r; GetWindowRect(h, out r);
      try { if (IsWindowVisible(h) && r.R - r.L > 200 && Process.GetProcessById((int)pid).ProcessName.Equals(owner, StringComparison.OrdinalIgnoreCase)) ids.Add(h.ToInt64() + ":" + r.L + ":" + r.T + ":" + (r.R - r.L)); } catch {}
      return true; }, IntPtr.Zero);
    return string.Join(",", ids);
  }
  public static bool Focus(long id) {
    var h = new IntPtr(id); keybd_event(0x12, 0, 0, UIntPtr.Zero); keybd_event(0x12, 0, 2, UIntPtr.Zero);
    SetForegroundWindow(h); Thread.Sleep(300); return GetForegroundWindow() == h;
  }
  public static void Click(int x, int y) { SetProcessDPIAware(); SetCursorPos(x, y); mouse_event(2, 0, 0, 0, UIntPtr.Zero); mouse_event(4, 0, 0, 0, UIntPtr.Zero); }
  public static void Shot(long id, string file) {
    SetProcessDPIAware(); var h = new IntPtr(id); SetForegroundWindow(h); Thread.Sleep(500);
    RECT r; GetWindowRect(h, out r);
    using (var bmp = new Bitmap(r.R - r.L, r.B - r.T)) using (var g = Graphics.FromImage(bmp)) {
      var dc = g.GetHdc(); var ok = PrintWindow(h, dc, 2); g.ReleaseHdc(dc);
      if (!ok) g.CopyFromScreen(r.L, r.T, 0, 0, bmp.Size);
      bmp.Save(file, System.Drawing.Imaging.ImageFormat.Png); }
  }
}
'@`

const ps = (script, env) => run('powershell', ['-NoProfile', '-Command', `${WIN_API}\n${script}`], env).trim()
const mac = (...argv) => run('osascript', ['-l', 'JavaScript', '-e', MAC, ...argv.map(String)]).trim()

const windows = owner => {
  if (win)
    return ps(`[Wins]::List('${owner}')`)
      .split(',')
      .filter(Boolean)
      .map(s => {
        const [id, x, y, w] = s.split(':')
        return { id, x: +x, y: +y, w: +w }
      })
  return JSON.parse(mac('list', owner))
}

const shoot = (id, file) => {
  if (win) ps(`[Wins]::Shot(${id}, '${file.replace(/'/g, "''")}')`)
  else run('screencapture', ['-x', '-o', '-l', id, file])
}

const focus = w => ps(`[Wins]::Focus(${w.id})`) === 'True'

const WIN_KEYS = { Enter: '{ENTER}', Down: '{DOWN}', Up: '{UP}', Left: '{LEFT}', Right: '{RIGHT}', Tab: '{TAB}', Esc: '{ESC}', Backspace: '{BACKSPACE}', Space: ' ' }
const MAC_KEYS = { Enter: '\r', Down: '\x1b[B', Up: '\x1b[A', Left: '\x1b[D', Right: '\x1b[C', Tab: '\t', Esc: '\x1b', Backspace: '\x7f', Space: ' ' }
const inject = (fifo, bytes) => {
  const fd = openSync(fifo, constants.O_WRONLY | constants.O_NONBLOCK)
  try {
    writeSync(fd, bytes)
  } finally {
    closeSync(fd)
  }
}
const send = async (w, keys) => {
  const parts = keys.split(/\{(\w+)\}/)
  if (win) {
    if (!focus(w)) throw new Error('could not focus the window, so no keys were sent')
    const sendkeys = parts.map((p, i) => (i % 2 ? WIN_KEYS[p] : p.replace(/[+^%~(){}[\]]/g, '{$&}'))).join('')
    return ps('[System.Windows.Forms.SendKeys]::SendWait($env:TC_KEYS)', { TC_KEYS: sendkeys })
  }
  for (const [i, p] of parts.entries()) {
    if (!p) continue
    inject(w.fifo, i % 2 ? MAC_KEYS[p] : p)
    await sleep(0.5)
  }
}

const pngWidth = file => readFileSync(file).readUInt32BE(16)

const cfg = join(out, 'cfg')
const MARKET = 'terminal-check'
const install = () => {
  const mkt = join(out, 'mkt')
  rmSync(cfg, { recursive: true, force: true })
  mkdirSync(join(mkt, '.claude-plugin'), { recursive: true })
  mkdirSync(cfg, { recursive: true })
  cpSync(join(repo, 'plugin'), join(mkt, 'prismantis'), { recursive: true, filter: src => !src.includes('node_modules') })
  writeFileSync(join(mkt, '.claude-plugin', 'marketplace.json'), JSON.stringify({ name: MARKET, owner: { name: MARKET }, plugins: [{ name: 'prismantis', source: './prismantis' }] }))
  const home = existsSync(join(homedir(), '.claude.json')) ? JSON.parse(readFileSync(join(homedir(), '.claude.json'), 'utf8')) : {}
  const trusted = { hasTrustDialogAccepted: true, hasCompletedProjectOnboarding: true }
  writeFileSync(join(cfg, '.claude.json'), JSON.stringify({ hasCompletedOnboarding: home.hasCompletedOnboarding ?? true, theme: home.theme, projects: { [repo]: trusted, [repo.replace(/\\/g, '/')]: trusted } }))
  const creds = join(homedir(), '.claude', '.credentials.json')
  if (existsSync(creds)) cpSync(creds, join(cfg, '.credentials.json'))
  writeFileSync(join(cfg, 'settings.json'), '{}')
  run('claude', ['plugin', 'marketplace', 'add', mkt], { CLAUDE_CONFIG_DIR: cfg })
  run('claude', ['plugin', 'install', `prismantis@${MARKET}`], { CLAUDE_CONFIG_DIR: cfg })
  return JSON.parse(readFileSync(join(cfg, 'settings.json'), 'utf8'))
}

const launcher = dir => {
  const pid = join(dir, 'shell.pid')
  const halt = join(dir, 'stop')
  if (win) {
    const file = join(dir, 'launch.ps1')
    writeFileSync(file, `Set-Location '${repo}'\nRemove-Item Env:CLAUDE_CODE_PLUGIN_DIRS -ErrorAction SilentlyContinue\n$env:CLAUDE_CONFIG_DIR = '${cfg}'\nSet-Content -Path '${pid}' -Value $PID\nwhile (-not (Test-Path '${halt}')) { Clear-Host; claude }\n`)
    return { file, pid, halt }
  }
  const fifo = join(dir, 'keys.fifo')
  run('mkfifo', [fifo])
  const file = join(dir, 'launch.sh')
  writeFileSync(file, `cd '${repo}'\nunset CLAUDE_CODE_PLUGIN_DIRS\nexport CLAUDE_CONFIG_DIR='${cfg}'\necho $$ > '${pid}'\nwhile [ ! -e '${halt}' ]; do clear; python3 '${join(here, 'keys.py')}' '${fifo}' claude; done\n`)
  return { file, pid, halt, fifo }
}

const stop = pidFile => {
  const pids = [...started.splice(0), existsSync(pidFile) && readFileSync(pidFile, 'utf8').trim()].filter(Boolean)
  for (const pid of pids) {
    if (win) tryRun('taskkill', ['/T', '/F', '/PID', String(pid)])
    else tryRun('kill', ['-9', String(pid)])
  }
}

const play = async (w, steps, dir, name) => {
  const shots = []
  let last
  const snap = label => {
    last = join(dir, `${name}.${label}.png`)
    shoot(w.id, last)
    shots.push(last)
  }
  for (const [secs, action] of [...steps, [1, { shot: 'end' }]]) {
    await sleep(secs)
    if (action?.shot) {
      snap(action.shot)
      continue
    }
    if (!action?.click) {
      await send(w, action)
      continue
    }
    const [x, y] = action.click
    if (!win) {
      inject(w.fifo, `\x1b[<0;${x};${y}M\x1b[<0;${x};${y}m`)
      continue
    }
    if (!focus(w)) throw new Error('could not focus the window, so no click was sent')
    if (!last) snap('before-click')
    const scale = w.w / pngWidth(last)
    ps(`[Wins]::Click(${Math.round(w.x + x * scale)}, ${Math.round(w.y + y * scale)})`)
  }
  return shots
}

if (!win && os !== 'darwin') {
  console.error(`terminal-check drives macOS and Windows terminals; ${os} has no entries yet`)
  process.exit(1)
}
mkdirSync(out, { recursive: true })
const baseline = install()
const terminals = TERMINALS.filter(t => t.os === os && (!only || only.includes(t.id)))
const results = []
const apply = ({ settings, ...options }) => writeFileSync(join(cfg, 'settings.json'), JSON.stringify({ ...baseline, ...settings, pluginConfigs: { [`prismantis@${MARKET}`]: { options } } }, null, 2))
for (const t of terminals) {
  if (!t.found()) {
    results.push({ terminal: t.id, status: 'not installed' })
    console.log(`${t.id}: not installed`)
    continue
  }
  const dir = join(out, t.id)
  mkdirSync(dir, { recursive: true })
  const { file, pid, halt, fifo } = launcher(dir)
  apply(configs[0][1])
  const front = win ? null : tryRun('osascript', ['-l', 'JavaScript', '-e', MAC, 'front'])?.trim()
  const before = new Set(windows(t.owner).map(w => w.id))
  t.launch(file)
  let w
  for (let s = 0; s < 20 && !w; s++) {
    await sleep(1)
    w = windows(t.owner).find(x => !before.has(x.id))
  }
  if (front) tryRun('open', ['-g', '-b', front])
  if (!w) {
    results.push({ terminal: t.id, status: 'no new window within 20s' })
    console.log(`${t.id}: no new window within 20s`)
    stop(pid)
    continue
  }
  w.fifo = fifo
  for (const [ci, [config, values]] of configs.entries()) {
    if (ci) {
      apply(values)
      await send(w, '/exit{Enter}')
    }
    await sleep(boot)
    for (const [si, [scenario, steps]] of scenarios.entries()) {
      const name = `${config}.${scenario}`
      const row = { terminal: t.id, config, scenario }
      try {
        if (si) await send(w, '/clear{Enter}')
        row.shots = await play(w, steps, dir, name)
        row.status = 'ok'
      } catch (e) {
        row.status = String(e.stderr || e.message).trim().split('\n')[0]
      }
      results.push(row)
      console.log(`${t.id} ${name}: ${row.status}`)
    }
  }
  writeFileSync(halt, '')
  await send(w, '/exit{Enter}').catch(() => {})
  await sleep(2)
  stop(pid)
}

const cols = configs.flatMap(([c]) => scenarios.map(([s]) => [c, s]))
const rel = p => p.slice(out.length + 1).replace(/\\/g, '/')
const cell = r => (r?.shots ? r.shots.map(p => `<figure><img src="${rel(p)}"><figcaption>${rel(p)}</figcaption></figure>`).join('') : `<p>${r?.status ?? 'skipped'}</p>`)
writeFileSync(join(out, 'results.json'), JSON.stringify({ os, repo, results }, null, 2))
writeFileSync(
  join(out, 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>terminal check ${os}</title><style>body{font:14px system-ui;margin:16px}img{width:640px;border:1px solid #888}td{vertical-align:top;padding:8px}figure{margin:0 0 8px}</style><table><tr><th></th>${cols.map(([c, s]) => `<th>${c} / ${s}</th>`).join('')}</tr>${terminals.map(t => `<tr><th>${t.id}</th>${cols.map(([c, s]) => `<td>${cell(results.find(r => r.terminal === t.id && (!r.config || (r.config === c && r.scenario === s))))}</td>`).join('')}</tr>`).join('')}</table>`,
)
console.log(join(out, 'index.html'))
