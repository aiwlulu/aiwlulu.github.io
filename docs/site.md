# 網站設計與維護

過鹿人部落格在外觀、元件、SEO、字型與留言上的做法，以及各個檔案負責的事。

## 外觀：淺色與深色

導覽列的太陽／月亮按鈕按一下，就在淺色與深色之間切換，選擇記在瀏覽器的 `localStorage`。

- 沒按過的訪客是自動：先看裝置的深色設定；裝置是淺色時再看當地時間，晚上 19:12 到清晨 5:18 用深色。
- 按過之後就固定，不再隨時間改變。
- 淺色時，天空仍會隨時間在清晨、白天、黃昏之間變化，但不會自己變成夜晚。

同一條規則在 `<head>` 的行內指令與 `src/scripts/palette.ts` 的 `resolveTheme()` 各寫一次，前者是為了第一次繪製就用對顏色，改規則時兩邊都要改。深色的色彩變數在 `src/styles/tokens.css` 的 `:root[data-theme='dark']`。

## 元件原則

**預設不使用瀏覽器原生外觀的元件**，例如核取方塊、下拉選單、滑桿、檔案選擇鈕、日期與顏色選擇器。原生外觀在每個瀏覽器和作業系統都不一樣，也和網站的風格不搭。

需要這類控制項時，依序考慮：

1. 用這個網站已有的客製元件（見下表）。
2. 用開源元件，並套上 `tokens.css` 的變數。
3. 自己做一個。

不論哪一種，都要能用鍵盤操作、有清楚的焦點樣式，並有正確的語意（例如開關用 `<button role="switch" aria-checked>`）。`npm run check:seo` 會擋下 `<select>` 與 `range`、`file`、`color`、`date` 類型的 `<input>`。

| 需要 | 用這個 |
|---|---|
| 開或關 | `.switch`（`<button role="switch">`），例如程式碼區塊的「自動換行」 |
| 勾選 | 核取方塊會自動重畫成客製外觀（文章裡的待辦清單 `- [x]`，或加 `.check`） |
| 幾個選項選一個 | 一排 `.chip`，例如文章列表的主題篩選 |
| 動作 | `.btn`、`.btn.ghost`、`.btn.small` |

## SEO 與 AEO 已經做的事

- 每頁有唯一的 title、description、canonical 與 Open Graph。
- 文章有 `BlogPosting`、每頁有 `BreadcrumbList`、首頁有 `WebSite`、關於頁有 `ProfilePage` 的結構化資料。
- `sitemap-index.xml`、`robots.txt`、`rss.xml`，以及給 AI 助理讀的 `llms.txt`。
- 舊站的重複網址都轉到唯一的網址，轉址頁不進 sitemap。
- 圖片有說明文字與寬高；YouTube 影片點了才載入。
- 換頁用 Astro 的 `<ClientRouter />`，滑鼠移到連結上就預先載入，天空與海跨頁保留。
- 文章圖片點一下可以放大；外部連結一律另開視窗。

## 英文版

目前只有關於頁有英文版（`/en/about/`），兩個語言版本用 `hreflang` 互相標示，`check:seo` 會檢查它們有沒有互相指回。文章維持中文。之後要加英文文章，放在 `src/pages/en/` 底下並在 `<Base>` 傳 `lang="en"` 與 `alternates`。

## 字型

中文與英文都用開源圓體 [昭源環方 Chiron GoRound TC](https://github.com/chiron-fonts/chiron-go-round-tc)（SIL Open Font License 1.1）。整套字型有 17MB，所以 `scripts/make-fonts.mjs` 會在每次建構前掃過 `src/` 用到的字，只留下那些字（目前約 1,050 字、0.5MB）。新文章用到新的字時，重新建構就會自動補上。

## 留言

留言用 [utterances](https://utteranc.es)：每篇文章對應這個 repo 的一則 issue（以網址路徑當標題、加上「留言」標籤），讀者用 GitHub 帳號登入後留言。第一次有人留言時 issue 才會建立。需要先在 repo 安裝 utterances 這個 GitHub App。

## 檔案對照

| 路徑 | 內容 |
|---|---|
| `src/content/blog/` | 文章（MDX） |
| `src/content.config.ts` | 文章欄位與限制 |
| `src/site.ts` | 網站名稱、作者等設定 |
| `src/schema.ts` | 結構化資料（JSON-LD） |
| `src/components/Seo.astro` | 每頁的 title、description、canonical、Open Graph |
| `src/components/Sky.astro`、`Sea.astro` | 天空與海的畫布，加上手繪裝飾 |
| `src/scripts/scene.ts`、`*.frag.ts` | 天空與海的 shader 與執行器 |
| `src/scripts/palette.ts` | 依當地時間決定天空與海的顏色 |
| `src/scripts/celebrate.ts` | 頁尾「為自己慶祝」的彩帶與煙火 |
| `src/scripts/interactions.ts` | 換頁載入條、捲動進場、目錄標示、游標小夥伴等行為 |
| `src/styles/tokens.css` | 色彩與尺度變數，和 design-library 的 `paper-sea` 同一份 |
| `src/pages/breathe.astro`、`src/scripts/breathe.ts` | 4-7-8 放鬆呼吸頁面與它的畫面控制 |
| `src/scripts/breath-cycle.js` | 呼吸練習的計時（各步驟秒數、目前在第幾輪），頁面與測試共用 |
| `astro.config.mjs` | 網站設定與舊網址轉址 |
| `scripts/check-seo.mjs` | SEO 檢查 |
| `scripts/typography.mjs` | 中文排版檢查與自動修正 |
| `scripts/make-fonts.mjs` | 建構前執行：把圓體字型裁成只含網站用到的字 |
| `scripts/polish-html.mjs` | 建構後執行：外部連結另開視窗、英文引言換成英文字體、替程式碼區塊與表格加上外框 |
| `src/scripts/code-block.js` | 程式碼區塊上方那一列的樣板，建構步驟與頁面共用 |
| `src/assets/logo.svg` | Logo 原始檔 |
| `scripts/make-icons.mjs` | 從 logo 產生 favicon、各尺寸圖示與分享圖 `public/og.png`（`npm run icons`） |
