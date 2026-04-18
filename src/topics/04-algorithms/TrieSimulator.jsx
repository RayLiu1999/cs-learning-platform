import { useState } from 'react'

class TrieNode {
  constructor() {
    this.children = {}
    this.isEnd = false
    this.word = null
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode()
  }
  insert(word) {
    let node = this.root
    for (const c of word) {
      if (!node.children[c]) node.children[c] = new TrieNode()
      node = node.children[c]
    }
    node.isEnd = true
    node.word = word
  }
  search(word) {
    let node = this.root
    const path = []
    for (const c of word) {
      if (!node.children[c]) return { found: false, path }
      node = node.children[c]
      path.push(c)
    }
    return { found: node.isEnd, path, prefix: true }
  }
  startsWith(prefix) {
    let node = this.root
    for (const c of prefix) {
      if (!node.children[c]) return []
      node = node.children[c]
    }
    const results = []
    this._collect(node, prefix, results)
    return results
  }
  _collect(node, prefix, results) {
    if (node.isEnd) results.push(prefix)
    for (const c in node.children) this._collect(node.children[c], prefix + c, results)
  }
  toJSON(node = this.root, depth = 0) {
    const result = { label: depth === 0 ? 'root' : '', isEnd: node.isEnd, children: [] }
    for (const [c, child] of Object.entries(node.children)) {
      result.children.push({ char: c, isEnd: child.isEnd, node: child, children: Object.entries(child.children) })
    }
    return result
  }
}

function TrieNodeViz({ char, node, depth, highlight, color }) {
  if (depth > 4) return null
  const childEntries = Object.entries(node.children || {})
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: `2px solid ${node.isEnd ? color : highlight ? '#e8c05a' : 'var(--clr-border)'}`,
        background: node.isEnd ? color + '33' : 'var(--clr-surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 'var(--text-sm)',
        color: node.isEnd ? color : 'var(--clr-text)',
      }}>
        {char || '●'}
      </div>
      {childEntries.length > 0 && (
        <div style={{ display: 'flex', gap: 4 }}>
          {childEntries.map(([c, child]) => (
            <TrieNodeViz key={c} char={c} node={child} depth={depth + 1} highlight={false} color={color} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TrieSimulator({ color }) {
  const [trie] = useState(() => {
    const t = new Trie()
    ;['apple', 'app', 'apply', 'apt', 'bat', 'ball', 'be'].forEach(w => t.insert(w))
    return t
  })
  const [, forceUpdate] = useState(0)
  const [input, setInput] = useState('')
  const [mode, setMode] = useState('insert')
  const [suggestions, setSuggestions] = useState([])
  const [searchResult, setSearchResult] = useState(null)
  const [log, setLog] = useState(['已預載：apple, app, apply, apt, bat, ball, be'])

  function execute() {
    if (!input.trim()) return
    const word = input.trim().toLowerCase()

    if (mode === 'insert') {
      trie.insert(word)
      forceUpdate(n => n + 1)
      setLog(prev => [`插入 "${word}"`, ...prev.slice(0, 9)])
      setSuggestions([])
      setSearchResult(null)
    } else if (mode === 'search') {
      const result = trie.search(word)
      setSearchResult({ word, found: result.found })
      setLog(prev => [
        result.found ? `搜尋 "${word}" → ✅ 找到（完整單字）`
          : result.prefix ? `搜尋 "${word}" → ⚠️ 前綴存在但非完整單字`
          : `搜尋 "${word}" → ❌ 不存在`,
        ...prev.slice(0, 9)
      ])
      setSuggestions([])
    } else {
      const results = trie.startsWith(word)
      setSuggestions(results)
      setLog(prev => [`前綴 "${word}" 匹配 ${results.length} 個：${results.join(', ')}`, ...prev.slice(0, 9)])
      setSearchResult(null)
    }
    setInput('')
  }

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>Trie 字典樹模擬器</h3>
      <p className="sim-desc">Trie 用於高效的前綴搜尋（O(m)，m 為字串長度）。常見於自動補全、拼寫檢查、路由查詢。</p>

      <div className="sim-controls">
        {[['insert', '插入'], ['search', '搜尋'], ['prefix', '前綴補全']].map(([id, label]) => (
          <button key={id}
            className={`btn ${mode === id ? 'btn-primary' : 'btn-secondary'}`}
            style={mode === id ? { '--btn-color': color } : {}}
            onClick={() => setMode(id)}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto', padding: 'var(--space-3) 0' }}>
        <TrieNodeViz char="" node={trie.root} depth={0} highlight={false} color={color} />
      </div>

      {suggestions.length > 0 && (
        <div className="card" style={{ borderColor: color }}>
          <strong style={{ color }}>前綴補全結果：</strong>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {suggestions.map(s => (
              <span key={s} style={{ padding: '4px 10px', background: color + '22', borderRadius: 4, color, fontSize: 'var(--text-sm)' }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {searchResult && (
        <div className="card" style={{ borderColor: searchResult.found ? '#5ae8a0' : '#e85a5a' }}>
          <strong style={{ color: searchResult.found ? '#5ae8a0' : '#e85a5a' }}>
            {searchResult.found ? `✅ "${searchResult.word}" 存在` : `❌ "${searchResult.word}" 不存在`}
          </strong>
        </div>
      )}

      <div className="sim-controls">
        <input className="sim-input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && execute()}
          placeholder="輸入字串..." />
        <button className="btn btn-primary" style={{ '--btn-color': color }} onClick={execute}>
          {mode === 'insert' ? '插入' : mode === 'search' ? '搜尋' : '補全'}
        </button>
      </div>

      <div className="sim-log">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
