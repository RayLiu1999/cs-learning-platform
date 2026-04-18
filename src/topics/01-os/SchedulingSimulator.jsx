import { useState, useRef } from 'react'

const PROCESSES = [
  { id: 1, name: 'P1', burst: 4, priority: 2, arrival: 0, color: '#5a9ce8' },
  { id: 2, name: 'P2', burst: 3, priority: 1, arrival: 0, color: '#5ae8a0' },
  { id: 3, name: 'P3', burst: 5, priority: 3, arrival: 0, color: '#e8c05a' },
  { id: 4, name: 'P4', burst: 2, priority: 1, arrival: 0, color: '#e8915a' },
]

function simulate(algo, processes) {
  const procs = processes.map(p => ({ ...p, remaining: p.burst, startTime: -1, finishTime: -1 }))
  const timeline = []
  let time = 0
  const queue = [...procs]

  if (algo === 'fcfs') {
    queue.sort((a, b) => a.arrival - b.arrival)
    queue.forEach(p => {
      p.startTime = time
      timeline.push({ pid: p.id, name: p.name, start: time, end: time + p.burst, color: p.color })
      time += p.burst
      p.finishTime = time
    })
  } else if (algo === 'sjf') {
    queue.sort((a, b) => a.burst - b.burst)
    queue.forEach(p => {
      p.startTime = time
      timeline.push({ pid: p.id, name: p.name, start: time, end: time + p.burst, color: p.color })
      time += p.burst
      p.finishTime = time
    })
  } else if (algo === 'priority') {
    queue.sort((a, b) => a.priority - b.priority)
    queue.forEach(p => {
      p.startTime = time
      timeline.push({ pid: p.id, name: p.name, start: time, end: time + p.burst, color: p.color })
      time += p.burst
      p.finishTime = time
    })
  } else if (algo === 'rr') {
    const tq = 2
    const readyQueue = [...procs]
    while (readyQueue.some(p => p.remaining > 0)) {
      let progressed = false
      for (let p of readyQueue) {
        if (p.remaining <= 0) continue
        const run = Math.min(tq, p.remaining)
        timeline.push({ pid: p.id, name: p.name, start: time, end: time + run, color: p.color })
        time += run
        p.remaining -= run
        if (p.remaining === 0) p.finishTime = time
        progressed = true
      }
      if (!progressed) break
    }
  }

  const totalTime = time
  return {
    timeline,
    stats: procs.map(p => ({
      name: p.name,
      burst: p.burst,
      finish: p.finishTime,
      turnaround: p.finishTime - p.arrival,
      waiting: p.finishTime - p.arrival - p.burst,
      color: p.color,
    })),
    totalTime,
  }
}

const ALGOS = [
  { id: 'fcfs', name: 'FCFS', desc: '先來先服務' },
  { id: 'sjf', name: 'SJF', desc: '最短作業優先' },
  { id: 'priority', name: 'Priority', desc: '優先級排程（數字越小越高）' },
  { id: 'rr', name: 'RR (TQ=2)', desc: '輪轉排程（時間片 = 2）' },
]

export default function SchedulingSimulator({ color }) {
  const [algo, setAlgo] = useState('rr')
  const result = simulate(algo, PROCESSES)
  const avgWait = (result.stats.reduce((s, p) => s + p.waiting, 0) / result.stats.length).toFixed(1)
  const avgTurnaround = (result.stats.reduce((s, p) => s + p.turnaround, 0) / result.stats.length).toFixed(1)

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>CPU 排程演算法模擬器</h3>
      <p className="sim-desc">4 個行程，觀察不同排程演算法下的 Gantt 圖和平均等待時間。</p>

      <div className="sim-controls">
        {ALGOS.map(a => (
          <button
            key={a.id}
            className={`btn ${algo === a.id ? 'btn-primary' : 'btn-secondary'}`}
            style={algo === a.id ? { '--btn-color': color } : {}}
            onClick={() => setAlgo(a.id)}
          >
            {a.name}
          </button>
        ))}
      </div>

      <p style={{ color: 'var(--clr-text-secondary)', fontSize: 'var(--text-sm)', margin: '0 0 var(--space-3)' }}>
        {ALGOS.find(a => a.id === algo)?.desc}
      </p>

      {/* Gantt chart */}
      <div className="gantt-chart">
        <div className="gantt-row">
          {result.timeline.map((seg, i) => (
            <div
              key={i}
              className="gantt-seg"
              style={{
                width: `${(seg.end - seg.start) / result.totalTime * 100}%`,
                background: seg.color,
              }}
              title={`${seg.name}: ${seg.start}→${seg.end}`}
            >
              {seg.name}
            </div>
          ))}
        </div>
        <div className="gantt-time">
          <span>0</span>
          <span>{result.totalTime}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="sched-stats">
        <table className="stats-table">
          <thead>
            <tr><th>行程</th><th>執行時間</th><th>完成時間</th><th>週轉時間</th><th>等待時間</th></tr>
          </thead>
          <tbody>
            {result.stats.map(p => (
              <tr key={p.name}>
                <td style={{ color: p.color, fontWeight: 600 }}>{p.name}</td>
                <td>{p.burst}</td>
                <td>{p.finish}</td>
                <td>{p.turnaround}</td>
                <td>{p.waiting}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="stats-avg">
          <span>平均等待時間：<strong style={{ color }}>{avgWait}</strong></span>
          <span>平均週轉時間：<strong style={{ color }}>{avgTurnaround}</strong></span>
        </div>
      </div>
    </div>
  )
}
