import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8787;
const HOST = '0.0.0.0';

// ===== CORS =====
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
if (process.env.FRONTEND_ORIGIN) {
  allowedOrigins.push(process.env.FRONTEND_ORIGIN);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
}));

app.use(express.json({ limit: '50kb' }));

// ===== Health =====
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'anxin-ai-proxy' });
});

// ===== AI Generate =====
app.post('/api/ai/generate', async (req, res) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'DEEPSEEK_API_KEY not configured on server.',
    });
  }

  const { provider, model, prompt } = req.body;

  if (provider !== 'deepseek') {
    return res.status(400).json({
      error: `Unsupported provider: ${provider}. Only "deepseek" is currently supported.`,
    });
  }

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid "prompt" field.',
    });
  }

  const baseUrl = process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com';
  const aiModel = model || process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro';

  const systemPrompt = `你是室內設計影音企劃專家。請根據使用者提供的案場資料，產出結構化 JSON 回覆。回覆必須是純 JSON，不包含 markdown 代碼塊標記，不包含任何解釋文字。

回覆格式必須嚴格遵循以下 JSON schema：
{
  "videoMainline": "影片主線（字串）",
  "storyline": ["故事線步驟1", "故事線步驟2", ...],
  "sceneSuggestions": ["場景建議1", "場景建議2", ...],
  "interviewQuestions": ["訪談問題1", "訪談問題2", ...],
  "shortsIdeas": ["短影音題目1", "短影音題目2", ...],
  "privacyReminders": ["隱私提醒1", "隱私提醒2", ...],
  "editingDirection": "剪輯方向（字串）"
}

每個陣列至少要有 3 個項目，每個字串必須是完整的繁體中文句子。`;

  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`DeepSeek API error ${response.status}:`, errBody.slice(0, 200));
      return res.status(502).json({
        error: `DeepSeek API returned ${response.status}`,
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({
        error: 'DeepSeek API returned empty response.',
      });
    }

    // Strip markdown code fences if present
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    try {
      const parsed = JSON.parse(jsonStr);
      res.json(parsed);
    } catch (parseErr) {
      console.error('Failed to parse AI response as JSON:', parseErr);
      res.status(502).json({
        error: 'Failed to parse AI response as valid JSON.',
      });
    }
  } catch (err) {
    console.error('AI proxy error:', err);
    res.status(502).json({
      error: 'Failed to reach DeepSeek API.',
    });
  }
});

// ===== Start =====
app.listen(PORT, HOST, () => {
  console.log(`anxin-ai-proxy running on ${HOST}:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  if (!process.env.DEEPSEEK_API_KEY) {
    console.warn('WARNING: DEEPSEEK_API_KEY not set. /api/ai/generate will return 500.');
  }
});
