import { useState } from 'react'

const SIZES = [8, 16]
const METHODS = ['chaining', 'open-addressing']

function simpleHash(key, size) {
  let h = 0
  for (let c of String(key)) h = (h * 31 + c.charCodeAt(0)) % size
  return h
}

export default function HashTableSimulator({ color }) {
  const [method, setMethod] = useState('chaining')
  const [size, setSize] = useState(8)
  const [table, setTable] = useState(Array.from({ length: 8 }, () => []))
  const [input, setInput] = useState('')
  const [log, setLog] = useState([])
  const [highlight, setHighlight] = useState(null)

  function changeSize(s) {
    setSize(s)
    setTable(Array.from({ length: s }, () => []))
    setLog([`調整 Hash Table 大小為 ${s}，清空資料`])
    setHighlight(null)
  }

  function insert() {
    const key = input.trim()
    if (!key) return
    const h = simpleHash(key, size)
    setHighlight(h)

    if (method === 'chaining') {
      setTable(prev => {
        const next = prev.map(b => [...b])
        if (!next[h].includes(key)) next[h].push(key)
        return next
      })
      setLog(prev => [`插入 "${key}" → hash(${key}) = ${h}（鏈結法，加入桶 ${h}）`, ...prev.slice(0, 9)])
    } else {
      setTable(prev => {
        const next = prev.map(b => [...b])
        let probe = h
        let steps = 0
        while (next[probe].length > 0 && next[probe][0] !== key) {
          probe = (probe + 1) % size
          steps++
          if (steps >= size) return next // table full
        }
        next[probe] = [key]
        if (steps > 0) setLog(lprev => [`插入 "${key}" → hash=${h}，衝突 ${steps} 次，最終位置=${probe}`, ...lprev.slice(0, 9)])
        else setLog(lprev => [`插入 "${key}" → hash=${h}，無衝突，位置=${probe}`, ...lprev.slice(0, 9)])
        return next
      })
    }
    setInput('')
  }

  function search() {
    const key = input.trim()
    if (!key) return
    const h = simpleHash(key, size)
    setHighlight(h)

    if (method === 'chaining') {
      const found = table[h].includes(key)
      setLog(prev => [found ? `搜尋 "${key}" → 桶 ${h} 找到` : `搜尋 "${key}" → 桶 ${h} 未找到`, ...prev.slice(0, 9)])
    } else {
      let probe = h, steps = 0
      while (table[probe].length > 0 && table[probe][0] !== key) {
        probe = (probe + 1) % size; steps++
        if (steps >= size) break
      }
      const found = table[probe].length > 0 && table[probe][0] === key
      setLog(prev => [found ? `搜尋 "${key}" → 位置 ${probe} 找到（探測 ${steps + 1} 次）` : `搜尋 "${key}" → 未找到`, ...prev.slice(0, 9)])
    }
    setInput('')
  }

  function reset() {
    setTable(Array.from({ length: size }, () => []))
    setLog([])
    setHighlight(null)
  }

  const loadFactor = (() => {
    const filled = method === 'chaining'
      ? table.reduce((s, b) => s + b.length, 0)
      : table.filter(b => b.length > 0).length
    return (filled / size * 100).toFixed(0)
  })()

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>Hash Table 模擬器</h3>
      <p className="sim-desc">比較鏈結法（Chaining）和開放定址法（Open Addressing / Linear Probing）。</p>

      <div className="sim-controls">
        {METHODS.map(m => (
          <button key={m}
            className={`btn ${method === m ? 'btn-primary' : 'btn-secondary'}`}
            style={method === m ? { '--btn-color': color } : {}}
            onClick={() => { setMethod(m); reset() }}>
            {m === 'chaining' ? '鏈結法（Chaining）' : '開放定址（Linear Probing）'}
          </button>
        ))}
        {SIZES.map(s => (
          <button key={s}
            className={`btn ${size === s ? 'btn-primary' : 'btn-secondary'}`}
            style={size === s ? { '--btn-color': '#5a9ce8' } : {}}
            onClick={() => changeSize(s)}>
            Size={s}
          </button>
        ))}
      </div>

      <div className="hash-table-visual">
        {table.map((bucket, i) => (
          <div key={i} className={`hash-bucket ${highlight === i ? 'highlight' : ''}`}
            style={{ borderColor: highlight === i ? color : 'var(--clr-border)' }}>
            <span className="bucket-idx" style={{ color: highlight === i ? color : 'var(--clr-text-secondary)' }}>[{i}]</span>
            <span className="bucket-content">
              {bucket.length === 0 ? '—' : bucket.join(' → ')}
            </span>
          </div>
        ))}
      </div>

      <div className="sim-controls">
        <input className="sim-input" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && insert()}
          placeholder="輸入鍵值（字串或數字）" />
        <button className="btn btn-primary" style={{ '--btn-color': color }} onClick={insert}>插入</button>
        <button className="btn btn-secondary" onClick={search}>搜尋</button>
        <button className="btn btn-secondary" onClick={reset}>清空</button>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-secondary)' }}>
          負載因子：{loadFactor}%
        </span>
      </div>

      <div className="sim-log">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
