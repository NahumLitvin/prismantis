import { expect } from 'claude-code/testing'

import { width } from '../hooks/render'

type EdgeUi = {
  find: (query: { type: string; text: RegExp }) => Promise<{ text: string } | undefined>
  findAll: (query: { type: string }) => Promise<{ props: Record<string, unknown> }[]>
}

export const topEdgeWidth = async (ui: EdgeUi, columns: number) => {
  const whole = await ui.find({ type: 'Text', text: /^┌[─┬]+┐$/ })
  if (whole) return width(whole.text)
  const spans = (await ui.findAll({ type: 'Box' })).filter(b => b.props.overflow === 'hidden' && b.props.height === 1).slice(0, columns + 1)
  expect(spans).toHaveLength(columns + 1)
  return spans.reduce((sum, b) => sum + (b.props.width as number), 0)
}
