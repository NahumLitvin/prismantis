import type { On } from 'claude-code'
import { mock } from 'claude-code/testing'

export const clipboardEnv = (on: On, platform: 'macos' | 'other', environment: Record<string, string> = {}) => {
  mock.env(on, environment)
  on('fs.stat', (_, e, next) => !e.path.replace(/\\/g, '/').endsWith('/usr/bin/osascript')
    ? next(e)
    : platform === 'macos'
      ? { value: { kind: 'file' as const, size: 0, mtimeMs: 0, isLink: false } }
      : { deny: 'Not macOS' })
}
