# Agent Flow Harness — Code Mode MVP 計畫（Rust + Compose + Postgres）

> 版本：v0.2 · 日期：2026-05-08
> 變更：v0.1 是 Bun + Next.js routes + SQLite；v0.2 改為 **Rust（axum）+ Postgres + Docker Compose**，後端獨立到 `backend/` 目錄。
> 目標：在 4–6 個工作天內，產出可 `docker compose up` 一鍵啟動、能觸發真實 Code Mode Run、看到步驟即時更新的 MVP。

---

## 0. TL;DR

- **僅做 Code Mode**，Creative 全砍
- **單一 hardcoded 專案** `commerce-api`、單一 Role
- **三步驟 Run**：Collect Context → Plan → Generate Code
- **Monorepo**：`backend/`（Rust）+ `frontend/`（Next.js，既有）
- **後端**：Rust 1.83 + axum + tokio + sqlx + reqwest
- **DB**：Postgres 16
- **部署 / 開發**：Docker Compose（3 個 service：`db` / `api` / `web`）
- **LLM**：Claude Sonnet 4.6，無官方 Rust SDK，用 `reqwest` 直打 Messages API
- **即時更新**：axum SSE + `tokio::sync::broadcast`

驗收：`cp .env.example .env` 填 API key → `docker compose up` → 開 `http://localhost:3000` → 點「+ 新 Run」→ 看三步依序變綠 → 看到 plan 與 unified diff。

---

## 1. 範圍（同 v0.1，再次條列）

### 做什麼
- Dashboard、Runs List、Code Run Detail 三頁從後端取資料
- 「+ 新 Run」按鈕 + 觸發流程
- 後端三步 Run 引擎 + SSE 推送

### 不做什麼
Creative 全條鏈、Connectors / Roles / Skills / Projects CRUD、Insights 圖表、Run Tests、Fix Attempt、Escalation、真寫檔案 / commit、auth、多人、token 精準計費。

被砍的頁面**保留現有 mock 顯示**，按鈕點下去不打 API。

---

## 2. Repo 結構

```
agent-flow-new/
├── compose.yml                      # 新增
├── .env.example                     # 新增（ANTHROPIC_API_KEY 等）
├── .gitignore                       # 補 backend/target、.env、data/
│
├── backend/                         # 新增 — Rust 後端
│   ├── Cargo.toml
│   ├── Cargo.lock
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── migrations/
│   │   └── 20260508000001_init.sql  # sqlx-cli 命名格式
│   └── src/
│       ├── main.rs                  # axum router + setup
│       ├── config.rs                # 環境變數讀取
│       ├── error.rs                 # AppError + IntoResponse
│       ├── types.rs                 # serde DTO（與 SKILL.md schema 一致）
│       ├── db/
│       │   ├── mod.rs
│       │   ├── projects.rs
│       │   ├── runs.rs
│       │   └── steps.rs
│       ├── routes/
│       │   ├── mod.rs
│       │   ├── projects.rs          # GET /api/projects
│       │   ├── runs.rs              # GET, POST /api/runs, GET /api/runs/:id
│       │   └── events.rs            # GET /api/runs/:id/events (SSE)
│       ├── runner/
│       │   ├── mod.rs               # spawn run + sequencer
│       │   ├── prompt_stack.rs
│       │   ├── collect_context.rs   # s1
│       │   ├── plan.rs              # s2
│       │   └── generate_code.rs     # s3
│       ├── llm.rs                   # Anthropic Messages API wrapper
│       ├── events.rs                # in-process broadcast hub
│       └── tokens.rs                # 成本估算
│
├── frontend/                        # 既有 — Next.js
│   ├── ...
│   ├── next.config.mjs              # 加 rewrites 代理 /api/* 到 backend
│   ├── lib/api/                     # 新增（client wrappers）
│   ├── Dockerfile                   # 新增
│   └── docs/
│       └── MVP-CODE-PLAN.zh-TW.md   # 本檔
│
├── source/                          # 既有 prototype，保留
└── .claude/                         # 既有 SKILL.md，保留
```

---

## 3. 技術棧

| 層 | 選擇 | 備註 |
|----|------|------|
| 後端 HTTP | **axum 0.8** | tower 生態完整、SSE 支援好 |
| Async runtime | **tokio 1** | features `["full"]` |
| DB | **Postgres 16** | docker compose 起 |
| DB driver | **sqlx 0.8** | compile-time checked SQL，async，offline 模式適合 Docker build |
| HTTP client | **reqwest 0.12** | 打 Anthropic API |
| 序列化 | **serde 1** + **serde_json** | |
| Pub/Sub | **`tokio::sync::broadcast`** + `Arc<DashMap<RunId, Sender>>` | 單 process；多 process 後再換 PG LISTEN/NOTIFY |
| SSE | **axum + async-stream** | |
| ID | **nanoid** | `run-` 前綴 + 短 id |
| 時間 | **chrono** + serde feature | TIMESTAMPTZ |
| Logging | **tracing** + **tracing-subscriber** | RUST_LOG 控制 |
| Config | **dotenvy** + 自寫 `Config::from_env()` | 不引入 figment 等 |
| Error | **thiserror** | 自定義 `AppError` 實作 `IntoResponse` |
| 前端 | 維持 Bun + Next.js | 加 `next.config.mjs` rewrites |
| 容器化 | **Docker Compose** | 3 service |

> ⚠️ Rust 沒有官方 Anthropic SDK，所有 LLM 呼叫用 `reqwest` 直接打 `https://api.anthropic.com/v1/messages`，按官方 REST 文件處理 headers（`x-api-key`、`anthropic-version`）與 response 解析。
>
> ⚠️ 套件版本以動工日 `cargo search` 結果為準。寫此計畫時用本知識庫的「合理近期版本」，必要時調整。
>
> ⚠️ Next.js 版本特殊（`frontend/AGENTS.md` 已警告），動手前先讀 `node_modules/next/dist/docs/`。

---

## 4. 資料模型（Postgres）

`backend/migrations/20260508000001_init.sql`：

```sql
CREATE TABLE projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  mode        TEXT NOT NULL CHECK (mode IN ('code', 'creative')),
  stack       JSONB NOT NULL,                        -- ["Node.js","Express",...]
  test_cmd    TEXT,
  active_role TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE runs (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id),
  mode            TEXT NOT NULL DEFAULT 'code',
  role            TEXT NOT NULL,
  task            TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('running','success','failed')),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at        TIMESTAMPTZ,
  duration_ms     INTEGER,
  tokens_used     INTEGER NOT NULL DEFAULT 0,
  estimated_cost  NUMERIC(10, 4) NOT NULL DEFAULT 0,
  steps_done      INTEGER NOT NULL DEFAULT 0,
  steps_total     INTEGER NOT NULL DEFAULT 3
);
CREATE INDEX idx_runs_started_at ON runs (started_at DESC);
CREATE INDEX idx_runs_status     ON runs (status);

CREATE TABLE steps (
  run_id              TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  ord                 INTEGER NOT NULL,
  step_id             TEXT NOT NULL,                 -- 's1'/'s2'/'s3'
  name                TEXT NOT NULL,
  status              TEXT NOT NULL CHECK (status IN ('pending','running','success','failed')),
  started_at          TIMESTAMPTZ,
  duration_ms         INTEGER,
  tokens              INTEGER,
  input               TEXT,
  output              TEXT,
  collector_breakdown JSONB,
  diff_before         TEXT,
  diff_after          TEXT,
  diff_path           TEXT,
  PRIMARY KEY (run_id, ord)
);

-- 種子資料
INSERT INTO projects (id, name, mode, stack, test_cmd, active_role) VALUES
  ('commerce-api', 'commerce-api', 'code',
   '["Node.js","Express","PostgreSQL","Redis"]'::jsonb,
   NULL, 'Backend Engineer');
```

> 用 sqlx-cli 跑 migration：`sqlx migrate run`。容器啟動時於 `main.rs` 跑 `sqlx::migrate!().run(&pool).await?` 自動 apply。

---

## 5. API 端點

| Method | Path | 說明 |
|--------|------|------|
| GET | `/api/projects` | 列出 projects（含 `runsToday`、`successRate` derived） |
| GET | `/api/runs` | 列表，支援 `?status=&mode=&project=&limit=&sort=` |
| POST | `/api/runs` | 觸發新 Run，body `{ projectId, task }`，202 + 立即回基本 run |
| GET | `/api/runs/:runId` | 單筆 run + 全部 steps |
| GET | `/api/runs/:runId/events` | SSE 推送 step / run 更新 |
| GET | `/health` | DB ping，回 200 / 503，給 compose healthcheck 用 |

> 詳細 schema 同 `.claude/skills/run/SKILL.md`、`step/SKILL.md`、`project/SKILL.md`，DTO 在 `src/types.rs` 用 `#[derive(Serialize)]` 鏡像出來。

### SSE event 格式

```
event: step_update
data: {"stepId":"s2","status":"success","tokens":6800,"durationMs":3800,"output":"..."}

event: run_update
data: {"status":"success","tokensUsed":29200,"estimatedCost":0.18,"endedAt":"..."}

event: done
data: {}
```

---

## 6. 後端關鍵程式骨架

### 6.1 `Cargo.toml`

```toml
[package]
name = "afh-backend"
version = "0.1.0"
edition = "2024"

[dependencies]
axum = { version = "0.8", features = ["macros"] }
tokio = { version = "1", features = ["full"] }
tower = "0.5"
tower-http = { version = "0.6", features = ["cors", "trace"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sqlx = { version = "0.8", default-features = false, features = [
  "postgres", "runtime-tokio", "tls-rustls",
  "chrono", "macros", "json", "migrate"
] }
reqwest = { version = "0.12", default-features = false, features = ["json", "rustls-tls"] }
chrono = { version = "0.4", features = ["serde"] }
nanoid = "0.4"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
dotenvy = "0.15"
anyhow = "1"
thiserror = "2"
async-stream = "0.3"
futures = "0.3"
dashmap = "6"

[profile.release]
lto = "thin"
codegen-units = 1
strip = true
```

> **動手前 `cargo search axum` 等確認最新版本**，本表為知識庫近期版本估計。

### 6.2 `main.rs` 雛型

```rust
use axum::{Router, routing::{get, post}};
use sqlx::postgres::PgPoolOptions;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use std::sync::Arc;

mod config;
mod db;
mod error;
mod events;
mod llm;
mod routes;
mod runner;
mod tokens;
mod types;

pub struct AppState {
    pub pool: sqlx::PgPool,
    pub events: events::Hub,
    pub config: config::Config,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt().with_env_filter(
        tracing_subscriber::EnvFilter::from_default_env()
    ).init();

    let cfg = config::Config::from_env()?;
    let pool = PgPoolOptions::new().max_connections(10).connect(&cfg.database_url).await?;
    sqlx::migrate!("./migrations").run(&pool).await?;

    let state = Arc::new(AppState { pool, events: events::Hub::new(), config: cfg.clone() });

    let app = Router::new()
        .route("/health", get(routes::health))
        .route("/api/projects", get(routes::projects::list))
        .route("/api/runs", get(routes::runs::list).post(routes::runs::create))
        .route("/api/runs/:run_id", get(routes::runs::detail))
        .route("/api/runs/:run_id/events", get(routes::events::sse))
        .with_state(state)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", cfg.port)).await?;
    tracing::info!("listening on {}", listener.local_addr()?);
    axum::serve(listener, app).await?;
    Ok(())
}
```

### 6.3 `events.rs` — SSE pub/sub hub

```rust
use dashmap::DashMap;
use tokio::sync::broadcast;
use std::sync::Arc;

#[derive(Clone, serde::Serialize)]
pub struct Evt { pub event: String, pub data: serde_json::Value }

#[derive(Clone)]
pub struct Hub { inner: Arc<DashMap<String, broadcast::Sender<Evt>>> }

impl Hub {
    pub fn new() -> Self { Self { inner: Arc::new(DashMap::new()) } }
    pub fn subscribe(&self, run_id: &str) -> broadcast::Receiver<Evt> {
        let tx = self.inner.entry(run_id.into())
            .or_insert_with(|| broadcast::channel(64).0).clone();
        tx.subscribe()
    }
    pub fn emit(&self, run_id: &str, event: &str, data: serde_json::Value) {
        if let Some(tx) = self.inner.get(run_id) {
            let _ = tx.send(Evt { event: event.into(), data });
        }
    }
    pub fn close(&self, run_id: &str) {
        self.emit(run_id, "done", serde_json::json!({}));
        self.inner.remove(run_id);
    }
}
```

### 6.4 `runner/mod.rs` — 觸發與 sequencer

```rust
pub fn spawn(state: Arc<AppState>, run_id: String) {
    tokio::spawn(async move {
        if let Err(e) = run_pipeline(state.clone(), &run_id).await {
            tracing::error!(?e, run_id, "pipeline failed");
            let _ = mark_failed(&state.pool, &run_id).await;
            state.events.emit(&run_id, "run_update",
                serde_json::json!({"status":"failed","error": e.to_string()}));
        }
        state.events.close(&run_id);
    });
}

async fn run_pipeline(state: Arc<AppState>, run_id: &str) -> anyhow::Result<()> {
    collect_context::run(&state, run_id).await?;
    plan::run(&state, run_id).await?;
    generate_code::run(&state, run_id).await?;
    finalize_success(&state, run_id).await?;
    Ok(())
}
```

### 6.5 `llm.rs` — Anthropic Messages API

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct Req<'a> {
    model: &'a str,
    max_tokens: u32,
    system: &'a str,
    messages: Vec<Msg<'a>>,
}
#[derive(Serialize)] struct Msg<'a> { role: &'a str, content: &'a str }

#[derive(Deserialize)]
pub struct Resp {
    pub content: Vec<Block>,
    pub usage: Usage,
}
#[derive(Deserialize)] pub struct Block { pub text: String }
#[derive(Deserialize)] pub struct Usage { pub input_tokens: u32, pub output_tokens: u32 }

pub async fn chat(cfg: &Config, system: &str, user: &str) -> anyhow::Result<Resp> {
    let client = reqwest::Client::new();
    let resp = client.post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", &cfg.anthropic_api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&Req {
            model: &cfg.model, max_tokens: cfg.max_tokens, system,
            messages: vec![Msg { role: "user", content: user }],
        })
        .send().await?
        .error_for_status()?
        .json::<Resp>().await?;
    Ok(resp)
}
```

> 後續若要 streaming 改 `stream: true` 並用 `eventsource-stream` parse SSE chunks。MVP 直接 await 完整回應即可。

### 6.6 `routes/events.rs` — SSE handler

```rust
use axum::response::sse::{Sse, Event};
use axum::extract::{Path, State};
use std::convert::Infallible;
use futures::stream::Stream;

pub async fn sse(
    State(state): State<Arc<AppState>>,
    Path(run_id): Path<String>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let mut rx = state.events.subscribe(&run_id);
    let stream = async_stream::stream! {
        // 啟動時先吐當前狀態
        if let Ok(Some(snapshot)) = db::runs::get_with_steps(&state.pool, &run_id).await {
            yield Ok(Event::default().event("snapshot")
                .data(serde_json::to_string(&snapshot).unwrap()));
        }
        while let Ok(evt) = rx.recv().await {
            yield Ok(Event::default().event(&evt.event)
                .data(serde_json::to_string(&evt.data).unwrap()));
            if evt.event == "done" { break; }
        }
    };
    Sse::new(stream).keep_alive(axum::response::sse::KeepAlive::default())
}
```

---

## 7. Prompt Stack（hardcode 在 `runner/prompt_stack.rs`）

```rust
pub const ROLE_GLOBAL: &str = "You are a senior backend engineer working on a production codebase. \
Implement the requested feature with minimal changes.\n\n\
Rules:\n- Write idiomatic code matching existing style\n- Always handle errors explicitly\n\
- Add tests for new functionality\n- Do not refactor unrelated code";

pub fn project_layer(p: &Project) -> String {
    format!("Project: {}\nStack: {}\nTest command: {}",
            p.name, p.stack.join(", "), p.test_cmd.as_deref().unwrap_or("n/a"))
}

pub fn task_layer(task: &str, ctx: &str) -> String {
    format!("Task: {}\n\nAvailable context:\n{}", task, ctx)
}

pub fn build_system(p: &Project, task: &str, ctx: &str) -> String {
    [ROLE_GLOBAL.to_string(), project_layer(p), task_layer(task, ctx)].join("\n\n")
}
```

| Step | system | user | parse |
|------|--------|------|-------|
| s1 | — | — | 直接 `tokio::fs::read` 數個 hardcoded 路徑（README、package.json、`routes/*.js`），算 token 比例做 collector_breakdown |
| s2 | build_system | "Plan how to implement this task. Return a numbered list of 3–7 steps." | output 直接存 |
| s3 | build_system + 上一步 plan | "Generate the code as a unified diff. Use `diff --git a/path b/path` headers." | regex 抓第一個 \`\`\`diff fenced block；`---`/`+++` line 抓 path；其餘存 diff_after，diff_before 為空（或自己 patch 出 before） |

---

## 8. Docker Compose

### 8.1 `compose.yml`

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: afh
      POSTGRES_PASSWORD: afh
      POSTGRES_DB: afh
    ports: ["5432:5432"]
    volumes: [pg_data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U afh -d afh"]
      interval: 5s
      timeout: 5s
      retries: 10

  api:
    build: { context: ./backend }
    environment:
      DATABASE_URL: postgres://afh:afh@db:5432/afh
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      AFH_MODEL: claude-sonnet-4-6
      AFH_MAX_TOKENS: 8192
      AFH_PORT: 3001
      RUST_LOG: info,afh_backend=debug
    ports: ["3001:3001"]
    depends_on:
      db: { condition: service_healthy }
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/health"]
      interval: 10s
      retries: 6

  web:
    build: { context: ./frontend }
    environment:
      AFH_BACKEND_URL: http://api:3001
      NODE_ENV: production
    ports: ["3000:3000"]
    depends_on:
      api: { condition: service_healthy }

volumes:
  pg_data:
```

### 8.2 `backend/Dockerfile`（multi-stage）

```dockerfile
FROM rust:1.83-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
      pkg-config libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
COPY Cargo.toml Cargo.lock ./
# cache 依賴：先 build 一個空殼
RUN mkdir src && echo "fn main(){}" > src/main.rs && \
    cargo build --release && rm -rf src
COPY src ./src
COPY migrations ./migrations
RUN touch src/main.rs && cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates wget && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/afh-backend /usr/local/bin/afh-backend
COPY --from=builder /app/migrations ./migrations
EXPOSE 3001
CMD ["afh-backend"]
```

### 8.3 `frontend/Dockerfile`

```dockerfile
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM oven/bun:1
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000
CMD ["bun", "run", "start"]
```

### 8.4 `frontend/next.config.mjs` 加 proxy

```js
const backend = process.env.AFH_BACKEND_URL ?? 'http://localhost:3001';

export default {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }];
  },
};
```

> SSE 通過 Next 的 rewrite 在某些版本可能 buffer。若觀察到 SSE 不即時，前端改直接 `fetch(\`${NEXT_PUBLIC_AFH_BACKEND_URL}/api/runs/.../events\`)`，並把 `NEXT_PUBLIC_AFH_BACKEND_URL` 設為 `http://localhost:3001`。

### 8.5 `.env.example`

```bash
# 必填
ANTHROPIC_API_KEY=sk-ant-...

# 選填（有預設值）
AFH_MODEL=claude-sonnet-4-6
AFH_MAX_TOKENS=8192
```

### 8.6 兩種開發模式

| 模式 | 指令 | 適用 |
|------|------|------|
| **全容器** | `docker compose up` | 第一次跑通、CI、demo |
| **僅 DB 容器，api/web 跑在 host**（更快迭代） | `docker compose up -d db` 然後 `cd backend && cargo run`、另一終端 `cd frontend && bun run dev` | 日常開發 |

---

## 9. 前端改動（同 v0.1，補 backend URL 處理）

### 9.1 `lib/api/runs.js` 例

```js
export async function listRuns(filters = {}) {
  const qs = new URLSearchParams(filters).toString();
  const res = await fetch(`/api/runs${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(`listRuns: ${res.status}`);
  return res.json();
}

export async function createRun({ projectId, task }) {
  const res = await fetch('/api/runs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ projectId, task }),
  });
  if (!res.ok) throw new Error(`createRun: ${res.status}`);
  return res.json();
}

export function subscribeRun(runId, handlers) {
  const es = new EventSource(`/api/runs/${runId}/events`);
  if (handlers.snapshot)    es.addEventListener('snapshot',    e => handlers.snapshot(JSON.parse(e.data)));
  if (handlers.stepUpdate)  es.addEventListener('step_update', e => handlers.stepUpdate(JSON.parse(e.data)));
  if (handlers.runUpdate)   es.addEventListener('run_update',  e => handlers.runUpdate(JSON.parse(e.data)));
  es.addEventListener('done', () => es.close());
  return () => es.close();
}
```

### 9.2 替換 mock
- `Dashboard` / `Runs` / `Code Run Detail` 改用上面三個 function
- `Connectors` / `Roles` / `Skills` / `Insights` 維持 mock import

### 9.3 「+ 新 Run」modal
- 位置：Topbar 右側，theme toggle 旁
- 欄位：Project（下拉，先只有 `commerce-api`）、Task（textarea，min 10 字）
- 提交：`createRun()` → 成功跳到 Run Detail 並訂閱 SSE

---

## 10. 工作拆解（4–6 天）

### Day 0（半天）— 結構與 compose 雛型
- [ ] 建 `backend/`、`compose.yml`、`.env.example`
- [ ] `cargo init` 後填上述 `Cargo.toml`
- [ ] `docker compose up db` 跑得起來，`psql -h localhost -U afh -d afh` 連得上
- [ ] `cargo run` 起最小 axum app，`/health` 回 200

**Demo 點**：`curl http://localhost:3001/health` → `ok`

### Day 1（一天）— DB + projects + runs list
- [ ] 寫 migration（projects / runs / steps + seed）
- [ ] `db/projects.rs`：list with stats
- [ ] `db/runs.rs`：list with filters
- [ ] `routes/projects.rs`、`routes/runs.rs::list`、`routes/runs.rs::detail`
- [ ] DTO 對齊 SKILL.md schema

**Demo 點**：`curl localhost:3001/api/projects` 拿 seed 專案；`curl localhost:3001/api/runs` 拿空陣列

### Day 2（一天）— LLM + runner
- [ ] `llm.rs` 用 reqwest 打通 messages.create
- [ ] `runner/collect_context.rs`：讀 hardcoded 檔案（mock 的 README、package.json…）算 breakdown
- [ ] `runner/plan.rs`、`runner/generate_code.rs` 各跑一次
- [ ] `events.rs` broadcast hub；step 完成時 emit
- [ ] `POST /api/runs` 寫 DB + spawn runner

**Demo 點**：`curl -X POST … /api/runs`，過幾十秒後 `curl /api/runs/:id` 看到三步皆 success、有 plan / diff

### Day 3（一天）— SSE + 前端整合（後端結束）
- [ ] `routes/events.rs` SSE
- [ ] 前端 `lib/api/`、改 Dashboard / Runs / RunDetail
- [ ] 加「+ 新 Run」modal
- [ ] `next.config.mjs` 加 rewrites
- [ ] 端到端：點按鈕 → 跑完看到 diff

**Demo 點**：瀏覽器完整 happy path

### Day 4（一天）— 容器化 + 收尾
- [ ] 寫 `backend/Dockerfile`、`frontend/Dockerfile`
- [ ] `docker compose up` 一鍵跑通
- [ ] Error handling：API 失敗 toast、SSE 斷線重連
- [ ] Empty state、隱藏 / 停用 Creative 入口
- [ ] README 更新跑法（host dev mode + full compose mode）
- [ ] Demo 排練

**Demo 點**：clean clone → `cp .env.example .env`（填 key）→ `docker compose up` → 跑完 happy path

### Day 5 buffer
保留給 Anthropic / Next.js 雷區、Rust 編譯時間爆炸、SSE proxy buffering 等預期外問題。

---

## 11. 驗收標準

### 11.1 Happy path
與 v0.1 相同（9 步），但啟動方式換成 `docker compose up`。

### 11.2 額外驗收（容器化）
- ✅ `docker compose down -v && docker compose up` 後資料清空、re-seed、能再跑通
- ✅ `docker compose ps` 三個 service 全 healthy
- ✅ `docker compose logs api` 有 `tracing` 結構化輸出
- ✅ 重啟 `api` service：未完成的 Run 標 failed，前端 UI 不卡死
- ✅ Postgres volume 持久化：`docker compose restart db` 後資料還在

### 11.3 不在驗收範圍
- 多 process api（單機 broadcast 即可）
- 上 cloud 部署
- 跨瀏覽器、Mobile RWD
- LLM 拒答 / safety 觸發處理

---

## 12. 風險與對策

| 風險 | 對策 |
|------|------|
| Rust 編譯時間長拖慢迭代 | Day 0 起一律 `cargo watch -x run`；釋出 image 才用 release build |
| sqlx compile-time check 需要連到 DB | 開發用 `SQLX_OFFLINE=true` + 預先 `cargo sqlx prepare`；或 macros 用 `query!` 改 `query_as_unchecked`（最終再 enforce） |
| Anthropic 沒官方 Rust SDK，REST 細節變動 | 把 `llm.rs` 寫薄、欄位用 `serde_json::Value` 兜住未知欄位；headers 對齊官方文件 |
| axum 0.8 vs 訓練資料中的 0.6/0.7 API 差異 | 動工前 `cargo doc --open` 看本地版本，特別是 `Sse`、`State`、`Path` extractor |
| Next.js rewrites 對 SSE 做 buffering | 若觀察到延遲，前端改直接打 `localhost:3001`（dev）或加 `Cache-Control: no-cache, no-transform` |
| Postgres 在 macOS 容器啟動慢 | `depends_on.condition: service_healthy` 已處理；首次 build 預期慢 |
| LLM 回的 diff 不合法 | parse 失敗 fallback 顯示原始 LLM output 為 plain text |
| Run 跑超過 60s 容器重啟中斷 | MVP 不上 serverless；本機 / VM 跑就 OK；上線時改背景 worker |
| Docker build 在 M 系列 Mac vs x86 服務器 image 差異 | 統一用 `linux/amd64` 標 `--platform`，或用 buildx 多平台 |

---

## 13. 後 MVP（Phase 2）

優先順序不變：
1. Run Tests + Fix Attempt + Escalation 完整迴圈
2. Connectors / Roles / Projects 真 CRUD（後端 endpoint 補齊到符合 SKILL.md）
3. Creative Mode 整條鏈（c1–c6 + Asset / Scene / ReviewDecision）
4. Auth（Clerk / Auth.js 對接）
5. 上 cloud（Fly.io / Railway / 自架 K8s）

---

## 14. 參考

- 領域物件：`.claude/skills/`（20 個 SKILL.md + README）
- 既有 API 規格：`frontend/docs/API-SPEC.zh-TW.md`、`FEATURES-AND-API.zh-TW.md`
- Anthropic Messages API：https://docs.anthropic.com/en/api/messages
- axum：`cargo doc --open` 看本地版本
- sqlx：https://docs.rs/sqlx
- Postgres in Compose：https://hub.docker.com/_/postgres

---

*計畫結束。下一步：建 `backend/` 骨架 + `compose.yml` + DB up（Day 0）*
