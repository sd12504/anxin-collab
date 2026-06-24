import { useState, useEffect, useRef } from 'react';
import { useStore } from '../hooks/useStore';
import { generatePlanningMarkdown, generateProductionPackMarkdown, generateSocialCopyMarkdown, generateShotListMarkdown, generateEditingBriefMarkdown } from '../utils/markdown';
import { generatePlanningDraft, generateSocialCopy, generateEditingBrief, isValidPlanningDraft, isValidProductionContent } from '../services/aiService';
import { generateScript } from '../services/ai';
import { computeGrade } from '../utils/grading';
import type { SocialCopy, EditingBrief } from '../types';

export default function ExportCenter() {
  const { cases, editingId, setEditingId, brandSettings } = useStore();
  const current = editingId ? cases.find(c => c.id === editingId) : null;
  const [selectedDoc, setSelectedDoc] = useState('planning');
  const [mdPreview, setMdPreview] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current && !editingId && cases.length > 0) setEditingId(cases[0].id);
    mounted.current = true;
  }, []);

  useEffect(() => {
    if (!current) return;
    generateDoc(selectedDoc);
  }, [current?.id, selectedDoc]);

  const grade = current ? computeGrade(current) : null;

  async function generateDoc(type: string) {
    if (!current) return;
    let md = '';
    switch (type) {
      case 'planning':
        md = generatePlanningMarkdown(current, current.aiPlanningDraft);
        break;
      case 'production':
        md = generateProductionPackMarkdown(current, undefined, undefined, undefined, current.aiProductionContent);
        break;
      case 'shotlist':
        md = generateShotListMarkdown(current);
        break;
      case 'editing':
        const edt = await generateEditingBrief(current, [], grade);
        md = generateEditingBriefMarkdown(current, edt as EditingBrief | null, current.aiProductionContent);
        break;
      case 'shorts': {
        const draft = isValidPlanningDraft(current.aiPlanningDraft) ? current.aiPlanningDraft! : await generatePlanningDraft(current, brandSettings);
        md = `# Shorts 題目\n\n${current.name}\n\n${(draft.shortsIdeas || []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}`;
        break;
      }
      case 'social': {
        const social = await generateSocialCopy(current, brandSettings);
        md = generateSocialCopyMarkdown(current, social as SocialCopy | null);
        break;
      }
      case 'interview': {
        const draft = isValidPlanningDraft(current.aiPlanningDraft) ? current.aiPlanningDraft! : await generatePlanningDraft(current, brandSettings);
        md = `# 訪談問題\n\n${current.name}\n\n${(draft.interviewQuestions || []).map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`;
        break;
      }
    }
    setMdPreview(md);
  }

  const downloads = [
    { key: 'planning', label: '企劃書', desc: '案件影片企劃書' },
    { key: 'production', label: '製片包', desc: '拍攝清單 + 腳本 + 剪輯' },
    { key: 'shotlist', label: '拍攝清單', desc: '分類拍攝項目' },
    { key: 'editing', label: '剪輯工作單', desc: '段落 + 字幕 + 音樂' },
    { key: 'shorts', label: 'Shorts 題目', desc: '短影音切點' },
    { key: 'social', label: '社群文案', desc: 'FB + IG + YT' },
    { key: 'interview', label: '訪談問題', desc: '設計師 / 師傅 / 屋主' },
  ];

  const downloadCurrent = () => {
    const blob = new Blob([mdPreview], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(current?.name || 'export').replace(/[\\/:*?"<>|]/g, '_')}_${selectedDoc}_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
  };

  if (!current) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
        <div className="text-gray-400 text-sm">請選擇案件。{cases.map(c => <button key={c.id} className="btn btn-sm ml-2" onClick={() => setEditingId(c.id)}>{c.name}</button>)}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-0px)]">
      {/* Left: TOC */}
      <div className="w-full lg:w-52 bg-white/60 border-r border-gray-100 p-4 overflow-y-auto flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif font-semibold text-sm">輸出中心</h2>
          <button className="btn btn-sm" onClick={() => setEditingId(null)}>切換</button>
        </div>
        <div className="text-xs text-gray-400 mb-2">{current.name} · {grade?.grade} {grade?.label}</div>
        <div className="space-y-0.5">
          {downloads.map(d => (
            <button key={d.key}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedDoc === d.key ? 'bg-olive-50 text-olive-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedDoc(d.key)}>
              <div>{d.label}</div>
              <div className="text-[0.6rem] text-gray-400">{d.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Center: Preview */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-white/40 min-h-0">
        <div ref={previewRef} className="card p-5 lg:p-6 min-h-[60vh]">
          <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-gray-700">{mdPreview || '載入中...'}</pre>
        </div>
      </div>

      {/* Right: cover preview + download */}
      <div className="w-full lg:w-60 bg-white/60 border-t lg:border-t-0 lg:border-l border-gray-100 p-4 flex flex-col items-center flex-shrink-0">
        <div className="card p-4 w-full mb-4 text-center">
          <div className="w-24 h-32 bg-gradient-to-b from-olive-100 to-olive-50 rounded-lg mx-auto mb-3 flex items-center justify-center border border-olive-200">
            <span className="text-3xl font-serif font-bold text-olive-600">{current.name?.charAt(0) || '安'}</span>
          </div>
          <div className="text-xs font-semibold">{current.name}</div>
          <div className="text-[0.6rem] text-gray-400 mt-1">{grade?.grade} {grade?.label}</div>
        </div>
        {/* Download buttons */}
        <button className="btn btn-primary w-full mb-2 text-sm" onClick={downloadCurrent}>下載 Markdown</button>
        <button className="btn w-full text-sm" onClick={downloadCurrent}>下載純文字</button>
        <div className="text-[0.6rem] text-gray-400 mt-3 text-center">安心整合設計協作板</div>
      </div>
    </div>
  );
}
