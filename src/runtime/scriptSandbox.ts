/** 高级模式脚本：静态拒绝危险写法，运行时只暴露 rt 白名单。 */

export const SCRIPT_MAX_CHARS = 16000
export const SCRIPT_MAX_LINES = 300
export const SCRIPT_MAX_TIMERS = 20
export const SCRIPT_MAX_TIMEOUT_MS = 60_000

/** 与 previewDoc makeRt() 方法名对齐；脚本只能调用这里的 rt.xxx */
export const RT_ALLOWED_METHODS = [
  'on',
  'wait',
  'setProp',
  'getProp',
  'alert',
  'messageDialog',
  'chooseDialog',
  'ask',
  'openScreen',
  'closeScreen',
  'openUrl',
  'formatTime',
  'timePart',
  'makeTime',
  'addTime',
  'diffTime',
  'parseTime',
  'jsonGet',
  'jsonParse',
  'jsonStringify',
  'jsonSet',
  'mathMap',
  'keepAwake',
  'setBrightness',
  'setVolume',
  'beep',
  'canvasClear',
  'canvasDrawLine',
  'canvasDrawCircle',
  'webGoTo',
  'listSetElements',
  'dbStore',
  'dbGet',
  'dbClearTag',
  'dbClearAll',
  'clearLocalData',
  'takePicture',
  'takePictureNow',
  'moveTo',
  'randomMoveInParent',
  'playerStart',
  'playerPause',
  'playerStop',
  'soundPlay',
  'ttsSpeak',
  'speechGetText',
  'shareMessage',
  'startActivity',
  'phoneCall',
  'webGet',
  'webPost',
  'webRequest',
  'diceRoll',
  'countdownStart',
  'countdownPause',
  'countdownReset',
  'stopwatchStart',
  'stopwatchPause',
  'stopwatchReset',
  'qrRefresh',
  'celebrate',
  'coinFlip',
  'trafficNext',
  'scoreAdd',
  'scoreReset',
  'pedometerReset',
  'fortuneAsk',
  'vibrate',
  'clipboardCopy',
  'clipboardPaste',
  'randomNextInt',
  'saveFile',
  'noteNs',
  'notePersist',
  'noteRemove',
  'noteGetIndex',
  'noteSetIndex',
  'noteParseBody',
  'noteFormatTime',
  'noteTitleKey',
  'noteSave',
  'noteLoad',
  'noteDelete',
  'noteList',
  'noteClearAll',
  'pickFiles',
  'pickFolder',
  'searchFolder',
  'workshopSet',
  'textSearchLines',
  'textReplaceAll',
  'textWordStats',
  'textSortLines',
  'textUniqueLines',
  'textReverseLines',
  'textCase',
  'textCsvColumn',
  'textShuffleLines',
  'utilFilterLines',
  'utilReplaceAll',
  'utilLineCount',
  'utilContainsCount',
  'galleryOpen',
  'webDbStore',
  'webDbGet',
  'alarmArm',
  'alarmCancel',
  'alarmSnooze',
  'reminderArm',
  'reminderCancel',
  'reminderSnooze',
  'calendarToday',
  'calendarShift',
  'calendarMark',
  'flashlightOn',
  'flashlightOff',
  'smsSend',
  'emailSend',
  'notifyShow',
  'notifyShowNow',
  'mapGoto',
  'mapMyLocation',
  'contactAdd',
  'contactSearch',
  'dialPress',
  'dialCall',
  'dialClear',
  'dialBackspace',
  'todoAdd',
  'todoClearDone',
  'calcPress',
  'calcEval',
  'calcClear',
  'weatherFetch',
  'recorderStart',
  'recorderStop',
  'barcodeScan',
] as const

export type ScriptCheck = { ok: true } | { ok: false; reason: string }

const EXACT_DANGER_STRINGS = new Set([
  'constructor',
  '__proto__',
  'prototype',
  'eval',
  'function',
  '__definegetter__',
  '__definesetter__',
  '__lookupgetter__',
  '__lookupsetter__',
])

const DANGER_SNIPPETS = [
  'javascript:',
  'vbscript:',
  'data:text/html',
  'data:text/javascript',
  'data:application/javascript',
  'data:application/ecmascript',
  'mhtml:',
]

const FORBIDDEN: Array<{ re: RegExp; reason: string; onRaw?: boolean }> = [
  { re: /\beval\s*\(/, reason: '不允许 eval' },
  { re: /\bFunction\s*\(/, reason: '不允许 Function' },
  { re: /\bnew\s+Function\b/, reason: '不允许 new Function' },
  { re: /\bconstructor\b/, reason: '不允许使用 constructor' },
  { re: /__proto__/, reason: '不允许 __proto__', onRaw: true },
  { re: /\.prototype\b/, reason: '不允许访问 prototype' },
  { re: /\bwindow\b/, reason: '不允许使用 window' },
  { re: /\bdocument\b/, reason: '不允许使用 document' },
  { re: /\bglobalThis\b/, reason: '不允许使用 globalThis' },
  { re: /\bframes\b/, reason: '不允许使用 frames' },
  { re: /\bopener\b/, reason: '不允许使用 opener' },
  { re: /\bfetch\s*\(/, reason: '不允许直接 fetch，请用 rt.webGet / rt.weatherFetch 等' },
  { re: /\bXMLHttpRequest\b/, reason: '不允许 XMLHttpRequest' },
  { re: /\bWebSocket\b/, reason: '不允许 WebSocket' },
  { re: /\bWorker\b/, reason: '不允许 Worker' },
  { re: /\bSharedWorker\b/, reason: '不允许 SharedWorker' },
  { re: /\bimportScripts\b/, reason: '不允许 importScripts' },
  { re: /\bimport\b/, reason: '不允许 import' },
  { re: /\bexport\s+/, reason: '不允许 export' },
  { re: /\brequire\s*\(/, reason: '不允许 require' },
  { re: /\blocalStorage\b/, reason: '不允许 localStorage，请用 TinyDB / rt.dbStore' },
  { re: /\bsessionStorage\b/, reason: '不允许 sessionStorage' },
  { re: /\bindexedDB\b/, reason: '不允许 indexedDB' },
  { re: /\bnavigator\b/, reason: '不允许 navigator' },
  { re: /\blocation\b/, reason: '不允许 location' },
  { re: /\bCapacitor\b/, reason: '不允许 Capacitor' },
  { re: /\bprocess\b/, reason: '不允许 process' },
  { re: /\bDeno\b/, reason: '不允许 Deno' },
  { re: /\bReflect\b/, reason: '不允许 Reflect' },
  { re: /\bProxy\b/, reason: '不允许 Proxy' },
  { re: /\bwith\s*\(/, reason: '不允许 with' },
  { re: /javascript\s*:/i, reason: '不允许 javascript: 链接', onRaw: true },
  { re: /vbscript\s*:/i, reason: '不允许 vbscript: 链接', onRaw: true },
  { re: /data\s*:\s*text\s*\/\s*html/i, reason: '不允许 data:text/html', onRaw: true },
  { re: /<\s*\/?\s*script/i, reason: '不允许嵌入 script 标签', onRaw: true },
  { re: /\binnerHTML\b/, reason: '不允许 innerHTML' },
  { re: /\bouterHTML\b/, reason: '不允许 outerHTML' },
  { re: /\binsertAdjacentHTML\b/, reason: '不允许 insertAdjacentHTML' },
  { re: /\bFunction\.prototype/, reason: '不允许 Function.prototype' },
  { re: /\bsetTimeout\s*\(\s*['"`]/, reason: 'setTimeout 只能传入函数，不能传入字符串', onRaw: true },
  { re: /\bsetInterval\s*\(\s*['"`]/, reason: 'setInterval 只能传入函数，不能传入字符串', onRaw: true },
  { re: /\bfromCharCode\b/, reason: '不允许 fromCharCode' },
  { re: /\bfromCodePoint\b/, reason: '不允许 fromCodePoint' },
  { re: /\bgetPrototypeOf\b/, reason: '不允许 getPrototypeOf' },
  { re: /\bsetPrototypeOf\b/, reason: '不允许 setPrototypeOf' },
  { re: /\bdefineProperty\b/, reason: '不允许 defineProperty' },
  { re: /\bdefineProperties\b/, reason: '不允许 defineProperties' },
  { re: /\bgetOwnPropertyDescriptor\b/, reason: '不允许 getOwnPropertyDescriptor' },
  { re: /\bgetOwnPropertyDescriptors\b/, reason: '不允许 getOwnPropertyDescriptors' },
  { re: /\bgetOwnPropertyNames\b/, reason: '不允许 getOwnPropertyNames' },
  { re: /\bgetOwnPropertySymbols\b/, reason: '不允许 getOwnPropertySymbols' },
  { re: /\bunescape\b/, reason: '不允许 unescape' },
  { re: /\bcompile\b/, reason: '不允许 compile' },
  { re: /\bDOMParser\b/, reason: '不允许 DOMParser' },
  { re: /\bXMLSerializer\b/, reason: '不允许 XMLSerializer' },
  { re: /\bWebAssembly\b/, reason: '不允许 WebAssembly' },
  { re: /\bSharedArrayBuffer\b/, reason: '不允许 SharedArrayBuffer' },
  { re: /\bAtomics\b/, reason: '不允许 Atomics' },
  { re: /\bEventSource\b/, reason: '不允许 EventSource' },
  { re: /\bBroadcastChannel\b/, reason: '不允许 BroadcastChannel' },
  { re: /\bMessageChannel\b/, reason: '不允许 MessageChannel' },
  { re: /\bRTCPeerConnection\b/, reason: '不允许 RTCPeerConnection' },
]

const RT_SET = new Set<string>(RT_ALLOWED_METHODS)

function decodeIdentEscapes(src: string): string {
  return src
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h: string) => {
      const n = Number.parseInt(h, 16)
      if (!Number.isFinite(n) || n < 0 || n > 0x10ffff) return ''
      try {
        return String.fromCodePoint(n)
      } catch {
        return ''
      }
    })
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h: string) => String.fromCharCode(Number.parseInt(h, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, h: string) => String.fromCharCode(Number.parseInt(h, 16)))
}

function skipString(s: string, i: number, q: string): { next: number; value: string } {
  let value = ''
  i += 1
  while (i < s.length) {
    if (s[i] === '\\') {
      const n = s[i + 1]
      if (n == null) break
      value += s[i] + n
      i += 2
      continue
    }
    if (s[i] === q) return { next: i + 1, value }
    value += s[i]
    i += 1
  }
  return { next: i, value }
}

function interpretLiteral(raw: string): string {
  return raw
}

type ScriptScan = { scanned: string; exact: string[]; joined: string[] }

function analyzeScript(src: string): ScriptScan {
  const s = decodeIdentEscapes(src)
  let scanned = ''
  const exact: string[] = []
  const joined: string[] = []
  let concat: string[] | null = null
  let i = 0

  const flushConcat = () => {
    if (concat && concat.length > 1) joined.push(concat.join(''))
    concat = null
  }

  const pushLiteral = (value: string) => {
    const cooked = interpretLiteral(value)
    exact.push(cooked)
    if (!concat) concat = [cooked]
    else concat.push(cooked)
  }

  const skipWs = () => {
    while (i < s.length && /[\s;]/.test(s[i])) i += 1
  }

  while (i < s.length) {
    const c = s[i]
    const n = s[i + 1]
    if (c === '/' && n === '/') {
      flushConcat()
      while (i < s.length && s[i] !== '\n') i += 1
      continue
    }
    if (c === '/' && n === '*') {
      flushConcat()
      i += 2
      while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) i += 1
      i += 2
      scanned += ' '
      continue
    }
    if (c === '"' || c === "'") {
      const got = skipString(s, i, c)
      pushLiteral(got.value)
      i = got.next
      scanned += ' '
      const save = i
      skipWs()
      if (s[i] === '+') {
        i += 1
        continue
      }
      i = save
      flushConcat()
      continue
    }
    if (c === '`') {
      const parts: string[] = []
      i += 1
      let chunk = ''
      while (i < s.length) {
        if (s[i] === '\\') {
          chunk += s[i] + (s[i + 1] ?? '')
          i += 2
          continue
        }
        if (s[i] === '`') {
          parts.push(interpretLiteral(chunk))
          i += 1
          break
        }
        if (s[i] === '$' && s[i + 1] === '{') {
          parts.push(interpretLiteral(chunk))
          chunk = ''
          i += 2
          let depth = 1
          let expr = ''
          while (i < s.length && depth > 0) {
            if (s[i] === '{') depth += 1
            else if (s[i] === '}') depth -= 1
            if (depth > 0) expr += s[i]
            i += 1
          }
          const inner = analyzeScript(expr)
          scanned += ` ${inner.scanned} `
          exact.push(...inner.exact)
          joined.push(...inner.joined)
          continue
        }
        chunk += s[i]
        i += 1
      }
      exact.push(...parts)
      if (parts.length) joined.push(parts.join(''))
      scanned += ' '
      flushConcat()
      continue
    }
    flushConcat()
    scanned += c
    i += 1
  }
  flushConcat()

  const arrayRe = /\[\s*(?:(['"`])(?:\\.|(?!\1).)*\1\s*,\s*)*(['"`])(?:\\.|(?!\2).)*\2\s*\]/g
  let m: RegExpExecArray | null
  while ((m = arrayRe.exec(s))) {
    const inner = m[0].slice(1, -1)
    const parts: string[] = []
    const lit = /(['"`])((?:\\.|[^\\])*?)\1/g
    let lm: RegExpExecArray | null
    while ((lm = lit.exec(inner))) parts.push(interpretLiteral(lm[2]))
    if (parts.length > 1) joined.push(parts.join(''))
  }

  return { scanned, exact, joined }
}

/** 去掉注释和字符串，保留模板字符串里的 ${...} 表达式，供静态检查。 */
export function scanCodeForCheck(src: string): string {
  return analyzeScript(src).scanned
}

function snippetHit(s: string): string | null {
  const compact = s.toLowerCase().replace(/[\s\0._-]+/g, '')
  for (const w of DANGER_SNIPPETS) {
    if (compact.includes(w.replace(/[\s/_-]+/g, ''))) return w
  }
  const exact = s.trim().toLowerCase()
  if (EXACT_DANGER_STRINGS.has(exact)) return exact
  const joined = compact
  if (joined.includes('constructor') && s.toLowerCase().includes('cons') && s.toLowerCase().includes('tructor')) {
    if (exact === 'constructor' || joined === 'constructor') return 'constructor'
  }
  if (joined.includes('__proto__') || joined.includes('proto__')) {
    if (joined.includes('__proto__')) return '__proto__'
  }
  return null
}

function dangerInBuiltString(s: string): string | null {
  const exact = s.trim().toLowerCase()
  if (EXACT_DANGER_STRINGS.has(exact)) return exact
  const compact = s.toLowerCase().replace(/[\s\0]+/g, '')
  for (const w of DANGER_SNIPPETS) {
    if (compact.includes(w)) return w
  }
  if (compact === 'constructor' || compact === '__proto__' || compact === 'prototype') return compact
  return null
}

export function validateAdvancedScript(code: string): ScriptCheck {
  if (typeof code !== 'string') return { ok: false, reason: '脚本必须是文本' }
  if (code.includes('\0')) return { ok: false, reason: '脚本含非法字符' }
  if (code.length > SCRIPT_MAX_CHARS) {
    return { ok: false, reason: `脚本过长（最多 ${SCRIPT_MAX_CHARS} 字）` }
  }
  const lines = code.split(/\r\n|\n|\r/)
  if (lines.length > SCRIPT_MAX_LINES) {
    return { ok: false, reason: `脚本行数过多（最多 ${SCRIPT_MAX_LINES} 行）` }
  }
  const analysis = analyzeScript(code)
  for (const rule of FORBIDDEN) {
    const target = rule.onRaw ? code : analysis.scanned
    rule.re.lastIndex = 0
    if (rule.re.test(target)) {
      return { ok: false, reason: rule.reason }
    }
  }
  for (const s of analysis.exact) {
    const hit = dangerInBuiltString(s)
    if (hit) return { ok: false, reason: `不允许在字符串里写「${hit}」来绕过限制` }
  }
  for (const s of analysis.joined) {
    const hit = dangerInBuiltString(s) || snippetHit(s)
    if (hit) return { ok: false, reason: `不允许拼接出「${hit}」` }
  }
  const rtCalls = analysis.scanned.matchAll(/\brt\.([A-Za-z_$][\w$]*)/g)
  for (const m of rtCalls) {
    const name = m[1]
    if (!RT_SET.has(name)) {
      return { ok: false, reason: `不允许调用 rt.${name}，请只用课堂提供的 rt 方法` }
    }
  }
  return { ok: true }
}

export function rtMethodsForPrompt(): string {
  return RT_ALLOWED_METHODS.join(', ')
}

const ADVANCED_ON = `开启「高级模式」后：

• 预览、导出网页、导出 APK、发布，都会运行「代码」页里的脚本，不再运行积木
• 脚本只能调用 rt（改文字、弹窗、打开屏幕等课堂接口），不能使用网页、网络、eval 等危险能力
• 积木会保留；关掉高级模式后，预览会重新跑积木
• AI 将按脚本方式生成逻辑，且不会覆盖你现有的积木

确认开启？`

const ADVANCED_OFF = `关闭后，预览将改回运行积木。各屏脚本会保留，以后还能再打开高级模式。

确认关闭高级模式？`

export function confirmSetAdvancedMode(next: boolean): boolean {
  return window.confirm(next ? ADVANCED_ON : ADVANCED_OFF)
}

/** 插入预览 iframe：限制全局名、rt 白名单、定时器数量，并堵住 constructor / AsyncFunction 逃逸。 */
export function sandboxRunnerSource(): string {
  const allow = JSON.stringify(Object.fromEntries(RT_ALLOWED_METHODS.map((m) => [m, true])))
  return `
  var __AI2_LOCKED__ = false;
  var __AI2_CTOR_SAVES__ = [];
  function __ai2RestoreCtor(){
    if (!__AI2_LOCKED__) return;
    while (__AI2_CTOR_SAVES__.length){
      var s = __AI2_CTOR_SAVES__.pop();
      try { if (s.desc) Object.defineProperty(s.obj, s.key, s.desc); } catch (e) {}
    }
    __AI2_LOCKED__ = false;
  }
  function __ai2LockIntrinsics(){
    if (__AI2_LOCKED__) return;
    function lock(obj, key){
      if (!obj) return;
      try {
        var desc = Object.getOwnPropertyDescriptor(obj, key);
        __AI2_CTOR_SAVES__.push({ obj: obj, key: key, desc: desc });
        Object.defineProperty(obj, key, {
          configurable: true,
          get: function(){ throw new Error('不允许使用 constructor'); },
          set: function(){ throw new Error('不允许使用 constructor'); }
        });
      } catch (e) {}
    }
    function lockCtor(C){
      if (!C) return;
      lock(C, 'constructor');
      if (C.prototype) lock(C.prototype, 'constructor');
    }
    lockCtor(Function);
    try { lockCtor(Object.getPrototypeOf(function*(){}).constructor); } catch (e) {}
    try { lockCtor(Object.getPrototypeOf(async function(){}).constructor); } catch (e) {}
    try { lockCtor(Object.getPrototypeOf(async function*(){}).constructor); } catch (e) {}
    __AI2_LOCKED__ = true;
  }
  function __ai2WrapRt(raw){
    var allow = ${allow};
    var maxMs = ${SCRIPT_MAX_TIMEOUT_MS};
    return new Proxy(raw, {
      get: function(t, p){
        if (p === 'then') return undefined;
        if (typeof p !== 'string' || !allow[p]) throw new Error('不允许调用 rt.' + String(p));
        var v = t[p];
        if (p === 'on') {
          return function(comp, event, fn){
            if (typeof fn !== 'function') throw new Error('rt.on 第三个参数必须是函数');
            return t.on(comp, event, function(){
              try { return fn.apply(undefined, arguments); }
              catch (err) { showToast('脚本运行错误: ' + (err && err.message ? err.message : err)); }
            });
          };
        }
        if (p === 'wait') {
          return function(ms){
            return t.wait(Math.min(Math.max(Number(ms) || 0, 0), maxMs));
          };
        }
        return typeof v === 'function' ? v.bind(t) : v;
      },
      set: function(){ return false; },
      has: function(_t, p){ return typeof p === 'string' && !!allow[p]; },
      ownKeys: function(){ return Object.keys(allow); },
      getPrototypeOf: function(){ return null; },
      getOwnPropertyDescriptor: function(){ return undefined; }
    });
  }
  function __ai2CappedTimers(){
    var living = 0;
    var maxN = ${SCRIPT_MAX_TIMERS};
    var maxMs = ${SCRIPT_MAX_TIMEOUT_MS};
    function cap(fn, ms, interval){
      if (typeof fn !== 'function') throw new Error('定时器只能传入函数');
      if (living >= maxN) throw new Error('定时器过多（最多 ' + maxN + ' 个）');
      var delay = Math.min(Math.max(Number(ms) || 0, 0), maxMs);
      living += 1;
      var id = interval
        ? setInterval(function(){ fn(); }, delay)
        : setTimeout(function(){ living = Math.max(0, living - 1); fn(); }, delay);
      return id;
    }
    return {
      setTimeout: function(fn, ms){ return cap(fn, ms, false); },
      setInterval: function(fn, ms){ return cap(fn, ms, true); },
      clearTimeout: function(id){ living = Math.max(0, living - 1); return clearTimeout(id); },
      clearInterval: function(id){ living = Math.max(0, living - 1); return clearInterval(id); }
    };
  }
  function runSandboxed(code, rtRaw){
    if (!code) return;
    var timers = __ai2CappedTimers();
    var rt = __ai2WrapRt(rtRaw);
    var consoleStub = { log: function(){}, warn: function(){}, error: function(){}, info: function(){} };
    var SafeObject = {
      keys: function(o){ return Object.keys(o); },
      values: function(o){ return Object.values(o); },
      entries: function(o){ return Object.entries(o); },
      assign: function(a, b){ return Object.assign(a, b); },
      fromEntries: function(e){ return Object.fromEntries(e); },
      is: function(a, b){ return Object.is(a, b); }
    };
    var argNames = [
      'rt','Math','Date','JSON','Number','String','Boolean','Array','Object','RegExp','Error',
      'parseInt','parseFloat','isNaN','isFinite','undefined','NaN','Infinity','console','Promise',
      'Map','Set','WeakMap','WeakSet','setTimeout','setInterval','clearTimeout','clearInterval',
      'window','document','globalThis','self','frames','opener','Function','eval','fetch',
      'XMLHttpRequest','WebSocket','Worker','SharedWorker','importScripts','localStorage',
      'sessionStorage','indexedDB','navigator','location','history','chrome','process','Deno',
      'Reflect','Proxy','Capacitor','alert','prompt','confirm','open','parent','top',
      'DOMParser','XMLSerializer','WebAssembly','SharedArrayBuffer','Atomics','EventSource',
      'BroadcastChannel','MessageChannel','RTCPeerConnection','MutationObserver','FileReader',
      'queueMicrotask','setImmediate','execScript','ActiveXObject','netscape','Components'
    ];
    var argValues = [
      rt, Math, Date, JSON, Number, String, Boolean, Array, SafeObject, RegExp, Error,
      parseInt, parseFloat, isNaN, isFinite, undefined, NaN, Infinity, consoleStub, Promise,
      Map, Set, WeakMap, WeakSet, timers.setTimeout, timers.setInterval, timers.clearTimeout, timers.clearInterval
    ];
    while (argValues.length < argNames.length) argValues.push(undefined);
    var fn = new Function(argNames.join(','), '"use strict";\\n' + String(code).replace(/\\0/g, ''));
    __ai2LockIntrinsics();
    try {
      var ret = fn.apply(undefined, argValues);
      if (ret && typeof ret.then === 'function') {
        ret.catch(function(err){ showToast('脚本运行错误: ' + (err && err.message ? err.message : err)); });
      }
    } catch (err) {
      throw err;
    }
  }
`
}
