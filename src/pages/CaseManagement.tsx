import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { computeGrade } from '../utils/grading';
import type { CaseData } from '../types';
import CaseModal from '../components/CaseModal';

const STAGES = ['接案', '丈量', '設計中', '施工中', '完工'];
const PAGE_SIZE = 8;

export default function CaseManagement() {
  const { cases, addCase, updateCase, deleteCase, setEditingId } = useStore();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState('');
  const [page, setPage] = useState(0);

  const filtered = filterStage ? cases.filter(c => c.stage === filterStage) : cases;
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleSave = (data: Partial<CaseData>) => {
    if (editId) { updateCase(editId, data); }
    else {
      const now = new Date().toISOString();
      addCase({
        id: 'case-' + Date.now(), name: '', region: '', area: '', houseCondition: '中古屋', designStyle: '',
        stage: '接案', shootStatus: '企劃中', shootable: '可露出',
        designer: '', photographer: '', editor: '', ownerName: '',
        createdBy: '管理員', updatedBy: '管理員', createdAt: now, updatedAt: now,
        problem: '', highlight: '', beforeAfter: '普通', beforeAfterNote: '',
        beforeImage: null, afterImage: null, mustShoot: '', designerExplain: '',
        masterExplain: '', ownerStory: '', materialColor: '', specialCraft: '',
        addrVisible: '未確認', ownerVisible: '可露出', budgetMention: '不可露出',
        floorplanVisible: '可露出', brandVisible: '未確認', commercialLicense: '未確認',
        brandRestrict: '', otherRestrict: '', designerSuggest: [], grade: null,
        ...data,
      });
    }
    setModalOpen(false); setEditId(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <h2 className="font-serif text-xl">案例管理</h2>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {['', ...STAGES].map(s => (
              <button key={s || 'all'} className={`btn btn-sm ${filterStage === s ? 'bg-olive-100 border-olive-400 text-olive-700' : ''}`}
                onClick={() => { setFilterStage(s); setPage(0); }}>{s || '全部'}</button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditId(null); setModalOpen(true); }}>＋ 新增案件</button>
        </div>
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="px-4 py-3 font-medium">案件名稱</th>
              <th className="px-4 py-3 font-medium">地區 / 坪數</th>
              <th className="px-4 py-3 font-medium">案件階段</th>
              <th className="px-4 py-3 font-medium">拍攝進度</th>
              <th className="px-4 py-3 font-medium">拍攝等級</th>
              <th className="px-4 py-3 font-medium">更新日期</th>
              <th className="px-4 py-3 font-medium w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paged.map(c => {
              const g = computeGrade(c);
              const bClass = g.grade === 'A' ? 'badge-a' : g.grade === 'B' ? 'badge-b' : g.grade === 'C' ? 'badge-c' : 'badge-d';
              return (
                <tr key={c.id} className="hover:bg-white/40 cursor-pointer" onClick={() => { setEditingId(c.id); navigate('/collab'); }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">{c.name?.charAt(0) || '?'}</span>
                      <span className="font-semibold">{c.name || '未命名'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.region || '—'} {c.area ? `/ ${c.area}坪` : ''}</td>
                  <td className="px-4 py-3"><span className="badge bg-gray-100 text-gray-600">{c.stage}</span></td>
                  <td className="px-4 py-3"><span className="badge bg-olive-50 text-olive-700">{c.shootStatus}</span></td>
                  <td className="px-4 py-3"><span className={`badge ${bClass}`}>{g.grade} {g.label}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(c.updatedAt).toLocaleDateString('zh-TW')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="w-8 h-8 rounded-lg text-gray-500 hover:text-olive-700 hover:bg-olive-50 inline-flex items-center justify-center transition-colors" onClick={e => { e.stopPropagation(); setEditId(c.id); setModalOpen(true); }} title="編輯" aria-label={`編輯 ${c.name || '案件'}`}>
                        <Pencil size={15} strokeWidth={2} />
                      </button>
                      <button className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 inline-flex items-center justify-center transition-colors" onClick={e => { e.stopPropagation(); if (confirm('確定刪除這個案件？')) deleteCase(c.id); }} title="刪除" aria-label={`刪除 ${c.name || '案件'}`}>
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {paged.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">尚無案場</td></tr>}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-400">{filtered.length} 筆案件</span>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} className={`btn btn-sm ${page === i ? 'bg-olive-100 border-olive-400' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {paged.map(c => {
          const g = computeGrade(c);
          const bClass = g.grade === 'A' ? 'badge-a' : g.grade === 'B' ? 'badge-b' : g.grade === 'C' ? 'badge-c' : 'badge-d';
          return (
            <div key={c.id} className="card p-4 cursor-pointer" onClick={() => { setEditingId(c.id); navigate('/collab'); }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">{c.name?.charAt(0) || '?'}</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{c.name || '未命名'}</div>
                    <div className="text-xs text-gray-400">{c.region} · {c.area}坪</div>
                  </div>
                </div>
                <span className={`badge ${bClass} flex-shrink-0`}>{g.grade} {g.label}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                <span className="badge bg-gray-100 text-gray-600">{c.stage}</span>
                <span className="badge bg-olive-50 text-olive-700">{c.shootStatus}</span>
                <span>{new Date(c.updatedAt).toLocaleDateString('zh-TW')}</span>
              </div>
              <div className="flex gap-2">
                <button className="w-9 h-9 rounded-lg text-gray-500 hover:text-olive-700 hover:bg-olive-50 inline-flex items-center justify-center transition-colors border border-gray-200" onClick={e => { e.stopPropagation(); setEditId(c.id); setModalOpen(true); }} title="編輯" aria-label={`編輯 ${c.name || '案件'}`}>
                  <Pencil size={16} strokeWidth={2} />
                </button>
                <button className="w-9 h-9 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 inline-flex items-center justify-center transition-colors flex-shrink-0 border border-gray-200" onClick={e => { e.stopPropagation(); if (confirm('確定刪除這個案件？')) deleteCase(c.id); }} title="刪除" aria-label={`刪除 ${c.name || '案件'}`}>
                  <Trash2 size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          );
        })}
        {paged.length === 0 && <div className="py-8 text-center text-gray-400">尚無案場</div>}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} className={`btn btn-sm ${page === i ? 'bg-olive-100 border-olive-400' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>

      {modalOpen && <CaseModal editId={editId} onSave={handleSave} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
