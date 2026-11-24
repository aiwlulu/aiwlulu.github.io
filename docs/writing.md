# 寫文章

在過鹿人部落格新增或修改文章時要知道的事：文章檔案的格式、中文排版規則，以及內文可以用的元素。

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
- 寫完跑一次 `npm run fix:text`，讓內文符合排版規則。

## 排版規則

`scripts/typography.mjs` 會檢查 `src/content/blog/` 的標題、副標、摘要與內文：

1. 中文與英文、數字之間加一個半形空格（這是 AI model 的輸出、5 公里）；全形標點旁邊不加空格。
2. 中文段落的標點用全形：，！？：；與成對的（）。英文句子裡的標點維持半形。
3. `**粗體**` 前後各留一個空格；在行首行尾或緊鄰全形標點時不加。

程式碼、網址、HTML 標籤、方括號與句點不會被更動。不能拆開的專有名稱（例如頻道名）加進檔案開頭的 `KEEP`。寫完文章跑一次 `npm run fix:text` 即可。

## 文章裡可以用的元素

樣式都在 `src/styles/article.css` 的「Article components」一節（這份樣式只在文章、關於與呼吸頁載入）。

| 寫法 | 呈現 |
|---|---|
| ` ```bash ` 等程式碼區塊 | 上方有語言名稱、「自動換行」開關與「複製」按鈕。預設換行，續行會內縮兩個字元；關掉後改成橫向捲動。複製的內容永遠是原本的行 |
| `<HerdrHosts />` 這類圖表元件 | 手工畫的 SVG 圖表（見[圖表的畫法](diagrams.md)）。正式文章優先用這種 |
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

程式碼區塊與表格的外框是建構後由 `scripts/polish-html.mjs` 加上的；`astro dev` 不會跑這一步，所以開發時由頁面的程式補上，兩邊共用 `src/scripts/code-block.js` 的同一份樣板。
