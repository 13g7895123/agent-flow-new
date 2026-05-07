---
name: dashboard-summary
description: Use when designing the DashboardSummary aggregate (today's overview stats including code/creative runs, pending review, intervention, tokens, cost). Covers schema, data freshness model, API endpoint, and the StatCard grid on the Dashboard and Insights pages.
---

# DashboardSummary

## 一句話定義
**DashboardSummary** 是一組「今日彙總統計」的衍生物件，匯集 Run、AssetVersion、EscalationRequest 計算出 6 個 KPI，主要用於 Dashboard 頁面頂部的 StatCard 陣列。

## 後端 Schema

```ts
interface DashboardSummary {
  // 時間範圍（預設今日 00:00 ~ now，使用者時區）
  date: string;              // 'YYYY-MM-DD'
  generatedAt: string;       // ISO-8601 — 此 snapshot 時刻

  // Code Mode 統計
  codeRuns: number;          // 7
  codeSuccess: number;       // 5
  codeFailed: number;        // 2
  // codeRunning（衍生）= codeRuns - codeSuccess - codeFailed

  // Creative Mode 統計
  creativeRuns: number;      // 3
  creativeApproved: number;  // 2
  creativePending: number;   // 1

  // 待處理
  needsReview: number;       // 1（Σ creative runs.assetsPendingReview）
  needsIntervention: number; // 1（Σ runs.status='escalated'）

  // 用量
  tokensTotal: number;       // 320400
  estimatedCost: number;     // 14.80（USD）
}
```

> 來源：`frontend/lib/afh-data.js:459–465`（INSIGHTS.todaySummary，與 dashboard 共用）

## 計算定義（後端聚合 SQL pseudo）

```sql
-- 假設 runs 表有 mode、status、started_at、tokens_used、estimated_cost
SELECT
  COUNT(*) FILTER (WHERE mode='code') AS code_runs,
  COUNT(*) FILTER (WHERE mode='code' AND status='success') AS code_success,
  COUNT(*) FILTER (WHERE mode='code' AND status='failed') AS code_failed,
  COUNT(*) FILTER (WHERE mode='creative') AS creative_runs,
  COUNT(*) FILTER (WHERE mode='creative' AND status='success') AS creative_approved,
  COUNT(*) FILTER (WHERE mode='creative' AND status='waiting_review') AS creative_pending,
  COALESCE(SUM(tokens_used), 0) AS tokens_total,
  COALESCE(SUM(estimated_cost), 0) AS estimated_cost,
  COUNT(*) FILTER (WHERE status='escalated') AS needs_intervention,
  -- needs_review 需 join asset_versions
  (SELECT COUNT(*) FROM asset_versions
   WHERE status='pending'
     AND run_id IN (SELECT id FROM runs WHERE date(started_at) = current_date))
   AS needs_review
FROM runs
WHERE date(started_at) = current_date AT TIME ZONE :user_tz;
```

## API 端點

| 功能 | Method | Endpoint | 備註 |
|------|--------|----------|------|
| 取得今日 summary | `GET` | `/api/dashboard/summary` | response 為 `DashboardSummary` |
| 取得指定日期 | `GET` | `/api/dashboard/summary?date=2026-04-23` | 用於歷史比對 |
| 取得 insights summary（同 schema） | `GET` | `/api/insights/summary` | Insights 頁也用這份 |

## 資料新鮮度策略

- **即時計算**：每次 GET 都跑聚合 — 簡單，但 100+ runs 後會慢
- **物化 view + 週期 refresh**（**推薦**）：每 60 秒 refresh 一次；前端輪詢或 SSE
- **事件驅動 counter**：Run / Asset 狀態變化即時 increment Redis counter；最即時但要處理 race condition

> 注意：`generatedAt` 一定要回，前端 stale 提示使用

## 出現在哪些頁面（非常詳盡）

### 1. Dashboard — `frontend/components/afh-dashboard.jsx`

**主要使用點**

| StatCard 順序 | 行號 | label | value | sub | 著色條件 |
|---------------|------|-------|-------|-----|----------|
| 1 | 150 | `dashboard.codeRuns` | `s.codeRuns` | success/failed sub | — |
| 2 | 151 | `dashboard.creativeRuns` | `s.creativeRuns` | approved sub | `var(--mode-creative)` |
| 3 | 152 | `dashboard.needsReview` | `s.needsReview` | sub static | `>0` 時 `var(--status-review)` |
| 4 | 153 | `dashboard.intervention` | `s.needsIntervention` | sub static | `>0` 時 `var(--status-escalate)` |
| 5 | 154 | `dashboard.tokens` | `${tokensTotal/1000}k` | sub static | — |
| 6 | 155 | `dashboard.estimatedCost` | `$${estimatedCost.toFixed(2)}` | sub static | — |

`StatCard` 元件定義在 `frontend/components/afh-ui.jsx:357`：
```jsx
<StatCard label sub value color />
```

### 2. Insights — `frontend/components/afh-pages.jsx` `InsightsPage` (line 528)

**Today summary 區塊（line 539–544）**

| StatCard | 行號 | 計算式 | 來源欄位 |
|----------|------|--------|----------|
| Code success rate | 540 | `Math.round(codeSuccess / codeRuns * 100)%` | DashboardSummary.codeSuccess / codeRuns |
| Creative approval rate | 541 | `Math.round(creativeApproved / creativeRuns * 100)%` | DashboardSummary.creativeApproved / creativeRuns |
| Total tokens | 542 | `${tokensTotal/1000}k` | DashboardSummary.tokensTotal |
| Estimated cost | 543 | `$${estimatedCost.toFixed(2)}` | DashboardSummary.estimatedCost |

> 注意：Insights 頁沒用到 needsReview / needsIntervention 兩個欄位（可在後端 endpoint 用 ?fields= 排除）

### 3. 其他頁面
- Runs / Roles / Skills / Connectors / Projects 不使用此物件

## 後端設計建議

- **時區**：以使用者瀏覽器時區為「今日」邊界；後端應接受 `?tz=Asia/Taipei` 參數，否則用 UTC
- **divide by zero**：codeRuns=0 時 success rate 顯示「—」而非 NaN%
- **快取 key**：`dashboard:summary:{userId}:{date}:{tz}`，TTL 60 秒；invalidate triggers = run.status 變化、asset_version.status 變化
- **大時間範圍版本**：未來可能要週 / 月，建議同 endpoint 加 `?range=today|week|month`
- **per-project filter**：?projectId 過濾單一專案，但 6 個 KPI 仍用同 schema 回
- **欄位演進**：未來想加 P50 / P95 latency、avg token per run 等欄位時，append 不破 schema
- **空狀態**：DashboardSummary 全 0 時，前端應顯示「今天還沒有 Run」引導訊息（mock 沒做）
- **與 InsightMetric 區隔**：DashboardSummary 是「今日點」，InsightMetric 是「8 天線」；兩者來源相同但聚合維度不同，建議獨立 endpoint
