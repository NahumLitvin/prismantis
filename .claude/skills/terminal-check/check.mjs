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
const bootLimit = Number(flag('boot-limit', 60))
const readyText = flag('ready', 'Claude Code')
const os = platform()
const win = os === 'win32'
const sleep = s => new Promise(r => setTimeout(r, s * 1000))
const INHERITED = /^(NO_COLOR|FORCE_COLOR|CLAUDECODE|CLAUDE_PID|CLAUDE_CODE_(CHILD_SESSION|ENTRYPOINT|SESSION_ID|SESSION_ATTENDED|MESSAGING_SOCKET|MESSAGING_TOKEN|PLUGIN_DIRS)|TERM_PROGRAM|TERM_PROGRAM_VERSION|TERM_SESSION_ID|TERMINAL_EMULATOR|LC_TERMINAL|LC_TERMINAL_VERSION|VTE_VERSION|KONSOLE_VERSION|KITTY_WINDOW_ID|KITTY_PID|ITERM_SESSION_ID|ITERM_PROFILE)$|^(WARP_|WT_|WEZTERM_|ALACRITTY_|GHOSTTY_)/
for (const k of Object.keys(process.env)) if (INHERITED.test(k)) delete process.env[k]
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
const leftovers = []
const detached = (cmd, argv) => {
  const child = spawn(cmd, argv, { detached: true, stdio: 'ignore', cwd: repo, windowsHide: true })
  child.unref()
  started.push(child.pid)
}
const quote = a => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a)
let opening = {}
const background = (cmd, argv) => {
  opening.id = ps('[Wins]::Launch($env:TC_CMD, $env:TC_CWD, $env:TC_OWNER, $env:TC_BEFORE)', { TC_CMD: [cmd, ...argv].map(quote).join(' '), TC_CWD: repo, TC_OWNER: opening.owner, TC_BEFORE: opening.before })
}
const programs = win ? [process.env.ProgramFiles, process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Programs')].filter(Boolean) : []
const winExe = (...parts) => programs.map(p => join(p, ...parts)).find(existsSync)

const warpConfigDir = win ? join(process.env.APPDATA ?? '', 'warp', 'Warp', 'data', 'launch_configurations') : join(homedir(), '.warp', 'launch_configurations')
const warpLaunch = launcher => {
  mkdirSync(warpConfigDir, { recursive: true })
  const name = 'prismantis-terminal-check'
  writeFileSync(join(warpConfigDir, `${name}.yaml`), `---\nname: ${name}\nwindows:\n  - tabs:\n      - layout:\n          cwd: ${JSON.stringify(repo)}\n          commands:\n            - exec: ${JSON.stringify(launcher)}\n`)
  if (win) background('rundll32.exe', ['url.dll,FileProtocolHandler', `warp://launch/${name}`])
  else detached('open', [`warp://launch/${name}`])
  leftovers.push(join(warpConfigDir, `${name}.yaml`))
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
  { id: 'windows-terminal', os: 'win32', owner: 'WindowsTerminal', found: () => onPath('wt'), launch: f => background('wt.exe', ['-w', 'new', 'new-tab', '-d', repo, ...psFile(f)]) },
  { id: 'conhost', os: 'win32', owner: 'powershell', found: () => true, launch: f => background('conhost.exe', psFile(f)) },
  { id: 'wezterm', os: 'win32', owner: 'wezterm-gui', found: () => onPath('wezterm-gui') || !!winExe('WezTerm', 'wezterm-gui.exe'), launch: f => background(winExe('WezTerm', 'wezterm-gui.exe') ?? 'wezterm-gui.exe', ['start', '--always-new-process', '--', ...psFile(f)]) },
  { id: 'alacritty', os: 'win32', owner: 'alacritty', found: () => onPath('alacritty') || !!winExe('Alacritty', 'alacritty.exe'), launch: f => background(winExe('Alacritty', 'alacritty.exe') ?? 'alacritty.exe', ['-e', ...psFile(f)]) },
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

const WIN_API = `Add-Type -ReferencedAssemblies System.Drawing @'
using System; using System.Collections.Generic; using System.Diagnostics; using System.Drawing; using System.Runtime.InteropServices; using System.Text; using System.Threading;
public static class Wins {
  delegate bool Cb(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(Cb cb, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern bool PrintWindow(IntPtr h, IntPtr dc, uint flags);
  [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] static extern bool AttachThreadInput(uint a, uint b, bool on);
  [DllImport("kernel32.dll")] static extern uint GetCurrentThreadId();
  [DllImport("user32.dll")] static extern bool PostMessageW(IntPtr h, uint msg, IntPtr w, IntPtr l);
  [DllImport("kernel32.dll", SetLastError = true)] static extern bool GetConsoleScreenBufferInfo(IntPtr h, out SCREEN info);
  [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)] static extern bool ReadConsoleOutputCharacterW(IntPtr h, [Out] char[] text, uint n, COORD at, out uint read);
  public struct COORD { public short X, Y; }
  public struct SCREEN { public COORD Size, Cursor; public ushort Attr; public short Left, Top, Right, Bottom; public COORD Max; }
  public static void Text(uint pid, string file) {
    FreeConsole(); if (!AttachConsole(pid)) throw new Exception("could not attach to the console of pid " + pid + ": " + Marshal.GetLastWin32Error());
    var h = CreateFileW("CONOUT$", 0xC0000000, 3, IntPtr.Zero, 3, 0, IntPtr.Zero); SCREEN info; var rows = new List<string>();
    if (GetConsoleScreenBufferInfo(h, out info)) for (short y = info.Top; y <= info.Bottom; y++) {
      var row = new char[info.Size.X]; uint n; ReadConsoleOutputCharacterW(h, row, (uint)row.Length, new COORD { X = 0, Y = y }, out n); rows.Add(new string(row, 0, (int)n).TrimEnd()); }
    CloseHandle(h); FreeConsole(); System.IO.File.WriteAllText(file, string.Join(((char)10).ToString(), rows), new UTF8Encoding(false));
  }
  public static void Close(long id) { PostMessageW(new IntPtr(id), 0x10, IntPtr.Zero, IntPtr.Zero); }
  [DllImport("kernel32.dll")] static extern bool FreeConsole();
  [DllImport("kernel32.dll", SetLastError = true)] static extern bool AttachConsole(uint pid);
  [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)] static extern IntPtr CreateFileW(string n, uint acc, uint share, IntPtr sa, uint disp, uint flags, IntPtr t);
  [DllImport("kernel32.dll", SetLastError = true)] static extern bool WriteConsoleInputW(IntPtr h, INPUT_RECORD[] r, uint n, out uint written);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr h);
  [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)] static extern bool CreateProcessW(string app, StringBuilder cmd, IntPtr pa, IntPtr ta, bool inherit, uint flags, IntPtr env, string cwd, ref STARTUPINFO si, out PROCESS_INFORMATION pi);
  public struct RECT { public int L, T, R, B; }
  [StructLayout(LayoutKind.Explicit, Size = 20, CharSet = CharSet.Unicode)] public struct INPUT_RECORD {
    [FieldOffset(0)] public ushort EventType; [FieldOffset(4)] public int KeyDown; [FieldOffset(8)] public ushort Repeat;
    [FieldOffset(10)] public ushort Vk; [FieldOffset(12)] public ushort Scan; [FieldOffset(14)] public char Char; [FieldOffset(16)] public uint Ctl; }
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)] public struct STARTUPINFO { public int cb; public string r, desktop, title; public int x, y, xs, ys, xc, yc, fill, flags; public short show, r2; public IntPtr r3, i, o, e; }
  public struct PROCESS_INFORMATION { public IntPtr hp, ht; public uint pid, tid; }
  static bool Owned(IntPtr h, string owner) { uint pid; GetWindowThreadProcessId(h, out pid); try { return Process.GetProcessById((int)pid).ProcessName.Equals(owner, StringComparison.OrdinalIgnoreCase); } catch { return false; } }
  public static string Launch(string cmd, string cwd, string owner, string before) {
    var old = new HashSet<string>(before.Split(',')); var front = GetForegroundWindow();
    var si = new STARTUPINFO(); si.cb = Marshal.SizeOf(typeof(STARTUPINFO)); si.flags = 1; si.show = 4; PROCESS_INFORMATION pi;
    if (!CreateProcessW(null, new StringBuilder(cmd), IntPtr.Zero, IntPtr.Zero, false, 0x10, IntPtr.Zero, cwd, ref si, out pi)) throw new Exception("CreateProcess failed: " + Marshal.GetLastWin32Error());
    CloseHandle(pi.hp); CloseHandle(pi.ht);
    var found = ""; var clock = Stopwatch.StartNew(); long foundAt = 0, scanAt = 0;
    while (clock.ElapsedMilliseconds < 20000 && (found == "" || clock.ElapsedMilliseconds - foundAt < 2500)) {
      if (found == "" && clock.ElapsedMilliseconds >= scanAt) { foreach (var id in List(owner).Split(',')) if (id != "" && !old.Contains(id)) { found = id; foundAt = clock.ElapsedMilliseconds; } scanAt = clock.ElapsedMilliseconds + 100; }
      var now = GetForegroundWindow();
      if (now != IntPtr.Zero && now != front) {
        if (old.Contains(now.ToInt64().ToString()) || !Owned(now, owner)) front = now;
        else if (front != IntPtr.Zero) { uint pid; var thief = GetWindowThreadProcessId(now, out pid); var me = GetCurrentThreadId();
          AttachThreadInput(me, thief, true); SetForegroundWindow(front); AttachThreadInput(me, thief, false); } }
      Thread.Sleep(15);
    }
    return found;
  }
  public static uint Type(uint pid, string spec) {
    var l = new List<INPUT_RECORD>();
    foreach (var k in spec.Split(',')) { var p = k.Split(':'); for (int d = 1; d >= 0; d--) l.Add(new INPUT_RECORD { EventType = 1, KeyDown = d, Repeat = 1, Vk = ushort.Parse(p[0]), Char = (char)int.Parse(p[1]), Ctl = uint.Parse(p[2]) }); }
    FreeConsole(); if (!AttachConsole(pid)) throw new Exception("could not attach to the console of pid " + pid + ": " + Marshal.GetLastWin32Error());
    var h = CreateFileW("CONIN$", 0xC0000000, 3, IntPtr.Zero, 3, 0, IntPtr.Zero); uint n;
    var ok = WriteConsoleInputW(h, l.ToArray(), (uint)l.Count, out n); var err = Marshal.GetLastWin32Error(); CloseHandle(h); FreeConsole();
    if (!ok) throw new Exception("WriteConsoleInput failed: " + err); return n;
  }
  public static string List(string owner) {
    SetProcessDPIAware(); var ids = new List<string>();
    EnumWindows((h, l) => { uint pid; GetWindowThreadProcessId(h, out pid); RECT r; GetWindowRect(h, out r);
      try { if (IsWindowVisible(h) && r.R - r.L > 200 && Process.GetProcessById((int)pid).ProcessName.Equals(owner, StringComparison.OrdinalIgnoreCase)) ids.Add(h.ToInt64().ToString()); } catch {}
      return true; }, IntPtr.Zero);
    return string.Join(",", ids);
  }
  public static void Shot(long id, string file) {
    SetProcessDPIAware(); var h = new IntPtr(id); RECT r; GetWindowRect(h, out r);
    using (var bmp = new Bitmap(r.R - r.L, r.B - r.T)) using (var g = Graphics.FromImage(bmp)) {
      var dc = g.GetHdc(); var ok = PrintWindow(h, dc, 2); g.ReleaseHdc(dc);
      if (!ok) throw new Exception("PrintWindow could not capture the window");
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
      .map(id => ({ id }))
  return JSON.parse(mac('list', owner))
}

const shoot = (id, file) => {
  if (win) ps(`[Wins]::Shot(${id}, '${file.replace(/'/g, "''")}')`)
  else run('screencapture', ['-x', '-o', '-l', id, file])
}

const WIN_KEYS = { Enter: '13:13:0', Down: '40:0:256', Up: '38:0:256', Left: '37:0:256', Right: '39:0:256', Tab: '9:9:0', Esc: '27:27:0', Backspace: '8:8:0', Space: '32:32:0' }
const winText = text => text.split('').map(c => `0:${c.charCodeAt(0)}:0`)
const shellPid = w => Number(readFileSync(w.pid, 'utf8'))
const winType = (w, records) => ps(`[Wins]::Type(${shellPid(w)}, $env:TC_KEYS)`, { TC_KEYS: records.join(',') })
const screenText = (w, file) => {
  ps(`[Wins]::Text(${shellPid(w)}, $env:TC_FILE)`, { TC_FILE: file })
  return readFileSync(file, 'utf8')
}
const squash = text => text.replace(/\s/g, '')
const seen = (w, text) => squash(screenText(w, w.screen)).split(squash(text)).length - 1
const shown = async (w, text, before) => {
  for (let tries = 0; tries < 4; tries++) {
    if (seen(w, text) > before) return
    await sleep(0.5)
  }
  throw new Error(`typed text did not show up on the screen: ${text}`)
}
const starts = w => (existsSync(w.starts) ? readFileSync(w.starts, 'utf8').length : 0)
const booted = async (w, since) => {
  let last
  for (let waited = 0; waited < bootLimit; waited += 1.5) {
    await sleep(1.5)
    if (starts(w) <= since) continue
    const now = screenText(w, w.screen)
    if (now.includes(readyText) && now === last) return
    last = now
  }
  const top = (last ?? screenText(w, w.screen)).split('\n').map(line => line.trim()).find(line => /\w/.test(line))
  throw new Error(`claude was not ready within ${bootLimit}s, the screen shows: ${top ?? 'nothing'}`)
}
const MAC_KEYS = { Enter: '\r', Down: '\x1b[B', Up: '\x1b[A', Left: '\x1b[D', Right: '\x1b[C', Tab: '\t', Esc: '\x1b', Backspace: '\x7f', Space: ' ' }
const inject = (fifo, bytes) => {
  const fd = openSync(fifo, constants.O_WRONLY | constants.O_NONBLOCK)
  try {
    writeSync(fd, bytes)
  } finally {
    closeSync(fd)
  }
}
const send = async (w, keys, echo = true) => {
  const parts = keys.split(/\{(\w+)\}/)
  if (win) {
    const check = echo && parts.length === 1 && keys.trim().length > 2
    const before = check ? seen(w, keys) : 0
    winType(w, parts.flatMap((p, i) => (i % 2 ? [WIN_KEYS[p]] : winText(p))))
    if (check) await shown(w, keys, before)
    return
  }
  for (const [i, p] of parts.entries()) {
    if (!p) continue
    inject(w.fifo, i % 2 ? MAC_KEYS[p] : p)
    await sleep(0.5)
  }
}

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
  writeFileSync(join(cfg, '.claude.json'), JSON.stringify({ hasCompletedOnboarding: home.hasCompletedOnboarding ?? true, theme: home.theme, claudeInChromeDefaultEnabled: false, projects: { [repo]: trusted, [repo.replace(/\\/g, '/')]: trusted } }))
  const creds = join(homedir(), '.claude', '.credentials.json')
  if (existsSync(creds)) cpSync(creds, join(cfg, '.credentials.json'))
  process.on('exit', () => rmSync(join(cfg, '.credentials.json'), { force: true }))
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => process.exit(130))
  writeFileSync(join(cfg, 'settings.json'), '{}')
  run('claude', ['plugin', 'marketplace', 'add', mkt], { CLAUDE_CONFIG_DIR: cfg })
  run('claude', ['plugin', 'install', `prismantis@${MARKET}`], { CLAUDE_CONFIG_DIR: cfg })
  return JSON.parse(readFileSync(join(cfg, 'settings.json'), 'utf8'))
}

const launcher = dir => {
  const pid = join(dir, 'shell.pid')
  const halt = join(dir, 'stop')
  const starts = join(dir, 'starts')
  for (const stale of [pid, halt, starts]) rmSync(stale, { force: true })
  if (win) {
    const file = join(dir, 'launch.ps1')
    writeFileSync(file, `Set-Location '${repo}'\nRemove-Item Env:CLAUDE_CODE_PLUGIN_DIRS -ErrorAction SilentlyContinue\n$env:CLAUDE_CONFIG_DIR = '${cfg}'\n$env:ENABLE_CLAUDEAI_MCP_SERVERS = 'false'\nSet-Content -Path '${pid}' -Value $PID\nwhile (-not (Test-Path '${halt}')) { Clear-Host; Add-Content -Path '${starts}' -Value 1; claude }\n`)
    return { file, pid, halt, starts }
  }
  const fifo = join(dir, 'keys.fifo')
  run('mkfifo', [fifo])
  const file = join(dir, 'launch.sh')
  writeFileSync(file, `cd '${repo}'\nunset CLAUDE_CODE_PLUGIN_DIRS\nexport CLAUDE_CONFIG_DIR='${cfg}' ENABLE_CLAUDEAI_MCP_SERVERS=false\necho $$ > '${pid}'\nwhile [ ! -e '${halt}' ]; do clear; python3 '${join(here, 'keys.py')}' '${fifo}' claude; done\n`)
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
  const snap = label => {
    const file = join(dir, `${name}.${label}.png`)
    shoot(w.id, file)
    if (win) screenText(w, file.replace(/png$/, 'txt'))
    shots.push(file)
  }
  for (const [secs, action] of [...steps, [1, { shot: 'end' }]]) {
    await sleep(secs)
    if (action?.shot) {
      snap(action.shot)
      continue
    }
    if (!action?.click) {
      await send(w, action?.press ?? action, !action?.press)
      continue
    }
    const [x, y] = action.click
    const report = `\x1b[<0;${x};${y}M\x1b[<0;${x};${y}m`
    if (win) winType(w, winText(report))
    else inject(w.fifo, report)
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
  const { file, pid, halt, fifo, starts: startsFile } = launcher(dir)
  apply(configs[0][1])
  const front = win ? null : tryRun('osascript', ['-l', 'JavaScript', '-e', MAC, 'front'])?.trim()
  const before = new Set(windows(t.owner).map(w => w.id))
  opening = { owner: t.owner, before: [...before].join(',') }
  t.launch(file)
  let w = opening.id ? { id: opening.id } : undefined
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
  Object.assign(w, { fifo, pid, starts: startsFile, screen: join(dir, 'screen.txt') })
  for (const [ci, [config, values]] of configs.entries()) {
    const since = ci ? starts(w) : 0
    if (ci) {
      apply(values)
      await send(w, '/exit{Enter}')
    }
    const late = win ? await booted(w, since).catch(e => e.message) : await sleep(boot)
    if (late) {
      for (const [scenario] of scenarios) results.push({ terminal: t.id, config, scenario, status: late })
      console.log(`${t.id} ${config}: ${late}`)
      break
    }
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
  if (win) ps(`[Wins]::Close(${w.id})`)
}
for (const file of leftovers) rmSync(file, { force: true })

const cols = configs.flatMap(([c]) => scenarios.map(([s]) => [c, s]))
const rel = p => p.slice(out.length + 1).replace(/\\/g, '/')
const cell = r => (r?.shots ? r.shots.map(p => `<figure><img src="${rel(p)}"><figcaption>${rel(p)}</figcaption></figure>`).join('') : `<p>${r?.status ?? 'skipped'}</p>`)
writeFileSync(join(out, 'results.json'), JSON.stringify({ os, repo, results }, null, 2))
writeFileSync(
  join(out, 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>terminal check ${os}</title><style>body{font:14px system-ui;margin:16px}img{width:640px;border:1px solid #888}td{vertical-align:top;padding:8px}figure{margin:0 0 8px}</style><table><tr><th></th>${cols.map(([c, s]) => `<th>${c} / ${s}</th>`).join('')}</tr>${terminals.map(t => `<tr><th>${t.id}</th>${cols.map(([c, s]) => `<td>${cell(results.find(r => r.terminal === t.id && (!r.config || (r.config === c && r.scenario === s))))}</td>`).join('')}</tr>`).join('')}</table>`,
)
console.log(join(out, 'index.html'))
