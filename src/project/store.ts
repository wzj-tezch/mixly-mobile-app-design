import { create } from 'zustand'
import type {
  AiProject,
  BlocksViewMode,
  ComponentNode,
  ComponentType,
  EditorTab,
  LeftPanel,
  ProjectAsset,
  ScreenData,
} from './types'
import { getMeta } from '@/components/registry'
import { createBuiltinProjectAssets, mergeBuiltinAssets, isBuiltinAssetId } from './builtinMedia'
import { saveProject, listProjectSummaries, loadProject, deleteProject as deleteStored } from './persist'
import { getAuthUser } from '@/auth/session'
import {
  deleteCloudProject,
  getCloudProject,
  listCloudProjects,
  putCloudProject,
  type CloudSummary,
} from '@/auth/cloudClient'
import { createTemplate, refreshCaseProjectIfStale, type TemplateKind } from './templates'
import { readEmbedFlags, resolveStarterProject, snapshotOf, withStarterSnapshot } from '@/app/embedMode'
import { renameInBlocksXml } from './renameSync'
import { namePrefix, projectHasGeneratedNames, sanitizeReadableNames, uniqueReadableName } from './componentNames'

function uid(prefix = 'c') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

let cloudPutTimer: ReturnType<typeof setTimeout> | null = null

function scheduleCloudPut() {
  if (!getAuthUser()) return
  if (cloudPutTimer) clearTimeout(cloudPutTimer)
  cloudPutTimer = setTimeout(() => {
    cloudPutTimer = null
    const p = useProjectStore.getState().project
    void putCloudProject(p)
      .then(() => listCloudProjects())
      .then((cloudList) => useProjectStore.setState({ cloudList }))
      .catch(() => {
        /* 自动同步失败不影响本机保存 */
      })
  }, 800)
}

function createComponent(type: ComponentType, name?: string): ComponentNode {
  const meta = getMeta(type)
  const base = name ?? `${type}1`
  return {
    id: uid(type.toLowerCase()),
    type,
    name: base,
    props: { ...meta.defaults },
    children: [],
    visible: meta.isVisible,
  }
}

function createScreen(name: string, isFirst = false): ScreenData {
  const screenId = uid('screen')
  return {
    id: screenId,
    name,
    props: {
      Title: name,
      BackgroundColor: '#f8f9fa',
      AlignVertical: 'top',
    },
    root: {
      id: uid('root'),
      type: 'VerticalArrangement',
      name: 'ScreenRoot',
      props: { Width: '填满父组件', Height: '填满父组件', BackgroundColor: 'transparent' },
      children: isFirst
        ? [
            createComponent('Label', 'Welcome'),
            createComponent('Button', 'Button1'),
          ]
        : [],
      visible: true,
    },
    nonVisible: [],
    blocksXml: '',
    scriptCode: '',
  }
}

function createEmptyProject(name = '我的项目'): AiProject {
  const screen = createScreen('Screen1', true)
  // tweak welcome
  if (screen.root.children[0]) {
    screen.root.children[0].props.Text = '欢迎使用 Mixly'
    screen.root.children[0].props.FontSize = 20
  }
  if (screen.root.children[1]) {
    screen.root.children[1].props.Text = '点我'
  }
  return {
    schemaVersion: 1,
    id: uid('proj'),
    name,
    screens: [screen],
    activeScreenId: screen.id,
    assets: createBuiltinProjectAssets(),
    updatedAt: Date.now(),
    advancedMode: false,
  }
}

function normalizeProject(p: AiProject): AiProject {
  return sanitizeReadableNames({
    ...p,
    advancedMode: Boolean(p.advancedMode),
    assets: mergeBuiltinAssets(p.assets?.length ? p.assets : createBuiltinProjectAssets()),
    screens: (p.screens ?? []).map((s) => ({
      ...s,
      blocksXml: s.blocksXml ?? '',
      scriptCode: typeof s.scriptCode === 'string' ? s.scriptCode : '',
    })),
  })
}

function findNode(root: ComponentNode, id: string): ComponentNode | null {
  if (root.id === id) return root
  for (const c of root.children) {
    const f = findNode(c, id)
    if (f) return f
  }
  return null
}

function findParent(root: ComponentNode, id: string): ComponentNode | null {
  for (const c of root.children) {
    if (c.id === id) return root
    const p = findParent(c, id)
    if (p) return p
  }
  return null
}

function removeNode(root: ComponentNode, id: string): boolean {
  const idx = root.children.findIndex((c) => c.id === id)
  if (idx >= 0) {
    root.children.splice(idx, 1)
    return true
  }
  for (const c of root.children) {
    if (removeNode(c, id)) return true
  }
  return false
}

function containsId(root: ComponentNode, id: string): boolean {
  if (root.id === id) return true
  return root.children.some((c) => containsId(c, id))
}

function uniqueName(existing: string[], type: ComponentType): string {
  return uniqueReadableName(existing, namePrefix(type))
}

function collectNames(screen: ScreenData): string[] {
  const names: string[] = []
  const walk = (n: ComponentNode) => {
    names.push(n.name)
    n.children.forEach(walk)
  }
  walk(screen.root)
  screen.nonVisible.forEach((n) => names.push(n.name))
  return names
}

type HistSnap = { project: AiProject; selectedId: string | null }

function pinAdvancedMode(snap: AiProject, live: AiProject): AiProject {
  return { ...snap, advancedMode: Boolean(live.advancedMode) }
}

function cloneNamed(node: ComponentNode, names: string[]): ComponentNode {
  const name = uniqueReadableName(names, namePrefix(node.type))
  names.push(name)
  return {
    id: uid(node.type.toLowerCase()),
    type: node.type,
    name,
    props: { ...node.props },
    children: node.children.map((c) => cloneNamed(c, names)),
    visible: node.visible,
  }
}

interface ProjectState {
  project: AiProject
  selectedId: string | null
  editorTab: EditorTab
  designerStage: 'design' | 'preview'
  leftPanel: LeftPanel
  blocksViewMode: BlocksViewMode
  projectList: { id: string; name: string; updatedAt: number; starterLabel?: string; sourceTemplate?: string }[]
  cloudList: CloudSummary[]
  previewKey: number
  /** Bumped when rename rewrites blocksXml so open Blockly workspace can reload. */
  blocksSyncKey: number
  canWorkspaceUndo: boolean
  canWorkspaceRedo: boolean
  workspaceUndo: (() => void) | null
  workspaceRedo: (() => void) | null

  init: () => Promise<void>
  setEditorTab: (t: EditorTab) => void
  setDesignerStage: (stage: 'design' | 'preview') => void
  toggleDesignerStage: () => void
  setLeftPanel: (p: LeftPanel) => void
  setBlocksViewMode: (m: BlocksViewMode) => void
  setProjectName: (name: string) => void
  select: (id: string | null) => void
  getActiveScreen: () => ScreenData
  addComponent: (type: ComponentType, parentId?: string | null) => void
  moveComponent: (id: string, targetId: string) => void
  deleteComponent: (id: string) => void
  updateProps: (id: string, props: Record<string, unknown>) => void
  renameComponent: (id: string, name: string) => void
  renameScreen: (id: string, name: string) => void
  deleteSelected: () => void
  setBlocksXml: (xml: string) => void
  setScreenScript: (code: string) => void
  setAdvancedMode: (on: boolean) => void
  addScreen: () => void
  switchScreen: (id: string) => void
  cycleScreen: (dir: -1 | 1) => void
  deleteScreen: (id: string) => void
  addAsset: (asset: Omit<ProjectAsset, 'id' | 'createdAt'>) => void
  removeAsset: (id: string) => void
  persist: () => Promise<void>
  saveToCloud: () => Promise<void>
  refreshCloudList: () => Promise<void>
  openCloudProject: (id: string) => Promise<void>
  removeCloudProject: (id: string) => Promise<void>
  setShareId: (shareId: string | undefined) => void
  newProject: (name?: string) => Promise<void>
  openProject: (id: string) => Promise<void>
  removeProject: (id: string) => Promise<void>
  loadTemplate: (kind: TemplateKind, options?: { withBlocks?: boolean }) => Promise<void>
  loadStarter: (id: string) => Promise<void>
  resetLesson: () => Promise<void>
  saveStudentCopy: () => Promise<void>
  bumpPreview: () => void
  replaceProject: (p: AiProject) => void
  setWorkspaceHistory: (h: {
    canUndo: boolean
    canRedo: boolean
    undo: (() => void) | null
    redo: (() => void) | null
  }) => void
  historyPast: HistSnap[]
  historyFuture: HistSnap[]
  canDesignerUndo: boolean
  canDesignerRedo: boolean
  clipboard: ComponentNode | null
  undo: () => void
  redo: () => void
  copySelected: () => void
  cutSelected: () => void
  pasteClipboard: () => void
}

export const useProjectStore = create<ProjectState>((set, get) => {
  const pushHistory = () => {
    const s = get()
    set({
      historyPast: [...s.historyPast, { project: structuredClone(s.project), selectedId: s.selectedId }].slice(-60),
      historyFuture: [],
      canDesignerUndo: true,
      canDesignerRedo: false,
    })
  }
  const clearHistory = () =>
    set({ historyPast: [], historyFuture: [], canDesignerUndo: false, canDesignerRedo: false })

  return {
  project: createEmptyProject(),
  selectedId: null,
  editorTab: 'designer',
  designerStage: 'design',
  leftPanel: 'palette',
  blocksViewMode: 'blocks',
  projectList: [],
  cloudList: [],
  previewKey: 0,
  blocksSyncKey: 0,
  canWorkspaceUndo: false,
  canWorkspaceRedo: false,
  workspaceUndo: null,
  workspaceRedo: null,
  historyPast: [],
  historyFuture: [],
  canDesignerUndo: false,
  canDesignerRedo: false,
  clipboard: null,

  init: async () => {
    const flags = readEmbedFlags()
    const list = await listProjectSummaries()
    if (flags.project) {
      const existing = list.find((p) => p.starterLabel === flags.project || p.sourceTemplate === flags.project)
      if (existing) {
        const p = await loadProject(existing.id)
        if (p) {
          clearHistory()
          set({ project: normalizeProject(p), projectList: list, selectedId: null })
          return
        }
      }
      const starter = resolveStarterProject(flags.project)
      if (starter) {
        const working = normalizeProject(
          withStarterSnapshot({
            ...starter,
            id: uid('proj'),
            starterLabel: flags.project,
            updatedAt: Date.now(),
          }),
        )
        await saveProject(working)
        clearHistory()
        set({ project: working, projectList: await listProjectSummaries(), selectedId: null })
        return
      }
    }
    if (list.length) {
      const last = list.sort((a, b) => b.updatedAt - a.updatedAt)[0]
      const p = await loadProject(last.id)
      if (p) {
        const hadUglyNames = projectHasGeneratedNames(p)
        const { project: refreshed, refreshed: didRefresh } = refreshCaseProjectIfStale(normalizeProject(p))
        if (didRefresh || hadUglyNames) await saveProject(refreshed)
        clearHistory()
        set({ project: refreshed, projectList: await listProjectSummaries(), selectedId: null })
        return
      }
    }
    const p = createEmptyProject()
    await saveProject(p)
    set({ project: p, projectList: await listProjectSummaries() })
  },

  setEditorTab: (t) => set({ editorTab: t }),
  setDesignerStage: (stage) => set({ designerStage: stage }),
  toggleDesignerStage: () =>
    set((s) => ({ designerStage: s.designerStage === 'design' ? 'preview' : 'design' })),
  setLeftPanel: (p) => set({ leftPanel: p }),
  setBlocksViewMode: (m) => set({ blocksViewMode: m }),
  setProjectName: (name) => {
    set((s) => ({ project: { ...s.project, name, updatedAt: Date.now() } }))
    void get().persist()
  },
  select: (id) => set({ selectedId: id }),
  getActiveScreen: () => {
    const { project } = get()
    return project.screens.find((s) => s.id === project.activeScreenId) ?? project.screens[0]
  },

  addComponent: (type, parentId) => {
    const meta = getMeta(type)
    pushHistory()
    set((s) => {
      const project = structuredClone(s.project)
      const screen = project.screens.find((x) => x.id === project.activeScreenId)!
      const names = collectNames(screen)
      const node = createComponent(type, uniqueName(names, type))
      if (!meta.isVisible) {
        screen.nonVisible.push(node)
      } else {
        let parent = screen.root
        if (parentId) {
          const found = findNode(screen.root, parentId)
          if (found) {
            const pm = getMeta(found.type)
            parent = pm.isContainer || found.type === 'VerticalArrangement' ? found : findParent(screen.root, found.id) ?? screen.root
          }
        } else if (s.selectedId) {
          const sel = findNode(screen.root, s.selectedId)
          if (sel) {
            const pm = getMeta(sel.type)
            parent = pm.isContainer ? sel : findParent(screen.root, sel.id) ?? screen.root
          }
        }
        parent.children.push(node)
      }
      project.updatedAt = Date.now()
      return { project, selectedId: node.id, previewKey: s.previewKey + 1 }
    })
    void get().persist()
  },

  moveComponent: (id, targetId) => {
    if (!id || id === targetId) return
    pushHistory()
    set((s) => {
      const project = structuredClone(s.project)
      const screen = project.screens.find((x) => x.id === project.activeScreenId)!
      if (id === screen.root.id) return s
      const moving = findNode(screen.root, id)
      if (!moving) return s
      if (containsId(moving, targetId)) return s
      const target = findNode(screen.root, targetId)
      if (!target) return s
      if (!removeNode(screen.root, id)) return s
      const tm = getMeta(target.type)
      if (tm.isContainer || target.id === screen.root.id) {
        target.children.push(moving)
      } else {
        const parent = findParent(screen.root, target.id) ?? screen.root
        const idx = parent.children.findIndex((c) => c.id === target.id)
        parent.children.splice(idx < 0 ? parent.children.length : idx + 1, 0, moving)
      }
      project.updatedAt = Date.now()
      return { project, selectedId: id, previewKey: s.previewKey + 1 }
    })
    void get().persist()
  },

  deleteComponent: (id) => {
    if (!id) return
    pushHistory()
    set((s) => {
      const project = structuredClone(s.project)
      const screen = project.screens.find((x) => x.id === project.activeScreenId)!
      if (id === screen.root.id) return s
      if (!removeNode(screen.root, id)) {
        screen.nonVisible = screen.nonVisible.filter((n) => n.id !== id)
      }
      project.updatedAt = Date.now()
      return { project, selectedId: s.selectedId === id ? null : s.selectedId, previewKey: s.previewKey + 1 }
    })
    void get().persist()
  },

  updateProps: (id, props) => {
    pushHistory()
    set((s) => {
      const project = structuredClone(s.project)
      const screen = project.screens.find((x) => x.id === project.activeScreenId)!
      if (id === screen.id || id === 'screen') {
        screen.props = { ...screen.props, ...props }
      } else {
        const node = findNode(screen.root, id) ?? screen.nonVisible.find((n) => n.id === id)
        if (node) node.props = { ...node.props, ...props }
      }
      project.updatedAt = Date.now()
      return { project, previewKey: s.previewKey + 1 }
    })
    void get().persist()
  },

  renameComponent: (id, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    pushHistory()
    set((s) => {
      const project = structuredClone(normalizeProject(s.project))
      const screen = project.screens.find((x) => x.id === project.activeScreenId)!
      const node = findNode(screen.root, id) ?? screen.nonVisible.find((n) => n.id === id)
      if (!node || node.name === trimmed) return s
      const oldName = node.name
      node.name = trimmed
      screen.blocksXml = renameInBlocksXml(screen.blocksXml, oldName, trimmed)
      project.updatedAt = Date.now()
      return { project, previewKey: s.previewKey + 1, blocksSyncKey: s.blocksSyncKey + 1 }
    })
    void get().persist()
  },

  renameScreen: (id, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    pushHistory()
    set((s) => {
      const project = structuredClone(normalizeProject(s.project))
      const screen = project.screens.find((x) => x.id === id)
      if (!screen || screen.name === trimmed) return s
      const oldName = screen.name
      screen.name = trimmed
      if (!screen.props.Title || screen.props.Title === oldName) screen.props.Title = trimmed
      for (const sc of project.screens) {
        sc.blocksXml = renameInBlocksXml(sc.blocksXml, oldName, trimmed)
      }
      project.updatedAt = Date.now()
      return { project, previewKey: s.previewKey + 1, blocksSyncKey: s.blocksSyncKey + 1 }
    })
    void get().persist()
  },

  addAsset: (asset) => {
    pushHistory()
    set((s) => {
      const project = structuredClone(normalizeProject(s.project))
      project.assets.push({ ...asset, id: uid('asset'), createdAt: Date.now() })
      project.updatedAt = Date.now()
      return { project }
    })
    void get().persist()
  },

  removeAsset: (id) => {
    if (isBuiltinAssetId(id)) return
    pushHistory()
    set((s) => {
      const project = structuredClone(normalizeProject(s.project))
      project.assets = project.assets.filter((a) => a.id !== id)
      project.updatedAt = Date.now()
      return { project, previewKey: s.previewKey + 1 }
    })
    void get().persist()
  },

  deleteSelected: () => {
    const { selectedId } = get()
    if (!selectedId) return
    pushHistory()
    set((s) => {
      const project = structuredClone(s.project)
      const screen = project.screens.find((x) => x.id === project.activeScreenId)!
      if (!removeNode(screen.root, selectedId)) {
        screen.nonVisible = screen.nonVisible.filter((n) => n.id !== selectedId)
      }
      project.updatedAt = Date.now()
      return { project, selectedId: null, previewKey: s.previewKey + 1 }
    })
    void get().persist()
  },

  setBlocksXml: (xml) => {
    set((s) => {
      const project = structuredClone(s.project)
      const screen = project.screens.find((x) => x.id === project.activeScreenId)!
      screen.blocksXml = xml
      project.updatedAt = Date.now()
      return { project, previewKey: s.previewKey + 1 }
    })
    void get().persist()
  },

  setScreenScript: (code) => {
    set((s) => {
      const project = structuredClone(s.project)
      const screen = project.screens.find((x) => x.id === project.activeScreenId)!
      screen.scriptCode = code
      project.updatedAt = Date.now()
      return { project, previewKey: s.previewKey + 1 }
    })
    void get().persist()
  },

  setAdvancedMode: (on) => {
    if (Boolean(get().project.advancedMode) === on) return
    set((s) => ({
      project: { ...s.project, advancedMode: on, updatedAt: Date.now() },
      previewKey: s.previewKey + 1,
    }))
    void get().persist()
  },

  addScreen: () => {
    pushHistory()
    set((s) => {
      const project = structuredClone(s.project)
      const screen = createScreen(`Screen${project.screens.length + 1}`)
      project.screens.push(screen)
      project.activeScreenId = screen.id
      project.updatedAt = Date.now()
      return { project, selectedId: null, previewKey: s.previewKey + 1 }
    })
    void get().persist()
  },

  switchScreen: (id) => {
    if (id === get().project.activeScreenId) return
    pushHistory()
    set((s) => ({
      project: { ...s.project, activeScreenId: id, updatedAt: Date.now() },
      selectedId: null,
      previewKey: s.previewKey + 1,
    }))
    void get().persist()
  },

  cycleScreen: (dir) => {
    const { project } = get()
    const screens = project.screens
    if (screens.length < 2) return
    const i = Math.max(0, screens.findIndex((s) => s.id === project.activeScreenId))
    const next = screens[(i + dir + screens.length) % screens.length]
    get().switchScreen(next.id)
  },

  deleteScreen: (id) => {
    if (get().project.screens.length <= 1) return
    pushHistory()
    set((s) => {
      if (s.project.screens.length <= 1) return s
      const project = structuredClone(s.project)
      project.screens = project.screens.filter((x) => x.id !== id)
      if (project.activeScreenId === id) project.activeScreenId = project.screens[0].id
      project.updatedAt = Date.now()
      return { project, selectedId: null, previewKey: s.previewKey + 1 }
    })
    void get().persist()
  },

  persist: async () => {
    const p = get().project
    await saveProject(p)
    set({ projectList: await listProjectSummaries() })
    scheduleCloudPut()
  },

  saveToCloud: async () => {
    if (!getAuthUser()) throw new Error('请先登录')
    const p = get().project
    await saveProject(p)
    const saved = await putCloudProject(p)
    set({
      project: { ...get().project, shareId: saved.shareId || get().project.shareId, updatedAt: saved.updatedAt },
      projectList: await listProjectSummaries(),
      cloudList: await listCloudProjects(),
    })
  },

  refreshCloudList: async () => {
    if (!getAuthUser()) {
      set({ cloudList: [] })
      return
    }
    try {
      set({ cloudList: await listCloudProjects() })
    } catch {
      set({ cloudList: [] })
    }
  },

  openCloudProject: async (id) => {
    const p = await getCloudProject(id)
    const next = normalizeProject(p)
    await saveProject(next)
    clearHistory()
    set({
      project: next,
      selectedId: null,
      projectList: await listProjectSummaries(),
      previewKey: get().previewKey + 1,
      blocksSyncKey: get().blocksSyncKey + 1,
    })
  },

  removeCloudProject: async (id) => {
    await deleteCloudProject(id)
    const cloudList = await listCloudProjects()
    set({ cloudList })
    if (get().project.id === id) {
      set({ project: { ...get().project, shareId: undefined } })
    }
  },

  setShareId: (shareId) => {
    set((s) => ({ project: { ...s.project, shareId, updatedAt: Date.now() } }))
    void get().persist()
  },

  newProject: async (name) => {
    const p = createEmptyProject(name ?? '新项目')
    await saveProject(p)
    clearHistory()
    set({ project: p, selectedId: null, projectList: await listProjectSummaries(), previewKey: get().previewKey + 1 })
  },

  openProject: async (id) => {
    const p = await loadProject(id)
    if (p) {
      const hadUglyNames = projectHasGeneratedNames(p)
      const { project: refreshed, refreshed: didRefresh } = refreshCaseProjectIfStale(normalizeProject(p))
      if (didRefresh || hadUglyNames) await saveProject(refreshed)
      clearHistory()
      set({ project: refreshed, selectedId: null, previewKey: get().previewKey + 1, blocksSyncKey: get().blocksSyncKey + 1 })
    }
  },

  removeProject: async (id) => {
    await deleteStored(id)
    const list = await listProjectSummaries()
    if (get().project.id === id) {
      if (list.length) {
        const p = await loadProject(list[0].id)
        if (p) set({ project: normalizeProject(p), projectList: list, selectedId: null })
        else {
          const p2 = createEmptyProject()
          await saveProject(p2)
          set({ project: p2, projectList: await listProjectSummaries(), selectedId: null })
        }
      } else {
        const p2 = createEmptyProject()
        await saveProject(p2)
        set({ project: p2, projectList: await listProjectSummaries(), selectedId: null })
      }
    } else {
      set({ projectList: list })
    }
  },

  loadTemplate: async (kind, options) => {
    const p = normalizeProject(createTemplate(kind, options))
    await saveProject(p)
    clearHistory()
    set({
      project: p,
      selectedId: null,
      projectList: await listProjectSummaries(),
      previewKey: get().previewKey + 1,
      editorTab: 'designer',
      blocksSyncKey: get().blocksSyncKey + 1,
    })
  },

  loadStarter: async (id) => {
    const starter = resolveStarterProject(id)
    if (!starter) return
    const p = normalizeProject(
      withStarterSnapshot({
        ...starter,
        id: uid('proj'),
        starterLabel: id,
        updatedAt: Date.now(),
      }),
    )
    await saveProject(p)
    clearHistory()
    set({
      project: p,
      selectedId: null,
      projectList: await listProjectSummaries(),
      previewKey: get().previewKey + 1,
      editorTab: 'designer',
      blocksSyncKey: get().blocksSyncKey + 1,
    })
  },

  resetLesson: async () => {
    const keep = get().project
    const snap = keep.starterSnapshot
    if (snap) {
      const p = normalizeProject(
        withStarterSnapshot(
          {
            ...structuredClone(snap),
            id: keep.id,
            name: keep.name,
            starterLabel: keep.starterLabel,
            updatedAt: Date.now(),
          },
          snap,
        ),
      )
      await saveProject(p)
      clearHistory()
      set({
        project: p,
        selectedId: null,
        previewKey: get().previewKey + 1,
        blocksSyncKey: get().blocksSyncKey + 1,
      })
      return
    }
    const kind = keep.sourceTemplate || keep.starterLabel
    if (!kind) return
    const starter = resolveStarterProject(kind)
    if (!starter) return
    const p = normalizeProject(
      withStarterSnapshot({
        ...starter,
        id: keep.id,
        name: keep.name,
        starterLabel: keep.starterLabel,
        updatedAt: Date.now(),
      }),
    )
    await saveProject(p)
    clearHistory()
    set({
      project: p,
      selectedId: null,
      previewKey: get().previewKey + 1,
      blocksSyncKey: get().blocksSyncKey + 1,
    })
  },

  saveStudentCopy: async () => {
    const cur = get().project
    const p = normalizeProject({
      ...structuredClone(cur),
      id: uid('proj'),
      name: cur.name.includes('（学生）') ? cur.name : `${cur.name}（学生）`,
      starterLabel: cur.starterLabel,
      starterSnapshot: cur.starterSnapshot ?? snapshotOf(cur),
      updatedAt: Date.now(),
    })
    await saveProject(p)
    clearHistory()
    set({
      project: p,
      selectedId: null,
      projectList: await listProjectSummaries(),
      previewKey: get().previewKey + 1,
      blocksSyncKey: get().blocksSyncKey + 1,
    })
  },

  bumpPreview: () => set((s) => ({ previewKey: s.previewKey + 1 })),
  replaceProject: (p) => {
    const incoming = normalizeProject(p)
    const next = incoming.starterSnapshot ? incoming : withStarterSnapshot(incoming)
    clearHistory()
    set({
      project: next,
      selectedId: null,
      previewKey: get().previewKey + 1,
      blocksSyncKey: get().blocksSyncKey + 1,
    })
    void get().persist()
  },
  undo: () => {
    const s = get()
    if (s.editorTab === 'blocks' && s.canWorkspaceUndo && s.workspaceUndo) {
      s.workspaceUndo()
      return
    }
    if (!s.historyPast.length) return
    const prev = s.historyPast[s.historyPast.length - 1]
    const future = [...s.historyFuture, { project: structuredClone(s.project), selectedId: s.selectedId }].slice(-60)
    const past = s.historyPast.slice(0, -1)
    set({
      project: pinAdvancedMode(prev.project, s.project),
      selectedId: prev.selectedId,
      historyPast: past,
      historyFuture: future,
      canDesignerUndo: past.length > 0,
      canDesignerRedo: true,
      previewKey: s.previewKey + 1,
      blocksSyncKey: s.blocksSyncKey + 1,
    })
    void get().persist()
  },
  redo: () => {
    const s = get()
    if (s.editorTab === 'blocks' && s.canWorkspaceRedo && s.workspaceRedo) {
      s.workspaceRedo()
      return
    }
    if (!s.historyFuture.length) return
    const next = s.historyFuture[s.historyFuture.length - 1]
    const past = [...s.historyPast, { project: structuredClone(s.project), selectedId: s.selectedId }].slice(-60)
    const future = s.historyFuture.slice(0, -1)
    set({
      project: pinAdvancedMode(next.project, s.project),
      selectedId: next.selectedId,
      historyPast: past,
      historyFuture: future,
      canDesignerUndo: true,
      canDesignerRedo: future.length > 0,
      previewKey: s.previewKey + 1,
      blocksSyncKey: s.blocksSyncKey + 1,
    })
    void get().persist()
  },
  copySelected: () => {
    const s = get()
    if (!s.selectedId) return
    const screen = s.project.screens.find((x) => x.id === s.project.activeScreenId)!
    if (s.selectedId === screen.root.id) return
    const node = findNode(screen.root, s.selectedId) ?? screen.nonVisible.find((n) => n.id === s.selectedId)
    if (node) set({ clipboard: structuredClone(node) })
  },
  cutSelected: () => {
    get().copySelected()
    if (get().clipboard) get().deleteSelected()
  },
  pasteClipboard: () => {
    const s = get()
    if (!s.clipboard) return
    pushHistory()
    set((cur) => {
      const project = structuredClone(cur.project)
      const screen = project.screens.find((x) => x.id === project.activeScreenId)!
      const names = collectNames(screen)
      const node = cloneNamed(structuredClone(cur.clipboard)!, names)
      const meta = getMeta(node.type)
      if (!meta.isVisible) {
        screen.nonVisible.push(node)
      } else {
        let parent = screen.root
        if (cur.selectedId) {
          const sel = findNode(screen.root, cur.selectedId)
          if (sel) {
            const pm = getMeta(sel.type)
            parent = pm.isContainer ? sel : findParent(screen.root, sel.id) ?? screen.root
          }
        }
        parent.children.push(node)
      }
      project.updatedAt = Date.now()
      return { project, selectedId: node.id, previewKey: cur.previewKey + 1 }
    })
    void get().persist()
  },
  setWorkspaceHistory: (h) =>
    set({
      canWorkspaceUndo: h.canUndo,
      canWorkspaceRedo: h.canRedo,
      workspaceUndo: h.undo,
      workspaceRedo: h.redo,
    }),
  }
})

export { createEmptyProject, findNode, collectNames }
