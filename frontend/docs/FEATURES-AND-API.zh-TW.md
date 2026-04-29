# Agent Flow Harness — 功能說明與 API 對照

> 版本：v1.0 · 日期：2026-04-29  
> 本文件說明各頁面的功能與互動，以及每個功能區塊對應後端所需的 API。

---

## 目錄

1. [儀表板（Dashboard）](#1-儀表板dashboard)
2. [執行紀錄列表（Runs List）](#2-執行紀錄列表runs-list)
3. [Code Mode 執行詳細頁](#3-code-mode-執行詳細頁)
4. [Creative Mode 執行詳細頁](#4-creative-mode-執行詳細頁)
5. [素材審核（Asset Review）](#5-素材審核asset-review)
6. [Agent 連接器（Connectors）](#6-agent-連接器connectors)
7. [角色與提示詞（Roles & Prompts）](#7-角色與提示詞roles--prompts)
8. [技能（Skills）](#8-技能skills)
9. [專案（Projects）](#9-專案projects)
10. [洞察（Insights）](#10-洞察insights)
11. [全域功能](#11-全域功能)

---

## 1. 儀表板（Dashboard）

### 功能描述

儀表板是進入系統的主要畫面，提供當日運作狀況的一覽式彙整，並顯示目前仍在執行中的 Agent 流程。

### 功能清單

| 區塊 | 說明 |
|------|------|
| **統計卡片** | 顯示今日 Code Runs、Creative Runs、待審核素材數、需人工介入數、Token 用量與預估成本 |
| **進行中流程（Active Runs）** | 卡片式呈現目前 `running`、`waiting_review`、`escalated` 的流程，含進度條、修復次數、素材待審提示 |
| **進行中流程 → 警示橫幅** | waiting_review 顯示「等待審核」提示；escalated 顯示「需人工介入」警示 |
| **專案列表（Projects）** | 顯示各專案今日執行次數與成功率 |
| **連接器狀態（Connectors）** | 以圓點顯示各外部服務連線狀態 |
| **近期執行（Recent Runs）** | 表格列出最新幾筆執行，可點擊進入詳細頁 |
| **快速導覽** | 卡片點擊直接跳至該 Run 的詳細頁 |

### 所需 API

| 功能 | Method | Endpoint |
|------|--------|----------|
| 今日摘要統計 | `GET` | `/api/dashboard/summary` |
| 進行中流程列表 | `GET` | `/api/runs?status=running,waiting_review,escalated` |
| 近期執行列表 | `GET` | `/api/runs?limit=10&sort=-startedAt` |
| 各專案今日統計 | `GET` | `/api/projects?include=stats` |
| 連接器狀態快覽 | `GET` | `/api/connectors?fields=id,name,status,latencyAvg` |

---

## 2. 執行紀錄列表（Runs List）

### 功能描述

列出所有 Agent 執行紀錄，支援多維度篩選，可點入單筆進行詳細檢視。

### 功能清單

| 區塊 | 說明 |
|------|------|
| **狀態篩選** | 全部 / running / waiting_review / success / failed / escalated |
| **模式篩選** | 全部 / Code / Creative |
| **專案篩選** | 下拉選擇個別專案 |
| **執行列表** | 顯示 Run ID、模式、任務描述、專案、狀態、耗時、用量（Token 或費用）、修復次數 / 素材數 |
| **點擊進入詳細頁** | Code Mode → Code 詳細頁；Creative Mode → Creative 詳細頁 |

### 所需 API

| 功能 | Method | Endpoint |
|------|--------|----------|
| 取得執行列表（含篩選） | `GET` | `/api/runs` |
| 參數：狀態篩選 | — | `?status=running` |
| 參數：模式篩選 | — | `?mode=code` |
| 參數：專案篩選 | — | `?project=commerce-api` |
| 參數：排序 | — | `&sort=-startedAt` |
| 取得單筆執行 | `GET` | `/api/runs/:runId` |

---

## 3. Code Mode 執行詳細頁

### 功能描述

顯示 Code Mode 自動化流程的完整執行過程，包含每個步驟的輸入輸出、程式碼差異、測試結果、Context 使用量，以及人工介入操作介面。

### 功能清單

| 區塊 | 說明 |
|------|------|
| **步驟 Timeline** | 左側列出所有步驟（Collect Context → Plan → Generate Code → Run Tests → Fix Attempt → Commit），顯示狀態與耗時 |
| **步驟詳細** | 右側顯示選定步驟的輸入、輸出、Token 用量 |
| **程式碼差異（Code Diff）** | split / unified 兩種模式，顯示 before / after，並高亮新增 / 刪除行 |
| **測試結果（Test Panel）** | 顯示通過 / 失敗的測試，可展開失敗項目看錯誤類型（TimeoutError、TypeError、AssertionError）與完整 stack trace |
| **Context 分析** | 視覺化呈現各來源檔案的 token 占比，顯示 context window 使用率 |
| **人工介入橫幅（Escalation Banner）** | 當狀態為 `escalated` 時顯示，可輸入 hint 並送出 Resume 或 Abort 指令 |

### 所需 API

| 功能 | Method | Endpoint |
|------|--------|----------|
| 取得 Run 基本資料 | `GET` | `/api/runs/:runId` |
| 取得 Run 步驟列表 | `GET` | `/api/runs/:runId/steps` |
| 取得步驟詳細（含 diff、tests） | `GET` | `/api/runs/:runId/steps/:stepId` |
| 送出人工介入 hint 並繼續 | `POST` | `/api/runs/:runId/resume` |
| 中止執行 | `POST` | `/api/runs/:runId/abort` |

---

## 4. Creative Mode 執行詳細頁

### 功能描述

顯示 Creative Mode 生成式 AI 流程的執行過程，包含腳本生成、風格參考分析、圖片生成、影片生成等各步驟，並整合素材圖庫與審核面板。

### 功能清單

| 區塊 | 說明 |
|------|------|
| **步驟 Timeline** | 左側列出腳本生成 → 風格參考 → 場景圖片生成 → 動態生成 → 合成 → 最終輸出，標示所用 Connector |
| **等待審核橫幅** | 狀態為 `waiting_review` 時，顯示素材數量與「流程已暫停，等待審核」提示 |
| **素材圖庫（Asset Gallery）** | 網格式展示各場景所有版本的生成素材，可點擊進入 lightbox 大圖瀏覽 |
| **Lightbox** | 全螢幕瀏覽單張素材，含 Approve / Reject 操作按鈕 |
| **版本切換** | 同一場景有多個版本時可切換 |
| **審核面板（Review Panel）** | 針對 pending 素材一件一件進行通過、拒絕、重試操作，拒絕時可輸入回饋文字 |
| **快速回饋標籤** | 「風格不對」「構圖重來」等預設回饋可快速插入 |
| **批次通過** | 可一次通過所有 pending 素材 |
| **Connector 狀態微面板** | 顯示此 Run 使用的各 Connector 連線狀況、延遲、Quota |
| **步驟輸入 / 輸出** | 各步驟的 prompt 輸入與生成輸出文字 |

### 所需 API

| 功能 | Method | Endpoint |
|------|--------|----------|
| 取得 Run 基本資料 | `GET` | `/api/runs/:runId` |
| 取得 Creative Run 步驟 | `GET` | `/api/runs/:runId/steps` |
| 取得步驟素材列表 | `GET` | `/api/runs/:runId/steps/:stepId/assets` |
| 取得單張素材（含版本） | `GET` | `/api/runs/:runId/assets/:assetId` |
| 提交單筆素材審核 | `POST` | `/api/runs/:runId/assets/:assetId/review` |
| 批次提交素材審核 | `POST` | `/api/runs/:runId/assets/batch-review` |
| 重試生成單筆素材 | `POST` | `/api/runs/:runId/assets/:assetId/regenerate` |

---

## 5. 素材審核（Asset Review）

> 素材審核功能同時存在於 Creative 詳細頁的 Review Panel，以及 Dashboard 的素材待審提示。

### 所需 API

| 功能 | Method | Endpoint |
|------|--------|----------|
| 提交審核決定（approve / reject / regenerate） | `POST` | `/api/runs/:runId/assets/:assetId/review` |
| 批次 approve | `POST` | `/api/runs/:runId/assets/batch-review` |

---

## 6. Agent 連接器（Connectors）

### 功能描述

管理系統使用的所有外部 AI 服務連接器，包含 LLM、圖片生成、影片生成、處理器等類型，可進行連線測試、設定更新與 API Key 輪替。

### 功能清單

| 區塊 | 說明 |
|------|------|
| **連接器列表** | 顯示所有 Connector，含連線狀態（已連線 / 速率受限 / 未連線 / 錯誤）、延遲、Quota 使用量 |
| **Quota 長條圖** | 視覺化呈現 `quotaUsed / quotaMax`，超過 80% 轉為警告色 |
| **連線測試** | 點擊「測試」按鈕，模擬呼叫並回傳 ok / fail |
| **展開設定面板** | 顯示 Endpoint、API Key（密碼遮罩）、預設模型、Temperature、Max Tokens 等欄位 |
| **API Key 輪替** | 點擊「輪替」按鈕觸發 key rotation |
| **新增連接器** | 右上角「新增連接器」按鈕 |

### 所需 API

| 功能 | Method | Endpoint |
|------|--------|----------|
| 取得所有連接器 | `GET` | `/api/connectors` |
| 取得單一連接器 | `GET` | `/api/connectors/:connectorId` |
| 測試連線 | `POST` | `/api/connectors/:connectorId/test` |
| 更新連接器設定 | `PATCH` | `/api/connectors/:connectorId` |
| 輪替 API Key | `POST` | `/api/connectors/:connectorId/rotate-key` |
| 新增連接器 | `POST` | `/api/connectors` |
| 刪除連接器 | `DELETE` | `/api/connectors/:connectorId` |

---

## 7. 角色與提示詞（Roles & Prompts）

### 功能描述

管理 Agent 使用的各種角色設定與三層式提示詞（Global → Project → Task），支援即時編輯、token 估算與視覺化 stack 預覽。

### 功能清單

| 區塊 | 說明 |
|------|------|
| **角色列表** | 顯示所有角色（Backend Engineer、Security Engineer、Creative Director 等），含模式標籤與描述 |
| **三層 Prompt 編輯器** | Global / Project / Task 三個 tab，各別顯示 token 估算 |
| **語法高亮** | `{變數}` 以紫色標示，`# 註解` 以灰色標示，關鍵字以青色標示 |
| **Stack 預覽** | 三層堆疊的比例長條，直觀呈現各層 token 占比 |
| **總 Token 估算** | 即時顯示三層合計約用 token 數 |
| **儲存 / 捨棄** | dirty 狀態時啟用按鈕，儲存後顯示「已儲存」確認 |

### 所需 API

| 功能 | Method | Endpoint |
|------|--------|----------|
| 取得所有角色 | `GET` | `/api/roles` |
| 取得單一角色（含 promptLayers） | `GET` | `/api/roles/:roleId` |
| 儲存角色提示詞 | `PATCH` | `/api/roles/:roleId/prompts` |
| 新增角色 | `POST` | `/api/roles` |
| 刪除角色 | `DELETE` | `/api/roles/:roleId` |

---

## 8. 技能（Skills）

### 功能描述

管理 Agent 在執行流程中可呼叫的工具技能，例如 SQL Schema Reader、Test Runner、Security Scanner 等，支援按模式篩選與啟用 / 停用切換。

### 功能清單

| 區塊 | 說明 |
|------|------|
| **模式篩選** | 全部 / Code / Creative |
| **技能列表** | 表格顯示技能名稱、適用模式、適用角色、描述、啟用狀態 |
| **Toggle 開關** | 點擊即時切換啟用 / 停用 |

### 所需 API

| 功能 | Method | Endpoint |
|------|--------|----------|
| 取得所有技能 | `GET` | `/api/skills` |
| 取得單一技能 | `GET` | `/api/skills/:skillId` |
| 切換技能啟用狀態 | `PATCH` | `/api/skills/:skillId` |
| 新增技能 | `POST` | `/api/skills` |
| 刪除技能 | `DELETE` | `/api/skills/:skillId` |

---

## 9. 專案（Projects）

### 功能描述

管理 Agent 自動化流程所屬的專案，每個專案可設定模式、技術堆疊、Active Role 與測試指令（Code Mode）。

### 功能清單

| 區塊 | 說明 |
|------|------|
| **專案列表** | 卡片式顯示專案名稱、模式、技術堆疊 |
| **專案詳細** | 右側顯示 Stack、Active Role、Test Command 等可編輯欄位 |
| **儲存變更** | 修改後點擊儲存 |
| **刪除專案** | 刪除操作附帶危險樣式按鈕 |
| **新增專案表單** | 選擇 Code / Creative 模式後填入名稱、Stack、Test Command |

### 所需 API

| 功能 | Method | Endpoint |
|------|--------|----------|
| 取得所有專案 | `GET` | `/api/projects` |
| 取得單一專案 | `GET` | `/api/projects/:projectId` |
| 建立新專案 | `POST` | `/api/projects` |
| 更新專案 | `PATCH` | `/api/projects/:projectId` |
| 刪除專案 | `DELETE` | `/api/projects/:projectId` |

---

## 10. 洞察（Insights）

### 功能描述

提供過去 8 天的 Agent 執行效能趨勢分析，包含 Code Mode 成功率、Creative Mode 通過率、Token 用量與費用估算，以及各專案的用量明細。

### 功能清單

| 區塊 | 說明 |
|------|------|
| **今日摘要** | Code 成功率、Creative 通過率、總 Token、預估成本 |
| **First-Pass Rate 趨勢圖** | 折線圖呈現 Code 與 Creative 各 8 天的首次通過率 |
| **平均修復次數趨勢** | Code Mode 每天平均需要幾次 fix attempt |
| **各專案用量表格** | 各專案名稱、模式、Token 用量、預估費用、占比長條 |

### 所需 API

| 功能 | Method | Endpoint |
|------|--------|----------|
| 今日摘要統計 | `GET` | `/api/insights/summary` |
| First-pass rate 歷史（8 天） | `GET` | `/api/insights/first-pass-rate?days=8` |
| 平均修復次數歷史 | `GET` | `/api/insights/avg-fix-attempts?days=8` |
| 各專案 Token 用量 | `GET` | `/api/insights/usage-by-project` |

---

## 11. 全域功能

### 功能清單

| 功能 | 說明 |
|------|------|
| **Sidebar 收合** | 左側導覽列可收合，偏好存至 `localStorage` |
| **亮 / 暗模式切換** | Topbar 右上角切換，偏好存至 `localStorage` |
| **多語系切換** | 支援繁體中文（預設）/ English，語言偏好存至 `localStorage` |
| **Command Palette** | `Cmd/Ctrl + K` 搜尋頁面、Runs、Projects，支援鍵盤導覽 |

> 全域 UI 偏好（主題、語言、側欄狀態）僅存於瀏覽器本地，**不需要後端 API**。

---

*文件結束 — 完整 API 規格詳見 `API-SPEC.zh-TW.md`*
