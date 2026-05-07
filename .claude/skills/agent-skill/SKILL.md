---
name: agent-skill
description: Use when designing the AgentSkill entity (the application's own "skill" concept — tool definitions an Agent can invoke during a Run). NOT to be confused with Claude Code skills (this directory). Covers schema, mode/role filtering, toggle behavior, and where it surfaces in the UI.
---

# AgentSkill

> ⚠️ **命名混淆警告**：本 skill 描述的是 **Agent Flow Harness 應用程式內**的「Skill」概念（一個 Agent 可呼叫的工具定義，例如 SQL Schema Reader、Test Runner）。這與容納本檔案的 **Claude Code Skill** 是兩回事。

## 一句話定義
**AgentSkill** 是 Agent 在執行 Run 過程中可選擇呼叫的「工具能力定義」，依 mode 與 role 過濾後注入該 Run 的能力清單。

## 後端 Schema

```ts
interface AgentSkill {
  id: string;                  // 'sql-schema-reader'、'test-runner'，slug
  name: string;                // 'SQL Schema Reader' 顯示名
  description: string;         // 'Reads relevant schema tables based on task context'
  mode: 'code' | 'creative';   // 適用模式
  roles: string[];             // ['Backend Engineer', 'Data Engineer']，role.name 字串
  enabled: boolean;            // 全域開關
  // 後端 implementation 細節（mock 沒有，建議補）
  handler?: string;            // 後端註冊的 handler key，例如 'tools.runShell' / 'tools.semgrep'
  inputSchema?: object;        // JSON Schema，描述 Agent 呼叫此 skill 時需要的參數
  outputFormat?: 'text' | 'structured' | 'binary';
}
```

> 來源：`frontend/components/afh-pages.jsx:295–307` (內嵌 const SKILLS)
> 注意：mock 把 SKILLS 寫死在元件內而非 `lib/afh-data.js`，正式整合時應移出

## Mock 列表（共 11 條）

| id | mode | roles | enabled |
|----|------|-------|---------|
| sql-schema-reader | code | Backend / Data Engineer | ✅ |
| test-runner | code | Backend / Security / Data / Frontend | ✅ |
| git-diff | code | Backend Engineer | ✅ |
| security-scanner | code | Security Engineer | ✅ |
| go-analyzer | code | Security Engineer | ✅ |
| python-analyzer | code | Data Engineer | ✅ |
| ts-analyzer | code | Frontend Engineer | ✅ |
| style-extractor | creative | Creative Director | ✅ |
| scene-splitter | creative | Creative Director | ✅ |
| asset-validator | creative | Creative Director | ❌ |
| api-doc-gen | code | Backend Engineer | ❌ |

## 過濾規則（runtime）

某次 Run 啟動時，可用 skills 集合 =
```
SKILLS.filter(s =>
  s.enabled === true &&
  s.mode === project.mode &&
  s.roles.includes(role.name)
)
```

## API 端點

| 功能 | Method | Endpoint | 備註 |
|------|--------|----------|------|
| 列出全部 | `GET` | `/api/skills` | 用於 Skills 頁、Roles 顯示 |
| 列出某 mode | `GET` | `/api/skills?mode=code` | 對應前端 `modeFilter` 篩選 |
| 取得單一 | `GET` | `/api/skills/:skillId` | 含 inputSchema |
| 切換 enabled | `PATCH` | `/api/skills/:skillId` | body: `{ enabled: boolean }` |
| 完整更新 | `PATCH` | `/api/skills/:skillId` | body: name / description / roles / mode? |
| 建立 | `POST` | `/api/skills` | 需 inputSchema、handler |
| 刪除 | `DELETE` | `/api/skills/:skillId` | 注意是否有 Run 紀錄引用 |

## 驗證
- `mode` 不可變更（Code mode 的工具改成 Creative 是語意災難）
- `roles[]` 元素必須是現存 Role.name
- `id` slug 唯一

## 出現在哪些頁面（非常詳盡）

### 1. Skills 頁 — `frontend/components/afh-pages.jsx` `SkillsPage` (line 309)

**主要 CRUD 介面**

| UI 區塊 | 行號 | 細節 |
|---------|------|------|
| **頁面標題** | 320 | `t('pages.skillsTitle')` |
| **Mode 篩選 buttons** | 321–331 | `['all', 'code', 'creative']`，state `modeFilter` |
| **表格 thead** | 335–340 | 五欄：Skill / Mode / Roles / Description / Enabled |
| **每行（line 343–377）** | | |
| └ Name | 346–348 | `skill.name`（粗體） |
| └ Mode badge | 349 | `<ModeBadge mode={skill.mode} />` |
| └ Roles chips | 350–356 | 取 `r.split(' ')[0]`（只顯示 first word） |
| └ Description | 357–360 | maxWidth 300 |
| └ Toggle | 360–372 | 自製 toggle，按下呼叫 `toggle(skill.id)` |

**互動**：toggle 點擊 → `setSkills(ss => ss.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))`（line 314） → 應對應 `PATCH /api/skills/:id { enabled }`

### 2. Roles 頁（顯示用）
- mock 無此互動，但建議擴充：選中 Role 時顯示「此 Role 可用的 Skills」清單（filter `skills.roles.includes(role.name)`）

### 3. Run Detail（隱式使用）
- 步驟 `Collect Context`（Code）會自動呼叫 `sql-schema-reader`、`git-diff`、`*-analyzer`
- 步驟 `Run Tests`（Code）對應 `test-runner`
- 步驟 `Style Reference`（Creative）對應 `style-extractor`
- 步驟 `Scene Image Generation` 前可能由 `scene-splitter` 預處理
- 這些目前在 mock 中被寫死於 `CODE_RUN_STEPS` / `CREATIVE_RUN_STEPS`，但語意上是 AgentSkill 在工作

### 4. Dashboard / Insights
- 不直接顯示 AgentSkill；但若擴充「per-skill usage breakdown」會在這裡呈現

### 5. 後端 Connector 解析
- 某些 AgentSkill 會委派給 Connector（例：`style-extractor` → Gemini）。建議補欄位 `requiresConnectorTypes: string[]`，例如 `['llm']` 或 `['image_gen']`，便於 dry-run 預檢

## 後端設計建議

- **inputSchema 必要**：mock 沒帶；正式整合需要 JSON Schema 驗證 LLM 呼叫工具時的參數
- **超時與重試**：每個 AgentSkill 配 `timeoutMs`、`maxRetries`、`isIdempotent`
- **記錄使用**：每次 Step 呼叫 AgentSkill 時應記錄 `(stepId, skillId, latency, tokensConsumed)`，作為 Insights 的擴充資料源
- **權限分層**：某些 skill 應限制只有特定 Role 才能用（mock 已用 `roles[]`，正式時再加 `requiresApiKey`、`networkAccess` 等敏感旗標）
- **Mock 位置遷移**：把 `SKILLS` 從 `afh-pages.jsx` 移到 `lib/afh-data.js`，便於後續切到真 API
- **與 Claude Code Skills 區隔**：在 README、TS interface、API path（`/api/skills`）等都建議在文件加註避免混淆，必要時可改名為 `tool` 或 `capability`
