import { useState } from 'react'

const MODELS = [
  {
    id: 'blocking',
    name: 'Blocking I/O',
    desc: '呼叫 read()，Thread 阻塞等待資料就緒 + 複製完成',
    color: '#e85a5a',
    steps: ['呼叫 read()', 'Thread 阻塞', '等待資料就緒（Kernel）', '資料從 Kernel 複製到 User Buffer', '系統呼叫返回'],
    threads: 1,
    throughput: '低（每個連線佔一個 Thread）',
  },
  {
    id: 'nonblocking',
    name: 'Non-blocking I/O',
    desc: '輪詢 read()，資料未就緒時立即返回 EAGAIN',
    color: '#e8c05a',
    steps: ['呼叫 read()', '資料未就緒，返回 EAGAIN', '應用繼續輪詢...', '資料就緒', '再次呼叫 read()，複製資料'],
    threads: 1,
    throughput: '浪費 CPU（忙等）',
  },
  {
    id: 'select',
    name: 'select / poll',
    desc: 'I/O 多路復用，一個 Thread 監控多個 FD',
    color: '#5a9ce8',
    steps: ['呼叫 select(FD 集合)', 'Kernel 掃描所有 FD（O(n)）', '有 FD 就緒，返回就緒集合', '應用遍歷找出就緒 FD', '對就緒 FD 呼叫 read()'],
    threads: 1,
    throughput: '中等（O(n) 掃描，FD 上限 1024）',
  },
  {
    id: 'epoll',
    name: 'epoll',
    desc: '事件驅動，只返回就緒的 FD，O(1) 效能',
    color: '#5ae8a0',
    steps: ['epoll_create（建紅黑樹）', 'epoll_ctl 註冊 FD（O(log n)）', 'epoll_wait 阻塞', 'Kernel 回呼通知就緒 FD', '直接取出就緒 FD，O(1)'],
    threads: 1,
    throughput: '高（百萬級並發，無 FD 上限）',
  },
  {
    id: 'aio',
    name: 'io_uring (AIO)',
    desc: '真非同步：批次提交，Kernel 完成後通知，零系統呼叫',
    color: '#7c5ae8',
    steps: ['批次提交 SQE（共享 Ring Buffer）', 'Kernel 非同步執行 I/O', '資料複製到 User Buffer（Kernel 完成）', '應用從 CQE 讀取結果', '無需系統呼叫開銷'],
    threads: 1,
    throughput: '最高（減少 30-50% 系統呼叫）',
  },
]

export default function IOMultiplexingSimulator({ color }) {
  const [selected, setSelected] = useState('epoll')
  const [stepIdx, setStepIdx] = useState(-1)
  const [log, setLog] = useState([])

  const model = MODELS.find(m => m.id === selected)

  function runStep() {
    const next = stepIdx + 1
    if (next < model.steps.length) {
      setStepIdx(next)
      setLog(prev => [...prev, `步驟 ${next + 1}：${model.steps[next]}`])
    }
  }

  function reset() {
    setStepIdx(-1)
    setLog([])
  }

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>I/O 多路復用模型模擬器</h3>

      <div className="sim-controls">
        {MODELS.map(m => (
          <button
            key={m.id}
            className={`btn ${selected === m.id ? 'btn-primary' : 'btn-secondary'}`}
            style={selected === m.id ? { '--btn-color': m.color } : {}}
            onClick={() => { setSelected(m.id); reset() }}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div className="sim-model-desc" style={{ borderColor: model.color }}>
        <strong style={{ color: model.color }}>{model.name}</strong>
        <p>{model.desc}</p>
        <p>吞吐量：{model.throughput}</p>
      </div>

      {/* Steps */}
      <div className="sim-steps">
        {model.steps.map((step, i) => (
          <div
            key={i}
            className={`sim-step ${i === stepIdx ? 'active' : ''} ${i < stepIdx ? 'done' : ''}`}
            style={{ '--step-color': model.color }}
          >
            <span className="sim-step-num">{i + 1}</span>
            <span className="sim-step-label">{step}</span>
          </div>
        ))}
      </div>

      <div className="sim-controls">
        <button
          className="btn btn-primary"
          style={{ '--btn-color': color }}
          onClick={runStep}
          disabled={stepIdx >= model.steps.length - 1}
        >
          單步執行 ▶
        </button>
        <button className="btn btn-secondary" onClick={reset}>重置</button>
      </div>

      <div className="sim-log">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
