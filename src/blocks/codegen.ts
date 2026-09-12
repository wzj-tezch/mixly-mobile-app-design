import * as Blockly from 'blockly'
import { registerAi2Blocks, workspaceToCode, xmlToWorkspace } from './ai2Blocks'
import { applyMixlyBlockFrontIcons } from './mixlyBlockIcons'
import { applyBlocklyZhHans } from './locale'
import type { AiProject, ScreenData } from '@/project/types'
import { validateAdvancedScript } from '@/runtime/scriptSandbox'

let registered = false

export function getScreenRuntimePlan(
  project: AiProject,
  screen: ScreenData,
): { code: string; advanced: boolean } {
  if (!project.advancedMode) {
    return { code: getGeneratedCodeFromXml(screen.blocksXml || ''), advanced: false }
  }
  const raw = screen.scriptCode || ''
  if (!raw.trim()) return { code: '', advanced: true }
  const check = validateAdvancedScript(raw)
  if (!check.ok) {
    return {
      code: `rt.alert(${JSON.stringify(`高级脚本未通过检查：${check.reason}`)});`,
      advanced: true,
    }
  }
  return { code: raw, advanced: true }
}

export function buildProjectScreenCodes(project: AiProject): Record<string, string> {
  const screenCodes: Record<string, string> = {}
  for (const sc of project.screens) {
    screenCodes[sc.name] = getScreenRuntimePlan(project, sc).code
  }
  return screenCodes
}

/** Generate JS from blocks XML without a mounted editor (preview / export). */
export function getGeneratedCodeFromXml(xml: string): string {
  if (!xml?.trim()) return ''
  if (!registered) {
    applyBlocklyZhHans()
    registerAi2Blocks()
    applyMixlyBlockFrontIcons()
    registered = true
  }
  const workspace = new Blockly.Workspace()
  try {
    xmlToWorkspace(workspace, xml)
    return workspaceToCode(workspace)
  } catch (err) {
    console.warn('[ai2] blocksXml 无法生成代码，预览将无积木逻辑:', err)
    return ''
  } finally {
    workspace.dispose()
  }
}

export function ensureAi2BlocksRegistered() {
  applyBlocklyZhHans()
  registerAi2Blocks()
  applyMixlyBlockFrontIcons()
  registered = true
}
