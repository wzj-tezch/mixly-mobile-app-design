import puppeteer from 'puppeteer-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const URL = 'http://127.0.0.1:65234/mobile-app-design/index.html'
const findings = []
const ok = (m) => findings.push({ ok: true, m })
const fail = (m) => findings.push({ ok: false, m })

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--lang=zh-CN'],
  defaultViewport: { width: 1440, height: 920 },
})
const page = await browser.newPage()
page.setDefaultTimeout(20000)
page.on('dialog', async (d) => {
  const t = d.message()
  if (t.includes('删除屏幕')) {
    page.__screenConfirm = t
    await d.dismiss()
    return
  }
  await d.dismiss()
})

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms))
}

async function focusStage() {
  const el = await page.$('.designer-stage')
  if (el) await el.click()
  else await page.mouse.click(720, 420)
  await sleep(80)
}

async function hasTab(label) {
  return page.evaluate((lab) => {
    const btn = [...document.querySelectorAll('.mixly-mode-group button')].find((b) =>
      (b.textContent || '').includes(lab),
    )
    return !!(btn && btn.classList.contains('active'))
  }, label)
}

async function leftActive() {
  return page.evaluate(() => {
    const btn = document.querySelector('.side-tabs button.active')
    return btn ? btn.textContent.trim() : ''
  })
}

async function stageActive() {
  return page.evaluate(() => {
    const btn = document.querySelector('.stage-tabs button.active')
    return btn ? btn.textContent.trim() : ''
  })
}

async function screenName() {
  return page.evaluate(() => {
    const sel = document.querySelector('.mixly-nav-select')
    if (!sel) return ''
    return sel.options[sel.selectedIndex]?.textContent.trim() || ''
  })
}

async function screenCount() {
  return page.evaluate(() => document.querySelector('.mixly-nav-select')?.options.length || 0)
}

async function propsName() {
  return page.evaluate(() => document.querySelector('.props-name')?.textContent.trim() || '')
}

async function chord(mods, key) {
  for (const m of mods) await page.keyboard.down(m)
  await page.keyboard.press(key)
  for (const m of [...mods].reverse()) await page.keyboard.up(m)
  await sleep(220)
}

try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForSelector('.mixly-nav', { timeout: 15000 })
  await sleep(700)
  await page.click('.mixly-mode-group button[title^="设计器"]')
  await sleep(200)
  await focusStage()
  ok('板卡打开，焦点在设计舞台')

  await page.click('.usage-fab')
  await sleep(180)
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.usage-tabs button')].find((b) => (b.textContent || '').includes('快捷键'))
    if (btn) btn.click()
  })
  await sleep(150)
  const helpKeys = await page.evaluate(() =>
    [...document.querySelectorAll('.usage-keys kbd')].map((k) => k.textContent.trim()),
  )
  await page.keyboard.press('Escape')
  await sleep(180)
  if (helpKeys.includes('Ctrl + W')) fail('帮助表仍列出 Ctrl+W（浏览器/Mixly 会关窗口，不能占用）')
  else ok('帮助表已去掉 Ctrl+W')
  if (helpKeys.includes('Esc') && helpKeys.includes('F1')) ok('帮助表仍有 Esc / F1')
  else fail(`帮助表缺 Esc/F1：${helpKeys.join(',')}`)

  await focusStage()
  await page.keyboard.press('F1')
  await sleep(220)
  if (await page.$('.usage-panel')) ok('F1 打开帮助')
  else fail('F1 没有打开帮助')
  await page.keyboard.press('Escape')
  await sleep(200)
  if (!(await page.$('.usage-panel'))) ok('Esc 关闭帮助')
  else fail('Esc 没有关闭帮助')

  await focusStage()
  await chord(['Control'], 'KeyH')
  if (await page.$('.usage-panel')) ok('Ctrl+H 打开帮助')
  else fail('Ctrl+H 没有打开帮助')
  await page.keyboard.press('Escape')
  await sleep(150)

  await focusStage()
  await page.keyboard.down('Shift')
  await page.keyboard.press('Space')
  await page.keyboard.up('Shift')
  await sleep(220)
  if (await page.$('.demo-backdrop, .demo-card')) ok('Shift+Space 打开效果演示')
  else fail('Shift+Space 没有打开演示')
  await page.keyboard.press('Escape')
  await sleep(180)
  if (!(await page.$('.demo-backdrop, .demo-card'))) ok('Esc 关闭效果演示')
  else fail('Esc 没有关闭演示')

  await focusStage()
  await page.keyboard.press('KeyN')
  await sleep(220)
  const aiOpen = await page.evaluate(() => {
    const dock = document.querySelector('.ai-dock')
    return !!(dock && !dock.hidden)
  })
  if (aiOpen) ok('N 打开 AI')
  else fail('N 没有打开 AI')
  await page.keyboard.press('Escape')
  await sleep(200)
  const aiClosed = await page.evaluate(() => {
    const dock = document.querySelector('.ai-dock')
    return !dock || dock.hidden
  })
  if (aiClosed) ok('Esc 关闭 AI')
  else fail('Esc 没有关闭 AI')

  await focusStage()
  await chord(['Control'], 'KeyF')
  const searchOn = await page.evaluate(() => document.activeElement?.classList.contains('palette-search'))
  if (searchOn) ok('Ctrl+F 聚焦组件搜索')
  else fail('Ctrl+F 没有聚焦组件搜索')
  await page.keyboard.press('Escape')
  await focusStage()

  await chord(['Control'], 'Comma')
  const settings = await page.evaluate(() => {
    const drop = document.querySelector('.settings-drop')
    const focus = document.activeElement
    return {
      open: !!drop,
      name: drop?.querySelector('input')?.value || '',
      focused: focus?.tagName === 'INPUT' && !!focus.closest('.settings-drop'),
    }
  })
  if (settings.open && settings.focused) ok(`Ctrl+, 打开设置（项目「${settings.name}」）`)
  else fail(`Ctrl+, 未打开设置 open=${settings.open} focused=${settings.focused}`)
  await page.keyboard.press('Escape')
  await sleep(150)
  if (!(await page.$('.settings-drop'))) ok('Esc 关闭设置')
  else fail('Esc 没有关闭设置')

  await focusStage()
  await page.keyboard.press('Digit2')
  await sleep(180)
  if (await hasTab('模块')) ok('2 → 模块')
  else fail('2 未到模块')
  await page.keyboard.press('Digit3')
  await sleep(180)
  if (await hasTab('混合')) ok('3 → 混合')
  else fail('3 未到混合')
  await page.keyboard.press('Digit4')
  await sleep(180)
  if (await hasTab('代码')) ok('4 → 代码')
  else fail('4 未到代码')
  await page.keyboard.press('Digit1')
  await sleep(200)
  if (await hasTab('设计器')) ok('1 → 设计器')
  else fail('1 未到设计器')

  await focusStage()
  await chord(['Shift'], 'Digit2')
  if ((await leftActive()) === '结构') ok('Shift+2 → 结构')
  else fail(`Shift+2 实际 ${await leftActive()}`)
  await chord(['Shift'], 'Digit3')
  if ((await leftActive()) === '资源') ok('Shift+3 → 资源')
  else fail(`Shift+3 实际 ${await leftActive()}`)
  await chord(['Shift'], 'Digit4')
  if ((await leftActive()) === '项目') ok('Shift+4 → 项目')
  else fail(`Shift+4 实际 ${await leftActive()}`)
  await chord(['Shift'], 'Digit1')
  if ((await leftActive()) === '组件') ok('Shift+1 → 组件')
  else fail(`Shift+1 实际 ${await leftActive()}`)

  await focusStage()
  const beforeTab = await stageActive()
  await page.keyboard.press('Tab')
  await sleep(200)
  const afterTab = await stageActive()
  if (beforeTab !== afterTab) ok(`Tab：${beforeTab} → ${afterTab}`)
  else fail(`Tab 没有切换（仍是 ${afterTab}）`)
  await page.keyboard.press('Tab')
  await sleep(200)
  if ((await stageActive()) === beforeTab) ok(`再按 Tab 回到 ${beforeTab}`)
  else fail(`再按 Tab 后是 ${await stageActive()}`)

  const n0 = await screenCount()
  await focusStage()
  await page.keyboard.down('Shift')
  await page.keyboard.press('KeyA')
  await page.keyboard.up('Shift')
  await sleep(250)
  const n1 = await screenCount()
  if (n1 === n0 + 1) ok(`Shift+A 添加屏幕（${n0} → ${n1}）`)
  else fail(`Shift+A 屏幕数 ${n0} → ${n1}`)

  const scr0 = await screenName()
  await focusStage()
  await page.keyboard.press('PageDown')
  await sleep(200)
  const scr1 = await screenName()
  if (scr1 && scr1 !== scr0) ok(`PageDown：${scr0} → ${scr1}`)
  else fail(`PageDown 仍是 ${scr1}`)
  await page.keyboard.press('PageUp')
  await sleep(200)
  if ((await screenName()) === scr0) ok(`PageUp 回到 ${scr0}`)
  else fail(`PageUp 后是 ${await screenName()}`)

  page.__screenConfirm = ''
  await focusStage()
  await page.keyboard.press('KeyX')
  await sleep(250)
  if (String(page.__screenConfirm || '').includes('删除屏幕')) ok('X 弹出删除屏幕确认（已取消）')
  else fail('X 没有弹出删除屏幕确认')

  await page.evaluate(() => {
    const sel = document.querySelector('.mixly-nav-select')
    const opt = [...(sel?.options || [])].find((o) => o.textContent.trim() === 'Screen1')
    if (sel && opt) {
      sel.value = opt.value
      sel.dispatchEvent(new Event('change', { bubbles: true }))
    }
  })
  await sleep(200)
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.phone-screen button')].find((b) =>
      (b.textContent || '').includes('点我'),
    )
    if (btn) btn.click()
  })
  await sleep(150)
  const picked = await propsName()
  if (picked && picked !== 'ScreenRoot') ok(`点选组件「${picked}」`)
  else fail(`舞台上没有点到按钮，当前是「${picked}」`)

  if (picked) {
    await chord(['Control'], 'KeyC')
    const beforePaste = await page.evaluate(() => document.querySelectorAll('.phone-screen .d-node, .phone-screen [data-type]').length)
    await chord(['Control'], 'KeyV')
    const afterPaste = await page.evaluate(() => document.querySelectorAll('.phone-screen .d-node, .phone-screen [data-type]').length)
    if (afterPaste > beforePaste || (await propsName()) !== picked) ok('Ctrl+C / Ctrl+V 粘贴出副本')
    else fail(`Ctrl+V 没有粘贴 before=${beforePaste} after=${afterPaste}`)

    const nameBeforeDel = await propsName()
    await page.keyboard.press('Delete')
    await sleep(200)
    if ((await propsName()) !== nameBeforeDel) ok('Delete 删除所选组件')
    else fail(`Delete 后仍是 ${await propsName()}`)

    await chord(['Control'], 'KeyZ')
    if ((await propsName()) === nameBeforeDel) ok('Ctrl+Z 撤销删除')
    else fail(`Ctrl+Z 后是 ${await propsName()}（期望 ${nameBeforeDel}）`)

    await chord(['Control'], 'KeyY')
    if ((await propsName()) !== nameBeforeDel) ok('Ctrl+Y 重做删除')
    else {
      await chord(['Control', 'Shift'], 'KeyZ')
      if ((await propsName()) !== nameBeforeDel) ok('Ctrl+Shift+Z 重做删除')
      else fail('Ctrl+Y / Ctrl+Shift+Z 没有重做')
    }
    await chord(['Control'], 'KeyZ')

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('.phone-screen button')].find((b) =>
        (b.textContent || '').includes('点我'),
      )
      if (btn) btn.click()
    })
    await sleep(120)
    const cutName = await propsName()
    await chord(['Control'], 'KeyX')
    if ((await propsName()) !== cutName) ok(`Ctrl+X 剪切「${cutName}」`)
    else fail(`Ctrl+X 后仍是 ${await propsName()}`)
    await chord(['Control'], 'KeyV')
    if ((await propsName()) === cutName) ok('Ctrl+V 粘回剪切的组件')
    else fail(`剪切后粘贴得到 ${await propsName()}`)
  }

  await page.evaluate(() => {
    window.__fileClicks = 0
    const input = document.querySelector('input[type="file"]')
    if (input) {
      const raw = input.click.bind(input)
      input.click = function (...args) {
        window.__fileClicks += 1
        return raw(...args)
      }
    }
  })
  await focusStage()
  await chord(['Control'], 'KeyO')
  const fileClicks = await page.evaluate(() => window.__fileClicks || 0)
  if (fileClicks > 0) ok('Ctrl+O 打开导入文件')
  else fail('Ctrl+O 没有触发文件选择')

  let zipHit = false
  page.on('response', () => {})
  await page._client?.send?.('Page.setDownloadBehavior', { behavior: 'deny', downloadPath: '' }).catch(() => {})
  page.on('request', (req) => {
    const url = req.url()
    if (url.startsWith('blob:') || req.resourceType() === 'other') zipHit = true
  })
  const created = []
  await page.evaluate(() => {
    const raw = URL.createObjectURL
    URL.createObjectURL = function (b) {
      window.__zip = (b && b.size) || 1
      return raw.call(this, b)
    }
  })
  await focusStage()
  await chord(['Control', 'Shift'], 'KeyS')
  await sleep(400)
  const zip = await page.evaluate(() => window.__zip || 0)
  if (zip || zipHit || created.length) ok('Ctrl+Shift+S 触发导出 ZIP')
  else fail('Ctrl+Shift+S 没有导出 ZIP')

  await focusStage()
  await chord(['Control'], 'KeyS')
  if (page.url().includes('mobile-app-design')) ok('Ctrl+S 保存后仍停在板卡页')
  else fail(`Ctrl+S 后离开了板卡 ${page.url()}`)

  const apkTitle = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.mixly-nav-item')].find((b) => (b.textContent || '').includes('导出APK'))
    return btn ? btn.getAttribute('title') || '' : ''
  })
  if (apkTitle.includes('Ctrl+Shift+E')) ok('导出 APK 按钮标注 Ctrl+Shift+E（未实际打包）')
  else fail(`导出 APK 按钮 title=${apkTitle}`)

  await focusStage()
  await chord(['Control'], 'KeyN')
  await sleep(300)
  const fresh = await page.evaluate(() => {
    const sel = document.querySelector('.mixly-nav-select')
    return {
      screens: sel ? sel.options.length : 0,
      first: sel?.options[0]?.textContent.trim() || '',
    }
  })
  if (fresh.screens === 1 && fresh.first) ok(`Ctrl+N 新建项目（${fresh.screens} 屏 ${fresh.first}）`)
  else fail(`Ctrl+N 后 screens=${fresh.screens} first=${fresh.first}`)
} catch (err) {
  fail('脚本中断: ' + err.message)
} finally {
  await browser.close()
}

const bad = findings.filter((f) => !f.ok)
console.log('=== SHORTCUT CHECK ===')
for (const f of findings) console.log(`${f.ok ? 'OK  ' : 'FAIL'} ${f.m}`)
console.log(`--- ${findings.filter((f) => f.ok).length} pass / ${bad.length} fail ---`)
if (bad.length) process.exitCode = 1
