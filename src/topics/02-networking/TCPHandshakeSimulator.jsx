import { useState, useRef } from 'react'

const HANDSHAKE_STEPS = [
  { from: 'client', to: 'server', label: 'SYN', detail: 'Client → Server：SYN=1, Seq=x（隨機 ISN）', color: '#5a9ce8' },
  { from: 'server', to: 'client', label: 'SYN-ACK', detail: 'Server → Client：SYN=1, ACK=1, Seq=y, Ack=x+1', color: '#5ae8a0' },
  { from: 'client', to: 'server', label: 'ACK', detail: 'Client → Server：ACK=1, Seq=x+1, Ack=y+1（連線建立！）', color: '#5a9ce8' },
]

const TEARDOWN_STEPS = [
  { from: 'client', to: 'server', label: 'FIN', detail: 'Client → Server：FIN=1（Client 不再傳送資料）', color: '#e8915a' },
  { from: 'server', to: 'client', label: 'ACK', detail: 'Server → Client：ACK=1（確認收到 FIN）', color: '#e8c05a' },
  { from: 'server', to: 'client', label: 'FIN', detail: 'Server → Client：FIN=1（Server 資料傳送完畢）', color: '#e8915a' },
  { from: 'client', to: 'server', label: 'ACK', detail: 'Client → Server：ACK=1（進入 TIME_WAIT 2MSL）', color: '#e8c05a' },
]

function Arrow({ from, to, label, color, active }) {
  const isClientToServer = from === 'client'
  return (
    <div className={`tcp-arrow ${active ? 'active' : ''}`} style={{ opacity: active ? 1 : 0.3 }}>
      <div className="tcp-arrow-label" style={{ color }}>{label}</div>
      <div className={`tcp-arrow-line ${isClientToServer ? 'ltr' : 'rtl'}`} style={{ borderColor: color }}>
        <span className="tcp-arrow-head" style={{ color }}>{isClientToServer ? '→' : '←'}</span>
      </div>
    </div>
  )
}

export default function TCPHandshakeSimulator({ color }) {
  const [mode, setMode] = useState('handshake')
  const [stepIdx, setStepIdx] = useState(-1)
  const [log, setLog] = useState([])
  const steps = mode === 'handshake' ? HANDSHAKE_STEPS : TEARDOWN_STEPS

  function nextStep() {
    const next = stepIdx + 1
    if (next < steps.length) {
      setStepIdx(next)
      setLog(prev => [...prev, steps[next].detail])
      if (next === steps.length - 1) {
        setLog(prev => [...prev,
          mode === 'handshake'
            ? '🤝 三次握手完成！TCP 連線建立。'
            : '👋 四次揮手完成！連線釋放（Client 等待 TIME_WAIT 2MSL）。'
        ])
      }
    }
  }

  function reset() { setStepIdx(-1); setLog([]) }

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>TCP 三次握手 / 四次揮手</h3>

      <div className="sim-controls">
        {[['handshake', '三次握手'], ['teardown', '四次揮手']].map(([id, label]) => (
          <button key={id}
            className={`btn ${mode === id ? 'btn-primary' : 'btn-secondary'}`}
            style={mode === id ? { '--btn-color': color } : {}}
            onClick={() => { setMode(id); reset() }}>
            {label}
          </button>
        ))}
      </div>

      <div className="tcp-diagram">
        <div className="tcp-endpoint">
          <div className="tcp-node" style={{ borderColor: '#5a9ce8', color: '#5a9ce8' }}>Client</div>
          <div className="tcp-line" style={{ borderColor: '#5a9ce8' }} />
        </div>

        <div className="tcp-arrows">
          {steps.map((s, i) => (
            <Arrow key={i} {...s} active={i <= stepIdx} />
          ))}
        </div>

        <div className="tcp-endpoint">
          <div className="tcp-node" style={{ borderColor: '#5ae8a0', color: '#5ae8a0' }}>Server</div>
          <div className="tcp-line" style={{ borderColor: '#5ae8a0' }} />
        </div>
      </div>

      <div className="sim-controls">
        <button className="btn btn-primary" style={{ '--btn-color': color }}
          onClick={nextStep} disabled={stepIdx >= steps.length - 1}>
          下一步 ▶
        </button>
        <button className="btn btn-secondary" onClick={reset}>重置</button>
      </div>

      <div className="sim-log">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
