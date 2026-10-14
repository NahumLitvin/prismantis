import type { Block, Inline } from './markdown'
import { displayText, isWebLink } from './markdown'

const tsvCell = (cell: Inline[]): string => {
  const text = displayText(cell)
  return /[\t\r\n"]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const tableText = (table: Extract<Block, { kind: 'table' }>): string =>
  [table.header, ...table.rows].map(row => row.map(tsvCell).join('\t')).join('\n')

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, c => ENTITIES[c]!)

const inlineHtml = (nodes: Inline[]): string => nodes.map(node => {
  switch (node.kind) {
    case 'strong': return `<strong>${inlineHtml(node.children)}</strong>`
    case 'emphasis': return `<em>${inlineHtml(node.children)}</em>`
    case 'strike': return `<del>${inlineHtml(node.children)}</del>`
    case 'code': return `<code style="white-space: pre-wrap">${escapeHtml(node.text)}</code>`
    case 'math': return `<em>${escapeHtml(node.text)}</em>`
    case 'link': return isWebLink(node.href)
      ? `<a href="${escapeHtml(node.href)}">${escapeHtml(node.text)}</a>`
      : escapeHtml(node.text)
    default: return escapeHtml(node.text)
  }
}).join('')

const EXCEL_HEAD = [
  '<html xmlns:v="urn:schemas-microsoft-com:vml"',
  'xmlns:o="urn:schemas-microsoft-com:office:office"',
  'xmlns:x="urn:schemas-microsoft-com:office:excel"',
  'xmlns="http://www.w3.org/TR/REC-html40">',
  '<head>',
  '<meta http-equiv=Content-Type content="text/html; charset=utf-8">',
  '<meta name=ProgId content=Excel.Sheet>',
  '<meta name=Generator content="Microsoft Excel 15">',
  '<style>',
  '<!--table',
  '\t{mso-displayed-decimal-separator:"\\.";',
  '\tmso-displayed-thousand-separator:"\\,";}',
  'td',
  '\t{padding-top:1px;',
  '\tpadding-right:1px;',
  '\tpadding-left:1px;',
  '\tmso-ignore:padding;',
  '\tcolor:black;',
  '\tfont-size:11.0pt;',
  '\tfont-weight:400;',
  '\tfont-style:normal;',
  '\ttext-decoration:none;',
  '\tfont-family:Calibri, sans-serif;',
  '\tmso-number-format:General;',
  '\ttext-align:general;',
  '\tvertical-align:bottom;',
  '\tborder:none;',
  '\twhite-space:nowrap;}',
  '.xl65',
  '\t{font-weight:700;',
  '\ttext-align:center;',
  '\tvertical-align:middle;',
  '\twhite-space:normal;}',
  '.xl66',
  '\t{vertical-align:middle;',
  '\twhite-space:normal;}',
  '-->',
  '</style>',
  '</head>',
  '<body link=blue vlink=purple>',
  "<table border=0 cellpadding=0 cellspacing=0 style='border-collapse:collapse'>",
  '<!--StartFragment-->',
]

export const tableExcelHtml = (table: Extract<Block, { kind: 'table' }>): string => {
  const row = (cells: Inline[][], cls: string) => [
    ' <tr>',
    ...cells.map(cell => `  <td class=${cls}>${inlineHtml(cell)}</td>`),
    ' </tr>',
  ]
  return [
    ...EXCEL_HEAD,
    ...row(table.header, 'xl65'),
    ...table.rows.flatMap(cells => row(cells, 'xl66')),
    '<!--EndFragment-->',
    '</table>',
    '</body></html>',
  ].join('\n')
}

export const tableHtml = (table: Extract<Block, { kind: 'table' }>): string => {
  const row = (cells: Inline[][], tag: 'th' | 'td') => `    <tr>${cells.map((cell, i) =>
    `<${tag} style="text-align: ${table.align[i] ?? 'left'}">${inlineHtml(cell)}</${tag}>`,
  ).join('')}</tr>`
  return [
    '<table>',
    '  <thead>',
    row(table.header, 'th'),
    '  </thead>',
    '  <tbody>',
    ...table.rows.map(cells => row(cells, 'td')),
    '  </tbody>',
    '</table>',
  ].join('\n')
}
