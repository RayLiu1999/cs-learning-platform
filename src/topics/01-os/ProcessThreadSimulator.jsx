import { useState } from 'react'

const STATES = ['New', 'Ready', 'Running', 'Waiting', 'Terminated']

const TRANSITIONS = [
  { from: 'New', to: 'Ready', label: '長期排程器接受' },
  { from: 'Ready', to: 'Running', label: 'CPU 排程' },
  { from: 'Running', to: 'Ready', label: '時間片到期' },
  { from: 'Running', to: 'Waiting', label: '等待 I/O' },
  { from: 'Waiting', to: 'Ready', label: 'I/O 完成' },
  { from: 'Running', to: 'Terminated', label: '執行完畢' },
]

const STATE_COLORS = {
  New: '#94a3b8',
  Ready: '#5a9ce8',
  Running: '#5ae8a0',
  Waiting: '#e8c05a',
  Terminated: '#e85a5a',
}

export default function ProcessThreadSimulator({ color }) {
  const [currentState, setCurrentState] = useState('New')
  const [log, setLog] = useState(['行程建立 → 狀態：New'])

  const available = TRANSITIONS.filter(t => t.from === currentState)

  function transition(t) {
    setCurrentState(t.to)
    setLog(prev => [...prev, `${t.from} → ${t.to}：${t.label}`])
  }

  function reset() {
    setCurrentState('New')
    setLog(['行程建立 → 狀態：New'])
  }

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>行程狀態機模擬器</h3>
      <p className="sim-desc">點擊下方按鈕觸發狀態轉換，觀察行程在五個狀態間的流轉。</p>

      {/* State circles */}
      <div className="sim-states-row">
        {STATES.map(s => (
          <div
            key={s}
            className={`sim-state-circle ${s === currentState ? 'active' : ''}`}
            style={{
              borderColor: STATE_COLORS[s],
              background: s === currentState ? STATE_COLORS[s] + '33' : 'transparent',
              color: STATE_COLORS[s],
            }}
          >
            <span className="sim-state-dot" style={{ background: STATE_COLORS[s] }} />
            {s}
          </div>
        ))}
      </div>

      {/* Transition buttons */}
      <div className="sim-controls">
        {available.length === 0 ? (
          <span style={{ color: '#94a3b8' }}>行程已終止</span>
        ) : (
          available.map(t => (
            <button key={t.to} className="btn btn-primary" style={{ '--btn-color': color }} onClick={() => transition(t)}>
              {t.label} → {t.to}
            </button>
          ))
        )}
        <button className="btn btn-secondary" onClick={reset}>重置</button>
      </div>

      {/* Thread comparison */}
      <div className="sim-compare">
        <div className="sim-compare-col">
          <h4>Process（行程）</h4>
          <ul>
            <li>獨立虛擬位址空間</li>
            <li>獨立 Heap / Stack</li>
            <li>獨立 File Descriptor</li>
            <li>Fork 開銷：高</li>
            <li>崩潰隔離：✅</li>
          </ul>
        </div>
        <div className="sim-compare-col">
          <h4>Thread（執行緒）</h4>
          <ul>
            <li>共享 Heap / Code Segment</li>
            <li>各自獨立 Stack</li>
            <li>共享 File Descriptor</li>
            <li>建立開銷：低</li>
            <li>崩潰隔離：❌</li>
          </ul>
        </div>
      </div>

      {/* Log */}
      <div className="sim-log">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
