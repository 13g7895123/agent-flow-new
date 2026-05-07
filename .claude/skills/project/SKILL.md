---
name: project
description: Use when designing, persisting, or reasoning about the Project entity in Agent Flow Harness — Project is the top-level container that defines what an Agent works on (mode, stack, active role, test command). Includes schema, lifecycle, API contract, and every UI surface that reads or writes it.
---

# Project

## 一句話定義
**Project** 是「Agent 服務的對象」。它定義模式（Code / Creative）、技術堆疊、預設 Role 與測試指令，並做為 `Run` 的歸屬群組。

## 後端 Schema

```ts
interface Project {
  id: string;                    // 'commerce-api'，URL-safe，唯一
  name: string;                  // 顯示名稱（與 id 通常相同，但允許不同）
  mode: 'code' | 'creative';     // 不可變更（變更需建立新 Project）
  stack: string[];               // ['Node.js', 'Express', 'PostgreSQL', 'Redis']
  testCmd: string | null;        // 'npm test'；creative 模式為 null
  activeRole: string;            // Role.name 字串綁定（注意：不是 Role.id）
  // 統計欄位（後端 derived，可放 ?include=stats）
  runsToday?: number;
  successRate?: number;          // 0–100 整數
  createdAt?: string;            // ISO-8601
  updatedAt?: string;
}
```

> 來源資料：`frontend/lib/afh-data.js` line 3–54 (`PROJECTS`)

## 狀態與 Lifecycle
- Project **沒有狀態欄位**；建立後即可被 Run 引用，刪除時應 cascade soft-delete 或 reject 若有歷史 Run（建議 reject 避免孤兒紀錄）。
- `mode` 為**創建時固定**，因為 Code 與 Creative 模式對 Schema、Steps、Skills、Connectors 的需求差異極大。

## API 端點

| 功能 | Method | Endpoint | Body / Query | 備註 |
|------|--------|----------|--------------|------|
| 列出全部專案 | `GET` | `/api/projects` | `?include=stats` 取得 runsToday/successRate | 用於 Dashboard、Projects、Runs filter |
| 取得單一 | `GET` | `/api/projects/:projectId` | — | |
| 建立 | `POST` | `/api/projects` | `{ name, mode, stack[], testCmd?, activeRole }` | mode 必填 |
| 更新（不含 mode） | `PATCH` | `/api/projects/:projectId` | `{ name?, stack?, testCmd?, activeRole? }` | 422 if `mode` in body |
| 刪除 | `DELETE` | `/api/projects/:projectId` | — | 若有 Run 應 409 並提示先 archive |

## 驗證規則
- `id` slug 限 `^[a-z0-9-]+$`，最長 64
- `mode='creative'` 時 `testCmd` 必須 null
- `mode='code'` 時 `testCmd` 必填且非空
- `activeRole` 必須是現存 Role.name 之一，且 `Role.mode === Project.mode`
- `stack` 陣列至少 1 元素

## 出現在哪些頁面（非常詳盡）

### 1. Projects 頁 — `frontend/components/afh-pages.jsx` `ProjectsPage` (line 388)
**完整 CRUD 集中地**
- **左側專案列表**（line 401）：渲染 `PROJECTS.map`，顯示 `ModeBadge`（mode）、`name`、`stack[]` chip 列
- **右側詳細區**（line 469）：`activeRole`、`stack` 文字串、`testCmd`（mode='code' 才顯示，line 479）三個 input
  - 「儲存變更」(line 489) → `PATCH /api/projects/:id`
  - 「刪除專案」(line 490, danger button) → `DELETE /api/projects/:id`
- **新增專案表單**（line 419）
  - Mode 選擇器（line 425）：兩張卡片決定 `mode='code' | 'creative'`
  - Name + Stack 共用 input（line 446）
  - Test Command（line 455）：`mode === 'code'` 才顯示
  - 「Create Project」(line 464) → `POST /api/projects`

### 2. Dashboard — `frontend/components/afh-dashboard.jsx`
- **Projects 統計列表**（line ~190 區段）：`runsToday`、`successRate` 由 `GET /api/projects?include=stats` 取得
- **ActiveRunCard / RecentRuns** (line 10) 內每筆 `run.project` 字串引用此 id
- **Connectors 狀態** 與 Project 無直接關聯，但 Project.stack 暗示了會用到的 Connector

### 3. Runs（List）— `frontend/components/afh-runs.jsx`
- **專案篩選下拉**：填入 `PROJECTS.map(p => p.id)` 作為 filter 選項
- 列表中每行 `<RunRow>` (line 305) 顯示 `run.project` 文字

### 4. Run Detail（Code & Creative）
- **頁首 meta 列**：`run.project` 直接以文字呈現（`afh-runs.jsx` line 245）
- 後端組 Agent 時讀取此 Project 的 `stack`、`testCmd`、`activeRole`

### 5. Insights — `frontend/components/afh-pages.jsx` `InsightsPage` (line 528)
- **Per-project breakdown 表格**（line 580）：以 `tokensByProject[].project` 字串 join Project 顯示

### 6. Roles 頁
- 雖然 Roles 編輯不直接編 Project，但 PromptLayer 中 `{project_name}`、`{stack}`、`{test_cmd}`、`{schema_context}` 等變數於 runtime 由 Project 注入

### 7. Command Palette — `frontend/components/afh-ui.jsx` `CommandPalette` (line 254)
- Cmd/Ctrl+K 搜尋結果包含「Projects」分類，每筆對應一個 Project.id

## 後端設計建議

- **`activeRole` 的綁定鍵問題**：mock 用的是 Role 顯示名稱（'Backend Engineer'）。若採 SQL，建議 `active_role_id` 用 Role.id（FK）+ joins 取得 name；REST DTO 仍可吐 `activeRole: string` 維持前端契約。
- **冷統計**：`runsToday`、`successRate` 不要每次掃 Run 表計算；建議 materialized view 每 1–5 分鐘 refresh，或用 Redis counter 即時累計。
- **mode 不可變**：若使用者真的想改，引導他「Archive 舊專案 + 建立新專案」。後端用 `409 Conflict` 拒絕 mode 變更請求。
- **stack 寫入正規化**：`['Node.js']` vs `['nodejs']` 容易分歧；可在前端 NewProject 表單做 token suggest，或後端維護 canonical stack 列表。
