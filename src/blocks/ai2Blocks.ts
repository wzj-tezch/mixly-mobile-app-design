import * as Blockly from 'blockly'
import { javascriptGenerator, Order } from 'blockly/javascript'
import { installAllBlocks as installColourBlocks } from '@blockly/field-colour'
import { mixlyCategoryCssConfig } from './mixlyBlockIcons'
import { MIXLY_PHONE_TOOLBOX, MIXLY_TIME_TOOLBOX, registerMixlyStdBlocks } from './mixlyStdBlocks'

let colourBlocksReady = false

function ensureColourBlocks() {
  if (colourBlocksReady) return
  installColourBlocks({ javascript: javascriptGenerator })
  colourBlocksReady = true
}

let componentNames: string[] = ['Button1', 'Label1']
let screenNames: string[] = ['Screen1', 'Screen2']

export function setBlocklyNameContext(components: string[], screens: string[]) {
  componentNames = components.length ? components : ['Button1']
  screenNames = screens.length ? screens : ['Screen1']
}

function componentMenu(): Blockly.MenuOption[] {
  return componentNames.map((n) => [n, n])
}

function screenMenu(): Blockly.MenuOption[] {
  return screenNames.map((n) => [n, n])
}

export function registerAi2Blocks() {
  registerMixlyStdBlocks()
  ensureColourBlocks()
  Blockly.Blocks['component_event'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .appendField('当')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.')
        .appendField(
          new Blockly.FieldDropdown([
            ['被点击', 'Click'],
            ['被长按', 'LongClick'],
            ['值改变', 'Changed'],
            ['获得焦点', 'GotFocus'],
            ['失去焦点', 'LostFocus'],
            ['位置改变', 'PositionChanged'],
            ['列表选中后', 'AfterPicking'],
            ['文件选中后', 'AfterPicking'],
            ['下拉选中后', 'AfterSelecting'],
            ['搜索提交', 'Submitted'],
            ['日期设定后', 'AfterDateSet'],
            ['时间设定后', 'AfterTimeSet'],
            ['计时器触发', 'Timer'],
            ['被触摸', 'Touched'],
            ['被拖动', 'Dragged'],
            ['被甩出', 'Flung'],
            ['播放完成', 'Completed'],
            ['加速度变化', 'AccelerationChanged'],
            ['方向变化', 'OrientationChanged'],
            ['位置变化', 'LocationChanged'],
            ['陀螺仪变化', 'GyroscopeChanged'],
            ['接近变化', 'ProximityChanged'],
            ['走了一步', 'StepTaken'],
            ['光线变化', 'LightChanged'],
            ['磁场变化', 'MagneticChanged'],
            ['拍照完成后', 'AfterPicture'],
            ['取得网络值', 'GotValue'],
            ['网络值已存', 'ValueStored'],
            ['页面加载完成', 'PageLoaded'],
            ['取得语音文本后', 'AfterGettingText'],
            ['取得网页内容', 'GotText'],
            ['掷出结果', 'Rolled'],
            ['计时跳动', 'Tick'],
            ['倒计时结束', 'Finished'],
            ['摇杆松开', 'Released'],
            ['得到回答', 'GotAnswer'],
            ['电量变化', 'LevelChanged'],
            ['网络状态变化', 'StatusChanged'],
            ['摇一摇', 'Shaking'],
            ['得到随机结果', 'GotResult'],
            ['笔记已保存', 'AfterSave'],
            ['笔记已加载', 'AfterLoad'],
            ['笔记已删除', 'AfterDelete'],
            ['笔记列表完成', 'AfterList'],
            ['文件夹搜索完成', 'AfterSearch'],
            ['闹钟响了', 'AlarmFired'],
            ['日程提醒到了', 'ReminderFired'],
            ['扫码完成', 'AfterScan'],
            ['短信已唤起', 'MessageSent'],
            ['录音完成', 'AfterSoundRecorded'],
            ['通知已发出', 'Notified'],
            ['待办勾选后', 'AfterChecking'],
            ['计算完成', 'Calculated'],
            ['天气已获取', 'AfterFetch'],
            ['指南针变化', 'HeadingChanged'],
            ['号码变化', 'NumberChanged'],
            ['开始拨打', 'CallStarted'],
          ]),
          'EVENT',
        )
      this.appendStatementInput('DO').appendField('执行')
      this.setColour(30)
      this.setTooltip('当组件发生某事件时执行（内部仍用英文事件名，便于兼容）')
    },
  }

  Blockly.Blocks['component_set_property'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('VALUE')
        .setCheck(null)
        .appendField('设置')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.')
        .appendField(
          new Blockly.FieldDropdown([
            ['文本', 'Text'],
            ['背景色', 'BackgroundColor'],
            ['文字色', 'TextColor'],
            ['启用', 'Enabled'],
            ['勾选', 'Checked'],
            ['开关', 'On'],
            ['滑块位置', 'ThumbPosition'],
            ['进度', 'Progress'],
            ['百分比', 'Percent'],
            ['提示文字', 'Hint'],
            ['选中项', 'Selection'],
            ['列表元素(逗号分隔)', 'ElementsFromString'],
            ['图片', 'Picture'],
            ['媒体地址', 'Source'],
            ['日期', 'Date'],
            ['时间', 'Time'],
            ['X坐标', 'X'],
            ['Y坐标', 'Y'],
            ['半径', 'Radius'],
            ['绘制颜色', 'PaintColor'],
            ['音量', 'Volume'],
            ['评分', 'Rating'],
            ['网址', 'Url'],
            ['电话号码', 'PhoneNumber'],
            ['颜色', 'Color'],
            ['点数', 'Result'],
            ['面数', 'Sides'],
            ['剩余秒数', 'Remaining'],
            ['总秒数', 'Seconds'],
            ['已过秒数', 'Elapsed'],
            ['分数', 'Score'],
            ['百分比', 'Percent'],
            ['当前值', 'Value'],
            ['最大值', 'MaxValue'],
            ['灯色', 'State'],
            ['回答', 'Answer'],
            ['电量', 'Level'],
            ['在线', 'Online'],
            ['上次随机结果', 'LastResult'],
            ['笔记标题', 'Title'],
            ['笔记内容', 'Content'],
            ['标题列表', 'Titles'],
            ['数量', 'Count'],
            ['文件名', 'FileName'],
            ['文件内容', 'Content'],
            ['文件名列表', 'FileNames'],
            ['文件数量', 'FileCount'],
            ['合并文本', 'CombinedText'],
            ['文件夹名', 'FolderName'],
            ['匹配行', 'MatchLines'],
            ['匹配数', 'MatchCount'],
            ['结果文本', 'ResultText'],
            ['结果行', 'ResultLines'],
            ['结果数量', 'ResultCount'],
            ['字数', 'CharCount'],
            ['词数', 'WordCount'],
            ['行数', 'LineCount'],
            ['闹钟时间', 'Time'],
            ['选中日期', 'SelectedDate'],
            ['年', 'Year'],
            ['月', 'Month'],
            ['纬度', 'Latitude'],
            ['经度', 'Longitude'],
            ['缩放', 'Zoom'],
            ['电话号码', 'PhoneNumber'],
            ['通讯录', 'ContactsFromString'],
            ['扫描结果', 'ScanResult'],
            ['待办事项', 'ItemsFromString'],
            ['已完成事项', 'CheckedFromString'],
            ['算式', 'Expression'],
            ['计算结果', 'Result'],
            ['城市', 'City'],
            ['气温', 'Temperature'],
            ['天气', 'WeatherText'],
            ['指南针角度', 'Heading'],
            ['日期', 'Date'],
            ['重复', 'Repeat'],
            ['时钟格式', 'Format'],
            ['时区', 'Timezone'],
            ['时钟样式', 'Style'],
            ['风速', 'WindSpeed'],
            ['拨号号码', 'Number'],
          ]),
          'PROP',
        )
        .appendField('为')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(165)
    },
  }

  Blockly.Blocks['component_get_property'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .appendField('获取')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.')
        .appendField(
          new Blockly.FieldDropdown([
            ['文本', 'Text'],
            ['背景色', 'BackgroundColor'],
            ['启用', 'Enabled'],
            ['勾选', 'Checked'],
            ['开关', 'On'],
            ['滑块位置', 'ThumbPosition'],
            ['选中项', 'Selection'],
            ['列表元素(逗号分隔)', 'ElementsFromString'],
            ['图片', 'Picture'],
            ['媒体地址', 'Source'],
            ['日期', 'Date'],
            ['时间', 'Time'],
            ['X坐标', 'X'],
            ['Y坐标', 'Y'],
            ['半径', 'Radius'],
            ['绘制颜色', 'PaintColor'],
            ['纬度', 'Latitude'],
            ['经度', 'Longitude'],
            ['海拔', 'Altitude'],
            ['定位精度', 'Accuracy'],
            ['速度', 'Speed'],
            ['X加速度', 'XAccel'],
            ['Y加速度', 'YAccel'],
            ['Z加速度', 'ZAccel'],
            ['方位角', 'Angle'],
            ['俯仰角', 'Pitch'],
            ['翻滚角', 'Roll'],
            ['X角速度', 'XAngularVelocity'],
            ['Y角速度', 'YAngularVelocity'],
            ['Z角速度', 'ZAngularVelocity'],
            ['接近距离', 'Distance'],
            ['是否靠近', 'Near'],
            ['步数', 'Steps'],
            ['光照度', 'Illuminance'],
            ['指南针方位', 'AbsoluteHeading'],
            ['磁场X', 'MagX'],
            ['磁场Y', 'MagY'],
            ['磁场Z', 'MagZ'],
            ['连接类型', 'ConnectionType'],
            ['充电中', 'Charging'],
            ['标签', 'Tag'],
            ['值', 'Value'],
            ['评分', 'Rating'],
            ['识别结果', 'Result'],
            ['网页内容', 'ResponseContent'],
            ['网址', 'Url'],
            ['电话号码', 'PhoneNumber'],
            ['颜色', 'Color'],
            ['点数', 'Result'],
            ['剩余秒数', 'Remaining'],
            ['已过秒数', 'Elapsed'],
            ['分数', 'Score'],
            ['百分比', 'Percent'],
            ['当前值', 'Value'],
            ['灯色', 'State'],
            ['回答', 'Answer'],
            ['电量', 'Level'],
            ['在线', 'Online'],
            ['上次随机结果', 'LastResult'],
            ['笔记标题', 'Title'],
            ['笔记内容', 'Content'],
            ['标题列表', 'Titles'],
            ['数量', 'Count'],
            ['文件名', 'FileName'],
            ['文件内容', 'Content'],
            ['文件名列表', 'FileNames'],
            ['文件数量', 'FileCount'],
            ['合并文本', 'CombinedText'],
            ['文件夹名', 'FolderName'],
            ['匹配行', 'MatchLines'],
            ['匹配数', 'MatchCount'],
            ['结果文本', 'ResultText'],
            ['结果行', 'ResultLines'],
            ['结果数量', 'ResultCount'],
            ['字数', 'CharCount'],
            ['词数', 'WordCount'],
            ['行数', 'LineCount'],
            ['闹钟时间', 'Time'],
            ['选中日期', 'SelectedDate'],
            ['年', 'Year'],
            ['月', 'Month'],
            ['纬度', 'Latitude'],
            ['经度', 'Longitude'],
            ['缩放', 'Zoom'],
            ['电话号码', 'PhoneNumber'],
            ['扫描结果', 'ScanResult'],
            ['通讯录', 'ContactsFromString'],
            ['待办事项', 'ItemsFromString'],
            ['已完成事项', 'CheckedFromString'],
            ['算式', 'Expression'],
            ['计算结果', 'Result'],
            ['城市', 'City'],
            ['气温', 'Temperature'],
            ['天气', 'WeatherText'],
            ['指南针角度', 'Heading'],
            ['日期', 'Date'],
            ['重复', 'Repeat'],
            ['时钟格式', 'Format'],
            ['时区', 'Timezone'],
            ['时钟样式', 'Style'],
            ['风速', 'WindSpeed'],
            ['拨号号码', 'Number'],
          ]),
          'PROP',
        )
      this.setOutput(true)
      this.setColour(165)
    },
  }

  Blockly.Blocks['notifier_alert'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('MESSAGE')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.显示警告')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(260)
    },
  }

  Blockly.Blocks['notifier_message'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.显示消息对话框')
      this.appendValueInput('MESSAGE').appendField('内容')
      this.appendValueInput('TITLE').appendField('标题')
      this.appendValueInput('BUTTON').appendField('按钮文字')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(260)
    },
  }

  Blockly.Blocks['notifier_choose'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.显示选择对话框')
      this.appendValueInput('MESSAGE').appendField('内容')
      this.appendValueInput('TITLE').appendField('标题')
      this.appendValueInput('BTN1').appendField('按钮1')
      this.appendValueInput('BTN2').appendField('按钮2')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(260)
    },
  }

  Blockly.Blocks['canvas_clear'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.清空')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(185)
    },
  }

  Blockly.Blocks['canvas_draw_line'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.画线')
      this.appendValueInput('X1').setCheck('Number').appendField('x1')
      this.appendValueInput('Y1').setCheck('Number').appendField('y1')
      this.appendValueInput('X2').setCheck('Number').appendField('x2')
      this.appendValueInput('Y2').setCheck('Number').appendField('y2')
      this.appendValueInput('COLOR').appendField('颜色')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(185)
    },
  }

  Blockly.Blocks['canvas_draw_circle'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.画圆')
      this.appendValueInput('X').setCheck('Number').appendField('圆心x')
      this.appendValueInput('Y').setCheck('Number').appendField('圆心y')
      this.appendValueInput('R').setCheck('Number').appendField('半径')
      this.appendValueInput('COLOR').appendField('颜色')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(185)
    },
  }

  Blockly.Blocks['webviewer_goto'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('URL')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.打开网址')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(185)
    },
  }

  Blockly.Blocks['listview_set_elements'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('ELEMENTS')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.设置列表元素')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(165)
    },
  }

  Blockly.Blocks['clock_system_time'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.系统时间')
      this.setOutput(true)
      this.setColour(65)
    },
  }

  Blockly.Blocks['camera_take_picture'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.拍照')
      this.appendDummyInput()
        .appendField('显示到')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'IMAGE')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(185)
      this.setTooltip('拍照并可选显示到图片组件（真机用原生相机，浏览器用选图）')
    },
  }

  Blockly.Blocks['tinydb_store'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.存储值')
      this.appendValueInput('TAG').appendField('标签')
      this.appendValueInput('VALUE').appendField('值')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(145)
    },
  }

  Blockly.Blocks['tinydb_get'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.读取值')
      this.appendValueInput('TAG').appendField('标签')
      this.appendValueInput('DEFAULT').appendField('默认值')
      this.setOutput(true)
      this.setColour(145)
    },
  }

  Blockly.Blocks['tinydb_clear_tag'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('TAG')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.清除标签')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(145)
    },
  }

  Blockly.Blocks['tinydb_clear_all'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.清除全部')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(145)
    },
  }

  Blockly.Blocks['sprite_move_to'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.移动到')
      this.appendValueInput('X').setCheck('Number').appendField('x')
      this.appendValueInput('Y').setCheck('Number').appendField('y')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(200)
    },
  }

  Blockly.Blocks['sprite_random_move'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.场地内随机换位')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(200)
      this.setTooltip('在父容器范围内随机移动，并避开当前位置')
    },
  }

  Blockly.Blocks['arcade_collect_sprite'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .appendField('吃到')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'SPRITE')
        .appendField('加分并随机换位')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(200)
      this.setTooltip('成功换位才加分，带冷却，避免连撞刷分')
    },
  }

  Blockly.Blocks['player_start'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.开始播放')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(200)
    },
  }
  Blockly.Blocks['player_pause'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.暂停')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(200)
    },
  }
  Blockly.Blocks['player_stop'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.停止')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(200)
    },
  }
  Blockly.Blocks['sound_play'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.播放音效')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(200)
    },
  }
  Blockly.Blocks['webdb_store'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.存储值')
      this.appendValueInput('TAG').appendField('标签')
      this.appendValueInput('VALUE').appendField('值')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(145)
    },
  }
  Blockly.Blocks['webdb_get'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.读取值')
      this.appendValueInput('TAG').appendField('标签')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(145)
      this.setTooltip('异步取值，结果在「取得网络值」事件中用「获取.标签 / .值」读取')
    },
  }
  Blockly.Blocks['tts_speak'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('MESSAGE')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.朗读')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(200)
    },
  }
  Blockly.Blocks['speech_get_text'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.开始语音识别')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(200)
      this.setTooltip('结果在「取得语音文本后」事件中用「获取.识别结果」读取')
    },
  }
  Blockly.Blocks['sharing_share'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('MESSAGE')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.分享消息')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(260)
    },
  }
  Blockly.Blocks['activity_start'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('URL')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.打开活动(网址)')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(45)
    },
  }
  Blockly.Blocks['phone_call'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('NUMBER')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.拨打电话')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(45)
    },
  }
  Blockly.Blocks['web_get'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('URL')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.获取网页')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(145)
      this.setTooltip('异步请求，结果在「取得网页内容」事件中用「获取.网页内容」读取')
    },
  }
  Blockly.Blocks['dice_roll'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.掷骰子')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['countdown_start'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.开始倒计时')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['countdown_pause'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.暂停倒计时')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['countdown_reset'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.重置倒计时')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['stopwatch_start'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.开始秒表')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['stopwatch_pause'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.暂停秒表')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['stopwatch_reset'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.重置秒表')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['qr_refresh'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.刷新二维码')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['celebrate'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.放庆祝特效')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['coin_flip'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.抛硬币')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['traffic_next'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.下一灯色')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['score_add'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('DELTA')
        .setCheck('Number')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.加分')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['pedometer_reset'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.重置步数')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(65)
    },
  }
  Blockly.Blocks['score_reset'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.重置分数')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['fortune_ask'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.占卜提问')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['vibrate'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('MS')
        .setCheck('Number')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.震动(毫秒)')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(65)
    },
  }
  Blockly.Blocks['clipboard_copy'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('TEXT')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.复制')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(65)
    },
  }
  Blockly.Blocks['clipboard_paste'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.粘贴')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(65)
      this.setTooltip('粘贴完成后在「取得网页内容」同类事件「取得文本」中读取.Text')
    },
  }
  Blockly.Blocks['random_next_int'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.随机整数')
      this.appendValueInput('MIN').setCheck('Number').appendField('从')
      this.appendValueInput('MAX').setCheck('Number').appendField('到')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(65)
      this.setTooltip('结果在「得到随机结果」后用「获取.上次随机结果」读取')
    },
  }
  Blockly.Blocks['file_save'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.保存文件')
      this.appendValueInput('CONTENT').appendField('内容')
      this.appendValueInput('NAME').appendField('文件名')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(145)
    },
  }
  Blockly.Blocks['gallery_open'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.打开图库')
      this.appendDummyInput().appendField('显示到').appendField(new Blockly.FieldDropdown(componentMenu), 'IMAGE')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(200)
    },
  }
  Blockly.Blocks['note_save'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.保存笔记')
      this.appendValueInput('TITLE').appendField('标题')
      this.appendValueInput('CONTENT').appendField('内容')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(145)
    },
  }
  Blockly.Blocks['note_load'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('TITLE')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.打开笔记')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(145)
      this.setTooltip('加载后用「获取.笔记内容」读取')
    },
  }
  Blockly.Blocks['note_delete'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('TITLE')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.删除笔记')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(145)
    },
  }
  Blockly.Blocks['note_list'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.列出笔记')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(145)
      this.setTooltip('完成后「获取.标题列表」为逗号分隔')
    },
  }
  Blockly.Blocks['note_clear_all'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.清空全部笔记')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(145)
    },
  }
  Blockly.Blocks['file_pick'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.选择文件')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(145)
      this.setTooltip('用户选文件后触发「列表选中后/AfterPicking」，读取文件内容')
    },
  }
  Blockly.Blocks['file_pick_multi'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.选择多个文件')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(145)
    },
  }
  Blockly.Blocks['folder_pick'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.选择文件夹')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(145)
      this.setTooltip('部分浏览器支持；也可改用多选文件')
    },
  }
  Blockly.Blocks['folder_search'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('KEYWORD')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.在文件夹中搜索')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(145)
      this.setTooltip('先选文件夹，再搜索；结果在「匹配行」')
    },
  }
  Blockly.Blocks['workshop_search'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.搜索行')
      this.appendValueInput('TEXT').appendField('文本')
      this.appendValueInput('KEYWORD').appendField('关键词')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(160)
    },
  }
  Blockly.Blocks['workshop_replace'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.全部替换')
      this.appendValueInput('TEXT').appendField('文本')
      this.appendValueInput('FIND').appendField('查找')
      this.appendValueInput('REPL').appendField('替换为')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(160)
    },
  }
  Blockly.Blocks['workshop_stats'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('TEXT')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.统计字词行')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(160)
    },
  }
  Blockly.Blocks['workshop_sort'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('TEXT')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.排序行')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(160)
    },
  }
  Blockly.Blocks['workshop_unique'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('TEXT')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.去重行')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(160)
    },
  }
  Blockly.Blocks['workshop_reverse'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('TEXT')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.倒序行')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(160)
    },
  }
  Blockly.Blocks['workshop_shuffle'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('TEXT')
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.打乱行')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(160)
    },
  }
  Blockly.Blocks['workshop_csv_col'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.提取CSV列')
      this.appendValueInput('TEXT').appendField('表格文本')
      this.appendValueInput('COL').setCheck('Number').appendField('第几列')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(160)
    },
  }
  Blockly.Blocks['util_filter_lines'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('TEXT').setCheck('String').appendField('从文本')
      this.appendValueInput('KEYWORD').appendField('筛选含')
      this.appendDummyInput().appendField('的行')
      this.setInputsInline(true)
      this.setOutput(true, 'String')
      this.setColour(160)
    },
  }
  Blockly.Blocks['util_replace_all'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('TEXT').appendField('文本')
      this.appendValueInput('FIND').appendField('把')
      this.appendValueInput('REPL').appendField('换成')
      this.setInputsInline(true)
      this.setOutput(true, 'String')
      this.setColour(160)
    },
  }
  Blockly.Blocks['util_line_count'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('TEXT').appendField('行数')
      this.setOutput(true, 'Number')
      this.setColour(160)
    },
  }
  Blockly.Blocks['util_contains_count'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('TEXT').appendField('文本')
      this.appendValueInput('KEYWORD').appendField('中「')
      this.appendDummyInput().appendField('」出现次数')
      this.setInputsInline(true)
      this.setOutput(true, 'Number')
      this.setColour(160)
    },
  }
  Blockly.Blocks['text_newline'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField('换行')
      this.setOutput(true, 'String')
      this.setColour(160)
    },
  }
  Blockly.Blocks['text_empty'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField('空文本')
      this.setOutput(true, 'String')
      this.setColour(160)
    },
  }

  Blockly.Blocks['control_open_screen'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .appendField('打开另一屏幕')
        .appendField(new Blockly.FieldDropdown(screenMenu), 'SCREEN')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(45)
    },
  }

  Blockly.Blocks['control_close_screen'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField('关闭当前屏幕（返回上一屏）')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(45)
    },
  }

  const stmtComp = (type: string, label: string, colour: number) => {
    Blockly.Blocks[type] = {
      init(this: Blockly.Block) {
        this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField(label)
        this.setPreviousStatement(true)
        this.setNextStatement(true)
        this.setColour(colour)
      },
    }
  }
  stmtComp('alarm_arm', '.开启闹钟', 20)
  stmtComp('alarm_cancel', '.关闭闹钟', 20)
  stmtComp('calendar_today', '.回到今天', 20)
  stmtComp('flashlight_on', '.打开手电筒', 20)
  stmtComp('flashlight_off', '.关闭手电筒', 20)
  stmtComp('recorder_start', '.开始录音', 20)
  stmtComp('recorder_stop', '.停止录音', 20)
  stmtComp('barcode_scan', '.扫码', 20)
  stmtComp('reminder_arm', '.开启提醒', 20)
  stmtComp('reminder_cancel', '.关闭提醒', 20)
  stmtComp('todo_clear_done', '.清除已完成', 20)
  stmtComp('calc_eval', '.计算', 20)
  stmtComp('calc_clear', '.清空算式', 20)
  stmtComp('dial_call', '.拨打', 20)
  stmtComp('dial_clear', '.清空号码', 20)
  stmtComp('dial_backspace', '.退格', 20)
  stmtComp('map_mylocation', '.定位到我', 20)

  Blockly.Blocks['calendar_shift'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT')
        .appendField('.')
        .appendField(
          new Blockly.FieldDropdown([
            ['下一月', '1'],
            ['上一月', '-1'],
          ]),
          'DIR',
        )
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['sms_send'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.发短信')
      this.appendValueInput('PHONE').appendField('号码')
      this.appendValueInput('TEXT').appendField('内容')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['email_send'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.发邮件')
      this.appendValueInput('TO').appendField('收件人')
      this.appendValueInput('TITLE').appendField('标题')
      this.appendValueInput('TEXT').appendField('正文')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['notify_show'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.系统通知')
      this.appendValueInput('TITLE').appendField('标题')
      this.appendValueInput('TEXT').appendField('内容')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['map_goto'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.定位到')
      this.appendValueInput('LAT').setCheck('Number').appendField('纬度')
      this.appendValueInput('LNG').setCheck('Number').appendField('经度')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['contact_add'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.添加联系人')
      this.appendValueInput('NAME').appendField('姓名')
      this.appendValueInput('PHONE').appendField('电话')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['calendar_mark'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.标记日期')
      this.appendValueInput('DATE').appendField('日期')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['todo_add'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.添加待办')
      this.appendValueInput('ITEM').appendField('事项')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['calc_press'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.按键')
      this.appendValueInput('KEY').appendField('键')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['weather_fetch'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.获取天气')
      this.appendValueInput('CITY').appendField('城市')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['alarm_snooze'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.贪睡')
      this.appendValueInput('MINS').setCheck('Number').appendField('分钟')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['reminder_snooze'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.推迟提醒')
      this.appendValueInput('MINS').setCheck('Number').appendField('分钟')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['contact_search'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.查找联系人')
      this.appendValueInput('Q').appendField('关键词')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  Blockly.Blocks['dial_press'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown(componentMenu), 'COMPONENT').appendField('.拨号按键')
      this.appendValueInput('KEY').appendField('键')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }

  javascriptGenerator.forBlock['component_event'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const event = block.getFieldValue('EVENT')
    const body = javascriptGenerator.statementToCode(block, 'DO')
    return `rt.on('${comp}','${event}', async function() {\n${body}});\n`
  }

  javascriptGenerator.forBlock['component_set_property'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const prop = block.getFieldValue('PROP')
    const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || "''"
    return `rt.setProp('${comp}', '${prop}', ${value});\n`
  }

  javascriptGenerator.forBlock['component_get_property'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const prop = block.getFieldValue('PROP')
    return [`rt.getProp('${comp}', '${prop}')`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['notifier_alert'] = function (block) {
    const msg = javascriptGenerator.valueToCode(block, 'MESSAGE', Order.NONE) || "''"
    return `rt.alert(${msg});\n`
  }

  javascriptGenerator.forBlock['notifier_message'] = function (block) {
    const msg = javascriptGenerator.valueToCode(block, 'MESSAGE', Order.NONE) || "''"
    const title = javascriptGenerator.valueToCode(block, 'TITLE', Order.NONE) || "'提示'"
    const btn = javascriptGenerator.valueToCode(block, 'BUTTON', Order.NONE) || "'确定'"
    return `rt.messageDialog(${msg}, ${title}, ${btn});\n`
  }

  javascriptGenerator.forBlock['notifier_choose'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const msg = javascriptGenerator.valueToCode(block, 'MESSAGE', Order.NONE) || "''"
    const title = javascriptGenerator.valueToCode(block, 'TITLE', Order.NONE) || "'选择'"
    const b1 = javascriptGenerator.valueToCode(block, 'BTN1', Order.NONE) || "'是'"
    const b2 = javascriptGenerator.valueToCode(block, 'BTN2', Order.NONE) || "'否'"
    return `rt.chooseDialog('${comp}', ${msg}, ${title}, ${b1}, ${b2});\n`
  }

  javascriptGenerator.forBlock['canvas_clear'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    return `rt.canvasClear('${comp}');\n`
  }

  javascriptGenerator.forBlock['canvas_draw_line'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const x1 = javascriptGenerator.valueToCode(block, 'X1', Order.NONE) || '0'
    const y1 = javascriptGenerator.valueToCode(block, 'Y1', Order.NONE) || '0'
    const x2 = javascriptGenerator.valueToCode(block, 'X2', Order.NONE) || '0'
    const y2 = javascriptGenerator.valueToCode(block, 'Y2', Order.NONE) || '0'
    const color = javascriptGenerator.valueToCode(block, 'COLOR', Order.NONE) || "'#000'"
    return `rt.canvasDrawLine('${comp}', ${x1}, ${y1}, ${x2}, ${y2}, ${color});\n`
  }

  javascriptGenerator.forBlock['canvas_draw_circle'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const x = javascriptGenerator.valueToCode(block, 'X', Order.NONE) || '0'
    const y = javascriptGenerator.valueToCode(block, 'Y', Order.NONE) || '0'
    const r = javascriptGenerator.valueToCode(block, 'R', Order.NONE) || '10'
    const color = javascriptGenerator.valueToCode(block, 'COLOR', Order.NONE) || "'#000'"
    return `rt.canvasDrawCircle('${comp}', ${x}, ${y}, ${r}, ${color});\n`
  }

  javascriptGenerator.forBlock['webviewer_goto'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const url = javascriptGenerator.valueToCode(block, 'URL', Order.NONE) || "''"
    return `rt.webGoTo('${comp}', ${url});\n`
  }

  javascriptGenerator.forBlock['listview_set_elements'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const els = javascriptGenerator.valueToCode(block, 'ELEMENTS', Order.NONE) || "''"
    return `rt.listSetElements('${comp}', ${els});\n`
  }

  javascriptGenerator.forBlock['clock_system_time'] = function () {
    return [`Date.now()`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['camera_take_picture'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const image = block.getFieldValue('IMAGE')
    return `rt.takePicture('${comp}','${image}');\n`
  }

  javascriptGenerator.forBlock['sprite_move_to'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const x = javascriptGenerator.valueToCode(block, 'X', Order.NONE) || '0'
    const y = javascriptGenerator.valueToCode(block, 'Y', Order.NONE) || '0'
    return `rt.moveTo('${comp}', ${x}, ${y});\n`
  }
  javascriptGenerator.forBlock['sprite_random_move'] = function (block) {
    return `rt.randomMoveInParent('${block.getFieldValue('COMPONENT')}', 90);\n`
  }
  javascriptGenerator.forBlock['arcade_collect_sprite'] = function (block) {
    const sprite = block.getFieldValue('SPRITE')
    return (
      `if (rt.randomMoveInParent('${sprite}', 90)) {\n` +
      `  rt.scoreAdd('ScoreBoard1', 5);\n` +
      `  rt.soundPlay('Sound1');\n` +
      `  rt.setProp('StatusLabel', 'Text', '吃到星星 +5！随机换位');\n` +
      `}\n`
    )
  }
  javascriptGenerator.forBlock['player_start'] = function (block) {
    return `rt.playerStart('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['player_pause'] = function (block) {
    return `rt.playerPause('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['player_stop'] = function (block) {
    return `rt.playerStop('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['sound_play'] = function (block) {
    return `rt.soundPlay('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['tts_speak'] = function (block) {
    const msg = javascriptGenerator.valueToCode(block, 'MESSAGE', Order.NONE) || "''"
    return `rt.ttsSpeak('${block.getFieldValue('COMPONENT')}', ${msg});\n`
  }
  javascriptGenerator.forBlock['speech_get_text'] = function (block) {
    return `rt.speechGetText('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['sharing_share'] = function (block) {
    const msg = javascriptGenerator.valueToCode(block, 'MESSAGE', Order.NONE) || "''"
    return `rt.shareMessage(${msg});\n`
  }
  javascriptGenerator.forBlock['activity_start'] = function (block) {
    const url = javascriptGenerator.valueToCode(block, 'URL', Order.NONE) || "''"
    return `rt.startActivity(${url});\n`
  }
  javascriptGenerator.forBlock['phone_call'] = function (block) {
    const num = javascriptGenerator.valueToCode(block, 'NUMBER', Order.NONE) || "''"
    return `rt.phoneCall(${num});\n`
  }
  javascriptGenerator.forBlock['web_get'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const url = javascriptGenerator.valueToCode(block, 'URL', Order.NONE) || "''"
    return `rt.webGet('${comp}', ${url});\n`
  }
  javascriptGenerator.forBlock['dice_roll'] = function (block) {
    return `rt.diceRoll('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['countdown_start'] = function (block) {
    return `rt.countdownStart('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['countdown_pause'] = function (block) {
    return `rt.countdownPause('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['countdown_reset'] = function (block) {
    return `rt.countdownReset('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['stopwatch_start'] = function (block) {
    return `rt.stopwatchStart('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['stopwatch_pause'] = function (block) {
    return `rt.stopwatchPause('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['stopwatch_reset'] = function (block) {
    return `rt.stopwatchReset('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['qr_refresh'] = function (block) {
    return `rt.qrRefresh('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['celebrate'] = function (block) {
    return `rt.celebrate('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['coin_flip'] = function (block) {
    return `rt.coinFlip('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['traffic_next'] = function (block) {
    return `rt.trafficNext('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['score_add'] = function (block) {
    const delta = javascriptGenerator.valueToCode(block, 'DELTA', Order.NONE) || '1'
    return `rt.scoreAdd('${block.getFieldValue('COMPONENT')}', ${delta});\n`
  }
  javascriptGenerator.forBlock['score_reset'] = function (block) {
    return `rt.scoreReset('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['pedometer_reset'] = function (block) {
    return `rt.pedometerReset('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['fortune_ask'] = function (block) {
    return `rt.fortuneAsk('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['vibrate'] = function (block) {
    const ms = javascriptGenerator.valueToCode(block, 'MS', Order.NONE) || '200'
    return `rt.vibrate('${block.getFieldValue('COMPONENT')}', ${ms});\n`
  }
  javascriptGenerator.forBlock['clipboard_copy'] = function (block) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''"
    return `rt.clipboardCopy('${block.getFieldValue('COMPONENT')}', ${text});\n`
  }
  javascriptGenerator.forBlock['clipboard_paste'] = function (block) {
    return `rt.clipboardPaste('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['random_next_int'] = function (block) {
    const min = javascriptGenerator.valueToCode(block, 'MIN', Order.NONE) || '1'
    const max = javascriptGenerator.valueToCode(block, 'MAX', Order.NONE) || '6'
    return `rt.randomNextInt('${block.getFieldValue('COMPONENT')}', ${min}, ${max});\n`
  }
  javascriptGenerator.forBlock['file_save'] = function (block) {
    const content = javascriptGenerator.valueToCode(block, 'CONTENT', Order.NONE) || "''"
    const name = javascriptGenerator.valueToCode(block, 'NAME', Order.NONE) || "''"
    return `rt.saveFile('${block.getFieldValue('COMPONENT')}', ${content}, ${name});\n`
  }
  javascriptGenerator.forBlock['gallery_open'] = function (block) {
    return `rt.galleryOpen('${block.getFieldValue('COMPONENT')}','${block.getFieldValue('IMAGE')}');\n`
  }
  javascriptGenerator.forBlock['note_save'] = function (block) {
    const title = javascriptGenerator.valueToCode(block, 'TITLE', Order.NONE) || "''"
    const content = javascriptGenerator.valueToCode(block, 'CONTENT', Order.NONE) || "''"
    return `rt.noteSave('${block.getFieldValue('COMPONENT')}', ${title}, ${content});\n`
  }
  javascriptGenerator.forBlock['note_load'] = function (block) {
    const title = javascriptGenerator.valueToCode(block, 'TITLE', Order.NONE) || "''"
    return `rt.noteLoad('${block.getFieldValue('COMPONENT')}', ${title});\n`
  }
  javascriptGenerator.forBlock['note_delete'] = function (block) {
    const title = javascriptGenerator.valueToCode(block, 'TITLE', Order.NONE) || "''"
    return `rt.noteDelete('${block.getFieldValue('COMPONENT')}', ${title});\n`
  }
  javascriptGenerator.forBlock['note_list'] = function (block) {
    return `rt.noteList('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['note_clear_all'] = function (block) {
    return `rt.noteClearAll('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['file_pick'] = function (block) {
    return `rt.pickFiles('${block.getFieldValue('COMPONENT')}', false);\n`
  }
  javascriptGenerator.forBlock['file_pick_multi'] = function (block) {
    return `rt.pickFiles('${block.getFieldValue('COMPONENT')}', true);\n`
  }
  javascriptGenerator.forBlock['folder_pick'] = function (block) {
    return `rt.pickFolder('${block.getFieldValue('COMPONENT')}');\n`
  }
  javascriptGenerator.forBlock['folder_search'] = function (block) {
    const kw = javascriptGenerator.valueToCode(block, 'KEYWORD', Order.NONE) || "''"
    return `rt.searchFolder('${block.getFieldValue('COMPONENT')}', ${kw});\n`
  }
  javascriptGenerator.forBlock['workshop_search'] = function (block) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''"
    const kw = javascriptGenerator.valueToCode(block, 'KEYWORD', Order.NONE) || "''"
    return `rt.textSearchLines('${block.getFieldValue('COMPONENT')}', ${text}, ${kw});\n`
  }
  javascriptGenerator.forBlock['workshop_replace'] = function (block) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''"
    const find = javascriptGenerator.valueToCode(block, 'FIND', Order.NONE) || "''"
    const repl = javascriptGenerator.valueToCode(block, 'REPL', Order.NONE) || "''"
    return `rt.textReplaceAll('${block.getFieldValue('COMPONENT')}', ${text}, ${find}, ${repl});\n`
  }
  javascriptGenerator.forBlock['workshop_stats'] = function (block) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''"
    return `rt.textWordStats('${block.getFieldValue('COMPONENT')}', ${text});\n`
  }
  javascriptGenerator.forBlock['workshop_sort'] = function (block) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''"
    return `rt.textSortLines('${block.getFieldValue('COMPONENT')}', ${text}, false);\n`
  }
  javascriptGenerator.forBlock['workshop_unique'] = function (block) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''"
    return `rt.textUniqueLines('${block.getFieldValue('COMPONENT')}', ${text});\n`
  }
  javascriptGenerator.forBlock['workshop_reverse'] = function (block) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''"
    return `rt.textReverseLines('${block.getFieldValue('COMPONENT')}', ${text});\n`
  }
  javascriptGenerator.forBlock['workshop_shuffle'] = function (block) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''"
    return `rt.textShuffleLines('${block.getFieldValue('COMPONENT')}', ${text});\n`
  }
  javascriptGenerator.forBlock['workshop_csv_col'] = function (block) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''"
    const col = javascriptGenerator.valueToCode(block, 'COL', Order.NONE) || '1'
    return `rt.textCsvColumn('${block.getFieldValue('COMPONENT')}', ${text}, ${col});\n`
  }
  javascriptGenerator.forBlock['util_filter_lines'] = function (block) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''"
    const kw = javascriptGenerator.valueToCode(block, 'KEYWORD', Order.NONE) || "''"
    return [`rt.utilFilterLines(${text}, ${kw})`, Order.FUNCTION_CALL]
  }
  javascriptGenerator.forBlock['util_replace_all'] = function (block) {
    // inputs order in block: TEXT, FIND, REPL but labels say 把 TEXT 中的 FIND 换成 REPL
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''"
    const find = javascriptGenerator.valueToCode(block, 'FIND', Order.NONE) || "''"
    const repl = javascriptGenerator.valueToCode(block, 'REPL', Order.NONE) || "''"
    return [`rt.utilReplaceAll(${text}, ${find}, ${repl})`, Order.FUNCTION_CALL]
  }
  javascriptGenerator.forBlock['util_line_count'] = function (block) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''"
    return [`rt.utilLineCount(${text})`, Order.FUNCTION_CALL]
  }
  javascriptGenerator.forBlock['util_contains_count'] = function (block) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''"
    const kw = javascriptGenerator.valueToCode(block, 'KEYWORD', Order.NONE) || "''"
    return [`rt.utilContainsCount(${text}, ${kw})`, Order.FUNCTION_CALL]
  }
  javascriptGenerator.forBlock['webdb_store'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const tag = javascriptGenerator.valueToCode(block, 'TAG', Order.NONE) || "''"
    const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || "''"
    return `rt.webDbStore('${comp}', ${tag}, ${value});\n`
  }
  javascriptGenerator.forBlock['webdb_get'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const tag = javascriptGenerator.valueToCode(block, 'TAG', Order.NONE) || "''"
    return `rt.webDbGet('${comp}', ${tag});\n`
  }
  javascriptGenerator.forBlock['text_newline'] = function () {
    return ["'\\n'", Order.ATOMIC]
  }
  javascriptGenerator.forBlock['text_empty'] = function () {
    return ["''", Order.ATOMIC]
  }

  javascriptGenerator.forBlock['tinydb_store'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const tag = javascriptGenerator.valueToCode(block, 'TAG', Order.NONE) || "''"
    const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || "''"
    return `rt.dbStore('${comp}', ${tag}, ${value});\n`
  }

  javascriptGenerator.forBlock['tinydb_get'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const tag = javascriptGenerator.valueToCode(block, 'TAG', Order.NONE) || "''"
    const def = javascriptGenerator.valueToCode(block, 'DEFAULT', Order.NONE) || "''"
    return [`rt.dbGet('${comp}', ${tag}, ${def})`, Order.FUNCTION_CALL]
  }

  javascriptGenerator.forBlock['tinydb_clear_tag'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const tag = javascriptGenerator.valueToCode(block, 'TAG', Order.NONE) || "''"
    return `rt.dbClearTag('${comp}', ${tag});\n`
  }

  javascriptGenerator.forBlock['tinydb_clear_all'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    return `rt.dbClearAll('${comp}');\n`
  }

  javascriptGenerator.forBlock['control_open_screen'] = function (block) {
    const screen = block.getFieldValue('SCREEN')
    return `rt.openScreen('${screen}');\n`
  }

  javascriptGenerator.forBlock['control_close_screen'] = function () {
    return `rt.closeScreen();\n`
  }

  const simpleRt = (type: string, fn: string) => {
    javascriptGenerator.forBlock[type] = function (block) {
      const comp = block.getFieldValue('COMPONENT')
      return `rt.${fn}('${comp}');\n`
    }
  }
  simpleRt('alarm_arm', 'alarmArm')
  simpleRt('alarm_cancel', 'alarmCancel')
  simpleRt('calendar_today', 'calendarToday')
  simpleRt('flashlight_on', 'flashlightOn')
  simpleRt('flashlight_off', 'flashlightOff')
  simpleRt('recorder_start', 'recorderStart')
  simpleRt('recorder_stop', 'recorderStop')
  simpleRt('barcode_scan', 'barcodeScan')
  simpleRt('reminder_arm', 'reminderArm')
  simpleRt('reminder_cancel', 'reminderCancel')
  simpleRt('todo_clear_done', 'todoClearDone')
  simpleRt('calc_eval', 'calcEval')
  simpleRt('calc_clear', 'calcClear')
  simpleRt('dial_call', 'dialCall')
  simpleRt('dial_clear', 'dialClear')
  simpleRt('dial_backspace', 'dialBackspace')
  simpleRt('map_mylocation', 'mapMyLocation')
  javascriptGenerator.forBlock['calendar_shift'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const dir = block.getFieldValue('DIR')
    return `rt.calendarShift('${comp}', ${dir});\n`
  }
  javascriptGenerator.forBlock['sms_send'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const phone = javascriptGenerator.valueToCode(block, 'PHONE', Order.NONE) || "''"
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''"
    return `rt.smsSend('${comp}', ${phone}, ${text});\n`
  }
  javascriptGenerator.forBlock['email_send'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const to = javascriptGenerator.valueToCode(block, 'TO', Order.NONE) || "''"
    const title = javascriptGenerator.valueToCode(block, 'TITLE', Order.NONE) || "''"
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''"
    return `rt.emailSend('${comp}', ${to}, ${title}, ${text});\n`
  }
  javascriptGenerator.forBlock['notify_show'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const title = javascriptGenerator.valueToCode(block, 'TITLE', Order.NONE) || "''"
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''"
    return `rt.notifyShow('${comp}', ${title}, ${text});\n`
  }
  javascriptGenerator.forBlock['map_goto'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const lat = javascriptGenerator.valueToCode(block, 'LAT', Order.NONE) || '0'
    const lng = javascriptGenerator.valueToCode(block, 'LNG', Order.NONE) || '0'
    return `rt.mapGoto('${comp}', ${lat}, ${lng});\n`
  }
  javascriptGenerator.forBlock['contact_add'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const name = javascriptGenerator.valueToCode(block, 'NAME', Order.NONE) || "''"
    const phone = javascriptGenerator.valueToCode(block, 'PHONE', Order.NONE) || "''"
    return `rt.contactAdd('${comp}', ${name}, ${phone});\n`
  }
  javascriptGenerator.forBlock['calendar_mark'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const date = javascriptGenerator.valueToCode(block, 'DATE', Order.NONE) || "''"
    return `rt.calendarMark('${comp}', ${date});\n`
  }
  javascriptGenerator.forBlock['todo_add'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const item = javascriptGenerator.valueToCode(block, 'ITEM', Order.NONE) || "''"
    return `rt.todoAdd('${comp}', ${item});\n`
  }
  javascriptGenerator.forBlock['calc_press'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const key = javascriptGenerator.valueToCode(block, 'KEY', Order.NONE) || "''"
    return `rt.calcPress('${comp}', ${key});\n`
  }
  javascriptGenerator.forBlock['weather_fetch'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const city = javascriptGenerator.valueToCode(block, 'CITY', Order.NONE) || "''"
    return `rt.weatherFetch('${comp}', ${city});\n`
  }
  javascriptGenerator.forBlock['alarm_snooze'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const mins = javascriptGenerator.valueToCode(block, 'MINS', Order.NONE) || '5'
    return `rt.alarmSnooze('${comp}', ${mins});\n`
  }
  javascriptGenerator.forBlock['reminder_snooze'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const mins = javascriptGenerator.valueToCode(block, 'MINS', Order.NONE) || '5'
    return `rt.reminderSnooze('${comp}', ${mins});\n`
  }
  javascriptGenerator.forBlock['contact_search'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const q = javascriptGenerator.valueToCode(block, 'Q', Order.NONE) || "''"
    return `rt.contactSearch('${comp}', ${q});\n`
  }
  javascriptGenerator.forBlock['dial_press'] = function (block) {
    const comp = block.getFieldValue('COMPONENT')
    const key = javascriptGenerator.valueToCode(block, 'KEY', Order.NONE) || "''"
    return `rt.dialPress('${comp}', ${key});\n`
  }
}

export function buildToolbox() {
  const toolbox = {
    kind: 'categoryToolbox',
    contents: [
      {
        kind: 'category',
        name: '事件',
        colour: '30',
        contents: [{ kind: 'block', type: 'component_event' }],
      },
      {
        kind: 'category',
        name: '属性',
        colour: '165',
        contents: [
          { kind: 'block', type: 'component_set_property' },
          { kind: 'block', type: 'component_get_property' },
        ],
      },
      {
        kind: 'category',
        name: '控制',
        colour: '45',
        contents: [
          { kind: 'block', type: 'controls_if' },
          { kind: 'block', type: 'controls_ifelse' },
          { kind: 'block', type: 'controls_repeat_ext' },
          { kind: 'block', type: 'controls_whileUntil' },
          { kind: 'block', type: 'controls_for' },
          { kind: 'block', type: 'controls_forEach' },
          { kind: 'block', type: 'controls_flow_statements' },
          { kind: 'block', type: 'controls_wait' },
          { kind: 'block', type: 'controls_wait_seconds' },
          { kind: 'block', type: 'control_open_screen' },
          { kind: 'block', type: 'control_close_screen' },
          { kind: 'block', type: 'activity_start' },
          { kind: 'block', type: 'phone_call' },
        ],
      },
      {
        kind: 'category',
        name: '数学',
        colour: '230',
        contents: [
          { kind: 'block', type: 'math_number' },
          { kind: 'block', type: 'math_arithmetic' },
          { kind: 'block', type: 'math_single' },
          { kind: 'block', type: 'math_round' },
          { kind: 'block', type: 'math_modulo' },
          { kind: 'block', type: 'math_constrain' },
          { kind: 'block', type: 'math_random_int' },
          { kind: 'block', type: 'math_random_float' },
          { kind: 'block', type: 'math_trig' },
          { kind: 'block', type: 'math_constant' },
          { kind: 'block', type: 'math_number_property' },
          { kind: 'block', type: 'math_on_list' },
          { kind: 'block', type: 'math_atan2' },
          { kind: 'block', type: 'math_map' },
          { kind: 'block', type: 'convert_tonumber' },
        ],
      },
      {
        kind: 'category',
        name: '逻辑',
        colour: '210',
        contents: [
          { kind: 'block', type: 'logic_compare' },
          { kind: 'block', type: 'logic_operation' },
          { kind: 'block', type: 'logic_negate' },
          { kind: 'block', type: 'logic_boolean' },
          { kind: 'block', type: 'logic_null' },
          { kind: 'block', type: 'logic_ternary' },
        ],
      },
      {
        kind: 'category',
        name: '文本',
        colour: '160',
        contents: [
          { kind: 'block', type: 'text' },
          { kind: 'block', type: 'text_empty' },
          { kind: 'block', type: 'text_newline' },
          { kind: 'block', type: 'text_join' },
          { kind: 'block', type: 'text_append' },
          { kind: 'block', type: 'text_length' },
          { kind: 'block', type: 'text_isEmpty' },
          { kind: 'block', type: 'text_indexOf' },
          { kind: 'block', type: 'text_charAt' },
          { kind: 'block', type: 'text_getSubstring' },
          { kind: 'block', type: 'text_changeCase' },
          { kind: 'block', type: 'text_trim' },
          { kind: 'block', type: 'text_count' },
          { kind: 'block', type: 'text_replace' },
          { kind: 'block', type: 'text_reverse' },
          { kind: 'block', type: 'json_get' },
          { kind: 'block', type: 'json_parse' },
          { kind: 'block', type: 'json_stringify' },
          { kind: 'block', type: 'json_set' },
          { kind: 'block', type: 'text_ask' },
          { kind: 'block', type: 'convert_tostring' },
        ],
      },
      {
        kind: 'category',
        name: '列表',
        colour: '260',
        contents: [
          { kind: 'block', type: 'lists_create_empty' },
          { kind: 'block', type: 'lists_create_with' },
          { kind: 'block', type: 'lists_repeat' },
          { kind: 'block', type: 'lists_length' },
          { kind: 'block', type: 'lists_isEmpty' },
          { kind: 'block', type: 'lists_indexOf' },
          { kind: 'block', type: 'lists_getIndex' },
          { kind: 'block', type: 'lists_setIndex' },
          { kind: 'block', type: 'lists_getSublist' },
          { kind: 'block', type: 'lists_split' },
          { kind: 'block', type: 'lists_sort' },
          { kind: 'block', type: 'lists_reverse' },
        ],
      },
      {
        kind: 'category',
        name: '变量',
        colour: '330',
        custom: 'VARIABLE',
      },
      {
        kind: 'category',
        name: '函数',
        colour: '290',
        custom: 'PROCEDURE',
      },
      {
        kind: 'category',
        name: '界面',
        colour: '160',
        contents: [{ kind: 'block', type: 'listview_set_elements' }],
      },
      {
        kind: 'category',
        name: '媒体',
        colour: '200',
        contents: [
          { kind: 'block', type: 'canvas_clear' },
          { kind: 'block', type: 'canvas_draw_line' },
          { kind: 'block', type: 'canvas_draw_circle' },
          { kind: 'block', type: 'sprite_move_to' },
          { kind: 'block', type: 'sprite_random_move' },
          { kind: 'block', type: 'arcade_collect_sprite' },
          { kind: 'block', type: 'webviewer_goto' },
          { kind: 'block', type: 'camera_take_picture' },
          { kind: 'block', type: 'player_start' },
          { kind: 'block', type: 'player_pause' },
          { kind: 'block', type: 'player_stop' },
          { kind: 'block', type: 'sound_play' },
          { kind: 'block', type: 'tts_speak' },
          { kind: 'block', type: 'speech_get_text' },
        ],
      },
      {
        kind: 'category',
        name: '颜色',
        colour: '20',
        contents: [
          { kind: 'block', type: 'colour_picker' },
          { kind: 'block', type: 'colour_random' },
          { kind: 'block', type: 'colour_rgb' },
          { kind: 'block', type: 'colour_blend' },
        ],
      },
      {
        kind: 'category',
        name: '通知',
        colour: '260',
        contents: [
          { kind: 'block', type: 'notifier_alert' },
          { kind: 'block', type: 'notifier_message' },
          { kind: 'block', type: 'notifier_choose' },
          { kind: 'block', type: 'clock_system_time' },
          { kind: 'block', type: 'sharing_share' },
        ],
      },
      {
        kind: 'category',
        name: '文件',
        colour: '145',
        contents: [
          { kind: 'block', type: 'note_save' },
          { kind: 'block', type: 'note_load' },
          { kind: 'block', type: 'note_delete' },
          { kind: 'block', type: 'note_list' },
          { kind: 'block', type: 'note_clear_all' },
          { kind: 'block', type: 'file_pick' },
          { kind: 'block', type: 'file_pick_multi' },
          { kind: 'block', type: 'folder_pick' },
          { kind: 'block', type: 'folder_search' },
          { kind: 'block', type: 'file_save' },
        ],
      },
      {
        kind: 'category',
        name: '文本工坊',
        colour: '160',
        contents: [
          { kind: 'block', type: 'workshop_search' },
          { kind: 'block', type: 'workshop_replace' },
          { kind: 'block', type: 'workshop_stats' },
          { kind: 'block', type: 'workshop_sort' },
          { kind: 'block', type: 'workshop_unique' },
          { kind: 'block', type: 'workshop_reverse' },
          { kind: 'block', type: 'workshop_shuffle' },
          { kind: 'block', type: 'workshop_csv_col' },
          { kind: 'block', type: 'util_filter_lines' },
          { kind: 'block', type: 'util_replace_all' },
          { kind: 'block', type: 'util_line_count' },
          { kind: 'block', type: 'util_contains_count' },
        ],
      },
      {
        kind: 'category',
        name: '存储',
        colour: '145',
        contents: [
          { kind: 'block', type: 'tinydb_store' },
          { kind: 'block', type: 'tinydb_get' },
          { kind: 'block', type: 'tinydb_clear_tag' },
          { kind: 'block', type: 'tinydb_clear_all' },
          { kind: 'block', type: 'webdb_store' },
          { kind: 'block', type: 'webdb_get' },
          { kind: 'block', type: 'web_get' },
        ],
      },
      {
        kind: 'category',
        name: '趣味',
        colour: '20',
        contents: [
          { kind: 'block', type: 'dice_roll' },
          { kind: 'block', type: 'coin_flip' },
          { kind: 'block', type: 'fortune_ask' },
          { kind: 'block', type: 'traffic_next' },
          { kind: 'block', type: 'score_add' },
          { kind: 'block', type: 'score_reset' },
          { kind: 'block', type: 'countdown_start' },
          { kind: 'block', type: 'countdown_pause' },
          { kind: 'block', type: 'countdown_reset' },
          { kind: 'block', type: 'stopwatch_start' },
          { kind: 'block', type: 'stopwatch_pause' },
          { kind: 'block', type: 'stopwatch_reset' },
          { kind: 'block', type: 'qr_refresh' },
          { kind: 'block', type: 'celebrate' },
        ],
      },
      {
        kind: 'category',
        name: '工具',
        colour: '65',
        contents: [
          { kind: 'block', type: 'vibrate' },
          { kind: 'block', type: 'pedometer_reset' },
          { kind: 'block', type: 'clipboard_copy' },
          { kind: 'block', type: 'clipboard_paste' },
          { kind: 'block', type: 'random_next_int' },
          { kind: 'block', type: 'gallery_open' },
        ],
      },
      {
        kind: 'category',
        name: '时间',
        colour: '65',
        contents: MIXLY_TIME_TOOLBOX,
      },
      {
        kind: 'category',
        name: '手机',
        colour: '20',
        contents: MIXLY_PHONE_TOOLBOX,
      },
    ],
  }
  const ids = [
    'catEvent',
    'catProp',
    'catCtrl',
    'catMath',
    'catLogic',
    'catText',
    'catList',
    'catVar',
    'catFunc',
    'catUi',
    'catMedia',
    'catColour',
    'catNotify',
    'catNotes',
    'catWorkshop',
    'catStorage',
    'catFun',
    'catTools',
    'catTime',
    'catPhone',
  ]
  toolbox.contents.forEach((cat, i) => {
    const id = ids[i]
    if (!id) return
    Object.assign(cat, {
      toolboxitemid: id,
      cssconfig: mixlyCategoryCssConfig(id),
    })
  })
  return toolbox
}

export function workspaceToCode(workspace: Blockly.Workspace): string {
  return javascriptGenerator.workspaceToCode(workspace)
}

export function workspaceToXml(workspace: Blockly.Workspace): string {
  const xml = Blockly.Xml.workspaceToDom(workspace)
  return Blockly.Xml.domToText(xml)
}

export function xmlToWorkspace(workspace: Blockly.Workspace, xmlText: string) {
  workspace.clear()
  if (!xmlText?.trim()) return
  try {
    const named = Array.from(
      xmlText.matchAll(/<field name="(?:COMPONENT|IMAGE)">([^<]+)<\/field>/g),
    ).map((m) => m[1])
    const screens = Array.from(xmlText.matchAll(/<field name="SCREEN">([^<]+)<\/field>/g)).map((m) => m[1])
    setBlocklyNameContext(
      Array.from(new Set([...componentNames, ...named])),
      Array.from(new Set([...screenNames, ...screens])),
    )
    const xml = Blockly.utils.xml.textToDom(xmlText)
    Blockly.Xml.domToWorkspace(xml, workspace)
  } catch (e) {
    console.warn('Failed to load blocks xml', e)
  }
}
