import type { CaseData, PlanningDraft, ScriptDraft, EditingBrief, SocialCopy, AiPlanningResult, AiProductionResult } from '../types';
import { computeGrade, getGradeOutput, getGradePositioning, getJudgmentReasons, getCompletion } from './grading';

// ===== Helpers =====
function esc(s: string | null | undefined): string {
  return (s || '').replace(/[\\`*_{}[\]()#+\-.!|]/g, '\\$&');
}
function v(s: string | null | undefined): string {
  const t = (s || '').trim();
  return t || '（尚無資料）';
}
function safeArr(arr: unknown): string[] {
  return Array.isArray(arr) ? arr as string[] : [];
}
function bullet(items: string[], prefix = '- '): string {
  return items.length ? items.map(s => `${prefix}${s.trim()}`).join('\n') : '（尚無資料）';
}
function numbered(items: string[]): string {
  return items.length ? items.map((s, i) => `${i + 1}. ${s.trim()}`).join('\n') : '（尚無資料）';
}
function nl(): string { return '\n\n'; }

// ===== AI-driven fallback generators =====
function fallbackStoryline(c: CaseData): string[] {
  const grade = computeGrade(c);
  if (grade.grade === 'A') return [
    `開場鉤子（0:00–0:30）：以「${v(c.problem).slice(0, 25)}」為核心提問`,
    `案場診斷（0:30–2:00）：說明${c.houseCondition}的限制與風險`,
    `方案規劃（2:00–4:00）：${v(c.designerExplain).slice(0, 30)}`,
    `施工過程（4:00–8:00）：${v(c.masterExplain).slice(0, 30)}`,
    '完工對比（8:00–10:00）：Before/After 同角度對比',
    '屋主回訪（10:00–11:30）：入住體驗',
    '結尾（11:30–12:00）：CTA 引導留言或私訊',
  ];
  if (grade.grade === 'B') return [
    `開場：從屋主需求切入「${v(c.problem || c.ownerStory).slice(0, 25)}」`,
    `Before 呈現：${c.houseCondition}的痛點與限制`,
    `設計師判斷：${v(c.designerExplain).slice(0, 30)}`,
    `施工亮點：${v(c.masterExplain).slice(0, 30)}`,
    'After 對比：同角度 Before/After',
    '訪談片段：屋主或設計師訪談',
  ];
  return [
    `重點畫面：${v(c.mustShoot).slice(0, 40)}`,
    '以案場紀錄形式拍攝關鍵施工節點',
    '素材歸檔內部留存',
  ];
}

function fallbackInterviewQs(c: CaseData): { designer: string[]; contractor: string[]; owner: string[] } {
  const all = [
    '這個案場最麻煩的地方是哪裡？',
    '當初是怎麼發現這些問題的？',
    '這個步驟如果沒做，未來會發生什麼問題？',
    '一般人最容易誤會的是什麼？',
  ];
  return {
    designer: [v(c.designerExplain).slice(0, 40) || '請說明設計取捨與解決方案', '這個空間最大的挑戰是什麼？', '為什麼不採用另一種常見做法？'],
    contractor: [v(c.masterExplain).slice(0, 40) || '請說明關鍵工法', '這個步驟最容易出錯的環節是？', '完工後屋主該注意哪些保養？'],
    owner: ['裝修前最困擾你的是什麼？', '入住到現在最大的差別是什麼？', '如果有朋友要裝修，你會提醒他注意什麼？'],
  };
}

function fallbackShortsTopics(c: CaseData): string[] {
  const topics: string[] = [];
  if (c.problem) topics.push(`痛點：${c.problem.slice(0, 20)}`);
  if (c.highlight) topics.push(`亮點：${c.highlight.slice(0, 20)}`);
  if (c.masterExplain) topics.push(`工法：${c.masterExplain.slice(0, 20)}`);
  if (c.beforeAfter === '有') topics.push('Before/After 對比');
  if (topics.length === 0) topics.push('案場速覽 60 秒', '設計亮點介紹', '施工細節特寫');
  while (topics.length < 5) topics.push('（可根據更多案場資訊擴充）');
  return topics.slice(0, 5);
}

function fallbackSceneSuggestions(c: CaseData): string[] {
  const scenes: string[] = ['案場外觀與環境交代'];
  if (c.mustShoot) c.mustShoot.split(/[，,、\n]/).filter(Boolean).slice(0, 4).forEach(s => scenes.push(s.trim()));
  scenes.push('問題區域特寫（Before 狀態）', '師傅手部特寫：量測、切割、安裝');
  if (c.beforeAfter === '有') scenes.push('同角度 Before/After 對比');
  scenes.push('完工空間全景 walkthrough');
  return scenes;
}

function fallbackShotCategories(c: CaseData) {
  return {
    mustShoot: (c.mustShoot || '案場全貌、問題區域、施工關鍵節點、完工對比').split(/[，,、\n]/).filter(Boolean).map(s => s.trim()),
    people: [c.designerExplain ? `設計師說明：${c.designerExplain.slice(0, 30)}` : null, c.masterExplain ? `師傅講解：${c.masterExplain.slice(0, 30)}` : null, c.ownerStory ? `屋主訪談：${c.ownerStory.slice(0, 30)}` : null].filter(Boolean) as string[],
    spaces: ['客廳全景', '廚房動線', '主要問題空間', '完工 walkthrough'],
    details: [c.materialColor ? `材質：${c.materialColor}` : null, c.specialCraft ? `工法：${c.specialCraft}` : null, '開關、收納、五金細節'].filter(Boolean) as string[],
    beforeAfter: c.beforeAfter === '有' ? ['Before 問題點', 'After 改善點', '同角度對比'] : ['（Before/After 資料不足，建議補充）'],
    construction: [c.masterExplain ? c.masterExplain : null, '防水/管線/結構關鍵節點', '師傅實作手部特寫'].filter(Boolean) as string[],
    gaps: !c.mustShoot ? ['尚未填寫必拍畫面，建議至協作板補充'] : [],
  };
}

// ===== 1. Planning Markdown =====
export function generatePlanningMarkdown(c: CaseData, draft?: AiPlanningResult | PlanningDraft | null): string {
  const grade = computeGrade(c);
  const reasons = getJudgmentReasons(c);
  const positioning = getGradePositioning(grade.grade);
  const output = getGradeOutput(grade.grade);
  const completion = getCompletion(c);

  const storyline = safeArr(draft?.storyline).length ? safeArr(draft?.storyline) : fallbackStoryline(c);
  const scenes = safeArr((draft as AiPlanningResult)?.sceneSuggestions).length
    ? safeArr((draft as AiPlanningResult).sceneSuggestions) : fallbackSceneSuggestions(c);
  const interviewQs = safeArr(draft?.interviewQuestions);
  const shortsIdeas = safeArr((draft as AiPlanningResult)?.shortsIdeas).length
    ? safeArr((draft as AiPlanningResult).shortsIdeas)
    : safeArr((draft as PlanningDraft)?.shortsTopics).length
      ? safeArr((draft as PlanningDraft).shortsTopics) : fallbackShortsTopics(c);
  const editDir = (draft as AiPlanningResult)?.editingDirection || (draft as PlanningDraft)?.editDirection
    || '保留現場感，不過度包裝。使用溫暖專業語氣字幕。';
  const privacyReminders = safeArr((draft as AiPlanningResult)?.privacyReminders);

  const missing: string[] = [];
  if (!c.problem) missing.push('屋主需求／生活痛點尚未填寫');
  if (!c.highlight) missing.push('核心亮點尚未填寫');
  if (!c.mustShoot) missing.push('必拍畫面尚未填寫');
  if (completion.done < 4) missing.push(`設計師引導問題僅完成 ${completion.done}/${completion.total}`);

  // Split interview Qs by role
  const di = interviewQs.length ? interviewQs.filter((_, i) => i % 3 === 0) : ['請說明設計取捨與解決方案'];
  const ci = interviewQs.length ? interviewQs.filter((_, i) => i % 3 === 1) : ['這個步驟最容易出錯的環節是？'];
  const oi = interviewQs.length ? interviewQs.filter((_, i) => i % 3 === 2) : ['裝修前最困擾你的是什麼？'];

  return `# 案件影片企劃書

## 案件基本資料

| 欄位 | 內容 |
|------|------|
| 案件名稱 | ${v(c.name)} |
| 設計師 | ${v(c.designer)} |
| 攝影 | ${v(c.photographer)} |
| 剪輯 | ${v(c.editor)} |
| 地區 | ${v(c.region)} |
| 坪數 | ${v(c.area)} |
| 屋況 | ${c.houseCondition} |
| 風格 | ${v(c.designStyle)} |
| 案件階段 | ${c.stage} |
| 拍攝狀態 | ${c.shootStatus} |
| 更新日期 | ${new Date(c.updatedAt).toLocaleDateString('zh-TW')} |
| 資料完整度 | ${completion.done} / ${completion.total}（${completion.pct}%） |

## 拍攝等級與判斷原因

- 建議等級：**${grade.grade} ${grade.label}**
- 定位：${positioning}
- 判斷原因：${reasons}
- 適合輸出：${output}

## 影片主線

${v(c.highlight)}

## 故事線

${numbered(storyline)}

## 必拍畫面

${bullet(c.mustShoot ? c.mustShoot.split(/[，,、\\n]/).filter(Boolean).map(s => s.trim()) : ['案場全貌', '問題區域特寫', '施工關鍵節點'], '- ')}

## 場景建議

${numbered(scenes)}

## 設計師訪談問題

${numbered(di)}

## 師傅訪談問題

${numbered(ci)}

## 屋主訪談問題

${numbered(oi)}

## Shorts 題目

${numbered(shortsIdeas)}

## 拍攝限制

- 地址可否入鏡：${c.addrVisible}
- 屋主可否入鏡：${c.ownerVisible}
- 預算可否提及：${c.budgetMention}
- 平面圖可否露出：${c.floorplanVisible}
- 品牌或廠商名稱可否露出：${c.brandVisible}
- 商業用途授權：${c.commercialLicense}
- 品牌或廠商限制：${v(c.brandRestrict)}
- 其他隱私限制：${v(c.otherRestrict)}
${privacyReminders.length ? privacyReminders.map(p => `- ${p}`).join('\n') : ''}

## 剪輯方向

${editDir}

${missing.length ? `## 缺少資料提醒\n\n${bullet(missing)}\n` : ''}---
> 安心整合設計協作板 · ${new Date().toLocaleString('zh-TW')}
`;
}

// ===== 2. Production Pack Markdown =====
export function generateProductionPackMarkdown(
  c: CaseData,
  _planning?: PlanningDraft | null,
  script?: ScriptDraft | null,
  editing?: EditingBrief | null,
  aiContent?: AiProductionResult | null
): string {
  const grade = computeGrade(c);
  const sc = aiContent;
  const eb = sc?.editingBrief;

  // Shot categories
  const shotCat = fallbackShotCategories(c);

  // Script
  const longScript = sc?.longformScript || script?.longScript || `# ${v(c.name)} 長片腳本\n\n## 開場\n大家好，我是陳大。今天帶大家來看${v(c.problem).slice(0, 30)}。\n\n## 案場診斷\n這個案場最主要的問題是${v(c.problem)}。\n\n${c.designerExplain ? `## 設計方案\n${c.designerExplain}\n\n` : ''}${c.masterExplain ? `## 施工細節\n${c.masterExplain}\n\n` : ''}## 完工成果\nBefore/After 對比。\n\n## 結尾\n安心，來自每個細節的堅持。我們是安心整合，下次見。`;

  const shortsScripts = sc?.shortsScripts?.length ? sc.shortsScripts : script?.shortsScripts?.length ? script.shortsScripts : fallbackShortsTopics(c);

  // Social
  const social = sc?.socialCopy;

  return `# 製片包

## 案件

${v(c.name)} ｜ ${grade.grade} ${grade.label} ｜ ${c.stage}

## 拍攝總覽

- 案件階段：${c.stage}
- 拍攝狀態：${c.shootStatus}
- 拍攝等級：${grade.grade} ${grade.label}
- 定位：${getGradePositioning(grade.grade)}
- 適合輸出：${getGradeOutput(grade.grade)}

## 必拍清單

${numbered(shotCat.mustShoot)}

## 加分畫面

${numbered(['設計師說明設計圖', '屋主使用情境', '師傅講解關鍵工法', '材質細節特寫'])}

## 補拍畫面

${bullet(!c.beforeImage ? ['Before 照片（尚未上傳）'] : [], '- ') || '暫無補拍需求'}${!c.mustShoot ? '\n- 建議至協作板補充必拍畫面' : ''}

## 長片腳本

${longScript}

## Shorts 腳本

${shortsScripts.map((s, i) => `### Short ${i + 1}\n${s}`).join('\n\n')}

## 剪輯段落順序

${numbered(eb?.segmentOrder?.length ? eb.segmentOrder : ['開場', '案場診斷', '方案說明', '施工過程', '完工對比', '人物訪談', '結尾 CTA'])}

## 字幕方向

${eb?.subtitleDirection || '白話易讀，關鍵數字放大。保留設計師與師傅原聲字幕。'}

## 音樂方向

${eb?.musicDirection || '中低音量敘事感配樂，不搶人聲。短影音版使用輕快節奏。'}

## 可切 Shorts 片段

${bullet(eb?.shortsCutPoints?.length ? eb.shortsCutPoints : ['痛點片段', '工法片段', 'Before/After 對比'], '- ')}

## 社群文案

${social ? `- YouTube 標題：${social.youtubeTitle}\n- Shorts 標題：${social.shortsTitle}\n- Facebook：${social.facebookPost.replace(/\n/g, '\\n')}\n- Instagram：${social.instagramCaption || ''}\n- Hashtag：${(social.hashtags || []).map(h => '#' + h).join(' ')}` : '（請至製片工具點擊「更新製片內容」）'}

## 當天拍攝注意事項

- 確認拍攝授權：地址 ${c.addrVisible}入鏡、屋主 ${c.ownerVisible}入鏡
- 商業用途授權：${c.commercialLicense}
- 主要聯絡人：${v(c.designer)}
- 必備器材：手機（直式＋橫式）、腳架、補光燈、收音設備
- 每個重點至少拍 3 種鏡位：遠景交代空間、中景交代動作、近景交代細節

---
> 安心整合設計協作板 · ${new Date().toLocaleString('zh-TW')}
`;
}

// ===== 3. Shot List Markdown =====
export function generateShotListMarkdown(c: CaseData): string {
  const cat = fallbackShotCategories(c);
  const gaps = cat.gaps.length ? cat.gaps : ['目前無明顯素材缺口'];

  return `# 拍攝清單

## ${v(c.name)}

### 必拍
${numbered(cat.mustShoot)}

### 人物訪談
${numbered(cat.people)}

### 空間全景
${numbered(cat.spaces)}

### 細節特寫
${numbered(cat.details)}

### Before / After
${numbered(cat.beforeAfter)}

### 施工或工法
${numbered(cat.construction)}

### 素材缺口
${bullet(gaps)}

---
> 安心整合設計協作板 · ${new Date().toLocaleString('zh-TW')}
`;
}

// ===== 4. Editing Brief Markdown =====
export function generateEditingBriefMarkdown(c: CaseData, editing?: EditingBrief | null, aiContent?: AiProductionResult | null): string {
  const grade = computeGrade(c);
  const eb = (aiContent?.editingBrief || editing || {}) as Record<string, unknown>;
  const oldEdit = editing as EditingBrief | null;

  const segments: string[] = (Array.isArray(eb.segmentOrder) ? eb.segmentOrder : oldEdit?.segments) || ['開場片頭', '案場診斷', '施工過程', '完工對比', '結尾 CTA'];
  const shortCuts: string[] = (Array.isArray(eb.shortsCutPoints) ? eb.shortsCutPoints : oldEdit?.shortCuts) || ['痛點片段', '工法片段', 'Before/After 對比'];
  const gaps: string[] = (Array.isArray(eb.missingAssets) ? eb.missingAssets : oldEdit?.materialGaps) || (!c.mustShoot ? ['缺少必拍畫面，建議至協作板補充'] : ['無明顯素材缺口']);
  const opening = (typeof eb.openingStyle === 'string' ? eb.openingStyle : '') || (c.beforeAfter === '有' ? 'Before/After 快速切換開場，5 秒內建立好奇' : '空間全景淡入開場，搭配案場環境音');
  const subtitle = (typeof eb.subtitleDirection === 'string' ? eb.subtitleDirection : oldEdit?.subtitleDirection) || '白話易讀，關鍵數字放大呈現（至少 150%）。保留設計師與師傅原聲字幕。每行不超過 18 字。';
  const music = (typeof eb.musicDirection === 'string' ? eb.musicDirection : oldEdit?.musicDirection) || '長片使用中低音量敘事感配樂，不搶人聲。短影音使用輕快節奏，秒數內建立氛圍。';

  return `# 剪輯工作單

## ${v(c.name)} ｜ ${grade.grade} ${grade.label}

### 開場方式
${opening}

### 段落順序
${numbered(segments)}

### 情緒節奏
- 開場：快速建立痛點或好奇（高能量）
- 診斷：沉穩說明，讓觀眾理解問題嚴重性
- 施工：緊湊剪輯，保留現場音
- 完工：節奏放緩，讓觀眾感受空間改善
- 結尾：溫暖收束，留下記憶點

### 字幕規則
${subtitle}

### 音樂方向
${music}

### Shorts 切點
${bullet(shortCuts, '- ')}

### 缺少素材
${bullet(gaps, '- ')}

### 禁用內容
- 不使用浮誇字幕特效（旋轉、閃爍、3D 文字）
- 不過度使用轉場特效（以 cut / dissolve 為主）
- 不使用罐頭笑聲或過度戲劇化音效
- 不使用安心整合禁用詞：最低價、保證完美、絕對、第一名、過度浮誇用語
- 不露出未經授權的品牌或廠商名稱

---
> 安心整合設計協作板 · ${new Date().toLocaleString('zh-TW')}
`;
}

// ===== 5. Social Copy Markdown =====
export function generateSocialCopyMarkdown(c: CaseData, copy?: SocialCopy | null): string {
  const social = copy;
  const problem = v(c.problem).slice(0, 30);
  const fallbackFB = `很多人會問：${problem}該怎麼處理？\n\n依照我們現場經驗，關鍵不是表面處理，而是先找到根本原因。\n\n${c.designerExplain ? `設計師的判斷是：${v(c.designerExplain)}\n\n` : ''}一句話：事前規劃永遠比事後補救省力。\n\n#安心整合 #舊屋翻新 #裝修知識`;

  return `# 社群文案

## ${v(c.name)}

### YouTube 標題
${social?.youtubeTitle || `${problem}？現場實拍告訴你解法｜${v(c.name)}【安心整合】`}

### Shorts 標題
${social?.shortsTitle || `${problem.slice(0, 15)}？30 秒看懂`}

### Facebook 貼文
${social?.facebookPost || fallbackFB}

### Instagram 文案
${social?.instagramCaption || social?.instagramCopy || `${problem}\n\n解決方案看影片 ↗\n\n#安心整合 #裝修知識`}

### Hashtag
${(social?.hashtags?.length ? social.hashtags : ['安心整合', '舊屋翻新', '裝修知識', '老屋改造', '室內設計']).map(h => '#' + h).join(' ')}

---
> 安心整合設計協作板 · ${new Date().toLocaleString('zh-TW')}
`;
}
