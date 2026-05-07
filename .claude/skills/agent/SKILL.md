---
name: agent
description: Use when designing or reasoning about the Agent entity in Agent Flow Harness — Agent is the orchestration root that binds a Project + Role + AgentSkills + Connectors together to execute a Run. Includes composition rules, why it has no CRUD endpoint of its own, and where its identity surfaces in the UI.
---

# Agent

## 一句話定義
**Agent** 是 Agent Flow Harness 中執行自動化任務的最高層抽象。它本身沒有獨立資料表，而是由「Project（執行對象）」+「Role（人格與三層 Prompt）」+「AgentSkill[]（可呼叫工具）」+「Connector[]（外部 AI 服務）」組合，產生 `Run` 紀錄。

## 後端視角的組成結構

```ts
// Agent 並非實體資料表，而是執行時的組合
interface Agent {
  // 來自 Project
  projectId: string;            // 對應 Project.id
  mode: 'code' | 'creative';    // 來自 Project.mode

  // 來自 Role（projectId.activeRole 指定）
  roleId: string;               // ROLES[].id（role 可被多個 project 共用）
  promptStack: {                // 三層 Prompt（runtime 組合）
    global: string;             // Role.promptLayers.global
    project: string;            // Role.promptLayers.project（變數已套入 project context）
    task: string;               // Role.promptLayers.task（變數已套入 task context）
  };

  // 來自 AgentSkill（依 mode + role 過濾）
  enabledSkills: AgentSkill[];  // mode 相符 + roles 含當前 role + enabled === true

  // 來自 Connector（依 skill 與 mode 解析）
  connectors: {
    primary: Connector;         // mode='code' → LLM；mode='creative' → 各步驟對應
    perStep?: Record<string, Connector>;  // creative 模式各步驟可不同
  };

  // 執行階段才產生
  fixAttempts?: { current: number; max: number };  // code mode 預設 max=5
}
```

## 物件如何被「實例化」（後端流程）

1. 使用者於 **Runs / Dashboard** 觸發某個 Project 的執行
2. 後端讀取 `PROJECTS[id]` → 取得 `mode`、`activeRole`、`testCmd`、`stack`
3. 讀取 `ROLES[activeRole]` → 取得三層 promptLayers
4. 將 `{project_name}`、`{stack}`、`{test_cmd}`、`{task_description}` 等變數注入 promptLayers（變數出現在 `frontend/components/afh-pages.jsx` PromptLayerEditor 的高亮規則中：`/(\{[^}]+\})/g`）
5. 過濾 `SKILLS` → `mode === project.mode && roles.includes(activeRole) && enabled === true`
6. 解析 Connector → mode='code' 通常用 LLM 連接器；mode='creative' 視步驟（Script→Claude、Style→Gemini、Image→Gemini/Midjourney、Motion→Runway）
7. 創建 `Run` 紀錄，狀態 `running`，開始呼叫 Step

## API 端點

| 動作 | Method | Endpoint | 備註 |
|------|--------|----------|------|
| **觸發新 Run（即「啟動 Agent」）** | `POST` | `/api/runs` | body: `{ projectId, task, hints? }`，後端組合 Agent 並啟動 |
| 查詢某 Project 對應的 Agent 配置（合成） | `GET` | `/api/projects/:projectId/agent` | 選配；回傳 runtime 將要組合的 Agent 預覽 |
| 取得 Agent 模擬執行（dry-run） | `POST` | `/api/projects/:projectId/agent/dry-run` | 回傳 Prompt Stack 預覽、會被啟用的 Skills、Connectors |

> **重要**：Agent **沒有 PATCH/DELETE**。要改 Agent 行為，需修改其組成元件（Project / Role / Skill / Connector）。

## 出現在哪些頁面（非常詳盡）

### 1. Dashboard — `frontend/components/afh-dashboard.jsx`
- **Active Runs 區塊**：每張 `ActiveRunCard` 是「一個正在運行的 Agent 實例」的視覺化
  - 顯示 `run.role`（Agent 的角色身份）、`run.project`（Agent 服務的專案）、`fixAttempts`（Code Agent 修復狀態）、`assetsPendingReview`（Creative Agent 等待審核）
- **Connectors 狀態快覽**：顯示 Agent 即將呼叫的外部服務健康度

### 2. Projects — `frontend/components/afh-pages.jsx` `ProjectsPage` (line 388)
- **Project 詳細編輯區**：`activeRole` 欄位（line 478）即「綁定到此 Project 的 Agent 人格」
- 修改此欄位 = 重新配置 Agent 的 Role 來源

### 3. Roles — `frontend/components/afh-pages.jsx` `RolesPage` (line 243)
- **三層 PromptLayerEditor**（line 156）：定義 Agent 在不同 scope 下的人格與規則
- 此頁面的儲存動作 = 修改所有使用此 Role 的 Agent 行為

### 4. Skills — `frontend/components/afh-pages.jsx` `SkillsPage` (line 309)
- **Toggle 切換**（line 361）：直接決定 Agent 在 runtime 是否能呼叫該工具

### 5. Code Run Detail — `frontend/components/afh-runs.jsx` `CodeRunDetail` (line 218)
- 顯示 Agent 此次執行的：Role（在頁首 `run.role`）、所有 Step（Agent 的決策序列）、Context（Agent 看到了什麼）、TestResult（Agent 的成果驗證）

### 6. Creative Run Detail — `frontend/components/afh-creative.jsx`
- StepTimeline 每個步驟標示 `connector` → 顯示 Agent 此刻委派給哪個外部服務

## 狀態機（Runtime）

```
       ┌──────────┐
       │ idle/N/A │   (Agent 不是有狀態實體；以下為 Run 狀態)
       └─────┬────┘
             │ POST /api/runs
             ▼
       ┌──────────┐
       │ running  │
       └─┬─┬─┬─┬──┘
         │ │ │ │
         │ │ │ └── max fix reached ──> escalated ──hint──> running / aborted
         │ │ └──── creative pending ─> waiting_review ──approve all──> running
         │ └────── tests pass        > success
         └──────── unrecoverable     > failed
```

## 邊界與後端注意事項

- **Agent 是無狀態合成**，所以 Project / Role / Skill / Connector 任一變動都會立刻影響下一次 Run。是否需要「Agent Snapshot」（凍結組合在 Run 上）取決於需求 — 若要回放 / 稽核，建議在 `Run` 建立時把 `promptStackSnapshot`、`skillIdsSnapshot`、`connectorIdsSnapshot` 一併存入 Run 文件，避免後續修改污染歷史。
- **Mode 一致性檢查**：`Role.mode === Project.mode` 是必要前提；後端應在 `POST /api/runs` 時驗證並回 `409` 若不符。
- **變數插值錯誤處理**：promptLayers 內的 `{var}` 找不到對應 context 時，建議保留原文並在 Run 紀錄 warning，不要 silent drop。
- **Skill 無人可用時**：若 `enabledSkills.length === 0` 仍允許執行（純 LLM），但 `dry-run` 應 warn。
