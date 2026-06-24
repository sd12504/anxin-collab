import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDB, getAllCases, getCaseById, upsertCase, deleteCaseById } from './db.js';

console.log('Starting anxin-ai-proxy...');
console.log('PORT:', process.env.PORT || '8787');
console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? '***configured***' : 'NOT SET');
console.log('DEEPSEEK_MODEL:', process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro');

const app = express();
const PORT = process.env.PORT || 8787;
const HOST = '0.0.0.0';

const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
if (process.env.FRONTEND_ORIGIN) allowedOrigins.push(process.env.FRONTEND_ORIGIN);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    callback(null, false);
  },
}));
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'anxin-ai-proxy' });
});

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'anxin-ai-proxy' });
});

// ===== Case CRUD =====
app.get('/api/cases', async (_req, res) => {
  try { res.json(await getAllCases()); } catch { res.status(500).json({ error: 'Failed' }); }
});
app.get('/api/cases/:id', async (req, res) => {
  try {
    const c = await getCaseById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch { res.status(500).json({ error: 'Failed' }); }
});
app.put('/api/cases/:id', async (req, res) => {
  try { await upsertCase(req.params.id, req.body); res.json({ ok: true }); } catch { res.status(500).json({ error: 'Failed' }); }
});
app.delete('/api/cases/:id', async (req, res) => {
  try { await deleteCaseById(req.params.id); res.json({ ok: true }); } catch { res.status(500).json({ error: 'Failed' }); }
});

const SCHEMAS = {
  planning: {
    system: [
      '你是一位室內設計影音企劃專家，專門為老屋翻新公司「安心整合」製作影片企劃。',
      '請根據使用者提供的案場資料，產生一份結構化 JSON 回覆。',
      '回覆必須是純 JSON，不可包含 markdown 代碼塊標記，不可包含任何解釋文字。',
      '所有文字必須是台灣繁體中文，語氣溫暖專業、貼近生活、重視細節。',
      '',
      '回覆格式如下（必須嚴格遵守）：',
      '{',
      '  "videoMainline": "影片主線，一句完整的繁體中文描述",',
      '  "storyline": ["步驟一", "步驟二", "步驟三", ...],',
      '  "sceneSuggestions": ["場景建議一", "場景建議二", "場景建議三", ...],',
      '  "interviewQuestions": ["訪談問題一", "訪談問題二", "訪談問題三", ...],',
      '  "shortsIdeas": ["短影音題目一", "短影音題目二", "短影音題目三", ...],',
      '  "privacyReminders": ["隱私提醒一", "隱私提醒二", "隱私提醒三", ...],',
      '  "editingDirection": "剪輯方向，一句完整的繁體中文描述"',
      '}',
      '每個陣列至少要有三個項目，最多七個。',
    ].join('\n'),
  },

  production: {
    system: [
      '你是一位室內設計影音製作專家，專門為老屋翻新公司「安心整合」製作完整的製片內容。',
      '請根據使用者提供的案場資料，產生一份結構化 JSON 回覆。',
      '回覆必須是純 JSON，不可包含 markdown 代碼塊標記，不可包含任何解釋文字。',
      '所有文字必須是台灣繁體中文。',
      '',
      '回覆格式如下（必須嚴格遵守）：',
      '{',
      '  "shootingChecklist": ["必拍項目一", "必拍項目二", "必拍項目三", ...],',
      '  "longformScript": "長片腳本，完整的繁體中文腳本內容",',
      '  "shortsScripts": ["短影音腳本一", "短影音腳本二", "短影音腳本三"],',
      '  "editingBrief": {',
      '    "openingStyle": "開場方式描述",',
      '    "segmentOrder": ["段落一", "段落二", "段落三", ...],',
      '    "subtitleDirection": "字幕方向描述",',
      '    "musicDirection": "音樂方向描述",',
      '    "shortsCutPoints": ["可切短影音片段一", "可切短影音片段二", "可切短影音片段三"],',
      '    "missingAssets": ["缺少素材一"]',
      '  },',
      '  "socialCopy": {',
      '    "youtubeTitle": "YouTube 標題",',
      '    "shortsTitle": "Shorts 標題",',
      '    "facebookPost": "Facebook 貼文內容",',
      '    "instagramCaption": "Instagram 文案",',
      '    "hashtags": ["標籤一", "標籤二", "標籤三", ...]',
      '  },',
      '  "interviewQuestions": ["訪談問題一", "訪談問題二", "訪談問題三", ...]',
      '}',
      '每個陣列至少要有三個項目。',
    ].join('\n'),
  },

  social: {
    system: [
      '你是一位室內設計社群文案專家，專門為老屋翻新公司「安心整合」撰寫社群內容。',
      '請根據使用者提供的案場資料，產生一份結構化 JSON 回覆。',
      '回覆必須是純 JSON，不可包含 markdown 代碼塊標記，不可包含任何解釋文字。',
      '所有文字必須是台灣繁體中文，語氣溫暖、真誠、不浮誇。',
      '',
      '回覆格式如下（必須嚴格遵守）：',
      '{',
      '  "youtubeTitle": "YouTube 影片標題",',
      '  "shortsTitle": "Shorts 短影音標題",',
      '  "facebookPost": "Facebook 貼文完整內容",',
      '  "instagramCaption": "Instagram 貼文文案",',
      '  "hashtags": ["標籤一", "標籤二", "標籤三", "標籤四", "標籤五"]',
      '}',
    ].join('\n'),
  },

  editing: {
    system: [
      '你是一位室內設計影片剪輯專家，專門為老屋翻新公司「安心整合」整理剪輯工作單。',
      '請根據使用者提供的案場資料，產生一份結構化 JSON 回覆。',
      '回覆必須是純 JSON，不可包含 markdown 代碼塊標記，不可包含任何解釋文字。',
      '所有文字必須是台灣繁體中文。',
      '',
      '回覆格式如下（必須嚴格遵守）：',
      '{',
      '  "openingStyle": "開場方式描述",',
      '  "segmentOrder": ["段落一", "段落二", "段落三", "段落四", "段落五"],',
      '  "subtitleDirection": "字幕規則與方向",',
      '  "musicDirection": "音樂挑選方向",',
      '  "shortsCutPoints": ["可切短影音片段一", "可切短影音片段二", "可切短影音片段三"],',
      '  "missingAssets": ["缺少的素材提醒一"]',
      '}',
    ].join('\n'),
  },
};

app.post('/api/ai/generate', async (req, res) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'DEEPSEEK_API_KEY not configured on server.' });
  }

  const { provider, model, prompt, type } = req.body;

  if (provider !== 'deepseek') {
    return res.status(400).json({ error: 'Unsupported provider: ' + provider });
  }
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "prompt" field.' });
  }

  const schema = SCHEMAS[type] || SCHEMAS.planning;
  const baseUrl = process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com';
  const aiModel = model || process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro';

  try {
    const response = await fetch(baseUrl + '/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: 'system', content: schema.system },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('DeepSeek API error ' + response.status + ':', errBody.slice(0, 200));
      return res.status(502).json({ error: 'DeepSeek API returned ' + response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(502).json({ error: 'DeepSeek API returned empty response.' });
    }

    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
    else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();

    const parsed = JSON.parse(jsonStr);
    res.json(parsed);
  } catch (err) {
    console.error('AI proxy error:', err.message);
    res.status(502).json({ error: 'Failed to reach or parse DeepSeek API response.' });
  }
});

const server = app.listen(PORT, HOST, () => {
  console.log('anxin-ai-proxy running on ' + HOST + ':' + PORT);
  if (!process.env.DEEPSEEK_API_KEY) {
    console.warn('WARNING: DEEPSEEK_API_KEY not set.');
  }
}).on('error', (err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

initDB().catch((err) => {
  console.error('Database init failed:', err.message);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});
