import { useState } from 'react'

const PROTOCOLS = [
  {
    id: 'rest',
    name: 'REST',
    color: '#5a9ce8',
    transport: 'HTTP/1.1 or HTTP/2',
    format: 'JSON / XML（文字）',
    features: ['無狀態（Stateless）', 'URI 資源導向', '瀏覽器友善', '快取支援（HTTP 快取）'],
    weaknesses: ['Over-fetching / Under-fetching', '多次 RTT（N+1 問題）', 'Header 重複（無壓縮）'],
    payloadSize: '~500B（JSON 欄位名稱重複）',
    example: 'GET /users/1\nGET /users/1/orders',
  },
  {
    id: 'grpc',
    name: 'gRPC',
    color: '#7c5ae8',
    transport: 'HTTP/2（必要）',
    format: 'Protocol Buffers（二進位）',
    features: ['強型別（.proto Schema）', '雙向 Streaming', '低延遲、高吞吐', 'Deadline / Cancellation'],
    weaknesses: ['瀏覽器支援有限（需 grpc-web）', '除錯困難（二進位）', '.proto 版本管理'],
    payloadSize: '~100B（Protobuf 欄位索引）',
    example: 'service UserService {\n  rpc GetUser(UserRequest)\n    returns (UserResponse);\n}',
  },
  {
    id: 'graphql',
    name: 'GraphQL',
    color: '#e85a9a',
    transport: 'HTTP/1.1（POST）',
    format: 'JSON',
    features: ['按需取回（精確欄位）', '單一端點', '型別系統（SDL）', 'Subscription（WebSocket）'],
    weaknesses: ['N+1 查詢問題（需 DataLoader）', '快取難度高', 'Query 複雜度攻擊'],
    payloadSize: '~200B（按需選取欄位）',
    example: 'query {\n  user(id: "1") {\n    name\n    orders { total }\n  }\n}',
  },
]

export default function APIProtocolSimulator({ color }) {
  const [selected, setSelected] = useState('rest')
  const p = PROTOCOLS.find(x => x.id === selected)

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>API 協定比較模擬器</h3>
      <p className="sim-desc">比較 REST、gRPC、GraphQL 的設計理念、適用場景與 Payload 大小。</p>

      <div className="sim-controls">
        {PROTOCOLS.map(pr => (
          <button key={pr.id}
            className={`btn ${selected === pr.id ? 'btn-primary' : 'btn-secondary'}`}
            style={selected === pr.id ? { '--btn-color': pr.color } : {}}
            onClick={() => setSelected(pr.id)}>
            {pr.name}
          </button>
        ))}
      </div>

      <div className="api-detail card" style={{ borderColor: p.color }}>
        <h4 style={{ color: p.color }}>{p.name}</h4>
        <p><strong>傳輸層：</strong>{p.transport}</p>
        <p><strong>序列化格式：</strong>{p.format}</p>
        <p><strong>典型 Payload：</strong>{p.payloadSize}</p>

        <div className="api-sections">
          <div>
            <h5>優點</h5>
            <ul>{p.features.map((f, i) => <li key={i}>{f}</li>)}</ul>
          </div>
          <div>
            <h5>缺點</h5>
            <ul className="problems">{p.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </div>
        </div>

        <div className="api-example">
          <h5>範例</h5>
          <pre><code>{p.example}</code></pre>
        </div>
      </div>

      <div className="api-compare">
        <h4>三者對比表</h4>
        <table className="stats-table">
          <thead>
            <tr><th>維度</th><th style={{ color: '#5a9ce8' }}>REST</th><th style={{ color: '#7c5ae8' }}>gRPC</th><th style={{ color: '#e85a9a' }}>GraphQL</th></tr>
          </thead>
          <tbody>
            {[
              ['最佳場景', '公開 API / 瀏覽器', '微服務內部通信', '複雜前端查詢'],
              ['效能', '中', '高（Protobuf）', '中（取決查詢）'],
              ['型別安全', '無（需文件）', '強（.proto）', '強（SDL）'],
              ['瀏覽器支援', '✅ 原生', '⚠️ 需 grpc-web', '✅ 原生'],
              ['Streaming', '❌', '✅ 雙向', '✅ Subscription'],
            ].map(([dim, ...vals]) => (
              <tr key={dim}><td>{dim}</td>{vals.map((v, i) => <td key={i}>{v}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
