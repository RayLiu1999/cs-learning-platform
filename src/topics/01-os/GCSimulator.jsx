import { useState, useRef } from 'react'

const GC_ALGOS = [
  {
    id: 'cms',
    name: 'CMS GC',
    phases: [
      { name: 'Initial Mark', stw: true,  ms: 20,  desc: 'STW：標記 GC Root 直接可達物件' },
      { name: 'Concurrent Mark', stw: false, ms: 200, desc: '並發：追蹤所有存活物件' },
      { name: 'Remark', stw: true,  ms: 40,  desc: 'STW：修正並發期間變動的引用' },
      { name: 'Concurrent Sweep', stw: false, ms: 150, desc: '並發：清除死亡物件' },
    ],
  },
  {
    id: 'g1',
    name: 'G1 GC',
    phases: [
      { name: 'Initial Mark', stw: true,  ms: 10,  desc: 'STW：標記 GC Root（搭 Minor GC）' },
      { name: 'Root Region Scan', stw: false, ms: 30,  desc: '並發：掃描 Survivor Region' },
      { name: 'Concurrent Mark', stw: false, ms: 120, desc: '並發：全堆存活標記' },
      { name: 'Remark', stw: true,  ms: 15,  desc: 'STW：SATB 修正（< 20ms）' },
      { name: 'Cleanup', stw: true,  ms: 5,   desc: 'STW：計算 Region 存活率' },
      { name: 'Evacuation Pause', stw: true,  ms: 30,  desc: 'STW：複製存活物件到新 Region' },
    ],
  },
  {
    id: 'zgc',
    name: 'ZGC',
    phases: [
      { name: 'Pause Mark Start', stw: true,  ms: 1,   desc: 'STW < 1ms：初始化標記' },
      { name: 'Concurrent Mark', stw: false, ms: 100, desc: '並發標記（著色指針追蹤）' },
      { name: 'Pause Mark End', stw: true,  ms: 1,   desc: 'STW < 1ms：完成標記' },
      { name: 'Concurrent Relocate', stw: false, ms: 80,  desc: '並發：複製物件（讀屏障轉發）' },
    ],
  },
]

export default function GCSimulator({ color }) {
  const [selectedAlgo, setSelectedAlgo] = useState('g1')
  const [phaseIdx, setPhaseIdx] = useState(-1)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState([])
  const timerRef = useRef(null)

  const algo = GC_ALGOS.find(a => a.id === selectedAlgo)

  function startGC() {
    if (running) return
    setRunning(true)
    setPhaseIdx(0)
    setLog([`🚀 開始 ${algo.name} 回收週期`])
    let idx = 0
    function runPhase() {
      const phase = algo.phases[idx]
      setPhaseIdx(idx)
      setLog(prev => [...prev,
        `${phase.stw ? '⏸ STW' : '▶ 並發'} ${phase.name} (${phase.ms}ms)：${phase.desc}`
      ])
      idx++
      if (idx < algo.phases.length) {
        timerRef.current = setTimeout(runPhase, phase.ms * 5)
      } else {
        timerRef.current = setTimeout(() => {
          setRunning(false)
          setPhaseIdx(-1)
          setLog(prev => [...prev, `✅ ${algo.name} 回收完成`])
        }, phase.ms * 5)
      }
    }
    runPhase()
  }

  function reset() {
    clearTimeout(timerRef.current)
    setRunning(false)
    setPhaseIdx(-1)
    setLog([])
  }

  const totalStw = algo.phases.filter(p => p.stw).reduce((s, p) => s + p.ms, 0)

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>JVM GC 演算法模擬器</h3>

      <div className="sim-controls">
        {GC_ALGOS.map(a => (
          <button
            key={a.id}
            className={`btn ${selectedAlgo === a.id ? 'btn-primary' : 'btn-secondary'}`}
            style={selectedAlgo === a.id ? { '--btn-color': color } : {}}
            onClick={() => { reset(); setSelectedAlgo(a.id) }}
          >
            {a.name}
          </button>
        ))}
      </div>

      <div className="gc-stat-row">
        <span>總 STW 時間：<strong style={{ color }}>{totalStw}ms</strong></span>
        <span>階段數：<strong>{algo.phases.length}</strong></span>
      </div>

      {/* Phase timeline */}
      <div className="sim-steps">
        {algo.phases.map((phase, i) => (
          <div
            key={i}
            className={`sim-step ${i === phaseIdx ? 'active' : ''} ${i < phaseIdx ? 'done' : ''}`}
            style={{ '--step-color': phase.stw ? '#e85a5a' : '#5ae8a0', width: `${Math.max(phase.ms / 3, 40)}px` }}
          >
            <span className="sim-step-label">{phase.name}</span>
            <span className="sim-step-badge">{phase.stw ? 'STW' : '並發'}</span>
          </div>
        ))}
      </div>

      <div className="sim-controls">
        <button className="btn btn-primary" style={{ '--btn-color': color }} onClick={startGC} disabled={running}>
          {running ? '運行中...' : '▶ 開始 GC'}
        </button>
        <button className="btn btn-secondary" onClick={reset}>重置</button>
      </div>

      <div className="sim-log">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
