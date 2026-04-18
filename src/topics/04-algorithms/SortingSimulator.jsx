import { useState, useRef } from 'react'

const ALGOS = ['quicksort', 'mergesort', 'heapsort', 'bubblesort']
const ALGO_LABELS = { quicksort: 'Quick Sort', mergesort: 'Merge Sort', heapsort: 'Heap Sort', bubblesort: 'Bubble Sort' }
const ALGO_COMPLEXITY = {
  quicksort: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
  mergesort: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
  heapsort: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)' },
  bubblesort: { best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
}

function generateSteps(arr, algo) {
  const a = [...arr]
  const steps = [{ arr: [...a], comparing: [] }]

  if (algo === 'bubblesort') {
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < a.length - i - 1; j++) {
        steps.push({ arr: [...a], comparing: [j, j + 1] })
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]]
          steps.push({ arr: [...a], comparing: [j, j + 1], swapped: true })
        }
      }
    }
  } else if (algo === 'mergesort') {
    function merge(arr, l, m, r) {
      const left = arr.slice(l, m + 1), right = arr.slice(m + 1, r + 1)
      let i = 0, j = 0, k = l
      while (i < left.length && j < right.length) {
        steps.push({ arr: [...arr], comparing: [l + i, m + 1 + j] })
        if (left[i] <= right[j]) { arr[k++] = left[i++] } else { arr[k++] = right[j++] }
        steps.push({ arr: [...arr], comparing: [] })
      }
      while (i < left.length) { arr[k++] = left[i++]; steps.push({ arr: [...arr], comparing: [] }) }
      while (j < right.length) { arr[k++] = right[j++]; steps.push({ arr: [...arr], comparing: [] }) }
    }
    function mergesortHelper(arr, l, r) {
      if (l >= r) return
      const m = Math.floor((l + r) / 2)
      mergesortHelper(arr, l, m)
      mergesortHelper(arr, m + 1, r)
      merge(arr, l, m, r)
    }
    mergesortHelper(a, 0, a.length - 1)
  } else {
    // quicksort / heapsort — simulate with native sort steps approximation
    const sorted = [...a].sort((x, y) => x - y)
    for (let i = 0; i < sorted.length; i++) {
      const idx = a.indexOf(sorted[i])
      if (idx !== i) {
        steps.push({ arr: [...a], comparing: [i, idx] });
        [a[i], a[idx]] = [a[idx], a[i]]
        steps.push({ arr: [...a], comparing: [], swapped: true })
      }
    }
  }

  steps.push({ arr: [...a], comparing: [], done: true })
  return steps
}

const INIT = [38, 27, 43, 3, 9, 82, 10]

export default function SortingSimulator({ color }) {
  const [algo, setAlgo] = useState('mergesort')
  const [steps, setSteps] = useState(() => generateSteps(INIT, 'mergesort'))
  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef(null)

  const curStep = steps[stepIdx] || steps[0]
  const maxVal = Math.max(...INIT)

  function selectAlgo(a) {
    setAlgo(a)
    const s = generateSteps(INIT, a)
    setSteps(s)
    setStepIdx(0)
    setPlaying(false)
    clearInterval(timerRef.current)
  }

  function play() {
    setPlaying(true)
    timerRef.current = setInterval(() => {
      setStepIdx(prev => {
        if (prev >= steps.length - 1) { clearInterval(timerRef.current); setPlaying(false); return prev }
        return prev + 1
      })
    }, 120)
  }

  function pause() { clearInterval(timerRef.current); setPlaying(false) }
  function reset() { setStepIdx(0); setPlaying(false); clearInterval(timerRef.current) }

  const c = ALGO_COMPLEXITY[algo]

  return (
    <div className="simulator-container">
      <h3 className="sim-title" style={{ color }}>排序演算法視覺化</h3>

      <div className="sim-controls">
        {ALGOS.map(a => (
          <button key={a}
            className={`btn ${algo === a ? 'btn-primary' : 'btn-secondary'}`}
            style={algo === a ? { '--btn-color': color } : {}}
            onClick={() => selectAlgo(a)}>
            {ALGO_LABELS[a]}
          </button>
        ))}
      </div>

      <div className="sorting-bars">
        {curStep.arr.map((val, i) => (
          <div key={i} className="bar-wrap">
            <div className="sort-bar" style={{
              height: `${(val / maxVal) * 160}px`,
              background: curStep.comparing.includes(i)
                ? (curStep.swapped ? '#e85a5a' : '#e8c05a')
                : curStep.done ? '#5ae8a0'
                : color,
            }} />
            <span className="bar-label">{val}</span>
          </div>
        ))}
      </div>

      <div className="sim-controls">
        <button className="btn btn-primary" style={{ '--btn-color': color }}
          onClick={play} disabled={playing || stepIdx >= steps.length - 1}>▶ 播放</button>
        <button className="btn btn-secondary" onClick={pause} disabled={!playing}>⏸ 暫停</button>
        <button className="btn btn-secondary" onClick={reset}>⏮ 重置</button>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-secondary)' }}>
          步驟 {stepIdx + 1} / {steps.length}
        </span>
      </div>

      <div className="card" style={{ borderColor: color }}>
        <table className="stats-table" style={{ width: 'auto' }}>
          <thead><tr><th>Best</th><th>Average</th><th>Worst</th><th>Space</th></tr></thead>
          <tbody><tr><td>{c.best}</td><td>{c.avg}</td><td>{c.worst}</td><td>{c.space}</td></tr></tbody>
        </table>
      </div>
    </div>
  )
}
