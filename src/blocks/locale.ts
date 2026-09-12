import * as Blockly from 'blockly'
import * as ZhHans from 'blockly/msg/zh-hans'

let applied = false

/** 将 Blockly 内置积木/菜单切到简体中文（需在 inject 前调用）。 */
export function applyBlocklyZhHans() {
  if (applied) return
  Blockly.setLocale(ZhHans as unknown as { [key: string]: string })
  applied = true
}
