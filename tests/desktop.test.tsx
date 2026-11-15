import type { On, ThemeSetArgs } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { DESKTOP_FLOORS, desktopLook, isLightBackground } from '../hooks/desktop'
import { PRESET_BACKGROUNDS, PRESET_NAMES, PRESETS } from '../hooks/presets'
import { contrast } from '../hooks/render'
import { resolveStyle } from '../hooks/theme'
import type { Theme } from '../hooks/theme'
import { startSession } from './clipboard-env'

const LIGHT = ['catppuccin-latte', 'gruvbox-light', 'rose-pine-dawn', 'github-light', 'solarized-light']

const recordTheme = (on: On) => {
  mock.env(on, {})
  const calls: (ThemeSetArgs | 'clear')[] = []
  on('theme.set', (_, e) => {
    calls.push(e)
    return { value: { isDrawn: true as const, requestId: 'theme' } }
  })
  on('theme.clear', () => {
    calls.push('clear')
    return { value: { isDrawn: false as const, reason: 'the theme is cleared' } }
  })
  return calls
}

const command = (args: string) => ({ command: 'prismantis', args, origin: { kind: 'composer' as const }, presentation: { isFullscreen: false, columns: 120 } })

test('every palette maps to desktop tokens that clear their contrast floor on surface-0', async () => {
  const failures: string[] = []
  for (const name of PRESET_NAMES) {
    const look = desktopLook(name, (PRESETS as Record<string, Theme>)[name]!)
    const inputs = look.colors.inputs[look.scheme]!
    const bg = inputs['surface-0']!
    for (const [token, color] of Object.entries(inputs)) {
      if (!/^#[0-9a-f]{6}$/.test(color)) failures.push(`${name}.${token} ${color} is not #rrggbb`)
      const floor = DESKTOP_FLOORS[token]
      if (token.startsWith('on-')) {
        const fill = inputs[token.replace(/^on-/, 'fill-')]!
        if (contrast(color, fill) < floor!) failures.push(`${name}.${token} ${contrast(color, fill).toFixed(2)} on its fill`)
      } else if (floor !== undefined && contrast(color, bg) < floor) failures.push(`${name}.${token} ${contrast(color, bg).toFixed(2)}`)
    }
  }
  expect(failures).toEqual([])
})

test('light palettes ask for the light mode and dark ones for the dark mode, from the background', async () => {
  for (const name of PRESET_NAMES) {
    const look = desktopLook(name, (PRESETS as Record<string, Theme>)[name]!)
    expect(look.scheme).toBe(LIGHT.includes(name) ? 'light' : 'dark')
    expect(Object.keys(look.colors.inputs)).toEqual([look.scheme])
    expect(look.colors.v).toBe(1)
    expect(look.colors.label).toBe(`prismantis ${name}`)
    const bg = (PRESET_BACKGROUNDS as Record<string, string | undefined>)[name]
    if (bg) expect(isLightBackground(bg)).toBe(look.scheme === 'light')
  }
})

test('a color option the person set reaches the desktop palette', async () => {
  const look = desktopLook('nord', resolveStyle({ theme: 'nord', accentColor: '#ff8800' }).theme)
  expect(look.colors.inputs.dark!['fill-accent']).toBe('#ff8800')
})

test('desktopColors off, the default, never touches the desktop theme', async ($, on) => {
  const calls = recordTheme(on)
  on('config.set', (_, e) => ({ value: e.value }))
  await startSession($, on)
  await $.command.run(command('theme solarized-light'))
  expect(calls).toEqual([])
})

test('desktopColors match paints the desktop app at session start, in light mode for a light theme', { options: { desktopColors: 'match', theme: 'solarized-light' } }, async ($, on) => {
  const calls = recordTheme(on)
  await startSession($, on)
  expect(calls).toHaveLength(1)
  const set = calls[0] as ThemeSetArgs
  expect(set.overrideColorScheme).toBe('light')
  expect(set.colors?.inputs.light?.['surface-0']).toBe('#fdf6e3')
  expect(set.backdrop).toBeUndefined()
})

test('desktopColors match repaints on /prismantis theme <name>', { options: { desktopColors: 'match' } }, async ($, on) => {
  const calls = recordTheme(on)
  on('config.set', (_, e) => ({ value: e.value }))
  await startSession($, on)
  await $.command.run(command('theme dracula'))
  const last = calls.at(-1) as ThemeSetArgs
  expect(last.overrideColorScheme).toBe('dark')
  expect(last.colors?.inputs.dark?.['surface-0']).toBe('#282a36')
})

test('turning desktopColors from match to off clears the desktop theme once, and nothing else clears it', { options: { desktopColors: 'match' } }, async ($, on) => {
  const calls = recordTheme(on)
  on('config.set', (_, e) => ({ value: e.value }))
  await startSession($, on)
  await $.command.run(command('setup desktop off'))
  expect(calls.filter(c => c === 'clear')).toHaveLength(1)
  await $.command.run(command('theme nord'))
  expect(calls.filter(c => c === 'clear')).toHaveLength(1)
})

test('a desktop app that does not draw the theme is skipped silently', { options: { desktopColors: 'match' } }, async ($, on) => {
  on('theme.set', () => ({ value: { isDrawn: false as const, reason: 'no attached surface draws a theme' } }))
  on('config.set', (_, e) => ({ value: e.value }))
  await startSession($, on)
  const result = await $.command.run(command('theme nord'))
  expect(result.text).toBe('Theme set to nord.')
})
