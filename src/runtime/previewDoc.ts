import type { AiProject, ComponentNode, ScreenData } from '@/project/types'
import { sandboxRunnerSource } from '@/runtime/scriptSandbox'

function jsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

function isSafeHttpUrl(raw: unknown): boolean {
  try {
    const url = new URL(String(raw ?? '').trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isSafeMediaSrc(raw: unknown): boolean {
  const s = String(raw ?? '').trim()
  if (!s) return true
  if (/^data:image\//i.test(s)) return true
  if (/^blob:/i.test(s)) return true
  if (/^(\.\/|\.\.\/|\/)/.test(s) && !/javascript:|vbscript:|data:/i.test(s)) return true
  return isSafeHttpUrl(s)
}

function safeCssColor(raw: unknown): string {
  const s = String(raw ?? '')
  if (/url\s*\(|expression\s*\(|javascript:|@import|behavior:/i.test(s)) return ''
  return s.slice(0, 80)
}

function flatten(screen: ScreenData): ComponentNode[] {
  const list: ComponentNode[] = []
  const walk = (n: ComponentNode) => {
    list.push(n)
    n.children.forEach(walk)
  }
  walk(screen.root)
  list.push(...screen.nonVisible)
  return list
}

function sizeStyle(v: unknown): string {
  if (v === '填满父组件') return '100%'
  if (v === '自动' || v == null) return 'auto'
  if (typeof v === 'number') return `${v}px`
  const n = Number(v)
  if (!Number.isNaN(n) && String(v).trim() !== '') return `${n}px`
  return String(v)
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Built-in welcome page — avoids example.com → iana.org which often fails on CN networks. */
export function isBrowsableHttpUrl(raw: unknown): boolean {
  const u = String(raw ?? '').trim()
  if (!u || /^data:/i.test(u)) return false
  try {
    const url = new URL(u)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
    if (!url.hostname || !url.hostname.includes('.')) return false
    if (/(?:^|\.)(?:example\.com|iana\.org)$/i.test(url.hostname)) return false
    return true
  } catch {
    return false
  }
}

export function webViewerHomeUrl(raw: unknown): string {
  if (isBrowsableHttpUrl(raw)) return String(raw).trim()
  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>网页浏览</title>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#f8fafc;color:#1e293b;display:grid;place-items:center;min-height:100vh;padding:16px;text-align:center}
h1{font-size:16px;margin:0 0 8px}p{font-size:13px;line-height:1.5;color:#64748b;margin:0 0 8px}code{background:#e2e8f0;padding:1px 6px;border-radius:4px;font-size:12px}</style></head>
<body><div><h1>网页浏览已就绪</h1><p>填写完整 https 网址后预览；百度 / Google 登录页等通常<strong>禁止嵌入</strong>，请用「新窗口打开」。</p><p>可试：<code>https://www.wikipedia.org</code></p></div></body></html>`
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
}

export function renderNode(node: ComponentNode): string {
  const p = node.props
  const data = `data-name="${escapeHtml(node.name)}" data-type="${node.type}"`
  const w = sizeStyle(p.Width)
  const h = sizeStyle(p.Height)

  switch (node.type) {
    case 'Button':
      return `<button ${data} style="box-sizing:border-box;margin:6px 0;width:${w};height:${h};background:${p.BackgroundColor};color:${p.TextColor};font-size:${p.FontSize}px;border:none;border-radius:8px;padding:10px 14px;cursor:pointer;" ${p.Enabled === false ? 'disabled' : ''}>${escapeHtml(String(p.Text ?? ''))}</button>`
    case 'Label':
      return `<div ${data} style="box-sizing:border-box;margin:6px 0;width:${w};color:${p.TextColor};font-size:${p.FontSize}px;">${escapeHtml(String(p.Text ?? ''))}</div>`
    case 'TextBox':
      return `<input ${data} type="text" placeholder="${escapeHtml(String(p.Hint ?? ''))}" value="${escapeHtml(String(p.Text ?? ''))}" style="box-sizing:border-box;margin:6px 0;width:${w};font-size:${p.FontSize}px;padding:8px;border:1px solid #dadce0;border-radius:6px;" ${p.Enabled === false ? 'disabled' : ''} />`
    case 'PasswordTextBox':
      return `<input ${data} type="password" placeholder="${escapeHtml(String(p.Hint ?? ''))}" value="${escapeHtml(String(p.Text ?? ''))}" style="box-sizing:border-box;margin:6px 0;width:${w};font-size:${p.FontSize || 14}px;padding:8px;border:1px solid #dadce0;border-radius:6px;" ${p.Enabled === false ? 'disabled' : ''} />`
    case 'CheckBox':
      return `<label ${data} style="display:flex;align-items:center;gap:8px;margin:6px 0;"><input type="checkbox" ${p.Checked ? 'checked' : ''} ${p.Enabled === false ? 'disabled' : ''}/> ${escapeHtml(String(p.Text ?? ''))}</label>`
    case 'Switch':
      return `<label ${data} style="display:flex;align-items:center;gap:8px;margin:6px 0;"><input type="checkbox" ${p.On ? 'checked' : ''} ${p.Enabled === false ? 'disabled' : ''}/> ${escapeHtml(String(p.Text ?? ''))}</label>`
    case 'Slider':
      return `<input ${data} type="range" min="${p.MinValue}" max="${p.MaxValue}" value="${p.ThumbPosition}" style="width:${w};margin:10px 0;" />`
    case 'Spinner': {
      const items = String(p.ElementsFromString ?? '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
      const sel = String(p.Selection ?? items[0] ?? '')
      return `<select ${data} style="box-sizing:border-box;margin:6px 0;width:${w};padding:8px;border:1px solid #dadce0;border-radius:6px;">${items
        .map((it) => `<option value="${escapeHtml(it)}" ${it === sel ? 'selected' : ''}>${escapeHtml(it)}</option>`)
        .join('')}</select>`
    }
    case 'DatePicker':
      return `<input ${data} type="date" value="${escapeHtml(String(p.Date ?? ''))}" style="box-sizing:border-box;margin:6px 0;width:${w};padding:8px;border:1px solid #dadce0;border-radius:6px;" />`
    case 'TimePicker':
      return `<input ${data} type="time" value="${escapeHtml(String(p.Time ?? ''))}" style="box-sizing:border-box;margin:6px 0;width:${w};padding:8px;border:1px solid #dadce0;border-radius:6px;" />`
    case 'Image':
      return `<img ${data} src="${escapeHtml(String(p.Picture || './media/photo.png'))}" alt="" style="width:${typeof p.Width === 'number' ? p.Width + 'px' : w};height:${typeof p.Height === 'number' ? p.Height + 'px' : h};object-fit:cover;border-radius:6px;margin:6px 0;" />`
    case 'ListView': {
      const items = String(p.ElementsFromString ?? '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
      return `<ul ${data} style="list-style:none;padding:0;margin:6px 0;width:${w};height:${sizeStyle(p.Height)};overflow:auto;border:1px solid #dadce0;border-radius:8px;">${items
        .map((it) => `<li data-item="${escapeHtml(it)}" style="padding:10px 12px;border-bottom:1px solid #eee;cursor:pointer;">${escapeHtml(it)}</li>`)
        .join('')}</ul>`
    }
    case 'HorizontalArrangement':
      return `<div ${data} style="display:flex;flex-direction:row;gap:8px;align-items:center;width:${w};background:${p.BackgroundColor || 'transparent'};padding:4px;min-height:24px;">${node.children.map(renderNode).join('')}</div>`
    case 'VerticalArrangement': {
      const play = !!p.IsPlayField
      const playStyle = play
        ? `position:relative;height:${Number(p.Height) || 200}px;overflow:hidden;border:2px dashed #90a4ae;border-radius:12px;background:${p.BackgroundColor || '#e8f5e9'};`
        : `display:flex;flex-direction:column;width:${w};background:${p.BackgroundColor || 'transparent'};padding:4px;min-height:24px;`
      return `<div ${data} style="${playStyle}${play ? `width:${w};margin:8px 0;` : ''}">${node.children.map(renderNode).join('')}</div>`
    }
    case 'TableArrangement':
      return `<div ${data} style="display:grid;grid-template-columns:repeat(${Number(p.Columns) || 2},1fr);gap:8px;width:${w};">${node.children.map(renderNode).join('')}</div>`
    case 'ScrollArrangement':
      return `<div ${data} style="display:flex;flex-direction:column;gap:8px;width:${w};height:${Number(p.Height) || 220}px;overflow:auto;background:${p.BackgroundColor || 'transparent'};padding:6px;border:1px solid #e0e3e7;border-radius:8px;">${node.children.map(renderNode).join('')}</div>`
    case 'Card':
      return `<div ${data} style="width:${w};background:${escapeHtml(String(p.BackgroundColor || '#fff'))};border:1px solid #dadce0;border-radius:12px;overflow:hidden;margin:8px 0;box-shadow:0 1px 4px rgba(0,0,0,.06);"><div style="padding:10px 12px;border-bottom:1px solid #eee;font-weight:700;font-size:14px;">${escapeHtml(String(p.Title || '卡片'))}</div><div style="padding:8px 12px;display:flex;flex-direction:column;gap:6px;">${node.children.map(renderNode).join('')}</div></div>`
    case 'Canvas':
      return `<canvas ${data} width="300" height="${Number(p.Height) || 200}" style="width:${w};height:${sizeStyle(p.Height)};background:${p.BackgroundColor};border-radius:8px;margin:6px 0;display:block;"></canvas>`
    case 'Ball': {
      const r = Number(p.Radius) || 16
      const x = Number(p.X) || 0
      const y = Number(p.Y) || 0
      return `<div ${data} style="position:absolute;left:${x}px;top:${y}px;width:${r * 2}px;height:${r * 2}px;border-radius:50%;background:${escapeHtml(String(p.PaintColor || '#009688'))};cursor:pointer;z-index:2;box-shadow:0 2px 6px rgba(0,0,0,.2);"></div>`
    }
    case 'ImageSprite': {
      const x = Number(p.X) || 0
      const y = Number(p.Y) || 0
      return `<img ${data} src="${escapeHtml(String(p.Picture || './media/sprite.png'))}" alt="" style="position:absolute;left:${x}px;top:${y}px;width:${Number(p.Width) || 64}px;height:${Number(p.Height) || 64}px;object-fit:contain;cursor:pointer;z-index:2;" />`
    }
    case 'WebViewer': {
      const rawUrl = String(p.HomeUrl ?? '').trim()
      const home = webViewerHomeUrl(p.HomeUrl)
      const external = isBrowsableHttpUrl(rawUrl)
      const openBtn = external
        ? `<button type="button" data-wv-open="${escapeHtml(rawUrl)}" style="flex-shrink:0;border:none;background:#009688;color:#fff;font-size:11px;font-weight:600;padding:5px 10px;border-radius:6px;cursor:pointer;">新窗口打开</button>`
        : ''
      const tip = external
        ? `<div style="padding:4px 8px;font-size:10px;color:#7a5c00;background:#fef7e0;border-bottom:1px solid #f3e2a7;">若预览区空白，多半是网站禁止被嵌入，请点右上角「新窗口打开」。</div>`
        : ''
      return `<div class="wv-shell" style="width:${w};height:${sizeStyle(p.Height)};margin:6px 0;display:flex;flex-direction:column;border:1px solid #dadce0;border-radius:8px;overflow:hidden;background:#fff;">
<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:#f1f3f4;border-bottom:1px solid #e0e3e7;font-size:11px;color:#5f6368;">
<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">${escapeHtml(rawUrl || '内置起始页')}</span>${openBtn}
</div>${tip}
<iframe ${data} src="${escapeHtml(home)}" style="flex:1;width:100%;min-height:0;border:0;background:#fff;"></iframe>
</div>`
    }
    case 'ProgressBar': {
      const pct = Math.max(0, Math.min(100, Number(p.Progress) || 0))
      return `<div ${data} style="width:${w};height:${Number(p.Height) || 8}px;background:#e8eaed;border-radius:4px;margin:10px 0;overflow:hidden;"><div data-progress-fill style="width:${pct}%;height:100%;background:#009688;"></div></div>`
    }
    case 'Player':
      return `<audio ${data} controls src="${escapeHtml(String(p.Source || './media/chime.wav'))}" style="width:${w};margin:8px 0;display:block;"></audio>`
    case 'VideoPlayer':
      return `<video ${data} controls src="${escapeHtml(String(p.Source || './media/clip.mp4'))}" style="width:${w};height:${sizeStyle(p.Height)};margin:8px 0;display:block;background:#000;border-radius:8px;" poster="./media/poster.png"></video>`
    case 'RatingBar': {
      const max = Math.max(1, Number(p.MaxRating) || 5)
      const cur = Math.max(0, Math.min(max, Number(p.Rating) || 0))
      return `<input ${data} type="range" min="0" max="${max}" step="1" value="${cur}" style="width:${w};margin:10px 0;accent-color:#f9a825;" />`
    }
    case 'Dice': {
      const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
      const r = Math.max(1, Math.min(6, Number(p.Result) || 1))
      return `<button type="button" ${data} style="width:72px;height:72px;margin:8px 0;border:2px solid #009688;border-radius:14px;background:#fff;font-size:40px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.08);">${faces[r - 1]}</button>`
    }
    case 'Marquee': {
      const speed = Math.max(2, Number(p.Speed) || 6)
      return `<div ${data} class="ai2-marquee" style="width:${w};height:${Number(p.Height) || 36}px;margin:8px 0;overflow:hidden;border-radius:8px;background:${escapeHtml(String(p.BackgroundColor || '#e0f2f1'))};color:${escapeHtml(String(p.TextColor || '#009688'))};"><div class="ai2-marquee-track" style="animation-duration:${speed}s">${escapeHtml(String(p.Text ?? ''))}&nbsp;&nbsp;&nbsp;${escapeHtml(String(p.Text ?? ''))}</div></div>`
    }
    case 'ColorPicker':
      return `<input ${data} type="color" value="${escapeHtml(String(p.Color || '#009688'))}" style="width:56px;height:40px;margin:8px 0;border:none;background:transparent;cursor:pointer;" />`
    case 'Countdown':
      return `<div ${data} style="width:${w};margin:8px 0;text-align:center;font-size:${Number(p.FontSize) || 28}px;font-weight:700;color:${escapeHtml(String(p.TextColor || '#c62828'))};font-variant-numeric:tabular-nums;">${escapeHtml(String(p.Remaining ?? p.Seconds ?? 10))}</div>`
    case 'Stopwatch':
      return `<div ${data} style="width:${w};margin:8px 0;text-align:center;font-size:${Number(p.FontSize) || 28}px;font-weight:700;color:${escapeHtml(String(p.TextColor || '#1565c0'))};font-variant-numeric:tabular-nums;">${Number(p.Elapsed || 0).toFixed(1)}s</div>`
    case 'QRCode': {
      const size = Number(p.Size) || 140
      const text = String(p.Text || 'hello')
      const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`
      return `<img ${data} alt="二维码" src="${escapeHtml(src)}" width="${size}" height="${size}" style="margin:8px 0;border-radius:8px;background:#fff;display:block;" />`
    }
    case 'Joystick': {
      const size = Number(p.Size) || 120
      return `<div ${data} class="ai2-joy" style="width:${size}px;height:${size}px;margin:8px 0;border-radius:50%;background:#eceff1;border:2px solid #90a4ae;position:relative;touch-action:none;"><div class="ai2-joy-knob" style="width:${Math.round(size * 0.34)}px;height:${Math.round(size * 0.34)}px;border-radius:50%;background:#009688;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;box-shadow:0 2px 6px rgba(0,0,0,.2);"></div></div>`
    }
    case 'ChatBubble': {
      const right = String(p.Side) === '右'
      return `<div ${data} style="width:${w};margin:8px 0;display:flex;justify-content:${right ? 'flex-end' : 'flex-start'};cursor:pointer;"><div style="max-width:85%;padding:8px 12px;border-radius:${right ? '14px 4px 14px 14px' : '4px 14px 14px 14px'};background:${escapeHtml(String(p.BackgroundColor || '#e0f2f1'))};color:${escapeHtml(String(p.TextColor || '#202124'))};font-size:${Number(p.FontSize) || 14}px;">${escapeHtml(String(p.Text ?? ''))}</div></div>`
    }
    case 'TextArea':
      return `<textarea ${data} placeholder="${escapeHtml(String(p.Hint ?? ''))}" style="box-sizing:border-box;margin:6px 0;width:${w};height:${Number(p.Height) || 96}px;padding:8px;border:1px solid #dadce0;border-radius:6px;resize:vertical;" ${p.Enabled === false ? 'disabled' : ''}>${escapeHtml(String(p.Text ?? ''))}</textarea>`
    case 'NumberBox':
      return `<input ${data} type="number" placeholder="${escapeHtml(String(p.Hint ?? ''))}" value="${escapeHtml(String(p.Text ?? ''))}" style="box-sizing:border-box;margin:6px 0;width:${w};padding:8px;border:1px solid #dadce0;border-radius:6px;" ${p.Enabled === false ? 'disabled' : ''} />`
    case 'Hyperlink':
      return `<a ${data} href="${escapeHtml(String(p.Url || '#'))}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin:6px 0;color:${escapeHtml(String(p.TextColor || '#1565c0'))};font-size:${Number(p.FontSize) || 14}px;">${escapeHtml(String(p.Text || '链接'))}</a>`
    case 'Divider':
      return `<div ${data} style="width:${w};height:${Number(p.Thickness) || 1}px;background:${escapeHtml(String(p.Color || '#dadce0'))};margin:10px 0;"></div>`
    case 'Spacer':
      return `<div ${data} style="width:${w};height:${Number(p.Height) || 16}px;"></div>`
    case 'Badge':
      return `<span ${data} style="display:inline-block;margin:6px 0;padding:2px 8px;border-radius:999px;background:${escapeHtml(String(p.BackgroundColor || '#e53935'))};color:${escapeHtml(String(p.TextColor || '#fff'))};font-size:${Number(p.FontSize) || 12}px;font-weight:700;cursor:pointer;">${escapeHtml(String(p.Text ?? ''))}</span>`
    case 'Stepper':
      return `<div ${data} style="display:inline-flex;align-items:center;gap:4px;margin:6px 0;border:1px solid #dadce0;border-radius:8px;overflow:hidden;"><button type="button" data-step="-1" style="width:36px;height:36px;border:none;background:#f1f3f4;cursor:pointer;font-size:18px;">−</button><span data-step-val style="min-width:36px;text-align:center;font-weight:700;">${Number(p.Value) || 0}</span><button type="button" data-step="1" style="width:36px;height:36px;border:none;background:#f1f3f4;cursor:pointer;font-size:18px;">＋</button></div>`
    case 'RadioButton':
      return `<label ${data} style="display:flex;align-items:center;gap:8px;margin:6px 0;"><input type="radio" name="${escapeHtml(String(p.GroupName || 'group1'))}" ${p.Checked ? 'checked' : ''} ${p.Enabled === false ? 'disabled' : ''}/> ${escapeHtml(String(p.Text ?? ''))}</label>`
    case 'SearchBar':
      return `<input ${data} type="search" placeholder="${escapeHtml(String(p.Hint ?? '搜索…'))}" value="${escapeHtml(String(p.Text ?? ''))}" style="box-sizing:border-box;margin:6px 0;width:${w};padding:8px 12px;border:1px solid #dadce0;border-radius:20px;" />`
    case 'ToggleButton':
      return `<button type="button" ${data} style="margin:6px 0;padding:8px 12px;border:none;border-radius:8px;cursor:pointer;background:${p.Checked ? escapeHtml(String(p.BackgroundColor || '#009688')) : '#eceff1'};color:${p.Checked ? escapeHtml(String(p.TextColor || '#fff')) : '#5f6368'};">${escapeHtml(String(p.Text ?? ''))}</button>`
    case 'Avatar': {
      const size = Number(p.Size) || 56
      if (p.Picture) {
        return `<img ${data} src="${escapeHtml(String(p.Picture))}" alt="" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;margin:6px 0;cursor:pointer;" />`
      }
      return `<div ${data} style="width:${size}px;height:${size}px;border-radius:50%;background:#009688;color:#fff;display:grid;place-items:center;font-weight:700;margin:6px 0;cursor:pointer;">${escapeHtml(String(p.Text || '同').slice(0, 1))}</div>`
    }
    case 'TabBar': {
      const items = String(p.ElementsFromString ?? '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
      const sel = String(p.Selection ?? items[0] ?? '')
      return `<div ${data} style="display:flex;gap:4px;width:${w};margin:6px 0;background:#f1f3f4;border-radius:8px;padding:4px;">${items
        .map(
          (it) =>
            `<button type="button" data-tab="${escapeHtml(it)}" style="flex:1;border:none;border-radius:6px;padding:8px 4px;font-size:12px;cursor:pointer;background:${it === sel ? '#fff' : 'transparent'};font-weight:${it === sel ? 700 : 400};">${escapeHtml(it)}</button>`,
        )
        .join('')}</div>`
    }
    case 'CoinFlip':
      return `<button type="button" ${data} style="width:72px;height:72px;margin:8px 0;border-radius:50%;border:3px solid #f57f17;background:linear-gradient(145deg,#ffd54f,#ffb300);font-weight:800;font-size:18px;cursor:pointer;">${escapeHtml(String(p.Result || '正'))}</button>`
    case 'TrafficLight': {
      const state = String(p.State || '红')
      const lamp = (c: string, on: string) =>
        `<div data-lamp="${c}" style="width:22px;height:22px;border-radius:50%;margin:0 auto;background:${state === c ? on : '#455a64'};"></div>`
      return `<button type="button" ${data} style="width:44px;padding:8px 6px;background:#263238;border:none;border-radius:10px;display:flex;flex-direction:column;gap:6px;cursor:pointer;">${lamp('红', '#f44336')}${lamp('黄', '#ffeb3b')}${lamp('绿', '#4caf50')}</button>`
    }
    case 'LightBulb':
      return `<button type="button" ${data} style="font-size:42px;border:none;background:transparent;cursor:pointer;margin:6px 0;filter:${p.On ? 'none' : 'grayscale(1) opacity(0.45)'};">💡</button>`
    case 'ScoreBoard':
      return `<div ${data} style="width:${w};margin:8px 0;text-align:center;padding:12px;border-radius:10px;background:${escapeHtml(String(p.BackgroundColor || '#1a237e'))};color:${escapeHtml(String(p.TextColor || '#fff'))};"><div data-score-title style="font-size:12px;opacity:.85;">${escapeHtml(String(p.Title || '得分'))}</div><div data-score-val style="font-size:${Number(p.FontSize) || 32}px;font-weight:800;">${Number(p.Score) || 0}</div></div>`
    case 'ProgressRing': {
      const pct = Math.max(0, Math.min(100, Number(p.Percent) || 0))
      const size = Number(p.Size) || 72
      const color = escapeHtml(String(p.Color || '#009688'))
      return `<div ${data} style="width:${size}px;height:${size}px;margin:8px 0;border-radius:50%;background:conic-gradient(${color} ${pct}%, #e8eaed 0);display:grid;place-items:center;"><div style="width:${Math.round(size * 0.62)}px;height:${Math.round(size * 0.62)}px;border-radius:50%;background:#fff;display:grid;place-items:center;font-size:12px;font-weight:700;"><span data-ring-pct>${pct}%</span></div></div>`
    }
    case 'LEDLabel':
      return `<div ${data} style="width:${w};margin:8px 0;padding:8px 10px;border-radius:6px;background:${escapeHtml(String(p.BackgroundColor || '#102027'))};color:${escapeHtml(String(p.TextColor || '#69f0ae'))};font-family:ui-monospace,Consolas,monospace;font-size:${Number(p.FontSize) || 28}px;letter-spacing:2px;text-align:center;">${escapeHtml(String(p.Text ?? ''))}</div>`
    case 'FortuneBall':
      return `<button type="button" ${data} style="width:96px;height:96px;margin:8px 0;border:none;border-radius:50%;background:radial-gradient(circle at 30% 30%,#5c6bc0,#1a237e);color:#fff;font-size:12px;font-weight:700;cursor:pointer;padding:10px;">${escapeHtml(String(p.Answer || '问问我'))}</button>`
    case 'LevelBar': {
      const max = Math.max(1, Number(p.MaxValue) || 100)
      const val = Math.max(0, Math.min(max, Number(p.Value) || 0))
      return `<div ${data} style="width:${w};height:${Number(p.Height) || 14}px;margin:8px 0;background:#e8eaed;border-radius:8px;overflow:hidden;"><div data-level-fill style="width:${(val / max) * 100}%;height:100%;background:${escapeHtml(String(p.Color || '#43a047'))};"></div></div>`
    }
    case 'Alarm':
      return `<button type="button" ${data} style="width:${w};margin:8px 0;text-align:left;padding:12px 14px;border:1px solid #ffe082;border-radius:12px;background:${p.Enabled ? '#fff8e1' : '#f5f5f5'};cursor:pointer;">
        <div style="font-size:22px;font-weight:800;font-variant-numeric:tabular-nums;">⏰ ${escapeHtml(String(p.Time || '07:00'))}</div>
        <div style="font-size:12px;color:#5f6368;margin-top:4px;">${escapeHtml(String(p.Label || '闹钟'))} · ${p.Enabled ? '已开启' : '已关闭'} · ${escapeHtml(String(p.Repeat || '每天'))}</div>
      </button>`
    case 'CalendarView':
      return `<div ${data} class="ai2-cal" style="width:${w};margin:8px 0;border:1px solid #dadce0;border-radius:12px;overflow:hidden;background:#fff;"></div>`
    case 'ContactList': {
      const items = String(p.ContactsFromString ?? '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
      return `<ul ${data} style="list-style:none;padding:0;margin:6px 0;width:${w};height:${sizeStyle(p.Height)};overflow:auto;border:1px solid #dadce0;border-radius:8px;">${items
        .map((it) => `<li data-item="${escapeHtml(it)}" style="padding:10px 12px;border-bottom:1px solid #eee;cursor:pointer;">${escapeHtml(it)}</li>`)
        .join('')}</ul>`
    }
    case 'MapView': {
      const lat = Number(p.Latitude) || 39.9
      const lng = Number(p.Longitude) || 116.4
      const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.04}%2C${lat - 0.03}%2C${lng + 0.04}%2C${lat + 0.03}&layer=mapnik&marker=${lat}%2C${lng}`
      return `<iframe ${data} src="${escapeHtml(src)}" style="width:${w};height:${Number(p.Height) || 200}px;margin:8px 0;border:1px solid #dadce0;border-radius:8px;"></iframe>`
    }
    case 'ClockFace':
      return `<div ${data} style="width:${w};margin:8px 0;text-align:center;padding:12px;border-radius:12px;background:#102027;color:${escapeHtml(String(p.TextColor || '#69f0ae'))};font-size:${Number(p.FontSize) || 36}px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:1px;cursor:pointer;">${escapeHtml(String(p.Text || '12:00:00'))}</div>`
    case 'Reminder':
      return `<button type="button" ${data} style="width:${w};margin:8px 0;text-align:left;padding:12px 14px;border:1px solid #b2dfdb;border-radius:12px;background:${p.Enabled ? '#e0f2f1' : '#f5f5f5'};cursor:pointer;">
        <div style="font-size:16px;font-weight:800;">📌 ${escapeHtml(String(p.Label || '提醒'))}</div>
        <div style="font-size:12px;color:#5f6368;margin-top:4px;">${escapeHtml(String(p.Date || ''))} ${escapeHtml(String(p.Time || '08:00'))} · ${p.Enabled ? '已开启' : '已关闭'}</div>
      </button>`
    case 'TodoList': {
      const items = String(p.ItemsFromString ?? '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
      const checked = new Set(
        String(p.CheckedFromString ?? '')
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      )
      return `<ul ${data} style="list-style:none;padding:0;margin:6px 0;width:${w};height:${sizeStyle(p.Height)};overflow:auto;border:1px solid #dadce0;border-radius:8px;"><li data-todo-add style="padding:10px 12px;border-bottom:1px solid #eee;cursor:pointer;color:#009688;font-weight:700;">＋ 添加待办</li>${items
        .map((it) => {
          const on = checked.has(it)
          return `<li data-item="${escapeHtml(it)}" style="padding:10px 12px;border-bottom:1px solid #eee;cursor:pointer;display:flex;gap:8px;align-items:center;"><span>${on ? '☑' : '☐'}</span><span style="text-decoration:${on ? 'line-through' : 'none'};color:${on ? '#9aa0a6' : '#202124'};">${escapeHtml(it)}</span></li>`
        })
        .join('')}</ul>`
    }
    case 'CalculatorPad': {
      const keys = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+', 'B', 'C']
      return `<div ${data} style="width:${w};margin:8px 0;border:1px solid #dadce0;border-radius:12px;overflow:hidden;background:#fff;">
        <div data-calc-expr style="padding:8px 12px 0;font-size:12px;color:#90a4ae;min-height:18px;">${escapeHtml(String(p.Expression || ''))}</div>
        <div data-calc-res style="padding:0 12px 8px;font-size:28px;font-weight:800;text-align:right;">${escapeHtml(String(p.Result || '0'))}</div>
        <div class="ai2-calc">${keys.map((k) => `<button type="button" data-key="${k}">${k === '*' ? '×' : k === '/' ? '÷' : k === 'B' ? '⌫' : k}</button>`).join('')}</div>
      </div>`
    }
    case 'CompassView': {
      const size = Number(p.Size) || 160
      const deg = Number(p.Heading) || 0
      return `<div ${data} style="width:${size}px;height:${size}px;margin:8px auto;border-radius:50%;border:6px solid #37474f;background:radial-gradient(circle,#eceff1,#cfd8dc);position:relative;cursor:pointer;">
        <div data-needle style="position:absolute;left:50%;top:12%;width:4px;height:38%;background:#e53935;transform-origin:bottom center;transform:translateX(-50%) rotate(${deg}deg);border-radius:2px;"></div>
        <div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);font-size:12px;font-weight:800;">N</div>
      </div>`
    }
    case 'WeatherBox':
      return `<button type="button" ${data} style="width:${w};margin:8px 0;text-align:left;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#4fc3f7,#0288d1);color:#fff;cursor:pointer;">
        <div style="font-size:13px;opacity:.9;">${escapeHtml(String(p.City || '城市'))}</div>
        <div style="font-size:28px;font-weight:800;margin:4px 0;">${escapeHtml(String(p.Temperature || '--'))}°</div>
        <div style="font-size:13px;">${escapeHtml(String(p.WeatherText || '点击获取天气'))}</div>
      </button>`
    case 'DialPad': {
      const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']
      return `<div ${data} style="width:${w};margin:8px 0;border:1px solid #dadce0;border-radius:12px;overflow:hidden;background:#fff;">
        <div data-dial-num style="padding:12px;text-align:center;font-size:22px;font-weight:800;letter-spacing:2px;min-height:32px;">${escapeHtml(String(p.Number || ''))}</div>
        <div class="ai2-dial">${keys.map((k) => `<button type="button" data-dial="${k}">${k}</button>`).join('')}</div>
        <div style="display:flex;gap:8px;padding:8px;">
          <button type="button" data-dial-act="back" style="flex:1;height:40px;border:none;border-radius:8px;background:#eceff1;cursor:pointer;">⌫</button>
          <button type="button" data-dial-act="call" style="flex:2;height:40px;border:none;border-radius:8px;background:#43a047;color:#fff;font-weight:700;cursor:pointer;">拨打</button>
          <button type="button" data-dial-act="clear" style="flex:1;height:40px;border:none;border-radius:8px;background:#eceff1;cursor:pointer;">清空</button>
        </div>
      </div>`
    }
    default:
      return `<div ${data}></div>`
  }
}

export function screenPayload(screen: ScreenData, generatedCode: string, advanced = false) {
  const nodes = flatten(screen)
  return {
    name: screen.name,
    title: String(screen.props.Title ?? screen.name),
    bg: String(screen.props.BackgroundColor ?? '#fff'),
    body: renderNode(screen.root),
    nameMap: Object.fromEntries(nodes.map((n) => [n.name, { type: n.type, props: { ...n.props }, id: n.id }])),
    dbNs: Object.fromEntries(nodes.filter((n) => n.type === 'TinyDB').map((n) => [n.name, String(n.props.Namespace ?? 'default')])),
    code: generatedCode,
    advanced: Boolean(advanced),
  }
}

const RUNTIME_STYLE = `
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;min-height:100vh;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
  .app{padding:12px;max-width:420px;margin:0 auto}
  .toast{position:fixed;left:50%;bottom:max(24px, env(safe-area-inset-bottom));transform:translateX(-50%);background:#202124;color:#fff;padding:10px 16px;border-radius:8px;opacity:0;transition:.2s;z-index:99}
  .toast.show{opacity:1}
  .phone-shell{min-height:100vh}
  @media (min-width:520px){
    html,body{background:#1c2430}
    body{display:flex;align-items:center;justify-content:center;padding:28px 16px}
    .phone-shell{width:390px;height:780px;min-height:0;background:#111;border-radius:36px;padding:12px 10px 20px;box-shadow:0 24px 60px rgba(0,0,0,.4);display:flex;flex-direction:column}
    .phone-shell .app{flex:1;overflow:auto;max-width:none;background:#fff;border-radius:24px;width:100%}
  }
  @media (max-width:519px){
    .app{max-width:none}
  }
  .sensor-banner{background:#fef7e0;color:#7a5c00;padding:8px 12px;font-size:12px;border-bottom:1px solid #f3e2a7;display:none}
  .sensor-banner.show{display:block}
  .perm-mask{position:fixed;inset:0;background:rgba(20,24,32,.45);display:none;align-items:center;justify-content:center;z-index:140}
  .perm-mask.show{display:flex}
  .perm-card{width:min(320px,88vw);background:#fff;border-radius:12px;padding:16px 16px 12px;box-shadow:0 12px 32px rgba(0,0,0,.22)}
  .perm-card h3{margin:0 0 8px;font-size:16px}
  .perm-card p{margin:0 0 14px;font-size:13px;color:#4b5563;line-height:1.5}
  .perm-actions{display:flex;gap:8px;justify-content:flex-end}
  .perm-actions button{border:none;border-radius:8px;padding:8px 12px;font-size:13px;cursor:pointer}
  .perm-deny{background:#eceff1;color:#374151}
  .perm-allow{background:#009688;color:#fff}
  .ai2-marquee{display:flex;align-items:center}
  .ai2-marquee-track{display:inline-block;white-space:nowrap;padding-left:100%;font-weight:600;font-size:14px;animation:ai2-marquee-scroll linear infinite}
  @keyframes ai2-marquee-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  .ai2-confetti{position:fixed;inset:0;pointer-events:none;z-index:120;overflow:hidden}
  .ai2-confetti i{position:absolute;top:-12px;width:8px;height:12px;border-radius:2px;animation:ai2-fall linear forwards;opacity:.95}
  @keyframes ai2-fall{to{transform:translateY(110vh) rotate(720deg);opacity:0}}
  .ai2-calc{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:8px}
  .ai2-calc button{height:40px;border:none;border-radius:8px;background:#eceff1;font-size:16px;font-weight:700;cursor:pointer}
  .ai2-calc button[data-key="="]{background:#009688;color:#fff}
  .ai2-calc button[data-key="C"]{grid-column:span 3;background:#ffe0b2}
  .ai2-dial{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:8px}
  .ai2-dial button{height:44px;border:none;border-radius:22px;background:#eceff1;font-size:18px;font-weight:700;cursor:pointer}
`

function runtimeBootScript(mode: 'iframe' | 'standalone'): string {
  return `
(function(){
  const mode = ${JSON.stringify(mode)};
  const toast = document.getElementById('toast');
  const banner = document.getElementById('sensor-banner');
  const app = document.getElementById('app');
  let listeners = {};
  let timers = [];
  let sensorHints = [];
  window.__AI2_PERMS__ = window.__AI2_PERMS__ || { location: null, camera: null, notify: null };
  window.__AI2_NET_FAIL__ = window.__AI2_NET_FAIL__ || 'ok';
  function ensurePermUi(){
    if (document.getElementById('perm-mask')) return document.getElementById('perm-mask');
    const mask = document.createElement('div');
    mask.id = 'perm-mask';
    mask.className = 'perm-mask';
    mask.innerHTML = '<div class="perm-card"><h3 id="perm-title">需要权限</h3><p id="perm-body"></p><div class="perm-actions"><button type="button" class="perm-deny" id="perm-deny">拒绝</button><button type="button" class="perm-allow" id="perm-allow">允许</button></div></div>';
    document.body.appendChild(mask);
    return mask;
  }
  function askPermission(kind, title, body, onAllow, onDeny){
    const cur = window.__AI2_PERMS__[kind];
    if (cur === true) { onAllow(); return; }
    if (cur === false) { onDeny(); return; }
    const mask = ensurePermUi();
    document.getElementById('perm-title').textContent = title;
    document.getElementById('perm-body').textContent = body;
    mask.classList.add('show');
    const allowBtn = document.getElementById('perm-allow');
    const denyBtn = document.getElementById('perm-deny');
    const done = function(ok){
      mask.classList.remove('show');
      allowBtn.onclick = null;
      denyBtn.onclick = null;
      window.__AI2_PERMS__[kind] = ok;
      if (ok) onAllow(); else onDeny();
    };
    allowBtn.onclick = function(){ done(true); };
    denyBtn.onclick = function(){ done(false); };
  }

  function showToast(msg){
    toast.textContent = String(msg);
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'), 1800);
  }
  function showSensorHint(msg){
    if (sensorHints.includes(msg)) return;
    sensorHints.push(msg);
    banner.textContent = sensorHints.join(' · ');
    banner.classList.add('show');
  }
  function elByName(name){ return document.querySelector('[data-name="'+name+'"]'); }
  function lsKey(ns, tag){ return 'tinydb:'+ns+':'+tag; }
  function clearTimers(){ timers.forEach(clearInterval); timers = []; }
  function isNative(){
    try { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); } catch(e){ return false; }
  }
  function capPlugin(name){
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[name]) return window.Capacitor.Plugins[name];
    } catch(e){}
    return null;
  }
  ${sandboxRunnerSource()}

  function isSafeHttpUrl(raw){
    try {
      var url = new URL(String(raw || '').trim());
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) { return false; }
  }
  function isSafeMediaSrc(raw){
    var s = String(raw || '').trim();
    if (!s) return true;
    if (/^data:image\\//i.test(s)) return true;
    if (/^blob:/i.test(s)) return true;
    if (/^(\\.\\/|\\.\\.\\/|\\/)/.test(s) && !/javascript:|vbscript:|data:/i.test(s)) return true;
    return isSafeHttpUrl(s);
  }
  function safeCssColor(raw){
    var s = String(raw || '');
    if (/url\\s*\\(|expression\\s*\\(|javascript:|@import|behavior:/i.test(s)) return '';
    return s.slice(0, 80);
  }
  function safeTel(raw){
    var s = String(raw || '').trim();
    if (!/^\\+?[0-9\\-()\\s]{2,24}$/.test(s)) return '';
    return s;
  }

  function coerceNum(v){
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  }
  function zonedDate(ts, tz){
    const t = Number(ts) || Date.now();
    const d0 = new Date(t);
    if (tz == null || tz === '' || tz === '本地' || tz === 'local') return d0;
    const shift = (Number(tz) + d0.getTimezoneOffset()/60) * 3600000;
    return new Date(t + shift);
  }
  function pad2(n){ return String(n).padStart(2,'0'); }
  function addMinutesHHmm(hhmm, mins){
    const p = String(hhmm || '07:00').split(':');
    let h = Number(p[0]) || 0;
    let m = Number(p[1]) || 0;
    m += Number(mins) || 5;
    while (m >= 60) { m -= 60; h += 1; }
    while (m < 0) { m += 60; h -= 1; }
    h = ((h % 24) + 24) % 24;
    return pad2(h) + ':' + pad2(m);
  }
  function beep(){
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ac = new AC();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.frequency.value = 880;
      const vol = (window.__AI2__ && window.__AI2__._vol != null) ? window.__AI2__._vol : 1;
      g.gain.value = 0.08 * vol;
      o.start();
      o.stop(ac.currentTime + 0.35);
    } catch(e){}
  }

  function makeRt(){
    return {
      on(comp, event, fn){
        if (typeof fn !== 'function') return;
        const key = comp+'::'+event;
        listeners[key] = listeners[key] || [];
        listeners[key].push(fn);
      },
      wait(ms){
        const n = Math.min(Math.max(0, Number(ms)||0), 60000);
        return new Promise(function(resolve){ setTimeout(resolve, n); });
      },
      formatTime(ts, fmt, tz){
        const d = zonedDate(ts, tz);
        const pad = pad2;
        const map = {
          YYYY: d.getFullYear(),
          MM: pad(d.getMonth()+1),
          DD: pad(d.getDate()),
          hh: pad(d.getHours()),
          mm: pad(d.getMinutes()),
          ss: pad(d.getSeconds()),
          W: ['日','一','二','三','四','五','六'][d.getDay()]
        };
        let s = String(fmt || 'YYYY-MM-DD hh:mm');
        Object.keys(map).forEach(function(k){ s = s.split(k).join(map[k]); });
        return s;
      },
      timePart(ts, part, tz){
        const d = zonedDate(ts, tz);
        if (part === 'year') return d.getFullYear();
        if (part === 'month') return d.getMonth()+1;
        if (part === 'day') return d.getDate();
        if (part === 'hour') return d.getHours();
        if (part === 'minute') return d.getMinutes();
        if (part === 'second') return d.getSeconds();
        if (part === 'weekday') return d.getDay();
        return 0;
      },
      makeTime(y,m,d,h,min,s){
        return new Date(Number(y)||1970, (Number(m)||1)-1, Number(d)||1, Number(h)||0, Number(min)||0, Number(s)||0).getTime();
      },
      addTime(ts, amount, unit){
        const d = new Date(Number(ts) || Date.now());
        const n = Number(amount) || 0;
        if (unit === 'day') d.setDate(d.getDate()+n);
        else if (unit === 'hour') d.setHours(d.getHours()+n);
        else if (unit === 'minute') d.setMinutes(d.getMinutes()+n);
        else d.setSeconds(d.getSeconds()+n);
        return d.getTime();
      },
      jsonGet(obj, key){
        try {
          const o = typeof obj === 'string' ? JSON.parse(obj) : obj;
          if (o && typeof o === 'object') return o[key];
        } catch(e){}
        return '';
      },
      jsonParse(text){
        try { return JSON.parse(String(text || '')); } catch(e){ return {}; }
      },
      jsonStringify(obj){
        try { return typeof obj === 'string' ? obj : JSON.stringify(obj); } catch(e){ return ''; }
      },
      jsonSet(obj, key, val){
        try {
          const o = typeof obj === 'string' ? (obj ? JSON.parse(obj) : {}) : (obj && typeof obj === 'object' ? obj : {});
          o[key] = val;
          return JSON.stringify(o);
        } catch(e){ return ''; }
      },
      diffTime(a, b, unit){
        const ms = (Number(a) || 0) - (Number(b) || 0);
        if (unit === 'day') return ms / 86400000;
        if (unit === 'hour') return ms / 3600000;
        if (unit === 'minute') return ms / 60000;
        return ms / 1000;
      },
      parseTime(s){
        const t = Date.parse(String(s || ''));
        return Number.isFinite(t) ? t : Date.now();
      },
      mathMap(x, a1, a2, b1, b2){
        const span = (Number(a2) - Number(a1)) || 1;
        return (Number(x) - Number(a1)) * (Number(b2) - Number(b1)) / span + Number(b1);
      },
      ask(q, def){
        try { return window.prompt(String(q || '请输入'), String(def == null ? '' : def)) || ''; } catch(e){ return String(def || ''); }
      },
      openUrl(url){
        const target = String(url || '').trim();
        if (!isSafeHttpUrl(target)) { showToast('只能打开 http/https 网址'); return; }
        try { parent.postMessage({ type: 'ai2-open-url', url: target }, '*'); } catch(e){}
        try { window.open(target, '_blank', 'noopener,noreferrer'); } catch(e){ showToast('无法打开: ' + target); }
      },
      keepAwake(on){
        if (!on) {
          if (window.__AI2__ && window.__AI2__._wake) {
            try { window.__AI2__._wake.release(); } catch(e){}
            window.__AI2__._wake = null;
          }
          showToast('已允许熄屏');
          return;
        }
        if (!navigator.wakeLock || !navigator.wakeLock.request) { showToast('当前浏览器不支持常亮'); return; }
        navigator.wakeLock.request('screen').then(function(lock){
          window.__AI2__._wake = lock;
          showToast('屏幕常亮已打开');
        }).catch(function(){ showToast('常亮被拒绝'); });
      },
      setBrightness(pct){
        var el = document.getElementById('ai2-dim');
        if (!el) {
          el = document.createElement('div');
          el.id = 'ai2-dim';
          el.style.cssText = 'position:fixed;inset:0;background:#000;pointer-events:none;z-index:180;';
          document.body.appendChild(el);
        }
        const p = Math.max(0, Math.min(100, Number(pct)));
        el.style.opacity = String((100 - p) / 100 * 0.72);
      },
      setVolume(pct){
        const v = Math.max(0, Math.min(1, Number(pct) / 100));
        window.__AI2__._vol = v;
        document.querySelectorAll('audio,video').forEach(function(m){ try { m.volume = v; } catch(e){} });
        showToast('音量 ' + Math.round(v * 100) + '%');
      },
      beep(){ beep(); },
      setProp(comp, prop, value){
        const el = elByName(comp);
        const meta = window.__AI2__.nameMap[comp];
        if (meta) {
          if ((prop === 'Url' || prop === 'HomeUrl' || prop === 'ServiceURL') && value && !isSafeHttpUrl(value)) {
            /* 拒绝 javascript: / data: 等 */
          } else if ((prop === 'Picture' || prop === 'Source') && value && !isSafeMediaSrc(value)) {
            /* 拒绝非图片 data URL */
          } else {
            meta.props[prop] = value;
          }
        }
        if (!el) return;
        if (prop === 'Text') {
          const t = value == null ? '' : String(value);
          const dtype = el.getAttribute('data-type');
          if (dtype === 'Alarm' || dtype === 'Reminder' || dtype === 'WeatherBox' || dtype === 'DialPad' || dtype === 'CalculatorPad' || dtype === 'ClockFace' || dtype === 'TodoList' || dtype === 'CalendarView') {
            if (dtype === 'ClockFace') paintClockFace(comp);
          } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = t;
          else if (el.tagName === 'BUTTON') el.textContent = t;
          else if (el.classList && el.classList.contains('ai2-marquee')) {
            const track = el.querySelector('.ai2-marquee-track');
            if (track) track.innerHTML = '';
            if (track) track.textContent = t + '   ' + t;
          } else if (el.getAttribute('data-type') === 'ChatBubble') {
            const bubble = el.firstElementChild;
            if (bubble) bubble.textContent = t;
          } else if (el.tagName === 'IMG' && el.getAttribute('data-type') === 'QRCode') {
            const size = (meta && meta.props && meta.props.Size) || 140;
            el.src = 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&data=' + encodeURIComponent(t);
          } else el.textContent = t;
        } else if (prop === 'Color' && el.type === 'color') {
          el.value = String(value || '#009688');
        } else if (prop === 'Remaining' && el.getAttribute('data-type') === 'Countdown') {
          el.textContent = String(value);
        } else if (prop === 'Elapsed' && el.getAttribute('data-type') === 'Stopwatch') {
          el.textContent = (Number(value) || 0).toFixed(1) + 's';
        } else if (prop === 'Result' && el.getAttribute('data-type') === 'Dice') {
          const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
          const r = Math.max(1, Number(value) || 1);
          el.textContent = (r >= 1 && r <= 6) ? faces[r - 1] : String(r);
          el.style.fontSize = (r >= 1 && r <= 6) ? '40px' : '28px';
        } else if (prop === 'Result' && el.getAttribute('data-type') === 'CoinFlip') {
          el.textContent = String(value || '');
        } else if (prop === 'Score' && el.getAttribute('data-type') === 'ScoreBoard') {
          const v = el.querySelector('[data-score-val]');
          if (v) v.textContent = String(Number(value) || 0);
        } else if (prop === 'Percent' && el.getAttribute('data-type') === 'ProgressRing') {
          const pct = Math.max(0, Math.min(100, Number(value) || 0));
          const color = (meta && meta.props && meta.props.Color) || '#009688';
          el.style.background = 'conic-gradient(' + color + ' ' + pct + '%, #e8eaed 0)';
          const t = el.querySelector('[data-ring-pct]');
          if (t) t.textContent = pct + '%';
        } else if (prop === 'Value' && el.getAttribute('data-type') === 'LevelBar') {
          const max = Math.max(1, Number(meta && meta.props && meta.props.MaxValue) || 100);
          const val = Math.max(0, Math.min(max, Number(value) || 0));
          const fill = el.querySelector('[data-level-fill]');
          if (fill) fill.style.width = ((val / max) * 100) + '%';
        } else if (prop === 'Value' && el.getAttribute('data-type') === 'Stepper') {
          const t = el.querySelector('[data-step-val]');
          if (t) t.textContent = String(Number(value) || 0);
        } else if (prop === 'State' && el.getAttribute('data-type') === 'TrafficLight') {
          const map = { '红': '#f44336', '黄': '#ffeb3b', '绿': '#4caf50' };
          el.querySelectorAll('[data-lamp]').forEach(function(lamp){
            const c = lamp.getAttribute('data-lamp');
            lamp.style.background = (c === String(value)) ? (map[c] || '#455a64') : '#455a64';
          });
        } else if (prop === 'Answer' && el.getAttribute('data-type') === 'FortuneBall') {
          el.textContent = String(value || '');
        } else if (prop === 'Picture' && el.tagName === 'IMG') {
          el.src = isSafeMediaSrc(value) ? String(value || '') : '';
        } else if (prop === 'Source' && (el.tagName === 'AUDIO' || el.tagName === 'VIDEO')) {
          el.src = isSafeMediaSrc(value) ? String(value || '') : '';
        } else if (prop === 'Url' && el.tagName === 'A') {
          el.href = isSafeHttpUrl(value) ? String(value) : '#';
        } else if (prop === 'Rating' && el.type === 'range') {
          el.value = value;
        } else if (prop === 'Selection' && el.tagName === 'SELECT') {
          el.value = String(value || '');
        } else if (prop === 'Date' && el.type === 'date') {
          el.value = String(value || '');
        } else if (prop === 'Time' && el.type === 'time') {
          el.value = String(value || '');
        } else if (prop === 'PaintColor') {
          el.style.background = safeCssColor(value);
        } else if (prop === 'X') {
          el.style.left = (Number(value)||0) + 'px';
          el.style.marginLeft = '0';
        } else if (prop === 'Y') {
          el.style.top = (Number(value)||0) + 'px';
          el.style.marginTop = '0';
        }         else if (prop === 'BackgroundColor') el.style.background = safeCssColor(value);
        else if (prop === 'TextColor') el.style.color = safeCssColor(value);
        else if (prop === 'FontSize') el.style.fontSize = (Number(value) || 16) + 'px';
        else if (prop === 'Enabled' && (el.getAttribute('data-type') === 'Alarm' || el.getAttribute('data-type') === 'Reminder' || el.getAttribute('data-type') === 'WeatherBox')) {
          if (el.getAttribute('data-type') === 'Alarm') paintAlarm(comp);
          else if (el.getAttribute('data-type') === 'Reminder') paintReminder(comp);
        } else if (prop === 'Enabled') el.disabled = !value;
        else if (prop === 'ThumbPosition' && el.type === 'range') el.value = value;
        else if (prop === 'On' && el.getAttribute('data-type') === 'LightBulb') {
          el.style.filter = value ? 'none' : 'grayscale(1) opacity(0.45)';
        } else if (prop === 'Progress' && el.getAttribute('data-type') === 'ProgressBar') {
          const pct = Math.max(0, Math.min(100, Number(value) || 0));
          const fill = el.querySelector('[data-progress-fill]');
          if (fill) fill.style.width = pct + '%';
        } else if (prop === 'Checked' && el.getAttribute('data-type') === 'ToggleButton') {
          const on = !!value;
          el.style.background = on ? String((meta && meta.props && meta.props.BackgroundColor) || '#009688') : '#eceff1';
          el.style.color = on ? String((meta && meta.props && meta.props.TextColor) || '#fff') : '#5f6368';
        } else if (prop === 'Checked' || prop === 'On') {
          const input = el.querySelector('input') || el;
          input.checked = !!value;
        } else if (el.getAttribute('data-type') === 'Alarm' && (prop === 'Time' || prop === 'Label' || prop === 'Repeat')) {
          paintAlarm(comp);
        } else if (el.getAttribute('data-type') === 'Reminder' && (prop === 'Date' || prop === 'Time' || prop === 'Label')) {
          paintReminder(comp);
        } else if (el.getAttribute('data-type') === 'CalendarView' && (prop === 'Year' || prop === 'Month' || prop === 'SelectedDate' || prop === 'MarksFromString')) {
          paintCalendar(comp);
        } else if (el.getAttribute('data-type') === 'ContactList' && prop === 'ContactsFromString') {
          paintContacts(comp);
        } else if (el.getAttribute('data-type') === 'TodoList' && (prop === 'ItemsFromString' || prop === 'CheckedFromString')) {
          paintTodo(comp);
        } else if (el.getAttribute('data-type') === 'CalculatorPad' && (prop === 'Expression' || prop === 'Result')) {
          const exprEl = el.querySelector('[data-calc-expr]');
          const resEl = el.querySelector('[data-calc-res]');
          if (exprEl && prop === 'Expression') exprEl.textContent = String(value || '');
          if (resEl && prop === 'Result') resEl.textContent = String(value || '0');
        } else if (el.getAttribute('data-type') === 'WeatherBox' && (prop === 'City' || prop === 'Temperature' || prop === 'WeatherText' || prop === 'WindSpeed')) {
          paintWeather(comp);
        } else if (el.getAttribute('data-type') === 'CompassView' && prop === 'Heading') {
          const needle = el.querySelector('[data-needle]');
          if (needle) needle.style.transform = 'translateX(-50%) rotate(' + (Number(value)||0) + 'deg)';
        } else if (el.getAttribute('data-type') === 'ClockFace' && (prop === 'Format' || prop === 'Style' || prop === 'Timezone' || prop === 'TextColor' || prop === 'FontSize')) {
          paintClockFace(comp);
        } else if (el.getAttribute('data-type') === 'DialPad' && prop === 'Number') {
          const num = el.querySelector('[data-dial-num]');
          if (num) num.textContent = String(value || '');
        }
      },
      getProp(comp, prop){
        const el = elByName(comp);
        const meta = window.__AI2__.nameMap[comp];
        if (prop === 'Text' && el) {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return el.value;
          const t = el.textContent || '';
          const n = Number(t);
          return (t.trim() !== '' && Number.isFinite(n)) ? n : t;
        }
        if (prop === 'ThumbPosition' && el) return Number(el.value);
        if (prop === 'Rating' && el && el.type === 'range') return Number(el.value);
        if (prop === 'Color' && el && el.type === 'color') return el.value;
        if (prop === 'Selection' && el && el.tagName === 'SELECT') return el.value;
        if (prop === 'Selection' && meta) return meta.props.Selection || '';
        if (prop === 'Date' && el && el.type === 'date') return el.value;
        if (prop === 'Time' && el && el.type === 'time') return el.value;
        if ((prop === 'On' || prop === 'Checked') && el) {
          const input = el.querySelector && el.querySelector('input');
          const box = input || (el.type === 'checkbox' || el.type === 'radio' ? el : null);
          if (box && typeof box.checked === 'boolean') return !!box.checked;
        }
        if (meta && meta.props && prop in meta.props) return coerceNum(meta.props[prop]);
        return '';
      },
      alert(msg){ showToast(msg); },
      messageDialog(msg, title, button){
        showToast((title? title+': ' : '') + msg);
        window.alert(String(title||'提示') + '\\n' + String(msg) + '\\n[' + String(button||'确定') + ']');
      },
      chooseDialog(comp, msg, title, btn1, btn2){
        const ok = window.confirm(String(title||'选择') + '\\n' + String(msg) + '\\n\\n确定=' + btn1 + ' / 取消=' + btn2);
        const choice = ok ? btn1 : btn2;
        const meta = window.__AI2__.nameMap[comp];
        if (meta) meta.props.Choice = choice;
        fire(comp, 'AfterChoosing');
        showToast('选择: ' + choice);
      },
      canvasClear(comp){
        const el = elByName(comp);
        if (el && el.getContext) {
          const ctx = el.getContext('2d');
          ctx.clearRect(0,0,el.width,el.height);
        }
      },
      canvasDrawLine(comp, x1, y1, x2, y2, color){
        const el = elByName(comp);
        if (!el || !el.getContext) return;
        const ctx = el.getContext('2d');
        ctx.strokeStyle = color || '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Number(x1)||0, Number(y1)||0);
        ctx.lineTo(Number(x2)||0, Number(y2)||0);
        ctx.stroke();
      },
      canvasDrawCircle(comp, x, y, r, color){
        const el = elByName(comp);
        if (!el || !el.getContext) return;
        const ctx = el.getContext('2d');
        ctx.fillStyle = color || '#000';
        ctx.beginPath();
        ctx.arc(Number(x)||0, Number(y)||0, Math.max(0, Number(r)||0), 0, Math.PI * 2);
        ctx.fill();
      },
      webGoTo(comp, url){
        const el = elByName(comp);
        let target = String(url || '').trim();
        var ok = false;
        try {
          var parsed = new URL(target);
          ok = (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.indexOf('.') >= 0 && !/(?:^|\\.)(?:example\\.com|iana\\.org)$/i.test(parsed.hostname);
        } catch (e) { ok = false; }
        if (!ok) target = ${JSON.stringify(webViewerHomeUrl(''))};
        if (el && el.tagName === 'IFRAME') el.src = target;
        const meta = window.__AI2__.nameMap[comp];
        if (meta) meta.props.HomeUrl = url;
      },
      listSetElements(comp, elements){
        const el = elByName(comp);
        const str = String(elements || '');
        const meta = window.__AI2__.nameMap[comp];
        if (meta) meta.props.ElementsFromString = str;
        if (!el) return;
        const items = str.split(',').map(s => s.trim()).filter(Boolean);
        el.innerHTML = items.map(it => '<li data-item="'+it.replace(/"/g,'&quot;')+'" style="padding:10px 12px;border-bottom:1px solid #eee;cursor:pointer;">'+it.replace(/</g,'&lt;')+'</li>').join('');
        el.querySelectorAll('li').forEach(li => {
          li.addEventListener('click', () => {
            if (window.__AI2__.nameMap[comp]) window.__AI2__.nameMap[comp].props.Selection = li.getAttribute('data-item');
            fire(comp, 'AfterPicking');
          });
        });
      },
      dbStore(comp, tag, value){
        const ns = window.__AI2__.dbNs[comp] || 'default';
        const key = lsKey(ns, String(tag));
        const raw = JSON.stringify(value);
        localStorage.setItem(key, raw);
        const Pref = capPlugin('Preferences');
        if (Pref && Pref.set) Pref.set({ key: key, value: raw }).catch(function(){});
      },
      dbGet(comp, tag, fallback){
        const ns = window.__AI2__.dbNs[comp] || 'default';
        const key = lsKey(ns, String(tag));
        const raw = localStorage.getItem(key);
        if (raw == null) return fallback;
        try { return JSON.parse(raw); } catch(e){ return fallback; }
      },
      dbClearTag(comp, tag){
        const ns = window.__AI2__.dbNs[comp] || 'default';
        const key = lsKey(ns, String(tag));
        localStorage.removeItem(key);
        const Pref = capPlugin('Preferences');
        if (Pref && Pref.remove) Pref.remove({ key: key }).catch(function(){});
      },
      dbClearAll(comp){
        const ns = window.__AI2__.dbNs[comp] || 'default';
        const prefix = 'tinydb:'+ns+':';
        Object.keys(localStorage).filter(k => k.startsWith(prefix)).forEach(function(k){
          localStorage.removeItem(k);
          const Pref = capPlugin('Preferences');
          if (Pref && Pref.remove) Pref.remove({ key: k }).catch(function(){});
        });
      },
      clearLocalData(){
        const prefixes = ['tinydb:', 'notes:', 'webdb:'];
        Object.keys(localStorage).filter(function(k){
          return prefixes.some(function(p){ return k.indexOf(p) === 0; });
        }).forEach(function(k){
          localStorage.removeItem(k);
          const Pref = capPlugin('Preferences');
          if (Pref && Pref.remove) Pref.remove({ key: k }).catch(function(){});
        });
        showToast('已清空本地数据');
      },
      takePicture(comp, imageComp){
        const run = function(){ window.rt.takePictureNow(comp, imageComp); };
        askPermission('camera', '需要使用相机', '应用想拍照或选图。机房可点允许后改用选文件。', run, function(){
          showToast('相机权限被拒绝');
          fire(comp, 'AfterPicture');
        });
      },
      takePictureNow(comp, imageComp){
        const done = function(dataUrl){
          const meta = window.__AI2__.nameMap[comp];
          if (meta) meta.props.Picture = dataUrl || '';
          if (imageComp) {
            window.rt.setProp(imageComp, 'Picture', dataUrl || '');
          }
          fire(comp, 'AfterPicture');
          showToast(dataUrl ? '拍照完成' : '未获取到照片');
        };
        const Cam = capPlugin('Camera');
        if (Cam && Cam.getPhoto) {
          Cam.getPhoto({ quality: 80, resultType: 'dataUrl', source: 'CAMERA' }).then(function(photo){
            done(photo && (photo.dataUrl || photo.webPath) || '');
          }).catch(function(err){
            showSensorHint('相机不可用: ' + (err && err.message ? err.message : err));
            done('');
          });
          return;
        }
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.setAttribute('capture', 'environment');
        input.onchange = function(){
          var file = input.files && input.files[0];
          if (!file) { done(''); return; }
          var reader = new FileReader();
          reader.onload = function(){ done(String(reader.result || '')); };
          reader.onerror = function(){ done(''); };
          reader.readAsDataURL(file);
        };
        input.click();
      },
      moveTo(comp, x, y){
        let nx = Number(x)||0;
        let ny = Number(y)||0;
        const el = elByName(comp);
        const parent = el && el.parentElement;
        if (parent) {
          const maxX = Math.max(0, parent.clientWidth - (el.offsetWidth || 24));
          const maxY = Math.max(0, parent.clientHeight - (el.offsetHeight || 24));
          nx = Math.max(0, Math.min(maxX, nx));
          ny = Math.max(0, Math.min(maxY, ny));
        }
        window.rt.setProp(comp, 'X', nx);
        window.rt.setProp(comp, 'Y', ny);
      },
      /** 在父容器内随机换位，保证离当前位置足够远；带短冷却防止连撞 */
      randomMoveInParent(comp, minDist){
        const meta = window.__AI2__.nameMap[comp];
        const now = Date.now();
        if (meta && meta._warpUntil && now < meta._warpUntil) return false;
        const el = elByName(comp);
        const parent = el && el.parentElement;
        if (!parent) return false;
        const pad = 8;
        const maxX = Math.max(pad, parent.clientWidth - (el.offsetWidth || 36) - pad);
        const maxY = Math.max(pad, parent.clientHeight - (el.offsetHeight || 36) - pad);
        const curX = Number(meta && meta.props && meta.props.X) || 0;
        const curY = Number(meta && meta.props && meta.props.Y) || 0;
        const distNeed = Math.max(48, Number(minDist) || 80);
        let nx = curX, ny = curY;
        for (let i = 0; i < 24; i++) {
          nx = pad + Math.floor(Math.random() * Math.max(1, maxX - pad));
          ny = pad + Math.floor(Math.random() * Math.max(1, maxY - pad));
          const dx = nx - curX, dy = ny - curY;
          if (dx * dx + dy * dy >= distNeed * distNeed) break;
        }
        if (meta) meta._warpUntil = now + 350;
        window.rt.moveTo(comp, nx, ny);
        return true;
      },
      playerStart(comp){
        const el = elByName(comp);
        if (el && el.play) el.play().catch(function(){ showToast('无法播放'); });
      },
      playerPause(comp){
        const el = elByName(comp);
        if (el && el.pause) el.pause();
      },
      playerStop(comp){
        const el = elByName(comp);
        if (el) { try { el.pause(); el.currentTime = 0; } catch(e){} }
      },
      soundPlay(comp){
        const meta = window.__AI2__.nameMap[comp];
        const src = meta && meta.props ? String(meta.props.Source || './media/beep.wav') : './media/beep.wav';
        if (!src) { showToast('未设置音效地址'); return; }
        try {
          const a = new Audio(src);
          a.volume = (window.__AI2__ && window.__AI2__._vol != null) ? window.__AI2__._vol : 1;
          a.play();
        } catch(e){ showToast('音效播放失败'); }
      },
      ttsSpeak(comp, message){
        const meta = window.__AI2__.nameMap[comp];
        const text = String(message == null ? '' : message);
        if (!text) { showToast('朗读内容为空'); return; }
        if (!window.speechSynthesis) { showToast('当前浏览器不支持语音朗读'); return; }
        try {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = (meta && meta.props && meta.props.Language) ? String(meta.props.Language) : 'zh-CN';
          u.volume = (window.__AI2__ && window.__AI2__._vol != null) ? window.__AI2__._vol : 1;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        } catch(e){ showToast('朗读失败'); }
      },
      speechGetText(comp){
        const meta = window.__AI2__.nameMap[comp];
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { showToast('当前浏览器不支持语音识别'); return; }
        try {
          const rec = new SR();
          rec.lang = (meta && meta.props && meta.props.Language) ? String(meta.props.Language) : 'zh-CN';
          rec.interimResults = false;
          rec.maxAlternatives = 1;
          rec.onresult = function(ev){
            const t = ev.results && ev.results[0] && ev.results[0][0] ? ev.results[0][0].transcript : '';
            if (meta) meta.props.Result = t;
            fire(comp, 'AfterGettingText');
            showToast('识别: ' + t);
          };
          rec.onerror = function(){ showToast('语音识别失败'); };
          rec.start();
          showToast('请开始说话…');
        } catch(e){ showToast('无法启动语音识别'); }
      },
      shareMessage(message){
        const text = String(message == null ? '' : message);
        if (navigator.share) {
          navigator.share({ text: text }).catch(function(){ showToast(text || '分享已取消'); });
          return;
        }
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function(){ showToast('已复制到剪贴板'); }).catch(function(){ showToast(text); });
            return;
          }
        } catch(e){}
        showToast(text || '无可分享内容');
      },
      startActivity(url){
        const target = String(url || '').trim();
        if (!isSafeHttpUrl(target)) { showToast('只能打开 http/https 网址'); return; }
        try { parent.postMessage({ type: 'ai2-open-url', url: target }, '*'); } catch(e){}
        try { window.open(target, '_blank', 'noopener,noreferrer'); } catch(e){ showToast('无法打开: ' + target); }
      },
      phoneCall(number){
        const n = safeTel(number);
        if (!n) { showToast('电话号码不合法'); return; }
        try { window.location.href = 'tel:' + n; } catch(e){ showToast('无法拨打: ' + n); }
      },
      webGet(comp, url){
        window.rt.webRequest(comp, 'GET', url, null);
      },
      webPost(comp, url, body){
        window.rt.webRequest(comp, 'POST', url, body);
      },
      webRequest(comp, method, url, body){
        const meta = window.__AI2__.nameMap[comp];
        let target = String(url || '').trim();
        if (!target && meta && meta.props) target = String(meta.props.Url || '').trim();
        const fail = function(msg, code){
          if (meta) {
            meta.props.ErrorMessage = String(msg || '请求失败');
            meta.props.ResponseCode = code == null ? 0 : code;
            meta.props.ResponseContent = '';
          }
          showToast(String(msg || '请求失败'));
          fire(comp, 'ErrorOccurred');
        };
        const ok = function(text, code){
          const raw = text == null ? '' : String(text);
          if (meta) {
            meta.props.Url = target;
            meta.props.ResponseContent = raw;
            meta.props.ResponseCode = code;
            meta.props.ErrorMessage = '';
          }
          if (!String(raw).trim()) {
            fail('返回数据为空', code);
            return;
          }
          fire(comp, 'GotText');
        };
        const mode = window.__AI2_NET_FAIL__ || 'ok';
        if (mode === 'timeout') { fail('请求超时', 0); return; }
        if (mode === 'empty') { ok('', 200); return; }
        if (mode === 'error') { fail('网络错误（模拟）', 0); return; }
        const isLesson = /^lesson:\\/\\//i.test(target) || /\\/api\\/lesson-backup/i.test(target);
        if (isLesson || target === 'lesson://backup') {
          const key = 'webdb:lesson-backup';
          setTimeout(function(){
            if (String(method).toUpperCase() === 'POST') {
              localStorage.setItem(key, JSON.stringify({ value: body }));
              ok(body == null ? '' : String(body), 200);
            } else {
              const raw = localStorage.getItem(key);
              try {
                const j = raw == null ? '' : JSON.parse(raw);
                ok(j && j.value != null ? String(j.value) : (raw || ''), 200);
              } catch (e) {
                ok(raw || '', 200);
              }
            }
          }, 320);
          return;
        }
        if (!isSafeHttpUrl(target)) { fail('只能请求 http/https 网址或 lesson://backup', 0); return; }
        const ctrl = new AbortController();
        const timer = setTimeout(function(){ try { ctrl.abort(); } catch(e){} }, 8000);
        const opts = { method: method || 'GET', signal: ctrl.signal, headers: {} };
        if (String(method).toUpperCase() === 'POST') {
          opts.headers['Content-Type'] = 'application/json';
          opts.body = body == null ? '' : (typeof body === 'string' ? body : JSON.stringify(body));
        }
        fetch(target, opts).then(function(r){
          clearTimeout(timer);
          return r.text().then(function(t){ return { ok: r.ok, status: r.status, text: t }; });
        }).then(function(res){
          if (!res.ok) { fail('HTTP ' + res.status, res.status); return; }
          ok(res.text, res.status);
        }).catch(function(err){
          clearTimeout(timer);
          if (err && err.name === 'AbortError') fail('请求超时', 0);
          else fail('网页请求失败', 0);
        });
      },
      diceRoll(comp){
        const meta = window.__AI2__.nameMap[comp];
        const sides = Math.max(2, Math.min(20, Number(meta && meta.props && meta.props.Sides) || 6));
        const result = 1 + Math.floor(Math.random() * sides);
        window.rt.setProp(comp, 'Result', result);
        fire(comp, 'Rolled');
        showToast('掷出 ' + result);
      },
      countdownStart(comp){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta) return;
        if (meta._timer) { clearInterval(meta._timer); meta._timer = null; }
        if (Number(meta.props.Remaining) <= 0) meta.props.Remaining = Number(meta.props.Seconds) || 10;
        meta.props.Running = true;
        meta._timer = setInterval(function(){
          let rem = Number(meta.props.Remaining) || 0;
          rem -= 1;
          window.rt.setProp(comp, 'Remaining', rem);
          fire(comp, 'Tick');
          if (rem <= 0) {
            clearInterval(meta._timer); meta._timer = null; meta.props.Running = false;
            fire(comp, 'Finished');
            showToast('倒计时结束');
          }
        }, 1000);
        timers.push(meta._timer);
      },
      countdownPause(comp){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta || !meta._timer) return;
        clearInterval(meta._timer); meta._timer = null; meta.props.Running = false;
      },
      countdownReset(comp){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta) return;
        if (meta._timer) { clearInterval(meta._timer); meta._timer = null; }
        meta.props.Running = false;
        window.rt.setProp(comp, 'Remaining', Number(meta.props.Seconds) || 10);
      },
      stopwatchStart(comp){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta) return;
        if (meta._timer) { clearInterval(meta._timer); meta._timer = null; }
        meta.props.Running = true;
        meta._timer = setInterval(function(){
          const next = (Number(meta.props.Elapsed) || 0) + 0.1;
          window.rt.setProp(comp, 'Elapsed', Math.round(next * 10) / 10);
          fire(comp, 'Tick');
        }, 100);
        timers.push(meta._timer);
      },
      stopwatchPause(comp){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta || !meta._timer) return;
        clearInterval(meta._timer); meta._timer = null; meta.props.Running = false;
      },
      stopwatchReset(comp){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta) return;
        if (meta._timer) { clearInterval(meta._timer); meta._timer = null; }
        meta.props.Running = false;
        window.rt.setProp(comp, 'Elapsed', 0);
      },
      qrRefresh(comp){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta) return;
        window.rt.setProp(comp, 'Text', meta.props.Text || '');
      },
      celebrate(comp){
        const meta = window.__AI2__.nameMap[comp];
        const duration = Number(meta && meta.props && meta.props.Duration) || 1800;
        let layer = document.getElementById('ai2-confetti');
        if (!layer) {
          layer = document.createElement('div');
          layer.id = 'ai2-confetti';
          layer.className = 'ai2-confetti';
          document.body.appendChild(layer);
        }
        layer.innerHTML = '';
        const colors = ['#009688','#f44336','#ff9800','#4caf50','#2196f3','#e91e63','#ffeb3b'];
        for (let i = 0; i < 48; i++) {
          const piece = document.createElement('i');
          piece.style.left = Math.random() * 100 + '%';
          piece.style.background = colors[i % colors.length];
          piece.style.animationDuration = (1.2 + Math.random() * 1.4) + 's';
          piece.style.animationDelay = (Math.random() * 0.4) + 's';
          piece.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
          layer.appendChild(piece);
        }
        showToast('🎉 恭喜！');
        setTimeout(function(){ if (layer) layer.innerHTML = ''; }, duration);
      },
      coinFlip(comp){
        const result = Math.random() < 0.5 ? '正' : '反';
        window.rt.setProp(comp, 'Result', result);
        fire(comp, 'Rolled');
        showToast(result);
      },
      trafficNext(comp){
        const meta = window.__AI2__.nameMap[comp];
        const order = ['红','黄','绿'];
        const cur = meta && meta.props ? String(meta.props.State || '红') : '红';
        const next = order[(order.indexOf(cur) + 1) % order.length];
        window.rt.setProp(comp, 'State', next);
        fire(comp, 'Changed');
      },
      scoreAdd(comp, delta){
        const meta = window.__AI2__.nameMap[comp];
        const next = (Number(meta && meta.props && meta.props.Score) || 0) + (Number(delta) || 1);
        window.rt.setProp(comp, 'Score', next);
      },
      scoreReset(comp){
        window.rt.setProp(comp, 'Score', 0);
      },
      pedometerReset(comp){
        window.rt.setProp(comp, 'Steps', 0);
      },
      fortuneAsk(comp){
        const answers = ['是的','不是','再问问','很有可能','暂时别想','命运说好','需要努力','答案就在心中'];
        const a = answers[Math.floor(Math.random() * answers.length)];
        window.rt.setProp(comp, 'Answer', a);
        fire(comp, 'GotAnswer');
      },
      vibrate(comp, ms){
        const meta = window.__AI2__.nameMap[comp];
        const d = Number(ms != null ? ms : (meta && meta.props && meta.props.Duration)) || 200;
        if (navigator.vibrate) navigator.vibrate(d);
        else showToast('震动 ' + d + 'ms（此设备可能不支持）');
      },
      clipboardCopy(comp, text){
        const t = String(text == null ? '' : text);
        const meta = window.__AI2__.nameMap[comp];
        if (meta) meta.props.Text = t;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(t).then(function(){ showToast('已复制'); }).catch(function(){ showToast(t); });
        } else showToast(t);
      },
      clipboardPaste(comp){
        const meta = window.__AI2__.nameMap[comp];
        if (navigator.clipboard && navigator.clipboard.readText) {
          navigator.clipboard.readText().then(function(t){
            if (meta) meta.props.Text = t;
            fire(comp, 'GotText');
          }).catch(function(){ showToast('无法读取剪贴板'); fire(comp, 'GotText'); });
        } else {
          showToast('浏览器不支持读取剪贴板');
          fire(comp, 'GotText');
        }
      },
      randomNextInt(comp, min, max){
        const meta = window.__AI2__.nameMap[comp];
        const a = Number(min); const b = Number(max);
        const lo = Number.isFinite(a) ? a : 1;
        const hi = Number.isFinite(b) ? b : 6;
        const low = Math.min(lo, hi); const high = Math.max(lo, hi);
        const n = low + Math.floor(Math.random() * (high - low + 1));
        if (meta) meta.props.LastResult = n;
        fire(comp, 'GotResult');
        return n;
      },
      saveFile(comp, content, filename){
        const meta = window.__AI2__.nameMap[comp];
        const name = String(filename || (meta && meta.props && meta.props.FileName) || 'notes.txt');
        const blob = new Blob([String(content == null ? '' : content)], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
        showToast('已下载 ' + name);
      },
      noteNs(comp){
        const meta = window.__AI2__.nameMap[comp];
        return 'notes:' + String((meta && meta.props && meta.props.Namespace) || 'mynotes') + ':';
      },
      notePersist(key, value){
        localStorage.setItem(key, value);
        const Pref = capPlugin('Preferences');
        if (Pref && Pref.set) Pref.set({ key: key, value: value }).catch(function(){});
      },
      noteRemove(key){
        localStorage.removeItem(key);
        const Pref = capPlugin('Preferences');
        if (Pref && Pref.remove) Pref.remove({ key: key }).catch(function(){});
      },
      noteGetIndex(comp){
        const raw = localStorage.getItem(window.rt.noteNs(comp) + 'index');
        if (!raw) return [];
        try {
          const arr = JSON.parse(raw);
          return Array.isArray(arr) ? arr.map(String) : [];
        } catch(e){ return []; }
      },
      noteSetIndex(comp, titles){
        window.rt.notePersist(window.rt.noteNs(comp) + 'index', JSON.stringify(titles));
      },
      noteParseBody(raw){
        if (raw == null) return { content: '', updatedAt: '' };
        try {
          const j = JSON.parse(raw);
          if (j && typeof j === 'object' && (j.content != null || j.updatedAt != null)) {
            return { content: String(j.content || ''), updatedAt: String(j.updatedAt || '') };
          }
        } catch(e){}
        return { content: String(raw), updatedAt: '' };
      },
      noteFormatTime(ms){
        const d = new Date(ms);
        return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
      },
      noteTitleKey(item){
        const s = String(item || '');
        const i = s.lastIndexOf(' · ');
        return i >= 0 ? s.slice(0, i) : s;
      },
      noteSave(comp, title, content){
        const meta = window.__AI2__.nameMap[comp];
        const t = window.rt.noteTitleKey(title == null ? '' : title).trim() || ('笔记' + Date.now());
        const body = String(content == null ? '' : content);
        const stamp = window.rt.noteFormatTime(Date.now());
        const ns = window.rt.noteNs(comp);
        window.rt.notePersist(ns + 'body:' + t, JSON.stringify({ content: body, updatedAt: stamp }));
        const idx = window.rt.noteGetIndex(comp);
        if (idx.indexOf(t) < 0) idx.unshift(t);
        window.rt.noteSetIndex(comp, idx);
        if (meta) {
          meta.props.Title = t;
          meta.props.Content = body;
          meta.props.UpdatedAt = stamp;
          meta.props.Titles = idx.map(function(name){
            const rec = window.rt.noteParseBody(localStorage.getItem(ns + 'body:' + name));
            return rec.updatedAt ? (name + ' · ' + rec.updatedAt) : name;
          }).join(',');
          meta.props.Count = idx.length;
        }
        fire(comp, 'AfterSave');
        showToast('已保存笔记：' + t);
      },
      noteLoad(comp, title){
        const meta = window.__AI2__.nameMap[comp];
        const t = window.rt.noteTitleKey(title == null ? '' : title).trim();
        const raw = localStorage.getItem(window.rt.noteNs(comp) + 'body:' + t);
        const rec = window.rt.noteParseBody(raw);
        if (meta) {
          meta.props.Title = t;
          meta.props.Content = raw == null ? '' : rec.content;
          meta.props.UpdatedAt = raw == null ? '' : rec.updatedAt;
        }
        fire(comp, 'AfterLoad');
        if (raw == null) showToast('未找到笔记：' + t);
      },
      noteDelete(comp, title){
        const meta = window.__AI2__.nameMap[comp];
        const t = window.rt.noteTitleKey(title == null ? '' : title).trim();
        window.rt.noteRemove(window.rt.noteNs(comp) + 'body:' + t);
        const idx = window.rt.noteGetIndex(comp).filter(function(x){ return x !== t; });
        window.rt.noteSetIndex(comp, idx);
        if (meta) {
          meta.props.Titles = idx.join(',');
          meta.props.Count = idx.length;
          if (meta.props.Title === t) { meta.props.Title = ''; meta.props.Content = ''; }
        }
        fire(comp, 'AfterDelete');
        showToast('已删除：' + t);
      },
      noteList(comp){
        const meta = window.__AI2__.nameMap[comp];
        const idx = window.rt.noteGetIndex(comp);
        const ns = window.rt.noteNs(comp);
        if (meta) {
          meta.props.Titles = idx.map(function(name){
            const rec = window.rt.noteParseBody(localStorage.getItem(ns + 'body:' + name));
            return rec.updatedAt ? (name + ' · ' + rec.updatedAt) : name;
          }).join(',');
          meta.props.Count = idx.length;
        }
        fire(comp, 'AfterList');
      },
      noteClearAll(comp){
        const meta = window.__AI2__.nameMap[comp];
        const ns = window.rt.noteNs(comp);
        const idx = window.rt.noteGetIndex(comp);
        idx.forEach(function(t){ window.rt.noteRemove(ns + 'body:' + t); });
        window.rt.noteRemove(ns + 'index');
        if (meta) {
          meta.props.Titles = '';
          meta.props.Count = 0;
          meta.props.Title = '';
          meta.props.Content = '';
          meta.props.UpdatedAt = '';
        }
        fire(comp, 'AfterDelete');
        showToast('已清空笔记本');
      },
      pickFiles(comp, multiple){
        const meta = window.__AI2__.nameMap[comp];
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = !!multiple || !!(meta && meta.props && meta.props.Multiple);
        input.accept = String((meta && meta.props && meta.props.Accept) || '.txt,.csv,.md,.json,text/*');
        input.onchange = function(){
          const files = Array.from(input.files || []);
          if (!files.length) return;
          const maxBytes = 2.5 * 1024 * 1024;
          const names = [];
          const texts = [];
          let i = 0;
          const next = function(){
            if (i >= files.length) {
              if (meta) {
                meta.props.FileName = names[0] || '';
                meta.props.Content = texts[0] || '';
                meta.props.FileNames = names.join(',');
                meta.props.FileCount = names.length;
                meta.props.CombinedText = texts.join('\\n-----\\n');
              }
              fire(comp, 'AfterPicking');
              showToast('已选 ' + names.length + ' 个文件');
              return;
            }
            const f = files[i++];
            if (f.size > maxBytes) {
              showToast('跳过过大文件: ' + f.name);
              next();
              return;
            }
            const reader = new FileReader();
            reader.onload = function(){
              names.push(f.name);
              texts.push(String(reader.result || ''));
              next();
            };
            reader.onerror = function(){ showToast('读取失败: ' + f.name); next(); };
            reader.readAsText(f, 'utf-8');
          };
          next();
        };
        input.click();
      },
      pickFolder(comp){
        const meta = window.__AI2__.nameMap[comp];
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        try { input.setAttribute('webkitdirectory', ''); input.webkitdirectory = true; } catch(e){}
        input.onchange = function(){
          const files = Array.from(input.files || []);
          if (!files.length) {
            showToast('未选择文件夹（可用「文件选择·多选」代替）');
            return;
          }
          const maxBytes = 1.5 * 1024 * 1024;
          const textExt = /\\.(txt|csv|md|json|log|tsv|xml|html|htm|js|ts|css)$/i;
          const names = [];
          const texts = [];
          let folder = '';
          try {
            const rel = files[0].webkitRelativePath || files[0].name;
            folder = String(rel).split('/')[0] || '';
          } catch(e){}
          let i = 0;
          const next = function(){
            if (i >= files.length) {
              if (meta) {
                meta.props.FolderName = folder;
                meta.props.FileNames = names.join(',');
                meta.props.FileCount = names.length;
                meta.props.CombinedText = texts.join('\\n-----\\n');
                meta._folderTexts = texts;
                meta._folderNames = names;
              }
              fire(comp, 'AfterPicking');
              showToast('文件夹「' + (folder || '已选') + '」文本文件 ' + names.length + ' 个');
              return;
            }
            const f = files[i++];
            if (!textExt.test(f.name) || f.size > maxBytes) { next(); return; }
            const reader = new FileReader();
            reader.onload = function(){
              names.push(f.name);
              texts.push(String(reader.result || ''));
              next();
            };
            reader.onerror = function(){ next(); };
            reader.readAsText(f, 'utf-8');
          };
          next();
        };
        input.click();
      },
      searchFolder(comp, keyword){
        const meta = window.__AI2__.nameMap[comp];
        const key = String(keyword == null ? '' : keyword);
        const names = (meta && meta._folderNames) || String(meta && meta.props && meta.props.FileNames || '').split(',').filter(Boolean);
        const texts = (meta && meta._folderTexts) || String(meta && meta.props && meta.props.CombinedText || '').split('\\n-----\\n');
        const hits = [];
        for (let i = 0; i < texts.length; i++) {
          const lines = String(texts[i] || '').split(/\\r?\\n/);
          for (let j = 0; j < lines.length; j++) {
            if (!key || lines[j].indexOf(key) >= 0) {
              hits.push((names[i] || ('文件'+(i+1))) + ':' + (j+1) + ' ' + lines[j]);
            }
          }
        }
        if (meta) {
          meta.props.MatchLines = hits.slice(0, 500).join('\\n');
          meta.props.MatchCount = hits.length;
        }
        fire(comp, 'AfterSearch');
        showToast('命中 ' + hits.length + ' 行');
      },
      workshopSet(comp, text, lines, count){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta) return;
        meta.props.ResultText = text == null ? '' : String(text);
        meta.props.ResultLines = lines == null ? '' : String(lines);
        meta.props.ResultCount = Number(count) || 0;
        fire(comp, 'GotResult');
      },
      textSearchLines(comp, text, keyword){
        const key = String(keyword == null ? '' : keyword);
        const lines = String(text == null ? '' : text).split(/\\r?\\n/).filter(function(l){ return !key || l.indexOf(key) >= 0; });
        window.rt.workshopSet(comp, lines.join('\\n'), lines.join('\\n'), lines.length);
      },
      textReplaceAll(comp, text, find, repl){
        const src = String(text == null ? '' : text);
        const f = String(find == null ? '' : find);
        const r = String(repl == null ? '' : repl);
        const out = f ? src.split(f).join(r) : src;
        window.rt.workshopSet(comp, out, out, out.split(/\\r?\\n/).length);
      },
      textWordStats(comp, text){
        const src = String(text == null ? '' : text);
        const meta = window.__AI2__.nameMap[comp];
        const lines = src ? src.split(/\\r?\\n/) : [];
        const words = src.trim() ? src.trim().split(/\\s+/).length : 0;
        if (meta) {
          meta.props.CharCount = src.length;
          meta.props.WordCount = words;
          meta.props.LineCount = lines.length;
          meta.props.ResultText = '字'+src.length+' 词'+words+' 行'+lines.length;
          meta.props.ResultCount = words;
        }
        fire(comp, 'GotResult');
      },
      textSortLines(comp, text, desc){
        const lines = String(text == null ? '' : text).split(/\\r?\\n/);
        lines.sort(function(a,b){ return a.localeCompare(b, 'zh'); });
        if (desc) lines.reverse();
        window.rt.workshopSet(comp, lines.join('\\n'), lines.join('\\n'), lines.length);
      },
      textUniqueLines(comp, text){
        const lines = String(text == null ? '' : text).split(/\\r?\\n/);
        const seen = {};
        const out = [];
        lines.forEach(function(l){ if (!seen[l]) { seen[l] = 1; out.push(l); } });
        window.rt.workshopSet(comp, out.join('\\n'), out.join('\\n'), out.length);
      },
      textReverseLines(comp, text){
        const lines = String(text == null ? '' : text).split(/\\r?\\n/).reverse();
        window.rt.workshopSet(comp, lines.join('\\n'), lines.join('\\n'), lines.length);
      },
      textCase(comp, text, upper){
        const src = String(text == null ? '' : text);
        const out = upper ? src.toUpperCase() : src.toLowerCase();
        window.rt.workshopSet(comp, out, out, out.split(/\\r?\\n/).length);
      },
      textCsvColumn(comp, text, col){
        const idx = Math.max(0, (Number(col) || 1) - 1);
        const lines = String(text == null ? '' : text).split(/\\r?\\n/);
        const out = lines.map(function(line){
          const cells = line.split(/[,\\t]/);
          return cells[idx] != null ? cells[idx] : '';
        }).filter(Boolean);
        window.rt.workshopSet(comp, out.join('\\n'), out.join('\\n'), out.length);
      },
      textShuffleLines(comp, text){
        const lines = String(text == null ? '' : text).split(/\\r?\\n/);
        for (let i = lines.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = lines[i]; lines[i] = lines[j]; lines[j] = tmp;
        }
        window.rt.workshopSet(comp, lines.join('\\n'), lines.join('\\n'), lines.length);
      },
      /* 纯函数积木用 */
      utilFilterLines(text, keyword){
        const key = String(keyword == null ? '' : keyword);
        return String(text == null ? '' : text).split(/\\r?\\n/).filter(function(l){ return !key || l.indexOf(key) >= 0; }).join('\\n');
      },
      utilReplaceAll(text, find, repl){
        const f = String(find == null ? '' : find);
        if (!f) return String(text == null ? '' : text);
        return String(text == null ? '' : text).split(f).join(String(repl == null ? '' : repl));
      },
      utilLineCount(text){
        const s = String(text == null ? '' : text);
        if (!s) return 0;
        return s.split(/\\r?\\n/).length;
      },
      utilContainsCount(text, keyword){
        const s = String(text == null ? '' : text);
        const k = String(keyword == null ? '' : keyword);
        if (!k) return 0;
        let n = 0, pos = 0;
        while ((pos = s.indexOf(k, pos)) >= 0) { n++; pos += k.length; }
        return n;
      },
      galleryOpen(comp, imageComp){
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(){
          const file = input.files && input.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = function(){
            const url = String(reader.result || '');
            const meta = window.__AI2__.nameMap[comp];
            if (meta) meta.props.Selection = url;
            if (imageComp) window.rt.setProp(imageComp, 'Picture', url);
            fire(comp, 'AfterPicking');
          };
          reader.readAsDataURL(file);
        };
        input.click();
      },
      webDbStore(comp, tag, value){
        const meta = window.__AI2__.nameMap[comp];
        const key = 'webdb:' + String(tag);
        const mode = window.__AI2_NET_FAIL__ || 'ok';
        if (mode === 'timeout') { showToast('请求超时'); fire(comp, 'ErrorOccurred'); return; }
        if (mode === 'error') { showToast('网络错误（模拟）'); fire(comp, 'ErrorOccurred'); return; }
        localStorage.setItem(key, JSON.stringify(value));
        if (meta) meta.props.LastTag = tag;
        setTimeout(function(){ fire(comp, 'ValueStored'); }, 280);
        const url = meta && meta.props && String(meta.props.ServiceURL || '').trim();
        if (url && isSafeHttpUrl(url)) {
          fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tag: tag, value: value }) }).catch(function(){});
        }
      },
      webDbGet(comp, tag){
        const meta = window.__AI2__.nameMap[comp];
        const key = 'webdb:' + String(tag);
        const url = meta && meta.props && String(meta.props.ServiceURL || '').trim();
        const finish = function(val){
          if (meta) { meta.props.Tag = tag; meta.props.Value = val; }
          fire(comp, 'GotValue');
        };
        const mode = window.__AI2_NET_FAIL__ || 'ok';
        if (mode === 'timeout') { showToast('请求超时'); fire(comp, 'ErrorOccurred'); return; }
        if (mode === 'error') { showToast('网络错误（模拟）'); fire(comp, 'ErrorOccurred'); return; }
        if (mode === 'empty') { finish(''); return; }
        if (url && isSafeHttpUrl(url)) {
          const ctrl = new AbortController();
          const timer = setTimeout(function(){ try { ctrl.abort(); } catch(e){} }, 8000);
          fetch(url + (url.indexOf('?')>=0 ? '&' : '?') + 'tag=' + encodeURIComponent(String(tag)), { signal: ctrl.signal })
            .then(function(r){ clearTimeout(timer); return r.json(); })
            .then(function(j){ finish(j && (j.value != null ? j.value : j)); })
            .catch(function(){
              const raw = localStorage.getItem(key);
              try { finish(raw == null ? '' : JSON.parse(raw)); } catch(e){ finish(''); }
            });
          return;
        }
        setTimeout(function(){
          const raw = localStorage.getItem(key);
          try { finish(raw == null ? '' : JSON.parse(raw)); } catch(e){ finish(''); }
        }, 280);
      },
      openScreen(name){
        if (mode === 'standalone' && typeof window.__AI2_LOAD_SCREEN__ === 'function') {
          window.__AI2_SCREEN_STACK__ = window.__AI2_SCREEN_STACK__ || [];
          if (window.__AI2__.currentScreen) window.__AI2_SCREEN_STACK__.push(window.__AI2__.currentScreen);
          window.__AI2_LOAD_SCREEN__(name);
          return;
        }
        try { parent.postMessage({ type: 'ai2-open-screen', name }, '*'); } catch(e){}
        if (mode === 'standalone') showToast('未找到屏幕: ' + name);
      },
      closeScreen(){
        if (mode === 'standalone' && typeof window.__AI2_LOAD_SCREEN__ === 'function') {
          const stack = window.__AI2_SCREEN_STACK__ || [];
          const prev = stack.pop();
          window.__AI2_SCREEN_STACK__ = stack;
          if (prev) { window.__AI2_LOAD_SCREEN__(prev); return; }
          if (window.__AI2__.screens && window.__AI2__.screens[0]) {
            window.__AI2_LOAD_SCREEN__(window.__AI2__.screens[0]);
          }
          return;
        }
        try { parent.postMessage({ type: 'ai2-close-screen' }, '*'); } catch(e){}
      },
      alarmArm(comp){ window.rt.setProp(comp, 'Enabled', true); showToast('闹钟已开启'); },
      alarmCancel(comp){ window.rt.setProp(comp, 'Enabled', false); showToast('闹钟已关闭'); },
      alarmSnooze(comp, mins){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta) return;
        window.rt.setProp(comp, 'Time', addMinutesHHmm(meta.props.Time, mins == null ? 5 : mins));
        meta.props._lastFired = '';
        window.rt.setProp(comp, 'Enabled', true);
        showToast('贪睡至 ' + meta.props.Time);
      },
      reminderArm(comp){ window.rt.setProp(comp, 'Enabled', true); showToast('提醒已开启'); },
      reminderCancel(comp){ window.rt.setProp(comp, 'Enabled', false); showToast('提醒已关闭'); },
      reminderSnooze(comp, mins){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta) return;
        window.rt.setProp(comp, 'Time', addMinutesHHmm(meta.props.Time, mins == null ? 5 : mins));
        meta.props._lastFired = '';
        window.rt.setProp(comp, 'Enabled', true);
        showToast('已推迟到 ' + meta.props.Time);
      },
      calendarToday(comp){
        const now = new Date();
        const pad = function(n){ return String(n).padStart(2,'0'); };
        const iso = now.getFullYear() + '-' + pad(now.getMonth()+1) + '-' + pad(now.getDate());
        window.rt.setProp(comp, 'Year', now.getFullYear());
        window.rt.setProp(comp, 'Month', now.getMonth()+1);
        window.rt.setProp(comp, 'SelectedDate', iso);
        paintCalendar(comp);
      },
      calendarShift(comp, dir){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta) return;
        let y = Number(meta.props.Year) || new Date().getFullYear();
        let m = Number(meta.props.Month) || (new Date().getMonth()+1);
        m += Number(dir) || 0;
        while (m > 12) { m -= 12; y += 1; }
        while (m < 1) { m += 12; y -= 1; }
        window.rt.setProp(comp, 'Year', y);
        window.rt.setProp(comp, 'Month', m);
        paintCalendar(comp);
      },
      calendarMark(comp, date){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta) return;
        const iso = String(date || '');
        const cur = String(meta.props.MarksFromString || '').split(',').map(function(s){return s.trim();}).filter(Boolean);
        if (iso && cur.indexOf(iso) < 0) cur.push(iso);
        window.rt.setProp(comp, 'MarksFromString', cur.join(','));
        paintCalendar(comp);
      },
      flashlightOn(comp){
        var el = document.getElementById('ai2-flash');
        if (!el) {
          el = document.createElement('div');
          el.id = 'ai2-flash';
          el.style.cssText = 'position:fixed;inset:0;background:#fffde7;z-index:200;';
          document.body.appendChild(el);
        }
        el.style.display = 'block';
        if (comp && window.__AI2__.nameMap[comp]) window.__AI2__.nameMap[comp].props.On = true;
      },
      flashlightOff(comp){
        var el = document.getElementById('ai2-flash');
        if (el) el.style.display = 'none';
        if (comp && window.__AI2__.nameMap[comp]) window.__AI2__.nameMap[comp].props.On = false;
      },
      smsSend(comp, phone, text){
        const p = String(phone || (window.__AI2__.nameMap[comp] && window.__AI2__.nameMap[comp].props.PhoneNumber) || '');
        const t = String(text || '');
        const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        try { window.location.href = 'sms:' + encodeURIComponent(p) + (ios ? '&' : '?') + 'body=' + encodeURIComponent(t); } catch(e){}
        fire(comp, 'MessageSent');
        showToast('已唤起短信');
      },
      emailSend(comp, to, title, text){
        try {
          window.location.href = 'mailto:' + encodeURIComponent(String(to||'')) + '?subject=' + encodeURIComponent(String(title||'')) + '&body=' + encodeURIComponent(String(text||''));
        } catch(e){}
        showToast('已唤起邮件');
      },
      notifyShow(comp, title, text){
        const t = String(title || '提醒');
        const b = String(text || '');
        const run = function(){ window.rt.notifyShowNow(comp, t, b); };
        askPermission('notify', '需要发送通知', '应用想弹出一条系统通知。拒绝后仍可用屏幕上的提示。', run, function(){
          showToast(t + ' ' + b);
          fire(comp, 'Notified');
        });
      },
      notifyShowNow(comp, title, text){
        const t = String(title || '提醒');
        const b = String(text || '');
        if (window.Notification && Notification.permission === 'granted') {
          try { new Notification(t, { body: b }); } catch(e){ showToast(t + ' ' + b); }
        } else if (window.Notification && Notification.permission !== 'denied') {
          Notification.requestPermission().then(function(p){
            if (p === 'granted') try { new Notification(t, { body: b }); } catch(e){ showToast(t + ' ' + b); }
            else showToast(t + ' ' + b);
          });
        } else showToast(t + ' ' + b);
        fire(comp, 'Notified');
      },
      mapGoto(comp, lat, lng){
        window.rt.setProp(comp, 'Latitude', Number(lat)||0);
        window.rt.setProp(comp, 'Longitude', Number(lng)||0);
        const el = elByName(comp);
        if (el && el.tagName === 'IFRAME') {
          const la = Number(lat)||0, ln = Number(lng)||0;
          el.src = 'https://www.openstreetmap.org/export/embed.html?bbox='+(ln-0.04)+'%2C'+(la-0.03)+'%2C'+(ln+0.04)+'%2C'+(la+0.03)+'&layer=mapnik&marker='+la+'%2C'+ln;
        }
      },
      mapMyLocation(comp){
        if (!navigator.geolocation) { showToast('无法定位'); return; }
        navigator.geolocation.getCurrentPosition(function(pos){
          window.rt.mapGoto(comp, pos.coords.latitude, pos.coords.longitude);
          showToast('已定位到当前位置');
        }, function(){ showToast('定位失败'); }, { enableHighAccuracy: true, timeout: 8000 });
      },
      contactAdd(comp, name, phone){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta) return;
        const item = String(name||'未命名') + ':' + String(phone||'');
        const cur = String(meta.props.ContactsFromString || '').split(',').map(function(s){return s.trim();}).filter(Boolean);
        cur.push(item);
        window.rt.setProp(comp, 'ContactsFromString', cur.join(','));
      },
      contactSearch(comp, q){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta) return;
        const key = String(q || '').trim();
        const hit = String(meta.props.ContactsFromString || '').split(',').map(function(s){return s.trim();}).filter(function(s){ return key && s.indexOf(key) >= 0; });
        if (hit[0]) {
          meta.props.Selection = hit[0];
          fire(comp, 'AfterPicking');
          showToast(hit[0]);
        } else showToast('未找到联系人');
      },
      dialPress(comp, key){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta) return;
        const k = String(key || '');
        if (k === 'B' || k === 'back' || k === '⌫') {
          window.rt.setProp(comp, 'Number', String(meta.props.Number || '').slice(0, -1));
        } else if (k === 'C' || k === 'clear' || k === '清空') {
          window.rt.setProp(comp, 'Number', '');
        } else {
          window.rt.setProp(comp, 'Number', String(meta.props.Number || '') + k);
        }
        fire(comp, 'NumberChanged');
      },
      dialCall(comp){
        const meta = window.__AI2__.nameMap[comp];
        const n = String((meta && meta.props && meta.props.Number) || '');
        window.rt.phoneCall(n);
        fire(comp, 'CallStarted');
      },
      dialClear(comp){ window.rt.setProp(comp, 'Number', ''); fire(comp, 'NumberChanged'); },
      dialBackspace(comp){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta) return;
        window.rt.setProp(comp, 'Number', String(meta.props.Number || '').slice(0, -1));
        fire(comp, 'NumberChanged');
      },
      todoAdd(comp, item){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta) return;
        const it = String(item || '').trim();
        if (!it) return;
        const cur = String(meta.props.ItemsFromString || '').split(',').map(function(s){return s.trim();}).filter(Boolean);
        cur.push(it);
        window.rt.setProp(comp, 'ItemsFromString', cur.join(','));
      },
      todoClearDone(comp){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta) return;
        const done = String(meta.props.CheckedFromString || '').split(',').map(function(s){return s.trim();}).filter(Boolean);
        const left = String(meta.props.ItemsFromString || '').split(',').map(function(s){return s.trim();}).filter(function(s){ return done.indexOf(s) < 0; });
        window.rt.setProp(comp, 'ItemsFromString', left.join(','));
        window.rt.setProp(comp, 'CheckedFromString', '');
      },
      calcPress(comp, key){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta) return;
        const k = String(key || '');
        if (k === 'C' || k === '清空') {
          window.rt.setProp(comp, 'Expression', '');
          window.rt.setProp(comp, 'Result', '0');
          return;
        }
        if (k === 'B' || k === '⌫' || k === '退格') {
          window.rt.setProp(comp, 'Expression', String(meta.props.Expression || '').slice(0, -1));
          return;
        }
        if (k === '=' || k === '等于') { window.rt.calcEval(comp); return; }
        window.rt.setProp(comp, 'Expression', String(meta.props.Expression || '') + k);
      },
      calcEval(comp){
        const meta = window.__AI2__.nameMap[comp];
        if (!meta) return;
        const s = String(meta.props.Expression || '').replace(/×/g,'*').replace(/÷/g,'/').replace(/\\s/g,'');
        let out = '0';
        if (s && /^[0-9+*/().-]+$/.test(s)) {
          try { out = String(Function('"use strict";return (' + s + ')')()); } catch(e){ out = '错误'; }
        } else if (s) out = '错误';
        window.rt.setProp(comp, 'Result', out);
        fire(comp, 'Calculated');
      },
      calcClear(comp){
        window.rt.setProp(comp, 'Expression', '');
        window.rt.setProp(comp, 'Result', '0');
      },
      weatherFetch(comp, city){
        const meta = window.__AI2__.nameMap[comp];
        if (meta) meta.props.WeatherText = '正在获取…';
        paintWeather(comp);
        const q = encodeURIComponent(String(city || (meta && meta.props.City) || '北京'));
        fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + q + '&count=1&language=zh')
          .then(function(r){ return r.json(); })
          .then(function(g){
            const loc = g && g.results && g.results[0];
            if (!loc) { showToast('找不到城市'); if (meta) { meta.props.WeatherText = '找不到城市'; paintWeather(comp); } return null; }
            if (meta) meta.props.City = loc.name;
            return fetch('https://api.open-meteo.com/v1/forecast?latitude=' + loc.latitude + '&longitude=' + loc.longitude + '&current_weather=true');
          })
          .then(function(r){ return r ? r.json() : null; })
          .then(function(j){
            if (!j || !meta) return;
            const w = j.current_weather || {};
            const codes = {0:'晴',1:'多云',2:'阴',3:'阴',45:'雾',51:'小雨',61:'雨',71:'雪',80:'阵雨',95:'雷雨'};
            meta.props.Temperature = w.temperature;
            meta.props.WeatherText = codes[w.weathercode] || ('代码' + w.weathercode);
            meta.props.WindSpeed = w.windspeed;
            paintWeather(comp);
            fire(comp, 'AfterFetch');
          })
          .catch(function(){ showToast('天气获取失败'); if (meta) { meta.props.WeatherText = '获取失败'; paintWeather(comp); } });
      },
      recorderStart(comp){
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { showToast('当前浏览器不能录音'); return; }
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream){
          const rec = new MediaRecorder(stream);
          const chunks = [];
          rec.ondataavailable = function(e){ if (e.data && e.data.size) chunks.push(e.data); };
          rec.onstop = function(){
            stream.getTracks().forEach(function(t){ t.stop(); });
            const url = URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' }));
            const meta = window.__AI2__.nameMap[comp];
            if (meta) meta.props.Source = url;
            fire(comp, 'AfterSoundRecorded');
            showToast('录音完成');
          };
          window.__AI2__._recorders = window.__AI2__._recorders || {};
          window.__AI2__._recorders[comp] = rec;
          rec.start();
          showToast('开始录音');
        }).catch(function(){ showToast('录音权限被拒绝'); });
      },
      recorderStop(comp){
        const rec = window.__AI2__._recorders && window.__AI2__._recorders[comp];
        if (rec && rec.state === 'recording') rec.stop();
      },
      barcodeScan(comp){
        const done = function(text){
          window.rt.setProp(comp, 'ScanResult', text || '');
          fire(comp, 'AfterScan');
          showToast(text ? '扫码: '+text : '未识别');
        };
        if (window.BarcodeDetector) {
          var input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = function(){
            var file = input.files && input.files[0];
            if (!file) { done(''); return; }
            var url = URL.createObjectURL(file);
            var img = new Image();
            img.onload = function(){
              var det = new BarcodeDetector({ formats: ['qr_code', 'ean_13', 'code_128'] });
              det.detect(img).then(function(codes){
                done(codes && codes[0] && codes[0].rawValue || '');
              }).catch(function(){ done(window.prompt('请输入条码内容','') || ''); });
            };
            img.src = url;
          };
          input.click();
          return;
        }
        done(window.prompt('当前浏览器不能识图扫码，请手动输入','') || '');
      }
    };
  }

  function bindUi(){
    document.querySelectorAll('[data-name]').forEach(el => {
      const name = el.getAttribute('data-name');
      const type = el.getAttribute('data-type');
      if (type === 'Button') {
        el.addEventListener('click', () => fire(name, 'Click'));
        let pressTimer = null;
        el.addEventListener('pointerdown', () => {
          pressTimer = setTimeout(() => fire(name, 'LongClick'), 550);
        });
        el.addEventListener('pointerup', () => { if (pressTimer) clearTimeout(pressTimer); });
        el.addEventListener('pointerleave', () => { if (pressTimer) clearTimeout(pressTimer); });
      }
      if (type === 'Image') el.addEventListener('click', () => fire(name, 'Click'));
      if (type === 'TextBox' || type === 'PasswordTextBox') {
        el.addEventListener('focus', () => fire(name, 'GotFocus'));
        el.addEventListener('input', () => {
          if (window.__AI2__.nameMap[name]) window.__AI2__.nameMap[name].props.Text = el.value;
        });
        el.addEventListener('blur', () => {
          if (window.__AI2__.nameMap[name]) window.__AI2__.nameMap[name].props.Text = el.value;
          fire(name, 'LostFocus');
        });
      }
      if (type === 'CheckBox' || type === 'Switch') {
        const input = el.querySelector('input') || el;
        input.addEventListener('change', () => {
          const meta = window.__AI2__.nameMap[name];
          if (meta) {
            // 必须先把 DOM 状态写回 props，积木 getProp('On'/'Checked') 才能读到新值
            if (type === 'Switch') meta.props.On = !!input.checked;
            else meta.props.Checked = !!input.checked;
          }
          fire(name, 'Changed');
        });
      }
      if (type === 'Slider') {
        el.addEventListener('input', () => {
          if (window.__AI2__.nameMap[name]) window.__AI2__.nameMap[name].props.ThumbPosition = Number(el.value);
          fire(name, 'PositionChanged');
        });
      }
      if (type === 'Spinner') {
        el.addEventListener('change', () => {
          if (window.__AI2__.nameMap[name]) window.__AI2__.nameMap[name].props.Selection = el.value;
          fire(name, 'AfterSelecting');
        });
      }
      if (type === 'DatePicker') {
        el.addEventListener('change', () => {
          if (window.__AI2__.nameMap[name]) window.__AI2__.nameMap[name].props.Date = el.value;
          fire(name, 'AfterDateSet');
        });
      }
      if (type === 'TimePicker') {
        el.addEventListener('change', () => {
          if (window.__AI2__.nameMap[name]) window.__AI2__.nameMap[name].props.Time = el.value;
          fire(name, 'AfterTimeSet');
        });
      }
      if (type === 'ListView') {
        el.querySelectorAll('li').forEach(li => {
          li.addEventListener('click', () => {
            if (window.__AI2__.nameMap[name]) window.__AI2__.nameMap[name].props.Selection = li.getAttribute('data-item');
            fire(name, 'AfterPicking');
          });
        });
      }
      if (type === 'Canvas') {
        el.addEventListener('pointerdown', () => fire(name, 'Touched'));
        el.addEventListener('pointermove', (ev) => { if (ev.buttons) fire(name, 'Dragged'); });
      }
      if (type === 'Ball' || type === 'ImageSprite') {
        el.addEventListener('pointerdown', () => fire(name, 'Touched'));
      }
      if (type === 'Player' || type === 'VideoPlayer') {
        el.addEventListener('ended', () => fire(name, 'Completed'));
      }
      if (type === 'RatingBar') {
        el.addEventListener('input', () => {
          if (window.__AI2__.nameMap[name]) window.__AI2__.nameMap[name].props.Rating = Number(el.value);
          fire(name, 'Changed');
        });
      }
      if (type === 'Dice' || type === 'CoinFlip' || type === 'TrafficLight' || type === 'LightBulb' || type === 'FortuneBall') {
        // 只派发 Click；掷骰/抛币等方法必须由积木调用 rt.*，禁止预览硬编码绕过积木
        el.addEventListener('click', () => fire(name, 'Click'));
      }
      if (type === 'Badge' || type === 'Avatar') {
        el.addEventListener('click', () => fire(name, 'Click'));
      }
      if (type === 'Hyperlink') {
        el.addEventListener('click', (ev) => {
          ev.preventDefault();
          fire(name, 'Click');
          const meta = window.__AI2__.nameMap[name];
          const url = String((meta && meta.props && meta.props.Url) || el.getAttribute('href') || '').trim();
          if (!url || url === '#') return;
          try { parent.postMessage({ type: 'ai2-open-url', url }, '*'); } catch (e) {}
          try { window.open(url, '_blank', 'noopener,noreferrer'); } catch (e) {}
        });
      }
      if (type === 'ToggleButton') {
        el.addEventListener('click', () => {
          const meta = window.__AI2__.nameMap[name];
          const next = !(meta && meta.props && meta.props.Checked);
          window.rt.setProp(name, 'Checked', next);
          fire(name, 'Changed');
        });
      }
      if (type === 'Stepper') {
        el.querySelectorAll('[data-step]').forEach((btn) => {
          btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const meta = window.__AI2__.nameMap[name];
            if (!meta) return;
            const dir = Number(btn.getAttribute('data-step')) || 0;
            const step = Number(meta.props.Step) || 1;
            const min = Number(meta.props.MinValue) || 0;
            const max = Number(meta.props.MaxValue) || 99;
            let v = (Number(meta.props.Value) || 0) + dir * step;
            v = Math.max(min, Math.min(max, v));
            window.rt.setProp(name, 'Value', v);
            fire(name, 'Changed');
          });
        });
      }
      if (type === 'RadioButton') {
        const input = el.querySelector('input');
        if (input) input.addEventListener('change', () => {
          const group = input.getAttribute('name');
          Object.entries(window.__AI2__.nameMap).forEach(([n, m]) => {
            if (m.type === 'RadioButton' && String(m.props.GroupName || 'group1') === group) {
              window.rt.setProp(n, 'Checked', n === name);
            }
          });
          fire(name, 'Changed');
        });
      }
      if (type === 'TabBar') {
        el.querySelectorAll('[data-tab]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            if (window.__AI2__.nameMap[name]) window.__AI2__.nameMap[name].props.Selection = tab;
            el.querySelectorAll('[data-tab]').forEach((b) => {
              const on = b.getAttribute('data-tab') === tab;
              b.style.background = on ? '#fff' : 'transparent';
              b.style.fontWeight = on ? '700' : '400';
            });
            fire(name, 'AfterSelecting');
          });
        });
      }
      if (type === 'TextArea' || type === 'NumberBox' || type === 'SearchBar') {
        el.addEventListener('focus', () => fire(name, 'GotFocus'));
        el.addEventListener('blur', () => {
          if (window.__AI2__.nameMap[name]) window.__AI2__.nameMap[name].props.Text = el.value;
          fire(name, 'LostFocus');
        });
        el.addEventListener('input', () => {
          if (window.__AI2__.nameMap[name]) window.__AI2__.nameMap[name].props.Text = el.value;
          fire(name, 'Changed');
        });
        if (type === 'SearchBar') {
          el.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') {
              if (window.__AI2__.nameMap[name]) window.__AI2__.nameMap[name].props.Text = el.value;
              fire(name, 'Submitted');
            }
          });
        }
      }
      if (type === 'ColorPicker') {
        el.addEventListener('input', () => {
          if (window.__AI2__.nameMap[name]) window.__AI2__.nameMap[name].props.Color = el.value;
          fire(name, 'Changed');
        });
      }
      if (type === 'ChatBubble') {
        el.addEventListener('click', () => fire(name, 'Click'));
      }
      if (type === 'Joystick') {
        const knob = el.querySelector('.ai2-joy-knob');
        const setPos = (clientX, clientY) => {
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          let dx = (clientX - cx) / (rect.width / 2);
          let dy = (clientY - cy) / (rect.height / 2);
          const mag = Math.sqrt(dx*dx + dy*dy);
          if (mag > 1) { dx /= mag; dy /= mag; }
          if (window.__AI2__.nameMap[name]) {
            window.__AI2__.nameMap[name].props.X = Math.round(dx * 100) / 100;
            window.__AI2__.nameMap[name].props.Y = Math.round(dy * 100) / 100;
          }
          if (knob) {
            const kx = dx * (rect.width * 0.28);
            const ky = dy * (rect.height * 0.28);
            knob.style.transform = 'translate(calc(-50% + ' + kx + 'px), calc(-50% + ' + ky + 'px))';
          }
          fire(name, 'PositionChanged');
        };
        const reset = () => {
          if (window.__AI2__.nameMap[name]) {
            window.__AI2__.nameMap[name].props.X = 0;
            window.__AI2__.nameMap[name].props.Y = 0;
          }
          if (knob) knob.style.transform = 'translate(-50%, -50%)';
          fire(name, 'Released');
        };
        let dragging = false;
        el.addEventListener('pointerdown', (ev) => { dragging = true; try { el.setPointerCapture(ev.pointerId); } catch(e){} setPos(ev.clientX, ev.clientY); });
        el.addEventListener('pointermove', (ev) => { if (dragging) setPos(ev.clientX, ev.clientY); });
        el.addEventListener('pointerup', () => { dragging = false; reset(); });
        el.addEventListener('pointercancel', () => { dragging = false; reset(); });
      }
      if (type === 'WebViewer') {
        const openBtn = el.parentElement && el.parentElement.querySelector('[data-wv-open]');
        if (openBtn) openBtn.addEventListener('click', function(ev){
          ev.preventDefault();
          var url = openBtn.getAttribute('data-wv-open');
          if (url) {
            try { parent.postMessage({ type: 'ai2-open-url', url }, '*'); } catch(e){}
            try { window.open(url, '_blank', 'noopener,noreferrer'); } catch(e){}
          }
        });
        el.addEventListener('load', () => fire(name, 'PageLoaded'));
      }
      if (type === 'CalendarView') paintCalendar(name);
      if (type === 'ClockFace') paintClockFace(name);
      if (type === 'Alarm' || type === 'Reminder' || type === 'ClockFace' || type === 'CompassView' || type === 'WeatherBox') {
        el.addEventListener('click', function(){
          if (type === 'WeatherBox') window.rt.weatherFetch(name);
          if (type === 'Alarm' || type === 'Reminder') {
            const m = window.__AI2__.nameMap[name];
            if (m) window.rt.setProp(name, 'Enabled', !m.props.Enabled);
          }
          fire(name, 'Click');
        });
      }
      if (type === 'ContactList') bindPickList(el, name, 'AfterPicking');
      if (type === 'TodoList') bindTodo(el, name);
      if (type === 'CalculatorPad') {
        el.querySelectorAll('[data-key]').forEach(function(btn){
          btn.addEventListener('click', function(ev){
            ev.stopPropagation();
            window.rt.calcPress(name, btn.getAttribute('data-key'));
          });
        });
      }
      if (type === 'DialPad') {
        el.querySelectorAll('[data-dial]').forEach(function(btn){
          btn.addEventListener('click', function(ev){
            ev.stopPropagation();
            window.rt.dialPress(name, btn.getAttribute('data-dial'));
          });
        });
        el.querySelectorAll('[data-dial-act]').forEach(function(btn){
          btn.addEventListener('click', function(ev){
            ev.stopPropagation();
            const act = btn.getAttribute('data-dial-act');
            if (act === 'call') window.rt.dialCall(name);
            else if (act === 'clear') window.rt.dialClear(name);
            else window.rt.dialBackspace(name);
          });
        });
      }
    });
  }

  function fire(comp, event){
    (listeners[comp+'::'+event] || []).forEach(fn => {
      try {
        const ret = fn();
        if (ret && typeof ret.then === 'function') ret.catch(function(e){ console.error(e); showToast('事件错误: '+e.message); });
      } catch(e){ console.error(e); showToast('事件错误: '+e.message); }
    });
  }

  function paintCalendar(comp){
    const el = elByName(comp);
    const meta = window.__AI2__.nameMap[comp];
    if (!el || !meta) return;
    const y = Number(meta.props.Year) || new Date().getFullYear();
    const m = Number(meta.props.Month) || (new Date().getMonth()+1);
    const selected = String(meta.props.SelectedDate || '');
    const marks = String(meta.props.MarksFromString || '').split(',').map(function(s){return s.trim();});
    const first = new Date(y, m-1, 1);
    const start = first.getDay();
    const days = new Date(y, m, 0).getDate();
    let html = '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#e0f2f1;font-weight:700;">';
    html += '<button type="button" data-cal="-1" style="border:none;background:#fff;border-radius:6px;padding:2px 8px;cursor:pointer;">‹</button>';
    html += '<span>'+y+'年'+m+'月</span>';
    html += '<button type="button" data-cal="1" style="border:none;background:#fff;border-radius:6px;padding:2px 8px;cursor:pointer;">›</button></div>';
    html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;padding:8px;font-size:12px;text-align:center;">';
    ['日','一','二','三','四','五','六'].forEach(function(w){ html += '<div style="color:#90a4ae;">'+w+'</div>'; });
    for (let i=0;i<start;i++) html += '<div></div>';
    for (let d=1;d<=days;d++){
      const iso = y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      const on = iso === selected;
      const marked = marks.indexOf(iso) >= 0;
      html += '<button type="button" data-day="'+iso+'" style="border:none;border-radius:8px;padding:8px 0;cursor:pointer;background:'+(on?'#009688':(marked?'#fff8e1':'transparent'))+';color:'+(on?'#fff':'#202124')+';font-weight:'+(on?'700':'500')+';">'+d+'</button>';
    }
    html += '</div>';
    el.innerHTML = html;
    el.querySelectorAll('[data-cal]').forEach(function(btn){
      btn.addEventListener('click', function(ev){ ev.stopPropagation(); window.rt.calendarShift(comp, Number(btn.getAttribute('data-cal'))); });
    });
    el.querySelectorAll('[data-day]').forEach(function(btn){
      btn.addEventListener('click', function(ev){
        ev.stopPropagation();
        const iso = btn.getAttribute('data-day');
        window.rt.setProp(comp, 'SelectedDate', iso);
        paintCalendar(comp);
        fire(comp, 'AfterDateSet');
      });
    });
  }

  function splitCsv(s){
    return String(s || '').split(',').map(function(x){ return x.trim(); }).filter(Boolean);
  }
  function bindPickList(el, name, event){
    el.querySelectorAll('li').forEach(function(li){
      li.addEventListener('click', function(){
        if (window.__AI2__.nameMap[name]) window.__AI2__.nameMap[name].props.Selection = li.getAttribute('data-item');
        fire(name, event);
      });
    });
  }
  function paintContacts(comp){
    const el = elByName(comp);
    const meta = window.__AI2__.nameMap[comp];
    if (!el || !meta) return;
    const items = splitCsv(meta.props.ContactsFromString);
    el.innerHTML = items.map(function(it){
      return '<li data-item="'+it.replace(/"/g,'')+'" style="padding:10px 12px;border-bottom:1px solid #eee;cursor:pointer;">'+it+'</li>';
    }).join('');
    bindPickList(el, comp, 'AfterPicking');
  }
  function paintAlarm(comp){
    const el = elByName(comp);
    const meta = window.__AI2__.nameMap[comp];
    if (!el || !meta) return;
    const on = !!meta.props.Enabled;
    el.style.background = on ? '#fff8e1' : '#f5f5f5';
    el.innerHTML = '<div style="font-size:22px;font-weight:800;font-variant-numeric:tabular-nums;">⏰ '+(meta.props.Time || '07:00')+'</div>'+
      '<div style="font-size:12px;color:#5f6368;margin-top:4px;">'+(meta.props.Label || '闹钟')+' · '+(on?'已开启':'已关闭')+' · '+(meta.props.Repeat || '每天')+'</div>';
  }
  function paintReminder(comp){
    const el = elByName(comp);
    const meta = window.__AI2__.nameMap[comp];
    if (!el || !meta) return;
    const on = !!meta.props.Enabled;
    el.style.background = on ? '#e0f2f1' : '#f5f5f5';
    el.innerHTML = '<div style="font-size:16px;font-weight:800;">📌 '+(meta.props.Label || '提醒')+'</div>'+
      '<div style="font-size:12px;color:#5f6368;margin-top:4px;">'+(meta.props.Date || '')+' '+(meta.props.Time || '08:00')+' · '+(on?'已开启':'已关闭')+'</div>';
  }
  function paintTodo(comp){
    const el = elByName(comp);
    const meta = window.__AI2__.nameMap[comp];
    if (!el || !meta) return;
    const items = splitCsv(meta.props.ItemsFromString);
    const done = splitCsv(meta.props.CheckedFromString);
    el.innerHTML = '<li data-todo-add style="padding:10px 12px;border-bottom:1px solid #eee;cursor:pointer;color:#009688;font-weight:700;">＋ 添加待办</li>' + items.map(function(it){
      const on = done.indexOf(it) >= 0;
      return '<li data-item="'+it.replace(/"/g,'')+'" style="padding:10px 12px;border-bottom:1px solid #eee;cursor:pointer;display:flex;gap:8px;align-items:center;"><span>'+(on?'☑':'☐')+'</span><span style="text-decoration:'+(on?'line-through':'none')+';color:'+(on?'#9aa0a6':'#202124')+';">'+it+'</span></li>';
    }).join('');
    bindTodo(el, comp);
  }
  function bindTodo(el, name){
    const add = el.querySelector('[data-todo-add]');
    if (add) add.addEventListener('click', function(ev){
      ev.stopPropagation();
      const it = window.prompt('新待办', '') || '';
      if (it.trim()) window.rt.todoAdd(name, it.trim());
    });
    el.querySelectorAll('li[data-item]').forEach(function(li){
      li.addEventListener('click', function(){
        const meta = window.__AI2__.nameMap[name];
        if (!meta) return;
        const it = li.getAttribute('data-item') || '';
        const done = splitCsv(meta.props.CheckedFromString);
        const idx = done.indexOf(it);
        if (idx >= 0) done.splice(idx, 1); else done.push(it);
        meta.props.Selection = it;
        window.rt.setProp(name, 'CheckedFromString', done.join(','));
        fire(name, 'AfterChecking');
      });
    });
  }
  function paintWeather(comp){
    const el = elByName(comp);
    const meta = window.__AI2__.nameMap[comp];
    if (!el || !meta) return;
    const wind = meta.props.WindSpeed ? (' · 风 '+meta.props.WindSpeed) : '';
    el.innerHTML = '<div style="font-size:13px;opacity:.9;">'+(meta.props.City || '城市')+'</div>'+
      '<div style="font-size:28px;font-weight:800;margin:4px 0;">'+(meta.props.Temperature == null || meta.props.Temperature === '' ? '--' : meta.props.Temperature)+'°</div>'+
      '<div style="font-size:13px;">'+(meta.props.WeatherText || '点击获取天气')+wind+'</div>';
  }
  function paintClockFace(comp){
    const el = elByName(comp);
    const meta = window.__AI2__.nameMap[comp];
    if (!el || !meta) return;
    const tz = meta.props.Timezone;
    const d = zonedDate(Date.now(), tz);
    const text = window.rt.formatTime(Date.now(), meta.props.Format || 'hh:mm:ss', tz);
    meta.props.Text = text;
    const color = String(meta.props.TextColor || '#69f0ae');
    el.style.color = color;
    if (String(meta.props.Style) === '指针') {
      const h = d.getHours() % 12;
      const m = d.getMinutes();
      const s = d.getSeconds();
      const ha = h * 30 + m * 0.5;
      const ma = m * 6;
      const sa = s * 6;
      el.style.padding = '0';
      el.style.height = '160px';
      el.innerHTML = '<div style="position:relative;width:140px;height:140px;margin:10px auto;border-radius:50%;border:4px solid '+color+';">'+
        '<div style="position:absolute;left:50%;bottom:50%;width:4px;height:32%;background:'+color+';transform-origin:bottom center;transform:translateX(-50%) rotate('+ha+'deg);border-radius:2px;"></div>'+
        '<div style="position:absolute;left:50%;bottom:50%;width:3px;height:40%;background:#80cbc4;transform-origin:bottom center;transform:translateX(-50%) rotate('+ma+'deg);border-radius:2px;"></div>'+
        '<div style="position:absolute;left:50%;bottom:50%;width:2px;height:44%;background:#ef9a9a;transform-origin:bottom center;transform:translateX(-50%) rotate('+sa+'deg);"></div>'+
        '<div style="position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:'+color+';"></div></div>'+
        '<div style="font-size:12px;padding-bottom:8px;">'+text+'</div>';
    } else {
      el.style.padding = '12px';
      el.style.height = '';
      el.textContent = text;
    }
  }

  function bindSensors(){
    Object.entries(window.__AI2__.nameMap).forEach(([name, meta]) => {
      if (meta.type === 'Clock' && meta.props.TimerEnabled) {
        timers.push(setInterval(() => fire(name, 'Timer'), Number(meta.props.TimerInterval)||1000));
      }
      if (meta.type === 'Alarm') {
        timers.push(setInterval(() => {
          if (!meta.props.Enabled) return;
          const now = new Date();
          const pad = function(n){ return String(n).padStart(2,'0'); };
          const hhmm = pad(now.getHours()) + ':' + pad(now.getMinutes());
          const want = String(meta.props.Time || '07:00').slice(0,5);
          const stamp = now.toDateString() + ' ' + want;
          if (hhmm === want && meta.props._lastFired !== stamp) {
            meta.props._lastFired = stamp;
            if (String(meta.props.Repeat) !== '每天') {
              meta.props.Enabled = false;
            }
            paintAlarm(name);
            beep();
            fire(name, 'AlarmFired');
            showToast((meta.props.Label || '闹钟') + ' ' + want);
          }
        }, 1000));
      }
      if (meta.type === 'Reminder') {
        timers.push(setInterval(() => {
          if (!meta.props.Enabled) return;
          const now = new Date();
          const pad = function(n){ return String(n).padStart(2,'0'); };
          const day = now.getFullYear() + '-' + pad(now.getMonth()+1) + '-' + pad(now.getDate());
          const hhmm = pad(now.getHours()) + ':' + pad(now.getMinutes());
          const wantD = String(meta.props.Date || day).slice(0,10);
          const wantT = String(meta.props.Time || '08:00').slice(0,5);
          const stamp = wantD + ' ' + wantT;
          if (day === wantD && hhmm === wantT && meta.props._lastFired !== stamp) {
            meta.props._lastFired = stamp;
            meta.props.Enabled = false;
            paintReminder(name);
            beep();
            fire(name, 'ReminderFired');
            showToast((meta.props.Label || '提醒') + ' ' + stamp);
          }
        }, 1000));
      }
      if (meta.type === 'ClockFace') {
        const tick = function(){ paintClockFace(name); };
        tick();
        timers.push(setInterval(tick, 1000));
      }
      if (meta.type === 'CompassView') {
        let lastHead = -999;
        let lastFire = 0;
        const onOrient = function(e){
          const heading = typeof e.webkitCompassHeading === 'number'
            ? e.webkitCompassHeading
            : (e.alpha == null ? 0 : (360 - e.alpha));
          const h = Math.round(heading);
          window.rt.setProp(name, 'Heading', h);
          const now = Date.now();
          if (Math.abs(h - lastHead) >= 2 && now - lastFire > 250) {
            lastHead = h;
            lastFire = now;
            fire(name, 'HeadingChanged');
          }
        };
        if (window.DeviceOrientationEvent) {
          window.addEventListener('deviceorientationabsolute', onOrient, true);
          window.addEventListener('deviceorientation', onOrient, true);
        } else showSensorHint('指南针需要真机方向传感器');
      }
      if (meta.type === 'AccelerometerSensor' && meta.props.Enabled) {
        if (!window.DeviceMotionEvent) showSensorHint('加速度传感器在此设备/浏览器不可用');
        else window.addEventListener('devicemotion', (e) => {
          const a = e.accelerationIncludingGravity; if (!a) return;
          meta.props.XAccel = a.x; meta.props.YAccel = a.y; meta.props.ZAccel = a.z;
          fire(name, 'AccelerationChanged');
        });
      }
      if (meta.type === 'OrientationSensor' && meta.props.Enabled) {
        if (!window.DeviceOrientationEvent) showSensorHint('方向传感器在此设备/浏览器不可用');
        else window.addEventListener('deviceorientation', (e) => {
          meta.props.Angle = e.alpha; meta.props.Roll = e.gamma; meta.props.Pitch = e.beta;
          fire(name, 'OrientationChanged');
        });
      }
      if (meta.type === 'LocationSensor' && meta.props.Enabled) {
        const applyLoc = function(coords){
          if (!coords) return;
          meta.props.Latitude = coords.latitude;
          meta.props.Longitude = coords.longitude;
          meta.props.Altitude = coords.altitude == null ? 0 : coords.altitude;
          meta.props.Accuracy = coords.accuracy == null ? 0 : coords.accuracy;
          meta.props.Speed = coords.speed == null ? 0 : coords.speed;
          fire(name, 'LocationChanged');
        };
        const startWatch = function(){
          const Geo = capPlugin('Geolocation');
          if (Geo && Geo.watchPosition) {
            Geo.watchPosition({ enableHighAccuracy: true }, function(pos, err){
              if (err || !pos) { showSensorHint('定位失败'); return; }
              applyLoc(pos.coords);
            }).catch(function(){ showSensorHint('定位权限被拒绝'); });
          } else if (!navigator.geolocation) {
            showSensorHint('定位传感器不可用');
          } else {
            navigator.geolocation.watchPosition(
              (pos) => { applyLoc(pos.coords); },
              () => showSensorHint('定位权限被拒绝或失败'),
              { enableHighAccuracy: true, maximumAge: 2000 }
            );
          }
        };
        askPermission('location', '需要使用定位', '应用想读取你的位置。机房可点允许，再用模拟器面板填经纬度。', startWatch, function(){
          showSensorHint('定位权限被拒绝');
        });
      }
      if (meta.type === 'Camera') {
        /* 非可见组件，由积木 takePicture 触发 */
      }
      if (meta.type === 'BatterySensor' && meta.props.Enabled) {
        if (navigator.getBattery) {
          navigator.getBattery().then(function(bat){
            const sync = function(){
              meta.props.Level = Math.round((bat.level || 0) * 100);
              meta.props.Charging = !!bat.charging;
              fire(name, 'LevelChanged');
            };
            sync();
            bat.addEventListener('levelchange', sync);
            bat.addEventListener('chargingchange', sync);
          }).catch(function(){ showSensorHint('电量接口不可用'); });
        } else showSensorHint('当前浏览器不支持电量传感器');
      }
      if (meta.type === 'NetworkSensor' && meta.props.Enabled) {
        const sync = function(){
          meta.props.Online = !!navigator.onLine;
          const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
          meta.props.ConnectionType = conn && (conn.effectiveType || conn.type) ? (conn.effectiveType || conn.type) : (navigator.onLine ? 'online' : 'offline');
          fire(name, 'StatusChanged');
        };
        sync();
        window.addEventListener('online', sync);
        window.addEventListener('offline', sync);
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn && conn.addEventListener) conn.addEventListener('change', sync);
      }
      if (meta.type === 'ShakeSensor' && meta.props.Enabled) {
        if (!window.DeviceMotionEvent) showSensorHint('摇一摇需要支持加速度的设备');
        else {
          let last = 0;
          window.addEventListener('devicemotion', function(e){
            const a = e.accelerationIncludingGravity; if (!a) return;
            const strength = Math.abs(a.x||0) + Math.abs(a.y||0) + Math.abs(a.z||0);
            const sens = Number(meta.props.Sensitivity) || 18;
            const now = Date.now();
            if (strength > sens && now - last > 800) {
              last = now;
              fire(name, 'Shaking');
            }
          });
        }
      }
      if (meta.type === 'GyroscopeSensor' && meta.props.Enabled) {
        if (!window.DeviceMotionEvent) showSensorHint('陀螺仪在此设备/浏览器不可用');
        else window.addEventListener('devicemotion', function(e){
          const r = e.rotationRate; if (!r) return;
          meta.props.XAngularVelocity = r.alpha == null ? 0 : r.alpha;
          meta.props.YAngularVelocity = r.beta == null ? 0 : r.beta;
          meta.props.ZAngularVelocity = r.gamma == null ? 0 : r.gamma;
          fire(name, 'GyroscopeChanged');
        });
      }
      if (meta.type === 'ProximitySensor' && meta.props.Enabled) {
        let bound = false;
        if ('onuserproximity' in window) {
          bound = true;
          window.addEventListener('userproximity', function(e){
            meta.props.Near = !!e.near;
            meta.props.Distance = e.near ? 0 : 5;
            fire(name, 'ProximityChanged');
          });
        }
        if (window.ProximitySensor) {
          try {
            const sensor = new window.ProximitySensor();
            sensor.addEventListener('reading', function(){
              meta.props.Distance = sensor.distance == null ? -1 : sensor.distance;
              meta.props.Near = !!sensor.near || (sensor.distance != null && sensor.distance < 5);
              fire(name, 'ProximityChanged');
            });
            sensor.start();
            bound = true;
          } catch (err) { /* ignore */ }
        }
        if (!bound) showSensorHint('接近传感器需支持该硬件的真机浏览器/APK');
      }
      if (meta.type === 'Pedometer' && meta.props.Enabled) {
        if (!window.DeviceMotionEvent) showSensorHint('计步器需要加速度传感器');
        else {
          let lastMag = 0;
          let lastStep = 0;
          let armed = true;
          window.addEventListener('devicemotion', function(e){
            const a = e.accelerationIncludingGravity || e.acceleration; if (!a) return;
            const mag = Math.sqrt((a.x||0)*(a.x||0)+(a.y||0)*(a.y||0)+(a.z||0)*(a.z||0));
            const sens = Number(meta.props.Sensitivity) || 11;
            const now = Date.now();
            if (armed && mag - lastMag > sens * 0.15 && mag > sens && now - lastStep > 280) {
              lastStep = now;
              armed = false;
              const steps = (Number(meta.props.Steps) || 0) + 1;
              meta.props.Steps = steps;
              fire(name, 'StepTaken');
            }
            if (mag < sens * 0.85) armed = true;
            lastMag = mag * 0.35 + lastMag * 0.65;
          });
        }
      }
      if (meta.type === 'LightSensor' && meta.props.Enabled) {
        let bound = false;
        if (window.AmbientLightSensor) {
          try {
            const sensor = new window.AmbientLightSensor();
            sensor.addEventListener('reading', function(){
              meta.props.Illuminance = sensor.illuminance == null ? 0 : sensor.illuminance;
              fire(name, 'LightChanged');
            });
            sensor.addEventListener('error', function(){ showSensorHint('光线传感器被拒绝或不可用'); });
            sensor.start();
            bound = true;
          } catch (err) { /* ignore */ }
        }
        if (!bound && 'ondevicelight' in window) {
          bound = true;
          window.addEventListener('devicelight', function(e){
            meta.props.Illuminance = e.value == null ? 0 : e.value;
            fire(name, 'LightChanged');
          });
        }
        if (!bound) showSensorHint('光线传感器需支持 Ambient Light 的浏览器/真机');
      }
      if (meta.type === 'MagneticFieldSensor' && meta.props.Enabled) {
        let bound = false;
        if (window.Magnetometer) {
          try {
            const sensor = new window.Magnetometer({ frequency: 10 });
            sensor.addEventListener('reading', function(){
              meta.props.MagX = sensor.x || 0;
              meta.props.MagY = sensor.y || 0;
              meta.props.MagZ = sensor.z || 0;
              fire(name, 'MagneticChanged');
            });
            sensor.start();
            bound = true;
          } catch (err) { /* ignore */ }
        }
        const onOrient = function(e){
          if (e.absolute || typeof e.webkitCompassHeading === 'number' || e.alpha != null) {
            const heading = typeof e.webkitCompassHeading === 'number'
              ? e.webkitCompassHeading
              : (e.alpha == null ? 0 : e.alpha);
            meta.props.AbsoluteHeading = heading;
            if (!bound || e.absolute) fire(name, 'MagneticChanged');
          }
        };
        if (window.DeviceOrientationEvent) {
          window.addEventListener('deviceorientationabsolute', onOrient, true);
          window.addEventListener('deviceorientation', onOrient, true);
          bound = true;
        }
        if (!bound) showSensorHint('磁场/指南针传感器不可用');
      }
    });
    if (isNative()) {
      showToast('真机模式已启用');
    }
  }

  function mountPayload(payload){
    clearTimers();
    listeners = {};
    sensorHints = [];
    banner.classList.remove('show');
    banner.textContent = '';
    document.title = payload.title;
    document.body.style.background = payload.bg;
    app.innerHTML = payload.body;
    window.__AI2__ = Object.assign(window.__AI2__ || {}, {
      screenName: payload.name,
      nameMap: payload.nameMap,
      dbNs: payload.dbNs,
    });
    window.rt = makeRt();
    bindUi();
    bindSensors();
    try {
      if (payload.advanced) {
        runSandboxed(payload.code, window.rt);
      } else {
        __ai2RestoreCtor();
        // eslint-disable-next-line no-new-func
        new Function('rt', payload.code || '')(window.rt);
      }
    } catch (err) {
      console.error(err);
      __ai2RestoreCtor();
      showToast((payload.advanced ? '脚本运行错误: ' : '积木运行错误: ') + err.message);
    }
  }

  function applySim(msg){
    if (!msg || msg.type !== 'ai2-sim') return;
    if (msg.sensor === 'netfail') {
      window.__AI2_NET_FAIL__ = msg.mode || 'ok';
      showToast(msg.mode === 'ok' ? '网络演练：正常' : ('网络演练：' + msg.mode));
      return;
    }
    if (msg.sensor === 'permission') {
      window.__AI2_PERMS__[msg.name] = !!msg.allow;
      showToast((msg.name === 'location' ? '定位' : msg.name === 'camera' ? '相机' : '通知') + (msg.allow ? '已允许' : '已拒绝'));
      return;
    }
    Object.entries(window.__AI2__.nameMap || {}).forEach(function(entry){
      const name = entry[0];
      const meta = entry[1];
      if (msg.sensor === 'shake' && meta.type === 'ShakeSensor') fire(name, 'Shaking');
      if (msg.sensor === 'location' && meta.type === 'LocationSensor') {
        if (window.__AI2_PERMS__.location === false) {
          showSensorHint('定位权限被拒绝');
          return;
        }
        window.__AI2_PERMS__.location = true;
        const lat = msg.value && msg.value.lat;
        const lng = msg.value && msg.value.lng;
        meta.props.Latitude = lat;
        meta.props.Longitude = lng;
        meta.props.Altitude = 0;
        meta.props.Accuracy = 5;
        meta.props.Speed = 0;
        fire(name, 'LocationChanged');
      }
      if (msg.sensor === 'light' && meta.type === 'LightSensor') {
        meta.props.Illuminance = Number(msg.value) || 0;
        fire(name, 'LightChanged');
      }
    });
  }
  window.addEventListener('message', function(e){
    if (e && e.data) applySim(e.data);
  });
  window.__AI2_MOUNT__ = mountPayload;
  if (window.__AI2_BOOT_PAYLOAD__) mountPayload(window.__AI2_BOOT_PAYLOAD__);
  try { parent.postMessage({ type: 'ai2-preview-ready' }, '*'); } catch(e){}
})();`
}

export function buildPreviewDocument(
  project: AiProject,
  screen: ScreenData,
  generatedCode: string,
  baseHref?: string,
  advanced = false,
): string {
  const payload = screenPayload(screen, generatedCode, advanced)
  const base = baseHref ? `<base href="${escapeHtml(baseHref)}"/>` : ''
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
${base}
<title>${escapeHtml(payload.title)}</title>
<style>${RUNTIME_STYLE}
html,body,*{user-select:none!important;-webkit-user-select:none!important;-webkit-touch-callout:none}
</style>
</head>
<body style="background:${payload.bg}">
<div class="sensor-banner" id="sensor-banner"></div>
<div class="app" id="app"></div>
<div class="toast" id="toast"></div>
<script>
window.__AI2__ = {
  projectName: ${jsonForScript(project.name)},
  screens: ${jsonForScript(project.screens.map((s) => s.name))}
};
window.__AI2_BOOT_PAYLOAD__ = ${jsonForScript(payload)};
${runtimeBootScript('iframe')}
</script>
</body>
</html>`
}

export function buildStandaloneDocument(
  project: AiProject,
  screenCodes: Record<string, string>,
): string {
  const payloads = project.screens.map((s) =>
    screenPayload(s, screenCodes[s.name] || '', Boolean(project.advancedMode)),
  )
  const start = payloads.find((p) => p.name === (project.screens.find((s) => s.id === project.activeScreenId)?.name)) ?? payloads[0]
  const byName = Object.fromEntries(payloads.map((p) => [p.name, p]))

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="mobile-web-app-capable" content="yes"/>
<title>${escapeHtml(project.name)}</title>
<link rel="manifest" href="./manifest.webmanifest"/>
<meta name="theme-color" content="#009688"/>
<style>${RUNTIME_STYLE}</style>
</head>
<body>
<div class="phone-shell">
<div class="sensor-banner" id="sensor-banner"></div>
<div class="app" id="app"></div>
<div class="toast" id="toast"></div>
</div>
<script>
window.__AI2__ = {
  projectName: ${jsonForScript(project.name)},
  screens: ${jsonForScript(project.screens.map((s) => s.name))}
};
const __SCREENS__ = ${jsonForScript(byName)};
window.__AI2_LOAD_SCREEN__ = function(name){
  const p = __SCREENS__[name];
  if (!p) { alert('屏幕不存在: '+name); return; }
  window.__AI2__.currentScreen = name;
  window.__AI2_MOUNT__(p);
};
${runtimeBootScript('standalone')}
window.__AI2_LOAD_SCREEN__(${jsonForScript(start.name)});
if('serviceWorker' in navigator && location.protocol!=='file:'){navigator.serviceWorker.register('./sw.js').catch(function(){})}
</script>
</body>
</html>`
}
