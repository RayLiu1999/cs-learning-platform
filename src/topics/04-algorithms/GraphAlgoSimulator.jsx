import { useState, useRef } from 'react'

const GRAPH = {
  nodes: ['A', 'B', 'C', 'D', 'E', 'F'],
  edges: [
    { from: 'A', to: 'B', weight: 4 },
    { from: 'A', to: 'C', weight: 2 },
    { from: 'B', to: 'D', weight: 5 },
    { from: 'B', to: 'C', weight: 1 },
    { from: 'C', to: 'E', weight: 8 },
    { from: 'C', to: 'D', weight: 2 },
    { from: 'D', to: 'F', weight: 1 },
    { from: 'E', to: 'F', weight: 3 },
  ],
}

const NODE_POS = { A: [60, 50], B: [180, 20], C: [180, 90], D: [300, 50], E: [300, 130], F: [420, 80] }

function buildAdj() {
  const adj = {}
  GRAPH.nodes.forEach(n => { adj[n] = [] })
  GRAPH.edges.forEach(e => {
    adj[e.from].push({ to: e.to, w: e.weight })
    adj[e.to].push({ to: e.from, w: e.weight })
  })
  return adj
}

function bfs(start) {
  const adj = buildAdj()
  const visited = new Set(), order = [], steps = []
  const queue = [start]
  visited.add(start)
  while (queue.length) {
    const node = queue.shift()
    order.push(node)
    steps.push({ visited: [...order], current: node })
    for (const { to } of adj[node]) {
      if (!visited.has(to)) { visited.add(to); queue.push(to) }
    }
  }
  return steps
}

function dfs(start) {
  const adj = buildAdj()
  const visited = new Set(), order = [], steps = []
  function visit(node) {
    visited.add(node)
    order.push(node)
    steps.push({ visited: [...order], current: node })
    for (const { to } of adj[node]) {
      if (!visited.has(to)) visit(to)
    }
  }
  visit(start)
  return steps
}

function dijkstra(start) {
  const adj = buildAdj()
  const dist = {}
  GRAPH.nodes.forEach(n => dist[n] = Infinity)
  dist[start] = 0
  const visited = new Set(), steps = []
  const pq = [[0, start]]
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0])
    const [d, node] = pq.shift()
    if (visited.has(node)) continue
    visited.add(node)
    steps.push({ current: node, dist: { ...dist }, visited: [...visited] })
    for (const { to, w } of adj[node]) {
      if (dist[node] + w < dist[to]) {
        dist[to] = dist[node] + w
        pq.push([dist[to], to])
      }
    }
  }
  return steps
}

export default function GraphAlgoSimulator({ color }) {
  const [algo, setAlgo] = useState('bfs')
  const [start, setStart] = useState('A')
  const [steps, setSteps] = useState([])
  const [stepIdx, setStepIdx] = useState(-1)
  const timerRef = useRef(null)

  const curStep = stepIdx >= 0 ? steps[stepIdx] : null
  const visited = curStep?.visited || []
  const current = curStep?.current

  function run() {
    let s = []
    if (algo === 'bfs') s = bfs(start)
    else if (algo === 'dfs') s = dfs(start)
    else s = dijkstra(start)
    setSteps(s)
    setStepIdx(0)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setStepIdx(prev => {
        if (prev >= s.length - 1) { clearInterval(timerRef.current); return prev }
        return prev + 1
      })
    }, 600)
  }

  function reset() {
    clearInterval(timerRef.current)
    setSteps([])
    setStepIdx(-1)
  }

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>圖演算法視覺化</h3>

      <div className="sim-controls">
        {[['bfs', 'BFS'], ['dfs', 'DFS'], ['dijkstra', 'Dijkstra（最短路徑）']].map(([id, label]) => (
          <button key={id}
            className={`btn ${algo === id ? 'btn-primary' : 'btn-secondary'}`}
            style={algo === id ? { '--btn-color': color } : {}}
            onClick={() => { setAlgo(id); reset() }}>
            {label}
          </button>
        ))}
        <label>起點：
          <select className="sim-input" value={start} onChange={e => { setStart(e.target.value); reset() }}
            style={{ marginLeft: 8 }}>
            {GRAPH.nodes.map(n => <option key={n}>{n}</option>)}
          </select>
        </label>
        <button className="btn btn-primary" style={{ '--btn-color': color }} onClick={run}>▶ 執行</button>
        <button className="btn btn-secondary" onClick={reset}>重置</button>
      </div>

      {/* SVG Graph */}
      <svg width="100%" viewBox="0 0 490 160" style={{ border: '1px solid var(--clr-border)', borderRadius: 8, background: 'var(--clr-bg)' }}>
        {GRAPH.edges.map((e, i) => {
          const [x1, y1] = NODE_POS[e.from]
          const [x2, y2] = NODE_POS[e.to]
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--clr-border)" strokeWidth={2} />
              <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 4}
                fontSize={10} fill="var(--clr-text-secondary)" textAnchor="middle">{e.weight}</text>
            </g>
          )
        })}
        {GRAPH.nodes.map(n => {
          const [x, y] = NODE_POS[n]
          const isVisited = visited.includes(n)
          const isCurrent = current === n
          return (
            <g key={n}>
              <circle cx={x} cy={y} r={18}
                fill={isCurrent ? color : isVisited ? color + '44' : 'var(--clr-surface)'}
                stroke={isCurrent ? color : isVisited ? color : 'var(--clr-border)'}
                strokeWidth={isCurrent ? 3 : 2} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize={13}
                fill={isCurrent ? '#fff' : isVisited ? color : 'var(--clr-text)'} fontWeight={600}>{n}</text>
              {algo === 'dijkstra' && curStep?.dist && curStep.dist[n] !== Infinity && (
                <text x={x} y={y + 30} textAnchor="middle" fontSize={9} fill={color}>d={curStep.dist[n]}</text>
              )}
            </g>
          )
        })}
      </svg>

      {curStep && (
        <div className="sim-log">
          <div>訪問順序：{visited.join(' → ')}</div>
        </div>
      )}
    </div>
  )
}
