export type PrismantisMarkdownArgs<Surface> = {
  surface: Surface
  text: string
  columns: number
}

export type FormulaPicture = { png: string; width: number; height: number }

export type Formula = (FormulaPicture & { padded?: FormulaPicture }) | { error: true }

export type Prismantis<Surface, Drawing> = {
  markdown: (args: PrismantisMarkdownArgs<Surface>) => Promise<Drawing | undefined>
}

declare module 'claude-code' {
  interface EngineInterface {
    prismantis: Prismantis<RenderSurface, RenderElement>
  }
  interface PluginState {
    prismantis: { formulas: Record<string, Formula> }
  }
}
