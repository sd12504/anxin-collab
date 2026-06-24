# DeepSeek 更新任務書：安心整合設計佈作板

## 任務目標

請把目前 React/Vite 網站更新成參考圖片中的「安心整合｜設計佈作板」後台介面。

本機網址：

```text
http://127.0.0.1:5173
```

實際專案路徑：

```text
C:\Users\User\Desktop\anxin-collab
```

參考圖片：

```text
C:\Users\User\Downloads\ChatGPT Image 2026年6月23日 下午03_29_04.png
```

## 重要現況

目前專案已經有頁面骨架：

- `src/pages/Dashboard.tsx`
- `src/pages/CaseManagement.tsx`
- `src/pages/CollabBoard.tsx`
- `src/pages/AssetLibrary.tsx`
- `src/pages/BrandSettings.tsx`
- `src/pages/ExportCenter.tsx`
- `src/pages/ProductionTools.tsx`
- `src/pages/SystemSettings.tsx`

但目前很多中文文字與 mock data 已經變成亂碼。第一優先是修復中文語意、資料型別和 demo data，再進行視覺與流程更新。

請不要只修 CSS，必須同步整理中文內容、狀態名稱、頁面資訊架構。

## 頁面更新範圍

### 1. 全站 Layout

檔案：

```text
src/components/Layout.tsx
src/index.css
```

需求：

- 左側固定深色側欄。
- 品牌名稱顯示「設計佈作板」。
- 側欄選單：
  - 總覽 `/`
  - 案例管理 `/cases`
  - 協作板 `/collab`
  - 素材庫 `/library`
  - 品牌設定 `/brand`
- 可保留 `/export`、`/production`、`/settings`，但不要讓主導航過度擁擠。
- 主內容區使用溫暖米白背景。
- 每頁頂部要有搜尋列、通知 icon、使用者頭像。
- 修正 mobile 側欄 off-canvas 問題：
  - 關閉時用 `transform: translateX(-100%)`
  - 避免頁面左右跳動
  - `body` 或 app shell 加 `overflow-x-hidden`
  - 關閉狀態避免 hidden sidebar 仍可 focus
- 品牌 logo 連結不要搶走 dashboard nav active state。品牌連結請用 `Link`，或避免產生 active 樣式。

### 2. 修復資料型別與中文 enum

檔案：

```text
src/types/index.ts
src/data/mockData.ts
src/data/store.ts
src/utils/grading.ts
```

請重建乾淨中文值：

案件狀態建議：

```text
企劃中
拍攝前置
拍攝中
後期製作
已完成
```

拍攝等級建議：

```text
A 主打版
B 適用版
C 專案版
D 封存版
```

可見性/限制值建議：

```text
可露出
需遮蔽
不可露出
未確認
```

Demo cases 請使用參考圖片中的案例：

- 展耀之境，台北市，32坪，企劃中
- 墨韻小宅，新北市，18坪，拍攝前置
- 森沐寓所，台中市，26坪，拍攝中
- 光影書屋，桃園市，28坪，後期製作
- 靜謐居所，高雄市，22坪，已完成
- 溫潤之家，新竹市，30坪，企劃中
- 木光宅邸，台南市，35坪，拍攝前置

### 3. 總覽頁

檔案：

```text
src/pages/Dashboard.tsx
```

需求：

- 頁面標題「總覽」。
- KPI 卡：
  - 總案件數 24
  - 企劃中 6
  - 拍攝前置 5
  - 拍攝中 4
  - 後期製作 5
  - 已完成 4
- 案件進度總覽圓環圖。
- 右側近期更新案件列表，含縮圖、案件名稱、地區坪數、狀態、日期。
- 下方本週待處理清單。
- 視覺風格請貼近參考圖：暖白卡片、細陰影、橄欖綠重點。

### 4. 案例管理

檔案：

```text
src/pages/CaseManagement.tsx
src/components/CaseModal.tsx
```

需求：

- 頁面標題「案例管理」。
- 右上角「新增案件」主按鈕。
- 篩選器：
  - 全部地區
  - 全部狀態
  - 更多篩選
- 表格欄位：
  - 案件名稱，含縮圖
  - 地區 / 坪數
  - 狀態
  - 拍攝等級
  - 更新日期
  - 操作
- 分頁顯示。
- 操作按鈕可先保留編輯/刪除或三點 menu。

### 5. 協作板

檔案：

```text
src/pages/CollabBoard.tsx
```

需求：

改成參考圖片中的五步驟工作流：

1. 目前案件總覽
   - 顯示案件大圖、名稱、地區、坪數
   - 按鈕「查看詳情」
2. 設計師引導問題
   - 顯示已完成進度，例如 `已完成 6 / 8`
   - 按鈕「繼續填寫」
3. 影像企劃預覽
   - 顯示 AI 生成狀態
   - 按鈕「預覽企劃書」
4. 素材庫
   - 顯示素材管理描述
   - 按鈕「前往素材庫」
5. 下載企劃書
   - 顯示可輸出 PDF / Markdown
   - 按鈕「下載企劃書」

目前既有的詳細表單不要全部刪掉，可以移到詳情/展開區，避免首頁協作板太複雜。

### 6. 素材庫

檔案：

```text
src/pages/AssetLibrary.tsx
```

需求：

- 頁面標題「素材庫」。
- 分類：
  - 全部素材
  - 空間照片
  - 施工照片
  - 設計圖
  - 參考圖
  - 影片素材
- 右上角「上傳素材」按鈕。
- 篩選器：
  - 搜尋素材名稱
  - 全部類型
  - 上傳日期
- 卡片顯示真實室內圖縮圖、案件名稱、日期。
- 可以優先使用專案外既有素材：

```text
C:\Users\User\Desktop\影片分析器\frames
```

若不方便直接引用，請至少在 mock assets 放入可用圖片路徑或 public assets。

### 7. 品牌設定

檔案：

```text
src/pages/BrandSettings.tsx
src/data/store.ts
```

需求：

- 頁面標題「品牌設定」。
- 左側設定分區：
  - 品牌資訊設定
  - 常用語管理
  - 敏感詞管理
  - 腳本模板管理
  - 品牌偏好設定
- 右側表單：
  - 品牌核心價值
  - 品牌風格描述
  - 常用字詞 chip
  - 避免字詞 chip
- 常用詞：
  - 安心整合
  - 設計專業
  - 貼心服務
  - 細節講究
  - 質感生活
- 避免詞：
  - 最便宜
  - 超低價
  - 保證完美
  - 絕對
  - 第一名

### 8. 下載企劃書預覽 / 輸出中心

檔案：

```text
src/pages/ExportCenter.tsx
src/utils/markdown.ts
```

需求：

- 版面對齊參考圖片：
  - 左側企劃書目錄
  - 中間企劃書內容預覽
  - 右側封面預覽
- 目錄包含：
  - 案件資訊
  - 拍攝等級
  - 影片主線
  - 故事線
  - 訪談問題
  - 素材需求
  - Shorts 題目
  - 拍攝方向
- 底部或右下角按鈕：
  - 下載 Markdown
  - 下載 PDF 企劃書
- 若 PDF 尚未實作，可以先讓按鈕 disabled 或導向 Markdown 下載，但 UI 需存在。

## 視覺規格

- 背景：`#faf8f4` 或相近暖白。
- 側欄：接近 `#11140f` / `#151922` 的深色。
- 主色：橄欖綠，例如 `#667047`、`#6B8343`。
- 輔色：暖米色、淡金、柔和藍、柔和粉紅。
- 卡片圓角不要過大，建議 8px 到 12px。
- 不要使用大面積紫色、藍紫漸層、過度裝飾背景。
- 所有按鈕文字不可溢出。
- 桌機與手機都要檢查，不可出現橫向捲動。

## 驗收標準

請完成後執行：

```powershell
npm run build
```

並檢查以下路由：

```text
/
/cases
/collab
/library
/brand
/export
```

桌機尺寸：

```text
1440 x 900
```

手機尺寸：

```text
390 x 844
```

驗收重點：

- 中文不可亂碼。
- 側欄 active state 正確。
- 手機版不會左右跳動。
- 每頁標題清楚。
- 素材庫有真實縮圖或合理 fallback。
- 企劃書預覽可產生 Markdown。
- `npm run build` 必須通過。

## 請避免

- 不要重置 git 或刪除使用者既有改動。
- 不要只做表面 CSS，中文資料層也要修。
- 不要把所有功能塞進協作板第一屏。
- 不要新增無關 landing page。
- 不要讓 sidebar 在 mobile 關閉時仍造成水平位移。

