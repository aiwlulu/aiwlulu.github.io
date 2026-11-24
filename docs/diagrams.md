# 圖表的畫法

過鹿人部落格的文章圖表怎麼畫：可用的積木、動態效果，以及新增一張圖的步驟。

## 為什麼用手工畫的 SVG

正式文章的圖表用手工畫的 SVG，放在 `src/components/diagrams/`，一張圖一個元件，在文章裡匯入後用 `<元件名 />` 放進去。和 Mermaid 相比：版面可以完全控制（線拉直、標籤不壓線、方塊對齊），不需要在瀏覽器載入繪圖函式庫，所以一開頁面就在；顏色跟著淺色與深色變；還可以加上動態。

## 積木

圖是用 `src/components/diagrams/parts/` 裡的積木組起來的，座標以 400 寬的畫布為準。

| 積木 | 用途 | 主要屬性 |
|---|---|---|
| `Diagram` | 外框。負責標題、給螢幕閱讀器的描述，以及右上角的放大按鈕（點整張圖也能放大） | `title`、`description`、`height` |
| `Box` | 有文字的方塊 | `x y w h`、`label`、`code`（等寬字）、`sub`（第二行小字）、`strong`（藍框，用在主角）、`small` |
| `Arrow` | 帶箭頭的連線，路徑用 SVG 的 `d` | `d`、`dashed`（回覆）、`flow`、`travel` |
| `Chip` | 線旁的小標籤，會依文字自動算寬度；不要把字直接寫在線上 | `x y`（中心點）、`text`、`code`、`tone` |
| `Step` | 黃色的步驟編號 | `x y n`、`pulse` |
| `Room` | 虛線圍起來的一組東西，上緣可掛名牌 | `x y w h`、`plate`、`plateCode`、`tone` |

`tone` 有 `sun`（黃）、`good`（綠）、`bad`（珊瑚）；用了顏色也一定要有文字。其他零件直接寫 SVG 並套類別：`dg-caption`（小標）、`dg-sub`（次要文字）、`dg-note`（淡綠註記框）、`dg-life`（時序圖的生命線）、`dg-code`、`dg-start`／`dg-end`（靠左、靠右）。不要寫色碼。

## 動態

| 寫法 | 效果 | 適合 |
|---|---|---|
| `<Arrow flow />` | 線上有一直流動的亮點，像 draw.io 的動態連線 | 表示「這條路是通的、資料在這裡走」 |
| `<Arrow travel={{ at: 0.4, cycle: 7 }} />` | 一顆圓點每 `cycle` 秒沿線跑一次，從第 `at` 秒出發 | 有先後順序的步驟 |
| `<Step pulse={{ at: 0.2, cycle: 7 }} />` | 編號輪到時跳一下 | 搭配 `travel` 標出現在是第幾步 |

同一張圖裡用同一個 `cycle`，各步驟的 `at` 依序排開，就會循環播放（見 `HerdrHandoff.astro`）。讀者的系統設定「減少動態效果」時，這些動態都不會出現，圖仍然完整。不要做成 GIF：檔案大、放大會糊，也不能跟著深色模式變色。

## 畫一張新的圖

1. 複製一張現有的圖（結構圖看 `HerdrHosts.astro`，時序圖看 `HerdrHandoff.astro`，分組看 `HerdrWhatSurvives.astro`，資料驅動的清單看 `HerdrAlternatives.astro`）。
2. `title` 與 `description` 是給看不到圖的人讀的，要把圖在說什麼寫完整。
3. 畫布寬度固定 400（高度自訂）。這個寬度縮到手機上字還看得清楚，不必橫向捲動；桌機最多放大到 520px，點一下可以放到更大。
4. 線盡量只走水平和垂直，需要轉彎時用圓角（參考 `HerdrHosts.astro` 的路徑寫法）。

圖很複雜（十個以上的節點）時再考慮 draw.io，並匯出淺色與深色兩個版本。Mermaid 留給草稿。
