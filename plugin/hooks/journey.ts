import type { ChartArt } from './charts'
import { width } from './layout'
import { art, BAD_HUE, blank, type Canvas, fit, GOOD_HUE, LINE_HUE, type Line, line, oneLine, paint, rows, unquote, withoutBlocks, wrap } from './textart'

type Task = { name: string; score: number; actors: string[]; section: number }
type Journey = { title?: string; sections: string[]; tasks: Task[] }
type Glyphs = { h: string; v: string; fall: [string, string]; rise: [string, string]; dot: string }
type Cell = [number, number]

const ROUND: Glyphs = { h: '─', v: '│', fall: ['╮', '╰'], rise: ['╯', '╭'], dot: '●' }
const PLAIN: Glyphs = { h: '-', v: '|', fall: ['+', '+'], rise: ['+', '+'], dot: 'o' }
const IGNORED = /^(accTitle|accDescr)\b/i
const TASK = /^(.+?)\s*:\s*(\d+(?:\.\d+)?)\s*(?::(.*))?$/
const GUTTER = 2
const MIN_STEP = 8
const MAX_STEP = 16

const readLine = (j: Journey, text: string): boolean => {
  const title = /^title\s+(.*)$/i.exec(text)
  const section = /^section\s+([^:]*)$/i.exec(text)
  if (title) j.title = unquote(title[1]!)
  if (section) j.sections.push(unquote(section[1]!))
  if (title || section) return true
  if (IGNORED.test(text)) return true
  const m = TASK.exec(text)
  const score = Number(m?.[2])
  if (!m || score < 1 || score > 5) return false
  const actors = (m[3] ?? '').split(',').map(a => a.trim()).filter(Boolean)
  j.tasks.push({ name: oneLine(unquote(m[1]!)), score, actors, section: j.sections.length - 1 })
  return true
}

const parse = (source: string): Journey | null => {
  const lines = source.split('\n').map(l => l.replace(/#.*$/, '').trim()).filter(l => l && !l.startsWith('%%'))
  const [first = '', ...rest] = withoutBlocks(lines)
  if (!/^journey$/i.test(first)) return null
  const j: Journey = { sections: [], tasks: [] }
  for (const text of rest) if (!readLine(j, text)) return null
  return j.tasks.length ? j : null
}

const level = (score: number) => 5 - Math.round(score)

const mood = (score: number) => (score >= 4 ? GOOD_HUE : score <= 2 ? BAD_HUE : -1)

const link = (c: Canvas, g: Glyphs, [r1, c1]: Cell, [r2, c2]: Cell) => {
  if (r1 === r2) return paint(c, r1, c1 + 1, g.h.repeat(c2 - c1 - 1), LINE_HUE)
  const m = Math.floor((c1 + c2) / 2)
  const [turn, land] = r2 > r1 ? g.fall : g.rise
  paint(c, r1, c1 + 1, g.h.repeat(m - c1 - 1) + turn, LINE_HUE)
  for (let r = Math.min(r1, r2) + 1; r < Math.max(r1, r2); r++) paint(c, r, m, g.v, LINE_HUE)
  paint(c, r2, m, land + g.h.repeat(c2 - m - 1), LINE_HUE)
}

const spans = (tasks: Task[]) =>
  tasks.reduce<[number, number, number][]>((out, t, i) => {
    const last = out.at(-1)
    if (last && last[0] === t.section) last[1]++
    else out.push([t.section, 1, i])
    return out
  }, [])

const sectionLine = (j: Journey, g: Glyphs, step: number): Line[] => {
  if (!j.sections.length) return []
  const parts = spans(j.tasks).map(([section, count]): [string, number] => {
    const room = count * step - 1
    const name = section < 0 ? '' : fit(j.sections[section]!, room)
    const gap = room - width(name)
    const rule = name && gap >= 2 ? ` ${g.h.repeat(gap - 1)}` : ' '.repeat(gap)
    return [`${name}${rule} `, section]
  })
  return [line([' '.repeat(GUTTER), -1], ...parts)]
}

const labels = (texts: string[], step: number, hue: number): Line[] => {
  const wrapped = texts.map(t => (t ? wrap(t, step - 1, 2) : []))
  return Array.from({ length: Math.max(0, ...wrapped.map(w => w.length)) }, (_, r) =>
    line(
      [' '.repeat(GUTTER), -1],
      ...wrapped.map((w): [string, number] => {
        const text = w[r] ?? ''
        const left = Math.floor((step - 1 - width(text)) / 2)
        return [' '.repeat(left) + text + ' '.repeat(step - left - width(text)), hue]
      }),
    ),
  )
}

const across = (j: Journey, g: Glyphs, cols: number): Line[] | null => {
  const step = Math.min(MAX_STEP, Math.floor((cols - GUTTER) / j.tasks.length))
  if (step < MIN_STEP) return null
  const centre = (i: number) => GUTTER + i * step + Math.floor((step - 1) / 2)
  const c = blank(5, GUTTER + j.tasks.length * step)
  paint(c, 0, 0, '5', LINE_HUE)
  paint(c, 4, 0, '1', LINE_HUE)
  j.tasks.forEach((t, i) => {
    const next = j.tasks[i + 1]
    if (next) link(c, g, [level(t.score), centre(i)], [level(next.score), centre(i + 1)])
    paint(c, level(t.score), centre(i), g.dot, mood(t.score))
  })
  return [...sectionLine(j, g, step), ...rows(c), ...labels(j.tasks.map(t => t.name), step, -1), ...labels(j.tasks.map(t => t.actors.join(', ')), step, LINE_HUE)]
}

const down = (j: Journey, g: Glyphs, cols: number): Line[] => {
  const indent = j.sections.length ? '  ' : ''
  const nameWidth = Math.max(6, Math.min(Math.max(...j.tasks.map(t => width(t.name))), cols - indent.length - 18))
  const scoreWidth = Math.max(...j.tasks.map(t => String(t.score).length))
  return spans(j.tasks).flatMap(([section, count, start]) => {
    const head = section < 0 ? [] : [line([fit(j.sections[section]!, cols), section])]
    return [
      ...head,
      ...j.tasks.slice(start, start + count).map(t => {
        const name = fit(t.name, nameWidth)
        const used = indent.length + nameWidth + 13 + scoreWidth
        const filled = 4 - level(t.score)
        return line(
          [indent + name + ' '.repeat(nameWidth - width(name) + 1), -1],
          [g.h.repeat(2 * filled), LINE_HUE],
          [g.dot, mood(t.score)],
          [' '.repeat(2 * (4 - filled) + 1), -1],
          [String(t.score).padEnd(scoreWidth), mood(t.score)],
          [t.actors.length ? `  ${fit(t.actors.join(', '), Math.max(1, cols - used))}` : '', LINE_HUE],
        )
      }),
    ]
  })
}

export const journeyText = (source: string, ascii: boolean, columns: number): ChartArt | null => {
  const j = parse(source)
  if (!j) return null
  const g = ascii ? PLAIN : ROUND
  const cols = Math.max(24, columns - 4)
  const title = j.title ? [line([fit(j.title, cols), -1])] : []
  return art([...title, ...(across(j, g, cols) ?? down(j, g, cols))])
}
