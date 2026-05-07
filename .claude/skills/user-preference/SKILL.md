---
name: user-preference
description: Use when working with the UserPreference object — local-only theme / language / sidebar collapsed state stored in browser localStorage. Covers schema, persistence keys, no-backend rationale, and where the preferences are read and applied across the app.
---

# UserPreference

## 一句話定義
**UserPreference** 是「使用者個人 UI 偏好」的物件，目前包含 theme（light/dark）、language（zh-TW/en）、sidebar collapsed 三項。所有資料**僅儲存於瀏覽器 localStorage**，**不需要後端 API**，每個瀏覽器 / 裝置獨立。

## 後端 Schema（雖然「不上後端」，但仍可定義以利未來雲端同步）

```ts
interface UserPreference {
  theme: 'light' | 'dark';        // 預設 'light'
  language: 'zh-TW' | 'en';       // 預設 'zh-TW'
  sidebarCollapsed: boolean;      // 預設 false
  // 未來擴充：
  // density?: 'comfortable' | 'compact';
  // codeTheme?: string;
  // notifyOnEscalation?: boolean;
}
```

## localStorage Keys（前端契約）

| Key | 值 | 對應 |
|-----|-----|------|
| `afh-theme-mode` | `'light'` / `'dark'` | theme |
| `afh-language` | `'zh-TW'` / `'en'` | language |
| `afh-sidebar` | `'1'` / `'0'`（'1' = collapsed） | sidebarCollapsed |

> 來源：`frontend/components/app-shell.jsx:21–43`

## 載入與保存流程（`app-shell.jsx`）

```js
// 1. 載入：useEffect 在 mount 時讀（line 19–29）
useEffect(() => {
  const timer = setTimeout(() => {
    setTheme(localStorage.getItem('afh-theme-mode') || 'light');
    setLanguage(localStorage.getItem('afh-language') || 'zh-TW');
    setCollapsed(localStorage.getItem('afh-sidebar') === '1');
    setPreferencesReady(true);
  }, 0);
  // 用 setTimeout(_, 0) 延後到 hydration 後，避免 SSR mismatch
}, []);

// 2. 儲存：每次 state 變化即寫回（line 31–43）
useEffect(() => {
  if (!preferencesReady) return;
  localStorage.setItem('afh-theme-mode', theme);
}, [preferencesReady, theme]);
```

> ⚠️ `preferencesReady` flag 是必要的，避免 hydration mismatch 把預設值（'light'）覆寫使用者已存在 localStorage 的值

## 副作用（preference 變化時觸發）

| Preference | 副作用 | 位置 |
|------------|--------|------|
| `theme` | 設定 ~30 個 CSS variables（`--bg-base`、`--accent`、`--syntax-*` 等） | `app-shell.jsx:57–116` |
| `theme` | 設定 `document.body.style.background` + transition | `app-shell.jsx:114–115` |
| `language` | 設定 `document.documentElement.lang = 'zh-Hant' / 'en'` | `app-shell.jsx:38` |
| `language` | I18nProvider 切換字典 | `frontend/components/i18n.jsx` |
| `sidebarCollapsed` | Sidebar 元件依此渲染收合 / 展開樣式 | `frontend/components/afh-ui.jsx` |

## API 端點

| 功能 | Method | Endpoint | 備註 |
|------|--------|----------|------|
| (無) | — | — | **目前完全不上後端**，只用 localStorage |

> 若未來要做「跨裝置同步」，可加：
> - `GET /api/me/preferences` — 讀
> - `PATCH /api/me/preferences` — 部分更新

但即使加了後端，仍應 localStorage-first（先讀本地、後台 sync）以避免初次載入閃爍。

## 出現在哪些頁面（非常詳盡）

UserPreference 是**全域物件**，所有頁面都會被影響：

### 1. AppShell — `frontend/components/app-shell.jsx`
- **theme** 來自 useState (line 11)，影響全站 CSS variables
- **language** 來自 useState (line 12)，傳給 I18nProvider
- **collapsed** 來自 useState (line 14)，傳給 Sidebar

### 2. Topbar — `frontend/components/afh-ui.jsx`
- **theme toggle 按鈕**：點擊呼叫 setTheme(theme === 'light' ? 'dark' : 'light')
- **language switcher**：（mock 寫在 i18n provider，可能是按鈕或選單）

### 3. Sidebar — `frontend/components/afh-ui.jsx`
- **collapsed 狀態**：
  - true → 縮小寬度，只顯示 icon
  - false → 顯示 icon + label
- **Toggle button**：呼叫 setCollapsed(!collapsed)

### 4. I18nProvider — `frontend/components/i18n.jsx`
- 接 language prop
- 提供 `t(key, vars?)` function 給所有元件使用
- 字典 mock 中：line 1–58 是 zh-TW 主表、line ~226 之後是 en 主表

### 5. 所有頁面（Dashboard / Runs / Roles / Skills / Connectors / Projects / Insights）
- 通過 useI18n hook 拿 `t()`
- 通過 CSS variables 拿配色（透過 theme 動態變化）
- Sidebar 收合影響可視寬度

### 6. Run Detail / Modal / Lightbox
- Lightbox 在 dark / light 兩種主題下都應正常運作（mock backdrop 用 rgba 而非 var）

## 後端設計建議（即使不存後端也建議遵循）

- **預設值集中管理**：寫一個 `lib/preferences.js` 提供 `getTheme()`, `getLanguage()`, `getSidebar()`，避免散落各處的 fallback 邏輯
- **schema versioning**：未來增加新偏好時加版本號 key（`afh-prefs-version: '2'`），舊版本載入時跑 migration
- **同步策略（若上後端）**：
  - 讀：app 啟動時先用 localStorage（即時），背景 fetch `GET /api/me/preferences`，比對 `updatedAt` 取較新者
  - 寫：localStorage 立即 + debounce 1s 後 PATCH 後端
- **多分頁協作**：可用 `window.addEventListener('storage', ...)` 偵測同 origin 其他 tab 變更，即時 sync UI（mock 沒做）
- **CSS variable 集中**：mock 把 30+ 變數寫在 `app-shell.jsx`；建議移到 globals.css 並用 `[data-theme='dark']` selector，更易維護
- **i18n key 一致性**：所有 `t('xxx')` key 應出現在 zh-TW 與 en 兩份字典；建議寫個 lint 檢查兩邊鍵集合是否一致
- **Accessibility**：theme toggle 應 respect `prefers-color-scheme: dark`；首次無偏好時用 OS 偏好而非寫死 light
- **隱私 / 重設**：提供「重設偏好」按鈕清除三個 key
