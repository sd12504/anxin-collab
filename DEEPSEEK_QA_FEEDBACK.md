# DeepSeek QA 回饋：更新後仍需修正

檢查日期：2026-06-24

專案：

```text
C:\Users\User\Desktop\anxin-collab
```

本機網址：

```text
http://127.0.0.1:5173
```

## 已通過

- `npm.cmd run build` 通過。
- 原始碼檔案本身是 UTF-8，中文 enum / demo data 已可正常讀取。
- 桌機路由 `/`、`/cases`、`/collab`、`/library`、`/brand`、`/export` 沒有明顯水平溢出。
- 主要路由可見文字沒有舊亂碼。
- 側欄中文選單已可正常顯示。

## 仍需修正

### P1：手機版 `/cases` 有水平溢出

測試尺寸：

```text
390 x 844
```

結果：

```text
clientWidth: 375
scrollWidth: 505
overflowX: true
```

請修正 `src/pages/CaseManagement.tsx` 的 mobile table layout。

建議：

- 手機版不要直接顯示完整 table。
- 改成案件卡片列表，或讓 table 包在可控的橫向 scroll container 並避免整頁 overflow。
- 如果使用 table，請確保外層 `overflow-x-auto` 不造成 `documentElement.scrollWidth` 大於 viewport。

### P1：瀏覽器 localStorage 舊資料會蓋掉新版 demo data

目前 live page 仍顯示舊的 3 筆資料：

- 三重陳宅老屋翻新
- 大安區林宅浴室改造
- 內湖商空咖啡廳

但 `src/data/mockData.ts` 已經有新的案例資料。

原因：

```text
localStorage anxin_collab_v2
```

舊資料存在時，`loadState()` 會直接回傳舊資料。

請處理資料版本遷移：

- 提升 storage key，例如 `anxin_collab_v3`，或
- 加入 schema/version 判斷，舊資料自動 migrate，或
- 提供「重置 demo data」按鈕。

### P2：總覽頁尚未對齊參考圖 KPI

目前顯示：

- 總案件
- 旗艦版
- 專業版
- 進行中

參考圖需要：

- 總案件數
- 企劃中
- 拍攝前置
- 拍攝中
- 後期製作
- 已完成

請更新 `src/pages/Dashboard.tsx`。

同時目前 `/` 沒有 `h1/h2/h3` heading，請補上「總覽」。

### P2：協作板仍偏舊版詳細表單，不是參考圖五步驟工作流

目前 `/collab` 還是：

- 左側案件總覽
- 中間長表單
- 右側預覽

參考圖需要第一屏改成五個任務卡：

1. 目前案件總覽
2. 設計師引導問題
3. 影像企劃預覽
4. 素材庫
5. 下載企劃書

既有詳細表單可以保留，但請放到展開區、詳情頁或「繼續填寫」後的狀態。

### P2：素材庫仍沒有真實圖片

檢查結果：

```text
document.images.length = 0
```

素材庫目前仍顯示圖示 fallback。

請加入真實縮圖：

- 優先使用 `public` 內 assets，或
- 從 `C:\Users\User\Desktop\影片分析器\frames` 複製幾張室內圖片到 `public/assets/cases`，再用相對 URL 引用。

### P2：案例管理表格欄位還沒完全對齊參考圖

參考圖欄位：

- 案件名稱，含縮圖
- 地區 / 坪數
- 狀態
- 拍攝等級
- 更新日期
- 操作

目前 mobile/desktop 仍偏舊欄位：

- 案場
- 設計師
- 地區
- 階段
- 等級

請對齊參考圖命名與欄位。

## 請重新驗收

修正後請再次執行：

```powershell
npm.cmd run build
```

並檢查：

```text
/
/cases
/collab
/library
/brand
/export
```

桌機：

```text
1440 x 900
```

手機：

```text
390 x 844
```

驗收條件：

- `npm.cmd run build` 通過。
- `/cases` 手機版不可水平溢出。
- `/` 有「總覽」heading。
- Dashboard KPI 改為狀態統計。
- 協作板第一屏是五步驟任務卡。
- 素材庫至少有數張真實圖片。
- 舊 localStorage 不會阻止使用者看到新版 demo data。

