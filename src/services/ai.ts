import type { CaseData, BrandSettings, PlanningDraft, ScriptDraft, EditingBrief, SocialCopy } from '../types';
import { computeGrade, getGradeOutput } from '../utils/grading';

function delay(ms = 300): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function clean(s: string | null | undefined): string {
  return (s || '').trim();
}

export async function generatePlanningDraft(
  c: CaseData,
  bs: BrandSettings
): Promise<PlanningDraft> {
  await delay();
  const grade = computeGrade(c);

  // Storyline
  const storyline: string[] = [];
  if (grade.grade === 'A') {
    storyline.push(`開場鉤子（0:00–0:30）：以「${clean(c.problem).slice(0, 25) || '屋況痛點'}」作為最大痛點，製造期待`);
    storyline.push(`案場診斷（0:30–2:00）：說明屋齡、屋況限制與風險`);
    storyline.push(`方案規劃（2:00–4:00）：為什麼這樣設計，包括 ${clean(c.highlight).slice(0, 25) || '設計判斷'}，說清楚取捨邏輯`);
    storyline.push(`施工過程（4:00–8:00）：師傅實作與工法細節（${clean(c.masterExplain).slice(0, 25) || '關鍵工法'}）`);
    storyline.push('完工對比（8:00–10:00）：Before/After 同角度對比，具體呈現使用改善');
    storyline.push('屋主回訪（10:00–11:30）：入住體驗、與預期差異、真心話');
    storyline.push('結尾 CTA（11:30–12:00）：一句金句收尾，引導留言或私訊');
    storyline.push('同步拆成 3–5 支 Shorts/Reels，寫一篇品牌案例文章');
  } else if (grade.grade === 'B') {
    storyline.push(`開場（0:00–0:20）：從屋主需求切入「${clean(c.problem || c.ownerStory).slice(0, 25) || '居住困擾'}」`);
    storyline.push(`Before 呈現（0:20–1:00）：改造前屋況，說明痛點與限制`);
    storyline.push(`設計師判斷（1:00–2:30）：${clean(c.designerExplain).slice(0, 30) || '設計取捨與解決方案'}`);
    storyline.push(`施工亮點（2:30–5:00）：材質或工法細節，重點特寫`);
    storyline.push('After 對比（5:00–7:00）：同角度 Before/After，聚焦改善幅度');
    storyline.push('訪談片段（7:00–8:30）：屋主或設計師訪談');
    storyline.push('同步拆成 2–3 支 Shorts/Reels，納入作品集素材');
  } else if (grade.grade === 'C') {
    storyline.push(`以 1–2 個設計亮點為核心：${clean(c.highlight || c.designerExplain).slice(0, 30) || '空間重點'}`);
    storyline.push('0–3 秒：痛點或好奇鉤子');
    storyline.push('3–30 秒：展示空間與設計亮點');
    storyline.push('30–55 秒：說明原理或差異');
    storyline.push('55–60 秒：引導看更多案例');
    storyline.push('適合 Shorts/Reels 或 1 分鐘內簡短案例影片');
  } else {
    storyline.push('以案場紀錄形式拍攝關鍵空間與施工節點');
    storyline.push(`重點畫面：${clean(c.mustShoot).slice(0, 40) || '主要空間與施工階段'}`);
    storyline.push('素材歸檔內部留存');
  }

  // Shot list
  const shotList = clean(c.mustShoot)
    ? clean(c.mustShoot).split(/[，,、\n]/).filter(Boolean).map(s => s.trim())
    : ['案場外觀與環境交代', '主要空間全景', '重點細節特寫'];

  // Questions
  const qs = [
    '這個案場最麻煩的地方是哪裡？',
    '這個步驟如果沒做，未來會發生什麼問題？',
    '一般人最容易誤會的是什麼？',
    '這個材料／工法的優點和限制是什麼？',
    '如果你是屋主，這裡你會先注意什麼？',
  ];
  if (clean(c.ownerStory)) {
    qs.unshift('入住到現在，跟原本住起來最大的差別是什麼？');
    qs.unshift('當初裝修前最困擾你的是什麼？');
  }
  if (clean(c.problem)) {
    qs.unshift(`當初是怎麼發現${clean(c.problem).slice(0, 20)}這個問題的？`);
  }

  // Shorts topics
  const shortsTopics: string[] = [];
  if (clean(c.problem)) shortsTopics.push(`痛點鉤子：${clean(c.problem).slice(0, 25)}`);
  if (clean(c.highlight)) shortsTopics.push(`設計亮點：${clean(c.highlight).slice(0, 25)}`);
  if (clean(c.masterExplain)) shortsTopics.push(`師傅工法：${clean(c.masterExplain).slice(0, 25)}`);
  if (clean(c.designerExplain)) shortsTopics.push(`設計師說：${clean(c.designerExplain).slice(0, 25)}`);
  if (c.beforeAfter === '有') shortsTopics.push('Before/After 對比：改造前後差多大？');
  if (shortsTopics.length === 0) shortsTopics.push('案場速覽：空間亮點 60 秒');

  // Edit direction
  let editDirection = '';
  if (grade.grade === 'A') {
    editDirection = '長片為主，同步拆 3–5 支 Shorts/Reels。保留現場感，避免過度花俏。重點：痛點鉤子 → 診斷 → 施工細節 → 完工對比 → 屋主回訪。';
  } else if (grade.grade === 'B') {
    editDirection = '完整案例影片，拆 2–3 支短影音。保留設計師與師傅原聲。重點：屋主需求 → Before → 設計判斷 → 施工亮點 → After 對比。';
  } else if (grade.grade === 'C') {
    editDirection = '短影音優先，每支聚焦 1 個設計亮點或知識點。節奏明快，30–60 秒內完成。';
  } else {
    editDirection = '以內部紀錄為主，搭配簡短社群素材。素材歸檔後，日後若有更多資料可升級。';
  }

  return { mainLine: clean(c.highlight) || '待填寫', storyline, shotList, interviewQuestions: qs, shortsTopics, editDirection };
}

export async function generateScript(
  c: CaseData,
  grade: ReturnType<typeof computeGrade>,
  bs: BrandSettings
): Promise<ScriptDraft> {
  await delay(400);
  const n = c.name || '本案場';

  let longScript = `# ${n} 長片腳本\n\n`;
  longScript += `## 開場\n大家好，我是陳大。今天帶大家來看${clean(c.problem).slice(0, 30) || '一個特別的案例'}。\n\n`;
  longScript += `## 案場診斷\n這個案場最主要的問題是${clean(c.problem) || '屋況老化'}。\n\n`;
  if (clean(c.designerExplain)) longScript += `## 設計方案\n${clean(c.designerExplain)}\n\n`;
  if (clean(c.masterExplain)) longScript += `## 施工細節\n我們來看師傅怎麼處理：${clean(c.masterExplain)}\n\n`;
  longScript += `## 完工成果\nBefore/After 對比，最大的改善是……\n\n`;
  longScript += `## 結尾\n${bs.coreValues.split('、')[0] || '安心'}，來自每個細節的堅持。我們是安心整合，下次見。`;

  const shortsScripts = [];
  if (clean(c.problem)) {
    shortsScripts.push(`【${n}】${clean(c.problem).slice(0, 18)}？30 秒看懂我們怎麼解。`);
  }
  if (clean(c.highlight)) {
    shortsScripts.push(`【${n}】${clean(c.highlight).slice(0, 18)}，一個細節差很多。`);
  }
  if (shortsScripts.length === 0) shortsScripts.push(`【${n}】案場速覽，60 秒看完改造重點。`);

  return {
    longScript,
    shortsScripts,
    narration: `以${bs.tone.split('、')[0] || '溫暖專業'}語氣，用現場證據說服，不浮誇。`,
    designerInterview: clean(c.designerExplain) ? `請設計師說明：${clean(c.designerExplain)}` : '待設計師準備訪談內容。',
  };
}

export async function generateEditingBrief(
  c: CaseData,
  _assets: unknown[],
  grade: ReturnType<typeof computeGrade>
): Promise<EditingBrief> {
  await delay(200);
  const segments = ['開場片頭（5–10 秒）', '案場診斷段落', '施工過程段落', '完工對比段落', '結尾 CTA'];
  const shortCuts = [];
  if (clean(c.problem)) shortCuts.push(`痛點片段：${clean(c.problem).slice(0, 20)}`);
  if (clean(c.masterExplain)) shortCuts.push(`工法片段：${clean(c.masterExplain).slice(0, 20)}`);
  if (c.beforeAfter === '有') shortCuts.push('Before/After 對比片段');
  if (shortCuts.length === 0) shortCuts.push('空間全景片段');

  return {
    segments,
    subtitleDirection: '白話、好讀，關鍵數字放大。保留師傅與設計師原聲字幕。',
    musicDirection: grade.grade === 'A' ? '敘事感配樂，中低音量，不搶人聲' : '輕快節奏，短影音風格',
    shortCuts,
    materialGaps: !clean(c.mustShoot) ? ['缺少必拍畫面清單，建議補充'] : [],
  };
}

export async function generateSocialCopy(
  c: CaseData,
  bs: BrandSettings
): Promise<SocialCopy> {
  await delay(300);
  const n = c.name || '本案場';
  const problem = clean(c.problem).slice(0, 30) || '老屋問題';
  const forbidMap: Record<string, string> = {
    '最低價': '',
    '保證完美': '',
    '絕對': '',
    '第一名': '',
    '過度浮誇用語': '',
  };

  let fb = `很多人會問：${problem}該怎麼處理？\n\n`;
  fb += `依照我們現場經驗，關鍵不是表面處理，而是先找到根本原因。\n\n`;
  if (clean(c.designerExplain)) fb += `設計師的判斷是：${clean(c.designerExplain)}\n\n`;
  fb += `一句話：事前規劃永遠比事後補救省力。\n`;
  fb += `#安心整合 #舊屋翻新 #裝修知識`;

  return {
    youtubeTitle: `${problem}？現場實拍告訴你解法｜${n}【安心整合】`,
    shortsTitle: `${problem.slice(0, 15)}？30 秒看懂`,
    facebookPost: fb,
    instagramCopy: `${problem}\n\n解決方案看影片 ↗\n\n#安心整合 #裝修知識`,
    hashtags: ['安心整合', '舊屋翻新', '裝修知識', '老屋改造', '室內設計'],
  };
}
