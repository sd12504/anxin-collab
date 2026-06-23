import type { AiRuntimeConfig } from '../types';

const STORAGE_KEY = 'anxin_ai_config';

export const DEFAULT_AI_CONFIG: AiRuntimeConfig = {
  enabled: false,
  provider: 'mock',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-v4-pro',
  apiKey: '',
  useBackendProxy: false,
};

export function getAiRuntimeConfig(): AiRuntimeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_AI_CONFIG, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_AI_CONFIG };
}

export function saveAiRuntimeConfig(config: AiRuntimeConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
