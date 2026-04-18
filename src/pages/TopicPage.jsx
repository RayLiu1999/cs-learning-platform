import { Suspense, lazy } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getTopicById, getAdjacentTopics } from '../data/topics'
import topicContent from '../data/topicContent'
import TabGroup from '../components/TabGroup'
import FormattedContent from '../components/FormattedContent'
import InterviewQA from '../components/InterviewQA'
import './TopicPage.css'

// ── 懶加載所有 28 個 Simulator ──────────────────────────────────────────────
const simulatorModules = {
  // OS (6)
  'process-thread':     lazy(() => import('../topics/01-os/ProcessThreadSimulator')),
  'memory-management':  lazy(() => import('../topics/01-os/GCSimulator')),
  'io-models':          lazy(() => import('../topics/01-os/IOMultiplexingSimulator')),
  'concurrency-models': lazy(() => import('../topics/01-os/EventLoopSimulator')),
  'locks-sync':         lazy(() => import('../topics/01-os/DeadlockSimulator')),
  'cpu-scheduling':     lazy(() => import('../topics/01-os/SchedulingSimulator')),
  // Networking (7)
  'osi-model':          lazy(() => import('../topics/02-networking/OSILayerSimulator')),
  'tcp-deep-dive':      lazy(() => import('../topics/02-networking/TCPHandshakeSimulator')),
  'http-evolution':     lazy(() => import('../topics/02-networking/HTTPEvolutionSimulator')),
  'dns-cdn':            lazy(() => import('../topics/02-networking/DNSResolutionSimulator')),
  'api-protocols':      lazy(() => import('../topics/02-networking/APIProtocolSimulator')),
  'network-security':   lazy(() => import('../topics/02-networking/TLSHandshakeSimulator')),
  'load-balancing-net': lazy(() => import('../topics/02-networking/LoadBalancingSimulator')),
  // Database (7)
  'storage-engines':    lazy(() => import('../topics/03-database/BPlusTreeSimulator')),
  'indexing':           lazy(() => import('../topics/03-database/IndexingSimulator')),
  'transactions-mvcc':  lazy(() => import('../topics/03-database/IsolationLevelSimulator')),
  'distributed-db':     lazy(() => import('../topics/03-database/MVCCSimulator')),
  'db-scaling':         lazy(() => import('../topics/03-database/ShardingSimulator')),
  'nosql-spectrum':     lazy(() => import('../topics/03-database/ReplicationSimulator')),
  'query-optimization': lazy(() => import('../topics/03-database/QueryPlanSimulator')),
  // Algorithms (8)
  'sorting-searching':  lazy(() => import('../topics/04-algorithms/SortingSimulator')),
  'hash-tables':        lazy(() => import('../topics/04-algorithms/HashTableSimulator')),
  'trees-graphs':       lazy(() => import('../topics/04-algorithms/GraphAlgoSimulator')),
  'advanced-ds':        lazy(() => import('../topics/04-algorithms/BloomFilterSimulator')),
  'distributed-algo':   lazy(() => import('../topics/04-algorithms/ConsistentHashingSimulator')),
  'rate-limiting-algo': lazy(() => import('../topics/04-algorithms/RateLimitSimulator')),
  'big-data-algo':      lazy(() => import('../topics/04-algorithms/TopKSimulator')),
  'string-algo':        lazy(() => import('../topics/04-algorithms/TrieSimulator')),
}

function SimulatorFallback({ color }) {
  return (
    <div className="simulator-loading" style={{ borderColor: color }}>
      <span>載入模擬器中...</span>
    </div>
  )
}

export default function TopicPage() {
  const { topicId } = useParams()
  const { t } = useTranslation()

  const topic = getTopicById(topicId)
  const { prev, next } = getAdjacentTopics(topicId)
  const content = topicContent[topicId]

  if (!topic || !content) {
    return (
      <div className="topic-not-found">
        <p>找不到主題：{topicId}</p>
        <Link to="/">← 回首頁</Link>
      </div>
    )
  }

  const SimulatorComponent = simulatorModules[topicId]

  const tabs = [
    { id: 'concepts', label: t('tabs.concepts') },
    { id: 'simulator', label: t('tabs.simulator') },
    { id: 'scenarios', label: t('tabs.scenarios') },
    { id: 'interview', label: t('tabs.interview') },
  ]

  return (
    <div className="topic-page">
      <div className="topic-header" style={{ borderColor: topic.color }}>
        <span className="topic-category-badge" style={{ color: topic.color }}>
          {t(`categories.${topic.categoryId}`)}
        </span>
        <h1 className="topic-title">{t(topic.titleKey)}</h1>
        <p className="topic-subtitle">{t(topic.subtitleKey)}</p>
      </div>

      <TabGroup tabs={tabs} defaultTab="concepts">
        {activeTab => (
          <>
            {activeTab === 'concepts' && (
              <div className="topic-section">
                {content.concepts.map((c, i) => (
                  <div key={i} className="concept-block card">
                    <h3 className="concept-title" style={{ color: topic.color }}>{c.title}</h3>
                    <FormattedContent text={c.text} />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'simulator' && SimulatorComponent && (
              <div className="topic-section">
                <Suspense fallback={<SimulatorFallback color={topic.color} />}>
                  <SimulatorComponent color={topic.color} />
                </Suspense>
              </div>
            )}

            {activeTab === 'scenarios' && (
              <div className="topic-section">
                {content.scenarios.map((s, i) => (
                  <div key={i} className={`scenario-block card scenario-${s.type}`}>
                    <div className="scenario-type-tag">{s.type === 'practice' ? '🔧 實戰案例' : '📐 設計案例'}</div>
                    <h3 className="scenario-title">{s.title}</h3>
                    <FormattedContent text={s.text} />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'interview' && (
              <div className="topic-section">
                <InterviewQA items={content.interview} color={topic.color} />
              </div>
            )}
          </>
        )}
      </TabGroup>

      <div className="topic-nav">
        {prev ? (
          <Link to={`/topic/${prev.id}`} className="topic-nav-btn topic-nav-prev">
            ← {t(prev.titleKey)}
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/topic/${next.id}`} className="topic-nav-btn topic-nav-next">
            {t(next.titleKey)} →
          </Link>
        ) : <span />}
      </div>
    </div>
  )
}
