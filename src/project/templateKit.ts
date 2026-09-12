import { getMeta } from '@/components/registry'
import { createBuiltinProjectAssets } from './builtinMedia'
import type { AiProject, ComponentNode, ComponentType, ProjectAsset, ScreenData } from './types'

let hintSeq = 0
let headingSeq = 0

export function uid(prefix = 'c') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function node(
  type: ComponentType,
  name: string,
  props: Record<string, unknown> = {},
  children: ComponentNode[] = [],
): ComponentNode {
  const meta = getMeta(type)
  return {
    id: uid(type.toLowerCase()),
    type,
    name,
    props: { ...meta.defaults, ...props },
    children,
    visible: meta.isVisible,
  }
}

export function tip(text: string): ComponentNode {
  hintSeq += 1
  return node('Label', `Hint${hintSeq}`, {
    Text: text,
    FontSize: 13,
    TextColor: '#5a7d78',
    Width: '填满父组件',
  })
}

export function title(text: string): ComponentNode {
  headingSeq += 1
  return node('Label', `Heading${headingSeq}`, {
    Text: text,
    FontSize: 22,
    TextColor: '#134e4a',
    Width: '填满父组件',
  })
}

export function kicker(text: string): ComponentNode {
  headingSeq += 1
  return node('Label', `Eyebrow${headingSeq}`, {
    Text: text,
    FontSize: 12,
    TextColor: '#5a7d78',
    Width: '填满父组件',
  })
}

export function gap(height = 8): ComponentNode {
  headingSeq += 1
  return node('Spacer', `Gap${headingSeq}`, { Height: height })
}

/** 眉题 + 大标题 + 分区卡片，底部留白 */
export function page(children: ComponentNode[]): ComponentNode {
  return root([gap(4), ...children, gap(16)])
}

export function label(name: string, text: string, fontSize = 18, color = '#202124'): ComponentNode {
  return node('Label', name, {
    Text: text,
    FontSize: fontSize,
    TextColor: color,
    Width: '填满父组件',
    Height: '自动',
  })
}

export function button(name: string, text: string, bg = '#009688'): ComponentNode {
  return node('Button', name, {
    Text: text,
    BackgroundColor: bg,
    TextColor: '#fff',
    FontSize: 16,
    Enabled: true,
    Width: '填满父组件',
    Height: '自动',
  })
}

export function textBox(name: string, hint: string): ComponentNode {
  return node('TextBox', name, {
    Text: '',
    Hint: hint,
    FontSize: 16,
    Width: '填满父组件',
    Height: '自动',
    Enabled: true,
  })
}

export function root(children: ComponentNode[]): ComponentNode {
  return node(
    'VerticalArrangement',
    'ScreenRoot',
    {
      Width: '填满父组件',
      Height: '填满父组件',
      BackgroundColor: 'transparent',
    },
    children,
  )
}

export function project(name: string, screens: ScreenData[], assets?: ProjectAsset[]): AiProject {
  return {
    schemaVersion: 1,
    id: uid('proj'),
    name,
    screens,
    activeScreenId: screens[0].id,
    assets: assets ?? createBuiltinProjectAssets(),
    updatedAt: Date.now(),
  }
}

export function nv(type: ComponentType, name: string, props: Record<string, unknown> = {}): ComponentNode {
  return node(type, name, props)
}

export function card(name: string, cardTitle: string, children: ComponentNode[]): ComponentNode {
  return node('Card', name, { Title: cardTitle, BackgroundColor: '#ffffff', Width: '填满父组件' }, children)
}

export function hrow(name: string, children: ComponentNode[]): ComponentNode {
  return node('HorizontalArrangement', name, { Width: '填满父组件', BackgroundColor: 'transparent' }, children)
}

export function playField(name: string, height: number, children: ComponentNode[], bg = '#e0f7fa'): ComponentNode {
  return node(
    'VerticalArrangement',
    name,
    {
      Width: '填满父组件',
      Height: height,
      BackgroundColor: bg,
      IsPlayField: true,
    },
    children,
  )
}

export function clickSetText(component: string, target: string, text: string, x = 20, y = 20): string {
  return `<block type="component_event" x="${x}" y="${y}">
    <field name="COMPONENT">${component}</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">${target}</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">${text}</field></block></value>
      </block>
    </statement>
  </block>`
}

export function wrapXml(inner: string): string {
  return `<xml xmlns="https://developers.google.com/blockly/xml">\n${inner}\n</xml>`
}

/** 当组件被点击时调用方法积木（如 dice_roll / coin_flip） */
export function clickThenMethod(comp: string, methodBlockType: string, x = 20, y = 20): string {
  return `<block type="component_event" x="${x}" y="${y}">
    <field name="COMPONENT">${comp}</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="${methodBlockType}"><field name="COMPONENT">${comp}</field></block>
    </statement>
  </block>`
}
