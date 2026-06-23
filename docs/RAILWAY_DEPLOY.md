# Railway 部署指南

## 1. 建立 Railway 專案

1. 登入 [Railway](https://railway.app/)
2. 點擊 New Project，選擇 Deploy from GitHub repo
3. 選擇 anxin-collab 的 GitHub repo
4. Railway 會自動讀取 repo 中的 railway.json 和 Procfile

## 2. 部署設定

Railway 會自動執行以下設定（來自 railway.json）：

| 設定 | 值 |
|---|---|
| Root Directory | server |
| Build Command | npm install |
| Start Command | npm start |
| Health Check Path | /health |

如果你在 Railway Dashboard 手動設定過 Root Directory 為 server，railway.json 和 Procfile 中的指令會與之配合，不需要手動 cd 到子目錄。

## 3. 環境變數

在 Railway Dashboard 的 Variables 分頁新增：

| Variable | 值 |
|---|---|
| DEEPSEEK_API_KEY | sk-xxxxxxxxxxxxxxxx（你的 DeepSeek API key） |
| DEEPSEEK_MODEL | deepseek-v4-pro |
| FRONTEND_ORIGIN | 前端部署網址，例如 https://anxin-collab.vercel.app |
| PORT | 8787 |

DEEPSEEK_API_BASE_URL 使用預設值 https://api.deepseek.com 可以不設定。

## 4. 部署後測試

Railway 會自動產生一個網址，例如 https://anxin-collab-production.up.railway.app。

測試 health check：

```bash
curl https://anxin-collab-production.up.railway.app/health
# 回傳：{"ok":true,"service":"anxin-ai-proxy"}
```

## 5. 前端設定

在前端部署環境（Vercel 或 Netlify）設定環境變數：

| Variable | 值 |
|---|---|
| VITE_AI_PROXY_URL | Railway 網址，例如 https://anxin-collab-production.up.railway.app |

重新部署前端（npm run build）後，前端會自動透過 Railway 後端呼叫 DeepSeek API。

## 6. 架構圖

```
瀏覽器（React 前端）
    |
    | POST /api/ai/generate
    v
Railway（Express 代理伺服器）
    |
    | Authorization: Bearer DEEPSEEK_API_KEY
    v
DeepSeek API（v1/chat/completions）
    |
    | JSON response
    v
Railway（parse + strip markdown fences）
    |
    v
瀏覽器（AiPlanningResult / AiProductionResult）
```

## 7. 安全注意

- API Key 只存在 Railway 環境變數，不出現在前端原始碼
- CORS 只允許已設定的 FRONTEND_ORIGIN
- 前端不傳送 API Key 到後端
- Request body 大小限制 100KB
