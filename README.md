# 過鹿人部落格

記錄閱讀、學習與好用工具心得的個人部落格，用 Astro 建構成靜態網站。

狀態：維護中

## 線上展示

[過鹿人部落格（GitHub Pages）](https://aiwlulu.github.io)

網址加上 `?hour=18.2` 可以預覽任何時間的天色，例如[黃昏的首頁](https://aiwlulu.github.io/?hour=18.2)。

## 畫面

![首頁：水彩天空背景上是網站名稱與「開始閱讀」按鈕，下方是主題篩選標籤與最新文章卡片](docs/images/home.png)

首頁列出最新文章，可以用主題標籤篩選；背景的天空會隨當地時間變色。

![文章頁：左邊是紙張風格的閱讀區，右邊是標示目前段落的目錄](docs/images/post.png)

文章頁有麵包屑、預估閱讀時間與跟著捲動的目錄。

## 功能

- [x] 用 MDX 寫文章，依分類與標籤瀏覽，首頁與文章列表可以用主題篩選
- [x] 切換淺色與深色外觀；沒有選過的訪客依裝置設定與當地時間自動決定
- [x] 顯示會動的水彩天空與海（WebGL shader），天色隨當地時間變化
- [x] 在文章裡使用程式碼區塊（自動換行開關、複製按鈕）、提示框、待辦清單、YouTube 影片與可放大的圖片
- [x] 用手工畫的 SVG 元件或 Mermaid 畫圖表，顏色跟著外觀變化
- [x] 產生 SEO 需要的 title、description、canonical、Open Graph、結構化資料、sitemap、RSS 與 `llms.txt`
- [x] 用 GitHub 帳號在文章下方留言（utterances）
- [x] 部署前自動檢查中文排版與每一頁的 SEO 基本項目
- [ ] 英文版文章（目前只有關於頁有英文版）

## 使用技術

- Astro 7（MDX、RSS、sitemap 整合）
- TypeScript
- WebGL（天空與海的 shader）
- Mermaid 12
- Lucide 圖示
- 昭源環方 Chiron GoRound TC 字型
- GitHub Actions 與 GitHub Pages

## 安裝與執行

### 環境需求

- Node.js 22.23.4 以上
- npm 10 以上

### 安裝步驟

```bash
git clone https://github.com/aiwlulu/aiwlulu.github.io.git
cd aiwlulu.github.io
npm install
npm run dev
```

打開 http://localhost:4321，看到有天空背景的部落格首頁就成功了。

### 執行測試

```bash
npm test
```

## 使用方式

### 常用指令

| 指令 | 用途 |
| ---- | ---- |
| `npm run dev` | 本機開發 |
| `npm run build` | 建構到 `dist/` |
| `npm run preview` | 預覽建構結果 |
| `npm test` | 執行排版規則的測試 |
| `npm run check:text` | 檢查文章是否符合中文排版規則 |
| `npm run fix:text` | 依排版規則自動修正文章 |
| `npm run check:seo` | 檢查 `dist/` 每一頁的 SEO 基本項目，要先建構 |
| `npm run icons` | 從 `src/assets/logo.svg` 重新產生 favicon、各尺寸圖示與分享圖 |

### 寫一篇新文章

在 `src/content/blog/` 新增 `<網址代稱>.mdx`，檔名就是網址：`snipaste.mdx` 會變成 `/blog/snipaste/`。

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
```

寫完執行排版修正：

```bash
npm run fix:text
```

### 部署

推送到 `main` 後，GitHub Actions 會依序執行測試、排版檢查、建構與 SEO 檢查，全部通過才部署到 GitHub Pages。

### 延伸文件

| 文件 | 內容 |
| ---- | ---- |
| [寫文章](docs/writing.md) | 文章格式、中文排版規則、內文可以用的元素 |
| [圖表的畫法](docs/diagrams.md) | SVG 圖表的積木、動態效果與新增步驟 |
| [網站設計與維護](docs/site.md) | 淺色與深色外觀、元件原則、SEO、英文版、字型、留言，以及各檔案負責的事 |

## 資料夾結構

```text
.github/workflows/       部署到 GitHub Pages 的流程
docs/                    延伸文件與 README 用的截圖
public/                  favicon、各尺寸圖示與分享圖
scripts/                 建構前後的處理，以及排版與 SEO 檢查
src/
├── assets/              logo 與文章圖片
├── components/          頁面元件；diagrams/ 放文章用的 SVG 圖表
├── content/blog/        文章（MDX）
├── layouts/             所有頁面共用的版型
├── pages/               網址路由，含 RSS、robots.txt 與 llms.txt
├── scripts/             瀏覽器端的互動、天空與海的 shader
├── styles/              色彩與尺度變數、全站樣式
├── content.config.ts    文章欄位與限制
└── site.ts              網站名稱、作者等設定
astro.config.mjs         網站設定與舊網址轉址
```

## 作者與聯絡

過鹿人｜[GitHub @aiwlulu](https://github.com/aiwlulu)｜[關於過鹿人](https://aiwlulu.github.io/about/)
