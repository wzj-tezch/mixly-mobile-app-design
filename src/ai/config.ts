/** AI 接口配置：仅存 localStorage，不写入工程。列表与 Mixly AI 助手「大模型」一致。 */

export type AiProviderId =
  | 'deepseek'
  | 'qwen'
  | 'glm'
  | 'kimi'
  | 'doubao'
  | 'spark'
  | 'ollama'
  | 'wllama'
  | 'custom'

export interface AiProviderPreset {
  label: string
  baseUrl: string
  model: string
  needsKey: boolean
}

export interface AiSettings {
  provider: AiProviderId
  baseUrl: string
  model: string
  apiKey: string
}

const STORAGE_KEY = 'ai2-node-ai-settings-v2'
const LEGACY_STORAGE_KEY = 'ai2-node-ai-settings-v1'

export const AI_PROVIDER_IDS: AiProviderId[] = [
  'deepseek',
  'qwen',
  'glm',
  'kimi',
  'doubao',
  'spark',
  'ollama',
  'wllama',
  'custom',
]

export const AI_PRESETS: Record<AiProviderId, AiProviderPreset> = {
  deepseek: {
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    needsKey: true,
  },
  qwen: {
    label: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    needsKey: true,
  },
  glm: {
    label: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
    needsKey: true,
  },
  kimi: {
    label: '月之暗面 Kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    needsKey: true,
  },
  doubao: {
    label: '豆包 (火山方舟)',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    model: 'doubao-seed-1-6-250615',
    needsKey: true,
  },
  spark: {
    label: '讯飞星火',
    baseUrl: 'https://spark-api-open.xf-yun.com/v1',
    model: 'lite',
    needsKey: true,
  },
  ollama: {
    label: 'Ollama (自建)',
    baseUrl: 'http://127.0.0.1:11434/v1',
    model: 'llama3',
    needsKey: false,
  },
  wllama: {
    label: 'wllama (本地)',
    baseUrl: 'http://127.0.0.1:8080/v1',
    model: 'local',
    needsKey: false,
  },
  custom: {
    label: '自定义',
    baseUrl: 'http://127.0.0.1:11434/v1',
    model: 'llama3',
    needsKey: true,
  },
}

export function providerNeedsKey(id: AiProviderId) {
  return AI_PRESETS[id]?.needsKey !== false
}

export function isKnownProvider(id: string): id is AiProviderId {
  return id in AI_PRESETS
}

/** 本地模型没有密钥时，转发接口仍需要占位值 */
export function resolveApiKey(settings: AiSettings) {
  const key = settings.apiKey.trim()
  if (key) return key
  if (!providerNeedsKey(settings.provider)) return settings.provider
  return ''
}

function migrateProvider(raw: string | undefined): AiProviderId {
  if (raw === 'openai') return 'custom'
  if (raw && isKnownProvider(raw)) return raw
  return 'deepseek'
}

export function defaultAiSettings(): AiSettings {
  const p = AI_PRESETS.deepseek
  return { provider: 'deepseek', baseUrl: p.baseUrl, model: p.model, apiKey: '' }
}

export function loadAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return defaultAiSettings()
    const parsed = JSON.parse(raw) as Partial<AiSettings> & { provider?: string }
    const provider = migrateProvider(parsed.provider)
    const preset = AI_PRESETS[provider]
    const next: AiSettings = {
      ...defaultAiSettings(),
      ...parsed,
      provider,
    }
    if (!next.baseUrl.trim()) next.baseUrl = preset.baseUrl
    if (!next.model.trim()) next.model = preset.model
    return next
  } catch {
    return defaultAiSettings()
  }
}

export function saveAiSettings(s: AiSettings) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      provider: s.provider,
      baseUrl: s.baseUrl,
      model: s.model,
      apiKey: s.apiKey,
    }),
  )
}
