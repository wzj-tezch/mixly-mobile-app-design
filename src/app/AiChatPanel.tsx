import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  AI_PRESETS,
  AI_PROVIDER_IDS,
  loadAiSettings,
  providerNeedsKey,
  saveAiSettings,
  type AiProviderId,
  type AiSettings,
} from '@/ai/config'
import { chatCompletion, type ChatMessage } from '@/ai/client'
import { getAiSystemPrompt, buildChatUserPrompt } from '@/ai/prompts'
import { splitAssistantReply, summarizeProjectForAi, aiSpecToProject, adoptGeneratedProject } from '@/ai/projectFromAi'
import {
  chatOwnerKey,
  clearChatThread,
  defaultChatThread,
  loadChatThread,
  nextChatId,
  saveChatThread,
  type ChatItem,
} from '@/ai/chatMemory'
import { useAuthStore } from '@/auth/session'
import type { AiProject } from '@/project/types'
import { useProjectStore } from '@/project/store'
import { confirmSetAdvancedMode } from '@/runtime/scriptSandbox'

const HISTORY_TURNS = 24

export function AiChatPanel({ open = true, onClose }: { open?: boolean; onClose?: () => void }) {
  const project = useProjectStore((s) => s.project)
  const replaceProject = useProjectStore((s) => s.replaceProject)
  const setAdvancedMode = useProjectStore((s) => s.setAdvancedMode)
  const setBlocksViewMode = useProjectStore((s) => s.setBlocksViewMode)
  const setEditorTab = useProjectStore((s) => s.setEditorTab)
  const setLeftPanel = useProjectStore((s) => s.setLeftPanel)
  const user = useAuthStore((s) => s.user)
  const authReady = useAuthStore((s) => s.ready)
  const ownerId = chatOwnerKey(user?.id)
  const saveOwnerRef = useRef<string | null>(null)

  const [settings, setSettings] = useState<AiSettings>(() => loadAiSettings())
  const [showSettings, setShowSettings] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [items, setItems] = useState<ChatItem[]>(() => defaultChatThread())
  const abortRef = useRef<AbortController | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!authReady) return
    let cancelled = false
    setHydrated(false)
    saveOwnerRef.current = null
    const loadingFor = ownerId
    void loadChatThread(loadingFor).then((loaded) => {
      if (cancelled) return
      setItems(loaded)
      saveOwnerRef.current = loadingFor
      setHydrated(true)
    })
    return () => {
      cancelled = true
    }
  }, [authReady, ownerId])

  useEffect(() => {
    if (!hydrated) return
    if (saveOwnerRef.current !== ownerId) return
    void saveChatThread(ownerId, items)
  }, [hydrated, ownerId, items])

  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [items, busy, open])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      return
    }
    const el = inputRef.current
    if (el && document.activeElement === el) el.blur()
  }, [open])

  const patchSettings = (patch: Partial<AiSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      saveAiSettings(next)
      return next
    })
  }

  const onProviderChange = (provider: AiProviderId) => {
    const preset = AI_PRESETS[provider]
    patchSettings({ provider, baseUrl: preset.baseUrl, model: preset.model })
  }

  const applyProject = (id: number) => {
    const item = items.find((m) => m.id === id)
    if (!item?.project) return
    const { project: next, warnings } = adoptGeneratedProject(project, item.project)
    replaceProject(next)
    setEditorTab('designer')
    setLeftPanel('components')
    setItems((prev) =>
      prev.map((m) => (m.id === id ? { ...m, applied: true, applyWarnings: warnings.length ? warnings : undefined } : m)),
    )
  }

  const clearThread = () => {
    if (busy) return
    if (!window.confirm('清空这位同学在本机的 AI 对话记录？')) return
    void clearChatThread(ownerId).then((fresh) => setItems(fresh))
  }

  const send = () => {
    const text = draft.trim()
    if (!text || busy) return
    if (providerNeedsKey(settings.provider) && !settings.apiKey.trim()) {
      setShowSettings(true)
      setItems((prev) => [
        ...prev,
        { id: nextChatId(), role: 'user', text },
        {
          id: nextChatId(),
          role: 'assistant',
          text: '还没有填写 API 密钥。请点本面板上的「接口」填好密钥后再发送。密钥只存在这台电脑的浏览器里。顶栏「设置」是项目名和高级模式，不是填密钥的地方。',
        },
      ])
      setDraft('')
      return
    }

    const history = items.slice(-HISTORY_TURNS)
    const userItem: ChatItem = { id: nextChatId(), role: 'user', text }
    setItems((prev) => [...prev, userItem])
    setDraft('')
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setBusy(true)

    void (async () => {
      try {
        const messages: ChatMessage[] = [
          { role: 'system', content: getAiSystemPrompt(Boolean(project.advancedMode)) },
          ...history
            .filter((m) => m.text.trim())
            .map((m) => ({
              role: m.role,
              content: (
                m.role === 'assistant' && m.project
                  ? `${m.text}\n（已准备工程《${m.project.name}》，${m.project.screens.length} 屏${m.applied ? '，学生已应用到设计器' : ''}）`
                  : m.text
              ).slice(0, 4000),
            })),
          { role: 'user', content: buildChatUserPrompt(text, summarizeProjectForAi(project), Boolean(project.advancedMode)) },
        ]
        const raw = await chatCompletion(settings, messages, { signal: ac.signal, temperature: 0.55 })
        const { text: say, spec, parseError } = splitAssistantReply(raw)
        let nextProject: AiProject | undefined
        let specError: string | undefined
        if (spec) {
          try {
            nextProject = aiSpecToProject(spec)
          } catch (e) {
            specError = e instanceof Error ? e.message : String(e)
          }
        } else if (parseError && /app-json|JSON/i.test(raw)) {
          specError = parseError
        }
        setItems((prev) => [
          ...prev,
          {
            id: nextChatId(),
            role: 'assistant',
            text: say || (nextProject ? `已准备好「${nextProject.name}」。` : '（没有文字回复）'),
            project: nextProject,
            specError,
          },
        ])
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') {
          setItems((prev) => [...prev, { id: nextChatId(), role: 'assistant', text: '已取消这一次回复。' }])
        } else {
          setItems((prev) => [
            ...prev,
            { id: nextChatId(), role: 'assistant', text: e instanceof Error ? e.message : String(e) },
          ])
        }
      } finally {
        setBusy(false)
        if (open) inputRef.current?.focus()
      }
    })()
  }

  const onComposerKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const keyReady = !providerNeedsKey(settings.provider) || Boolean(settings.apiKey.trim())
  const needsKey = providerNeedsKey(settings.provider)
  const preset = AI_PRESETS[settings.provider]

  return (
    <div className="ai-chat-panel">
      <div className="ai-chat-head">
        <div className="ai-chat-title">
          AI 助手
          {project.advancedMode ? <span className="ai-adv-badge">高级</span> : null}
        </div>
        <div className="ai-chat-head-actions">
          <button
            type="button"
            className={`ai-link-btn${project.advancedMode ? ' on' : ''}`}
            title="高级模式：预览跑脚本且只能用 rt，默认关闭"
            onClick={() => {
              const next = !project.advancedMode
              if (!confirmSetAdvancedMode(next)) return
              setAdvancedMode(next)
              if (next) {
                setBlocksViewMode('code')
                setEditorTab('blocks')
              }
            }}
          >
            {project.advancedMode ? '关高级' : '高级'}
          </button>
          <button type="button" className="ai-link-btn" title="清空本机对话" onClick={clearThread}>
            清空
          </button>
          <button
            type="button"
            className={`ai-gear${showSettings ? ' on' : ''}`}
            title="填写模型接口和密钥"
            onClick={() => setShowSettings((v) => !v)}
          >
            接口
            {!keyReady && <span className="ai-gear-dot" />}
          </button>
          {onClose && (
            <button type="button" className="ai-link-btn" onClick={onClose}>
              关闭
            </button>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="ai-settings">
          <label className="ai-field">
            <span>大模型</span>
            <select value={settings.provider} onChange={(e) => onProviderChange(e.target.value as AiProviderId)}>
              {AI_PROVIDER_IDS.map((id) => (
                <option key={id} value={id}>
                  {AI_PRESETS[id].label}
                </option>
              ))}
            </select>
          </label>
          <label className="ai-field">
            <span>模型</span>
            <input
              value={settings.model}
              onChange={(e) => patchSettings({ model: e.target.value })}
              placeholder={preset.model}
              spellCheck={false}
            />
          </label>
          <label className="ai-field ai-field-wide">
            <span>接口</span>
            <input
              value={settings.baseUrl}
              onChange={(e) => patchSettings({ baseUrl: e.target.value })}
              placeholder={preset.baseUrl}
              spellCheck={false}
            />
          </label>
          {needsKey && (
            <label className="ai-field ai-field-wide">
              <span>密钥</span>
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) => patchSettings({ apiKey: e.target.value })}
                placeholder="只存在本机浏览器"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
          )}
          <p className="ai-settings-hint">
            大模型列表与 Mixly 一致。Ollama / wllama 走本机 OpenAI 兼容接口，无需密钥。
            对话按同学分开记在本机。组件和积木知识库由本软件自动生成，AI 不会使用不存在的积木。
          </p>
        </div>
      )}

      <div className="ai-thread" ref={threadRef} aria-live="polite">
        {items.map((m) => (
          <div key={m.id} className={`ai-msg ai-msg-${m.role}`}>
            <div className="ai-who">{m.role === 'user' ? '我' : '助手'}</div>
            <div className="ai-bubble">{m.text}</div>
            {m.project && (
              <div className="ai-spec-card">
                <div className="ai-spec-name">{m.project.name}</div>
                <div className="ai-spec-meta">
                  {m.project.screens.length} 个屏幕
                  {project.advancedMode
                    ? m.project.screens.some((s) => Boolean(s.scriptCode?.trim()))
                      ? ' · 含脚本'
                      : ' · 界面'
                    : m.project.screens.some((s) => s.blocksXml.includes('component_event'))
                      ? ' · 含积木逻辑'
                      : ''}
                </div>
                <button type="button" className="ai-apply" onClick={() => applyProject(m.id)}>
                  {m.applied ? '已应用到设计器' : '应用到设计器'}
                </button>
                {m.applyWarnings?.length ? (
                  <div className="ai-spec-err">{m.applyWarnings.join('\n')}</div>
                ) : null}
              </div>
            )}
            {m.specError && <div className="ai-spec-err">界面规格未能用上：{m.specError}</div>}
          </div>
        ))}
        {busy && (
          <div className="ai-msg ai-msg-assistant">
            <div className="ai-who">助手</div>
            <div className="ai-bubble ai-typing">正在想…</div>
          </div>
        )}
      </div>

      <div className="ai-composer">
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onComposerKey}
          placeholder="发消息，或说「做个点赞计数器」…"
          rows={2}
          disabled={busy}
        />
        <div className="ai-composer-bar">
          <span className="ai-composer-hint">Enter 发送 · Shift+Enter 换行</span>
          {busy ? (
            <button type="button" className="ai-send ghost" onClick={() => abortRef.current?.abort()}>
              停止
            </button>
          ) : (
            <button type="button" className="ai-send" disabled={!draft.trim()} onClick={send}>
              发送
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
