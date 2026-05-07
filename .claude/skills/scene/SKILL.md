---
name: scene
description: Use when designing the Scene entity in Creative Run (a single shot/scene in a video script that has multiple Asset versions). Covers schema, relationship to Asset, and how Scenes are rendered in the AssetGallery.
---

# Scene

## 一句話定義
**Scene** 是 Creative Run「Scene Image Generation」步驟產出的單位 — 一個影片中的一個鏡頭 / 場景。一個 Scene 下會有一個 Asset，但該 Asset 通常會經過多次生成、得到多個 AssetVersion（含 pending、approved、rejected、generating 各狀態）。

## 後端 Schema

```ts
interface Scene {
  sceneId: string;            // 'scene-1'
  sceneName: string;          // 'Opening — Brand Statement'
  aspectRatio: string;        // '16:9'
  // 在 mock 中 Scene 直接帶 versions，但語意上：
  // Scene 1:1 Asset N:M Version；目前實作是把這三層合一
  versions: AssetVersion[];   // 詳見 asset-version skill
  // 建議擴充
  description?: string;       // 場景敘述（給 image gen 的 prompt）
  durationSec?: number;       // 對應腳本時間段（如 '0:00–0:08' 即 8 秒）
  scriptIndex?: number;       // 在 c1 Script 中的順序
  styleAnchor?: string;       // 從 c2 Style Reference 來的色票
}
```

> 來源：`frontend/lib/afh-data.js:306–337`（c3 step 的 `assets[]`，在 mock 中每個元素就是一個 Scene）

## 與其他物件的關係

```
Step (c3 Scene Image Generation)
  └─ assets: Scene[] (mock 暫稱 assets，實際是 Scene 陣列)
       └─ versions: AssetVersion[]
              ↑ 一個 Scene 多次嘗試，產生多個 version

Step (c1 Script Generation)
  └─ output: 6-scene script  ──> 推導出 Scene 列表
```

> ⚠️ mock 把 Scene 與 Asset 概念合併到同一陣列；正式設計應拆 `scenes` 與 `assets` 兩表，或保持「Scene 內含 versions」但明確區分（建議後者，更貼近 UI 模型）

## API 端點

| 功能 | Method | Endpoint | 備註 |
|------|--------|----------|------|
| 取得某 step 的 scenes | `GET` | `/api/runs/:runId/steps/:stepId/assets` | mock 用 assets 但回傳的是 Scene 陣列 |
| 取得單一 scene（含所有 versions） | `GET` | `/api/runs/:runId/scenes/:sceneId` | 建議擴充 |
| 為某 scene 新增一個 version（regenerate） | `POST` | `/api/runs/:runId/scenes/:sceneId/regenerate` | body: `{ feedback?, aspectRatio? }` |

## 出現在哪些頁面（非常詳盡）

### 1. Creative Run Detail — `frontend/components/afh-creative.jsx`

#### AssetGallery（line 12）
| UI 區塊 | 行號 | 細節 |
|---------|------|------|
| Scenes 迭代 | （內部 map） | 每個 scene 一行 |
| **Scene 列頭** | | 顯示 sceneName + aspectRatio + 版本數 |
| Scene 內版本縮圖網格 | line 37 | 每個 version 一格縮圖（用 `version.color` 預覽）|
| 點擊 version → 開啟 Lightbox | 37 | `setLightbox({ si: sceneIdx, vi: versionIdx })` |
| status='generating' 不可點 | 37 | `ver.status !== 'generating' &&` |

#### Lightbox（line 67）
| UI 區塊 | 行號 | 細節 |
|---------|------|------|
| 全螢幕 backdrop | 72 | 點擊關閉 |
| 大圖背景色 | | `version.color` |
| 關閉按鈕 | 82 | |
| **Scene 標題列** | | sceneName 在 lightbox 上方 |
| **版本切換器** | 91 | 同 Scene 的所有 version 縮圖 |
| Approve / Reject 按鈕 | 102–103 | 詳見 [review-decision skill](../review-decision/SKILL.md) |

#### ReviewPanel（line 120）
| UI 區塊 | 細節 |
|---------|------|
| pending 篩選 | 只顯示有 pending version 的 Scene |
| 每個 Scene 一個審核卡 | 顯示 sceneName + 待審 version 數 |

### 2. 其他頁面
- **不直接顯示**。但 Run 列表中 `assetsGenerated` 約等於 `Σ scenes[].versions.length`

## 後端設計建議

- **拆 Scene 與 Asset**：建議
  ```ts
  interface Scene { sceneId; runId; sceneName; aspectRatio; ... }
  interface Asset { assetId; sceneId; ... }   // 1 Scene → 1 Asset (主作品)
  interface AssetVersion { versionId; assetId; ... }  // 多版本嘗試
  ```
  雖然當前 UI 不需要分這麼細，但 backend 要彈性（例如未來 1 Scene 同時試 2 種風格 → 2 Asset）

- **sceneId 命名**：建議 `${runId}-scene-${index}`，避免跨 Run 衝突

- **aspectRatio enum**：常見值 `'16:9' | '9:16' | '1:1' | '4:5'`，建議 enum 限制 + 預設 16:9

- **與 c1 Script 的關聯**：
  - script step 的 output 要結構化 → `{ scenes: [{ sceneId, sceneName, durationSec, description }, ...] }`
  - c3 進入時自動建立 Scene 列表（not just c3 開始才生）
  - 這樣 c3 進度可顯示「6 scenes，目前 3 已生成、3 generating」

- **regenerate 行為**：呼叫 regenerate 不應改 sceneId，只新增一個 AssetVersion；feedback 字串注入 Connector 的 prompt

- **靜態 placeholder 色票**：mock 用 `version.color` 替代真實 image URL；正式時應替換為 `imageUrl: string` + `thumbnailUrl: string`（CDN）

- **state derivation**：Scene.status（衍生欄位）= versions 中是否有 approved / 全 rejected / 仍 pending 等。後端可預先計算
