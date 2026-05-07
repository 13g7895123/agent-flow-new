---
name: connector
description: Use when designing the Connector entity (external AI service integration like Gemini, Claude, Runway, Midjourney) in Agent Flow Harness. Covers schema, status state machine, quota / rate-limiting display, key rotation, and every page where Connector data appears.
---

# Connector

## 一句話定義
**Connector** 是對外部 AI 服務的「連線設定 + 即時狀態」抽象，例如 Gemini、Claude、Runway、Midjourney。每個 Connector 描述其端點、認證、預設模型、容量與當前健康狀態。

## 後端 Schema

```ts
type ConnectorType = 'llm' | 'image_gen' | 'video_gen' | 'processor';
type ConnectorStatus = 'connected' | 'rate_limited' | 'disconnected' | 'error';
type Capability =
  | 'text_generation' | 'code_generation'
  | 'image_generation' | 'image_understanding'
  | 'video_generation' | 'image_to_video';

interface Connector {
  id: string;                  // 'gemini-main'
  name: string;                // 'Gemini' 顯示名
  provider: string;            // 'Google' / 'Anthropic' / 'RunwayML' / 'Midjourney'
  type: ConnectorType;
  capabilities: Capability[];
  model: string;               // 'gemini-2.5-pro'，預設模型
  endpoint: string;            // base URL
  apiKey: string;              // 加密儲存；返回時遮罩 '••••••••'
  // 設定參數
  temperature?: number;        // default 0.7
  maxTokens?: number;          // default 8192
  // 即時狀態（後端 derived，可走獨立 health-check 任務或 cron）
  status: ConnectorStatus;
  latencyAvg: string | null;   // '1.2s'，或 null（disconnected 時）
  quotaUsed: number;
  quotaMax: number | null;     // null = 不限額（如 Claude 在 mock 中）
  resetIn?: string;            // '14 min'（rate_limited 時）
  error?: string;              // 'API key expired'（error 時）
  lastCheck: string;           // '2 min ago' / ISO-8601
}
```

> 來源：`frontend/lib/afh-data.js:359–418` (CONNECTORS)

## 狀態機

```
              ┌──────────────┐
   創建      │ disconnected │
   ────────> └──────┬───────┘
                    │ 第一次成功呼叫
                    ▼
            ┌─────────────┐
            │  connected  │<──┐
            └──┬───┬───┬──┘   │ key 輪替成功 / quota reset
               │   │   │      │
   quota 達上限│   │   └─ 503/timeout ──> error ──手動修復──┘
               ▼   │
       ┌──────────────┐
       │ rate_limited │── resetIn 倒數歸零 ──> connected
       └──────────────┘
```

## API 端點

| 功能 | Method | Endpoint | Body / Query | 備註 |
|------|--------|----------|--------------|------|
| 列出 | `GET` | `/api/connectors` | `?fields=id,name,status,latencyAvg` 用於 Dashboard | |
| 取得單一 | `GET` | `/api/connectors/:id` | — | apiKey 應遮罩 |
| 測試連線 | `POST` | `/api/connectors/:id/test` | — | 回 `{ ok: boolean, latency, error? }` |
| 更新設定 | `PATCH` | `/api/connectors/:id` | endpoint / model / temperature / maxTokens | apiKey 走獨立 endpoint |
| 輪替 API Key | `POST` | `/api/connectors/:id/rotate-key` | `{ newKey?: string }` | 不傳則由後端從 secret store 取新值 |
| 建立 | `POST` | `/api/connectors` | 完整 schema | |
| 刪除 | `DELETE` | `/api/connectors/:id` | — | 若有 active Run 引用，應 409 |

## 出現在哪些頁面（非常詳盡）

### 1. Connectors 頁 — `frontend/components/afh-pages.jsx` `ConnectorsPage` (line 134)

**主要 CRUD 介面**

| UI 區塊 | 行號 | 細節 |
|---------|------|------|
| 頁面標題 + 描述 | 138–144 | t('pages.connectorsTitle'/'pages.connectorsDesc') |
| 「新增連接器」按鈕 | 143 | → `POST /api/connectors` |
| Connectors 卡片清單 | 146 | `CONNECTORS.map(c => <ConnectorCard ... />)` |

**ConnectorCard**（line 19）：
| 區塊 | 行號 | 對應欄位 |
|------|------|----------|
| `<ConnectorDot>` | 14–17, 40 | `status` → 圓點顏色 |
| Name + Provider + ConnectorBadge | 42–46 | `name` `provider` `type` |
| Status label | 48 | 中英對照 status |
| Latency | 49 | `latencyAvg` |
| Error msg | 50 | `error`（status='error' 時） |
| Resets in | 51 | `resetIn`（rate_limited 時） |
| **Quota 長條** | 56–65 | `quotaUsed / quotaMax` 比例；≥80% 變 warning，≥100% 變 error |
| 「Test」按鈕 | 69–71 | → `POST /api/connectors/:id/test`，本地 setTimeout 1.8s 模擬 |
| 「Configure」按鈕 | 72 | toggle expanded |
| **Expanded — Connection 區** | 80–100 | `endpoint` input、`apiKey`（type=password）、Rotate 按鈕（→ `POST .../rotate-key`） |
| **Expanded — Model 區** | 102–122 | `model`、`temperature`（預設 0.7）、`maxTokens`（預設 8192） |
| Cancel / Save | 124–127 | Save → `PATCH /api/connectors/:id` |

### 2. Dashboard — `frontend/components/afh-dashboard.jsx`

- **Connectors 狀態區塊**：用 `ConnectorDot` 顯示每個連接器的健康狀態快覽
- 後端應提供瘦身 `?fields=id,name,status,latencyAvg` 避免回傳 apiKey 等

### 3. Creative Run Detail — `frontend/components/afh-creative.jsx`

| 用途 | 位置 |
|------|------|
| Step 上的 connector 標記 | 各 step.connector（'Claude' / 'Gemini' / 'Runway' / 'Internal'） |
| Connector 微面板 | 顯示此 Run 用到的所有 Connector 即時狀態（latency、quota） |
| AssetVersion 標示 | `version.connector` 顯示這張素材是哪個 Connector 生成 |

### 4. Code Run Detail
- 隱性使用：所有 LLM 呼叫對應的 Connector 不直接顯示，但 `tokens` 使用量是 Connector 的副作用
- 建議擴充：步驟 meta 列加上 `connector` 顯示（與 creative 對齊）

### 5. Insights
- 不直接顯示 Connector，但 `tokensByProject` 的成本與 Connector 計價相關（Gemini / Claude vs Runway 的差異）

## 後端設計建議

- **API Key 處理**
  - 寫入：客戶端送純文字，後端用 KMS / HashiCorp Vault 加密儲存；DB 只存 ciphertext 與 last_4
  - 讀回：永遠回 `'••••••••' + last_4`，不回完整明文
  - rotate：建議與 secret manager 整合，自動帶入新 key 而非由前端輸入

- **健康檢查**
  - 寫一個 health-check worker，每 30s ~ 5min 跑一次（依 type 不同）：發小 ping request、量 latency、更新 status
  - quota 用量：傾向**讀對方 API 的 usage endpoint**而非自己計數，避免 drift；無 usage endpoint 的 provider（如 Midjourney）則自己計

- **rate_limited 與 resetIn**：對方 API 通常會在 429 header 帶 `Retry-After`，把 ISO 時間或秒數正規化為人類可讀（"14 min"）

- **type ↔ capabilities 一致性**：建議在後端維護 `TYPE_CAPABILITY_MAP`，建立時驗證 capabilities 是 type 允許範圍內

- **多區域 / 多 key**：未來可能要每個 provider 多組 key 做 round-robin，建議 schema 預留 `pool: { id, weight, status }[]`

- **Cost 計算**：每個 Connector 配 `pricePerMillionTokens` 或 `pricePerSecond`（video）等欄位，讓 `Run.estimatedCost` 與 `Insights.tokensByProject` 有共同來源
