import { copyFileSync, mkdirSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bold, fg, StyledText, TextRenderable, type MarkdownCodeBlockRenderer, type RGBA, type TextChunk } from '@opentui/core'

import { figureRuns, reframe } from '../../plugin/hooks/figure'
import type { FIGURE_ROLES } from '../../plugin/hooks/markdown'
import { chartCells } from '../../plugin/hooks/mermaid'
import type { Theme as ChartTheme } from '../../plugin/hooks/theme'

type Role = (typeof FIGURE_ROLES)[number]
type Theme = {
  text: { base: RGBA; muted: RGBA; feedback: Record<'error' | 'warning' | 'success' | 'info', { base: RGBA }> }
  markdown: Record<'link' | 'strong' | 'codeBlock' | 'heading' | 'emphasis' | 'blockQuote' | 'horizontalRule' | 'listItem', RGBA>
  syntax: Record<'number' | 'keyword', RGBA>
  diff: { text: Record<'added' | 'removed' | 'hunkHeader', RGBA> }
}
type Context = {
  renderer: ConstructorParameters<typeof TextRenderable>[0]
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

const hex = (color: RGBA) => `#${color.toInts().slice(0, 3).map(n => n.toString(16).padStart(2, '0')).join('')}`

const chartTheme = (theme: Theme): ChartTheme => ({
  link: hex(theme.markdown.link),
  number: hex(theme.syntax.number),
  heading: hex(theme.markdown.heading),
  emphasis: hex(theme.markdown.emphasis),
  path: hex(theme.text.feedback.warning.base),
  codeFlag: hex(theme.syntax.keyword),
  accent: hex(theme.markdown.listItem),
  quote: hex(theme.markdown.blockQuote),
  rule: hex(theme.markdown.horizontalRule),
  diagram: hex(theme.diff.text.hunkHeader),
  diagramText: hex(theme.text.base),
  diffAdded: hex(theme.diff.text.added),
  diffRemoved: hex(theme.diff.text.removed),
})

const chartChunks = (theme: Theme, grid: string[][], colors: (string | undefined)[][]): TextChunk[] =>
  grid.flatMap((row, r) => [...(r ? [fg(theme.text.base)('\n')] : []), ...row.map((cell, c) => fg(colors[r]![c] ?? theme.text.base)(cell))])

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
    const dropChart = context.markdown.registerCodeBlockRenderer('chart', token => {
      const painted = chartCells(token.text.replace(/\n+$/, ''), (process.stdout.columns || 80) - 4, chartTheme(context.theme))
      if (!painted) return undefined
      return new TextRenderable(context.renderer, {
        content: new StyledText(chartChunks(context.theme, painted.grid, painted.colors)),
        width: '100%',
        height: painted.grid.length,
        wrapMode: 'none',
        marginTop: 1,
      })
    })
    const dropFigure = context.markdown.registerCodeBlockRenderer('figure', token => {
      const lines = token.text.replace(/\n+$/, '').split('\n')
      return new TextRenderable(context.renderer, {
        content: new StyledText(figureChunks(context.theme, lines)),
        width: '100%',
        height: lines.length,
        wrapMode: 'none',
        marginTop: 1,
      })
    })
    return () => {
      dropChart()
      dropFigure()
    }
  },
}
