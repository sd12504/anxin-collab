# AI API 後端代理說明

## 為什麼不能把 API Key 放前端

API Key 若寫在前端程式碼或 localStorage，任何人都可以從瀏覽器 DevTools 取得，導致：

1. API Key 被盜用，產生非預期費用
2. 第三方可直接以你的身份呼叫 API
3. 無法控制請求頻率與內容審查

## 正確架構

```
前端（React）→ 後端 Proxy（/api/ai/generate）→ DeepSeek API
```

## DeepSeek API Key 管理

API Key 應放在後端環境變數（`.env`），不進入版本控制：

```
DEEPSEEK_API_KEY=請在後端環境變數填入，不要寫進 GitHub
```

前端不持有 API Key。僅在後端收到請求時由環境變數注入。

## 前端 Request 格式

前端呼叫 `POST /api/ai/generate`：

```json
{
  "provider": "deepseek",
  "model": "deepseek-chat",
  "prompt": "你是室內設計影音企劃專家。請根據以下案場資料..."
}
```

## 後端 Proxy 實作（範例）

```typescript
// POST /api/ai/generate
app.post('/api/ai/generate', async (req, res) => {
  const { provider, model, prompt } = req.body;

  if (provider !== 'deepseek') {
    return res.status(400).json({ error: 'Unsupported provider' });
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: model || 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是室內設計影音企劃專家。請以結構化 JSON 格式回覆。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  try {
    const parsed = JSON.parse(content);
    res.json(parsed);
  } catch {
    res.status(500).json({ error: 'Failed to parse AI response as JSON' });
  }
});
```

## Response 格式

後端應回傳與前端型別對應的 JSON：

### AiPlanningResult

```json
{
  "videoMainline": "...",
  "storyline": ["...", "..."],
  "sceneSuggestions": ["...", "..."],
  "interviewQuestions": ["...", "..."],
  "shortsIdeas": ["...", "..."],
  "privacyReminders": ["...", "..."],
  "editingDirection": "...",
  "lastGeneratedAt": "2026-06-23T..."
}
```

### AiProductionResult

```json
{
  "shootingChecklist": ["...", "..."],
  "longformScript": "...",
  "shortsScripts": ["...", "..."],
  "editingBrief": {
    "openingStyle": "...",
    "segmentOrder": ["..."],
    "subtitleDirection": "...",
    "musicDirection": "...",
    "shortsCutPoints": ["..."],
    "missingAssets": ["..."]
  },
  "socialCopy": {
    "youtubeTitle": "...",
    "shortsTitle": "...",
    "facebookPost": "...",
    "instagramCaption": "...",
    "hashtags": ["..."]
  },
  "interviewQuestions": ["..."],
  "lastGeneratedAt": "2026-06-23T..."
}
```

## 錯誤處理

| HTTP Status | 前端行為 |
|---|---|
| 200 | 使用 `isValidPlanningDraft` / `isValidProductionContent` 驗證後寫入 |
| 400 | 顯示「AI 服務回應錯誤」 |
| 401 | 後端檢查 API Key 是否正確 |
| 500 | 前端自動 fallback 到 Mock 模式，顯示提示 |
| Network Error | 前端自動 fallback 到 Mock 模式，顯示提示 |

## 前端目前狀態

- Mock 模式：✅ 可用
- DeepSeek（無後端代理）：❌ 顯示「前端直連 API 尚未啟用」，自動 fallback Mock
- DeepSeek（有後端代理）：🔧 等待後端部署後即可使用
