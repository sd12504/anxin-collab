import type { AppState, BrandSettings } from '../types';
import { createDemoCases } from './mockData';

const STORAGE_KEY = 'anxin_collab_v4';

export const defaultBrandSettings: BrandSettings = {
  coreValues: '安心、專業、真誠、透明',
  tone: '溫暖專業、貼近生活、重視細節、解決問題',
  commonPhrases: '事前規劃比事後補救省力。裝修的細節，決定未來的生活品質。',
  forbiddenWords: '最低價、保證完美、絕對、第一名、過度浮誇用語',
  titleStyle: '問題＋原因＋解法，用現場證據說話',
  scriptTone: '平穩、白話、篤定、真誠',
  socialCopyTone: '把專業講成朋友聽得懂的語言',
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Use saved cases if they exist and are non-empty
      if (parsed.cases?.length > 0 && parsed.brandSettings) return parsed;
    }
  } catch { /* ignore */ }
  return { cases: createDemoCases(), assets: [], brandSettings: { ...defaultBrandSettings }, editingId: null };
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
