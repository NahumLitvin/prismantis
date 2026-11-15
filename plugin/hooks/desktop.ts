import type { ThemeColorInputs, ThemeColors } from 'claude-code'

import { PRESET_BACKGROUNDS } from './presets'
import { contrast, tint } from './render'
import type { Theme } from './theme'

export type DesktopColors = 'off' | 'match'

export type DesktopLook = { colors: ThemeColors; scheme: 'light' | 'dark' }

export const DESKTOP_FLOORS: Readonly<Record<string, number>> = {
  'text-primary': 7,
  'text-secondary': 4.5,
  'text-muted': 4.5,
  'text-disabled': 2.5,
  'text-accent': 4.5,
  'text-success': 4.5,
  'text-warning': 4.5,
  'text-danger': 4.5,
  'text-pro': 4.5,
  'on-primary': 4.5,
  'on-accent': 4.5,
  'on-success': 4.5,
  'on-warning': 4.5,
  'on-danger': 4.5,
  'on-pro': 4.5,
  'fill-accent': 3,
  'fill-success': 3,
  'fill-warning': 3,
  'fill-danger': 3,
  'fill-pro': 3,
  border: 1.3,
  'border-strong': 1.8,
  'border-stronger': 2.5,
}

const HEX = /^#[0-9a-f]{6}$/i

const MONO_BACKGROUND = '#1c1c1c'
const MONO_TEXT = '#e4e4e4'

const hex = (color: string | undefined): string | undefined => (color && HEX.test(color) ? color.toLowerCase() : undefined)

export const isLightBackground = (background: string): boolean => contrast(background, '#000000') > contrast(background, '#ffffff')

export const held = (color: string, background: string, floor: number): string => {
  const pole = isLightBackground(background) ? '#000000' : '#ffffff'
  let out = color
  for (let share = 0.05; contrast(out, background) < floor && share <= 1.0001; share += 0.05) out = tint(color, pole, Math.min(1, share))!
  return out
}

const onFill = (fill: string, background: string, text: string): string => {
  const best = [background, text, '#000000', '#ffffff'].map(c => ({ c, r: contrast(c, fill) })).sort((a, b) => b.r - a.r)
  return best.find(b => b.r >= 4.5 && (b.c === background || b.c === text))?.c ?? best[0]!.c
}

const role = (name: string, color: string, background: string, text: string): ThemeColorInputs => {
  const fill = held(color, background, DESKTOP_FLOORS[`fill-${name}`]!)
  return {
    [`fill-${name}`]: fill as `#${string}`,
    [`text-${name}`]: held(color, background, DESKTOP_FLOORS[`text-${name}`]!) as `#${string}`,
    [`bg-${name}`]: tint(background, color, 0.15) as `#${string}`,
    [`on-${name}`]: onFill(fill, background, text) as `#${string}`,
    [`border-${name}`]: fill as `#${string}`,
  }
}

export const desktopInputs = (theme: Theme, background: string | undefined): { inputs: ThemeColorInputs; scheme: 'light' | 'dark' } => {
  const bg = hex(background) ?? MONO_BACKGROUND
  const scheme = isLightBackground(bg) ? 'light' : 'dark'
  const base = hex(theme.diagramText) ?? hex(theme.codeText) ?? (scheme === 'light' ? '#1c1c1c' : MONO_TEXT)
  const text = held(base, bg, DESKTOP_FLOORS['text-primary']!)
  const near = (share: number) => tint(bg, text, share)!
  const inputs: Record<string, string> = {
    'surface-0': bg,
    'surface-1': near(0.04),
    'surface-2': near(0.08),
    'surface-3': near(0.12),
    'text-primary': text,
    'text-secondary': held(tint(text, bg, 0.2)!, bg, DESKTOP_FLOORS['text-secondary']!),
    'text-muted': held(hex(theme.quote) ?? tint(text, bg, 0.4)!, bg, DESKTOP_FLOORS['text-muted']!),
    'text-disabled': held(tint(text, bg, 0.6)!, bg, DESKTOP_FLOORS['text-disabled']!),
    'fill-primary': text,
    'on-primary': bg,
    border: held(hex(theme.rule) ?? near(0.15), bg, DESKTOP_FLOORS.border!),
    'border-strong': held(hex(theme.tableRule) ?? near(0.3), bg, DESKTOP_FLOORS['border-strong']!),
    'border-stronger': held(near(0.45), bg, DESKTOP_FLOORS['border-stronger']!),
    ...role('accent', hex(theme.accent) ?? text, bg, text),
    ...role('success', hex(theme.diffAdded) ?? hex(theme.codeString) ?? text, bg, text),
    ...role('danger', hex(theme.diffRemoved) ?? hex(theme.codeFlag) ?? text, bg, text),
    ...role('warning', hex(theme.tableHeader) ?? hex(theme.heading) ?? text, bg, text),
    ...role('pro', hex(theme.emphasis) ?? hex(theme.accent) ?? text, bg, text),
  }
  return { inputs: inputs as ThemeColorInputs, scheme }
}

export const desktopLook = (name: string, theme: Theme, background = (PRESET_BACKGROUNDS as Record<string, string | undefined>)[name]): DesktopLook => {
  const { inputs, scheme } = desktopInputs(theme, background)
  return { scheme, colors: { v: 1, id: `prismantis-${name}`, label: `prismantis ${name}`, inputs: scheme === 'light' ? { light: inputs } : { dark: inputs } } }
}
