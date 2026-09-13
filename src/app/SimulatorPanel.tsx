import { useState } from 'react'

export type SimMessage =
  | { type: 'ai2-sim'; sensor: 'shake' }
  | { type: 'ai2-sim'; sensor: 'location'; value: { lat: number; lng: number } }
  | { type: 'ai2-sim'; sensor: 'light'; value: number }
  | { type: 'ai2-sim'; sensor: 'permission'; name: 'location' | 'camera' | 'notify'; allow: boolean }
  | { type: 'ai2-sim'; sensor: 'netfail'; mode: 'ok' | 'timeout' | 'empty' | 'error' }

export function SimulatorPanel({
  onSim,
}: {
  onSim: (msg: SimMessage) => void
}) {
  const [lat, setLat] = useState('39.90')
  const [lng, setLng] = useState('116.40')
  const [lux, setLux] = useState(120)
  const [net, setNet] = useState<'ok' | 'timeout' | 'empty' | 'error'>('ok')

  return (
    <aside className="sim-panel" aria-label="教学模拟器">
      <div className="sim-panel-title">教学模拟器</div>
      <p className="sim-panel-hint">机房没有手机时，用面板上的模拟值触发事件。</p>
      <button type="button" className="btn tiny" onClick={() => onSim({ type: 'ai2-sim', sensor: 'shake' })}>
        摇一摇
      </button>
      <label>
        纬度
        <input value={lat} onChange={(e) => setLat(e.target.value)} />
      </label>
      <label>
        经度
        <input value={lng} onChange={(e) => setLng(e.target.value)} />
      </label>
      <button
        type="button"
        className="btn tiny"
        onClick={() =>
          onSim({
            type: 'ai2-sim',
            sensor: 'location',
            value: { lat: Number(lat) || 0, lng: Number(lng) || 0 },
          })
        }
      >
        模拟定位
      </button>
      <label>
        光线 lux
        <input
          type="range"
          min={0}
          max={1000}
          value={lux}
          onChange={(e) => {
            const n = Number(e.target.value)
            setLux(n)
            onSim({ type: 'ai2-sim', sensor: 'light', value: n })
          }}
        />
        <span>{lux}</span>
      </label>
      <div className="sim-row">
        <span>定位权限</span>
        <button type="button" className="btn tiny" onClick={() => onSim({ type: 'ai2-sim', sensor: 'permission', name: 'location', allow: true })}>
          允许
        </button>
        <button type="button" className="btn tiny" onClick={() => onSim({ type: 'ai2-sim', sensor: 'permission', name: 'location', allow: false })}>
          拒绝
        </button>
      </div>
      <div className="sim-row">
        <span>相机权限</span>
        <button type="button" className="btn tiny" onClick={() => onSim({ type: 'ai2-sim', sensor: 'permission', name: 'camera', allow: true })}>
          允许
        </button>
        <button type="button" className="btn tiny" onClick={() => onSim({ type: 'ai2-sim', sensor: 'permission', name: 'camera', allow: false })}>
          拒绝
        </button>
      </div>
      <div className="sim-row">
        <span>通知权限</span>
        <button type="button" className="btn tiny" onClick={() => onSim({ type: 'ai2-sim', sensor: 'permission', name: 'notify', allow: true })}>
          允许
        </button>
        <button type="button" className="btn tiny" onClick={() => onSim({ type: 'ai2-sim', sensor: 'permission', name: 'notify', allow: false })}>
          拒绝
        </button>
      </div>
      <label>
        网络演练
        <select
          value={net}
          onChange={(e) => {
            const mode = e.target.value as typeof net
            setNet(mode)
            onSim({ type: 'ai2-sim', sensor: 'netfail', mode })
          }}
        >
          <option value="ok">正常</option>
          <option value="timeout">超时</option>
          <option value="empty">空数据</option>
          <option value="error">错误</option>
        </select>
      </label>
    </aside>
  )
}
