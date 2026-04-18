import { useTranslation } from 'react-i18next'
import { CATEGORIES } from '../data/topics'
import TopicCard from '../components/TopicCard'
import './HomePage.css'

export default function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="home-title">{t('home.title')}</h1>
        <p className="home-subtitle">{t('home.subtitle')}</p>
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
