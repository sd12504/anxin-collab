import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../hooks/useStore';
import { computeGrade, getCompletion, getGradeOutput } from '../utils/grading';
import { generateProductionContent, isValidProductionContent } from '../services/aiService';
import { generateProductionPackMarkdown, generateSocialCopyMarkdown } from '../utils/markdown';
import type { AiProductionResult, AiStatus } from '../types';

export default function ProductionTools() {
  const { cases, editingId, setEditingId, updateCase, brandSettings } = useStore();
  const current = editingId ? cases.find(c => c.id === editingId) : null;

  const [content, setContent] = useState<AiProductionResult | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatus>('idle');

  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current && !editingId && cases.length > 0) {
      setEditingId(cases[0].id);
    }
    mounted.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-generate all content when current case changes
  const generateAll = useCallback(async () => {
    if (!current) return;
    setAiStatus('loading');
    try {
      const result = await generateProductionContent(current, brandSettings);
      if (!isValidProductionContent(result)) throw new Error('AI 回傳資料不完整');
      setContent(result);
      setAiStatus('success');
      updateCase(current.id, { aiProductionContent: result });
    } catch {
      setAiStatus('error');
    }
  }, [current, brandSettings, updateCase]);

  useEffect(() => {
    if (current) {
      if (isValidProductionContent(current.aiProductionContent)) {
        setContent(current.aiProductionContent);
        setAiStatus('success');
      } else {
        setContent(null);
        setAiStatus('idle');
        generateAll();
      }
    }
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-7">
        <h2 className="font-serif text-xl mb-5">製片工具</h2>
        <div className="text-gray-400">
          <p className="mb-3">請先在協作板選擇一個案件。</p>
          <div className="flex flex-wrap gap-2">
            {cases.map(c => (
              <button key={c.id} className="btn" onClick={() => setEditingId(c.id)}>{c.name || '未命名'}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const grade = computeGrade(current);
  const completion = getCompletion(current);
  const output = getGradeOutput(grade.grade);

  const handleRefresh = () => generateAll();
  const btnLabel = aiStatus === 'loading' ? '整理中...' : aiStatus === 'error' ? '更新失敗，請重試' : '更新製片內容';

  // Safe array access helper
  const arr = <T,>(val: unknown, fb: T[] = []): T[] => Array.isArray(val) ? (val as T[]) : fb;
  const sc = content;
  const eb = sc?.editingBrief;
  const soc = sc?.socialCopy;

  const handleDownloadPack = () => {
    const md = generateProductionPackMarkdown(current, undefined, undefined, undefined, content);
    downloadFile(md, `${current.name}_製片包`);
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-5 lg:py-7">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <h2 className="font-serif text-xl">製片工具 · {current.name}</h2>
        <div className="flex gap-2">
          <button className="btn btn-sm" onClick={() => setEditingId(null)}>切換案件</button>
          <button className="btn btn-sm" onClick={handleDownloadPack}>下載製片包</button>
        </div>
      </div>

      <div className="space-y-5">
        {/* 1. 製片總覽 */}
        <section className="card p-5 lg:p-6">
          <h3 className="font-serif font-semibold text-base mb-4">製片總覽</h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-400 mb-0.5">案件名稱</div>
              <div className="font-semibold">{current.name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-0.5">拍攝等級</div>
              <span className={`badge badge-${grade.grade.toLowerCase()}`}>{grade.grade} {grade.label}</span>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-0.5">主要輸出</div>
              <div className="text-xs">{output}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-0.5">資料完整度</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-warm-200 rounded-full overflow-hidden max-w-[80px]">
                  <div className="h-full bg-olive-500 rounded-full" style={{ width: `${completion.pct}%` }} />
                </div>
                <span className="text-xs text-gray-400">{completion.done}/{completion.total}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-0.5">建議製作規格</div>
              <div className="text-xs">
                {grade.grade === 'A' ? '長片 12min + Shorts ×5' : grade.grade === 'B' ? '長片 8min + Shorts ×3' : grade.grade === 'C' ? 'Shorts 60s ×3' : '內部紀錄'}
              </div>
            </div>
          </div>
        </section>

        {/* 2. 拍攝清單 */}
        <section className="card p-5 lg:p-6">
          <h3 className="font-serif font-semibold text-base mb-3">拍攝清單</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="section-title">必拍畫面</h4>
              {current.mustShoot ? (
                <ul className="space-y-1">{current.mustShoot.split(/[，,、\n]/).filter(Boolean).map((s, i) => <li key={i} className="before:content-['—_'] before:text-olive-400">{s.trim()}</li>)}</ul>
              ) : <p className="text-gray-400 italic text-xs">尚未填寫必拍畫面</p>}
            </div>
            <div>
              <h4 className="section-title">補拍畫面</h4>
              {sc ? (
                <ul className="space-y-1">{arr<string>(sc.shootingChecklist).filter((_, i) => i > 0).slice(0, 5).map((s, i) => <li key={i} className="before:content-['—_'] before:text-olive-400">{s}</li>)}</ul>
              ) : <p className="text-gray-400 italic text-xs">載入中...</p>}
            </div>
            <div>
              <h4 className="section-title">人物訪談</h4>
              <ul className="space-y-1">
                {current.designer ? <li className="before:content-['—_'] before:text-olive-400">設計師 {current.designer}</li> : null}
                {current.ownerName ? <li className="before:content-['—_'] before:text-olive-400">屋主 {current.ownerName}</li> : null}
                {current.masterExplain ? <li className="before:content-['—_'] before:text-olive-400">師傅（工法講解）</li> : null}
              </ul>
            </div>
            <div>
              <h4 className="section-title">細節特寫</h4>
              <ul className="space-y-1">
                {current.materialColor ? <li className="before:content-['—_'] before:text-olive-400">材質：{current.materialColor.slice(0, 30)}</li> : null}
                {current.specialCraft ? <li className="before:content-['—_'] before:text-olive-400">工法：{current.specialCraft.slice(0, 30)}</li> : null}
                {current.beforeAfter === '有' ? <li className="before:content-['—_'] before:text-olive-400">Before/After 同角度對比</li> : null}
              </ul>
            </div>
          </div>
        </section>

        {/* 3. 腳本草稿 */}
        <section className="card p-5 lg:p-6">
          <h3 className="font-serif font-semibold text-base mb-3">腳本草稿</h3>
          {sc ? (
            <div className="space-y-4">
              <div>
                <h4 className="section-title">長片腳本</h4>
                <pre className="text-sm whitespace-pre-wrap font-sans bg-olive-50 p-4 rounded">{sc.longformScript || ''}</pre>
              </div>
              <div>
                <h4 className="section-title">Shorts 腳本</h4>
                {arr<string>(sc.shortsScripts).map((s, i) => <div key={i} className="text-sm bg-olive-50 p-3 rounded mb-2">{s}</div>)}
              </div>
            </div>
          ) : <p className="text-gray-400 italic text-sm">載入中...</p>}
        </section>

        {/* 4. 剪輯工作單 */}
        <section className="card p-5 lg:p-6">
          <h3 className="font-serif font-semibold text-base mb-3">剪輯工作單</h3>
          {sc ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="section-title">開場方式</h4>
                <p className="bg-olive-50 p-3 rounded">{eb?.openingStyle || ''}</p>
              </div>
              <div>
                <h4 className="section-title">段落順序</h4>
                <ol className="pl-4 space-y-0.5 list-decimal">{arr<string>(eb?.segmentOrder).map((s, i) => <li key={i}>{s}</li>)}</ol>
              </div>
              <div>
                <h4 className="section-title">字幕方向</h4>
                <p className="bg-olive-50 p-3 rounded">{eb?.subtitleDirection || ''}</p>
              </div>
              <div>
                <h4 className="section-title">音樂方向</h4>
                <p className="bg-olive-50 p-3 rounded">{eb?.musicDirection || ''}</p>
              </div>
              <div>
                <h4 className="section-title">可切 Shorts 片段</h4>
                <ul className="space-y-1">{arr<string>(eb?.shortsCutPoints).map((s, i) => <li key={i} className="before:content-['—_'] before:text-olive-400">{s}</li>)}</ul>
              </div>
              <div>
                <h4 className="section-title">素材缺口</h4>
                <p className={`p-3 rounded text-sm ${arr<string>(eb?.missingAssets).length ? 'bg-amber-50 text-amber-700' : 'bg-olive-50'}`}>
                  {arr<string>(eb?.missingAssets).length ? arr<string>(eb?.missingAssets).join('、') : '無明顯缺口'}
                </p>
              </div>
            </div>
          ) : <p className="text-gray-400 italic text-sm">載入中...</p>}
        </section>

        {/* 5. Shorts 題目 */}
        <section className="card p-5 lg:p-6">
          <h3 className="font-serif font-semibold text-base mb-3">Shorts 題目</h3>
          {sc ? (
            <ol className="space-y-2 pl-4 list-decimal text-sm">
              {arr<string>(sc.shortsScripts).slice(0, 5).map((t, i) => <li key={i}>{t}</li>)}
            </ol>
          ) : <p className="text-gray-400 italic text-sm">載入中...</p>}
        </section>

        {/* 6. 社群文案 */}
        <section className="card p-5 lg:p-6">
          <h3 className="font-serif font-semibold text-base mb-3">社群文案</h3>
          {sc ? (
            <div className="space-y-4 text-sm">
              <div><h4 className="section-title">YouTube 標題</h4><p className="bg-olive-50 p-3 rounded">{soc?.youtubeTitle || ''}</p></div>
              <div><h4 className="section-title">Shorts 標題</h4><p className="bg-olive-50 p-3 rounded">{soc?.shortsTitle || ''}</p></div>
              <div><h4 className="section-title">Facebook 貼文</h4><pre className="whitespace-pre-wrap font-sans bg-olive-50 p-3 rounded">{soc?.facebookPost || ''}</pre></div>
              <div><h4 className="section-title">Instagram 文案</h4><p className="bg-olive-50 p-3 rounded">{soc?.instagramCaption || ''}</p></div>
              <div><h4 className="section-title">Hashtag</h4><p>{arr<string>(soc?.hashtags).map(h => '#' + h).join(' ')}</p></div>
            </div>
          ) : <p className="text-gray-400 italic text-sm">載入中...</p>}
        </section>

        {/* 7. 訪談提問 */}
        <section className="card p-5 lg:p-6">
          <h3 className="font-serif font-semibold text-base mb-3">訪談提問</h3>
          {sc ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="section-title">設計師問題</h4>
                <ol className="pl-4 space-y-1 list-decimal">
                  {arr<string>(sc.interviewQuestions).filter((_, i) => i % 3 === 0).slice(0, 3).map((q, i) => <li key={i}>{q}</li>)}
                </ol>
              </div>
              <div>
                <h4 className="section-title">師傅問題</h4>
                <ol className="pl-4 space-y-1 list-decimal">
                  {arr<string>(sc.interviewQuestions).filter((_, i) => i % 3 === 1).slice(0, 3).map((q, i) => <li key={i}>{q}</li>)}
                </ol>
              </div>
              <div>
                <h4 className="section-title">屋主問題</h4>
                <ol className="pl-4 space-y-1 list-decimal">
                  {arr<string>(sc.interviewQuestions).filter((_, i) => i % 3 === 2).slice(0, 3).map((q, i) => <li key={i}>{q}</li>)}
                </ol>
              </div>
            </div>
          ) : <p className="text-gray-400 italic text-sm">載入中...</p>}
        </section>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 mt-5 -mx-4 lg:-mx-8 px-4 lg:px-8 py-3 bg-beige-50 border-t border-warm-200 flex justify-between items-center gap-3">
        <span className="text-xs text-gray-400 hidden sm:inline">內容依目前案場資料自動產生，可隨時更新</span>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={handleRefresh} disabled={aiStatus === 'loading'}>
            {btnLabel}
          </button>
          <button className="btn" onClick={handleDownloadPack}>下載製片包</button>
        </div>
      </div>
    </div>
  );
}

function downloadFile(md: string, filename: string) {
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename.replace(/[\\/:*?"<>|]/g, '_')}_${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
