import { providerNeedsKey, resolveApiKey, type AiSettings } from './config'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function cleanApiKey(raw: string) {
  return raw.trim().replace(/^Bearer\s+/i, '').replace(/[\u200b\u200c\u200d\ufeff]/g, '')
}

/** 经本机 Mixly 转发，避免浏览器跨域拦截第三方模型接口 */
export async function chatCompletion(
  settings: AiSettings,
  messages: ChatMessage[],
  options?: { temperature?: number; signal?: AbortSignal },
): Promise<string> {
  if (providerNeedsKey(settings.provider) && !settings.apiKey.trim()) {
    throw new Error('请先填写 API 密钥（点 AI 助手里的「接口」）')
  }
  if (!settings.baseUrl.trim() || !settings.model.trim()) {
    throw new Error('请填写接口地址与模型名')
  }

  let res: Response
  try {
    res = await fetch('/api/ai-chat', {
      method: 'POST',
      signal: options?.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseUrl: settings.baseUrl.trim(),
        model: settings.model.trim(),
        apiKey: cleanApiKey(resolveApiKey(settings)),
        temperature: options?.temperature ?? 0.4,
        messages,
      }),
    })
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e
    throw new Error('连不上本机转发接口。请确认 Mixly 已启动，然后刷新本页。')
  }

  const raw = await res.text()
  let data: { content?: string; error?: string } = {}
  try {
    data = raw ? (JSON.parse(raw) as { content?: string; error?: string }) : {}
  } catch {
    if (res.status === 404) {
      throw new Error('当前 Mixly 还没有 AI 转发接口。请关闭 Mixly 后重新运行「启动局域网.bat」，再打开本板卡。')
    }
    throw new Error(
      raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240) || `请求失败（HTTP ${res.status}）`,
    )
  }

  if (!res.ok) {
    throw new Error(data.error || `请求失败（HTTP ${res.status}）`)
  }
  const text = (data.content || '').trim()
  if (!text) throw new Error('AI 返回为空')
  return text
}
