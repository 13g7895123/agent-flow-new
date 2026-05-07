# Agent Flow Harness — 後端領域物件 Skills 索引

本目錄將 Agent Flow Harness 的所有功能以**後端視角**拆解為可獨立設計、實作與配置的領域物件（Domain Object）。每個物件對應一個 `.claude/skills/<name>/SKILL.md`。

## 物件分類

### 一、Agent 配置層（Configuration）— 「使用者要設定什麼」

| Skill | 物件 | 一句話 | 出現頁面 |
|-------|------|--------|----------|
| [agent](./agent/SKILL.md) | Agent | 整合 Role + Prompts + Skills + Connectors，是執行 Run 的角色實體 | 隱式存在於所有 Run、Project、Role 配置 |
| [project](./project/SKILL.md) | Project | 一個自動化作業所屬的專案（含 Stack、Test Cmd、Active Role） | Projects、Dashboard、Runs、Insights、Run Detail |
| [role](./role/SKILL.md) | Role | 角色定義（Backend Engineer / Creative Director…），含三層 Prompts | Roles、Projects（activeRole）、Run Detail（顯示用） |
| [prompt-layer](./prompt-layer/SKILL.md) | PromptLayer | Global / Project / Task 三層提示詞堆疊 | Roles（PromptLayerEditor） |
| [agent-skill](./agent-skill/SKILL.md) | AgentSkill | Agent 可呼叫的工具技能（SQL Reader、Test Runner…） | Skills（SkillsPage）、Roles（顯示適用角色） |
| [connector](./connector/SKILL.md) | Connector | 外部 AI 服務連線（Gemini、Claude、Runway、Midjourney） | Connectors、Dashboard（狀態快覽）、Creative Run Detail（步驟連接器、微面板） |

### 二、Run 執行層（Execution）— 「Agent 跑出了什麼」

| Skill | 物件 | 一句話 | 出現頁面 |
|-------|------|--------|----------|
| [run](./run/SKILL.md) | Run | 一次 Agent 執行紀錄（Code 或 Creative 模式） | Dashboard（Active / Recent）、Runs、Code Detail、Creative Detail、Insights |
| [step](./step/SKILL.md) | Step | Run 內的單一步驟（Collect Context / Generate Code / Script Generation…） | Code Detail、Creative Detail（StepTimeline） |
| [code-diff](./code-diff/SKILL.md) | CodeDiff | Generate Code 步驟產出的 before / after 差異 | Code Detail（DiffViewer，split / unified） |
| [test-result](./test-result/SKILL.md) | TestResult | Run Tests 步驟的單筆測試結果（含 errorType、stack） | Code Detail（TestPanel） |
| [context-source](./context-source/SKILL.md) | ContextSource | Collect Context 步驟收集到的單一檔案（token 占比） | Code Detail（ContextViewer） |
| [escalation-request](./escalation-request/SKILL.md) | EscalationRequest | 人工介入請求（hint、Resume、Abort） | Code Detail（EscalationBanner）、Dashboard（warning banner） |

### 三、Creative 素材層（Creative Asset）— 「Creative Run 生出了什麼」

| Skill | 物件 | 一句話 | 出現頁面 |
|-------|------|--------|----------|
| [scene](./scene/SKILL.md) | Scene | Creative Run 的單一場景，下含多個 Asset 版本 | Creative Detail（AssetGallery 行、Lightbox 上方標題） |
| [asset](./asset/SKILL.md) | Asset | Scene 下單一素材（一個 sceneId，多個版本） | Creative Detail（Gallery / Lightbox / ReviewPanel） |
| [asset-version](./asset-version/SKILL.md) | AssetVersion | 一個 Asset 的單一版本（pending / approved / rejected / generating） | Creative Detail（每張縮圖、版本切換器） |
| [review-decision](./review-decision/SKILL.md) | ReviewDecision | 審核操作（approve / reject + feedback / regenerate） | Creative Detail（Lightbox 按鈕、ReviewPanel、批次通過） |

### 四、觀測與全域層（Observability & Global）

| Skill | 物件 | 一句話 | 出現頁面 |
|-------|------|--------|----------|
| [dashboard-summary](./dashboard-summary/SKILL.md) | DashboardSummary | 今日彙總統計（Code / Creative Runs、Tokens、Cost、待審） | Dashboard（StatCards）、Insights（Today summary） |
| [insight-metric](./insight-metric/SKILL.md) | InsightMetric | 8 天歷史趨勢與專案明細（first-pass rate、avg fix attempts、tokensByProject） | Insights |
| [user-preference](./user-preference/SKILL.md) | UserPreference | 使用者本地偏好（theme / language / sidebar，僅 localStorage） | Topbar、Sidebar、I18nProvider（全域） |
| [command-palette-item](./command-palette-item/SKILL.md) | CommandPaletteItem | Cmd/Ctrl+K 命令面板的單筆可選項（page / run / project） | CommandPalette（全域） |

## 物件關係圖（簡化）

```
Project ──1:N─┬─> Run ──1:N─┬─> Step ──┬─> CodeDiff
              │             │          ├─> TestResult[]
              │             │          ├─> ContextSource[]
              │             │          └─> Asset[]   (creative 模式)
              │             │
              │             └─> EscalationRequest
              │
              └─activeRole─> Role ──promptLayers──> PromptLayer (global / project / task)
                              │
                              └─uses──> AgentSkill (M:N) ──invokes──> Connector (M:N)

Asset ──1:N──> AssetVersion ──reviewedBy──> ReviewDecision
Scene ──1:N──> Asset

DashboardSummary  ── 即時彙總自 Run / Asset / Connector
InsightMetric     ── 歷史彙總自 Run（8 天）
UserPreference    ── 純 localStorage
CommandPaletteItem ── 索引 Page / Run / Project 三類資料
```

## 後端 API 命名空間（總覽）

| 命名空間 | 對應 Skill |
|----------|-----------|
| `/api/projects` | project |
| `/api/roles` | role / prompt-layer |
| `/api/skills` | agent-skill |
| `/api/connectors` | connector |
| `/api/runs` | run / step / code-diff / test-result / context-source / escalation-request |
| `/api/runs/:runId/assets` | asset / asset-version / review-decision |
| `/api/dashboard/summary` | dashboard-summary |
| `/api/insights/*` | insight-metric |
| `/api/search` | command-palette-item |
| (無 — 純 localStorage) | user-preference |

## 注意事項

- 「Agent」是配置抽象，**沒有獨立的 CRUD endpoint**；它由 Project + Role + AgentSkill[] + Connector[] 組合而成。
- 「AgentSkill」與本目錄的「Claude Code Skill」是兩個概念，前者是 Agent Flow Harness 應用程式內的工具技能定義，後者是這份指引本身的容器格式。
- 所有時間欄位採用 ISO-8601 (`startedAt: '2026-04-24T14:10:00Z'`)。Run 卡片顯示用的 `duration` 是已格式化字串（`'8m 14s'`）。
