---
name: insight-metric
description: Use when designing time-series and breakdown metrics for the Insights page (8-day first-pass rate, average fix attempts, tokens & cost by project). Covers schema, aggregation windows, API decomposition, and the chart / table UI elements.
---

# InsightMetric

## 一句話定義
**InsightMetric** 是一組為 Insights 頁設計的歷史趨勢與 breakdown 衍生資料，包含三個獨立 metric：first-pass rate（8 天）、average fix attempts（8 天）、tokens by project（當前累計）。

## 後端 Schema

```ts
// metric 1: 8 天首次通過率（code 與 creative 並列）
interface FirstPassRatePoint {
  date: string;          // 'Apr 17' 或 ISO date
  code: number;          // 0–100
  creative: number;      // 0–100
}

// metric 2: 8 天平均修復次數（code-only）
type AvgFixAttemptsSeries = number[];  // length=8，例 [2.8, 2.6, 3.1, 2.2, 2.4, 2.0, 1.8, 1.6]

// metric 3: 各專案用量 breakdown
interface ProjectUsage {
  project: string;       // Project.id 或 name
  mode: 'code' | 'creative';
  tokens: number;        // 184000
  cost: number;          // 0.92（USD）
  // 衍生欄位（可由前端算，但後端先算更省事）
  pct?: number;          // 占總 tokens 比例
}
```

> 來源：`frontend/lib/afh-data.js:466–483`（INSIGHTS.firstPassRate / avgFixAttempts / tokensByProject）

## 各 metric 計算定義

### First-Pass Rate（8 天）
```
code first-pass rate = COUNT(runs WHERE mode='code' AND fix_attempts === 0 AND status='success')
                     / COUNT(runs WHERE mode='code')  [GROUP BY date]
creative first-pass rate = COUNT(runs WHERE mode='creative' AND status='success' AND assets_total === assets_approved_first_attempt)
                         / COUNT(runs WHERE mode='creative')
```

> 「首次通過」對 Code = 沒進入任何 Fix Attempt 即 success；對 Creative = 所有 asset 第一個 version 就 approved

### Average Fix Attempts（8 天）
```
AVG(fix_attempts) FROM runs WHERE mode='code' AND status='success' GROUP BY date
```

> 注意：只算 success 的，否則 escalated（5/5）會把平均拉很高。或可額外提供 `avgFixAttemptsAll` 含 escalated

### Tokens by Project
```
SELECT project_id, mode, SUM(tokens_used), SUM(estimated_cost)
FROM runs WHERE date >= today - 30 days  -- 或當月
GROUP BY project_id, mode
ORDER BY SUM(tokens_used) DESC
```

> mock 沒指定時間範圍；建議當月 累計，或加 `?range=` 參數

## API 端點

| 功能 | Method | Endpoint | 備註 |
|------|--------|----------|------|
| Today summary（共用 dashboard-summary） | `GET` | `/api/insights/summary` | 詳見 dashboard-summary skill |
| First-pass rate 8 天 | `GET` | `/api/insights/first-pass-rate?days=8` | response: `FirstPassRatePoint[]` |
| Average fix attempts 8 天 | `GET` | `/api/insights/avg-fix-attempts?days=8` | response: `{ dates, values }` |
| Tokens by project | `GET` | `/api/insights/usage-by-project` | response: `ProjectUsage[]`，可加 `?range=this-month` |

## 出現在哪些頁面（非常詳盡）

### Insights 頁 — `frontend/components/afh-pages.jsx` `InsightsPage` (line 528)

**唯一使用位置**

#### 1. Today summary（line 539–544）
- 詳見 [dashboard-summary skill](../dashboard-summary/SKILL.md)
- 共用同一份資料源

#### 2. First-Pass Rate 區塊（line 548–565）
| UI 元素 | 行號 | 細節 |
|---------|------|------|
| 標題 | 550 | `pages.firstPassRate` |
| 圖例 | 551–554 | Code（藍）、Creative（粉）兩條線 |
| Code 折線 | 557 | `<MiniChart data={firstPassRate.map(r => r.code)} color="var(--mode-code)" />` |
| Creative 折線 | 559 | overlay 在同位置（absolute 疊加） |
| 日期 X 軸標籤 | 563 | 取 `date.split(' ')[1]`（只顯示日數字） |

#### 3. Average Fix Attempts 區塊（line 568–576）
| UI 元素 | 行號 | 細節 |
|---------|------|------|
| 標題 | 569 | `pages.avgFixAttempts` |
| 折線（單線） | 571 | `<MiniChart data={avgFixAttempts} color="var(--status-warning)" />` |
| 日期 X 軸 | 574 | 同上 |

#### 4. Per-project Usage 表格（line 580–614）
| UI 元素 | 行號 | 細節 |
|---------|------|------|
| 表頭 | 587 | Project / Mode / Tokens / Est Cost / (bar) |
| 每行 project name | 598 | `p.project` |
| ModeBadge | 599 | |
| tokens 顯示 | 600 | `${(p.tokens/1000).toFixed(1)}k` |
| cost 顯示 | 601 | `$${p.cost.toFixed(2)}`，creative 紅色 |
| pct 條形 | 602–605 | `(p.tokens / maxTokens) * 100%`，creative 粉色、code 藍色 |

#### MiniChart 元件（line 509–526）
- 接 `data: number[]`、`color`、`height`
- 自動 normalize 為 SVG polyline
- 加 fill area（opacity 0.08）填底色

### 其他頁面
- **不使用** InsightMetric。Dashboard 用 DashboardSummary（今日點），不用 8 天線

## 後端設計建議

- **三個 metric 各自獨立 endpoint**：避免一次回傳大物件，前端可分批 / 並發載入
- **時間視窗 `days` 參數**：預設 8 天（前端 mock 寫死），但後端應支援 `?days=14|30|90`
- **空日補 0**：若某天沒有 Run，回 `{ date: 'Apr 18', code: 0, creative: 0 }` 而非省略，否則折線斷裂
- **時區**：與 dashboard-summary 同 — 接受 `?tz=`
- **物化 view**：8 天趨勢可每天 refresh 一次（00:01 UTC），usage-by-project 可每小時 refresh
- **正規化方式**：first-pass rate 0–100 整數；前端不再 round。avgFixAttempts 取一位小數（mock：2.8、2.6、3.1）
- **per-project breakdown ordering**：mock 是定義順序；建議 ORDER BY tokens DESC 並 cap top 10，後面歸 "Other"
- **cost 與 connector 計價**：cost 算法取決於 Connector.pricePerMillionTokens（請見 connector skill）；creative cost 通常含 image / video gen 計費（per-image $0.04，per-second video $X）
- **下鑽（drill-down）**：表格列點擊應跳 Runs 頁 + project filter；mock 沒做，建議擴充
- **export**：Insights 應提供 CSV / JSON download endpoint（如 `?format=csv`），便於財務 / 老闆抓資料
- **stale 標記**：若資料超過某 threshold 沒更新，回 `staleSince: ...` 給前端顯示警告
