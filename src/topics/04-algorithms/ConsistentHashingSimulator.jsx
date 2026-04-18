import { useState } from 'react'

const VIRTUAL_NODES = 3
const RING_SIZE = 360

function hashToAngle(key) {
  let h = 0
  for (let c of String(key)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % RING_SIZE
}

const SERVER_COLORS = ['#5a9ce8', '#5ae8a0', '#e8c05a', '#e8915a', '#7c5ae8']

export default function ConsistentHashingSimulator({ color }) {
  const [servers, setServers] = useState(['S1', 'S2', 'S3'])
  const [requests, setRequests] = useState([])
  const [log, setLog] = useState([])
  const [newServer, setNewServer] = useState('S4')

  // Build ring: each server has VIRTUAL_NODES virtual nodes
  const ring = []
  servers.forEach((s, si) => {
    for (let v = 0; v < VIRTUAL_NODES; v++) {
      ring.push({ server: s, angle: hashToAngle(`${s}#${v}`), label: `${s}#${v}`, color: SERVER_COLORS[si % SERVER_COLORS.length] })
    }
  })
  ring.sort((a, b) => a.angle - b.angle)

  function findServer(key) {
    const angle = hashToAngle(key)
    const node = ring.find(n => n.angle >= angle) || ring[0]
    return node ? node.server : null
  }

  function addServer() {
    if (!newServer.trim() || servers.includes(newServer)) return
    setServers(prev => [...prev, newServer.trim()])
    setLog(prev => [`✅ 新增節點 ${newServer}，約 ${(1 / (servers.length + 1) * 100).toFixed(0)}% 資料重新分配（一致性雜湊）`, ...prev.slice(0, 9)])
    setNewServer(`S${servers.length + 2}`)
  }

  function removeServer(s) {
    setServers(prev => prev.filter(x => x !== s))
    setLog(prev => [`❌ 移除節點 ${s}，只有該節點的資料需要重新分配`, ...prev.slice(0, 9)])
  }

  function sendRequest() {
    const key = `req_${Date.now() % 1000}`
    const server = findServer(key)
    setRequests(prev => [...prev.slice(-19), { key, server, angle: hashToAngle(key) }])
    setLog(prev => [`請求 ${key}（角度=${hashToAngle(key)}°）→ ${server}`, ...prev.slice(0, 9)])
  }

  const cx = 130, cy = 130, r = 110

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>一致性雜湊模擬器</h3>
      <p className="sim-desc">
        一致性雜湊將節點和請求都映射到同一個環上。新增/移除節點時，只有相鄰區段的資料需要遷移，而非全量 Rehash。
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        {/* Ring SVG */}
        <svg width={260} height={260} style={{ flexShrink: 0 }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--clr-border)" strokeWidth={2} />

          {ring.map((node, i) => {
            const rad = (node.angle - 90) * Math.PI / 180
            const x = cx + r * Math.cos(rad)
            const y = cy + r * Math.sin(rad)
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={7} fill={node.color} />
                <text x={x + (x > cx ? 6 : -6)} y={y + 4} fontSize={8}
                  textAnchor={x > cx ? 'start' : 'end'} fill={node.color}>{node.label}</text>
              </g>
            )
          })}

          {requests.slice(-5).map((req, i) => {
            const rad = (req.angle - 90) * Math.PI / 180
            const x = cx + (r - 20) * Math.cos(rad)
            const y = cy + (r - 20) * Math.sin(rad)
            return <circle key={i} cx={x} cy={y} r={4} fill="#e85a5a" opacity={0.6 + i * 0.08} />
          })}
        </svg>

        <div style={{ flex: 1, minWidth: 180 }}>
          <h4>節點</h4>
          {servers.map((s, i) => (
            <div key={s} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <span style={{ color: SERVER_COLORS[i % SERVER_COLORS.length], fontWeight: 600 }}>●</span>
              <span>{s}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)' }}>
                {requests.filter(r => r.server === s).length} 請求
              </span>
              <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: 'var(--text-xs)' }}
                onClick={() => removeServer(s)} disabled={servers.length <= 1}>移除</button>
            </div>
          ))}

          <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 8 }}>
            <input className="sim-input" value={newServer} onChange={e => setNewServer(e.target.value)} style={{ width: 70 }} />
            <button className="btn btn-primary" style={{ '--btn-color': color }} onClick={addServer}>新增節點</button>
          </div>
        </div>
      </div>

      <div className="sim-controls">
        <button className="btn btn-primary" style={{ '--btn-color': color }} onClick={sendRequest}>傳送請求 ▶</button>
        <button className="btn btn-primary" style={{ '--btn-color': color }}
          onClick={() => { for (let i = 0; i < 20; i++) setTimeout(sendRequest, i * 50) }}>
          批次 20 個請求
        </button>
      </div>

      <div className="sim-log">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
