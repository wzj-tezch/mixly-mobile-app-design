import { createBuiltinProjectAssets } from '@/project/builtinMedia'
import { node, root, uid } from '@/project/templateKit'
import type { AiProject, ComponentNode, ComponentType, ScreenData } from '@/project/types'
import { assertAiGenSpec, extractJsonObject, logicToBlocksXml, resolveComponentType } from './blocksFromAi'
import type { AiGenNode, AiGenSpec } from './prompts'
import { validateAdvancedScript } from '@/runtime/scriptSandbox'

function asType(type: string): ComponentType {
  return resolveComponentType(type) as ComponentType
}

function buildNode(n: AiGenNode): ComponentNode {
  if (!n?.type || !n?.name) throw new Error('组件缺少 type 或 name')
  const type = asType(n.type)
  const children = (n.children ?? []).map(buildNode)
  return node(type, n.name, n.props ?? {}, children)
}

function buildScreen(s: AiGenSpec['screens'][number]): ScreenData {
  if (!s.name?.trim()) throw new Error('屏幕缺少 name')
  const tree = (s.tree ?? []).map(buildNode)
  const nonVisible = (s.nonVisible ?? []).map((nv) => {
    if (!nv.type || !nv.name) throw new Error('非可见组件缺少 type/name')
    return node(asType(nv.type), nv.name, nv.props ?? {})
  })
  return {
    id: uid('screen'),
    name: s.name.trim(),
    props: {
      Title: String(s.title || s.name || '').trim() || s.name.trim(),
      BackgroundColor: s.backgroundColor || '#f8f9fa',
      AlignVertical: 'top',
    },
    root: root(tree),
    nonVisible,
    blocksXml: logicToBlocksXml(s.logic),
    scriptCode: typeof s.script === 'string' ? s.script : '',
  }
}

export function aiSpecToProject(spec: AiGenSpec): AiProject {
  const screens = spec.screens.map(buildScreen)
  if (!screens.length) throw new Error('至少需要一个屏幕')
  return {
    schemaVersion: 1,
    id: uid('proj'),
    name: String(spec.name || '').trim() || 'AI 生成项目',
    screens,
    activeScreenId: screens[0].id,
    assets: createBuiltinProjectAssets(),
    updatedAt: Date.now(),
    advancedMode: false,
  }
}

export function parseAiResponseToProject(raw: string): AiProject {
  const { spec, parseError } = splitAssistantReply(raw)
  if (!spec) throw new Error(parseError || '回复里没有可用的界面规格')
  return aiSpecToProject(spec)
}

export function splitAssistantReply(raw: string): {
  text: string
  spec: AiGenSpec | null
  parseError?: string
} {
  const scripts: Record<string, string> = {}
  let working = raw.replace(/<app-script(?:\s+screen=["']([^"']+)["'])?\s*>([\s\S]*?)<\/app-script>/gi, (_, screen, body) => {
    const name = String(screen || 'Screen1').trim() || 'Screen1'
    scripts[name] = String(body || '').trim()
    return ''
  })

  const tagged = working.match(/<app-json>\s*([\s\S]*?)\s*<\/app-json>/i)
  let jsonRaw = ''
  let text = working
  if (tagged) {
    jsonRaw = tagged[1].trim()
    text = working.replace(tagged[0], '').trim()
  } else {
    const fence = working.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fence) {
      jsonRaw = fence[1].trim()
      text = working.replace(fence[0], '').trim()
    }
  }

  const tryParse = (s: string): { spec: AiGenSpec | null; parseError?: string } => {
    if (!s.trim()) return { spec: null }
    try {
      const data = extractJsonObject(s)
      if (!looksLikeSpec(data)) return { spec: null }
      return { spec: assertAiGenSpec(data) }
    } catch (e) {
      return { spec: null, parseError: e instanceof Error ? e.message : String(e) }
    }
  }

  const attachScripts = (spec: AiGenSpec | null): AiGenSpec | null => {
    if (!spec) return null
    const names = spec.screens.map((s) => s.name)
    const only = Object.keys(scripts)
    return {
      ...spec,
      screens: spec.screens.map((sc, i) => {
        const taggedScript = scripts[sc.name]
        const fallback = i === 0 && only.length === 1 && !names.includes(only[0]) ? scripts[only[0]] : undefined
        const script = taggedScript || fallback || sc.script || ''
        return script ? { ...sc, script } : sc
      }),
    }
  }

  if (jsonRaw) {
    const parsed = tryParse(jsonRaw)
    const spec = attachScripts(parsed.spec)
    return { text: text || (spec ? '已为你准备好界面和逻辑。' : ''), spec, parseError: parsed.parseError }
  }

  const whole = tryParse(working)
  if (whole.spec) {
    return { text: '已为你准备好界面和逻辑。', spec: attachScripts(whole.spec) }
  }
  const specOnlyScript = attachScripts(whole.spec)
  if (!specOnlyScript && Object.keys(scripts).length) {
    return { text: text.trim() || working.trim(), spec: null, parseError: '有脚本但缺少 <app-json> 界面' }
  }
  return { text: raw.trim(), spec: null }
}

function looksLikeSpec(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const o = data as Record<string, unknown>
  return Array.isArray(o.screens) || Array.isArray(o.Screens) || Boolean(o.screens && typeof o.screens === 'object')
}

/** 给纠错模式用的工程摘要 */
export function summarizeProjectForAi(project: AiProject): string {
  const lines: string[] = [`项目名: ${project.name}`, `屏幕数: ${project.screens.length}`]
  for (const sc of project.screens) {
    lines.push(`\n## 屏幕 ${sc.name}（标题: ${String(sc.props.Title ?? sc.name)}）`)
    const walk = (n: ComponentNode, depth: number) => {
      lines.push(`${'  '.repeat(depth)}- ${n.type} ${n.name}`)
      for (const c of n.children ?? []) walk(c, depth + 1)
    }
    walk(sc.root, 0)
    if (sc.nonVisible.length) {
      lines.push('  非可见:')
      for (const nv of sc.nonVisible) lines.push(`  - ${nv.type} ${nv.name}`)
    }
    if (sc.blocksXml?.trim()) {
      lines.push(`  积木 XML 长度: ${sc.blocksXml.length}`)
    }
    if (sc.scriptCode?.trim()) {
      const snippet = sc.scriptCode.trim().slice(0, 600)
      lines.push(`  高级脚本:\n${snippet}${sc.scriptCode.trim().length > 600 ? '\n  …' : ''}`)
    }
  }
  if (project.advancedMode) lines.unshift('高级模式: 已开启（预览跑脚本，不跑积木）')
  return lines.join('\n')
}

/** 把 AI 生成的工程并入当前工程：高级模式不覆盖积木，脚本须通过检查。 */
export function adoptGeneratedProject(current: AiProject, generated: AiProject): { project: AiProject; warnings: string[] } {
  const advanced = Boolean(current.advancedMode)
  const warnings: string[] = []
  const screens = generated.screens.map((sc) => {
    const prev = current.screens.find((s) => s.name === sc.name)
    if (!advanced) {
      return {
        ...sc,
        scriptCode: prev?.scriptCode || '',
      }
    }
    const candidate = (sc.scriptCode || '').trim()
    let script = prev?.scriptCode || ''
    if (candidate) {
      const check = validateAdvancedScript(candidate)
      if (check.ok) {
        script = candidate
      } else {
        warnings.push(`${sc.name} 脚本未通过检查：${check.reason}。已拒绝该脚本。`)
      }
    } else if (prev?.scriptCode?.trim()) {
      warnings.push(`${sc.name} 没有给出新脚本，已保留原来的脚本。`)
    } else {
      warnings.push(`${sc.name} 没有可用脚本，预览不会跑逻辑。`)
    }
    return {
      ...sc,
      blocksXml: prev?.blocksXml ?? sc.blocksXml ?? '',
      scriptCode: script,
    }
  })
  return {
    project: {
      ...generated,
      id: current.id,
      shareId: current.shareId,
      sourceTemplate: current.sourceTemplate,
      templateRev: current.templateRev,
      advancedMode: advanced,
      screens,
      assets: current.assets?.length ? current.assets : generated.assets,
      updatedAt: Date.now(),
    },
    warnings,
  }
}
