// ===== Enums & Unions =====
export type CaseStage = '接案' | '丈量' | '設計中' | '施工中' | '完工';
export type ShootStatus = '未安排' | '準備中' | '拍攝中' | '已拍攝' | '剪輯中' | '已完成';
export type Shootable = '可' | '需確認' | '不可';
export type BeforeAfter = '有' | '普通' | '沒有';
export type HouseCondition = '新成屋' | '中古屋' | '老屋' | '商空';
export type UserRole = '管理員' | '設計師' | '攝影' | '剪輯' | '外部協作者';
export type GradeLevel = 'A' | 'B' | 'C' | 'D';

// ===== Grade Result =====
export interface GradeResult {
  grade: GradeLevel;
  label: string;
  desc: string;
  color: string;
  score: number;
}

// ===== Project Case =====
export interface CaseData {
  id: string;
  // Basic
  name: string;
  region: string;
  area: string;          // 坪數
  houseCondition: HouseCondition;
  designStyle: string;
  stage: CaseStage;
  shootStatus: ShootStatus;
  shootable: Shootable;
  // People
  designer: string;
  photographer: string;
  editor: string;
  ownerName: string;
  // Meta
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;

  // Planning fields
  problem: string;           // 屋主需求/生活痛點
  highlight: string;         // 核心亮點
  beforeAfter: BeforeAfter;
  beforeAfterNote: string;
  beforeImage: string | null;
  afterImage: string | null;
  mustShoot: string;
  designerExplain: string;
  masterExplain: string;
  ownerStory: string;
  materialColor: string;     // 材質與色彩重點
  specialCraft: string;      // 特殊工法

  // Restrictions
  addrVisible: '可' | '需確認' | '不可';
  ownerVisible: '可' | '需確認' | '不可';
  budgetMention: '可' | '不可';
  floorplanVisible: '可' | '需確認' | '不可';
  brandVisible: '可' | '需確認' | '不可';
  commercialLicense: '可' | '需確認' | '不可';
  brandRestrict: string;
  otherRestrict: string;

  // Designer suggestions
  designerSuggest: string[];

  // AI-generated content
  aiPlanningDraft?: AiPlanningResult | null;
  aiProductionContent?: AiProductionResult | null;

  // Computed
  grade?: GradeResult | null;
}

// ===== Asset =====
export type AssetType = 'Before' | '施工中' | '完工' | '設計圖' | '參考圖' | '訪談素材' | '可剪Shorts片段';

export interface Asset {
  id: string;
  caseId: string;
  type: AssetType;
  name: string;
  previewUrl: string | null;
  uploadDate: string;
  tags: string[];
  used: boolean;
  note: string;
}

// ===== Brand Settings =====
export interface BrandSettings {
  coreValues: string;
  tone: string;
  commonPhrases: string;
  forbiddenWords: string;
  titleStyle: string;
  scriptTone: string;
  socialCopyTone: string;
}

// ===== Planning Draft =====
export interface PlanningDraft {
  mainLine: string;
  storyline: string[];
  shotList: string[];
  interviewQuestions: string[];
  shortsTopics: string[];
  editDirection: string;
}

// ===== Script =====
export interface ScriptDraft {
  longScript: string;
  shortsScripts: string[];
  narration: string;
  designerInterview: string;
}

// ===== Editing Brief =====
export interface EditingBrief {
  segments: string[];
  subtitleDirection: string;
  musicDirection: string;
  shortCuts: string[];
  materialGaps: string[];
}

// ===== AI Status =====
export type AiStatus = 'idle' | 'loading' | 'success' | 'error';

// ===== AI Runtime Config =====
export type AiProvider = 'mock' | 'deepseek' | 'openai';

export interface AiRuntimeConfig {
  enabled: boolean;
  provider: AiProvider;
  baseUrl: string;
  model: string;
  apiKey?: string;
  useBackendProxy: boolean;
}

// ===== AI Planning Result =====
export interface AiPlanningResult {
  videoMainline: string;
  storyline: string[];
  sceneSuggestions: string[];
  interviewQuestions: string[];
  shortsIdeas: string[];
  privacyReminders: string[];
  editingDirection: string;
  lastGeneratedAt: string;
}

// ===== AI Production Result =====
export interface AiProductionResult {
  shootingChecklist: string[];
  longformScript: string;
  shortsScripts: string[];
  editingBrief: {
    openingStyle: string;
    segmentOrder: string[];
    subtitleDirection: string;
    musicDirection: string;
    shortsCutPoints: string[];
    missingAssets: string[];
  };
  socialCopy: {
    youtubeTitle: string;
    shortsTitle: string;
    facebookPost: string;
    instagramCaption: string;
    hashtags: string[];
  };
  interviewQuestions: string[];
  lastGeneratedAt: string;
}

// ===== Sanitized case data for AI =====
export interface SanitizedCaseForAI {
  name: string;
  houseCondition: string;
  designStyle: string;
  stage: string;
  area: string;
  problem: string;
  highlight: string;
  beforeAfter: string;
  beforeAfterNote: string;
  mustShoot: string;
  designerExplain: string;
  masterExplain: string;
  ownerStory: string;
  materialColor: string;
  specialCraft: string;
}
export interface SocialCopy {
  youtubeTitle: string;
  shortsTitle: string;
  facebookPost: string;
  instagramCopy?: string;
  instagramCaption?: string;
  hashtags: string[];
}

// ===== App State =====
export interface AppState {
  cases: CaseData[];
  assets: Asset[];
  brandSettings: BrandSettings;
  editingId: string | null;
}
