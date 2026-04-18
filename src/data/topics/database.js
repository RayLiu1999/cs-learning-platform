export const database = {
  'storage-engines': {
    concepts: [
      {
        title: "B+ Tree vs LSM Tree：兩大儲存引擎架構",
        text: "B+ Tree（InnoDB 使用）：所有資料存在葉子節點，葉子節點透過指針串成有序鏈表，支援高效範圍查詢（O(log n) 點查，O(log n + k) 範圍查詢）。寫入需要找到正確葉子節點並就地修改（Write In Place），可能觸發頁分裂（Page Split），產生隨機 I/O，寫入放大係數（Write Amplification）通常 2-10x。\nLSM Tree（LevelDB/RocksDB/Cassandra 使用）：寫入只追加到記憶體（MemTable），定期刷到磁碟（Immutable SSTable），後台 Compaction 合並排序。寫入全部是順序 I/O，寫效能極高，但讀取需要查多個 Level 的 SSTable，讀放大（Read Amplification）較高（用 Bloom Filter 優化）。\n選型：頻繁更新/刪除、範圍查詢多 → B+ Tree（MySQL InnoDB、PostgreSQL）；高頻寫入、順序存取多 → LSM（Cassandra、RocksDB、TiKV）。",
      },
      {
        title: "InnoDB 頁結構與緩衝池（Buffer Pool）",
        text: "InnoDB 以 16KB 為單位管理資料（Page）。Page 類型：Data Page（B+ Tree 葉子節點，儲存行資料）、Index Page（B+ Tree 非葉子節點）、Undo Log Page（MVCC 版本鏈）、Change Buffer Page（二級索引的延遲寫入）。\nBuffer Pool：MySQL 最重要的記憶體結構，快取常用的 Data Page，避免磁碟 I/O。命中率應 > 99%（`SHOW STATUS LIKE 'Innodb_buffer_pool_read%'`）。使用改良的 LRU（分為 Young 和 Old 子鏈表，比例 5:3），防止全表掃描把熱資料驅逐出 Buffer Pool（只有在 Old 區停留超過 1 秒後才晉升到 Young 區）。\n生產設定：`innodb_buffer_pool_size` 設為可用 RAM 的 70-80%，這是 MySQL 效能調優最重要的參數。",
      },
      {
        title: "RocksDB 在分散式系統的應用",
        text: "RocksDB 是 Facebook 基於 LevelDB 強化的嵌入式儲存引擎，被廣泛用作分散式資料庫的底層儲存：TiKV（TiDB）、CockroachDB、YugabyteDB 都使用 RocksDB 儲存實際資料。\n關鍵特性：(1) Column Family：邏輯隔離不同類型的資料（類似獨立的 LSM 樹），共享 WAL；(2) Bloom Filter：每個 SSTable 帶有 Bloom Filter，O(1) 過濾不存在的 Key，減少讀放大；(3) 可調 Compaction 策略：Level Compaction（讀效能好）vs. FIFO（適合時序資料）；(4) Direct I/O + Block Cache：繞過 OS Page Cache，由 RocksDB 自己管理 Block Cache，記憶體使用更可預測。\n資深視角：調優 RocksDB 的 `write_buffer_size`（MemTable 大小）和 `max_write_buffer_number` 是提升寫入吞吐的關鍵，過大的 MemTable 會增加重啟後的 Recovery 時間。",
      },
    ],
    scenarios: [
      {
        type: 'practice',
        title: "MySQL 磁碟 I/O 飆高排查：Buffer Pool 不足",
        text: "現象：MySQL 讀取延遲高，`iostat` 顯示磁碟讀取量大。分析：`SHOW STATUS LIKE 'Innodb_buffer_pool_reads'` > 0 且增長快，表示大量 Page Cache Miss，頻繁從磁碟讀取。根因通常是 `innodb_buffer_pool_size` 太小（預設 128MB，遠不夠生產使用）或有全表掃描把 Buffer Pool 打穿。解法：(1) 調大 Buffer Pool 到 RAM 的 70-80%；(2) 確認 Hot Data 能放入 Buffer Pool（`SHOW ENGINE INNODB STATUS` 查看 Buffer Pool Hit Rate）；(3) 對全表掃描查詢建立索引；(4) 分析 `innodb_buffer_pool_read_requests` vs `reads` 比率。",
      },
    ],
    interview: [
      {
        question: '為什麼 B+ Tree 比 B Tree 更適合資料庫索引？',
        answer: "三個優勢：(1) B+ Tree 所有資料在葉子節點，非葉子節點只存 Key，同樣的磁碟 Page 能存更多 Key，樹高更低，點查 I/O 更少；(2) B+ Tree 葉子節點有雙向鏈表連接，範圍查詢只需找到起點後順序掃描鏈表，無需回溯父節點；B Tree 的範圍查詢需要中序遍歷，有大量隨機 I/O；(3) 資料庫的全表掃描或排序操作（如 ORDER BY）只需掃描葉子節點鏈表，效率遠高於 B Tree 的中序遍歷。缺點：B+ Tree 更新需要維護葉子節點有序性，可能引發頁分裂，成本比 B Tree 高。",
        keywords: ['Page', 'Leaf Node', 'Range Query', 'Page Split', 'B Tree 差異'],
      },
    ],
  },

  'indexing': {
    concepts: [
      {
        title: "聚簇索引 vs 非聚簇索引（覆蓋索引）",
        text: "聚簇索引（Clustered Index）：資料行本身就存在 B+ Tree 的葉子節點中，InnoDB 的主鍵索引就是聚簇索引。每張表只能有一個聚簇索引（資料只能按一種順序物理存儲）。主鍵選擇建議：自增 INT > UUID > 業務 ID，因為自增 INT 保持葉子節點的有序插入，避免頻繁頁分裂。\n非聚簇索引（Secondary Index）：葉子節點存的是索引列值 + 主鍵值（而非整行資料）。查詢時若索引列不包含所需欄位，需要「回表」（再根據主鍵去聚簇索引查整行），額外一次 B+ Tree 遍歷。\n覆蓋索引（Covering Index）：若查詢所需的所有欄位都在索引葉子節點中，無需回表，效能大幅提升。`EXPLAIN` 中出現 `Using index` 表示使用了覆蓋索引。",
      },
      {
        title: "聯合索引與最左前綴原則",
        text: "聯合索引（Composite Index）`(a, b, c)` 的排列順序：先按 a 排序，a 相同再按 b，b 相同再按 c。因此查詢 `WHERE a=1 AND b=2` 能走索引，`WHERE b=2` 不能（因為 b 在 a 不固定時是無序的）。\n最左前綴原則使用場景：(1) `WHERE a=1`：走索引；(2) `WHERE a=1 AND b=2`：走索引；(3) `WHERE a=1 AND c=3`：走索引（a 走，c 不走，但比全表掃描好）；(4) `WHERE b=2 AND c=3`：不走索引；(5) `WHERE a LIKE 'abc%'`：走索引（前綴模糊匹配）；`WHERE a LIKE '%abc'`：不走索引（後綴模糊匹配）。\n索引設計原則：選擇性（Cardinality）高的列放左邊（如 user_id 比 status 選擇性高）；被 WHERE 最頻繁過濾的列放前面；ORDER BY / GROUP BY 列考慮放在索引末尾。",
      },
      {
        title: "索引失效的常見原因",
        text: "(1) 對索引列使用函數：`WHERE YEAR(created_at) = 2024`，正確寫法：`WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31'`；\n(2) 隱式類型轉換：索引列是 VARCHAR，查詢用 `WHERE phone = 13812345678`（整數），MySQL 對字串列做 CAST，索引失效；\n(3) 不等號/OR 跨索引：`WHERE a > 1` 的範圍查詢後的列（如 b）無法走索引；\n(4) LIKE 前綴萬用字元：`WHERE name LIKE '%abc'`；\n(5) NOT IN / NOT EXISTS：通常無法走索引（視 MySQL 版本和統計資訊可能走）；\n(6) NULL 值：`IS NULL` 在多數情況下能走索引，但 `NOT NULL` 約束有助於 Optimizer 優化；\n(7) 小表（行數 < 數千）：Optimizer 可能選擇全表掃描成本更低。",
      },
    ],
    scenarios: [
      {
        type: 'practice',
        title: "線上慢查詢優化：EXPLAIN 分析與索引重建",
        text: "步驟：(1) `SHOW PROCESSLIST` 找出慢查詢 SQL；(2) `EXPLAIN SELECT ...` 查看執行計劃：type（ALL=全表掃描，range/ref/eq_ref=索引掃描）、key（使用的索引）、rows（估計掃描行數）、Extra（Using filesort/Using temporary 是警告訊號）；(3) 添加適當索引（先 `EXPLAIN` 驗證 Optimizer 選擇）；(4) 生產環境用 `pt-online-schema-change` 或 `gh-ost` 線上加索引（避免鎖表）；(5) 觀察 `SHOW STATUS LIKE 'Handler_read%'` 確認索引被有效使用。",
      },
    ],
    interview: [
      {
        question: '為什麼主鍵推薦使用自增 INT 而非 UUID？',
        answer: "核心原因：B+ Tree 葉子節點維護有序性。自增 INT 每次插入都在葉子鏈表末尾追加，不需要頁分裂（Page Split）。UUID 是隨機值，新資料可能插入 B+ Tree 中間任意位置，導致：(1) 目標 Page 可能不在 Buffer Pool 中，觸發磁碟 I/O；(2) Page 分裂和節點合併頻繁發生，產生大量隨機寫；(3) 索引碎片增加，佔用空間更大。如果業務需要 UUID（如分散式環境無法保證自增），可使用 UUIDv7（時間排序的 UUID）或 ULID，保持時間順序性，兼顧唯一性和插入效能。",
        keywords: ['Page Split', 'Clustered Index', 'UUIDv7', 'ULID', 'Random Write'],
      },
    ],
  },

  'transactions-mvcc': {
    concepts: [
      {
        title: "ACID 四大特性與實現代價",
        text: "Atomicity（原子性）：事務中的操作要麼全部成功要麼全部失敗。實現：Undo Log（記錄變更前的資料，Rollback 時復原）。\nConsistency（一致性）：資料始終符合業務約束（外鍵、唯一鍵、CHECK 約束）。實現：資料庫約束 + 應用層邏輯。\nIsolation（隔離性）：並發事務互不干擾。實現代價最高：需要 MVCC + 行鎖（見下方詳解）。\nDurability（持久性）：已提交的事務永久保存，即使宕機。實現：WAL（Write-Ahead Log）/ Redo Log，事務提交前先將 Redo Log 刷盤（`innodb_flush_log_at_trx_commit=1`），即使 Buffer Pool 資料未寫回磁碟，重啟後也能從 Redo Log 恢復。\n資深視角：ACID 不是免費的——強 Durability（每次提交 fsync）會將 TPS 從數萬降至數千；強 Isolation（Serializable）會將並發度大幅降低。實際系統都在 ACID 和效能之間做取捨。",
      },
      {
        title: "MySQL MVCC 實現：版本鏈、ReadView 與快照讀",
        text: "InnoDB MVCC 依賴三個機制：(1) 每行資料有隱藏欄位：`DB_TRX_ID`（最後修改的事務 ID）和 `DB_ROLL_PTR`（指向 Undo Log 鏈的指針）；(2) Undo Log 版本鏈：同一行的歷史版本透過 Roll Ptr 串成鏈表；(3) ReadView：事務開始時建立的一個快照，記錄當時活躍（未提交）的事務 ID 列表。\n快照讀（普通 SELECT）根據 ReadView 判斷可見哪個版本：若行的 DB_TRX_ID 比 ReadView 中最小活躍 ID 還小，說明已提交，可見；若在活躍列表中，說明未提交，沿版本鏈找更舊的版本。RR 隔離級別在事務開始時生成 ReadView（整個事務期間看到一致的快照）；RC 隔離級別每次 SELECT 都生成新 ReadView（可能讀到其他事務的新提交）。",
      },
      {
        title: "四種事務隔離級別與對應問題",
        text: "(1) Read Uncommitted（讀未提交）：可以讀到未提交事務的資料 → 臟讀（Dirty Read）；幾乎不用。\n(2) Read Committed（讀已提交）：只讀已提交資料，但同一事務兩次讀可能結果不同 → 不可重複讀（Non-Repeatable Read）；Oracle 預設，MySQL Binlog Row 模式下可用。\n(3) Repeatable Read（可重複讀）：MySQL InnoDB 預設，同一事務多次讀結果一致（MVCC 快照讀），但幻讀（Phantom Read）可能發生。InnoDB 透過 Gap Lock + Next-Key Lock 防止幻讀（對查詢範圍內的間隙加鎖，阻止其他事務插入）。\n(4) Serializable（可序列化）：最強，所有 SELECT 都加 S Lock，寫操作加 X Lock，完全排他。並發效能最差。\n面試關鍵：InnoDB 在 RR 下用 MVCC + Gap Lock 實現了接近 Serializable 的效果，這是 InnoDB 的設計精髓。",
      },
    ],
    scenarios: [
      {
        type: 'practice',
        title: "分散式事務：Saga vs 2PC 的選型",
        text: "場景：電商下單流程跨訂單服務、庫存服務、支付服務三個微服務。2PC（Two-Phase Commit）：Coordinator 協調所有參與者 Prepare → Commit，強一致，但協調者是單點，任一參與者失聯都導致阻塞。適合單資料中心、低延遲場景（分散式資料庫內部）。Saga 模式：將長事務拆為一系列本地事務，每個步驟成功則繼續，失敗則觸發補償事務（Compensating Transaction）回滾已執行的步驟。最終一致，適合跨服務的業務流程。兩種 Saga 實現：Choreography（事件驅動，服務間發 Event 觸發下一步）vs Orchestration（Saga Orchestrator 集中協調，更易追蹤）。",
      },
    ],
    interview: [
      {
        question: 'MVCC 如何解決幻讀？什麼情況下 InnoDB 仍可能出現幻讀？',
        answer: "MVCC 解決的是快照讀（普通 SELECT）的幻讀：事務開始時建立 ReadView，整個事務看到的是一致的快照，不會看到後來插入的新行。但當前讀（Current Read，即 `SELECT ... FOR UPDATE`、`UPDATE`、`DELETE`）不走 MVCC，而是直接讀最新版本，此時可能出現幻讀。InnoDB 用 Gap Lock 和 Next-Key Lock 解決當前讀的幻讀：對查詢範圍內的 Gap 加鎖，阻止其他事務在此範圍插入。但若先做快照讀再做當前讀，中間可能插入新行，仍會出現幻讀。完全避免幻讀：使用 Serializable 隔離級別。",
        keywords: ['Snapshot Read', 'Current Read', 'Gap Lock', 'Next-Key Lock', 'ReadView'],
      },
    ],
  },

  'distributed-db': {
    concepts: [
      {
        title: "CAP 定理與 PACELC 的延伸",
        text: "CAP 定理：分散式系統在網路分區（Partition）時，只能選擇一致性（Consistency）或可用性（Availability）。CA 不存在（沒有分區就不是分散式系統）。\nCP 系統（強一致）：分區時拒絕服務，優先保證已服務請求的正確性。代表：HBase、Zookeeper、etcd（Raft 共識，Leader 不可達時拒絕寫入）。\nAP 系統（高可用）：分區時繼續服務，允許暫時不一致。代表：Cassandra（最終一致性）、CouchDB、DynamoDB（可配置）。\nPACELC（CAP 的延伸）：在無分區時，系統在 Latency（低延遲）和 Consistency（強一致）之間也需要取捨。Cassandra 是 PA/EL（分區時可用，無分區時選擇低延遲）；HBase 是 PC/EC（分區時一致，無分區時選擇一致性）。PACELC 更貼近實際的工程決策。",
      },
      {
        title: "Raft 共識演算法與分散式主選",
        text: "Raft 解決分散式一致性問題，比 Paxos 更易理解。三個角色：Leader、Follower、Candidate。選主流程：(1) Follower 在 Election Timeout 後變為 Candidate，對自己投票並廣播 RequestVote RPC；(2) 收到多數（> N/2）投票後成為 Leader；(3) Leader 週期性發送 Heartbeat 維持地位。\nLog Replication：客戶端只能對 Leader 寫入，Leader 將 Log Entry 複製到多數 Follower 後才 Commit（Quorum = N/2 + 1）。安全性保證：只有擁有最新 Log 的節點才能成為 Leader（選舉時比較 LastLogIndex 和 LastLogTerm）。\n應用：etcd（Kubernetes 的狀態存儲）、CockroachDB（每個 Range 一個 Raft Group）、TiKV（Multi-Raft）。典型 Quorum：3 節點容忍 1 個故障，5 節點容忍 2 個故障。",
      },
      {
        title: "NewSQL：分散式關聯式資料庫設計",
        text: "NewSQL（TiDB、CockroachDB、YugabyteDB）的目標：在分散式環境中提供 ACID 事務 + SQL 介面 + 橫向擴展。\nTiDB 架構：(1) TiDB Server（無狀態 SQL 層，負責解析 SQL、產生執行計劃）；(2) TiKV（分散式 KV 儲存，基於 Raft + RocksDB，資料按 Range 分片，每個分片一個 Raft Group）；(3) PD（Placement Driver，全域事務 ID 分配、Region 排程、Load Balance）。\n分散式事務：使用 Percolator 模型（Google BigTable 的分散式事務協定），以 PD 分配的全域 TS（Timestamp）實現 MVCC，透過兩階段提交保證 ACID。優點：傳統 MySQL 應用幾乎零改造遷移；缺點：跨分片事務延遲比單機 MySQL 高（數毫秒 vs 微秒）。",
      },
    ],
    scenarios: [
      {
        type: 'design',
        title: "設計一個全球分散式計數器（億級 QPS）",
        text: "需求：全球多個區域各有用戶對同一個計數器進行高頻點擊（億級 QPS），需要最終顯示準確計數。分析：強一致計數器（CAS + 單 Leader）QPS 上限約 10K，遠不夠。方案：CRDT（Conflict-free Replicated Data Type）中的 G-Counter（只增不減計數器）——每個節點維護自己的本地計數，讀取時求各節點最大值的總和，最終一致。寫入完全無衝突，每個節點本地累加，非同步同步到其他節點。實現：Redis Cluster 每個分片本地計數（INCR），定期匯聚。最終顯示值允許有幾秒延遲，但最終準確。",
      },
    ],
    interview: [
      {
        question: '為什麼 Zookeeper 選擇 CP 而不是 AP？它的典型使用場景是什麼？',
        answer: "Zookeeper 的 Zab 協議保證了強一致性（Linearizability）：所有寫入在 Leader 提交後才返回，讀取可能稍舊（但可用 sync() 強制讀最新）。設計為 CP 的原因：其典型使用場景要求強一致——(1) 分散式鎖（確保只有一個節點持有鎖）；(2) Leader Election（確保全局只有一個 Leader，如 Kafka Controller、HBase Master）；(3) 設定管理（所有節點看到相同的設定版本）。若設計為 AP，分區時兩個節點都認為自己是 Leader，造成腦裂（Split Brain）。代價：ZooKeeper 在網路分區時拒絕寫入，服務降級，但不會返回錯誤資料。",
        keywords: ['Zab', 'Leader Election', 'Split Brain', 'Linearizability', 'Quorum'],
      },
    ],
  },

  'db-scaling': {
    concepts: [
      {
        title: "讀寫分離、主從複製與 Replication Lag",
        text: "主從複製（Master-Slave Replication）：Master 處理寫入，Binlog 非同步複製到 Slave，Slave 提供讀服務。InnoDB 半同步複製（Semi-Sync）：Master 等待至少一個 Slave 確認收到 Binlog 後才返回客戶端，防止主庫宕機後資料丟失（比非同步安全，但延遲略高）。\nReplication Lag（複製延遲）問題：Slave 的資料可能落後 Master 數毫秒到數秒，若用戶寫入後立即讀取（Write-After-Read），可能讀到舊資料。解法：(1) 強一致讀走 Master；(2) 在應用層 Session 級別路由（同一個用戶的讀寫在短時間內走同一節點）；(3) 監控 `Seconds_Behind_Master` 並告警。\nProxySQL 和 MaxScale：自動讀寫分離代理層，對應用透明。",
      },
      {
        title: "分片（Sharding）策略與跨分片查詢問題",
        text: "水平分片將資料分散到多個資料庫節點，每個節點儲存部分行資料。分片鍵選擇至關重要：(1) Range Sharding：按 ID 範圍分（0-1M 到 DB1，1M-2M 到 DB2）。優點：範圍查詢效率高；缺點：容易產生熱點（最新 ID 集中在最後一個 Shard）；(2) Hash Sharding：`hash(shard_key) % N` 決定分片。均衡分布，但範圍查詢需要查所有分片（Scatter-Gather）；(3) Directory-Based：維護映射表決定資料在哪個 Shard，靈活但映射表本身是瓶頸。\n跨分片問題：(1) 跨分片 JOIN 需要 Scatter-Gather（效能差），通常透過資料冗餘（反範式化）或在應用層 JOIN 解決；(2) 全局唯一 ID 需要分散式 ID 生成（Snowflake、UUID）；(3) 分散式事務複雜度急劇上升。",
      },
    ],
    scenarios: [
      {
        type: 'design',
        title: "電商訂單表的分庫分表方案設計",
        text: "問題：訂單表單表超過 5000 萬行，查詢延遲增加。方案：(1) 分片鍵選擇 user_id（非 order_id）——因為最常見的查詢是「某用戶的訂單列表」，以 user_id 分片可以讓相關查詢在單個分片內完成；(2) Hash Sharding 分 32 個分片（可用 4 個物理資料庫，每庫 8 個邏輯表）；(3) 問題：按 order_id 查詢單筆訂單需要廣播到所有分片——解法：在 order_id 中嵌入 user_id（如訂單 ID = timestamp + user_id 後幾位 + 序號），或建立 order_id→shard 的路由表；(4) 大客戶熱點：VIP 用戶訂單量極大，需要單獨分片策略（Directory-Based）。",
      },
    ],
    interview: [
      {
        question: '什麼是連接池（Connection Pool）？設定不當會有什麼問題？',
        answer: "連接池維護一組預先建立的資料庫連接，應用從池中借用連接，使用後歸還，避免頻繁建立/銷毀 TCP 連接和 MySQL 認證的開銷。設定不當的問題：(1) 池大小過小：並發請求超過池大小時，請求排隊等待，導致超時（常見症狀：`Timeout waiting for connection from pool`）；(2) 池大小過大：資料庫端同時 Active 連接數超過 `max_connections`，資料庫拒絕連接，且大量連接本身消耗記憶體和 Mutex；(3) 連接洩漏：應用代碼異常路徑沒有歸還連接，池慢慢耗盡；(4) Idle 連接被 MySQL 或防火牆關閉（`wait_timeout`），應設定 `testOnBorrow` 或 `keepAliveTime`。推薦值：`pool_size = max_threads × 0.9`（留 10% 給管理查詢）。",
        keywords: ['Connection Pool', 'max_connections', 'Connection Leak', 'HikariCP', 'wait_timeout'],
      },
    ],
  },

  'nosql-spectrum': {
    concepts: [
      {
        title: "四大 NoSQL 類型：KV、Document、Wide-Column、Graph",
        text: "KV Store（Redis、DynamoDB）：最簡單，O(1) 讀寫，適合快取、Session、計數器、分散式鎖。Redis 的資料結構豐富（String/Hash/List/Set/SortedSet）讓它超越了純 KV 的範疇。\nDocument DB（MongoDB、CouchDB）：以 JSON/BSON 文件為單位，不需要預定義 Schema，適合快速迭代的應用（如 CMS、用戶設定）。MongoDB 支援嵌套文件的索引，Atlas Search 提供全文搜尋。\nWide-Column（Cassandra、HBase）：行有固定 Key，但列可以動態擴展（稀疏列），按列族（Column Family）組織，支援按列快速掃描。適合時序資料、寫多讀少的大寬表（如 IoT 設備資料、用戶行為日誌）。\nGraph DB（Neo4j、Amazon Neptune）：節點 + 邊 + 屬性，關係遍歷效率極高，適合社交關係、知識圖譜、推薦引擎。對於「6 度分隔」這類多跳關係查詢，圖資料庫比關聯式資料庫快數個量級。",
      },
      {
        title: "Redis 核心資料結構與底層實現",
        text: "String：SDS（Simple Dynamic String）—— C 字串的改進版，O(1) 獲取長度，二進位安全，動態擴展。\nHash：元素少時用 Ziplist（緊湊陣列），多時轉為 Hashtable（開放定址雜湊）。\nList：元素少時 Quicklist（Ziplist 的鏈表），Redis 7.0 後改用 Listpack 優化。\nSet：元素全是整數且少時用 Intset，否則用 Hashtable。\nSortedSet（ZSet）：同時使用 Skiplist（跳表，支援範圍查詢 O(log n)）和 Hashtable（O(1) 點查）。跳表比平衡樹實現更簡單、鎖競爭更少，是 ZSet 的核心。\nRedis 7 的 Listpack：取代 Ziplist，修復了 Ziplist 的連鎖更新（Cascade Update）問題。",
      },
    ],
    scenarios: [
      {
        type: 'design',
        title: "設計一個社交平台的 Feed 流系統（推拉結合）",
        text: "問題：Twitter 風格的 Feed 流，用戶 A 關注了 B，B 發文後 A 的 Feed 要出現。推模式（Push/Fan-out on Write）：B 發文時，立即推到 A 的 Feed 列表（Redis ZSet，以時間戳為 Score）。優點：讀取 O(1)；缺點：若 B 有 100 萬粉絲，一條推文需要 100 萬次寫入，大 V 發文時系統壓力暴增。拉模式（Pull/Fan-in on Read）：A 讀 Feed 時，拉取所有關注者的最新文章然後合並排序。優點：寫入成本低；缺點：若關注了 1000 人，每次讀需要 1000 次查詢。推拉結合（Hybrid）：普通用戶 Push，大 V 不 Push（讀時 Pull），閾值（如粉絲 > 10 萬）動態切換。這是 Twitter（X）和微博的實際策略。",
      },
    ],
    interview: [
      {
        question: 'Redis 如何實現分散式鎖？Redlock 的爭議是什麼？',
        answer: "簡單實現：`SET key value NX EX 30`（原子操作，不存在才設定，30 秒過期）。釋放時必須驗證 value 是自己設定的（避免誤刪他人鎖）：先 GET 比較再 DEL，但這兩步不原子，需用 Lua Script 確保原子性。Redlock（多節點）：在 N 個獨立 Redis 節點上設定鎖，需要 N/2+1 個節點成功才視為獲鎖。爭議（Martin Kleppmann 的批評）：在系統出現 GC Pause 或 Clock Skew 時，Redlock 的安全性保證可能失效——鎖 TTL 到期後，另一個客戶端獲得了鎖，但原客戶端 GC 恢復後仍認為自己持有鎖，造成兩個客戶端同時操作。正確實現需要 Fencing Token（單調遞增的版本號），資源操作時驗證 Token 是否是最新的。",
        keywords: ['SET NX EX', 'Lua Script', 'Redlock', 'Fencing Token', 'GC Pause', 'Clock Skew'],
      },
    ],
  },

  'query-optimization': {
    concepts: [
      {
        title: "SQL 查詢最佳化器的工作原理",
        text: "查詢最佳化器（Query Optimizer）將 SQL 轉換為最佳執行計劃，分為兩步：(1) 邏輯最佳化（Logical Optimization）：謂詞下推（Predicate Pushdown，將 WHERE 條件盡早過濾，減少參與 JOIN 的資料量）、常量折疊、子查詢展開；(2) 物理最佳化（Physical Optimization）：Cost-Based Optimizer（CBO）根據統計資訊（行數、列基數、Histogram）估算每個執行計劃的 Cost，選擇最低 Cost 的方案。\n統計資訊的重要性：若統計資訊過期（MySQL 需 `ANALYZE TABLE` 更新），Optimizer 可能選擇錯誤的執行計劃（如選擇全表掃描而非索引）。生產建議：定期執行 `ANALYZE TABLE`，或開啟 `innodb_stats_auto_recalc`。",
      },
      {
        title: "JOIN 演算法：Nested Loop vs Hash Join vs Merge Sort Join",
        text: "Nested Loop Join：對外表每一行，掃描內表找匹配行。若內表有索引（Index Nested Loop），複雜度 O(n log m)；無索引（Block Nested Loop），O(n×m)。MySQL 的 JOIN 底層都是 NLJ。\nHash Join（MySQL 8.0+ 支援，PostgreSQL 一直支援）：先掃描小表（Build Phase）在記憶體中建雜湊表，再掃描大表（Probe Phase）查雜湊表。無需索引，對大表 JOIN 效率高，但需要足夠記憶體（若超出 join_buffer_size 需 Spill to Disk）。\nMerge Sort Join：若兩個表都已按 JOIN 列排序（如主鍵範圍查詢），可以合並兩個有序序列，O(n+m)。PostgreSQL 會利用此算法。\n實務建議：確保 JOIN 列有索引；小表放驅動表（MySQL Optimizer 通常自動選擇）；避免在大表的非索引列上 JOIN。",
      },
    ],
    scenarios: [
      {
        type: 'practice',
        title: "線上複雜查詢重寫：避免全表掃描和臨時表",
        text: "問題查詢：`SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at DESC LIMIT 100`，全表掃描 + filesort。最佳化：(1) 建立聯合索引 `(status, created_at)`，覆蓋 WHERE 和 ORDER BY，消除 filesort；(2) 若 status 基數低（只有幾個值），考慮用分區表按 status 分區；(3) `SELECT *` 改為明確欄位列表，結合聯合索引實現覆蓋索引，避免回表。EXPLAIN 驗證：`Extra` 不應出現 `Using filesort` 或 `Using temporary`；`type` 應為 `ref` 或更好；`rows` 應遠小於總行數。",
      },
    ],
    interview: [
      {
        question: '什麼是 N+1 查詢問題？如何在 ORM 中解決？',
        answer: "N+1 問題：查詢 N 個父物件後，對每個父物件各發一次查詢獲取子物件，共 N+1 次查詢。例如：先 `SELECT * FROM posts LIMIT 10`（1 次），再對每篇文章各執行 `SELECT * FROM comments WHERE post_id=?`（10 次），共 11 次查詢。解法：(1) Eager Loading：ORM 提供 `includes`（Rails）/`with`（Laravel）/`@EntityGraph`（JPA），自動用 IN 查詢批次載入子物件（`SELECT * FROM comments WHERE post_id IN (1,2,...10)`）；(2) DataLoader 模式（GraphQL 場景）：批次和快取多個請求，相同 key 的查詢合並；(3) JOIN 查詢：直接在 SQL 層面關聯，但可能造成資料重複（需注意 DISTINCT）。",
        keywords: ['Eager Loading', 'Lazy Loading', 'DataLoader', 'Batch Query', 'ORM'],
      },
    ],
  },
}
