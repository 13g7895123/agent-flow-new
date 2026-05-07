---
name: code-diff
description: Use when designing the CodeDiff sub-resource of a Step (the before/after produced by Generate Code). Covers schema, split vs unified rendering modes, line-level highlighting, and the DiffViewer component.
---

# CodeDiff

## 一句話定義
**CodeDiff** 是 Code Run 中「Generate Code」步驟的產出，描述某檔案的 before / after 完整內容（或 hunk）。前端以 `DiffViewer` 元件呈現 split 與 unified 兩種檢視模式。

## 後端 Schema

```ts
interface CodeDiff {
  before: string;        // 修改前完整檔案內容（mock 是片段，正式可改 patch）
  after: string;         // 修改後完整檔案內容
  // 建議擴充
  filePath?: string;     // 'routes/index.js'
  language?: string;     // 'javascript' / 'typescript' / 'python' …
  changeKind?: 'create' | 'modify' | 'delete' | 'rename';
  renameTo?: string;     // changeKind === 'rename' 時
  hunks?: {              // 大檔案應用 hunk 而非全文比對
    oldStart: number; oldLines: number;
    newStart: number; newLines: number;
    text: string;
  }[];
}

// 一個 Step 通常會修多個檔案 — 建議擴充為陣列
interface StepDiffs {
  files: CodeDiff[];
  summary: { added: number; removed: number; filesChanged: number };
}
```

> 來源：`frontend/lib/afh-data.js:242–258`（s3 step 內的 `diff: { before, after }`，mock 只示範一個檔案）

## 渲染模式

| 模式 | 說明 | 元件 |
|------|------|------|
| `split` | 左右並排 before / after | DiffViewer 預設 |
| `unified` | 上下單欄，新增綠色 `+`、刪除紅色 `-` | DiffViewer toggle |

## API 端點

| 功能 | Method | Endpoint | 備註 |
|------|--------|----------|------|
| 取得 step 的 diff | `GET` | `/api/runs/:runId/steps/:stepId` | 含 `diff` 欄位 |
| 取得 step 的 diff（拆分） | `GET` | `/api/runs/:runId/steps/:stepId/diff` | 多檔案時建議走獨立 endpoint |

> 沒有 mutation endpoint：CodeDiff 是 Step 的副產出，不可手動編輯（要改就重跑 Step）

## 出現在哪些頁面（非常詳盡）

### 1. Code Run Detail — `frontend/components/afh-runs.jsx` `DiffViewer` (line 13)

**唯一互動位置**

| UI 區塊 | 行號 | 細節 |
|---------|------|------|
| 模式切換 buttons | 14–28 | `mode='split' / 'unified'`，state `useState('split')` |
| split / unified 切換 | 27 | toggle 按鈕 |
| **Split 渲染** | （內部 split 區） | 左 before、右 after，行號對齊 |
| **Unified 渲染** | | 行 prefix `+`/`-`，配色綠/紅 |
| 每行高亮 | | 新增行底色 `rgba(34,197,94,0.08)`；刪除行底色 `rgba(239,68,68,0.08)` |
| 等寬字型 | | `JetBrains Mono, monospace` |

**啟用條件**：`step.diff` 存在且 `activeTab === 'diff'`（line 292）

### 2. Creative Run
- **不使用** CodeDiff（creative 沒有程式碼產出）

### 3. 其他頁面
- 不直接顯示，但 Insights 可加未來：每日新增行數 / 修改檔數彙總

## 後端設計建議

- **大檔案處理**：mock 是把整段 before/after 字串塞進 step.diff。實務應用 `unified diff format`（patch）並 by hunks 傳，避免 50KB 檔案連 5 行改也回 100KB
- **二進位檔案**：`changeKind` 加 binary 處理；前端顯示「Binary file changed」即可
- **多檔案 vs 單檔**：mock schema 只有單檔，**強烈建議改為 `files: CodeDiff[]`**，符合真實情況（一次提交常涉及 routes、models、tests、migrations 多檔）
- **語法高亮**：建議後端不處理，前端用 highlight.js / shiki 處理；後端只回 `language` 提示
- **renderable size limit**：對 >1000 行的 diff，回傳 `truncated: true` 與 `viewFullUrl`，避免拖垮渲染
- **與 Commit 步驟對齊**：s3 Generate Code 的 diff 應與 s8 Commit & Summary 的 final diff 一致（除非中間有 Fix attempt 改了東西，這時候 diff 應 merge）。建議 s8 直接從 git commit 抓 diff，避免分歧
- **行內 inline diff**：split 模式下若同一行只改字串，可用 char-level diff 高亮；可由前端做（`diff-match-patch` lib）
