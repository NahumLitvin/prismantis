import type { Block, Inline } from './markdown'
import { inlineText } from './markdown'

export const MAC_TABLE_COPY = `
ObjC.import('AppKit')
var input = $.NSFileHandle.fileHandleWithStandardInput.readDataToEndOfFile
var payload = JSON.parse(ObjC.unwrap($.NSString.alloc.initWithDataEncoding(input, $.NSUTF8StringEncoding)))
var item = $.NSPasteboardItem.alloc.init
if (!item.setStringForType(payload.html, $.NSPasteboardTypeHTML) ||
    !item.setStringForType(payload.text, $.NSPasteboardTypeString)) throw new Error('Cannot encode table')
var pasteboard = $.NSPasteboard.generalPasteboard
if (!pasteboard || !pasteboard.writeObjects) throw new Error('macOS clipboard is unavailable to this session')
pasteboard.clearContents
if (!pasteboard.writeObjects($.NSArray.arrayWithObject(item))) throw new Error('Cannot write clipboard')
if (ObjC.unwrap(pasteboard.stringForType($.NSPasteboardTypeHTML)) !== payload.html ||
    ObjC.unwrap(pasteboard.stringForType($.NSPasteboardTypeString)) !== payload.text) throw new Error('Clipboard verification failed')
`

export const tableText = (table: Extract<Block, { kind: 'table' }>): string =>
  [table.header, ...table.rows].map(row => row.map(inlineText).join('\t')).join('\n')

const escapeHtml = (text: string): string => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const inlineHtml = (nodes: Inline[]): string => nodes.map(node => {
  switch (node.kind) {
    case 'strong': return `<strong>${inlineHtml(node.children)}</strong>`
    case 'emphasis': return `<em>${inlineHtml(node.children)}</em>`
    case 'strike': return `<del>${inlineHtml(node.children)}</del>`
    case 'code': return `<code>${escapeHtml(node.text)}</code>`
    case 'link': return /^(https?:|mailto:)/i.test(node.href)
      ? `<a href="${escapeHtml(node.href)}">${escapeHtml(node.text)}</a>`
      : escapeHtml(node.text)
    default: return escapeHtml(node.text)
  }
}).join('')

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
