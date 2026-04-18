export const networking = {
  'osi-model': {
    concepts: [
      {
        title: 'OSI 七層模型 vs TCP/IP 四層模型',
        text: 'OSI 七層（由下到上）：(1) 實體層（Physical）—電訊號/光訊號傳輸，RJ45、光纖；(2) 資料鏈路層（Data Link）—MAC 位址、乙太網幀、ARP、交換器；(3) 網路層（Network）—IP 位址、路由器、IP/ICMP；(4) 傳輸層（Transport）—端對端通訊、TCP/UDP/QUIC；(5) 會話層（Session）—連線管理、RPC Session；(6) 表示層（Presentation）—資料格式轉換、加密（SSL/TLS）；(7) 應用層（Application）—HTTP/FTP/DNS/SMTP。\nTCP/IP 四層：鏈路層 = OSI 1+2，網路層 = OSI 3，傳輸層 = OSI 4，應用層 = OSI 5+6+7。\n資深視角：OSI 是理論模型，TCP/IP 是實際實作。面試中說出每層的協定和對應裝置最重要：實體層→Hub、資料鏈路層→Switch、網路層→Router、傳輸層→Load Balancer（L4）、應用層→Proxy/API Gateway（L7）。',
      },
      {
        title: '資料鏈路層：MAC、ARP 與 VLAN',
        text: 'MAC（Media Access Control）位址：48-bit 硬體位址，前 24 位是廠商 OUI，後 24 位是序號。MAC 位址僅在同一廣播域（Broadcast Domain）內有意義，路由器不轉發 MAC 位址。\nARP（Address Resolution Protocol）：將 IP 位址解析為 MAC 位址。發送方廣播「誰是 192.168.1.1？」，對方回應自己的 MAC 位址，結果快取在 ARP Table（通常 20 分鐘過期）。ARP 快取污染（ARP Spoofing）是常見的中間人攻擊向量。\nVLAN（Virtual LAN）：在物理網路上劃分邏輯廣播域，透過在乙太網幀中插入 802.1Q Tag（4 bytes，含 12-bit VLAN ID）實現。不同 VLAN 間通訊需要三層路由（或三層交換器）。雲端網路的 VPC 和 Overlay Network（VXLAN）都是 VLAN 概念的延伸。',
      },
      {
        title: '網路層：IP 封包、路由與 NAT',
        text: 'IP 封包頭關鍵欄位：TTL（Time to Live）—每經過一個路由器 -1，為 0 時丟棄（防止路由環路）；Protocol—指明上層協定（TCP=6, UDP=17, ICMP=1）；Source/Destination IP。\nNAT（Network Address Translation）：將私有 IP（192.168.x.x、10.x.x.x）轉換為公有 IP，解決 IPv4 位址不足問題。SNAT（Source NAT）用於家庭路由器；DNAT（Destination NAT）用於負載均衡器（將 VIP 轉換為後端 Real IP）。NAT 破壞了端對端原則（End-to-End Principle），FTP、SIP 等協定需要 ALG（Application Level Gateway）支援。\nCIDR 與子網劃分：`192.168.1.0/24` 表示前 24 位是網路前綴，可用主機 254 個（256-2，排除網路位址和廣播位址）。雲端環境中 VPC CIDR 規劃是架構設計的重要環節。',
      },
      {
        title: '傳輸層以上：TCP/UDP 選型與應用層協定分佈',
        text: 'L4 到 L7 的核心設計決策：TCP 提供可靠傳輸（ACK + 重傳 + 流量控制），適合需要完整性保證的場景（HTTP、資料庫）；UDP 無連線、無確認，延遲低，適合對實時性要求高且可以容忍少量丟包的場景（DNS 查詢、線上遊戲、視訊串流、gRPC over QUIC）。\nL7 協定分佈：HTTP/2 基於 TCP（一個連線多路復用多個 Stream）；HTTP/3 基於 QUIC（UDP，連線遷移、0-RTT 握手）；WebSocket 在 HTTP Upgrade 後使用 TCP 全雙工；gRPC 基於 HTTP/2；IoT 常用 MQTT（TCP，Pub/Sub）。面試常問：為什麼 DNS 使用 UDP？（查詢通常一個封包就能完成，不需要 TCP 三次握手的開銷；但 DNS over TCP 用於區域傳輸和 > 512 bytes 的回應）',
      },
    ],
    scenarios: [
      {
        type: 'practice',
        title: '封包捕獲排查跨服務連線問題',
        text: 'nginx 回應 502 Bad Gateway。排查步驟：(1) L3 層：`ping backend-host` 確認 IP 可達，`traceroute` 確認路由路徑；(2) L4 層：`telnet backend-host 8080` 確認 TCP 端口開放；`tcpdump -i eth0 "host backend-host and port 8080"` 抓包確認是否收到 SYN-ACK（若無回應則是防火牆/安全群組問題）；(3) L7 層：`curl -v http://backend-host:8080/health` 確認 HTTP 回應；(4) 雲端環境：檢查 Security Group、Network ACL、VPC Peering 路由表。此流程展現了從低層到高層系統性排查網路問題的方法論。',
      },
    ],
    interview: [
      {
        question: '交換器（Switch）和路由器（Router）的區別是什麼？',
        answer: '交換器工作在 L2（資料鏈路層），根據 MAC 位址進行幀轉發，維護 MAC Address Table（記錄 MAC→Port 映射）。交換器在同一廣播域內連接裝置，不能連接不同子網。路由器工作在 L3（網路層），根據 IP 位址進行封包路由，維護 Routing Table，連接不同子網，決定封包走哪條路到達目的地。類比：交換器是同一個公司樓層內的快遞分揀，路由器是城際快遞轉運（根據城市/地區號決定走向）。三層交換器（L3 Switch）同時具備 L2 轉發和 L3 路由能力，常用於資料中心內部。',
        keywords: ['MAC Table', 'ARP', 'Routing Table', 'L2', 'L3', 'Broadcast Domain'],
      },
      {
        question: '解釋 ARP 的工作原理及其安全性問題？',
        answer: 'ARP 用於將 IP 地址轉換為實體 MAC 地址。當主機需要發送封包到某 IP 時，會先廣播 ARP Request。收到回應後，將 IP-MAC 映射存入 ARP Cache。安全性：ARP 是無狀態的，主機可以發送偽造的 ARP Reply（即使沒人請求），導致其他主機的 ARP 表被「污染」。這就是 ARP Spoofing，攻擊者可以藉此監聽所有流量（MITM）。防護：使用靜態 ARP 綁定或使用具備「動態 ARP 檢測 (DAI)」功能的進階交換器。',
        keywords: ['ARP', 'MAC', 'Broadcasting', 'ARP Spoofing', 'DAI'],
      },
      {
        question: '什麼是 DHCP？它的四步過程是什麼？',
        answer: 'DHCP 用於動態分配 IP 地址。四步過程：(1) Discover（Client 廣播尋找 Server）；(2) Offer（Server 提供可用 IP）；(3) Request（Client 請求使用該 IP）；(4) ACK（Server 確認租約）。這發生在 UDP 層（Port 67/68）。為了避免廣播風暴，大型網絡會使用 DHCP Relay 將請求轉發到集中式的 DHCP Server。',
        keywords: ['DHCP', 'DORA', 'IP Lease', 'UDP 67/68'],
      },
    ],
  },

  'tcp-deep-dive': {
    concepts: [
      {
        title: 'TCP 三次握手與四次揮手的設計原因',
        text: '三次握手（SYN → SYN-ACK → ACK）：為什麼不是兩次？兩次握手只能確認 Client→Server 方向連通，Server 無法確認 Client 能收到自己的回應，且 ISN（Initial Sequence Number）協商需要雙方確認。三次握手用最少的往返次數完成全雙工連線建立和 ISN 協商。\n四次揮手（FIN → ACK → FIN → ACK）：為什麼不是三次？FIN 和 ACK 之間有間隔，因為收到對方 FIN 時，本方可能還有資料未傳完（半關閉狀態），需要等資料發送完才能發自己的 FIN。`TIME_WAIT` 狀態存在 2MSL 的原因：(1) 確保最後一個 ACK 被對方收到（若丟失，對方會重傳 FIN）；(2) 等待網路中殘留的舊封包消散，避免與新連線混淆。',
      },
      {
        title: 'TCP 流量控制與擁塞控制',
        text: '流量控制（Flow Control）：接收方在 ACK 中包含 Window Size（接收緩衝區剩餘空間），傳送方最多可傳送 Window Size 個 bytes 的未確認資料（滑動視窗）。若接收方處理慢，Window 縮小，傳送方降速。\n擁塞控制（Congestion Control）是防止網路層過載的機制：(1) 慢啟動（Slow Start）：初始 cwnd=1 MSS，每個 RTT 翻倍；(2) 擁塞避免（Congestion Avoidance）：達到 ssthresh 後線性增加；(3) 快速重傳（Fast Retransmit）：收到 3 個重複 ACK，立即重傳，不等 Timeout；(4) CUBIC（Linux 預設）：在慢啟動之後使用三次方函數控制 cwnd 增長，公平性好。\nBBR（Google 2016）：基於頻寬探測和延遲估計，不依賴丟包觸發降速，適合高頻寬長距離鏈路（大洲際連線），Google 用於其 CDN 骨幹網。',
      },
      {
        title: 'TCP TIME_WAIT 大量積累問題',
        text: 'TIME_WAIT 狀態由主動關閉方維持 2MSL（通常 60-120 秒）。在高並發服務中，若服務器作為 HTTP Client 頻繁建立短連接（如微服務間 HTTP 呼叫），大量 TIME_WAIT 會耗盡埠資源（`/proc/sys/net/ipv4/ip_local_port_range` 默認 32768-60999，約 2.8 萬個可用埠）。\n解法：(1) 啟用 HTTP Keep-Alive（長連線），復用 TCP 連線，大幅減少連線建立/關閉次數；(2) `net.ipv4.tcp_tw_reuse=1`：允許 TIME_WAIT 的 socket 被新連線重用（需要 timestamp 支援）；(3) 增大本地埠範圍：`net.ipv4.ip_local_port_range = 1024 65535`；(4) 使用 Connection Pool（資料庫連接池、gRPC Channel Pool）複用連線。',
      },
    ],
    scenarios: [
      {
        type: 'practice',
        title: '服務間呼叫頻繁超時：TCP 層面的排查',
        text: '現象：A 服務呼叫 B 服務偶發超時（1% 請求 > 3s）。排查：(1) `ss -s` 查看 TCP 連線狀態分布，是否有大量 TIME_WAIT 或 CLOSE_WAIT；(2) `tcpdump` 抓包確認是否有 TCP 重傳（RST 或重複 ACK）；(3) 確認 TCP 連線池配置——若每次請求都建立新連線，SYN 耗時 + 連線建立時間可能導致超時；(4) 查看 `netstat -s | grep retransmit` 確認丟包率；(5) MTU 問題：jumbo frame（9000 bytes）在跨 VLAN 時可能被丟棄，`ping -M do -s 8972 host` 測試 PMTUD。',
      },
    ],
    interview: [
      {
        question: '為什麼 TCP 握手需要隨機化 ISN（初始序列號）？',
        answer: '若 ISN 從固定值（如 0）開始，攻擊者可以預測序列號，從而注入偽造的 TCP Segment（TCP Sequence Prediction Attack）。隨機化 ISN 讓攻擊者無法猜測當前連線的合法序列號範圍。此外，隨機 ISN 還能避免與舊連線（相同四元組）的殘留封包混淆——如果前一個連線的延遲封包到達，由於序列號不同，新連線會正確忽略它。ISN 的生成通常結合時鐘和偽隨機函數，每 4μs 自增 1（RFC 793），確保在 MSL 內不會重複。',
        keywords: ['ISN', 'Sequence Number', 'TCP Injection', '安全', 'MSL'],
      },
      {
        question: '解釋 TCP 的 SYN Flood 攻擊及解決方案？',
        answer: 'SYN Flood 利用 TCP 三次握手：攻擊者發送大量 SYN 卻不回最後一個 ACK，導致 Server 的半連線佇列 (SYN Queue) 被佔滿，無法處理正常請求。解決方案：(1) SYN Cookies：Server 在收到 SYN 時不立即分配資源，而是根據五元組計算一個「Cookie」放入隨機序號回傳，直到收到正確的 ACK 才分配空間。(2) 增加 SYN Queue 大小；(3) 減少 SYN-ACK 重傳次數；(4) 使用防火牆過濾惡意 IP。',
        keywords: ['SYN Flood', 'SYN Cookies', 'Queue Management', 'Security'],
      },
      {
        question: 'TCP vs UDP：本質差異與應用場景？',
        answer: 'TCP 是面向連線、可靠（重傳、序列號、流量/擁塞控制）、基於位元組流 (Byte Stream) 的協定。適用於：HTTP, FTP, Database。UDP 是無連線、不可靠（盡力而為）、基於資料報 (Datagram) 的協定。適用於：DNS, Video Streaming, Gaming, QUIC (HTTP/3)。核心差別在於「速度」與「保證」的取捨。',
        keywords: ['Connection-oriented', 'Reliability', 'Throughput', 'Low Latency'],
      },
      {
        question: '什麼是 TCP 粘包/斷包？如何解決？',
        answer: 'TCP 是「流」式傳輸，沒有明確的資料邊界。發送端發了兩個封包，接收端可能一次 `read()` 讀到兩個（粘包）或只讀到半個（斷包）。這是應用層的問題，與 TCP 無關。解法：(1) 固定長度：每條消息 100 bytes；(2) 包體長度：Header 存放消息長度，Data 隨後；(3) 特殊分隔符：使用 `\r\n` 或特定字節（如 Redis、HTTP）。',
        keywords: ['Byte Stream', 'Delimiters', 'Header-Payload', 'Serialization'],
      },
    ],
  },

  'http-evolution': {
    concepts: [
      {
        title: 'HTTP/1.0 → 1.1 → 2 → 3 演進脈絡',
        text: 'HTTP/1.0：每次請求獨立的 TCP 連線，高頻請求造成大量 TCP 建立/關閉開銷。\nHTTP/1.1（1997）：持久連線（Keep-Alive）複用 TCP，Pipeline（同一連線發多個請求），但存在隊頭阻塞（Head-of-Line Blocking）——後面的請求必須等前面的回應，因為 HTTP/1.1 回應是有序的。\nHTTP/2（2015）：多工（Multiplexing）——單一 TCP 連線上以幀（Frame）為單位並行傳輸多個 Stream，徹底解決 HTTP 層的隊頭阻塞。Header 壓縮（HPACK）減少重複 header 的傳輸量。但 HTTP/2 的隊頭阻塞問題下移到 TCP 層——一個 TCP 封包丟失，所有 Stream 都要等重傳。\nHTTP/3（2022）：換用 QUIC（UDP 上的可靠傳輸協定），每個 Stream 獨立的可靠傳輸，一個 Stream 丟包不影響其他 Stream。QUIC 內建 TLS 1.3，連線建立從 2-RTT 降為 1-RTT，支援 0-RTT 重連（在已知伺服器的情況下）。',
      },
      {
        title: 'HTTPS 與 TLS 1.3 的效能提升',
        text: 'TLS 1.2 握手需要 2-RTT（Client Hello → Server Hello + Certificate → Client Key Exchange → Finished），加上 TCP 握手共 3-RTT，延遲顯著。TLS 1.3 最佳化：(1) 握手從 2-RTT 降為 1-RTT（Client 在第一個訊息就發送 Key Share，Server 立即回應加密資料）；(2) 0-RTT 恢復（Session Resumption）：重連時 Client 直接發送加密資料，無需等待 Server 確認，但存在 Replay Attack 風險，需謹慎使用於非冪等請求。TLS 1.3 廢除了所有不安全的演算法（RSA 金鑰交換、RC4、SHA-1），強制使用前向保密（Forward Secrecy）的 ECDHE。',
      },
      {
        title: 'HTTP 快取機制：強快取 vs 協商快取',
        text: '強快取（Strong Cache）：在有效期內，瀏覽器不發任何請求，直接使用快取。由 `Cache-Control: max-age=3600` 或 `Expires` 頭控制。狀態碼 200（from cache）。\n協商快取（Revalidation）：強快取過期後，瀏覽器攜帶快取標記向伺服器確認資源是否更新。使用 `Last-Modified / If-Modified-Since`（時間精度秒級）或 `ETag / If-None-Match`（資源內容的雜湊，精度更高）。若未更新，Server 返回 304 Not Modified（不傳遞 Body，只傳 Header），瀏覽器繼續使用快取。\n實務建議：靜態資源（JS/CSS）加 Hash 到檔名，設定 `Cache-Control: max-age=31536000`（永久強快取）；HTML 設定 `Cache-Control: no-cache`（每次協商快取，確保及時更新）。',
      },
    ],
    scenarios: [
      {
        type: 'design',
        title: 'API Gateway 的 HTTP/2 to HTTP/1.1 降級策略',
        text: '場景：API Gateway 對外支援 HTTP/2，但後端服務可能只支援 HTTP/1.1。策略：(1) Gateway 與 Client 使用 HTTP/2（多工，減少連線數）；(2) Gateway 與後端使用 HTTP/1.1 長連線池（Keep-Alive），控制連線池大小避免 File Descriptor 耗盡；(3) 若後端支援 HTTP/2（如 gRPC 服務），直接透傳 HTTP/2 提升效能。這是 nginx、Envoy 的預設代理策略。',
      },
    ],
    interview: [
      {
        question: 'HTTP/2 多工（Multiplexing）和 HTTP/1.1 Pipeline 的區別？',
        answer: 'Pipeline 雖然允許一次發送多個請求，但回應必須按請求順序返回（Server 端串行處理），前一個慢請求阻塞後面所有請求，仍有隊頭阻塞。HTTP/2 Multiplexing 每個請求是一個獨立的 Stream（帶有 Stream ID），幀可以交錯傳輸，Server 可以亂序回應，Client 根據 Stream ID 組裝回應，完全消除了 HTTP 層的隊頭阻塞。本質差別：Pipeline 是「串行提交、串行回應」；Multiplexing 是「並行提交、並行回應、亂序返回」。',
        keywords: ['Stream', 'Frame', 'HOL Blocking', 'HPACK', 'HTTP/3', 'QUIC'],
      },
      {
        question: '解釋 HTTP 狀態碼：301, 302, 304, 401, 403, 502, 504？',
        answer: '301：永久重定向（瀏覽器會快取路徑變更）；302：暫時重定向；304：資源未更新（協商快取命中）；401：未經授權（需登入）；403：禁止訪問（權限不足）；502：Bad Gateway（網關找不到後端或後端掛了）；504：Gateway Timeout（後端響應超時）。',
        keywords: ['Status Codes', 'Redirection', 'Cache', 'Gateway'],
      },
      {
        question: '什麼是 Cookie, Session, Token (JWT)？選型依據？',
        answer: 'Cookie：存在瀏覽器，KV 存儲。Session：存在 Server，Server 傳 ID 給 Cookie，適合中心化系統，安全性高但擴展難。JWT：無狀態 Token，內容加密在 Client，Server 用 Key 驗證。適合微服務和分佈式架構。區別在於：Session 有狀態、存 Server；JWT 無狀態、存 Client。',
        keywords: ['Auth', 'JWT', 'Session', 'Stateless'],
      },
    ],
  },

  'dns-cdn': {
    concepts: [
      {
        title: 'DNS 遞迴查詢全流程',
        text: '完整的 DNS 解析過程：(1) 瀏覽器快取（幾秒到幾分鐘）；(2) OS 快取（`/etc/hosts` 及 DNS 快取，通常 TTL 秒數）；(3) 本地 DNS Resolver（ISP 或 8.8.8.8，遞迴解析並快取）；(4) 根域名伺服器（Root Server，.com/.cn 等 TLD 的位址）；(5) TLD 伺服器（.com，返回 example.com 的 NS 記錄）；(6) 權威 DNS 伺服器（example.com，返回最終 IP）。整個查詢通常 20-100ms，快取命中後 < 1ms。\n常見 DNS 記錄：A（IPv4），AAAA（IPv6），CNAME（別名），MX（郵件），TXT（驗證/SPF），NS（名稱伺服器），SRV（服務發現，Kubernetes 使用）。',
      },
      {
        title: 'CDN 原理：邊緣快取與路由最佳化',
        text: 'CDN（Content Delivery Network）透過在全球部署邊緣節點（Edge PoP），讓用戶從地理上最近的節點獲取內容。關鍵技術：(1) Anycast 路由：同一 IP 在多個地方公告，BGP 自動路由到最近節點；(2) 邊緣快取：靜態資源在邊緣節點快取，Cache Hit 時不回源；(3) 動態路由加速：透過在 Backbone 網路上選擇最優路徑，比公共互聯網更快地轉發動態請求。\n快取策略：CDN 根據 `Cache-Control` 頭決定是否快取。常見問題：快取穿透（大量不快取的請求直接打到源站）和快取汙染（錯誤回應被快取）。CDN 主要提供者：Cloudflare、AWS CloudFront、Akamai、Fastly、阿里雲 CDN。',
      },
      {
        title: 'DNS 負載均衡與 GeoDNS',
        text: 'DNS Round Robin：同一 A 記錄對應多個 IP，DNS 輪流返回不同 IP 實現粗粒度負載均衡。缺點：DNS 快取導致 IP 黏連（某節點宕機後，仍有 TTL 內的請求打到舊 IP）；缺乏健康檢查。\nGeoDNS（地理感知 DNS）：根據查詢來源 IP 的地理位置，返回不同的 A 記錄（最近的區域叢集 IP）。AWS Route 53 的 Geolocation Routing、Latency-Based Routing 就是此類功能。結合低 TTL（30-60 秒），可以實現快速 Failover：當一個區域宕機時，修改 DNS 記錄，30-60 秒後全球流量切換到備用區域。',
      },
    ],
    scenarios: [
      {
        type: 'design',
        title: 'CDN 快取策略設計：避免快取汙染和快取穿透',
        text: '問題：靜態資源快取策略設計。方案：(1) 靜態資源 URL 加 Hash（`main.a3f8c2.js`），內容變更時 URL 自然變更，避免快取更新問題；`Cache-Control: max-age=31536000, immutable`；(2) API 回應預設 `Cache-Control: no-store`，避免敏感資料被 CDN 快取；(3) 針對個性化 API（如 `/user/profile`），在 URL 中加用戶 ID 或在回應設定 `Vary: Authorization`，CDN 按不同 Token 快取不同版本；(4) CDN 快取汙染防護：設定 `ignore-query-strings` 白名單，防止攻擊者用隨機 query string 繞過快取打穿源站。',
      },
    ],
    interview: [
      {
        question: '為什麼降低 DNS TTL 可以加快 Failover，但也有代價？',
        answer: 'TTL 決定了 DNS 快取的有效期。TTL = 30s 時，故障發生後最多 30s 所有客戶端都能解析到新 IP；TTL = 3600s 時，需要等最多 1 小時。代價：(1) DNS 查詢量增加——TTL 越短，快取命中率越低，DNS 伺服器壓力越大；(2) 延遲增加——更多請求需要實際查詢 DNS；(3) 部分遞迴 DNS 不尊重 TTL（可能有最小 TTL 限制）。最佳實踐：平時設 TTL=300s（5 分鐘），在計劃中的 Failover 前幾小時降低到 30-60s，完成後再升回 300s。',
        keywords: ['TTL', 'DNS Failover', 'GeoDNS', 'Round Robin', 'Anycast'],
      },
      {
        question: '什麼是 DNS 劫持與 HTTP 劫持？如何防範？',
        answer: 'DNS 劫持：修改 DNS 解析將你導向假網站。解法：使用 HTTPS, DNS over HTTPS (DoH)。HTTP 劫持：運營商在網頁中插入廣告。解法：全站 HTTPS，因為 HTTPS 加密了內容，中間人無法解析並修改 HTML 內容。',
        keywords: ['DNS Hijacking', 'HTTPS', 'DoH', 'ISP'],
      },
      {
        question: 'CDN 的回源 (Back-to-Origin) 是什麼？如何減少回源次數？',
        answer: '當 CDN 節點找不到快取或快取過期時，向原本的 Server 請求數據稱為回源。減少方式：(1) 拉長 Cache-Control max-age；(2) 使用快取預熱 (Warm-up)；(3) 設置多級快取；(4) 資源去版本化 (使用 Hash 檔名)。',
        keywords: ['Origin Server', 'Cache Hit Ratio', 'Purge', 'Preload'],
      },
    ],
  },

  'api-protocols': {
    concepts: [
      {
        title: 'REST vs gRPC vs GraphQL：深度對比',
        text: 'REST（Representational State Transfer）：基於 HTTP/1.1 + JSON，通用性強，可讀性好，但 Over-fetching（返回多餘欄位）和 Under-fetching（需要多次請求）問題明顯；缺乏嚴格的 Schema 契約（靠 OpenAPI 補充）。\ngRPC：基於 HTTP/2 + Protobuf，高效（Protobuf 比 JSON 小 3-10 倍）；強型別 Schema（.proto 文件）；支援四種通訊模式（一元、Server/Client/雙向 Streaming）；適合微服務間內部通訊。缺點：瀏覽器直接呼叫需要 gRPC-Web 代理，除錯不如 REST 直觀。\nGraphQL：客戶端精確指定需要的欄位，解決 Over/Under-fetching；單一端點。適合數據需求多變的前端（如 BFF 層）。缺點：複雜查詢可能引發 N+1 問題（DataLoader 可緩解），快取比 REST 複雜（無法使用 HTTP Cache-Control，需應用層快取）。',
      },
      {
        title: 'WebSocket 與 Server-Sent Events（SSE）',
        text: 'WebSocket：全雙工協定，Client 和 Server 都可以隨時推送訊息。建立流程：HTTP Upgrade 握手（`Connection: Upgrade, Upgrade: websocket, Sec-WebSocket-Key`），握手後升級為 WebSocket 協定，複用同一個 TCP 連線。適合：即時聊天、協作編輯、即時遊戲狀態同步。\nSSE（Server-Sent Events）：單向推送（Server → Client），基於普通 HTTP 長連線（`Content-Type: text/event-stream`），連線斷開後 Browser 自動重連（`Last-Event-ID` 斷點續傳）。優點：比 WebSocket 簡單，可利用 HTTP/2 多工，與 CDN/Proxy 相容性好。適合：通知推送、日誌串流、進度顯示。\n選型建議：需要雙向通訊用 WebSocket；只需 Server→Client 推送用 SSE；批次資料用 gRPC Streaming。',
      },
      {
        title: 'API 版本控制策略',
        text: '三種主流版本控制方式：(1) URL Path 版本（`/v1/users`）：最直覺，可在 API Gateway 和 Reverse Proxy 層輕鬆路由，缺點是 URL 不「純粹」；(2) Header 版本（`X-API-Version: 2`）：URL 乾淨，但客戶端必須額外設定 Header，對測試不友好；(3) Query Parameter（`/users?version=2`）：較少使用。\n實務建議：對外公開 API 用 URL Path（`/v1/`, `/v2/`），對內微服務使用 gRPC 的 Protobuf 可向後相容的演化（保留欄位號，新增欄位不修改舊欄位）。版本廢棄策略：設定 Sunset 日期（`Sunset: Sat, 01 Jan 2026 00:00:00 GMT` Header），在舊版本返回 Warning 警告客戶端遷移。',
      },
    ],
    scenarios: [
      {
        type: 'design',
        title: 'BFF（Backend for Frontend）模式設計',
        text: '問題：移動端需要的資料格式和 Web 端差異很大，通用 API 造成大量 Over-fetching。BFF 模式：為每個前端客戶端（Web BFF、Mobile BFF）建立一個專用的後端聚合層，對下呼叫微服務，對上提供客戶端最佳化的 API。BFF 可以並行呼叫多個微服務（gRPC 或 REST）並聚合結果，減少前端的請求次數。GraphQL 常作為 BFF 的實現技術，讓前端自己聲明需要的欄位。注意：BFF 應保持輕量（只做聚合和格式轉換），業務邏輯仍在微服務中。',
      },
    ],
    interview: [
      {
        question: 'gRPC 為何比 REST+JSON 效能高？具體差距有多少？',
        answer: '三個層面：(1) 序列化：Protobuf 使用 Tag-Length-Value 二進位格式，比 JSON 體積小 3-10 倍，序列化/反序列化速度快 5-10 倍；(2) 傳輸協定：gRPC 基於 HTTP/2，一個連線多路復用，Header 壓縮（HPACK），避免了 HTTP/1.1 的連線建立開銷；(3) 連線重用：gRPC Channel 長期複用，不像 REST 可能每次請求建立新連線。實測：在微服務場景，相比 REST+JSON，gRPC 通常能提升 2-5 倍吞吐量，P99 延遲降低 30-50%。代價：可讀性差、除錯需要 grpc_cli 或 BloomRPC 工具。',
        keywords: ['Protobuf', 'HTTP/2', 'Multiplexing', 'HPACK', 'IDL', 'Channel'],
      },
      {
        question: 'GraphQL 解決了什麼問題？它的缺點是什麼？',
        answer: '解決 Over-fetching（拿太多數據）和 Under-fetching（接口不夠要打多次請求）。前端可以定義精確的 Query 結構。缺點：(1) N+1 查詢（需用 DataLoader 批量處理）；(2) 無法利用 HTTP 緩存（POST 發送，且 Endpoint 只有一個）；(3) 權限控制較複雜。',
        keywords: ['Schema', 'Query/Mutation', 'DataLoader', 'Overfetching'],
      },
      {
        question: '解釋 Webhook 與 Long Polling 的差別？',
        answer: 'Long Polling：Client 打請求給 Server，Server 等到有數據才回傳（或超時才回傳）。雖然比 Polling 好，但仍佔用 Connection。Webhook：反向 API，Server 有數據後打 Client 的 Callback URL。Server→Client 主動推送。適合第三方通知（如 GitHub, Stripe）。',
        keywords: ['Real-time', 'Callback', 'Server-Push'],
      },
    ],
  },

  'network-security': {
    concepts: [
      {
        title: 'TLS 1.3 握手流程詳解',
        text: 'TLS 1.3 握手（1-RTT）：(1) Client Hello：Client 發送支援的 Cipher Suite、TLS 版本、`key_share`（ECDHE 的公鑰）；(2) Server Hello + Certificate + Finished：Server 選擇 Cipher Suite，發送自己的 `key_share` 公鑰、數位憑證，並使用協商好的 Session Key 加密 Finished 訊息；雙方立即使用 ECDHE 計算出 Shared Secret，派生出對稱 Session Key；(3) Client 驗證憑證（Certificate Chain → 根 CA 驗證），發送 Finished，並立即開始傳送加密應用資料。\n前向保密（Forward Secrecy）：TLS 1.3 強制使用 ECDHE 金鑰交換，Session Key 是臨時生成的，即使 Server 私鑰洩漏，也無法解密歷史流量（因為 Shared Secret 已銷毀）。TLS 1.2 的 RSA 金鑰交換無此保障。',
      },
      {
        title: '常見網路攻擊：DDoS、MITM、DNS 劫持',
        text: 'DDoS（分散式拒絕服務）：攻擊者控制大量殭屍主機（Botnet）向目標發送海量請求，耗盡頻寬或 CPU。SYN Flood：傳送大量 SYN 但不完成握手，耗盡 Server 的半連線佇列（`net.ipv4.tcp_max_syn_backlog`）。防護：SYN Cookies、流量清洗（BGP Blackhole Routing）、CDN 吸收。\nMITM（中間人攻擊）：攻擊者攔截通訊並竄改。HTTPS 是最根本的防護——憑證 Pin（Certificate Pinning）防止偽造憑證；HSTS（HTTP Strict Transport Security）強制瀏覽器使用 HTTPS。\nDNS 劫持：攻擊者污染 DNS 快取或篡改 DNS 解析，將域名指向惡意 IP。防護：DNSSEC（對 DNS 記錄加密簽名）；DoT（DNS over TLS）；DoH（DNS over HTTPS，防止 ISP 竊聽 DNS 查詢）。',
      },
    ],
    scenarios: [
      {
        type: 'design',
        title: '設計一個零信任網路（Zero Trust Architecture）',
        text: '傳統邊界安全假設內網可信，Zero Trust 原則：Never Trust, Always Verify。核心元件：(1) 身份認證：每個請求都需要強身份驗證（mTLS 雙向憑證 + JWT）；(2) 最小許可權：服務只能存取被明確授權的資源（類似 Kubernetes RBAC）；(3) 微分段：使用 Service Mesh（Istio/Linkerd）在每個服務間強制執行 mTLS 和授權策略；(4) 持續監控：所有流量記錄和分析，異常行為即時告警。實施路徑：從最高風險的服務開始部署 mTLS，逐步擴展。',
      },
    ],
    interview: [
      {
        question: '為什麼 HTTPS 不能防止所有的中間人攻擊？',
        answer: '標準 HTTPS 依賴 CA（Certificate Authority）體系：瀏覽器信任的 CA 頒發的憑證都被認為有效。攻擊面：(1) CA 被入侵（DigiNotar 事件）——解決方案：CT Log（Certificate Transparency），所有頒發的憑證公開記錄，可被監控；(2) 社會工程學攻擊讓用戶安裝惡意根 CA——解決方案：憑證固定（Certificate Pinning），Client 內建了 Server 的 Public Key，拒絕其他憑證；(3) SSL Stripping——攻擊者讓 Client 使用 HTTP——解決方案：HSTS Preload，瀏覽器內建了強制 HTTPS 的域名列表；(4) 用戶忽略憑證錯誤警告。',
        keywords: ['CA', 'Certificate Transparency', 'HSTS', 'Certificate Pinning', 'mTLS'],
      },
      {
        question: '解釋 CSRF 攻擊與 XSS 攻擊的差異與防範？',
        answer: 'XSS（跨站腳本）：攻擊者在網頁注入 JS (如 `<script>alert(1)</script>`)。防護：輸入過濾、輸出轉義、CSP。CSRF（跨站請求偽造）：利用 Cookie 自動帶入的特性，誘導你在 A 站操作 B 站（如匯款）。防護：CSRF Token、SameSite=Strict/Lax。區別：XSS 盜取信息；CSRF 代替你發送請求。',
        keywords: ['XSS', 'CSRF', 'CSP', 'SameSite'],
      },
      {
        question: '什麼是 mTLS (Mutual TLS)？在使用場景？',
        answer: '雙向 TLS，Client 也要提供憑證證明身份。主要用於：微服務內部通訊、Zero Trust 網絡、高安全性金融 API（如 Open Banking）。',
        keywords: ['mTLS', 'Zero Trust', 'Certificates'],
      },
    ],
  },

  'load-balancing-net': {
    concepts: [
      {
        title: 'L4 vs L7 負載均衡的本質區別',
        text: 'L4（傳輸層）負載均衡：基於 IP + Port 分發流量，不看 HTTP 內容。速度最快（封包轉發，無需解析應用層協定）。實現：AWS NLB、LVS（Linux Virtual Server）、HAProxy TCP 模式。適合：TCP/UDP 高效能轉發，如資料庫代理、遊戲 UDP 流量。\nL7（應用層）負載均衡：解析 HTTP/HTTPS 內容，可根據 URL 路徑、Host Header、Cookie、JWT Payload 路由請求。功能豐富：SSL Termination、請求改寫、速率限制、健康檢查（HTTP 健康端點）、A/B 測試。實現：nginx、HAProxy HTTP 模式、AWS ALB、Envoy。\n典型架構：前端使用 L4（DNS → LB VIP），LB 後面是一組 L7 Proxy（nginx/Envoy），L7 再分發到後端服務。L4 提供高效能 + 高可用（VIP Failover），L7 提供靈活路由。',
      },
      {
        title: '負載均衡演算法：輪轉、加權、一致性雜湊',
        text: 'Round Robin：依序分發，實現最簡單，但不考慮後端負載差異。\n加權輪轉（Weighted Round Robin）：為效能更強的後端配置更高權重，常用於異構伺服器群。\nLeast Connections：將新請求分發給當前連線數最少的後端，適合請求處理時間差異大的場景（避免慢後端積壓）。\n一致性雜湊（Consistent Hashing）：對請求的某個屬性（如 Client IP 或 Session ID）計算雜湊，固定路由到同一後端，適合需要 Session Affinity 或 Local Cache 的場景（如 WebSocket 長連線）。虛擬節點解決雜湊環的節點分布不均問題。\n隨機（Random）：均衡效果類似輪轉，但在高並發時減少鎖競爭，適合大規模橫向擴展場景（Netflix Eureka 的預設策略）。',
      },
      {
        title: '健康檢查與熔斷機制',
        text: '健康檢查類型：(1) 被動（Passive）：透過監控實際請求的錯誤率/超時率，達到閾值後標記不健康；無額外開銷，但反應較慢；(2) 主動（Active）：LB 定期發送 Heartbeat（如 GET /health），立即發現故障。\n熔斷器（Circuit Breaker）：Hystrix/Resilience4j 的核心模式。三個狀態：Closed（正常通訊）→ Open（停止傳送請求，立即失敗）→ Half-Open（試探性傳送少量請求）。觸發條件：在滑動視窗內，錯誤率超過閾值（如 50% 錯誤率）或超過慢呼叫比例。熔斷器保護：防止 Cascading Failure（級聯失敗），讓故障服務有時間恢復，避免整個呼叫鏈雪崩。',
      },
    ],
    scenarios: [
      {
        type: 'design',
        title: '設計全球多區域主動-主動（Active-Active）架構',
        text: '目標：在亞洲和美洲各部署一套叢集，用戶就近接入，相互備援。關鍵設計：(1) Global Load Balancing：Anycast IP + GeoDNS，用戶自動路由到最近區域；(2) 資料同步：跨區域資料同步是最大挑戰，選擇最終一致性（如 DynamoDB Global Tables 基於 CRDT），接受短暫的區域間資料不一致；(3) 衝突解決：若兩個區域同時更新同一條記錄，需要 Last-Write-Wins 或業務層衝突解決；(4) Failover：某個區域全宕時，修改 GeoDNS，流量自動切到另一個區域，但需預留額外容量。',
      },
    ],
    interview: [
      {
        question: '一致性雜湊解決了什麼問題？虛擬節點的作用是什麼？',
        answer: '傳統取模雜湊（`hash(key) % N`）的問題：節點增減時幾乎所有 key 都需要重新映射，引發大規模快取失效和資料遷移。一致性雜湊將節點和 key 都映射到同一個環形空間（0-2³²），key 順時針找到第一個節點。節點增減時只影響相鄰 key（約 1/N 的 key 需要遷移）。虛擬節點：每個物理節點映射為多個虛擬節點（通常 100-200 個），讓節點在環上均勻分布，避免真實節點分布不均導致某節點承擔過多負載（熱點問題）。應用：Redis Cluster（Hash Slot，16384 個虛擬槽）、Cassandra（Vnodes）、Nginx upstream consistent hashing。',
        keywords: ['Hash Ring', 'Virtual Node', 'Cache Invalidation', 'Data Migration', 'Hot Spot'],
      },
      {
        question: '什麼是負載均衡的「四層」與「七層」？',
        answer: '四層（L4）：基於 IP+Port 轉發（如 LVS）。不解析 HTTP 內容，快且適合高頻寬。七層（L7）：解析 HTTP 內容（如 Nginx）。可進行 URL 路由、Cookie 粘性、WAF 檢查。適合靈活業務逻辑。',
        keywords: ['L4 LB', 'L7 LB', 'Proxy', 'Application Layer'],
      },
      {
        question: '解釋「熔斷器」與「限流」的區別？',
        answer: '限流（Rate Limiting）：保護自己，不被過多請求衝垮（Token Bucket/Leaky Bucket）。熔斷（Circuit Breaker）：保護下游，如果下游服務掛了，主動停掉呼叫，避免資源被耗盡。',
        keywords: ['Resilience', 'Hystrix', 'Rate Limiting', 'Circuit Breaker'],
      },
    ],
  },
}
