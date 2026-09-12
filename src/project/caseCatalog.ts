import type { ComponentType } from './types'

/**
 * 定级多维标准（课堂用，非纯代码行数）：
 * 1. 积木体量：事件数、如果/否则分支、嵌套深度、生成代码行数
 * 2. 概念负荷：仅改属性 < 条件判断 < 计时/随机 < 持久化/分享 < 多屏/画布/文件/传感器算法
 * 3. 课堂步数：一节课能否改完并玩通；拓展=组件展馆；娱乐=放松合集
 * 比例锁定：简单9 · 中等12 · 难9 · 拓展6 · 娱乐3（多屏案例扩容）
 * 每次改内置案例积木/界面时递增 CASE_TEMPLATE_REV，打开旧工程会自动刷新。
 */
export const CASE_TEMPLATE_REV = 9

export type TemplateKind =
  // 简单 ×9
  | 'cheer_board'
  | 'coin_luck'
  | 'cafeteria_rate'
  | 'snack_cart'
  | 'crosswalk'
  | 'mood_bulb'
  | 'tap_frenzy'
  | 'emoji_chat'
  | 'name_picker'
  // 中等 ×12
  | 'charge_dash'
  | 'neon_clock'
  | 'buzzer_race'
  | 'reaction_timer'
  | 'color_memory'
  | 'math_blitz'
  | 'password_vault'
  | 'share_cheer'
  | 'mood_diary'
  | 'pet_care'
  | 'dice_duel'
  | 'shake'
  // 难 ×9（含多屏）
  | 'nav'
  | 'quiz'
  | 'draw'
  | 'rps_duel'
  | 'filesearch'
  | 'joy_ball'
  | 'story_book'
  | 'campus_tour'
  | 'quest_chain'
  // 拓展 ×6
  | 'tour_ui'
  | 'tour_fun'
  | 'tour_media'
  | 'tour_data'
  | 'tour_device'
  | 'camera'
  // 娱乐 ×3
  | 'party_box'
  | 'fortune_show'
  | 'mini_arcade'

export type CaseLevel = '简单' | '中等' | '难' | '拓展' | '娱乐'

export const CASE_LEVELS: CaseLevel[] = ['简单', '中等', '难', '拓展', '娱乐']

export interface CaseCatalogItem {
  id: TemplateKind
  label: string
  desc: string
  level: CaseLevel
  intro: string
  guide: string[]
  highlights: string[]
  minutes?: number
}

export const ALL_COMPONENT_COVERAGE: ComponentType[] = [
  'Button', 'Label', 'TextBox', 'TextArea', 'NumberBox', 'PasswordTextBox', 'SearchBar',
  'CheckBox', 'RadioButton', 'Switch', 'ToggleButton', 'Slider', 'Stepper',
  'Spinner', 'TabBar', 'DatePicker', 'TimePicker', 'Alarm', 'Reminder', 'ClockFace', 'CalendarView', 'TodoList',
  'CalculatorPad', 'WeatherBox', 'ProgressBar', 'RatingBar', 'ListView',
  'ContactList', 'DialPad',
  'Hyperlink', 'Badge', 'Avatar', 'ChatBubble', 'Marquee', 'ColorPicker', 'Divider',
  'HorizontalArrangement', 'VerticalArrangement', 'TableArrangement', 'ScrollArrangement', 'Card', 'Spacer',
  'Image', 'Canvas', 'WebViewer', 'MapView', 'Player', 'VideoPlayer', 'Camera', 'GalleryPicker', 'Sound',
  'TextToSpeech', 'SpeechRecognizer', 'SoundRecorder', 'BarcodeScanner',
  'Dice', 'CoinFlip', 'FortuneBall', 'TrafficLight', 'LightBulb',
  'Countdown', 'Stopwatch', 'ScoreBoard', 'LEDLabel', 'ProgressRing', 'LevelBar',
  'QRCode', 'Joystick', 'Ball', 'ImageSprite', 'Celebration',
  'NotePad', 'FilePicker', 'FolderPicker', 'TextWorkshop', 'FileSaver',
  'TinyDB', 'TinyWebDB', 'Web',
  'AccelerometerSensor', 'OrientationSensor', 'CompassView', 'LocationSensor', 'GyroscopeSensor',
  'ProximitySensor', 'Pedometer', 'LightSensor', 'MagneticFieldSensor',
  'BatterySensor', 'NetworkSensor', 'ShakeSensor',
  'Notifier', 'Clock', 'Sharing', 'ActivityStarter', 'PhoneCall', 'Texting', 'Emailer', 'Flashlight', 'DeviceNotify', 'Vibrator', 'Clipboard', 'RandomHelper',
]

export const CASE_CATALOG: CaseCatalogItem[] = [
  // ——— 简单 ×9：短积木、线性或轻分支、首课友好 ———
  {
    id: 'cheer_board',
    label: '弹幕加油墙',
    desc: '走马灯加油',
    level: '简单',
    minutes: 8,
    intro: '一点按钮，走马灯换成不同加油弹幕，像直播间刷屏。',
    guide: [
      '点不同加油语，看滚动条变化。',
      '积木：各按钮 → 设置走马灯文本（几乎无分支）。',
      '写一句你们班的专属口号。',
    ],
    highlights: ['走马灯', '按钮', '分割线', '超链接'],
  },
  {
    id: 'coin_luck',
    label: '抛硬币赌运气',
    desc: '正反面对决',
    level: '简单',
    minutes: 10,
    intro: '点硬币看正反，结果写在标签上——最短的事件链之一。',
    guide: [
      '点硬币；结果写在标签上。',
      '积木：被点击 → 抛硬币；Rolled → 更新标签。',
      '自己统计连胜次数。',
    ],
    highlights: ['硬币', '标签', '通知器', '二维码'],
  },
  {
    id: 'cafeteria_rate',
    label: '食堂今日打分',
    desc: '星星评菜',
    level: '简单',
    minutes: 10,
    intro: '给今日菜品打星，高分庆祝——认识「改变」事件和一次如果。',
    guide: [
      '拖动星星评分。',
      '积木：评分改变 → 更新评语；≥5 撒花。',
      '换成给「体育课」打分。',
    ],
    highlights: ['评分条', '标签', '血条', '庆祝'],
  },
  {
    id: 'snack_cart',
    label: '零食购物车',
    desc: '点单结算',
    level: '简单',
    minutes: 12,
    intro: '选零食、调数量，标签显示清单——练表单控件联动。',
    guide: [
      '换下拉选项、调步进数量。',
      '积木：步进/下拉改变 → 刷新清单文字。',
      '加日期当「送达日」。',
    ],
    highlights: ['下拉框', '步进器', '日期', '时间'],
  },
  {
    id: 'crosswalk',
    label: '过马路口诀',
    desc: '看灯再行动',
    level: '简单',
    minutes: 12,
    intro: '点交通灯切换灯色，标签喊出口诀：红灯停、绿灯行。',
    guide: [
      '点灯切换；看提示变化。',
      '积木：点击 → 下一灯色；Changed → 更新口诀。',
      '绿灯时让标签变成「冲！」。',
    ],
    highlights: ['交通灯', '标签', '表格布局'],
  },
  {
    id: 'mood_bulb',
    label: '心情灯泡',
    desc: '开关+变色心情',
    level: '简单',
    minutes: 12,
    intro: '拨开关点亮灯泡，再取色换心情光——属性绑定入门。',
    guide: [
      '拨开关看灯亮灭；选颜色点「换心情色」。',
      '积木：开关 → 灯泡 On；按钮 → 标签变色。',
      '加一句心情文案随颜色变化。',
    ],
    highlights: ['开关', '灯泡', '颜色选择', '头像'],
  },
  {
    id: 'tap_frenzy',
    label: '狂点挑战',
    desc: '连点冲高分',
    level: '简单',
    minutes: 12,
    intro: '拼命点按钮刷分！到 20 分撒花——计数 + 一次阈值判断。',
    guide: [
      '点「狂点！」看分数上涨。',
      '积木：点击 → 分数+1；若 ≥20 → 撒花。',
      '改成 30 分才撒花，或加「清零」。',
      '删掉积木再点：应完全没反应。',
    ],
    highlights: ['按钮', '标签', '庆祝'],
  },
  {
    id: 'emoji_chat',
    label: '表情包聊天室',
    desc: '气泡斗图',
    level: '简单',
    minutes: 12,
    intro: '点表情按钮，左右气泡轮流「斗图」——界面好玩，积木仍是设文本。',
    guide: [
      '点表情，看左右气泡变化。',
      '积木：设置聊天气泡文本（短事件链）。',
      '用标签栏切换「好友/群聊」标题。',
    ],
    highlights: ['聊天气泡', '标签栏', '按钮', '滚动'],
  },
  {
    id: 'name_picker',
    label: '幸运点名器',
    desc: '随机抽学号',
    level: '简单',
    minutes: 12,
    intro: '按下抽取，LED 亮出学号——认识随机助手，逻辑仍然很短。',
    guide: [
      '点「抽学号」。',
      '积木：随机整数 → GotResult 写到 LED。',
      '改范围适配你们班人数。',
    ],
    highlights: ['随机助手', 'LED', '按钮', '列表'],
  },

  // ——— 中等 ×12：条件/计时/存储/轻量传感器 ———
  {
    id: 'charge_dash',
    label: '蓄力冲刺',
    desc: '拉满蓄力条出发',
    level: '中等',
    minutes: 15,
    intro: '拖滑块蓄力，拉满再冲刺才成功——滑块联动 + 阈值分支。',
    guide: [
      '拖滑块看进度条；点冲刺看结果。',
      '积木：滑块改变 → 更新进度；冲刺时若 ≥90 成功否则失败。',
      '改阈值或成功文案。',
    ],
    highlights: ['滑块', '进度条', '进度环', '按钮'],
  },
  {
    id: 'neon_clock',
    label: '霓虹夜光钟',
    desc: '每秒跳动的 LED',
    level: '中等',
    minutes: 15,
    intro: '时钟每秒刷新霓虹字，切换夜间模式——认识定时器事件。',
    guide: [
      '观察 LED 跳动；拨夜间开关。',
      '积木：Clock Timer → 改 LED；开关改背景提示。',
      '接上网络传感器显示在线状态。',
    ],
    highlights: ['时钟', 'LED', '开关', '电量/网络'],
  },
  {
    id: 'buzzer_race',
    label: '课堂抢答器',
    desc: '倒计时抢答',
    level: '中等',
    minutes: 18,
    intro: '开始倒计时后谁先按铃谁得分，适合小组竞赛。',
    guide: [
      '点「开始」倒计时，再抢按「我来！」。',
      '积木：开始倒计时；抢答按钮加分并提示。',
      '改成两队各一个按钮对战。',
    ],
    highlights: ['倒计时', '记分牌', '通知器', '单选'],
  },
  {
    id: 'reaction_timer',
    label: '反应力秒表',
    desc: '看谁手快',
    level: '中等',
    minutes: 15,
    intro: '点开始后尽快点「停」，秒表停下比谁反应快。',
    guide: [
      '开始 → 停，看用时。',
      '积木：控制秒表组件；也可用时钟刷新 LED。',
      '和同桌比三次取最好成绩。',
    ],
    highlights: ['秒表', '时钟', 'LED', '电量'],
  },
  {
    id: 'color_memory',
    label: '颜色记忆闪卡',
    desc: '看色再复述',
    level: '中等',
    minutes: 18,
    intro: '系统闪一个颜色，你用取色器选回来，对了过关。',
    guide: [
      '点「闪一下」记住颜色，再取色点「校验」。',
      '积木：随机色写入标签背景；校验时比较。',
      '加难度：闪得更快（自己改文案节奏）。',
    ],
    highlights: ['颜色选择', '卡片', '按钮', '网页浏览'],
  },
  {
    id: 'math_blitz',
    label: '限时口算闯关',
    desc: '倒计时算一题',
    level: '中等',
    minutes: 20,
    intro: '限时算出屏幕上的加减题，答对加分——计时 + 答案判断。',
    guide: [
      '开始倒计时，在数字框作答，点提交。',
      '积木：判断答案；对了加分。',
      '自己改成乘法题。',
    ],
    highlights: ['倒计时', '数字框', '记分牌', '通知器'],
  },
  {
    id: 'password_vault',
    label: '密码箱开锁',
    desc: '猜三位数密码',
    level: '中等',
    minutes: 20,
    intro: '输入三位数开锁，对了庆祝，错了提示——文本比较与分支。',
    guide: [
      '默认密码看积木（可改）。',
      '输入数字点开锁。',
      '积木：比较文本；对了撒花，错了提示。',
      '加上密码框遮挡。',
    ],
    highlights: ['数字框', '密码框', '复选框', '庆祝'],
  },
  {
    id: 'share_cheer',
    label: '加油语分享站',
    desc: '复制+分享',
    level: '中等',
    minutes: 15,
    intro: '写一句加油语，复制剪贴板再分享——接触系统能力积木。',
    guide: [
      '输入句子，点复制/分享。',
      '积木：clipboard_copy、sharing_share。',
      '可选存进 TinyDB 当「今日金句」。',
    ],
    highlights: ['剪贴板', '分享', '文本框', 'TinyDB'],
  },
  {
    id: 'mood_diary',
    label: '心情日记本',
    desc: '选心情写笔记',
    level: '中等',
    minutes: 22,
    intro: '选今日心情，写下几句存进笔记库——读写持久数据。',
    guide: [
      '选心情单选，写正文，点保存。',
      '积木：保存笔记；列表点开再读。',
      '用搜索栏过滤标题（可拓展）。',
    ],
    highlights: ['单选', '多行文本', '笔记库', '列表'],
  },
  {
    id: 'pet_care',
    label: '电子宠物',
    desc: '喂食玩耍养成',
    level: '中等',
    minutes: 22,
    intro: '喂食加血、玩耍加分，状态存 TinyDB——养成 + 持久化。',
    guide: [
      '点喂食/玩耍，看血条与心情。',
      '积木：改 LevelBar，并用 TinyDB 保存。',
      '刷新预览看是否还记得状态。',
      '饿了（血低）弹出提示。',
    ],
    highlights: ['血条', '记分牌', 'TinyDB', '按钮'],
  },
  {
    id: 'dice_duel',
    label: '双人掷骰对战',
    desc: '比点数大小',
    level: '中等',
    minutes: 20,
    intro: '红蓝轮流掷骰比大小加分——多事件 + 条件加分。',
    guide: [
      '轮流点红方/蓝方骰。',
      '积木：各自 Rolled → 比大小加分。',
      '先到 30 分获胜。',
    ],
    highlights: ['骰子', '记分牌', '庆祝', '进度环'],
  },
  {
    id: 'shake',
    label: '摇一摇能量站',
    desc: '传感器计数',
    level: '中等',
    minutes: 18,
    intro: '电脑点按钮充能；真机可摇一摇——积木不长，但引入传感器概念。',
    guide: [
      '先点 +1 熟悉计数。',
      'APK 上试摇一摇/震动。',
      '对照积木看传感器事件如何接到加分。',
    ],
    highlights: ['摇一摇', '加速度', '震动'],
  },

  // ——— 难 ×6：多屏 / 画布 / 算法分支 / 文件 / 街机 ———
  {
    id: 'nav',
    label: '多屏闯关导航',
    desc: '屏幕切换',
    level: '难',
    minutes: 20,
    intro: '首页出发，跳到关卡页再回来——多屏幕导航是进阶关键技能。',
    guide: ['点按钮切换屏幕。', '积木：打开/关闭屏幕。', '给第二屏换关卡主题色。'],
    highlights: ['多屏幕', '按钮', '标签'],
  },
  {
    id: 'quiz',
    label: '星际问答赛',
    desc: '多屏答题',
    level: '难',
    minutes: 25,
    intro: '答对闯到结果页——多屏流程 + 对错分支。',
    guide: ['选题作答。', '用如果判断对错。', '结果页加庆祝。'],
    highlights: ['多屏', '按钮', '如果判断'],
  },
  {
    id: 'draw',
    label: '涂鸦决斗板',
    desc: 'Canvas 绘图',
    level: '难',
    minutes: 22,
    intro: '画两笔定胜负，清空再来——画布坐标与绘图事件。',
    guide: ['点按钮画线/清空。', '加颜色选择改笔色。'],
    highlights: ['画布', '按钮', '颜色选择'],
  },
  {
    id: 'rps_duel',
    label: '石头剪刀布',
    desc: '取余判胜负',
    level: '难',
    minutes: 30,
    intro: '出拳→掷骰映射电脑→取余算法判胜负。积木长、分支深，适合当算法挑战关。',
    guide: [
      '点石头/剪刀/布，看电脑出拳与胜负（赢了撒花）。',
      '重点读积木：(点数-1)%3 映射招式，再用取余比胜负。',
      '试着改成「平局也撒花」，或加连胜计数。',
      '和同桌对战：一人一台比连胜。',
    ],
    highlights: ['按钮', '骰子', '取余', '嵌套如果'],
  },
  {
    id: 'filesearch',
    label: '寻宝文件特工',
    desc: '选文件搜索',
    level: '难',
    minutes: 30,
    intro: '选中文件后搜索关键词——文件/文本工坊多事件链路。',
    guide: ['选文件 → 搜关键词 → 导出。', '进阶：文件夹批量搜。'],
    highlights: ['文件选择', '文本工坊', '文件保存'],
  },
  {
    id: 'joy_ball',
    label: '摇杆推球闯关',
    desc: '摇杆+小球',
    level: '难',
    minutes: 30,
    intro: '拖摇杆在场地里推球，靠近橙色精灵后点得分——真正的小游戏场地。',
    guide: [
      '拖摇杆看小球在虚线场地里移动。',
      '靠近精灵后点「得分」；碰不到会提示。',
      '积木：位置改变 → 移动到；得分用坐标范围判断。',
    ],
    highlights: ['摇杆', '小球', '精灵', '游戏场地'],
  },
  {
    id: 'story_book',
    label: '绘本翻页',
    desc: '四屏故事书',
    level: '难',
    minutes: 25,
    intro: '封面→第1页→第2页→结局，用「打开另一屏幕」练多屏叙事。',
    guide: [
      '从封面翻开，一路点到结局。',
      '积木：每个按钮打开对应屏幕名。',
      '试着给某一页换插图或旁白。',
    ],
    highlights: ['多屏幕', '图片', '聊天气泡'],
  },
  {
    id: 'campus_tour',
    label: '校园导览',
    desc: '地图进出多地点',
    level: '难',
    minutes: 25,
    intro: '地图进实验室/图书馆/小卖部，再返回——像校园 App。',
    guide: [
      '点地点进入子屏，再点回地图。',
      '积木：打开屏幕到 Lab / Library / Cafe。',
      '给图书馆列表加一本新书名。',
    ],
    highlights: ['多屏幕', '列表', '下拉框'],
  },
  {
    id: 'quest_chain',
    label: '任务链闯关',
    desc: '大厅→答题→通关',
    level: '难',
    minutes: 28,
    intro: '接任务、答对进入通关页撒花——多屏 + 条件判断。',
    guide: [
      '接受任务 → 填 12 → 通关撒花。',
      '积木：答对才打开 Clear 屏。',
      '改成自己的题目。',
    ],
    highlights: ['多屏', '如果判断', '庆祝'],
  },

  // ——— 拓展 ×6：组件展馆 / 专题体验 ———
  {
    id: 'tour_ui',
    label: '拓展·界面馆',
    desc: '控件与布局大全',
    level: '拓展',
    minutes: 35,
    intro: '可滚动的界面控件展览馆。',
    guide: ['滚动浏览。', '试提交校验。', '应用主题色。'],
    highlights: ['界面控件', '布局', '装饰'],
  },
  {
    id: 'tour_fun',
    label: '拓展·趣味厅',
    desc: '游戏化组件合集',
    level: '拓展',
    minutes: 35,
    intro: '骰子记分摇杆等一站体验。',
    guide: ['逐个试玩。', '做成掷骰闯关。'],
    highlights: ['趣味组件', '摇杆', '庆祝'],
  },
  {
    id: 'tour_media',
    label: '拓展·媒体台',
    desc: '音视频与语音',
    level: '拓展',
    minutes: 30,
    intro: '图片音视频相机语音。',
    guide: ['试拍照与朗读。'],
    highlights: ['媒体', '语音', '相机'],
  },
  {
    id: 'tour_data',
    label: '拓展·数据站',
    desc: '笔记·文件·网络',
    level: '拓展',
    minutes: 40,
    intro: '笔记文件网络分享全路径。',
    guide: ['存笔记、选文件、导出。'],
    highlights: ['笔记', '文件', '网络'],
  },
  {
    id: 'tour_device',
    label: '拓展·真机舱',
    desc: '传感器与系统',
    level: '拓展',
    minutes: 30,
    intro: '全部传感器 + 系统工具舱。',
    guide: ['电脑先看电量/网络；真机测摇一摇、计步、指南针等。'],
    highlights: ['全部传感器', '计步', '震动'],
  },
  {
    id: 'camera',
    label: '拓展·拍照贴图',
    desc: '相机/选图',
    level: '拓展',
    minutes: 20,
    intro: '拍照贴图做观察记录。',
    guide: ['点拍照；真机调相机。'],
    highlights: ['相机', '图片', '图库'],
  },

  // ——— 娱乐 ×3：放松合集，不当主线难度台阶 ———
  {
    id: 'party_box',
    label: '派对盒子',
    desc: '骰子硬币占卜抽号',
    level: '娱乐',
    minutes: 20,
    intro: '课堂派对工具箱。',
    guide: ['点控件玩；掷到 6 撒花。', '抽学号改范围。'],
    highlights: ['骰子', '硬币', '占卜', '随机', '庆祝'],
  },
  {
    id: 'fortune_show',
    label: '趣味占卜秀',
    desc: '灯光音效占卜',
    level: '娱乐',
    minutes: 18,
    intro: '占卜球小舞台秀。',
    guide: ['点球出签；朗读/分享。'],
    highlights: ['占卜球', '交通灯', '语音', '分享'],
  },
  {
    id: 'mini_arcade',
    label: '迷你街机',
    desc: '限时吃星星',
    level: '娱乐',
    minutes: 25,
    intro: '点开始限时拖摇杆，小球碰到星星区自动加分——街机手感。',
    guide: [
      '点「开始 20 秒」后拖摇杆。',
      '碰到星星会在整块场地随机换位；时间到撒花。',
      '场地虚线框里才能看见球在动。',
    ],
    highlights: ['摇杆', '小球', '倒计时', '记分'],
  },
]
