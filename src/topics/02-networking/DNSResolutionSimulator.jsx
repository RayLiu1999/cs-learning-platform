import { useState, useRef } from 'react'

const STEPS = [
  { label: '瀏覽器快取', desc: '瀏覽器檢查本地 DNS 快取（TTL 未到期則直接返回）', color: '#5ae8a0' },
  { label: 'OS 快取 / hosts', desc: '作業系統 DNS 快取 + /etc/hosts 文件查詢', color: '#5ae8a0' },
  { label: '本地 DNS Resolver', desc: 'ISP 提供的遞迴解析器（Recursive Resolver），查自身快取', color: '#5a9ce8' },
  { label: '根域名伺服器', desc: '根伺服器（.）返回 .com TLD 伺服器的 NS 記錄（全球 13 組）', color: '#e8c05a' },
  { label: 'TLD 伺服器', desc: '.com TLD 伺服器返回 example.com 的權威 NS 伺服器地址', color: '#e8915a' },
  { label: '權威 DNS 伺服器', desc: 'example.com 的權威 DNS 返回最終 A/AAAA 記錄（IP 位址）', color: '#e85a5a' },
  { label: '返回 IP，建立連線', desc: 'Resolver 快取結果（TTL），瀏覽器建立 TCP 連線', color: '#7c5ae8' },
]

const RECORD_TYPES = [
  { type: 'A', desc: '域名 → IPv4 地址', example: 'example.com → 93.184.216.34' },
  { type: 'AAAA', desc: '域名 → IPv6 地址', example: 'example.com → 2606:2800::1' },
  { type: 'CNAME', desc: '域名別名（Alias）', example: 'www.example.com → example.com' },
  { type: 'MX', desc: '郵件交換記錄', example: 'example.com → mail.example.com' },
  { type: 'NS', desc: '名稱伺服器記錄', example: 'example.com → ns1.example.com' },
  { type: 'TXT', desc: '文字記錄（SPF, DKIM）', example: 'v=spf1 include:... -all' },
]

export default function DNSResolutionSimulator({ color }) {
  const [stepIdx, setStepIdx] = useState(-1)
  const [log, setLog] = useState([])

  function next() {
    const n = stepIdx + 1
    if (n < STEPS.length) {
      setStepIdx(n)
      setLog(prev => [...prev, `步驟 ${n + 1} — ${STEPS[n].label}：${STEPS[n].desc}`])
    }
  }

  function reset() { setStepIdx(-1); setLog([]) }

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>DNS 解析流程模擬器</h3>
      <p className="sim-desc">模擬 example.com 的完整 DNS 解析過程，從瀏覽器快取到權威伺服器。</p>

      <div className="dns-chain">
        {STEPS.map((s, i) => (
          <div key={i} className={`dns-node ${i <= stepIdx ? 'active' : ''}`}
            style={{ borderColor: i <= stepIdx ? s.color : undefined }}>
            <div className="dns-node-label" style={{ color: i <= stepIdx ? s.color : undefined }}>{s.label}</div>
            {i < STEPS.length - 1 && <div className="dns-arrow">↓</div>}
          </div>
        ))}
      </div>

      {stepIdx >= 0 && (
        <div className="dns-detail card" style={{ borderColor: STEPS[stepIdx].color }}>
          <strong style={{ color: STEPS[stepIdx].color }}>{STEPS[stepIdx].label}</strong>
          <p>{STEPS[stepIdx].desc}</p>
        </div>
      )}

      <div className="sim-controls">
        <button className="btn btn-primary" style={{ '--btn-color': color }}
          onClick={next} disabled={stepIdx >= STEPS.length - 1}>下一步 ▶</button>
        <button className="btn btn-secondary" onClick={reset}>重置</button>
      </div>

      <div className="sim-log">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>

      <div className="dns-records">
        <h4>常見 DNS 記錄類型</h4>
        <div className="sim-compare">
          {RECORD_TYPES.map(r => (
            <div key={r.type} className="sim-compare-col dns-record-card">
              <strong style={{ color }}>{r.type}</strong>
              <p>{r.desc}</p>
              <code>{r.example}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
