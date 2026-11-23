# Develop

[← README](../README.md)

## Develop

```bash
git clone https://github.com/NahumLitvin/prismantis
claude --plugin-dir ./prismantis/plugin
```

Edits hot-reload in that session. Before a PR run `claude plugin validate plugin` and `npm --prefix scripts test`, and print [docs/demo.md](demo.md) to check the look. `npm --prefix scripts run bench` times a full render of the demo reply, so speed claims can be checked on any machine. The full rules and verify loop are in [AGENTS.md](../AGENTS.md).

## Other mods

Other mods can draw markdown in the user's theme with `$.prismantis.markdown`. Pass the surface, the text and the content width in columns.

- It answers the tree to draw, or `undefined` when prismantis is disabled or the text holds nothing to draw.
- It throws when prismantis isn't installed, so call it in a `try`.
- Prismantis draws at least 20 columns wide. Copy buttons are left out, because a button can't cross from one mod to another.

```tsx
let drawn
try {
  drawn = await $.prismantis.markdown({ surface: e.surface, text, columns: e.props.bodyColumns })
} catch {}
return drawn ?? <Markdown text={text} />
```

The types are in [plugin/types/index.d.ts](../plugin/types/index.d.ts). List prismantis under `dependencies` in your `plugin.json` and Claude Code lays them into your `.claude-plugin/types/`. When prismantis is optional, declare the noun in your own contract instead:

```ts
declare module 'claude-code' {
  interface EngineInterface {
    prismantis: {
      markdown: (args: { surface: RenderSurface; text: string; columns: number }) => Promise<RenderElement | undefined>
    }
  }
}
```
