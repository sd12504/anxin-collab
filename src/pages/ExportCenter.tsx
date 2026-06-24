import { useState, useEffect, useRef } from 'react';
import { Download, FileText, Printer, Zap } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { DropdownSelect } from '../components/ui/DropdownSelect';
import { generatePlanningMarkdown, generateProductionPackMarkdown, generateSocialCopyMarkdown, generateShotListMarkdown, generateEditingBriefMarkdown } from '../utils/markdown';
import { generatePlanningDraft, generateSocialCopy, generateEditingBrief, isValidPlanningDraft, isValidProductionContent } from '../services/aiService';
import { generateScript } from '../services/ai';
import { computeGrade } from '../utils/grading';
import type { CaseData, EditingBrief, GradeResult, SocialCopy } from '../types';

export default function ExportCenter() {
  const { cases, editingId, setEditingId, brandSettings } = useStore();
  const current = editingId ? cases.find(c => c.id === editingId) : null;
  const [selectedDoc, setSelectedDoc] = useState('planning');
  const [mdPreview, setMdPreview] = useState('');
  const [previewMode, setPreviewMode] = useState<'markdown' | 'pdf'>('markdown');
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatingMsg, setGeneratingMsg] = useState('');
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

  async function generateAll() {
    if (!current) return;
    setGeneratingAll(true);
    setGeneratingMsg('生成中...');
    try {
      const draft = isValidPlanningDraft(current.aiPlanningDraft) ? current.aiPlanningDraft! : await generatePlanningDraft(current, brandSettings);
      setGeneratingMsg('企劃書...');
      const planning = generatePlanningMarkdown(current, draft);
      setGeneratingMsg('製片包...');
      const production = generateProductionPackMarkdown(current, undefined, undefined, undefined, current.aiProductionContent);
      setGeneratingMsg('拍攝清單...');
      const shotlist = generateShotListMarkdown(current);
      setGeneratingMsg('剪輯工作單...');
      const edt = await generateEditingBrief(current, [], grade);
      const editing = generateEditingBriefMarkdown(current, edt as EditingBrief | null, current.aiProductionContent);
      setGeneratingMsg('社群文案...');
      const social = await generateSocialCopy(current, brandSettings);
      const socialMd = generateSocialCopyMarkdown(current, social as SocialCopy | null);
      setGeneratingMsg('整合中...');

      const shortsMd = `# Shorts 題目\n\n${current.name}\n\n${(draft.shortsIdeas || []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}`;
      const interviewMd = `# 訪談問題\n\n${current.name}\n\n${(draft.interviewQuestions || []).map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`;

      const all = [
        planning,
        `---\n\n${production}`,
        `---\n\n${shotlist}`,
        `---\n\n${editing}`,
        `---\n\n${shortsMd}`,
        `---\n\n${socialMd}`,
        `---\n\n${interviewMd}`,
      ].join('\n\n');

      setMdPreview(all);
      setSelectedDoc('all');
    } catch (err) {
      setMdPreview(`# 生成失敗\n\n${(err as Error).message}`);
    } finally {
      setGeneratingAll(false);
      setGeneratingMsg('');
    }
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
    a.download = `${(current?.name || 'export').replace(/[\\/:*?"<>|]/g, '_')}_${selectedDoc === 'all' ? 'full' : selectedDoc}_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadText = () => {
    const blob = new Blob([markdownToPlainText(mdPreview)], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(current?.name || 'export').replace(/[\\/:*?"<>|]/g, '_')}_${selectedDoc === 'all' ? 'full' : selectedDoc}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadPdf = () => {
    const printWindow = window.open('', '_blank', 'width=960,height=720');
    if (!printWindow) return;
    printWindow.document.write(buildPrintHtml(mdPreview, current?.name || '案件', downloads.find(d => d.key === selectedDoc)?.label || '文件'));
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 250);
  };

  if (!current) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-16 text-center text-gray-400">
        尚無案件，請先至「案例管理」新增案件。
      </div>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-0px)] xl:h-[calc(100vh-0px)]">
      {/* Left: TOC */}
      <div className="w-full xl:w-56 bg-white/60 border-b xl:border-b-0 xl:border-r border-gray-100 p-4 xl:overflow-y-auto flex-shrink-0">
        <div className="mb-4">
          <h2 className="font-serif font-semibold text-sm mb-2">輸出中心</h2>
          <DropdownSelect
            value={current.id}
            options={cases.map(c => ({ value: c.id, label: c.name || '未命名' }))}
            onChange={setEditingId}
            ariaLabel="選擇案件"
          />
        </div>
        <button
          className="btn btn-primary btn-sm w-full mb-3 flex items-center justify-center gap-1"
          onClick={generateAll}
          disabled={generatingAll}
        >
          <Zap size={13} />
          {generatingAll ? generatingMsg : '一鍵生成全部'}
        </button>
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
      <div className="flex-none xl:flex-1 overflow-visible xl:overflow-y-auto p-4 lg:p-6 bg-white/40 min-h-[640px] xl:min-h-0">
        <div className="max-w-5xl mx-auto mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-lg font-semibold text-gray-900">文件預覽</h1>
            <p className="text-xs text-gray-400 mt-1">{selectedDoc === 'all' ? '完整輸出包' : downloads.find(d => d.key === selectedDoc)?.label} · {current.name}</p>
          </div>
          <div className="inline-flex rounded-lg border border-warm-200 bg-white p-1 self-start sm:self-auto">
            <button
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${previewMode === 'markdown' ? 'bg-olive-600 text-white' : 'text-gray-500 hover:bg-warm-50'}`}
              onClick={() => setPreviewMode('markdown')}
            >
              Markdown
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${previewMode === 'pdf' ? 'bg-olive-600 text-white' : 'text-gray-500 hover:bg-warm-50'}`}
              onClick={() => setPreviewMode('pdf')}
            >
              PDF 預覽
            </button>
          </div>
        </div>
        <div ref={previewRef} className={previewMode === 'pdf' ? 'max-w-5xl mx-auto' : 'card p-5 lg:p-8 min-h-[60vh] max-w-4xl mx-auto'}>
          {previewMode === 'pdf' ? (
            <PdfPreview markdown={mdPreview || '載入中...'} current={current} grade={grade} docLabel={selectedDoc === 'all' ? '完整輸出包' : downloads.find(d => d.key === selectedDoc)?.label || '文件'} />
          ) : (
            <MarkdownPreview markdown={mdPreview || '載入中...'} />
          )}
        </div>
      </div>

      {/* Right: cover preview + download */}
      <div className="w-full xl:w-72 bg-white/60 border-t xl:border-t-0 xl:border-l border-gray-100 p-4 flex-shrink-0 xl:overflow-y-auto">
        <div className="card overflow-hidden w-full mb-4">
          <div className="bg-olive-700 text-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[0.65rem] text-white/70">輸出文件</div>
                <div className="font-serif text-lg font-semibold mt-1">{selectedDoc === 'all' ? '完整輸出包' : downloads.find(d => d.key === selectedDoc)?.label}</div>
              </div>
              <FileText size={24} className="text-white/75" />
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-olive-50 border border-olive-100 text-olive-700 flex items-center justify-center font-serif text-xl font-bold">
                {current.name?.charAt(0) || '安'}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{current.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{current.designer || '未指定設計師'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-warm-50 p-2">
                <div className="text-gray-400">等級</div>
                <div className="font-semibold text-gray-800 mt-1">{grade?.grade} {grade?.label}</div>
              </div>
              <div className="rounded-lg bg-warm-50 p-2">
                <div className="text-gray-400">進度</div>
                <div className="font-semibold text-gray-800 mt-1">{current.shootStatus}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <button className="btn btn-primary w-full text-sm flex items-center justify-center gap-2" onClick={downloadCurrent}>
            <Download size={15} />
            下載 Markdown
          </button>
          <button className="btn w-full text-sm flex items-center justify-center gap-2" onClick={downloadPdf}>
            <Printer size={15} />
            下載 PDF
          </button>
          <button className="btn w-full text-sm flex items-center justify-center gap-2" onClick={downloadText}>
            <FileText size={15} />
            下載純文字
          </button>
        </div>
        <div className="text-[0.65rem] text-gray-400 mt-4 text-center">安心整合設計協作板</div>
      </div>
    </div>
  );
}

function MarkdownPreview({ markdown }: { markdown: string }) {
  const blocks = parseMarkdown(markdown);
  return (
    <div className="text-gray-800 leading-relaxed">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'h1':
            return <h1 key={index} className="font-serif text-2xl font-semibold text-gray-950 mb-6">{block.text}</h1>;
          case 'h2':
            return <h2 key={index} className="font-serif text-lg font-semibold text-gray-900 mt-8 mb-3 pb-2 border-b border-warm-200">{block.text}</h2>;
          case 'h3':
            return <h3 key={index} className="font-semibold text-gray-900 mt-6 mb-2">{block.text}</h3>;
          case 'table':
            return (
              <div key={index} className="overflow-x-auto my-4 rounded-lg border border-warm-200">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-warm-100">
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex === 0 ? 'bg-olive-50/70 text-olive-800 font-semibold' : 'bg-white'}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-3 py-2 border-r last:border-r-0 border-warm-100 align-top">{formatInline(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'list':
            return (
              <ul key={index} className="list-disc pl-5 text-sm text-gray-700 space-y-1 my-3">
                {block.items.map((item, itemIndex) => <li key={itemIndex}>{formatInline(item)}</li>)}
              </ul>
            );
          case 'ordered':
            return (
              <ol key={index} className="list-decimal pl-5 text-sm text-gray-700 space-y-1 my-3">
                {block.items.map((item, itemIndex) => <li key={itemIndex}>{formatInline(item)}</li>)}
              </ol>
            );
          case 'p':
            return <p key={index} className="text-sm text-gray-700 my-3">{formatInline(block.text)}</p>;
        }
      })}
    </div>
  );
}

function PdfPreview({
  markdown,
  current,
  grade,
  docLabel,
}: {
  markdown: string;
  current: CaseData;
  grade: GradeResult | null;
  docLabel: string;
}) {
  const blocks = parseMarkdown(markdown);
  const sections = blocks
    .filter(block => block.type === 'h2' && 'text' in block)
    .map(block => ('text' in block ? block.text : ''))
    .slice(0, 11);
  const contentBlocks = blocks.filter(block => block.type !== 'h1').slice(0, 8);

  return (
    <div className="card overflow-hidden bg-[#f7f3eb] border-warm-200">
      <div className="grid grid-cols-1 lg:grid-cols-[170px_1fr_220px] min-h-[560px]">
        <aside className="bg-white/65 border-b lg:border-b-0 lg:border-r border-warm-200 p-5">
          <div className="text-xs text-olive-700 font-semibold mb-4">企劃書目錄</div>
          <ol className="space-y-2 text-[0.72rem] text-gray-500 list-decimal pl-4">
            {sections.length ? sections.map((section, index) => (
              <li key={`${section}-${index}`} className="leading-snug">{section}</li>
            )) : (
              <li>文件內容</li>
            )}
          </ol>
        </aside>

        <section className="bg-white/90 p-5 lg:p-7">
          <div className="mb-5">
            <div className="text-xs text-olive-700 font-semibold">{docLabel}</div>
            <h2 className="font-serif text-2xl font-semibold text-gray-950 mt-1">{current.name}</h2>
            <p className="text-xs text-gray-400 mt-1">{current.designer || '未指定設計師'} · {current.region || '未填地區'} · {current.area || '未填'}坪</p>
          </div>
          <div className="space-y-4">
            {contentBlocks.map((block, index) => <PdfPreviewBlock key={index} block={block} />)}
          </div>
        </section>

        <aside className="bg-[#eee5d6] p-5 flex flex-col justify-between">
          <div className="rounded-lg bg-white/45 border border-white/70 min-h-[300px] p-5 flex flex-col items-center justify-center text-center">
            <div className="text-xs text-gray-400 mb-8">安心整合</div>
            <div className="font-serif text-xl text-gray-800">影像企劃書</div>
            <div className="mt-3 text-lg font-serif text-gray-900">{current.name}</div>
            <div className="mt-2 text-xs text-gray-500">{current.houseCondition} · {current.area || '未填'}坪</div>
            <div className="mt-10 w-12 h-12 rounded-full border border-olive-200 bg-olive-50 text-olive-700 flex items-center justify-center font-serif text-xl">
              安
            </div>
            <div className="mt-2 text-xs text-gray-500">安心整合設計協作板</div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mt-4">
            <div className="rounded-lg bg-white/60 p-3">
              <div className="text-gray-400">拍攝等級</div>
              <div className="font-semibold mt-1">{grade?.grade} {grade?.label}</div>
            </div>
            <div className="rounded-lg bg-white/60 p-3">
              <div className="text-gray-400">拍攝進度</div>
              <div className="font-semibold mt-1">{current.shootStatus}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PdfPreviewBlock({ block }: { block: MarkdownBlock }) {
  switch (block.type) {
    case 'h2':
      return <h3 className="font-serif text-base font-semibold text-gray-900 border-b border-warm-200 pb-2">{block.text}</h3>;
    case 'h3':
      return <h4 className="text-sm font-semibold text-gray-800">{block.text}</h4>;
    case 'table':
      return (
        <div className="rounded-lg border border-warm-200 overflow-hidden">
          <table className="w-full text-[0.72rem]">
            <tbody>
              {block.rows.slice(0, 6).map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex === 0 ? 'bg-olive-50 text-olive-800 font-semibold' : 'bg-white/70'}>
                  {row.map((cell, cellIndex) => <td key={cellIndex} className="px-2 py-1.5 border-r last:border-r-0 border-warm-100">{formatInline(cell)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'ordered':
      return (
        <ol className="list-decimal pl-5 text-xs text-gray-600 space-y-1">
          {block.items.slice(0, 5).map((item, index) => <li key={index}>{formatInline(item)}</li>)}
        </ol>
      );
    case 'list':
      return (
        <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
          {block.items.slice(0, 5).map((item, index) => <li key={index}>{formatInline(item)}</li>)}
        </ul>
      );
    case 'p':
      return <p className="text-xs text-gray-600 leading-relaxed">{formatInline(block.text)}</p>;
    case 'h1':
      return null;
  }
}

type MarkdownBlock =
  | { type: 'h1' | 'h2' | 'h3' | 'p'; text: string }
  | { type: 'list' | 'ordered'; items: string[] }
  | { type: 'table'; rows: string[][] };

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i += 1;
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: line.slice(2).trim() });
      i += 1;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3).trim() });
      i += 1;
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4).trim() });
      i += 1;
      continue;
    }
    if (line.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const rowLine = lines[i].trim();
        const isDivider = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(rowLine);
        if (!isDivider) rows.push(rowLine.replace(/^\||\|$/g, '').split('|').map(cell => cell.trim()));
        i += 1;
      }
      blocks.push({ type: 'table', rows });
      continue;
    }
    if (/^- /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i].trim())) {
        items.push(lines[i].trim().slice(2).trim());
        i += 1;
      }
      blocks.push({ type: 'list', items });
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i += 1;
      }
      blocks.push({ type: 'ordered', items });
      continue;
    }

    const paragraph = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|\||- |\d+\.\s)/.test(lines[i].trim())) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: 'p', text: paragraph.join(' ') });
  }

  return blocks;
}

function formatInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^\|\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/gm, '')
    .replace(/^\|/gm, '')
    .replace(/\|$/gm, '')
    .replace(/\|/g, '  ');
}

function buildPrintHtml(markdown: string, caseName: string, docName: string): string {
  const escapeHtml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const body = parseMarkdown(markdown).map(block => {
    switch (block.type) {
      case 'h1':
        return `<h1>${escapeHtml(block.text)}</h1>`;
      case 'h2':
        return `<h2>${escapeHtml(block.text)}</h2>`;
      case 'h3':
        return `<h3>${escapeHtml(block.text)}</h3>`;
      case 'table':
        return `<table>${block.rows.map((row, index) => `<tr class="${index === 0 ? 'head' : ''}">${row.map(cell => `<td>${escapeHtml(cell).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</td>`).join('')}</tr>`).join('')}</table>`;
      case 'list':
        return `<ul>${block.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
      case 'ordered':
        return `<ol>${block.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ol>`;
      case 'p':
        return `<p>${escapeHtml(block.text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</p>`;
    }
  }).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(caseName)}_${escapeHtml(docName)}</title>
  <style>
    @page { margin: 18mm; }
    body { font-family: "Noto Sans TC", "Microsoft JhengHei", Arial, sans-serif; color: #1f2937; line-height: 1.65; }
    h1 { font-family: serif; font-size: 28px; margin: 0 0 28px; }
    h2 { font-family: serif; font-size: 18px; margin: 28px 0 12px; border-bottom: 1px solid #e7e0d2; padding-bottom: 8px; }
    h3 { font-size: 15px; margin: 22px 0 8px; }
    p, li, td { font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 14px 0; }
    td { border: 1px solid #e7e0d2; padding: 8px 10px; vertical-align: top; }
    tr.head td { background: #f2f6ea; font-weight: 700; color: #526b33; }
    ul, ol { padding-left: 22px; }
  </style>
</head>
<body>${body}</body>
</html>`;
}
