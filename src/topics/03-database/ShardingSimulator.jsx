import { useState } from 'react'

const DB_COLORS = ['#5a9ce8', '#5ae8a0', '#e8c05a', '#e8915a', '#7c5ae8']

function hashShard(key, n) { return key % n }
function rangeShard(key, n) {
  const rangeSize = Math.ceil(1000 / n)
  return Math.min(Math.floor(key / rangeSize), n - 1)
}

export default function ShardingSimulator({ color }) {
  const [strategy, setStrategy] = useState('hash')
  const [shardCount, setShardCount] = useState(4)
  const [records, setRecords] = useState([])
  const [inputKey, setInputKey] = useState('')
  const [log, setLog] = useState([])

  const shards = Array.from({ length: shardCount }, (_, i) => ({
    id: i,
    name: `Shard ${i}`,
    records: records.filter(r => r.shard === i),
  }))

  function assignShard(key) {
    return strategy === 'hash' ? hashShard(key, shardCount) : rangeShard(key, shardCount)
  }

  function insertRecord() {
    const key = parseInt(inputKey)
    if (isNaN(key)) return
    const shard = assignShard(key)
    setRecords(prev => [...prev, { key, shard }])
    setLog(prev => [`Key=${key} → Shard ${shard}（${strategy === 'hash' ? `hash: ${key} % ${shardCount} = ${shard}` : `range: [${Math.floor(key / Math.ceil(1000 / shardCount)) * Math.ceil(1000 / shardCount)}, ${(Math.floor(key / Math.ceil(1000 / shardCount)) + 1) * Math.ceil(1000 / shardCount)})`}）`, ...prev.slice(0, 9)])
    setInputKey('')
  }

  function batchInsert() {
    const keys = [100, 250, 333, 450, 599, 700, 800, 950, 111, 222]
    const newRecs = keys.map(k => ({ key: k, shard: assignShard(k) }))
    setRecords(prev => [...prev, ...newRecs])
    setLog(prev => [`批次插入 ${keys.length} 筆記錄`, ...prev.slice(0, 9)])
  }

  function changeShardCount(n) {
    setShardCount(n)
    // Rehash with new shard count
    const newStrategy = strategy
    setRecords(prev => prev.map(r => ({
      ...r,
      shard: newStrategy === 'hash' ? hashShard(r.key, n) : rangeShard(r.key, n)
    })))
    setLog(prev => [`Shard 數量變更為 ${n}，資料重新分配（Resharding）`, ...prev.slice(0, 9)])
  }

  function reset() { setRecords([]); setLog([]) }

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>資料分片模擬器</h3>
      <p className="sim-desc">插入記錄，觀察 Hash Sharding 和 Range Sharding 的分配策略。調整 Shard 數量觀察 Resharding 影響。</p>

      <div className="sim-controls">
        {[['hash', 'Hash Sharding（Key % N）'], ['range', 'Range Sharding（按值範圍）']].map(([id, label]) => (
          <button key={id}
            className={`btn ${strategy === id ? 'btn-primary' : 'btn-secondary'}`}
            style={strategy === id ? { '--btn-color': color } : {}}
            onClick={() => { setStrategy(id); reset() }}>
            {label}
          </button>
        ))}
      </div>

      <div className="sim-controls">
        <label>Shard 數量：</label>
        {[2, 3, 4, 5].map(n => (
          <button key={n}
            className={`btn ${shardCount === n ? 'btn-primary' : 'btn-secondary'}`}
            style={shardCount === n ? { '--btn-color': color } : {}}
            onClick={() => changeShardCount(n)}>
            {n} Shards
          </button>
        ))}
      </div>

      <div className="sharding-servers">
        {shards.map(s => (
          <div key={s.id} className="shard-box" style={{ borderColor: DB_COLORS[s.id % DB_COLORS.length] }}>
            <div className="shard-name" style={{ color: DB_COLORS[s.id % DB_COLORS.length] }}>{s.name}</div>
            <div className="shard-count">{s.records.length} 筆</div>
            <div className="shard-keys">
              {s.records.slice(0, 10).map((r, i) => <span key={i} className="shard-key">{r.key}</span>)}
              {s.records.length > 10 && <span>+{s.records.length - 10}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="sim-controls">
        <input className="sim-input" type="number" min={0} max={999} placeholder="鍵值 (0-999)"
          value={inputKey} onChange={e => setInputKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && insertRecord()} style={{ width: 140 }} />
        <button className="btn btn-primary" style={{ '--btn-color': color }} onClick={insertRecord}>插入</button>
        <button className="btn btn-secondary" onClick={batchInsert}>批次插入</button>
        <button className="btn btn-secondary" onClick={reset}>重置</button>
      </div>

      <div className="sim-log">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
