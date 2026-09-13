import type { AiProject, ComponentNode } from '@/project/types'
import { createTemplate, type TemplateKind } from '@/project/templates'

export type EmbedFlags = {
  embed: boolean
  project: string
}

export function readEmbedFlags(search = typeof window === 'undefined' ? '' : window.location.search): EmbedFlags {
  const q = new URLSearchParams(search)
  return {
    embed: q.get('embed') === '1',
    project: String(q.get('project') || '').trim(),
  }
}

export function resolveStarterProject(id: string): AiProject | null {
  const key = id.trim()
  if (!key) return null
  try {
    return createTemplate(key as TemplateKind)
  } catch {
    return null
  }
}

export function snapshotOf(project: AiProject): Omit<AiProject, 'starterSnapshot'> {
  const { starterSnapshot: _drop, ...rest } = project
  return structuredClone(rest)
}

export function withStarterSnapshot(project: AiProject, snap?: Omit<AiProject, 'starterSnapshot'>): AiProject {
  return {
    ...project,
    starterSnapshot: snap ?? snapshotOf(project),
  }
}

function walk(node: ComponentNode, names: string[], types: string[]) {
  names.push(node.name)
  types.push(node.type)
  for (const child of node.children) walk(child, names, types)
}

export function collectBlockTypes(project: AiProject): string[] {
  const types = new Set<string>()
  for (const screen of project.screens) {
    const xml = screen.blocksXml || ''
    for (const m of xml.matchAll(/\btype="([^"]+)"/g)) types.add(m[1])
  }
  return [...types].sort()
}

export function inspectProject(project: AiProject, previewOpened: boolean) {
  const screens = project.screens.map((s) => s.name)
  const components: string[] = []
  const componentTypes: string[] = []
  for (const screen of project.screens) {
    walk(screen.root, components, componentTypes)
    for (const nv of screen.nonVisible) walk(nv, components, componentTypes)
  }
  return {
    type: 'go3-inspect-result' as const,
    previewOpened,
    screens,
    components,
    componentTypes: [...new Set(componentTypes)].sort(),
    blockTypes: collectBlockTypes(project),
    project,
  }
}

export function exportProjectJson(project: AiProject) {
  return JSON.stringify(project, null, 2)
}
