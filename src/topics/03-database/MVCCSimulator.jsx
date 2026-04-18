import { useState } from 'react'

// MVCC simulation: version chain for a single row
const INITIAL_VERSIONS = [
  { txId: 1, value: 100, begin: 1, end: 3, committed: true },
  { txId: 3, value: 200, begin: 3, end: 5, committed: true },
  { txId: 5, value: 300, begin: 5, end: Infinity, committed: true },
]

export default function MVCCSimulator({ color }) {
  const [versions, setVersions] = useState(INITIAL_VERSIONS)
  const [readTxId, setReadTxId] = useState(4)
  const [newValue, setNewValue] = useState(400)
  const [log, setLog] = useState(['MVCC 模擬器就緒。每筆版本有 begin_ts / end_ts 範圍。'])

  const visible = versions.filter(v => v.committed && v.begin <= readTxId && readTxId < v.end)
  const seen = visible.length > 0 ? visible[visible.length - 1] : null

  function addVersion() {
    const newTx = Math.max(...versions.map(v => v.begin)) + 2
    // Close current last version
    setVersions(prev => {
      const updated = prev.map((v, i) => i === prev.length - 1 ? { ...v, end: newTx } : v)
      return [...updated, { txId: newTx, value: newValue, begin: newTx, end: Infinity, committed: true }]
    })
    setLog(prev => [`TX ${newTx} 寫入版本 value=${newValue}`, ...prev.slice(0, 9)])
  }

  function addUncommitted() {
    const newTx = Math.max(...versions.map(v => v.begin)) + 2
    setVersions(prev => [...prev, { txId: newTx, value: newValue, begin: newTx, end: Infinity, committed: false }])
    setLog(prev => [`TX ${newTx} 寫入未提交版本 value=${newValue}（其他 TX 不可見）`, ...prev.slice(0, 9)])
  }

  function reset() {
    setVersions(INITIAL_VERSIONS)
    setReadTxId(4)
    setLog(['MVCC 模擬器重置。'])
  }

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>MVCC 版本鏈模擬器</h3>
      <p className="sim-desc">
        MVCC 為每次寫入建立新版本，每個版本有 begin_ts / end_ts。
        讀取事務根據自身 TX ID 找到當時可見的版本，<strong>讀不阻塞寫，寫不阻塞讀</strong>。
      </p>

      <div className="mvcc-chain">
        <h4>版本鏈</h4>
        <div style={{ overflowX: 'auto' }}>
          <table className="stats-table">
            <thead>
              <tr><th>TX ID</th><th>Value</th><th>begin_ts</th><th>end_ts</th><th>狀態</th></tr>
            </thead>
            <tbody>
              {versions.map((v, i) => {
                const isVisible = v.committed && v.begin <= readTxId && readTxId < v.end
                return (
                  <tr key={i} style={{ background: isVisible ? `${color}22` : '' }}>
                    <td>{v.txId}</td>
                    <td><strong>{v.value}</strong></td>
                    <td>{v.begin}</td>
                    <td>{v.end === Infinity ? '∞' : v.end}</td>
                    <td style={{ color: v.committed ? (isVisible ? color : 'var(--clr-text-secondary)') : '#e85a5a' }}>
                      {v.committed ? (isVisible ? '👁 可見' : '不可見') : '⏳ 未提交'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ borderColor: color }}>
        <strong style={{ color }}>TX {readTxId} 讀取結果：</strong>
        <p>{seen ? `value = ${seen.value}（來自 TX ${seen.txId} 的版本）` : '無可見版本'}</p>
        <label>調整讀取 TX ID：
          <input type="range" min={1} max={20} value={readTxId}
            onChange={e => setReadTxId(parseInt(e.target.value))} style={{ marginLeft: 8 }} />
          TX ID = {readTxId}
        </label>
      </div>

      <div className="sim-controls">
        <input className="sim-input" type="number" value={newValue}
          onChange={e => setNewValue(parseInt(e.target.value))} placeholder="新版本值" style={{ width: 120 }} />
        <button className="btn btn-primary" style={{ '--btn-color': color }} onClick={addVersion}>
          寫入新版本（提交）
        </button>
        <button className="btn btn-secondary" onClick={addUncommitted}>寫入未提交版本</button>
        <button className="btn btn-secondary" onClick={reset}>重置</button>
      </div>

      <div className="sim-log">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
