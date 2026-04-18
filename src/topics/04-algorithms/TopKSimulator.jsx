import { useState, useRef } from 'react'

// Min-heap implementation
class MinHeap {
  constructor(k) {
    this.k = k
    this.heap = []
  }
  insert(val) {
    if (this.heap.length < this.k) {
      this.heap.push(val)
      this._bubbleUp(this.heap.length - 1)
    } else if (val > this.heap[0]) {
      this.heap[0] = val
      this._siftDown(0)
    }
  }
  _bubbleUp(i) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2)
      if (this.heap[p] <= this.heap[i]) break
      ;[this.heap[p], this.heap[i]] = [this.heap[i], this.heap[p]]
      i = p
    }
  }
  _siftDown(i) {
    const n = this.heap.length
    while (true) {
      let min = i, l = 2 * i + 1, r = 2 * i + 2
      if (l < n && this.heap[l] < this.heap[min]) min = l
      if (r < n && this.heap[r] < this.heap[min]) min = r
      if (min === i) break
      ;[this.heap[min], this.heap[i]] = [this.heap[i], this.heap[min]]
      i = min
    }
  }
  top() { return this.heap[0] }
  sorted() { return [...this.heap].sort((a, b) => b - a) }
}

export default function TopKSimulator({ color }) {
  const [k, setK] = useState(5)
  const [input, setInput] = useState('')
  const [stream, setStream] = useState([])
  const heapRef = useRef(new MinHeap(5))
  const [heapSnapshot, setHeapSnapshot] = useState([])
  const [log, setLog] = useState(['Top-K 模擬器就緒。輸入數值加入資料流。'])

  function changeK(newK) {
    setK(newK)
    heapRef.current = new MinHeap(newK)
    stream.forEach(v => heapRef.current.insert(v))
    setHeapSnapshot(heapRef.current.sorted())
  }

  function addValue(val) {
    const v = parseInt(val)
    if (isNaN(v)) return
    setStream(prev => [...prev, v])
    const heap = heapRef.current
    const oldTop = heap.top()
    heap.insert(v)
    const newSnapshot = heap.sorted()
    setHeapSnapshot(newSnapshot)

    if (heap.heap.length <= k) {
      setLog(prev => [`插入 ${v}（堆積填充中 ${heap.heap.length}/${k}）`, ...prev.slice(0, 9)])
    } else if (v > oldTop) {
      setLog(prev => [`插入 ${v} > 堆頂 ${oldTop}，替換進入 Top-${k}`, ...prev.slice(0, 9)])
    } else {
      setLog(prev => [`插入 ${v} ≤ 堆頂 ${oldTop}，不進入 Top-${k}`, ...prev.slice(0, 9)])
    }
    setInput('')
  }

  function batchInsert() {
    const vals = [42, 7, 99, 15, 63, 28, 91, 5, 77, 34, 56, 88, 12, 47, 72]
    vals.forEach(v => {
      setStream(prev => [...prev, v])
      heapRef.current.insert(v)
    })
    setHeapSnapshot(heapRef.current.sorted())
    setLog([`批次插入 ${vals.length} 個數值`])
  }

  function reset() {
    heapRef.current = new MinHeap(k)
    setStream([])
    setHeapSnapshot([])
    setLog(['重置。'])
  }

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>Top-K 最小堆模擬器</h3>
      <p className="sim-desc">
        使用大小為 K 的<strong>最小堆</strong>維護 Top-K 元素。遇到比堆頂大的元素才替換，時間複雜度 O(n log K)，空間 O(K)。
      </p>

      <div className="sim-controls">
        <label>K = </label>
        {[3, 5, 8].map(kk => (
          <button key={kk}
            className={`btn ${k === kk ? 'btn-primary' : 'btn-secondary'}`}
            style={k === kk ? { '--btn-color': color } : {}}
            onClick={() => changeK(kk)}>
            K={kk}
          </button>
        ))}
      </div>

      {/* Min Heap Visual */}
      <div className="card" style={{ borderColor: color }}>
        <h4 style={{ color }}>最小堆（堆頂 = 當前 Top-{k} 中最小值）</h4>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {heapSnapshot.map((v, i) => (
            <div key={i} style={{
              padding: '8px 14px', borderRadius: 6,
              background: i === heapSnapshot.length - 1 ? color + '22' : 'var(--clr-surface)',
              border: `2px solid ${i === heapSnapshot.length - 1 ? '#e8c05a' : color}`,
              color: i === heapSnapshot.length - 1 ? '#e8c05a' : color,
              fontWeight: 600, fontSize: 'var(--text-base)',
              position: 'relative',
            }}>
              {v}
              {i === heapSnapshot.length - 1 && (
                <span style={{ position: 'absolute', top: -8, right: -6, fontSize: 10, background: '#e8c05a', color: '#000', borderRadius: 4, padding: '1px 4px' }}>min</span>
              )}
            </div>
          ))}
          {heapSnapshot.length === 0 && <span style={{ color: 'var(--clr-text-secondary)' }}>（空）</span>}
        </div>
        {heapSnapshot.length > 0 && (
          <p style={{ marginTop: 'var(--space-2)', color: 'var(--clr-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Top-{k} 排名（從大到小）：{heapSnapshot.join(' &gt; ')}
          </p>
        )}
      </div>

      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-secondary)' }}>
        資料流（{stream.length} 個元素）：{stream.slice(-20).join(', ')}{stream.length > 20 ? '...' : ''}
      </div>

      <div className="sim-controls">
        <input className="sim-input" type="number" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addValue(input)}
          placeholder="輸入數值" style={{ width: 120 }} />
        <button className="btn btn-primary" style={{ '--btn-color': color }} onClick={() => addValue(input)}>
          加入資料流
        </button>
        <button className="btn btn-secondary" onClick={batchInsert}>批次插入範例</button>
        <button className="btn btn-secondary" onClick={reset}>重置</button>
      </div>

      <div className="sim-log">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
