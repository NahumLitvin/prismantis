import type { On } from 'claude-code'

export const claudeAt = (on: On, base: string) => on('session.version', () => ({ value: { version: base, base } }))

export const linksHttp = (mounting: Promise<{ unmount: () => Promise<void> }>): Promise<boolean> =>
  mounting.then(async ui => (await ui.unmount(), true), () => false)

export const withMono = <T>(mounting: Promise<T>): Promise<T | undefined> =>
  mounting.catch(error => {
    if (/Text prop "mono" is not allowed/.test(String(error))) return undefined
    throw error
  })
