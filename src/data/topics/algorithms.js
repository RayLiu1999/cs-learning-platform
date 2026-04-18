export const algorithms = {
  'sorting-searching': {
    concepts: [
      {
        title: '主流排序演算法複雜度與實際應用選型',
        text: 'Quick Sort：平均 O(n log n)、最壞 O(n²)，原地排序（in-place），Cache 友好（順序存取），常數係數小。實際應用：`Arrays.sort(int[])`（Java）、`std::sort`（C++）底層都是 Intro Sort（Quicksort + Heapsort + Insertion Sort 的混合）。隨機選 Pivot 避免最壞情況。\nMerge Sort：穩定 O(n log n)，需要 O(n) 額外空間。應用：`Collections.sort`（Java）、Python `sorted()`（Timsort = Merge Sort + Insertion Sort）。適合鏈表排序和外部排序（External Sort，資料量超過記憶體時，分批排序後多路歸並）。\nHeap Sort：O(n log n)，原地，但 Cache 不友好（跳躍存取堆）。適合 Top-K 問題（維護大小 K 的堆，O(n log k)）。\nCounting Sort / Radix Sort：O(n+k)，非比較排序，適合整數或定長字串（如電話號碼排序）。',
      },
      {
        title: '二分查找的邊界處理與實際應用',
        text: '標準二分：`left=0, right=n-1, mid=(left+right)/2`（注意整數溢位，應用 `left + (right-left)/2`）。核心：每次迭代縮小一半搜尋空間，O(log n)。\n邊界變體——查找第一個 ≥ target 的位置（Lower Bound）：`if arr[mid] >= target: right = mid; else: left = mid + 1`；查找最後一個 ≤ target 的位置（Upper Bound）類似。Java 的 `Arrays.binarySearch()` 找不到時返回 `-(insertionPoint)-1`。\n應用場景：(1) 資料庫 B+ Tree 節點內部查找（對排序陣列二分）；(2) 系統分配記憶體 Buddy System（按 2 的冪快速找到合適塊）；(3) Git bisect（二分法找引入 Bug 的提交）；(4) Docker/Kubernetes 的 Rate Limiter（在排序的時間戳陣列中二分計算滑動視窗計數）。',
      },
    ],
    scenarios: [
      {
        type: 'practice',
        title: '海量日誌排序：外部排序在分散式系統的應用',
        text: '問題：10TB 的 Web 日誌按時間戳排序，記憶體只有 32GB。外部排序步驟：(1) 分割（Splitting）：讀入 25GB 資料（預留 7GB 給系統），在記憶體中排序後寫出到磁碟（產生約 400 個 25GB 的已排序段）；(2) 多路歸並（K-way Merge）：用大小 K 的 Min Heap，每次從 K 個段的當前最小元素中取最小的輸出，O(n log K)。適合 K=400 的歸並。工程實作：可並行化——多台機器各負責一部分段的排序（Map），然後各機器間 K-way Merge（Reduce）。這正是 MapReduce 排序的核心原理。',
      },
    ],
    interview: [
      {
        question: 'Quick Sort 為何比 Merge Sort 在實踐中更快，即使兩者都是 O(n log n)？',
        answer: '常數係數差異：(1) Cache 效能：Quick Sort 原地排序，分區操作是連續記憶體存取，Cache 命中率高；Merge Sort 需要額外陣列，記憶體存取模式跳躍，Cache Miss 更多；(2) 分支預測：Quick Sort 的分區步驟分支可預測；(3) Auxiliary Memory：Merge Sort 需要 O(n) 額外空間，分配和複製有開銷。但當資料近乎有序時，Quick Sort 退化到 O(n²)，Timsort（Python/Java 的穩定排序）針對此優化——偵測已有序的 Run，直接 Merge，最佳情況 O(n)。',
        keywords: ['Cache Locality', 'In-place', 'Timsort', 'Intro Sort', 'Pivot Selection'],
      },
      {
        question: '什麼是穩定排序 (Stable Sort)？為什麼它在實際系統中很重要？',
        answer: "穩定排序保證相等元素的相對順序在排序後保持不變。這在多級排序中至關重要：例如先按「姓名」排序，再按「分數」排序。穩定排序能保證分數相同的人依然按姓名順序排列。資深視角：Merge Sort 和 Timsort 是穩定的；Quick Sort 和 Heap Sort 是不穩定的。若在不穩定排序中需要穩定性，需將原始 Index 作為聯合排序的一部分（增加空間成本）。",
        keywords: ['Stability', 'Multi-level Sort', 'Timsort', 'Merge Sort'],
      },
      {
        question: '如何解決 Quick Sort 在最壞情況下的 O(n²) 複雜度？',
        answer: "(1) **Randomized Pivot**：隨機選擇 Pivot，使最壞情況出現概率降為極低；(2) **Median-of-three**：取首、中、尾三數的中位數作為 Pivot；(3) **Intro Sort**：監控遞迴深度，當深度超過 $2 \log n$ 時自動切換為 Heap Sort（保證 O(n log n)）。這是 C++ `std::sort` 的實現策略。",
        keywords: ['Intro Sort', 'Pivot Selection', 'Worst Case', 'Recursion Depth'],
      },
    ],
  },

  'hash-tables': {
    concepts: [
      {
        title: '雜湊碰撞解決：鏈結法 vs 開放定址',
        text: '鏈結法（Chaining）：每個 Bucket 是一個鏈表（或紅黑樹），碰撞的鍵都加入鏈表。Java 的 HashMap 使用鏈結法，鏈長超過 8 時轉為紅黑樹（O(log n) 最壞查找，避免 DoS 攻擊通過構造碰撞讓鏈表退化到 O(n)）。\n開放定址（Open Addressing）：碰撞時在表內探測下一個空位置。線性探測（Linear Probing）：依次找 i+1, i+2...，Cache 友好但容易聚集（Clustering）。二次探測：i+1², i+2²...，減少聚集。雙重雜湊：第二個雜湊函數決定步長。Python 的 dict 使用開放定址，因為 Python 物件常比較昂貴，開放定址的 Cache 優勢更明顯。\n負載因子（Load Factor）：鍵數/桶數。HashMap 預設 0.75（超過就 Rehash，翻倍擴容）。Rehash 是 O(n) 操作，高並發場景需注意可能引發的延遲毛刺。',
      },
      {
        title: '一致性雜湊與虛擬節點（應用場景）',
        text: '一致性雜湊解決分散式快取/負載均衡的節點增減問題。傳統 `hash(key) % N` 在 N 變化時導致幾乎所有 key 重新映射（引發 Cache Storm）。一致性雜湊：節點和 key 都映射到 [0, 2³²) 的環形空間，key 順時針找最近的節點。節點增減只影響相鄰 key（約 1/N）。\n應用場景：(1) Nginx upstream consistent_hash（按 URL 路由到同一後端，利用後端 Local Cache）；(2) Redis Cluster 的 Hash Slot（16384 個虛擬槽，一致性雜湊的工程簡化）；(3) Cassandra 的 Token Ring（每個節點負責一段 Token 範圍）；(4) Memcached Client 端分片；(5) 分散式 Session 服務（同一 Session 始終路由到同一伺服器）。',
      },
    ],
    scenarios: [
      {
        type: 'practice',
        title: 'HashMap 雜湊攻擊（Hash Flood DoS）防護',
        text: '攻擊：攻擊者構造大量雜湊值相同的 key（如 Java 的 `"Aa"` 和 `"BB"` 的 `hashCode()` 相同），讓 HashMap 退化為 O(n) 鏈表，造成服務 CPU 飆高。防護：(1) Java HashMap 在 Java 8+ 中鏈長 > 8 時轉紅黑樹，O(log n) 最壞；(2) Perl/PHP/Python 使用隨機 seed 的 Siphash（每次啟動不同的雜湊種子），讓攻擊者無法預測碰撞；(3) HTTP 框架限制 POST Form 的鍵數量（如 Django `DATA_UPLOAD_MAX_NUMBER_FIELDS`）。',
      },
    ],
    interview: [
      {
        question: 'Java 8 中 HashMap 從鏈表轉紅黑樹的閾值為 8，為什麼選這個數字？',
        answer: 'Java 8 HashMap 原始碼注釋給出了統計學依據：在負載因子 0.75 下，按 Poisson 分布計算，桶中鏈長 = 8 的概率約為 0.00000006（六百萬分之一）。正常情況下幾乎不會觸發樹化，選 8 是在「幾乎不樹化」和「萬一觸發時的效能保障」之間取平衡。同時，樹化需要 TreeNode（是 Node 的兩倍記憶體），閾值太小會浪費記憶體。收縮閾值（樹轉回鏈表）是 6，留 2 的 Hysteresis，防止在邊界值附近頻繁轉換。',
        keywords: ['Poisson Distribution', 'Load Factor', 'TreeNode', 'Rehash', 'Hysteresis'],
      },
      {
        question: 'HashMap 的負載因子 (Load Factor) 為什麼預設是 0.75？',
        answer: "這是一個空間與時間的折衷。提高負載因子（如 0.9）可以節省空間，但會增加雜湊衝突概率，導致查詢鏈變長；降低負載因子（如 0.5）查詢快，但會頻繁觸發 Rehash 且浪費記憶體。0.75 結合了 Poisson 分布規律，使桶中數據量達到一定閾值的概率極小，保證了平均 O(1) 的查詢效率。",
        keywords: ['Load Factor', 'Space-Time Tradeoff', 'Poisson Distribution'],
      },
      {
        question: '解釋一致性雜湊 (Consistent Hashing) 中的虛擬節點 (Virtual Nodes) 有什麼用？',
        answer: "物理節點數量較少時，在雜湊環上的分佈可能不均勻，導致「數據傾斜」 (Data Skew)，某些節點負擔過重。虛擬節點將一個物理節點映射到環上的多個位置（通常 100-200 個），使數據分佈更均勻，且在某個物理節點宕機時，其數據能均勻遷移到多個剩餘節點，避免單個節點被壓垮。",
        keywords: ['Data Skew', 'Consistent Hashing', 'Load Balancing', 'Hotspot'],
      },
    ],
  },

  'trees-graphs': {
    concepts: [
      {
        title: '圖的表示與遍歷：BFS vs DFS 的適用場景',
        text: 'BFS（廣度優先搜尋）：逐層擴展，使用 Queue，保證找到最短路徑（無權圖）。空間複雜度 O(b^d)（b=分支因子，d=深度），在分支多深度深的圖中記憶體消耗大。應用：最短路徑（如 LeetCode 地圖問題、網路拓撲最短跳數）、社交關係的 N 度好友、爬蟲（按層次爬取）。\nDFS（深度優先搜尋）：沿一條路徑走到底，使用 Stack（或遞迴），空間 O(h)（h=深度），比 BFS 節省記憶體。應用：拓撲排序（DAG）、檢測環、連通分量、樹的序列化/反序列化、解決迷宮和回溯問題。\n實際系統應用：(1) Kubernetes 資源依賴解析（拓撲排序，DFS 的應用）；(2) DNS 解析樹（DFS 解析 CNAME 鏈）；(3) Docker 映像層依賴（DAG + 拓撲排序確定構建順序）；(4) Git Commit Graph（DAG，用 BFS 找兩個 Commit 的公共祖先）。',
      },
      {
        title: 'Dijkstra vs A* vs Bellman-Ford 最短路徑',
        text: 'Dijkstra：貪婪演算法，每次選擇當前最短距離的未訪問節點，用 Min Heap 優化後 O((V+E) log V)。要求：邊的權重非負。應用：網路路由（OSPF 協定的核心演算法）、地圖導航（Google Maps 的基礎）。\nA*（A-Star）：Dijkstra + 啟發式函數（Heuristic）估計到終點的剩餘距離，引導搜尋方向，平均效能遠好於 Dijkstra。應用：遊戲 AI 路徑規劃、機器人導航。\nBellman-Ford：可處理負邊權重，O(V×E)，可偵測負環。應用：BGP 路由協定的早期版本（現在用 Path Vector 替代）、金融套利偵測（負環即存在套利機會）。\nFloyd-Warshall：O(V³)，計算所有點對之間的最短路徑，適合小圖的全對最短路徑（如微服務 Mesh 中的延遲矩陣計算）。',
      },
    ],
    scenarios: [
      {
        type: 'design',
        title: '微服務依賴圖的循環依賴偵測與拓撲排序',
        text: '問題：CI/CD 系統在部署前需要確認服務啟動順序（B 依賴 A → A 先啟動），並偵測循環依賴（A 依賴 B，B 依賴 A）。算法：DFS 拓撲排序（Kahn 演算法的 BFS 版本更易實現）：(1) 計算每個節點的入度（In-degree）；(2) 將入度為 0 的節點加入 Queue；(3) 每次取出一個節點，將其後繼節點的入度減 1，若後繼節點入度變為 0 則加入 Queue；(4) 若最終輸出節點數 < 總節點數，說明有環（循環依賴）。這正是 `Kubernetes` Helm Chart 的依賴解析和 `npm/yarn` 套件安裝順序計算的核心邏輯。',
      },
    ],
    interview: [
      {
        question: 'DFS 在圖中如何用於偵測環？',
        answer: '使用三色標記：White（未訪問）、Gray（正在 DFS 中，在當前 Stack 上）、Black（DFS 完成）。若在 DFS 過程中，從一個 Gray 節點存取到另一個 Gray 節點，說明存在後向邊（Back Edge），即有環。具體：對每個未訪問節點開始 DFS，遞迴前標記 Gray，遞迴返回後標記 Black。若在遞迴時發現鄰居是 Gray（在當前 DFS 路徑上），即偵測到環。有向圖（DAG 偵測）用三色；無向圖用二色（visited + parent 追蹤，避免把走回父節點誤判為環）。',
        keywords: ['三色標記', 'Back Edge', 'DFS Stack', '有向圖', '無向圖', 'Topological Sort'],
      },
      {
        question: '與 DFS 相比，為什麼 BFS 更適合在社交網絡中查找「二度人脈」？',
        answer: "BFS 按層遍歷，第一層是直接好友，第二層就是好友的好友（二度人脈）。BFS 保證在找到目標時路徑是最短的。DFS 則會沿著一條線走到底，可能繞了一大圈才找到一個遠親，且為了找最短路徑需要記錄所有路徑，空間和時間效率極低。資深視角：在工業界，這類問題通常在圖數據庫 (Neo4j) 中使用 Cypher 查詢或使用 Pregel 模型的分散式圖計算實現。",
        keywords: ['BFS', 'Shortest Path', 'Social Graph', 'Graph Database'],
      },
      {
        question: '解釋 Dijkstra 算法為什麼不能處理負權邊？',
        answer: "Dijkstra 基於貪婪策略，一旦一個節點被標記為「已確定最短路徑」(visited)，就不會再更新。如果有負權邊，後面的路徑可能讓已確定的節點距離變得更短，破壞了貪婪前提。對於包含負權邊的圖，應使用 **Bellman-Ford** 或 **SPFA** 算法。資深視角：在金融套利檢測中，將匯率取 $\log$ 並取負號，即可將乘法套利轉化為負環檢測問題，使用 Bellman-Ford 求解。",
        keywords: ['Dijkstra', 'Greedy', 'Negative Weight', 'Bellman-Ford', 'Arbitrage'],
      },
    ],
  },

  'advanced-ds': {
    concepts: [
      {
        title: 'Bloom Filter：以空間換精確度的概率資料結構',
        text: 'Bloom Filter 用 m bits 的位元組和 k 個不同雜湊函數，判斷元素是否「可能存在」（False Positive 可能）或「一定不存在」（無 False Negative）。插入：計算 k 個雜湊值，對應位元設為 1。查詢：k 個位元全為 1 → 可能存在；任一為 0 → 一定不存在。\n應用場景：(1) Redis Bloom Filter Module：避免快取穿透（查詢不存在的 key），先問 Bloom Filter，若「一定不存在」直接返回，不查 DB；(2) HBase / Cassandra：每個 SSTable 帶 Bloom Filter，避免讀取不包含目標 key 的 SSTable 檔案，大幅減少磁碟 I/O；(3) Chrome 惡意 URL 偵測：瀏覽器本地儲存 Bloom Filter，快速過濾明顯安全的 URL；(4) 郵件垃圾過濾：判斷寄件者是否在黑名單。\n誤判率（False Positive Rate）≈ $(1 - e^{-kn/m})^k$，可通過增大 m 降低。',
      },
      {
        title: 'Skip List（跳表）：有序鏈表的多層索引',
        text: '跳表是一個多層有序鏈表，每個節點隨機決定晉升到更高層（概率 p，通常 0.25 或 0.5）。Layer 0 是完整鏈表，高層是稀疏索引。查找時從最高層開始，跳過大段資料，平均 O(log n) 的查找、插入、刪除。\n應用：Redis ZSet（SortedSet）使用跳表作為底層結構（同時配合 Hashtable 實現 O(1) 點查）。選跳表而非紅黑樹的原因：實現更簡單、範圍查詢只需遍歷 Layer 0 鏈表、並發修改時加鎖粒度更細（不需要樹的旋轉操作）。LevelDB/RocksDB 的 MemTable 也使用跳表，因為跳表天然有序且支援並發讀（無需鎖全表）。',
      },
      {
        title: 'Trie（字典樹）與 Radix Tree',
        text: 'Trie（Prefix Tree）：每個節點代表一個字元，從根到某節點的路徑表示一個字串前綴。查找長度 L 的字串 O(L)，不受資料量影響。\n應用：(1) 搜尋引擎的自動補全（Autocomplete）：維護一個 Trie，前綴查找後 DFS 找所有補全候選；(2) IP 路由表（Radix Tree/Patricia Trie）：將 IP 位址二進位化，在 Radix Tree 中最長前綴匹配（Longest Prefix Matching），Linux 的 FIB（Forwarding Information Base）使用壓縮 Trie；(3) DNS 解析：域名逆序（`com.example.www`）存入 Trie；(4) Nginx/Envoy 的路由規則前綴匹配；(5) Aho-Corasick 演算法（多模式字串匹配）基於 Trie + KMP 失敗函數，用於病毒碼掃描、敏感詞過濾。',
      },
    ],
    scenarios: [
      {
        type: 'design',
        title: '設計一個 IP 黑名單快速查詢系統（億級 IP）',
        text: '需求：系統有 1 億個封鎖 IP，每個請求到來時需要在 < 1ms 內判斷是否在黑名單。方案對比：(1) HashSet：O(1) 查找，但 1 億個 IPv4 佔用約 1.6GB 記憶體（每個 IP 16 bytes 作為字串）；(2) Bloom Filter：假設 1% 誤判率，1 億個元素約需 183MB，查找 O(k)（k 個雜湊，通常 < 10），速度極快。但有 1% 的正常 IP 被誤殺，需業務評估是否可接受；(3) Radix Tree（Patricia Trie）：支援 CIDR 範圍黑名單（如封鎖 192.168.0.0/16），最長前綴匹配，記憶體效率高於 HashSet，約 400-800MB；(4) 混合方案：Bloom Filter 快速預過濾（1% 誤判率），誤判再查精確 HashSet，兼顧速度和準確性。',
      },
    ],
    interview: [
      {
        question: 'Bloom Filter 如何支援刪除操作？',
        answer: '標準 Bloom Filter 不支援刪除——設定的位元可能被多個元素共享，清除一個元素的位元可能影響其他元素的判斷，造成 False Negative（查詢說「一定不存在」但實際存在）。解法：Counting Bloom Filter（CBF）：每個位元改為計數器，插入時遞增，刪除時遞減，計數器 > 0 表示「可能存在」。代價：每個計數器需要 4 bits（相比 1 bit），空間佔用約 4 倍。Cuckoo Filter：比 CBF 更省空間，支援刪除，且查詢效能更好（利用 Cuckoo Hashing），是 Bloom Filter 的現代替代方案。',
        keywords: ['False Positive', 'False Negative', 'Counting BF', 'Cuckoo Filter', 'Hash Collision'],
      },
      {
        question: '為什麼 Redis 的有序集合 (ZSet) 使用 Skip List 而不是紅黑樹？',
        answer: "(1) **範圍查詢更高效**：Skip List 底層是鏈表，範圍查詢只需在對應層級找到起點，然後順著 Layer 0 往後掃；(2) **併發友好**：Skip List 的修改（如插入）只需局部加鎖，不涉及紅黑樹那樣全域的旋轉平衡；(3) **實現簡單**：代碼量少，易於維護。資深視角：其實內存佔用上 Skip List 略高於紅黑樹，但工程效能與開發彈性的權衡使其成為 Redis 的選擇。",
        keywords: ['Skip List', 'Red-Black Tree', 'Range Query', 'Concurrency'],
      },
      {
        question: '什麼是 Trie 的「壓縮」 (Radix Tree)，它解決了什麼問題？',
        answer: "標準 Trie 如果路徑上有很多節點只有一個子節點，會造成大量內存浪費。Radix Tree（基數樹）將這些「單子鏈」合併成一個節點（儲存一個字串而非單個字元）。這顯著減少了節點數量和指針開銷。應用：Redis 的 Stream 結構、Linux 內核的內存頁管理、以及路由匹配庫 (如 Go 的 httprouter) 都廣泛使用 Radix Tree。",
        keywords: ['Radix Tree', 'Trie', 'Memory Optimization', 'Patricia Trie'],
      },
    ],
  },

  'distributed-algo': {
    concepts: [
      {
        title: '一致性雜湊的工程實現與 Jump Consistent Hash',
        text: '一致性雜湊（Consistent Hashing）標準實現：將節點和 key 都映射到 [0, 2³²) 的環，key 順時針找最近節點。虛擬節點（Virtual Nodes）：每個物理節點在環上有多個虛擬節點（100-200 個），解決物理節點分布不均（Hot Spot）問題。\nJump Consistent Hash（Google 2014）：用一個 64-bit 整數 key，在不使用環形資料結構的情況下，O(log n) 時間確定 key 屬於哪個桶（n 個 Bucket 中的哪一個），空間 O(1)，比環形一致性雜湊更快更均衡。但不支援自定義節點 ID 和 Replication。\n應用場景：(1) Redis Cluster 的 16384 Hash Slot 是一致性雜湊的工程簡化（固定 16384 個虛擬槽，節點間遷移槽而非重新計算雜湊）；(2) Cassandra 的 VNode；(3) Nginx upstream consistent_hash。',
      },
      {
        title: 'Gossip 協定：去中心化的叢集狀態傳播',
        text: 'Gossip（流行病協定）：每個節點週期性地隨機選取 k 個節點交換狀態資訊（類似謠言傳播）。收斂時間 O(log N)（N 為節點數），天然容忍節點故障，無單點。\n應用：(1) Cassandra 的節點發現和叢集狀態同步（每秒 Gossip，傳播成員狀態：UP/DOWN/JOINING）；(2) Redis Cluster 的節點心跳（每 100ms 隨機 Gossip）；(3) Consul 和 Serf 的叢集成員管理；(4) Docker Swarm 的節點發現。\nGossip vs. 集中式配置中心（etcd/Consul K-V）：Gossip 去中心化、最終一致，適合成員狀態這類容忍短暫不一致的場景；etcd 強一致，適合分散式鎖、配置、選主等需要強一致的場景。兩者常在同一系統中並用（Cassandra 用 Gossip 做成員管理，但寫入協調用 Quorum 強一致）。',
      },
    ],
    scenarios: [
      {
        type: 'design',
        title: '設計一個去中心化的服務發現系統',
        text: '需求：微服務叢集 1000 個實例，需要低延遲服務發現，不能有單點故障。方案：結合 Gossip + Local Cache。(1) 每個服務實例維護一份本地的服務端點列表（Local Registry Cache）；(2) 服務啟動時透過 Gossip 廣播自己的存在，節點間週期性同步更新；(3) 健康檢查：本地週期性對已知節點 Ping，標記不健康的節點；(4) 讀取服務端點直接查本地 Cache，延遲 < 1ms（無網路請求）；(5) 一致性保證：最終一致，新節點加入最多 O(log N) 個 Gossip 輪次後被所有節點發現。類似架構：Netflix Eureka（去中心化）vs. etcd/Consul（強一致中心化）。',
      },
    ],
    interview: [
      {
        question: '為什麼 Redis Cluster 使用固定的 16384 個 Hash Slot，而不是用傳統一致性雜湊？',
        answer: 'Hash Slot 的優勢：(1) 遷移粒度明確——移動整個 Slot 的資料到新節點，操作明確且可以追蹤進度；(2) 不需要虛擬節點——16384 個 Slot 天然均勻分布，無需額外的虛擬節點機制；(3) 訊息開銷可控——Cluster 的 Gossip 訊息包含每個節點負責的 Slot 範圍（一個位元組位元組），16384 bits = 2KB，Gossip 訊息大小可預測；(4) 運維直觀——可以任意指定哪個節點負責哪些 Slot，方便按業務資料隔離。選 16384 而非 65536：65536 的 Gossip 訊息心跳頭部過大，16384 在叢集節點不超過 1000 時已足夠均衡。',
        keywords: ['Hash Slot', 'Gossip', 'Slot Migration', 'Virtual Node', '16384'],
      },
      {
        question: '解釋 Gossip 協議的「最終一致性」是如何達成的？',
        answer: "Gossip 通過「傳染病式」傳播：每個節點隨機選 K 個鄰居交換數據。數據帶有時間戳/版本號。即使部分節點宕機或網絡分區，只要剩餘節點連通，信息就會在 $O(\log N)$ 個週期內傳遍全體。資深視角：Gossip 適合管理集群元數據 (Membership)，但不適合需要強一致事務的場景，因為它無法保證「任何時刻讀到的都是最新值」。",
        keywords: ['Gossip', 'Eventual Consistency', 'Vector Clock', 'Convergence'],
      },
      {
        question: '分散式 ID 生成算法 Snowflake (雪花算法) 的原理及潛在問題？',
        answer: "原理：64-bit Long 型，包含 (1bit 符號) + (41bit 毫秒戳) + (10bit 機器 ID) + (12bit 序列號)。支持高並發且全局有序。問題：(1) **時鐘回撥 (Clock Skew)**：如果機器時鐘回退，可能生成重複 ID。應對：算法需檢查當前時間 < 上次生成時間，並拋出異常或等待時鐘追趕；(2) 機器 ID 分配：通常配合 Zookeeper/Etcd 動態分配機器 ID。",
        keywords: ['Snowflake', 'Distributed ID', 'Clock Skew', 'Sequence Number'],
      },
    ],
  },

  'rate-limiting-algo': {
    concepts: [
      {
        title: '四大限流演算法：令牌桶、漏桶、固定視窗、滑動視窗',
        text: '固定視窗（Fixed Window）：每個固定時間視窗（如每分鐘）計數，超過閾值拒絕。缺點：視窗邊界問題——視窗末尾 + 視窗開始可在 2 秒內允許 2 倍流量突刺。\n滑動視窗（Sliding Window Log）：記錄每個請求的時間戳，計算最近 N 秒內的請求數。精確但記憶體佔用大（每個請求一個記錄）。Sliding Window Counter：固定視窗的折中——計算 `當前視窗計數 × 當前視窗佔比 + 上一視窗計數 × 剩餘佔比`，近似滑動視窗，記憶體 O(1)。\n令牌桶（Token Bucket）：以固定速率往桶中加令牌，每個請求消耗一個令牌，桶滿則丟棄新令牌。允許突發（Burst）——桶未滿時可快速消耗積累的令牌。適合有合理突發流量的 API 限流。\n漏桶（Leaky Bucket）：請求進入佇列，以固定速率從佇列取出處理，佇列滿則丟棄。嚴格平滑流量，無突發。適合後端服務保護（如對資料庫的查詢限流）。',
      },
      {
        title: '分散式限流：Redis + Lua 的實現',
        text: '單機限流難以應對多實例部署的場景（每個實例獨立計數，實際允許流量 = 閾值 × 實例數）。分散式限流使用 Redis 作為共享計數器。\n固定視窗：`INCR key`，`EXPIRE key windowSeconds`，若返回值 > 閾值則拒絕。問題：INCR 和 EXPIRE 不原子，可用 Lua Script 保證原子性。\n令牌桶（Redis 實現）：儲存 `{tokens, last_refill_time}`，請求時用 Lua Script：計算自上次加桶到現在應加的令牌數，計算當前令牌數，若 > 0 則消耗 1 個令牌並放行，否則拒絕。Lua 執行是原子的（Redis 單線程），無需分散式鎖。\n生產方案：Nginx `limit_req_zone`（本地令牌桶）+ Redis（跨實例同步，用於需要精確計數的場景）+ API Gateway 的全局限流。',
      },
    ],
    scenarios: [
      {
        type: 'practice',
        title: '設計 API Gateway 的多維度限流系統',
        text: '需求：對 API 進行 (1) 全局 QPS 限制；(2) 按用戶 ID 限制（每個用戶每分鐘最多 100 次）；(3) 按 IP 限制（防爬蟲）；(4) 按 API 端點限制（某些端點更昂貴）。架構：(1) Redis 叢集作為計數後端，key 設計：`rate:{userId}:{endpoint}:{windowTs}`；(2) 限流邏輯在 API Gateway 中（如 Kong 的 Rate Limiting 插件、Envoy 的 ratelimit filter 呼叫外部 Rate Limit Service）；(3) 拒絕回應：`429 Too Many Requests`，並在 Header 中返回 `Retry-After`、`X-RateLimit-Remaining`、`X-RateLimit-Reset`，讓客戶端實現指數退避；(4) Rate Limit Service 本身需要高可用（Redis Sentinel/Cluster）。',
      },
    ],
    interview: [
      {
        question: '令牌桶和漏桶的本質區別是什麼？哪個更適合 API 限流？',
        answer: '令牌桶允許突發（Burst）：令牌是預先積累的，空閑時桶裡積滿令牌，突發流量到來時可以快速消耗積累的令牌，實際允許短時間內超過設定的平均速率。漏桶強制平滑輸出：無論輸入流量多不規則，輸出始終是均勻的固定速率，不允許任何突發。API 限流通常用令牌桶：正常用戶的行為本來就有突發性（批次操作、頁面載入觸發多個 API），用令牌桶允許合理突發，用戶體驗更好；同時通過設定桶大小限制最大突發量。漏桶適合保護後端服務（如資料庫），將不規則的前端流量整形為均勻的後端請求。',
        keywords: ['Token Bucket', 'Leaky Bucket', 'Burst', 'Smooth', 'Rate Limit Service'],
      },
      {
        question: '如何在 Redis 中實現「滑動窗口」限流？',
        answer: "使用 Redis 的 **zset (Sorted Set)**。將用戶 ID 作為 Key，毫秒戳作為 score 和 value。流程：(1) `ZREMRANGEBYSCORE key 0 (now - window)` 移除窗口外的數據；(2) `ZCARD key` 獲取窗口內數據量，判斷是否超過閾值；(3) 若未超過，`ZADD key now now` 加入當前請求並 `EXPIRE`。資深視角：此方案需用 **Lua Script** 保證操作原子性，防止在高並發下計數器不準確。",
        keywords: ['Sliding Window', 'Redis zset', 'Lua Script', 'Atomicity'],
      },
      {
        question: '面對突發流量 (Traffic Spike)，固定窗口限流會有哪些問題？',
        answer: "主要問題是「窗口邊界效應」。例如限制 1 分鐘 100 次，攻擊者在 0:59 發起 100 次請求，1:01 又發起 100 次。雖然各自窗口內都沒超限，但在 2 秒內實際上發出了 200 次請求，可能壓垮後端。滑動窗口或令牌桶能有效解決此問題。",
        keywords: ['Fixed Window', 'Traffic Spike', 'Boundary Problem', 'Rate Limiting'],
      },
    ],
  },

  'big-data-algo': {
    concepts: [
      {
        title: 'Top-K 問題：Min Heap vs Quick Select',
        text: 'Top-K 最大元素：維護一個大小 K 的 Min Heap（小根堆），遍歷所有元素，若元素大於堆頂則替換堆頂並重新堆化。時間 O(n log K)，空間 O(K)。適合資料量巨大無法放入記憶體（流式處理）或 K 遠小於 n 的場景。\nQuick Select（借鑒 Quick Sort 的 Partition）：平均 O(n)，最壞 O(n²)，找到第 K 大元素。優點：原地（in-place），但需要資料全部在記憶體中，且非穩定。\n應用：(1) 即時搜尋熱門關鍵字排行（Redis ZSet + 滑動視窗）；(2) Kafka Partition 的 Leader Election 選出延遲最低的 Broker；(3) 監控系統的 P99 延遲計算（T-Digest 近似演算法）；(4) 資料庫 `ORDER BY col LIMIT K` 的最佳化（Optimizer 可以用 Top-K Heap 避免全排序）。',
      },
      {
        title: 'HyperLogLog：基數估算與概率計數',
        text: 'HyperLogLog 用極少的記憶體（約 12KB）估算超大集合的基數（Cardinality，即不重複元素個數），誤差率約 0.81%。原理：對每個元素計算雜湊值，記錄最長前導 0 的長度，用多個桶（子串）的統計值估算總基數。\n應用：(1) Redis HyperLogLog：`PFADD`, `PFCOUNT`，用 12KB 統計幾十億個 UV（獨立訪客），相比 HashSet 節省 99% 以上記憶體；(2) 資料庫 Optimizer 的列基數估計（決定是否使用索引）；(3) 網路流量分析中的唯一 IP 計數；(4) A/B 測試的獨立用戶到達計數。\n對比其他概率資料結構：Bloom Filter（成員查詢，有 False Positive）vs HyperLogLog（基數計數，有誤差）vs Count-Min Sketch（頻率估計，有高估誤差）。三者都是以準確度換空間/時間效率。',
      },
      {
        title: 'MapReduce 與 Stream Processing 的演算法基礎',
        text: 'MapReduce 的資料流：Map 階段並行處理，每個 Mapper 輸出 (key, value) 對；Shuffle 階段根據 key 重新分發（保證相同 key 的資料到同一個 Reducer）；Reduce 階段聚合同一 key 的所有值。底層演算法：Shuffle 需要分散式排序（所有 key 全局有序），使用外部排序 + 多路歸并。\nStream Processing（Flink/Spark Streaming）的演算法挑戰：(1) 亂序事件（Out-of-Order Events）：使用 Watermark（水位線）估計事件遲到的最大延遲，超過 Watermark 的遲到事件可丟棄或觸發重算；(2) 有狀態聚合（Stateful Aggregation）：Sliding Window 需要在分散式節點間維護狀態，RocksDB 作為 State Backend；(3) Exactly-Once 語義：透過 Checkpoint + 兩階段提交（Sink 支援事務）實現。',
      },
    ],
    scenarios: [
      {
        type: 'design',
        title: '設計一個即時熱搜排行榜（Top 10）',
        text: '需求：統計最近 1 小時內搜尋次數 Top 10 的關鍵字，每分鐘更新一次。方案：(1) 精確方案：Kafka 接收搜尋事件 → Flink 用 Sliding Window 1h（步進 1min）聚合計數 → 輸出到 Redis ZSet；但 1 小時視窗 × 高 QPS 需要大量狀態記憶體；(2) 近似方案：Count-Min Sketch（在每個節點估計每個關鍵字的頻率，O(1) 空間）+ 採樣 Top-K（不追蹤所有關鍵字，只維護當前候選 Top-K 的 Min Heap）；誤差率 5% 以內，記憶體節省 90%；(3) 生產實踐：微博熱搜用分層計數（秒級、分鐘級、小時級聚合），降低 Flink 狀態大小。',
      },
    ],
    interview: [
      {
        question: '如何在記憶體有限的情況下找到資料流中的前 100 名（Top-K）？',
        answer: '使用大小為 K 的 Min Heap（小根堆）：堆頂是當前 Top-K 中最小的元素。對每個新到來的元素：若元素 > 堆頂，彈出堆頂，插入新元素，重新堆化（O(log K)）；否則跳過。遍歷完所有 n 個元素後，堆中剩餘的 K 個元素就是 Top-K，總時間 O(n log K)，空間 O(K)。對比排序整個陣列 O(n log n)，在 K << n 時效能優勢明顯。分散式 Top-K：每台機器本地計算 Top-K，再把所有機器的 Top-K 彙總後做最終排序（類似 MapReduce 的 Reduce 階段），正確性：最終 Top-K 一定在每台機器 Top-K 的合集中。',
        keywords: ['Min Heap', 'O(n log K)', 'Streaming', 'Distributed Top-K', 'Quick Select'],
      },
      {
        question: '解釋 HyperLogLog 的原理及為什麼它能在 12KB 內統計幾十億數據？',
        answer: "HyperLogLog 是一種基數估算 (Cardinality Estimation) 算法。它不存儲數據本身，而是將數據雜湊成 64-bit 後，統計二進位中前導 0 的最大長度 $k$。根據伯努利試驗原理，總數量 $n \approx 2^k$。通過分桶採樣取平均值 (Harmonic Mean) 並修正誤差，實現了極高的壓縮率。資深視角：這類「空間換精確度」的算法 (Probabilistic Data Structures) 是大數據系統 (如 BigQuery, Redis) 的核心技術。",
        keywords: ['HyperLogLog', 'Cardinality', 'Probabilistic DS', 'Redis'],
      },
      {
        question: '什麼是 Count-Min Sketch？它主要用來解決什麼問題？',
        answer: "Count-Min Sketch 是一個頻率估算結構，類似 Bloom Filter，但每個位元是一個計數器。它解決的是在大規模流量中估算每個元素出現次數 (Frequency Estimation) 的問題 (如 Top-K 頻次)。優點是固定內存且支持累加；缺點是會「高估」頻率 (因為雜湊碰撞)，但從不低估。",
        keywords: ['Count-Min Sketch', 'Frequency', 'Top-K', 'Big Data'],
      },
    ],
  },

  'string-algo': {
    concepts: [
      {
        title: 'KMP 演算法：從暴力到 O(n+m) 的跨越',
        text: '暴力字串匹配：文字長 n，模式長 m，O(n×m)。KMP（Knuth-Morris-Pratt）利用已匹配部分的資訊避免回溯，時間 O(n+m)。\n核心：Failure Function（部分匹配表）f[i] = 模式串 P[0..i] 中，最長的相同前綴和後綴的長度。匹配失敗時，不需要從頭開始，而是根據 f 表跳到最長匹配前綴的下一個位置繼續比較。\n應用場景：(1) 文字編輯器的 Ctrl+F 搜尋；(2) Linux `grep` 的基礎（BM 演算法在實踐中更快）；(3) 入侵偵測系統（IDS）的特徵字串匹配；(4) Aho-Corasick 演算法（多模式同時匹配）= Trie + KMP 失敗函數，用於敏感詞過濾、病毒掃描、網絡防火牆的規則匹配。\n面試常問：Boyer-Moore（BM）演算法在最好情況下 O(n/m)（倒序比對 + 壞字元規則跳躍），實際效能常優於 KMP，是 `grep` 和文字編輯器的常用選擇。',
      },
      {
        title: 'Trie 在搜尋補全與路由匹配的工程應用',
        text: 'Trie 的三個核心操作：Insert O(L)、Search O(L)、StartsWith O(L)（L = 字串長度），不受儲存的字串數量影響（與 HashMap 的 O(1) 均攤相比，Trie 在前綴操作上有明顯優勢）。\n工程應用：(1) 搜尋引擎補全：儲存歷史搜尋詞 + 頻率，前綴查詢後 BFS / DFS 找 Top-K 補全候選（結合 Min Heap 取 Top K 個高頻詞）；(2) IP 路由（Radix Trie / Patricia Trie）：將 IP 位址二進位展開存入 Trie，最長前綴匹配決定路由出口，Linux FIB 的核心資料結構；(3) HTTP 路由框架（httprouter/chi/Echo）：URL 路徑存入 Trie，`/users/:id/posts` 的 `:id` 用通配節點（Wildcard Node）表示，路由查找 O(L) 且支援參數提取，比正規表示式匹配快；(4) 自動糾錯（Spell Checker）：BFS Trie 找編輯距離 ≤ 1 的候選詞。',
      },
    ],
    scenarios: [
      {
        type: 'practice',
        title: '敏感詞過濾系統：Aho-Corasick 的工程實現',
        text: '需求：100 萬個用戶留言，需要過濾 10 萬個敏感詞。暴力法：對每個留言，對每個敏感詞做字串匹配，O(n × m × L)，完全不可行。Aho-Corasick（AC 自動機）：(1) 建構所有敏感詞的 Trie；(2) 為 Trie 的每個節點建立 Failure Link（類似 KMP 的失敗函數）：當前節點匹配失敗時，跳轉到最長後綴的對應節點；(3) 對輸入文字，AC 自動機的狀態機做一次線性掃描 O(n)，即可找出所有出現的敏感詞（n 為文字長度）。整體複雜度：O(建構時間 + 輸入文字長度）。生產實踐：Golang 的 `ahocorasick` 庫、Java 的 Lucene 全文索引底層都使用 AC 自動機。',
      },
    ],
    interview: [
      {
        question: 'Trie 和 HashMap 的字串查找，哪個更快？各有什麼優缺點？',
        answer: '查找速度：Trie O(L)（L=字串長度），HashMap 均攤 O(L)（雜湊計算需要遍歷整個字串）——點查上兩者接近。Trie 的獨特優勢：(1) 前綴操作天然 O(L)，HashMap 不支援前綴查詢（需要遍歷所有 key）；(2) 字串字典序遍歷：DFS Trie 即可按字母序輸出所有 key，HashMap 無序；(3) 最長前綴匹配（路由表）：Trie 天然支援，HashMap 需要遍歷所有可能前綴。HashMap 的優勢：(1) 記憶體效率高（Trie 節點數 = 所有 key 的字元總數，有大量指針開銷）；(2) 隨機存取效能更好（CPU Cache 友好）。選擇：純粹的 Key-Value 儲存選 HashMap；需要前綴/自動補全/路由匹配選 Trie；記憶體敏感時用 Radix Trie（壓縮版）。',
        keywords: ['Prefix Match', 'Autocomplete', 'AC Automaton', 'Radix Trie', 'Cache Friendly'],
      },
      {
        question: '解釋 KMP 算法中「部分匹配表」(Next Array) 的作用？',
        answer: "Next Array 記錄了模式串中每個前綴子串的「最長相等前後綴長度」。當主串與模式串在 $j$ 位置失配時，不需要回溯主串指針，而是根據 Next[j] 直接跳轉到下一個可能匹配的位置。資深視角：KMP 解決的是單一模式串的匹配問題；如果有大量關鍵字需要同時匹配 (如過濾 1000 個髒字)，則應選用 **Aho-Corasick (AC) 自動機**。",
        keywords: ['KMP', 'Next Array', 'String Matching', 'AC Automaton'],
      },
      {
        question: '什麼是編輯距離 (Edit Distance)？它在搜索引擎中如何應用？',
        answer: "編輯距離 (Levenshtein Distance) 是指將字串 A 轉為 B 所需的最少操作次數（插入、刪除、替換）。在搜索引擎中，用於實現「拼寫糾錯」 (Did you mean?)：當用戶查詢一個詞無結果時，後台會在 Trie 樹中查找編輯距離 $\le 2$ 的正確候選詞推薦給用戶。",
        keywords: ['Edit Distance', 'Spell Check', 'Dynamic Programming', 'Levenshtein'],
      },
    ],
  },
}
