---
name: escalation-request
description: Use when designing the EscalationRequest entity (human-in-the-loop intervention when an Agent exhausts its fix attempts). Covers the run.status='escalated' state, hint submission, Resume / Abort actions, and the EscalationBanner UI.
---

# EscalationRequest

## 一句話定義
**EscalationRequest** 是當 Code Run 的 `fixAttempts === maxFix` 且仍 fail 時，系統升級為 `escalated` 狀態，等待人類提供 hint 並決定 Resume 或 Abort 的動作。

## 後端 Schema

```ts
type EscalationStatus = 'pending' | 'resumed' | 'aborted';

interface EscalationRequest {
  id: string;                  // 'esc-001'
  runId: string;               // 對應 Run.id
  triggeredAt: string;         // ISO-8601
  triggerReason: 'max_fix_reached' | 'unrecoverable_error' | 'manual';
  // 觸發時的 snapshot（讓人類做決策的 context）
  snapshot: {
    fixAttempts: number;       // run.fixAttempts
    maxFix: number;
    testFail: number;
    lastErrors: string[];      // 最後一輪失敗測試 error 摘要
    duration: string;
  };
  // 人類回應
  status: EscalationStatus;
  hint?: string;               // 使用者輸入的 hint
  resolvedAt?: string;
  resolvedBy?: string;         // userId
}
```

> mock 沒有獨立資料；可由 `RUNS[].status === 'escalated'` 推斷（如 `run-4820`）。建議實作時建立獨立資料表

## 狀態機

```
            ┌─────────┐
觸發 ─────> │ pending │
            └──┬─────┬┘
               │     │
   hint+Resume │     │ Abort
               ▼     ▼
         ┌─────────┐  ┌─────────┐
         │ resumed │  │ aborted │
         └─────────┘  └─────────┘
```

連動效果：
- `resumed` → Run.status: escalated → running，新增一個 Fix Attempt step（且 fixAttempts++ 或 maxFix++）
- `aborted` → Run.status: escalated → failed

## API 端點

| 功能 | Method | Endpoint | Body | 備註 |
|------|--------|----------|------|------|
| 取得 Run 的 active escalation | `GET` | `/api/runs/:runId/escalation` | — | 回最近一筆 status='pending' |
| 提供 hint 並 Resume | `POST` | `/api/runs/:runId/resume` | `{ hint: string }` | 後端自動更新 EscalationRequest.status='resumed' |
| Abort | `POST` | `/api/runs/:runId/abort` | — | EscalationRequest.status='aborted' + Run.status='failed' |

## 驗證與規則

- `hint` **可空**（mock 在 `frontend/components/afh-runs.jsx:203` 有 `hint.trim() && setSubmitted(true)`，UI 強制非空），但後端建議允許 empty string + 紀錄「使用者 Resume 但沒給 hint」
- 同一 Run 同時只能有一筆 `pending` EscalationRequest
- `Abort` 不可逆；後端應在 Run 進入 failed 後，所有後續 fix step 不再執行

## 出現在哪些頁面（非常詳盡）

### 1. Code Run Detail — `frontend/components/afh-runs.jsx` `EscalationBanner` (line 175)

**唯一互動位置**

| UI 區塊 | 行號 | 細節 |
|---------|------|------|
| Banner 進入點 | 260 | `{run.status === 'escalated' && <EscalationBanner run={run} />}` |
| 警示色標題 | 184 | `t('runs.humanIntervention')`，使用 `var(--status-escalate)` |
| 描述文字 | 186 | `t('runs.humanInterventionDesc', { max, fail })` — 「修復 N 次後仍 X 個測試失敗」 |
| **Snapshot 三欄** | 189 | Attempts used `5/5`、Tests failing `3`、Duration `22m 44s` |
| Hint textarea | 199 | placeholder = `t('runs.hintPlaceholder')` |
| Resume button | 203 | icon='send'，`hint.trim() && setSubmitted(true)` → 應對應 `POST .../resume` |
| Abort button | 204 | variant='danger' → 應對應 `POST .../abort` |
| Submitted 確認 | 207–209 | 顯示 `t('runs.hintSubmitted')` 帶勾勾 icon |

### 2. Dashboard — `frontend/components/afh-dashboard.jsx`

| 元素 | 細節 |
|------|------|
| **needsIntervention 統計卡** | line 153 — `value={s.needsIntervention}`，>0 時 color=`var(--status-escalate)` |
| **ActiveRunCard 警示橫幅** | run.status==='escalated' 時顯示「需人工介入」 |
| 點擊 → 跳轉 Run Detail，自動展開 EscalationBanner |

### 3. Runs（List）
- 狀態篩選包含 `escalated`
- StatusBadge 為 escalated 配色 `var(--status-escalate)`

### 4. Insights
- 未來可加：「平均 escalation 解決時間」、「Resume vs Abort 比例」、「常見 hint 字眼」

### 5. Creative Run
- **不適用**（Creative 用 `waiting_review` 狀態，由人類審核 Asset 而非 hint）

## 後端設計建議

- **獨立資料表**：mock 沒拆，建議新增 `escalation_requests` 表，便於追蹤 history（一個 Run 理論上可被 escalate 多次—Resume 後又 escalate）
- **Snapshot 必要**：觸發當下的 Run 狀態必須 freeze，否則人類看到 banner 時的數字可能因為非同步事件而變動
- **Resume 的 maxFix 處理**：
  - 選項 A：fixAttempts 重置為 0，繼續算 / 5
  - 選項 B：maxFix++，繼續累加（例 5/5 → 5/6）
  - 推薦 A 配 hint 加入 task layer prompt，讓 Agent 認為這是新一輪修復
- **Hint 注入**：Resume 時 hint 應插入下一個 Step 的 input（`{review_feedback}` 或新增 `{user_hint}` 變數）
- **Notify**：escalated 時應發 Webhook / Slack / 推播給負責人（非 mock 範圍但建議列入）
- **權限**：誰能 Resume / Abort？建議綁 Project 的 owners + 系統管理員
- **Audit log**：每次 Resume / Abort 紀錄 userId、timestamp、hint 全文，永不 delete
- **Auto-abort timeout**：若 escalated 超過 N 小時無人處理，自動 abort 並通知 — 避免「卡死的 Run」消耗 quota
