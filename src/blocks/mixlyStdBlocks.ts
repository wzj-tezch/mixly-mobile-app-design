import * as Blockly from 'blockly'
import { javascriptGenerator, Order } from 'blockly/javascript'

/** Mixly 通用积木：等待、日期时间、JSON。硬件引脚类不搬。 */
export function registerMixlyStdBlocks() {
  Blockly.Blocks['controls_wait'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('MS').setCheck('Number').appendField('等待(毫秒)')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(45)
      this.setTooltip('暂停一会儿再继续（不卡住整个页面）')
    },
  }
  javascriptGenerator.forBlock['controls_wait'] = function (block) {
    const ms = javascriptGenerator.valueToCode(block, 'MS', Order.NONE) || '0'
    return `await rt.wait(${ms});\n`
  }

  Blockly.Blocks['datetime_now'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField('当前时间戳')
      this.setOutput(true, 'Number')
      this.setColour(65)
    },
  }
  javascriptGenerator.forBlock['datetime_now'] = function () {
    return ['Date.now()', Order.FUNCTION_CALL]
  }

  Blockly.Blocks['datetime_format'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('TS').setCheck('Number').appendField('格式化时间')
      this.appendDummyInput()
        .appendField('为')
        .appendField(
          new Blockly.FieldDropdown([
            ['年-月-日 时:分', 'YYYY-MM-DD hh:mm'],
            ['年-月-日', 'YYYY-MM-DD'],
            ['时:分:秒', 'hh:mm:ss'],
            ['时:分', 'hh:mm'],
            ['星期', 'W'],
          ]),
          'FMT',
        )
      this.setOutput(true, 'String')
      this.setColour(65)
    },
  }
  javascriptGenerator.forBlock['datetime_format'] = function (block) {
    const ts = javascriptGenerator.valueToCode(block, 'TS', Order.NONE) || 'Date.now()'
    const fmt = block.getFieldValue('FMT')
    return [`rt.formatTime(${ts}, '${fmt}')`, Order.FUNCTION_CALL]
  }

  Blockly.Blocks['datetime_part'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('TS').setCheck('Number').appendField('取时间的')
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([
          ['年', 'year'],
          ['月', 'month'],
          ['日', 'day'],
          ['时', 'hour'],
          ['分', 'minute'],
          ['秒', 'second'],
          ['星期(0-6)', 'weekday'],
        ]),
        'PART',
      )
      this.setOutput(true, 'Number')
      this.setColour(65)
    },
  }
  javascriptGenerator.forBlock['datetime_part'] = function (block) {
    const ts = javascriptGenerator.valueToCode(block, 'TS', Order.NONE) || 'Date.now()'
    const part = block.getFieldValue('PART')
    return [`rt.timePart(${ts}, '${part}')`, Order.FUNCTION_CALL]
  }

  Blockly.Blocks['datetime_make'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('Y').setCheck('Number').appendField('组成时间 年')
      this.appendValueInput('M').setCheck('Number').appendField('月')
      this.appendValueInput('D').setCheck('Number').appendField('日')
      this.appendValueInput('H').setCheck('Number').appendField('时')
      this.appendValueInput('MIN').setCheck('Number').appendField('分')
      this.setOutput(true, 'Number')
      this.setColour(65)
    },
  }
  javascriptGenerator.forBlock['datetime_make'] = function (block) {
    const y = javascriptGenerator.valueToCode(block, 'Y', Order.NONE) || '1970'
    const m = javascriptGenerator.valueToCode(block, 'M', Order.NONE) || '1'
    const d = javascriptGenerator.valueToCode(block, 'D', Order.NONE) || '1'
    const h = javascriptGenerator.valueToCode(block, 'H', Order.NONE) || '0'
    const min = javascriptGenerator.valueToCode(block, 'MIN', Order.NONE) || '0'
    return [`rt.makeTime(${y}, ${m}, ${d}, ${h}, ${min}, 0)`, Order.FUNCTION_CALL]
  }

  Blockly.Blocks['datetime_add'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('TS').setCheck('Number').appendField('时间')
      this.appendValueInput('N').setCheck('Number').appendField('加上')
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([
          ['天', 'day'],
          ['小时', 'hour'],
          ['分钟', 'minute'],
          ['秒', 'second'],
        ]),
        'UNIT',
      )
      this.setOutput(true, 'Number')
      this.setColour(65)
    },
  }
  javascriptGenerator.forBlock['datetime_add'] = function (block) {
    const ts = javascriptGenerator.valueToCode(block, 'TS', Order.NONE) || 'Date.now()'
    const n = javascriptGenerator.valueToCode(block, 'N', Order.NONE) || '0'
    const unit = block.getFieldValue('UNIT')
    return [`rt.addTime(${ts}, ${n}, '${unit}')`, Order.FUNCTION_CALL]
  }

  Blockly.Blocks['json_get'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('OBJ').appendField('从JSON取')
      this.appendValueInput('KEY').appendField('键')
      this.setOutput(true)
      this.setColour(160)
    },
  }
  javascriptGenerator.forBlock['json_get'] = function (block) {
    const obj = javascriptGenerator.valueToCode(block, 'OBJ', Order.NONE) || "''"
    const key = javascriptGenerator.valueToCode(block, 'KEY', Order.NONE) || "''"
    return [`rt.jsonGet(${obj}, ${key})`, Order.FUNCTION_CALL]
  }

  Blockly.Blocks['json_parse'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('TEXT').appendField('解析JSON')
      this.setOutput(true)
      this.setColour(160)
    },
  }
  javascriptGenerator.forBlock['json_parse'] = function (block) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''"
    return [`rt.jsonParse(${text})`, Order.FUNCTION_CALL]
  }

  Blockly.Blocks['json_stringify'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('OBJ').appendField('转为JSON文本')
      this.setOutput(true, 'String')
      this.setColour(160)
    },
  }
  javascriptGenerator.forBlock['json_stringify'] = function (block) {
    const obj = javascriptGenerator.valueToCode(block, 'OBJ', Order.NONE) || "''"
    return [`rt.jsonStringify(${obj})`, Order.FUNCTION_CALL]
  }

  Blockly.Blocks['json_set'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('OBJ').appendField('JSON设置')
      this.appendValueInput('KEY').appendField('键')
      this.appendValueInput('VAL').appendField('为')
      this.setOutput(true, 'String')
      this.setColour(160)
    },
  }
  javascriptGenerator.forBlock['json_set'] = function (block) {
    const obj = javascriptGenerator.valueToCode(block, 'OBJ', Order.NONE) || "'{}'"
    const key = javascriptGenerator.valueToCode(block, 'KEY', Order.NONE) || "''"
    const val = javascriptGenerator.valueToCode(block, 'VAL', Order.NONE) || "''"
    return [`rt.jsonSet(${obj}, ${key}, ${val})`, Order.FUNCTION_CALL]
  }

  Blockly.Blocks['datetime_diff'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('A').setCheck('Number').appendField('时间差')
      this.appendValueInput('B').setCheck('Number').appendField('减')
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([
          ['天', 'day'],
          ['小时', 'hour'],
          ['分钟', 'minute'],
          ['秒', 'second'],
        ]),
        'UNIT',
      )
      this.setOutput(true, 'Number')
      this.setColour(65)
    },
  }
  javascriptGenerator.forBlock['datetime_diff'] = function (block) {
    const a = javascriptGenerator.valueToCode(block, 'A', Order.NONE) || 'Date.now()'
    const b = javascriptGenerator.valueToCode(block, 'B', Order.NONE) || 'Date.now()'
    const unit = block.getFieldValue('UNIT')
    return [`rt.diffTime(${a}, ${b}, '${unit}')`, Order.FUNCTION_CALL]
  }

  Blockly.Blocks['datetime_parse'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('S').appendField('文本转时间')
      this.setOutput(true, 'Number')
      this.setColour(65)
    },
  }
  javascriptGenerator.forBlock['datetime_parse'] = function (block) {
    const s = javascriptGenerator.valueToCode(block, 'S', Order.NONE) || "''"
    return [`rt.parseTime(${s})`, Order.FUNCTION_CALL]
  }

  Blockly.Blocks['controls_wait_seconds'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('SEC').setCheck('Number').appendField('等待(秒)')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(45)
      this.setTooltip('暂停若干秒再继续')
    },
  }
  javascriptGenerator.forBlock['controls_wait_seconds'] = function (block) {
    const sec = javascriptGenerator.valueToCode(block, 'SEC', Order.NONE) || '0'
    return `await rt.wait((${sec}) * 1000);\n`
  }

  Blockly.Blocks['math_map'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('X').setCheck('Number').appendField('将')
      this.appendValueInput('A1').setCheck('Number').appendField('从')
      this.appendValueInput('A2').setCheck('Number').appendField('~')
      this.appendValueInput('B1').setCheck('Number').appendField('映射到')
      this.appendValueInput('B2').setCheck('Number').appendField('~')
      this.setOutput(true, 'Number')
      this.setColour(230)
      this.setTooltip('像 Mixly 一样把数值从一个区间映射到另一个区间')
    },
  }
  javascriptGenerator.forBlock['math_map'] = function (block) {
    const x = javascriptGenerator.valueToCode(block, 'X', Order.NONE) || '0'
    const a1 = javascriptGenerator.valueToCode(block, 'A1', Order.NONE) || '0'
    const a2 = javascriptGenerator.valueToCode(block, 'A2', Order.NONE) || '1023'
    const b1 = javascriptGenerator.valueToCode(block, 'B1', Order.NONE) || '0'
    const b2 = javascriptGenerator.valueToCode(block, 'B2', Order.NONE) || '100'
    return [`rt.mathMap(${x}, ${a1}, ${a2}, ${b1}, ${b2})`, Order.FUNCTION_CALL]
  }

  Blockly.Blocks['convert_tonumber'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('V').appendField('转为数字')
      this.setOutput(true, 'Number')
      this.setColour(230)
    },
  }
  javascriptGenerator.forBlock['convert_tonumber'] = function (block) {
    const v = javascriptGenerator.valueToCode(block, 'V', Order.NONE) || "''"
    return [`(Number(${v}) || 0)`, Order.ATOMIC]
  }

  Blockly.Blocks['convert_tostring'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('V').appendField('转为文本')
      this.setOutput(true, 'String')
      this.setColour(160)
    },
  }
  javascriptGenerator.forBlock['convert_tostring'] = function (block) {
    const v = javascriptGenerator.valueToCode(block, 'V', Order.NONE) || "''"
    return [`String(${v} == null ? '' : ${v})`, Order.FUNCTION_CALL]
  }

  Blockly.Blocks['text_ask'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('Q').appendField('询问用户')
      this.appendValueInput('DEF').appendField('默认')
      this.setOutput(true, 'String')
      this.setColour(160)
    },
  }
  javascriptGenerator.forBlock['text_ask'] = function (block) {
    const q = javascriptGenerator.valueToCode(block, 'Q', Order.NONE) || "'请输入'"
    const def = javascriptGenerator.valueToCode(block, 'DEF', Order.NONE) || "''"
    return [`rt.ask(${q}, ${def})`, Order.FUNCTION_CALL]
  }

  Blockly.Blocks['util_open_url'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('URL').appendField('打开网址')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  javascriptGenerator.forBlock['util_open_url'] = function (block) {
    const url = javascriptGenerator.valueToCode(block, 'URL', Order.NONE) || "''"
    return `rt.openUrl(${url});\n`
  }

  Blockly.Blocks['util_keep_awake'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .appendField('屏幕常亮')
        .appendField(
          new Blockly.FieldDropdown([
            ['打开', '1'],
            ['关闭', '0'],
          ]),
          'ON',
        )
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  javascriptGenerator.forBlock['util_keep_awake'] = function (block) {
    const on = block.getFieldValue('ON') === '1'
    return `rt.keepAwake(${on});\n`
  }

  Blockly.Blocks['util_brightness'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('PCT').setCheck('Number').appendField('设置亮度%')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  javascriptGenerator.forBlock['util_brightness'] = function (block) {
    const pct = javascriptGenerator.valueToCode(block, 'PCT', Order.NONE) || '100'
    return `rt.setBrightness(${pct});\n`
  }

  Blockly.Blocks['util_volume'] = {
    init(this: Blockly.Block) {
      this.appendValueInput('PCT').setCheck('Number').appendField('设置音量%')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  javascriptGenerator.forBlock['util_volume'] = function (block) {
    const pct = javascriptGenerator.valueToCode(block, 'PCT', Order.NONE) || '80'
    return `rt.setVolume(${pct});\n`
  }

  Blockly.Blocks['util_beep'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField('哔一声')
      this.setPreviousStatement(true)
      this.setNextStatement(true)
      this.setColour(20)
    },
  }
  javascriptGenerator.forBlock['util_beep'] = function () {
    return `rt.beep();\n`
  }
}

export const MIXLY_TIME_TOOLBOX = [
  { kind: 'block', type: 'datetime_now' },
  { kind: 'block', type: 'datetime_format' },
  { kind: 'block', type: 'datetime_part' },
  { kind: 'block', type: 'datetime_make' },
  { kind: 'block', type: 'datetime_add' },
  { kind: 'block', type: 'datetime_diff' },
  { kind: 'block', type: 'datetime_parse' },
  { kind: 'block', type: 'clock_system_time' },
  { kind: 'block', type: 'controls_wait_seconds' },
]

export const MIXLY_PHONE_TOOLBOX = [
  { kind: 'block', type: 'alarm_arm' },
  { kind: 'block', type: 'alarm_cancel' },
  { kind: 'block', type: 'reminder_arm' },
  { kind: 'block', type: 'reminder_cancel' },
  { kind: 'block', type: 'calendar_today' },
  { kind: 'block', type: 'calendar_shift' },
  { kind: 'block', type: 'calendar_mark' },
  { kind: 'block', type: 'sms_send' },
  { kind: 'block', type: 'email_send' },
  { kind: 'block', type: 'flashlight_on' },
  { kind: 'block', type: 'flashlight_off' },
  { kind: 'block', type: 'notify_show' },
  { kind: 'block', type: 'recorder_start' },
  { kind: 'block', type: 'recorder_stop' },
  { kind: 'block', type: 'barcode_scan' },
  { kind: 'block', type: 'map_goto' },
  { kind: 'block', type: 'contact_add' },
  { kind: 'block', type: 'todo_add' },
  { kind: 'block', type: 'todo_clear_done' },
  { kind: 'block', type: 'calc_eval' },
  { kind: 'block', type: 'calc_clear' },
  { kind: 'block', type: 'calc_press' },
  { kind: 'block', type: 'weather_fetch' },
  { kind: 'block', type: 'alarm_snooze' },
  { kind: 'block', type: 'reminder_snooze' },
  { kind: 'block', type: 'map_mylocation' },
  { kind: 'block', type: 'contact_search' },
  { kind: 'block', type: 'dial_press' },
  { kind: 'block', type: 'dial_call' },
  { kind: 'block', type: 'dial_clear' },
  { kind: 'block', type: 'util_open_url' },
  { kind: 'block', type: 'util_keep_awake' },
  { kind: 'block', type: 'util_brightness' },
  { kind: 'block', type: 'util_volume' },
  { kind: 'block', type: 'util_beep' },
]
