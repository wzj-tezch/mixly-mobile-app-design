import type { AiProject, ComponentNode, ComponentType } from './types'
import { renameInBlocksXml } from './renameSync'

/** Short, readable English names shown in the tree / blocks (App Inventor style). */
const PREFIX: Partial<Record<ComponentType, string>> = {
  HorizontalArrangement: 'Row',
  VerticalArrangement: 'Column',
  TableArrangement: 'Table',
  ScrollArrangement: 'Scroll',
  PasswordTextBox: 'Password',
  ImageSprite: 'Sprite',
  WebViewer: 'WebView',
  TextToSpeech: 'Speaker',
  SpeechRecognizer: 'Mic',
  ActivityStarter: 'AppLink',
  AccelerometerSensor: 'Accel',
  OrientationSensor: 'Compass',
  LocationSensor: 'GPS',
  MagneticFieldSensor: 'Magnet',
  GyroscopeSensor: 'Gyro',
  ProximitySensor: 'Near',
  LightSensor: 'Light',
  BatterySensor: 'Battery',
  NetworkSensor: 'Network',
  ShakeSensor: 'Shake',
  RandomHelper: 'Random',
  GalleryPicker: 'Gallery',
  FilePicker: 'FilePick',
  FolderPicker: 'Folder',
  FileSaver: 'SaveFile',
  TextWorkshop: 'Workshop',
  TinyWebDB: 'CloudDB',
  ProgressBar: 'Progress',
  ProgressRing: 'Ring',
  ScoreBoard: 'Score',
  TrafficLight: 'Traffic',
  LightBulb: 'Bulb',
  FortuneBall: 'Fortune',
  ChatBubble: 'Chat',
  ColorPicker: 'Colors',
  DatePicker: 'Date',
  TimePicker: 'Time',
  NumberBox: 'Number',
  SearchBar: 'Search',
  ToggleButton: 'Toggle',
  RadioButton: 'Radio',
  RatingBar: 'Stars',
  ListView: 'List',
  VideoPlayer: 'Video',
  NotePad: 'Notes',
  PhoneCall: 'Phone',
  Pedometer: 'Steps',
  Clipboard: 'Clip',
  Celebration: 'Party',
  Hyperlink: 'Link',
  CheckBox: 'Check',
  CalendarView: 'Calendar',
  ContactList: 'Contacts',
  MapView: 'Map',
  Texting: 'SMS',
  Emailer: 'Email',
  Flashlight: 'Flash',
  SoundRecorder: 'Recorder',
  DeviceNotify: 'Notify',
  BarcodeScanner: 'Scanner',
  ClockFace: 'DigitalClock',
  CalculatorPad: 'Calc',
  TodoList: 'Todo',
  Reminder: 'Remind',
  CompassView: 'Needle',
  WeatherBox: 'Weather',
  DialPad: 'Dial',
}

export function namePrefix(type: ComponentType): string {
  return PREFIX[type] ?? type
}

export function uniqueReadableName(existing: Iterable<string>, prefix: string): string {
  const used = existing instanceof Set ? existing : new Set(existing)
  let i = 1
  while (used.has(`${prefix}${i}`)) i++
  return `${prefix}${i}`
}

/** Names like Tip_t_9yifp0sm / H_h_ab12cd34 from the old random uid helper. */
export function looksGeneratedName(name: string): boolean {
  if (!name || name === 'ScreenRoot') return false
  if (/^Tip_[a-z0-9]+_[a-z0-9]{6,}$/i.test(name)) return true
  if (/^H_[a-z0-9]+_[a-z0-9]{6,}$/.test(name)) return true
  if (/^[A-Za-z][A-Za-z0-9]*_[a-z0-9]{1,6}_[a-z0-9]{6,}$/.test(name)) return true
  return false
}

function salvagePrefix(name: string, type: ComponentType): string {
  if (/^Tip_/i.test(name)) return 'Hint'
  if (/^H_/.test(name)) return 'Heading'
  return namePrefix(type)
}

export function projectHasGeneratedNames(project: AiProject): boolean {
  const check = (n: ComponentNode): boolean =>
    looksGeneratedName(n.name) || n.children.some(check)
  return project.screens.some(
    (s) => check(s.root) || s.nonVisible.some((n) => looksGeneratedName(n.name)),
  )
}

function sanitizeNode(n: ComponentNode, used: Set<string>, renameXml: (from: string, to: string) => void) {
  if (n.name !== 'ScreenRoot' && looksGeneratedName(n.name)) {
    const next = uniqueReadableName(used, salvagePrefix(n.name, n.type))
    renameXml(n.name, next)
    n.name = next
  }
  used.add(n.name)
  for (const c of n.children) sanitizeNode(c, used, renameXml)
}

/** Replace random component names with Hint1 / Button1 style identifiers. */
export function sanitizeReadableNames(project: AiProject): AiProject {
  const clone = structuredClone(project)
  for (const screen of clone.screens) {
    const used = new Set<string>(['ScreenRoot', screen.name])
    const renameXml = (from: string, to: string) => {
      screen.blocksXml = renameInBlocksXml(screen.blocksXml, from, to)
    }
    sanitizeNode(screen.root, used, renameXml)
    for (const n of screen.nonVisible) {
      if (looksGeneratedName(n.name)) {
        const next = uniqueReadableName(used, salvagePrefix(n.name, n.type))
        renameXml(n.name, next)
        n.name = next
      }
      used.add(n.name)
    }
  }
  return clone
}
