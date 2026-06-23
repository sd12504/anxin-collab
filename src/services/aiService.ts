import type { CaseData, BrandSettings, SanitizedCaseForAI, AiPlanningResult, AiProductionResult } from '../types';
import { getAiRuntimeConfig } from '../config/aiConfig';

export function sanitizeCaseForAI(c: CaseData): SanitizedCaseForAI {
  return {
    name: c.name, houseCondition: c.houseCondition, designStyle: c.designStyle,
    stage: c.stage, area: c.area, problem: c.problem, highlight: c.highlight,
    beforeAfter: c.beforeAfter, beforeAfterNote: c.beforeAfterNote,
    mustShoot: c.mustShoot, designerExplain: c.designerExplain,
    masterExplain: c.masterExplain, ownerStory: c.ownerStory,
    materialColor: c.materialColor, specialCraft: c.specialCraft,
  };
}

export function isValidPlanningDraft(d: unknown): d is AiPlanningResult {
  if (!d || typeof d !== 'object') return false;
  const x = d as Record<string, unknown>;
  return typeof x.videoMainline === 'string'
    && Array.isArray(x.storyline) && x.storyline.length > 0
    && Array.isArray(x.interviewQuestions) && x.interviewQuestions.length > 0;
}

export function isValidProductionContent(d: unknown): d is AiProductionResult {
  if (!d || typeof d !== 'object') return false;
  const x = d as Record<string, unknown>;
  if (!Array.isArray(x.shootingChecklist) || x.shootingChecklist.length === 0) return false;
  if (typeof x.longformScript !== 'string') return false;
  if (!Array.isArray(x.interviewQuestions) || x.interviewQuestions.length === 0) return false;
  return true;
}

async function mockAiGenerate<T>(factory: () => T): Promise<T> {
  await new Promise(function (r) { return setTimeout(r, 400 + Math.random() * 400); });
  if (Math.random() < 0.05) throw new Error('AI 服務暫時無法回應，請稍後重試。');
  return factory();
}

var AI_PROXY_URL = import.meta.env.VITE_AI_PROXY_URL || '';

async function callBackendProxy(endpoint: string, body: Record<string, unknown>): Promise<unknown> {
  if (!AI_PROXY_URL) throw new Error('尚未設定 AI 代理伺服器網址。');
  var res = await fetch(AI_PROXY_URL + '/api/ai/' + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    var errText = await res.text().catch(function () { return ''; });
    throw new Error('AI 服務回應錯誤：' + res.status + ' - ' + errText.slice(0, 100));
  }
  return res.json();
}

export type AiStatus = 'idle' | 'loading' | 'success' | 'error';

function buildPlanningPrompt(safe: SanitizedCaseForAI, bs: BrandSettings): string {
  return [
    '你是室內設計影音企劃專家。請根據以下案場資料產出影片企劃。',
    '品牌語氣：' + bs.tone,
    '核心價值：' + bs.coreValues,
    '',
    '案場：' + safe.name,
    '屋況：' + safe.houseCondition,
    '風格：' + safe.designStyle,
    '階段：' + safe.stage,
    '坪數：' + safe.area,
    '屋主需求：' + safe.problem,
    '核心亮點：' + safe.highlight,
    'Before/After：' + safe.beforeAfter,
    '必拍畫面：' + safe.mustShoot,
    '設計師說明：' + safe.designerExplain,
    '工法細節：' + safe.masterExplain,
    '屋主故事：' + safe.ownerStory,
  ].join('\n');
}

function buildProductionPrompt(safe: SanitizedCaseForAI, bs: BrandSettings): string {
  return [
    '你是室內設計影音製作專家。請根據以下案場資料產出完整製片內容。',
    '品牌語氣：' + bs.tone,
    '禁用詞：' + bs.forbiddenWords,
    '',
    '案場：' + safe.name,
    '屋主需求：' + safe.problem,
    '核心亮點：' + safe.highlight,
  ].join('\n');
}

function buildSocialPrompt(safe: SanitizedCaseForAI, bs: BrandSettings): string {
  return [
    '你是室內設計社群文案專家。請根據以下案場資料撰寫社群文案。',
    '品牌語氣：' + bs.tone,
    '核心價值：' + bs.coreValues,
    '禁用詞：' + bs.forbiddenWords,
    '',
    '案場：' + safe.name,
    '屋況：' + safe.houseCondition,
    '風格：' + safe.designStyle,
    '屋主需求：' + safe.problem,
    '核心亮點：' + safe.highlight,
    '設計師說明：' + safe.designerExplain,
  ].join('\n');
}

function buildEditingPrompt(safe: SanitizedCaseForAI): string {
  return [
    '你是室內設計影片剪輯專家。請根據以下案場資料整理剪輯工作單。',
    '',
    '案場：' + safe.name,
    '屋況：' + safe.houseCondition,
    '風格：' + safe.designStyle,
    '階段：' + safe.stage,
    '問題：' + safe.problem,
    '亮點：' + safe.highlight,
    '必拍畫面：' + safe.mustShoot,
    '施工工法：' + safe.masterExplain,
  ].join('\n');
}

export async function generatePlanningDraft(caseData: CaseData, brandSettings: BrandSettings): Promise<AiPlanningResult> {
  var safe = sanitizeCaseForAI(caseData);
  var config = getAiRuntimeConfig();
  if (AI_PROXY_URL) {
    try {
      var raw = await callBackendProxy('generate', {
        provider: 'deepseek', model: 'deepseek-v4-pro',
        prompt: buildPlanningPrompt(safe, brandSettings), type: 'planning',
      });
      var result = raw as AiPlanningResult;
      if (!isValidPlanningDraft(result)) throw new Error('AI 回傳格式不符');
      return result;
    } catch (err) { console.warn('企劃 API 失敗，使用 Mock：', (err as Error).message); }
  }
  return mockAiGenerate(function () { return buildMockPlanning(safe, brandSettings); });
}

export async function generateProductionContent(caseData: CaseData, brandSettings: BrandSettings): Promise<AiProductionResult> {
  var safe = sanitizeCaseForAI(caseData);
  var config = getAiRuntimeConfig();
  if (AI_PROXY_URL) {
    try {
      var raw = await callBackendProxy('generate', {
        provider: 'deepseek', model: 'deepseek-v4-pro',
        prompt: buildProductionPrompt(safe, brandSettings), type: 'production',
      });
      var result = raw as AiProductionResult;
      if (!isValidProductionContent(result)) throw new Error('AI 回傳格式不符');
      return result;
    } catch (err) { console.warn('製片 API 失敗，使用 Mock：', (err as Error).message); }
  }
  return mockAiGenerate(function () { return buildMockProduction(safe, brandSettings); });
}

export async function generateSocialCopy(caseData: CaseData, brandSettings: BrandSettings) {
  var safe = sanitizeCaseForAI(caseData);
  var config = getAiRuntimeConfig();
  if (AI_PROXY_URL) {
    try {
      return await callBackendProxy('generate', {
        provider: 'deepseek', model: 'deepseek-v4-pro',
        prompt: buildSocialPrompt(safe, brandSettings), type: 'social',
      });
    } catch (err) { console.warn('社群文案 API 失敗，使用 Mock：', (err as Error).message); }
  }
  return buildMockSocialCopy(safe, brandSettings);
}

export async function generateEditingBrief(caseData: CaseData, _assets: unknown[], _grade: unknown) {
  var safe = sanitizeCaseForAI(caseData);
  var config = getAiRuntimeConfig();
  if (AI_PROXY_URL) {
    try {
      return await callBackendProxy('generate', {
        provider: 'deepseek', model: 'deepseek-v4-pro',
        prompt: buildEditingPrompt(safe), type: 'editing',
      });
    } catch (err) { console.warn('剪輯工作單 API 失敗，使用 Mock：', (err as Error).message); }
  }
  return buildMockEditingBrief(safe, _assets, _grade);
}

function clean(s: string | null | undefined, max?: number): string {
  var t = (s || '').trim();
  if (max && t.length > max) t = t.slice(0, max);
  return t || '（待補充）';
}

function buildMockPlanning(safe: SanitizedCaseForAI, bs: BrandSettings): AiPlanningResult {
  var n = safe.name || '本案場';
  var core = (bs.coreValues || '安心').split('、')[0];
  return {
    videoMainline: clean(safe.highlight) || n + '空間改造紀錄',
    storyline: [
      '開場：以「' + clean(safe.problem, 25) + '」作為核心提問',
      '診斷：說明' + safe.houseCondition + '的屋況限制與風險',
      '方案：' + (clean(safe.designerExplain, 30) || '設計判斷與取捨邏輯'),
      '施工：' + (clean(safe.masterExplain, 30) || '關鍵工法實作') + '，保留現場收音',
      '對比：Before/After 同角度呈現改善幅度',
      '回訪：屋主入住體驗與心得',
      '結尾：一句話點出' + core + '的價值',
    ],
    sceneSuggestions: [
      '案場外觀與環境交代', '主要問題區域特寫', '設計師說明設計圖',
      clean(safe.mustShoot) || '關鍵施工節點', '師傅手部特寫',
      '完工空間 walkthrough', '屋主使用情境',
    ].filter(Boolean),
    interviewQuestions: [
      safe.problem ? '怎麼發現' + clean(safe.problem, 20) + '這個問題？' : null,
      '這個案場最麻煩的地方是？', '這個步驟沒做會發生什麼？',
      '一般人最容易誤會什麼？', '你是屋主會先注意什麼？',
    ].filter(Boolean) as string[],
    shortsIdeas: [
      '痛點：' + clean(safe.problem, 20),
      '亮點：' + clean(safe.highlight, 20),
      safe.masterExplain ? '工法：' + clean(safe.masterExplain, 20) : null,
      safe.beforeAfter === '有' ? 'Before/After 對比' : null,
      n + ' 60 秒速覽',
    ].filter(Boolean) as string[],
    privacyReminders: [
      '確認地址是否可入鏡', '確認屋主是否願意受訪',
      '確認品牌名稱是否可露出', '確認預算可否提及', '商業用途授權確認',
    ],
    editingDirection: '保留現場感，不過度包裝。使用' + core + '語氣字幕。關鍵數字放大。Before/After 使用 wipe transition。結尾加上 CTA。',
    lastGeneratedAt: new Date().toISOString(),
  };
}

function buildMockProduction(safe: SanitizedCaseForAI, bs: BrandSettings): AiProductionResult {
  var n = safe.name || '本案場';
  var core = (bs.coreValues || '安心').split('、')[0];
  return {
    shootingChecklist: [
      '案場外觀', '問題區域特寫', 'Before 狀態全景',
      '施工關鍵工法', 'After 狀態同角度對比', '設計圖', '設計師講解', '屋主訪談',
    ],
    longformScript: [
      '# ' + n + ' 長片腳本',
      '',
      '## 開場',
      '大家好，我是陳大。今天來看' + (clean(safe.problem, 30) || '一個案例') + '。',
      '',
      '## 診斷',
      '主要問題是' + (clean(safe.problem) || '屋況老化') + '。',
      '',
      safe.designerExplain ? '## 設計方案\n' + safe.designerExplain + '\n' : '',
      safe.masterExplain ? '## 施工細節\n' + safe.masterExplain + '\n' : '',
      '## 完工',
      'Before/After 對比。',
      '',
      '## 結尾',
      core + '，來自每個細節的堅持。',
    ].filter(function (s) { return s !== ''; }).join('\n'),
    shortsScripts: [
      '【' + n + '】' + clean(safe.problem, 18) + '？30 秒看懂',
      '【' + n + '】' + clean(safe.highlight, 18) + '，一個細節差很多',
      safe.masterExplain ? '【' + n + '】師傅說：' + clean(safe.masterExplain, 15) : '【' + n + '】60 秒案場速覽',
    ],
    editingBrief: {
      openingStyle: safe.beforeAfter === '有' ? 'Before/After 快速切換開場' : '空間全景淡入開場',
      segmentOrder: ['開場', '診斷', '方案', '施工', '對比', '訪談', '結尾'],
      subtitleDirection: '白話易讀，關鍵數字放大。保留原聲字幕。',
      musicDirection: '中低音量敘事感配樂，不搶人聲。',
      shortsCutPoints: [clean(safe.problem, 20), clean(safe.highlight, 20), safe.beforeAfter === '有' ? 'Before/After 對比' : '空間全景'].filter(Boolean),
      missingAssets: safe.mustShoot ? [] : ['尚未填寫必拍畫面'],
    },
    socialCopy: {
      youtubeTitle: clean(safe.problem, 25) + '？現場實拍解法｜' + n + '【安心整合】',
      shortsTitle: clean(safe.problem, 15) + '？30 秒看懂',
      facebookPost: '很多人會問：' + clean(safe.problem, 30) + '該怎麼處理？\n\n關鍵不是表面，是根本原因。\n\n事前規劃永遠比事後補救省力。\n\n#安心整合 #舊屋翻新 #裝修知識',
      instagramCaption: clean(safe.problem, 30) + '\n\n解法看影片\n\n#安心整合 #裝修知識',
      hashtags: ['安心整合', '舊屋翻新', '裝修知識', '老屋改造', '室內設計'],
    },
    interviewQuestions: [
      '這個案子當初最困擾你的是什麼？',
      '施工哪個環節最關鍵？',
      '完工後跟想像有什麼不同？',
      '會提醒朋友注意什麼？',
      '一句話形容這次改造？',
    ],
    lastGeneratedAt: new Date().toISOString(),
  };
}

function buildMockSocialCopy(safe: SanitizedCaseForAI, _bs: BrandSettings) {
  var n = safe.name || '本案場';
  return {
    youtubeTitle: clean(safe.problem, 25) + '？現場實拍解法｜' + n + '【安心整合】',
    shortsTitle: clean(safe.problem, 15) + '？30 秒看懂',
    facebookPost: '很多人會問：' + clean(safe.problem, 30) + '該怎麼處理？\n\n關鍵不是表面，是根本原因。\n\n事前規劃永遠比事後補救省力。\n\n#安心整合 #舊屋翻新 #裝修知識',
    instagramCaption: clean(safe.problem, 30) + '\n\n解法看影片\n\n#安心整合 #裝修知識',
    hashtags: ['安心整合', '舊屋翻新', '裝修知識', '老屋改造', '室內設計'],
  };
}

function buildMockEditingBrief(safe: SanitizedCaseForAI, _assets: unknown[], _grade: unknown) {
  return {
    segments: ['開場片頭', '案場診斷', '施工過程', '完工對比', '結尾 CTA'],
    subtitleDirection: '白話易讀，關鍵數字放大。保留原聲字幕。',
    musicDirection: '中低音量敘事感配樂，不搶人聲。',
    shortCuts: [clean(safe.problem, 20), clean(safe.highlight, 20), '空間全景'].filter(Boolean),
    materialGaps: safe.mustShoot ? [] : ['缺少必拍畫面清單'],
  };
}
