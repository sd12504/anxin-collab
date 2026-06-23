import type { CaseData, BrandSettings, SanitizedCaseForAI, AiPlanningResult, AiProductionResult } from '../types';
import { computeGrade } from '../utils/grading';
import { getAiRuntimeConfig } from '../config/aiConfig';

// ===== Sanitize: remove sensitive fields before sending to AI =====
export function sanitizeCaseForAI(c: CaseData): SanitizedCaseForAI {
  return {
    name: c.name,
    houseCondition: c.houseCondition,
    designStyle: c.designStyle,
    stage: c.stage,
    area: c.area,
    problem: c.problem,
    highlight: c.highlight,
    beforeAfter: c.beforeAfter,
    beforeAfterNote: c.beforeAfterNote,
    mustShoot: c.mustShoot,
    designerExplain: c.designerExplain,
    masterExplain: c.masterExplain,
    ownerStory: c.ownerStory,
    materialColor: c.materialColor,
    specialCraft: c.specialCraft,
  };
  // NOTE: ownerName, region (address), budgetMention, brandRestrict,
  // otherRestrict, phone numbers are intentionally excluded.
}

// ===== Validation: check if AI result has complete structure =====
export function isValidPlanningDraft(d: unknown): d is AiPlanningResult {
  if (!d || typeof d !== 'object') return false;
  const draft = d as Record<string, unknown>;
  return (
    typeof draft.videoMainline === 'string' &&
    Array.isArray(draft.storyline) && draft.storyline.length > 0 &&
    Array.isArray(draft.sceneSuggestions) && draft.sceneSuggestions.length > 0 &&
    Array.isArray(draft.interviewQuestions) && draft.interviewQuestions.length > 0 &&
    Array.isArray(draft.shortsIdeas) && draft.shortsIdeas.length > 0 &&
    Array.isArray(draft.privacyReminders) && draft.privacyReminders.length > 0 &&
    typeof draft.editingDirection === 'string' &&
    typeof draft.lastGeneratedAt === 'string'
  );
}

export function isValidProductionContent(d: unknown): d is AiProductionResult {
  if (!d || typeof d !== 'object') return false;
  const c = d as Record<string, unknown>;
  if (
    !Array.isArray(c.shootingChecklist) || c.shootingChecklist.length === 0 ||
    typeof c.longformScript !== 'string' ||
    !Array.isArray(c.shortsScripts) || c.shortsScripts.length === 0 ||
    !Array.isArray(c.interviewQuestions) || c.interviewQuestions.length === 0 ||
    typeof c.lastGeneratedAt !== 'string'
  ) return false;
  const eb = c.editingBrief as Record<string, unknown> | undefined;
  if (!eb || typeof eb !== 'object') return false;
  if (
    typeof eb.openingStyle !== 'string' ||
    !Array.isArray(eb.segmentOrder) || eb.segmentOrder.length === 0 ||
    typeof eb.subtitleDirection !== 'string' ||
    typeof eb.musicDirection !== 'string' ||
    !Array.isArray(eb.shortsCutPoints) ||
    !Array.isArray(eb.missingAssets)
  ) return false;
  const sc = c.socialCopy as Record<string, unknown> | undefined;
  if (!sc || typeof sc !== 'object') return false;
  if (
    typeof sc.youtubeTitle !== 'string' ||
    typeof sc.shortsTitle !== 'string' ||
    typeof sc.facebookPost !== 'string' ||
    typeof sc.instagramCaption !== 'string' ||
    !Array.isArray(sc.hashtags) || sc.hashtags.length === 0
  ) return false;
  return true;
}

// ===== Mock AI: simulates AI response with contextual data =====
async function mockAiGenerate<T>(factory: () => T): Promise<T> {
  // Simulate network latency
  await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
  // 5% chance of simulated error for testing error state
  if (Math.random() < 0.05) {
    throw new Error('AI 服務暫時無法回應，請稍後重試。');
  }
  return factory();
}

// ===== Backend proxy calls =====
async function callBackendProxy(endpoint: string, body: unknown): Promise<unknown> {
  const config = getAiRuntimeConfig();

  if (!config.useBackendProxy) {
    throw new Error('前端直連 API 尚未啟用，請至系統設定開啟「使用後端代理」或切換至 Mock 模式。');
  }

  const baseUrl = import.meta.env.VITE_AI_PROXY_URL || '';
  const url = `${baseUrl}/api/ai/${endpoint}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`AI 服務回應錯誤：${res.status}${errBody ? ' — ' + errBody.slice(0, 100) : ''}`);
  }

  return res.json();
}

// ===== AI Status =====
export type AiStatus = 'idle' | 'loading' | 'success' | 'error';

// ===== generatePlanningDraft =====
export async function generatePlanningDraft(
  caseData: CaseData,
  brandSettings: BrandSettings
): Promise<AiPlanningResult> {
  const safe = sanitizeCaseForAI(caseData);
  const config = getAiRuntimeConfig();

  // Mock mode
  if (config.provider === 'mock' || !config.enabled) {
    return mockAiGenerate(() => buildMockPlanning(safe, brandSettings));
  }

  // DeepSeek / OpenAI via backend proxy
  try {
    const prompt = buildPlanningPrompt(safe, brandSettings);
    const raw = await callBackendProxy('generate', {
      provider: config.provider,
      model: config.model,
      prompt,
    });
    const result = raw as AiPlanningResult;
    if (!isValidPlanningDraft(result)) {
      throw new Error('AI 回傳資料格式不符，已自動切換至 Mock 模式。');
    }
    return result;
  } catch (err) {
    console.warn('AI 生成失敗，使用 Mock 模式：', (err as Error).message);
    return mockAiGenerate(() => buildMockPlanning(safe, brandSettings));
  }
}

// ===== generateProductionContent =====
export async function generateProductionContent(
  caseData: CaseData,
  brandSettings: BrandSettings
): Promise<AiProductionResult> {
  const safe = sanitizeCaseForAI(caseData);
  const config = getAiRuntimeConfig();

  if (config.provider === 'mock' || !config.enabled) {
    return mockAiGenerate(() => buildMockProduction(safe, brandSettings));
  }

  try {
    const prompt = buildProductionPrompt(safe, brandSettings);
    const raw = await callBackendProxy('generate', {
      provider: config.provider,
      model: config.model,
      prompt,
    });
    const result = raw as AiProductionResult;
    if (!isValidProductionContent(result)) {
      throw new Error('AI 回傳資料格式不符，已自動切換至 Mock 模式。');
    }
    return result;
  } catch (err) {
    console.warn('AI 生成失敗，使用 Mock 模式：', (err as Error).message);
    return mockAiGenerate(() => buildMockProduction(safe, brandSettings));
  }
}

// ===== generateSocialCopy (standalone) =====
export { buildMockSocialCopy as generateSocialCopy };

// ===== generateEditingBrief (standalone) =====
export { buildMockEditingBrief as generateEditingBrief };

// ===== Prompt builders (for future real API) =====
function buildPlanningPrompt(safe: SanitizedCaseForAI, bs: BrandSettings): string {
  return `你是室內設計影音企劃專家。請根據以下案場資料產出影片企劃。\n品牌語氣：${bs.tone}\n核心價值：${bs.coreValues}\n\n案場：${safe.name}\n屋況：${safe.houseCondition}\n風格：${safe.designStyle}\n階段：${safe.stage}\n坪數：${safe.area}\n痛點：${safe.problem}\n亮點：${safe.highlight}\n反差：${safe.beforeAfter}\n必拍：${safe.mustShoot}\n設計師說明：${safe.designerExplain}\n工法：${safe.masterExplain}\n屋主故事：${safe.ownerStory}`;
}

function buildProductionPrompt(safe: SanitizedCaseForAI, bs: BrandSettings): string {
  return `你是室內設計影音製作專家。請根據以下案場資料產出完整製片內容。\n品牌語氣：${bs.tone}\n禁用詞：${bs.forbiddenWords}\n\n案場：${safe.name}\n痛點：${safe.problem}\n亮點：${safe.highlight}`;
}

// ===== Mock factories =====
function pick<T>(arr: T[], fallback: T): T {
  return arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : fallback;
}

function clean(s: string | null | undefined, maxLen = 40): string {
  return (s || '').trim().slice(0, maxLen) || '（待補充）';
}

function buildMockPlanning(safe: SanitizedCaseForAI, bs: BrandSettings): AiPlanningResult {
  const now = new Date().toISOString();
  const n = safe.name || '本案場';
  const core = bs.coreValues.split('、')[0] || '安心';

  return {
    videoMainline: clean(safe.highlight) || `${n}空間改造全紀錄`,

    storyline: [
      `開場（0:00–0:30）：以「${clean(safe.problem, 25)}」作為核心提問，建立觀眾期待`,
      `案場診斷（0:30–2:00）：說明${safe.houseCondition}屋況、限制與風險`,
      `方案規劃（2:00–4:00）：${clean(safe.designerExplain, 30) || '設計判斷與取捨邏輯'}`,
      `施工過程（4:00–8:00）：${clean(safe.masterExplain, 30) || '關鍵工法實作'}，保留現場收音`,
      `完工對比（8:00–10:00）：Before/After 同角度對比，數據化呈現改善幅度`,
      `屋主回訪（10:00–11:30）：入住體驗與心得`,
      `結尾（11:30–12:00）：一句話點出${core}的價值`,
    ],

    sceneSuggestions: [
      '案場外觀與街區環境交代',
      '主要問題區域特寫',
      '設計師說明設計圖或 3D 圖',
      clean(safe.mustShoot) || '關鍵施工節點',
      '師傅手部特寫：量測、切割、安裝',
      '完工空間全景與動線 walkthrough',
      '屋主使用情境',
    ].filter(Boolean),

    interviewQuestions: [
      clean(safe.problem) ? `當初是怎麼發現${clean(safe.problem, 20)}這個問題的？` : null,
      '這個案場最麻煩的地方是哪裡？',
      '這個步驟如果沒做，未來會發生什麼問題？',
      '一般人最容易誤會的是什麼？',
      '如果你是屋主，這裡你會先注意什麼？',
    ].filter(Boolean) as string[],

    shortsIdeas: [
      `痛點鉤子：${clean(safe.problem, 20)}？30 秒看懂`,
      `設計亮點：${clean(safe.highlight, 20)}`,
      safe.masterExplain ? `師傅說：${clean(safe.masterExplain, 20)}` : null,
      safe.beforeAfter === '有' ? 'Before/After 對比挑戰' : null,
      `${n}空間改造 60 秒速覽`,
    ].filter(Boolean) as string[],

    privacyReminders: [
      '確認地址是否可入鏡',
      '確認屋主是否願意受訪',
      '確認品牌與廠商名稱是否可露出',
      '確認預算範圍是否可提及',
      '商業用途授權確認',
    ],

    editingDirection: [
      '保留現場感，不過度包裝',
      `使用${bs.tone.split('、')[0] || '溫暖專業'}語氣字幕`,
      '關鍵數字放大呈現',
      'Before/After 使用 wipe transition',
      '結尾加上 CTA 引導留言或私訊',
    ].join('。'),

    lastGeneratedAt: now,
  };
}

function buildMockProduction(safe: SanitizedCaseForAI, bs: BrandSettings): AiProductionResult {
  const now = new Date().toISOString();
  const n = safe.name || '本案場';

  return {
    shootingChecklist: [
      '案場外觀：大門、街區、建築外觀',
      '主要問題區域特寫',
      'Before 狀態：各空間全景與問題點',
      '施工過程：關鍵工法與師傅實作',
      'After 狀態：同角度對比',
      '設計圖或 3D 示意圖',
      '設計師講解',
      '屋主訪談',
    ],

    longformScript: `# ${n} 長片腳本\n\n## 開場\n大家好，我是陳大。今天帶大家來看${clean(safe.problem, 30) || '一個特別的案例'}。\n\n## 案場診斷\n這個案場最主要的問題是${clean(safe.problem) || '屋況老化'}。${safe.houseCondition}的條件下，常見的挑戰包括……\n\n${safe.designerExplain ? `## 設計方案\n${safe.designerExplain}\n\n` : ''}${safe.masterExplain ? `## 施工細節\n我們來看師傅怎麼處理：${safe.masterExplain}\n\n` : ''}## 完工成果\nBefore/After 對比，最大的改善是……\n\n## 結尾\n${bs.coreValues.split('、')[0] || '安心'}，來自每個細節的堅持。我們是安心整合，下次見。`,

    shortsScripts: [
      `【${n}】${clean(safe.problem, 18)}？30 秒看懂我們怎麼解。`,
      `【${n}】${clean(safe.highlight, 18)}，一個細節差很多。`,
      safe.masterExplain ? `【${n}】師傅現場說：${clean(safe.masterExplain, 15)}` : `【${n}】案場速覽，60 秒看完改造重點。`,
    ],

    editingBrief: {
      openingStyle: safe.beforeAfter === '有' ? 'Before/After 快速切換開場' : '空間全景淡入開場',
      segmentOrder: ['開場', '案場診斷', '方案說明', '施工過程', '完工對比', '人物訪談', '結尾 CTA'],
      subtitleDirection: '白話易讀，關鍵數字放大。保留設計師與師傅原聲字幕。',
      musicDirection: '中低音量敘事感配樂，不搶人聲。短影音版用輕快節奏。',
      shortsCutPoints: [
        clean(safe.problem, 20),
        clean(safe.highlight, 20),
        safe.beforeAfter === '有' ? 'Before/After 對比' : '空間全景',
      ].filter(Boolean),
      missingAssets: !safe.mustShoot ? ['尚未填寫必拍畫面，建議補充'] : [],
    },

    socialCopy: {
      youtubeTitle: `${clean(safe.problem, 25)}？現場實拍告訴你解法｜${n}【安心整合】`,
      shortsTitle: `${clean(safe.problem, 15)}？30 秒看懂`,
      facebookPost: `很多人會問：${clean(safe.problem, 30)}該怎麼處理？\n\n依照我們現場經驗，關鍵不是表面處理，而是先找到根本原因。\n\n${safe.designerExplain ? `設計師的判斷是：${clean(safe.designerExplain)}\n\n` : ''}一句話：事前規劃永遠比事後補救省力。\n\n#安心整合 #舊屋翻新 #裝修知識`,
      instagramCaption: `${clean(safe.problem, 30)}\n\n解決方案看影片 ↗\n\n#安心整合 #裝修知識`,
      hashtags: ['安心整合', '舊屋翻新', '裝修知識', '老屋改造', '室內設計'],
    },

    interviewQuestions: [
      `這個案子當初最讓你困擾的是什麼？`,
      `施工過程中，哪個環節最關鍵？`,
      `完工後跟原本想像的有什麼不一樣？`,
      `如果有朋友要裝修，你會提醒他注意什麼？`,
      `用一句話形容這次的改造？`,
    ],

    lastGeneratedAt: now,
  };
}

// Standalone mock functions (used by ExportCenter)
async function buildMockSocialCopy(safe: SanitizedCaseForAI, _bs: BrandSettings) {
  await new Promise(r => setTimeout(r, 200));
  const n = safe.name || '本案場';
  return {
    youtubeTitle: `${clean(safe.problem, 25)}？現場實拍告訴你解法｜${n}【安心整合】`,
    shortsTitle: `${clean(safe.problem, 15)}？30 秒看懂`,
    facebookPost: `很多人會問：${clean(safe.problem, 30)}該怎麼處理？\n\n依照我們現場經驗，關鍵不是表面處理，而是先找到根本原因。\n\n一句話：事前規劃永遠比事後補救省力。\n\n#安心整合 #舊屋翻新 #裝修知識`,
    instagramCaption: `${clean(safe.problem, 30)}\n\n解決方案看影片 ↗\n\n#安心整合 #裝修知識`,
    hashtags: ['安心整合', '舊屋翻新', '裝修知識', '老屋改造', '室內設計'],
  };
}

async function buildMockEditingBrief(safe: SanitizedCaseForAI, _assets: unknown[], _grade: unknown) {
  await new Promise(r => setTimeout(r, 200));
  return {
    segments: ['開場片頭', '案場診斷', '施工過程', '完工對比', '結尾 CTA'],
    subtitleDirection: '白話、好讀，關鍵數字放大。保留師傅與設計師原聲字幕。',
    musicDirection: '中低音量敘事感配樂，不搶人聲',
    shortCuts: [clean(safe.problem, 20), clean(safe.highlight, 20), '空間全景'].filter(Boolean),
    materialGaps: !safe.mustShoot ? ['缺少必拍畫面清單，建議補充'] : [],
  };
}
