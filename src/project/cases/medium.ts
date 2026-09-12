import type { AiProject } from '../types'
import {
  tip, label, button, textBox, project, node, hrow, card, wrapXml, nv, uid, clickThenMethod,
  kicker, page,
} from '../templateKit'

export function createPetCareTemplate(): AiProject {
  const blocks = wrapXml(`
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">FeedBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">LevelBar1</field>
        <field name="PROP">Value</field>
        <value name="VALUE">
          <block type="math_arithmetic">
            <field name="OP">ADD</field>
            <value name="A"><block type="component_get_property"><field name="COMPONENT">LevelBar1</field><field name="PROP">Value</field></block></value>
            <value name="B"><block type="math_number"><field name="NUM">15</field></block></value>
          </block>
        </value>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">MoodLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">宠物：真香！</field></block></value>
            <next>
              <block type="tinydb_store">
                <field name="COMPONENT">TinyDB1</field>
                <value name="TAG"><block type="text"><field name="TEXT">hp</field></block></value>
                <value name="VALUE"><block type="component_get_property"><field name="COMPONENT">LevelBar1</field><field name="PROP">Value</field></block></value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="280">
    <field name="COMPONENT">PlayBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="score_add">
        <field name="COMPONENT">ScoreBoard1</field>
        <value name="DELTA"><block type="math_number"><field name="NUM">3</field></block></value>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">MoodLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">宠物：再玩一会儿嘛～</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="460">
    <field name="COMPONENT">LoadBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">LevelBar1</field>
        <field name="PROP">Value</field>
        <value name="VALUE">
          <block type="tinydb_get">
            <field name="COMPONENT">TinyDB1</field>
            <value name="TAG"><block type="text"><field name="TEXT">hp</field></block></value>
            <value name="DEFAULT"><block type="math_number"><field name="NUM">50</field></block></value>
          </block>
        </value>
        <next>
          <block type="notifier_alert">
            <field name="COMPONENT">Notifier1</field>
            <value name="MESSAGE"><block type="text"><field name="TEXT">已读取宠物状态</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>`)
  return project('电子宠物', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '电子宠物', BackgroundColor: '#e8f5e9' },
    root: page([
      kicker('中等 · 养成'),
      card('HeroCard', '我的宠物', [
        label('MoodLabel', '宠物：盯着你看', 16, '#2e7d32'),
        node('ScoreBoard', 'ScoreBoard1', { Title: '亲密度', Score: 0 }),
        node('LevelBar', 'LevelBar1', { Value: 50, MaxValue: 100 }),
        node('ProgressBar', 'ProgressBar1', { Progress: 50 }),
      ]),
      card('ActionCard', '互动', [
        hrow('Acts', [
          button('FeedBtn', '喂食', '#43a047'),
          button('PlayBtn', '玩耍', '#00897b'),
          button('LoadBtn', '读取', '#546e7a'),
        ]),
        node('Stepper', 'TreatStep', { Value: 1, MinValue: 1, MaxValue: 5 }),
        node('PasswordTextBox', 'OwnerPin', { Hint: '饲主暗号（练习）' }),
      ]),
      tip('喂食加血、玩耍加分，记得保存。'),
    ]),
    nonVisible: [nv('TinyDB', 'TinyDB1', { Namespace: 'pet' }), nv('Notifier', 'Notifier1')],
    blocksXml: blocks,
  }])
}

export function createBuzzerRaceTemplate(): AiProject {
  const blocks = wrapXml(`
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">StartBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="countdown_start"><field name="COMPONENT">Countdown1</field>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">StatusLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">抢答开始！</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="160">
    <field name="COMPONENT">BuzzBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="score_add">
        <field name="COMPONENT">ScoreBoard1</field>
        <value name="DELTA"><block type="math_number"><field name="NUM">1</field></block></value>
        <next>
          <block type="notifier_alert">
            <field name="COMPONENT">Notifier1</field>
            <value name="MESSAGE"><block type="text"><field name="TEXT">抢答成功！</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>`)
  return project('课堂抢答器', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '抢答器', BackgroundColor: '#fff3e0' },
    root: page([
      kicker('中等 · 抢答'),
      card('HeroCard', '赛况', [
        node('Countdown', 'Countdown1', { Seconds: 10, Remaining: 10, FontSize: 32 }),
        node('ScoreBoard', 'ScoreBoard1', { Title: '抢答分', Score: 0 }),
        label('StatusLabel', '等待开始', 15, '#e65100'),
      ]),
      card('ActionCard', '上场', [
        node('RadioButton', 'TeamA', { Text: '红队', GroupName: 'team', Checked: true }),
        node('RadioButton', 'TeamB', { Text: '蓝队', GroupName: 'team', Checked: false }),
        node('Spinner', 'RoundSpin', { ElementsFromString: '第1轮,第2轮,决赛', Selection: '第1轮' }),
        button('StartBtn', '开始倒计时', '#ef6c00'),
        button('BuzzBtn', '我来！', '#d84315'),
        node('Stopwatch', 'Stopwatch1', { FontSize: 14 }),
      ]),
      tip('先开始倒计时，再抢按铃。'),
    ]),
    nonVisible: [nv('Notifier', 'Notifier1'), nv('PhoneCall', 'PhoneCall1', {})],
    blocksXml: blocks,
  }])
}

export function createDiceDuelTemplate(): AiProject {
  const blocks = wrapXml(`
  ${clickThenMethod('DiceRed', 'dice_roll', 20, 20)}
  ${clickThenMethod('DiceBlue', 'dice_roll', 20, 120)}
  <block type="component_event" x="20" y="220">
    <field name="COMPONENT">DiceRed</field>
    <field name="EVENT">Rolled</field>
    <statement name="DO">
      <block type="score_add">
        <field name="COMPONENT">ScoreRed</field>
        <value name="DELTA"><block type="component_get_property"><field name="COMPONENT">DiceRed</field><field name="PROP">Result</field></block></value>
        <next>
          <block type="controls_if">
            <value name="IF0">
              <block type="logic_compare">
                <field name="OP">EQ</field>
                <value name="A"><block type="component_get_property"><field name="COMPONENT">DiceRed</field><field name="PROP">Result</field></block></value>
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
  <block type="component_event" x="20" y="460">
    <field name="COMPONENT">DiceBlue</field>
    <field name="EVENT">Rolled</field>
    <statement name="DO">
      <block type="score_add">
        <field name="COMPONENT">ScoreBlue</field>
        <value name="DELTA"><block type="component_get_property"><field name="COMPONENT">DiceBlue</field><field name="PROP">Result</field></block></value>
      </block>
    </statement>
  </block>`)
  return project('双人掷骰对战', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '掷骰对战', BackgroundColor: '#e3f2fd' },
    root: page([
      kicker('中等 · 双人对战'),
      card('HeroCard', '比分', [
        hrow('Scores', [
          node('ScoreBoard', 'ScoreRed', { Title: '红方', Score: 0 }),
          node('ScoreBoard', 'ScoreBlue', { Title: '蓝方', Score: 0 }),
        ]),
        node('ProgressRing', 'ProgressRing1', { Percent: 40 }),
      ]),
      card('ActionCard', '掷骰', [
        hrow('DiceRow', [
          node('Dice', 'DiceRed', {}),
          node('Dice', 'DiceBlue', {}),
        ]),
      ]),
      tip('红蓝轮流点骰子；红方掷到 6 会撒花。'),
    ]),
    nonVisible: [nv('Celebration', 'Celebration1', {}), nv('RandomHelper', 'RandomHelper1', {})],
    blocksXml: blocks,
  }])
}

export function createPasswordVaultTemplate(): AiProject {
  const blocks = wrapXml(`
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">UnlockBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="controls_if">
        <mutation else="1"></mutation>
        <value name="IF0">
          <block type="logic_compare">
            <field name="OP">EQ</field>
            <value name="A"><block type="component_get_property"><field name="COMPONENT">CodeBox</field><field name="PROP">Text</field></block></value>
            <value name="B"><block type="text"><field name="TEXT">318</field></block></value>
          </block>
        </value>
        <statement name="DO0">
          <block type="component_set_property">
            <field name="COMPONENT">StatusLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">开锁成功！宝箱打开了</field></block></value>
            <next>
              <block type="celebrate"><field name="COMPONENT">Celebration1</field></block>
            </next>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="controls_if">
            <mutation else="1"></mutation>
            <value name="IF0"><block type="component_get_property"><field name="COMPONENT">HintBox</field><field name="PROP">Checked</field></block></value>
            <statement name="DO0">
              <block type="notifier_alert">
                <field name="COMPONENT">Notifier1</field>
                <value name="MESSAGE"><block type="text"><field name="TEXT">提示：密码是三位数，试试 318</field></block></value>
              </block>
            </statement>
            <statement name="ELSE">
              <block type="component_set_property">
                <field name="COMPONENT">StatusLabel</field>
                <field name="PROP">Text</field>
                <value name="VALUE"><block type="text"><field name="TEXT">密码错误…再想想</field></block></value>
              </block>
            </statement>
          </block>
        </statement>
      </block>
    </statement>
  </block>`)
  return project('密码箱开锁', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '密码箱', BackgroundColor: '#efebe9' },
    root: page([
      kicker('中等 · 条件判断'),
      card('Vault', '神秘宝箱', [
        node('TableArrangement', 'TableTip', { Columns: 2 }, [
          label('L1', '提示', 12, '#8d6e63'),
          label('L2', '三位数', 12, '#8d6e63'),
        ]),
        label('StatusLabel', '锁着…', 16, '#5d4037'),
        node('NumberBox', 'CodeBox', { Text: '', Hint: '三位数密码' }),
        node('PasswordTextBox', 'FakePass', { Hint: '迷惑用密码框' }),
        node('CheckBox', 'HintBox', { Text: '要提示', Checked: false }),
        button('UnlockBtn', '开锁', '#5d4037'),
      ]),
      card('MoreCard', '备忘', [
        node('DatePicker', 'DatePicker1', {}),
        node('WebViewer', 'WebViewer1', { Height: 80, HomeUrl: 'https://zh.wikipedia.org' }),
      ]),
      tip('默认密码在积木里：318。勾选「要提示」会泄露暗号。'),
    ]),
    nonVisible: [nv('Celebration', 'Celebration1', {}), nv('Notifier', 'Notifier1'), nv('Web', 'Web1', {})],
    blocksXml: blocks,
  }])
}

export function createNamePickerTemplate(): AiProject {
  const blocks = wrapXml(`
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">PickBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="random_next_int">
        <field name="COMPONENT">RandomHelper1</field>
        <value name="MIN"><block type="math_number"><field name="NUM">1</field></block></value>
        <value name="MAX"><block type="math_number"><field name="NUM">40</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="160">
    <field name="COMPONENT">RandomHelper1</field>
    <field name="EVENT">GotResult</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">LEDLabel1</field>
        <field name="PROP">Text</field>
        <value name="VALUE">
          <block type="text_join">
            <mutation items="2"></mutation>
            <value name="ADD0"><block type="text"><field name="TEXT">No.</field></block></value>
            <value name="ADD1"><block type="component_get_property"><field name="COMPONENT">RandomHelper1</field><field name="PROP">LastResult</field></block></value>
          </block>
        </value>
      </block>
    </statement>
  </block>`)
  return project('幸运点名器', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '点名器', BackgroundColor: '#263238' },
    root: page([
      kicker('简单 · 随机点名'),
      card('HeroCard', '今晚幸运儿', [
        node('LEDLabel', 'LEDLabel1', { Text: 'READY', FontSize: 32 }),
        button('PickBtn', '抽学号！', '#00897b'),
      ]),
      card('MoreCard', '名单', [
        node('SearchBar', 'SearchBar1', { Hint: '搜索名单（练习）' }),
        node('ListView', 'ListView1', { ElementsFromString: '可自行改成名单', Height: 110 }),
      ]),
      tip('点抽取，LED 亮学号。可改积木里的最大人数。'),
    ]),
    nonVisible: [nv('RandomHelper', 'RandomHelper1', {}), nv('FolderPicker', 'FolderPicker1', {}), nv('TextWorkshop', 'TextWorkshop1', {})],
    blocksXml: blocks,
  }])
}

export function createMoodDiaryTemplate(): AiProject {
  const blocks = wrapXml(`
  <block type="component_event" x="20" y="20">
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
  <block type="component_event" x="20" y="200">
    <field name="COMPONENT">NotePad1</field>
    <field name="EVENT">AfterList</field>
    <statement name="DO">
      <block type="listview_set_elements">
        <field name="COMPONENT">NoteList</field>
        <value name="ELEMENTS"><block type="component_get_property"><field name="COMPONENT">NotePad1</field><field name="PROP">Titles</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="340">
    <field name="COMPONENT">NoteList</field>
    <field name="EVENT">AfterPicking</field>
    <statement name="DO">
      <block type="note_load">
        <field name="COMPONENT">NotePad1</field>
        <value name="TITLE"><block type="component_get_property"><field name="COMPONENT">NoteList</field><field name="PROP">Selection</field></block></value>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">BodyBox</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="component_get_property"><field name="COMPONENT">NotePad1</field><field name="PROP">Content</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>`)
  return project('心情日记本', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '心情日记', BackgroundColor: '#f3e5f5' },
    root: page([
      kicker('中等 · 记录心情'),
      card('ActionCard', '今天想写', [
        node('RadioButton', 'MoodHappy', { Text: '开心', GroupName: 'mood', Checked: true }),
        node('RadioButton', 'MoodMeh', { Text: '平淡', GroupName: 'mood', Checked: false }),
        node('RadioButton', 'MoodSad', { Text: '低落', GroupName: 'mood', Checked: false }),
        node('Slider', 'MoodSlider', { MinValue: 0, MaxValue: 100, ThumbPosition: 50 }),
        textBox('TitleBox', '日记标题'),
        node('TextArea', 'BodyBox', { Hint: '今天发生了什么…', Height: 100 }),
        node('TimePicker', 'TimePicker1', {}),
        button('SaveBtn', '存进日记本', '#8e24aa'),
      ]),
      card('MoreCard', '旧日记', [
        node('SearchBar', 'SearchBar1', { Hint: '搜索旧日记…' }),
        node('ScrollArrangement', 'Scroll1', { Height: 140, BackgroundColor: '#faf5fc' }, [
          node('ListView', 'NoteList', { ElementsFromString: '', Height: 120 }),
        ]),
      ]),
      tip('选心情、写日记、保存；点列表可再打开。'),
    ]),
    nonVisible: [nv('NotePad', 'NotePad1', { Namespace: 'mood_diary' }), nv('FilePicker', 'FilePicker1', {})],
    blocksXml: blocks,
  }])
}

export function createMathBlitzTemplate(): AiProject {
  const blocks = wrapXml(`
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">StartBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="countdown_start"><field name="COMPONENT">Countdown1</field></block>
    </statement>
  </block>
  <block type="component_event" x="20" y="120">
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
          <block type="score_add">
            <field name="COMPONENT">ScoreBoard1</field>
            <value name="DELTA"><block type="math_number"><field name="NUM">10</field></block></value>
            <next>
              <block type="notifier_alert">
                <field name="COMPONENT">Notifier1</field>
                <value name="MESSAGE"><block type="text"><field name="TEXT">答对！+10</field></block></value>
              </block>
            </next>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="notifier_alert">
            <field name="COMPONENT">Notifier1</field>
            <value name="MESSAGE"><block type="text"><field name="TEXT">再算算：7+5=?</field></block></value>
          </block>
        </statement>
      </block>
    </statement>
  </block>`)
  return project('限时口算闯关', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '限时口算', BackgroundColor: '#e8eaf6' },
    root: page([
      kicker('中等 · 限时口算'),
      card('HeroCard', '本题', [
        node('Countdown', 'Countdown1', { Seconds: 15, Remaining: 15, FontSize: 30 }),
        label('QLabel', '7 + 5 = ?', 26, '#283593'),
        node('ScoreBoard', 'ScoreBoard1', { Title: '口算分', Score: 0 }),
      ]),
      card('ActionCard', '作答', [
        node('NumberBox', 'AnsBox', { Text: '', Hint: '填答案' }),
        button('StartBtn', '开始计时', '#5c6bc0'),
        button('SubmitBtn', '提交', '#3949ab'),
      ]),
      tip('先开始倒计时，再提交 7+5 的答案。'),
    ]),
    nonVisible: [nv('Notifier', 'Notifier1'), nv('TinyWebDB', 'TinyWebDB1', {})],
    blocksXml: blocks,
  }])
}

export function createEmojiChatTemplate(): AiProject {
  const blocks = wrapXml(`
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">Emoji1</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">BubbleL</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">😀 哈哈哈</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="140">
    <field name="COMPONENT">Emoji2</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">BubbleR</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">🔥 太燃了</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="260">
    <field name="COMPONENT">Emoji3</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">BubbleL</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">💡 我有个点子</field></block></value>
      </block>
    </statement>
  </block>`)
  return project('表情包聊天室', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '表情聊天', BackgroundColor: '#e0f2f1' },
    root: page([
      kicker('简单 · 对话气泡'),
      card('HeroCard', '聊天', [
        node('TabBar', 'TabBar1', { ElementsFromString: '好友,群聊', Selection: '好友' }),
        node('ChatBubble', 'BubbleL', { Text: '你好呀', Side: '左' }),
        node('ChatBubble', 'BubbleR', { Text: '……', Side: '右', BackgroundColor: '#c8e6c9' }),
      ]),
      card('ActionCard', '表情', [
        hrow('Emo', [
          button('Emoji1', '😀', '#00897b'),
          button('Emoji2', '🔥', '#00695c'),
          button('Emoji3', '💡', '#004d40'),
        ]),
        node('ScrollArrangement', 'Scroll1', { Height: 36, BackgroundColor: 'transparent' }, [
          label('Hint', '可继续加更多表情按钮', 12, '#7a9691'),
        ]),
      ]),
      tip('点表情，左右气泡会换台词。'),
    ]),
    nonVisible: [nv('SpeechRecognizer', 'SpeechRecognizer1', {}), nv('TextToSpeech', 'TextToSpeech1', {})],
    blocksXml: blocks,
  }])
}

export function createColorMemoryTemplate(): AiProject {
  const blocks = wrapXml(`
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">FlashBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">FlashLabel</field>
        <field name="PROP">BackgroundColor</field>
        <value name="VALUE"><block type="text"><field name="TEXT">#e91e63</field></block></value>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">FlashLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">记住这个粉红！</field></block></value>
            <next>
              <block type="component_set_property">
                <field name="COMPONENT">SecretBox</field>
                <field name="PROP">Text</field>
                <value name="VALUE"><block type="text"><field name="TEXT">#e91e63</field></block></value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="260">
    <field name="COMPONENT">CheckBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="controls_if">
        <mutation else="1"></mutation>
        <value name="IF0">
          <block type="logic_compare">
            <field name="OP">EQ</field>
            <value name="A"><block type="component_get_property"><field name="COMPONENT">ColorPicker1</field><field name="PROP">Color</field></block></value>
            <value name="B"><block type="component_get_property"><field name="COMPONENT">SecretBox</field><field name="PROP">Text</field></block></value>
          </block>
        </value>
        <statement name="DO0">
          <block type="component_set_property">
            <field name="COMPONENT">FlashLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">记忆成功！</field></block></value>
            <next>
              <block type="celebrate"><field name="COMPONENT">Celebration1</field></block>
            </next>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="component_set_property">
            <field name="COMPONENT">FlashLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">差一点点，再选选</field></block></value>
          </block>
        </statement>
      </block>
    </statement>
  </block>`)
  return project('颜色记忆闪卡', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '颜色记忆', BackgroundColor: '#fafafa' },
    root: page([
      kicker('中等 · 记颜色'),
      card('Card1', '闪卡', [
        label('FlashLabel', '点「闪一下」', 18, '#fff'),
        label('SecretBox', '#e91e63', 1, 'transparent'),
      ]),
      card('ActionCard', '选回去', [
        node('ColorPicker', 'ColorPicker1', { Color: '#009688' }),
        button('FlashBtn', '闪一下', '#c2185b'),
        button('CheckBtn', '校验', '#ad1457'),
      ]),
      card('MoreCard', '灵感', [
        node('Image', 'Image1', { Width: 120, Height: 72, Picture: './media/photo.svg' }),
        node('Hyperlink', 'Link1', { Text: '配色灵感', Url: 'https://coolors.co' }),
        node('WebViewer', 'WebViewer1', { Height: 70, HomeUrl: 'https://zh.wikipedia.org' }),
      ]),
      tip('先闪一下记住颜色，用取色器选回再校验。'),
    ]),
    nonVisible: [nv('Celebration', 'Celebration1', {}), nv('Clipboard', 'Clipboard1', {})],
    blocksXml: blocks,
  }])
}

export function createReactionTimerTemplate(): AiProject {
  const blocks = wrapXml(`
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">StartBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="stopwatch_start"><field name="COMPONENT">Stopwatch1</field>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">HintLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">计时中…尽快点停！</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="160">
    <field name="COMPONENT">StopBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="stopwatch_pause"><field name="COMPONENT">Stopwatch1</field>
        <next>
          <block type="component_set_property">
            <field name="COMPONENT">HintLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">停！看看你的反应成绩</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="300">
    <field name="COMPONENT">Clock1</field>
    <field name="EVENT">Timer</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">LEDLabel1</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">TICK</field></block></value>
      </block>
    </statement>
  </block>`)
  return project('反应力秒表', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '反应秒表', BackgroundColor: '#e0f7fa' },
    root: page([
      kicker('中等 · 反应力'),
      card('HeroCard', '计时', [
        node('LEDLabel', 'LEDLabel1', { Text: 'GO', FontSize: 22 }),
        node('Stopwatch', 'Stopwatch1', { FontSize: 30 }),
        label('HintLabel', '准备好了吗？', 15, '#006064'),
      ]),
      card('ActionCard', '出手', [
        hrow('Btns', [
          button('StartBtn', '开始', '#00838f'),
          button('StopBtn', '停！', '#006064'),
        ]),
        label('BatLabel', '电量旁路显示', 12, '#607d8b'),
      ]),
      tip('开始后尽快点停，看你的反应。'),
    ]),
    nonVisible: [
      nv('Clock', 'Clock1', { TimerEnabled: true, TimerInterval: 1000 }),
      nv('BatterySensor', 'BatterySensor1', { Enabled: true }),
      nv('NetworkSensor', 'NetworkSensor1', { Enabled: true }),
      nv('LocationSensor', 'LocationSensor1', { Enabled: false }),
    ],
    blocksXml: blocks,
  }])
}

export function createShareCheerTemplate(): AiProject {
  const blocks = wrapXml(`
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">CopyBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="clipboard_copy">
        <field name="COMPONENT">Clipboard1</field>
        <value name="TEXT"><block type="component_get_property"><field name="COMPONENT">MsgBox</field><field name="PROP">Text</field></block></value>
        <next>
          <block type="notifier_alert">
            <field name="COMPONENT">Notifier1</field>
            <value name="MESSAGE"><block type="text"><field name="TEXT">已复制加油语</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="220">
    <field name="COMPONENT">ShareBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="sharing_share">
        <field name="COMPONENT">Sharing1</field>
        <value name="MESSAGE"><block type="component_get_property"><field name="COMPONENT">MsgBox</field><field name="PROP">Text</field></block></value>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="360">
    <field name="COMPONENT">SaveBtn</field>
    <field name="EVENT">Click</field>
    <statement name="DO">
      <block type="tinydb_store">
        <field name="COMPONENT">TinyDB1</field>
        <value name="TAG"><block type="text"><field name="TEXT">cheer</field></block></value>
        <value name="VALUE"><block type="component_get_property"><field name="COMPONENT">MsgBox</field><field name="PROP">Text</field></block></value>
      </block>
    </statement>
  </block>`)
  return project('加油语分享站', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '加油分享', BackgroundColor: '#fce4ec' },
    root: page([
      kicker('中等 · 分享'),
      card('ActionCard', '写一句给同学', [
        textBox('MsgBox', '例：今天也要元气满满！'),
        hrow('Btns', [
          button('CopyBtn', '复制', '#c2185b'),
          button('ShareBtn', '分享', '#ad1457'),
          button('SaveBtn', '存档', '#880e4f'),
        ]),
      ]),
      tip('写一句加油语，可以复制、分享或存档。'),
    ]),
    nonVisible: [
      nv('Clipboard', 'Clipboard1', {}),
      nv('Sharing', 'Sharing1', {}),
      nv('Notifier', 'Notifier1'),
      nv('TinyDB', 'TinyDB1', { Namespace: 'cheer' }),
      nv('FileSaver', 'FileSaver1', { FileName: 'cheer.txt' }),
      nv('TinyWebDB', 'TinyWebDB1', {}),
    ],
    blocksXml: blocks,
  }])
}

export function createNeonClockTemplate(): AiProject {
  const blocks = wrapXml(`
  <block type="component_event" x="20" y="20">
    <field name="COMPONENT">Clock1</field>
    <field name="EVENT">Timer</field>
    <statement name="DO">
      <block type="component_set_property">
        <field name="COMPONENT">LEDLabel1</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text"><field name="TEXT">NEON</field></block></value>
        <next>
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
        </next>
      </block>
    </statement>
  </block>
  <block type="component_event" x="20" y="220">
    <field name="COMPONENT">NightSwitch</field>
    <field name="EVENT">Changed</field>
    <statement name="DO">
      <block type="controls_if">
        <mutation else="1"></mutation>
        <value name="IF0"><block type="component_get_property"><field name="COMPONENT">NightSwitch</field><field name="PROP">On</field></block></value>
        <statement name="DO0">
          <block type="component_set_property">
            <field name="COMPONENT">ModeLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">夜间霓虹 ON</field></block></value>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="component_set_property">
            <field name="COMPONENT">ModeLabel</field>
            <field name="PROP">Text</field>
            <value name="VALUE"><block type="text"><field name="TEXT">日间模式</field></block></value>
          </block>
        </statement>
      </block>
    </statement>
  </block>`)
  return project('霓虹夜光钟', [{
    id: uid('screen'), name: 'Screen1',
    props: { Title: '霓虹钟', BackgroundColor: '#102027' },
    root: page([
      kicker('中等 · 时钟'),
      card('HeroCard', '霓虹屏', [
        node('LEDLabel', 'LEDLabel1', { Text: 'NEON', FontSize: 32 }),
        label('ModeLabel', '夜间霓虹 ON', 15, '#80cbc4'),
      ]),
      card('ActionCard', '模式', [
        node('Switch', 'NightSwitch', { Text: '夜间霓虹', On: true }),
        label('BatLabel', '电量 …', 13, '#b0bec5'),
        label('NetLabel', '网络旁路', 12, '#78909c'),
        node('QRCode', 'QRCode1', { Text: 'neon-clock', Size: 72 }),
      ]),
      tip('每秒跳动；拨夜间开关换风格。'),
    ]),
    nonVisible: [
      nv('Clock', 'Clock1', { TimerEnabled: true, TimerInterval: 1000 }),
      nv('BatterySensor', 'BatterySensor1', { Enabled: true }),
      nv('NetworkSensor', 'NetworkSensor1', { Enabled: true }),
      nv('GyroscopeSensor', 'GyroscopeSensor1', { Enabled: false }),
      nv('ProximitySensor', 'ProximitySensor1', { Enabled: false }),
      nv('Pedometer', 'Pedometer1', { Enabled: false }),
      nv('LightSensor', 'LightSensor1', { Enabled: false }),
      nv('MagneticFieldSensor', 'MagneticFieldSensor1', { Enabled: false }),
    ],
    blocksXml: blocks,
  }])
}
