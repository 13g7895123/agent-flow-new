---
name: role
description: Use when designing or persisting the Role entity in Agent Flow Harness — Role defines an Agent's persona (Backend Engineer, Security Engineer, Creative Director...) and owns the three-layer prompt stack. Includes schema, mode constraint, API endpoints, and every page that reads or edits Role data.
---

# Role

## 一句話定義
**Role** 是 Agent 的「人格與規則集」。每個 Role 綁定一個 mode（code 或 creative），並包含三層 promptLayers（Global / Project / Task）。Project 透過 `activeRole` 字串綁定一個 Role。

## 後端 Schema

```ts
interface Role {
  id: string;                     // 'backend-engineer'，slug
  name: string;                   // 'Backend Engineer'，顯示名稱（被 Project.activeRole 引用）
  mode: 'code' | 'creative';      // 不可變更
  description: string;            // 'API endpoints, database migrations, background jobs'
  promptLayers: {
    global: string;               // 跨專案的角色守則
    project: string;              // 專案特化（含 {project_name}、{stack}、{test_cmd}…變數）
    task: string;                 // 任務特化（含 {task_description}、{test_failures}…變數）
  };
  createdAt?: string;
  updatedAt?: string;
}
```

> 來源：`frontend/lib/afh-data.js` line 420–457 (`ROLES`)

## 變數插值規則

PromptLayer 字串中以 `{var_name}` 標記變數，於 runtime 注入：
- **Project 層常用**：`{project_name}`、`{stack}`、`{test_cmd}`、`{schema_context}`、`{code_patterns}`、`{security_policy}`、`{pipeline_config}`、`{brand_guidelines}`、`{style_prompt}`、`{aspect_ratio}`
- **Task 層常用**：`{task_description}`、`{target_files}`、`{test_failures}`、`{scene_description}`、`{narrative_context}`、`{review_feedback}`

> 變數正規式：`/\{[^}]+\}/g`（見 `frontend/components/afh-pages.jsx:172`）。若變數無對應值，後端應**保留原文**並紀錄 warning，不要 silent drop（見 agent skill 第 4 點）。

## API 端點

| 功能 | Method | Endpoint | 備註 |
|------|--------|----------|------|
| 列出全部 | `GET` | `/api/roles` | 用於 Roles 頁列表、Project 表單下拉 |
| 取得單一 | `GET` | `/api/roles/:roleId` | 含 promptLayers |
| 部分更新 prompts | `PATCH` | `/api/roles/:roleId/prompts` | body: `{ global?, project?, task? }` |
| 完整更新 | `PATCH` | `/api/roles/:roleId` | name / description / promptLayers |
| 建立 | `POST` | `/api/roles` | mode 必填且不可後修 |
| 刪除 | `DELETE` | `/api/roles/:roleId` | 若有 Project.activeRole 引用，回 409 |

## 驗證規則
- `mode` 創建後鎖定
- `promptLayers.global` 不可空（Role 之所以是 Role 的核心）；`project`、`task` 可為空字串
- `name` 唯一（因為 Project.activeRole 用 name 綁定）

## 出現在哪些頁面（非常詳盡）

### 1. Roles 頁 — `frontend/components/afh-pages.jsx` `RolesPage` (line 243)
**Role 的主要管理介面**
- **左側 Role 列表**（line 254）：渲染 `ROLES.map`，每張卡片顯示
  - `ModeBadge mode={r.mode}`（line 261）
  - `r.name`（line 262）
  - `r.description`（line 264）
- **右側編輯區**（line 271）：選中 Role 時顯示 `<PromptLayerEditor role={role} />`（line 278）
  - 詳見 [prompt-layer skill](../prompt-layer/SKILL.md)
- 「Save」→ `PATCH /api/roles/:id/prompts`
- 「Discard」→ 還原 `prompts` 為 `role.promptLayers` 原值

### 2. Projects 頁 — `frontend/components/afh-pages.jsx` `ProjectsPage` (line 388)
- 詳細區「Active Role」input（line 478）：值為 Role.name 字串
- 後端應提供 `GET /api/roles?mode=:projectMode` 給前端做下拉選單（目前 mock 是 free text）

### 3. Run Detail（Code & Creative）
- 頁首 meta 列顯示 `run.role`（`afh-runs.jsx:241` 附近、`afh-creative.jsx:362` 附近）
- Run 紀錄中 `role` 欄位是 Role.name 字串（snapshot），**不是** roleId
  - 這意味著若 Role 改名，歷史 Run 不會自動同步——這是設計取捨；若要追蹤建議在 Run 上同時存 `roleId` snapshot

### 4. Skills 頁 — `frontend/components/afh-pages.jsx` `SkillsPage` (line 309)
- 表格「Roles」欄（line 350）：顯示 `skill.roles[]`，內容是 Role.name 字串陣列
- 此處 Role 是「**哪些角色可用此 Skill**」的 M:N 反向視圖

### 5. Dashboard
- ActiveRunCard、RecentRuns 顯示 `run.role` 字串
- 不直接編輯 Role

### 6. Command Palette
- 目前 mock 不索引 Role，但建議擴充加入「Roles」分類（建立 → `setPage('roles')` 並選中該 Role）

## 後端設計建議

- **Role.name 與 Project.activeRole 的綁定**：mock 用名稱，正式建議
  1. 對外 DTO 維持 `activeRole: string`（顯示名）
  2. 內部用 `active_role_id` FK
  3. 改名時自動同步所有 Project 的對外 string（在 commit transaction 內）
- **Mode 一致性**：建立 Run 時應檢查 `Role.mode === Project.mode`，否則 422
- **Prompt 變數白名單**：建議後端維護一份 `ALLOWED_VARS` 白名單（`['project_name', 'stack', 'test_cmd', ...]`），Save 時 lint 出未知變數並回 warning
- **Versioning**：Roles 變更會影響所有未來 Run，建議 `PATCH /api/roles/:id/prompts` 留下版本號，並在 Run 紀錄 `roleVersionAtRunTime`，方便事後 reproduce
- **Token 估算**：前端 `countTokens = t => Math.round(t.length / 3.8)`（`afh-pages.jsx:169`），這是粗估；後端可在 PATCH 後回傳精確的 tokenize 結果（呼叫 LLM 提供商的 tokenizer）
