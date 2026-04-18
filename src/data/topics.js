// 主題資料設定 — 4 大 CS 分類 × 28 個主題

export const CATEGORIES = [
  {
    id: 'os',
    labelKey: 'categories.os',
    color: 'var(--clr-os)',
    topics: [
      { id: 'process-thread',    titleKey: 'topics.process-thread.title',    subtitleKey: 'topics.process-thread.subtitle',    hasSimulator: true },
      { id: 'memory-management', titleKey: 'topics.memory-management.title', subtitleKey: 'topics.memory-management.subtitle', hasSimulator: true },
      { id: 'io-models',         titleKey: 'topics.io-models.title',         subtitleKey: 'topics.io-models.subtitle',         hasSimulator: true },
      { id: 'concurrency-models',titleKey: 'topics.concurrency-models.title',subtitleKey: 'topics.concurrency-models.subtitle',hasSimulator: true },
      { id: 'locks-sync',        titleKey: 'topics.locks-sync.title',        subtitleKey: 'topics.locks-sync.subtitle',        hasSimulator: true },
      { id: 'cpu-scheduling',    titleKey: 'topics.cpu-scheduling.title',    subtitleKey: 'topics.cpu-scheduling.subtitle',    hasSimulator: true },
    ],
  },
  {
    id: 'networking',
    labelKey: 'categories.networking',
    color: 'var(--clr-networking)',
    topics: [
      { id: 'osi-model',          titleKey: 'topics.osi-model.title',          subtitleKey: 'topics.osi-model.subtitle',          hasSimulator: true },
      { id: 'tcp-deep-dive',      titleKey: 'topics.tcp-deep-dive.title',      subtitleKey: 'topics.tcp-deep-dive.subtitle',      hasSimulator: true },
      { id: 'http-evolution',     titleKey: 'topics.http-evolution.title',     subtitleKey: 'topics.http-evolution.subtitle',     hasSimulator: true },
      { id: 'dns-cdn',            titleKey: 'topics.dns-cdn.title',            subtitleKey: 'topics.dns-cdn.subtitle',            hasSimulator: true },
      { id: 'api-protocols',      titleKey: 'topics.api-protocols.title',      subtitleKey: 'topics.api-protocols.subtitle',      hasSimulator: true },
      { id: 'network-security',   titleKey: 'topics.network-security.title',   subtitleKey: 'topics.network-security.subtitle',   hasSimulator: true },
      { id: 'load-balancing-net', titleKey: 'topics.load-balancing-net.title', subtitleKey: 'topics.load-balancing-net.subtitle', hasSimulator: true },
    ],
  },
  {
    id: 'database',
    labelKey: 'categories.database',
    color: 'var(--clr-database)',
    topics: [
      { id: 'storage-engines',  titleKey: 'topics.storage-engines.title',  subtitleKey: 'topics.storage-engines.subtitle',  hasSimulator: true },
      { id: 'indexing',         titleKey: 'topics.indexing.title',         subtitleKey: 'topics.indexing.subtitle',         hasSimulator: true },
      { id: 'transactions-mvcc',titleKey: 'topics.transactions-mvcc.title',subtitleKey: 'topics.transactions-mvcc.subtitle',hasSimulator: true },
      { id: 'distributed-db',   titleKey: 'topics.distributed-db.title',   subtitleKey: 'topics.distributed-db.subtitle',   hasSimulator: true },
      { id: 'db-scaling',       titleKey: 'topics.db-scaling.title',       subtitleKey: 'topics.db-scaling.subtitle',       hasSimulator: true },
      { id: 'nosql-spectrum',   titleKey: 'topics.nosql-spectrum.title',   subtitleKey: 'topics.nosql-spectrum.subtitle',   hasSimulator: true },
      { id: 'query-optimization',titleKey: 'topics.query-optimization.title',subtitleKey: 'topics.query-optimization.subtitle',hasSimulator: true },
    ],
  },
  {
    id: 'algorithms',
    labelKey: 'categories.algorithms',
    color: 'var(--clr-algorithms)',
    topics: [
      { id: 'sorting-searching', titleKey: 'topics.sorting-searching.title', subtitleKey: 'topics.sorting-searching.subtitle', hasSimulator: true },
      { id: 'hash-tables',       titleKey: 'topics.hash-tables.title',       subtitleKey: 'topics.hash-tables.subtitle',       hasSimulator: true },
      { id: 'trees-graphs',      titleKey: 'topics.trees-graphs.title',      subtitleKey: 'topics.trees-graphs.subtitle',      hasSimulator: true },
      { id: 'advanced-ds',       titleKey: 'topics.advanced-ds.title',       subtitleKey: 'topics.advanced-ds.subtitle',       hasSimulator: true },
      { id: 'distributed-algo',  titleKey: 'topics.distributed-algo.title',  subtitleKey: 'topics.distributed-algo.subtitle',  hasSimulator: true },
      { id: 'rate-limiting-algo',titleKey: 'topics.rate-limiting-algo.title',subtitleKey: 'topics.rate-limiting-algo.subtitle',hasSimulator: true },
      { id: 'big-data-algo',     titleKey: 'topics.big-data-algo.title',     subtitleKey: 'topics.big-data-algo.subtitle',     hasSimulator: true },
      { id: 'string-algo',       titleKey: 'topics.string-algo.title',       subtitleKey: 'topics.string-algo.subtitle',       hasSimulator: true },
    ],
  },
]

export function getAllTopics() {
  const topics = []
  CATEGORIES.forEach(cat => {
    cat.topics.forEach(topic => {
      topics.push({ ...topic, categoryId: cat.id, color: cat.color })
    })
  })
  return topics
}

export function getTopicById(topicId) {
  for (const cat of CATEGORIES) {
    const topic = cat.topics.find(t => t.id === topicId)
    if (topic) {
      return { ...topic, categoryId: cat.id, color: cat.color }
    }
  }
  return null
}

export function getAdjacentTopics(topicId) {
  const all = getAllTopics()
  const idx = all.findIndex(t => t.id === topicId)
  return {
    prev: idx > 0 ? all[idx - 1] : null,
    next: idx < all.length - 1 ? all[idx + 1] : null,
  }
}
