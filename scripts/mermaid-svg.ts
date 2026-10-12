import { parseMermaid } from './node_modules/beautiful-mermaid/src/parser'
import { convertToAsciiGraph } from './node_modules/beautiful-mermaid/src/ascii/converter'
import { createMapping, lineToDrawing } from './node_modules/beautiful-mermaid/src/ascii/grid'
import { clipEdgeToShape } from './node_modules/beautiful-mermaid/src/shape-clipping'
import { renderSvg } from './node_modules/beautiful-mermaid/src/renderer'
import { parseClassDiagram } from './node_modules/beautiful-mermaid/src/class/parser'
import { renderClassSvg } from './node_modules/beautiful-mermaid/src/class/renderer'
import { parseErDiagram } from './node_modules/beautiful-mermaid/src/er/parser'
import { renderErSvg } from './node_modules/beautiful-mermaid/src/er/renderer'
import { parseSequenceDiagram } from './node_modules/beautiful-mermaid/src/sequence/parser'
import { layoutSequenceDiagram } from './node_modules/beautiful-mermaid/src/sequence/layout'
import { renderSequenceSvg } from './node_modules/beautiful-mermaid/src/sequence/renderer'
import { parseXYChart } from './node_modules/beautiful-mermaid/src/xychart/parser'
import { layoutXYChart } from './node_modules/beautiful-mermaid/src/xychart/layout'
import { renderXYChartSvg } from './node_modules/beautiful-mermaid/src/xychart/renderer'
import type { MermaidGraph, MermaidNode, MermaidEdge, PositionedGraph, PositionedGroup, Point, RenderOptions } from './node_modules/beautiful-mermaid/src/types'
import type { AsciiSubgraph } from './node_modules/beautiful-mermaid/src/ascii/types'

const X = 10
const PAD = 16

const layout = (source: MermaidGraph, Y = 20): PositionedGraph => {
  const grid = convertToAsciiGraph(source, { useAscii: false, paddingX: 5, paddingY: Y === 10 ? 5 : 3, boxBorderPadding: 1, graphDirection: /LR|RL/.test(source.direction) ? 'LR' : 'TD' })
  createMapping(grid)
  const point = (p: Point): Point => ({ x: PAD + p.x * X, y: PAD + p.y * Y })
  const nodes = grid.nodes.map(n => {
    if (!n.drawingCoord || !n.drawing) throw new Error('Node has no layout')
    const cls = source.classAssignments.get(n.name)
    return { id: n.name, label: source.nodes.get(n.name)!.label, shape: n.shape, ...point(n.drawingCoord), width: (n.drawing.length - 1) * X, height: (n.drawing[0]!.length - 1) * Y, inlineStyle: { ...(cls ? source.classDefs.get(cls) : {}), ...source.nodeStyles.get(n.name) } }
  })
  const byId = new Map(nodes.map(n => [n.id, n]))
  const edges = grid.edges.map((edge, i) => {
    const from = byId.get(edge.from.name)!
    const to = byId.get(edge.to.name)!
    let points = lineToDrawing(grid, edge.path).map(point)
    if (points.length < 2) throw new Error('Edge has no route')
    points[0] = { x: from.x + from.width * edge.startDir.x / 2, y: from.y + from.height * edge.startDir.y / 2 }
    points[points.length - 1] = { x: to.x + to.width * edge.endDir.x / 2, y: to.y + to.height * edge.endDir.y / 2 }
    const label = lineToDrawing(grid, edge.labelLine).map(point)
    const a = label[0]
    const b = label.at(-1)
    const labelPosition = a && b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : undefined
    const siblings = grid.edges.filter(e => e.from === edge.from && e.to === edge.to || e.from === edge.to && e.to === edge.from)
    const vertical = points.every(p => p.x === points[0]!.x)
    const horizontal = points.every(p => p.y === points[0]!.y)
    if (siblings.length > 1 && (vertical || horizontal)) {
      const span = Math.min(60, (vertical ? Math.min(from.width, to.width) : Math.min(from.height, to.height)) / siblings.length)
      const offset = (siblings.indexOf(edge) - (siblings.length - 1) / 2) * span
      for (const p of labelPosition ? [...points, labelPosition] : points) {
        if (vertical) p.x += offset
        else p.y += offset
      }
    }
    points = clipEdgeToShape(clipEdgeToShape(points, from, true), to, false)
    return { ...source.edges[i]!, points, labelPosition, inlineStyle: { ...source.linkStyles.get('default'), ...source.linkStyles.get(i) } }
  })
  const group = (sg: AsciiSubgraph): PositionedGroup => ({ id: sg.name, label: sg.name, ...point({ x: sg.minX, y: sg.minY }), width: (sg.maxX - sg.minX) * X, height: (sg.maxY - sg.minY) * Y, children: sg.children.map(group) })
  const groups = grid.subgraphs.filter(sg => !sg.parent).map(group)
  const width = Math.max(...nodes.map(n => n.x + n.width), ...groups.map(g => g.x + g.width), ...edges.flatMap(e => e.points.map(p => p.x)), 0) + PAD
  const height = Math.max(...nodes.map(n => n.y + n.height), ...groups.map(g => g.y + g.height), ...edges.flatMap(e => e.points.map(p => p.y)), 0) + PAD
  if (source.direction === 'BT' || source.direction === 'RL') {
    const horizontal = source.direction === 'RL'
    const flip = (p: Point) => {
      if (horizontal) p.x = width - p.x
      else p.y = height - p.y
    }
    const box = (b: Point & { width: number; height: number }) => {
      flip(b)
      if (horizontal) b.x -= b.width
      else b.y -= b.height
    }
    nodes.forEach(box)
    edges.forEach(e => { e.points.forEach(flip); if (e.labelPosition) flip(e.labelPosition) })
    const flipGroup = (g: PositionedGroup) => { box(g); g.children.forEach(flipGroup) }
    groups.forEach(flipGroup)
  }
  return { width, height, nodes, edges, groups }
}

const graph = (nodes: MermaidNode[], edges: MermaidEdge[]): MermaidGraph => ({ direction: 'TD', nodes: new Map(nodes.map(n => [n.id, n])), edges, subgraphs: [], classDefs: new Map(), classAssignments: new Map(), nodeStyles: new Map(), linkStyles: new Map() })

export const renderMermaidSVG = (source: string, options: RenderOptions = {}): string => {
  const lines = source.split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('%%'))
  const kind = lines[0]?.toLowerCase() ?? ''
  const colors = { bg: options.bg ?? '#181825', fg: options.fg ?? '#cdd6f4', accent: options.accent }
  const font = options.font ?? 'sans-serif'
  if (kind === 'sequencediagram') return renderSequenceSvg(layoutSequenceDiagram(parseSequenceDiagram(lines), options), colors, font, true)
  if (/^xychart(-beta)?\b/.test(kind)) return renderXYChartSvg(layoutXYChart(parseXYChart(lines), options), colors, font, true)
  if (kind === 'classdiagram') {
    const parsed = parseClassDiagram(lines)
    const positioned = layout(graph(parsed.classes.map(c => ({ id: c.id, shape: 'rectangle', label: [...(c.annotation ? [c.annotation, ''] : []), c.label, ...[...c.attributes, ...c.methods].flatMap(m => [`${m.visibility}${m.name}: ${m.type ?? ''}`, '']), '', ''].join('\n') })), parsed.relationships.map(r => ({ source: r.from, target: r.to, label: r.label, style: 'solid', hasArrowStart: false, hasArrowEnd: false }))), 10)
    return renderClassSvg({ ...positioned, classes: parsed.classes.map((c, i) => {
      const node = positioned.nodes[i]!
      const headerHeight = c.annotation ? 48 : 32
      const attrHeight = c.attributes.length * 20 + 8
      return { ...node, ...c, headerHeight, attrHeight, methodHeight: node.height - headerHeight - attrHeight }
    }), relationships: parsed.relationships.map((r, i) => ({ ...r, points: positioned.edges[i]!.points, labelPosition: positioned.edges[i]!.labelPosition })) }, colors, font, true)
  }
  if (kind === 'erdiagram') {
    const parsed = parseErDiagram(lines)
    const positioned = layout(graph(parsed.entities.map(e => ({ id: e.id, shape: 'rectangle', label: [e.label, ...e.attributes.flatMap(a => [`${a.type} ${a.name} ${a.keys.join(',')}`, ''])].join('\n') })), parsed.relationships.map(r => ({ source: r.entity1, target: r.entity2, label: r.label, style: 'solid', hasArrowStart: false, hasArrowEnd: false }))), 10)
    return renderErSvg({ ...positioned, entities: parsed.entities.map((e, i) => ({ ...positioned.nodes[i]!, ...e, headerHeight: 32, rowHeight: 20 })), relationships: parsed.relationships.map((r, i) => ({ ...r, points: positioned.edges[i]!.points })) }, colors, font, true)
  }
  return renderSvg(layout(parseMermaid(source)), colors, font, true)
}
