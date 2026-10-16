import { atom, read, update } from 'claude-code'
import type { EngineInterface, PluginOptions, PromptOrigin, Register, RenderElement, RenderSurface } from 'claude-code'

import { clockText, endedAt, promptKey, sentAt, withRecord } from './clock'
import type { Formula } from './latex'
import { LATEX_DPR, LATEX_FONT_PX, MAX_IMAGE_BYTES, fitImage, fitsImage, imageFile, imageOf, keepFormulas, mathOf, padFor, pickFormula, pngSize, ratexColor, renderedOf } from './latex'
import type { Block } from './markdown'
import { nestedBlocks, parse } from './markdown'
import type { ClipboardBackend } from './clipboard'
import { clipboardCommand } from './clipboard'
import { FIGURE_HINT } from './figure'
import { drawDiagrams } from './mermaid'
import type { Fold } from './render'
import { bashEdits, drawMath, editNotes, hasShellOutput, instanceKey, isReadOnlyCall, mirrored, noteTip, remember, rememberCall, renderBashEdits, renderBlocks, renderDiffCard, renderExpandedShell, renderFailure, renderShellResult, renderToolGroup, renderToolRow, renderTurnDuration, renderUserPrompt, takesClickableMarks, takesEditorLinks, takesHttpLinks, withoutBashEdits } from './render'
import { HINT, SETUP_DONE, findSetup, helpText, rtlShowcaseText, setupParts, setupSteps, setupText, showcaseText } from './help'
import { PRESET_NAMES } from './presets'
import type { Style } from './theme'
import { RANDOM_THEMES, pickTheme, resolveStyle } from './theme'
import type { Terminal } from './rtl'
import { ROW_MARK_TEXT, TERMINALS, hasRtl, opensLatin } from './rtl'

const HINTED_ORIGINS = ['composer', 'bridge', 'plugin'] as const satisfies readonly PromptOrigin['kind'][]

const takesHint = (origin: PromptOrigin): boolean => HINTED_ORIGINS.some(kind => kind === origin.kind)

const LATEX_HINT = 'This terminal typesets LaTeX math: a formula in $$…$$ on lines of its own, or in a ```math block, renders as an image (KaTeX syntax). Inline $…$ does not render, so write inline math as plain text or Unicode.'

const detectTerminal = async ($: EngineInterface): Promise<Terminal | null> => {
  const program = await $.env.get('TERM_PROGRAM')
  const term = await $.env.get('TERM')
  if ((await $.env.get('KITTY_WINDOW_ID')) || term === 'xterm-kitty') return 'kitty'
  if (program === 'Apple_Terminal') return 'apple-terminal'
  if (program === 'WarpTerminal') return 'warp'
  if (program === 'ghostty') return 'ghostty'
  if (program === 'WezTerm') return 'wezterm'
  if (program === 'vscode') return 'vscode'
  if (program === 'iTerm.app') return 'iterm'
  if (term === 'alacritty' || (await $.env.get('ALACRITTY_WINDOW_ID'))) return 'alacritty'
  if (await $.env.get('WT_SESSION')) return 'windows-terminal'
  if (await $.env.get('VTE_VERSION')) return 'gnome'
  if (await $.env.get('KONSOLE_VERSION')) return 'konsole'
  return null
}

const applyRtl = async ($: EngineInterface, style: Style): Promise<Terminal | null> => {
  if (style.rtl === 'off') return null
  if (style.rtl !== 'auto') return style.rtl
  const terminal = await detectTerminal($)
  style.reorder = terminal !== null
  if (terminal) style.shape = TERMINALS[terminal]
  return terminal
}

const expandedCalls = new Set<string>()
const readOnlyCalls = new Set<string>()

const columnsOf = (viewport?: { columns?: number }) => Math.max(20, (viewport?.columns ?? 100) - 4)

const formulas = atom({ plugin: 'prismantis', key: 'formulas' } as const, {})
const latexDir = atom({ plugin: 'prismantis', key: 'dir' } as const, '')
const unfolded = atom({ plugin: 'prismantis', key: 'unfolded' } as const, [] as string[])
const sent = atom({ plugin: 'prismantis', key: 'sent' } as const, [])
const turnEnds = atom({ plugin: 'prismantis', key: 'turnEnds' } as const, [])

const firstDrawn = async ($: EngineInterface, id: string): Promise<number> => {
  const ref = { plugin: 'prismantis', key: 'drawn', id } as const
  const { value } = await $.state.get(ref)
  if (value !== undefined) return value
  const now = await $.clock.now()
  $.clock.after(0, () => void $.state.set(ref, now, { ifVersion: 0 }))
  return now
}

type Typeset = Exclude<Formula, { error: true }> & { tex: string }

const showsImages = async ($: EngineInterface): Promise<boolean> => {
  if (await $.env.get('CLAUDE_CODE_FORCE_TERMINAL_IMAGES')) return true
  if (await $.env.get('TMUX')) return false
  const terminal = await detectTerminal($)
  return terminal === 'kitty' || terminal === 'ghostty'
}

type Latex = { command: string; dir: string }
type LatexSession = { style: Style; color: string; pending: Set<string>; wanted: Set<string>; batch: string[]; engine?: Promise<Latex | null>; ready?: Latex | null; stopped?: boolean; queue: Promise<void> }

const formulaKey = (color: string, tex: string) => `${color}\0${tex}`

const typeset = async ($: EngineInterface, color: string, engine: Latex, texs: string[], fontSize = LATEX_FONT_PX, dpr = LATEX_DPR): Promise<Formula[]> => {
  const { stdout } = await $.process.run(
    [engine.command, '--output-dir', engine.dir, '--color', color, '--background-color', 'transparent', '--font-size', String(fontSize), '--dpr', String(dpr)],
    { stdin: `${texs.join('\n')}\n`, timeoutMs: 2000 },
  )
  const rendered = renderedOf(stdout)
  return Promise.all(texs.map(async (_, i): Promise<Formula> => {
    if (!rendered.has(i + 1)) return { error: true }
    const png = await $.fs.read(`${engine.dir}/${String(i + 1).padStart(4, '0')}.png`, { as: 'bytes' }).then(r => r.base64, () => '')
    const size = png ? pngSize(png) : null
    return size && fitsImage(png) ? { png, ...size } : { error: true }
  }))
}

const withPadding = async ($: EngineInterface, color: string, engine: Latex, texs: string[], results: Formula[]): Promise<Formula[]> => {
  const padded: Formula[] = []
  for (const [i, result] of results.entries()) {
    const pad = 'png' in result ? padFor(result) : null
    const [again] = pad ? await typeset($, color, engine, [texs[i]!], pad.fontSize, pad.dpr).catch((): Formula[] => []) : []
    padded.push(again && 'png' in again && 'png' in result ? { ...result, padded: again } : result)
  }
  return padded
}

const startLatex = async ($: EngineInterface, latex: LatexSession): Promise<Latex | null> => {
  if (!latex.style.latex || !(await $.session.surfaces()).includes('terminal') || !(await showsImages($))) return null
  const tmp = (await $.env.get('TMPDIR')) ?? (await $.env.get('TEMP')) ?? '/tmp'
  const suffix = (await read($, latexDir)) || crypto.randomUUID()
  await update($, latexDir, () => suffix)
  const engine = { command: 'ratex-render', dir: `${tmp.replace(/[\\/]+$/, '')}/prismantis-latex-${await $.session.id()}-${suffix}` }
  const [check] = await typeset($, latex.color, engine, ['x^2'])
  return check && 'png' in check ? engine : null
}

const latexEngine = ($: EngineInterface, latex: LatexSession): Promise<Latex | null> =>
  (latex.engine ??= startLatex($, latex)
    .catch(() => null)
    .then(engine => {
      latex.ready = engine
      if (engine) $.ui.invalidate('ui.render')
      return engine
    }))

const stopLatex = (latex: LatexSession) => {
  latex.stopped = true
  latex.pending.clear()
  latex.batch = []
}

const typesetLater = async ($: EngineInterface, latex: LatexSession, texs: string[]): Promise<void> => {
  const color = latex.color
  const engine = await latexEngine($, latex)
  if (!engine || latex.stopped) return
  const results = await typeset($, color, engine, texs).then(
    done => withPadding($, color, engine, texs, done),
    () => null,
  )
  if (!results) return stopLatex(latex)
  const fresh = texs.map((tex, i) => [formulaKey(color, tex), results[i]!] as const)
  await update($, formulas, store => keepFormulas(store, fresh, latex.wanted))
  latex.wanted.clear()
  for (const tex of texs) latex.pending.delete(formulaKey(color, tex))
}

const mathOfBlocks = async ($: EngineInterface, latex: LatexSession, surface: string, blocks: Block[]): Promise<Map<number, Typeset>> => {
  const maths = [...blocks.entries()].flatMap(([i, block]) => {
    const tex = mathOf(block)
    return tex === null ? [] : [{ i, tex, key: formulaKey(latex.color, tex) }]
  })
  if (surface !== 'terminal' || maths.length === 0) return new Map()
  void latexEngine($, latex)
  if (!latex.ready) return new Map()
  for (const { key } of maths) latex.wanted.add(key)
  const store = (await read($, formulas)) as Record<string, Formula>
  const missing = latex.stopped ? [] : [...new Map(maths.map(({ key, tex }) => [key, tex]))].filter(([key]) => !store[key] && !latex.pending.has(key))
  if (missing.length) {
    if (latex.batch.length === 0) {
      $.clock.after(0, () => {
        const texs = latex.batch
        latex.batch = []
        latex.queue = latex.queue.then(() => typesetLater($, latex, texs)).catch(() => stopLatex(latex))
      })
    }
    for (const [key, tex] of missing) {
      latex.pending.add(key)
      latex.batch.push(tex)
    }
  }
  return new Map(maths.flatMap(({ i, tex, key }) => {
    const formula = store[key]
    return formula && 'png' in formula ? [[i, { tex, ...formula }] as const] : []
  }))
}

type Picture = { png: string; width: number; height: number; alt: string }

const pictureOf = async ($: EngineInterface, src: string, home: string): Promise<Omit<Picture, 'alt'> | null> => {
  const file = imageFile(src, home)
  if (!file) return null
  const stat = 'path' in file ? await $.fs.stat(file.path).catch(() => null) : null
  if ('path' in file && (stat?.kind !== 'file' || stat.size > MAX_IMAGE_BYTES)) return null
  const png = 'png' in file ? file.png : await $.fs.read(file.path, { as: 'bytes' }).then(r => r.base64, () => '')
  const size = png ? pngSize(png) : null
  return size && size.width > 0 && size.height > 0 && fitsImage(png) ? { png, ...size } : null
}

const loaded = new Map<string, Promise<Omit<Picture, 'alt'> | null>>()

const picturesOf = async ($: EngineInterface, style: Style, probes: Probes, surface: string, blocks: Block[]): Promise<Map<number, Picture>> => {
  const images = [...blocks.entries()].flatMap(([i, block]) => {
    const image = imageOf(block)
    return image ? [{ i, ...image }] : []
  })
  if (surface !== 'terminal' || images.length === 0 || !(await (probes.images ??= showsImages($).catch(() => false)))) return new Map()
  await locate($, style)
  const found = await Promise.all(images.map(async ({ i, alt, src }) => {
    const picture = await remember(loaded, src, () => pictureOf($, src, style.home), 50)
    return picture ? [[i, { ...picture, alt }] as const] : []
  }))
  return new Map(found.flat())
}

const locate = async ($: EngineInterface, style: Style) => {
  style.cwd = await $.session.root().catch(() => style.cwd)
  style.home ||= (await $.env.get('HOME').catch(() => undefined)) ?? (await $.env.get('USERPROFILE').catch(() => undefined)) ?? ''
}

const htmlBackend = async ($: EngineInterface): Promise<ClipboardBackend | null> => {
  if (await $.env.get('SSH_CONNECTION') || await $.env.get('SSH_TTY')) return null
  if (await $.env.get('OS') === 'Windows_NT') return 'windows'
  const helper = await $.fs.stat('/usr/bin/osascript').catch(() => null)
  if (helper?.kind === 'file') return 'macos'
  return await $.env.get('WAYLAND_DISPLAY') || await $.env.get('DISPLAY') ? 'linux' : null
}

type LinkReach = { http: boolean; editor: boolean; marks: boolean }

type Probes = { terminal?: Promise<Terminal | null>; htmlCopy?: Promise<ClipboardBackend | null>; links?: Promise<LinkReach>; images?: Promise<boolean> }

const linkReach = ($: EngineInterface, probes: Probes): Promise<LinkReach> =>
  (probes.links ??= $.session.version().then(v => ({ http: takesHttpLinks(v.base), editor: takesEditorLinks(v.base), marks: takesClickableMarks(v.base) }), () => ({ http: false, editor: false, marks: false })))

const probe = async ($: EngineInterface, style: Style, probes: Probes): Promise<Terminal | null> => {
  probes.terminal ??= applyRtl($, style)
  const terminal = await probes.terminal
  probes.htmlCopy ??= htmlBackend($)
  style.htmlCopy = await probes.htmlCopy
  return terminal
}

const copyTable = async ($: EngineInterface, backend: ClipboardBackend, html: string, text: string): Promise<string | null> => {
  const systemRoot = backend === 'windows' ? await $.env.get('SystemRoot') : undefined
  const command = clipboardCommand(backend, html, text, systemRoot)
  if (backend === 'windows' && !systemRoot) return command.failure
  const result = await $.process.run(command.argv, { stdin: command.stdin, timeoutMs: 5000 }).catch(() => null)
  if (!result) return command.failure
  return result.exitCode === 0 ? null : result.stderr.trim() || command.failure
}

const folder = ($: EngineInterface, el: ReturnType<EngineInterface['ui']['resolve']>, open?: string[]): Fold => (id, hidden, key) => {
  if (!open) return null
  const folded = !open.includes(id)
  return { folded, element: <el.Button key={key} variant="secondary" label={folded ? `+${hidden} more lines` : 'show less'} onPress={() => update($, unfolded, ids => (folded ? [...ids, id].slice(-500) : ids.filter(x => x !== id)))} /> }
}

const drawMarkdown = ($: EngineInterface, el: ReturnType<EngineInterface['ui']['resolve']>, style: Style, blocks: ReturnType<typeof parse>, columns: number, math: Map<number, Typeset> = new Map(), pictures: Map<number, Picture> = new Map(), reply?: string, open?: string[], notes?: { id: string; press: boolean }): RenderElement[] => {
  const { Button } = el
  const copy = (text: string | (() => string), key: string, label = '⧉ copy', html?: () => string) => {
    const copied = async (surface: RenderSurface): Promise<string> => {
      const content = typeof text === 'function' ? text() : text
      const backend = style.htmlCopy
      const failure = html && backend ? await copyTable($, backend, html(), content) : undefined
      if (failure === null) return 'Copied formatted table'
      const result = await $.ui.copy({ text: content, surface })
      if (!result.isCopied) return `Copy failed: ${result.reason}`
      return failure ? `Copied as plain text (${failure})` : 'Copied'
    }
    return style.copyButtons && (!html || style.htmlCopy) ? (
      <Button
        key={key}
        variant="primary"
        label={label}
        onPress={async press => $.ui.toast(await copied(press.surface).catch(() => 'Copy failed'))}
      />
    ) : null
  }
  const drawn = drawDiagrams(el, style, blocks, columns)
  const Image = 'Image' in el ? el.Image : null
  if (Image) {
    for (const [i, formula] of math) {
      const picked = pickFormula(formula, columns)
      if (picked) drawn.set(i, { element: <Image key={`b${i}`} source={{ png: picked.picture.png }} columns={picked.fit.columns} rows={picked.fit.rows} alt={formula.tex} /> })
    }
    for (const [i, picture] of pictures) {
      const fit = fitImage(picture, columns)
      drawn.set(i, { element: <Image key={`b${i}`} source={{ png: picture.png }} columns={fit.columns} rows={fit.rows} alt={picture.alt} /> })
    }
  }
  const tip = notes?.press ? noteTip(blocks, text => void $.ui.toast(text)) : undefined
  const elements = renderBlocks(el, notes ? { ...style, noteKey: instanceKey(notes.id) } : style, blocks, columns, drawMath(el, style, blocks, drawn), copy, folder($, el, open), tip)
  const button = reply === undefined ? null : copy(reply, 'reply', '⧉ copy reply')
  if (!button) return elements
  return style.copyButtonStyle === 'hover'
    ? [...elements, <el.Box position="absolute" bottom={0} right={0} display="none" hover={{ display: 'flex' }}>{button}</el.Box>]
    : [...elements, <el.Box key="reply" alignSelf="flex-end">{button}</el.Box>]
}

const THEME_ARGS = [...PRESET_NAMES, 'random']

type Picked = { theme: string; options: PluginOptions; latex: LatexSession }

const setTheme = async ($: EngineInterface, picked: Picked, name: string): Promise<string> => {
  const result = await $.config.set({ key: `${$.plugin.name}.theme`, value: name })
  if (result.deny) return `Could not switch theme: ${result.deny}`
  if (name !== 'random' || picked.options.theme !== 'random') return `Theme set to ${name}.`
  const others = RANDOM_THEMES.filter(t => t !== picked.theme)
  picked.theme = others[Math.floor(Math.random() * others.length)]!
  const style = picked.latex.style
  style.theme = resolveStyle({ ...picked.options, theme: picked.theme }).theme
  picked.latex.color = ratexColor(style.theme.diagramText ?? style.theme.codeText ?? '#808080')
  $.ui.invalidate('ui.render')
  return `Theme set to random: ${picked.theme} for now.\nkeep it: /prismantis theme ${picked.theme}`
}

const setup = async ($: EngineInterface, picked: Picked, stepName?: string, pick?: string): Promise<string> => {
  const steps = setupSteps(PRESET_NAMES)
  const at = stepName ? steps.findIndex(s => s.name === stepName) : 0
  const step = steps[at]
  if (!step) return `Unknown setup step "${stepName}". Steps: ${steps.map(s => s.name).join(', ')}`
  if (!pick) return setupText(setupParts(PRESET_NAMES, at))
  const choices = step.key === 'theme' ? THEME_ARGS : step.options
  const value = /^\d+$/.test(pick) ? step.options[Number(pick) - 1] : pick
  if (!value || !choices.includes(value)) return `Unknown ${step.name} pick "${pick}". Pick 1-${step.options.length} or one of: ${choices.join(', ')}`
  const saved = step.key === 'theme' ? await setTheme($, picked, value) : await $.config.set({ key: `${$.plugin.name}.${step.key}`, value }).then(r => (r.deny ? `Could not save ${step.key}: ${r.deny}` : `${step.title} set to ${value}.`))
  if (saved.startsWith('Could not')) return saved
  return `${saved}\n\n${at + 1 < steps.length ? setupText(setupParts(PRESET_NAMES, at + 1)) : SETUP_DONE}`
}

const drawSetup = ($: EngineInterface, el: ReturnType<EngineInterface['ui']['resolve']>, base: Style, options: PluginOptions, found: NonNullable<ReturnType<typeof findSetup>>, columns: number): RenderElement[] => {
  const key = setupSteps(PRESET_NAMES)[found.at]!.key
  const md = (style: Style, text: string, id: string) => <el.Box key={id} flexDirection="column" rowGap={1}>{drawMarkdown($, el, style, parse(text, { numbers: style.highlightNumbers, paths: style.highlightPaths }), columns)}</el.Box>
  const sample = (style: Style, value: string, id: string): RenderElement[] => {
    if (key === 'promptStyle') return [value === 'off' ? <el.Text key={id} dimColor>{'> fix the failing test'}</el.Text> : <el.Box key={id}>{renderUserPrompt(el, style, 'fix the failing test', columns)}</el.Box>]
    if (key === 'toolStyle') return [md({ ...style, narration: style.toolStyle === 'tree-bold' }, 'Reading the config.', `${id}s`), <el.Box key={id}>{renderToolRow(el, style, { tool: 'Read', input: { file_path: 'src/config.ts' }, isRunning: false, isErrored: false, isInterrupted: false }, columns)}</el.Box>]
    return []
  }
  const picks = found.parts.options.map(({ value, text }, i) => {
    const style = key === 'theme' ? { ...base, theme: resolveStyle({ ...options, theme: value }).theme } : { ...base, [key]: value }
    return <el.Box key={`o${i}`} flexDirection="column">{md(style, text, 'm')}{sample(style, value, 'x')}</el.Box>
  })
  return [...(found.before ? [md(base, found.before, 'before')] : []), md(base, found.parts.head, 'head'), ...picks, md(base, found.parts.tail, 'tail')]
}

export const register: Register = (on, options) => {
  on('engine.create', async (_$, e, next) => ({ ...(await next(e)), prismantis: { markdown: async () => undefined } }))
  if (options.enabled === false) return
  const firstTheme = pickTheme(options.theme)
  const style = resolveStyle({ ...options, theme: firstTheme })
  const parsed = new Map<string, ReturnType<typeof parse>>()
  const parseCached = (text: string, cache = parsed, limit?: number) => remember(cache, text, () => parse(text, { numbers: style.highlightNumbers, paths: style.highlightPaths }), limit)
  const shared = new Map<string, ReturnType<typeof parse>>()
  let terminal: Terminal | null = null
  const fit = (viewport?: { isFullscreen?: boolean }): Style => (terminal === 'apple-terminal' && viewport?.isFullscreen ? { ...style, shape: 'inverse' } : style)
  const latex: LatexSession = { style, color: ratexColor(style.theme.diagramText ?? style.theme.codeText ?? '#808080'), pending: new Set(), wanted: new Set(), batch: [], queue: Promise.resolve() }
  const picked: Picked = { theme: firstTheme, options, latex }
  const probes: Probes = {}
  const forSurface = (base: Style, surface: RenderSurface, links: LinkReach): Style => {
    const drawn = surface === 'terminal' ? (links.http || links.editor ? { ...base, httpLinks: links.http, editorLinks: links.editor } : base) : { ...base, htmlCopy: null, nativeCode: true }
    return surface === 'mobile' && drawn.copyButtonStyle === 'hover' ? { ...drawn, copyButtonStyle: 'inline' } : drawn
  }
  const fullWidth = (text: string) => (style.reorder && hasRtl(text) ? { width: '100%' as const } : {})

  const quiet = style.toolOutput === 'quiet'
  const shellCommands = new Map<string, string>()
  const noteCommand = (id: string | undefined, tool: string, input: unknown) => {
    const command = tool === 'Bash' && input !== null && typeof input === 'object' ? (input as { command?: unknown }).command : undefined
    if (!id || typeof command !== 'string') return
    shellCommands.delete(id)
    shellCommands.set(id, command)
    if (shellCommands.size > 500) shellCommands.delete(shellCommands.keys().next().value!)
  }
  let firstEdit: string | undefined
  if (options.toolRows !== false) {
    on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
      await locate($, style)
      for (const call of e.props.calls) noteCommand(call.tool_use_id, call.tool, call.input)
      if (quiet) for (const call of e.props.calls) if (call.tool_use_id && isReadOnlyCall(call.tool, call.input)) rememberCall(readOnlyCalls, call.tool_use_id)
      if (e.props.isExpanded) {
        for (const call of e.props.calls) if (call.tool_use_id) rememberCall(expandedCalls, call.tool_use_id, 500)
        return next(e)
      }
      return renderToolGroup($.ui.resolve(e), fit(e.viewport), e.props.calls, e.props.isActive, e.viewport?.columns)
    })
    on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
      await locate($, style)
      noteCommand(e.props.tool_use_id, e.props.tool, e.props.input)
      if (quiet && isReadOnlyCall(e.props.tool, e.props.input)) rememberCall(readOnlyCalls, e.props.tool_use_id)
      if (!expandedCalls.has(e.props.tool_use_id)) return renderToolRow($.ui.resolve(e), fit(e.viewport), e.props, e.viewport?.columns)
      const shell = e.props.tool === 'Bash' || e.props.tool === 'PowerShell'
      return shell && typeof e.props.output !== 'string' ? renderExpandedShell($.ui.resolve(e), fit(e.viewport), e.props) : next(e)
    })
    on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
      if ((e.props.tool === 'Edit' || e.props.tool === 'Write') && !e.props.isErrored) {
        const el = $.ui.resolve(e)
        return renderDiffCard(el, fit(e.viewport), e.props.output, folder($, el, await read($, unfolded)), e.props.tool_use_id) ?? next(e)
      }
      const edits = e.props.tool === 'Bash' && !e.props.isErrored ? bashEdits(e.props.output) : undefined
      if (edits) {
        await locate($, style)
        const el = $.ui.resolve(e)
        const output = withoutBashEdits(e.props.output)
        const above = !hasShellOutput(output) ? null : quiet ? renderShellResult(el, fit(e.viewport), output) : await next({ ...e, props: { ...e.props, output } })
        firstEdit ??= e.props.tool_use_id
        const notes = editNotes(edits, firstEdit === e.props.tool_use_id, shellCommands.get(e.props.tool_use_id))
        const cards = renderBashEdits(el, fit(e.viewport), edits, folder($, el, await read($, unfolded)), e.props.tool_use_id, above !== null, notes)
        return above === null ? cards : <el.Box flexDirection="column">{above}{cards}</el.Box>
      }
      if (!quiet) return next(e)
      await locate($, style)
      const el = $.ui.resolve(e)
      const shell = e.props.tool === 'Bash' || e.props.tool === 'PowerShell'
      const out = (e.props.output ?? {}) as Record<string, unknown>
      if (shell && (out.backgroundTaskId || out.isImage || out.interrupted)) return next(e)
      if (e.props.isErrored) return renderFailure(el, fit(e.viewport), e.props.output) ?? next(e)
      if (readOnlyCalls.has(e.props.tool_use_id)) return <el.Box />
      return shell ? renderShellResult(el, fit(e.viewport), e.props.output) : next(e)
    })
  }

  on('session.start', async ($, e, next) => {
    terminal = await probe($, style, probes)
    void latexEngine($, latex)
    const started = await next(e)
    await $.command
      .register({ name: 'prismantis', description: 'Switch the prismantis theme, pick styles from samples, copy the last reply, or show the demo', argumentHint: '[theme [<name> | random] | setup [<step> [<pick>]] | copy [code] | demo]' })
      .catch(() => undefined)
    return started
  })

  on('command.run', { command: 'prismantis' }, async ($, e) => {
    const [first, second, third] = e.args.trim().split(/\s+/)
    const [sub, name] = THEME_ARGS.includes(first ?? '') ? ['theme', first] : [first, second]
    if (sub === 'demo') return { text: showcaseText(PRESET_NAMES) }
    if (sub === 'setup') return { text: await setup($, picked, name, third) }
    if (sub === 'copy') {
      const reply = (await $.session.messages()).findLast(m => m.role === 'assistant' && m.text.trim())
      if (!reply) return { text: 'Nothing to copy yet.' }
      const code = name === 'code' ? nestedBlocks(parseCached(reply.text)).findLast(b => b.kind === 'code') : undefined
      if (name === 'code' && code?.kind !== 'code') return { text: 'The last reply has no code block.' }
      const result = await $.ui.copy({ text: code?.kind === 'code' ? code.lines.join('\n') : reply.text })
      return { text: result.isCopied ? `Copied the last ${code ? 'code block' : 'reply'}.` : `Copy failed: ${result.reason}` }
    }
    if (sub === 'demo-rtl') {
      terminal = await probe($, style, probes)
      return { text: rtlShowcaseText() }
    }
    if (sub !== 'theme') return { text: helpText(PRESET_NAMES) }
    if (!name) return { text: options.theme === 'random' ? `current: ${picked.theme} (random)\nkeep it: /prismantis theme ${picked.theme}` : `current: ${picked.theme}` }
    if (!THEME_ARGS.includes(name)) return { text: `Unknown theme "${name}". Themes: ${PRESET_NAMES.join(', ')}, random` }
    return { text: await setTheme($, picked, name) }
  })

  on('ui.render', { component: 'TurnDuration' }, async ($, e) => {
    const at = style.clock === 'off' ? undefined : endedAt(await read($, turnEnds), e.props.durationMs, await firstDrawn($, e.requestId))
    const time = at === undefined ? undefined : clockText(at, await $.clock.now(), style.clock)
    return renderTurnDuration($.ui.resolve(e), style, e.props.word, e.props.durationMs, time)
  })

  on('turn.complete', async ($, e, next) => {
    if (style.clock !== 'off' && e.agentId === undefined) {
      const at = await $.clock.now()
      await update($, turnEnds, list => withRecord(list, { durationMs: e.durationMs, at }))
    }
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    if (style.clock !== 'off' && (e.origin.kind === 'composer' || e.origin.kind === 'bridge')) {
      const at = await $.clock.now()
      await update($, sent, list => withRecord(list, { text: promptKey(e.text), at }))
    }
    terminal = await probe($, style, probes)
    if (!style.diagramHints || !takesHint(e.origin)) return next(e)
    void latexEngine($, latex)
    const hints = [HINT, FIGURE_HINT, ...(latex.ready && !latex.stopped ? [LATEX_HINT] : [])]
    return next({ ...e, context: [...(e.context ?? []), ...hints] })
  })

  on('ui.render', { component: 'InfoNotice' }, async (_$, e, next) =>
    mirrored(style) && hasRtl(e.props.text) && opensLatin(e.props.text) ? next({ ...e, props: { ...e.props, text: ROW_MARK_TEXT + e.props.text } }) : next(e))

  on('ui.render', { component: 'CommandOutput' }, async ($, e, next) => {
    if (e.props.isErrored) return next(e)
    if (e.props.text.includes('\u001b')) return next(e)
    const found = e.props.command === 'prismantis' ? findSetup(PRESET_NAMES, e.props.text) : undefined
    if (found) {
      const el = $.ui.resolve(e)
      const base = { ...forSurface(fit(e.viewport), e.surface, await linkReach($, probes)), copyButtons: false }
      return <el.Box flexDirection="column" rowGap={1}>{drawSetup($, el, base, options, found, columnsOf(e.viewport))}</el.Box>
    }
    const blocks = parseCached(e.props.text)
    if (blocks.length === 0) return next(e)
    const el = $.ui.resolve(e)
    const { Box } = el
    const math = await mathOfBlocks($, latex, e.surface, blocks)
    const pictures = await picturesOf($, style, probes, e.surface, blocks)
    const open = await read($, unfolded)
    const reach = await linkReach($, probes)
    const surfaceStyle = forSurface(fit(e.viewport), e.surface, reach)
    return <Box flexDirection="column" rowGap={1} {...fullWidth(e.props.text)}>{drawMarkdown($, el, surfaceStyle, blocks, columnsOf(e.viewport), math, pictures, undefined, open, { id: e.requestId, press: reach.marks })}</Box>
  })

  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    const kind = e.props.origin.kind
    const own = kind === 'composer' || kind === 'bridge' || (kind === 'unclassified' && !e.props.from && !e.props.task)
    if (!own) return next(e)
    const at = style.clock === 'off' ? undefined : sentAt(await read($, sent), e.props.text, await firstDrawn($, e.requestId))
    const time = at === undefined ? undefined : clockText(at, await $.clock.now(), style.clock)
    if (style.promptStyle === 'off') return time === undefined ? next(e) : next({ ...e, props: { ...e.props, text: `[${time}] ${e.props.text}` } })
    return renderUserPrompt($.ui.resolve(e), fit(e.viewport), e.props.text, columnsOf(e.viewport), time)
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const blocks = parseCached(e.props.text)
    if (blocks.length === 0) return next(e)
    const el = $.ui.resolve(e)
    const { Box, Text } = el
    const narration = style.toolStyle === 'tree-bold' && blocks.length === 1 && blocks[0]!.kind === 'paragraph'
    const math = await mathOfBlocks($, latex, e.surface, blocks)
    const pictures = await picturesOf($, style, probes, e.surface, blocks)
    const reach = await linkReach($, probes)
    const surfaceStyle = forSurface(fit(e.viewport), e.surface, reach)
    const open = await read($, unfolded)
    return (
      <Box key="msg" flexDirection="row">
        <Box width={2} flexShrink={0}>
          <Text color={style.theme.accent}>{e.props.isFirstOfReply ? '●' : ' '}</Text>
        </Box>
        <Box flexDirection="column" rowGap={1} flexGrow={1}>
          {drawMarkdown($, el, narration ? { ...surfaceStyle, narration } : surfaceStyle, blocks, columnsOf(e.viewport), math, pictures, blocks.length > 1 || hasRtl(e.props.text) ? e.props.text : undefined, open, { id: e.requestId, press: reach.marks })}
        </Box>
      </Box>
    )
  })

  on('prismantis.markdown', async ($, e, next) => {
    const blocks = parseCached(e.text, shared, 20)
    if (blocks.length === 0) return next(e)
    const el = $.ui.resolve({ surface: e.surface, component: 'AssistantMessage' })
    const { Box } = el
    const surfaceStyle = forSurface(style, e.surface, await linkReach($, probes))
    return { value: <Box flexDirection="column" rowGap={1} {...fullWidth(e.text)}>{drawMarkdown($, el, { ...surfaceStyle, copyButtons: false }, blocks, Math.max(20, e.columns || 0))}</Box> }
  })
}
