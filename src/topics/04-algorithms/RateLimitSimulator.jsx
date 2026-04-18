import { useState, useRef } from 'react'

export default function RateLimitSimulator({ color }) {
  const [algo, setAlgo] = useState('token-bucket')
  const [log, setLog] = useState([])

  // Token Bucket state
  const tokenState = useRef({ tokens: 10, maxTokens: 10, refillRate: 2 })
  const [tokenDisplay, setTokenDisplay] = useState(10)

  // Leaky Bucket state
  const leakyQueue = useRef([])
  const [leakyQueueDisplay, setLeakyQueueDisplay] = useState([])
  const leakyTimer = useRef(null)

  // Sliding Window state
  const windowLog = useRef([]) // timestamps
  const WINDOW_MS = 5000, WINDOW_LIMIT = 5
  const [windowCount, setWindowCount] = useState(0)

  // Refill tokens every 2s
  const refillTimer = useRef(null)
  if (!refillTimer.current) {
    refillTimer.current = setInterval(() => {
      const s = tokenState.current
      if (s.tokens < s.maxTokens) {
        s.tokens = Math.min(s.tokens + s.refillRate, s.maxTokens)
        setTokenDisplay(s.tokens)
      }
    }, 1000)
  }

  // Leaky bucket drain
  if (!leakyTimer.current) {
    leakyTimer.current = setInterval(() => {
      if (leakyQueue.current.length > 0) {
        leakyQueue.current.shift()
        setLeakyQueueDisplay([...leakyQueue.current])
        setLog(prev => [`漏桶：處理一個請求（漏出 1）`, ...prev.slice(0, 9)])
      }
    }, 800)
  }

  function sendRequest() {
    const now = Date.now()
    if (algo === 'token-bucket') {
      if (tokenState.current.tokens >= 1) {
        tokenState.current.tokens--
        setTokenDisplay(tokenState.current.tokens)
        setLog(prev => [`✅ 請求通過（令牌消耗，剩餘 ${tokenState.current.tokens}）`, ...prev.slice(0, 9)])
      } else {
        setLog(prev => [`❌ 請求被拒絕（令牌不足，剩餘 0）`, ...prev.slice(0, 9)])
      }
    } else if (algo === 'leaky-bucket') {
      if (leakyQueue.current.length < 8) {
        leakyQueue.current.push(now)
        setLeakyQueueDisplay([...leakyQueue.current])
        setLog(prev => [`📥 請求入隊（隊列 ${leakyQueue.current.length}/8）`, ...prev.slice(0, 9)])
      } else {
        setLog(prev => [`❌ 請求被丟棄（漏桶已滿 8/8）`, ...prev.slice(0, 9)])
      }
    } else { // sliding-window
      const cutoff = now - WINDOW_MS
      windowLog.current = windowLog.current.filter(t => t > cutoff)
      if (windowLog.current.length < WINDOW_LIMIT) {
        windowLog.current.push(now)
        setWindowCount(windowLog.current.length)
        setLog(prev => [`✅ 請求通過（窗口內 ${windowLog.current.length}/${WINDOW_LIMIT}）`, ...prev.slice(0, 9)])
      } else {
        setWindowCount(windowLog.current.length)
        setLog(prev => [`❌ 限流！窗口內已達 ${WINDOW_LIMIT} 個請求（5秒內）`, ...prev.slice(0, 9)])
      }
    }
  }

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>限流演算法模擬器</h3>
      <p className="sim-desc">比較令牌桶（Token Bucket）、漏桶（Leaky Bucket）、滑動視窗（Sliding Window）。</p>

      <div className="sim-controls">
        {[['token-bucket', '令牌桶'], ['leaky-bucket', '漏桶'], ['sliding-window', '滑動視窗']].map(([id, label]) => (
          <button key={id}
            className={`btn ${algo === id ? 'btn-primary' : 'btn-secondary'}`}
            style={algo === id ? { '--btn-color': color } : {}}
            onClick={() => setAlgo(id)}>
            {label}
          </button>
        ))}
      </div>

      {algo === 'token-bucket' && (
        <div className="rate-visual card" style={{ borderColor: color }}>
          <h4 style={{ color }}>令牌桶（容量 10，補充 2/s）</h4>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{
                width: 32, height: 32, borderRadius: '50%',
                background: i < tokenDisplay ? color : 'var(--clr-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: i < tokenDisplay ? '#fff' : 'var(--clr-text-secondary)',
                fontSize: 'var(--text-xs)'
              }}>🪙</div>
            ))}
          </div>
          <p>剩餘令牌：{tokenDisplay} / 10</p>
        </div>
      )}

      {algo === 'leaky-bucket' && (
        <div className="rate-visual card" style={{ borderColor: color }}>
          <h4 style={{ color }}>漏桶（容量 8，每 800ms 處理 1 個）</h4>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: 4,
                background: i < leakyQueueDisplay.length ? color + 'bb' : 'var(--clr-surface)',
                border: `1px solid ${i < leakyQueueDisplay.length ? color : 'var(--clr-border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--text-xs)', color: 'var(--clr-text-secondary)'
              }}>{i < leakyQueueDisplay.length ? '📦' : ''}</div>
            ))}
          </div>
          <p>隊列：{leakyQueueDisplay.length}/8</p>
        </div>
      )}

      {algo === 'sliding-window' && (
        <div className="rate-visual card" style={{ borderColor: color }}>
          <h4 style={{ color }}>滑動視窗（5秒窗口，最多 5 個請求）</h4>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: WINDOW_LIMIT }, (_, i) => (
              <div key={i} style={{
                width: 40, height: 40, borderRadius: 4,
                background: i < windowCount ? color : 'var(--clr-surface)',
                border: `1px solid ${i < windowCount ? color : 'var(--clr-border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--text-sm)'
              }}>{i < windowCount ? '✓' : ''}</div>
            ))}
          </div>
          <p>窗口內請求：{windowCount}/{WINDOW_LIMIT}</p>
        </div>
      )}

      <div className="sim-controls">
        <button className="btn btn-primary" style={{ '--btn-color': color }} onClick={sendRequest}>
          傳送請求 ▶
        </button>
        <button className="btn btn-primary" style={{ '--btn-color': color }}
          onClick={() => { for (let i = 0; i < 8; i++) setTimeout(sendRequest, i * 100) }}>
          壓力測試（8 個請求）
        </button>
      </div>

      <div className="sim-log">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
