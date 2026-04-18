import { useState } from 'react'

const LEVELS = [
  {
    id: 'read_uncommitted',
    name: 'READ UNCOMMITTED',
    color: '#e85a5a',
    dirtyRead: true, nonRepeatableRead: true, phantomRead: true,
    desc: '可讀取未提交資料（Dirty Read）。幾乎不使用。',
  },
  {
    id: 'read_committed',
    name: 'READ COMMITTED',
    color: '#e8c05a',
    dirtyRead: false, nonRepeatableRead: true, phantomRead: true,
    desc: '只讀已提交資料，但同一事務兩次讀取可能不同（Non-Repeatable Read）。Oracle/SQL Server 預設。',
  },
  {
    id: 'repeatable_read',
    name: 'REPEATABLE READ',
    color: '#5a9ce8',
    dirtyRead: false, nonRepeatableRead: false, phantomRead: true,
    desc: '同一事務重複讀取結果一致，但範圍查詢可能出現幽靈行（Phantom Read）。MySQL InnoDB 預設（MVCC 解決大部分幻讀）。',
  },
  {
    id: 'serializable',
    name: 'SERIALIZABLE',
    color: '#5ae8a0',
    dirtyRead: false, nonRepeatableRead: false, phantomRead: false,
    desc: '完全串行化，效能最低，但無任何隔離問題。',
  },
]

const SCENARIOS = [
  {
    id: 'dirty_read',
    name: '臟讀（Dirty Read）',
    steps: [
      'T1 開始，修改 balance = 500（未提交）',
      'T2 讀取 balance → 500（讀到未提交資料！）',
      'T1 回滾，balance 回到 100',
      'T2 讀到的 500 是「臟資料」',
    ],
    affected: 'read_uncommitted',
  },
  {
    id: 'nonrepeatable_read',
    name: '不可重複讀（Non-Repeatable Read）',
    steps: [
      'T1 讀取 balance → 100',
      'T2 修改 balance = 200 並提交',
      'T1 再次讀取 balance → 200（結果不同！）',
      '同一事務兩次讀取結果不一致',
    ],
    affected: ['read_uncommitted', 'read_committed'],
  },
  {
    id: 'phantom_read',
    name: '幻讀（Phantom Read）',
    steps: [
      'T1：SELECT COUNT(*) WHERE age > 20 → 5 筆',
      'T2：INSERT INTO users (age=25) 並提交',
      'T1：SELECT COUNT(*) WHERE age > 20 → 6 筆（多出一行！）',
      '範圍查詢出現新行 = 幻讀',
    ],
    affected: ['read_uncommitted', 'read_committed', 'repeatable_read'],
  },
]

export default function IsolationLevelSimulator({ color }) {
  const [level, setLevel] = useState('repeatable_read')
  const [scenario, setScenario] = useState('dirty_read')
  const [stepIdx, setStepIdx] = useState(-1)
  const current = LEVELS.find(l => l.id === level)
  const sc = SCENARIOS.find(s => s.id === scenario)
  const occurs = Array.isArray(sc.affected) ? sc.affected.includes(level) : sc.affected === level

  function next() { if (stepIdx < sc.steps.length - 1) setStepIdx(prev => prev + 1) }
  function reset() { setStepIdx(-1) }

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>隔離級別模擬器</h3>
      <p className="sim-desc">選擇隔離級別，觀察在不同異常場景下是否出現問題。</p>

      <div className="sim-controls">
        {LEVELS.map(l => (
          <button key={l.id}
            className={`btn ${level === l.id ? 'btn-primary' : 'btn-secondary'}`}
            style={level === l.id ? { '--btn-color': l.color } : {}}
            onClick={() => { setLevel(l.id); reset() }}>
            {l.name}
          </button>
        ))}
      </div>

      <div className="card" style={{ borderColor: current.color }}>
        <strong style={{ color: current.color }}>{current.name}</strong>
        <p>{current.desc}</p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
          {[['臟讀', current.dirtyRead], ['不可重複讀', current.nonRepeatableRead], ['幻讀', current.phantomRead]].map(([label, val]) => (
            <span key={label} style={{
              padding: '2px 8px', borderRadius: 4, fontSize: 'var(--text-xs)',
              background: val ? '#e85a5a22' : '#5ae8a022',
              color: val ? '#e85a5a' : '#5ae8a0'
            }}>
              {val ? '⚠️' : '✅'} {label}
            </span>
          ))}
        </div>
      </div>

      <div className="sim-controls" style={{ flexWrap: 'wrap' }}>
        {SCENARIOS.map(s => (
          <button key={s.id}
            className={`btn ${scenario === s.id ? 'btn-primary' : 'btn-secondary'}`}
            style={scenario === s.id ? { '--btn-color': color } : {}}
            onClick={() => { setScenario(s.id); reset() }}>
            {s.name}
          </button>
        ))}
      </div>

      <div className="sim-steps">
        {sc.steps.map((step, i) => (
          <div key={i} className={`sim-step ${i === stepIdx ? 'active' : ''} ${i < stepIdx ? 'done' : ''}`}
            style={{ '--step-color': color }}>
            <span className="sim-step-num">{i + 1}</span>
            <span className="sim-step-label">{step}</span>
          </div>
        ))}
      </div>

      {stepIdx === sc.steps.length - 1 && (
        <div className="card" style={{ borderColor: occurs ? '#e85a5a' : '#5ae8a0' }}>
          {occurs
            ? <strong style={{ color: '#e85a5a' }}>⚠️ 在 {current.name} 下，{sc.name} 問題存在！</strong>
            : <strong style={{ color: '#5ae8a0' }}>✅ 在 {current.name} 下，{sc.name} 問題不存在。</strong>
          }
        </div>
      )}

      <div className="sim-controls">
        <button className="btn btn-primary" style={{ '--btn-color': color }}
          onClick={next} disabled={stepIdx >= sc.steps.length - 1}>下一步 ▶</button>
        <button className="btn btn-secondary" onClick={reset}>重置</button>
      </div>
    </div>
  )
}
