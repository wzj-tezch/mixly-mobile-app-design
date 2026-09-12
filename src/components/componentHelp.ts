import type { ComponentType } from '@/project/types'
import { getMeta } from '@/components/registry'

export interface ComponentHelpDoc {
  summary: string
  howTo: string[]
  example: {
    title: string
    steps: string[]
    blocksHint?: string
  }
  tips?: string[]
}

const DOCS: Partial<Record<ComponentType, ComponentHelpDoc>> = {
  Button: {
    summary: '可点击的按钮，用来触发操作（跳转、改文字、播放、保存等）。',
    howTo: [
      '从「用户界面」拖到屏幕（或双击添加）。',
      '在右侧属性里改「文本」「背景色」「文字色」等。',
      '切到「积木」页，用「当 按钮.被点击」写逻辑。',
    ],
    example: {
      title: '点击按钮改标签文字',
      steps: [
        '放一个「按钮」和一个「标签」。',
        '积木：当 Button1.被点击 → 设置 Label1.文本 为「你好」。',
        '预览中点按钮，标签应变为「你好」。',
      ],
      blocksHint: '事件 → 当…被点击；属性 → 设置…文本',
    },
    tips: ['长按可用「被长按」事件。', '把「启用」关掉后按钮不可点。'],
  },
  Label: {
    summary: '用来显示一段文字（标题、结果、提示），一般不响应点击。',
    howTo: [
      '拖到屏幕上，在属性里设置「文本」「字号」「文字色」。',
      '需要动态改字时，用积木「设置 标签.文本」。',
    ],
    example: {
      title: '显示计算结果',
      steps: [
        '放 Label1，默认文字「结果：」。',
        '用数学积木算出数字后，设置 Label1.文本 为「结果：」+ 数字。',
      ],
    },
  },
  TextBox: {
    summary: '单行输入框，让用户输入文字。',
    howTo: [
      '拖到屏幕，设置「提示」文字（Hint）。',
      '用积木「获取 TextBox1.文本」读取输入内容。',
    ],
    example: {
      title: '输入姓名后点按钮打招呼',
      steps: [
        '放 TextBox1、Button1、Label1。',
        '当 Button1.被点击 → 设置 Label1.文本 为「你好，」+ 获取 TextBox1.文本。',
      ],
      blocksHint: '属性 → 获取…文本；文本 → 连接',
    },
  },
  PasswordTextBox: {
    summary: '密码输入框，输入内容以圆点显示，适合登录场景。',
    howTo: [
      '用法与文本框类似，但屏幕上不直接显示明文。',
      '用「获取 密码框.文本」读取密码（仅课堂练习，勿存真实密码）。',
    ],
    example: {
      title: '简单口令校验',
      steps: [
        '输入口令后点「登录」。',
        '若获取 PasswordTextBox1.文本 = 「1234」则提示成功，否则提示失败。',
      ],
    },
    tips: ['真实 App 不要把密码写死在积木里。'],
  },
  CheckBox: {
    summary: '复选框：勾选/取消，适合「同意协议」「多选」等。',
    howTo: [
      '属性「文本」是选项说明，「勾选」是初始状态。',
      '事件「值改变」在勾选状态变化时触发；也可用「获取.勾选」。',
    ],
    example: {
      title: '同意后才能继续',
      steps: [
        '放 CheckBox1（文本：我已阅读）和 Button1。',
        '当 Button1.被点击：如果 获取 CheckBox1.勾选 为真 → 打开下一屏，否则显示警告。',
      ],
    },
  },
  Switch: {
    summary: '开关控件，表示开/关两种状态（属性 On）。',
    howTo: [
      '拖到屏幕，设置开关旁的说明文字。',
      '用「获取.开关」或「值改变」事件控制功能开关。',
    ],
    example: {
      title: '开关控制计时器',
      steps: [
        '放 Switch1 与 Clock1。',
        '当 Switch1.值改变 → 设置 Clock1 的计时启用为 获取 Switch1.开关。',
      ],
    },
  },
  Slider: {
    summary: '滑块，用来选一个数值区间内的位置（音量、亮度、进度等）。',
    howTo: [
      '设置最小值、最大值、当前位置（ThumbPosition）。',
      '「滑块位置改变」事件可实时读取数值。',
    ],
    example: {
      title: '用滑块改标签字号',
      steps: [
        'Slider1 范围 10～40。',
        '当滑块位置改变 → 设置 Label1 字号为 获取 Slider1.滑块位置（若属性面板无字号积木，可改文本显示当前值）。',
      ],
    },
  },
  Spinner: {
    summary: '下拉选择框，从逗号分隔的选项里选一项。',
    howTo: [
      '在「列表元素(逗号分隔)」填如：苹果,香蕉,橙子。',
      '「下拉选中后」事件触发；用「获取.选中项」读当前值。',
    ],
    example: {
      title: '选择班级',
      steps: [
        'ElementsFromString = 一班,二班,三班。',
        '选中后设置 Label1.文本 为「你选了」+ 选中项。',
      ],
    },
  },
  DatePicker: {
    summary: '日期选择器，让用户选年月日。',
    howTo: [
      '可设置初始「日期」。',
      '「日期设定后」事件触发；用「获取.日期」读取。',
    ],
    example: {
      title: '记录作业日期',
      steps: ['选日期后点保存 → TinyDB 存储标签「作业日」= 获取 DatePicker1.日期。'],
    },
  },
  TimePicker: {
    summary: '时间选择器，让用户选时分。',
    howTo: ['与日期选择器类似，事件为「时间设定后」，属性为「时间」。'],
    example: {
      title: '设定提醒时间',
      steps: ['选择时间后，Label 显示「提醒：」+ 获取 TimePicker1.时间。'],
    },
  },
  ProgressBar: {
    summary: '进度条外观组件，用于示意加载或进度（当前为示意样式）。',
    howTo: ['拖到屏幕表示「正在加载」区域。', '可与时钟配合，定时改界面状态。'],
    example: {
      title: '等待提示',
      steps: ['在请求网页期间显示进度条旁的标签「加载中…」，完成后改文字。'],
    },
  },
  RatingBar: {
    summary: '评分条（星星滑块），适合满意度、难度打分。',
    howTo: [
      '设置「评分」「满分」。',
      '「值改变」时用「获取.评分」读取。',
    ],
    example: {
      title: '给作品打分',
      steps: [
        'RatingBar1 满分 5。',
        '当值改变 → 设置 Label1.文本 为「你打了」+ 评分 +「分」。',
      ],
    },
  },
  ListView: {
    summary: '列表：把多项排成可点击的列表。',
    howTo: [
      '属性「列表元素」用逗号分隔，或用积木「设置列表元素」。',
      '「列表选中后」触发；「获取.选中项」得到点中的那一项。',
    ],
    example: {
      title: '点选城市',
      steps: [
        '元素：北京,上海,广州。',
        '选中后 Notifier 显示警告「你选了」+ 选中项。',
      ],
      blocksHint: '界面 → 设置列表元素；事件 → 列表选中后',
    },
  },
  HorizontalArrangement: {
    summary: '水平布局容器：子组件从左到右排列。',
    howTo: [
      '先拖入水平布局，再把按钮、标签等拖进这个容器里。',
      '适合做工具栏、一行多个控件。',
    ],
    example: {
      title: '一行两个按钮',
      steps: ['水平布局内放「上一题」「下一题」两个按钮。'],
    },
  },
  VerticalArrangement: {
    summary: '垂直布局容器：子组件从上到下排列（最常用的页面骨架）。',
    howTo: ['作为屏幕根内容的主容器，把标题、输入、按钮依次放进去。'],
    example: {
      title: '登录表单',
      steps: ['垂直布局：标题标签 → 文本框 → 密码框 → 登录按钮。'],
    },
  },
  TableArrangement: {
    summary: '表格布局：按列数把子组件排成网格。',
    howTo: ['设置「列数」，再按顺序添加子组件，会自动填入格子。'],
    example: {
      title: '九宫格按键',
      steps: ['列数 3，放入 9 个按钮做简易计算器键盘。'],
    },
  },
  Image: {
    summary: '显示图片，可点选资源库图片或填写 URL。',
    howTo: [
      '在「资源」面板上传图片，再到属性「图片」里选用。',
      '也可填网络图片地址；相机拍照后可用积木设置 Picture。',
    ],
    example: {
      title: '拍照显示',
      steps: [
        '放 Camera1、Image1、Button1。',
        '当按钮被点击 → 相机.拍照，显示到 Image1。',
      ],
      blocksHint: '媒体 → 拍照',
    },
  },
  Canvas: {
    summary: '画布：可画画线、画圆，并响应触摸/拖动。',
    howTo: [
      '设置高度与背景色。',
      '积木：画布.清空 / 画线 / 画圆；事件：被触摸、被拖动。',
    ],
    example: {
      title: '点一下画圆',
      steps: [
        '当 Canvas1.被触摸 → 画圆（圆心可用固定坐标或稍后扩展）。',
        '再做一个「清空」按钮调用画布.清空。',
      ],
      blocksHint: '媒体 → 画线 / 画圆 / 清空',
    },
  },
  Ball: {
    summary: '小球精灵：圆形可移动物体，常用于简单游戏。',
    howTo: [
      '设置半径、颜色、X/Y。',
      '积木「移动到」改变位置；事件「被触摸」。',
    ],
    example: {
      title: '点一下小球跳走',
      steps: [
        '当 Ball1.被触摸 → Ball1.移动到 随机 x、随机 y。',
      ],
      blocksHint: '媒体 → 移动到；数学 → 随机整数',
    },
  },
  ImageSprite: {
    summary: '图片精灵：带图片的可移动角色。',
    howTo: ['设置 Picture 与宽高、坐标；用法类似小球，适合人物/道具。'],
    example: {
      title: '角色移动',
      steps: ['按钮「向右」→ 设置 ImageSprite1.X 为 获取.X + 10。'],
    },
  },
  WebViewer: {
    summary: '内嵌网页浏览区。部分网站禁止被嵌入，可用「新窗口打开」。',
    howTo: [
      '属性 HomeUrl 填 https 网址。',
      '积木「打开网址」可跳转；事件「页面加载完成」。',
    ],
    example: {
      title: '打开维基百科',
      steps: ['HomeUrl 设为 https://zh.wikipedia.org ，预览查看；若空白点「新窗口打开」。'],
    },
    tips: ['example.com 等演示站可能被拦截，换真实可访问站点。'],
  },
  Player: {
    summary: '音频播放器（带控件），可播网络或资源音频地址。',
    howTo: [
      '属性「音频地址」填 mp3 等链接。',
      '积木：开始播放 / 暂停 / 停止；事件「播放完成」。',
    ],
    example: {
      title: '点按钮播音乐',
      steps: ['Button 被点击 → Player1.开始播放。'],
      blocksHint: '媒体 → 开始播放',
    },
  },
  VideoPlayer: {
    summary: '视频播放器，用法与音频播放器类似。',
    howTo: ['填视频地址（mp4 等），用开始/暂停/停止积木控制。'],
    example: {
      title: '课堂微课',
      steps: ['设置 Source 后预览，或用按钮调用开始播放。'],
    },
  },
  Sound: {
    summary: '非可见短音效组件，适合点击反馈音。',
    howTo: [
      '拖到屏幕后出现在「非可见组件」区。',
      '设置 Source，积木「播放音效」。',
    ],
    example: {
      title: '点按钮叮一声',
      steps: ['Button 被点击 → Sound1.播放音效。'],
    },
  },
  Camera: {
    summary: '非可见相机：真机调摄像头，电脑预览多为选图。',
    howTo: [
      '添加相机组件。',
      '积木「拍照」并选择显示到哪个 Image。',
      '「拍照完成后」可继续处理。',
    ],
    example: {
      title: '植物观察记录',
      steps: ['拍照显示到 Image1，再把说明文字存入 TinyDB。'],
    },
  },
  TextToSpeech: {
    summary: '文字转语音：把文字朗读出来（依赖浏览器语音引擎）。',
    howTo: ['添加组件，积木「朗读」接上要说的文本；语言默认 zh-CN。'],
    example: {
      title: '读出标签内容',
      steps: ['按钮被点击 → TextToSpeech1.朗读 获取 Label1.文本。'],
      blocksHint: '媒体 → 朗读',
    },
    tips: ['部分浏览器需用户先点击页面后才能出声。'],
  },
  SpeechRecognizer: {
    summary: '语音识别：说话转文字（需麦克风权限，浏览器支持不一）。',
    howTo: [
      '积木「开始语音识别」。',
      '在「取得语音文本后」事件里「获取.识别结果」。',
    ],
    example: {
      title: '语音填空',
      steps: [
        '点按钮开始识别 → AfterGettingText → 设置 TextBox1.文本 为 识别结果。',
      ],
    },
    tips: ['建议用 Chrome；需允许麦克风。'],
  },
  Notifier: {
    summary: '通知器：弹出提示、消息框、二选一对话框。',
    howTo: [
      '非可见组件。',
      '积木：显示警告 / 显示消息对话框 / 显示选择对话框。',
      '选择对话框结束后触发「AfterChoosing」，可读 Choice。',
    ],
    example: {
      title: '确认删除',
      steps: [
        '显示选择对话框（是/否）。',
        '在 AfterChoosing 里判断选择结果再执行删除逻辑。',
      ],
      blocksHint: '通知 → 显示警告 / 选择对话框',
    },
  },
  Clock: {
    summary: '时钟：定时触发，也可取系统时间。',
    howTo: [
      '设置「间隔(ms)」并打开「启用计时」。',
      '事件「计时器触发」周期性执行；积木「系统时间」返回毫秒时间戳。',
    ],
    example: {
      title: '每秒计数',
      steps: [
        'Clock 间隔 1000，启用。',
        '计时器触发 → 变量 count + 1 → 显示到标签。',
      ],
    },
  },
  TinyDB: {
    summary: '本地数据库：把键值对存在本机（刷新后仍在，按命名空间区分）。',
    howTo: [
      '积木：存储值 / 读取值 / 清除标签 / 清除全部。',
      '标签像「钥匙」，值可以是文字或数字。',
    ],
    example: {
      title: '记住昵称',
      steps: [
        '保存：TinyDB1.存储值 标签「昵称」值=文本框内容。',
        '打开屏幕时：设置标签文本 为 TinyDB1.读取值「昵称」默认「同学」。',
      ],
      blocksHint: '存储 → 存储值 / 读取值',
    },
  },
  TinyWebDB: {
    summary: '网络键值库：可接服务地址；未填地址时用本机模拟。',
    howTo: [
      'StoreValue / GetValue 异步；结果在「取得网络值」「网络值已存」事件中读 Tag/Value。',
    ],
    example: {
      title: '课堂排行榜标签',
      steps: ['存储「score」= 分数；之后 GetValue，在 GotValue 里更新标签。'],
    },
  },
  Web: {
    summary: '网页请求：用 GET 拉取网页或接口文本。',
    howTo: [
      '积木「获取网页」填 URL。',
      '「取得网页内容」后「获取.网页内容」。',
    ],
    example: {
      title: '拉取公开文本',
      steps: [
        '注意跨域：很多接口在浏览器会被 CORS 拦住，课堂可用老师提供的允许跨域地址。',
      ],
    },
    tips: ['失败时也会触发事件，内容可能为空。'],
  },
  Sharing: {
    summary: '分享：调用系统分享；不支持时复制到剪贴板。',
    howTo: ['积木「分享消息」接上文本即可。'],
    example: {
      title: '分享成绩',
      steps: ['按钮 → Sharing1.分享消息「我得了」+ 分数 +「分」。'],
    },
  },
  ActivityStarter: {
    summary: '活动启动器：在新窗口/标签打开网址。',
    howTo: ['积木「打开活动(网址)」；也可在属性里填默认网址。'],
    example: {
      title: '打开学习网站',
      steps: ['按钮 → 打开活动 https://www.bilibili.com'],
    },
  },
  PhoneCall: {
    summary: '电话：跳转到拨号界面（需真机或支持 tel: 的环境）。',
    howTo: ['积木「拨打电话」填号码，或用属性「电话号码」。'],
    example: {
      title: '一键联系老师',
      steps: ['按钮 → 拨打电话「10086」（演示号请换成课堂允许的号码）。'],
    },
  },
  AccelerometerSensor: {
    summary: '加速度传感器：读取晃动/加速度（电脑上常不可用）。',
    howTo: [
      '启用后监听「加速度变化」。',
      '用「获取.X加速度 / Y加速度 / Z加速度」读数值。',
    ],
    example: {
      title: '摇一摇提示',
      steps: ['加速度变化时若数值较大 → Notifier 显示「检测到晃动」。'],
    },
    tips: ['真机 + HTTPS/APK 环境更可靠。'],
  },
  OrientationSensor: {
    summary: '方向传感器：设备朝向变化（Angle/Roll/Pitch）。',
    howTo: [
      '启用后监听「方向变化」。',
      '用「获取.方位角 / 俯仰角 / 翻滚角」做倾斜控制。',
    ],
    example: {
      title: '倾斜控制',
      steps: ['方向变化时根据翻滚角移动小球 X。'],
    },
  },
  LocationSensor: {
    summary: '定位传感器：获取经纬度、海拔、精度、速度（需定位权限）。',
    howTo: [
      '将「启用」打开。',
      '「位置变化」后获取纬度/经度/海拔/定位精度/速度。',
    ],
    example: {
      title: '显示当前位置',
      steps: ['LocationChanged → 标签显示 纬度 + 逗号 + 经度。'],
    },
    tips: ['浏览器会询问定位权限；室内精度可能较差。'],
  },
  GyroscopeSensor: {
    summary: '陀螺仪：读取设备旋转角速度（真机更准）。',
    howTo: ['启用后监听「陀螺仪变化」，获取 X/Y/Z 角速度。'],
    example: {
      title: '旋转提示',
      steps: ['角速度较大时标签显示「转起来了」。'],
    },
  },
  ProximitySensor: {
    summary: '接近传感器：检测是否靠近（依赖设备硬件）。',
    howTo: ['监听「接近变化」，获取「是否靠近」或「接近距离」。'],
    example: {
      title: '遮挡息屏演示',
      steps: ['靠近时标签显示「靠近」，离开显示「远离」。'],
    },
    tips: ['多数桌面浏览器不可用，请用真机 APK 测试。'],
  },
  Pedometer: {
    summary: '计步器：根据加速度估算步数。',
    howTo: [
      '监听「走了一步」，获取「步数」。',
      '可用积木「重置步数」清零。',
    ],
    example: {
      title: '课间健步',
      steps: ['每走一步更新标签；按钮重置步数。'],
    },
  },
  LightSensor: {
    summary: '光线传感器：读取环境光照度（lux）。',
    howTo: ['监听「光线变化」，获取「光照度」。'],
    example: {
      title: '暗光提醒',
      steps: ['光照度 < 20 时提示「光线太暗」。'],
    },
  },
  MagneticFieldSensor: {
    summary: '磁场传感器：指南针方位与磁场分量。',
    howTo: ['监听「磁场变化」，获取「指南针方位」或 MagX/Y/Z。'],
    example: {
      title: '简易指南针',
      steps: ['磁场变化 → 标签显示方位角度。'],
    },
  },
  Dice: {
    summary: '趣味骰子：用积木「掷骰子」出点数，适合课堂小游戏、抽签。',
    howTo: [
      '拖到屏幕，可设置「面数」（默认 6）。',
      '必须用积木：当骰子.被点击 → 「掷骰子」；不能指望预览自动掷。',
      '事件「掷出结果」后「获取.点数」。',
    ],
    example: {
      title: '掷骰子闯关',
      steps: [
        '当 Dice1.被点击 → 掷骰子。',
        '当 Dice1.掷出结果 → 若 点数 = 6 → Celebration.放庆祝特效，否则标签显示点数。',
      ],
      blocksHint: '事件 → 被点击 → 趣味「掷骰子」；再接「掷出结果」',
    },
  },
  Marquee: {
    summary: '走马灯：文字横向滚动，适合通知条、口号展示。',
    howTo: ['设置文本、速度（秒数越大越慢）、颜色。', '可用积木「设置.文本」换内容。'],
    example: {
      title: '校园广播条',
      steps: ['文本设为「今日值日：三年二班 ★ 请保持安静」。'],
    },
  },
  ColorPicker: {
    summary: '颜色选择器：选色后可用于改背景、画笔色等。',
    howTo: ['「值改变」时「获取.颜色」。'],
    example: {
      title: '选色改画布',
      steps: ['ColorPicker 改变 → 设置 Canvas1.背景色 为 获取.颜色。'],
    },
  },
  Countdown: {
    summary: '倒计时：答题限时、课堂计时都很实用。',
    howTo: [
      '设置总秒数，积木：开始/暂停/重置倒计时。',
      '「计时跳动」「倒计时结束」事件。',
    ],
    example: {
      title: '10 秒抢答',
      steps: ['按钮开始 → Countdown.开始倒计时；结束后 Notifier 提示「时间到」。'],
      blocksHint: '趣味 → 开始倒计时',
    },
  },
  Stopwatch: {
    summary: '秒表：记录用时，精确到 0.1 秒。',
    howTo: ['开始/暂停/重置秒表；「获取.已过秒数」。'],
    example: {
      title: '口算计时',
      steps: ['出题时 Start，交卷时 Pause，把 Elapsed 显示到标签。'],
    },
  },
  QRCode: {
    summary: '二维码：把文字/网址生成二维码图（需联网加载生成服务）。',
    howTo: ['填「内容」，改内容后可用「刷新二维码」。'],
    example: {
      title: '作品分享码',
      steps: ['内容设为作品介绍网址；手机扫码打开。'],
      blocksHint: '趣味 → 刷新二维码',
    },
    tips: ['依赖在线二维码 API，离线环境可能无法显示。'],
  },
  Joystick: {
    summary: '虚拟摇杆：拖动得到 X/Y（约 -1～1），适合控制小球。',
    howTo: [
      '拖动摇杆；「滑块位置改变」同类事件用「位置改变」。',
      '松开触发「摇杆松开」，坐标归零。',
      '「获取.X坐标」「获取.Y坐标」。',
    ],
    example: {
      title: '摇杆推小球',
      steps: [
        '当 Joystick1.位置改变 → Ball1.移动到 原X+摇杆X*8、原Y+摇杆Y*8。',
      ],
    },
  },
  ChatBubble: {
    summary: '聊天气泡：对话故事、角色扮演界面很合适。',
    howTo: ['设文本与朝向（左/右）；可点触发「被点击」。'],
    example: {
      title: '双人对话',
      steps: ['左气泡写「你好」，右气泡写「嗨！」；点气泡切换下一句文本。'],
    },
  },
  Celebration: {
    summary: '庆祝特效：撒花彩纸，闯关成功时用。',
    howTo: ['非可见组件；积木「放庆祝特效」。'],
    example: {
      title: '答对撒花',
      steps: ['判断答对 → Celebration1.放庆祝特效。'],
      blocksHint: '趣味 → 放庆祝特效',
    },
  },
  TextArea: {
    summary: '多行文本输入，适合留言、日记。',
    howTo: ['设置提示与高度；用「获取.文本」读取。'],
    example: { title: '课堂留言', steps: ['提交按钮 → TinyDB 存储 TextArea 文本。'] },
  },
  NumberBox: {
    summary: '数字输入框，便于做加减题。',
    howTo: ['事件「值改变」；文本即数字。'],
    example: { title: '两数相加', steps: ['读取两个数字框 → 相加 → 显示到标签。'] },
  },
  Hyperlink: {
    summary: '超链接文字，点击打开网址。',
    howTo: ['设置文字与网址。'],
    example: { title: '学习资源', steps: ['Url 填课程网站地址。'] },
  },
  Divider: {
    summary: '分割线，分隔界面区域。',
    howTo: ['调整颜色与粗细。'],
    example: { title: '分区', steps: ['标题与内容之间放一条分割线。'] },
  },
  Spacer: {
    summary: '空白占位，拉开组件间距。',
    howTo: ['设置高度即可。'],
    example: { title: '留白', steps: ['按钮上方加 24px 占位。'] },
  },
  Badge: {
    summary: '徽章/角标，显示「新」「热」等短标签。',
    howTo: ['可点击触发 Click。'],
    example: { title: '新消息', steps: ['有未读时设置徽章文本为数量。'] },
  },
  Stepper: {
    summary: '步进器：加减调节数量。',
    howTo: ['设置最小/最大/步长；「值改变」读 Value。'],
    example: { title: '购物数量', steps: ['步进器改变 → 标签显示「数量×单价」。'] },
  },
  RadioButton: {
    summary: '单选按钮：同分组名只能选一个。',
    howTo: ['多个单选填相同「分组名」。'],
    example: { title: '选择题', steps: ['A/B/C 三个单选同组，提交时看哪个 Checked。'] },
  },
  SearchBar: {
    summary: '搜索框，圆角样式输入。',
    howTo: ['监听 Changed / LostFocus 过滤列表。'],
    example: { title: '搜同学', steps: ['输入关键词 → 更新 ListView 元素。'] },
  },
  ToggleButton: {
    summary: '切换按钮：按下/抬起两种状态。',
    howTo: ['Checked 为按下态；Changed 事件。'],
    example: { title: '收藏', steps: ['切换后存入 TinyDB。'] },
  },
  Avatar: {
    summary: '圆形头像，可无图显示文字。',
    howTo: ['资源里选图，或设一字缩写。'],
    example: { title: '个人主页', steps: ['头像 + 昵称标签横向排列。'] },
  },
  TabBar: {
    summary: '底部/顶部标签栏切换。',
    howTo: ['逗号分隔标签；AfterSelecting 后读 Selection。'],
    example: { title: '三页切换', steps: ['选中不同标签 → 改下方标签文字/显示内容。'] },
  },
  ScrollArrangement: {
    summary: '可滚动容器，内容很长时用。',
    howTo: ['设置高度，把组件拖进滚动布局。'],
    example: { title: '长表单', steps: ['多项输入放进滚动布局。'] },
  },
  Card: {
    summary: '卡片容器：带标题的内容块。',
    howTo: ['设置标题，把子组件拖进卡片。'],
    example: { title: '作品介绍卡', steps: ['卡片内放图片 + 说明 + 按钮。'] },
  },
  CoinFlip: {
    summary: '抛硬币：正/反，课堂猜拳神器。',
    howTo: ['当硬币.被点击 → 积木「抛硬币」；Rolled 后读 Result。预览不会自动抛。'],
    example: { title: '谁先开始', steps: ['被点击 → 抛硬币；掷出结果后若「正」则甲先手。'] },
  },
  TrafficLight: {
    summary: '交通灯：红黄绿切换，规则演示。',
    howTo: ['当交通灯.被点击 → 「下一灯色」；Changed 读 State。'],
    example: { title: '过马路模拟', steps: ['被点击 → 下一灯色；绿了才让小球移动。'] },
  },
  LightBulb: {
    summary: '灯泡：用积木设置 On 亮/灭。',
    howTo: ['点击灯泡只会触发 Click，不会自动亮灭；用开关/按钮积木「设置.开关」。'],
    example: { title: '智能家居演示', steps: ['开关 Changed → 设置灯泡 On。'] },
  },
  ScoreBoard: {
    summary: '记分牌：大字显示分数。',
    howTo: ['积木加分/重置；也可设置 Score。'],
    example: { title: '抢答得分', steps: ['答对 +10，答错重置。'] },
  },
  ProgressRing: {
    summary: '环形进度，显示百分比。',
    howTo: ['设置 Percent 0～100。'],
    example: { title: '任务进度', steps: ['完成一项 +20%。'] },
  },
  LEDLabel: {
    summary: 'LED 风格显示，适合计时/比分。',
    howTo: ['设置文本与颜色。'],
    example: { title: '电子钟', steps: ['Clock 每秒更新 LED 文本。'] },
  },
  FortuneBall: {
    summary: '占卜球：随机给一句回答（娱乐）。',
    howTo: ['当占卜球.被点击 → 「占卜提问」；GotAnswer 读 Answer。预览不会自动出签。'],
    example: { title: '今日运势', steps: ['被点击 → 占卜提问；再把回答读出来（TTS）。'] },
  },
  LevelBar: {
    summary: '血条/能量条，做小游戏很常用。',
    howTo: ['设置 Value 与 MaxValue。'],
    example: { title: '扣血', steps: ['被碰到 → Value 减 10。'] },
  },
  BatterySensor: {
    summary: '读取设备电量与是否充电（浏览器支持不一）。',
    howTo: ['LevelChanged 后获取「电量」「充电中」。'],
    example: { title: '低电提醒', steps: ['电量 < 20 显示警告。'] },
  },
  NetworkSensor: {
    summary: '监听是否联网与连接类型（如 4g/wifi）。',
    howTo: ['StatusChanged 后获取「在线」「连接类型」。'],
    example: { title: '离线提示', steps: ['Offline 时显示「请连接网络」。'] },
  },
  ShakeSensor: {
    summary: '摇一摇触发事件（需真机）。',
    howTo: ['Shaking 事件里掷骰子或换题。'],
    example: { title: '摇一摇换题', steps: ['摇动 → 随机助手出题。'] },
  },
  Vibrator: {
    summary: '震动反馈（手机支持时）。',
    howTo: ['积木「震动」填毫秒。'],
    example: { title: '答错震动', steps: ['错误 → 震动 300ms。'] },
  },
  Clipboard: {
    summary: '复制/粘贴文本。',
    howTo: ['复制接文本；粘贴后 GotText 读 Text。'],
    example: { title: '一键复制答案', steps: ['按钮 → 复制标签内容。'] },
  },
  RandomHelper: {
    summary: '随机整数助手（可指定范围）。',
    howTo: ['NextInt 后 GotResult，读 LastResult。'],
    example: { title: '抽学号', steps: ['1～40 随机 → 显示学号。'] },
  },
  FileSaver: {
    summary: '把文本下载为本地文件。',
    howTo: ['SaveFile 内容 + 文件名。'],
    example: { title: '导出日记', steps: ['把 TextArea 内容存成 txt。'] },
  },
  GalleryPicker: {
    summary: '从相册选图（电脑为选文件）。',
    howTo: ['打开图库并指定显示到 Image。'],
    example: { title: '换头像', steps: ['选图 → 设置到 Avatar/Image。'] },
  },
  NotePad: {
    summary: '内置笔记库：笔记保存在本机（预览用浏览器存储，APK 同步 Preferences），适合记事本 App。',
    howTo: [
      '添加「笔记库」，可设笔记本名称（Namespace）。',
      '积木：保存笔记 / 打开笔记 / 删除 / 列出 / 清空。',
      '保存、加载后用「获取.笔记内容」「获取.标题列表」。',
    ],
    example: {
      title: '简易记事本',
      steps: [
        '界面：标题框、多行文本、保存按钮、列表。',
        '保存 → NotePad.保存笔记(标题, 内容)。',
        '列出笔记 → 把标题列表设到 ListView；点选后再打开笔记。',
      ],
      blocksHint: '文件 → 保存笔记 / 列出笔记',
    },
    tips: ['同一设备上数据会保留；换浏览器可能看不到。'],
  },
  FilePicker: {
    summary: '让用户自己选一个或多个文本文件（txt/csv/md…），再搜索、展示、变换。',
    howTo: [
      '设置 Accept 类型；Multiple 允许多选。',
      '积木「选择文件 / 选择多个文件」。',
      'AfterPicking 后读取：文件名、文件内容、合并文本、文件名列表。',
    ],
    example: {
      title: '导入课文再搜索',
      steps: [
        '选择文件 → 内容显示到 TextArea。',
        '用文本工坊「搜索行」或积木「筛选含…的行」找关键词。',
      ],
      blocksHint: '文件 → 选择文件；文本工坊 → 搜索行',
    },
  },
  FolderPicker: {
    summary: '选择文件夹，读取其中文本文件；可再按关键词搜索所有行。',
    howTo: [
      '「选择文件夹」（Chrome 等支持；不支持时请改用文件多选）。',
      '「在文件夹中搜索」→ 匹配行、匹配数。',
    ],
    example: {
      title: '班级作文夹搜关键词',
      steps: ['选文件夹 → 搜索「春天」→ 列表展示匹配行。'],
      blocksHint: '文件 → 选择文件夹 / 在文件夹中搜索',
    },
    tips: ['过大或非文本文件会自动跳过。'],
  },
  TextWorkshop: {
    summary: '文本工坊：搜索、替换、排序、去重、打乱、CSV 列提取、字词统计——让选来的文件「变好玩」。',
    howTo: [
      '对任意文本调用方法；结果在 ResultText / ResultLines。',
      '也可直接用「文本工坊」分类下的纯函数积木（不依赖组件）。',
    ],
    example: {
      title: '打乱点名册',
      steps: ['导入名单 txt → 打乱行 → 显示第一行作为幸运同学。'],
      blocksHint: '文本工坊 → 打乱行 / 筛选行',
    },
  },
  Alarm: {
    summary: '闹钟：到点会响铃并触发「闹钟响了」。点一下可开关。',
    howTo: ['拖到屏幕，设时间和标签。', '点闹钟开启，或用积木「开启闹钟」。', '可设每天/一次，响后可用「贪睡」。'],
    example: { title: '起床闹钟', steps: ['设 07:00，开启。', '当闹钟响了 → 显示提示或朗读。'], blocksHint: '手机 → 开启闹钟 / 贪睡' },
  },
  Reminder: {
    summary: '日程提醒：某一天某一时刻响一次。',
    howTo: ['填写日期和时间后点一下开启。', '到点触发「日程提醒到了」。'],
    example: { title: '作业提醒', steps: ['日期填今天，时间填放学。', '提醒到了 → 通知。'] },
  },
  ClockFace: {
    summary: '数字/指针时钟，可换时区。',
    howTo: ['拖到屏幕即走时。', '属性里选数字或指针、北京/纽约等时区。'],
    example: { title: '世界时钟', steps: ['放两个数字时钟，一个本地，一个纽约。'] },
  },
  CalendarView: {
    summary: '月历：点日期、翻月、标记日子。',
    howTo: ['点格子选日期。', '积木可回到今天、翻月、标记日期。'],
    example: { title: '选日期写日记', steps: ['选中日期后 → 把日期写进笔记标题。'], blocksHint: '手机 → 回到今天 / 标记日期' },
  },
  TodoList: {
    summary: '待办清单，点一下勾选，顶部可添加。',
    howTo: ['点「＋ 添加待办」或用积木添加。', '勾选后触发「待办勾选后」。'],
    example: { title: '作业清单', steps: ['添加「数学」「语文」。', '勾完用「清除已完成」。'] },
  },
  CalculatorPad: {
    summary: '计算器键盘，也可只用积木输入算式。',
    howTo: ['直接点数字键。', '「计算完成」后读取结果。'],
    example: { title: '简易计算器', steps: ['点按键算出结果，把结果写到标签。'] },
  },
  WeatherBox: {
    summary: '天气卡片：点击或积木获取当前城市天气。',
    howTo: ['填城市后点卡片。', '「天气已获取」后读气温、天气、风速。'],
    example: { title: '出门看天气', steps: ['城市填所在地 → 点一下 → 标签显示气温。'] },
  },
  DialPad: {
    summary: '拨号盘：输入号码后拨打（唤起系统电话）。',
    howTo: ['点数字键输入。', '点绿色拨打，或用积木「拨打」。'],
    example: { title: '亲情号', steps: ['放拨号盘和按钮「打给家里」。', '按钮点击 → 设置号码 10086 → 拨打。'] },
  },
  ContactList: {
    summary: '通讯录列表，可添加、查找、点选。',
    howTo: ['属性里用「姓名:电话」逗号分隔。', '点一项后读选中项。'],
    example: { title: '点联系人打电话', steps: ['选中后把选中项拆出电话，交给拨号盘。'] },
  },
  MapView: {
    summary: '地图（OpenStreetMap），可跳到经纬度或当前位置。',
    howTo: ['设纬度经度，或积木「定位到我」。'],
    example: { title: '我的位置', steps: ['屏幕加载后 → 地图.定位到我。'] },
  },
  CompassView: {
    summary: '指南针表盘，真机上随朝向转动。',
    howTo: ['放到屏幕上，用真机打开。', '「指南针变化」可读角度。'],
    example: { title: '朝北提示', steps: ['角度接近 0 时标签显示「正北」。'] },
  },
  Texting: {
    summary: '唤起系统短信。',
    howTo: ['非可见组件。用「发短信」积木填号码和内容。'],
    example: { title: '一键短信', steps: ['按钮点击 → 发短信给家长。'] },
  },
  Flashlight: {
    summary: '手电筒：用白屏模拟照明。',
    howTo: ['非可见。积木打开/关闭手电筒。'],
    example: { title: '照明开关', steps: ['按钮点击 → 打开手电筒。'] },
  },
}

export function getComponentHelp(type: ComponentType): ComponentHelpDoc {
  const meta = getMeta(type)
  const doc = DOCS[type]
  if (doc) return doc
  const events = meta.events.map((e) => EVENT_ZH[e] ?? e)
  const methods = meta.methods.map((m) => METHOD_ZH[m] ?? m)
  const props = meta.fields.map((f) => f.label)
  return {
    summary: `${meta.label}（${type}）${meta.isVisible ? '可见' : '非可见'}组件。${props.length ? `常用属性：${props.join('、')}。` : ''}${events.length ? `事件：${events.join('、')}。` : ''}${methods.length ? `方法：${methods.join('、')}。` : ''}`,
    howTo: [
      meta.isVisible ? '从左侧组件库拖到设计器。' : '从左侧组件库添加到非可见组件。',
      props.length ? '在属性面板调整参数。' : '此组件主要靠积木事件和方法使用。',
      events.length || methods.length ? '在积木页为其绑定事件与方法。' : '在积木页用属性积木读写它。',
    ],
    example: {
      title: `${meta.label}基本用法`,
      steps: [
        `添加一个「${meta.label}」，名称可用 ${type}1。`,
        events.length ? `积木：当 ${type}1.${events[0]} 时执行后续动作。` : `用「设置/获取」积木读写 ${meta.label}。`,
        methods.length ? `需要时调用方法「${methods[0]}」。` : '预览中观察效果后再完善逻辑。',
      ],
    },
  }
}

/** 事件名中文对照（弹窗展示用） */
export const EVENT_ZH: Record<string, string> = {
  Click: '被点击',
  LongClick: '被长按',
  Changed: '值改变',
  GotFocus: '获得焦点',
  LostFocus: '失去焦点',
  PositionChanged: '位置改变',
  AfterPicking: '选中后',
  AfterSelecting: '下拉选中后',
  AfterDateSet: '日期设定后',
  AfterTimeSet: '时间设定后',
  Timer: '计时器触发',
  Touched: '被触摸',
  Dragged: '被拖动',
  Flung: '被甩出',
  Completed: '播放完成',
  AccelerationChanged: '加速度变化',
  OrientationChanged: '方向变化',
  LocationChanged: '位置变化',
  AfterPicture: '拍照完成后',
  GotValue: '取得网络值',
  ValueStored: '网络值已存',
  PageLoaded: '页面加载完成',
  AfterGettingText: '取得语音文本后',
  GotText: '取得文本',
  AfterChoosing: '选择完成后',
  Rolled: '掷出结果',
  Tick: '计时跳动',
  Finished: '倒计时结束',
  Released: '摇杆松开',
  GotAnswer: '得到回答',
  LevelChanged: '电量变化',
  StatusChanged: '网络状态变化',
  Shaking: '摇一摇',
  GotResult: '得到结果',
  AfterSave: '笔记已保存',
  AfterLoad: '笔记已加载',
  AfterDelete: '笔记已删除',
  AfterList: '笔记列表完成',
  AfterSearch: '文件夹搜索完成',
  GyroscopeChanged: '陀螺仪变化',
  ProximityChanged: '接近变化',
  StepTaken: '走了一步',
  LightChanged: '光线变化',
  MagneticChanged: '磁场变化',
  AlarmFired: '闹钟响了',
  ReminderFired: '日程提醒到了',
  AfterScan: '扫码完成',
  MessageSent: '短信已唤起',
  AfterSoundRecorded: '录音完成',
  Notified: '通知已发出',
  AfterChecking: '待办勾选后',
  Calculated: '计算完成',
  AfterFetch: '天气已获取',
  HeadingChanged: '指南针变化',
  NumberChanged: '号码变化',
  CallStarted: '开始拨打',
}

export const METHOD_ZH: Record<string, string> = {
  ShowAlert: '显示警告',
  ShowMessageDialog: '显示消息对话框',
  ShowChooseDialog: '显示选择对话框',
  SystemTime: '系统时间',
  StoreValue: '存储值',
  GetValue: '读取值',
  ClearTag: '清除标签',
  ClearAll: '清除全部',
  TakePicture: '拍照',
  Start: '开始',
  Pause: '暂停',
  Stop: '停止',
  Play: '播放音效',
  Speak: '朗读',
  GetText: '开始语音识别',
  ShareMessage: '分享消息',
  StartActivity: '打开活动',
  MakePhoneCall: '拨打电话',
  Get: '获取网页',
  Clear: '清空',
  DrawLine: '画线',
  MoveTo: '移动到',
  GoToUrl: '打开网址',
  SetElementsFromString: '设置列表元素',
  Roll: '掷骰子',
  Refresh: '刷新二维码',
  Celebrate: '放庆祝特效',
  Flip: '抛硬币',
  Next: '下一灯色',
  AddScore: '加分',
  ResetScore: '重置分数',
  Ask: '占卜提问',
  Vibrate: '震动',
  Copy: '复制',
  Paste: '粘贴',
  NextInt: '随机整数',
  SaveFile: '保存文件',
  Open: '打开',
  OpenMultiple: '多选打开',
  SaveNote: '保存笔记',
  LoadNote: '打开笔记',
  DeleteNote: '删除笔记',
  ListNotes: '列出笔记',
  ClearAllNotes: '清空全部笔记',
  OpenFolder: '选择文件夹',
  SearchInFolder: '文件夹中搜索',
  SearchLines: '搜索行',
  ReplaceAll: '全部替换',
  WordStats: '统计字词行',
  SortLines: '排序行',
  UniqueLines: '去重行',
  ReverseLines: '倒序行',
  ToUpper: '转大写',
  ToLower: '转小写',
  CsvColumn: '提取CSV列',
  ShuffleLines: '打乱行',
  Arm: '开启',
  Cancel: '关闭',
  GoToday: '回到今天',
  ShiftMonth: '翻月',
  SendMessage: '发短信',
  Send: '发邮件',
  On: '打开',
  Off: '关闭',
  Notify: '系统通知',
  Scan: '扫码',
  GoTo: '定位到',
  Add: '添加',
  ClearDone: '清除已完成',
  Press: '按键',
  Evaluate: '计算',
  Fetch: '获取天气',
  Snooze: '贪睡',
  MyLocation: '定位到我',
  Search: '查找',
  Call: '拨打',
  Backspace: '退格',
}
