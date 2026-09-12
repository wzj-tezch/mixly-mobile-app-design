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
  await d.dismiss()
})

page.on('console', (m) => {
  if (m.type() === 'error') console.log('PAGEERR', m.text())
})
await page.evaluateOnNewDocument(() => {
  window.__opened = []
  const raw = window.open
  window.open = function (url, ...rest) {
    window.__opened.push(String(url || ''))
    return null
  }
})

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms))
}

async function clickText(sel, text) {
  const hit = await page.evaluate((s, t) => {
    const el = [...document.querySelectorAll(s)].find((n) => (n.textContent || '').replace(/\s+/g, '').includes(t.replace(/\s+/g, '')))
    if (!el) return false
    el.click()
    return true
  }, sel, text)
  if (!hit) throw new Error(`找不到「${text}」(${sel})`)
}

async function hasActiveTab(label) {
  return page.evaluate((lab) => {
    const btn = [...document.querySelectorAll('.mixly-mode-group button')].find(
      (b) => (b.textContent || '').includes(lab),
    )
    return !!(btn && btn.classList.contains('active'))
  }, label)
}

async function footerMode() {
  return page.evaluate(() => {
    const spans = [...document.querySelectorAll('.mix-footer-right span')]
    return spans.map((s) => s.textContent.trim()).join(' | ')
  })
}

async function screenSelectValue() {
  return page.evaluate(() => {
    const sel = document.querySelector('.mixly-nav-select')
    if (!sel) return ''
    const opt = sel.options[sel.selectedIndex]
    return (opt && opt.textContent.trim()) || sel.value
  })
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

async function loadCase(level, titlePart) {
  await page.click('.side-tabs button[title^="项目"]')
  await sleep(200)
  await clickText('.template-level-tabs button', level)
  await sleep(150)
  const loaded = await page.evaluate((part) => {
    const rows = [...document.querySelectorAll('.template-row')]
    const row = rows.find((r) => (r.querySelector('.template-row-title')?.textContent || '').includes(part))
    if (!row) return false
    const btn = row.querySelector('.template-load-btn')
    if (!btn) return false
    btn.click()
    return true
  }, titlePart)
  if (!loaded) throw new Error(`案例未找到: ${level} / ${titlePart}`)
  await sleep(400)
}

async function goPreview() {
  const btn = await page.$('.stage-tabs button[title="预览 (Tab)"]')
  if (!btn) throw new Error('没有预览按钮')
  await btn.click()
  await page.waitForSelector('iframe.preview-frame', { timeout: 8000 })
  await sleep(350)
}

async function previewFrame() {
  const iframe = await page.$('iframe.preview-frame')
  if (!iframe) throw new Error('预览 iframe 不在')
  const frame = await iframe.contentFrame()
  if (!frame) throw new Error('预览 iframe 无内容')
  return frame
}

async function clickPreviewButton(text) {
  const frame = await previewFrame()
  const clicked = await frame.evaluate((t) => {
    const btns = [...document.querySelectorAll('button, [data-type="Button"]')]
    const el = btns.find((b) => (b.textContent || '').replace(/\s+/g, ' ').trim() === t)
    if (!el) return false
    el.click()
    return true
  }, text)
  if (!clicked) throw new Error(`预览里没有按钮「${text}」`)
  await sleep(450)
}

async function previewHasText(text) {
  const frame = await previewFrame()
  return frame.evaluate((t) => document.body.innerText.includes(t), text)
}

try {
  console.log('goto...')
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForSelector('.mixly-nav', { timeout: 15000 })
  await sleep(800)
  console.log('opened')
  ok('板卡页打开')

  // —— 顶栏模式跳转 ——
  for (const [label, expect] of [
    ['模块', '模块'],
    ['混合', '混合'],
    ['代码', '代码'],
    ['设计器', '设计'],
  ]) {
    await clickText('.mixly-mode-group button', label)
    await sleep(250)
    const active = await hasActiveTab(label)
    const foot = await footerMode()
    if (active && foot.includes(expect)) ok(`顶栏「${label}」→ ${foot}`)
    else fail(`顶栏「${label}」未转到正确模式 active=${active} footer=${foot}`)
  }

  // —— 左侧栏跳转 ——
  for (const [title, expect] of [
    ['组件 (Shift+1)', '组件'],
    ['组件树 (Shift+2)', '结构'],
    ['资源 (Shift+3)', '资源'],
    ['项目 (Shift+4)', '项目'],
  ]) {
    await page.click(`.side-tabs button[title="${title}"]`)
    await sleep(180)
    const now = await leftActive()
    if (now === expect) ok(`左侧「${expect}」`)
    else fail(`左侧点「${expect}」实际是「${now}」`)
  }

  // —— 数字键 1–4 ——
  await page.mouse.click(720, 80)
  await page.keyboard.press('Digit2')
  await sleep(200)
  if (await hasActiveTab('模块')) ok('快捷键 2 → 模块')
  else fail(`快捷键 2 未到模块 footer=${await footerMode()}`)
  await page.keyboard.press('Digit1')
  await sleep(250)
  if (await hasActiveTab('设计器')) ok('快捷键 1 → 设计器')
  else fail(`快捷键 1 未到设计器 footer=${await footerMode()}`)
  await page.keyboard.press('Digit3')
  await sleep(200)
  if (await hasActiveTab('混合')) ok('快捷键 3 → 混合')
  else fail(`快捷键 3 未到混合 footer=${await footerMode()}`)
  await page.keyboard.press('Digit4')
  await sleep(200)
  if (await hasActiveTab('代码')) ok('快捷键 4 → 代码')
  else fail(`快捷键 4 未到代码 footer=${await footerMode()}`)
  await page.keyboard.press('Digit1')
  await sleep(200)

  // —— Shift+1–4 左侧 ——
  await page.keyboard.down('Shift')
  await page.keyboard.press('Digit3')
  await page.keyboard.up('Shift')
  await sleep(200)
  if ((await leftActive()) === '资源') ok('Shift+3 → 资源')
  else fail(`Shift+3 实际左侧=${await leftActive()}`)
  await page.keyboard.down('Shift')
  await page.keyboard.press('Digit1')
  await page.keyboard.up('Shift')
  await sleep(200)
  if ((await leftActive()) === '组件') ok('Shift+1 → 组件')
  else fail(`Shift+1 实际左侧=${await leftActive()}`)
  await page.keyboard.down('Shift')
  await page.keyboard.press('Digit2')
  await page.keyboard.up('Shift')
  await sleep(180)
  if ((await leftActive()) === '结构') ok('Shift+2 → 结构')
  else fail(`Shift+2 实际左侧=${await leftActive()}`)
  await page.keyboard.down('Shift')
  await page.keyboard.press('Digit4')
  await page.keyboard.up('Shift')
  await sleep(180)
  if ((await leftActive()) === '项目') ok('Shift+4 → 项目')
  else fail(`Shift+4 实际左侧=${await leftActive()}`)
  await page.keyboard.down('Shift')
  await page.keyboard.press('Digit1')
  await page.keyboard.up('Shift')
  await sleep(150)

  await page.keyboard.down('Control')
  await page.keyboard.press('KeyF')
  await page.keyboard.up('Control')
  await sleep(120)
  const searchFocused = await page.evaluate(() => document.activeElement?.classList.contains('palette-search'))
  if (searchFocused) ok('Ctrl+F 跳到组件搜索框')
  else fail('Ctrl+F 没有聚焦组件搜索框')
  await page.keyboard.press('Escape')
  await page.mouse.click(720, 80)
  await sleep(80)

  // —— 设计 / 预览按钮 ——
  await page.click('.stage-tabs button[title="预览 (Tab)"]')
  await sleep(250)
  if ((await stageActive()) === '预览') ok('点「预览」进入预览')
  else fail(`点预览后舞台是 ${await stageActive()}`)
  await page.click('.stage-tabs button[title="设计 (Tab)"]')
  await sleep(200)
  if ((await stageActive()) === '设计') ok('点「设计」回到设计')
  else fail(`点设计后舞台是 ${await stageActive()}`)

  // —— Mixly 主页链接 ——
  const home = await page.$eval('.mixly-home', (a) => ({ href: a.href, text: a.textContent.trim() }))
  if (home.href.endsWith('/index.html') && !home.href.includes('mobile-app-design')) ok(`Mixly 主页指向 ${home.href}`)
  else fail(`Mixly 主页 href 不对: ${home.href}`)

  // —— 帮助 FAB + 快捷键行 ——
  await page.click('.usage-fab')
  await sleep(200)
  if (await page.$('.usage-panel')) ok('点「?」打开帮助')
  else fail('点「?」没有打开帮助')
  await clickText('.usage-tabs button', '快捷键')
  await sleep(150)
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.usage-key-run')].find((b) => b.textContent.trim() === '模块')
    if (btn) btn.click()
  })
  await sleep(350)
  if (await hasActiveTab('模块')) ok('帮助里点「模块」跳到模块页')
  else fail(`帮助点模块后 footer=${await footerMode()} help=${!!(await page.$('.usage-panel'))}`)
  if (!(await page.$('.usage-panel'))) ok('跳转类快捷键会关掉帮助')
  else fail('点模块后帮助还开着')

  await page.keyboard.press('F1')
  await sleep(250)
  if (await page.$('.usage-panel')) ok('F1 打开帮助')
  else fail('F1 没有打开帮助')
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.usage-key-run')].find((b) => b.textContent.trim() === '设计器')
    if (btn) btn.click()
  })
  await sleep(300)
  if (await hasActiveTab('设计器')) ok('帮助里点「设计器」回到设计器')
  else fail('帮助点设计器未回到设计器')

  // —— 帮助组件跳转：当前屏有按钮则选中 ——
  await page.click('.usage-fab')
  await sleep(200)
  if (!(await page.$('.usage-panel'))) await page.click('.usage-fab')
  await sleep(150)
  await clickText('.usage-tabs button', '组件用法')
  await sleep(150)
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.usage-list button')].find((b) => b.textContent.trim() === '按钮')
    if (btn) btn.click()
  })
  await sleep(250)
  const selected = await page.evaluate(() => {
    const title = document.querySelector('.usage-detail-title')?.textContent.trim()
    const outline = !!document.querySelector('.phone-screen [style*="outline: 2px solid"], .phone-screen [style*="outline:2px solid"]')
    const anySel = !!document.querySelector('.d-dnd .is-over, [style*="rgb(0, 150, 136)"]')
    return { title, outline, anySel, editor: document.querySelector('.mixly-mode-group button.active')?.textContent }
  })
  if (selected.title === '按钮') ok('帮助点「按钮」打开按钮说明')
  else fail(`帮助点按钮后标题是 ${selected.title}`)

  await page.keyboard.press('Escape')
  await sleep(150)

  // —— 文件菜单：效果演示 ——
  await clickText('.mixly-nav-item', '文件')
  await sleep(150)
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.mixly-menu-drop button')].find((b) =>
      (b.textContent || '').includes('效果演示'),
    )
    if (btn) btn.click()
  })
  await sleep(250)
  if (await page.$('.demo-backdrop, .demo-card')) ok('文件菜单「效果演示」打开演示')
  else fail('文件菜单效果演示没有打开')
  await page.keyboard.press('Escape')
  await sleep(200)

  // —— 顶栏效果演示按钮 ——
  await page.click('.mixly-nav-right button[title="效果演示 (Shift+Space)"]')
  await sleep(200)
  if (await page.$('.demo-backdrop, .demo-card')) ok('顶栏「效果演示」打开')
  else fail('顶栏效果演示没有打开')
  await page.keyboard.press('Escape')
  await sleep(200)

  // —— AI ——
  await page.click('.mixly-nav-right button[title="AI 助手 (N)"]')
  await sleep(250)
  const aiOpen = await page.evaluate(() => {
    const dock = document.querySelector('.ai-dock')
    return !!(dock && !dock.hidden)
  })
  if (aiOpen) ok('点 AI 打开助手')
  else fail('点 AI 没有打开助手')
  await page.click('.mixly-nav-right button[title="AI 助手 (N)"]')
  await sleep(200)
  await page.keyboard.press('KeyN')
  await sleep(220)
  const aiN = await page.evaluate(() => {
    const dock = document.querySelector('.ai-dock')
    return !!(dock && !dock.hidden)
  })
  if (aiN) ok('快捷键 N 打开 AI')
  else fail('快捷键 N 没有打开 AI')
  await page.keyboard.down('Control')
  await page.keyboard.press('KeyH')
  await page.keyboard.up('Control')
  await sleep(250)
  const helpWhileAi = await page.$('.usage-panel')
  if (helpWhileAi) ok('AI 输入框聚焦时 Ctrl+H 仍打开帮助')
  else fail('AI 输入框聚焦时 Ctrl+H 没有打开帮助')
  await page.keyboard.press('Escape')
  await sleep(200)
  const aiClosed = await page.evaluate(() => {
    const dock = document.querySelector('.ai-dock')
    const help = document.querySelector('.usage-panel')
    return (!dock || dock.hidden) && !help
  })
  if (aiClosed) ok('Esc 关闭 AI 和帮助')
  else fail('Esc 没有同时关掉 AI / 帮助')
  await page.keyboard.down('Shift')
  await page.keyboard.press('Space')
  await page.keyboard.up('Shift')
  await sleep(220)
  if (await page.$('.demo-backdrop, .demo-card')) ok('Shift+Space 打开效果演示')
  else fail('Shift+Space 没有打开演示')
  await page.keyboard.press('Escape')
  await sleep(180)
  await page.keyboard.down('Control')
  await page.keyboard.press('KeyH')
  await page.keyboard.up('Control')
  await sleep(220)
  if (await page.$('.usage-panel')) ok('Ctrl+H 打开帮助')
  else fail('Ctrl+H 没有打开帮助')
  await page.keyboard.press('Escape')
  await sleep(150)

  // —— 多屏案例：绘本翻页 ——
  await loadCase('难', '四屏故事书')
  await sleep(300)
  let scr = await screenSelectValue()
  if (scr === 'Cover' || scr.includes('封面') || scr === 'Cover') ok(`加载绘本后当前屏 ${scr}`)
  else ok(`加载绘本后当前屏 ${scr}`)
  await goPreview()
  if (await previewHasText('小星星历险记')) ok('预览封面能看见书名')
  else fail('预览封面没有书名')
  await clickPreviewButton('翻开绘本')
  scr = await screenSelectValue()
  if (scr === 'Page1' || (await previewHasText('出发'))) ok(`点「翻开绘本」→ ${scr}`)
  else fail(`点「翻开绘本」后仍是 ${scr} 正文=${await previewHasText('出发')}`)
  await clickPreviewButton('回封面')
  scr = await screenSelectValue()
  if (scr === 'Cover' || (await previewHasText('小星星历险记'))) ok(`点第1页「回封面」→ ${scr}`)
  else fail(`点第1页「回封面」后是 ${scr}`)
  await clickPreviewButton('翻开绘本')
  await clickPreviewButton('下一页 →')
  scr = await screenSelectValue()
  if (scr === 'Page2' || (await previewHasText('挑战'))) ok(`点「下一页」→ ${scr}`)
  else fail(`点「下一页」后是 ${scr}`)
  await clickPreviewButton('← 上一页')
  if ((await screenSelectValue()) === 'Page1' || (await previewHasText('出发'))) ok('点「上一页」回到第1页')
  else fail(`点「上一页」后是 ${await screenSelectValue()}`)
  await clickPreviewButton('下一页 →')
  await clickPreviewButton('翻到结局 →')
  scr = await screenSelectValue()
  if (scr === 'Ending' || (await previewHasText('回家'))) ok(`点「翻到结局」→ ${scr}`)
  else fail(`点「翻到结局」后是 ${scr}`)
  await clickPreviewButton('再读一遍')
  scr = await screenSelectValue()
  if (scr === 'Page1' || (await previewHasText('出发'))) ok(`点「再读一遍」→ ${scr}`)
  else fail(`点「再读一遍」后是 ${scr}`)
  await clickPreviewButton('回封面')
  scr = await screenSelectValue()
  if (scr === 'Cover' || (await previewHasText('小星星历险记'))) ok(`点「回封面」→ ${scr}`)
  else fail(`点「回封面」后是 ${scr}`)

  // —— 校园导览 ——
  await page.click('.stage-tabs button[title="设计 (Tab)"]')
  await sleep(200)
  await loadCase('难', '地图进出多地点')
  await goPreview()
  await clickPreviewButton('🔬 创客实验室')
  if ((await screenSelectValue()) === 'Lab' || (await previewHasText('创客实验室'))) ok('校园：进实验室')
  else fail(`校园进实验室后 ${await screenSelectValue()}`)
  await clickPreviewButton('← 回地图')
  if ((await screenSelectValue()) === 'Map' || (await previewHasText('校园导览'))) ok('校园：回地图')
  else fail(`校园回地图后 ${await screenSelectValue()}`)
  await clickPreviewButton('📚 图书馆')
  if ((await screenSelectValue()) === 'Library' || (await previewHasText('积木入门'))) ok('校园：进图书馆')
  else fail(`校园进图书馆后 ${await screenSelectValue()}`)
  await clickPreviewButton('← 回地图')
  await clickPreviewButton('🍪 小卖部')
  if ((await screenSelectValue()) === 'Cafe' || (await previewHasText('点心'))) ok('校园：进小卖部')
  else fail(`校园进小卖部后 ${await screenSelectValue()}`)

  // —— 任务链 ——
  await page.click('.stage-tabs button[title="设计 (Tab)"]')
  await sleep(200)
  await loadCase('难', '大厅→答题→通关')
  await goPreview()
  await clickPreviewButton('接受任务')
  if ((await screenSelectValue()) === 'Mission' || (await previewHasText('7+5'))) ok('任务链：接任务进答题')
  else fail(`接任务后 ${await screenSelectValue()}`)
  await clickPreviewButton('放弃回大厅')
  if ((await screenSelectValue()) === 'Hub' || (await previewHasText('今日任务'))) ok('任务链：放弃回大厅')
  else fail(`放弃后 ${await screenSelectValue()}`)
  await clickPreviewButton('接受任务')
  await sleep(200)
  const typed = await (await previewFrame()).evaluate(() => {
    const box = document.querySelector('[data-name="AnsBox"], input[type="number"]')
    if (!box) return false
    box.value = '12'
    box.dispatchEvent(new Event('input', { bubbles: true }))
    box.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  })
  if (!typed) fail('任务链：找不到答题框')
  else {
    await clickPreviewButton('提交')
    if ((await screenSelectValue()) === 'Clear' || (await previewHasText('任务完成'))) ok('任务链：答 12 通关')
    else fail(`答 12 后 ${await screenSelectValue()}`)
    await clickPreviewButton('回任务大厅')
    if ((await screenSelectValue()) === 'Hub' || (await previewHasText('今日任务'))) ok('任务链：回任务大厅')
    else fail(`回大厅后 ${await screenSelectValue()}`)
  }

  // —— 多屏导航 ——
  await page.click('.stage-tabs button[title="设计 (Tab)"]')
  await sleep(200)
  await loadCase('难', '屏幕切换')
  await goPreview()
  await clickPreviewButton('前往关于页')
  if ((await screenSelectValue()) === 'About' || (await previewHasText('关于本应用'))) ok('导航：前往关于页')
  else fail(`前往关于页后 ${await screenSelectValue()}`)
  await clickPreviewButton('返回首页')
  if ((await previewHasText('欢迎')) || (await screenSelectValue()) === 'Screen1') ok('导航：返回首页')
  else fail(`返回首页后 ${await screenSelectValue()}`)

  // —— 问答结果页 ——
  await page.click('.stage-tabs button[title="设计 (Tab)"]')
  await sleep(200)
  await loadCase('难', '多屏答题')
  await goPreview()
  await clickPreviewButton('B. 木星')
  if ((await screenSelectValue()) === 'Result' || (await previewHasText('答题结果'))) ok('问答：选木星到结果页')
  else fail(`选木星后 ${await screenSelectValue()}`)
  await clickPreviewButton('再答一次')
  if ((await previewHasText('太阳系')) || (await screenSelectValue()) === 'Quiz') ok('问答：再答一次回题目')
  else fail(`再答一次后 ${await screenSelectValue()}`)
  await clickPreviewButton('A. 地球')
  if ((await screenSelectValue()) === 'Result' || (await previewHasText('答题结果'))) ok('问答：选地球也到结果页')
  else fail(`选地球后 ${await screenSelectValue()}`)

  // —— 超链接（界面馆） ——
  await page.click('.stage-tabs button[title="设计 (Tab)"]')
  await sleep(200)
  await loadCase('拓展', '控件与布局大全')
  await goPreview()
  const linkHit = await (await previewFrame()).evaluate(() => {
    const a = document.querySelector('a[data-type="Hyperlink"], a')
    if (!a) return { found: false }
    a.click()
    return { found: true, href: a.getAttribute('href') }
  })
  await sleep(300)
  const openedUrls = await page.evaluate(() => window.__opened || [])
  if (linkHit.found && (openedUrls.length > 0 || /^https?:/.test(linkHit.href || ''))) {
    ok(`超链接可点 href=${linkHit.href} opened=${openedUrls.join(',')}`)
  } else fail(`超链接无回应 found=${linkHit.found} href=${linkHit.href} opened=${JSON.stringify(openedUrls)}`)

  // —— 结构树切屏 ——
  await page.click('.stage-tabs button[title="设计 (Tab)"]')
  await sleep(150)
  await loadCase('难', '四屏故事书')
  await page.click('.side-tabs button[title="组件树 (Shift+2)"]')
  await sleep(200)
  const treeJump = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.ct-row.is-screen')]
    const page2 = rows.find((r) => (r.querySelector('.ct-name')?.textContent || '').trim() === 'Page2')
    if (!page2) return { found: false, names: rows.map((r) => r.querySelector('.ct-name')?.textContent) }
    page2.click()
    return { found: true }
  })
  await sleep(250)
  scr = await screenSelectValue()
  if (treeJump.found && scr === 'Page2') ok('结构树点 Page2 切到第2页')
  else fail(`结构树切屏 found=${treeJump.found} screen=${scr}`)

  if (!(await page.$('.usage-panel'))) await page.click('.usage-fab')
  await sleep(180)
  await clickText('.usage-tabs button', '组件用法')
  await sleep(120)
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.usage-list button')].find((b) => b.textContent.trim() === '按钮')
    if (btn) btn.click()
  })
  await sleep(250)
  const helpPick = await page.evaluate(() => ({
    kind: document.querySelector('.props-kind')?.textContent.trim(),
    name: document.querySelector('.props-name')?.textContent.trim(),
    title: document.querySelector('.usage-detail-title')?.textContent.trim(),
  }))
  if (helpPick.title === '按钮' && helpPick.kind === '组件') ok(`帮助点「按钮」选中画布组件 ${helpPick.name}`)
  else fail(`帮助点按钮后 kind=${helpPick.kind} name=${helpPick.name} title=${helpPick.title}`)
  await page.keyboard.press('Escape')
  await sleep(150)

  // —— 屏幕下拉框 ——
  const endingVal = await page.evaluate(() => {
    const sel = document.querySelector('.mixly-nav-select')
    const opt = [...sel.options].find((o) => o.textContent.trim() === 'Ending')
    return opt ? opt.value : sel.value
  })
  await page.click('.mixly-nav-select')
  await sleep(80)
  await page.select('.mixly-nav-select', endingVal)
  await sleep(200)
  if ((await screenSelectValue()) === 'Ending') ok('顶栏下拉切到 Ending')
  else fail(`下拉切屏后是 ${await screenSelectValue()}`)

  await page.click('.designer-stage')
  await sleep(80)
  await page.keyboard.press('PageDown')
  await sleep(200)
  const afterPd = await screenSelectValue()
  if (afterPd && afterPd !== 'Ending') ok(`PageDown 切到 ${afterPd}`)
  else fail(`PageDown 后仍是 ${afterPd}`)
  await page.keyboard.press('PageUp')
  await sleep(200)
  const afterPu = await screenSelectValue()
  if (afterPu === 'Ending') ok(`PageUp 回到 ${afterPu}`)
  else fail(`PageUp 后是 ${afterPu}（期望 Ending）`)

  await page.click('.stage-tabs button[title="设计 (Tab)"]')
  await sleep(150)
  await page.click('.designer-stage')
  await sleep(80)
  const beforeTab = await stageActive()
  await page.keyboard.press('Tab')
  await sleep(200)
  const afterTab = await stageActive()
  if (beforeTab !== afterTab) ok(`设计舞台 Tab：${beforeTab} → ${afterTab}`)
  else fail(`设计舞台按 Tab 没有切换（仍是 ${afterTab}）`)
  await page.keyboard.press('Tab')
  await sleep(200)
  const afterTab2 = await stageActive()
  if (afterTab2 === beforeTab) ok(`再按 Tab 回到 ${afterTab2}`)
  else fail(`再按 Tab 后是 ${afterTab2}，期望 ${beforeTab}`)
} catch (err) {
  fail('脚本中断: ' + err.message)
} finally {
  await browser.close()
}

const bad = findings.filter((f) => !f.ok)
console.log('=== JUMP CHECK ===')
for (const f of findings) console.log(`${f.ok ? 'OK  ' : 'FAIL'} ${f.m}`)
console.log(`--- ${findings.filter((f) => f.ok).length} pass / ${bad.length} fail ---`)
if (bad.length) process.exitCode = 1
