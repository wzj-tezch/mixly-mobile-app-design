export type CloudUser = { id: string; username: string }

export type CloudSummary = {
  id: string
  name: string
  updatedAt: number
  shareId?: string
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return { error: text }
  }
}

async function api(path: string, init?: RequestInit): Promise<Record<string, unknown>> {
  let res: Response
  try {
    res = await fetch(path, {
      credentials: 'same-origin',
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init?.headers || {}),
      },
    })
  } catch {
    throw new Error('无法连接课堂服务器。请确认 Mixly 已启动。')
  }
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(String(data.error || `请求失败（${res.status}）`))
  }
  return data
}

export async function fetchMe(): Promise<CloudUser | null> {
  const data = await api('/api/auth/me')
  const user = data.user as CloudUser | null | undefined
  return user ?? null
}

export async function registerAccount(username: string, password: string): Promise<CloudUser> {
  const data = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  return data.user as CloudUser
}

export async function loginAccount(username: string, password: string): Promise<CloudUser> {
  const data = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  return data.user as CloudUser
}

export async function logoutAccount(): Promise<void> {
  await api('/api/auth/logout', { method: 'POST' })
}

export async function listCloudProjects(): Promise<CloudSummary[]> {
  const data = await api('/api/cloud/projects')
  return (data.projects as CloudSummary[]) || []
}

export async function getCloudProject(id: string): Promise<import('@/project/types').AiProject> {
  const data = await api(`/api/cloud/projects/${encodeURIComponent(id)}`)
  return data.project as import('@/project/types').AiProject
}

export async function putCloudProject(project: import('@/project/types').AiProject): Promise<CloudSummary> {
  const data = await api('/api/cloud/projects', {
    method: 'PUT',
    body: JSON.stringify(project),
  })
  return data.project as CloudSummary
}

export async function deleteCloudProject(id: string): Promise<void> {
  await api(`/api/cloud/projects/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export type ShareLinks = {
  shareId: string
  path: string
  publicUrl: string
  lanUrls: string[]
  localUrl: string
  tunnelError: string
}

function asStringList(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => String(x)).filter(Boolean)
}

export async function publishCloudProject(projectId: string, html: string, name: string): Promise<ShareLinks> {
  const data = await api('/api/cloud/publish', {
    method: 'POST',
    body: JSON.stringify({ projectId, html, name }),
  })
  return {
    shareId: String(data.shareId || ''),
    path: String(data.path || ''),
    publicUrl: String(data.publicUrl || ''),
    lanUrls: asStringList(data.lanUrls),
    localUrl: String(data.localUrl || ''),
    tunnelError: String(data.tunnelError || ''),
  }
}

export async function unpublishCloudProject(projectId: string): Promise<void> {
  await api('/api/cloud/unpublish', {
    method: 'POST',
    body: JSON.stringify({ projectId }),
  })
}

export function shareAbsoluteUrl(shareId: string, origin = window.location.origin): string {
  return `${origin.replace(/\/+$/, '')}/s/${shareId}/`
}

export function preferredShareUrl(shareId: string, links?: ShareLinks | null): string {
  if (links?.publicUrl) return links.publicUrl
  if (links?.lanUrls?.[0]) return links.lanUrls[0]
  if (links?.localUrl) return links.localUrl
  return shareAbsoluteUrl(shareId)
}
