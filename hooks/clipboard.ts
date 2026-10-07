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

export const clipboardCommand = (backend: 'macos' | 'wayland' | 'x11', html: string, text: string) => {
  if (backend === 'macos') return {
    argv: ['/usr/bin/osascript', '-l', 'JavaScript', '-e', MAC_TABLE_COPY],
    stdin: JSON.stringify({ html, text }),
    failure: 'macOS clipboard helper failed',
  }
  const command = backend === 'wayland'
    ? ['wl-copy', '--type', 'text/html']
    : ['xclip', '-selection', 'clipboard', '-target', 'text/html', '-in', '-silent']
  return {
    argv: ['/bin/sh', '-c', 'exec "$@" >/dev/null 2>&1', 'prismantis-clipboard', ...command],
    stdin: html,
    failure: backend === 'wayland'
      ? 'wl-copy failed; check wl-clipboard is installed and Wayland is available'
      : 'xclip failed; check xclip is installed and X11 is available',
  }
}
