# Agent Flow Harness — API 需求規格書

> 版本：v1.0 · 日期：2026-04-29  
> 本文件為後端 API 的完整需求說明，包含 Endpoint、HTTP Method、Request / Response Schema、驗證規則與錯誤碼。

---

## 目錄

- [通用規範](#通用規範)
- [認證與授權](#認證與授權)
- [錯誤格式](#錯誤格式)
- [資料型別參考](#資料型別參考)
- [API 清單](#api-清單)
  - [1. Dashboard](#1-dashboard-api)
  - [2. Runs（執行紀錄）](#2-runs-api)
  - [3. Run Steps（步驟）](#3-run-steps-api)
  - [4. Assets（素材）](#4-assets-api)
  - [5. Connectors（連接器）](#5-connectors-api)
  - [6. Roles（角色）](#6-roles-api)
  - [7. Skills（技能）](#7-skills-api)
  - [8. Projects（專案）](#8-projects-api)
  - [9. Insights（洞察）](#9-insights-api)

---

## 通用規範

| 項目 | 規範 |
|------|------|
| **Base URL** | `https://api.agentflow.example.com/v1` |
| **通訊協定** | HTTPS only |
| **資料格式** | `application/json`（Request Body & Response） |
| **日期格式** | ISO 8601，例如 `2026-04-24T14:32:00Z` |
| **分頁** | Cursor-based pagination，參數 `cursor` + `limit`（預設 20，最大 100） |
| **排序** | `sort` 參數，前綴 `-` 表示降序，例如 `sort=-startedAt` |
| **字串 ID** | 所有 ID 為 URL-safe 字串，例如 `run-5001`、`conn-001` |

---

## 認證與授權

### Request Header

```
Authorization: Bearer <access_token>
```

- `access_token`：JWT，由 `/auth/token` 換發，有效期 1 小時
- Token 過期時使用 `refresh_token` 更新
- 所有 API（除健康檢查外）均需此 Header

### 角色與權限

| 角色 | 說明 | 允許操作 |
|------|------|----------|
| `viewer` | 唯讀觀察者 | GET 所有資源 |
| `operator` | 操作人員 | GET + POST（審核、Resume、Abort） |
| `admin` | 管理員 | 全部操作含 DELETE |

---

## 錯誤格式

所有 API 錯誤均回傳以下 JSON 結構：

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Run run-9999 not found",
    "details": {}
  }
}
```

### 通用錯誤碼

| HTTP Status | code | 說明 |
|-------------|------|------|
| `400` | `VALIDATION_ERROR` | Request 欄位驗證失敗 |
| `401` | `UNAUTHORIZED` | 未提供或 Token 無效 |
| `403` | `FORBIDDEN` | 權限不足 |
| `404` | `RESOURCE_NOT_FOUND` | 資源不存在 |
| `409` | `CONFLICT` | 狀態衝突（例如已完成的 Run 不能 Resume） |
| `422` | `UNPROCESSABLE_ENTITY` | 邏輯驗證失敗 |
| `429` | `RATE_LIMITED` | 請求過於頻繁 |
| `500` | `INTERNAL_ERROR` | 伺服器內部錯誤 |
| `503` | `SERVICE_UNAVAILABLE` | 下游 AI 服務不可用 |

---

## 資料型別參考

### RunStatus
```
"running" | "waiting_review" | "success" | "failed" | "escalated" | "pending"
```

### RunMode
```
"code" | "creative"
```

### ConnectorStatus
```
"connected" | "rate_limited" | "disconnected" | "error"
```

### ConnectorType
```
"llm" | "image_gen" | "video_gen" | "processor"
```

### StepStatus
```
"pending" | "running" | "success" | "failed" | "waiting_review"
```

### AssetReviewAction
```
"approve" | "reject" | "regenerate"
```

---

## API 清單

---

## 1. Dashboard API

### `GET /dashboard/summary`

取得儀表板今日彙整統計。

**Response 200**
```json
{
  "date": "2026-04-29",
  "codeRuns": {
    "total": 8,
    "success": 6,
    "failed": 1,
    "running": 1,
    "escalated": 0
  },
  "creativeRuns": {
    "total": 3,
    "success": 1,
    "failed": 1,
    "waitingReview": 1
  },
  "assetsPendingReview": 3,
  "escalatedRuns": 1,
  "tokensTotal": 352100,
  "estimatedCostUsd": 12.47
}
```

---

## 2. Runs API

### `GET /runs`

取得執行紀錄列表，支援篩選、排序與分頁。

**Query Parameters**

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `status` | string | 否 | 以逗號分隔，例如 `running,escalated` |
| `mode` | `code` \| `creative` | 否 | 篩選模式 |
| `project` | string | 否 | 專案 ID |
| `cursor` | string | 否 | 分頁游標 |
| `limit` | integer | 否 | 每頁筆數，預設 20，最大 100 |
| `sort` | string | 否 | 排序欄位，預設 `-startedAt` |

**Response 200**
```json
{
  "data": [
    {
      "id": "run-5001",
      "project": "brand-video-q2",
      "mode": "creative",
      "role": "Creative Director",
      "task": "Brand Launch Video — Q2 2026",
      "status": "waiting_review",
      "startedAt": "2026-04-24T14:10:00Z",
      "duration": "18m 32s",
      "durationSeconds": 1112,
      "tokensUsed": 28400,
      "estimatedCostUsd": 4.20,
      "stepsDone": 3,
      "stepsTotal": 6,
      "assetsGenerated": 8,
      "assetsPendingReview": 3,
      "fixAttempts": null,
      "maxFix": null,
      "testPass": null,
      "testFail": null
    }
  ],
  "pagination": {
    "nextCursor": "eyJpZCI6InJ1bi00ODE3In0",
    "hasMore": true,
    "total": 42
  }
}
```

---

### `GET /runs/:runId`

取得單筆執行的完整資料。

**Path Parameters**

| 參數 | 說明 |
|------|------|
| `runId` | Run ID，例如 `run-5001` |

**Response 200**：同列表中單筆物件結構，額外包含：
```json
{
  "id": "run-4821",
  "...": "...",
  "connectors": ["Gemini", "Runway"],
  "completedAt": null,
  "errorMessage": null
}
```

**Errors**

| Status | code | 情境 |
|--------|------|------|
| `404` | `RESOURCE_NOT_FOUND` | runId 不存在 |

---

### `POST /runs/:runId/resume`

提供人工 hint 並繼續已升級（escalated）的執行流程。

**Request Body**
```json
{
  "hint": "upsert 需要使用 ON CONFLICT (cart_id) DO UPDATE"
}
```

| 欄位 | 型別 | 必填 | 驗證 |
|------|------|------|------|
| `hint` | string | 是 | 1–2000 字元，不可空白 |

**Response 200**
```json
{
  "runId": "run-4820",
  "status": "running",
  "message": "Run resumed with hint"
}
```

**Errors**

| Status | code | 情境 |
|--------|------|------|
| `404` | `RESOURCE_NOT_FOUND` | runId 不存在 |
| `409` | `CONFLICT` | Run 狀態非 `escalated`，無法 Resume |
| `422` | `VALIDATION_ERROR` | hint 為空 |

---

### `POST /runs/:runId/abort`

中止執行中或已升級的 Run。

**Request Body**：空（無需 body）

**Response 200**
```json
{
  "runId": "run-4820",
  "status": "failed",
  "message": "Run aborted by operator"
}
```

**Errors**

| Status | code | 情境 |
|--------|------|------|
| `404` | `RESOURCE_NOT_FOUND` | runId 不存在 |
| `409` | `CONFLICT` | Run 狀態已為終態（success / failed） |

---

## 3. Run Steps API

### `GET /runs/:runId/steps`

取得指定 Run 的所有步驟列表。

**Response 200**
```json
{
  "data": [
    {
      "id": "s1",
      "name": "Collect Context",
      "status": "success",
      "duration": "1.2s",
      "durationMs": 1200,
      "tokens": 4200,
      "startedAt": "2026-04-24T14:32:00Z",
      "connector": null,
      "connectorType": null
    },
    {
      "id": "s4",
      "name": "Run Tests",
      "status": "failed",
      "duration": "12.1s",
      "durationMs": 12100,
      "tokens": 8400,
      "startedAt": "2026-04-24T14:32:14Z",
      "connector": null,
      "connectorType": null
    }
  ]
}
```

---

### `GET /runs/:runId/steps/:stepId`

取得單一步驟的完整詳細資料，含輸入輸出、程式碼 diff、測試結果、Context breakdown。

**Response 200**
```json
{
  "id": "s4",
  "name": "Run Tests",
  "status": "failed",
  "duration": "12.1s",
  "tokens": 8400,
  "startedAt": "2026-04-24T14:32:14Z",
  "input": "Command: npm test -- --testPathPattern=webhook",
  "output": "FAIL tests/webhooks.test.js\n✓ validates HMAC (245ms)\n✗ upserts cart record (TimeoutError)",
  "diff": {
    "before": "// routes/index.js\nconst cartRoutes = require('./cart');",
    "after": "// routes/index.js\nconst cartRoutes = require('./cart');\nconst webhookRoutes = require('./webhooks');"
  },
  "testResults": [
    {
      "name": "validates HMAC signature",
      "status": "pass",
      "duration": "245ms"
    },
    {
      "name": "upserts abandoned cart record",
      "status": "fail",
      "errorType": "TimeoutError",
      "error": "Timeout of 5000ms exceeded.\n  at AbandonedCart.upsert (models/AbandonedCart.js:34)",
      "file": "tests/webhooks.test.js",
      "line": 67
    }
  ],
  "collectorBreakdown": [
    { "name": "schema.sql", "tokens": 1240, "pct": 29 },
    { "name": "routes/cart.js", "tokens": 880, "pct": 21 }
  ],
  "connector": null,
  "connectorType": null,
  "cost": null
}
```

**Errors**

| Status | code | 情境 |
|--------|------|------|
| `404` | `RESOURCE_NOT_FOUND` | runId 或 stepId 不存在 |

---

### `GET /runs/:runId/steps/:stepId/assets`

取得 Creative Run 某步驟的所有生成素材。

**Response 200**
```json
{
  "data": [
    {
      "sceneId": "scene-1",
      "sceneName": "Opening — Brand Statement",
      "versions": [
        {
          "v": 1,
          "status": "pending",
          "connector": "Midjourney",
          "imageUrl": "https://cdn.example.com/assets/run-5001/scene-1-v1.jpg",
          "thumbnailUrl": "https://cdn.example.com/assets/run-5001/scene-1-v1-thumb.jpg",
          "generatedAt": "2026-04-24T14:15:00Z",
          "feedback": null
        },
        {
          "v": 2,
          "status": "approved",
          "connector": "Midjourney",
          "imageUrl": "https://cdn.example.com/assets/run-5001/scene-1-v2.jpg",
          "thumbnailUrl": "https://cdn.example.com/assets/run-5001/scene-1-v2-thumb.jpg",
          "generatedAt": "2026-04-24T14:22:00Z",
          "feedback": null
        }
      ]
    }
  ]
}
```

---

## 4. Assets API

### `POST /runs/:runId/assets/:assetId/review`

提交單筆素材的審核決定。

**Path Parameters**

| 參數 | 說明 |
|------|------|
| `runId` | Run ID |
| `assetId` | 素材 ID，格式為 `{sceneId}-v{version}`，例如 `scene-1-v1` |

**Request Body**
```json
{
  "action": "reject",
  "feedback": "構圖太暗，主體不夠清晰"
}
```

| 欄位 | 型別 | 必填 | 驗證 |
|------|------|------|------|
| `action` | `AssetReviewAction` | 是 | 必須為 `approve`、`reject`、`regenerate` 之一 |
| `feedback` | string | 條件必填 | `action = reject` 時必填，1–500 字元 |

**Response 200**
```json
{
  "assetId": "scene-1-v1",
  "action": "reject",
  "feedback": "構圖太暗，主體不夠清晰",
  "reviewedAt": "2026-04-29T10:05:00Z",
  "reviewedBy": "user-001"
}
```

**Errors**

| Status | code | 情境 |
|--------|------|------|
| `404` | `RESOURCE_NOT_FOUND` | assetId 不存在 |
| `409` | `CONFLICT` | 素材已審核（非 pending） |
| `422` | `VALIDATION_ERROR` | action=reject 但未提供 feedback |

---

### `POST /runs/:runId/assets/batch-review`

批次提交多筆素材的審核決定。

**Request Body**
```json
{
  "reviews": [
    { "assetId": "scene-1-v1", "action": "approve", "feedback": null },
    { "assetId": "scene-2-v1", "action": "approve", "feedback": null },
    { "assetId": "scene-3-v2", "action": "reject", "feedback": "色調偏差" }
  ]
}
```

**Response 200**
```json
{
  "processed": 3,
  "results": [
    { "assetId": "scene-1-v1", "status": "ok" },
    { "assetId": "scene-2-v1", "status": "ok" },
    { "assetId": "scene-3-v2", "status": "ok" }
  ]
}
```

**Errors**：若任何一筆失敗，仍回傳 `200` 但 `results` 中對應項目的 `status` 為 `"error"` 並附上 `reason`。

---

### `POST /runs/:runId/assets/:assetId/regenerate`

要求重新生成單張素材（需提供修改方向）。

**Request Body**
```json
{
  "feedback": "請使用更明亮的色調，並讓主體置中"
}
```

| 欄位 | 型別 | 必填 | 驗證 |
|------|------|------|------|
| `feedback` | string | 是 | 1–500 字元 |

**Response 202**
```json
{
  "assetId": "scene-1-v1",
  "newVersionId": "scene-1-v3",
  "status": "pending",
  "message": "Regeneration queued"
}
```

---

## 5. Connectors API

### `GET /connectors`

取得所有 Agent 連接器列表。

**Query Parameters**

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `status` | string | 否 | 篩選連線狀態，例如 `connected,error` |
| `type` | string | 否 | 篩選類型，例如 `llm` |
| `fields` | string | 否 | 僅回傳指定欄位，例如 `id,name,status,latencyAvg` |

**Response 200**
```json
{
  "data": [
    {
      "id": "conn-001",
      "name": "Gemini",
      "provider": "Google",
      "type": "llm",
      "status": "connected",
      "latencyAvg": "180ms",
      "quotaUsed": 4200,
      "quotaMax": 10000,
      "resetIn": null,
      "error": null,
      "model": "gemini-1.5-pro",
      "endpoint": "https://generativelanguage.googleapis.com/v1beta",
      "temperature": 0.7,
      "maxTokens": 8192
    }
  ]
}
```

---

### `GET /connectors/:connectorId`

取得單一連接器完整設定（含敏感欄位以遮罩顯示）。

**Response 200**：同列表單筆結構，額外包含 `apiKeyMasked`：
```json
{
  "id": "conn-001",
  "...": "...",
  "apiKeyMasked": "sk-••••••••••••••••••••ab3f"
}
```

---

### `POST /connectors/:connectorId/test`

對指定連接器發起連線測試。

**Response 200**
```json
{
  "connectorId": "conn-001",
  "result": "ok",
  "latencyMs": 142,
  "testedAt": "2026-04-29T10:00:00Z"
}
```

**Response 200（失敗情境）**
```json
{
  "connectorId": "conn-003",
  "result": "fail",
  "error": "Connection refused: endpoint unreachable",
  "testedAt": "2026-04-29T10:00:00Z"
}
```

---

### `PATCH /connectors/:connectorId`

更新連接器設定。

**Request Body**（所有欄位均選填，僅更新提供的欄位）
```json
{
  "endpoint": "https://api.openai.com/v1",
  "model": "gpt-4o",
  "temperature": 0.5,
  "maxTokens": 4096
}
```

| 欄位 | 型別 | 驗證 |
|------|------|------|
| `endpoint` | string | 必須為有效 HTTPS URL |
| `model` | string | 1–100 字元 |
| `temperature` | float | 0.0 ~ 2.0 |
| `maxTokens` | integer | 1 ~ 200000 |

**Response 200**：回傳更新後的完整連接器物件。

---

### `POST /connectors/:connectorId/rotate-key`

輪替 API Key。

**Request Body**
```json
{
  "newApiKey": "sk-new-key-value-here"
}
```

| 欄位 | 型別 | 必填 | 驗證 |
|------|------|------|------|
| `newApiKey` | string | 是 | 10–512 字元 |

**Response 200**
```json
{
  "connectorId": "conn-001",
  "apiKeyMasked": "sk-••••••••••••••••••••here",
  "rotatedAt": "2026-04-29T10:05:00Z"
}
```

---

### `POST /connectors`

新增連接器。

**Request Body**
```json
{
  "name": "Runway",
  "provider": "Runway ML",
  "type": "video_gen",
  "endpoint": "https://api.runwayml.com/v1",
  "apiKey": "rw-api-key",
  "model": "gen3-alpha",
  "temperature": null,
  "maxTokens": null
}
```

| 欄位 | 型別 | 必填 | 驗證 |
|------|------|------|------|
| `name` | string | 是 | 1–100 字元，需唯一 |
| `provider` | string | 是 | 1–100 字元 |
| `type` | ConnectorType | 是 | — |
| `endpoint` | string | 是 | 有效 HTTPS URL |
| `apiKey` | string | 是 | 10–512 字元 |
| `model` | string | 否 | 1–100 字元 |
| `temperature` | float | 否 | 0.0 ~ 2.0 |
| `maxTokens` | integer | 否 | 1 ~ 200000 |

**Response 201**：回傳建立後的完整連接器物件（`apiKey` 以遮罩回傳）。

---

### `DELETE /connectors/:connectorId`

刪除連接器。若有進行中的 Run 正在使用此連接器則拒絕刪除。

**Response 204**：No Content

**Errors**

| Status | code | 情境 |
|--------|------|------|
| `409` | `CONFLICT` | 有進行中的 Run 正在使用此連接器 |

---

## 6. Roles API

### `GET /roles`

取得所有角色列表。

**Response 200**
```json
{
  "data": [
    {
      "id": "backend-engineer",
      "name": "Backend Engineer",
      "mode": "code",
      "description": "Implements server-side features with test-driven development",
      "promptLayers": {
        "global": "You are a senior backend engineer...",
        "project": "Project: {projectName}\nStack: {stack}",
        "task": "Task: {task}\nRules:\n- Write clean, tested code"
      }
    }
  ]
}
```

---

### `GET /roles/:roleId`

取得單一角色完整資料（含 promptLayers）。

**Response 200**：同列表單筆結構。

**Errors**

| Status | code | 情境 |
|--------|------|------|
| `404` | `RESOURCE_NOT_FOUND` | roleId 不存在 |

---

### `PATCH /roles/:roleId/prompts`

儲存角色的提示詞三層設定。

**Request Body**
```json
{
  "global": "You are a senior backend engineer specialized in...",
  "project": "Project: {projectName}\nStack: {stack}\n# Project Context",
  "task": "Task: {task}\n\nRules:\n- Always write unit tests"
}
```

| 欄位 | 型別 | 必填 | 驗證 |
|------|------|------|------|
| `global` | string | 否 | 最多 10000 字元 |
| `project` | string | 否 | 最多 10000 字元 |
| `task` | string | 否 | 最多 10000 字元 |

> 提供哪個欄位就更新哪個欄位，未提供的欄位保持不變。

**Response 200**：回傳更新後的角色完整物件。

---

### `POST /roles`

新增角色。

**Request Body**
```json
{
  "name": "Frontend Engineer",
  "mode": "code",
  "description": "Implements UI components with accessibility focus",
  "promptLayers": {
    "global": "You are a frontend engineer...",
    "project": "",
    "task": ""
  }
}
```

| 欄位 | 型別 | 必填 | 驗證 |
|------|------|------|------|
| `name` | string | 是 | 1–100 字元，需唯一 |
| `mode` | RunMode | 是 | — |
| `description` | string | 否 | 最多 300 字元 |
| `promptLayers` | object | 否 | 包含 global / project / task |

**Response 201**：回傳建立後的完整角色物件。

---

### `DELETE /roles/:roleId`

刪除角色。若有專案正在使用此角色則拒絕刪除。

**Response 204**：No Content

**Errors**

| Status | code | 情境 |
|--------|------|------|
| `409` | `CONFLICT` | 有專案的 activeRole 指向此角色 |

---

## 7. Skills API

### `GET /skills`

取得所有技能列表。

**Query Parameters**

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `mode` | RunMode | 否 | 篩選適用模式 |
| `enabled` | boolean | 否 | 僅回傳啟用 / 停用的技能 |

**Response 200**
```json
{
  "data": [
    {
      "id": "sql-schema-reader",
      "name": "SQL Schema Reader",
      "enabled": true,
      "mode": "code",
      "roles": ["backend-engineer", "data-engineer"],
      "description": "Reads relevant schema tables based on task context"
    }
  ]
}
```

---

### `GET /skills/:skillId`

取得單一技能詳細資料。

**Response 200**：同列表單筆結構。

---

### `PATCH /skills/:skillId`

更新技能設定（通常用於切換啟用狀態）。

**Request Body**
```json
{
  "enabled": false
}
```

| 欄位 | 型別 | 必填 | 驗證 |
|------|------|------|------|
| `enabled` | boolean | 否 | — |
| `roles` | string[] | 否 | 角色 ID 陣列 |
| `description` | string | 否 | 最多 300 字元 |

**Response 200**：回傳更新後的完整技能物件。

---

### `POST /skills`

新增技能。

**Request Body**
```json
{
  "name": "API Doc Generator",
  "mode": "code",
  "roles": ["backend-engineer"],
  "description": "Generates OpenAPI spec from route definitions",
  "enabled": false
}
```

| 欄位 | 型別 | 必填 | 驗證 |
|------|------|------|------|
| `name` | string | 是 | 1–100 字元，需唯一 |
| `mode` | RunMode | 是 | — |
| `roles` | string[] | 否 | 角色 ID 陣列 |
| `description` | string | 否 | 最多 300 字元 |
| `enabled` | boolean | 否 | 預設 `false` |

**Response 201**：回傳建立後的完整技能物件。

---

### `DELETE /skills/:skillId`

刪除技能。

**Response 204**：No Content

---

## 8. Projects API

### `GET /projects`

取得所有專案列表。

**Query Parameters**

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `mode` | RunMode | 否 | 篩選模式 |
| `include` | string | 否 | 附加欄位，例如 `stats` 會包含 `runsToday`、`successRate` |

**Response 200**
```json
{
  "data": [
    {
      "id": "commerce-api",
      "name": "commerce-api",
      "mode": "code",
      "stack": ["Node.js", "Express", "PostgreSQL", "Redis"],
      "testCmd": "npm test",
      "activeRole": "backend-engineer",
      "runsToday": 4,
      "successRate": 82,
      "createdAt": "2026-01-15T08:00:00Z",
      "updatedAt": "2026-04-24T14:32:00Z"
    }
  ]
}
```

---

### `GET /projects/:projectId`

取得單一專案完整資料。

**Response 200**：同列表單筆結構。

**Errors**

| Status | code | 情境 |
|--------|------|------|
| `404` | `RESOURCE_NOT_FOUND` | projectId 不存在 |

---

### `POST /projects`

建立新專案。

**Request Body**
```json
{
  "name": "new-service",
  "mode": "code",
  "stack": ["Go", "PostgreSQL"],
  "testCmd": "go test ./...",
  "activeRole": "backend-engineer"
}
```

| 欄位 | 型別 | 必填 | 驗證 |
|------|------|------|------|
| `name` | string | 是 | 1–100 字元，僅允許小寫英數字與連字號，需唯一 |
| `mode` | RunMode | 是 | — |
| `stack` | string[] | 是 | 至少 1 項，每項最多 50 字元 |
| `testCmd` | string | Code Mode 必填 | 1–200 字元；Creative Mode 傳 `null` |
| `activeRole` | string | 否 | 角色 ID，需存在於 `/roles` |

**Response 201**：回傳建立後的完整專案物件。

**Errors**

| Status | code | 情境 |
|--------|------|------|
| `409` | `CONFLICT` | 專案名稱已存在 |
| `422` | `VALIDATION_ERROR` | testCmd 為 Code Mode 但未提供 |

---

### `PATCH /projects/:projectId`

更新專案設定。

**Request Body**（選填欄位）
```json
{
  "stack": ["Node.js", "Express", "PostgreSQL", "Redis", "BullMQ"],
  "testCmd": "npm run test:ci",
  "activeRole": "security-engineer"
}
```

**Response 200**：回傳更新後的完整專案物件。

---

### `DELETE /projects/:projectId`

刪除專案。若有進行中的 Run 屬於此專案則拒絕刪除。

**Response 204**：No Content

**Errors**

| Status | code | 情境 |
|--------|------|------|
| `409` | `CONFLICT` | 有進行中（running / waiting_review）的 Run 屬於此專案 |

---

## 9. Insights API

### `GET /insights/summary`

取得今日彙整指標（與 Dashboard Summary 相同，可共用）。

**Response 200**：同 `GET /dashboard/summary`

---

### `GET /insights/first-pass-rate`

取得每日 First-Pass Rate 歷史趨勢。

**Query Parameters**

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `days` | integer | 否 | 歷史天數，預設 8，最大 90 |

**Response 200**
```json
{
  "data": [
    { "date": "Apr 22", "code": 0.72, "creative": 0.60 },
    { "date": "Apr 23", "code": 0.78, "creative": 0.65 },
    { "date": "Apr 24", "code": 0.81, "creative": 0.71 },
    { "date": "Apr 25", "code": 0.68, "creative": 0.58 },
    { "date": "Apr 26", "code": 0.85, "creative": 0.74 },
    { "date": "Apr 27", "code": 0.90, "creative": 0.80 },
    { "date": "Apr 28", "code": 0.76, "creative": 0.67 },
    { "date": "Apr 29", "code": 0.83, "creative": 0.73 }
  ]
}
```

---

### `GET /insights/avg-fix-attempts`

取得每日平均修復次數歷史趨勢（僅 Code Mode）。

**Query Parameters**

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `days` | integer | 否 | 歷史天數，預設 8，最大 90 |

**Response 200**
```json
{
  "data": [
    { "date": "Apr 22", "avgAttempts": 1.8 },
    { "date": "Apr 23", "avgAttempts": 2.1 },
    { "date": "Apr 24", "avgAttempts": 1.5 },
    { "date": "Apr 25", "avgAttempts": 2.8 },
    { "date": "Apr 26", "avgAttempts": 1.2 },
    { "date": "Apr 27", "avgAttempts": 1.0 },
    { "date": "Apr 28", "avgAttempts": 1.9 },
    { "date": "Apr 29", "avgAttempts": 1.4 }
  ]
}
```

---

### `GET /insights/usage-by-project`

取得各專案的 Token 用量與費用明細。

**Query Parameters**

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `days` | integer | 否 | 統計天數，預設 1（今日），最大 90 |

**Response 200**
```json
{
  "data": [
    {
      "projectId": "commerce-api",
      "project": "commerce-api",
      "mode": "code",
      "tokensUsed": 156200,
      "estimatedCostUsd": 0.78,
      "pct": 44
    },
    {
      "projectId": "brand-video-q2",
      "project": "brand-video-q2",
      "mode": "creative",
      "tokensUsed": 50500,
      "estimatedCostUsd": 12.30,
      "pct": 14
    }
  ],
  "totals": {
    "tokensUsed": 352100,
    "estimatedCostUsd": 12.47
  }
}
```

---

## 附錄 A：Webhook 事件（選用）

若後端需要主動推送即時狀態更新，可實作以下 Webhook 事件。前端透過 Server-Sent Events（SSE）或 WebSocket 訂閱。

| 事件名稱 | 觸發時機 | Payload 重要欄位 |
|---------|---------|----------------|
| `run.status_changed` | Run 狀態改變 | `runId`, `status`, `previousStatus` |
| `run.step_completed` | 步驟完成 | `runId`, `stepId`, `status`, `tokensUsed` |
| `run.escalated` | Run 升級為 escalated | `runId`, `fixAttempts`, `testFail` |
| `asset.generated` | 素材生成完成（Creative） | `runId`, `sceneId`, `version`, `status` |
| `connector.status_changed` | Connector 狀態改變 | `connectorId`, `status`, `error` |

### SSE 訂閱 Endpoint

```
GET /events?runId=run-5001
Authorization: Bearer <token>
Accept: text/event-stream
```

---

## 附錄 B：速率限制

| API 分類 | 上限 | 計算窗口 |
|---------|------|---------|
| 一般查詢（GET） | 300 req | 每分鐘 |
| 寫入操作（POST / PATCH / DELETE） | 60 req | 每分鐘 |
| 連接器測試 | 10 req | 每分鐘 |
| Insights 歷史查詢 | 30 req | 每分鐘 |

速率限制超過時回傳 `429 Too Many Requests`，Response Header 包含：

```
Retry-After: 30
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1714386600
```

---

*文件結束 — 功能對照詳見 `FEATURES-AND-API.zh-TW.md`*
