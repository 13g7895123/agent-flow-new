---
name: step
description: Use when designing the Step entity (one stage inside a Run). Covers Code-mode steps (Collect Context → Plan → Generate → Tests → Fix → Commit) and Creative-mode steps (Script → Style → Image → Motion → Assembly → Review), the StepTimeline UI, and per-step output panels.
---

# Step

## 一句話定義
**Step** 是 Run 內的單一階段。Code Run 通常有 8 個固定 step；Creative Run 通常有 6 個（且各 step 標示了使用的 Connector）。Step 的順序在 Run 啟動時即固定，但執行狀態隨時間更新。

## 後端 Schema

```ts
type StepStatus = 'success' | 'failed' | 'running' | 'waiting_review' | 'pending';

// 共通欄位
interface BaseStep {
  id: string;                    // 's1' / 'c1'，於該 Run 內唯一
  name: string;                  // 'Collect Context' / 'Script Generation'
  status: StepStatus;
  duration: string | null;       // '1.2s'，pending 為 null
  startedAt: string | null;      // 'HH:MM:SS' 或 ISO-8601
  tokens: number | null;         // 該步驟消耗
  input: string | null;          // 此步驟的輸入摘要（多行）
  output: string | null;         // 此步驟的輸出摘要（多行）
}

// Code mode 擴充
interface CodeStep extends BaseStep {
  // Generate Code 步驟才有
  diff?: { before: string; after: string };
  // Run Tests 步驟才有
  testResults?: TestResult[];
  // Collect Context 步驟才有
  collectorBreakdown?: ContextSource[];
}

// Creative mode 擴充
interface CreativeStep extends BaseStep {
  connector: string | null;      // 'Claude' / 'Gemini' / 'Runway' / 'Internal'
  connectorType: 'llm' | 'image_gen' | 'video_gen' | 'processor' | null;
  cost?: number;                 // 該步驟費用（USD）
  assets?: SceneAssetGroup[];    // Scene Image Generation 等步驟才有
}
```

> 來源：`frontend/lib/afh-data.js:216–281`（CODE_RUN_STEPS）、`283–357`（CREATIVE_RUN_STEPS）

## 內建 Step 順序

### Code Run（8 步）
| id | name | 主要產出 |
|----|------|----------|
| s1 | Collect Context | `collectorBreakdown[]` |
| s2 | Plan Implementation | text plan |
| s3 | Generate Code | `diff` |
| s4 | Run Tests | `testResults[]` |
| s5 | Fix Attempt 1 / 5 | （以及 s6 = Fix 2/5） |
| s6 | Fix Attempt 2 / 5 | |
| s7 | Run Tests (Final) | `testResults[]` |
| s8 | Commit & Summary | commit hash |

> Fix Attempt 步驟可能動態追加（max 5），整體陣列長度與當前 fixAttempts 相關

### Creative Run（6 步）
| id | name | connector |
|----|------|-----------|
| c1 | Script Generation | Claude (llm) |
| c2 | Style Reference | Gemini (llm) |
| c3 | Scene Image Generation | Gemini (image_gen) |
| c4 | Motion Generation | Runway (video_gen) |
| c5 | Assembly & Compositing | Internal (processor) |
| c6 | Final Review | null |

## 狀態機（單一 Step）

```
pending ──> running ──┬──> success
                      ├──> failed   (Code Run Tests 不一定算 fail，可能進 fix loop)
                      └──> waiting_review  (Creative c3 Scene Image Generation 等待人審)
```

> Step 狀態變化會觸發 Run 狀態演進；詳見 [run skill](../run/SKILL.md)

## API 端點

| 功能 | Method | Endpoint | 備註 |
|------|--------|----------|------|
| 列出某 Run 的 Steps | `GET` | `/api/runs/:runId/steps` | 用於 StepTimeline |
| 取得單一 Step（含 diff / tests / context） | `GET` | `/api/runs/:runId/steps/:stepId` | 細節按需載入 |
| Step 即時更新（SSE） | `GET` | `/api/runs/:runId/events` | 推送 step 狀態變化 |

## 出現在哪些頁面（非常詳盡）

### 1. Code Run Detail — `frontend/components/afh-runs.jsx` `CodeRunDetail` (line 218)

| UI 區塊 | 行號 | 細節 |
|---------|------|------|
| **左欄 StepTimeline** | 255 | `<StepTimeline steps={steps} selected={sel} mode="code" />` |
| **右欄頁首** | 263–266 | step.name / StatusBadge / step.duration · tokens |
| **Tab 列** | 226–229 | output（永遠有）+ diff（有 step.diff 時）+ tests（有 testResults 時）+ context（有 collectorBreakdown 時）|
| Tab: output | 271–290 | step.input / step.output 兩個 `<pre>` |
| Tab: diff | 292 | `<DiffViewer before={step.diff.before} after={step.diff.after} />` |
| Tab: tests | 293 | `<TestPanel results={step.testResults} />` |
| Tab: context | 294 | `<ContextViewer breakdown={step.collectorBreakdown} />` |
| 「Waiting for fix」spinner | 284–290 | step.status='running' && !step.output 時顯示 |

### 2. Creative Run Detail — `frontend/components/afh-creative.jsx` (line 365 起)

| UI 區塊 | 細節 |
|---------|------|
| **左欄 StepTimeline** | `mode="creative"` 變體；標籤 step.connector + connectorType icon |
| 右欄頁首 | step.name / status / connector chip |
| Tab: input/output | 文字 prompt / 生成輸出 |
| Tab: gallery | step.assets 渲染 `<AssetGallery>`（line 402） |
| Tab: review | step.assets 渲染 `<ReviewPanel>`（line 403） |

### 3. StepTimeline 元件 — `frontend/components/step-timeline.jsx`

| 細節 | |
|------|--|
| Props | `steps[]`, `selected`, `onSelect`, `mode` |
| 渲染每個 step | name + 狀態圖示 + duration |
| 點擊 | 呼叫 `onSelect(step.id)` 切換右欄 |
| 視覺差異 | mode='code' 線形時間軸；mode='creative' 多帶 connector chip |

### 4. Dashboard
- ActiveRunCard 顯示 `stepsDone / stepsTotal`，但**不顯示**個別 step

### 5. Insights
- 不直接顯示，但 `avgFixAttempts` 是「Fix Attempt N」step 的彙總

## 後端設計建議

- **動態追加 vs 固定**：Code Run 的 Fix Attempt 是動態（最多 5），Final Tests 與 Commit 是條件性。建議資料模型用「順序欄位 + 父 Run」而非預先 seed 8 個 row
- **`pending` step 的存在**：mock 資料 seed 了 pending step（`s6`–`s8`），是讓 UI 預先看到「總共會有 8 步」。後端可選擇：
  1. seed 完整骨架，逐步翻 status（與 mock 一致）
  2. 只 push 已完成 / 進行中的 step（前端用 step 模板補骨架）
  推薦 1，因為前端較單純
- **`testResults`、`diff`、`collectorBreakdown`、`assets` 子資源**：list endpoint 不要塞，走 `GET /api/runs/:runId/steps/:stepId` 按需載入；體積大（diff、assets）的可再拆 `:stepId/diff`、`:stepId/assets`
- **時間欄位一致**：`startedAt: 'HH:MM:SS'` 是顯示用；後端應同時供 ISO-8601。`duration` 同樣建議 `durationMs` + `durationLabel` 雙提供
- **Token 累計**：Step 完成 → Run.tokensUsed += step.tokens（in transaction）
- **subscribe**：Run 進入 `running` 後，每個 step 狀態變化都應 push SSE event：`{ type: 'step_update', stepId, status, duration, tokens }`
- **Step 的 connector 變更**：creative 的 connector 是設計時決定（c1=Claude, c3=Gemini…），但若使用者切換預設 Connector，**不應影響進行中的 Run**；建議 snapshot 在 step 上
- **failed step 的清理**：失敗時的 `output` 應保留錯誤摘要；Fix Attempt 進入時把 `step.input` 帶入「上一 step 的失敗摘要」即可（mock s5 的 input 即如此）
