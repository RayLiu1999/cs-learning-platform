export const os = {
  'process-thread': {
    concepts: [
      {
        title: 'Process vs Thread vs Fiber 本質差異',
        text: 'Process（行程）是資源分配的基本單位，擁有獨立的虛擬位址空間、檔案描述符、Heap。Thread（執行緒）是 CPU 排程的基本單位，同一 Process 內的 Thread 共享 Heap 和程式碼段，但各自擁有獨立的 Stack 和 Register。Fiber（綠色執行緒）由使用者空間排程，切換不需要進入 Kernel，成本最低。\n資深視角：Fork 一個 Process 的代價遠高於建立 Thread（需複製頁表、初始化 PCB），這是 Nginx 使用多 Thread 而非多 Process 的核心原因之一。Linux 的 `clone()` 系統呼叫可以精細控制父子行程共享哪些資源，`pthread_create` 底層就是使用 `clone(CLONE_VM | CLONE_FILES | ...)` 實現的。',
      },
      {
        title: 'PCB（行程控制塊）與 TCB（執行緒控制塊）',
        text: 'PCB 儲存行程狀態機轉換所需的全部資訊：PID、虛擬記憶體映射表、開啟的檔案描述符、訊號處理函數、CPU 排程優先權。TCB 則儲存更輕量的執行緒專屬資訊：TID、Stack Pointer、Register 快照、Thread-Local Storage。\n資深視角：當程式碼呼叫 `malloc` 分配 Heap 記憶體時，底層最終會呼叫 `brk()` 或 `mmap()` 系統呼叫。這些操作更新的是 PCB 中的 mm_struct（記憶體管理結構），而非 TCB。因此多執行緒 malloc 存在競爭，高效能服務通常使用 TCMalloc 或 jemalloc 來避免 Heap 鎖競爭。',
      },
      {
        title: 'Context Switch（上下文切換）的真實開銷',
        text: '一次 Context Switch 的代價包含：(1) 儲存/恢復 CPU Register（通常 ~1μs）；(2) TLB Flush（切換不同 Process 時，TLB 快取全部失效，重建需要幾十次記憶體存取）；(3) Cache Cold Start（新 Thread 的資料不在 CPU Cache 中，需要從記憶體重新載入）。\n實測資料：Process 切換約 2-10μs，Thread 切換約 0.5-3μs（因為無需 TLB Flush，同 Process 內共享位址空間），Goroutine/Coroutine 切換約 100-300ns（純使用者空間，無 Kernel 呼叫）。高頻 I/O 服務（如 Redis）選擇單執行緒 Event Loop 的根本原因之一，就是完全避免 Context Switch 開銷。',
      },
      {
        title: 'User Space vs Kernel Space 切換機制',
        text: '現代 OS 執行環境分為 Ring 0（Kernel Mode）和 Ring 3（User Mode）。系統呼叫（System Call）、中斷（Interrupt）、例外（Exception）會觸發 User → Kernel 的特權等級切換。切換時需要：儲存使用者 Stack Pointer、切換到 Kernel Stack、儲存 Register 狀態。\n資深視角：傳統 `read()/write()` 需要 2 次模式切換和 2 次資料拷貝（Kernel Buffer → User Buffer）。`mmap()` 繞過了拷貝（Zero-Copy）但仍需切換。`io_uring` 的創新在於批次提交 I/O 請求（透過共享 Ring Buffer），大幅減少系統呼叫次數，這是 Linux 5.1 後高效能 I/O 的核心機制。',
      },
    ],
    scenarios: [
      {
        type: 'practice',
        title: 'Java 服務 Thread Pool 設定導致 CPU 飆高排查',
        text: '現象：8 核 Server 上跑了 200 個 Thread 的 Thread Pool，服務響應時間劣化。根因：200 個 Thread 在 8 個 CPU Core 上輪流切換，每秒數千次 Context Switch，TLB 和 CPU Cache 持續失效。CPU 使用率高，但有效計算時間低。解法：(1) 計算合理的 Thread Pool 大小：CPU 密集型 = CPU 核數 + 1；I/O 密集型 = CPU 核數 × (1 + I/O 等待時間 / CPU 計算時間)；(2) 改用 Virtual Thread（Java 21）或 Reactive 模型徹底消除阻塞。',
      },
      {
        type: 'design',
        title: '設計一個高並發文件處理服務：Process vs Thread 的選型',
        text: '需求：接收用戶上傳的 PDF，進行 OCR 並返回結果。分析：OCR 是 CPU 密集型任務，且每個任務相互獨立。方案對比：(1) 多 Thread：簡單，但 OCR 庫若非 Thread-Safe 會崩潰，且一個 Thread 崩潰會帶倒整個 Process；(2) 多 Process（Pre-Fork）：隔離性強，崩潰只影響一個 Worker，類似 Nginx Worker 模型；(3) 多 Process + Process Pool：避免頻繁 Fork 的開銷，Celery 的預設模型。推薦：多 Process Pool + 任務隊列，每個 Worker Process 單獨申請 GPU/CPU 資源。',
      },
    ],
    interview: [
      {
        question: 'Thread 和 Process 的本質區別是什麼？什麼時候選擇多 Process？',
        answer: 'Process 是資源隔離單位（獨立位址空間、獨立 FD），Thread 是排程執行單位（共享 Heap、程式碼段）。選擇多 Process 的場景：(1) 需要強隔離（一個崩潰不影響其他，如 Nginx Worker）；(2) 使用 CPU 密集型第三方庫且可能不是 Thread-Safe；(3) 需要利用 Fork-on-Write 讓子行程繼承父行程的資料（如 Redis BGSAVE）。選擇多 Thread：任務需要大量共享狀態、同一行程內高頻通訊。',
        keywords: ['PCB', 'TCB', 'Fork', 'Clone', 'Thread-Safe'],
      },
      {
        question: 'Context Switch 的代價有多少？如何減少它？',
        answer: 'Thread 切換約 0.5-3μs，Process 切換 2-10μs，Goroutine 切換約 100-300ns。代價來源：Register 儲存恢復、Kernel/User 空間切換、TLB/Cache 失效。減少方式：(1) 使用協程（Goroutine/Green Thread）在使用者空間排程；(2) 減少 Thread 數量，避免頻繁阻塞；(3) 使用 CPU Affinity 綁定 Thread 到固定 Core，保持 Cache 熱度；(4) Event Loop 模型完全避免阻塞式 I/O 等待。',
        keywords: ['TLB Flush', 'Cache Cold', 'Goroutine', 'CPU Affinity', 'Event Loop'],
      },
    ],
  },

  'memory-management': {
    concepts: [
      {
        title: '虛擬記憶體、分頁機制與 TLB',
        text: '每個 Process 都有獨立的虛擬位址空間（32 位元 4GB，64 位元 128TB）。MMU（記憶體管理單元）透過多層頁表（Page Table）將虛擬位址翻譯成實體位址。x86-64 使用 4 層頁表（PML4 → PDPT → PD → PT），每次位址翻譯需 4 次記憶體存取。\nTLB（Translation Lookaside Buffer）是頁表的硬體快取，命中率通常 > 99%。TLB Miss 代價極高（需遍歷頁表），Process 切換時 TLB 必須 Flush（因為不同 Process 的虛擬位址映射不同）。Linux 的 Huge Pages（2MB/1GB）可大幅減少 TLB Miss，適用於 Redis、HBase 等記憶體密集型服務。',
      },
      {
        title: 'JVM GC 演算法深度比較：CMS vs G1 vs ZGC',
        text: 'CMS（Concurrent Mark-Sweep）：標記階段並發，Sweep 階段並發，但有 Initial Mark 和 Remark 兩次 STW。缺點：產生記憶體碎片，無法整理 Old Gen，長期運行後 Full GC 停頓可達數秒。\nG1（Garbage First）：將 Heap 分為等大小的 Region（預設 1-32MB），優先回收垃圾最多的 Region。有 Mixed GC 機制可部分清理 Old Gen，STW 時間可預測（通常 < 200ms），是 JDK 9+ 的預設 GC。\nZGC（JDK 15+）：使用著色指針（Colored Pointer）和讀屏障（Load Barrier）實現幾乎全程並發，STW < 1ms，適用於對延遲極度敏感的服務（如金融交易系統）。代價：較高的 CPU 開銷（並發 GC 佔用額外 CPU 時間）。',
      },
      {
        title: 'GC 調優：STW 問題排查思路',
        text: 'STW（Stop-The-World）是指 GC 發生時所有業務 Thread 暫停的現象。排查步驟：(1) 使用 `jstat -gcutil` 或 GC Log 分析 GC 頻率和停頓時間；(2) 確認是 Minor GC（Young Gen 太小）還是 Full GC（Old Gen 空間不足）；(3) 分析物件晉升速率——物件在 Young Gen 存活幾次 GC 後晉升到 Old Gen（預設 15 次），若太多物件過早晉升需調大 Young Gen；(4) 大物件（通常 > 8KB）直接分配到 Old Gen，應避免頻繁建立大陣列。\n常見參數：`-Xmx4g -Xms4g -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:G1HeapRegionSize=16m`',
      },
      {
        title: 'Swap、Page Fault 與 OOM Killer',
        text: 'Swap Space 是磁碟上模擬 RAM 的區域。當實體記憶體不足時，OS 將最久未存取的 Page 換出到 Swap（Page Out），需要時再換入（Page In，觸發 Major Page Fault）。對資料庫和快取服務而言，Swap 是致命的——Redis 或 MySQL 的資料被換到磁碟後，查詢延遲可能從 < 1ms 暴增到 100ms+。\nOOM Killer：當記憶體完全耗盡時，Linux Kernel 會啟動 OOM Killer，根據 `oom_score` 選擇一個行程殺掉。防止方式：設定 `vm.overcommit_memory=2` 禁止過量申請；對關鍵行程設定 `oom_score_adj = -1000`；限制 JVM `Xmx` 並預留系統記憶體。',
      },
    ],
    scenarios: [
      {
        type: 'practice',
        title: 'Go 服務記憶體持續增長但不釋放（內存洩漏排查）',
        text: '現象：Go 服務跑幾天後 RSS 記憶體不斷增長。排查流程：(1) 使用 `pprof` 抓取 heap profile：`go tool pprof http://localhost:6060/debug/pprof/heap`；(2) 分析 `top` 命令找出佔用最多記憶體的函數；(3) 常見原因：goroutine 洩漏（channel 阻塞），全域 map 無限增長，CGo 分配的記憶體未釋放；(4) goroutine 洩漏偵測：`runtime.NumGoroutine()` 持續增長。Go GC 是並發標記-清除，GOGC 預設 100（即 Heap 增長一倍時觸發 GC），可設 `GOGC=50` 更積極地回收記憶體。',
      },
    ],
    interview: [
      {
        question: 'G1 GC 和 ZGC 的核心區別是什麼？什麼場景選哪個？',
        answer: 'G1 的 STW 時間目標是 200ms，底層依賴 Region 分代和 Remembered Set 追蹤跨 Region 引用。ZGC 透過著色指針（把 GC 元資料編碼進指針的高位 bits）和讀屏障在 GC 並發期間維護物件映射，實現 < 1ms STW，Heap 可達 16TB。選擇：(1) 通用服務：G1，GC 行為可預測、調優文檔完善；(2) 低延遲服務（金融、實時競價）：ZGC；(3) 容器記憶體限制環境：考慮 Shenandoah（與 ZGC 類似，Red Hat 維護）。',
        keywords: ['Region', 'Colored Pointer', 'Load Barrier', 'STW', 'SATB'],
      },
      {
        question: '為什麼 Redis 和 MySQL 要禁用 Swap？',
        answer: 'Redis 和 MySQL 的設計假設熱點資料常駐記憶體，存取延遲在微秒級。一旦資料被 OS 換到 Swap（磁碟），存取延遲立即升至毫秒甚至數百毫秒，造成請求超時積壓。對 Redis 應設 `vm.swappiness=0`（不主動換出）；對生產環境的 MySQL 應分配足夠 RAM 並設 `vm.swappiness=1`。更根本的做法是使用 cgroups 限制服務的記憶體上限，並設定 OOM Score 保護關鍵行程。',
        keywords: ['Page Fault', 'Swappiness', 'OOM Killer', 'cgroups', '延遲'],
      },
    ],
  },

  'io-models': {
    concepts: [
      {
        title: '五種 I/O 模型全解析',
        text: '(1) Blocking I/O：呼叫 `read()` 後 Thread 阻塞等待資料就緒 + 資料拷貝完成，最簡單但浪費 Thread 資源。\n(2) Non-blocking I/O：`read()` 立即返回 EAGAIN（若資料未就緒），需要輪詢（Polling），CPU 佔用高。\n(3) I/O Multiplexing（`select/poll/epoll`）：一個 Thread 監控多個 FD，有事件時才返回。select 有 FD 上限（1024），poll 無上限但 O(n) 遍歷，epoll 用紅黑樹 + 事件驅動 O(1) 效能。\n(4) Signal-Driven I/O（SIGIO）：FD 就緒時通知訊號，實際應用較少。\n(5) Async I/O（AIO/io_uring）：使用者提交請求後可繼續執行，資料就緒並拷貝完成後才通知，真正的非阻塞。',
      },
      {
        title: 'epoll 原理：為何比 select/poll 快？',
        text: 'select/poll 每次呼叫都需將整個 FD 集合從使用者空間拷貝到 Kernel，Kernel 掃描整個集合確認就緒 FD，返回後使用者再遍歷所有 FD。時間複雜度 O(n)，且有 1024（select）的 FD 上限。\nepoll 的改進：(1) `epoll_create()` 在 Kernel 中建立一個事件表（用紅黑樹儲存 FD），只需一次性加入；(2) `epoll_ctl()` 增刪改 FD，O(log n)；(3) Kernel 透過回調機制在 FD 就緒時將其加入就緒鏈表；(4) `epoll_wait()` 只返回就緒的 FD，O(1) 到 O(k)（k 為就緒事件數）。nginx 能處理 10 萬並發連接，epoll 是關鍵。\nEdge-Triggered（ET） vs Level-Triggered（LT）：LT 只要 FD 有資料就持續通知，ET 只在狀態變化時通知一次（效率更高但程式設計複雜）。',
      },
      {
        title: 'io_uring：下一代 Linux 非同步 I/O',
        text: 'io_uring（Linux 5.1+）使用兩個環形緩衝區（Ring Buffer）：提交佇列（SQE，Submission Queue Entry）和完成佇列（CQE，Completion Queue Entry），使用者和 Kernel 共享這兩塊記憶體，透過原子操作更新指針，完全消除了 `epoll_ctl` 的系統呼叫開銷。\n批次提交：可一次提交多個 I/O 操作（read/write/accept/send），Kernel 可在不喚醒使用者的情況下批次完成，系統呼叫次數降至最低。效能對比：io_uring 在高 IOPS 場景（如 NVMe SSD 直接 I/O）比 epoll 快 30-50%。主流資料庫（PostgreSQL 16、RocksDB）已開始支援 io_uring 後端。',
      },
    ],
    scenarios: [
      {
        type: 'design',
        title: '設計一個支援 100 萬並發連接的 WebSocket 服務',
        text: '一個連接 = 一個 Thread 的模式：100 萬 Thread 需要約 100GB 記憶體（每個 Thread Stack 預設 1MB），不可行。正確方案：(1) 使用 epoll/io_uring 的 Event Loop 模型，一個 Thread 管理所有連接的 I/O 事件；(2) Reactor 模式：Main Reactor 負責 Accept 新連接，Sub Reactor（多個）負責 I/O 讀寫；(3) 業務邏輯放入 Thread Pool 避免阻塞 Event Loop；(4) 調整 OS 參數：`ulimit -n 1000000`（最大 FD 數），`net.ipv4.tcp_fin_timeout=15`，`net.core.somaxconn=65535`。',
      },
    ],
    interview: [
      {
        question: 'epoll 為何使用紅黑樹儲存 FD，而非雜湊表？',
        answer: '主要原因：(1) 紅黑樹提供 O(log n) 的插入/刪除/查找，且保持有序，便於按 FD 號快速定位；(2) 記憶體效率更優——雜湊表在低負載時浪費空間，動態調整需要 Rehash；(3) 紅黑樹是 Kernel 常用的資料結構（CFS 排程器、Timer、mmap 也用紅黑樹），代碼複用性高。雜湊表的查找是 O(1) 但實際 epoll 的查找不是熱點操作（大部分時間在等待事件），紅黑樹的穩定性更符合 Kernel 的設計哲學。',
        keywords: ['Red-Black Tree', 'O(log n)', 'Kernel', 'epoll_ctl'],
      },
      {
        question: 'Reactor 模式和 Proactor 模式的本質區別？',
        answer: 'Reactor（同步非阻塞）：Framework 通知應用程式「某個 FD 可以讀了」，應用程式自己去呼叫 `read()`，資料從 Kernel Buffer 拷貝到使用者 Buffer 這個動作由應用程式完成。代表：nginx、Redis、Node.js。Proactor（非同步）：Framework 不僅通知可讀，還已經把資料拷貝到使用者 Buffer 了，應用程式直接處理資料。代表：Windows IOCP、io_uring（部分模式）。區別核心：誰負責將資料從 Kernel Buffer 拷貝到使用者 Buffer——Reactor 是使用者負責，Proactor 是 OS 負責。',
        keywords: ['Reactor', 'Proactor', 'IOCP', 'io_uring', 'Zero-Copy'],
      },
    ],
  },

  'concurrency-models': {
    concepts: [
      {
        title: 'Goroutine 的 GMP 排程模型',
        text: 'Go 的 GMP 模型：G（Goroutine）是使用者空間的輕量執行緒（初始 Stack 僅 2KB，可動態擴展），M（Machine）是 OS Thread，P（Processor）是邏輯處理器（數量預設為 CPU 核數）。每個 P 有一個本地 Goroutine 佇列（Local Run Queue），還有全域佇列（Global Run Queue）。M 必須綁定 P 才能執行 G。\nWork Stealing：當某個 P 的本地佇列為空時，會從其他 P 的佇列偷取一半的 G 來執行，保持 CPU 使用率均衡。當 G 發生系統呼叫（如 `read()`）阻塞時，M 從 P 解綁並帶著 G 進入 Kernel，P 立即與另一個 M 結合繼續執行其他 G，這是 Go 高並發的核心機制。',
      },
      {
        title: 'Node.js Event Loop 六個階段',
        text: 'Node.js 的 Event Loop 基於 libuv，每次循環（Tick）包含六個階段：(1) Timers：執行 `setTimeout` 和 `setInterval` 的到期回呼；(2) Pending Callbacks：處理上一次循環中推遲的系統回呼；(3) Idle/Prepare：libuv 內部使用；(4) Poll：等待 I/O 事件，執行 I/O 回呼；(5) Check：執行 `setImmediate` 的回呼；(6) Close：執行關閉事件（如 `socket.close()`）。\nMicrotask 優先級高於 Event Loop：每個階段結束後、下一個階段開始前，會清空 Microtask Queue（`Promise.then`、`queueMicrotask`）。實務誤區：`setTimeout(fn, 0)` 的執行時機晚於 `Promise.then(fn)`。',
      },
      {
        title: 'Reactive Programming 與 Backpressure',
        text: 'Reactive Streams（RxJava/Project Reactor/Kotlin Flow）的核心是 Publisher-Subscriber 模式，支援非阻塞背壓（Backpressure）：當下游消費者處理速度慢於上游生產速度時，主動通知上游降速，而非無限積壓資料。\n對比傳統 Callback 模式：Reactive 提供了宣告式的資料流組合（`map`, `filter`, `flatMap`, `zip`），易於表達複雜的非同步邏輯，且內建錯誤處理。缺點：學習曲線陡峭，Stack Trace 難以閱讀，除錯困難。Spring WebFlux 基於 Project Reactor，在 I/O 密集型服務上相比傳統 Spring MVC 可減少 50% 的 Thread 使用量。',
      },
    ],
    scenarios: [
      {
        type: 'practice',
        title: 'Goroutine 洩漏導致服務記憶體溢出',
        text: '現象：Go 服務的 goroutine 數量持續增長，幾小時後 OOM。根因：一個 goroutine 在等待一個 channel 的資料，但 channel 的生產者因錯誤提前退出，消費者 goroutine 永遠阻塞（channel 洩漏）。偵測：`runtime.NumGoroutine()` 監控，或 `pprof` 的 goroutine profile。修復原則：所有 goroutine 必須有明確的退出路徑，使用 `context.WithCancel()` 或 `context.WithTimeout()` 傳遞取消訊號；使用帶 buffer 的 channel 或 `select` + `default` 避免永久阻塞。',
      },
    ],
    interview: [
      {
        question: 'Go 的 Goroutine 和 OS Thread 相比，為何能支撐更高的並發？',
        answer: '三個核心優勢：(1) 記憶體：OS Thread 預設 Stack 1-8MB，Goroutine 初始僅 2KB，可動態增長至 1GB，百萬 Goroutine 的記憶體約 2GB；(2) 切換代價：OS Thread 切換需要 Kernel 介入，約 1-5μs；Goroutine 切換在使用者空間完成，約 100-300ns；(3) 排程策略：GMP 模型讓 Goroutine 在系統呼叫阻塞時，P 立即去執行其他 Goroutine，無需等待被阻塞的 OS Thread，避免了 Thread 資源浪費。',
        keywords: ['GMP', 'Work Stealing', 'Stack Growth', 'System Call Blocking'],
      },
    ],
  },

  'locks-sync': {
    concepts: [
      {
        title: '死鎖的四個必要條件與預防',
        text: '死鎖（Deadlock）的四個必要條件（Coffman Conditions）：(1) 互斥（Mutual Exclusion）：資源一次只能被一個 Thread 持有；(2) 持有並等待（Hold and Wait）：Thread 持有資源的同時等待其他資源；(3) 不可搶佔（No Preemption）：資源不能被強制剝奪，只能自願釋放；(4) 循環等待（Circular Wait）：T1 等 T2 的資源，T2 等 T1 的資源。\n預防策略：(1) 破壞循環等待：對所有鎖設定全域排序，所有 Thread 按相同順序申請鎖；(2) 破壞持有並等待：一次性申請所有需要的鎖；(3) 逾時放棄（Timeout）：`tryLock(timeout)` 獲取鎖失敗時主動退讓；(4) 死鎖偵測後回滾（如資料庫）。',
      },
      {
        title: 'CAS（Compare-And-Swap）原子操作與 ABA 問題',
        text: 'CAS 是一個原子指令：`if (memory == expected) { memory = newValue; return true; } else return false;`。Java 的 `AtomicInteger.compareAndSet()` 底層使用 x86 的 `CMPXCHG` 指令，無需 OS 介入，是無鎖程式設計的基礎。\nABA 問題：Thread1 讀取值為 A，Thread2 將 A 改為 B 再改回 A，Thread1 的 CAS 看到的仍是 A 就成功了，但語義上值已被改過。解法：使用帶版本號的 `AtomicStampedReference`，CAS 同時比較值和版本號。\n實用建議：CAS 在競爭低時效率極高（無阻塞、無 Kernel 介入），但高競爭下 CAS 失敗重試（自旋）會消耗大量 CPU，此時傳統 Mutex 反而更優（讓 Thread 阻塞睡眠）。',
      },
      {
        title: '樂觀鎖 vs 悲觀鎖：資料庫與應用層的取捨',
        text: '悲觀鎖（Pessimistic Lock）：假設衝突高頻，先加鎖再操作。SQL 中的 `SELECT ... FOR UPDATE` 就是行級悲觀鎖。適合：衝突頻繁、操作時間長（如庫存扣減）。\n樂觀鎖（Optimistic Lock）：假設衝突罕見，先操作再驗證。常見實現：版本號（`UPDATE SET version=version+1 WHERE id=? AND version=?`）。適合：讀多寫少、衝突率低（如文件編輯）。衝突率高時大量更新失敗需重試，效能反而低於悲觀鎖。\n資深視角：MySQL 的 MVCC 本質上是一種樂觀並發控制——讀取不加鎖，透過版本鏈（Undo Log）提供快照讀，只在寫寫衝突時才需要行鎖。這是 MySQL 高並發讀的核心機制。',
      },
    ],
    scenarios: [
      {
        type: 'practice',
        title: '微服務間的分散式死鎖排查',
        text: '現象：A 服務等待 B 服務的訂單鎖，B 服務等待 A 服務的庫存鎖，兩個服務互相等待，大量請求超時。根因：A、B 兩個服務各自持有部分鎖並等待對方，形成分散式死鎖。解決方案：(1) 統一鎖申請順序：始終先申請訂單鎖後申請庫存鎖；(2) 引入分散式鎖管理器（Redis Redlock 或 Zookeeper）統一管理鎖；(3) 所有分散式鎖設定逾時（TTL），避免因持有者崩潰導致永久鎖死；(4) 使用 Saga 模式拆解長事務，避免跨服務持鎖。',
      },
    ],
    interview: [
      {
        question: 'Java synchronized 和 ReentrantLock 的區別？什麼時候選哪個？',
        answer: 'synchronized 是 JVM 關鍵字，隱式加/解鎖，JDK 1.6 後加入偏向鎖→輕量鎖→重量鎖的升級機制（低競爭時接近 CAS 效能）。ReentrantLock 是 Java 類，需手動 lock/unlock，提供更多功能：(1) `tryLock(timeout)` 超時獲取鎖；(2) `lockInterruptibly()` 可中斷等待；(3) 公平鎖（按 FIFO 順序獲取）；(4) 多個 Condition 實現更精細的等待/通知。選擇：簡單互斥場景用 synchronized（JIT 優化更佳，代碼清晰）；需要超時、中斷、公平性或多個等待條件時用 ReentrantLock。',
        keywords: ['偏向鎖', '輕量鎖', '重量鎖', 'AQS', 'Condition', 'CAS'],
      },
    ],
  },

  'cpu-scheduling': {
    concepts: [
      {
        title: '主流 CPU 排程演算法比較',
        text: 'FCFS（先來先服務）：最簡單，但長作業佔用 CPU 時短作業飢餓（Convoy Effect）。\nSJF（最短作業優先）：平均等待時間最短，但長作業可能飢餓；需預知執行時間（現實中難以做到）。\nRound Robin（輪轉）：每個行程獲得一個時間片（Time Quantum，通常 10-100ms），輪流執行。時間片太大退化為 FCFS，太小則 Context Switch 開銷過大。\nCFS（完全公平排程器）：Linux 的預設排程器，目標是讓所有行程的 `vruntime`（虛擬運行時間）保持相等。使用紅黑樹儲存所有可運行行程（按 vruntime 排序），每次選擇 vruntime 最小的行程運行。優先級（`nice` 值）透過調整 vruntime 增長速率來實現，不直接限制時間片長度。',
      },
      {
        title: 'Linux 排程類別與優先級',
        text: 'Linux 的排程器是多類別的：(1) SCHED_FIFO 和 SCHED_RR：實時排程類，優先級 1-99，搶佔普通行程；(2) SCHED_NORMAL（SCHED_OTHER）：普通行程，使用 CFS，`nice` 值 -20（最高）到 +19（最低）；(3) SCHED_IDLE：極低優先級後台任務。\n實用知識：(1) `taskset` 命令設定 CPU Affinity，綁定行程到特定 CPU Core，避免 Cache 失效；(2) `chrt -r 50 command` 設定實時優先級；(3) Kubernetes 的 CPU Request/Limit 底層使用 Linux cgroups 的 `cpu.shares` 和 `cpu.cfs_quota_us` 實現，本質上是透過限制 CFS 的執行份額來控制 CPU 使用。',
      },
    ],
    scenarios: [
      {
        type: 'practice',
        title: 'Redis 在高負載下的延遲毛刺（Latency Spike）排查',
        text: '現象：Redis 的 `SLOWLOG` 出現偶發性 5-10ms 的慢命令，但命令本身是 O(1) 操作。根因分析：(1) 排程延遲：OS 將 Redis 執行緒從 CPU 上換出，等待重新排程的時間（正常 < 1ms，高負載時可達 5ms+）；(2) NUMA 架構：Redis 執行緒被排程到遠端 NUMA Node，記憶體存取延遲翻倍；(3) 透明巨頁（THP）：OS 在後台合併小頁為大頁時引發 STW。解法：(1) 使用 `taskset` 綁定 Redis 到固定 CPU Core；(2) 關閉 THP：`echo never > /sys/kernel/mm/transparent_hugepage/enabled`；(3) 設定 `server_cpulist` 避免 NUMA 跨節點存取。',
      },
    ],
    interview: [
      {
        question: 'CFS 排程器如何實現優先級？',
        answer: 'CFS 使用 vruntime（虛擬運行時間）作為公平性度量。實際運行時間乘以一個權重因子就得到 vruntime：`vruntime += actual_runtime × (1024 / weight)`，其中 weight 由 nice 值決定（nice -20 的 weight = 88761，nice 0 = 1024，nice +19 = 15）。nice 值低的行程 weight 大，vruntime 增長慢，CFS 會更頻繁地選擇它（因為它的 vruntime 更小）。這樣不需要直接分配固定時間片，而是透過 vruntime 的增長速率差異，自然地讓高優先級行程佔用更多 CPU。',
        keywords: ['vruntime', 'nice', 'weight', '紅黑樹', 'CFS'],
      },
    ],
  },
}
