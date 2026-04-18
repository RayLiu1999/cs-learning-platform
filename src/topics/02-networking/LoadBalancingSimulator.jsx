import { useState } from 'react'

const SERVERS = ['S1', 'S2', 'S3', 'S4']
const ALGOS = ['round-robin', 'least-conn', 'ip-hash', 'weighted']

const SERVER_COLORS = ['#5a9ce8', '#5ae8a0', '#e8c05a', '#e8915a']

function getNext(algo, requests, conns, weights) {
  if (algo === 'round-robin') {
    return requests % SERVERS.length
  } else if (algo === 'least-conn') {
    return conns.indexOf(Math.min(...conns))
  } else if (algo === 'ip-hash') {
    return requests % SERVERS.length // simulate hash
  } else if (algo === 'weighted') {
    const totalWeight = weights.reduce((a, b) => a + b, 0)
    const roll = Math.floor(Math.random() * totalWeight)
    let acc = 0
    for (let i = 0; i < weights.length; i++) {
      acc += weights[i]
      if (roll < acc) return i
    }
    return 0
  }
  return 0
}

export default function LoadBalancingSimulator({ color }) {
  const [algo, setAlgo] = useState('round-robin')
  const [requestCount, setRequestCount] = useState(0)
  const [dist, setDist] = useState([0, 0, 0, 0])
  const [conns, setConns] = useState([0, 0, 0, 0])
  const [weights] = useState([3, 2, 1, 1])
  const [lastTarget, setLastTarget] = useState(null)
  const [log, setLog] = useState([])

  function sendRequest() {
    const target = getNext(algo, requestCount, conns, weights)
    const newDist = [...dist]
    const newConns = [...conns]
    newDist[target]++
    newConns[target]++
    setDist(newDist)
    setConns(newConns)
    setRequestCount(prev => prev + 1)
    setLastTarget(target)
    setLog(prev => [
      `請求 #${requestCount + 1} → ${SERVERS[target]}（${algoName(algo)}）`,
      ...prev.slice(0, 9)
    ])
    // Simulate connection finishing
    setTimeout(() => {
      setConns(c => { const nc = [...c]; nc[target] = Math.max(0, nc[target] - 1); return nc })
    }, 800 + Math.random() * 1200)
  }

  function reset() {
    setRequestCount(0)
    setDist([0, 0, 0, 0])
    setConns([0, 0, 0, 0])
    setLastTarget(null)
    setLog([])
  }

  function algoName(a) {
    return { 'round-robin': 'Round Robin', 'least-conn': 'Least Connections', 'ip-hash': 'IP Hash', 'weighted': 'Weighted RR' }[a]
  }

  const total = dist.reduce((a, b) => a + b, 0) || 1

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>負載均衡模擬器</h3>
      <p className="sim-desc">選擇演算法，連續傳送請求，觀察請求分配比例。</p>

      <div className="sim-controls">
        {ALGOS.map(a => (
          <button key={a}
            className={`btn ${algo === a ? 'btn-primary' : 'btn-secondary'}`}
            style={algo === a ? { '--btn-color': color } : {}}
            onClick={() => { setAlgo(a); reset() }}>
            {algoName(a)}
          </button>
        ))}
      </div>

      <div className="lb-servers">
        {SERVERS.map((s, i) => (
          <div key={s} className={`lb-server ${lastTarget === i ? 'hit' : ''}`}
            style={{ borderColor: SERVER_COLORS[i] }}>
            <div className="lb-server-name" style={{ color: SERVER_COLORS[i] }}>{s}</div>
            {algo === 'weighted' && <div className="lb-weight">Weight: {weights[i]}</div>}
            <div className="lb-bar-wrap">
              <div className="lb-bar" style={{ width: `${(dist[i] / total) * 100}%`, background: SERVER_COLORS[i] }} />
            </div>
            <div className="lb-stat">{dist[i]} 請求（{((dist[i] / total) * 100).toFixed(0)}%）</div>
            <div className="lb-conn">連線數：{conns[i]}</div>
          </div>
        ))}
      </div>

      <div className="sim-controls">
        <button className="btn btn-primary" style={{ '--btn-color': color }} onClick={sendRequest}>
          傳送請求 ▶
        </button>
        <button className="btn btn-primary" style={{ '--btn-color': color }}
          onClick={() => { for (let i = 0; i < 10; i++) setTimeout(() => sendRequest(), i * 50) }}>
          傳送 10 個請求
        </button>
        <button className="btn btn-secondary" onClick={reset}>重置</button>
      </div>

      <div className="sim-log">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
