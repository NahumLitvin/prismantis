import { promptKey } from './clock'
import { CONTROL } from './markdown'

export type AttachedItem = { type: 'image' | 'audio' | 'document'; filename?: string }
export type Attached = { text: string; at: number; items: readonly AttachedItem[] }

const KIND: Record<AttachedItem['type'], string> = { image: 'Image', audio: 'Audio', document: 'Document' }

const NAME_ROOM = 80

export const attachmentLabel = (item: AttachedItem): string => {
  const kind = KIND[item.type] ?? 'Attachment'
  const name = (item.filename ?? '').replace(CONTROL, '').replace(/\s+/g, ' ').trim().slice(0, NAME_ROOM)
  return name === '' ? `[${kind}]` : `[${kind} ${name}]`
}

export const attachmentsOf = (list: readonly Attached[], text: string, drawnAt: number): readonly AttachedItem[] => {
  const key = promptKey(text)
  return list.findLast(one => one.text === key && one.at <= drawnAt)?.items ?? []
}

export const attachmentLabels = (list: readonly Attached[], text: string, drawnAt: number): string[] =>
  attachmentsOf(list, text, drawnAt).map(attachmentLabel)

export const attachedItems = (items: readonly { type?: string; filename?: string }[]): AttachedItem[] =>
  items.flatMap(item => (item.type === 'image' || item.type === 'audio' || item.type === 'document' ? [{ type: item.type, ...(item.filename ? { filename: item.filename } : {}) }] : []))
