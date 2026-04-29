# Agent Flow Harness — UI Design Brief v3
### 給 Claude Design 的完整設計指示
### 雙模式：Web 開發 + 影片生成

---

## 一、目標（Goal）

設計一套 **Agent Flow Harness 管理平台** web UI，支援兩種工作模式：

### 模式 A：Web 開發（Code Mode）

驅動 AI Agent 自動完成網站開發，流程有自動化測試作為回饋閉環：

```
Plan → Code → Test → Feedback → Fix → Re-test（自動閉環）
```

### 模式 B：影片生成（Creative Mode）

驅動 AI Agent 串接多個生成工具（LLM 腳本 → 生圖 → 影片合成），流程沒有自動化測試，改為**人工審核**作為回饋機制：

```
Plan → Generate → Preview → Human Review → Revise（人機協作閉環）
```

**兩種模式共用同一套介面框架**（Sidebar、Layout、Roles、Prompts、Skills 管理），但在 Run 詳情頁、回饋機制、Agent 串接方式上有顯著差異。平台需要讓使用者在建立 Project 時選擇模式，之後的 UI 動態適配。

---

## 二、受眾（Audience）

**單一使用者：個人開發者 / 創作者（就是你自己）**

行為特徵：
- Code Mode 時是工程師心態，在乎精確、效率、可追蹤
- Creative Mode 時是創作者心態，在乎預覽品質、迭代速度、視覺呈現
- 同時管理多個專案，有些是 code、有些是 video
- 對系統完全熟悉，不需要教學

兩種模式的使用差異：

| 面向 | Code Mode | Creative Mode |
|------|-----------|---------------|
| 核心問題 | 「測試過了嗎？哪裡出錯？」 | 「生成的結果長怎樣？滿意嗎？」 |
| 回饋來源 | 自動化測試結果 | 人眼看了預覽後的判斷 |
| 關注的 output | 程式碼 diff、test log | 圖片、影片預覽 |
| 失敗處理 | Agent 自動修 → 人工兜底 | 人工給回饋 → Agent 重新生成 |
| 等待時間 | 秒級（test runner） | 分鐘級（生圖、合成影片） |

---

## 三、內容（Content）

### 3.1 主要頁面架構

```
Agent Flow Harness
│
├── Dashboard（首頁）
│   ├── 活躍任務（兩種模式混合顯示，用 badge 區分）
│   ├── 快速指標（分模式統計）
│   └── 最近執行記錄
│
├── Runs（執行記錄）
│   ├── Run 列表（可篩選模式 / 專案 / 狀態）
│   │
│   ├── Run 詳情 — Code Mode
│   │   ├── Step Timeline
│   │   ├── Code Diff Viewer
│   │   ├── Test Results Panel
│   │   └── Context Viewer
│   │
│   └── Run 詳情 — Creative Mode（差異見 3.3）
│       ├── Step Timeline
│       ├── Asset Gallery（生成結果預覽）
│       ├── Review Panel（人工審核介面）
│       └── Agent Connector 狀態
│
├── Roles & Prompts
│   ├── 角色列表（兩種模式各自的角色）
│   ├── Prompt 編輯器
│   └── 版本歷史
│
├── Skills
│   ├── Skill 列表
│   ├── Skill 編輯
│   └── 關聯設定
│
├── Agent Connectors（新增：外部 Agent 串接管理）
│   ├── 已連接的 Agent 列表
│   ├── Connector 設定（API key、endpoint、model）
│   └── Health Check / 連線狀態
│
├── Projects
│   ├── 專案列表（標示 Code / Creative 模式）
│   ├── 專案設定
│   └── Context Collector 設定（Code Mode 專用）
│
└── Insights
    ├── Code Mode 指標（通過率、修復次數）
    └── Creative Mode 指標（生成次數、審核通過率、耗時）
```

### 3.2 共用 UI 元件

以下元件兩種模式共用：

**Step Timeline**
- 垂直時間軸，節點代表每個 step
- 狀態：pending / running（動畫）/ success / failed / waiting_review（Creative 新增）
- 展開節點：顯示 input、output、duration、token / cost
- Creative Mode 的節點可能是「生圖中（Midjourney）」、「合成影片中（Runway）」

**Prompt Editor**
- Code Mode：`{framework}` 等技術變數
- Creative Mode：`{scene_description}`、`{style_reference}`、`{aspect_ratio}` 等創作變數
- 三層堆疊預覽不變

**Command Palette（`⌘K`）**
- 全域搜尋所有 run、專案、設定
- 支援快速操作：「重新執行 Run-042」、「切換到 Project X」

### 3.3 Creative Mode 專屬 UI 元件

**① Asset Gallery（生成結果預覽）**

這是 Creative Mode 最重要的元件，取代了 Code Mode 的 Code Diff Viewer。

- 網格 / 列表切換
- 圖片：顯示生成結果的縮圖，點擊放大檢視
- 影片：內嵌 player，支援 play / pause / scrub
- 每個 asset 標示：生成工具（Gemini / Midjourney / Runway）、耗時、成本
- 可直接在 asset 上「標記不滿意的部分」（簡單框選或文字標註）
- 歷史版本：同一個 asset 的多次重新生成可左右 / 標籤切換比較

```
┌─────────────────────────────────────────────┐
│  Scene 1: 開場鏡頭                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  v1       │  │  v2       │  │  v3 ✓    │  │
│  │ (Gemini)  │  │ (Gemini)  │  │ (Gemini)  │  │
│  │  rejected │  │  rejected │  │ approved  │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
│  Scene 2: 產品展示                           │
│  ┌──────────┐  ┌──────────┐                 │
│  │  v1       │  │  v2       │  ⏳ 生成中...  │
│  │ (Runway)  │  │ (Runway)  │                │
│  │  rejected │  │  pending  │                │
│  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────┘
```

**② Review Panel（人工審核介面）**

取代 Code Mode 的 Test Results Panel。因為 Creative Mode 沒有自動化測試，人工審核就是回饋來源。

- 審核動作：✅ Approve / ❌ Reject + Feedback / 🔄 Regenerate
- Reject 時必須填寫回饋文字（這段文字會直接注入 agent 的下一次 prompt）
- 審核歷史：顯示每個 asset 的審核紀錄（「v1 被拒：構圖太散」→「v2 被拒：色調偏暖」→「v3 通過」）
- 批量審核：可以一次 approve 多個 asset
- Quick Feedback 按鈕：預設的常用回饋（「風格不對」「構圖重來」「細節不夠」「太暗了」「太亮了」）

**③ Agent Connector 狀態面板**

Creative Mode 會串接多個外部 Agent / API，需要一個地方統一管理和監控。

- 每個 connector 顯示：名稱、類型、狀態（connected / error / rate limited）
- 即時顯示 quota 用量（「今日已用 45/100 次」）
- 最近呼叫的 latency

### 3.4 Agent Connectors 頁面

管理所有外部 AI 服務的串接。

```
┌─────────────────────────────────────────────────────────┐
│  Agent Connectors                          ＋ Add New   │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🟢 Gemini (Google)                                │  │
│  │  Type: LLM / 文字生成 + 圖片生成                     │  │
│  │  Model: gemini-2.5-pro                              │  │
│  │  Endpoint: https://generativelanguage.googleapis... │  │
│  │  Status: Connected · Latency: 1.2s avg              │  │
│  │  Quota: 892 / 1500 requests today                   │  │
│  │  [Configure]  [Test Connection]                     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🟢 Claude (Anthropic)                             │  │
│  │  Type: LLM / 文字生成                               │  │
│  │  Model: claude-sonnet-4-20250514                    │  │
│  │  Status: Connected · Latency: 0.8s avg              │  │
│  │  [Configure]  [Test Connection]                     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🟡 Runway (RunwayML)                   Rate Limited│  │
│  │  Type: Video Generation                             │  │
│  │  Status: Rate limited · Resets in 14 min            │  │
│  │  Quota: 50 / 50 generations today                   │  │
│  │  [Configure]  [Test Connection]                     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  ⚫ Midjourney                         Disconnected │  │
│  │  Type: Image Generation                             │  │
│  │  Status: API key expired                            │  │
│  │  [Configure]  [Test Connection]                     │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Connector 設定畫面（Configure）**

```yaml
connector_config:
  id: "gemini-main"
  name: "Gemini"
  provider: "google"
  type: "llm"  # llm | image_gen | video_gen | audio_gen | tts
  capabilities:
    - text_generation
    - image_generation
    - image_understanding
  
  connection:
    endpoint: "https://generativelanguage.googleapis.com/v1beta"
    auth_type: "api_key"  # api_key | oauth | bearer_token
    api_key: "••••••••••••••"  # 只顯示遮罩，不明文
    
  model_settings:
    default_model: "gemini-2.5-pro"
    available_models:
      - "gemini-2.5-pro"
      - "gemini-2.5-flash"
    temperature: 0.7
    max_tokens: 8192
    
  rate_limit:
    max_requests_per_minute: 60
    max_requests_per_day: 1500
    cooldown_on_429: 30  # 秒
    
  health_check:
    enabled: true
    interval_seconds: 300
    last_check: "2026-04-24T14:30:00Z"
    last_status: "healthy"
```

### 3.5 兩種模式的 Run 詳情頁比較

| 區域 | Code Mode | Creative Mode |
|------|-----------|---------------|
| 左欄 | Step Timeline | Step Timeline（相同） |
| 右欄上 | Code Diff Viewer | Asset Gallery |
| 右欄下 | Test Results Panel | Review Panel |
| 底部 | Context Viewer | Agent Connector 狀態 |
| 自動閉環 | ✅ 測試失敗 → 自動修復 | ❌ 無自動閉環 |
| 人工閉環 | 升級時才需要 | **每次都需要**人工審核 |
| 等待狀態 | 幾乎不等 | 經常等（生成中...） |

### 3.6 Creative Mode 的 Flow 結構

一個典型的影片生成 flow：

```
Step 1: Script Generation（LLM：Claude / Gemini）
  ├── Input: 影片需求描述
  └── Output: 分鏡腳本（scenes × N）

Step 2: Style & Reference（LLM：Gemini image understanding）
  ├── Input: 參考圖片 + 風格描述
  └── Output: 統一的 style prompt

Step 3: Scene Image Generation（Image Gen：Gemini / Midjourney）
  ├── Input: 每個 scene 的描述 + style prompt
  ├── Output: 每個 scene 的靜態圖片
  └── ⏸ 等待人工審核（Review Gate）

Step 4: Motion / Video Generation（Video Gen：Runway / Kling）
  ├── Input: approved 圖片 + motion 描述
  ├── Output: 每個 scene 的影片片段
  └── ⏸ 等待人工審核（Review Gate）

Step 5: Assembly（後製合成）
  ├── Input: 所有 approved 影片片段 + 配樂 + 字幕
  └── Output: 最終影片

Step 6: Final Review
  └── ⏸ 最終人工確認
```

**Review Gate** 是 Creative Mode 特有的概念：
- 流程在此暫停，等待人工審核
- UI 上需要明確顯示「等待你的審核」狀態
- 審核完成後 flow 自動繼續下一步

---

## 四、風格（Style）

### 4.1 視覺定位

**深淺雙主題（Dark / Light），預設跟隨系統，可手動切換。**

兩個主題都完整設計：
- 深色主題：沉浸、專注，工作主力
- 淺色主題：清爽、明亮，日間使用

整體調性：**個人工具的精緻感（Personal Tool Refinement）**

特別注意 Creative Mode 的差異：Asset Gallery 中預覽圖片 / 影片時，背景和框架不能干擾內容的顏色判斷。預覽區域使用**中性灰底**（不受主題影響），確保設計師能準確評估生成結果的色彩。

### 4.2 色彩系統

#### Dark Theme

```css
/* 背景層次 */
--bg-base:        #0c0c0e;
--bg-panel:       #131316;
--bg-surface:     #1c1c21;
--bg-hover:       #24242b;
--bg-active:      #2c2c35;
--border:         #2e2e38;
--border-subtle:  #232329;

/* 文字 */
--text-primary:   #ededf0;
--text-secondary: #8c8c9e;
--text-muted:     #4c4c5e;

/* 強調色 */
--accent:         #5b7cf6;
--accent-hover:   #7090f8;
--accent-subtle:  rgba(91, 124, 246, 0.12);

/* 狀態色 */
--status-success:   #34d399;
--status-warning:   #fbbf24;
--status-error:     #f87171;
--status-escalate:  #fb923c;
--status-running:   #60a5fa;
--status-review:    #c084fc;  /* 新增：等待審核，紫色 */

/* Syntax */
--syntax-variable:  #a78bfa;
--syntax-string:    #86efac;
--syntax-comment:   #4c4c5e;
--syntax-keyword:   #67e8f9;

/* 模式識別色 */
--mode-code:        #60a5fa;  /* Code Mode 標識：藍 */
--mode-creative:    #f472b6;  /* Creative Mode 標識：粉紅 */

/* Asset 預覽區（不受主題影響） */
--preview-bg:       #1a1a1a;  /* 固定中性灰 */
```

#### Light Theme

```css
/* 背景層次 */
--bg-base:        #f8f8fb;
--bg-panel:       #ffffff;
--bg-surface:     #f2f2f6;
--bg-hover:       #ececf2;
--bg-active:      #e4e4ee;
--border:         #e2e2ea;
--border-subtle:  #ededf4;

/* 文字 */
--text-primary:   #111118;
--text-secondary: #5c5c72;
--text-muted:     #a0a0b4;

/* 強調色 */
--accent:         #4b6cf5;
--accent-hover:   #3a5be4;
--accent-subtle:  rgba(75, 108, 245, 0.08);

/* 狀態色 */
--status-success:   #16a34a;
--status-warning:   #d97706;
--status-error:     #dc2626;
--status-escalate:  #ea580c;
--status-running:   #2563eb;
--status-review:    #9333ea;

/* 模式識別色 */
--mode-code:        #2563eb;
--mode-creative:    #db2777;

/* Asset 預覽區 */
--preview-bg:       #e5e5e5;  /* 固定中性灰 */
```

### 4.3 字體配對

| 用途 | 字體 |
|------|------|
| 數字、指標、狀態值 | `JetBrains Mono` |
| 標題、導航、標籤 | `Geist Sans` |
| 程式碼、Prompt、Diff | `JetBrains Mono` |
| 說明文字 | `Geist Sans` |

```
11px — timestamp、metadata
12px — badge、tag、次要 label
13px — list item 次要資訊
14px — 主要內文（基準）
15px — 稍大的內文
16px — section sub-title
20px — page section 標題
24px — page 標題
32px — dashboard 大數字
```

### 4.4 版型

**共用框架**

```
┌──────┬──────────────────────────────────────────┐
│      │  Topbar（頁面標題 + 模式 badge + 操作）    │
│ Side │──────────────────────────────────────────│
│ bar  │                                          │
│      │  主內容區                                 │
│ 64~  │                                          │
│ 240  │                                          │
│  px  │                                          │
└──────┴──────────────────────────────────────────┘
```

**Code Mode Run 詳情頁**

```
┌──────┬─────────────┬─────────────────────────────┐
│      │  Timeline   │  Code Diff / Test Results    │
│ Side │  (320px)    │  (彈性)                      │
│ bar  │             │                              │
│      │  ┌ step 1   │  ┌─────────────────────────┐ │
│      │  ├ step 2   │  │ 選中 step 的詳情        │ │
│      │  ├ step 3 ← │  │ （根據 step 類型切換）   │ │
│      │  └ step 4   │  └─────────────────────────┘ │
└──────┴─────────────┴─────────────────────────────┘
```

**Creative Mode Run 詳情頁**

```
┌──────┬─────────────┬─────────────────────────────┐
│      │  Timeline   │  Asset Gallery               │
│ Side │  (320px)    │  ┌────┐ ┌────┐ ┌────┐       │
│ bar  │             │  │ v1 │ │ v2 │ │ v3 │       │
│      │  ┌ step 1   │  └────┘ └────┘ └────┘       │
│      │  ├ step 2   │─────────────────────────────│
│      │  ├ step 3 ← │  Review Panel                │
│      │  │ ⏸ review │  [✅ Approve] [❌ Reject]     │
│      │  └ step 4   │  Feedback: [______________]  │
└──────┴─────────────┴─────────────────────────────┘
```

### 4.5 動畫規範

| 場景 | 動畫 | 時間 |
|------|------|------|
| 頁面切換 | fade + translateY(4px) | 150ms |
| 面板展開 | height + opacity | 200ms |
| Hover | background-color | 80ms |
| Running 狀態 | 藍色 border pulse | 2s infinite |
| **Waiting Review**（新） | 紫色 slow pulse + ⏸ icon | 3s infinite |
| **生成中**（新） | 進度條 + spinner | 持續 |
| Step 成功 | 綠色 fill 從左 | 300ms |
| Escalation / Reject | slide + subtle shake | 400ms |
| 數字更新 | count-up | 600ms |
| Theme 切換 | color transition | 200ms |
| **Asset 圖片載入**（新） | blur-up placeholder → sharp | 400ms |
| **版本比較切換**（新） | crossfade | 250ms |

### 4.6 元件規範

**Card** — 同 v2

**Button** — 同 v2，新增：
- Review Approve：`status-success` 底，白字
- Review Reject：`status-error` 邊框 ghost

**Badge / Tag** — 同 v2，新增：
- Mode badge：Code 藍 / Creative 粉紅，用在 project 和 run 列表中
- Review 狀態 badge：`status-review` 紫色

**Asset Card（Creative 專用）**
- 圖片 / 影片縮圖，`border-radius: 8px`
- 底部 overlay：工具 icon + 版本號
- 狀態角標：pending / approved ✓ / rejected ✗
- Hover：輕微放大（scale 1.02）+ 陰影加深
- 預覽背景固定中性灰，不跟隨主題

**Video Player（Creative 專用）**
- 內嵌 player，自訂 controls（play、progress bar、fullscreen）
- 控制列風格與整體一致（半透明深色底）
- Hover 才顯示控制列

**Review Input（Creative 專用）**
- 文字輸入框，支援多行
- Quick Feedback 快捷按鈕列（「風格不對」「構圖重來」「細節不夠」等）
- 按鈕點擊後自動填入文字框，可修改後送出

**Connector Status Card**
- 左側圓點：🟢 connected / 🟡 rate limited / 🔴 error / ⚫ disconnected
- 右側：quota 進度條
- 展開：詳細設定

---

## 五、需要設計的畫面清單（優先順序）

| # | 畫面 | 主題 | 重點 |
|---|------|------|------|
| 1 | Dashboard（首頁） | 深 + 淺 | 混合 Code/Creative 的任務展示 |
| 2 | Sidebar + Layout Frame | 深 + 淺 | 模式識別、導航 |
| 3 | Run 詳情 — Code Mode | 深 | Timeline + Code Diff + Test Results |
| 4 | Run 詳情 — Creative Mode | 深 | Timeline + Asset Gallery + Review Panel |
| 5 | Asset Gallery（放大預覽） | 深 | 圖片 / 影片預覽 + 版本比較 |
| 6 | Review Panel（審核流程） | 深 | Approve / Reject + Feedback |
| 7 | Agent Connectors 頁面 | 深 + 淺 | Connector 列表 + 設定 |
| 8 | Prompt Editor | 深 | 角色管理 |
| 9 | Projects 設定（含模式選擇） | 淺 | 建立專案時選 Code / Creative |
| 10 | Waiting Review 通知狀態 | 深 | Dashboard 上的審核待辦提示 |

---

## 六、設計邊界條件

- **純 desktop**，最小寬度 1280px
- **無 onboarding**，直接進入工作介面
- **Empty state** 用文字 + 單色 icon
- 程式碼顯示（Code Mode）最小字體 13px
- 數值使用 `font-variant-numeric: tabular-nums`
- WCAG AA 對比度（兩個主題都要）
- 兩個主題的**資訊層次完全對等**
- Asset 預覽區域使用**固定中性灰底**，不跟隨主題
- Creative Mode 的圖片預覽要考慮**不同比例**（16:9、1:1、9:16），Asset Card 需要自適應

---

## 七、參考座標

| 參考對象 | 借鑒的點 |
|---------|---------|
| **Vercel Dashboard** | 資訊層次、deployment 狀態視覺化 |
| **Linear（light + dark）** | 雙主題設計、卡片、badge |
| **GitHub Actions** | Step timeline、log 展開方式 |
| **Raycast** | 個人工具的快速感、command palette |
| **Runway ML（介面）** | 影片生成的預覽方式、generation status |
| **Figma（asset 管理）** | 多版本 asset 的比較和切換 |
| **ComfyUI** | Agent / Node 的串接視覺化（可參考概念但不用一樣複雜） |

---

## 八、設計心態提醒

這是**你自己的工具**。

它要同時服務兩個你：寫 code 的工程師和做影片的創作者。

兩個模式共用框架但各有性格——Code Mode 講求精確與效率，Creative Mode 講求預覽與迭代。介面要讓你在兩者之間**無縫切換**，不用重新適應。

> Code Mode 的核心體驗：「跑完了嗎？過了嗎？哪裡出錯？」
> Creative Mode 的核心體驗：「生出來長怎樣？哪裡要改？改完再來一次。」

不要為了統一兩個模式而犧牲任何一方的最佳體驗。
