---
name: asset
description: Use when designing the Asset entity (a generated creative artifact that belongs to a Scene and contains multiple AssetVersion attempts). Covers schema, relationship to Scene and AssetVersion, and where Asset surfaces in the gallery and review flows.
---

# Asset

## 一句話定義
**Asset** 是 Creative Run 為某個 Scene 產出的「主作品」，其下含多個 `AssetVersion`（不同生成嘗試）。在 mock 中 Asset 概念被合併進 Scene（每個 scene 直接帶 versions），但語意上 Scene → Asset → Version 是三層。

## 後端 Schema

```ts
interface Asset {
  assetId: string;            // 'asset-scene-1' 或 sceneId 同步
  sceneId: string;            // FK to Scene
  runId: string;              // FK to Run
  type: 'image' | 'video' | 'audio' | 'text';
  // 主版本（最新 approved 或最新 generation）
  primaryVersionId?: string;
  // 衍生狀態
  status: 'generating' | 'pending_review' | 'approved' | 'rejected' | 'finalized';
  // 計數
  versionsTotal: number;
  versionsPending: number;
  versionsApproved: number;
  versionsRejected: number;
  // 規格
  aspectRatio: string;        // '16:9'
  resolution?: string;        // '1920x1080'
  durationSec?: number;       // type='video' / 'audio' 時
  // 時序
  createdAt: string;
  approvedAt?: string;
}
```

> mock 中 Asset = Scene 的 versions 陣列容器，沒有獨立 id；`frontend/lib/afh-data.js:306–337`

## 狀態機

```
                  ┌─────────────┐
   建立 ────────> │ generating  │
                  └──────┬──────┘
                         │ 至少一 version 進 pending
                         ▼
                  ┌────────────────┐
                  │ pending_review │
                  └──┬───┬──┬──────┘
   有 version reject │   │  │ 全 reject + 用戶 regenerate
                    ▼   │  ▼
              ┌──────────┐  ┌─────────────┐
              │ approved │  │ rejected    │
              │ (有任一  │  │ (全 reject)  │
              │  approved│  └─────────────┘
              └──┬───────┘
                 │ Run final review pass
                 ▼
              ┌────────────┐
              │ finalized  │
              └────────────┘
```

## API 端點

| 功能 | Method | Endpoint | 備註 |
|------|--------|----------|------|
| 列出某 Run / Step 的 Assets | `GET` | `/api/runs/:runId/steps/:stepId/assets` | mock |
| 取得單一 Asset（含 versions） | `GET` | `/api/runs/:runId/assets/:assetId` | mock |
| 提交審核（轉送至最新 version） | `POST` | `/api/runs/:runId/assets/:assetId/review` | 詳見 review-decision skill |
| 重新生成（新增 version） | `POST` | `/api/runs/:runId/assets/:assetId/regenerate` | 新增一筆 version |
| 批次審核 | `POST` | `/api/runs/:runId/assets/batch-review` | body: `{ items: [{ assetId, decision, feedback? }] }` |

## 出現在哪些頁面（非常詳盡）

### 1. Creative Run Detail — `frontend/components/afh-creative.jsx`

#### AssetGallery（line 12）
| 細節 | |
|------|--|
| Props | `assets`（其實是 scenes）、`onReview` |
| 每個 asset / scene 列 | 顯示 sceneName、aspectRatio、各 version 縮圖 |
| 縮圖點擊 | `setLightbox({ si, vi })` 開啟 Lightbox |
| **mergedAssets** | 在 CreativeRunDetail 中合併 c3、c4 等 step 的 assets（line 402） |

#### ReviewPanel（line 120）
| 細節 | |
|------|--|
| Props | `assets`（pending 過濾後）、`onReview` |
| 每個 asset 一張審核卡 | 顯示縮圖、Approve / Reject / Retry buttons |
| Reject 時可填 feedback textarea | 詳見 review-decision skill |
| **批次通過** | 一鍵 approve 所有 pending |
| **快速回饋標籤** | 「風格不對」、「構圖重來」等預設 chip 點擊插入 feedback |

#### Lightbox（line 67）
| 細節 | |
|------|--|
| 顯示單一 Asset 的單一 Version 大圖 |
| 上方有 Asset.sceneName 標題 |
| 下方有 Asset 的所有 versions 縮圖切換器（line 91） |
| Approve / Reject 操作（line 102–103）→ `onReview(scene.sceneId, ver.v, decision, feedback)` |

### 2. Dashboard — `frontend/components/afh-dashboard.jsx`
- **needsReview StatCard**（line 152）：count = Σ runs[].assetsPendingReview
- ActiveRunCard 顯示 `assetsPendingReview` chip

### 3. Runs（List）
- mode='creative' 的 RunRow 顯示 `assetsGenerated` 與 `assetsPendingReview` 計數

### 4. Insights
- `creativeApproved / creativeRuns` 的 ratio 是 Asset 審核結果的彙總

### 5. Code Run / Roles / Skills / Connectors
- **不使用** Asset 概念（mode='code' 沒有 Asset）

## 後端設計建議

- **storage**：實際生成的圖片 / 影片應存 S3 / GCS，Asset 只存 metadata + URL
- **CDN URL**：每個 AssetVersion 應有 `imageUrl`、`thumbnailUrl`（不同 size），mock 用色塊代替
- **lifecycle**：rejected 的 versions 是否要保留？建議保留 metadata（含 feedback）但可清掉 binary（節省 storage）
- **idempotent regenerate**：若使用者連點 Retry，應防 spam（debounce + 後端 rate limit）；同一 assetId 同時只允許一個 generating version
- **批次審核 transaction**：批次 approve 應 all-or-nothing，避免部分成功部分失敗的 inconsistent 狀態
- **與 Run.status 連動**：當所有 Assets 都 approved → step.status='success' → 進下一步；當有 pending → run.status='waiting_review'
- **finalized 的時機**：所有 c3-c5 step 結束後（c6 Final Review 完成）才把 Asset 標 finalized；前端顯示已不可變
- **versioning 限制**：建議 maxVersionsPerAsset（例如 10），避免無限重試耗 quota；達上限應 escalate 提示「請更換 Connector 或修改 brief」
