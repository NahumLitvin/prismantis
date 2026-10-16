import { graphemes, width } from './render'

const DAY = 86400000
const STEPS = [1, 5, 15, 30, 60, 120, 360, 720, 1440, 2880, 10080, 20160, 43200, 129600, 525600].map(m => m * 60000)
const UNIT: Record<string, number> = { ms: 1, s: 1000, m: 60000, h: 3600000, d: DAY, w: 7 * DAY }
const TAGS = /^(done|active|crit|milestone)$/i
const IGNORED = /^(dateformat|axisformat|tickinterval|excludes|includes|todaymarker|weekday|weekend|inclusiveenddates|topaxis|displaymode|acctitle|accdescr|click)\b/i

const body = (source: string) => source.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'))

const fit = (label: string, max: number) => {
  if (width(label) <= max) return label
  let out = ''
  for (const g of graphemes(label)) {
    if (width(out + g) > max - 1) break
    out += g
  }
  return `${out.trimEnd()}…`
}

const pad = (text: string, size: number) => text + ' '.repeat(Math.max(0, size - width(text)))

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export const pieText = (source: string, ascii: boolean, columns: number): string | null => {
  const [first = '', ...rest] = body(source)
  const head = /^pie\b(\s+showData)?(?:\s+title\s+(.*))?$/i.exec(first)
  if (!head) return null
  let title = head[2]
  let showData = !!head[1]
  const slices: { label: string; text: string; value: number }[] = []
  for (const line of rest) {
    const named = /^title\s+(.*)$/i.exec(line)
    if (named) title = named[1]
    else if (/^showData$/i.test(line)) showData = true
    else if (!/^acc(Title|Descr)\b/.test(line)) {
      const slice = /^"([^"]*)"\s*:\s*([\d.]+)$/.exec(line)
      const value = Number(slice?.[2])
      if (!slice || !Number.isFinite(value)) return null
      slices.push({ label: fit(slice[1]!, 20), text: slice[2]!, value })
    }
  }
  const total = slices.reduce((sum, s) => sum + s.value, 0)
  if (total <= 0) return null
  slices.sort((a, b) => b.value - a.value)
  const max = slices[0]!.value
  const labelWidth = Math.max(...slices.map(s => width(s.label)))
  const percents = slices.map(s => {
    const pct = Math.round((s.value / total) * 100)
    return `${pct === 0 && s.value > 0 ? '<1' : pct}%`
  })
  const valueWidth = showData ? Math.max(...slices.map(s => s.text.length)) + 2 : 0
  const pctWidth = Math.max(...percents.map(p => p.length))
  const bar = clamp(columns - 6 - labelWidth - valueWidth - pctWidth, 8, 40)
  const rows = slices.map((s, i) => {
    const cells = s.value > 0 ? Math.max(1, Math.round((s.value / max) * bar)) : 0
    const value = showData ? s.text.padStart(valueWidth - 2) + '  ' : ''
    return `${pad(s.label, labelWidth)}  ${(ascii ? '#' : '█').repeat(cells).padEnd(bar)} ${value}${percents[i]!.padStart(pctWidth)}`
  })
  return [...(title ? [title.trim()] : []), ...rows].join('\n')
}

const dateParser = (format: string) => {
  if (/[A-Za-z]/.test(format.replace(/YYYY|MM|DD|HH|mm|ss/g, ''))) return null
  const order: string[] = []
  const pattern = format.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/YYYY|MM|DD|HH|mm|ss/g, token => {
    order.push(token)
    return token === 'YYYY' ? '(\\d{4})' : '(\\d{1,2})'
  })
  const exact = new RegExp(`^${pattern}$`)
  return (text: string): number | undefined => {
    const m = exact.exec(text)
    if (!m) return undefined
    const part = (token: string, fallback: number) => (order.includes(token) ? Number(m[order.indexOf(token) + 1]) : fallback)
    return Date.UTC(part('YYYY', 1970), part('MM', 1) - 1, part('DD', 1), part('HH', 0), part('mm', 0), part('ss', 0))
  }
}

const stamp = (t: number, span: number, sameYear: boolean) => {
  const iso = new Date(t).toISOString()
  return span < 2 * DAY ? iso.slice(11, 16) : sameYear ? iso.slice(5, 10) : iso.slice(0, 10)
}

export const ganttText = (source: string, ascii: boolean, columns: number): string | null => {
  const [first = '', ...rest] = body(source)
  if (!/^gantt$/i.test(first)) return null
  const format = /^dateFormat\s+(.+)$/im.exec(rest.join('\n'))?.[1]?.trim() ?? 'YYYY-MM-DD'
  const parse = dateParser(format)
  if (!parse) return null
  let title: string | undefined
  const rows: ({ section: string } | { name: string; start: number; end: number; milestone: boolean })[] = []
  const ends = new Map<string, { start: number; end: number }>()
  let previous: number | undefined
  for (const line of rest) {
    const named = /^title\s+(.*)$/i.exec(line)
    const section = /^section\s+(.*)$/i.exec(line)
    if (named) title = named[1]
    else if (section) rows.push({ section: fit(section[1]!.trim(), 24) })
    else if (!IGNORED.test(line)) {
      const colon = line.indexOf(':')
      if (colon < 1) return null
      const items = line.slice(colon + 1).split(',').map(s => s.trim())
      let milestone = false
      while (items.length > 1 && TAGS.test(items[0]!)) milestone = /milestone/i.test(items.shift()!) || milestone
      if (items.length > 3) return null
      const [id, from, to] = items.length === 3 ? items : items.length === 2 ? [undefined, ...items] : [undefined, undefined, items[0]]
      const after = /^after\s+(.+)$/i.exec(from ?? '')
      const start = from === undefined ? previous : after ? Math.max(...after[1]!.split(/\s+/).map(ref => ends.get(ref)?.end ?? NaN)) : parse(from)
      if (start === undefined || !Number.isFinite(start)) return null
      const duration = /^(\d+(?:\.\d+)?)(ms|s|m|h|d|w)$/.exec(to ?? '')
      const until = /^until\s+(\S+)$/i.exec(to ?? '')
      const end = duration ? start + Number(duration[1]) * UNIT[duration[2]!]! : until ? ends.get(until[1]!)?.start : parse(to ?? '')
      if (end === undefined || end < start) return null
      if (id) ends.set(id, { start, end })
      previous = end
      rows.push({ name: fit(line.slice(0, colon).trim(), 22), start, end, milestone })
    }
  }
  const tasks = rows.flatMap(r => ('name' in r ? [r] : []))
  if (!tasks.length) return null
  const min = Math.min(...tasks.map(t => t.start))
  const max = Math.max(...tasks.map(t => t.end))
  const span = max - min || DAY
  const sameYear = new Date(min).getUTCFullYear() === new Date(max).getUTCFullYear()
  const labelWidth = Math.max(...rows.map(r => ('name' in r ? width(r.name) + 2 : width(r.section))))
  const chart = clamp(columns - 6 - labelWidth, 10, 60)
  const col = (t: number) => Math.round(((t - min) / span) * chart)
  const tickText = stamp(min, span, sameYear).length
  const room = Math.max(1, Math.floor(chart / (tickText + 3)))
  const step = STEPS.find(ms => span / ms <= room) ?? span
  const ticks = Array.from({ length: Math.floor(span / step) + 1 }, (_, i) => min + i * step)
  const axis = [...(ascii ? '-' : '─').repeat(chart + 1)]
  const labels = [...' '.repeat(chart + 1)]
  let free = 0
  for (const t of ticks) {
    const at = col(t)
    axis[at] = ascii ? '|' : '▏'
    const text = stamp(t, span, sameYear)
    const from = Math.min(at, chart + 1 - text.length)
    if (from < free) continue
    labels.splice(from, text.length, ...text)
    free = from + text.length + 1
  }
  const lead = ' '.repeat(labelWidth + 2)
  const lines = rows.map(r => {
    if (!('name' in r)) return r.section
    const a = Math.min(col(r.start), chart - 1)
    const cells = r.milestone ? (ascii ? '*' : '◆') : (ascii ? '#' : '█').repeat(Math.max(1, col(r.end) - a))
    return `${pad(`  ${r.name}`, labelWidth)}  ${' '.repeat(a)}${cells}`
  })
  return [...(title ? [title.trim()] : []), lead + labels.join('').trimEnd(), lead + axis.join(''), ...lines].join('\n')
}
