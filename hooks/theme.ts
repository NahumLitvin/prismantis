import type { PluginOptions } from 'claude-code'

import { PRESETS } from './presets'
import type { Shape } from './rtl'

export const TOKENS = [
  'accent', 'heading', 'strong', 'emphasis', 'inlineCode', 'codeText', 'codeCommand', 'codeFlag', 'codeString', 'codeComment',
  'link', 'path', 'number', 'quote', 'rule', 'tableHeader', 'tableRule', 'bullet', 'diagram', 'diagramText',
] as const

export type Theme = Partial<Record<(typeof TOKENS)[number], string>>

export type Style = {
  theme: Theme
  headingStyle: 'bold' | 'underline' | 'uppercase' | 'banner'
  tableStyle: 'rules' | 'grid' | 'minimal'
  highlightNumbers: boolean
  highlightPaths: boolean
  mermaid: boolean
  mermaidAscii: boolean
  copyButtons: boolean
  diagramHints: boolean
  rtl: 'auto' | Shape | 'off'
  reorder: boolean
  shape: Shape
}

const COLOR = /^(#[0-9a-f]{3}|#[0-9a-f]{6}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|ansi256\(\d{1,3}\)|(black|red|green|yellow|blue|magenta|cyan|white|gray|grey)(Bright)?)$/i

export const isColor = (value: unknown): value is string => typeof value === 'string' && COLOR.test(value.trim())

const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback

export const resolveStyle = (options: PluginOptions): Style => {
  const base: Theme = (PRESETS as Record<string, Theme>)[String(options.theme)] ?? PRESETS['catppuccin-mocha']
  const fromFields = Object.fromEntries(
    TOKENS.filter(k => isColor(options[`${k}Color`])).map(k => [k, String(options[`${k}Color`]).trim()]),
  )

  const rtl = pick(options.rtl, ['auto', 'visual', 'words', 'lrm', 'off'] as const, 'auto')

  return {
    theme: { ...base, ...fromFields },
    headingStyle: pick(options.headingStyle, ['bold', 'underline', 'uppercase', 'banner'] as const, 'banner'),
    tableStyle: pick(options.tableStyle, ['rules', 'grid', 'minimal'] as const, 'rules'),
    highlightNumbers: options.highlightNumbers !== false,
    highlightPaths: options.highlightPaths !== false,
    mermaid: options.mermaid !== false,
    mermaidAscii: options.mermaidAscii === true,
    copyButtons: options.copyButtons !== false,
    diagramHints: options.diagramHints !== false && options.mermaid !== false,
    rtl,
    reorder: rtl !== 'auto' && rtl !== 'off',
    shape: rtl === 'words' || rtl === 'lrm' ? rtl : 'visual',
  }
}
