import type { AiProject, ComponentNode } from '../types'
import { tip, title, project, card, hrow, node, uid, clickThenMethod, playField, kicker, page } from '../templateKit'

/** 拓展·界面馆 */
export function createTourUiTemplate(): AiProject {
  const blocks = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">ApplyColorBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">ThemeLabel</field>
        <field name="PROP">TextColor</field>
        <value name="VALUE"><block type="component_get_property"><field name="COMPONENT">ColorPicker1</field><field name="PROP">Color</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="160">
    <field name="COMPONENT">SubmitBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="controls_if">
        <mutation else="1"></mutation>
        <value name="IF0"><block type="component_get_property"><field name="COMPONENT">AgreeBox</field><field name="PROP">Checked</field></block></value>
        <statement name="DO0">
          <block type="component_set_property">
            <field name="COMPONENT">StatusLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">提交成功！可继续改其它控件玩玩。</field></block></value>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="component_set_property">
            <field name="COMPONENT">StatusLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">请先勾选「同意协议」。</field></block></value>
          </block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`

  const scrollKids: ComponentNode[] = [
    tip('向下滚动参观。先认识控件，再点「应用主题色」「提交」试积木。'),
    node('Marquee', 'Marquee1', { Text: '欢迎来到界面馆 ★ 滑动查看更多组件 ★ ' }),
    card('CardLogin', '登录区', [
      hrow('RowAvatar', [
        node('Avatar', 'Avatar1', { Text: '学', Size: 48 }),
        node('Badge', 'Badge1', { Text: '新手' }),
      ]),
      node('TextBox', 'UserBox', { Hint: '用户名', Text: '' }),
      node('PasswordTextBox', 'PassBox', { Hint: '密码' }),
      node('SearchBar', 'SearchBar1', { Hint: '搜索功能…' }),
      node('ToggleButton', 'FavBtn', { Text: '收藏本馆' }),
      node('CheckBox', 'AgreeBox', { Text: '同意课堂公约', Checked: false }),
      node('Button', 'SubmitBtn', { Text: '提交', BackgroundColor: '#009688', TextColor: '#fff' }),
      node('Label', 'StatusLabel', { Text: '状态：待提交', FontSize: 13, TextColor: '#5f6368' }),
    ]),
    card('CardOptions', '选项与数值', [
      node('RadioButton', 'RadioA', { Text: '方案 A', GroupName: 'plan', Checked: true }),
      node('RadioButton', 'RadioB', { Text: '方案 B', GroupName: 'plan', Checked: false }),
      node('Switch', 'Switch1', { Text: '夜间模式', On: false }),
      node('Spinner', 'Spinner1', { ElementsFromString: '语文,数学,英语', Selection: '语文' }),
      node('Stepper', 'Stepper1', { Value: 1, MinValue: 0, MaxValue: 10 }),
      node('Slider', 'Slider1', { MinValue: 0, MaxValue: 100, ThumbPosition: 40 }),
      node('RatingBar', 'RatingBar1', { Rating: 4, MaxRating: 5 }),
      node('NumberBox', 'NumberBox1', { Text: '3', Hint: '数字' }),
      node('ProgressBar', 'ProgressBar1', {}),
    ]),
    card('CardTime', '日期与时间', [
      node('DatePicker', 'DatePicker1', {}),
      node('TimePicker', 'TimePicker1', {}),
    ]),
    card('CardTabs', '标签栏与列表', [
      node('TabBar', 'TabBar1', { ElementsFromString: '首页,发现,我的', Selection: '首页' }),
      node('ListView', 'ListView1', { ElementsFromString: '项目一,项目二,项目三', Height: 120 }),
    ]),
    card('CardDecor', '装饰与对话', [
      node('ChatBubble', 'BubbleL', { Text: '你好！这是左侧气泡', Side: '左' }),
      node('ChatBubble', 'BubbleR', { Text: '右侧气泡也可以点', Side: '右', BackgroundColor: '#c8e6c9' }),
      node('Hyperlink', 'Link1', { Text: '打开示例链接', Url: 'https://www.wikipedia.org' }),
      node('ColorPicker', 'ColorPicker1', { Color: '#009688' }),
      node('Label', 'ThemeLabel', { Text: '主题色预览文字', FontSize: 15, TextColor: '#009688' }),
      node('Button', 'ApplyColorBtn', { Text: '应用主题色到上方文字', BackgroundColor: '#455a64', TextColor: '#fff' }),
    ]),
    node('Divider', 'Divider1', {}),
    tip('表格布局：三列按钮'),
    node('TableArrangement', 'Table1', { Columns: 3 }, [
      node('Button', 'T1', { Text: '一', BackgroundColor: '#80cbc4', TextColor: '#004d40' }),
      node('Button', 'T2', { Text: '二', BackgroundColor: '#80cbc4', TextColor: '#004d40' }),
      node('Button', 'T3', { Text: '三', BackgroundColor: '#80cbc4', TextColor: '#004d40' }),
    ]),
    node('Spacer', 'Spacer1', { Height: 12 }),
    node('TextArea', 'TextArea1', { Hint: '多行备注', Height: 72 }),
    tip('—— 界面馆结束，可加载其它「拓展」案例 ——'),
  ]

  return project('拓展·界面馆', [
    {
      id: uid('screen'),
      name: 'Screen1',
      props: { Title: '界面馆', BackgroundColor: '#eef7f5' },
      root: page([
        kicker('拓展 · 控件展馆'),
        title('界面馆'),
        node('ScrollArrangement', 'Scroll1', { Height: 520, Width: '填满父组件', BackgroundColor: '#eef7f5' }, scrollKids),
      ]),
      nonVisible: [],
      blocksXml: blocks,
    },
  ])
}

/** 拓展·趣味厅 */
export function createTourFunTemplate(): AiProject {
  const blocks = `<xml xmlns="https://developers.google.com/blockly/xml">
  ${clickThenMethod('Dice1', 'dice_roll', 320, 20)}
  ${clickThenMethod('CoinFlip1', 'coin_flip', 320, 120)}
  ${clickThenMethod('FortuneBall1', 'fortune_ask', 320, 220)}
  ${clickThenMethod('TrafficLight1', 'traffic_next', 320, 320)}
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">Dice1</field>
    <field name="EVENT">Rolled</field>
    <statement name="DO">
      <block type="score_add">
        <field name="COMPONENT">ScoreBoard1</field>
        <value name="DELTA"><block type="component_get_property"><field name="COMPONENT">Dice1</field><field name="PROP">Result</field></block></value>
        <next>
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
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="280">
    <field name="COMPONENT">StartCdBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="countdown_start"><field name="COMPONENT">Countdown1</field></block>
    </statement>
  </block>
  <block type="component_event" x="20" y="380">
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
                <value name="B"><block type="math_number"><field name="NUM">6</field></block></value>
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
                <value name="B"><block type="math_number"><field name="NUM">6</field></block></value>
              </block>
            </value>
          </block>
        </value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="620">
    <field name="COMPONENT">PartyBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="celebrate"><field name="COMPONENT">Celebration1</field></block>
    </statement>
  </block>
  <block type="component_event" x="20" y="720">
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
  <block type="component_event" x="20" y="860">
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
</xml>`

  return project('拓展·趣味厅', [
    {
      id: uid('screen'),
      name: 'Screen1',
      props: { Title: '趣味厅', BackgroundColor: '#fff8e1' },
      root: page([
        kicker('拓展 · 趣味组件'),
        card('HeroCard', '看板', [
          node('ScoreBoard', 'ScoreBoard1', { Title: '得分', Score: 0 }),
          node('LEDLabel', 'LEDLabel1', { Text: 'READY', FontSize: 22 }),
        ]),
        card('PlayCard', '玩法', [
          hrow('FunRow1', [
            node('Dice', 'Dice1', {}),
            node('CoinFlip', 'CoinFlip1', {}),
            node('FortuneBall', 'FortuneBall1', {}),
          ]),
          hrow('FunRow2', [
            node('TrafficLight', 'TrafficLight1', {}),
            node('LightBulb', 'LightBulb1', { On: false }),
            node('QRCode', 'QRCode1', { Text: 'https://www.bilibili.com', Size: 88 }),
          ]),
          hrow('FunRow3', [
            node('Countdown', 'Countdown1', { Seconds: 10, Remaining: 10, FontSize: 24 }),
            node('Stopwatch', 'Stopwatch1', { FontSize: 20 }),
          ]),
        ]),
        card('ActionCard', '操作', [
          hrow('FunRow4', [
            node('Button', 'StartCdBtn', { Text: '开始倒计时', BackgroundColor: '#e53935', TextColor: '#fff' }),
            node('Button', 'PartyBtn', { Text: '撒花', BackgroundColor: '#8e24aa', TextColor: '#fff' }),
            node('Button', 'RandBtn', { Text: '抽学号', BackgroundColor: '#00897b', TextColor: '#fff' }),
          ]),
          node('ProgressRing', 'ProgressRing1', { Percent: 60 }),
          node('LevelBar', 'LevelBar1', { Value: 75, MaxValue: 100 }),
        ]),
        card('ArenaCard', '场地', [
          tip('摇杆推球：在场地里拖动摇杆'),
          playField('Arena', 160, [
            node('Ball', 'Ball1', { X: 20, Y: 40, Radius: 14, PaintColor: '#00897b' }),
            node('ImageSprite', 'Sprite1', { Width: 40, Height: 40, X: 160, Y: 30, Picture: './media/sprite.png' }),
          ], '#eceff1'),
          node('Joystick', 'Joy1', { Size: 110 }),
          node('Canvas', 'Canvas1', { Height: 60, BackgroundColor: '#eceff1' }),
        ]),
        tip('掷骰子加分，掷到 6 会撒花；拖摇杆推小球；抽学号看 LED。'),
      ]),
      nonVisible: [
        node('Celebration', 'Celebration1', {}),
        node('RandomHelper', 'RandomHelper1', {}),
      ],
      blocksXml: blocks,
    },
  ])
}

/** 拓展·媒体台 */
export function createTourMediaTemplate(): AiProject {
  const blocks = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">CamBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="camera_take_picture">
        <field name="COMPONENT">Camera1</field>
        <field name="IMAGE">Image1</field>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="140">
    <field name="COMPONENT">GalBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="gallery_open">
        <field name="COMPONENT">GalleryPicker1</field>
        <field name="IMAGE">Image1</field>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="260">
    <field name="COMPONENT">SpeakBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="tts_speak">
        <field name="COMPONENT">TextToSpeech1</field>
        <value name="MESSAGE"><block type="component_get_property"><field name="COMPONENT">SpeakBox</field><field name="PROP">Text</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="400">
    <field name="COMPONENT">ListenBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="speech_get_text"><field name="COMPONENT">SpeechRecognizer1</field></block>
    </statement>
  </block>
  <block type="component_event" x="20" y="500">
    <field name="COMPONENT">SpeechRecognizer1</field>
    <field name="EVENT">AfterGettingText</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">SpeakBox</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="component_get_property"><field name="COMPONENT">SpeechRecognizer1</field><field name="PROP">Result</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="640">
    <field name="COMPONENT">AlertBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="notifier_alert">
        <field name="COMPONENT">Notifier1</field>
        <value name="MESSAGE"><block type="text"><field name="TEXT">多媒体台运行正常</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="780">
    <field name="COMPONENT">SoundBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="sound_play"><field name="COMPONENT">Sound1</field></block>
    </statement>
  </block>
</xml>`

  return project('拓展·媒体台', [
    {
      id: uid('screen'),
      name: 'Screen1',
      props: { Title: '媒体台', BackgroundColor: '#f3e5f5' },
      root: page([
        kicker('拓展 · 多媒体'),
        card('HeroCard', '画面', [
          node('Image', 'Image1', { Width: 160, Height: 100, Picture: './media/banner.png' }),
        ]),
        card('ActionCard', '拍摄与音效', [
          hrow('MediaBtns', [
            node('Button', 'CamBtn', { Text: '拍照', BackgroundColor: '#6a1b9a', TextColor: '#fff' }),
            node('Button', 'GalBtn', { Text: '图库', BackgroundColor: '#8e24aa', TextColor: '#fff' }),
            node('Button', 'SoundBtn', { Text: '音效', BackgroundColor: '#ab47bc', TextColor: '#fff' }),
          ]),
        ]),
        card('PlayCard', '播放', [
          tip('播放器 / 视频已预填内置资源（也可在属性里换自己的地址）'),
          node('Player', 'Player1', {}),
          node('VideoPlayer', 'VideoPlayer1', { Height: 140 }),
          node('WebViewer', 'WebViewer1', { Height: 140, HomeUrl: 'https://zh.wikipedia.org' }),
        ]),
        card('VoiceCard', '语音', [
          node('TextBox', 'SpeakBox', { Text: '你好，欢迎来到媒体台', Hint: '朗读内容' }),
          hrow('VoiceRow', [
            node('Button', 'SpeakBtn', { Text: '朗读', BackgroundColor: '#00838f', TextColor: '#fff' }),
            node('Button', 'ListenBtn', { Text: '语音识别', BackgroundColor: '#00695c', TextColor: '#fff' }),
            node('Button', 'AlertBtn', { Text: '通知', BackgroundColor: '#455a64', TextColor: '#fff' }),
          ]),
        ]),
        tip('拍照 / 图库改图；内置音视频可直接播。网页若空白可新窗口打开。'),
      ]),
      nonVisible: [
        node('Camera', 'Camera1', {}),
        node('GalleryPicker', 'GalleryPicker1', {}),
        node('Sound', 'Sound1', {}),
        node('TextToSpeech', 'TextToSpeech1', {}),
        node('SpeechRecognizer', 'SpeechRecognizer1', {}),
        node('Notifier', 'Notifier1', {}),
      ],
      blocksXml: blocks,
    },
  ])
}

/** 拓展·数据站 */
export function createTourDataTemplate(): AiProject {
  const blocks = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">SaveNoteBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="note_save">
        <field name="COMPONENT">NotePad1</field>
        <value name="TITLE"><block type="text"><field name="TEXT">课堂笔记</field></block></value>
        <value name="CONTENT"><block type="component_get_property"><field name="COMPONENT">DocBox</field><field name="PROP">Text</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="180">
    <field name="COMPONENT">PickBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="file_pick_multi"><field name="COMPONENT">FilePicker1</field></block>
    </statement>
  </block>
  <block type="component_event" x="20" y="280">
    <field name="COMPONENT">FilePicker1</field>
    <field name="EVENT">AfterPicking</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">DocBox</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="component_get_property"><field name="COMPONENT">FilePicker1</field><field name="PROP">CombinedText</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="420">
    <field name="COMPONENT">FolderBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="folder_pick"><field name="COMPONENT">FolderPicker1</field></block>
    </statement>
  </block>
  <block type="component_event" x="20" y="520">
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
  <block type="component_event" x="20" y="680">
    <field name="COMPONENT">TextWorkshop1</field>
    <field name="EVENT">GotResult</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">ResultBox</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="component_get_property"><field name="COMPONENT">TextWorkshop1</field><field name="PROP">ResultLines</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="820">
    <field name="COMPONENT">DbBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="tinydb_store">
        <field name="COMPONENT">TinyDB1</field>
        <value name="TAG"><block type="text"><field name="TEXT">demo</field></block></value>
        <value name="VALUE"><block type="component_get_property"><field name="COMPONENT">DocBox</field><field name="PROP">Text</field></block></value>
        <next>
          <block type="clipboard_copy">
            <field name="COMPONENT">Clipboard1</field>
            <value name="TEXT"><block type="component_get_property"><field name="COMPONENT">DocBox</field><field name="PROP">Text</field></block></value>
            <next>
              <block type="sharing_share">
                <field name="COMPONENT">Sharing1</field>
                <value name="MESSAGE"><block type="text"><field name="TEXT">来自数据站的分享</field></block></value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="1040">
    <field name="COMPONENT">ExportBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="file_save">
        <field name="COMPONENT">FileSaver1</field>
        <value name="CONTENT"><block type="component_get_property"><field name="COMPONENT">ResultBox</field><field name="PROP">Text</field></block></value>
        <value name="NAME"><block type="text"><field name="TEXT">data-station.txt</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="1200">
    <field name="COMPONENT">WebBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="web_get">
        <field name="COMPONENT">Web1</field>
        <value name="URL"><block type="component_get_property"><field name="COMPONENT">UrlBox</field><field name="PROP">Text</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="1340">
    <field name="COMPONENT">Web1</field>
    <field name="EVENT">GotText</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">ResultBox</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="component_get_property"><field name="COMPONENT">Web1</field><field name="PROP">ResponseContent</field></block></value>
      </block>
    </statement>
  </block>
</xml>`

  return project('拓展·数据站', [
    {
      id: uid('screen'),
      name: 'Screen1',
      props: { Title: '数据站', BackgroundColor: '#e3f2fd' },
      root: page([
        kicker('拓展 · 数据与文件'),
        card('HeroCard', '正文', [
          node('TextArea', 'DocBox', { Hint: '正文 / 导入内容', Height: 90 }),
        ]),
        card('ActionCard', '存取', [
          hrow('DataRow1', [
            node('Button', 'SaveNoteBtn', { Text: '存笔记', BackgroundColor: '#1565c0', TextColor: '#fff' }),
            node('Button', 'PickBtn', { Text: '选文件', BackgroundColor: '#0277bd', TextColor: '#fff' }),
            node('Button', 'FolderBtn', { Text: '选文件夹', BackgroundColor: '#0288d1', TextColor: '#fff' }),
          ]),
          node('TextBox', 'KeyBox', { Hint: '搜索关键词', Text: '' }),
          hrow('DataRow2', [
            node('Button', 'SearchBtn', { Text: '工坊搜索', BackgroundColor: '#00838f', TextColor: '#fff' }),
            node('Button', 'DbBtn', { Text: 'TinyDB+复制+分享', BackgroundColor: '#00695c', TextColor: '#fff' }),
            node('Button', 'ExportBtn', { Text: '导出', BackgroundColor: '#455a64', TextColor: '#fff' }),
          ]),
        ]),
        card('NetCard', '网络', [
          node('TextBox', 'UrlBox', { Hint: '网页请求 URL（可选）', Text: '' }),
          node('Button', 'WebBtn', { Text: 'Web 获取', BackgroundColor: '#5c6bc0', TextColor: '#fff' }),
        ]),
        card('ResultCard', '结果', [
          node('TextArea', 'ResultBox', { Hint: '搜索/网络结果', Height: 100 }),
        ]),
        tip('笔记保存 → 选文件 → 搜索 → TinyDB / 复制 / 分享 → 导出。另含 TinyWebDB。'),
      ]),
      nonVisible: [
        node('NotePad', 'NotePad1', { Namespace: 'tour_data' }),
        node('FilePicker', 'FilePicker1', { Multiple: true }),
        node('FolderPicker', 'FolderPicker1', {}),
        node('TextWorkshop', 'TextWorkshop1', {}),
        node('FileSaver', 'FileSaver1', {}),
        node('TinyDB', 'TinyDB1', { Namespace: 'tour' }),
        node('TinyWebDB', 'TinyWebDB1', {}),
        node('Web', 'Web1', {}),
        node('Clipboard', 'Clipboard1', {}),
        node('Sharing', 'Sharing1', {}),
      ],
      blocksXml: blocks,
    },
  ])
}

/** 拓展·真机舱 */
export function createTourDeviceTemplate(): AiProject {
  const blocks = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">Clock1</field>
    <field name="EVENT">Timer</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">LEDLabel1</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="clock_system_time"><field name="COMPONENT">Clock1</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="160">
    <field name="COMPONENT">BatterySensor1</field>
    <field name="EVENT">LevelChanged</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">BatLabel</field>
        <field name="PROP">Text</field>
        <value name="VALUE">
          <block type="text_join">
            <mutation items="2"></mutation>
            <value name="ADD0"><block type="text"><field name="TEXT">电量 </field></block></value>
            <value name="ADD1"><block type="component_get_property"><field name="COMPONENT">BatterySensor1</field><field name="PROP">Level</field></block></value>
          </block>
        </value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="340">
    <field name="COMPONENT">NetworkSensor1</field>
    <field name="EVENT">StatusChanged</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">NetLabel</field>
        <field name="PROP">Text</field>
        <value name="VALUE">
          <block type="logic_ternary">
            <value name="IF"><block type="component_get_property"><field name="COMPONENT">NetworkSensor1</field><field name="PROP">Online</field></block></value>
            <value name="THEN"><block type="text"><field name="TEXT">网络：在线</field></block></value>
            <value name="ELSE"><block type="text"><field name="TEXT">网络：离线</field></block></value>
          </block>
        </value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="520">
    <field name="COMPONENT">VibrateBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="vibrate">
        <field name="COMPONENT">Vibrator1</field>
        <value name="MS"><block type="math_number"><field name="NUM">300</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="640">
    <field name="COMPONENT">CallBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="phone_call">
        <field name="COMPONENT">PhoneCall1</field>
        <value name="NUMBER"><block type="text"><field name="TEXT">10086</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="780">
    <field name="COMPONENT">OpenBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="activity_start">
        <field name="COMPONENT">ActivityStarter1</field>
        <value name="URL"><block type="text"><field name="TEXT">https://www.bilibili.com</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="920">
    <field name="COMPONENT">ShakeSensor1</field>
    <field name="EVENT">Shaking</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">ShakeLabel</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">检测到摇一摇！</field></block></value>
        <next>
          <block type="vibrate">
            <field name="COMPONENT">Vibrator1</field>
            <value name="MS"><block type="math_number"><field name="NUM">200</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="1080">
    <field name="COMPONENT">Pedometer1</field>
    <field name="EVENT">StepTaken</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">StepLabel</field>
        <field name="PROP">Text</field>
        <value name="VALUE">
          <block type="text_join">
            <mutation items="2"></mutation>
            <value name="ADD0"><block type="text"><field name="TEXT">步数 </field></block></value>
            <value name="ADD1"><block type="component_get_property"><field name="COMPONENT">Pedometer1</field><field name="PROP">Steps</field></block></value>
          </block>
        </value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="1240">
    <field name="COMPONENT">ResetStepBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="pedometer_reset"><field name="COMPONENT">Pedometer1</field></block>
    </statement>
  </block>
  <block type="component_event" x="20" y="1360">
    <field name="COMPONENT">AccelerometerSensor1</field>
    <field name="EVENT">AccelerationChanged</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">AccelLabel</field>
        <field name="PROP">Text</field>
        <value name="VALUE">
          <block type="text_join">
            <mutation items="2"></mutation>
            <value name="ADD0"><block type="text"><field name="TEXT">X加速度 </field></block></value>
            <value name="ADD1"><block type="component_get_property"><field name="COMPONENT">AccelerometerSensor1</field><field name="PROP">XAccel</field></block></value>
          </block>
        </value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="1520">
    <field name="COMPONENT">MagneticFieldSensor1</field>
    <field name="EVENT">MagneticChanged</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">CompassLabel</field>
        <field name="PROP">Text</field>
        <value name="VALUE">
          <block type="text_join">
            <mutation items="2"></mutation>
            <value name="ADD0"><block type="text"><field name="TEXT">指南针 </field></block></value>
            <value name="ADD1"><block type="component_get_property"><field name="COMPONENT">MagneticFieldSensor1</field><field name="PROP">AbsoluteHeading</field></block></value>
          </block>
        </value>
      </block>
    </statement>
  </block>
</xml>`

  return project('拓展·真机舱', [
    {
      id: uid('screen'),
      name: 'Screen1',
      props: { Title: '真机舱', BackgroundColor: '#efebe9' },
      root: page([
        kicker('拓展 · 真机传感器'),
        card('HeroCard', '仪表', [
          node('LEDLabel', 'LEDLabel1', { Text: 'TIME', FontSize: 20 }),
          node('Label', 'BatLabel', { Text: '电量：…', FontSize: 14 }),
          node('Label', 'NetLabel', { Text: '网络：…', FontSize: 14 }),
          node('Label', 'ShakeLabel', { Text: '摇一摇：等待中', FontSize: 14, TextColor: '#bf360c' }),
          node('Label', 'StepLabel', { Text: '步数 0', FontSize: 14 }),
          node('Label', 'AccelLabel', { Text: 'X加速度 …', FontSize: 13, TextColor: '#5d4037' }),
          node('Label', 'CompassLabel', { Text: '指南针 …', FontSize: 13, TextColor: '#5d4037' }),
        ]),
        card('ActionCard', '操作', [
          hrow('DevBtns', [
            node('Button', 'VibrateBtn', { Text: '震动', BackgroundColor: '#6d4c41', TextColor: '#fff' }),
            node('Button', 'CallBtn', { Text: '拨号演示', BackgroundColor: '#5d4037', TextColor: '#fff' }),
            node('Button', 'OpenBtn', { Text: '打开网页', BackgroundColor: '#4e342e', TextColor: '#fff' }),
            node('Button', 'ResetStepBtn', { Text: '重置步数', BackgroundColor: '#795548', TextColor: '#fff' }),
          ]),
        ]),
        tip('电脑先看电量 / 网络；摇一摇、计步、陀螺仪、光线、接近、磁场、定位请装 APK 真机测。'),
      ]),
      nonVisible: [
        node('Clock', 'Clock1', { TimerEnabled: true, TimerInterval: 1000 }),
        node('BatterySensor', 'BatterySensor1', { Enabled: true }),
        node('NetworkSensor', 'NetworkSensor1', { Enabled: true }),
        node('ShakeSensor', 'ShakeSensor1', { Enabled: true }),
        node('AccelerometerSensor', 'AccelerometerSensor1', { Enabled: true }),
        node('OrientationSensor', 'OrientationSensor1', { Enabled: true }),
        node('LocationSensor', 'LocationSensor1', { Enabled: false }),
        node('GyroscopeSensor', 'GyroscopeSensor1', { Enabled: true }),
        node('ProximitySensor', 'ProximitySensor1', { Enabled: true }),
        node('Pedometer', 'Pedometer1', { Enabled: true }),
        node('LightSensor', 'LightSensor1', { Enabled: true }),
        node('MagneticFieldSensor', 'MagneticFieldSensor1', { Enabled: true }),
        node('Vibrator', 'Vibrator1', {}),
        node('PhoneCall', 'PhoneCall1', {}),
        node('ActivityStarter', 'ActivityStarter1', {}),
      ],
      blocksXml: blocks,
    },
  ])
}
