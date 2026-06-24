import type { AiRuntimeConfig } from '../types';

export const DEFAULT_AI_CONFIG: AiRuntimeConfig = {
  enabled: false,
  provider: 'mock',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-v4-pro',
  apiKey: '',
  useBackendProxy: false,
};

let cachedConfig: AiRuntimeConfig = { ...DEFAULT_AI_CONFIG };

export function getAiRuntimeConfig(): AiRuntimeConfig {
  return cachedConfig;
}

export function saveAiRuntimeConfig(config: AiRuntimeConfig): void {
  cachedConfig = { ...DEFAULT_AI_CONFIG, ...config };
}
