import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { drawFigure } from '../hooks/figure'
import { boxArt, mermaidText } from '../hooks/mermaid'
import { resolveStyle } from '../hooks/theme'

globalThis.h = (type, props, ...children) => ({ type, props: props ?? {}, children })
globalThis.Fragment = 'Fragment'
const el = { Box: 'Box', Text: 'Text', Button: 'Button', Link: 'Link' }

const configTheme = () => {
  try {
    const toml = readFileSync(join(process.env.CODEX_HOME || join(homedir(), '.codex'), 'config.toml'), 'utf8')
    return toml.match(/^theme\s*=\s*"prismantis-([\w-]+)"/m)?.[1]
  } catch {
    return undefined
  }
}

const geminiTheme = () => {
  try {
    return JSON.parse(readFileSync(join(homedir(), '.gemini', 'settings.json'), 'utf8')).ui?.theme?.match(/^prismantis-([\w-]+)/)?.[1]
  } catch {
    return undefined
  }
}

const sgr = p => {
  const codes = []
  if (p.bold) codes.push(1)
  if (p.dimColor || p.dim) codes.push(2)
  if (p.italic) codes.push(3)
  if (p.underline) codes.push(4)
  const hex = /^#([0-9a-f]{6})$/i.exec(p.color ?? '')
  if (hex) codes.push(38, 2, ...[0, 2, 4].map(i => parseInt(hex[1].slice(i, i + 2), 16)))
  return codes
}

const text = (node, inherited = []) => {
  if (node === null || node === undefined || node === false) return ''
  if (Array.isArray(node)) return node.map(n => text(n, inherited)).join('')
  if (typeof node !== 'object') return `\x1b[0;${inherited.join(';')}m${node}`
  return text(node.children, [...inherited, ...sgr(node.props)])
}

const lines = node => {
  if (!node || typeof node !== 'object') return []
  if (Array.isArray(node)) return node.flatMap(lines)
  if (node.type === 'Box') return lines(node.children)
  if (node.type === 'Text') return [`${text(node)}\x1b[0m`]
  return []
}

const lang = process.argv[2]
const source = readFileSync(0, 'utf8').replace(/\n$/, '')
const columns = Number(process.env.COLUMNS) || 100
const style = resolveStyle({ theme: process.env.PRISMANTIS_THEME || (process.argv[3] === 'gemini' ? geminiTheme() : configTheme()) || 'catppuccin-mocha' })
const art = lang === 'mermaid' ? mermaidText(source, false, columns) : null
const drawn = lang === 'figure' ? drawFigure(el, style, { kind: 'code', lang, lines: source.split('\n') }, columns, 'f')?.element : art && boxArt(el, style, art, 'm')
if (!drawn) process.exit(1)
process.stdout.write(`${lines(drawn).join('\n')}\n`)
