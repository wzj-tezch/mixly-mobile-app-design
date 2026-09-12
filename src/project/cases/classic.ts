import type { AiProject, ScreenData, ComponentNode } from '../types'
import { uid, label, button, textBox, project, nv, node, kicker, page, card, hrow } from '../templateKit'

const counterBlocks = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" x="40" y="40">
    <field name="COMPONENT">ButtonPlus</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">CountLabel</field>
        <field name="PROP">Text</field>
        <value name="VALUE">
          <block type="math_arithmetic">
            <field name="OP">ADD</field>
            <value name="A"><block type="component_get_property"><field name="COMPONENT">CountLabel</field><field name="PROP">Text</field></block></value>
            <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
          </block>
        </value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="40" y="200">
    <field name="COMPONENT">ButtonMinus</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">CountLabel</field>
        <field name="PROP">Text</field>
        <value name="VALUE">
          <block type="math_arithmetic">
            <field name="OP">MINUS</field>
            <value name="A"><block type="component_get_property"><field name="COMPONENT">CountLabel</field><field name="PROP">Text</field></block></value>
            <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
          </block>
        </value>
      </block>
    </statement>
  </block>
</xml>`

export function createCounterTemplate(): AiProject {
  const screenId = uid('screen')
  const screen: ScreenData = {
    id: screenId,
    name: 'Screen1',
    props: { Title: '计数器', BackgroundColor: '#f8f9fa' },
    root: page([
      kicker('练习 · 加减'),
      card('HeroCard', '当前数字', [
        label('TitleLabel', '简单计数器', 14, '#5a7d78'),
        {
          ...label('CountLabel', '0', 48, '#1565c0'),
          props: { Text: '0', FontSize: 48, TextColor: '#1565c0', Width: '填满父组件', Height: '自动' },
        },
      ]),
      card('ActionCard', '点一点', [
        hrow('Acts', [
          button('ButtonPlus', '+1', '#2e7d32'),
          button('ButtonMinus', '-1', '#c62828'),
        ]),
        node('CheckBox', 'HintBox', { Text: '我学会加减了', Checked: false }),
        node('Spacer', 'Spacer1', { Height: 4 }),
      ]),
    ]),
    nonVisible: [],
    blocksXml: counterBlocks,
  }
  return project('计数器模板', [screen])
}

const ledgerBlocks = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">AddBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="tinydb_store">
        <field name="COMPONENT">TinyDB1</field>
        <value name="TAG"><block type="text"><field name="TEXT">last</field></block></value>
        <value name="VALUE"><block type="component_get_property"><field name="COMPONENT">AmountBox</field><field name="PROP">Text</field></block></value>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">LastLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE">
              <block type="text_join">
                <mutation items="2"></mutation>
                <value name="ADD0"><block type="text"><field name="TEXT">已记账: </field></block></value>
                <value name="ADD1"><block type="component_get_property"><field name="COMPONENT">AmountBox</field><field name="PROP">Text</field></block></value>
              </block>
            </value>
            <next>
              <block type="notifier_alert">
                <field name="COMPONENT">Notifier1</field>
                <value name="MESSAGE"><block type="text"><field name="TEXT">保存成功</field></block></value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="280">
    <field name="COMPONENT">LoadBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">LastLabel</field>
        <field name="PROP">Text</field>
        <value name="VALUE">
          <block type="text_join">
            <mutation items="2"></mutation>
            <value name="ADD0"><block type="text"><field name="TEXT">上次: </field></block></value>
            <value name="ADD1">
              <block type="tinydb_get">
                <field name="COMPONENT">TinyDB1</field>
                <value name="TAG"><block type="text"><field name="TEXT">last</field></block></value>
                <value name="DEFAULT"><block type="text"><field name="TEXT">无</field></block></value>
              </block>
            </value>
          </block>
        </value>
      </block>
    </statement>
  </block>
</xml>`

export function createLedgerTemplate(): AiProject {
  const screenId = uid('screen')
  const screen: ScreenData = {
    id: screenId,
    name: 'Screen1',
    props: { Title: '简单记账', BackgroundColor: '#f8f9fa' },
    root: page([
      kicker('练习 · 记账'),
      card('HeroCard', '上次记录', [
        label('TitleLabel', '简单记账', 14, '#5a7d78'),
        label('LastLabel', '上次: 无', 20, '#134e4a'),
      ]),
      card('ActionCard', '记一笔', [
        textBox('AmountBox', '输入金额'),
        node('Stepper', 'QtyStep', { Value: 1, MinValue: 1, MaxValue: 20 }),
        button('AddBtn', '记下这一笔'),
        button('LoadBtn', '读取上次', '#5f6368'),
      ]),
    ]),
    nonVisible: [nv('TinyDB', 'TinyDB1', { Namespace: 'ledger' }), nv('Notifier', 'Notifier1')],
    blocksXml: ledgerBlocks,
  }
  return project('记账模板', [screen])
}

const todoBlocks = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">AddBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="listview_set_elements">
        <field name="COMPONENT">TaskList</field>
        <value name="ELEMENTS">
          <block type="text_join">
            <mutation items="3"></mutation>
            <value name="ADD0"><block type="component_get_property"><field name="COMPONENT">TaskList</field><field name="PROP">ElementsFromString</field></block></value>
            <value name="ADD1"><block type="text"><field name="TEXT">,</field></block></value>
            <value name="ADD2"><block type="component_get_property"><field name="COMPONENT">ItemBox</field><field name="PROP">Text</field></block></value>
          </block>
        </value>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">ItemBox</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT"></field></block></value>
            <next>
              <block type="notifier_alert">
                <field name="COMPONENT">Notifier1</field>
                <value name="MESSAGE"><block type="text"><field name="TEXT">已添加</field></block></value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="280">
    <field name="COMPONENT">ClearBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="listview_set_elements">
        <field name="COMPONENT">TaskList</field>
        <value name="ELEMENTS"><block type="text"><field name="TEXT"></field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="420">
    <field name="COMPONENT">TaskList</field>
    <field name="EVENT">AfterPicking</field>
    <statement name="DO">
      <block type="notifier_alert">
        <field name="COMPONENT">Notifier1</field>
        <value name="MESSAGE">
          <block type="text_join">
            <mutation items="2"></mutation>
            <value name="ADD0"><block type="text"><field name="TEXT">选中: </field></block></value>
            <value name="ADD1"><block type="component_get_property"><field name="COMPONENT">TaskList</field><field name="PROP">Selection</field></block></value>
          </block>
        </value>
      </block>
    </statement>
  </block>
</xml>`

export function createTodoTemplate(): AiProject {
  const screenId = uid('screen')
  const screen: ScreenData = {
    id: screenId,
    name: 'Screen1',
    props: { Title: '待办清单', BackgroundColor: '#eef6ff' },
    root: page([
      kicker('练习 · 清单'),
      card('ActionCard', '新待办', [
        label('TitleLabel', '我的待办', 14, '#5a7d78'),
        node('SearchBar', 'SearchBar1', { Hint: '筛选待办…' }),
        textBox('ItemBox', '输入待办事项'),
        button('AddBtn', '添加', '#1565c0'),
        button('ClearBtn', '清空列表', '#5f6368'),
      ]),
      card('HeroCard', '列表', [
        {
          id: uid('list'),
          type: 'ListView',
          name: 'TaskList',
          props: { ElementsFromString: '买牛奶,写作业', Selection: '', Height: 200, Width: '填满父组件' },
          children: [],
          visible: true,
        },
        label('HintLabel', '点击列表项可查看选中内容', 13, '#5a7d78'),
      ]),
    ]),
    nonVisible: [nv('Notifier', 'Notifier1')],
    blocksXml: todoBlocks,
  }
  return project('待办清单', [screen])
}

const stopwatchBlocks = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">StartBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">RunFlag</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">1</field></block></value>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">StatusLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">计时中…</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="180">
    <field name="COMPONENT">PauseBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">RunFlag</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">0</field></block></value>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">StatusLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">已暂停</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="340">
    <field name="COMPONENT">ResetBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">RunFlag</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">0</field></block></value>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">TimeLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="math_number"><field name="NUM">0</field></block></value>
            <next>
              <block type="component_set_property">
                <field name="COMPONENT">StatusLabel</field>
                <field name="PROP">Text</field>
                <value name="VALUE"><block type="text"><field name="TEXT">已归零</field></block></value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="320" y="20">
    <field name="COMPONENT">Clock1</field>
    <field name="EVENT">Timer</field>
    <statement name="DO">
      <block type="controls_if">
        <value name="IF0">
          <block type="logic_compare">
            <field name="OP">EQ</field>
            <value name="A"><block type="component_get_property"><field name="COMPONENT">RunFlag</field><field name="PROP">Text</field></block></value>
            <value name="B"><block type="text"><field name="TEXT">1</field></block></value>
          </block>
        </value>
        <statement name="DO0">
          <block type="component_set_property">
            <field name="COMPONENT">TimeLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE">
              <block type="math_arithmetic">
                <field name="OP">ADD</field>
                <value name="A"><block type="component_get_property"><field name="COMPONENT">TimeLabel</field><field name="PROP">Text</field></block></value>
                <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
              </block>
            </value>
          </block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`

export function createStopwatchTemplate(): AiProject {
  const screenId = uid('screen')
  const screen: ScreenData = {
    id: screenId,
    name: 'Screen1',
    props: { Title: '秒表', BackgroundColor: '#f3f4f6' },
    root: page([
      kicker('练习 · 计时'),
      card('HeroCard', '用时', [
        label('TitleLabel', '简易秒表', 14, '#5a7d78'),
        {
          ...label('TimeLabel', '0', 48, '#1565c0'),
          props: { Text: '0', FontSize: 48, TextColor: '#1565c0', Width: '填满父组件', Height: '自动' },
        },
        label('StatusLabel', '点开始计时', 14, '#5a7d78'),
        node('Stopwatch', 'StopwatchWidget', { FontSize: 18 }),
      ]),
      card('ActionCard', '控制', [
        hrow('Acts', [
          button('StartBtn', '开始', '#2e7d32'),
          button('PauseBtn', '暂停', '#f9a825'),
          button('ResetBtn', '归零', '#c62828'),
        ]),
      ]),
      {
        ...label('RunFlag', '0', 1),
        props: { Text: '0', FontSize: 1, TextColor: 'transparent', Width: '自动', Height: '自动' },
      },
    ]),
    nonVisible: [nv('Clock', 'Clock1', { TimerEnabled: true, TimerInterval: 1000 })],
    blocksXml: stopwatchBlocks,
  }
  return project('秒表模板', [screen])
}

const homeBlocks = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" x="40" y="40">
    <field name="COMPONENT">GoAbout</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="control_open_screen">
        <field name="SCREEN">About</field>
      </block>
    </statement>
  </block>
  <block type="component_event" x="40" y="160">
    <field name="COMPONENT">HelloBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="notifier_alert">
        <field name="COMPONENT">Notifier1</field>
        <value name="MESSAGE">
          <block type="text_join">
            <mutation items="2"></mutation>
            <value name="ADD0"><block type="text"><field name="TEXT">你好，</field></block></value>
            <value name="ADD1"><block type="component_get_property"><field name="COMPONENT">NameBox</field><field name="PROP">Text</field></block></value>
          </block>
        </value>
      </block>
    </statement>
  </block>
</xml>`

const aboutBlocks = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" x="40" y="40">
    <field name="COMPONENT">BackHome</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="control_open_screen">
        <field name="SCREEN">Home</field>
      </block>
    </statement>
  </block>
</xml>`

export function createNavTemplate(): AiProject {
  const homeId = uid('screen')
  const aboutId = uid('screen')
  const home: ScreenData = {
    id: homeId,
    name: 'Home',
    props: { Title: '首页', BackgroundColor: '#f0fdf4' },
    root: page([
      kicker('难 · 多屏'),
      card('HeroCard', '首页', [
        label('Welcome', '欢迎使用多屏示例', 22, '#134e4a'),
        node('TabBar', 'TabBar1', { ElementsFromString: '首页,关于', Selection: '首页' }),
      ]),
      card('ActionCard', '打个招呼', [
        textBox('NameBox', '输入你的名字'),
        button('HelloBtn', '打个招呼', '#2e7d32'),
        button('GoAbout', '前往关于页', '#1565c0'),
      ]),
    ]),
    nonVisible: [nv('Notifier', 'Notifier1')],
    blocksXml: homeBlocks,
  }
  const about: ScreenData = {
    id: aboutId,
    name: 'About',
    props: { Title: '关于', BackgroundColor: '#eff6ff' },
    root: page([
      kicker('难 · 关于页'),
      card('HeroCard', '说明', [
        label('AboutTitle', '关于本应用', 22, '#134e4a'),
        label('AboutBody', '这是第二个屏幕。可用「打开另一屏幕」积木切换。', 14, '#5a7d78'),
      ]),
      card('ActionCard', '返回', [
        button('BackHome', '返回首页', '#5f6368'),
      ]),
    ]),
    nonVisible: [],
    blocksXml: aboutBlocks,
  }
  return project('多屏导航', [home, about])
}

const drawBlocks = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">DrawBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="canvas_draw_line">
        <field name="COMPONENT">Canvas1</field>
        <value name="X1"><block type="math_number"><field name="NUM">20</field></block></value>
        <value name="Y1"><block type="math_number"><field name="NUM">20</field></block></value>
        <value name="X2"><block type="math_number"><field name="NUM">260</field></block></value>
        <value name="Y2"><block type="math_number"><field name="NUM">160</field></block></value>
        <value name="COLOR"><block type="text"><field name="TEXT">#0b57d0</field></block></value>
        <next>
          <block type="canvas_draw_line">
            <field name="COMPONENT">Canvas1</field>
            <value name="X1"><block type="math_number"><field name="NUM">20</field></block></value>
            <value name="Y1"><block type="math_number"><field name="NUM">160</field></block></value>
            <value name="X2"><block type="math_number"><field name="NUM">260</field></block></value>
            <value name="Y2"><block type="math_number"><field name="NUM">20</field></block></value>
            <value name="COLOR"><block type="text"><field name="TEXT">#ea4335</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="260">
    <field name="COMPONENT">ClearBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="canvas_clear">
        <field name="COMPONENT">Canvas1</field>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="380">
    <field name="COMPONENT">Canvas1</field>
    <field name="EVENT">Touched</field>
    <statement name="DO">
      <block type="notifier_alert">
        <field name="COMPONENT">Notifier1</field>
        <value name="MESSAGE"><block type="text"><field name="TEXT">画布被点按了</field></block></value>
      </block>
    </statement>
  </block>
</xml>`

export function createDrawTemplate(): AiProject {
  const screenId = uid('screen')
  const screen: ScreenData = {
    id: screenId,
    name: 'Screen1',
    props: { Title: '画板', BackgroundColor: '#fafafa' },
    root: page([
      kicker('难 · 画布'),
      card('HeroCard', '画板', [
        label('TitleLabel', '画布示例', 14, '#5a7d78'),
        {
          id: uid('canvas'),
          type: 'Canvas',
          name: 'Canvas1',
          props: { BackgroundColor: '#f7fbfa', Width: '填满父组件', Height: 220 },
          children: [],
          visible: true,
        },
        label('HintLabel', '也可点按画布触发 Touched 事件', 13, '#5a7d78'),
      ]),
      card('ActionCard', '画一笔', [
        node('ColorPicker', 'ColorPicker1', { Color: '#1565c0' }),
        button('DrawBtn', '画两条线', '#1565c0'),
        button('ClearBtn', '清空画布', '#5f6368'),
      ]),
    ]),
    nonVisible: [nv('Notifier', 'Notifier1'), nv('ImageSprite', 'SpriteHint', {})],
    blocksXml: drawBlocks,
  }
  return project('画板模板', [screen])
}

const quizHomeBlocks = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">AnsA</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">ScoreBox</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">0</field></block></value>
        <next>
          <block type="control_open_screen"><field name="SCREEN">Result</field></block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="180">
    <field name="COMPONENT">AnsB</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">ScoreBox</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">100</field></block></value>
        <next>
          <block type="control_open_screen"><field name="SCREEN">Result</field></block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="340">
    <field name="COMPONENT">AnsC</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">ScoreBox</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">0</field></block></value>
        <next>
          <block type="control_open_screen"><field name="SCREEN">Result</field></block>
        </next>
      </block>
    </statement>
  </block>
</xml>`

const quizResultBlocks = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">AgainBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="control_open_screen"><field name="SCREEN">Quiz</field></block>
    </statement>
  </block>
</xml>`

export function createQuizTemplate(): AiProject {
  const quizId = uid('screen')
  const resultId = uid('screen')
  const quiz: ScreenData = {
    id: quizId,
    name: 'Quiz',
    props: { Title: '小测验', BackgroundColor: '#fff7ed' },
    root: page([
      kicker('难 · 问答'),
      card('HeroCard', '题目', [
        label('QTitle', '小测验', 14, '#5a7d78'),
        label('Question', '太阳系中体积最大的行星是？', 18, '#134e4a'),
        node('RadioButton', 'RadioHint', { Text: '提示：是气态巨星', GroupName: 'hint', Checked: false }),
      ]),
      card('ActionCard', '选择', [
        button('AnsA', 'A. 地球', '#607d8b'),
        button('AnsB', 'B. 木星', '#1565c0'),
        button('AnsC', 'C. 火星', '#607d8b'),
      ]),
      {
        ...label('ScoreBox', '0', 1),
        props: { Text: '0', FontSize: 1, TextColor: 'transparent', Width: '自动', Height: '自动' },
      },
    ]),
    nonVisible: [],
    blocksXml: quizHomeBlocks,
  }
  const result: ScreenData = {
    id: resultId,
    name: 'Result',
    props: { Title: '结果', BackgroundColor: '#ecfdf5' },
    root: page([
      kicker('难 · 结果'),
      card('HeroCard', '揭晓', [
        label('RTitle', '答题结果', 22, '#1b5e20'),
        label('RBody', '正确答案是木星。点「再答一次」返回。', 15, '#388e3c'),
      ]),
      card('ActionCard', '再来', [
        button('AgainBtn', '再答一次', '#2e7d32'),
      ]),
    ]),
    nonVisible: [nv('Celebration', 'Celebration1', {}), nv('ScoreBoard', 'ScoreBoard1', { Title: '分', Score: 0 })],
    blocksXml: quizResultBlocks,
  }
  return project('问答测验', [quiz, result])
}

/** 课题：拍照贴图（媒体 / 真机相机） */
export function createCameraTemplate(): AiProject {
  const cam: ComponentNode = {
    id: uid('cam'),
    type: 'Camera',
    name: 'Camera1',
    props: { Picture: '' },
    children: [],
    visible: false,
  }
  const img: ComponentNode = {
    id: uid('img'),
    type: 'Image',
    name: 'PhotoImage',
    props: { Picture: './media/photo.png', Width: 280, Height: 200 },
    children: [],
    visible: true,
  }
  const blocks = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" x="40" y="40">
    <field name="COMPONENT">ShotBtn</field><field name="EVENT">Click</field>
    <statement name="DO">
      <block type="camera_take_picture">
        <field name="COMPONENT">Camera1</field>
        <field name="IMAGE">PhotoImage</field>
      </block>
    </statement>
  </block>
</xml>`
  return project('课题·拍照贴图', [
    {
      id: uid('screen'),
      name: 'Screen1',
      props: { Title: '拍照贴图', BackgroundColor: '#eef6f4' },
      root: page([
        kicker('拓展 · 相机'),
        card('HeroCard', '照片', [img]),
        card('ActionCard', '拍摄', [
          button('ShotBtn', '拍照 / 选图', '#009688'),
          node('VideoPlayer', 'VideoPlayer1', { Height: 90 }),
        ]),
        label('Tip', '电脑上会弹出选图；真机 APK 才调相机。', 13, '#5a7d78'),
      ]),
      nonVisible: [cam, nv('GalleryPicker', 'GalleryPicker1', {}), nv('Sound', 'Sound1', {})],
      blocksXml: blocks,
    },
  ])
}

/** 课题：摇一摇计数（加速度） */
export function createShakeCountTemplate(): AiProject {
  const accel: ComponentNode = {
    id: uid('acc'),
    type: 'AccelerometerSensor',
    name: 'Accelerometer1',
    props: { Enabled: true },
    children: [],
    visible: false,
  }
  const blocks = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" x="40" y="40">
    <field name="COMPONENT">PlusBtn</field><field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">CountLabel</field><field name="PROP">Text</field>
        <value name="VALUE">
          <block type="math_arithmetic">
            <field name="OP">ADD</field>
            <value name="A"><block type="component_get_property"><field name="COMPONENT">CountLabel</field><field name="PROP">Text</field></block></value>
            <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
          </block>
        </value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="40" y="200">
    <field name="COMPONENT">ResetBtn</field><field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">CountLabel</field><field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">0</field></block></value>
        <next>
          <block type="pedometer_reset"><field name="COMPONENT">Pedometer1</field></block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="40" y="360">
    <field name="COMPONENT">ShakeSensor1</field><field name="EVENT">Shaking</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">CountLabel</field><field name="PROP">Text</field>
        <value name="VALUE">
          <block type="math_arithmetic">
            <field name="OP">ADD</field>
            <value name="A"><block type="component_get_property"><field name="COMPONENT">CountLabel</field><field name="PROP">Text</field></block></value>
            <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
          </block>
        </value>
        <next>
          <block type="vibrate">
            <field name="COMPONENT">Vibrator1</field>
            <value name="MS"><block type="math_number"><field name="NUM">120</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>
</xml>`
  return project('课题·摇动计数入门', [
    {
      id: uid('screen'),
      name: 'Screen1',
      props: { Title: '摇动计数', BackgroundColor: '#fff' },
      root: page([
        kicker('中等 · 摇一摇'),
        card('HeroCard', '次数', [
          {
            ...label('CountLabel', '0', 48, '#00796b'),
            props: { Text: '0', FontSize: 48, TextColor: '#00796b', Width: '填满父组件', Height: '自动' },
          },
        ]),
        card('ActionCard', '计数', [
          button('PlusBtn', '+1', '#009688'),
          button('ResetBtn', '清零', '#5a726c'),
        ]),
        label('Hint', '先点「+1」熟悉逻辑；真机摇一摇也会 +1。', 13, '#5a7d78'),
      ]),
      nonVisible: [
        accel,
        nv('ShakeSensor', 'ShakeSensor1', { Enabled: true }),
        nv('Pedometer', 'Pedometer1', { Enabled: true }),
        nv('GyroscopeSensor', 'GyroscopeSensor1', { Enabled: true }),
        nv('ProximitySensor', 'ProximitySensor1', { Enabled: true }),
        nv('LightSensor', 'LightSensor1', { Enabled: true }),
        nv('MagneticFieldSensor', 'MagneticFieldSensor1', { Enabled: true }),
        nv('OrientationSensor', 'OrientationSensor1', { Enabled: true }),
        nv('Vibrator', 'Vibrator1', {}),
        nv('PhoneCall', 'PhoneCall1', {}),
        nv('BatterySensor', 'BatterySensor1', { Enabled: true }),
        nv('NetworkSensor', 'NetworkSensor1', { Enabled: true }),
        nv('LocationSensor', 'LocationSensor1', { Enabled: false }),
      ],
      blocksXml: blocks,
    },
  ])
}

export function createNotepadTemplate(): AiProject {
  const blocks = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" x="30" y="20">
    <field name="COMPONENT">SaveBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="note_save">
        <field name="COMPONENT">NotePad1</field>
        <value name="TITLE"><block type="component_get_property"><field name="COMPONENT">TitleBox</field><field name="PROP">Text</field></block></value>
        <value name="CONTENT"><block type="component_get_property"><field name="COMPONENT">BodyBox</field><field name="PROP">Text</field></block></value>
        <next>
          <block type="note_list"><field name="COMPONENT">NotePad1</field></block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="30" y="200">
    <field name="COMPONENT">NotePad1</field>
    <field name="EVENT">AfterList</field>
    <statement name="DO">
      <block type="listview_set_elements">
        <field name="COMPONENT">NoteList</field>
        <value name="ELEMENTS"><block type="component_get_property"><field name="COMPONENT">NotePad1</field><field name="PROP">Titles</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="30" y="340">
    <field name="COMPONENT">NoteList</field>
    <field name="EVENT">AfterPicking</field>
    <statement name="DO">
      <block type="note_load">
        <field name="COMPONENT">NotePad1</field>
        <value name="TITLE"><block type="component_get_property"><field name="COMPONENT">NoteList</field><field name="PROP">Selection</field></block></value>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">TitleBox</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="component_get_property"><field name="COMPONENT">NotePad1</field><field name="PROP">Title</field></block></value>
            <next>
              <block type="component_set_property">
                <field name="COMPONENT">BodyBox</field>
                <field name="PROP">Text</field>
                <value name="VALUE"><block type="component_get_property"><field name="COMPONENT">NotePad1</field><field name="PROP">Content</field></block></value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="30" y="560">
    <field name="COMPONENT">RefreshBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="note_list"><field name="COMPONENT">NotePad1</field></block>
    </statement>
  </block>
</xml>`
  return project('记事本', [
    {
      id: uid('screen'),
      name: 'Screen1',
      props: { Title: '我的记事本', BackgroundColor: '#f7fcfb' },
      root: page([
        kicker('练习 · 笔记'),
        card('ActionCard', '写一条', [
          textBox('TitleBox', '笔记标题'),
          node('PasswordTextBox', 'LockHint', { Hint: '可选：练习密码框' }),
          node('TimePicker', 'TimePicker1', {}),
          {
            id: uid('ta'),
            type: 'TextArea',
            name: 'BodyBox',
            props: { Text: '', Hint: '写点什么…', Height: 140, Width: '填满父组件', Enabled: true },
            children: [],
            visible: true,
          },
          button('SaveBtn', '保存到笔记库', '#009688'),
          button('RefreshBtn', '刷新列表', '#5a726c'),
        ]),
        card('HeroCard', '笔记库', [
          node('ScrollArrangement', 'ScrollNotes', { Height: 160, BackgroundColor: '#f7fcfb' }, [
            {
              id: uid('lv'),
              type: 'ListView',
              name: 'NoteList',
              props: { ElementsFromString: '', Width: '填满父组件', Height: 140 },
              children: [],
              visible: true,
            },
          ]),
        ]),
        label('Tip', '写标题与正文 → 保存；点下方列表可重新打开。', 13, '#5a7d78'),
      ]),
      nonVisible: [nv('NotePad', 'NotePad1', { Namespace: 'classroom_notes' })],
      blocksXml: blocks,
    },
  ])
}

export function createFileSearchTemplate(): AiProject {
  const blocks = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">PickBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="file_pick_multi"><field name="COMPONENT">FilePicker1</field></block>
    </statement>
  </block>
  <block type="component_event" x="20" y="140">
    <field name="COMPONENT">FilePicker1</field>
    <field name="EVENT">AfterPicking</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">DocBox</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="component_get_property"><field name="COMPONENT">FilePicker1</field><field name="PROP">CombinedText</field></block></value>
        <next>
          <block type="notifier_alert">
            <field name="COMPONENT">Notifier1</field>
            <value name="MESSAGE"><block type="text"><field name="TEXT">文件已载入，可输入关键词搜索</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="340">
    <field name="COMPONENT">SearchBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="workshop_search">
        <field name="COMPONENT">TextWorkshop1</field>
        <value name="TEXT"><block type="component_get_property"><field name="COMPONENT">DocBox</field><field name="PROP">Text</field></block></value>
        <value name="KEYWORD"><block type="component_get_property"><field name="COMPONENT">KeyBox</field><field name="PROP">Text</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="500">
    <field name="COMPONENT">TextWorkshop1</field>
    <field name="EVENT">GotResult</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">ResultBox</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="component_get_property"><field name="COMPONENT">TextWorkshop1</field><field name="PROP">ResultLines</field></block></value>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">CountLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE">
              <block type="text_join">
                <mutation items="2"></mutation>
                <value name="ADD0"><block type="text"><field name="TEXT">命中行数：</field></block></value>
                <value name="ADD1"><block type="component_get_property"><field name="COMPONENT">TextWorkshop1</field><field name="PROP">ResultCount</field></block></value>
              </block>
            </value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="700">
    <field name="COMPONENT">ShuffleBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="workshop_shuffle">
        <field name="COMPONENT">TextWorkshop1</field>
        <value name="TEXT"><block type="component_get_property"><field name="COMPONENT">DocBox</field><field name="PROP">Text</field></block></value>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">DocBox</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="component_get_property"><field name="COMPONENT">TextWorkshop1</field><field name="PROP">ResultText</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="880">
    <field name="COMPONENT">ExportBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="file_save">
        <field name="COMPONENT">FileSaver1</field>
        <value name="CONTENT"><block type="component_get_property"><field name="COMPONENT">ResultBox</field><field name="PROP">Text</field></block></value>
        <value name="NAME"><block type="text"><field name="TEXT">search-result.txt</field></block></value>
      </block>
    </statement>
  </block>
</xml>`
  return project('课题·文件搜索', [
    {
      id: uid('screen'),
      name: 'Screen1',
      props: { Title: '文件搜索工坊', BackgroundColor: '#fff' },
      root: page([
        kicker('难 · 文本工坊'),
        card('ActionCard', '载入与搜索', [
          button('PickBtn', '选择文件（可多选）', '#009688'),
          textBox('KeyBox', '搜索关键词'),
          button('SearchBtn', '搜索匹配行', '#1565c0'),
          button('ShuffleBtn', '打乱全文行（趣味）', '#6a1b9a'),
        ]),
        card('HeroCard', '命中', [
          label('CountLabel', '命中行数：0', 20, '#00796b'),
          {
            id: uid('ta1'),
            type: 'TextArea',
            name: 'DocBox',
            props: { Text: '', Hint: '载入的文件内容', Height: 120, Width: '填满父组件', Enabled: true },
            children: [],
            visible: true,
          },
          {
            id: uid('ta2'),
            type: 'TextArea',
            name: 'ResultBox',
            props: { Text: '', Hint: '搜索结果', Height: 100, Width: '填满父组件', Enabled: true },
            children: [],
            visible: true,
          },
        ]),
        card('ExportCard', '导出', [
          button('ExportBtn', '导出搜索结果', '#5a726c'),
        ]),
        label('Tip', '选多个 txt/csv → 搜索关键词 → 可打乱或导出结果。', 13, '#5a7d78'),
      ]),
      nonVisible: [
        nv('FilePicker', 'FilePicker1', { Accept: '.txt,.csv,.md,.json,text/*', Multiple: true }),
        nv('FolderPicker', 'FolderPicker1', {}),
        nv('TextWorkshop', 'TextWorkshop1', {}),
        nv('FileSaver', 'FileSaver1', { FileName: 'search-result.txt' }),
        nv('Notifier', 'Notifier1', {}),
        nv('NotePad', 'NotePad1', { Namespace: 'file_search_notes' }),
        nv('Web', 'Web1', {}),
      ],
      blocksXml: blocks,
    },
  ])
}

