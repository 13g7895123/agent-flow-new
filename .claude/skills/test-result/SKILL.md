---
name: test-result
description: Use when designing the TestResult sub-resource of a Run Tests Step. Covers schema, error type categorization (TimeoutError / TypeError / AssertionError), expandable failure details, file:line linking, and the TestPanel component.
---

# TestResult

## 一句話定義
**TestResult** 是 Code Run「Run Tests」步驟下的單筆測試結果。一個 Step 通常會有多筆 results，前端以 `TestPanel` 呈現可展開的失敗明細。

## 後端 Schema

```ts
type TestStatus = 'pass' | 'fail';
type TestErrorType = 'TimeoutError' | 'TypeError' | 'AssertionError' | string;

interface TestResult {
  name: string;                  // 'upserts abandoned cart record'
  status: TestStatus;
  duration: string;              // '245ms'
  // 失敗時才有
  errorType?: TestErrorType;     // 分類錯誤性質，UI 用作 chip color
  error?: string;                // 完整錯誤訊息（含 stack trace、Expected/Received）
  file?: string;                 // 'tests/webhooks.test.js'
  line?: number;                 // 67
}
```

> 來源：`frontend/lib/afh-data.js:264–270`（s4 step 的 testResults，5 筆 mock：2 pass + 3 fail）

## 內建錯誤分類

mock 中出現三種：
| errorType | 範例情境 | UI 配色建議 |
|-----------|----------|------------|
| `TimeoutError` | DB upsert 超時 | warning amber |
| `TypeError` | 呼叫 undefined 函式 | error red |
| `AssertionError` | 預期 1 實際 2 | error red（語意較輕，可微調） |

> 後端應允許自訂類別（`string`），前端對未知類別 fallback 為 grey

## API 端點

| 功能 | Method | Endpoint | 備註 |
|------|--------|----------|------|
| 取得 step 的 testResults | `GET` | `/api/runs/:runId/steps/:stepId` | 含 `testResults[]` |
| 取得 step 的 testResults（獨立） | `GET` | `/api/runs/:runId/steps/:stepId/tests` | 大量結果時拆分 |

## 計算欄位

- **彙總**：`step.output` 內含「Tests: 2 passed, 3 failed」字串（mock）— 後端應同時提供結構化彙總：
  ```ts
  step.testSummary = {
    total: 5, passed: 2, failed: 3, skipped: 0,
    durationMs: 11000, suite: 'tests/webhooks.test.js'
  }
  ```
- **fail 數**：被前端用作 tab badge 數字（`afh-runs.jsx:228` `count: step.testResults.filter(t => t.status === 'fail').length`）

## 出現在哪些頁面（非常詳盡）

### 1. Code Run Detail — `frontend/components/afh-runs.jsx` `TestPanel` (line 92)

**唯一互動位置**

| UI 區塊 | 行號 | 細節 |
|---------|------|------|
| Tab badge | 228–229 | tab name = "Tests"；count = 失敗數，紅色 chip |
| TestPanel 進入點 | 293 | `{activeTab === 'tests' && step.testResults && <TestPanel results={step.testResults} />}` |
| 每筆 result 列 | （TestPanel 內部） | 圖示（✓ / ✗）+ name + duration（mono）+ errorType chip（fail 時）|
| 展開失敗明細 | line 94 useState `expanded` | 點擊 fail 項目展開 / 收起 |
| 展開後內容 | | `<pre>` 顯示 `error` 完整 stack；`file:line` 文字 |
| pass 項目 | | 不可展開（無 error） |

### 2. Creative Run
- **不使用**（沒有 Run Tests 步驟）

### 3. Insights
- 未來可彙總「最常失敗的 testName」、「errorType 分布」，目前 mock 沒做

### 4. Dashboard
- ActiveRunCard 顯示 `testPass` / `testFail` 計數（不開展細節）

## 後端設計建議

- **正規化來源**：不同測試框架（Jest / pytest / Go test / Vitest）輸出格式各異，後端應寫各自的 parser，正規化成 `TestResult[]`
- **error 內容**：保留 stack trace（不 truncate），但前端展開前先顯示前兩行；展開後顯示完整
- **file:line 可點擊**：前端可加「打開 IDE」連結（`vscode://file/{absPath}:{line}`），後端應提供 absolute path（注意安全：路徑可能含敏感資訊，視場景決定）
- **flaky test 標記**：若同一 test 在歷史 Run 反覆 fail / pass，可加 `flaky: true` chip
- **errorType 推斷**：對 Python `pytest` 的 `IndexError` 等也應正確分類；建議建立 `errorType` 字典表，未在表內的歸 `OtherError`
- **抽樣與全量**：對 Run Tests Final（s7）若 1000+ 測試，list 預設只回 fail + 前 10 pass，full 走 `?include=all`
- **diff/code-diff 配合**：失敗測試對應的 source code 可由 `code-diff skill` 取得；理想 UI 把 fail trace 的 file:line 跳到 DiffViewer 的對應行
- **timeout vs assertion 的 retry 邏輯**：Fix Attempt 觸發前，後端可依 errorType 提供 hint（TimeoutError 通常加 await / 加超時；AssertionError 通常邏輯錯）
