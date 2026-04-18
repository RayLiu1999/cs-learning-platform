import { useState } from 'react'

const LAYERS = [
  { num: 7, name: '應用層', en: 'Application', protocols: 'HTTP, HTTPS, DNS, FTP, SMTP, SSH', device: 'Server, Browser', color: '#e85a5a' },
  { num: 6, name: '表示層', en: 'Presentation', protocols: 'TLS/SSL, MIME, JPEG', device: 'Gateway', color: '#e8915a' },
  { num: 5, name: '會話層', en: 'Session', protocols: 'RPC, NetBIOS, PPTP', device: 'Gateway', color: '#e8c05a' },
  { num: 4, name: '傳輸層', en: 'Transport', protocols: 'TCP, UDP, QUIC, SCTP', device: 'L4 Load Balancer', color: '#5ae8a0' },
  { num: 3, name: '網路層', en: 'Network', protocols: 'IP, ICMP, ARP, OSPF, BGP', device: 'Router', color: '#5a9ce8' },
  { num: 2, name: '資料鏈路層', en: 'Data Link', protocols: 'Ethernet, 802.1Q VLAN, MAC, ARP', device: 'Switch, Bridge', color: '#7c5ae8' },
  { num: 1, name: '實體層', en: 'Physical', protocols: 'RJ45, 光纖, Wi-Fi（802.11）', device: 'Hub, NIC, Cable', color: '#94a3b8' },
]

const SCENARIO = [
  { layer: 7, action: '瀏覽器發起 GET /index.html HTTP/1.1', dir: 'down' },
  { layer: 6, action: 'TLS 加密 HTTP 資料（Handshake 已完成）', dir: 'down' },
  { layer: 5, action: '建立 HTTP Session（Keep-Alive 連線管理）', dir: 'down' },
  { layer: 4, action: 'TCP 分段（MSS=1460 bytes），加 TCP Header', dir: 'down' },
  { layer: 3, action: 'IP 封裝（加 Source/Dest IP），路由決策', dir: 'down' },
  { layer: 2, action: 'Ethernet 幀封裝（加 MAC 位址，ARP 查詢）', dir: 'down' },
  { layer: 1, action: '轉換為電訊號/光訊號，物理傳輸', dir: 'transmit' },
]

export default function OSILayerSimulator({ color }) {
  const [selected, setSelected] = useState(null)
  const [stepIdx, setStepIdx] = useState(-1)
  const [log, setLog] = useState([])

  const layer = selected !== null ? LAYERS[7 - selected] : null

  function runScenario() {
    const next = stepIdx + 1
    if (next < SCENARIO.length) {
      setStepIdx(next)
      const s = SCENARIO[next]
      setLog(prev => [...prev, `L${s.layer} ${LAYERS[7 - s.layer].name}：${s.action}`])
    }
  }

  function reset() {
    setStepIdx(-1)
    setLog([])
    setSelected(null)
  }

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>OSI 七層模型互動模擬器</h3>
      <p className="sim-desc">點擊每層查看詳情，或逐步模擬 HTTP 請求封包的封裝過程。</p>

      <div className="osi-stack">
        {LAYERS.map(l => (
          <div
            key={l.num}
            className={`osi-layer ${selected === l.num ? 'selected' : ''} ${stepIdx >= 7 - l.num ? 'active-step' : ''}`}
            style={{ borderColor: l.color, background: selected === l.num ? l.color + '22' : '' }}
            onClick={() => setSelected(prev => prev === l.num ? null : l.num)}
          >
            <span className="osi-num" style={{ background: l.color }}>L{l.num}</span>
            <span className="osi-name">{l.name}</span>
            <span className="osi-en" style={{ color: l.color }}>{l.en}</span>
          </div>
        ))}
      </div>

      {layer && (
        <div className="osi-detail card" style={{ borderColor: layer.color }}>
          <h4 style={{ color: layer.color }}>L{layer.num} — {layer.name}（{layer.en}）</h4>
          <p><strong>主要協定：</strong>{layer.protocols}</p>
          <p><strong>對應裝置：</strong>{layer.device}</p>
        </div>
      )}

      <div className="sim-controls">
        <button className="btn btn-primary" style={{ '--btn-color': color }}
          onClick={runScenario} disabled={stepIdx >= SCENARIO.length - 1}>
          單步封裝 ▼
        </button>
        <button className="btn btn-secondary" onClick={reset}>重置</button>
      </div>

      <div className="sim-log">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
