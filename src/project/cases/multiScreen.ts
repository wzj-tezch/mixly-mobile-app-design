import type { AiProject, ScreenData } from '../types'
import { tip, label, button, project, node, wrapXml, nv, uid, kicker, page, card } from '../templateKit'

function openScreen(btn: string, screen: string, x: number, y: number) {
  return `<block type="component_event" x="${x}" y="${y}">
    <field name="COMPONENT">${btn}</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="control_open_screen"><field name="SCREEN">${screen}</field></block>
    </statement>
  </block>`
}

/** 绘本翻页：封面 → 第1页 → 第2页 → 结局 */
export function createStoryBookTemplate(): AiProject {
  const cover: ScreenData = {
    id: uid('screen'),
    name: 'Cover',
    props: { Title: '封面', BackgroundColor: '#fff8e1' },
    root: page([
      kicker('难 · 绘本封面'),
      card('HeroCard', '封面', [
        node('Image', 'CoverImg', { Width: 260, Height: 150, Picture: './media/photo.png' }),
        label('CoverTitle', '小星星历险记', 22, '#f57f17'),
        label('CoverSub', '共 3 页，练打开另一屏幕', 13, '#8d6e63'),
      ]),
      card('ActionCard', '开始', [
        button('OpenStory', '翻开绘本', '#f9a825'),
      ]),
      tip('多屏绘本：点「翻开」进入故事。'),
    ]),
    nonVisible: [],
    blocksXml: wrapXml(openScreen('OpenStory', 'Page1', 20, 20)),
  }
  const page1: ScreenData = {
    id: uid('screen'),
    name: 'Page1',
    props: { Title: '第1页', BackgroundColor: '#e3f2fd' },
    root: page([
      kicker('难 · 第 1 页'),
      card('HeroCard', '出发', [
        label('P1Title', '第 1 页 · 出发', 20, '#1565c0'),
        node('ChatBubble', 'P1Bubble', { Text: '小星星离开云朵，去找勇气。', Side: '左' }),
        node('Image', 'P1Img', { Width: 200, Height: 100, Picture: './media/banner.png' }),
      ]),
      card('ActionCard', '翻页', [
        button('ToPage2', '下一页 →', '#1976d2'),
        button('BackCover', '回封面', '#90a4ae'),
      ]),
    ]),
    nonVisible: [],
    blocksXml: wrapXml(`
      ${openScreen('ToPage2', 'Page2', 20, 20)}
      ${openScreen('BackCover', 'Cover', 20, 120)}
    `),
  }
  const page2: ScreenData = {
    id: uid('screen'),
    name: 'Page2',
    props: { Title: '第2页', BackgroundColor: '#f3e5f5' },
    root: page([
      kicker('难 · 第 2 页'),
      card('HeroCard', '挑战', [
        label('P2Title', '第 2 页 · 挑战', 20, '#6a1b9a'),
        node('ChatBubble', 'P2Bubble', { Text: '路上遇到大风，它紧紧握住勇气。', Side: '右' }),
        node('Avatar', 'Hero', { Text: '星', Size: 48, Picture: './media/avatar.png' }),
      ]),
      card('ActionCard', '翻页', [
        button('ToEnd', '翻到结局 →', '#8e24aa'),
        button('BackP1', '← 上一页', '#90a4ae'),
      ]),
    ]),
    nonVisible: [],
    blocksXml: wrapXml(`
      ${openScreen('ToEnd', 'Ending', 20, 20)}
      ${openScreen('BackP1', 'Page1', 20, 120)}
    `),
  }
  const ending: ScreenData = {
    id: uid('screen'),
    name: 'Ending',
    props: { Title: '结局', BackgroundColor: '#e8f5e9' },
    root: page([
      kicker('难 · 结局'),
      card('HeroCard', '回家', [
        label('EndTitle', '结局 · 回家', 22, '#2e7d32'),
        label('EndBody', '小星星带着勇气回到云端。你也读完了！', 14, '#558b2f'),
        node('Image', 'EndImg', { Width: 160, Height: 100, Picture: './media/sprite.png' }),
      ]),
      card('ActionCard', '再读', [
        button('AgainBtn', '再读一遍', '#43a047'),
        button('HomeBtn', '回封面', '#66bb6a'),
      ]),
    ]),
    nonVisible: [nv('Celebration', 'Celebration1', {})],
    blocksXml: wrapXml(`
      <block type="component_event" x="20" y="20">
        <field name="COMPONENT">AgainBtn</field>
        <field name="EVENT">Click</field>
        <statement name="DO">
          <block type="celebrate"><field name="COMPONENT">Celebration1</field>
            <next>
              <block type="control_open_screen"><field name="SCREEN">Page1</field></block>
            </next>
          </block>
        </statement>
      </block>
      ${openScreen('HomeBtn', 'Cover', 20, 180)}
    `),
  }
  return project('绘本翻页', [cover, page1, page2, ending])
}

/** 校园导览：地图 → 实验室 / 图书馆 */
export function createCampusTourTemplate(): AiProject {
  const map: ScreenData = {
    id: uid('screen'),
    name: 'Map',
    props: { Title: '校园地图', BackgroundColor: '#e0f2f1' },
    root: page([
      kicker('难 · 校园地图'),
      card('HeroCard', '导览', [
        label('MapTitle', '校园导览', 22, '#00695c'),
        node('Image', 'MapImg', { Width: 260, Height: 120, Picture: './media/photo.png' }),
      ]),
      card('ActionCard', '去哪儿', [
        button('GoLab', '🔬 创客实验室', '#00897b'),
        button('GoLib', '📚 图书馆', '#00695c'),
        button('GoCafe', '🍪 小卖部', '#26a69a'),
      ]),
      tip('点地点进入对应屏幕，再返回地图。'),
    ]),
    nonVisible: [],
    blocksXml: wrapXml(`
      ${openScreen('GoLab', 'Lab', 20, 20)}
      ${openScreen('GoLib', 'Library', 20, 120)}
      ${openScreen('GoCafe', 'Cafe', 20, 220)}
    `),
  }
  const lab: ScreenData = {
    id: uid('screen'),
    name: 'Lab',
    props: { Title: '实验室', BackgroundColor: '#e3f2fd' },
    root: page([
      kicker('难 · 实验室'),
      card('HeroCard', '创客实验室', [
        label('LabTitle', '创客实验室', 20, '#1565c0'),
        label('LabDesc', '这里可以搭积木、试传感器。', 14, '#546e7a'),
        node('LightBulb', 'LabBulb', { On: true }),
      ]),
      card('ActionCard', '返回', [
        button('BackMap1', '← 回地图', '#90a4ae'),
      ]),
    ]),
    nonVisible: [],
    blocksXml: wrapXml(openScreen('BackMap1', 'Map', 20, 20)),
  }
  const library: ScreenData = {
    id: uid('screen'),
    name: 'Library',
    props: { Title: '图书馆', BackgroundColor: '#fff3e0' },
    root: page([
      kicker('难 · 图书馆'),
      card('HeroCard', '馆藏', [
        label('LibTitle', '图书馆', 20, '#e65100'),
        node('ListView', 'BookList', { ElementsFromString: '积木入门,传感器手册,校园故事', Height: 120 }),
      ]),
      card('ActionCard', '返回', [
        button('BackMap2', '← 回地图', '#90a4ae'),
      ]),
    ]),
    nonVisible: [],
    blocksXml: wrapXml(openScreen('BackMap2', 'Map', 20, 20)),
  }
  const cafe: ScreenData = {
    id: uid('screen'),
    name: 'Cafe',
    props: { Title: '小卖部', BackgroundColor: '#fce4ec' },
    root: page([
      kicker('难 · 小卖部'),
      card('HeroCard', '点心', [
        label('CafeTitle', '小卖部', 20, '#c2185b'),
        node('Spinner', 'SnackSpin', { ElementsFromString: '牛奶,面包,果汁', Selection: '牛奶' }),
        label('CafeTip', '选好点心就回地图吧', 13, '#ad1457'),
      ]),
      card('ActionCard', '返回', [
        button('BackMap3', '← 回地图', '#90a4ae'),
      ]),
    ]),
    nonVisible: [],
    blocksXml: wrapXml(openScreen('BackMap3', 'Map', 20, 20)),
  }
  return project('校园导览', [map, lab, library, cafe])
}

/** 任务链：大厅 → 接受任务 → 通关庆祝 */
export function createQuestChainTemplate(): AiProject {
  const hub: ScreenData = {
    id: uid('screen'),
    name: 'Hub',
    props: { Title: '任务大厅', BackgroundColor: '#ede7f6' },
    root: page([
      kicker('难 · 任务大厅'),
      card('HeroCard', '主线', [
        label('HubTitle', '今日任务', 22, '#4527a0'),
        node('Badge', 'QuestBadge', { Text: '主线' }),
        label('HubDesc', '帮助小精灵找回失落的星星', 14, '#5e35b1'),
      ]),
      card('ActionCard', '出发', [
        button('AcceptBtn', '接受任务', '#5e35b1'),
      ]),
      tip('多屏任务链：接任务 → 答题 → 通关。'),
    ]),
    nonVisible: [],
    blocksXml: wrapXml(openScreen('AcceptBtn', 'Mission', 20, 20)),
  }
  const mission: ScreenData = {
    id: uid('screen'),
    name: 'Mission',
    props: { Title: '执行任务', BackgroundColor: '#e8eaf6' },
    root: page([
      kicker('难 · 执行任务'),
      card('HeroCard', '题目', [
        label('QTitle', '问题：7+5=？', 20, '#283593'),
        label('MissionHint', '答对进入通关页', 13, '#5c6bc0'),
      ]),
      card('ActionCard', '作答', [
        node('NumberBox', 'AnsBox', { Hint: '填答案', Text: '' }),
        button('SubmitBtn', '提交', '#3949ab'),
        button('AbortBtn', '放弃回大厅', '#9fa8da'),
      ]),
    ]),
    nonVisible: [nv('Notifier', 'Notifier1')],
    blocksXml: wrapXml(`
      <block type="component_event" x="20" y="20">
        <field name="COMPONENT">SubmitBtn</field>
        <field name="EVENT">Click</field>
        <statement name="DO">
          <block type="controls_if">
            <mutation else="1"></mutation>
            <value name="IF0">
              <block type="logic_compare">
                <field name="OP">EQ</field>
                <value name="A"><block type="component_get_property"><field name="COMPONENT">AnsBox</field><field name="PROP">Text</field></block></value>
                <value name="B"><block type="text"><field name="TEXT">12</field></block></value>
              </block>
            </value>
            <statement name="DO0">
              <block type="control_open_screen"><field name="SCREEN">Clear</field></block>
            </statement>
            <statement name="ELSE">
              <block type="notifier_alert">
                <field name="COMPONENT">Notifier1</field>
                <value name="MESSAGE"><block type="text"><field name="TEXT">再想想：7+5=?</field></block></value>
              </block>
            </statement>
          </block>
        </statement>
      </block>
      ${openScreen('AbortBtn', 'Hub', 20, 280)}
    `),
  }
  const clear: ScreenData = {
    id: uid('screen'),
    name: 'Clear',
    props: { Title: '通关', BackgroundColor: '#e8f5e9' },
    root: page([
      kicker('难 · 通关'),
      card('HeroCard', '完成', [
        label('ClearTitle', '任务完成！', 24, '#1b5e20'),
        node('Image', 'ClearImg', { Width: 120, Height: 120, Picture: './media/sprite.png' }),
        label('ClearBody', '星星回家了。点下方撒花庆祝。', 14, '#388e3c'),
      ]),
      card('ActionCard', '庆祝', [
        button('PartyBtn', '撒花庆祝', '#43a047'),
        button('BackHub', '回任务大厅', '#81c784'),
      ]),
    ]),
    nonVisible: [nv('Celebration', 'Celebration1', {}), nv('Sound', 'Sound1', { Source: './media/chime.wav' })],
    blocksXml: wrapXml(`
      <block type="component_event" x="20" y="20">
        <field name="COMPONENT">PartyBtn</field>
        <field name="EVENT">Click</field>
        <statement name="DO">
          <block type="celebrate"><field name="COMPONENT">Celebration1</field>
            <next>
              <block type="sound_play"><field name="COMPONENT">Sound1</field></block>
            </next>
          </block>
        </statement>
      </block>
      ${openScreen('BackHub', 'Hub', 20, 160)}
    `),
  }
  return project('任务链闯关', [hub, mission, clear])
}
