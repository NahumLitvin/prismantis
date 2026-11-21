import { CONTROL } from './markdown'

export type AnsiLook = { color?: string; bold?: boolean; dim?: boolean; italic?: boolean; underline?: boolean; inverse?: boolean; strikethrough?: boolean }

export type AnsiRun = AnsiLook & { text: string }

const NAMES = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']

const CUBE = [0, 95, 135, 175, 215, 255]

const SGR = /\x1b\[([\d;]*)m/g

const hex = (...channels: number[]): string => `#${channels.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`

const color256 = (n: number): string | undefined => {
  if (!Number.isInteger(n) || n < 0 || n > 255) return undefined
  if (n < 8) return NAMES[n]
  if (n < 16) return `${NAMES[n - 8]}Bright`
  if (n < 232) return hex(CUBE[Math.floor((n - 16) / 36)]!, CUBE[Math.floor((n - 16) / 6) % 6]!, CUBE[(n - 16) % 6]!)
  const grey = 8 + (n - 232) * 10
  return hex(grey, grey, grey)
}

const FLAGS: Record<number, AnsiLook> = {
  1: { bold: true },
  2: { dim: true },
  3: { italic: true },
  4: { underline: true },
  7: { inverse: true },
  9: { strikethrough: true },
  22: { bold: undefined, dim: undefined },
  23: { italic: undefined },
  24: { underline: undefined },
  27: { inverse: undefined },
  29: { strikethrough: undefined },
  39: { color: undefined },
}

const extended = (codes: number[], i: number): { color?: string; skip: number } => {
  if (codes[i + 1] === 5) return { color: color256(codes[i + 2] ?? -1), skip: 2 }
  if (codes[i + 1] === 2) return { color: hex(codes[i + 2] ?? 0, codes[i + 3] ?? 0, codes[i + 4] ?? 0), skip: 4 }
  return { skip: 0 }
}

const basic = (code: number): AnsiLook | undefined => {
  if (code >= 30 && code <= 37) return { color: NAMES[code - 30] }
  if (code >= 90 && code <= 97) return { color: `${NAMES[code - 90]}Bright` }
  return FLAGS[code]
}

const step = (look: AnsiLook, codes: number[], i: number): { look: AnsiLook; skip: number } => {
  const code = codes[i]!
  if (code === 0) return { look: {}, skip: 0 }
  if (code !== 38 && code !== 48 && code !== 58) return { look: { ...look, ...basic(code) }, skip: 0 }
  const { color, skip } = extended(codes, i)
  return { look: code === 38 ? { ...look, color } : look, skip }
}

const applied = (look: AnsiLook, params: string): AnsiLook => {
  const codes = params === '' ? [0] : params.split(';').map(Number)
  let next = look
  for (let i = 0; i < codes.length; i++) {
    const done = step(next, codes, i)
    next = done.look
    i += done.skip
  }
  return next
}

const styled = (run: AnsiRun): boolean => Object.entries(run).some(([key, value]) => key !== 'text' && value !== undefined)

export const hasAnsi = (text: string): boolean => text.includes('\x1b[')

export const ansiLines = (text: string): AnsiRun[][] => {
  let look: AnsiLook = {}
  return text.split('\n').map(line => {
    const runs: AnsiRun[] = []
    let at = 0
    const take = (raw: string) => {
      const clean = raw.replace(CONTROL, '')
      if (clean) runs.push({ ...look, text: clean })
    }
    for (const m of line.matchAll(SGR)) {
      take(line.slice(at, m.index))
      look = applied(look, m[1]!)
      at = m.index + m[0].length
    }
    take(line.slice(at))
    return runs
  })
}

export const hasLook = (runs: AnsiRun[]): boolean => runs.some(styled)
