import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { getTopicById } from '../data/topics'
import './Navbar.css'

function formatPathSegment(value) {
  return value.replace(/-/g, '_').toUpperCase()
}

export default function Navbar({ theme, onToggleTheme, onToggleSidebar, sidebarOpen }) {
  const { t } = useTranslation()
  const location = useLocation()

  const topicId = location.pathname.startsWith('/topic/')
    ? location.pathname.replace('/topic/', '')
    : null
  const topic = topicId ? getTopicById(topicId) : null

  const navPath = topic
    ? `USER_ROOT / ${formatPathSegment(topic.categoryId)} / ${formatPathSegment(topic.id)} / LIVE_VIEW`
    : 'USER_ROOT / HOME / DASHBOARD'

  return (
    <nav className={`navbar ${sidebarOpen ? '' : 'navbar-expanded'}`} id="main-navbar">
      <div className="navbar-left">
        <button
          className="navbar-hamburger"
          onClick={onToggleSidebar}
          aria-label="切換側邊欄"
          id="sidebar-toggle"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="navbar-mobile-brand">{t('app.logoTitle')}</div>
        <div className="navbar-path" title={navPath}>{navPath}</div>
      </div>

      <div className="navbar-right">
        <div className="navbar-status">
          {topic ? 'DEVICE_STATUS: ACTIVE' : 'DEVICE_STATUS: STABLE'}
        </div>
        <button
          className="navbar-theme-toggle"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? t('app.lightMode') : t('app.darkMode')}
          id="theme-toggle"
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="5"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          )}
        </button>
      </div>
    </nav>
  )
}
