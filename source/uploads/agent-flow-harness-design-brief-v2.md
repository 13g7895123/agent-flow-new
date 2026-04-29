# Agent Flow Harness — UI Design Brief v2
### 給 Claude Design 的完整設計指示

---

## 一、目標（Goal）

設計一套完整的 **Agent Flow Harness 管理平台** web UI，服務對象是**個人開發者**，讓他能夠獨立管理整個 AI 驅動的網站開發自動化流程。

平台涵蓋兩大功能軸：

1. **設定（Configure）**：管理 AI Agent 的角色（Role）、Prompt、Skill、Context Collector，以及各專案的配置
2. **監控（Monitor）**：即時觀察 agent 的執行狀態、每一步的 trace、測試結果、Feedback Loop 進度

**個人工具的設計核心**：這不是需要教學、引導、或多人協作的平台。使用者就是你自己——你理解這個系統的每一個細節，你要的是一個**快速、直接、幫你省時間**的介面，而不是一個看起來很厲害的 SaaS 產品。少一點行銷感，多一點工具感。

---

## 二、受眾（Audience）

**單一使用者：個人開發者（就是你自己）**

行為特徵：
- 同時開著 IDE、terminal、browser，這個介面是「背景工具」
- 對系統的每個細節都熟悉，不需要 tooltip 解釋什麼是 Context Collector
- 重視**鍵盤操作**：command palette、快捷鍵、tab 切換，盡量不要只能用滑鼠
- 有時深色、有時淺色——根據環境、時間、心情切換，兩者都要舒適
- 最常看的畫面：「現在跑得怎樣了？」和「哪裡出錯了？」

設計要問的核心問題：
- **切換過來的瞬間**，畫面要能立刻告訴你「正在跑什麼、有沒有問題」
- **出錯了**，你要能最快速找到是哪行 code、哪個 test、哪次修復嘗試
- **改設定**，要有信心「我改了這個，會影響什麼」——即時回饋感很重要

---

## 三、內容（Content）

### 3.1 主要頁面架構

```
Agent Flow Harness
├── Dashboard（首頁）
│   ├── 活躍任務（正在執行的 flows）
│   ├── 快速指標（今日成功率、花費 token、需介入數）
│   └── 最近 10 筆執行記錄
│
├── Runs（執行記錄）
│   ├── Run 列表（可篩選：專案、狀態、日期）
│   └── Run 詳情
│       ├── Step Timeline（每一步展開）
│       ├── Context Viewer（Token 分配 + 收集來源）
│       ├── Code Diff（產生 / 修復的程式碼）
│       └── Test Results（失敗測試 + stack trace）
│
├── Roles & Prompts
│   ├── 角色列表
│   ├── Prompt 編輯器（含多層級堆疊預覽）
│   └── 版本歷史 diff
│
├── Skills
│   ├── Skill 列表（含啟用狀態）
│   ├── Skill 編輯（prompt injection + validation rules）
│   └── Skill × 角色關聯圖
│
├── Projects
│   ├── 專案列表
│   ├── 技術棧設定
│   ├── 測試命令設定
│   ├── 啟用的 Skills
│   └── Context Collector 參數
│
└── Insights
    ├── 首次通過率趨勢圖
    ├── 平均修復次數
    └── Token 用量 / 成本追蹤
```

### 3.2 關鍵 UI 元件

**① Flow Run Timeline**（最核心）
- 垂直時間軸，節點代表每個 step
- 狀態：pending / running（動畫）/ success / failed / escalated
- 展開節點：顯示 input、output、duration、token 數
- 修復循環：清楚標示「Fix Attempt 1/5」，歷史嘗試可切換比較
- 打轉偵測：出現警告 banner

**② Test Result Panel**
- 快速摘要：pass N / fail N 的視覺分布
- 失敗條目展開：stack trace + 原始碼行號高亮
- Error 分類 badge（TypeError / AssertionError / BuildError...）

**③ Prompt Editor**
- 三層 prompt 堆疊預覽（Global → Project → Task）
- 變數 `{variable}` 的語法高亮
- 即時 token 計數
- 版本 diff 切換

**④ Context Viewer**
- 顯示當次 context 的來源分解
- Token 分配的橫向比例圖（哪個 collector 佔了多少）
- 點擊來源可展開看實際內容

**⑤ Human Escalation State**
- Run 詳情頁的特殊狀態：明顯的警告樣式
- 失敗摘要 + 嘗試次數 + 建議介入方向
- Hint 輸入框 + 「繼續執行」按鈕

**⑥ Code Diff Viewer**
- 並排 / 上下切換
- 語法高亮
- 標籤切換不同修復嘗試的 diff

### 3.3 互動設計原則

- **Command Palette**（`⌘K`）：全域搜尋 run、專案、設定，快速跳轉
- **鍵盤導航**：所有主要操作要有快捷鍵標示
- 列表支援 keyboard arrow 選擇 + Enter 展開
- 折疊面板記住展開狀態（localStorage）
- 設定變更有「儲存 / 放棄」明確操作，不要 auto-save（個人工具要確定感）

---

## 四、風格（Style）

### 4.1 視覺定位

**深淺雙主題（Dark / Light），預設跟隨系統設定（`prefers-color-scheme`），可手動切換。**

兩個主題都需要完整設計，不能只是「把背景換成白色」——每個主題都要有自己的深度感和層次。

整體調性：**個人工具的精緻感（Personal Tool Refinement）**

- 深色主題：沉浸、專注、夜間友好——像你的 IDE
- 淺色主題：清爽、明亮、日間高效——像 Linear 的 light mode

不是 SaaS 產品的過度精緻，也不是 hackathon 的草率，而是**你自己打造的工具，你讓它恰好好看**。

### 4.2 色彩系統

#### Dark Theme

```css
/* 背景層次 */
--bg-base:       #0c0c0e;   /* app 底層 */
--bg-panel:      #131316;   /* 面板、卡片 */
--bg-surface:    #1c1c21;   /* input、code block */
--bg-hover:      #24242b;   /* hover 狀態 */
--bg-active:     #2c2c35;   /* active / selected */
--border:        #2e2e38;
--border-subtle: #232329;

/* 文字 */
--text-primary:   #ededf0;
--text-secondary: #8c8c9e;
--text-muted:     #4c4c5e;

/* 強調色 */
--accent:         #5b7cf6;   /* 主要 CTA、連結 */
--accent-hover:   #7090f8;
--accent-subtle:  rgba(91, 124, 246, 0.12);

/* 狀態色 */
--status-success: #34d399;
--status-warning: #fbbf24;
--status-error:   #f87171;
--status-escalate:#fb923c;  /* 橙色，需人工介入 */
--status-running: #60a5fa;

/* Syntax（Prompt Editor） */
--syntax-variable: #a78bfa;  /* {variable} */
--syntax-string:   #86efac;
--syntax-comment:  #4c4c5e;
--syntax-keyword:  #67e8f9;
```

#### Light Theme

```css
/* 背景層次 */
--bg-base:       #f8f8fb;
--bg-panel:      #ffffff;
--bg-surface:    #f2f2f6;
--bg-hover:      #ececf2;
--bg-active:     #e4e4ee;
--border:        #e2e2ea;
--border-subtle: #ededf4;

/* 文字 */
--text-primary:   #111118;
--text-secondary: #5c5c72;
--text-muted:     #a0a0b4;

/* 強調色 */
--accent:         #4b6cf5;
--accent-hover:   #3a5be4;
--accent-subtle:  rgba(75, 108, 245, 0.08);

/* 狀態色 */
--status-success: #16a34a;
--status-warning: #d97706;
--status-error:   #dc2626;
--status-escalate:#ea580c;
--status-running: #2563eb;

/* Syntax */
--syntax-variable: #7c3aed;
--syntax-string:   #16a34a;
--syntax-comment:  #a0a0b4;
--syntax-keyword:  #0891b2;
```

### 4.3 字體配對

| 用途 | 字體 | 說明 |
|------|------|------|
| 數字、指標、狀態值 | `JetBrains Mono` | 等寬、技術感，數字對齊 |
| 標題、導航、標籤 | `Geist Sans` | 現代乾淨，閱讀輕鬆 |
| 程式碼、Prompt、Diff | `JetBrains Mono` | 統一 code 風格 |
| 說明文字 | `Geist Sans` | 保持一致 |

字體大小規範（統一用 `px`，設計時以 `14px` 為基準）：

```
11px — timestamp、metadata
12px — badge、tag、次要 label
13px — list item 次要資訊
14px — 主要內文（基準）
15px — 稍大的內文
16px — section sub-title
20px — page section 標題
24px — page 標題
32px — dashboard 大數字（token 用量、成功率）
```

### 4.4 版型

**Sidebar + Main 的固定佈局**

```
┌──────┬────────────────────────────────────────────┐
│      │  Topbar（頁面標題 + 右側操作）               │
│ Side │─────────────────────────────────────────── │
│ bar  │                                            │
│      │  主內容區                                   │
│  64  │  （12 column grid，max-width 1440px）       │
│ ~240 │                                            │
│  px  │                                            │
└──────┴────────────────────────────────────────────┘
```

- Sidebar 展開 240px / 折疊 64px（icon only）
- 折疊狀態記住（localStorage）
- Topbar 高度 52px，sticky
- 頁面最大寬度 1440px，內容左右 padding 24px
- 卡片 / 面板間距：16px（緊密）
- Section 間距：24–32px

**Run 詳情頁**採用**左右分割**佈局：
- 左：Step Timeline（320px 固定）
- 右：選中 Step 的詳情（Code / Test / Context）

### 4.5 動畫規範

| 場景 | 動畫 | 時間 |
|------|------|------|
| 頁面切換 | fade + translateY(4px) | 150ms ease |
| 面板展開 | height + opacity | 200ms ease |
| Hover | background-color | 80ms |
| Running 狀態 | 藍色 border pulse | 2s infinite |
| Step 成功 | 綠色從左 fill | 300ms ease-out |
| Escalation 出現 | slide from right + subtle shake | 400ms |
| 數字更新 | count-up | 600ms |
| Theme 切換 | color transition | 200ms |

### 4.6 元件規範

**Card**
- Dark：`bg-panel` + 1px `border` + `border-radius: 8px`
- Light：`bg-panel` + 1px `border` + `box-shadow: 0 1px 3px rgba(0,0,0,0.06)`
- 狀態卡片：左側 4px 色條
- hover：border 亮一級

**Button**
- Primary：`accent` 底，白字，`border-radius: 6px`，8px 12px padding
- Secondary：透明底，1px border，`text-secondary`
- Ghost：純文字，hover 有底色
- Danger：`status-error` 底 或紅色邊框 ghost

**Badge / Tag**
- 狀態 badge：半透明底（status color 15% opacity）+ 對應文字色
- 一律 `border-radius: 4px`，px 6px / py 2px
- 字體 11–12px

**Input / Editor**
- 背景 `bg-surface`，1px border，focus 時 `accent` border
- Dark 主題：`border-radius: 6px`
- Prompt Editor 使用 CodeMirror 或類似的語法高亮 editor

**Divider**
- 1px solid `border`，不要濫用
- 用 spacing 做視覺分組，divider 只在語義上真的需要分隔時用

---

## 五、需要設計的畫面清單（優先順序）

| # | 畫面 | 主題 | 重點 |
|---|------|------|------|
| 1 | Dashboard（首頁） | 深 + 淺 | 系統整體狀態一覽 |
| 2 | Run 詳情頁（Timeline 展開） | 深 + 淺 | 核心使用場景 |
| 3 | Test Results Panel | 深 | 在 Run 詳情頁內 |
| 4 | Human Escalation 狀態 | 深 | Run 詳情頁的特殊狀態 |
| 5 | Sidebar + Layout Frame | 深 + 淺 | 整體框架 |
| 6 | Prompt Editor 頁面 | 深 | 角色管理 |
| 7 | Projects 設定頁 | 淺 | 日間設定場景 |
| 8 | Context Viewer（Token 分配） | 深 | 在 Run 詳情頁內 |

---

## 六、設計邊界條件

- **純 desktop**，最小寬度 1280px，不做 responsive
- **無 onboarding**，直接進入工作介面，沒有歡迎頁
- **Empty state** 用簡單文字 + 單色 icon，不用插圖
- 程式碼相關顯示（stack trace、diff、prompt）**優先可讀性**，字體不要小於 13px
- 所有數值使用 `font-variant-numeric: tabular-nums`，確保對齊
- WCAG AA 對比度：深色主題文字 ≥ 4.5:1，淺色主題同樣
- 兩個主題的**資訊層次要完全對等**，不能一個主題缺少某些視覺線索

---

## 七、參考座標

| 參考對象 | 借鑒的點 |
|---------|---------|
| **Vercel Dashboard** | 資訊層次、deployment 狀態視覺化、深色基調 |
| **Linear（light mode）** | 淺色主題的精緻感、卡片設計、狀態 badge |
| **GitHub Actions** | Step timeline、log 展開方式 |
| **Raycast** | 個人工具的快速感、command palette、字體運用 |
| **Warp Terminal** | 技術工具的現代感、深色底的可讀性 |

---

## 八、設計心態提醒

這是**你自己的工具**，不是給別人展示的產品。

好的個人工具設計的特徵：你用它的時候感覺不到它的存在，它只是幫你做事。介面不打擾你，資訊在你需要的時候就在那裡，不需要的時候安靜退後。

> 不要為了好看而設計，要為了「用起來讓你舒服、快速、有掌控感」而設計。
