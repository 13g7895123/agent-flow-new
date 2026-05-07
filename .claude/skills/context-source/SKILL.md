---
name: context-source
description: Use when designing the ContextSource sub-resource of a Collect Context Step. Covers schema, token / pct breakdown, and the ContextViewer panel that visualizes which files were read into the LLM's context window.
---

# ContextSource

## 一句話定義
**ContextSource** 是 Code Run「Collect Context」步驟收集到的單一上下文來源（檔案、文件、schema dump 等），描述其名稱、token 數與在總 context 中的占比。前端用 `ContextViewer` 視覺化呈現各來源的條形分布與 context window 使用率。

## 後端 Schema

```ts
interface ContextSource {
  name: string;          // 'schema.sql' / 'routes/cart.js' / 'docs/webhooks.md'
  tokens: number;        // 1240
  pct: number;           // 29，整數百分比（不必加總到 100）
  // 建議擴充
  type?: 'file' | 'doc' | 'schema' | 'memory' | 'web' | 'tool_output';
  path?: string;         // 完整絕對路徑（IDE 連結用）
  source?: string;       // 哪個 AgentSkill 抓到的 (e.g. 'sql-schema-reader')
  lines?: { start: number; end: number };  // 若是檔案片段
}
```

> 來源：`frontend/lib/afh-data.js:222–229`（s1 step 的 `collectorBreakdown`，6 筆 mock）

## 計算與限制

- **總 tokens**：`step.tokens`（在 mock 中為 4200）= Σ collectorBreakdown[].tokens
- **pct**：每筆四捨五入；前端不重新計算，直接顯示後端結果
- **Context window 使用率**：總 tokens / model.maxContextWindow（如 Gemini 2.5 Pro 約 1M、Claude Sonnet 約 200K），這是視覺化要的「使用率長條」
- 注意 mock pct 加總可能 ≠ 100（29+21+15+17+12+5=99），這是合理的（rounding loss），UI 不應強制歸一

## API 端點

| 功能 | Method | Endpoint | 備註 |
|------|--------|----------|------|
| 取得 step 的 collectorBreakdown | `GET` | `/api/runs/:runId/steps/:stepId` | 含 `collectorBreakdown[]` |
| 取得單一 source 內容 | `GET` | `/api/runs/:runId/steps/:stepId/context/:sourceName` | 取得實際載入的文字（可能很大）|

## 出現在哪些頁面（非常詳盡）

### 1. Code Run Detail — `frontend/components/afh-runs.jsx` `ContextViewer` (line 134)

**唯一使用位置**

| UI 區塊 | 行號 | 細節 |
|---------|------|------|
| Tab 啟用條件 | 228 | `step.collectorBreakdown` 存在時顯示「Context」tab |
| ContextViewer 入口 | 294 | `{activeTab === 'context' && <ContextViewer breakdown={step.collectorBreakdown} />}` |
| **Total Context 顯示** | 167 | t('runs.totalContext') — 通常顯示「總共 X tokens / window 使用 Y%」 |
| 每筆來源列（內部） | | name（mono）+ tokens（mono）+ pct 條形 |
| 每行展開 | line 136 useState expanded | 點擊可展開看更多 metadata（file path、type） |
| 條形寬度 | | 依 pct 比例渲染 |

### 2. Creative Run
- **不使用**（Creative 沒有 Collect Context 步驟）

### 3. 其他頁面
- 不直接顯示。Insights 可加未來：「context window 平均使用率」、「最常被收集的檔名」彙總

## 後端設計建議

- **抓取的責任歸屬**：`Collect Context` step 由多個 AgentSkill 協作（`sql-schema-reader` 拿 schema.sql、`git-diff` 拿 staged 檔案、`*-analyzer` 拿型別簽章）。建議在 ContextSource 上加 `source` 欄位記錄是哪個 skill 抓的，便於除錯
- **去重**：不同 skill 可能重複抓到同一檔；後端應在 step 收尾時做 dedup（by `path` 或 hash），保留 token 數最完整的那筆
- **隱私 / 機密**：context 內容可能含敏感資料（API keys、PII）。建議：
  - 列表 endpoint 只回 metadata（name / tokens / pct）
  - 完整內容走 `:sourceName` endpoint，並可配權限檢查
  - 在 UI 顯示時提供 "redact" 切換（自動把 bearer token、AWS key pattern 遮罩）
- **截斷標示**：若某 source 因 context window 限制被 truncate，欄位應加 `truncated: true`
- **與 LLM token 計算同源**：後端用提供商 tokenizer（Anthropic / Google）計算，避免「合計 4200」與實際 LLM 看到的 token 數差太多
- **path vs name**：mock 只有 name。建議 path 是絕對 / repo-relative 路徑，name 是顯示短名（檔尾），這樣前端可加 IDE 連結（`vscode://file/{path}`）
- **歷史比較**：同一 Project 跨 Run 的 context 變化（哪些 source 是新加的、tokens 變多）對除錯很有用，後端可建立 materialized view
