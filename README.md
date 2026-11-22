# 過鹿人部落格

<https://aiwlulu.github.io>

用 [Astro](https://astro.build) 建構的靜態部落格，圖示用 [Lucide](https://lucide.dev)。紙張拼貼風格的介面，放在一片會動的水彩天空上：整頁背景是淡淡飄動的雲，頁尾是水彩筆觸的海（WebGL shader），有淺色與深色兩種外觀，深色時是星空與夜晚的海，閱讀區也換成深底淺字。網址加 `?hour=18.2` 可以預覽任何時間的天色。

## 常用指令

```bash
npm install
npm run dev        # 本機開發，http://localhost:4321
npm run build      # 建構到 dist/
npm run check:seo  # 檢查 dist/ 每一頁的 SEO 基本項目
npm run check:text # 檢查文章是否符合中文排版規則
npm run fix:text   # 依排版規則自動修正文章
npm run preview    # 預覽建構結果
```

推送到 `main` 後，GitHub Actions 會先檢查排版、建構、再跑 SEO 檢查，全部通過才部署到 GitHub Pages。

## 排版規則

`scripts/typography.mjs` 會檢查 `src/content/blog/` 的標題、副標、摘要與內文：

1. 中文與英文、數字之間加一個半形空格（這是 AI model 的輸出、5 公里）；全形標點旁邊不加空格。
2. 中文段落的標點用全形：，！？：；與成對的（）。英文句子裡的標點維持半形。
3. `**粗體**` 前後各留一個空格；在行首行尾或緊鄰全形標點時不加。

程式碼、網址、HTML 標籤、方括號與句點不會被更動。不能拆開的專有名稱（例如頻道名）加進檔案開頭的 `KEEP`。寫完文章跑一次 `npm run fix:text` 即可。

## 寫一篇新文章

在 `src/content/blog/` 新增 `<網址代稱>.mdx`：

```mdx
---
title: '文章標題'
subtitle: '副標（選填）'
description: '給搜尋結果用的摘要，40 到 160 個字，直接回答這篇在講什麼。'
pubDate: 2026-11-22
category: '心得'
tags: ['學習']
---

內文從 `##` 開始下標題（`#` 留給文章標題）。

![圖片說明要寫出圖裡的重點](../../assets/posts/檔名.png)

<YT id="YouTube 影片 ID" />
```

- 圖片放 `src/assets/posts/`，建構時會自動轉成 WebP 並補上寬高。
- 檔名就是網址：`snipaste.mdx` 會變成 `/blog/snipaste/`。
- 改了舊文章的內容，加上 `updatedDate`。
- 用 `mermaid` 標記程式碼區塊，網站會依閱讀外觀渲染圖表。可用 `accTitle` 和 `accDescr` 補上圖表的文字說明。

## 結構

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
| `astro.config.mjs` | 網站設定與舊網址轉址 |
| `scripts/check-seo.mjs` | SEO 檢查 |
| `scripts/typography.mjs` | 中文排版檢查與自動修正 |
| `scripts/make-fonts.mjs` | 建構前執行：把圓體字型裁成只含網站用到的字 |
| `scripts/polish-html.mjs` | 建構後執行：外部連結另開視窗、英文引言換成英文字體、替程式碼區塊與表格加上外框 |
| `src/scripts/code-block.js` | 程式碼區塊上方那一列的樣板，建構步驟與頁面共用 |
| `src/assets/logo.svg` | Logo 原始檔 |
| `scripts/make-icons.mjs` | 從 logo 產生 favicon、各尺寸圖示與分享圖 `public/og.png`（`npm run icons`） |

## SEO 與 AEO 已經做的事

- 每頁有唯一的 title、description、canonical 與 Open Graph。
- 文章有 `BlogPosting`、每頁有 `BreadcrumbList`、首頁有 `WebSite`、關於頁有 `ProfilePage` 的結構化資料。
- `sitemap-index.xml`、`robots.txt`、`rss.xml`，以及給 AI 助理讀的 `llms.txt`。
- 舊站的重複網址都轉到唯一的網址，轉址頁不進 sitemap。
- 圖片有說明文字與寬高；YouTube 影片點了才載入。
- 換頁用 Astro 的 `<ClientRouter />`，滑鼠移到連結上就預先載入，天空與海跨頁保留。
- 文章圖片點一下可以放大；外部連結一律另開視窗。

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

## 文章裡可以用的元素

樣式都在 `src/styles/global.css` 的「Article components」一節。

| 寫法 | 呈現 |
|---|---|
| ` ```bash ` 等程式碼區塊 | 上方有語言名稱、「自動換行」開關與「複製」按鈕。預設換行，續行會內縮兩個字元；關掉後改成橫向捲動。複製的內容永遠是原本的行 |
| `<HerdrHosts />` 這類圖表元件 | 手工畫的 SVG 圖表（見下方「圖表」）。正式文章優先用這種 |
| ` ```mermaid ` | 自動排版的圖表，適合草稿。顏色跟著淺色或深色；載入前先顯示流光佔位；可用 `accTitle`、`accDescr` 補上文字說明 |
| Markdown 表格 | 有外框與隔行底色，第一欄加粗；三欄以上的表格在窄螢幕可橫向捲動 |
| `` `code` `` | 行內程式碼 |
| `<kbd>Ctrl</kbd>` | 鍵盤按鍵 |
| `<dfn>名詞</dfn>` | 第一次出現、正在解釋的名詞（淡綠標籤） |
| `<mark>文字</mark>`、`**粗體**` | 黃色麥克筆 |
| `> 引言` | 淡藍紙片；全英文的引言會自動改用襯線斜體 |
| `<details><summary>標題</summary>…</details>` | 可摺疊的區塊 |
| `<aside class="callout">…</aside>` | 提示框；另有 `callout tip`（綠）與 `callout warn`（珊瑚） |
| `- [ ]`、`- [x]` | 待辦清單 |
| `<figure class="post-figure">` 加 `<figcaption>` | 置中的圖片與圖說 |
| `<YT id="…" />` | YouTube 影片，點了才載入 |
| 註腳、定義清單（`<dl>`）、`<abbr title>`、`<ins>`、`<del>` | 都有對應樣式 |

## 圖表

正式文章的圖表用手工畫的 SVG，放在 `src/components/diagrams/`，一張圖一個元件，在文章裡匯入後用 `<元件名 />` 放進去。和 Mermaid 相比：版面可以完全控制（線拉直、標籤不壓線、方塊對齊），不需要在瀏覽器載入繪圖函式庫，所以一開頁面就在，也不會露出原始碼。

畫一張新的圖：

1. 複製 `HerdrHosts.astro` 改名，外層維持 `<Diagram title="…" description="…" height={…}>`。`title` 與 `description` 是給看不到圖的人讀的，要把圖在說什麼寫完整。
2. 畫布寬度固定 400（高度自訂）。這個寬度縮到手機上字還看得清楚，不需要橫向捲動；桌機最多放大到 520px。
3. 只用 `Diagram.astro` 裡定義的類別，不寫色碼，圖才會跟著淺色與深色變：

| 類別 | 用途 |
|---|---|
| `dg-box`、`dg-box is-strong` | 方塊；`is-strong` 是藍色外框，用在重點 |
| `dg-line`、`is-dashed` | 帶箭頭的連線；虛線表示回覆 |
| `dg-chip` 加 `dg-label` | 線旁的小標籤，不要直接把字壓在線上 |
| `dg-note` | 淡綠的註記框 |
| `dg-step` | 黃色的步驟編號 |
| `dg-room`、`dg-plate` | 虛線圍起來的區域與它的名牌 |
| `dg-caption`、`dg-sub`、`dg-code` | 小標、次要文字、等寬字 |

圖很複雜（十個以上的節點）時再考慮 draw.io，並匯出淺色與深色兩個版本。

程式碼區塊與表格的外框是建構後由 `scripts/polish-html.mjs` 加上的；`astro dev` 不會跑這一步，所以開發時由頁面的程式補上，兩邊共用 `src/scripts/code-block.js` 的同一份樣板。

## 英文版

目前只有關於頁有英文版（`/en/about/`），兩個語言版本用 `hreflang` 互相標示，`check:seo` 會檢查它們有沒有互相指回。文章維持中文。之後要加英文文章，放在 `src/pages/en/` 底下並在 `<Base>` 傳 `lang="en"` 與 `alternates`。

## 字型

中文與英文都用開源圓體 [昭源環方 Chiron GoRound TC](https://github.com/chiron-fonts/chiron-go-round-tc)（SIL Open Font License 1.1）。整套字型有 17MB，所以 `scripts/make-fonts.mjs` 會在每次建構前掃過 `src/` 用到的字，只留下那些字（目前約 1,050 字、0.5MB）。新文章用到新的字時，重新建構就會自動補上。

## 留言

留言用 [utterances](https://utteranc.es)：每篇文章對應這個 repo 的一則 issue（以網址路徑當標題、加上「留言」標籤），讀者用 GitHub 帳號登入後留言。第一次有人留言時 issue 才會建立。需要先在 repo 安裝 utterances 這個 GitHub App。
