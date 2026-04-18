import { useState } from 'react'

// Simple B+ Tree node structure for visual simulation
// We'll keep it to 3-order for clarity
const ORDER = 3 // max 2 keys per node

function createLeaf(keys, values) {
  return { keys: [...keys], values: [...values], children: null, isLeaf: true }
}

function createInternal(keys, children) {
  return { keys: [...keys], children: [...children], isLeaf: false }
}

// Simplified B+ Tree insert (visual only, not full implementation)
class BPlusTree {
  constructor() {
    this.root = { keys: [], values: [], children: null, isLeaf: true }
    this.searchPath = []
  }

  insert(key, value) {
    this.searchPath = []
    // Very simplified: just maintain a sorted list for display
    const allKeys = this._getAllKeys(this.root)
    if (!allKeys.includes(key)) {
      allKeys.push(key)
      allKeys.sort((a, b) => a - b)
    }
    // Rebuild tree from sorted keys
    this.root = this._buildTree(allKeys)
  }

  _getAllKeys(node) {
    if (!node) return []
    const keys = [...node.keys]
    if (!node.isLeaf && node.children) {
      node.children.forEach(c => this._getAllKeys(c).forEach(k => { if (!keys.includes(k)) keys.push(k) }))
    }
    return keys
  }

  _buildTree(sortedKeys) {
    if (sortedKeys.length <= ORDER) {
      return { keys: sortedKeys, values: sortedKeys.map(k => `v${k}`), children: null, isLeaf: true }
    }
    // Split into leaf nodes
    const leaves = []
    for (let i = 0; i < sortedKeys.length; i += ORDER) {
      const chunk = sortedKeys.slice(i, i + ORDER)
      leaves.push({ keys: chunk, values: chunk.map(k => `v${k}`), children: null, isLeaf: true })
    }
    // Build internal node
    const internalKeys = leaves.slice(1).map(l => l.keys[0])
    return { keys: internalKeys, children: leaves, isLeaf: false }
  }

  search(key) {
    this.searchPath = []
    return this._search(this.root, key)
  }

  _search(node, key) {
    if (!node) return null
    this.searchPath.push({ keys: node.keys, isLeaf: node.isLeaf, target: key })
    if (node.isLeaf) {
      return node.keys.includes(key) ? `v${key}` : null
    }
    let i = 0
    while (i < node.keys.length && key >= node.keys[i]) i++
    return this._search(node.children[i], key)
  }
}

function NodeBox({ node, highlight }) {
  if (!node) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex', border: `2px solid ${highlight ? '#5ae8a0' : 'var(--clr-border)'}`, borderRadius: 6, overflow: 'hidden' }}>
        {node.keys.map((k, i) => (
          <div key={i} style={{
            padding: '4px 10px',
            borderRight: i < node.keys.length - 1 ? '1px solid var(--clr-border)' : 'none',
            background: highlight ? '#5ae8a022' : 'var(--clr-surface)',
            color: 'var(--clr-text)', fontSize: 'var(--text-sm)', fontFamily: 'monospace'
          }}>{k}</div>
        ))}
      </div>
      {!node.isLeaf && node.children && (
        <div style={{ display: 'flex', gap: 8 }}>
          {node.children.map((c, i) => <NodeBox key={i} node={c} highlight={false} />)}
        </div>
      )}
    </div>
  )
}

export default function BPlusTreeSimulator({ color }) {
  const [tree] = useState(() => new BPlusTree())
  const [root, setRoot] = useState(tree.root)
  const [inputKey, setInputKey] = useState('')
  const [log, setLog] = useState(['B+ Tree 模擬器就緒（階數 3）'])
  const [searchPath, setSearchPath] = useState([])

  function insert() {
    const k = parseInt(inputKey)
    if (isNaN(k)) return
    tree.insert(k, `v${k}`)
    setRoot({ ...tree.root })
    setLog(prev => [`插入鍵 ${k} 完成`, ...prev.slice(0, 9)])
    setSearchPath([])
    setInputKey('')
  }

  function search() {
    const k = parseInt(inputKey)
    if (isNaN(k)) return
    const result = tree.search(k)
    setSearchPath([...tree.searchPath])
    if (result) {
      setLog(prev => [`搜尋 ${k}：找到 ${result}`, ...prev.slice(0, 9)])
    } else {
      setLog(prev => [`搜尋 ${k}：未找到`, ...prev.slice(0, 9)])
    }
    setInputKey('')
  }

  function batchInsert() {
    [10, 20, 5, 30, 15, 25, 8, 12].forEach(k => tree.insert(k, `v${k}`))
    setRoot({ ...tree.root })
    setLog(['批次插入 [5,8,10,12,15,20,25,30] 完成'])
    setSearchPath([])
  }

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>B+ Tree 視覺化模擬器</h3>
      <p className="sim-desc">插入鍵值，觀察 B+ Tree 的結構。B+ Tree 所有資料存於葉節點，內節點僅為索引。</p>

      <div className="sim-controls">
        <input className="sim-input" type="number" placeholder="輸入鍵值（整數）"
          value={inputKey} onChange={e => setInputKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && insert()} />
        <button className="btn btn-primary" style={{ '--btn-color': color }} onClick={insert}>插入</button>
        <button className="btn btn-primary" style={{ '--btn-color': '#5a9ce8' }} onClick={search}>搜尋</button>
        <button className="btn btn-secondary" onClick={batchInsert}>批次插入範例</button>
      </div>

      <div style={{ overflowX: 'auto', padding: 'var(--space-4) 0' }}>
        <NodeBox node={root} highlight={false} />
      </div>

      {searchPath.length > 0 && (
        <div className="card" style={{ borderColor: '#5ae8a0' }}>
          <strong style={{ color: '#5ae8a0' }}>搜尋路徑</strong>
          {searchPath.map((step, i) => (
            <div key={i} style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-secondary)' }}>
              {step.isLeaf ? '🍃 葉節點' : '📦 內部節點'} [{step.keys.join(', ')}] — 查找 {step.target}
            </div>
          ))}
        </div>
      )}

      <div className="sim-log">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
