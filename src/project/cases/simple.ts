import type { AiProject } from '../types'
import {
  tip, label, button, project, node, hrow, wrapXml, nv, uid, clickThenMethod, card,
  kicker, page,
} from '../templateKit'

export function createTapFrenzyTemplate(): AiProject {
  const blocks = wrapXml(`
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">TapBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">ScoreLabel</field>
        <field name="PROP">Text</field>
        <value name="VALUE">
          <block type="math_arithmetic">
            <field name="OP">ADD</field>
            <value name="A"><block type="component_get_property"><field name="COMPONENT">ScoreLabel</field><field name="PROP">Text</field></block></value>
            <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
          </block>
        </value>
        <next>
          <block type="controls_if">
            <value name="IF0">
              <block type="logic_compare">
                <field name="OP">GTE</field>
                <value name="A"><block type="component_get_property"><field name="COMPONENT">ScoreLabel</field><field name="PROP">Text</field></block></value>
                <value name="B"><block type="math_number"><field name="NUM">20</field></block></value>
              </block>
            </value>
            <statement name="DO0">
              <block type="celebrate"><field name="COMPONENT">Celebration1</field>
                <next>
                  <block type="component_set_property">
                    <field name="COMPONENT">TipLabel</field>
                    <field name="PROP">Text</field>
                    <value name="VALUE"><block type="text"><field name="TEXT">太强了！20 分达成！</field></block></value>
                  </block>
                </next>
              </block>
            </statement>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="280">
    <field name="COMPONENT">ResetBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">ScoreLabel</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">0</field></block></value>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">TipLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">再来一把！</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>`)
  return project('狂点挑战', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '狂点挑战', BackgroundColor: '#fff3e0' },
    root: page([
      kicker('简单 · 限时手速'),
      card('HeroCard', '当前分数', [
        label('ScoreLabel', '0', 48, '#e65100'),
        label('TipLabel', '目标：20 分', 14, '#8d6e63'),
      ]),
      card('ActionCard', '开练', [
        button('TapBtn', '狂点！', '#ef6c00'),
        button('ResetBtn', '再来一把', '#8d6e63'),
        node('ToggleButton', 'BoostBtn', { Text: '加速模式（装饰）' }),
      ]),
      tip('到 20 分会撒花。删掉积木再点应无反应。'),
    ]),
    nonVisible: [nv('Celebration', 'Celebration1', {})],
    blocksXml: blocks,
  }])
}

export function createRpsDuelTemplate(): AiProject {
  // 出拳：记下 0/1/2（石/剪/布）并掷骰；Rolled 后 (点数-1)%3 为电脑，再比胜负
  const pick = (btn: string, name: string, code: number, y: number) => `
  <block type="component_event" x="20" y="${y}">
    <field name="COMPONENT">${btn}</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">MyLabel</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">你：${name}</field></block></value>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">ChoiceStore</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="math_number"><field name="NUM">${code}</field></block></value>
            <next>
              <block type="dice_roll"><field name="COMPONENT">Dice1</field></block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>`
  const blocks = wrapXml(`
  ${pick('RockBtn', '石头', 0, 20)}
  ${pick('ScissorBtn', '剪刀', 1, 180)}
  ${pick('PaperBtn', '布', 2, 340)}
  <block type="component_event" x="20" y="500">
    <field name="COMPONENT">Dice1</field>
    <field name="EVENT">Rolled</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">CpuCode</field>
        <field name="PROP">Text</field>
        <value name="VALUE">
          <block type="math_modulo">
            <value name="DIVIDEND">
              <block type="math_arithmetic">
                <field name="OP">MINUS</field>
                <value name="A"><block type="component_get_property"><field name="COMPONENT">Dice1</field><field name="PROP">Result</field></block></value>
                <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
              </block>
            </value>
            <value name="DIVISOR"><block type="math_number"><field name="NUM">3</field></block></value>
          </block>
        </value>
        <next>
          <block type="controls_if">
            <mutation elseif="2" else="1"></mutation>
            <value name="IF0">
              <block type="logic_compare">
                <field name="OP">EQ</field>
                <value name="A"><block type="component_get_property"><field name="COMPONENT">CpuCode</field><field name="PROP">Text</field></block></value>
                <value name="B"><block type="math_number"><field name="NUM">0</field></block></value>
              </block>
            </value>
            <statement name="DO0">
              <block type="component_set_property">
                <field name="COMPONENT">CpuLabel</field>
                <field name="PROP">Text</field>
                <value name="VALUE"><block type="text"><field name="TEXT">电脑：石头</field></block></value>
              </block>
            </statement>
            <value name="IF1">
              <block type="logic_compare">
                <field name="OP">EQ</field>
                <value name="A"><block type="component_get_property"><field name="COMPONENT">CpuCode</field><field name="PROP">Text</field></block></value>
                <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
              </block>
            </value>
            <statement name="DO1">
              <block type="component_set_property">
                <field name="COMPONENT">CpuLabel</field>
                <field name="PROP">Text</field>
                <value name="VALUE"><block type="text"><field name="TEXT">电脑：剪刀</field></block></value>
              </block>
            </statement>
            <value name="IF2">
              <block type="logic_compare">
                <field name="OP">EQ</field>
                <value name="A"><block type="component_get_property"><field name="COMPONENT">CpuCode</field><field name="PROP">Text</field></block></value>
                <value name="B"><block type="math_number"><field name="NUM">2</field></block></value>
              </block>
            </value>
            <statement name="DO2">
              <block type="component_set_property">
                <field name="COMPONENT">CpuLabel</field>
                <field name="PROP">Text</field>
                <value name="VALUE"><block type="text"><field name="TEXT">电脑：布</field></block></value>
              </block>
            </statement>
            <statement name="ELSE">
              <block type="component_set_property">
                <field name="COMPONENT">CpuLabel</field>
                <field name="PROP">Text</field>
                <value name="VALUE"><block type="text"><field name="TEXT">电脑：？</field></block></value>
              </block>
            </statement>
            <next>
              <block type="controls_if">
                <mutation elseif="1" else="1"></mutation>
                <value name="IF0">
                  <block type="logic_compare">
                    <field name="OP">EQ</field>
                    <value name="A"><block type="component_get_property"><field name="COMPONENT">ChoiceStore</field><field name="PROP">Text</field></block></value>
                    <value name="B"><block type="component_get_property"><field name="COMPONENT">CpuCode</field><field name="PROP">Text</field></block></value>
                  </block>
                </value>
                <statement name="DO0">
                  <block type="component_set_property">
                    <field name="COMPONENT">ResultLabel</field>
                    <field name="PROP">Text</field>
                    <value name="VALUE"><block type="text"><field name="TEXT">平局！再来</field></block></value>
                    <next>
                      <block type="component_set_property">
                        <field name="COMPONENT">Badge1</field>
                        <field name="PROP">Text</field>
                        <value name="VALUE"><block type="text"><field name="TEXT">平</field></block></value>
                      </block>
                    </next>
                  </block>
                </statement>
                <value name="IF1">
                  <block type="logic_compare">
                    <field name="OP">EQ</field>
                    <value name="A">
                      <block type="math_modulo">
                        <value name="DIVIDEND">
                          <block type="math_arithmetic">
                            <field name="OP">ADD</field>
                            <value name="A">
                              <block type="math_arithmetic">
                                <field name="OP">MINUS</field>
                                <value name="A"><block type="component_get_property"><field name="COMPONENT">CpuCode</field><field name="PROP">Text</field></block></value>
                                <value name="B"><block type="component_get_property"><field name="COMPONENT">ChoiceStore</field><field name="PROP">Text</field></block></value>
                              </block>
                            </value>
                            <value name="B"><block type="math_number"><field name="NUM">3</field></block></value>
                          </block>
                        </value>
                        <value name="DIVISOR"><block type="math_number"><field name="NUM">3</field></block></value>
                      </block>
                    </value>
                    <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                  </block>
                </value>
                <statement name="DO1">
                  <block type="component_set_property">
                    <field name="COMPONENT">ResultLabel</field>
                    <field name="PROP">Text</field>
                    <value name="VALUE"><block type="text"><field name="TEXT">你赢了！</field></block></value>
                    <next>
                      <block type="component_set_property">
                        <field name="COMPONENT">Badge1</field>
                        <field name="PROP">Text</field>
                        <value name="VALUE"><block type="text"><field name="TEXT">胜</field></block></value>
                        <next>
                          <block type="celebrate"><field name="COMPONENT">Celebration1</field></block>
                        </next>
                      </block>
                    </next>
                  </block>
                </statement>
                <statement name="ELSE">
                  <block type="component_set_property">
                    <field name="COMPONENT">ResultLabel</field>
                    <field name="PROP">Text</field>
                    <value name="VALUE"><block type="text"><field name="TEXT">电脑赢了…再试</field></block></value>
                    <next>
                      <block type="component_set_property">
                        <field name="COMPONENT">Badge1</field>
                        <field name="PROP">Text</field>
                        <value name="VALUE"><block type="text"><field name="TEXT">负</field></block></value>
                      </block>
                    </next>
                  </block>
                </statement>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>`)
  return project('石头剪刀布', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '石头剪刀布', BackgroundColor: '#e3f2fd' },
    root: page([
      kicker('难 · 猜拳算法'),
      card('HeroCard', '对战台', [
        hrow('Av', [
          node('Avatar', 'Avatar1', { Text: '我', Size: 44 }),
          node('Badge', 'Badge1', { Text: 'VS' }),
        ]),
        label('MyLabel', '你：？', 18, '#1565c0'),
        label('CpuLabel', '电脑：？', 18, '#37474f'),
        label('ResultLabel', '先出拳吧', 16, '#0d47a1'),
      ]),
      card('ActionCard', '出拳', [
        hrow('Btns', [
          button('RockBtn', '石头', '#1976d2'),
          button('ScissorBtn', '剪刀', '#0288d1'),
          button('PaperBtn', '布', '#00838f'),
        ]),
        node('Dice', 'Dice1', {}),
      ]),
      label('ChoiceStore', '0', 1, '#e3f2fd'),
      label('CpuCode', '0', 1, '#e3f2fd'),
      tip('出拳 → 掷骰映射 → 取余判胜负。适合研究分支。'),
    ]),
    nonVisible: [nv('Celebration', 'Celebration1', {}), nv('Notifier', 'Notifier1')],
    blocksXml: blocks,
  }])
}

export function createMoodBulbTemplate(): AiProject {
  const blocks = wrapXml(`
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">Switch1</field>
    <field name="EVENT">Changed</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">LightBulb1</field>
        <field name="PROP">On</field>
        <value name="VALUE"><block type="component_get_property"><field name="COMPONENT">Switch1</field><field name="PROP">On</field></block></value>
        <next>
          <block type="controls_if">
            <mutation else="1"></mutation>
            <value name="IF0"><block type="component_get_property"><field name="COMPONENT">Switch1</field><field name="PROP">On</field></block></value>
            <statement name="DO0">
              <block type="component_set_property">
                <field name="COMPONENT">MoodLabel</field>
                <field name="PROP">Text</field>
                <value name="VALUE"><block type="text"><field name="TEXT">灯亮了，心情也亮了</field></block></value>
              </block>
            </statement>
            <statement name="ELSE">
              <block type="component_set_property">
                <field name="COMPONENT">MoodLabel</field>
                <field name="PROP">Text</field>
                <value name="VALUE"><block type="text"><field name="TEXT">关灯休息一下</field></block></value>
              </block>
            </statement>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="280">
    <field name="COMPONENT">ColorBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">MoodLabel</field>
        <field name="PROP">TextColor</field>
        <value name="VALUE"><block type="component_get_property"><field name="COMPONENT">ColorPicker1</field><field name="PROP">Color</field></block></value>
      </block>
    </statement>
  </block>`)
  return project('心情灯泡', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '心情灯泡', BackgroundColor: '#fff8e1' },
    root: page([
      kicker('简单 · 开关与颜色'),
      card('HeroCard', '这盏灯', [
        hrow('Top', [
          node('Avatar', 'Avatar1', { Text: '心', Size: 44 }),
          node('ToggleButton', 'FavBtn', { Text: '收藏这盏灯' }),
        ]),
        node('LightBulb', 'LightBulb1', { On: false }),
        label('MoodLabel', '关灯休息一下', 16, '#5d4037'),
      ]),
      card('ActionCard', '控制', [
        node('Switch', 'Switch1', { Text: '电源', On: false }),
        node('ColorPicker', 'ColorPicker1', { Color: '#ff8f00' }),
        button('ColorBtn', '换心情色', '#f9a825'),
      ]),
      tip('拨开关点灯；选颜色后再点「换心情色」。'),
    ]),
    nonVisible: [],
    blocksXml: blocks,
  }])
}

export function createChargeDashTemplate(): AiProject {
  const blocks = wrapXml(`
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">Slider1</field>
    <field name="EVENT">PositionChanged</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">ProgressBar1</field>
        <field name="PROP">Progress</field>
        <value name="VALUE"><block type="component_get_property"><field name="COMPONENT">Slider1</field><field name="PROP">ThumbPosition</field></block></value>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">ProgressRing1</field>
            <field name="PROP">Percent</field>
            <value name="VALUE"><block type="component_get_property"><field name="COMPONENT">Slider1</field><field name="PROP">ThumbPosition</field></block></value>
            <next>
              <block type="component_set_property">
                <field name="COMPONENT">PowerLabel</field>
                <field name="PROP">Text</field>
                <value name="VALUE">
                  <block type="text_join">
                    <mutation items="2"></mutation>
                    <value name="ADD0"><block type="text"><field name="TEXT">蓄力 </field></block></value>
                    <value name="ADD1"><block type="component_get_property"><field name="COMPONENT">Slider1</field><field name="PROP">ThumbPosition</field></block></value>
                  </block>
                </value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="260">
    <field name="COMPONENT">DashBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="controls_if">
        <mutation else="1"></mutation>
        <value name="IF0">
          <block type="logic_compare">
            <field name="OP">GTE</field>
            <value name="A"><block type="component_get_property"><field name="COMPONENT">Slider1</field><field name="PROP">ThumbPosition</field></block></value>
            <value name="B"><block type="math_number"><field name="NUM">90</field></block></value>
          </block>
        </value>
        <statement name="DO0">
          <block type="component_set_property">
            <field name="COMPONENT">ResultLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">冲刺成功！嗖——</field></block></value>
            <next>
              <block type="celebrate"><field name="COMPONENT">Celebration1</field></block>
            </next>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="component_set_property">
            <field name="COMPONENT">ResultLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">蓄力不足，再拉高一点！</field></block></value>
          </block>
        </statement>
      </block>
    </statement>
  </block>`)
  return project('蓄力冲刺', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '蓄力冲刺', BackgroundColor: '#e8f5e9' },
    root: page([
      kicker('中等 · 蓄力判断'),
      card('HeroCard', '能量', [
        label('PowerLabel', '蓄力 20', 22, '#1b5e20'),
        node('ProgressRing', 'ProgressRing1', { Percent: 20 }),
        node('ProgressBar', 'ProgressBar1', { Progress: 20 }),
        label('ResultLabel', '蓄力中…', 14, '#2e7d32'),
      ]),
      card('ActionCard', '拉满再冲', [
        node('Slider', 'Slider1', { MinValue: 0, MaxValue: 100, ThumbPosition: 20 }),
        node('NumberBox', 'NumHint', { Text: '90', Hint: '阈值参考' }),
        button('DashBtn', '冲刺！', '#2e7d32'),
      ]),
      tip('拉到 90 以上再冲刺，否则会提示蓄力不足。'),
    ]),
    nonVisible: [nv('Celebration', 'Celebration1', {})],
    blocksXml: blocks,
  }])
}

export function createCoinLuckTemplate(): AiProject {
  const blocks = wrapXml(`
  ${clickThenMethod('CoinFlip1', 'coin_flip', 20, 20)}
  <block type="component_event" x="20" y="140">
    <field name="COMPONENT">CoinFlip1</field>
    <field name="EVENT">Rolled</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">ResultLabel</field>
        <field name="PROP">Text</field>
        <value name="VALUE">
          <block type="text_join">
            <mutation items="2"></mutation>
            <value name="ADD0"><block type="text"><field name="TEXT">结果：</field></block></value>
            <value name="ADD1"><block type="component_get_property"><field name="COMPONENT">CoinFlip1</field><field name="PROP">Result</field></block></value>
          </block>
        </value>
        <next>
          <block type="notifier_alert">
            <field name="COMPONENT">Notifier1</field>
            <value name="MESSAGE"><block type="text"><field name="TEXT">硬币落地！</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>`)
  return project('抛硬币赌运气', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '抛硬币', BackgroundColor: '#fce4ec' },
    root: page([
      kicker('简单 · 正反面'),
      card('HeroCard', '抛一次', [
        node('CoinFlip', 'CoinFlip1', {}),
        label('ResultLabel', '结果：？', 22, '#ad1457'),
      ]),
      card('MoreCard', '好运符', [
        node('QRCode', 'QRCode1', { Text: '好运连连', Size: 88 }),
      ]),
      tip('点硬币看正反。没有积木就不会翻面。'),
    ]),
    nonVisible: [nv('Notifier', 'Notifier1'), nv('Sound', 'Sound1', {})],
    blocksXml: blocks,
  }])
}

export function createCafeteriaRateTemplate(): AiProject {
  const blocks = wrapXml(`
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">RatingBar1</field>
    <field name="EVENT">Changed</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">MsgLabel</field>
        <field name="PROP">Text</field>
        <value name="VALUE">
          <block type="text_join">
            <mutation items="2"></mutation>
            <value name="ADD0"><block type="text"><field name="TEXT">今日菜品 </field></block></value>
            <value name="ADD1"><block type="component_get_property"><field name="COMPONENT">RatingBar1</field><field name="PROP">Rating</field></block></value>
          </block>
        </value>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">LevelBar1</field>
            <field name="PROP">Value</field>
            <value name="VALUE">
              <block type="math_arithmetic">
                <field name="OP">MULTIPLY</field>
                <value name="A"><block type="component_get_property"><field name="COMPONENT">RatingBar1</field><field name="PROP">Rating</field></block></value>
                <value name="B"><block type="math_number"><field name="NUM">20</field></block></value>
              </block>
            </value>
            <next>
              <block type="controls_if">
                <value name="IF0">
                  <block type="logic_compare">
                    <field name="OP">GTE</field>
                    <value name="A"><block type="component_get_property"><field name="COMPONENT">RatingBar1</field><field name="PROP">Rating</field></block></value>
                    <value name="B"><block type="math_number"><field name="NUM">5</field></block></value>
                  </block>
                </value>
                <statement name="DO0">
                  <block type="celebrate"><field name="COMPONENT">Celebration1</field></block>
                </statement>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>`)
  return project('食堂今日打分', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '食堂打分', BackgroundColor: '#fffde7' },
    root: page([
      kicker('简单 · 食堂评价'),
      card('HeroCard', '今日菜品', [
        label('Title', '番茄炒蛋', 20, '#f57f17'),
        label('MsgLabel', '今日菜品 3', 16, '#6d4c41'),
        node('LevelBar', 'LevelBar1', { Value: 60, MaxValue: 100 }),
      ]),
      card('ActionCard', '打分', [
        node('RatingBar', 'RatingBar1', { Rating: 3, MaxRating: 5 }),
        node('Divider', 'Div1', {}),
      ]),
      tip('给今日菜品打星，满分会撒花。'),
    ]),
    nonVisible: [nv('Celebration', 'Celebration1', {})],
    blocksXml: blocks,
  }])
}

export function createCheerBoardTemplate(): AiProject {
  const blocks = wrapXml(`
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">Cheer1</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">Marquee1</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">加油加油！你们最棒 ★ </field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="140">
    <field name="COMPONENT">Cheer2</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">Marquee1</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">冲鸭——下一题也稳 ★ </field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="260">
    <field name="COMPONENT">Cheer3</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">Marquee1</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">创客之星就是你 ★ </field></block></value>
      </block>
    </statement>
  </block>`)
  return project('弹幕加油墙', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '弹幕加油墙', BackgroundColor: '#f3e5f5' },
    root: page([
      kicker('简单 · 弹幕墙'),
      card('HeroCard', '现场弹幕', [
        node('Marquee', 'Marquee1', { Text: '欢迎来到加油墙 ★ ' }),
      ]),
      card('ActionCard', '选一句口号', [
        button('Cheer1', '加油加油', '#8e24aa'),
        button('Cheer2', '冲鸭', '#7b1fa2'),
        button('Cheer3', '创客之星', '#6a1b9a'),
        node('Divider', 'Div1', {}),
        node('Hyperlink', 'Link1', { Text: '班级主页灵感', Url: 'https://www.wikipedia.org' }),
      ]),
      tip('点不同加油语，走马灯会换句子。'),
    ]),
    nonVisible: [nv('ActivityStarter', 'ActivityStarter1', {})],
    blocksXml: blocks,
  }])
}

export function createSnackCartTemplate(): AiProject {
  const blocks = wrapXml(`
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">Stepper1</field>
    <field name="EVENT">Changed</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">CartLabel</field>
        <field name="PROP">Text</field>
        <value name="VALUE">
          <block type="text_join">
            <mutation items="3"></mutation>
            <value name="ADD0"><block type="component_get_property"><field name="COMPONENT">Spinner1</field><field name="PROP">Selection</field></block></value>
            <value name="ADD1"><block type="text"><field name="TEXT"> × </field></block></value>
            <value name="ADD2"><block type="component_get_property"><field name="COMPONENT">Stepper1</field><field name="PROP">Value</field></block></value>
          </block>
        </value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="180">
    <field name="COMPONENT">Spinner1</field>
    <field name="EVENT">AfterSelecting</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">CartLabel</field>
        <field name="PROP">Text</field>
        <value name="VALUE">
          <block type="text_join">
            <mutation items="3"></mutation>
            <value name="ADD0"><block type="component_get_property"><field name="COMPONENT">Spinner1</field><field name="PROP">Selection</field></block></value>
            <value name="ADD1"><block type="text"><field name="TEXT"> × </field></block></value>
            <value name="ADD2"><block type="component_get_property"><field name="COMPONENT">Stepper1</field><field name="PROP">Value</field></block></value>
          </block>
        </value>
      </block>
    </statement>
  </block>`)
  return project('零食购物车', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '零食购物车', BackgroundColor: '#fce4ec' },
    root: page([
      kicker('简单 · 购物清单'),
      card('HeroCard', '购物车', [
        label('CartLabel', '薯片 × 1', 22, '#ad1457'),
      ]),
      card('ActionCard', '选品', [
        node('Spinner', 'Spinner1', { ElementsFromString: '薯片,果汁,巧克力,面包', Selection: '薯片' }),
        node('Stepper', 'Stepper1', { Value: 1, MinValue: 1, MaxValue: 9 }),
        node('CheckBox', 'GiftBox', { Text: '打包成礼物', Checked: false }),
      ]),
      card('MoreCard', '取货时间', [
        node('DatePicker', 'DatePicker1', {}),
        node('TimePicker', 'TimePicker1', {}),
      ]),
      tip('选零食、调数量，上面清单会跟着变。'),
    ]),
    nonVisible: [],
    blocksXml: blocks,
  }])
}

export function createCrosswalkTemplate(): AiProject {
  const blocks = wrapXml(`
  ${clickThenMethod('TrafficLight1', 'traffic_next', 20, 20)}
  <block type="component_event" x="20" y="140">
    <field name="COMPONENT">TrafficLight1</field>
    <field name="EVENT">Changed</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">HintLabel</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">看灯！红灯停，绿灯行，黄灯等一等</field></block></value>
      </block>
    </statement>
  </block>`)
  return project('过马路口诀', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '过马路', BackgroundColor: '#efebe9' },
    root: page([
      kicker('简单 · 安全过马路'),
      card('HeroCard', '路口', [
        node('TableArrangement', 'Table1', { Columns: 2 }, [
          node('TrafficLight', 'TrafficLight1', {}),
          label('HintLabel', '先点灯试试', 16, '#5d4037'),
        ]),
      ]),
      card('MoreCard', '听提示音', [
        node('Player', 'Player1', {}),
      ]),
      tip('点交通灯切换；口诀会更新。'),
    ]),
    nonVisible: [nv('Vibrator', 'Vibrator1', {}), nv('Sound', 'Sound1', {})],
    blocksXml: blocks,
  }])
}
