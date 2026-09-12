import type { AiProject } from '../types'
import { tip, label, button, textBox, project, node, hrow, wrapXml, nv, uid, clickThenMethod, playField, kicker, page, card } from '../templateKit'

export function createPartyBoxTemplate(): AiProject {
  const blocks = wrapXml(`
  ${clickThenMethod('Dice1', 'dice_roll', 20, 20)}
  ${clickThenMethod('CoinFlip1', 'coin_flip', 20, 120)}
  ${clickThenMethod('FortuneBall1', 'fortune_ask', 20, 220)}
  <block type="component_event" x="20" y="320">
    <field name="COMPONENT">Dice1</field>
    <field name="EVENT">Rolled</field>
    <statement name="DO">
      <block type="controls_if">
        <value name="IF0">
          <block type="logic_compare">
            <field name="OP">EQ</field>
            <value name="A"><block type="component_get_property"><field name="COMPONENT">Dice1</field><field name="PROP">Result</field></block></value>
            <value name="B"><block type="math_number"><field name="NUM">6</field></block></value>
          </block>
        </value>
        <statement name="DO0">
          <block type="celebrate"><field name="COMPONENT">Celebration1</field></block>
        </statement>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="520">
    <field name="COMPONENT">RandBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="random_next_int">
        <field name="COMPONENT">RandomHelper1</field>
        <value name="MIN"><block type="math_number"><field name="NUM">1</field></block></value>
        <value name="MAX"><block type="math_number"><field name="NUM">40</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="680">
    <field name="COMPONENT">RandomHelper1</field>
    <field name="EVENT">GotResult</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">LEDLabel1</field>
        <field name="PROP">Text</field>
        <value name="VALUE">
          <block type="text_join">
            <mutation items="2"></mutation>
            <value name="ADD0"><block type="text"><field name="TEXT">学号 </field></block></value>
            <value name="ADD1"><block type="component_get_property"><field name="COMPONENT">RandomHelper1</field><field name="PROP">LastResult</field></block></value>
          </block>
        </value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="840">
    <field name="COMPONENT">PartyBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="celebrate"><field name="COMPONENT">Celebration1</field></block>
    </statement>
  </block>`)
  return project('派对盒子', [
    {
      id: uid('screen'),
      name: 'Screen1',
      props: { Title: '派对盒子', BackgroundColor: '#fce4ec' },
      root: page([
        kicker('娱乐 · 课堂派对'),
        card('HeroCard', '现场', [
          node('Marquee', 'Marquee1', { Text: '派对进行中 ★ 好运连连 ★ ' }),
          node('LEDLabel', 'LEDLabel1', { Text: 'READY', FontSize: 22 }),
          hrow('Av', [
            node('Avatar', 'Avatar1', { Text: '派', Size: 40 }),
            node('Badge', 'Badge1', { Text: 'VIP' }),
          ]),
        ]),
        card('PlayCard', '随机玩法', [
          hrow('Row1', [
            node('Dice', 'Dice1', {}),
            node('CoinFlip', 'CoinFlip1', {}),
            node('FortuneBall', 'FortuneBall1', {}),
          ]),
        ]),
        card('ActionCard', '抽号与撒花', [
          hrow('Row2', [
            button('RandBtn', '抽学号', '#c2185b'),
            button('PartyBtn', '撒花', '#ad1457'),
          ]),
          node('LightBulb', 'LightBulb1', { On: true }),
          node('VideoPlayer', 'VideoPlayer1', { Height: 80 }),
        ]),
        tip('掷骰 / 硬币 / 占卜 / 抽学号 / 撒花。'),
      ]),
      nonVisible: [
        nv('Celebration', 'Celebration1', {}),
        nv('RandomHelper', 'RandomHelper1', {}),
        nv('Sound', 'Sound1', {}),
        nv('Sharing', 'Sharing1', {}),
      ],
      blocksXml: blocks,
    },
  ])
}

export function createFortuneShowTemplate(): AiProject {
  const blocks = wrapXml(`
  ${clickThenMethod('FortuneBall1', 'fortune_ask', 20, 20)}
  ${clickThenMethod('TrafficLight1', 'traffic_next', 20, 120)}
  <block type="component_event" x="20" y="220">
    <field name="COMPONENT">SpeakBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="tts_speak">
        <field name="COMPONENT">TextToSpeech1</field>
        <value name="MESSAGE"><block type="component_get_property"><field name="COMPONENT">FortuneBall1</field><field name="PROP">Answer</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="360">
    <field name="COMPONENT">ShareBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="sharing_share">
        <field name="COMPONENT">Sharing1</field>
        <value name="MESSAGE"><block type="component_get_property"><field name="COMPONENT">FortuneBall1</field><field name="PROP">Answer</field></block></value>
      </block>
    </statement>
  </block>`)
  return project('趣味占卜秀', [
    {
      id: uid('screen'),
      name: 'Screen1',
      props: { Title: '趣味占卜秀', BackgroundColor: '#ede7f6' },
      root: page([
        kicker('娱乐 · 占卜演出'),
        card('HeroCard', '签文', [
          node('FortuneBall', 'FortuneBall1', {}),
          node('RatingBar', 'RatingBar1', { Rating: 4, MaxRating: 5 }),
          node('ChatBubble', 'BubbleShow', { Text: '今日运势揭晓！', Side: '左' }),
        ]),
        card('StageCard', '舞台', [
          node('TrafficLight', 'TrafficLight1', {}),
          node('LightBulb', 'LightBulb1', { On: false }),
          textBox('MoodBox', '今日心情'),
          node('Image', 'Image1', { Width: 100, Height: 70, Picture: './media/banner.png' }),
        ]),
        card('ActionCard', '演出', [
          hrow('Row', [
            button('SpeakBtn', '朗读签文', '#5e35b1'),
            button('ShareBtn', '分享签文', '#4527a0'),
          ]),
          node('Player', 'Player1', {}),
          node('VideoPlayer', 'VideoPlayer1', { Height: 70 }),
        ]),
        tip('点占卜球，再用朗读 / 分享演出。'),
      ]),
      nonVisible: [
        nv('TextToSpeech', 'TextToSpeech1', {}),
        nv('Sharing', 'Sharing1', {}),
        nv('SpeechRecognizer', 'SpeechRecognizer1', {}),
        nv('Camera', 'Camera1', {}),
        nv('GalleryPicker', 'GalleryPicker1', {}),
      ],
      blocksXml: blocks,
    },
  ])
}

export function createMiniArcadeTemplate(): AiProject {
  const blocks = wrapXml(`
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">StartBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="score_reset"><field name="COMPONENT">ScoreBoard1</field>
        <next>
          <block type="sprite_move_to">
            <field name="COMPONENT">Ball1</field>
            <value name="X"><block type="math_number"><field name="NUM">16</field></block></value>
            <value name="Y"><block type="math_number"><field name="NUM">90</field></block></value>
            <next>
              <block type="countdown_reset"><field name="COMPONENT">Countdown1</field>
                <next>
                  <block type="sprite_move_to">
                    <field name="COMPONENT">Sprite1</field>
                    <value name="X"><block type="math_number"><field name="NUM">210</field></block></value>
                    <value name="Y"><block type="math_number"><field name="NUM">24</field></block></value>
                    <next>
                      <block type="countdown_start"><field name="COMPONENT">Countdown1</field>
                        <next>
                          <block type="component_set_property">
                            <field name="COMPONENT">StatusLabel</field>
                            <field name="PROP">Text</field>
                            <value name="VALUE"><block type="text"><field name="TEXT">游戏中！拖摇杆吃星星</field></block></value>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="220">
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
                <value name="B"><block type="math_number"><field name="NUM">10</field></block></value>
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
                <value name="B"><block type="math_number"><field name="NUM">10</field></block></value>
              </block>
            </value>
          </block>
        </value>
        <next>
          <block type="controls_if">
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
                            <value name="B"><block type="math_number"><field name="NUM">28</field></block></value>
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
                            <value name="B"><block type="math_number"><field name="NUM">28</field></block></value>
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
                            <value name="B"><block type="math_number"><field name="NUM">28</field></block></value>
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
                            <value name="B"><block type="math_number"><field name="NUM">28</field></block></value>
                          </block>
                        </value>
                      </block>
                    </value>
                  </block>
                </value>
              </block>
            </value>
            <statement name="DO0">
              <block type="arcade_collect_sprite"><field name="SPRITE">Sprite1</field></block>
            </statement>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="620">
    <field name="COMPONENT">Countdown1</field>
    <field name="EVENT">Finished</field>
    <statement name="DO">
      <block type="celebrate"><field name="COMPONENT">Celebration1</field>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">StatusLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">时间到！看你的街机分</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>`)
  return project('迷你街机', [
    {
      id: uid('screen'),
      name: 'Screen1',
      props: { Title: '迷你街机', BackgroundColor: '#e0f7fa' },
      root: page([
        kicker('娱乐 · 限时街机'),
        card('HeroCard', '状态', [
          node('Countdown', 'Countdown1', { Seconds: 20, Remaining: 20, FontSize: 22 }),
          node('ScoreBoard', 'ScoreBoard1', { Title: '街机分', Score: 0 }),
          label('StatusLabel', '先点开始', 14, '#006064'),
        ]),
        card('ArenaCard', '场地', [
          playField('Arena', 220, [
            node('Ball', 'Ball1', { X: 16, Y: 90, Radius: 14, PaintColor: '#00acc1' }),
            node('ImageSprite', 'Sprite1', { Width: 36, Height: 36, X: 210, Y: 24, Picture: './media/sprite.png' }),
          ], '#b2ebf2'),
          node('Joystick', 'Joy1', { Size: 110 }),
        ]),
        card('ActionCard', '开始', [
          button('StartBtn', '开始 20 秒', '#00838f'),
          node('LevelBar', 'LevelBar1', { Value: 70, MaxValue: 100 }),
          node('ProgressRing', 'ProgressRing1', { Percent: 50 }),
        ]),
        tip('点「开始」→ 限时拖摇杆。碰到星星加分，精灵会在场地里随机换位。'),
      ]),
      nonVisible: [
        nv('Celebration', 'Celebration1', {}),
        nv('Notifier', 'Notifier1'),
        nv('Sound', 'Sound1', { Source: './media/pop.wav' }),
        nv('OrientationSensor', 'OrientationSensor1', { Enabled: false }),
        nv('PhoneCall', 'PhoneCall1', {}),
        nv('ActivityStarter', 'ActivityStarter1', {}),
        nv('NotePad', 'NotePad1', { Namespace: 'arcade' }),
      ],
      blocksXml: blocks,
    },
  ])
}

