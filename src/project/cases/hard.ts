import type { AiProject } from '../types'
import { tip, label, button, project, node, wrapXml, nv, uid, playField, kicker, page, card } from '../templateKit'

/** 摇杆推球：场地内绝对定位，靠近目标再点得分 */
export function createJoyBallTemplate(): AiProject {
  const blocks = wrapXml(`
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">Joy1</field>
    <field name="EVENT">PositionChanged</field>
    <statement name="DO">
      <block type="sprite_move_to">
        <field name="COMPONENT">Ball1</field>
        <value name="X">
          <block type="math_arithmetic">
            <field name="OP">ADD</field>
            <value name="A"><block type="component_get_property"><field name="COMPONENT">Ball1</field><field name="PROP">X</field></block></value>
            <value name="B">
              <block type="math_arithmetic">
                <field name="OP">MULTIPLY</field>
                <value name="A"><block type="component_get_property"><field name="COMPONENT">Joy1</field><field name="PROP">X</field></block></value>
                <value name="B"><block type="math_number"><field name="NUM">8</field></block></value>
              </block>
            </value>
          </block>
        </value>
        <value name="Y">
          <block type="math_arithmetic">
            <field name="OP">ADD</field>
            <value name="A"><block type="component_get_property"><field name="COMPONENT">Ball1</field><field name="PROP">Y</field></block></value>
            <value name="B">
              <block type="math_arithmetic">
                <field name="OP">MULTIPLY</field>
                <value name="A"><block type="component_get_property"><field name="COMPONENT">Joy1</field><field name="PROP">Y</field></block></value>
                <value name="B"><block type="math_number"><field name="NUM">8</field></block></value>
              </block>
            </value>
          </block>
        </value>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">HintLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">移动中…靠近橙色精灵再点「得分」</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="300">
    <field name="COMPONENT">ScoreBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="controls_if">
        <mutation else="1"></mutation>
        <value name="IF0">
          <block type="logic_operation">
            <field name="OP">AND</field>
            <value name="A">
              <block type="logic_operation">
                <field name="OP">AND</field>
                <value name="A">
                  <block type="logic_compare">
                    <field name="OP">GT</field>
                    <value name="A"><block type="component_get_property"><field name="COMPONENT">Ball1</field><field name="PROP">X</field></block></value>
                    <value name="B">
                      <block type="math_arithmetic">
                        <field name="OP">MINUS</field>
                        <value name="A"><block type="component_get_property"><field name="COMPONENT">Sprite1</field><field name="PROP">X</field></block></value>
                        <value name="B"><block type="math_number"><field name="NUM">36</field></block></value>
                      </block>
                    </value>
                  </block>
                </value>
                <value name="B">
                  <block type="logic_compare">
                    <field name="OP">LT</field>
                    <value name="A"><block type="component_get_property"><field name="COMPONENT">Ball1</field><field name="PROP">X</field></block></value>
                    <value name="B">
                      <block type="math_arithmetic">
                        <field name="OP">ADD</field>
                        <value name="A"><block type="component_get_property"><field name="COMPONENT">Sprite1</field><field name="PROP">X</field></block></value>
                        <value name="B"><block type="math_number"><field name="NUM">36</field></block></value>
                      </block>
                    </value>
                  </block>
                </value>
              </block>
            </value>
            <value name="B">
              <block type="logic_operation">
                <field name="OP">AND</field>
                <value name="A">
                  <block type="logic_compare">
                    <field name="OP">GT</field>
                    <value name="A"><block type="component_get_property"><field name="COMPONENT">Ball1</field><field name="PROP">Y</field></block></value>
                    <value name="B">
                      <block type="math_arithmetic">
                        <field name="OP">MINUS</field>
                        <value name="A"><block type="component_get_property"><field name="COMPONENT">Sprite1</field><field name="PROP">Y</field></block></value>
                        <value name="B"><block type="math_number"><field name="NUM">36</field></block></value>
                      </block>
                    </value>
                  </block>
                </value>
                <value name="B">
                  <block type="logic_compare">
                    <field name="OP">LT</field>
                    <value name="A"><block type="component_get_property"><field name="COMPONENT">Ball1</field><field name="PROP">Y</field></block></value>
                    <value name="B">
                      <block type="math_arithmetic">
                        <field name="OP">ADD</field>
                        <value name="A"><block type="component_get_property"><field name="COMPONENT">Sprite1</field><field name="PROP">Y</field></block></value>
                        <value name="B"><block type="math_number"><field name="NUM">36</field></block></value>
                      </block>
                    </value>
                  </block>
                </value>
              </block>
            </value>
          </block>
        </value>
        <statement name="DO0">
          <block type="score_add">
            <field name="COMPONENT">ScoreBoard1</field>
            <value name="DELTA"><block type="math_number"><field name="NUM">10</field></block></value>
            <next>
              <block type="celebrate"><field name="COMPONENT">Celebration1</field>
                <next>
                  <block type="component_set_property">
                    <field name="COMPONENT">HintLabel</field>
                    <field name="PROP">Text</field>
                    <value name="VALUE"><block type="text"><field name="TEXT">碰到了！+10 分</field></block></value>
                    <next>
                      <block type="sprite_move_to">
                        <field name="COMPONENT">Sprite1</field>
                        <value name="X"><block type="math_number"><field name="NUM">180</field></block></value>
                        <value name="Y"><block type="math_number"><field name="NUM">120</field></block></value>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="component_set_property">
            <field name="COMPONENT">HintLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">还没碰到精灵，再靠近一点</field></block></value>
          </block>
        </statement>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="720">
    <field name="COMPONENT">ResetBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="sprite_move_to">
        <field name="COMPONENT">Ball1</field>
        <value name="X"><block type="math_number"><field name="NUM">20</field></block></value>
        <value name="Y"><block type="math_number"><field name="NUM">20</field></block></value>
        <next>
          <block type="sprite_move_to">
            <field name="COMPONENT">Sprite1</field>
            <value name="X"><block type="math_number"><field name="NUM">200</field></block></value>
            <value name="Y"><block type="math_number"><field name="NUM">40</field></block></value>
            <next>
              <block type="score_reset"><field name="COMPONENT">ScoreBoard1</field></block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>`)
  return project('摇杆推球闯关', [
    {
      id: uid('screen'),
      name: 'Screen1',
      props: { Title: '摇杆闯关', BackgroundColor: '#e8f5e9' },
      root: page([
        kicker('难 · 摇杆闯关'),
        card('HeroCard', '关卡分', [
          node('ScoreBoard', 'ScoreBoard1', { Title: '关卡分', Score: 0 }),
          label('HintLabel', '拖摇杆开始', 14, '#2e7d32'),
        ]),
        card('ArenaCard', '场地', [
          playField('Arena', 220, [
            node('Ball', 'Ball1', { X: 20, Y: 20, Radius: 14, PaintColor: '#00897b' }),
            node('ImageSprite', 'Sprite1', { Width: 40, Height: 40, X: 200, Y: 40, Picture: './media/sprite.png' }),
          ], '#c8e6c9'),
        ]),
        card('ActionCard', '控制', [
          node('Joystick', 'Joy1', { Size: 120 }),
          button('ScoreBtn', '碰到精灵·得分', '#2e7d32'),
          button('ResetBtn', '重置位置', '#689f38'),
          node('Canvas', 'Canvas1', { Height: 40, BackgroundColor: '#a5d6a7' }),
        ]),
        tip('① 拖摇杆推青绿小球 ② 靠近橙色精灵 ③ 点「得分」。场地里才能看见移动。'),
      ]),
      nonVisible: [
        nv('Celebration', 'Celebration1', {}),
        nv('OrientationSensor', 'OrientationSensor1', { Enabled: false }),
        nv('AccelerometerSensor', 'AccelerometerSensor1', { Enabled: false }),
        nv('ShakeSensor', 'ShakeSensor1', { Enabled: false }),
        nv('GyroscopeSensor', 'GyroscopeSensor1', { Enabled: false }),
        nv('ProximitySensor', 'ProximitySensor1', { Enabled: false }),
        nv('Pedometer', 'Pedometer1', { Enabled: false }),
        nv('LightSensor', 'LightSensor1', { Enabled: false }),
        nv('MagneticFieldSensor', 'MagneticFieldSensor1', { Enabled: false }),
        nv('LocationSensor', 'LocationSensor1', { Enabled: false }),
        nv('Vibrator', 'Vibrator1', {}),
      ],
      blocksXml: blocks,
    },
  ])
}
