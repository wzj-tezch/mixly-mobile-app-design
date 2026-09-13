export type ComponentType =
  | 'Screen'
  | 'Button'
  | 'Label'
  | 'TextBox'
  | 'PasswordTextBox'
  | 'CheckBox'
  | 'Switch'
  | 'Slider'
  | 'Spinner'
  | 'DatePicker'
  | 'TimePicker'
  | 'Image'
  | 'ListView'
  | 'HorizontalArrangement'
  | 'VerticalArrangement'
  | 'TableArrangement'
  | 'Canvas'
  | 'Ball'
  | 'ImageSprite'
  | 'WebViewer'
  | 'ProgressBar'
  | 'Player'
  | 'VideoPlayer'
  | 'Sound'
  | 'RatingBar'
  | 'Notifier'
  | 'Clock'
  | 'TinyDB'
  | 'TinyWebDB'
  | 'Web'
  | 'TextToSpeech'
  | 'SpeechRecognizer'
  | 'Sharing'
  | 'ActivityStarter'
  | 'PhoneCall'
  | 'AccelerometerSensor'
  | 'OrientationSensor'
  | 'LocationSensor'
  | 'Camera'
  | 'Dice'
  | 'Marquee'
  | 'ColorPicker'
  | 'Countdown'
  | 'Stopwatch'
  | 'QRCode'
  | 'Joystick'
  | 'ChatBubble'
  | 'Celebration'
  | 'TextArea'
  | 'NumberBox'
  | 'Hyperlink'
  | 'Divider'
  | 'Spacer'
  | 'Badge'
  | 'Stepper'
  | 'RadioButton'
  | 'SearchBar'
  | 'ToggleButton'
  | 'Avatar'
  | 'TabBar'
  | 'ScrollArrangement'
  | 'Card'
  | 'CoinFlip'
  | 'TrafficLight'
  | 'LightBulb'
  | 'ScoreBoard'
  | 'ProgressRing'
  | 'LEDLabel'
  | 'FortuneBall'
  | 'LevelBar'
  | 'BatterySensor'
  | 'NetworkSensor'
  | 'ShakeSensor'
  | 'GyroscopeSensor'
  | 'ProximitySensor'
  | 'Pedometer'
  | 'LightSensor'
  | 'MagneticFieldSensor'
  | 'Vibrator'
  | 'Clipboard'
  | 'RandomHelper'
  | 'FileSaver'
  | 'GalleryPicker'
  | 'NotePad'
  | 'FilePicker'
  | 'FolderPicker'
  | 'TextWorkshop'
  | 'Alarm'
  | 'CalendarView'
  | 'ContactList'
  | 'Texting'
  | 'Emailer'
  | 'Flashlight'
  | 'SoundRecorder'
  | 'DeviceNotify'
  | 'MapView'
  | 'BarcodeScanner'
  | 'ClockFace'
  | 'CalculatorPad'
  | 'TodoList'
  | 'Reminder'
  | 'CompassView'
  | 'WeatherBox'
  | 'DialPad'

export interface ComponentNode {
  id: string
  type: ComponentType
  name: string
  props: Record<string, unknown>
  children: ComponentNode[]
  visible: boolean
}

export interface ScreenData {
  id: string
  name: string
  props: Record<string, unknown>
  root: ComponentNode
  nonVisible: ComponentNode[]
  blocksXml: string
  /** 高级模式脚本；与积木分开存，关闭高级模式后仍保留 */
  scriptCode?: string
}

export interface ProjectAsset {
  id: string
  name: string
  mime: string
  dataUrl: string
  createdAt: number
}

export interface AiProject {
  schemaVersion: 1
  id: string
  name: string
  screens: ScreenData[]
  activeScreenId: string
  assets: ProjectAsset[]
  updatedAt: number
  /** 若由内置案例创建，记录种类与版本，便于自动升级积木 */
  sourceTemplate?: string
  templateRev?: number
  /** 课程页传入的外部标签，go3 不当目录用 */
  starterLabel?: string
  /** 载入时的初始工程，重置回到这里；自身不含嵌套快照 */
  starterSnapshot?: Omit<AiProject, 'starterSnapshot'>
  /** 发布后的只读链接编号，再次发布保持不变 */
  shareId?: string
  /** 默认 false。开启后预览/导出跑 scriptCode，不跑积木 */
  advancedMode?: boolean
}

export type EditorTab = 'designer' | 'blocks'
export type LeftPanel = 'palette' | 'components' | 'projects' | 'assets' | 'guide' | 'ai'
export type BlocksViewMode = 'blocks' | 'mix' | 'code'
