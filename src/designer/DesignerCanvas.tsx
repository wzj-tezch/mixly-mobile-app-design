import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ComponentNode } from '@/project/types'
import { useProjectStore } from '@/project/store'
import { getMeta } from '@/components/registry'
import { buildPreviewDocument } from '@/runtime/previewDoc'
import { getScreenRuntimePlan } from '@/blocks/codegen'
import { PhoneFrame } from '@/designer/PhoneFrame'
import { SimulatorPanel, type SimMessage } from '@/app/SimulatorPanel'
import { MixlyTrashCan } from '@/designer/MixlyTrashCan'

function DndNode({ node, children }: { node: ComponentNode; children: ReactNode }) {
  const isRoot = node.name === 'ScreenRoot'
  const [over, setOver] = useState(false)
  return (
    <div
      className={`d-dnd${isRoot ? ' is-root' : ''}${over ? ' is-over' : ''}`}
      data-node-id={node.id}
      draggable={!isRoot}
      onDragStart={(e) => {
        if (isRoot) return
        e.stopPropagation()
        e.dataTransfer.setData('componentId', node.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setOver(false)
        const id = e.dataTransfer.getData('componentId')
        const type = e.dataTransfer.getData('componentType')
        if (id && id !== node.id) useProjectStore.getState().moveComponent(id, node.id)
        else if (!id && type) useProjectStore.getState().addComponent(type as never, node.id)
      }}
    >
      {children}
    </div>
  )
}

function DesignerNode(props: {
  node: ComponentNode
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <DndNode node={props.node}>
      <DesignerNodeVisual {...props} />
    </DndNode>
  )
}

function DesignerNodeVisual({
  node,
  selectedId,
  onSelect,
}: {
  node: ComponentNode
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const meta = getMeta(node.type)
  const selected = selectedId === node.id
  const p = node.props

  const style: React.CSSProperties = {
    outline: selected ? '2px solid #009688' : '1px dashed transparent',
    outlineOffset: 2,
    margin: '4px 0',
    cursor: 'pointer',
    width: p.Width === '填满父组件' ? '100%' : undefined,
    userSelect: 'none',
    WebkitUserSelect: 'none',
  }

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(node.id)
  }

  if (meta.isContainer) {
    const isScroll = node.type === 'ScrollArrangement'
    const isCard = node.type === 'Card'
    const isPlay = !!p.IsPlayField
    return (
      <div
        className={`d-node container ${node.type}`}
        style={{
          ...style,
          display: isPlay ? 'block' : node.type === 'TableArrangement' ? 'grid' : 'flex',
          flexDirection: node.type === 'HorizontalArrangement' ? 'row' : 'column',
          gridTemplateColumns: node.type === 'TableArrangement' ? `repeat(${Number(p.Columns) || 2}, 1fr)` : undefined,
          gap: isPlay ? 0 : 8,
          position: isPlay ? 'relative' : undefined,
          background: String(p.BackgroundColor || (isCard ? '#fff' : isPlay ? '#e8f5e9' : 'transparent')),
          minHeight: isScroll ? Number(p.Height) || 220 : isPlay ? Number(p.Height) || 200 : 40,
          height: isScroll || isPlay ? Number(p.Height) || (isPlay ? 200 : 220) : undefined,
          overflow: isScroll || isPlay ? 'hidden' : undefined,
          padding: isCard ? '0 0 8px' : isPlay ? 0 : 6,
          border: isCard ? '1px solid #dadce0' : isPlay ? '2px dashed #90a4ae' : '1px dashed #c5c9d0',
          borderRadius: isCard ? 12 : isPlay ? 12 : 6,
          boxShadow: isCard ? '0 1px 4px rgba(0,0,0,0.06)' : undefined,
        }}
        onClick={onClick}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const id = e.dataTransfer.getData('componentId')
          const type = e.dataTransfer.getData('componentType')
          if (id && id !== node.id) useProjectStore.getState().moveComponent(id, node.id)
          else if (!id && type) useProjectStore.getState().addComponent(type as never, node.id)
        }}
      >
        {isCard ? (
          <div style={{ padding: '8px 10px', marginBottom: 4, borderBottom: '1px solid #eee', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            {String(p.Title || '卡片')}
          </div>
        ) : (
          <div className="d-tag">{isPlay ? '游戏场地' : meta.label}</div>
        )}
        {node.children.map((c) => (
          <div key={c.id} style={{ padding: isCard ? '0 8px' : undefined, ...(isPlay ? {} : {}) }}>
            <DesignerNode node={c} selectedId={selectedId} onSelect={onSelect} />
          </div>
        ))}
      </div>
    )
  }

  switch (node.type) {
    case 'Button':
      return (
        <button
          type="button"
          style={{ ...style, background: String(p.BackgroundColor), color: String(p.TextColor), border: 'none', borderRadius: 8, padding: '8px 12px' }}
          onClick={onClick}
        >
          {String(p.Text)}
        </button>
      )
    case 'Label':
      return (
        <div style={{ ...style, color: String(p.TextColor), fontSize: Number(p.FontSize) || 14 }} onClick={onClick}>
          {String(p.Text)}
        </div>
      )
    case 'TextBox':
      return (
        <input
          style={{ ...style, width: '100%', padding: 8, borderRadius: 6, border: '1px solid #dadce0' }}
          readOnly
          placeholder={String(p.Hint ?? '')}
          value={String(p.Text ?? '')}
          onClick={onClick}
        />
      )
    case 'PasswordTextBox':
      return (
        <input
          type="password"
          style={{ ...style, width: '100%', padding: 8, borderRadius: 6, border: '1px solid #dadce0' }}
          readOnly
          placeholder={String(p.Hint ?? '')}
          value={String(p.Text ?? '')}
          onClick={onClick}
        />
      )
    case 'CheckBox':
      return (
        <label style={{ ...style, display: 'flex', gap: 6, alignItems: 'center' }} onClick={onClick}>
          <input type="checkbox" checked={!!p.Checked} readOnly /> {String(p.Text)}
        </label>
      )
    case 'Switch':
      return (
        <label style={{ ...style, display: 'flex', gap: 6, alignItems: 'center' }} onClick={onClick}>
          <input type="checkbox" checked={!!p.On} readOnly /> {String(p.Text)}
        </label>
      )
    case 'Slider':
      return (
        <input
          type="range"
          style={{ ...style, width: '100%' }}
          min={Number(p.MinValue)}
          max={Number(p.MaxValue)}
          value={Number(p.ThumbPosition)}
          readOnly
          onClick={onClick}
        />
      )
    case 'Spinner': {
      const items = String(p.ElementsFromString || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
      return (
        <select style={{ ...style, width: '100%', padding: 8 }} value={String(p.Selection || items[0] || '')} onClick={onClick} onChange={() => {}}>
          {items.map((it) => (
            <option key={it} value={it}>
              {it}
            </option>
          ))}
        </select>
      )
    }
    case 'DatePicker':
      return <input type="date" style={{ ...style, width: '100%', padding: 8 }} value={String(p.Date || '')} readOnly onClick={onClick} />
    case 'TimePicker':
      return <input type="time" style={{ ...style, width: '100%', padding: 8 }} value={String(p.Time || '')} readOnly onClick={onClick} />
    case 'Image':
      return (
        <img
          alt=""
          src={String(p.Picture || './media/photo.png')}
          style={{ ...style, width: Number(p.Width) || 120, height: Number(p.Height) || 80, objectFit: 'cover', borderRadius: 6 }}
          onClick={onClick}
        />
      )
    case 'ListView':
      return (
        <ul
          style={{
            ...style,
            listStyle: 'none',
            padding: 0,
            border: '1px solid #dadce0',
            borderRadius: 8,
            maxHeight: Number(p.Height) || 160,
            overflow: 'auto',
          }}
          onClick={onClick}
        >
          {String(p.ElementsFromString || '')
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
            .map((it) => (
              <li key={it} style={{ padding: '8px 10px', borderBottom: '1px solid #eee' }}>
                {it}
              </li>
            ))}
        </ul>
      )
    case 'Canvas':
      return <div style={{ ...style, height: Number(p.Height) || 200, background: String(p.BackgroundColor), borderRadius: 8 }} onClick={onClick} />
    case 'Ball': {
      const r = Number(p.Radius) || 16
      return (
        <div
          style={{
            ...style,
            position: 'absolute',
            left: Number(p.X) || 0,
            top: Number(p.Y) || 0,
            width: r * 2,
            height: r * 2,
            borderRadius: '50%',
            background: String(p.PaintColor || '#009688'),
            zIndex: 2,
            boxShadow: '0 2px 6px rgba(0,0,0,.2)',
          }}
          onClick={onClick}
        />
      )
    }
    case 'ImageSprite':
      return (
        <img
          alt=""
          src={String(p.Picture || './media/sprite.png')}
          style={{
            ...style,
            position: 'absolute',
            left: Number(p.X) || 0,
            top: Number(p.Y) || 0,
            width: Number(p.Width) || 64,
            height: Number(p.Height) || 64,
            objectFit: 'contain',
            zIndex: 2,
          }}
          onClick={onClick}
        />
      )
    case 'WebViewer':
      return (
        <div
          style={{
            ...style,
            height: Number(p.Height) || 160,
            border: '1px solid #dadce0',
            borderRadius: 8,
            padding: 8,
            fontSize: 12,
            color: '#5f6368',
            background: '#f8fafc',
          }}
          onClick={onClick}
        >
          网页浏览 · {String(p.HomeUrl || '内置起始页（避免 example.com / iana.org 拒连）')}
        </div>
      )
    case 'Player':
      return (
        <div style={{ ...style, padding: 8, border: '1px solid #dadce0', borderRadius: 8, fontSize: 12 }} onClick={onClick}>
          ▶ 播放器 · {String(p.Source || '未设置音频')}
        </div>
      )
    case 'VideoPlayer':
      return (
        <div
          style={{
            ...style,
            height: Number(p.Height) || 160,
            border: '1px solid #dadce0',
            borderRadius: 8,
            padding: 8,
            fontSize: 12,
            background: '#111',
            color: '#eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={onClick}
        >
          ▶ 视频 · {String(p.Source || '未设置视频')}
        </div>
      )
    case 'RatingBar':
      return (
        <div style={{ ...style, display: 'flex', gap: 4, alignItems: 'center', fontSize: 18, color: '#f9a825' }} onClick={onClick}>
          {'★'.repeat(Math.max(0, Math.min(Number(p.MaxRating) || 5, Number(p.Rating) || 0)))}
          {'☆'.repeat(Math.max(0, (Number(p.MaxRating) || 5) - (Number(p.Rating) || 0)))}
        </div>
      )
    case 'Dice': {
      const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
      const r = Math.max(1, Math.min(6, Number(p.Result) || 1))
      return (
        <div
          style={{
            ...style,
            width: 64,
            height: 64,
            borderRadius: 12,
            background: '#fff',
            border: '2px solid #009688',
            display: 'grid',
            placeItems: 'center',
            fontSize: 36,
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          }}
          onClick={onClick}
        >
          {faces[r - 1]}
        </div>
      )
    }
    case 'Marquee':
      return (
        <div
          style={{
            ...style,
            width: '100%',
            height: Number(p.Height) || 36,
            overflow: 'hidden',
            borderRadius: 8,
            background: String(p.BackgroundColor || '#e0f2f1'),
            color: String(p.TextColor || '#009688'),
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
          onClick={onClick}
        >
          {String(p.Text || '走马灯文字')}
        </div>
      )
    case 'ColorPicker':
      return (
        <div style={{ ...style, display: 'flex', alignItems: 'center', gap: 8 }} onClick={onClick}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: String(p.Color || '#009688'),
              border: '1px solid #dadce0',
            }}
          />
          <span style={{ fontSize: 12, color: '#5f6368' }}>{String(p.Color || '#009688')}</span>
        </div>
      )
    case 'Countdown':
      return (
        <div
          style={{
            ...style,
            width: '100%',
            textAlign: 'center',
            fontSize: Number(p.FontSize) || 28,
            fontWeight: 700,
            color: String(p.TextColor || '#c62828'),
            fontVariantNumeric: 'tabular-nums',
          }}
          onClick={onClick}
        >
          {String(p.Remaining ?? p.Seconds ?? 10)}
        </div>
      )
    case 'Stopwatch':
      return (
        <div
          style={{
            ...style,
            width: '100%',
            textAlign: 'center',
            fontSize: Number(p.FontSize) || 28,
            fontWeight: 700,
            color: String(p.TextColor || '#1565c0'),
            fontVariantNumeric: 'tabular-nums',
          }}
          onClick={onClick}
        >
          {Number(p.Elapsed || 0).toFixed(1)}s
        </div>
      )
    case 'QRCode':
      return (
        <div
          style={{
            ...style,
            width: Number(p.Size) || 140,
            height: Number(p.Size) || 140,
            border: '1px dashed #dadce0',
            borderRadius: 8,
            display: 'grid',
            placeItems: 'center',
            fontSize: 12,
            color: '#5f6368',
            background: '#fafafa',
          }}
          onClick={onClick}
        >
          二维码预览
        </div>
      )
    case 'Joystick':
      return (
        <div
          style={{
            ...style,
            width: Number(p.Size) || 120,
            height: Number(p.Size) || 120,
            borderRadius: '50%',
            background: '#eceff1',
            border: '2px solid #90a4ae',
            position: 'relative',
          }}
          onClick={onClick}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#009688',
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      )
    case 'ChatBubble': {
      const right = String(p.Side) === '右'
      return (
        <div
          style={{
            ...style,
            width: '100%',
            display: 'flex',
            justifyContent: right ? 'flex-end' : 'flex-start',
          }}
          onClick={onClick}
        >
          <div
            style={{
              maxWidth: '85%',
              padding: '8px 12px',
              borderRadius: right ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
              background: String(p.BackgroundColor || '#e0f2f1'),
              color: String(p.TextColor || '#202124'),
              fontSize: Number(p.FontSize) || 14,
            }}
          >
            {String(p.Text || '')}
          </div>
        </div>
      )
    }
    case 'TextArea':
      return (
        <textarea
          style={{ ...style, width: '100%', height: Number(p.Height) || 96, padding: 8, borderRadius: 6, border: '1px solid #dadce0', resize: 'none' }}
          readOnly
          placeholder={String(p.Hint ?? '')}
          value={String(p.Text ?? '')}
          onClick={onClick}
        />
      )
    case 'NumberBox':
      return (
        <input
          type="number"
          style={{ ...style, width: '100%', padding: 8, borderRadius: 6, border: '1px solid #dadce0' }}
          readOnly
          value={String(p.Text ?? '')}
          onClick={onClick}
        />
      )
    case 'Hyperlink':
      return (
        <span style={{ ...style, color: String(p.TextColor || '#1565c0'), fontSize: Number(p.FontSize) || 14, textDecoration: 'underline' }} onClick={onClick}>
          {String(p.Text || '链接')}
        </span>
      )
    case 'Divider':
      return <div style={{ ...style, width: '100%', height: Number(p.Thickness) || 1, background: String(p.Color || '#dadce0'), margin: '8px 0' }} onClick={onClick} />
    case 'Spacer':
      return <div style={{ ...style, width: '100%', height: Number(p.Height) || 16 }} onClick={onClick} />
    case 'Badge':
      return (
        <span
          style={{
            ...style,
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 999,
            background: String(p.BackgroundColor || '#e53935'),
            color: String(p.TextColor || '#fff'),
            fontSize: Number(p.FontSize) || 12,
            fontWeight: 700,
          }}
          onClick={onClick}
        >
          {String(p.Text || '')}
        </span>
      )
    case 'Stepper':
      return (
        <div style={{ ...style, display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #dadce0', borderRadius: 8, padding: 4 }} onClick={onClick}>
          <span style={{ width: 28, textAlign: 'center' }}>−</span>
          <strong>{Number(p.Value) || 0}</strong>
          <span style={{ width: 28, textAlign: 'center' }}>＋</span>
        </div>
      )
    case 'RadioButton':
      return (
        <label style={{ ...style, display: 'flex', gap: 6, alignItems: 'center' }} onClick={onClick}>
          <input type="radio" checked={!!p.Checked} readOnly /> {String(p.Text)}
        </label>
      )
    case 'SearchBar':
      return (
        <input
          type="search"
          style={{ ...style, width: '100%', padding: 8, borderRadius: 20, border: '1px solid #dadce0' }}
          readOnly
          placeholder={String(p.Hint ?? '搜索…')}
          value={String(p.Text ?? '')}
          onClick={onClick}
        />
      )
    case 'ToggleButton':
      return (
        <button
          type="button"
          style={{
            ...style,
            background: p.Checked ? String(p.BackgroundColor || '#009688') : '#eceff1',
            color: p.Checked ? String(p.TextColor || '#fff') : '#5f6368',
            border: 'none',
            borderRadius: 8,
            padding: '8px 12px',
          }}
          onClick={onClick}
        >
          {String(p.Text)}
        </button>
      )
    case 'Avatar': {
      const size = Number(p.Size) || 56
      if (p.Picture) {
        return (
          <img
            alt=""
            src={String(p.Picture)}
            style={{ ...style, width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
            onClick={onClick}
          />
        )
      }
      return (
        <div
          style={{
            ...style,
            width: size,
            height: size,
            borderRadius: '50%',
            background: '#009688',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 700,
          }}
          onClick={onClick}
        >
          {String(p.Text || '同').slice(0, 1)}
        </div>
      )
    }
    case 'TabBar':
      return (
        <div style={{ ...style, display: 'flex', gap: 4, width: '100%', background: '#f1f3f4', borderRadius: 8, padding: 4 }} onClick={onClick}>
          {String(p.ElementsFromString || '')
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
            .map((it) => (
              <div
                key={it}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '6px 4px',
                  borderRadius: 6,
                  fontSize: 12,
                  background: it === String(p.Selection) ? '#fff' : 'transparent',
                  fontWeight: it === String(p.Selection) ? 700 : 400,
                }}
              >
                {it}
              </div>
            ))}
        </div>
      )
    case 'CoinFlip':
      return (
        <div
          style={{
            ...style,
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(145deg,#ffd54f,#ffb300)',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
            border: '3px solid #f57f17',
          }}
          onClick={onClick}
        >
          {String(p.Result || '正')}
        </div>
      )
    case 'TrafficLight':
      return (
        <div style={{ ...style, width: 40, padding: 6, background: '#263238', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 6 }} onClick={onClick}>
          {['红', '黄', '绿'].map((c) => (
            <div
              key={c}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                margin: '0 auto',
                background: p.State === c ? (c === '红' ? '#f44336' : c === '黄' ? '#ffeb3b' : '#4caf50') : '#455a64',
              }}
            />
          ))}
        </div>
      )
    case 'LightBulb':
      return (
        <div style={{ ...style, fontSize: 40, filter: p.On ? 'none' : 'grayscale(1) opacity(0.45)' }} onClick={onClick}>
          💡
        </div>
      )
    case 'ScoreBoard':
      return (
        <div
          style={{
            ...style,
            width: '100%',
            textAlign: 'center',
            padding: 12,
            borderRadius: 10,
            background: String(p.BackgroundColor || '#1a237e'),
            color: String(p.TextColor || '#fff'),
          }}
          onClick={onClick}
        >
          <div style={{ fontSize: 12, opacity: 0.85 }}>{String(p.Title || '得分')}</div>
          <div style={{ fontSize: Number(p.FontSize) || 32, fontWeight: 800 }}>{Number(p.Score) || 0}</div>
        </div>
      )
    case 'ProgressRing': {
      const pct = Math.max(0, Math.min(100, Number(p.Percent) || 0))
      const size = Number(p.Size) || 72
      const color = String(p.Color || '#009688')
      return (
        <div
          style={{
            ...style,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `conic-gradient(${color} ${pct}%, #e8eaed 0)`,
            display: 'grid',
            placeItems: 'center',
          }}
          onClick={onClick}
        >
          <div style={{ width: size * 0.62, height: size * 0.62, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}>
            {pct}%
          </div>
        </div>
      )
    }
    case 'LEDLabel':
      return (
        <div
          style={{
            ...style,
            width: '100%',
            padding: '8px 10px',
            borderRadius: 6,
            background: String(p.BackgroundColor || '#102027'),
            color: String(p.TextColor || '#69f0ae'),
            fontFamily: 'ui-monospace, Consolas, monospace',
            fontSize: Number(p.FontSize) || 28,
            letterSpacing: 2,
            textAlign: 'center',
          }}
          onClick={onClick}
        >
          {String(p.Text || '')}
        </div>
      )
    case 'FortuneBall':
      return (
        <div
          style={{
            ...style,
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #5c6bc0, #1a237e)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            padding: 8,
            fontSize: 11,
            fontWeight: 700,
          }}
          onClick={onClick}
        >
          {String(p.Answer || '问问我')}
        </div>
      )
    case 'LevelBar': {
      const max = Math.max(1, Number(p.MaxValue) || 100)
      const val = Math.max(0, Math.min(max, Number(p.Value) || 0))
      return (
        <div style={{ ...style, width: '100%', height: Number(p.Height) || 14, background: '#e8eaed', borderRadius: 8, overflow: 'hidden' }} onClick={onClick}>
          <div style={{ width: `${(val / max) * 100}%`, height: '100%', background: String(p.Color || '#43a047') }} />
        </div>
      )
    }
    case 'Alarm':
      return (
        <div
          style={{
            ...style,
            width: '100%',
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid #ffe082',
            background: p.Enabled ? '#fff8e1' : '#f5f5f5',
          }}
          onClick={onClick}
        >
          <div style={{ fontSize: 22, fontWeight: 800 }}>⏰ {String(p.Time || '07:00')}</div>
          <div style={{ fontSize: 12, color: '#5f6368', marginTop: 4 }}>
            {String(p.Label || '闹钟')} · {p.Enabled ? '已开启' : '已关闭'}
          </div>
        </div>
      )
    case 'CalendarView':
      return (
        <div
          style={{
            ...style,
            width: '100%',
            minHeight: 160,
            border: '1px solid #dadce0',
            borderRadius: 12,
            padding: 10,
            background: '#e0f2f1',
            fontWeight: 700,
          }}
          onClick={onClick}
        >
          📅 {Number(p.Year) || new Date().getFullYear()}年{Number(p.Month) || new Date().getMonth() + 1}月
        </div>
      )
    case 'ContactList':
      return (
        <ul style={{ ...style, listStyle: 'none', padding: 0, border: '1px solid #dadce0', borderRadius: 8 }} onClick={onClick}>
          {String(p.ContactsFromString || '')
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
            .slice(0, 6)
            .map((it) => (
              <li key={it} style={{ padding: '8px 10px', borderBottom: '1px solid #eee' }}>
                {it}
              </li>
            ))}
        </ul>
      )
    case 'MapView':
      return (
        <div
          style={{
            ...style,
            height: Number(p.Height) || 160,
            border: '1px solid #dadce0',
            borderRadius: 8,
            background: '#e8f5e9',
            display: 'grid',
            placeItems: 'center',
            color: '#2e7d32',
            fontSize: 13,
          }}
          onClick={onClick}
        >
          {`地图 ${String(p.Latitude)},${String(p.Longitude)}`}
        </div>
      )
    case 'ClockFace':
      return (
        <div
          style={{
            ...style,
            width: '100%',
            padding: 12,
            borderRadius: 12,
            background: '#102027',
            color: String(p.TextColor || '#69f0ae'),
            fontSize: Number(p.FontSize) || 32,
            fontWeight: 800,
            textAlign: 'center',
          }}
          onClick={onClick}
        >
          {String(p.Text || '12:00:00')}
        </div>
      )
    case 'Reminder':
      return (
        <div
          style={{
            ...style,
            width: '100%',
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid #b2dfdb',
            background: p.Enabled ? '#e0f2f1' : '#f5f5f5',
          }}
          onClick={onClick}
        >
          <div style={{ fontWeight: 800 }}>📌 {String(p.Label || '提醒')}</div>
          <div style={{ fontSize: 12, color: '#5f6368', marginTop: 4 }}>
            {String(p.Date || '')} {String(p.Time || '08:00')}
          </div>
        </div>
      )
    case 'TodoList':
      return (
        <ul style={{ ...style, listStyle: 'none', padding: 0, border: '1px solid #dadce0', borderRadius: 8 }} onClick={onClick}>
          {String(p.ItemsFromString || '')
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
            .slice(0, 6)
            .map((it) => (
              <li key={it} style={{ padding: '8px 10px', borderBottom: '1px solid #eee' }}>
                ☐ {it}
              </li>
            ))}
        </ul>
      )
    case 'CalculatorPad':
      return (
        <div
          style={{ ...style, width: '100%', padding: 10, border: '1px solid #dadce0', borderRadius: 12, background: '#fff' }}
          onClick={onClick}
        >
          <div style={{ textAlign: 'right', fontSize: 22, fontWeight: 800 }}>{String(p.Result || '0')}</div>
          <div style={{ fontSize: 12, color: '#90a4ae' }}>{String(p.Expression || '计算器')}</div>
        </div>
      )
    case 'CompassView':
      return (
        <div
          style={{
            ...style,
            width: Number(p.Size) || 120,
            height: Number(p.Size) || 120,
            borderRadius: '50%',
            border: '6px solid #37474f',
            background: '#cfd8dc',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
          }}
          onClick={onClick}
        >
          N
        </div>
      )
    case 'WeatherBox':
      return (
        <div
          style={{
            ...style,
            width: '100%',
            padding: 14,
            borderRadius: 12,
            background: 'linear-gradient(135deg,#4fc3f7,#0288d1)',
            color: '#fff',
          }}
          onClick={onClick}
        >
          <div>{String(p.City || '北京')}</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{String(p.Temperature || '--')}°</div>
          <div style={{ fontSize: 13 }}>{String(p.WeatherText || '天气')}</div>
        </div>
      )
    case 'DialPad':
      return (
        <div
          style={{
            ...style,
            width: '100%',
            padding: 10,
            border: '1px solid #dadce0',
            borderRadius: 12,
            textAlign: 'center',
            fontWeight: 800,
            letterSpacing: 2,
          }}
          onClick={onClick}
        >
          {String(p.Number || '拨号盘')}
        </div>
      )
    case 'ProgressBar':
      return (
        <div style={{ ...style, height: 8, background: '#e8eaed', borderRadius: 4 }} onClick={onClick}>
          <div style={{ width: '40%', height: '100%', background: '#009688', borderRadius: 4 }} />
        </div>
      )
    default:
      return (
        <div style={style} onClick={onClick}>
          {node.name}
        </div>
      )
  }
}

export function DesignerCanvas() {
  const screen = useProjectStore((s) => s.getActiveScreen())
  const selectedId = useProjectStore((s) => s.selectedId)
  const select = useProjectStore((s) => s.select)
  const addComponent = useProjectStore((s) => s.addComponent)
  const project = useProjectStore((s) => s.project)
  const previewKey = useProjectStore((s) => s.previewKey)
  const switchScreen = useProjectStore((s) => s.switchScreen)
  const stage = useProjectStore((s) => s.designerStage)
  const setDesignerStage = useProjectStore((s) => s.setDesignerStage)
  const screenStack = useRef<string[]>([])
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const sendSim = (msg: SimMessage) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(msg, '*')
    } catch {
      /* ignore */
    }
  }

  const srcDoc = useMemo(() => {
    const plan = getScreenRuntimePlan(project, screen)
    const baseHref = new URL(import.meta.env.BASE_URL || './', window.location.href).href
    return buildPreviewDocument(project, screen, plan.code, baseHref, plan.advanced)
  }, [project, screen, previewKey])

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return
      if (e.data.type === 'ai2-open-screen') {
        const want = String(e.data.name || '').trim()
        const sc = project.screens.find(
          (s) => s.name === want || String(s.props.Title ?? '') === want,
        )
        if (sc) {
          const cur = project.screens.find((s) => s.id === project.activeScreenId)
          if (cur && cur.id !== sc.id) screenStack.current.push(cur.id)
          switchScreen(sc.id)
        }
      }
      if (e.data.type === 'ai2-open-url' && typeof e.data.url === 'string') {
        const url = e.data.url.trim()
        if (/^https?:\/\//i.test(url)) window.open(url, '_blank', 'noopener,noreferrer')
      }
      if (e.data.type === 'ai2-close-screen') {
        const prev = screenStack.current.pop()
        if (prev && project.screens.some((s) => s.id === prev)) switchScreen(prev)
        else if (project.screens[0]) switchScreen(project.screens[0].id)
      }
      if (e.data.type === 'ai2-preview-ready') {
        try {
          window.parent.postMessage({ type: 'go3-preview-opened' }, '*')
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [switchScreen, project])

  const screenTitle = String(screen.props.Title ?? screen.name)

  return (
    <div
      className="designer-wrap single-stage"
    >
      <section className="designer-pane">
        <div className="pane-toolbar">
          <div className="pane-chip">
            <span className={`pane-chip-dot ${stage}`} />
            <div>
              <div className="pane-title">{stage === 'design' ? '设计屏幕' : '教学模拟器'}</div>
              <div className="pane-sub">
                {stage === 'design'
                  ? '拖入组件到手机里编辑'
                  : project.advancedMode
                    ? '预览运行代码页脚本（不跑积木）'
                    : '多屏能切、按钮能点；摇一摇/定位/光线用右侧模拟值'}
              </div>
            </div>
          </div>
          <div className="stage-tabs" role="tablist" aria-label="设计或预览">
            <button
              type="button"
              role="tab"
              aria-selected={stage === 'design'}
              className={stage === 'design' ? 'active' : ''}
              title="设计 (Tab)"
              onClick={() => setDesignerStage('design')}
            >
              设计
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={stage === 'preview'}
              className={stage === 'preview' ? 'active' : ''}
              title="预览 (Tab)"
              onClick={() => setDesignerStage('preview')}
            >
              预览
            </button>
          </div>
        </div>
        <div
          className="pane-body designer-stage"
          tabIndex={0}
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).closest('.phone-screen, .designer-stage')) {
              ;(e.currentTarget as HTMLDivElement).focus()
            }
          }}
        >
          <PhoneFrame title={screenTitle} variant={stage}>
            {stage === 'design' ? (
              <div
                className="phone-screen"
                style={{ background: String(screen.props.BackgroundColor ?? '#fff') }}
                onClick={() => select(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const id = e.dataTransfer.getData('componentId')
                  const type = e.dataTransfer.getData('componentType')
                  if (id) useProjectStore.getState().moveComponent(id, screen.root.id)
                  else if (type) addComponent(type as never)
                }}
              >
                <DesignerNode node={screen.root} selectedId={selectedId} onSelect={select} />
              </div>
            ) : (
              <iframe
                key={previewKey}
                ref={iframeRef}
                title="preview"
                className="phone-screen preview-frame"
                srcDoc={srcDoc}
                sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            )}
          </PhoneFrame>
          {stage === 'preview' && <SimulatorPanel onSim={sendSim} />}
          {stage === 'design' && <MixlyTrashCan />}
        </div>
      </section>
    </div>
  )
}
