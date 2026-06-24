import type { CaseData, GradeResult, BeforeAfter } from '../types';

export function computeGrade(c: CaseData): GradeResult {
  let score = 0;
  if ((c.problem || '').trim().length > 10) score += 1;
  if ((c.highlight || '').trim().length > 10) score += 1;
  if (c.beforeAfter === '有') score += 2;
  if ((c.mustShoot || '').trim().length > 10) score += 1;
  if ((c.designerExplain || '').trim().length > 10) score += 1;
  if ((c.masterExplain || '').trim().length > 10) score += 1;
  if ((c.ownerStory || '').trim().length > 10) score += 1;

  if (c.shootable === '不建議') {
    return { grade: 'D', label: '暫緩拍攝', desc: '資料不足或不適合公開', color: '#8A7A6A', score };
  }
  if (score >= 7) {
    return { grade: 'A', label: '品牌精選', desc: '適合做完整代表案例', color: '#4A6B2E', score };
  }
  if (score >= 5) {
    return { grade: 'B', label: '完整紀錄', desc: '適合拍完整案例影片', color: '#3B82F6', score };
  }
  if (score >= 3) {
    return { grade: 'C', label: '補充素材', desc: '適合短影音或社群內容', color: '#D97706', score };
  }
  return { grade: 'D', label: '暫緩拍攝', desc: '資料不足或不適合公開', color: '#8A7A6A', score };
}

export function getGradeOutput(grade: string): string {
  const map: Record<string, string> = {
    A: '完整案例影片、多支短影音、品牌案例文章、作品集精選案例',
    B: '完整案例影片、短影音切片、訪談內容、作品集素材',
    C: 'Shorts/Reels、簡短案例影片、社群貼文',
    D: '暫不安排正式拍攝，僅保留案場紀錄或內部參考',
  };
  return map[grade] || '';
}

export function getGradePositioning(grade: string): string {
  const map: Record<string, string> = {
    A: '品牌精選案例',
    B: '完整案例紀錄',
    C: '補充社群素材',
    D: '暫緩拍攝評估',
  };
  return map[grade] || '';
}

export function getJudgmentReasons(c: CaseData): string {
  const reasons: string[] = [];
  if ((c.problem || '').trim()) reasons.push('已提供屋主需求');
  if ((c.highlight || '').trim()) reasons.push('已提供核心亮點');
  if (c.beforeAfter === '有') reasons.push('Before/After 反差明顯');
  if ((c.designerExplain || '').trim()) reasons.push('有設計師專業判斷');
  if ((c.masterExplain || '').trim()) reasons.push('有師傅或工法細節');
  if ((c.ownerStory || '').trim()) reasons.push('有屋主故事');
  if ((c.mustShoot || '').trim()) reasons.push('有明確必拍畫面');
  if (c.beforeAfter === '沒有') reasons.push('缺少 Before/After 反差');
  return reasons.length ? reasons.join('、') + '。' : '尚無足夠資訊進行判斷。';
}

export function getCompletion(c: CaseData): { done: number; total: number; pct: number } {
  const checks = [
    !!(c.problem || '').trim(),
    !!(c.highlight || '').trim(),
    c.beforeAfter === '有' || c.beforeAfter === '沒有',
    !!(c.beforeAfterNote || '').trim(),
    !!(c.mustShoot || '').trim(),
    !!(c.designerExplain || '').trim(),
    !!(c.masterExplain || '').trim(),
    !!(c.ownerStory || '').trim(),
  ];
  const done = checks.filter(Boolean).length;
  return { done, total: 8, pct: Math.round((done / 8) * 100) };
}
