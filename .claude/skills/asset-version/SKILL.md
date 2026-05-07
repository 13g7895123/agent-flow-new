---
name: asset-version
description: Use when designing the AssetVersion entity (one specific generation attempt of an Asset, with status pending/approved/rejected/generating). Covers schema, status flow, the per-version display in gallery thumbnails, lightbox switcher, and where it appears in the Creative Run UI.
---

# AssetVersion

## 一句話定義
**AssetVersion** 是一個 Asset 的單次生成結果。每個 version 有自己的狀態（pending / approved / rejected / generating）、產生它的 Connector、生成成本、以及（若 rejected）使用者給的 feedback。

## 後端 Schema

```ts
type AssetVersionStatus = 'generating' | 'pending' | 'approved' | 'rejected';

interface AssetVersion {
  v: number;                   // 1, 2, 3...（在同一 Asset / Scene 內遞增）
  status: AssetVersionStatus;
  connector: string;           // 'Gemini' / 'Runway' / 'Midjourney'
  cost: number | null;         // 0.04（generating 時為 null）
  feedback: string | null;     // 拒絕時的回饋；其餘為 null
  // Mock 預覽用
  color: string;               // '#1a2a4a' 純色 placeholder（正式應替換）
  // 建議擴充
  imageUrl?: string;
  thumbnailUrl?: string;
  prompt?: string;             // 這次生成用的完整 prompt（含 style + scene desc + previous feedback）
  generatedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  promptTokens?: number;
  generationTimeMs?: number;
}
```

> 來源：`frontend/lib/afh-data.js:309–336`（c3 step 內各 scene 的 versions 陣列）

## 狀態機

```
                ┌────────────┐
   建立 ────>   │ generating │
                └─────┬──────┘
                      │ 生成完成
                      ▼
                ┌──────────┐
                │ pending  │
                └──┬───┬───┘
                   │   │
                   │   └─ Reject + feedback ──> rejected ─[regenerate]──> 新 version (generating)
                   │
                   └─ Approve ──> approved
```

> rejected 與 approved 都是終態（terminal）；feedback 一旦寫入不可變，但 mock 沒處理 — 建議後端用 `feedbackImmutable: true`

## 內建統計（衍生）

```ts
// Mock 中 c3 step 的 8 張素材分布：
// scene-1: 3 versions (rejected, rejected, approved)
// scene-2: 2 versions (rejected, pending)
// scene-3: 1 version (pending)
// scene-4: 1 version (generating)
// 總計 = 8 versions
// pending = 3 → 對應 run.assetsPendingReview = 3
```

## API 端點

| 功能 | Method | Endpoint | 備註 |
|------|--------|----------|------|
| 取得單一 version | `GET` | `/api/runs/:runId/assets/:assetId/versions/:v` | 含完整 prompt / 大圖 URL |
| 提交審核 | `POST` | `/api/runs/:runId/assets/:assetId/review` | body: `{ versionId, decision, feedback? }` |
| 重新生成 | `POST` | `/api/runs/:runId/assets/:assetId/regenerate` | 建立新 version（status='generating'）|

## 出現在哪些頁面（非常詳盡）

### 1. Creative Run Detail — `frontend/components/afh-creative.jsx`

#### AssetGallery（line 12）— 縮圖網格
| UI 元素 | 行號 | 細節 |
|---------|------|------|
| 縮圖背景色 | line 37 區段 | `version.color`（mock）或 `thumbnailUrl`（正式） |
| 縮圖點擊 | 37 | `ver.status !== 'generating' && setLightbox({ si, vi })` — generating 時不可點 |
| 狀態 badge 角標 | （內部） | approved=綠勾、rejected=紅叉、pending=灰、generating=spinner |
| 版本號 | | 角落顯示 `v{n}` |
| connector chip | | 角落顯示 'Gemini' 等 |
| cost 標示 | | `$0.04` |

#### Lightbox（line 67）
| UI 元素 | 行號 | 細節 |
|---------|------|------|
| 大圖 | 72 + | 全螢幕，背景 `version.color` |
| **版本切換器** | 91 | 同 Asset 的所有 version 縮圖橫排，點擊切換 lightbox 顯示 |
| 按鈕 active 狀態 | 91 | active version 加邊框 |
| Approve | 102 | `onReview(scene.sceneId, ver.v, 'approve', '')` → `setLightbox(null)` |
| Reject | 103 | 開啟 feedback 輸入或關閉 lightbox |
| feedback 顯示（rejected 版本） | | 大圖下方顯示 `version.feedback` 文字 |

#### ReviewPanel（line 120）
| UI 元素 | 細節 |
|---------|------|
| 列出所有 pending versions | `assets.filter(a => a.versions.some(v => v.status === 'pending'))` |
| 每筆審核卡 | 顯示 thumbnail、prompt 摘要、Approve / Reject / Retry |
| Reject feedback textarea | 必填或可空 |
| 快速 feedback chips | 「風格不對」「構圖重來」「主體比例不對」等 |
| 批次通過 button | 一次 approve 所有 pending |

### 2. Dashboard
- 不直接顯示 version；但 `assetsPendingReview` count = Σ versions.status='pending'
- ActiveRunCard 紫色 chip 顯示「3 待審」即此數字

### 3. Runs（List）
- mode='creative' 的 RunRow 顯示 `assetsGenerated`（= 總 version 數）

### 4. Insights
- 未來可加：approval rate 由 `approved / (approved + rejected)` 計算；retry-per-asset 平均次數

## 後端設計建議

- **不可變更**：approved 與 rejected 的 version 不能改 status（只能新增 version）。後端用 status 機 enforce
- **feedback 流轉**：被 rejected 的 feedback 應在下一次 regenerate 時注入 prompt（task layer 的 `{review_feedback}` 變數）
  - 不只插入最後一筆，可累積前 N 筆 feedback（建議 3 筆，避免 prompt 過長）
- **storage 清理**：rejected version 的 binary 可在 `Run.status='success'` 後 30 天清除；approved 與 finalized 的長期保留
- **prompt 紀錄**：每個 version 的 prompt 應完整存（不脫水），便於事後 reproduce / 除錯
- **generating timeout**：超過 N 分鐘還在 generating 應自動 fail 並建立新 version（避免卡死）
- **同一 v 編號不重複**：v 在 Asset 內遞增；後端建立 version 時應在 transaction 內 SELECT MAX + 1
- **regenerate 觸發後的 cost 估算**：應在前端 confirm 中顯示「將額外消耗 ~$0.04」
- **預設色塊 → 真實圖**：上線前要把 `color` 欄位改為 `imageUrl`、`thumbnailUrl`，並保留 `color` 為 fallback 或佔位
