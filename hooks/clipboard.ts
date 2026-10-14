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

export const LINUX_TABLE_COPY = `
var table = JSON.parse(str(arguments[1]))
copy('text/html', table.html, 'text/plain', table.text)
if (str(clipboard('text/html')) !== table.html ||
    str(clipboard('text/plain')) !== table.text) throw new Error('Clipboard verification failed')
`

export const WIN_TABLE_COPY = `
$ErrorActionPreference = 'Stop'
try {
  Add-Type -AssemblyName System.Windows.Forms
  $payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
  $utf8 = New-Object Text.UTF8Encoding($false)
  $doc = [string]$payload.html
  $crlf = [string][char]13 + [string][char]10
  $template = 'Version:1.0' + $crlf + 'StartHTML:{0:D10}' + $crlf + 'EndHTML:{1:D10}' + $crlf + 'StartFragment:{2:D10}' + $crlf + 'EndFragment:{3:D10}' + $crlf
  $headerLen = $utf8.GetByteCount(($template -f 0, 0, 0, 0))
  $startMark = '<!--StartFragment-->'
  $endMark = '<!--EndFragment-->'
  $startAt = $doc.IndexOf($startMark)
  $endAt = $doc.IndexOf($endMark)
  if ($startAt -lt 0 -or $endAt -lt 0) { throw 'Table HTML has no fragment markers' }
  $startFragment = $headerLen + $utf8.GetByteCount($doc.Substring(0, $startAt + $startMark.Length))
  $endFragment = $headerLen + $utf8.GetByteCount($doc.Substring(0, $endAt))
  $endHtml = $headerLen + $utf8.GetByteCount($doc)
  $cf = ($template -f $headerLen, $endHtml, $startFragment, $endFragment) + $doc
  $data = New-Object System.Windows.Forms.DataObject
  $data.SetData('HTML Format', (New-Object IO.MemoryStream(, $utf8.GetBytes($cf))))
  $data.SetData([System.Windows.Forms.DataFormats]::UnicodeText, [string]$payload.text)
  [System.Windows.Forms.Clipboard]::SetDataObject($data, $true)
} catch {
  [Console]::Error.WriteLine($_.Exception.Message)
  exit 1
}
`

export type ClipboardBackend = 'macos' | 'linux' | 'windows'

const ascii = (json: string): string =>
  Array.from({ length: json.length }, (_, i) => {
    const unit = json.charCodeAt(i)
    return unit > 0x7e ? `\\u${unit.toString(16).padStart(4, '0')}` : json[i]
  }).join('')

export const clipboardCommand = (backend: ClipboardBackend, html: string, text: string) => backend === 'windows'
  ? {
    stdin: ascii(JSON.stringify({ html, text: text.replace(/\r?\n/g, '\r\n') })),
    argv: ['powershell.exe', '-NoProfile', '-NonInteractive', '-STA', '-ExecutionPolicy', 'Bypass', '-Command', WIN_TABLE_COPY],
    failure: 'Windows clipboard helper failed',
  }
  : {
    stdin: JSON.stringify({ html, text }),
    ...backend === 'macos'
      ? { argv: ['/usr/bin/osascript', '-l', 'JavaScript', '-e', MAC_TABLE_COPY], failure: 'macOS clipboard helper failed' }
      : { argv: ['copyq', 'eval', LINUX_TABLE_COPY, '-'], failure: 'CopyQ failed; install and start CopyQ in the graphical session' },
  }
