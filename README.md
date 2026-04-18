# CS_CORE.EXE - Computer Science 核心知識學習平台

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg)](https://vitejs.dev/)
[![Style](https://img.shields.io/badge/Style-Cyberpunk-orange.svg)](https://github.com/topics/cyberpunk)

這是一個專為核心電腦科學知識設計的互動式學習平台。採用 **Cyberpunk (賽博龐克)** 風格的儀表板設計，旨在提供一個沉浸式、數據導向的現代化學習體驗。

## 🌟 特色

- **賽博龐克視覺設計**：深色底色、霓虹發光字體與硬朗的幾何佈局。
- **4 大知識領域**：
  - **OS_AND_CONCURRENCY** (作業系統與並發)
  - **NETWORKING_INTERNALS** (網路原理)
  - **DATABASE_STRUCTURES** (資料庫內核)
  - **ALGORITHMS_SYSTEMS** (演算法與系統設計)
- **互動式模擬器**：針對 OS 排程、TCP 三向交握、B+ Tree 搜尋、一致性雜湊等複雜概念提供視覺化模擬。
- **回應式佈局 (Responsive)**：支援行動版與電腦版切換，具備側邊欄導航。
- **多國語系支援**：整合 `react-i18next` 提供繁體中文與其他語言支援。

## 🛠️ 技術棧

- **框架**: [React 19](https://react.dev/)
- **建構工具**: [Vite 8](https://vitejs.dev/)
- **路由**: [React Router 7](https://reactrouter.com/)
- **語系**: [i18next](https://www.i18next.com/)
- **樣式**: 純 CSS (Design Tokens 系統)，整合 Google Fonts (Orbitron, JetBrains Mono, Noto Sans TC)。
- **圖示**: [Lucide React](https://lucide.dev/)

## 📂 專案結構

- `/src/components`: UI 元件 (Navbar, Sidebar, Layout, TopicCard 等)。
- `/src/data`: 主題結構與 28 個 CS 核心主題的詳盡內容。
- `/src/pages`: 儀表板首頁與主題詳細內容頁。
- `/src/styles`: 全域 Cyberpunk 設計變數與樣式庫。
- `/src/hooks`: 自定義 React Hooks (如：主題切換 `useTheme`)。

## 🚀 快速開始

### 安裝依賴
```bash
pnpm install
```

### 開發模式
```bash
pnpm dev
```

### 生產建置
```bash
pnpm build
```

## ⚙️ 設計規範

專案使用 `src/styles/tokens.css` 管理所有視覺變數，包括：
- **霓虹顏色系統**：基於 `--clr-os`, `--clr-networking` 等核心變數。
- **字體棧**：
    - `Orbitron`: UI 標題與裝飾。
    - `JetBrains Mono`: 路徑、程式碼與狀態數據。
    - `Noto Sans TC`: 內文內容。

## 📄 授權協議

本專案採用 [MIT License](LICENSE) 授權。

---
*CS_CORE.EXE: NEURAL INTERFACE v2.0*

