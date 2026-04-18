import { useState } from 'react'

const VERSIONS = [
  {
    id: 'http11',
    name: 'HTTP/1.1',
    color: '#e85a5a',
    transport: 'TCP',
    features: ['持久連線（Keep-Alive）', '管線化（Pipelining，但有 HOL Blocking）', '文字協定（Header 無壓縮）'],
    problems: ['HOL Blocking：前一個請求未完成，後續請求阻塞', 'Header 每次請求都重複傳送（Cookie, User-Agent）', '最多 6 個並行 TCP 連線（瀏覽器限制）'],
    reqs: [
      { label: '請求 1', color: '#e85a5a', width: 30 },
      { label: '請求 2', color: '#e85a7a', width: 20, offset: 30 },
      { label: '請求 3', color: '#e86a5a', width: 25, offset: 50 },
    ],
  },
  {
    id: 'http2',
    name: 'HTTP/2',
    color: '#5a9ce8',
    transport: 'TCP',
    features: ['多路復用（Multiplexing）：一條 TCP 上並行多個 Stream', 'Header 壓縮（HPACK）', '伺服器推送（Server Push）', '二進位協定'],
    problems: ['TCP 層的 HOL Blocking 仍然存在', '丟包時所有 Stream 都受影響', '不同 IP 下需重新握手'],
    reqs: [
      { label: 'S1', color: '#5a9ce8', width: 30, row: 0 },
      { label: 'S2', color: '#5ab0e8', width: 25, row: 1 },
      { label: 'S3', color: '#5ac0e8', width: 20, row: 2 },
    ],
  },
  {
    id: 'http3',
    name: 'HTTP/3',
    color: '#5ae8a0',
    transport: 'QUIC（UDP）',
    features: ['基於 QUIC（UDP）：獨立 Stream，丟包只影響單一 Stream', '0-RTT / 1-RTT 連線建立', '內建 TLS 1.3', '連線遷移（IP 變更不斷線）'],
    problems: ['部分防火牆封鎖 UDP 443', 'CPU 使用率較高（在用戶空間實作擁塞控制）', '伺服器端支援尚不普及'],
    reqs: [
      { label: 'S1', color: '#5ae8a0', width: 20, row: 0 },
      { label: 'S2', color: '#5ae8b0', width: 20, row: 1 },
      { label: 'S3', color: '#5ae8c0', width: 20, row: 2 },
    ],
  },
]

export default function HTTPEvolutionSimulator({ color }) {
  const [selected, setSelected] = useState('http3')
  const v = VERSIONS.find(x => x.id === selected)

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>HTTP 演進模擬器</h3>
      <p className="sim-desc">比較 HTTP/1.1、HTTP/2、HTTP/3 的並行請求與 HOL Blocking 行為。</p>

      <div className="sim-controls">
        {VERSIONS.map(v => (
          <button
            key={v.id}
            className={`btn ${selected === v.id ? 'btn-primary' : 'btn-secondary'}`}
            style={selected === v.id ? { '--btn-color': v.color } : {}}
            onClick={() => setSelected(v.id)}
          >
            {v.name}
          </button>
        ))}
      </div>

      <div className="http-card card" style={{ borderColor: v.color }}>
        <h4 style={{ color: v.color }}>{v.name} — 傳輸層：{v.transport}</h4>

        <div className="http-section">
          <h5>優點</h5>
          <ul>{v.features.map((f, i) => <li key={i}>{f}</li>)}</ul>
        </div>
        <div className="http-section">
          <h5>問題</h5>
          <ul className="problems">{v.problems.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>
      </div>

      {/* Timeline visual */}
      <div className="http-timeline">
        <h5>並行請求示意圖（時間軸）</h5>
        {selected === 'http11' ? (
          <div className="timeline-serial">
            <div className="timeline-label">TCP 連線</div>
            <div className="timeline-track">
              {v.reqs.map((r, i) => (
                <div key={i} className="timeline-block"
                  style={{ width: `${r.width}%`, background: r.color, marginLeft: i === 0 ? `${r.offset || 0}%` : '2px' }}>
                  {r.label}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="timeline-parallel">
            {v.reqs.map((r, i) => (
              <div key={i} className="timeline-row">
                <span className="timeline-label">Stream {i + 1}</span>
                <div className="timeline-track">
                  <div className="timeline-block" style={{ width: `${r.width}%`, background: r.color }}>{r.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
