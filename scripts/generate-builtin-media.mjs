/**
 * Generate offline builtin media into public/media + src/project/builtinMedia.ts
 * Preview iframe uses <base href> so ./media/* resolves.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'media')
mkdirSync(outDir, { recursive: true })

/* ——— WAV ——— */
function wavBuffer(samples, sampleRate = 22050) {
  const numChannels = 1
  const bits = 16
  const blockAlign = (numChannels * bits) / 8
  const dataSize = samples.length * blockAlign
  const buf = Buffer.alloc(44 + dataSize)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(numChannels, 22)
  buf.writeUInt32LE(sampleRate, 24)
  buf.writeUInt32LE(sampleRate * blockAlign, 28)
  buf.writeUInt16LE(blockAlign, 32)
  buf.writeUInt16LE(bits, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    buf.writeInt16LE((s * 32767) | 0, 44 + i * 2)
  }
  return buf
}

function tone(freq, seconds, sampleRate = 22050, gain = 0.35) {
  const n = Math.floor(sampleRate * seconds)
  const samples = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate
    const env = Math.min(1, i / 200) * Math.min(1, (n - i) / 800)
    samples[i] = Math.sin(2 * Math.PI * freq * t) * gain * env
  }
  return samples
}

function mix(...parts) {
  const len = Math.max(...parts.map((p) => p.length))
  const out = new Float32Array(len)
  for (const p of parts) {
    for (let i = 0; i < p.length; i++) out[i] += p[i]
  }
  return out
}

function concat(...parts) {
  const len = parts.reduce((n, p) => n + p.length, 0)
  const out = new Float32Array(len)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

function noise(seconds, sampleRate = 22050, gain = 0.18) {
  const n = Math.floor(sampleRate * seconds)
  const samples = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const env = Math.min(1, i / 40) * Math.min(1, (n - i) / 80)
    samples[i] = (Math.random() * 2 - 1) * gain * env
  }
  return samples
}

/* ——— tiny PNG (legacy case paths) ——— */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function canvas(w, h, rgb) {
  const data = Buffer.alloc(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = rgb[0]
    data[i * 4 + 1] = rgb[1]
    data[i * 4 + 2] = rgb[2]
    data[i * 4 + 3] = 255
  }
  const set = (x, y, c) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return
    const i = (y * w + x) * 4
    data[i] = c[0]
    data[i + 1] = c[1]
    data[i + 2] = c[2]
    data[i + 3] = c[3] ?? 255
  }
  return {
    w,
    h,
    fill(x, y, rw, rh, c) {
      const x0 = Math.max(0, x | 0)
      const y0 = Math.max(0, y | 0)
      const x1 = Math.min(w, (x + rw) | 0)
      const y1 = Math.min(h, (y + rh) | 0)
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) set(xx, yy, c)
    },
    circle(cx, cy, r, c) {
      const r2 = r * r
      for (let yy = (cy - r) | 0; yy <= (cy + r) | 0; yy++) {
        for (let xx = (cx - r) | 0; xx <= (cx + r) | 0; xx++) {
          if ((xx - cx) * (xx - cx) + (yy - cy) * (yy - cy) <= r2) set(xx, yy, c)
        }
      }
    },
    png() {
      return encodePng(w, h, data)
    },
  }
}

function writeLegacyPngs() {
  const photo = canvas(320, 200, [79, 195, 247])
  photo.circle(250, 48, 28, [255, 224, 130])
  photo.fill(0, 130, 320, 70, [67, 160, 71])
  photo.fill(40, 90, 90, 60, [255, 255, 255])
  writeFileSync(join(outDir, 'photo.png'), photo.png())

  const sprite = canvas(64, 64, [255, 255, 255])
  sprite.circle(32, 32, 28, [255, 112, 67])
  sprite.circle(22, 26, 4, [255, 255, 255])
  sprite.circle(42, 26, 4, [255, 255, 255])
  sprite.fill(22, 40, 20, 3, [255, 255, 255])
  writeFileSync(join(outDir, 'sprite.png'), sprite.png())

  const avatar = canvas(96, 96, [126, 87, 194])
  avatar.circle(48, 38, 18, [255, 224, 178])
  avatar.circle(48, 78, 28, [255, 224, 178])
  avatar.circle(40, 36, 3, [93, 64, 55])
  avatar.circle(56, 36, 3, [93, 64, 55])
  writeFileSync(join(outDir, 'avatar.png'), avatar.png())

  const banner = canvas(360, 120, [38, 50, 56])
  banner.circle(300, 60, 26, [255, 138, 101])
  banner.fill(292, 48, 8, 24, [255, 255, 255])
  writeFileSync(join(outDir, 'banner.png'), banner.png())

  const poster = canvas(320, 180, [17, 17, 17])
  poster.fill(20, 20, 280, 140, [55, 71, 79])
  poster.fill(140, 70, 20, 60, [128, 222, 234])
  writeFileSync(join(outDir, 'poster.png'), poster.png())
}

const svgs = {
  photo: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4fc3f7"/><stop offset="1" stop-color="#0288d1"/></linearGradient></defs>
  <rect width="320" height="200" fill="url(#g)"/>
  <circle cx="250" cy="48" r="28" fill="#ffe082"/>
  <rect x="0" y="130" width="320" height="70" fill="#43a047"/>
  <rect x="40" y="90" width="90" height="60" rx="6" fill="#fff" opacity=".92"/>
  <text x="46" y="125" font-family="Segoe UI,sans-serif" font-size="22" fill="#01579b">Mixly</text>
  <text x="16" y="188" font-family="Segoe UI,sans-serif" font-size="14" fill="#e8f5e9">课堂示例图</text>
</svg>`,
  sprite: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="28" fill="#ff7043" stroke="#bf360c" stroke-width="3"/>
  <circle cx="22" cy="26" r="4" fill="#fff"/><circle cx="42" cy="26" r="4" fill="#fff"/>
  <path d="M22 40 Q32 50 42 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
</svg>`,
  avatar: `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <circle cx="48" cy="48" r="46" fill="#26a69a"/>
  <circle cx="48" cy="38" r="18" fill="#ffe0b2"/>
  <ellipse cx="48" cy="78" rx="28" ry="18" fill="#ffe0b2"/>
  <circle cx="40" cy="36" r="3" fill="#5d4037"/><circle cx="56" cy="36" r="3" fill="#5d4037"/>
  <path d="M40 46 Q48 52 56 46" fill="none" stroke="#5d4037" stroke-width="2"/>
</svg>`,
  banner: `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="120" viewBox="0 0 360 120">
  <rect width="360" height="120" rx="12" fill="#00695c"/>
  <text x="24" y="52" font-family="Segoe UI,sans-serif" font-size="28" fill="#e0f2f1">媒体资源</text>
  <text x="24" y="88" font-family="Segoe UI,sans-serif" font-size="16" fill="#80cbc4">图片 · 音频 · 视频 可直接用</text>
  <circle cx="300" cy="60" r="26" fill="#ff8a65"/>
  <polygon points="292,48 292,72 314,60" fill="#fff"/>
</svg>`,
  poster: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
  <rect width="320" height="180" fill="#111"/>
  <rect x="20" y="20" width="280" height="140" rx="8" fill="#37474f"/>
  <polygon points="140,70 140,130 200,100" fill="#80deea"/>
  <text x="24" y="168" font-family="Segoe UI,sans-serif" font-size="13" fill="#90a4ae">短视频封面</text>
</svg>`,
  bg_sky: `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" viewBox="0 0 360 240">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#81d4fa"/><stop offset="1" stop-color="#e1f5fe"/></linearGradient></defs>
  <rect width="360" height="240" fill="url(#sky)"/>
  <circle cx="300" cy="48" r="26" fill="#fff59d"/>
  <ellipse cx="70" cy="70" rx="36" ry="16" fill="#fff" opacity=".9"/>
  <ellipse cx="100" cy="70" rx="22" ry="12" fill="#fff" opacity=".9"/>
  <ellipse cx="200" cy="50" rx="40" ry="14" fill="#fff" opacity=".85"/>
</svg>`,
  bg_campus: `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" viewBox="0 0 360 240">
  <rect width="360" height="240" fill="#c8e6c9"/>
  <rect x="0" y="160" width="360" height="80" fill="#81c784"/>
  <rect x="40" y="70" width="120" height="100" fill="#fff8e1" stroke="#8d6e63" stroke-width="3"/>
  <polygon points="40,70 100,28 160,70" fill="#ef9a9a"/>
  <rect x="88" y="120" width="28" height="50" fill="#6d4c41"/>
  <rect x="200" y="90" width="100" height="80" fill="#bbdefb" stroke="#1565c0" stroke-width="3"/>
  <rect x="230" y="130" width="24" height="40" fill="#1565c0"/>
  <circle cx="300" cy="50" r="18" fill="#ffeb3b"/>
</svg>`,
  bg_night: `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" viewBox="0 0 360 240">
  <defs><linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#0d1b2a"/><stop offset="1" stop-color="#1b3a4b"/></linearGradient></defs>
  <rect width="360" height="240" fill="url(#night)"/>
  <circle cx="80" cy="50" r="22" fill="#eceff1"/>
  <circle cx="160" cy="30" r="2" fill="#fff"/><circle cx="220" cy="60" r="1.6" fill="#fff"/>
  <circle cx="280" cy="40" r="2" fill="#fff"/><circle cx="40" cy="90" r="1.4" fill="#fff"/>
  <circle cx="310" cy="100" r="1.8" fill="#fff"/>
  <rect x="0" y="170" width="360" height="70" fill="#102a27"/>
</svg>`,
  icon_star: `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="16" fill="#fff8e1"/>
  <path d="M48 14l9 22h24l-19 14 7 22-21-14-21 14 7-22-19-14h24z" fill="#f9a825"/>
</svg>`,
  icon_heart: `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="16" fill="#fce4ec"/>
  <path d="M48 78s-24-16-32-30c-6-10 0-22 12-22 8 0 14 6 20 12 6-6 12-12 20-12 12 0 18 12 12 22-8 14-32 30-32 30z" fill="#e53935"/>
</svg>`,
  icon_check: `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="16" fill="#e8f5e9"/>
  <circle cx="48" cy="48" r="28" fill="#43a047"/>
  <path d="M34 48l10 10 18-20" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
  icon_coin: `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="16" fill="#fffde7"/>
  <circle cx="48" cy="48" r="28" fill="#fbc02d" stroke="#f57f17" stroke-width="4"/>
  <text x="48" y="58" text-anchor="middle" font-size="28" font-weight="700" fill="#f57f17">分</text>
</svg>`,
  icon_tree: `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="16" fill="#e8f5e9"/>
  <rect x="43" y="58" width="10" height="22" fill="#6d4c41"/>
  <circle cx="48" cy="40" r="22" fill="#43a047"/>
  <circle cx="34" cy="48" r="14" fill="#66bb6a"/>
  <circle cx="62" cy="48" r="14" fill="#2e7d32"/>
</svg>`,
  icon_cat: `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="16" fill="#fff3e0"/>
  <circle cx="48" cy="54" r="22" fill="#ffb74d"/>
  <polygon points="28,42 32,20 44,40" fill="#ffb74d"/>
  <polygon points="68,42 64,20 52,40" fill="#ffb74d"/>
  <circle cx="40" cy="52" r="3" fill="#5d4037"/><circle cx="56" cy="52" r="3" fill="#5d4037"/>
  <ellipse cx="48" cy="60" rx="4" ry="3" fill="#e65100"/>
</svg>`,
  icon_ball: `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="16" fill="#e3f2fd"/>
  <circle cx="48" cy="48" r="26" fill="#1e88e5"/>
  <path d="M22 48h52M48 22v52M30 30c12 8 24 8 36 0M30 66c12-8 24-8 36 0" fill="none" stroke="#fff" stroke-width="3"/>
</svg>`,
  icon_flag: `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="16" fill="#eceff1"/>
  <rect x="28" y="18" width="6" height="62" fill="#546e7a"/>
  <polygon points="34,20 74,34 34,48" fill="#e53935"/>
</svg>`,
  icon_trophy: `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="16" fill="#fff8e1"/>
  <path d="M30 28h36v16c0 12-8 20-18 20s-18-8-18-20V28z" fill="#fbc02d"/>
  <path d="M30 32h-10c0 10 6 16 12 16M66 32h10c0 10-6 16-12 16" fill="none" stroke="#f9a825" stroke-width="4"/>
  <rect x="40" y="64" width="16" height="8" fill="#f57f17"/>
  <rect x="34" y="72" width="28" height="6" rx="2" fill="#ef6c00"/>
</svg>`,
  icon_plant: `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="16" fill="#e0f2f1"/>
  <rect x="36" y="58" width="24" height="22" rx="3" fill="#8d6e63"/>
  <path d="M48 58c0-18-14-28-14-28s8 4 14 14c6-10 14-14 14-14s-14 10-14 28z" fill="#43a047"/>
</svg>`,
  icon_book: `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="16" fill="#e3f2fd"/>
  <rect x="22" y="24" width="52" height="50" rx="4" fill="#1565c0"/>
  <rect x="28" y="30" width="40" height="38" fill="#e3f2fd"/>
  <rect x="32" y="36" width="32" height="4" fill="#90caf9"/>
  <rect x="32" y="46" width="24" height="4" fill="#90caf9"/>
</svg>`,
  btn_play: `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <circle cx="48" cy="48" r="40" fill="#009688"/>
  <polygon points="40,30 40,66 70,48" fill="#fff"/>
</svg>`,
}

for (const [name, svg] of Object.entries(svgs)) {
  writeFileSync(join(outDir, `${name}.svg`), svg)
}
writeLegacyPngs()

writeFileSync(join(outDir, 'beep.wav'), wavBuffer(tone(880, 0.28)))
writeFileSync(
  join(outDir, 'chime.wav'),
  wavBuffer(mix(tone(523.25, 0.35, 22050, 0.28), tone(659.25, 0.35, 22050, 0.22), tone(783.99, 0.45, 22050, 0.18))),
)
writeFileSync(join(outDir, 'pop.wav'), wavBuffer(tone(320, 0.12, 22050, 0.4)))
writeFileSync(join(outDir, 'click.wav'), wavBuffer(mix(tone(1200, 0.05, 22050, 0.22), noise(0.05, 22050, 0.12))))
writeFileSync(join(outDir, 'fail.wav'), wavBuffer(concat(tone(392, 0.16, 22050, 0.3), tone(294, 0.28, 22050, 0.28))))
writeFileSync(
  join(outDir, 'coin.wav'),
  wavBuffer(concat(tone(988, 0.08, 22050, 0.3), tone(1319, 0.16, 22050, 0.26))),
)
writeFileSync(
  join(outDir, 'win.wav'),
  wavBuffer(
    concat(tone(523, 0.12, 22050, 0.26), tone(659, 0.12, 22050, 0.26), tone(784, 0.12, 22050, 0.26), tone(1047, 0.28, 22050, 0.3)),
  ),
)
writeFileSync(join(outDir, 'alarm.wav'), wavBuffer(concat(tone(880, 0.14, 22050, 0.28), tone(698, 0.14, 22050, 0.28), tone(880, 0.18, 22050, 0.28))))

async function ensureMp4() {
  const local = join(outDir, 'clip.mp4')
  if (existsSync(local) && readFileSync(local).length > 1000) {
    console.log('mp4 bytes', readFileSync(local).length)
    return true
  }
  try {
    const res = await fetch('https://www.w3schools.com/html/mov_bbb.mp4')
    if (!res.ok) return false
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 1000) return false
    writeFileSync(local, buf)
    console.log('downloaded mp4 bytes', buf.length)
    return true
  } catch (e) {
    console.warn('mp4 download failed', e)
    return false
  }
}

const hasVideo = await ensureMp4()

const items = [
  { key: 'photo', name: '内置·校园风景.svg', mime: 'image/svg+xml', path: './media/photo.svg' },
  { key: 'sprite', name: '内置·笑脸精灵.svg', mime: 'image/svg+xml', path: './media/sprite.svg' },
  { key: 'avatar', name: '内置·同学头像.svg', mime: 'image/svg+xml', path: './media/avatar.svg' },
  { key: 'banner', name: '内置·横幅.svg', mime: 'image/svg+xml', path: './media/banner.svg' },
  { key: 'poster', name: '内置·视频封面.svg', mime: 'image/svg+xml', path: './media/poster.svg' },
  { key: 'bg_sky', name: '内置·天空背景.svg', mime: 'image/svg+xml', path: './media/bg_sky.svg' },
  { key: 'bg_campus', name: '内置·校园背景.svg', mime: 'image/svg+xml', path: './media/bg_campus.svg' },
  { key: 'bg_night', name: '内置·夜空背景.svg', mime: 'image/svg+xml', path: './media/bg_night.svg' },
  { key: 'icon_star', name: '内置·星星.svg', mime: 'image/svg+xml', path: './media/icon_star.svg' },
  { key: 'icon_heart', name: '内置·爱心.svg', mime: 'image/svg+xml', path: './media/icon_heart.svg' },
  { key: 'icon_check', name: '内置·对勾.svg', mime: 'image/svg+xml', path: './media/icon_check.svg' },
  { key: 'icon_coin', name: '内置·金币.svg', mime: 'image/svg+xml', path: './media/icon_coin.svg' },
  { key: 'icon_tree', name: '内置·小树.svg', mime: 'image/svg+xml', path: './media/icon_tree.svg' },
  { key: 'icon_cat', name: '内置·小猫.svg', mime: 'image/svg+xml', path: './media/icon_cat.svg' },
  { key: 'icon_ball', name: '内置·皮球.svg', mime: 'image/svg+xml', path: './media/icon_ball.svg' },
  { key: 'icon_flag', name: '内置·旗帜.svg', mime: 'image/svg+xml', path: './media/icon_flag.svg' },
  { key: 'icon_trophy', name: '内置·奖杯.svg', mime: 'image/svg+xml', path: './media/icon_trophy.svg' },
  { key: 'icon_plant', name: '内置·盆栽.svg', mime: 'image/svg+xml', path: './media/icon_plant.svg' },
  { key: 'icon_book', name: '内置·书本.svg', mime: 'image/svg+xml', path: './media/icon_book.svg' },
  { key: 'btn_play', name: '内置·播放钮.svg', mime: 'image/svg+xml', path: './media/btn_play.svg' },
  { key: 'beep', name: '内置·提示音.wav', mime: 'audio/wav', path: './media/beep.wav' },
  { key: 'chime', name: '内置·成功音.wav', mime: 'audio/wav', path: './media/chime.wav' },
  { key: 'pop', name: '内置·轻点音.wav', mime: 'audio/wav', path: './media/pop.wav' },
  { key: 'click', name: '内置·点击音.wav', mime: 'audio/wav', path: './media/click.wav' },
  { key: 'fail', name: '内置·失败音.wav', mime: 'audio/wav', path: './media/fail.wav' },
  { key: 'coin', name: '内置·得分音.wav', mime: 'audio/wav', path: './media/coin.wav' },
  { key: 'win', name: '内置·胜利音.wav', mime: 'audio/wav', path: './media/win.wav' },
  { key: 'alarm', name: '内置·闹钟音.wav', mime: 'audio/wav', path: './media/alarm.wav' },
  { key: 'video', name: '内置·短视频.mp4', mime: 'video/mp4', path: hasVideo ? './media/clip.mp4' : './media/poster.svg' },
]

const mediaObj = items.map((it) => `  ${it.key}: '${it.path}',`).join('\n')
const itemList = items
  .map((it) => `    { name: '${it.name}', mime: '${it.mime}', key: '${it.key}' },`)
  .join('\n')

const ts = `/* Auto-generated by scripts/generate-builtin-media.mjs — do not edit by hand. */
import type { ProjectAsset } from './types'

/** Paths under Vite public/ (resolved via preview <base href>). */
export const BUILTIN_MEDIA = {
${mediaObj}
} as const

export type BuiltinMediaKey = keyof typeof BUILTIN_MEDIA

const ASSET_META: Array<{ name: string; mime: string; key: BuiltinMediaKey }> = [
${itemList}
]

/** Default media pack attached to every builtin template. */
export function createBuiltinProjectAssets(): ProjectAsset[] {
  const now = Date.now()
  return ASSET_META.map((it, i) => ({
    id: \`builtin_\${it.key}\`,
    name: it.name,
    mime: it.mime,
    dataUrl: BUILTIN_MEDIA[it.key],
    createdAt: now + i,
  }))
}

/** 旧工程补上新内置资源，不覆盖学生自己上传的。 */
export function mergeBuiltinAssets(assets: ProjectAsset[]): ProjectAsset[] {
  const pack = createBuiltinProjectAssets()
  const ids = new Set(assets.map((a) => a.id))
  const urls = new Set(assets.map((a) => a.dataUrl))
  const extra = pack.filter((b) => !ids.has(b.id) && !urls.has(b.dataUrl))
  return extra.length ? [...assets, ...extra] : assets
}

export function isBuiltinAssetId(id: string): boolean {
  return id.startsWith('builtin_')
}
`

writeFileSync(join(root, 'src', 'project', 'builtinMedia.ts'), ts)
console.log('Wrote', Object.keys(svgs).length, 'svg + wav/png pack')
