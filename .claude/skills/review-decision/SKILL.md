---
name: review-decision
description: Use when designing the ReviewDecision entity (the human action of approve / reject / regenerate on an AssetVersion). Covers schema, single vs batch review API, quick-feedback presets, and where it appears in Lightbox / ReviewPanel / batch operations.
---

# ReviewDecision

## 一句話定義
**ReviewDecision** 是使用者對單一 `AssetVersion` 的審核動作紀錄，包含 decision（approve / reject / regenerate）與選填的 feedback 文字。它驅動 AssetVersion 狀態轉移與下一輪 regenerate 的 prompt 注入。

## 後端 Schema

```ts
type Decision = 'approve' | 'reject' | 'regenerate';

interface ReviewDecision {
  id: string;
  runId: string;
  assetId: string;
  versionId: string;          // 對應 AssetVersion.v 或內部 versionId
  sceneId: string;            // 反正規化方便查詢
  decision: Decision;
  feedback: string | null;    // approve 時通常為 null
  reviewedBy: string;         // userId
  reviewedAt: string;         // ISO-8601
  // 批次審核時記錄
  batchId?: string;           // 同一批次的 decisions 共用
  // regenerate 觸發資訊
  regenerationVersionId?: string;  // decision='regenerate' 時，新建立的 version
}
```

> mock 沒有獨立資料；只有 onReview callback 與 version.status / version.feedback 反映結果

## Decision 語意

| decision | 對 AssetVersion 的副作用 | 對 Run 的副作用 |
|----------|--------------------------|-----------------|
| `approve` | status: pending → approved | 若 step 內全 approved → step success |
| `reject` | status: pending → rejected；feedback 寫入 | 不直接影響 step；通常人會跟 regenerate |
| `regenerate` | 為同一 Asset 建立新 version（status='generating'） | step 仍 waiting_review |

## 快速 feedback 預設

前端建議提供（`frontend/components/afh-creative.jsx` ReviewPanel 內）：
- 「風格不對」
- 「構圖重來」
- 「主體比例不對」
- 「色調太亮」
- 「太抽象 / 概念不清楚」
- 「品牌 logo 不夠突出」

這些不是 enum，而是輸入框的 quick-insert chip。後端不限制 feedback 內容。

## API 端點

| 功能 | Method | Endpoint | Body | 備註 |
|------|--------|----------|------|------|
| 單筆審核 | `POST` | `/api/runs/:runId/assets/:assetId/review` | `{ versionId, decision, feedback? }` | |
| 批次審核 | `POST` | `/api/runs/:runId/assets/batch-review` | `{ items: [{ assetId, versionId, decision, feedback? }] }` | 共享 batchId |
| 重新生成（捷徑） | `POST` | `/api/runs/:runId/assets/:assetId/regenerate` | `{ feedback? }` | 內部會建立 reject decision + 新 generating version |
| 取得審核歷史 | `GET` | `/api/runs/:runId/reviews` | `?assetId=` filter | 用於 audit |

## 驗證規則

- 對已是 approved / rejected 的 version 再 review → 422（version 已 terminal）
- `decision='reject'` 時建議 feedback 至少 3 字（前端強制非空，後端可放寬）
- `decision='approve'` 時 feedback 應為 null 或忽略
- `decision='regenerate'` 必須帶 feedback（語意：「我希望這樣改進」）

## 出現在哪些頁面（非常詳盡）

### 1. Creative Run Detail — `frontend/components/afh-creative.jsx`

#### Lightbox（line 67）
| UI 區塊 | 行號 | decision 觸發 |
|---------|------|---------------|
| Approve button | 102 | `onReview(scene.sceneId, ver.v, 'approve', '')` → 關閉 lightbox |
| Reject button | 103 | 預期觸發 `'reject'`（mock 沒帶 feedback 輸入流程，需擴充）|
| feedback 顯示 | | 切換到 rejected version 時顯示 `version.feedback` |

#### ReviewPanel（line 120）
| UI 區塊 | decision 觸發 | 細節 |
|---------|---------------|------|
| Approve button | `'approve'` | 單筆 approve，feedback=null |
| Reject + textarea | `'reject'` | 提交時帶 textarea 內容；feedback 預設 chip 點擊插入文字 |
| Retry button | `'regenerate'` | 必須先填 feedback；觸發新 version 生成 |
| **批次通過 button** | `'approve'` × N | 對所有 pending version 並發 approve；後端走 batch-review |

#### onReview signature
`(sceneId, version, decision, feedback) => void`（line 102 看出）— 這個是前端的 callback 簽名；轉成 API call 時 sceneId + version 應 resolve 成 versionId

### 2. Dashboard
- 不直接審核；但 needsReview 計數會在 review 完成後即時減少（建議 SSE 推送）

### 3. Runs（List）
- 不審核

### 4. Insights
- 未來可加：「人均審核時間」、「approve 率」、「被 reject 最多次的 connector」、「最常見 feedback 詞彙」

### 5. Code Run / Roles / Skills / Connectors / Projects
- **不適用**

## 後端設計建議

- **Audit-only**：ReviewDecision 寫入後不可改 / 刪（不可變紀錄）。要修正只能新增另一筆「reverse」decision 並在 UI 上標 superseded
- **批次原子性**：batch-review 應是一個 transaction；中途有任一筆 422，整批 rollback 並回詳細失敗清單
- **對 regenerate 的 feedback**：自動寫入下一個 AssetVersion 的 `prompt` 欄位（task layer 的 `{review_feedback}` 變數）
- **與 EscalationRequest 區隔**：creative 的「不滿意 → regenerate」走 ReviewDecision；code 的「不會修 → 給 hint」走 EscalationRequest。兩者不相通
- **權限**：誰能審核？建議綁 Project owner / 指定的 review group
- **feedback 中的敏感詞**：是 user 自由輸入，後端建議過濾 PII（信用卡號等）後再注入下一個 prompt
- **rate limit**：批次通過避免一次 1000+ 筆瘋狂打 Connector regenerate；後端應 cap N（如一次最多 50 個 regenerate 動作）
- **可見性**：multi-user 的場景下，建議 review history 對所有 viewer 可見，且 feedback 顯示「by @username」
