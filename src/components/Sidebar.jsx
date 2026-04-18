// 側邊欄元件
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { CATEGORIES } from '../data/topics'
import './Sidebar.css'

export default function Sidebar({ isOpen, onClose }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const currentTopicId = location.pathname.startsWith('/topic/')
    ? location.pathname.replace('/topic/', '')
    : null

  const handleTopicClick = (topicId) => {
    navigate(`/topic/${topicId}`)
    if (window.innerWidth <= 768) onClose()
  }

  return (
    <>
      {isOpen && <div className="sidebar-overlay sidebar-overlay-visible" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-hidden'}`} id="main-sidebar">
        <button
          className="sidebar-header"
          onClick={() => {
            navigate('/')
            if (window.innerWidth <= 768) onClose()
          }}
          id="sidebar-home"
        >
          <span className="sidebar-header-title">{t('app.logoTitle')}</span>
          <span className="sidebar-header-subtitle">NEURAL INTERFACE</span>
        </button>

        <div className="sidebar-content">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="sidebar-category">
              <div className="sidebar-cat-label" style={{ color: cat.color }}>
                <span className="sidebar-cat-dot" style={{ background: cat.color }} />
                {t(cat.labelKey)}
              </div>

              <ul className="sidebar-topics">
                {cat.topics.map(topic => {
                  const isActive = currentTopicId === topic.id
                  return (
                    <li key={topic.id}>
                      <button
                        className={`sidebar-topic-btn ${isActive ? 'active' : ''}`}
                        style={{ '--topic-color': topic.color || cat.color }}
                        onClick={() => handleTopicClick(topic.id)}
                        id={`sidebar-topic-${topic.id}`}
                      >
                        <span className="sidebar-topic-indicator" aria-hidden="true" />
                        <span className="sidebar-topic-name">{t(topic.titleKey)}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}
