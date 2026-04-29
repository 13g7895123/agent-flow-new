# Agent Flow Harness 功能說明

這個 `frontend` 專案是將原本 `source/Agent Flow Harness.html` 與多個 JSX prototype 搬到 Bun + Next.js App Router 後的前端版本。它是一個用來觀察、管理與審核 Agent 工作流程的儀表板，支援程式碼自動化與創意生成兩種模式。

## 技術與專案結構

- 使用 Bun 作為套件管理與開發指令執行工具。
- 使用 Next.js App Router，首頁位於 `app/page.js`，主要互動介面由 `components/app-shell.jsx` 掛載。
- 原本 `source` 裡的資料與畫面已拆成 `lib/afh-data.js`、`components/afh-ui.jsx`、`components/afh-dashboard.jsx`、`components/afh-runs.jsx`、`components/afh-creative.jsx`、`components/afh-pages.jsx`。
- 多語系字典與 provider 集中在 `components/i18n.jsx`，目前支援繁體中文與英文。
- 全域色彩、動畫、字體與 scrollbar 樣式集中在 `app/globals.css`。

## 核心功能

- Dashboard：呈現今日 Code Runs、Creative Runs、待審核素材、需人工介入流程、Token 用量與預估成本。
- Active Runs：顯示執行中、等待審核、已升級需介入的流程卡片，包含進度、修復次數、素材待審狀態與提醒。
- Runs：提供依狀態、模式與專案篩選的執行紀錄列表，可進入單筆 run 詳細頁。
- Code Mode 詳細頁：顯示步驟 timeline、輸入輸出、context token breakdown、測試結果、失敗原因展開，以及程式碼 diff split/unified 檢視。
- Escalation 介入：當修復次數用盡時，提供輸入 hint、Resume 與 Abort 的人工介入操作介面。
- Creative Mode 詳細頁：顯示腳本、風格參考、圖片生成、動態生成、合成與最終審核等流程階段。
- 素材審核：提供 asset gallery、lightbox、版本切換、Approve、Reject、Retry、快速回饋與批次通過操作。
- Agent Connectors：管理 Gemini、Claude、Runway、Midjourney 等外部服務狀態，顯示延遲、quota、rate limit、API key 與 model 設定欄位。
- Roles & Prompts：可選擇不同角色，編輯 global、project、task 三層 prompt，並顯示估算 token 與 stack preview。
- Skills：可依 Code / Creative 模式篩選技能，並切換技能啟用狀態。
- Projects：列出 code 與 creative 專案，可查看或編輯 stack、active role、test command，也提供新專案模式選擇表單。
- Insights：呈現成功率、審核率、token、成本、first-pass rate、平均修復次數與專案用量 breakdown。

## 互動與使用體驗

- 左側 sidebar 可收合，設定會保存到瀏覽器 `localStorage`。
- 右側主內容區採滿版寬度呈現，適合大型表格、timeline 與設定面板瀏覽。
- 支援繁體中文 / English 切換，預設語言為繁體中文，語言偏好會保存到 `localStorage`。
- 支援淺色 / 深色主題切換，預設主題為淺色，主題偏好會保存到 `localStorage`。
- 支援 command palette，可用 `Cmd/Ctrl + K` 搜尋頁面、runs 與 projects。
- 多數卡片、表格列、審核面板與設定區塊都有 hover、展開、篩選或狀態切換互動。

## 開發指令

- 安裝依賴：`bun install`
- 開發模式：`bun run dev`
- 指定目前啟用埠：`bun run dev -- -H 0.0.0.0 -p 3002`
- 產生正式 build：`bun run build`
- 啟動正式模式：`bun run start`
