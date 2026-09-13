import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { AiProject } from './types'

interface Ai2DB extends DBSchema {
  projects: {
    key: string
    value: AiProject
    indexes: { 'by-updated': number }
  }
}

let dbPromise: Promise<IDBPDatabase<Ai2DB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<Ai2DB>('ai2-node', 1, {
      upgrade(db) {
        const store = db.createObjectStore('projects', { keyPath: 'id' })
        store.createIndex('by-updated', 'updatedAt')
      },
    })
  }
  return dbPromise
}

const LS_KEY = 'ai2-node-current'

export async function saveProject(project: AiProject) {
  project.updatedAt = Date.now()
  const db = await getDb()
  await db.put('projects', project)
  localStorage.setItem(LS_KEY, project.id)
}

export async function loadProject(id: string): Promise<AiProject | null> {
  const db = await getDb()
  return (await db.get('projects', id)) ?? null
}

export async function deleteProject(id: string) {
  const db = await getDb()
  await db.delete('projects', id)
}

export async function listProjectSummaries() {
  const db = await getDb()
  const all = await db.getAll('projects')
  return all
    .map((p) => ({
      id: p.id,
      name: p.name,
      updatedAt: p.updatedAt,
      starterLabel: p.starterLabel,
      sourceTemplate: p.sourceTemplate,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function clearLocalAppData() {
  const prefixes = ['tinydb:', 'notes:', 'webdb:']
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && prefixes.some((p) => k.startsWith(p))) keys.push(k)
  }
  keys.forEach((k) => localStorage.removeItem(k))
}

export async function tinydbStore(ns: string, tag: string, value: unknown) {
  const key = `tinydb:${ns}:${tag}`
  localStorage.setItem(key, JSON.stringify(value))
}

export async function tinydbGet(ns: string, tag: string, fallback: unknown = '') {
  const key = `tinydb:${ns}:${tag}`
  const raw = localStorage.getItem(key)
  if (raw == null) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export async function tinydbClearTag(ns: string, tag: string) {
  localStorage.removeItem(`tinydb:${ns}:${tag}`)
}

export async function tinydbClearAll(ns: string) {
  const prefix = `tinydb:${ns}:`
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(prefix)) keys.push(k)
  }
  keys.forEach((k) => localStorage.removeItem(k))
}
