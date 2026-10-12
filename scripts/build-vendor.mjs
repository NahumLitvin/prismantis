import { build } from 'esbuild'
import { readFileSync, writeFileSync } from 'node:fs'

const bundledPackages = new Set()
const track = result => {
  for (const input of Object.keys(result.metafile.inputs)) {
    const match = /node_modules\/((?:@[^/]+\/)?[^/]+)/.exec(input)
    if (match) bundledPackages.add(match[1])
  }
}

const XYCHART = /beautiful-mermaid\/src\/ascii\/xychart\.ts$/
const SIZE = ['const PLOT_WIDTH = 60', 'const PLOT_HEIGHT = 20']
const CANVAS = /beautiful-mermaid\/src\/ascii\/canvas\.ts$/
const CANVAS_ANCHOR = 'export function isJunctionChar('
const CLEAR_LABEL_GAPS = `export function clearLabelGaps(canvas: Canvas, label: Canvas): void {
  for (let y = 0; y < (label[0]?.length ?? 0); y++) {
    const xs = label.map((col, x) => (col[y] !== ' ' ? x : -1)).filter(x => x >= 0)
    if (xs.length === 0) continue
    for (let x = xs[0]!; x <= xs[xs.length - 1]!; x++) {
      if (label[x]![y] === ' ' && !isAlphanumeric(canvas[x]![y]!)) canvas[x]![y] = ' '
    }
  }
}
`
const DRAW = /beautiful-mermaid\/src\/ascii\/draw\.ts$/
const DRAW_ANCHOR = '  graph.canvas = mergeCanvases(graph.canvas, zero, useAscii, ...labelCanvases)'
const DRAW_IMPORT = 'import { mkCanvas, copyCanvas,'

const SIZED_LAYOUTS = [[/beautiful-mermaid\/src\/xychart\/layout\.ts$/, 'XY'], [/beautiful-mermaid\/src\/sequence\/layout\.ts$/, 'SEQ']]

const PRISM_LANGUAGES = ['clike', 'markup', 'css', 'javascript', 'typescript', 'jsx', 'tsx', 'python', 'go', 'rust', 'java', 'kotlin', 'swift', 'c', 'cpp', 'csharp', 'ruby', 'json', 'yaml', 'toml', 'sql', 'diff', 'docker', 'hcl']

track(await build({
  metafile: true,
  stdin: {
    contents: [
      "const Prism = require('./node_modules/prismjs/components/prism-core.js')",
      'globalThis.Prism = Prism',
      ...PRISM_LANGUAGES.map(l => `require('./node_modules/prismjs/components/prism-${l}.js')`),
      'export const languages = Prism.languages',
      'export const tokenize = (code, grammar) => Prism.tokenize(code, grammar)',
    ].join('\n'),
    resolveDir: '.',
    loader: 'js',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2023',
  minifySyntax: true,
  minifyWhitespace: true,
  outfile: '../hooks/vendor/prism.js',
  legalComments: 'none',
}))

track(await build({
  metafile: true,
  stdin: {
    contents: [
      "export { renderMermaidAscii } from './node_modules/beautiful-mermaid/src/ascii/index.ts'",
      "export { setChartSize } from './node_modules/beautiful-mermaid/src/ascii/xychart.ts'",
    ].join('\n'),
    resolveDir: '.',
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2023',
  minifySyntax: true,
  minifyWhitespace: true,
  outfile: '../hooks/vendor/mermaid-text.js',
  legalComments: 'none',
  plugins: [{
    name: 'chart-size',
    setup(api) {
      api.onLoad({ filter: XYCHART }, args => {
        let src = readFileSync(args.path, 'utf8')
        for (const line of SIZE) {
          if (!src.includes(line)) throw new Error(`xychart.ts no longer has "${line}"`)
          src = src.replace(line, line.replace('const', 'let'))
        }
        src += '\nexport const setChartSize = (width: number, height: number) => { PLOT_WIDTH = width; PLOT_HEIGHT = height }\n'
        return { contents: src, loader: 'ts' }
      })
      api.onLoad({ filter: CANVAS }, args => {
        const src = readFileSync(args.path, 'utf8')
        if (!src.includes(CANVAS_ANCHOR)) throw new Error('canvas.ts no longer has isJunctionChar')
        return { contents: src.replace(CANVAS_ANCHOR, `${CLEAR_LABEL_GAPS}\n${CANVAS_ANCHOR}`), loader: 'ts' }
      })
      api.onLoad({ filter: DRAW }, args => {
        const src = readFileSync(args.path, 'utf8')
        if (!src.includes(DRAW_ANCHOR)) throw new Error('draw.ts no longer merges label canvases the same way')
        if (!src.includes(DRAW_IMPORT)) throw new Error('draw.ts no longer imports from canvas.ts the same way')
        const patched = src
          .replace(DRAW_ANCHOR, `${DRAW_ANCHOR}\n  for (const label of labelCanvases) clearLabelGaps(graph.canvas, label)`)
          .replace(DRAW_IMPORT, DRAW_IMPORT.replace('{ ', '{ clearLabelGaps, '))
        return { contents: patched, loader: 'ts' }
      })
    },
  }],
}))

track(await build({
  metafile: true,
  stdin: {
    contents: "export { renderMermaidSVG } from './mermaid-svg.ts'",
    resolveDir: '.',
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2023',
  minify: true,
  outfile: '../hooks/vendor/mermaid-svg.js',
  legalComments: 'none',
  plugins: [{
    name: 'svg-class-constants',
    setup(api) {
      for (const [filter, sizes] of SIZED_LAYOUTS) {
        api.onLoad({ filter }, args => {
          const src = readFileSync(args.path, 'utf8')
          if (!src.includes(`const ${sizes} = {`)) throw new Error(`${args.path} no longer keeps its sizes in ${sizes}`)
          return { contents: `${src}\nexport const setLayout = (values: Partial<Record<keyof typeof ${sizes}, number>>) => { Object.assign(${sizes}, values) }\n`, loader: 'ts' }
        })
      }
      api.onLoad({ filter: /beautiful-mermaid\/src\/class\/layout\.ts$/ }, args => {
        const source = readFileSync(args.path, 'utf8')
        const constants = source.match(/export const CLS = \{[\s\S]*?\} as const/)
        if (!constants) throw new Error('Class SVG renderer no longer exports CLS')
        return { contents: constants[0], loader: 'ts' }
      })
    },
  }],
}))

writeFileSync('../hooks/vendor/mermaid-svg.d.ts', 'export declare function renderMermaidSVG(source: string, options?: { bg?: string; fg?: string; line?: string; accent?: string; muted?: string; surface?: string; border?: string; font?: string; padding?: number; transparent?: boolean }): string\n')

for (const name of bundledPackages) {
  const { license } = JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8'))
  if (license !== 'MIT') throw new Error(`${name} is ${license}, only MIT may be bundled`)
  console.log(`bundled ${name}: ${license}`)
}
