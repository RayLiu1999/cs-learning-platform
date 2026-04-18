import { useState, useRef } from 'react'

const MODES = ['sync', 'semi-sync', 'async']
const MODE_LABELS = { sync: '同步複製', 'semi-sync': '半同步複製', async: '非同步複製' }
const MODE_DESC = {
  sync: '主節點等待所有從節點確認後才提交。最強一致性，延遲最高。',
  'semi-sync': '主節點等待至少一個從節點確認後提交。MySQL Semi-Sync。',
  async: '主節點寫入後立即提交，非同步複製到從節點。延遲最低，可能有資料丟失。',
}

export default function ReplicationSimulator({ color }) {
  const [mode, setMode] = useState('semi-sync')
  const [writes, setWrites] = useState([])
  const [masterLog, setMasterLog] = useState([])
  const [replicaLogs, setReplicaLogs] = useState([[], []])
  const [lag, setLag] = useState([0, 0])
  const [running, setRunning] = useState(false)
  const counter = useRef(1)

  function writeData() {
    const id = counter.current++
    const entry = { id, data: `row_${id}`, ts: Date.now() }
    setMasterLog(prev => [...prev, { ...entry, status: 'committed' }])

    if (mode === 'sync') {
      setTimeout(() => applyToReplicas(entry), 100)
    } else if (mode === 'semi-sync') {
      // First replica syncs, second is async
      setTimeout(() => applyToReplica(entry, 0), 150)
      setTimeout(() => applyToReplica(entry, 1), 500 + Math.random() * 500)
    } else {
      // async — both have random delay
      setTimeout(() => applyToReplica(entry, 0), 300 + Math.random() * 700)
      setTimeout(() => applyToReplica(entry, 1), 500 + Math.random() * 1000)
    }
    setLag(mode === 'sync' ? [0, 0] : mode === 'semi-sync' ? [0, 1] : [1, 2])
  }

  function applyToReplicas(entry) {
    applyToReplica(entry, 0)
    applyToReplica(entry, 1)
  }

  function applyToReplica(entry, idx) {
    setReplicaLogs(prev => {
      const newLogs = prev.map(l => [...l])
      newLogs[idx] = [...newLogs[idx], { ...entry, status: 'applied' }]
      return newLogs
    })
  }

  function reset() {
    counter.current = 1
    setWrites([])
    setMasterLog([])
    setReplicaLogs([[], []])
    setLag([0, 0])
  }

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>主從複製模擬器</h3>
      <p className="sim-desc">模擬 MySQL 主從複製的 Binlog 傳播，觀察不同複製模式下的延遲行為。</p>

      <div className="sim-controls">
        {MODES.map(m => (
          <button key={m}
            className={`btn ${mode === m ? 'btn-primary' : 'btn-secondary'}`}
            style={mode === m ? { '--btn-color': color } : {}}
            onClick={() => { setMode(m); reset() }}>
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="card" style={{ borderColor: color }}>
        <p>{MODE_DESC[mode]}</p>
      </div>

      <div className="replication-layout">
        {/* Master */}
        <div className="repl-node">
          <div className="repl-node-header" style={{ borderColor: color, color }}>Master</div>
          <div className="sim-log" style={{ maxHeight: 140, overflowY: 'auto' }}>
            {masterLog.slice(-8).map(r => <div key={r.id}>✅ {r.data}（committed）</div>)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'var(--space-2)', fontSize: 24 }}>
          →<br/>→
        </div>

        {/* Replicas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flex: 1 }}>
          {replicaLogs.map((rlog, i) => (
            <div key={i} className="repl-node">
              <div className="repl-node-header" style={{ borderColor: '#5a9ce8', color: '#5a9ce8' }}>
                Replica {i + 1} — 延遲≈{lag[i]}s
              </div>
              <div className="sim-log" style={{ maxHeight: 80, overflowY: 'auto' }}>
                {rlog.slice(-4).map(r => <div key={r.id}>📥 {r.data}</div>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sim-controls">
        <button className="btn btn-primary" style={{ '--btn-color': color }} onClick={writeData}>
          主節點寫入 ▶
        </button>
        <button className="btn btn-secondary" onClick={reset}>重置</button>
      </div>
    </div>
  )
}
