import { build } from 'esbuild'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const scratch = mkdtempSync(join(tmpdir(), 'prismantis-mermaid-check-'))
const output = process.argv[2] ? resolve(process.argv[2]) : scratch
mkdirSync(output, { recursive: true })
const fixtures = {
  flow: 'flowchart LR\n A[Request] --> B{Cached?}\n B -->|Yes| C[Reply]\n B -->|No| D[Fetch]\n D --> C',
  state: 'stateDiagram-v2\n [*] --> Idle\n Idle --> Running: start\n Running --> Idle: stop\n Running --> [*]',
  sequence: 'sequenceDiagram\n participant Client\n participant Server\n Client->>Server: GET /items\n Server-->>Client: 200 OK',
  class: 'classDiagram\n Animal <|-- Dog\n Animal : +int age\n Animal : +eat()\n Dog : +bark()',
  er: 'erDiagram\n CUSTOMER ||--o{ ORDER : places\n CUSTOMER {\n int id PK\n string name\n }\n ORDER {\n int id PK\n int customer_id FK\n }',
  chart: 'xychart-beta\n title "Requests"\n x-axis [Jan, Feb, Mar]\n y-axis "Count" 0 --> 10\n bar [3, 7, 5]',
  nested: 'flowchart TD\n subgraph App\n A[Client] --> B[API]\n end\n B --> C[(Database)]',
  reversed: 'flowchart RL\n A[Start] --> B[Finish]',
}

try {
  const bundle = join(scratch, 'renderer.mjs')
  await build({ stdin: { contents: "export { diagramSvg, fitDiagram } from './hooks/mermaid-image'; export { PRESETS } from './hooks/presets'", resolveDir: root, loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', outfile: bundle, logLevel: 'silent' })
  const { diagramSvg, fitDiagram, PRESETS } = await import(pathToFileURL(bundle))
  for (const theme of ['catppuccin-mocha', 'github-light']) {
    for (const [name, source] of Object.entries(fixtures)) {
      const svg = diagramSvg(source, PRESETS[theme])
      if (!svg) throw new Error(`${name} produced no SVG`)
      const fitted = fitDiagram(svg, 100)
      if (!fitted) throw new Error(`${name} has no dimensions`)
      const file = join(output, `${theme}-${name}.png`)
      execFileSync(process.env.RSVG_CONVERT ?? 'rsvg-convert', ['--format=png', '--output', file], { input: fitted.svg, timeout: 5000 })
      const png = readFileSync(file)
      if (png.toString('hex', 0, 8) !== '89504e470d0a1a0a' || png.readUInt32BE(16) !== fitted.columns * 16 || png.readUInt32BE(20) !== fitted.rows * 32 || png.length > 2 * 1024 * 1024) throw new Error(`${name} has invalid PNG dimensions or size`)
      console.log(`ok ${theme} ${name}: ${fitted.columns} cols, ${fitted.rows} rows, ${png.length} bytes`)
    }
  }
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
