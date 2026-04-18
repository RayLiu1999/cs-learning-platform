import { useState } from 'react'

const THREADS = ['Thread 1', 'Thread 2']
const RESOURCES = ['Lock A（訂單鎖）', 'Lock B（庫存鎖）']

export default function DeadlockSimulator({ color }) {
  // holding[t][r] = true if thread t holds resource r
  const [holding, setHolding] = useState([[false, false], [false, false]])
  const [waiting, setWaiting] = useState([null, null]) // null | resource index
  const [log, setLog] = useState(['模擬器就緒，點擊按鈕嘗試申請鎖...'])
  const [deadlocked, setDeadlocked] = useState(false)

  function tryAcquire(threadIdx, resIdx) {
    const owner = holding.findIndex(h => h[resIdx])
    if (owner === -1) {
      // Free — acquire
      const newHolding = holding.map(h => [...h])
      newHolding[threadIdx][resIdx] = true
      setHolding(newHolding)
      setLog(prev => [...prev, `✅ ${THREADS[threadIdx]} 獲得 ${RESOURCES[resIdx]}`])
    } else if (owner === threadIdx) {
      setLog(prev => [...prev, `⚠️ ${THREADS[threadIdx]} 已持有 ${RESOURCES[resIdx]}`])
    } else {
      // Wait — check deadlock
      const newWaiting = [...waiting]
      newWaiting[threadIdx] = resIdx
      setWaiting(newWaiting)
      setLog(prev => [...prev, `⏳ ${THREADS[threadIdx]} 等待 ${RESOURCES[resIdx]}（由 ${THREADS[owner]} 持有）`])
      // Detect deadlock: T0 waits for R that T1 holds, T1 waits for R that T0 holds
      const otherWaitsForHeldByMe = newWaiting[1 - threadIdx] !== null &&
        holding[threadIdx][newWaiting[1 - threadIdx]]
      if (otherWaitsForHeldByMe || (newWaiting[0] !== null && newWaiting[1] !== null)) {
        setDeadlocked(true)
        setLog(prev => [...prev, '💀 死鎖偵測！T1 持有 A 等 B，T2 持有 B 等 A — 循環等待形成！'])
      }
    }
  }

  function release(threadIdx, resIdx) {
    if (!holding[threadIdx][resIdx]) return
    const newHolding = holding.map(h => [...h])
    newHolding[threadIdx][resIdx] = false
    const newWaiting = [...waiting]
    // Check if another thread was waiting
    const waiter = waiting.findIndex(w => w === resIdx)
    if (waiter !== -1 && waiter !== threadIdx) {
      newHolding[waiter][resIdx] = true
      newWaiting[waiter] = null
      setLog(prev => [...prev,
        `🔓 ${THREADS[threadIdx]} 釋放 ${RESOURCES[resIdx]}`,
        `✅ ${THREADS[waiter]} 獲得等待的 ${RESOURCES[resIdx]}`,
      ])
    } else {
      setLog(prev => [...prev, `🔓 ${THREADS[threadIdx]} 釋放 ${RESOURCES[resIdx]}`])
    }
    setHolding(newHolding)
    setWaiting(newWaiting)
    setDeadlocked(false)
  }

  function reset() {
    setHolding([[false, false], [false, false]])
    setWaiting([null, null])
    setLog(['模擬器重置。'])
    setDeadlocked(false)
  }

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>死鎖模擬器</h3>
      <p className="sim-desc">
        嘗試讓 Thread 1 先申請 Lock A 再申請 Lock B，Thread 2 先申請 Lock B 再申請 Lock A，觀察死鎖的形成。
      </p>

      {deadlocked && (
        <div className="deadlock-alert">
          💀 死鎖！所有 Thread 陷入循環等待，系統無法繼續推進。
        </div>
      )}

      <div className="sim-compare">
        {THREADS.map((t, ti) => (
          <div key={ti} className="sim-compare-col">
            <h4>{t}</h4>
            {RESOURCES.map((r, ri) => (
              <div key={ri} className="lock-row">
                <span className={`lock-state ${holding[ti][ri] ? 'held' : waiting[ti] === ri ? 'waiting' : 'free'}`}>
                  {holding[ti][ri] ? '🔒 持有' : waiting[ti] === ri ? '⏳ 等待' : '⬜ 空閒'} {r}
                </span>
                <div className="lock-actions">
                  <button className="btn btn-primary btn-sm" style={{ '--btn-color': color }}
                    onClick={() => tryAcquire(ti, ri)} disabled={holding[ti][ri]}>
                    申請
                  </button>
                  <button className="btn btn-secondary btn-sm"
                    onClick={() => release(ti, ri)} disabled={!holding[ti][ri]}>
                    釋放
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="sim-controls">
        <button className="btn btn-secondary" onClick={reset}>重置</button>
      </div>

      <div className="sim-log">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
