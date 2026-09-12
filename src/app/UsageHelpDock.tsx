import { useEffect, useMemo, useState } from 'react'
import { CATEGORY_META, CATEGORY_ORDER, PALETTE_ORDER, getMeta } from '@/components/registry'
import { useProjectStore, findNode } from '@/project/store'
import type { ComponentNode, ComponentType } from '@/project/types'
import { HelpArticle } from '@/app/HelpArticle'
import { APP_SHORTCUTS, HELP_OPEN_EVENT, dispatchCommand, isNavCommand } from '@/app/shortcuts'

function firstOfType(root: ComponentNode, type: ComponentType): ComponentNode | null {
  if (root.type === type) return root
  for (const c of root.children) {
    const hit = firstOfType(c, type)
    if (hit) return hit
  }
  return null
}

type HelpTab = 'components' | 'keys'

export function UsageHelpDock() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<HelpTab>('components')
  const [query, setQuery] = useState('')
  const [type, setType] = useState<ComponentType>('Button')
  const selectedId = useProjectStore((s) => s.selectedId)
  const project = useProjectStore((s) => s.project)
  const screen = project.screens.find((x) => x.id === project.activeScreenId) ?? project.screens[0]

  useEffect(() => {
    const onHelp = (e: Event) => {
      const d = (e as CustomEvent<{ open?: boolean; tab?: HelpTab }>).detail || {}
      if (d.open === false) {
        setOpen(false)
        return
      }
      if (d.tab) setTab(d.tab)
      setOpen(true)
    }
    window.addEventListener(HELP_OPEN_EVENT, onHelp)
    return () => window.removeEventListener(HELP_OPEN_EVENT, onHelp)
  }, [])

  useEffect(() => {
    if (open) return
    const fab = document.querySelector('.usage-fab') as HTMLButtonElement | null
    if (fab && document.activeElement === fab) fab.blur()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open || !selectedId) return
    const node = findNode(screen.root, selectedId) ?? screen.nonVisible.find((n) => n.id === selectedId)
    if (node) setType(node.type)
  }, [open, selectedId, screen])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CATEGORY_ORDER.map((cat) => ({
      cat,
      items: PALETTE_ORDER.filter((t) => {
        const meta = getMeta(t)
        if (meta.category !== cat) return false
        if (!q) return true
        return meta.label.toLowerCase().includes(q) || t.toLowerCase().includes(q)
      }),
    })).filter((g) => g.items.length > 0)
  }, [query])

  return (
    <div className="usage-dock">
      {open && (
        <div className="usage-panel" role="dialog" aria-label="帮助">
          <header className="usage-panel-head">
            <div className="usage-tabs" role="tablist">
              <button type="button" className={tab === 'components' ? 'active' : ''} onClick={() => setTab('components')}>
                组件用法
              </button>
              <button type="button" className={tab === 'keys' ? 'active' : ''} onClick={() => setTab('keys')}>
                快捷键
              </button>
            </div>
            <button type="button" className="btn tiny" onClick={() => setOpen(false)}>
              关闭
            </button>
          </header>
          {tab === 'components' ? (
            <>
              <input
                className="usage-search"
                type="search"
                value={query}
                placeholder="搜索组件"
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="usage-panel-body">
                <nav className="usage-list" aria-label="组件列表">
                  {groups.map((g) => (
                    <div key={g.cat} className="usage-cat">
                      <div className="usage-cat-label">{CATEGORY_META[g.cat].label}</div>
                      {g.items.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={t === type ? 'active' : ''}
                          onClick={() => {
                            setType(t)
                            const onScreen =
                              firstOfType(screen.root, t) ?? screen.nonVisible.find((n) => n.type === t)
                            useProjectStore.getState().setEditorTab('designer')
                            if (onScreen) {
                              useProjectStore.getState().select(onScreen.id)
                              return
                            }
                            useProjectStore.getState().setLeftPanel('palette')
                          }}
                        >
                          {getMeta(t).label}
                        </button>
                      ))}
                    </div>
                  ))}
                </nav>
                <div className="usage-detail">
                  <div className="help-modal-kicker">
                    {getMeta(type).isVisible ? '可见组件' : '非可见组件'} · {type}
                  </div>
                  <h2 className="usage-detail-title">{getMeta(type).label}</h2>
                  <HelpArticle type={type} />
                </div>
              </div>
            </>
          ) : (
            <div className="usage-keys">
              <p className="usage-keys-lead">
                按 <kbd>F1</kbd> 打开本页，<kbd>Esc</kbd> 关闭弹窗。点一行即可执行对应动作。输入框和积木画布里单键不会误触发。Ctrl+W 留给 Mixly / 浏览器关窗口。
              </p>
              <table>
                <thead>
                  <tr>
                    <th>快捷键</th>
                    <th>动作</th>
                  </tr>
                </thead>
                <tbody>
                  {APP_SHORTCUTS.map((row) => (
                    <tr key={row.keys + row.command}>
                      <td>
                        <kbd>{row.keys}</kbd>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="usage-key-run"
                          onClick={() => {
                            if (isNavCommand(row.command)) setOpen(false)
                            dispatchCommand(row.command)
                          }}
                        >
                          {row.action}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        className={`usage-fab${open ? ' open' : ''}`}
        title="帮助（F1）"
        aria-label="帮助"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? '×' : '?'}
      </button>
    </div>
  )
}
