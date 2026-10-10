import type { Clock } from './theme'

export type Sent = { text: string; at: number }
export type TurnEnd = { durationMs: number; at: number }

const KEEP = 500
const SLACK_MS = 2000
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const two = (n: number) => String(n).padStart(2, '0')

export const clockText = (at: number, now: number, clock: Clock): string => {
  const d = new Date(at)
  const h = d.getHours()
  const time =
    clock === '12h'
      ? `${h % 12 === 0 ? 12 : h % 12}:${two(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`
      : `${two(h)}:${two(d.getMinutes())}${clock === '24h-seconds' ? `:${two(d.getSeconds())}` : ''}`
  const today = new Date(now)
  const isToday = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
  return isToday ? time : `${MONTHS[d.getMonth()]} ${d.getDate()} ${time}`
}

export const promptKey = (text: string) => text.trim().replace(/\s+/g, ' ').slice(0, 300)

export const withSent = (list: readonly Sent[], text: string, at: number): Sent[] => [...list, { text: promptKey(text), at }].slice(-KEEP)

export const withTurnEnd = (list: readonly TurnEnd[], durationMs: number, at: number): TurnEnd[] => [...list, { durationMs, at }].slice(-KEEP)

export const sentAt = (claimed: Map<string, number>, id: string, text: string, sent: readonly Sent[]): number | undefined => {
  const held = claimed.get(id)
  if (held !== undefined) return held
  const key = promptKey(text)
  const taken = new Set(claimed.values())
  const hit = sent.find(one => one.text === key && !taken.has(one.at))
  if (hit !== undefined) claimed.set(id, hit.at)
  return hit?.at
}

export const endedAt = (ends: readonly TurnEnd[], durationMs: number): number | undefined => {
  let best: TurnEnd | undefined
  for (const end of ends) {
    const gap = Math.abs(end.durationMs - durationMs)
    if (gap <= SLACK_MS && (best === undefined || gap <= Math.abs(best.durationMs - durationMs))) best = end
  }
  return best?.at
}
