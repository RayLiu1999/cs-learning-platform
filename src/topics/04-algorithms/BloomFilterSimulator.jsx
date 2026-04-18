import { useState } from 'react'

const BIT_SIZE = 32

function hash1(str) {
  let h = 0
  for (let c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % BIT_SIZE
}

function hash2(str) {
  let h = 5381
  for (let c of str) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0
  return h % BIT_SIZE
}

function hash3(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h ^ (str.charCodeAt(i) * 2654435761)) >>> 0
  return h % BIT_SIZE
}

export default function BloomFilterSimulator({ color }) {
  const [bits, setBits] = useState(new Array(BIT_SIZE).fill(0))
  const [input, setInput] = useState('')
  const [log, setLog] = useState(['Bloom Filter 就緒（32 bits，3 個 Hash 函數）'])
  const [lastCheck, setLastCheck] = useState(null)

  function getHashes(str) {
    return [hash1(str), hash2(str), hash3(str)]
  }

  function insert() {
    if (!input.trim()) return
    const hashes = getHashes(input)
    const newBits = [...bits]
    hashes.forEach(h => { newBits[h] = 1 })
    setBits(newBits)
    setLog(prev => [`插入 "${input}" → 設置 bits [${hashes.join(', ')}]`, ...prev.slice(0, 9)])
    setLastCheck(null)
    setInput('')
  }

  function query() {
    if (!input.trim()) return
    const hashes = getHashes(input)
    const allSet = hashes.every(h => bits[h] === 1)
    setLastCheck({ word: input, hashes, result: allSet })
    setLog(prev => [
      allSet
        ? `查詢 "${input}" → bits [${hashes.join(', ')}] 全為 1 → 可能存在（可能是誤判！）`
        : `查詢 "${input}" → bits 中有 0 → 確定不存在`,
      ...prev.slice(0, 9)
    ])
    setInput('')
  }

  function reset() {
    setBits(new Array(BIT_SIZE).fill(0))
    setLog(['Bloom Filter 重置。'])
    setLastCheck(null)
  }

  const filledCount = bits.filter(b => b).length

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>Bloom Filter 模擬器</h3>
      <p className="sim-desc">
        Bloom Filter 使用多個 Hash 函數映射到 bit array。<strong>查詢結果為「可能存在」或「一定不存在」</strong>，存在誤判（False Positive）但無假陰性（False Negative）。
      </p>

      <div className="bloom-bits">
        {bits.map((b, i) => {
          const isHighlight = lastCheck?.hashes?.includes(i)
          return (
            <div key={i} className="bloom-bit"
              style={{
                background: b ? (isHighlight ? color : color + '88') : 'var(--clr-surface)',
                borderColor: isHighlight ? color : 'var(--clr-border)',
                color: b ? '#fff' : 'var(--clr-text-secondary)',
              }}>
              {b}
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-secondary)', marginBottom: 'var(--space-3)' }}>
        已使用 {filledCount}/{BIT_SIZE} bits — 誤判率估算：{((1 - Math.exp(-3 * filledCount / BIT_SIZE)) ** 3 * 100).toFixed(2)}%
      </div>

      {lastCheck && (
        <div className="card" style={{ borderColor: lastCheck.result ? '#e8c05a' : '#5ae8a0' }}>
          <strong style={{ color: lastCheck.result ? '#e8c05a' : '#5ae8a0' }}>
            "{lastCheck.word}"：{lastCheck.result ? '⚠️ 可能存在（可能誤判）' : '✅ 確定不存在'}
          </strong>
        </div>
      )}

      <div className="sim-controls">
        <input className="sim-input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && insert()} placeholder="輸入字串" />
        <button className="btn btn-primary" style={{ '--btn-color': color }} onClick={insert}>插入</button>
        <button className="btn btn-secondary" onClick={query}>查詢</button>
        <button className="btn btn-secondary" onClick={reset}>重置</button>
      </div>

      <div className="sim-controls" style={{ flexWrap: 'wrap' }}>
        {['apple', 'banana', 'cat', 'dog', 'elephant'].map(w => (
          <button key={w} className="btn btn-secondary" style={{ fontSize: 'var(--text-xs)' }}
            onClick={() => { setInput(w) }}>
            {w}
          </button>
        ))}
      </div>

      <div className="sim-log">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
