import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORY_META, CATEGORY_ORDER, PALETTE_ORDER, getMeta } from '@/components/registry'
import type { ComponentCategory } from '@/components/registry'
import { useProjectStore } from '@/project/store'
import { useAuthStore } from '@/auth/session'
import type { ComponentNode, ComponentType } from '@/project/types'
import { TemplateCatalog } from '@/app/TemplateCatalog'
import { ENABLE_CLOUD } from '@/app/features'
import { isBuiltinAssetId } from '@/project/builtinMedia'

const TYPE_ICON: Record<string, string> = {
  Button: '▣',
  Label: 'Ｔ',
  TextBox: '▭',
  PasswordTextBox: '∗∗',
  CheckBox: '☑',
  Switch: '⏻',
  Slider: '⇆',
  Spinner: '▾',
  DatePicker: '📅',
  TimePicker: '🕐',
  ProgressBar: '▬',
  ListView: '☰',
  HorizontalArrangement: '⇔',
  VerticalArrangement: '⇕',
  TableArrangement: '⊞',
  Image: '🖼',
  Canvas: '◻',
  Ball: '●',
  ImageSprite: '👾',
  WebViewer: '🌐',
  Player: '▶',
  VideoPlayer: '🎬',
  Sound: '🔊',
  RatingBar: '★',
  Notifier: '💬',
  Clock: '⏱',
  TinyDB: '💾',
  TinyWebDB: '☁',
  Web: '⬇',
  TextToSpeech: '🗣',
  SpeechRecognizer: '🎤',
  Sharing: '↗',
  ActivityStarter: '🚀',
  PhoneCall: '☎',
  AccelerometerSensor: '📊',
  OrientationSensor: '🧭',
  LocationSensor: '📍',
  GyroscopeSensor: '🌀',
  ProximitySensor: '👁',
  Pedometer: '👟',
  LightSensor: '☀',
  MagneticFieldSensor: '🧲',
  Camera: '📷',
  Dice: '🎲',
  Marquee: '〰',
  ColorPicker: '🎨',
  Countdown: '⏳',
  Stopwatch: '⏱',
  QRCode: '▦',
  Joystick: '🕹',
  ChatBubble: '💬',
  Celebration: '🎉',
  TextArea: '¶',
  NumberBox: '#',
  Hyperlink: '🔗',
  Divider: '—',
  Spacer: '▭',
  Badge: '🏷',
  Stepper: '±',
  RadioButton: '◉',
  SearchBar: '🔍',
  ToggleButton: '⇪',
  Avatar: '☺',
  TabBar: '▤',
  ScrollArrangement: '↕',
  Card: '▢',
  CoinFlip: '🪙',
  TrafficLight: '🚦',
  LightBulb: '💡',
  ScoreBoard: '🏆',
  ProgressRing: '◎',
  LEDLabel: '▊',
  FortuneBall: '🎱',
  LevelBar: '▮',
  BatterySensor: '🔋',
  NetworkSensor: '📶',
  ShakeSensor: '📳',
  Vibrator: '〰',
  Clipboard: '📋',
  RandomHelper: '🎲',
  FileSaver: '⬇',
  GalleryPicker: '🖼',
  NotePad: '📝',
  FilePicker: '📂',
  FolderPicker: '🗂',
  TextWorkshop: '✂',
  Alarm: '⏰',
  Reminder: '📌',
  ClockFace: '🕐',
  CalendarView: '📅',
  TodoList: '☑',
  CalculatorPad: '🔢',
  WeatherBox: '⛅',
  DialPad: '☎',
  ContactList: '👤',
  MapView: '🗺',
  CompassView: '🧭',
  Texting: '💬',
  Emailer: '✉',
  Flashlight: '🔦',
  SoundRecorder: '🎙',
  DeviceNotify: '🔔',
  BarcodeScanner: '▦',
}

export function PalettePanel() {
  const addComponent = useProjectStore((s) => s.addComponent)
  const [query, setQuery] = useState('')
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(() => {
    try {
      const raw = sessionStorage.getItem('ai2-palette-open')
      if (raw) return JSON.parse(raw) as Record<string, boolean>
    } catch {
      /* ignore */
    }
    return { user: true, layout: true }
  })

  useEffect(() => {
    try {
      sessionStorage.setItem('ai2-palette-open', JSON.stringify(openCats))
    } catch {
      /* ignore */
    }
  }, [openCats])

  const groups = useMemo(() => {
    const map = CATEGORY_ORDER.reduce(
      (acc, cat) => {
        acc[cat] = []
        return acc
      },
      {} as Record<ComponentCategory, ComponentType[]>,
    )
    for (const t of PALETTE_ORDER) {
      map[getMeta(t).category].push(t)
    }
    return map
  }, [])

  const q = query.trim().toLowerCase()
  const filteredGroups = useMemo(() => {
    if (!q) return groups
    const next = { ...groups }
    for (const cat of CATEGORY_ORDER) {
      next[cat] = groups[cat].filter((type) => {
        const meta = getMeta(type)
        return (
          meta.label.toLowerCase().includes(q) ||
          type.toLowerCase().includes(q) ||
          CATEGORY_META[cat].label.includes(query.trim())
        )
      })
    }
    return next
  }, [groups, q, query])

  const searching = q.length > 0
  const visibleCats = CATEGORY_ORDER.filter((cat) => filteredGroups[cat].length > 0)

  const toggleCat = (cat: string) => {
    setOpenCats((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  return (
    <div className="panel-scroll palette-panel">
      <div className="palette-toolbar">
        <input
          className="palette-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索"
          aria-label="搜索组件"
        />
      </div>

      {visibleCats.length === 0 && <div className="palette-empty">没有匹配「{query}」的组件</div>}

      {visibleCats.map((cat) => {
        const types = filteredGroups[cat]
        const meta = CATEGORY_META[cat]
        const open = searching || !!openCats[cat]
        return (
          <div key={cat} className={`fold-group ${open ? 'open' : 'collapsed'}`}>
            <button
              type="button"
              className="fold-head"
              onClick={() => toggleCat(cat)}
              aria-expanded={open}
            >
              <span className="fold-chevron" aria-hidden>
                {open ? '▾' : '▸'}
              </span>
              <span className="fold-title">{meta.label}</span>
              <span className="fold-meta">{types.length}</span>
            </button>
            {open && (
              <div className="fold-body">
                {types.map((type) => {
                  const cmeta = getMeta(type)
                  return (
                    <div
                      key={type}
                      className="palette-item"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('componentType', type)
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                      onDoubleClick={() => addComponent(type)}
                      title={`${cmeta.label}（${type}）· 拖到屏幕或双击添加`}
                    >
                      <span className={`palette-icon ${cmeta.isVisible ? 'vis' : 'hid'}`}>
                        {TYPE_ICON[type] ?? '•'}
                      </span>
                      <span className="palette-label">{cmeta.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ancestorIds(root: ComponentNode, id: string): string[] | null {
  if (root.id === id) return [root.id]
  for (const c of root.children) {
    const path = ancestorIds(c, id)
    if (path) return [root.id, ...path]
  }
  return null
}

function loadTreeOpen(): Record<string, boolean> {
  try {
    const raw = sessionStorage.getItem('ai2-comp-tree-open')
    if (raw) return JSON.parse(raw) as Record<string, boolean>
  } catch {
    /* ignore */
  }
  return {}
}

function CompTreeNode({
  node,
  selectedId,
  openMap,
  toggle,
  onPick,
}: {
  node: ComponentNode
  selectedId: string | null
  openMap: Record<string, boolean>
  toggle: (id: string) => void
  onPick: (id: string | null) => void
}) {
  const meta = getMeta(node.type)
  const kids = node.children
  const hasKids = kids.length > 0
  const expanded = openMap[node.id] !== false
  const active = selectedId === node.id
  return (
    <div className="ct-node">
      <div
        className={`ct-row ${active ? 'active' : ''} ${hasKids ? 'is-group' : 'is-leaf'}`}
        onClick={() => onPick(node.id)}
      >
        <button
          type="button"
          className={`ct-twist${hasKids ? '' : ' leaf'}`}
          aria-label={hasKids ? (expanded ? '收起' : '展开') : undefined}
          onClick={(e) => {
            e.stopPropagation()
            if (hasKids) toggle(node.id)
          }}
        >
          {hasKids ? (expanded ? '▾' : '▸') : ''}
        </button>
        <span className="ct-name">{node.name}</span>
        <span className="ct-kind">{meta.label}</span>
        {hasKids ? <span className="ct-badge">{kids.length}</span> : null}
      </div>
      {hasKids && expanded && (
        <div className="ct-branch">
          {kids.map((c) => (
            <CompTreeNode
              key={c.id}
              node={c}
              selectedId={selectedId}
              openMap={openMap}
              toggle={toggle}
              onPick={onPick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ComponentTreePanel() {
  const selectedId = useProjectStore((s) => s.selectedId)
  const select = useProjectStore((s) => s.select)
  const project = useProjectStore((s) => s.project)
  const switchScreen = useProjectStore((s) => s.switchScreen)
  const addScreen = useProjectStore((s) => s.addScreen)
  const deleteScreen = useProjectStore((s) => s.deleteScreen)
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(loadTreeOpen)

  useEffect(() => {
    try {
      sessionStorage.setItem('ai2-comp-tree-open', JSON.stringify(openMap))
    } catch {
      /* ignore */
    }
  }, [openMap])

  useEffect(() => {
    if (!selectedId) return
    setOpenMap((prev) => {
      const next = { ...prev }
      let changed = false
      for (const s of project.screens) {
        const path = ancestorIds(s.root, selectedId)
        if (path) {
          if (next[s.id] === false) {
            next[s.id] = true
            changed = true
          }
          for (const id of path) {
            if (next[id] === false) {
              next[id] = true
              changed = true
            }
          }
          return changed ? next : prev
        }
        if (s.nonVisible.some((n) => n.id === selectedId)) {
          if (next[s.id] === false || next[`nv:${s.id}`] === false) {
            next[s.id] = true
            next[`nv:${s.id}`] = true
            return next
          }
          return prev
        }
      }
      return prev
    })
  }, [selectedId, project.screens])

  const toggle = (id: string) => {
    setOpenMap((prev) => ({ ...prev, [id]: prev[id] === false }))
  }

  const pick = (screenId: string, nodeId: string | null) => {
    if (project.activeScreenId !== screenId) switchScreen(screenId)
    select(nodeId)
  }

  return (
    <div className="panel-scroll comp-tree-panel">
      <div className="section-title row">
        组件树
        <button type="button" className="btn tiny" onClick={addScreen}>
          + 屏幕
        </button>
      </div>
      {project.screens.map((s) => {
        const screenOpen = openMap[s.id] !== false
        const nvId = `nv:${s.id}`
        const nvOpen = openMap[nvId] !== false
        const hidden = s.nonVisible
        const isActiveScreen = project.activeScreenId === s.id
        return (
          <div key={s.id} className="ct-screen">
            <div className="ct-screen-row">
              <div
                className={`ct-row is-screen ${isActiveScreen && !selectedId ? 'active' : ''}`}
                onClick={() => pick(s.id, null)}
              >
                <button
                  type="button"
                  className="ct-twist"
                  aria-label={screenOpen ? '收起屏幕' : '展开屏幕'}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(s.id)
                  }}
                >
                  {screenOpen ? '▾' : '▸'}
                </button>
                <span className="ct-name">{s.name}</span>
                <span className="ct-kind">屏幕</span>
              </div>
              {project.screens.length > 1 && (
                <button
                  type="button"
                  className="btn tiny danger"
                  onClick={() => {
                    if (confirm(`删除屏幕「${s.name}」？可用撤销恢复。`)) deleteScreen(s.id)
                  }}
                >
                  删
                </button>
              )}
            </div>
            {screenOpen && (
              <div className="ct-branch">
                <CompTreeNode
                  node={s.root}
                  selectedId={isActiveScreen ? selectedId : null}
                  openMap={openMap}
                  toggle={toggle}
                  onPick={(id) => pick(s.id, id)}
                />
                {hidden.length > 0 && (
                  <div className="ct-node">
                    <div className="ct-row is-group is-hidden" onClick={() => toggle(nvId)}>
                      <button type="button" className="ct-twist">
                        {nvOpen ? '▾' : '▸'}
                      </button>
                      <span className="ct-name">非可见</span>
                      <span className="ct-badge">{hidden.length}</span>
                    </div>
                    {nvOpen && (
                      <div className="ct-branch">
                        {hidden.map((n) => (
                          <div
                            key={n.id}
                            className={`ct-row is-leaf ${isActiveScreen && selectedId === n.id ? 'active' : ''}`}
                            onClick={() => pick(s.id, n.id)}
                          >
                            <button type="button" className="ct-twist leaf" tabIndex={-1} />
                            <span className="ct-name">{n.name}</span>
                            <span className="ct-kind">{getMeta(n.type).label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function DebouncedTextInput({
  value,
  onCommit,
  type = 'text',
  placeholder,
  debounceMs = 500,
}: {
  value: string
  onCommit: (v: string) => void
  type?: string
  placeholder?: string
  debounceMs?: number
}) {
  const [local, setLocal] = useState(value)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={local}
      onChange={(e) => {
        const v = e.target.value
        setLocal(v)
        if (timer.current) window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => onCommit(v), debounceMs)
      }}
      onBlur={() => {
        if (timer.current) window.clearTimeout(timer.current)
        if (local !== value) onCommit(local)
      }}
    />
  )
}

export function PropertiesPanel() {
  const screen = useProjectStore((s) => s.getActiveScreen())
  const assets = useProjectStore((s) => s.project.assets)
  const selectedId = useProjectStore((s) => s.selectedId)
  const updateProps = useProjectStore((s) => s.updateProps)
  const renameComponent = useProjectStore((s) => s.renameComponent)
  const renameScreen = useProjectStore((s) => s.renameScreen)
  const deleteSelected = useProjectStore((s) => s.deleteSelected)

  let targetProps = screen.props
  let targetId = screen.id
  let name = screen.name
  let isScreen = true
  let fields: { key: string; label: string; kind: string; options?: { value: string; label: string }[] }[] = [
    { key: 'Title', label: '标题', kind: 'text' },
    { key: 'BackgroundColor', label: '背景色', kind: 'color' },
  ]
  let events: string[] = []
  let methods: string[] = []

  if (selectedId) {
    const walk = (n: ComponentNode): ComponentNode | null => {
      if (n.id === selectedId) return n
      for (const c of n.children) {
        const f = walk(c)
        if (f) return f
      }
      return null
    }
    const node = walk(screen.root) ?? screen.nonVisible.find((n) => n.id === selectedId)
    if (node) {
      const meta = getMeta(node.type)
      targetProps = node.props
      targetId = node.id
      name = node.name
      fields = meta.fields
      events = meta.events
      methods = meta.methods
      isScreen = false
    }
  }

  return (
    <div className="panel-scroll props-panel">
      <div className="props-target row">
        <div>
          <div className="props-kind">{isScreen ? '屏幕' : '组件'}</div>
          <div className="props-name">{name}</div>
        </div>
        <div className="props-actions">
          {selectedId && (
            <button type="button" className="btn tiny danger" onClick={deleteSelected}>
              删除
            </button>
          )}
        </div>
      </div>
      <label className="field">
        <span>{isScreen ? '屏幕名' : '组件名'}</span>
        <input
          value={name}
          placeholder={isScreen ? 'Screen1' : 'Hint1、StartBtn'}
          onChange={(e) =>
            isScreen ? renameScreen(targetId, e.target.value) : renameComponent(targetId, e.target.value)
          }
        />
      </label>
      {fields.map((f) => (
        <label key={f.key} className="field">
          <span>{f.label}</span>
          {f.kind === 'boolean' ? (
            <input
              type="checkbox"
              checked={!!targetProps[f.key]}
              onChange={(e) => updateProps(targetId, { [f.key]: e.target.checked })}
            />
          ) : f.kind === 'select' ? (
            <select
              value={String(targetProps[f.key] ?? '')}
              onChange={(e) => updateProps(targetId, { [f.key]: e.target.value })}
            >
              {(f.options ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : f.kind === 'asset' ? (
            <>
              <select
                value={
                  assets.some((a) => a.dataUrl === targetProps[f.key])
                    ? String(targetProps[f.key] ?? '')
                    : targetProps[f.key]
                      ? '__custom__'
                      : ''
                }
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '__custom__') return
                  updateProps(targetId, { [f.key]: v })
                }}
              >
                <option value="">（未选）</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.dataUrl}>
                    {a.name}
                  </option>
                ))}
                {!!targetProps[f.key] && !assets.some((a) => a.dataUrl === targetProps[f.key]) && (
                  <option value="__custom__">外部 URL / 旧值</option>
                )}
              </select>
              <input
                type="text"
                placeholder="或粘贴图片 URL / data URL"
                value={String(targetProps[f.key] ?? '')}
                onChange={(e) => updateProps(targetId, { [f.key]: e.target.value })}
              />
              {!!targetProps[f.key] &&
                (String(targetProps[f.key]).startsWith('data:image') ||
                  /\.(svg|png|jpe?g|gif|webp)(\?|$)/i.test(String(targetProps[f.key]))) && (
                <img className="asset-preview-sm" src={String(targetProps[f.key])} alt="" />
              )}
            </>
          ) : f.kind === 'number' || f.kind === 'color' ? (
            <input
              type={f.kind === 'number' ? 'number' : 'color'}
              value={String(targetProps[f.key] ?? (f.kind === 'color' ? '#ffffff' : ''))}
              onChange={(e) =>
                updateProps(targetId, {
                  [f.key]: f.kind === 'number' ? Number(e.target.value) : e.target.value,
                })
              }
            />
          ) : (
            <DebouncedTextInput
              value={String(targetProps[f.key] ?? '')}
              placeholder={f.key === 'HomeUrl' ? '例如 https://www.wikipedia.org' : undefined}
              debounceMs={f.key === 'HomeUrl' ? 600 : 400}
              onCommit={(v) => updateProps(targetId, { [f.key]: v })}
            />
          )}
        </label>
      ))}
      {events.length > 0 && (
        <>
          <div className="section-title">事件</div>
          <div className="chip-row">{events.map((e) => <span key={e} className="chip">{e}</span>)}</div>
        </>
      )}
      {methods.length > 0 && (
        <>
          <div className="section-title">方法</div>
          <div className="chip-row">{methods.map((e) => <span key={e} className="chip">{e}</span>)}</div>
        </>
      )}
    </div>
  )
}

function loadAssetOpen(): Record<string, boolean> {
  try {
    const raw = sessionStorage.getItem('ai2-asset-open')
    if (raw) return JSON.parse(raw) as Record<string, boolean>
  } catch {
    /* ignore */
  }
  return { 图片: true, 音频: false, 视频: false }
}

export function AssetsPanel() {
  const assets = useProjectStore((s) => s.project.assets)
  const addAsset = useProjectStore((s) => s.addAsset)
  const removeAsset = useProjectStore((s) => s.removeAsset)
  const fileRef = useRef<HTMLInputElement>(null)
  const [openKinds, setOpenKinds] = useState<Record<string, boolean>>(loadAssetOpen)

  useEffect(() => {
    try {
      sessionStorage.setItem('ai2-asset-open', JSON.stringify(openKinds))
    } catch {
      /* ignore */
    }
  }, [openKinds])

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        alert(`跳过非图片：${file.name}`)
        continue
      }
      if (file.size > 2.5 * 1024 * 1024) {
        alert(`${file.name} 超过 2.5MB，请压缩后再传`)
        continue
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })
      addAsset({ name: file.name, mime: file.type, dataUrl })
    }
  }

  return (
    <div className="panel-scroll">
      <div className="section-title row">
        媒体资源
        <button type="button" className="btn tiny" onClick={() => fileRef.current?.click()}>
          上传图片
        </button>
      </div>
      <p className="panel-hint">内置图/音可直接选。自己的图片拖进来即可。</p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void onFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <div
        className="asset-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          void onFiles(e.dataTransfer.files)
        }}
      >
        拖图片到这里上传
      </div>
      {assets.length === 0 && <div className="muted" style={{ marginTop: 10 }}>暂无资源</div>}
      {(['图片', '音频', '视频'] as const).map((kind) => {
        const items = assets.filter((a) => {
          const img = a.mime.startsWith('image/') || /\.(svg|png|jpe?g|gif|webp)(\?|$)/i.test(a.dataUrl)
          const aud = a.mime.startsWith('audio/') || /\.(wav|mp3|ogg)(\?|$)/i.test(a.dataUrl)
          const vid = a.mime.startsWith('video/') || /\.(mp4|webm)(\?|$)/i.test(a.dataUrl)
          return kind === '图片' ? img : kind === '音频' ? aud : vid
        })
        if (!items.length) return null
        const open = openKinds[kind] !== false
        return (
          <div key={kind} className={`fold-group ${open ? 'open' : 'collapsed'}`}>
            <button
              type="button"
              className="fold-head"
              onClick={() => setOpenKinds((prev) => ({ ...prev, [kind]: !open }))}
              aria-expanded={open}
            >
              <span className="fold-chevron">{open ? '▾' : '▸'}</span>
              <span className="fold-title">{kind}</span>
              <span className="fold-meta">{items.length}</span>
            </button>
            {open && (
              <div className="fold-body">
                {items.map((a) => {
                  const locked = isBuiltinAssetId(a.id)
                  const isImg = a.mime.startsWith('image/') || /\.(svg|png|jpe?g|gif|webp)(\?|$)/i.test(a.dataUrl)
                  const isAud = a.mime.startsWith('audio/') || /\.(wav|mp3|ogg)(\?|$)/i.test(a.dataUrl)
                  const isVid = a.mime.startsWith('video/') || /\.(mp4|webm)(\?|$)/i.test(a.dataUrl)
                  return (
                    <div key={a.id} className={`fold-item asset-card ${locked ? 'builtin' : ''}`}>
                      {isImg ? (
                        <img src={a.dataUrl} alt={a.name} />
                      ) : isAud ? (
                        <div className="asset-media-placeholder">♪</div>
                      ) : isVid ? (
                        <div className="asset-media-placeholder">▶</div>
                      ) : (
                        <div className="asset-media-placeholder">文件</div>
                      )}
                      <div className="asset-meta">
                        <div className="asset-name" title={a.name}>
                          {a.name.replace(/^内置·/, '')}
                        </div>
                        {isAud && <audio className="asset-audio" src={a.dataUrl} controls preload="none" />}
                        {locked ? (
                          <span className="asset-lock">内置</span>
                        ) : (
                          <button type="button" className="btn tiny danger" onClick={() => removeAsset(a.id)}>
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ProjectsPanel() {
  const list = useProjectStore((s) => s.projectList)
  const cloudList = useProjectStore((s) => s.cloudList)
  const project = useProjectStore((s) => s.project)
  const newProject = useProjectStore((s) => s.newProject)
  const openProject = useProjectStore((s) => s.openProject)
  const removeProject = useProjectStore((s) => s.removeProject)
  const openCloudProject = useProjectStore((s) => s.openCloudProject)
  const removeCloudProject = useProjectStore((s) => s.removeCloudProject)
  const user = useAuthStore((s) => s.user)

  return (
    <div className="panel-scroll">
      <div className="section-title row">
        项目
        <button type="button" className="btn tiny" onClick={() => newProject(prompt('项目名称') || '新项目')}>
          新建
        </button>
      </div>
      <div className="section-title">内置案例</div>
      <TemplateCatalog />
      <div className="section-title">本机</div>
      {list.map((p) => (
        <div key={p.id} className={`local-item ${p.id === project.id ? 'active' : ''}`}>
          <button type="button" className="local-item-main" onClick={() => openProject(p.id)}>
            <span className="local-item-name">{p.name}</span>
            <span className="local-item-meta">{new Date(p.updatedAt).toLocaleString()}</span>
          </button>
          <button type="button" className="btn tiny danger" onClick={() => removeProject(p.id)}>
            删
          </button>
        </div>
      ))}
      {ENABLE_CLOUD && user && (
        <>
          <div className="section-title">云端（我的）</div>
          {cloudList.length === 0 && <p className="muted" style={{ fontSize: 12 }}>还没有云工程。登录后点「云保存」。</p>}
          {cloudList.map((p) => (
            <div key={p.id} className={`local-item ${p.id === project.id ? 'active' : ''}`}>
              <button type="button" className="local-item-main" onClick={() => void openCloudProject(p.id)}>
                <span className="local-item-name">{p.name}</span>
                <span className="local-item-meta">
                  {p.shareId ? '已发布 · ' : ''}
                  {new Date(p.updatedAt).toLocaleString()}
                </span>
              </button>
              <button
                type="button"
                className="btn tiny danger"
                onClick={() => {
                  if (confirm(`从课堂服务器删除「${p.name}」？本机副本仍在。`)) {
                    void removeCloudProject(p.id).catch((e) => alert(String(e).replace(/^Error:\s*/, '')))
                  }
                }}
              >
                删
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
