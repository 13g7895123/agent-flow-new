---
name: command-palette-item
description: Use when designing the search index entries shown in the Cmd/Ctrl+K command palette (pages, runs, projects). Covers schema, source-of-truth aggregation, keyboard navigation, and the CommandPalette UI overlay.
---

# CommandPaletteItem

## 一句話定義
**CommandPaletteItem** 是 Cmd/Ctrl+K 命令面板的單一可選項，用於跨頁面快速跳轉。每筆項目歸屬於一個 type（page / run / project，未來可擴 role / connector / skill），並對應一個 navigation action。

## 後端 Schema

```ts
type ItemType = 'page' | 'run' | 'project' | 'role' | 'connector' | 'skill';

interface CommandPaletteItem {
  id: string;                  // 'page:dashboard' / 'run:run-4821' / 'project:commerce-api'
  type: ItemType;
  label: string;               // '儀表板' / 'run-4821' / 'commerce-api'
  sublabel?: string;           // 'Code · Backend Engineer' 額外提示
  icon?: string;               // 對應 Icon name
  // navigation 動作
  action: {
    page: 'dashboard' | 'runs' | 'roles' | 'skills' | 'connectors' | 'projects' | 'insights';
    selectedRunId?: string;    // type='run' 時帶
    selectedProjectId?: string;
  };
  // 排序與搜尋
  searchTokens: string[];      // 預先 tokenize 加速 fuzzy match
  weight?: number;             // 越高越優先顯示
}
```

> mock 沒有獨立資料；CommandPalette 內部自行查 PROJECTS / RUNS / 頁面常數

## 來源資料（在前端組合）

```js
// 偽 code — 前端的索引應由這幾個源頭組合
[
  ...PAGES.map(p => ({ type: 'page', label: t(`nav.${p}`), action: { page: p } })),
  ...RUNS.map(r => ({ type: 'run', label: r.id, sublabel: r.task, action: { page: 'runs', selectedRunId: r.id } })),
  ...PROJECTS.map(p => ({ type: 'project', label: p.name, sublabel: p.mode, action: { page: 'projects' } })),
]
```

## 鍵盤互動

| Key | 行為 |
|-----|------|
| `Cmd/Ctrl + K` | 開啟 / 關閉（在 `app-shell.jsx:46–55` 處理） |
| `Esc` | 關閉 |
| `↑ / ↓` | 移動選擇 |
| `Enter` | 執行 action |
| `Tab` | （建議）在 type 分類間跳 |

## API 端點

| 功能 | Method | Endpoint | 備註 |
|------|--------|----------|------|
| 全文搜尋 | `GET` | `/api/search?q=cart` | 跨 type；回 `CommandPaletteItem[]` |
| 取得索引（cold start） | `GET` | `/api/search/index` | 回完整索引（cache 在 client） |

> mock 在前端直接 filter 陣列；正式版若資料量大（>1000 runs）建議走 server-side search（PostgreSQL ts_vector / Elasticsearch）

## 出現在哪些頁面（非常詳盡）

### 全域 — `frontend/components/afh-ui.jsx` `CommandPalette` (line 254)

**唯一互動位置**

| UI 區塊 | 細節 |
|---------|------|
| Trigger | 全域鍵盤監聽，`Cmd/Ctrl+K`（`app-shell.jsx:46–55`） |
| Backdrop | 全螢幕半透明 backdrop，點擊關閉 |
| **Search input** | 自動 focus；輸入即時 filter |
| Results 列表 | 依 type 分類顯示（Pages / Runs / Projects） |
| 鍵盤導覽 | 方向鍵切換、Enter 執行 |
| Esc 關閉 | `app-shell.jsx:51` |

### 觸發位置

| 位置 | 細節 |
|------|------|
| Topbar Cmd-K 按鈕（mock 可能有也可能無）| 點擊 → `setCmdOpen(true)`（`app-shell.jsx:171`） |
| 全域鍵盤事件 | `app-shell.jsx:46–55` 監聽 keydown |

### 不在哪些頁面
- Run Detail 內子頁：仍可呼叫（全域層級），但建議在 textarea / input focus 時 disable trigger（避免 Cmd+K 衝突）

## 後端設計建議

- **client-side filter vs server-side**：
  - <500 items：client-side（簡單、即時、無 latency）
  - 500–10k：server-side 分頁 + debounce 200ms
  - 10k+：server-side + Elasticsearch / Meilisearch
- **fuzzy match**：用 `fuse.js`（client）或 PG `pg_trgm`（server）
- **權重設計**：
  - type='page' 永遠在頂端（使用者 90% 是換頁）
  - type='run' 越新越前
  - 完全 prefix match 加分
  - 最近開過的 (recency) 加分
- **快捷搜尋語法**：建議支援 `>` 開頭直接跳指令（如 `>theme:dark` 切主題）；`#tag` 之類 namespace prefix
- **多語言**：page label 跟著 i18n；後端 search index 應雙語存（zh-TW + en），任何語言都能搜到
- **未來擴充 type**：Role / Connector / Skill 加入索引時，記得各 type 視覺與 sublabel 統一風格
- **隱私**：搜尋紀錄不要紀錄到 server log，避免敏感 task description（如 'Fix payment gateway HMAC bug'）外洩
- **離線快取**：index endpoint response 加 ETag + cache 1h，前端 IndexedDB 持久化，加速冷啟動
- **selectedRunId 與 page navigation 銜接**：`app-shell.jsx:152` 有 `setPageAndResetRun` — 注意 navigate 到 run 時要 set page='runs' + setSelectedRun(id) 兩個 state，否則 RunsListPage 會顯示 list 而非 detail
