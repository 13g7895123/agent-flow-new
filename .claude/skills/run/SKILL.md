---
name: run
description: Use when designing the Run entity (one execution of an Agent in either Code or Creative mode). Covers schema variants per mode, status state machine, status filters, mode filters, and every page that lists, filters, or details a Run.
---

# Run

## 一句話定義
**Run** 是 Agent 一次執行的紀錄。依 Project.mode 分為 Code 與 Creative 兩個 schema 變體，且狀態機也略有不同。Run 是整個系統的核心觀測單位。

## 後端 Schema

```ts
type RunMode = 'code' | 'creative';
type RunStatus = 'running' | 'waiting_review' | 'success' | 'failed' | 'escalated';

interface BaseRun {
  id: string;                    // 'run-4821'
  project: string;               // Project.id（建議改成 projectId）
  mode: RunMode;
  role: string;                  // Role.name（snapshot 時的字串）
  task: string;                  // 任務描述
  status: RunStatus;
  startedAt: string;             // ISO-8601
  duration: string;              // '8m 14s'，已格式化（後端可同時提供 durationMs）
  tokensUsed: number;
  estimatedCost: number;         // 美元
  stepsDone: number;
  stepsTotal: number;
}

interface CodeRun extends BaseRun {
  mode: 'code';
  fixAttempts: number;           // 當前修復次數
  maxFix: number;                // 通常 5
  testPass: number;
  testFail: number;
}

interface CreativeRun extends BaseRun {
  mode: 'creative';
  assetsGenerated: number;
  assetsPendingReview: number;
}
```

> 來源：`frontend/lib/afh-data.js:56–213` (RUNS)

## 狀態機

### Code Run
```
running ──tests pass──> success
   │
   ├──tests fail──> running (fix attempt N/5) ──tests pass──> success
   │                            │
   │                            └──fixAttempts === maxFix──> escalated
   │                                              │
   │                                              ├──hint + Resume──> running
   │                                              └──Abort──> failed
   │
   └──unrecoverable error──> failed
```

### Creative Run
```
running ──pending assets > 0──> waiting_review
   │                              │
   │                              ├──approve all──> running (next step)
   │                              ├──reject all──> running (regenerate)
   │                              └──mixed──> 持續 waiting_review，逐筆決
   │
   └──final review pass──> success
   └──unrecoverable error / abort──> failed
```

## API 端點

| 功能 | Method | Endpoint | 備註 |
|------|--------|----------|------|
| 列表（含篩選） | `GET` | `/api/runs` | 詳見下表 query 參數 |
| 取得單筆 | `GET` | `/api/runs/:runId` | 不含 steps，需另一 endpoint |
| 建立（觸發 Agent） | `POST` | `/api/runs` | body: `{ projectId, task, hints? }` |
| 暫停 / 中止 | `POST` | `/api/runs/:runId/abort` | 強制 → failed |
| 提供 hint 並繼續 | `POST` | `/api/runs/:runId/resume` | body: `{ hint: string }` |

### Query 參數

| 參數 | 範例 | 用途 |
|------|------|------|
| `status` | `running,waiting_review,escalated` | Active runs 篩選（Dashboard） |
| `mode` | `code` / `creative` | Runs 頁模式篩選 |
| `project` | `commerce-api` | Runs 頁專案篩選 |
| `limit` | `10` | Recent runs（Dashboard） |
| `sort` | `-startedAt` | 預設由新到舊 |
| `cursor` | base64 | Cursor pagination |

## 出現在哪些頁面（非常詳盡）

### 1. Dashboard — `frontend/components/afh-dashboard.jsx`

#### Active Runs 區塊（line ~165–167）
- 條件：`status IN ('running', 'waiting_review', 'escalated')`
- 元件：`<ActiveRunCard>`（line 10）
- 每張卡顯示：
  - `run.mode` (ModeBadge)
  - `run.task`（一行 ellipsis）
  - 進度條 `stepsDone / stepsTotal`
  - Code 模式：`fixAttempts / maxFix`、測試 pass/fail
  - Creative 模式：`assetsPendingReview` warning、`assetsGenerated`
  - **警示橫幅**：waiting_review → 紫色「等待審核」；escalated → 橘色「需人工介入」
  - 點擊 → `setSelectedRun(run.id); setPage('runs')`

#### Recent Runs 表格
- `GET /api/runs?limit=10&sort=-startedAt`
- 與 Runs List 共用 `<RunRow>` 列

### 2. Runs（List）頁 — `frontend/components/afh-runs.jsx`

| UI 區塊 | 行號 | 細節 |
|---------|------|------|
| 狀態篩選 buttons | （見頁面） | 全部 / running / waiting_review / success / failed / escalated |
| 模式篩選 | | 全部 / code / creative |
| 專案篩選 | | 下拉選 PROJECTS |
| 列表表格 | 305 起 | RunRow：id / mode / task / project / status / duration / tokens / fixAttempts |
| 點擊一列 | RunRow onClick | code → `<CodeRunDetail>`；creative → `<CreativeRunDetail>` |

### 3. Code Run Detail — `frontend/components/afh-runs.jsx` `CodeRunDetail` (line 218)

| 區塊 | 行號 | 細節 |
|------|------|------|
| Back button | 238 | 回 RunsList |
| run.id | 241 | mono |
| StatusBadge | 243 | status 視覺化 |
| run.project | 245 | 文字 |
| run.duration / run.tokensUsed | 247–248 | mono |
| EscalationBanner（status='escalated' 時） | 260 | 詳見 escalation-request skill |
| StepTimeline 左欄 | 255 | 詳見 step skill |
| 步驟詳情右欄 | 261– | tab：output / diff / tests / context |

### 4. Creative Run Detail — `frontend/components/afh-creative.jsx`

| 區塊 | 細節 |
|------|------|
| 頁首 meta | run.id / status / project / role / duration / tokens / cost |
| 等待審核橫幅（status='waiting_review'） | 顯示「`assetsPendingReview` 張素材待審」 |
| StepTimeline 左欄（line 365） | mode='creative' 變體 |
| Tab：gallery / review | 切換 AssetGallery vs ReviewPanel |
| Connector 微面板 | 此 Run 使用到的 Connector 即時狀態 |

### 5. Insights — `frontend/components/afh-pages.jsx` `InsightsPage`
- `firstPassRate`、`avgFixAttempts`、`tokensByProject` 都是 Run 的彙總

### 6. Command Palette
- 索引最近 N 筆 Run，每筆對應一個 CommandPaletteItem (type='run')

## 後端設計建議

- **schema 變體處理**：兩種 mode 的欄位差異大，建議用 `mode` 欄位 + JSON `meta` 或 polymorphic table（`runs` + `code_runs`/`creative_runs` 1:1）
- **duration 雙欄**：對外 DTO 同時提供 `duration: '8m 14s'`（顯示）與 `durationMs: 494000`（排序 / 計算），避免前端要 parse 字串
- **status 演進**：`escalated` 在 Code mode 才有，`waiting_review` 在 Creative mode 才有；後端應在更新狀態時做 mode 一致性驗證
- **抓取細節 API 分層**：列表只回 base 欄位 + 計數；steps / assets / testResults 分別走 `/api/runs/:id/steps` 與 `/api/runs/:id/steps/:stepId` 等，避免 list payload 爆量
- **Run snapshot**：建議在 Run 建立時 snapshot `roleId`、`projectStackAtRun`、`promptStackAtRun`、`enabledSkillIdsAtRun`，供事後 reproduce
- **token / cost 同步**：每個 Step 完成後即時累加到 Run.tokensUsed 與 Run.estimatedCost，避免 list 時要 SUM steps
- **subscribe / SSE**：active run 應提供 `GET /api/runs/:id/events`（SSE）讓 Dashboard 與 Run Detail 即時更新
- **轉態原子性**：`escalated → running`（resume）必須伴隨 `EscalationRequest.status` 變更與下一 fix attempt 步驟建立，後端用 transaction
