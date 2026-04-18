import { useState } from 'react'

const TABLE = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `User_${String(i + 1).padStart(2, '0')}`,
  age: 20 + (i * 3) % 50,
  city: ['Taipei', 'Tokyo', 'Seoul', 'NYC', 'London'][i % 5],
}))

export default function IndexingSimulator({ color }) {
  const [query, setQuery] = useState({ type: 'age', value: '35', op: '=' })
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState('index') // 'full' | 'index'
  const [scanned, setScanned] = useState([])
  const [result, setResult] = useState([])
  const [cost, setCost] = useState(null)

  function runQuery() {
    setRunning(true)
    setScanned([])
    setResult([])
    setCost(null)

    const val = parseInt(query.value)
    const match = TABLE.filter(r => {
      if (query.op === '=') return r[query.type] === val || r[query.type] === query.value
      if (query.op === '>') return r[query.type] > val
      if (query.op === '<') return r[query.type] < val
      return false
    })

    if (mode === 'full') {
      // Simulate full scan
      let i = 0
      const interval = setInterval(() => {
        setScanned(prev => [...prev, TABLE[i]])
        i++
        if (i >= TABLE.length) {
          clearInterval(interval)
          setResult(match)
          setCost({ type: 'Full Table Scan', rows: TABLE.length, cost: 'O(n)' })
          setRunning(false)
        }
      }, 60)
    } else {
      // Simulate index scan — skip to matching rows
      const matchIdxs = TABLE.map((r, i) => ({ row: r, i }))
        .filter(({ row }) => {
          if (query.op === '=') return row[query.type] === val || row[query.type] === query.value
          if (query.op === '>') return row[query.type] > val
          if (query.op === '<') return row[query.type] < val
          return false
        })
      setScanned(matchIdxs.map(m => m.row))
      setResult(match)
      setCost({ type: 'Index Scan（B+ Tree）', rows: matchIdxs.length, cost: 'O(log n + k)' })
      setRunning(false)
    }
  }

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>索引掃描 vs 全表掃描模擬器</h3>
      <p className="sim-desc">20 筆資料，對比全表掃描與 B+ Tree 索引掃描的掃描行數與成本。</p>

      <div className="sim-controls">
        <select className="sim-input" value={query.type} onChange={e => setQuery(q => ({ ...q, type: e.target.value }))}>
          <option value="age">age（有索引）</option>
          <option value="city">city（有索引）</option>
          <option value="name">name（無索引）</option>
        </select>
        <select className="sim-input" value={query.op} onChange={e => setQuery(q => ({ ...q, op: e.target.value }))}>
          <option value="=">=</option>
          <option value=">">&gt;</option>
          <option value="<">&lt;</option>
        </select>
        <input className="sim-input" style={{ width: 80 }} value={query.value}
          onChange={e => setQuery(q => ({ ...q, value: e.target.value }))} />
        <button
          className={`btn ${mode === 'full' ? 'btn-primary' : 'btn-secondary'}`}
          style={mode === 'full' ? { '--btn-color': '#e85a5a' } : {}}
          onClick={() => setMode('full')}>全表掃描</button>
        <button
          className={`btn ${mode === 'index' ? 'btn-primary' : 'btn-secondary'}`}
          style={mode === 'index' ? { '--btn-color': color } : {}}
          onClick={() => setMode('index')}>索引掃描</button>
        <button className="btn btn-primary" style={{ '--btn-color': color }} onClick={runQuery} disabled={running}>
          執行查詢
        </button>
      </div>

      {cost && (
        <div className="card" style={{ borderColor: color }}>
          <strong style={{ color }}>{cost.type}</strong>
          <p>掃描行數：<strong>{cost.rows}</strong>/{TABLE.length}　複雜度：<strong>{cost.cost}</strong></p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <div>
          <h4>掃描的行（{scanned.length}）</h4>
          <div className="sim-log" style={{ maxHeight: 160, overflowY: 'auto' }}>
            {scanned.map(r => <div key={r.id}>id={r.id} age={r.age} city={r.city}</div>)}
          </div>
        </div>
        <div>
          <h4>結果行（{result.length}）</h4>
          <div className="sim-log" style={{ maxHeight: 160, overflowY: 'auto' }}>
            {result.map(r => <div key={r.id} style={{ color }}>✅ id={r.id} age={r.age} city={r.city}</div>)}
          </div>
        </div>
      </div>
    </div>
  )
}
