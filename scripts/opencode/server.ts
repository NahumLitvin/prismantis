import { FIGURE_HINT } from '../../plugin/hooks/figure'
import { HINT, showcaseText } from '../../plugin/hooks/help'
import { PRESET_NAMES } from '../../plugin/hooks/presets'

const OPENCODE = [
  'This session runs in OpenCode, not Claude Code. The notes after this paragraph are what prismantis tells Claude in Claude Code; follow them with these OpenCode differences.',
  'OpenCode draws markdown tables, headings, lists, links and fenced code itself, and mermaid only for flowchart, sequenceDiagram, stateDiagram-v2, gantt, gitGraph and timeline. xychart-beta and pie print as source, so draw those as a figure instead.',
  'Figure blocks are drawn with their {role:text} colors. There are no copy buttons and GitHub alerts draw as plain quotes.',
].join(' ')

const SYSTEM = `${OPENCODE}\n\n${HINT}\n\n${FIGURE_HINT}`

const DEMO = `Reply with exactly the markdown between the START and END lines, nothing before or after it.\n\nSTART\n> This is the Claude Code demo. In OpenCode, copy buttons, tool rows, diff cards, alert boxes, footnotes, xychart and pie charts are not drawn yet: see opencode/README.md in the prismantis repo.\n${showcaseText(PRESET_NAMES)}END`

type Text = { type: 'text'; text: string }
type Prompt = { text?: string }
type Context = {
  session: {
    hook(name: 'context', run: (event: { system: Text[] }) => void): Promise<unknown>
    prompt(input: Prompt & { sessionID: string; delivery: string }): Promise<unknown>
  }
  command: {
    transform(run: (editor: { add(command: { name: string; description: string; execute(input: { sessionID: string; prompt: Prompt; delivery: string }): Promise<unknown> }): void }) => void): Promise<unknown>
  }
}

export default {
  id: 'prismantis',
  async setup(ctx: Context) {
    await ctx.session.hook('context', event => {
      event.system.push({ type: 'text', text: SYSTEM })
    })
    await ctx.command.transform(editor => {
      editor.add({
        name: 'prismantis',
        description: 'Show the prismantis demo',
        execute: ({ sessionID, prompt, delivery }) => ctx.session.prompt({ ...prompt, sessionID, text: DEMO, delivery }),
      })
    })
  },
}
