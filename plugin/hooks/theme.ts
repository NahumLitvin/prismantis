import type { BenchTable } from './bench-table'
import type { PluginOptions, RenderSurface } from 'claude-code'

import type { ClipboardBackend } from './clipboard'
import type { DesktopColors } from './desktop'
import type { PresetName } from './presets'
import { PRESET_BACKGROUNDS, PRESET_NAMES, PRESETS } from './presets'
import type { SchemaTable } from './schema-table'
import type { CompareTable } from './compare-table'
import type { ApiTable } from './api-table'
import type { KvTable } from './kv-table'
import type { GroupTable } from './group-table'
import type { HeatTable } from './heat-table'
import type { TreeTable } from './tree-table'
import type { PivotTable } from './pivot-table'
import type { StatusMatrix } from './status'
import type { Shape, Terminal } from './rtl'
import { TERMINALS } from './rtl'
import type { TestMatrix } from './test-report'

const TOKENS = [
  'accent', 'heading', 'strong', 'emphasis', 'inlineCode', 'codeText', 'codeCommand', 'codeFlag', 'codeString', 'codeComment', 'codeFill', 'codeBorder',
  'link', 'path', 'number', 'quote', 'rule', 'tableHeader', 'tableRule', 'tableText', 'bullet', 'diagram', 'diagramText', 'diffAdded', 'diffRemoved', 'promptFill', 'promptBorder', 'promptText', 'replyFill', 'alertNote', 'alertTip', 'alertImportant', 'alertWarning', 'alertCaution', 'replyBorder', 'pngBackground',
] as const

export type Theme = Partial<Record<(typeof TOKENS)[number], string>>

export type CellLook = { color?: string; bold?: boolean }

export type Clock = 'off' | '24h' | '12h'

export type Style = {
  theme: Theme
  background?: string
  desktopColors: DesktopColors
  headingStyle: 'bold' | 'underline' | 'uppercase' | 'banner'
  tableStyle: 'box' | 'rules' | 'grid' | 'minimal'
  tableLayout: 'classic' | 'auto' | 'compact' | 'stacked'
  statusMatrix: StatusMatrix
  testMatrix: TestMatrix
  benchTable: BenchTable
  schemaTable: SchemaTable
  compareTable: CompareTable
  apiTable: ApiTable
  kvTable: KvTable
  groupTable: GroupTable
  heatTable: HeatTable
  treeTable: TreeTable
  pivotTable: PivotTable
  taskStyle: 'checks' | 'ticks' | 'box' | 'progress'
  listMarker: 'dots' | 'dash'
  promptStyle: 'bubble' | 'framed' | 'wide' | 'bar' | 'chevron' | 'off'
  replyStyle: 'auto' | 'bubble' | 'solid' | 'framed' | 'off'
  bubbleLabels: 'large' | 'small' | 'off'
  clock: Clock
  toolStyle: 'chat' | 'tree-dim' | 'tree-bold' | 'classic'
  toolOutput: 'full' | 'quiet' | 'rows'
  runningDot: 'ring' | 'blink'
  dotDark?: boolean
  unreadPrompts: boolean
  narration?: boolean
  ink?: string
  inside?: 'quote' | 'alert'
  noteKey?: string
  pressPreview?: boolean
  diffStyle: 'card' | 'full' | 'marks' | 'bar'
  shellEdits: 'list' | 'diffs'
  codeStyle: 'plain' | 'framed' | 'filled' | 'card'
  planStyle: 'off' | 'bare' | 'card'
  scriptStyle: 'frame' | 'rail' | 'bar' | 'chip'
  pieStyle: 'round' | 'bars'
  highlightNumbers: boolean
  surfaces?: RenderSurface[]
  highlightPaths: boolean
  fullPaths: boolean
  mermaid: boolean
  mermaidAscii: boolean
  copyButtons: boolean
  folds: 'closed' | 'open'
  copyButtonStyle: 'dim' | 'inline' | 'hover'
  textCopyButtons: boolean
  sectionCopyButtons: boolean
  promptCopyButtons: boolean
  htmlCopy: ClipboardBackend | null
  images: boolean
  nativeCode?: boolean
  gridFace?: boolean
  monoFace?: boolean
  svgArt?: boolean
  smallDot?: boolean
  httpLinks: boolean
  editorLinks: boolean
  obsidianLinks: boolean
  fileLinks: string | null
  pathLinks: boolean
  hyperlinks: boolean
  found?: ReadonlySet<string>
  diagramHints: boolean
  issueHint: boolean
  keyPointHint: boolean
  rtl: 'auto' | Terminal | 'off'
  reorder: boolean
  shape: Shape
  latex: boolean
  cwd: string
  home: string
}

const COLOR = /^(#[0-9a-f]{3}|#[0-9a-f]{6}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|ansi256\(\d{1,3}\)|(black|red|green|yellow|blue|magenta|cyan|white|gray|grey)(Bright)?)$/i

const isColor = (value: unknown): value is string => typeof value === 'string' && COLOR.test(value.trim())

export const longHex = (color: string): string => color.replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i, '#$1$1$2$2$3$3')

const SURFACES: RenderSurface[] = ['terminal', 'desktop', 'vscode', 'mobile']

const surfacesOf = (value: unknown): RenderSurface[] | undefined => {
  const named = String(value ?? '').toLowerCase().split(',').map(s => s.trim()).filter((s): s is RenderSurface => (SURFACES as string[]).includes(s))
  return named.length ? named : undefined
}

const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback

export const RANDOM_THEMES: readonly string[] = PRESET_NAMES.filter(t => !/latte|light|dawn/.test(t) && t !== 'mono')

export const pickTheme = (value: unknown, random = Math.random): string => {
  const name = value === 'random' ? RANDOM_THEMES[Math.floor(random() * RANDOM_THEMES.length)] : value
  return (PRESET_NAMES as readonly unknown[]).includes(name) ? String(name) : 'catppuccin-mocha'
}

export const resolveStyle = (options: PluginOptions): Style => {
  const preset = (PRESET_NAMES as string[]).includes(String(options.theme)) ? (String(options.theme) as PresetName) : 'catppuccin-mocha'
  const base: Theme = PRESETS[preset]
  const fromFields = Object.fromEntries(
    TOKENS.filter(k => isColor(options[`${k}Color`])).map(k => [k, longHex(String(options[`${k}Color`]).trim())]),
  )

  const rtl = pick(options.rtl, ['auto', 'off', ...(Object.keys(TERMINALS) as Terminal[])], 'auto')

  return {
    theme: { ...base, ...fromFields },
    ...(PRESET_BACKGROUNDS[preset] ? { background: PRESET_BACKGROUNDS[preset] } : {}),
    desktopColors: pick(options.desktopColors, ['off', 'match'] as const, 'off'),
    headingStyle: pick(options.headingStyle, ['bold', 'underline', 'uppercase', 'banner'] as const, 'banner'),
    tableStyle: pick(options.tableStyle, ['box', 'rules', 'grid', 'minimal'] as const, 'box'),
    tableLayout: pick(options.tableLayout, ['classic', 'auto', 'compact', 'stacked'] as const, 'classic'),
    statusMatrix: pick(options.statusMatrix, ['off', 'color', 'summary', 'group'] as const, 'off'),
    testMatrix: pick(options.testMatrix, ['off', 'report'] as const, 'off'),
    benchTable: pick(options.benchTable, ['trend', 'color', 'off'] as const, 'off'),
    schemaTable: pick(options.schemaTable, ['full', 'types', 'keys', 'off'] as const, 'off'),
    compareTable: pick(options.compareTable, ['full', 'rank', 'pick', 'off'] as const, 'off'),
    apiTable: pick(options.apiTable, ['full', 'verbs', 'auth', 'off'] as const, 'off'),
    kvTable: pick(options.kvTable, ['full', 'sources', 'overrides', 'off'] as const, 'off'),
    groupTable: pick(options.groupTable, ['full', 'count', 'merge', 'off'] as const, 'off'),
    heatTable: pick(options.heatTable, ['color', 'bars', 'off'] as const, 'off'),
    treeTable: pick(options.treeTable, ['full', 'branch', 'off'] as const, 'off'),
    pivotTable: pick(options.pivotTable, ['transpose', 'off'] as const, 'off'),
    taskStyle: pick(options.taskStyle, ['checks', 'ticks', 'box', 'progress'] as const, 'checks'),
    listMarker: pick(options.listMarker, ['dots', 'dash'] as const, 'dots'),
    promptStyle: pick(options.promptStyle, ['bubble', 'framed', 'wide', 'bar', 'chevron', 'off'] as const, 'bubble'),
    replyStyle: pick(options.replyStyle, ['auto', 'bubble', 'solid', 'framed', 'off'] as const, 'auto'),
    bubbleLabels: pick(options.bubbleLabels, ['large', 'small', 'off'] as const, 'large'),
    clock: pick(options.clock, ['off', '24h', '12h'] as const, 'off'),
    toolStyle: pick(options.toolStyle, ['chat', 'tree-dim', 'tree-bold', 'classic'] as const, 'chat'),
    toolOutput: pick(options.toolOutput, ['full', 'quiet', 'rows'] as const, 'full'),
    runningDot: pick(options.runningDot, ['ring', 'blink'] as const, 'ring'),
    unreadPrompts: options.unreadPrompts === true,
    diffStyle: pick(options.diffStyle, ['card', 'full', 'marks', 'bar'] as const, 'card'),
    shellEdits: pick(options.shellEdits, ['list', 'diffs'] as const, 'list'),
    codeStyle: pick(options.codeStyle, ['plain', 'framed', 'filled', 'card'] as const, 'plain'),
    planStyle: pick(options.planStyle, ['off', 'bare', 'card'] as const, 'off'),
    scriptStyle: pick(options.scriptStyle, ['frame', 'rail', 'bar', 'chip'] as const, 'frame'),
    pieStyle: pick(options.pieStyle, ['round', 'bars'] as const, 'round'),
    highlightNumbers: options.highlightNumbers !== false,
    surfaces: surfacesOf(options.surfaces),
    highlightPaths: options.highlightPaths !== false,
    fullPaths: options.fullPaths === true,
    mermaid: options.mermaid !== false,
    mermaidAscii: options.mermaidAscii === true,
    copyButtons: options.copyButtons !== false,
    folds: pick(options.folds, ['closed', 'open'] as const, 'closed'),
    copyButtonStyle: pick(options.copyButtonStyle, ['dim', 'inline', 'hover'] as const, 'dim'),
    textCopyButtons: options.textCopyButtons !== false,
    sectionCopyButtons: options.sectionCopyButtons === true,
    promptCopyButtons: options.promptCopyButtons === true,
    htmlCopy: null,
    images: false,
    httpLinks: false,
    editorLinks: false,
    obsidianLinks: false,
    fileLinks: null,
    pathLinks: false,
    hyperlinks: false,
    diagramHints: options.diagramHints !== false && options.mermaid !== false,
    issueHint: options.issueHint !== false,
    keyPointHint: options.keyPointHint === true,
    rtl,
    reorder: rtl !== 'auto' && rtl !== 'off',
    shape: rtl === 'auto' || rtl === 'off' ? 'visual' : TERMINALS[rtl],
    latex: options.latex === true,
    cwd: '',
    home: '',
  }
}
