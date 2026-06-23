# Railway 部署指南

## 1. 建立 Railway 新專案

1. 登入 [Railway](https://railway.app/)
2. 點擊「New Project」→「Deploy from GitHub repo」
3. 選擇 `anxin-collab` 的 GitHub repo（或手動上傳）

## 2. 設定 Service

在 Railway Dashboard 的 Service Settings：

| 設定 | 值 |
|---|---|
| Root Directory | `server` |
| Start Command | `npm start` |
| Build Command | `npm install` |

## 3. 設定環境變數

在 Variables 分頁新增：

| Variable | 值 |
|---|---|
| `DEEPSEEK_API_KEY` | Railway 後台填入你的 DeepSeek API key，不要寫進 GitHub |
| `DEEPSEEK_API_BASE_URL` | `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | `deepseek-v4-pro` |
| `FRONTEND_ORIGIN` | 前端部署網址，例 `https://anxin-collab.vercel.app` |
| `PORT` | `8787` |

## 4. 部署後測試

Railway 會自動 produce 一個 URL，例如 `https://anxin-ai-proxy.up.railway.app`。

測試 health：

```bash
curl https://anxin-ai-proxy.up.railway.app/health
# → { "ok": true, "service": "anxin-ai-proxy" }
```

## 5. 前端設定

在前端部署環境（Vercel / Netlify）設定環境變數：

| Variable | 值 |
|---|---|
| `VITE_AI_PROXY_URL` | Railway URL，例 `https://anxin-ai-proxy.up.railway.app` |

重新部署前端（`npm run build`）後，前端在 DeepSeek 模式下會自動呼叫 Railway 後端。

## 6. 前端系統設定

在前端「系統設定」頁：
1. AI 模式選擇「DeepSeek 模式」
2. 勾選「使用後端代理」
3. 點擊「測試連線」

## 架構圖

```
瀏覽器（React 前端）
    ↓ POST /api/ai/generate
Railway（Express Proxy）
    ↓ Authorization: Bearer DEEPSEEK_API_KEY
DeepSeek API（v1/chat/completions）
    ↓ JSON response
Railway ← parse + strip code fences
    ↓
瀏覽器 ← AiPlanningResult / AiProductionResult
```

## 安全注意

- API Key 只存在 Railway 環境變數，不出現在前端原始碼
- CORS 只允許已設定的 FRONTEND_ORIGIN
- 前端不傳 API Key 到後端
- Request body size 限制 50KB
