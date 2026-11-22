# 過鹿人部落格

<https://aiwlulu.github.io>

用 [Astro](https://astro.build) 建構的靜態部落格，圖示用 [Lucide](https://lucide.dev)。上方是即時計算的雲，頁尾是即時計算的海（WebGL shader）。

## 常用指令

```bash
npm install
npm run dev        # 本機開發，http://localhost:4321
npm run build      # 建構到 dist/
npm run check:seo  # 檢查 dist/ 每一頁的 SEO 基本項目
npm run preview    # 預覽建構結果
```

推送到 `main` 後，GitHub Actions 會建構、跑 SEO 檢查，通過才部署到 GitHub Pages。

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

## 結構

| 路徑 | 內容 |
|---|---|
| `src/content/blog/` | 文章（MDX） |
| `src/content.config.ts` | 文章欄位與限制 |
| `src/site.ts` | 網站名稱、作者等設定 |
| `src/schema.ts` | 結構化資料（JSON-LD） |
| `src/components/Seo.astro` | 每頁的 title、description、canonical、Open Graph |
| `src/components/Sky.astro`、`Sea.astro` | 雲與海的畫布 |
| `src/scripts/*.frag.ts` | 雲與海的 shader |
| `src/styles/tokens.css` | 色彩與尺度變數，來自 design-library 的 `sea-breeze` |
| `astro.config.mjs` | 網站設定與舊網址轉址 |
| `scripts/check-seo.mjs` | SEO 檢查 |
| `src/assets/logo.svg` | Logo 原始檔 |
| `scripts/make-icons.mjs` | 從 logo 產生 favicon、各尺寸圖示與分享圖 `public/og.png`（`npm run icons`） |

## SEO 與 AEO 已經做的事

- 每頁有唯一的 title、description、canonical 與 Open Graph。
- 文章有 `BlogPosting`、每頁有 `BreadcrumbList`、首頁有 `WebSite`、關於頁有 `ProfilePage` 的結構化資料。
- `sitemap-index.xml`、`robots.txt`、`rss.xml`，以及給 AI 助理讀的 `llms.txt`。
- 舊站的重複網址都轉到唯一的網址，轉址頁不進 sitemap。
- 圖片有說明文字與寬高；YouTube 影片點了才載入。
