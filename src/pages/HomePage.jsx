import { useTranslation } from 'react-i18next'
import { CATEGORIES } from '../data/topics'
import TopicCard from '../components/TopicCard'
import './HomePage.css'

export default function HomePage() {
  const { t } = useTranslation()
  const topicCount = CATEGORIES.reduce((count, category) => count + category.topics.length, 0)

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="home-kicker">&gt; INIT CS_CORE.EXE</div>
        <h1 className="home-title">{t('home.title')}</h1>
        <p className="home-subtitle">{t('home.subtitle')}</p>

        <div className="home-status-grid">
          <div className="home-status-card">
            <span className="home-status-label">Domains</span>
            <strong className="home-status-value">{String(CATEGORIES.length).padStart(2, '0')}</strong>
          </div>
          <div className="home-status-card">
            <span className="home-status-label">Modules</span>
            <strong className="home-status-value">{String(topicCount).padStart(2, '0')}</strong>
          </div>
          <div className="home-status-card">
            <span className="home-status-label">Mode</span>
            <strong className="home-status-value">INTERACTIVE</strong>
          </div>
        </div>
      </div>

      {CATEGORIES.map(cat => (
        <section key={cat.id} className="home-category">
          <h2 className="home-category-title" style={{ color: cat.color }}>
            {t(cat.labelKey)}
          </h2>
          <div className="home-topics-grid">
            {cat.topics.map(topic => (
              <TopicCard
                key={topic.id}
                topic={topic}
                categoryColor={cat.color}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
