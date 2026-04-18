import { useState } from 'react'

const VERSIONS = [
  {
    id: 'tls12',
    name: 'TLS 1.2',
    color: '#e8c05a',
    rtt: '2-RTT',
    steps: [
      { from: 'C', label: 'ClientHello（支援的 Cipher Suite, 隨機數 C）' },
      { from: 'S', label: 'ServerHello + Certificate + ServerKeyExchange' },
      { from: 'C', label: 'ClientKeyExchange（Pre-Master Secret）+ ChangeCipherSpec' },
      { from: 'S', label: 'ChangeCipherSpec + Finished' },
      { from: 'C', label: 'HTTP Request（2-RTT 後才能發資料）' },
    ],
    summary: '2-RTT 才能開始傳送應用資料，每次新連線都需完整握手。',
  },
  {
    id: 'tls13',
    name: 'TLS 1.3',
    color: '#5ae8a0',
    rtt: '1-RTT',
    steps: [
      { from: 'C', label: 'ClientHello（Key Share, Supported Groups）' },
      { from: 'S', label: 'ServerHello + EncryptedExtensions + Certificate + CertificateVerify + Finished（1-RTT）' },
      { from: 'C', label: 'HTTP Request（1-RTT 後立即可發送）' },
    ],
    summary: '1-RTT 握手，廢除弱 Cipher（RSA 密鑰交換、RC4、3DES）、強制 PFS（ECDHE）。',
  },
  {
    id: 'tls13_0rtt',
    name: 'TLS 1.3 0-RTT',
    color: '#7c5ae8',
    rtt: '0-RTT（再連線）',
    steps: [
      { from: 'C', label: 'ClientHello + Early Data（HTTP Request 直接包含！）' },
      { from: 'S', label: 'ServerHello + Finished' },
      { from: 'S', label: 'HTTP Response' },
    ],
    summary: '重連時可在第一個封包就攜帶應用資料。⚠️ 不提供前向保密（重播攻擊風險），適合冪等操作。',
  },
]

export default function TLSHandshakeSimulator({ color }) {
  const [selected, setSelected] = useState('tls13')
  const [stepIdx, setStepIdx] = useState(-1)
  const [log, setLog] = useState([])
  const v = VERSIONS.find(x => x.id === selected)

  function next() {
    const n = stepIdx + 1
    if (n < v.steps.length) {
      setStepIdx(n)
      const s = v.steps[n]
      setLog(prev => [...prev, `${s.from === 'C' ? 'Client → Server' : 'Server → Client'}：${s.label}`])
    }
  }

  function reset() { setStepIdx(-1); setLog([]) }

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>TLS 握手模擬器</h3>
      <p className="sim-desc">比較 TLS 1.2（2-RTT）、TLS 1.3（1-RTT）、TLS 1.3 0-RTT 的握手流程。</p>

      <div className="sim-controls">
        {VERSIONS.map(vv => (
          <button key={vv.id}
            className={`btn ${selected === vv.id ? 'btn-primary' : 'btn-secondary'}`}
            style={selected === vv.id ? { '--btn-color': vv.color } : {}}
            onClick={() => { setSelected(vv.id); reset() }}>
            {vv.name}（{vv.rtt}）
          </button>
        ))}
      </div>

      <div className="tls-summary card" style={{ borderColor: v.color }}>
        <strong style={{ color: v.color }}>{v.name} — {v.rtt}</strong>
        <p>{v.summary}</p>
      </div>

      <div className="tcp-diagram">
        <div className="tcp-endpoint">
          <div className="tcp-node" style={{ borderColor: '#5a9ce8', color: '#5a9ce8' }}>Client</div>
          <div className="tcp-line" />
        </div>
        <div className="tcp-arrows">
          {v.steps.map((s, i) => (
            <div key={i} className={`tcp-arrow ${i <= stepIdx ? 'active' : ''}`}
              style={{ opacity: i <= stepIdx ? 1 : 0.3 }}>
              <div className="tcp-arrow-label" style={{ color: v.color, fontSize: 'var(--text-xs)' }}>{s.label}</div>
              <div className={`tcp-arrow-line ${s.from === 'C' ? 'ltr' : 'rtl'}`} style={{ borderColor: v.color }}>
                <span className="tcp-arrow-head" style={{ color: v.color }}>{s.from === 'C' ? '→' : '←'}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="tcp-endpoint">
          <div className="tcp-node" style={{ borderColor: '#5ae8a0', color: '#5ae8a0' }}>Server</div>
          <div className="tcp-line" />
        </div>
      </div>

      <div className="sim-controls">
        <button className="btn btn-primary" style={{ '--btn-color': color }}
          onClick={next} disabled={stepIdx >= v.steps.length - 1}>下一步 ▶</button>
        <button className="btn btn-secondary" onClick={reset}>重置</button>
      </div>

      <div className="sim-log">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
