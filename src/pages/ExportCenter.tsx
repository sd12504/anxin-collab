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

  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current && !editingId && cases.length > 0) {
      setEditingId(cases[0].id);
    }
    mounted.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-7">
        <h2 className="font-serif text-xl mb-5">輸出中心</h2>
        <div className="text-gray-400">
          <p className="mb-3">請選擇案件以檢視可下載內容。</p>
          <div className="flex flex-wrap gap-2">
            {cases.map(c => (<button key={c.id} className="btn" onClick={() => setEditingId(c.id)}>{c.name || '未命名'}</button>))}
          </div>
        </div>
      </div>
    );
  }

  const grade = computeGrade(current);
  const today = new Date().toLocaleDateString('zh-TW');

  // Primary outputs
  const primaryOutputs = [
    {
      label: '企劃書',
      format: 'Markdown',
      purpose: '給設計師、攝影與剪輯確認影片方向',
      audience: '設計師 / 攝影 / 剪輯',
      status: '可下載',
      action: () => {
        if (isValidPlanningDraft(current.aiPlanningDraft)) {
          download(generatePlanningMarkdown(current, current.aiPlanningDraft!), `${current.name}_企劃書`);
        } else {
          download(generatePlanningMarkdown(current), `${current.name}_企劃書`);
        }
      },
    },
    {
      label: '製片包',
      format: 'Markdown',
      purpose: '拍攝前整合拍攝清單、腳本與剪輯方向',
      audience: '攝影 / 剪輯',
      status: '可下載',
      action: async () => {
        download(generateProductionPackMarkdown(current, undefined, undefined, undefined, current.aiProductionContent), `${current.name}_製片包`);
      },
    },
  ];

  // Secondary outputs
  const secondaryOutputs = [
    {
      label: '拍攝清單',
      format: 'Markdown',
      purpose: '現場拍攝時對照使用',
      audience: '攝影',
      status: current.mustShoot ? '可下載' : '資料不足',
      action: () => {
        download(generateShotListMarkdown(current), `${current.name}_拍攝清單`);
      },
    },
    {
      label: '剪輯工作單',
      format: 'Markdown',
      purpose: '剪輯時參考段落與方向',
      audience: '剪輯',
      status: '可下載',
      action: async () => {
        const edt = await generateEditingBrief(current, [], grade);
        download(generateEditingBriefMarkdown(current, edt as EditingBrief | null, current.aiProductionContent), `${current.name}_剪輯工作單`);
      },
    },
    {
      label: 'Shorts 題目',
      format: 'Markdown',
      purpose: '規劃短影音腳本切點',
      audience: '剪輯 / 社群',
      status: '可下載',
      action: async () => {
        const draft = isValidPlanningDraft(current.aiPlanningDraft)
          ? current.aiPlanningDraft!
          : await generatePlanningDraft(current, brandSettings);
        const ideas = Array.isArray(draft.shortsIdeas) ? draft.shortsIdeas : [];
        download(`# Shorts 題目\n\n${current.name}\n\n${ideas.map((s, i) => `${i + 1}. ${s}`).join('\n')}`, `${current.name}_Shorts題目`);
      },
    },
    {
      label: '社群文案',
      format: 'Markdown',
      purpose: '發佈到 Facebook、Instagram 等平台',
      audience: '社群小編',
      status: '可下載',
      action: async () => {
        const social = await generateSocialCopy(current, brandSettings);
        download(generateSocialCopyMarkdown(current, social as SocialCopy | null), `${current.name}_社群文案`);
      },
    },
    {
      label: '訪談問題',
      format: 'Markdown',
      purpose: '拍攝當天訪談設計師、師傅、屋主',
      audience: '攝影 / 主持人',
      status: '可下載',
      action: async () => {
        const draft = isValidPlanningDraft(current.aiPlanningDraft)
          ? current.aiPlanningDraft!
          : await generatePlanningDraft(current, brandSettings);
        const qs = Array.isArray(draft.interviewQuestions) ? draft.interviewQuestions : [];
        download(`# 訪談問題\n\n${current.name}\n\n${qs.map((q, i) => `${i + 1}. ${q}`).join('\n')}`, `${current.name}_訪談問題`);
      },
    },
  ];

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-5 lg:py-7">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <h2 className="font-serif text-xl">輸出中心 · {current.name}</h2>
        <div className="flex gap-2">
          <button className="btn btn-sm" onClick={() => setEditingId(null)}>切換案件</button>
        </div>
      </div>

      {/* Primary outputs */}
      <h3 className="font-serif font-semibold text-sm mb-3 text-olive-600">主要輸出</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {primaryOutputs.map(o => (
          <OutputCard key={o.label} {...o} primary today={today} />
        ))}
      </div>

      {/* Secondary outputs */}
      <h3 className="font-serif font-semibold text-sm mb-3 text-gray-400">其他輸出</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {secondaryOutputs.map(o => (
          <OutputCard key={o.label} {...o} today={today} />
        ))}
      </div>
    </div>
  );
}

function OutputCard({
  label, format, purpose, audience, status, action, primary, today,
}: {
  label: string; format: string; purpose: string; audience: string; status: string;
  action: () => Promise<void> | void; primary?: boolean; today: string;
}) {
  const [loading, setLoading] = useState(false);
  const handle = async () => { setLoading(true); await action(); setLoading(false); };

  return (
    <div className={`card p-5 ${primary ? 'ring-1 ring-olive-200 bg-olive-50/30' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-semibold text-sm flex items-center gap-2">
            {label}
            {primary && <span className="badge badge-a text-[0.65rem]">主要</span>}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{format} 檔案</div>
        </div>
        <span className={`badge text-[0.65rem] ${status === '可下載' ? 'badge-a' : 'badge-d'}`}>{status}</span>
      </div>
      <div className="text-xs text-gray-500 space-y-1.5 mb-4">
        <div className="flex gap-2"><span className="text-gray-400 w-14 flex-shrink-0">用途</span><span>{purpose}</span></div>
        <div className="flex gap-2"><span className="text-gray-400 w-14 flex-shrink-0">對象</span><span>{audience}</span></div>
        <div className="flex gap-2"><span className="text-gray-400 w-14 flex-shrink-0">更新</span><span>{today}</span></div>
      </div>
      <button
        className={`w-full text-sm py-2 rounded font-medium transition-colors ${
          primary
            ? 'bg-olive-500 text-white hover:bg-olive-600'
            : 'btn'
        }`}
        onClick={handle}
        disabled={loading || status !== '可下載'}
      >
        {loading ? '下載中...' : status !== '可下載' ? '資料不足' : `下載 ${label}`}
      </button>
    </div>
  );
}

function download(md: string, filename: string) {
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename.replace(/[\\/:*?"<>|]/g, '_')}_${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
