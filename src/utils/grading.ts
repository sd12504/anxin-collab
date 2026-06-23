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

  if (c.shootable === '不可') {
    return { grade: 'D', label: '基礎版', desc: '重點空間紀錄', color: '#8A7A6A', score };
  }
  if (score >= 7) {
    return { grade: 'A', label: '旗艦版', desc: '品牌代表案例', color: '#4A6B2E', score };
  }
  if (score >= 5) {
    return { grade: 'B', label: '專業版', desc: '故事敘事＋設計細節', color: '#6B7F4A', score };
  }
  if (score >= 3) {
    return { grade: 'C', label: '進階版', desc: '完整空間＋設計亮點', color: '#8A7020', score };
  }
  return { grade: 'D', label: '基礎版', desc: '重點空間紀錄', color: '#8A7A6A', score };
}

export function getGradeOutput(grade: string): string {
  const map: Record<string, string> = {
    A: '長片、多支短影音、品牌案例文章、作品集主打案例',
    B: '完整案例影片、短影音切片、訪談內容、作品集素材',
    C: 'Shorts/Reels、簡短案例影片、社群貼文',
    D: '案場紀錄、簡短社群素材、內部留存',
  };
  return map[grade] || '';
}

export function getGradePositioning(grade: string): string {
  const map: Record<string, string> = {
    A: '品牌代表案例',
    B: '故事敘事＋設計細節',
    C: '完整空間＋設計亮點',
    D: '重點空間紀錄',
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
