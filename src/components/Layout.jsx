// 佈局元件
import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useTheme } from '../hooks/useTheme'
import './Layout.css'

function getDefaultSidebarOpen() {
  if (typeof window === 'undefined') {
    return true
  }

  return window.innerWidth > 768
}

export default function Layout() {
  const { theme, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(getDefaultSidebarOpen)
  const location = useLocation()

  useEffect(() => {
    if (window.innerWidth <= 768) setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="app-layout">
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        sidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        className={`main-content ${sidebarOpen ? '' : 'main-content-expanded'}`}
        id="main-content"
      >
        <Outlet />
      </main>
    </div>
  )
}
