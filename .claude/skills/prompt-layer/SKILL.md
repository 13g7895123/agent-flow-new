---
name: prompt-layer
description: Use when designing the three-layer prompt stack (Global / Project / Task) used inside Role objects in Agent Flow Harness. Covers schema, variable interpolation, token estimation, syntax highlighting, and the editor UI on the Roles page.
---

# PromptLayer

## 一句話定義
**PromptLayer** 是 Role 內部的三層提示詞結構（Global → Project → Task），於 runtime 由上而下堆疊成最終 system prompt。每層都有獨立的 token 估算與變數插值規則。

## 後端 Schema

```ts
type LayerId = 'global' | 'project' | 'task';

interface PromptLayers {
  global: string;       // 角色守則（不依賴專案 / 任務）
  project: string;      // 專案 scope（會被 Project context 變數插值）
  task: string;         // 任務 scope（會被當前 Run 的 task 變數插值）
}

// runtime 組合後
interface ComposedPrompt {
  systemPrompt: string;          // global + '\n\n' + project + '\n\n' + task
  totalTokens: number;
  perLayerTokens: { global: number; project: number; task: number };
  unresolvedVariables: string[]; // 未注入到值的 {var_name}
}
```

> 來源：`frontend/lib/afh-data.js:424–456` (Role.promptLayers)

## 三層的語意分工

| 層級 | Scope | 何時注入 | 變數來源 |
|------|-------|----------|----------|
| **Global** | 跨專案 | Role 建立時固定 | 無（純角色守則） |
| **Project** | 同一 Project 內所有 Run 共用 | Run 啟動時 | Project.stack / Project.testCmd / 自訂 schema_context、style_prompt 等 |
| **Task** | 單次 Run | Run 啟動時 | Run.task（描述）、Run.testFailures（fix attempt 階段）、Scene context（creative） |

## 變數插值

- 標記語法：`{variable_name}`
- 高亮顯示（前端）：`/(\{[^}]+\})/g` → `var(--syntax-variable)`（紫色，`afh-pages.jsx:172`）
- 註解高亮：`/(#.*)/gm` → `var(--syntax-comment)`（灰色，`afh-pages.jsx:173`）
- 關鍵字高亮：`\b(Rules:|Note:|Stack:|Project:|Scene:)\b` → `var(--syntax-keyword)`（青色，`afh-pages.jsx:174`）

### 內建變數清單（依 mock 觀察）

```yaml
# Code Mode (Backend / Security / Data Engineer)
project_name:    Project.name
stack:           Project.stack.join(', ')
test_cmd:        Project.testCmd
schema_context:  自外部 schema 蒐集（搭配 sql-schema-reader skill）
code_patterns:   自既有檔案抽出
security_policy: Project meta（自定義）
pipeline_config: Project meta（自定義）
target_files:    Plan 步驟產出
test_failures:   上一輪 Run Tests 步驟的 TestResult[].error
task_description: POST /api/runs body.task

# Creative Mode (Creative Director)
brand_guidelines: Project meta
style_prompt:     Style Reference 步驟產出（c2 step output）
aspect_ratio:     Project meta 或 Run 啟動時參數
scene_description: Step c3 內各 Scene 的 sceneName
narrative_context: 上下文場景串接
review_feedback:   AssetVersion[].feedback 累計
```

## Token 估算

- **前端粗估**：`Math.round(text.length / 3.8)`（`afh-pages.jsx:169`）
- **後端精算**：建議用提供商 tokenizer（Anthropic SDK 的 `count_tokens`、Google `count_tokens` 等），但前端不應強制等待 — 用粗估即時更新，PATCH 後再用精算更新顯示
- **總 Token = Σ 三層 tokens**（`afh-pages.jsx:178`）

## 對外 API（隸屬 Role）

| 功能 | Method | Endpoint | 備註 |
|------|--------|----------|------|
| 取得三層 | `GET` | `/api/roles/:roleId` | response 含 `promptLayers` |
| 部分更新某幾層 | `PATCH` | `/api/roles/:roleId/prompts` | body: `{ global?, project?, task? }` |
| 預覽組合 | `POST` | `/api/roles/:roleId/preview` | body: `{ projectId, taskDescription }` → 回 ComposedPrompt |

## 出現在哪些頁面（非常詳盡）

### Roles 頁 — `frontend/components/afh-pages.jsx`

**唯一互動位置**，元件 `PromptLayerEditor` 從 line 156 起：

| UI 區塊 | 行號 | 功能 |
|---------|------|------|
| **Layer selector tabs** | 184–196 | 三個按鈕切換 active layer，每個顯示「`{label}` `~{tokens} tok`」 |
| **Total tokens** | 198 | 即時顯示三層合計 token |
| **Discard 按鈕** | 199 | dirty 時還原為 props.role.promptLayers |
| **Save 按鈕** | 200 | dirty 時 enable，按下顯示「✓ 已儲存」2 秒 |
| **Editor 標頭列** | 205–211 | 顯示「`{activeLayer} prompt`」、變數圖例、關鍵字圖例 |
| **Textarea** | 212–222 | `prompts[activeLayer]` 雙向綁定，monospace、高 260px |
| **Stack preview 區塊** | 226–237 | 三條長條視覺化各層比例，active layer 高亮為其顏色 |

#### Layer 顏色（`afh-pages.jsx:163–167`）
- Global → `var(--accent)`（藍）
- Project → `var(--status-success)`（綠）
- Task → `var(--syntax-variable)`（紫）

### 其他頁面
- **不直接編輯**，但於 runtime 影響：所有 Run Detail（Code / Creative）顯示的 step input/output 都是這三層 + 變數插值的下游結果

## 後端設計建議

- **層級不可空 / 可空**：Global 必填，Project 與 Task 可空字串。空字串時組合時應**省略該段** + 兩個換行，避免 prompt 出現「```Global... \n\n \n\n Task...```」這種空段
- **變數白名單**：在 PATCH 時 lint 變數名是否在 allowed list；未知變數回 200 + warning，不阻止存檔
- **未解析變數**：runtime 注入時若 `{var_name}` 找不到值，**保留原文**並把名字加入 `unresolvedVariables[]`，後端日誌打 warning，前端 Run Detail 可在 step.warnings 顯示
- **Save 與 Run 的時序**：使用者剛 Save 時還在執行的 Run **不應**接受新版本（避免提示詞中途換掉導致行為不一致）。建議在 Run 啟動時 snapshot promptLayers 進 Run 資料（與 agent skill 中的 promptStackSnapshot 一致）
- **Concurrent edit**：Roles 通常少人同時改，但仍建議 ETag / If-Match 樂觀鎖
- **語法錯誤防呆**：對 Markdown / JSON-fenced 內容不做硬解析，但可警告「偵測到未閉合的 ```」
