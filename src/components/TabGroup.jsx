// Tab 切換元件
import { useState } from 'react'

export default function TabGroup({ tabs, defaultTab, onChange, children }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id)

  const handleClick = (tabId) => {
    setActive(tabId)
    onChange?.(tabId)
  }

  return (
    <>
      <div className="tab-group">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${active === tab.id ? 'active' : ''}`}
            onClick={() => handleClick(tab.id)}
            id={`tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {typeof children === 'function' ? children(active) : children}
    </>
  )
}
