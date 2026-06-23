import { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { computeGrade, getJudgmentReasons, getGradePositioning, getGradeOutput, getCompletion } from '../utils/grading';
import { generatePlanningDraft, isValidPlanningDraft } from '../services/aiService';
import { generatePlanningMarkdown } from '../utils/markdown';
import type { CaseData, AiPlanningResult, AiStatus } from '../types';
import { Combobox } from '../components/ui/Combobox';

export default function CollabBoard() {
  const { cases, editingId, setEditingId, updateCase, brandSettings } = useStore();
  const current = editingId ? cases.find(c => c.id === editingId) : null;
  const [draft, setDraft] = useState<AiPlanningResult | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatus>('idle');
  const [mobileTab, setMobileTab] = useState<'cases' | 'form' | 'preview'>('form');

  // Auto-select first case on mount only
  useEffect(() => {
    if (!editingId && cases.length > 0) {
      setEditingId(cases[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-generate preview draft when current case changes
  useEffect(() => {
    if (current) {
      if (isValidPlanningDraft(current.aiPlanningDraft)) {
        setDraft(current.aiPlanningDraft);
        setAiStatus('success');
      } else {
        setDraft(null);
        setAiStatus('idle');
        // Auto-trigger first generation
        generatePlanningDraft(current, brandSettings).then(result => {
          setDraft(result);
          setAiStatus('success');
          updateCase(current.id, { aiPlanningDraft: result });
        }).catch(() => setAiStatus('error'));
      }
    }
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-7 text-center text-gray-400">
        尚無案件，請先至「案例管理」新增。
      </div>
    );
  }

  const grade = computeGrade(current);
  const completion = getCompletion(current);
  const reasons = getJudgmentReasons(current);
  const positioning = getGradePositioning(grade.grade);
  const output = getGradeOutput(grade.grade);

  const update = (patch: Partial<CaseData>) => updateCase(current.id, patch);

  const handleGenerate = async () => {
    setAiStatus('loading');
    try {
      const result = await generatePlanningDraft(current, brandSettings);
      if (!isValidPlanningDraft(result)) throw new Error('AI 回傳資料不完整');
      setDraft(result);
      setAiStatus('success');
      updateCase(current.id, { aiPlanningDraft: result });
    } catch {
      setAiStatus('error');
    }
  };

  const btnLabel = aiStatus === 'loading' ? '整理中...' : aiStatus === 'error' ? '更新失敗，請重試' : '更新企劃草稿';

  const handleDownloadMarkdown = () => {
    const md = generatePlanningMarkdown(current, draft || undefined);
    downloadFile(md, `${(current.name || '案場').replace(/[\\/:*?"<>|]/g, '_')}_企劃書_${new Date().toISOString().slice(0, 10)}.md`);
  };

  // ===== Shared UI pieces =====
  const CaseListItem = ({ c }: { c: CaseData }) => {
    const g = computeGrade(c);
    const sel = c.id === editingId;
    return (
      <button
        className={`w-full text-left p-3 rounded mb-2 transition-colors border ${
          sel ? 'border-olive-400 bg-olive-50' : 'border-warm-200 hover:border-olive-300 bg-white'
        }`}
        onClick={() => { setEditingId(c.id); setMobileTab('form'); }}
        aria-current={sel ? 'true' : undefined}
      >
        <div className="font-semibold text-xs">{c.name || '未命名'}</div>
        <div className="text-xs text-gray-400">{c.designer} · {c.stage}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
            g.grade === 'A' || g.grade === 'B' ? 'bg-olive-500' : g.grade === 'C' ? 'bg-amber-500' : 'bg-stone-400'
          }`} />
          <span className="text-xs text-gray-400">{g.grade} {g.label}</span>
        </div>
      </button>
    );
  };

  const FormContent = () => (
    <>
      {/* Case header */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h3 className="font-serif text-sm">{current.name || '未命名案場'}</h3>
        <span className="text-xs text-gray-400">{current.designer} · {current.stage}</span>
      </div>

      {/* Progress */}
      <div className="section-title">
        案場重點
        <span className="font-normal text-xs text-gray-400 ml-2">已完成 {completion.done} / {completion.total}</span>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-1.5 bg-warm-200 rounded-full overflow-hidden">
          <div className="h-full bg-olive-500 rounded-full transition-all duration-300" style={{ width: `${completion.pct}%` }} />
        </div>
        <span className="text-xs text-gray-400">{completion.pct}%</span>
      </div>

      {/* Questions */}
      <FormField id="fld-problem" label="1. 屋主原本遇到什麼問題？" value={current.problem} onChange={v => update({ problem: v })} />
      <FormField id="fld-highlight" label="2. 這個案子最值得被看到的是什麼？" value={current.highlight} onChange={v => update({ highlight: v })} />

      {/* Before/After */}
      <fieldset className="mb-3 border-0 p-0">
        <legend className="label">3. 有沒有明顯 Before／After 反差？</legend>
        <Combobox items={['有', '普通', '沒有'] as const} value={current.beforeAfter} onChange={v => update({ beforeAfter: v as '有' | '普通' | '沒有' })} />
        <textarea className="input mt-1" rows={2} value={current.beforeAfterNote} onChange={e => update({ beforeAfterNote: e.target.value })} placeholder="說明反差細節" aria-label="反差說明" />
      </fieldset>

      {/* Image upload */}
      <div className="mb-3">
        <span className="label" id="img-upload-label">Before / After 圖片上傳</span>
        <div className="flex flex-col sm:flex-row gap-3" role="group" aria-labelledby="img-upload-label">
          <ImageUploadBox label="Before" image={current.beforeImage} onChange={v => update({ beforeImage: v })} />
          <ImageUploadBox label="After" image={current.afterImage} onChange={v => update({ afterImage: v })} />
        </div>
      </div>

      <FormField id="fld-mustShoot" label="4. 哪些地方一定要在施工前或施工中拍？" value={current.mustShoot} onChange={v => update({ mustShoot: v })} />
      <FormField id="fld-designerExplain" label="5. 有沒有適合設計師解釋的專業判斷？" value={current.designerExplain} onChange={v => update({ designerExplain: v })} />
      <FormField id="fld-masterExplain" label="6. 有沒有適合師傅講解或實作的地方？" value={current.masterExplain} onChange={v => update({ masterExplain: v })} />
      <FormField id="fld-ownerStory" label="7. 有沒有屋主故事或使用痛點？" value={current.ownerStory} onChange={v => update({ ownerStory: v })} />

      {/* Restrictions */}
      <div className="section-title mt-5">拍攝限制</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        <SelectField label="地址入鏡" value={current.addrVisible} opts={['可', '需確認', '不可']} onChange={v => update({ addrVisible: v as '可' | '需確認' | '不可' })} />
        <SelectField label="屋主入鏡" value={current.ownerVisible} opts={['可', '需確認', '不可']} onChange={v => update({ ownerVisible: v as '可' | '需確認' | '不可' })} />
        <SelectField label="預算提及" value={current.budgetMention} opts={['可', '不可']} onChange={v => update({ budgetMention: v as '可' | '不可' })} />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <SelectField label="平面圖露出" value={current.floorplanVisible} opts={['可', '需確認', '不可']} onChange={v => update({ floorplanVisible: v as '可' | '需確認' | '不可' })} />
        <SelectField label="品牌/廠商露出" value={current.brandVisible} opts={['可', '需確認', '不可']} onChange={v => update({ brandVisible: v as '可' | '需確認' | '不可' })} />
      </div>
      <div className="mb-3">
        <label className="label" htmlFor="fld-brandRestrict">品牌或廠商限制</label>
        <input id="fld-brandRestrict" className="input" value={current.brandRestrict} onChange={e => update({ brandRestrict: e.target.value })} />
      </div>
      <div className="mb-3">
        <label className="label" htmlFor="fld-otherRestrict">其他隱私限制</label>
        <input id="fld-otherRestrict" className="input" value={current.otherRestrict} onChange={e => update({ otherRestrict: e.target.value })} />
      </div>
    </>
  );

  const PreviewContent = () => {
    const storyline = Array.isArray(draft?.storyline) ? draft.storyline : [];
    const sceneSuggestions = Array.isArray(draft?.sceneSuggestions) ? draft.sceneSuggestions : [];
    const interviewQuestions = Array.isArray(draft?.interviewQuestions) ? draft.interviewQuestions : [];
    const privacyReminders = Array.isArray(draft?.privacyReminders) ? draft.privacyReminders : [];
    const shortsIdeas = Array.isArray(draft?.shortsIdeas) ? draft.shortsIdeas : [];

    return (
    <>
      <GradePreview grade={grade} positioning={positioning} reasons={reasons} output={output} />
      {draft ? (
        <>
          <PreviewBlock title="故事線">
            <ol className="text-sm space-y-1 pl-4 list-decimal">
              {storyline.map((l, i) => <li key={i}>{l}</li>)}
            </ol>
          </PreviewBlock>
          <PreviewBlock title="場景建議">
            <ul className="text-sm space-y-1">
              {sceneSuggestions.map((s, i) => <li key={i} className="before:content-['—_'] before:text-olive-400">{s}</li>)}
            </ul>
          </PreviewBlock>
          <PreviewBlock title="訪談問題">
            <ol className="text-sm space-y-1 pl-4 list-decimal">
              {interviewQuestions.map((q, i) => <li key={i}>{q}</li>)}
            </ol>
          </PreviewBlock>
          <PreviewBlock title="隱私確認">
            <ul className="text-sm space-y-1.5">
              {privacyReminders.map((p, i) => <li key={i} className="before:content-['✓_'] before:text-olive-500">{p}</li>)}
            </ul>
          </PreviewBlock>
          <PreviewBlock title="Shorts 題目">
            <ul className="text-sm space-y-1">
              {shortsIdeas.map((s, i) => <li key={i} className="before:content-['—_'] before:text-olive-400">{s}</li>)}
            </ul>
          </PreviewBlock>
        </>
      ) : (
        <div className="text-center text-gray-400 text-sm italic mt-8">載入中...</div>
      )}
    </>
  );
  };

  const ActionButtons = ({ inBar }: { inBar?: boolean }) => (
    <div className={`flex gap-3 ${inBar ? 'flex-1 justify-end' : 'mt-4'}`}>
      <button className="btn btn-primary flex-1 sm:flex-none" onClick={handleGenerate} disabled={aiStatus === 'loading'} aria-busy={aiStatus === 'loading'}>
        {btnLabel}
      </button>
      <button className="btn flex-1 sm:flex-none" onClick={handleDownloadMarkdown}>下載企劃書</button>
    </div>
  );

  // ===== DESKTOP LAYOUT (lg+) =====
  return (
    <>
      {/* Desktop / Tablet: 3-column grid, collapses to 2 on tablet, 1 on mobile */}
      <div className="hidden lg:grid lg:grid-cols-[260px_1fr_400px] h-screen">
        {/* Left: Case List */}
        <div className="bg-beige-50 border-r border-warm-200 overflow-y-auto p-5">
          <div className="font-semibold text-sm mb-3 pb-2 border-b-2 border-olive-100 flex justify-between">
            案件總覽
            <span className="text-xs text-gray-400 font-normal">{cases.length} 件</span>
          </div>
          {cases.map(c => <CaseListItem key={c.id} c={c} />)}
        </div>

        {/* Center: Form */}
        <div className="bg-beige-50 border-r border-warm-200 overflow-y-auto p-6">
          <FormContent />
          <ActionButtons />
        </div>

        {/* Right: Preview */}
        <div className="bg-beige-50 overflow-y-auto p-6">
          <div className="font-semibold text-sm mb-3 pb-2 border-b-2 border-olive-100">影像企劃預覽</div>
          <PreviewContent />
          {draft && (
            <button className="btn btn-primary w-full mt-2" onClick={handleDownloadMarkdown}>下載 Markdown 企劃書</button>
          )}
        </div>
      </div>

      {/* ===== MOBILE / TABLET LAYOUT (<lg) ===== */}
      <div className="lg:hidden flex flex-col min-h-screen">
        {/* Segmented tab control */}
        <div className="sticky top-0 z-30 bg-beige-50 border-b border-warm-200 px-3 py-2">
          <div className="flex bg-warm-100 rounded-lg p-0.5">
            {([
              { key: 'cases' as const, label: '案件', count: cases.length },
              { key: 'form' as const, label: '填寫' },
              { key: 'preview' as const, label: '預覽' },
            ]).map(t => (
              <button
                key={t.key}
                className={`flex-1 py-2 text-xs rounded-md font-medium transition-colors ${
                  mobileTab === t.key ? 'bg-white text-olive-600 shadow-sm' : 'text-gray-400'
                }`}
                onClick={() => setMobileTab(t.key)}
              >
                {t.label}{t.count ? <span className="ml-1 text-gray-300">{t.count}</span> : null}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Cases */}
        {mobileTab === 'cases' && (
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="text-xs text-gray-400 mb-2">案件總覽 · {cases.length} 件</div>
            {cases.map(c => <CaseListItem key={c.id} c={c} />)}
          </div>
        )}

        {/* Tab: Form */}
        {mobileTab === 'form' && (
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
            <div className="card p-4 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-serif font-semibold text-sm">{current.name || '未命名案場'}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{current.designer} · {current.stage} · {current.region}</p>
                </div>
                <span className={`badge badge-${grade.grade.toLowerCase()} flex-shrink-0`}>{grade.grade} {grade.label}</span>
              </div>
            </div>
            <div className="card p-4">
              <FormContent />
            </div>
          </div>
        )}

        {/* Tab: Preview */}
        {mobileTab === 'preview' && (
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
            <div className="card p-4">
              <div className="font-semibold text-sm mb-3 pb-2 border-b-2 border-olive-100">影像企劃預覽</div>
              <PreviewContent />
              {draft && (
                <button className="btn btn-primary w-full mt-3" onClick={handleDownloadMarkdown}>下載 Markdown 企劃書</button>
              )}
            </div>
          </div>
        )}

        {/* Sticky action bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-beige-50 border-t border-warm-200 px-4 py-3 z-30 lg:hidden">
          <div className="flex gap-2">
            <button
              className="btn btn-primary flex-1 text-sm py-2.5"
              onClick={() => { handleGenerate(); setMobileTab('preview'); }}
              disabled={aiStatus === 'loading'}
              aria-busy={aiStatus === 'loading'}
            >
              {btnLabel}
            </button>
            <button className="btn flex-1 text-sm py-2.5" onClick={handleDownloadMarkdown}>
              下載企劃書
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ===== Sub-components =====

function FormField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-3">
      <label className="label" htmlFor={id}>{label}</label>
      <textarea id={id} className="input" rows={2} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function SelectField({ label, value, opts, onChange }: { label: string; value: string; opts: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <Combobox items={opts as unknown as readonly string[]} value={value} onChange={onChange as (v: string) => void} />
    </div>
  );
}

function ImageUploadBox({ label, image, onChange }: { label: string; image: string | null; onChange: (v: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }, [onChange]);

  return (
    <div
      className={`flex-1 border-2 border-dashed rounded text-center cursor-pointer transition-colors relative min-h-[90px] flex items-center justify-center ${
        image ? 'border-solid overflow-hidden p-0' : 'border-warm-300 hover:border-olive-400 p-4'
      }`}
      role="button"
      tabIndex={0}
      aria-label={`上傳 ${label} 圖片`}
      onClick={() => ref.current?.click()}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ref.current?.click(); } }}
    >
      {image ? (
        <>
          <img src={image} alt={label} className="absolute inset-0 w-full h-full object-cover rounded" />
          <button
            type="button"
            className="absolute bottom-1.5 right-1.5 bg-black/50 text-white text-xs px-2 py-0.5 rounded z-10 hover:bg-black/70"
            onClick={e => { e.stopPropagation(); onChange(null); }}
            aria-label={`移除 ${label} 圖片`}
          >✕ 移除</button>
        </>
      ) : (
        <span className="text-xs text-gray-400">{label}<br />點擊上傳</span>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" tabIndex={-1} onChange={handleFile} />
    </div>
  );
}

function GradePreview({ grade, positioning, reasons, output }: { grade: ReturnType<typeof computeGrade>; positioning: string; reasons: string; output: string }) {
  return (
    <div className="preview-block">
      <h4>拍攝等級</h4>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl font-bold font-serif" style={{ color: grade.color }}>{grade.grade}</span>
        <span className="font-semibold">{grade.label}</span>
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <div><span className="text-gray-400">建議拍攝等級：</span><strong>{grade.grade} {grade.label}</strong></div>
        <div><span className="text-gray-400">定位：</span>{positioning}</div>
        <div><span className="text-gray-400">判斷原因：</span>{reasons}</div>
        <div><span className="text-gray-400">適合輸出：</span>{output}</div>
      </div>
    </div>
  );
}

function PreviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="preview-block">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
