import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { AiProject } from '@/project/types'
import { AI_WELCOME } from './prompts'

export type ChatRole = 'user' | 'assistant'

export interface ChatItem {
  id: number
  role: ChatRole
  text: string
  project?: AiProject
  specError?: string
  applyWarnings?: string[]
  applied?: boolean
}

const GUEST_KEY = 'ai2-node-ai-guest-id'
const LS_PREFIX = 'ai2-node-ai-thread-v1:'
const MAX_ITEMS = 80

interface ChatDB extends DBSchema {
  threads: {
    key: string
    value: { ownerId: string; items: ChatItem[]; updatedAt: number }
  }
}

let dbPromise: Promise<IDBPDatabase<ChatDB>> | null = null
let seq = 1

function getGuestId() {
  try {
    let id = localStorage.getItem(GUEST_KEY)
    if (!id) {
      id = `g_${Math.random().toString(36).slice(2, 12)}`
      localStorage.setItem(GUEST_KEY, id)
    }
    return id
  } catch {
    return 'g_local'
  }
}

export function chatOwnerKey(userId?: string | null) {
  if (userId) return `user:${userId}`
  return `guest:${getGuestId()}`
}

export function defaultChatThread(): ChatItem[] {
  return [{ id: 1, role: 'assistant', text: AI_WELCOME }]
}

export function nextChatId() {
  seq += 1
  return seq
}

export function syncChatSeq(items: ChatItem[]) {
  for (const it of items) {
    if (typeof it.id === 'number' && it.id >= seq) seq = it.id
  }
}

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<ChatDB>('ai2-node-ai-chat', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('threads')) {
          db.createObjectStore('threads', { keyPath: 'ownerId' })
        }
      },
    })
  }
  return dbPromise
}

function readLocal(ownerId: string): ChatItem[] | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + ownerId)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { items?: ChatItem[] }
    return Array.isArray(parsed.items) ? parsed.items : null
  } catch {
    return null
  }
}

function writeLocal(ownerId: string, items: ChatItem[]) {
  try {
    localStorage.setItem(LS_PREFIX + ownerId, JSON.stringify({ items }))
  } catch {
    /* quota */
  }
}

export async function loadChatThread(ownerId: string): Promise<ChatItem[]> {
  try {
    const row = await (await getDb()).get('threads', ownerId)
    if (row?.items?.length) {
      syncChatSeq(row.items)
      return row.items
    }
  } catch {
    /* fall through */
  }
  const local = readLocal(ownerId)
  if (local?.length) {
    syncChatSeq(local)
    return local
  }
  const fresh = defaultChatThread()
  syncChatSeq(fresh)
  return fresh
}

export async function saveChatThread(ownerId: string, items: ChatItem[]) {
  const trimmed = items.slice(-MAX_ITEMS)
  writeLocal(ownerId, trimmed)
  try {
    await (await getDb()).put('threads', { ownerId, items: trimmed, updatedAt: Date.now() })
  } catch {
    /* localStorage already written */
  }
}

export async function clearChatThread(ownerId: string) {
  const items = defaultChatThread()
  syncChatSeq(items)
  await saveChatThread(ownerId, items)
  return items
}
