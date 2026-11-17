import { copyFileSync, mkdirSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bold, fg, rgbToHex, StyledText, TextRenderable, type MarkdownCodeBlockRenderer, type RGBA, type TextChunk } from '@opentui/core'

import { figureRuns, reframe } from '../../plugin/hooks/figure'
import type { FIGURE_ROLES } from '../../plugin/hooks/markdown'
import { chartArt } from '../../plugin/hooks/mermaid'
import type { Theme as PrismantisTheme } from '../../plugin/hooks/theme'

type Role = (typeof FIGURE_ROLES)[number]
type Feedback = Record<'error' | 'warning' | 'success' | 'info', { base: RGBA }>
type Markdown = Record<'text' | 'heading' | 'link' | 'code' | 'blockQuote' | 'emphasis' | 'strong' | 'horizontalRule' | 'codeBlock', RGBA>
type Syntax = Record<'comment' | 'keyword' | 'function' | 'variable' | 'string' | 'number' | 'type' | 'operator' | 'punctuation', RGBA>
type Diff = { text: Record<'added' | 'removed' | 'context' | 'hunkHeader', RGBA> }
type Hue = Record<'accent' | 'interactive' | 'neutral', Record<number, RGBA>>
type Theme = { text: { base: RGBA; muted: RGBA; feedback: Feedback }; markdown: Markdown; syntax: Syntax; diff: Diff; hue: Hue }
type Context = {
  renderer: ConstructorParameters<typeof TextRenderable>[0] & { width: number }
  theme: Theme
  markdown: { registerCodeBlockRenderer(language: string, render: MarkdownCodeBlockRenderer): () => void }
  keymap: { layer(make: () => unknown): void }
  ui: { toast: { show(input: { message: string; variant?: string }): void } }
}

const roleColor = (theme: Theme, role: Role): RGBA =>
  ({
    accent: theme.markdown.link,
    warn: theme.text.feedback.error.base,
    ok: theme.text.feedback.success.base,
    note: theme.text.feedback.info.base,
    dim: theme.text.muted,
    strong: theme.markdown.strong,
  })[role]

const figureChunks = (theme: Theme, lines: readonly string[]): TextChunk[] =>
  reframe(lines.map(figureRuns)).flatMap((runs, index) => [
    ...(index ? [fg(theme.markdown.codeBlock)('\n')] : []),
    ...runs.map(run => {
      if (!run.role) return fg(theme.markdown.codeBlock)(run.text)
      const chunk = fg(roleColor(theme, run.role))(run.text)
      return run.role === 'strong' ? bold(chunk) : chunk
    }),
  ])

const prismantisTheme = (theme: Theme): PrismantisTheme => ({
  accent: rgbToHex(theme.hue.interactive[200]),
  heading: rgbToHex(theme.markdown.heading),
  emphasis: rgbToHex(theme.markdown.emphasis),
  link: rgbToHex(theme.markdown.link),
  path: rgbToHex(theme.text.feedback.warning.base),
  number: rgbToHex(theme.syntax.number),
  codeFlag: rgbToHex(theme.syntax.keyword),
  quote: rgbToHex(theme.markdown.blockQuote),
  rule: rgbToHex(theme.markdown.horizontalRule),
  diagram: rgbToHex(theme.hue.accent[200]),
  diagramText: rgbToHex(theme.text.base),
  diffAdded: rgbToHex(theme.diff.text.added),
  diffRemoved: rgbToHex(theme.diff.text.removed),
})

const chartBlock = (theme: Theme, source: string, columns: number): { chunks: TextChunk[]; rows: number } | null => {
  if (!/^\s*(xychart(-beta)?|pie)\b/i.test(source)) return null
  const art = chartArt(source, prismantisTheme(theme), Math.min(120, columns))
  if (!art || Math.max(...art.grid.map(row => row.length)) > columns) return null
  const plain = theme.markdown.codeBlock
  const chunks: TextChunk[] = []
  art.grid.forEach((row, index) => {
    if (index) chunks.push(fg(plain)('\n'))
    let at = 0
    while (at < row.length) {
      const hue = art.colors[index]?.[at]
      let end = at + 1
      while (end < row.length && art.colors[index]?.[end] === hue) end++
      chunks.push(fg(hue ?? plain)(row.slice(at, end).join('')))
      at = end
    }
  })
  return { chunks, rows: art.grid.length }
}

const installThemes = (): number => {
  const from = fileURLToPath(new URL('./themes/', import.meta.url))
  const to = join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'opencode', 'themes')
  mkdirSync(to, { recursive: true })
  const files = readdirSync(from).filter(file => file.endsWith('.json'))
  for (const file of files) copyFileSync(join(from, file), join(to, file))
  process.emit('SIGUSR2')
  return files.length
}

export default {
  id: 'prismantis',
  setup(context: Context) {
    context.keymap.layer(() => ({
      mode: 'global',
      commands: [
        {
          id: 'prismantis.themes',
          title: 'Install prismantis themes',
          group: 'prismantis',
          palette: true,
          slash: { name: 'prismantis-themes' },
          run: () => {
            const count = installThemes()
            context.ui.toast.show({ message: `${count} prismantis themes installed, pick one in settings > Theme`, variant: 'success' })
          },
        },
      ],
    }))
    const remove = [
      context.markdown.registerCodeBlockRenderer('figure', token => {
        const lines = token.text.replace(/\n+$/, '').split('\n')
        return new TextRenderable(context.renderer, {
          content: new StyledText(figureChunks(context.theme, lines)),
          width: '100%',
          height: lines.length,
          wrapMode: 'none',
          marginTop: 1,
        })
      }),
      context.markdown.registerCodeBlockRenderer('chart', token => {
        const chart = chartBlock(context.theme, token.text.replace(/\n+$/, ''), context.renderer.width)
        if (!chart) return null
        return new TextRenderable(context.renderer, {
          content: new StyledText(chart.chunks),
          width: '100%',
          height: chart.rows,
          wrapMode: 'none',
          marginTop: 1,
        })
      }),
    ]
    return () => remove.forEach(done => done())
  },
}
