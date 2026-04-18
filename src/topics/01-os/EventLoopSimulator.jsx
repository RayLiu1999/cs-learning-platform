import { useState, useRef } from 'react'

const TASKS = [
  { id: 1, label: 'setTimeout(fn, 0)', type: 'macro', result: '宏任務' },
  { id: 2, label: 'Promise.resolve().then(fn)', type: 'micro', result: '微任務' },
  { id: 3, label: 'setImmediate(fn)', type: 'check', result: 'Check 階段' },
  { id: 4, label: 'fs.readFile(fn)', type: 'io', result: 'Poll 階段（I/O 回呼）' },
  { id: 5, label: 'queueMicrotask(fn)', type: 'micro', result: '微任務' },
]

const TYPE_COLORS = {
  macro: '#e8c05a',
  micro: '#5ae8a0',
  check: '#5a9ce8',
  io: '#7c5ae8',
}

export default function EventLoopSimulator({ color }) {
  const [queue, setQueue] = useState([])
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState([])
  const [phase, setPhase] = useState('idle')
  const timerRef = useRef(null)

  function addTask(task) {
    setQueue(prev => [...prev, { ...task, uid: Date.now() + Math.random() }])
  }

  function runLoop() {
    if (queue.length === 0 || running) return
    setRunning(true)
    const sorted = [...queue].sort((a, b) => {
      const order = { micro: 0, io: 1, check: 2, macro: 3 }
      return order[a.type] - order[b.type]
    })
    setQueue(sorted)
    let idx = 0
    function step() {
      if (idx >= sorted.length) {
        setPhase('idle')
        setRunning(false)
        return
      }
      const task = sorted[idx]
      const phaseLabel = task.type === 'micro' ? 'Microtask Queue' : task.type === 'io' ? 'Poll' : task.type === 'check' ? 'Check' : 'Timers'
      setPhase(phaseLabel)
      setOutput(prev => [...prev, `[${phaseLabel}] 執行 ${task.label} → ${task.result}`])
      setQueue(prev => prev.filter(q => q.uid !== task.uid))
      idx++
      timerRef.current = setTimeout(step, 600)
    }
    step()
  }

  function reset() {
    clearTimeout(timerRef.current)
    setQueue([])
    setOutput([])
    setPhase('idle')
    setRunning(false)
  }

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>Node.js Event Loop 模擬器</h3>
      <p className="sim-desc">新增任務到隊列，點擊執行 Event Loop 觀察執行順序。</p>

      <div className="sim-controls">
        {TASKS.map(t => (
          <button
            key={t.id}
            className="btn btn-secondary"
            style={{ borderColor: TYPE_COLORS[t.type], color: TYPE_COLORS[t.type] }}
            onClick={() => addTask(t)}
          >
            + {t.label}
          </button>
        ))}
      </div>

      <div className="eventloop-layout">
        <div className="eventloop-queue">
          <h4>任務隊列</h4>
          {queue.length === 0 ? <div className="queue-empty">（空）</div> : queue.map(t => (
            <div key={t.uid} className="queue-item" style={{ borderColor: TYPE_COLORS[t.type] }}>
              <span style={{ color: TYPE_COLORS[t.type] }}>{t.type}</span> {t.label}
            </div>
          ))}
        </div>
        <div className="eventloop-phase">
          <h4>當前階段</h4>
          <div className="phase-display" style={{ color, borderColor: color }}>
            {phase === 'idle' ? '⏸ 等待任務' : `▶ ${phase}`}
          </div>
        </div>
      </div>

      <div className="sim-controls">
        <button className="btn btn-primary" style={{ '--btn-color': color }} onClick={runLoop} disabled={running || queue.length === 0}>
          {running ? '運行中...' : '▶ 執行 Event Loop'}
        </button>
        <button className="btn btn-secondary" onClick={reset}>重置</button>
      </div>

      <div className="sim-log">
        {output.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
