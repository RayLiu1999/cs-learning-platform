import { useState } from 'react'

const QUERIES = [
  {
    id: 'q1',
    label: '全表掃描（無索引）',
    sql: 'SELECT * FROM orders WHERE amount > 100',
    plan: [
      { op: 'Table Scan', table: 'orders', rows: 50000, extra: '-- no index --', cost: 9800 },
    ],
    totalCost: 9800,
    explain: '沒有索引，MySQL 需掃描全表 50,000 行，成本最高。',
  },
  {
    id: 'q2',
    label: '索引掃描',
    sql: 'SELECT * FROM orders WHERE amount > 100\n(有 amount 索引)',
    plan: [
      { op: 'Index Range Scan', table: 'orders', rows: 1200, extra: 'Using index condition', cost: 480 },
    ],
    totalCost: 480,
    explain: '利用 B+ Tree 索引，只掃描符合條件的 1,200 行，效能大幅提升。',
  },
  {
    id: 'q3',
    label: 'Nested Loop Join',
    sql: 'SELECT * FROM orders o\nJOIN users u ON o.user_id = u.id\nWHERE u.city = "Taipei"',
    plan: [
      { op: 'Index Scan', table: 'users', rows: 100, extra: 'city 索引', cost: 40 },
      { op: 'Nested Loop', table: 'orders', rows: 300, extra: 'outer: users(100) × inner: orders(3)', cost: 300 },
    ],
    totalCost: 340,
    explain: 'Nested Loop Join：適合小結果集，外層 100 行 × 內層每行 3 筆 = 300 次查詢。',
  },
  {
    id: 'q4',
    label: 'Hash Join',
    sql: 'SELECT * FROM orders o\nJOIN big_log l ON o.id = l.order_id',
    plan: [
      { op: 'Table Scan', table: 'orders', rows: 50000, extra: 'Build Hash Table', cost: 9800 },
      { op: 'Hash Join', table: 'big_log', rows: 500000, extra: 'Probe phase', cost: 8500 },
    ],
    totalCost: 18300,
    explain: 'Hash Join：大資料集 Join，先建立 Hash Table，再做一次掃描完成匹配。比 Nested Loop 更適合大表。',
  },
  {
    id: 'q5',
    label: '覆蓋索引',
    sql: 'SELECT id, amount FROM orders WHERE amount > 100\n(idx_amount_id: amount, id)',
    plan: [
      { op: 'Index Only Scan', table: 'orders', rows: 1200, extra: 'Using index（無需回表）', cost: 120 },
    ],
    totalCost: 120,
    explain: '覆蓋索引：SELECT 欄位都在索引中，無需回表（No Heap Fetch），成本最低。',
  },
]

export default function QueryPlanSimulator({ color }) {
  const [selected, setSelected] = useState('q2')
  const q = QUERIES.find(x => x.id === selected)

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>查詢計劃分析器（EXPLAIN 模擬）</h3>
      <p className="sim-desc">模擬不同查詢情境的執行計劃，理解 MySQL EXPLAIN 輸出與查詢優化。</p>

      <div className="sim-controls" style={{ flexWrap: 'wrap' }}>
        {QUERIES.map(qq => (
          <button key={qq.id}
            className={`btn ${selected === qq.id ? 'btn-primary' : 'btn-secondary'}`}
            style={selected === qq.id ? { '--btn-color': color } : {}}
            onClick={() => setSelected(qq.id)}>
            {qq.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ borderColor: color }}>
        <h4 style={{ color }}>SQL</h4>
        <pre style={{ margin: 0, fontSize: 'var(--text-sm)' }}><code>{q.sql}</code></pre>
      </div>

      <div className="query-plan">
        <h4>EXPLAIN 輸出</h4>
        <table className="stats-table">
          <thead>
            <tr><th>操作</th><th>Table</th><th>掃描行數</th><th>Extra</th><th>估計成本</th></tr>
          </thead>
          <tbody>
            {q.plan.map((p, i) => (
              <tr key={i}>
                <td style={{ color }}><strong>{p.op}</strong></td>
                <td>{p.table}</td>
                <td>{p.rows.toLocaleString()}</td>
                <td style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)' }}>{p.extra}</td>
                <td><strong>{p.cost.toLocaleString()}</strong></td>
              </tr>
            ))}
            <tr style={{ borderTop: '2px solid var(--clr-border)' }}>
              <td colSpan={4}><strong>總成本</strong></td>
              <td><strong style={{ color }}>{q.totalCost.toLocaleString()}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card" style={{ borderColor: '#5a9ce8' }}>
        <strong style={{ color: '#5a9ce8' }}>優化建議</strong>
        <p>{q.explain}</p>
      </div>
    </div>
  )
}
