import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { computeGrade } from '../utils/grading';
import type { CaseData, CaseStage, Shootable, HouseCondition } from '../types';
import CaseModal from '../components/CaseModal';
import { Combobox } from '../components/ui/Combobox';

export default function CaseManagement() {
  const { cases, addCase, updateCase, deleteCase, setEditingId } = useStore();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState<string>('all');

  const filtered = filterStage === 'all' ? cases : cases.filter(c => c.stage === filterStage);

  const openEdit = (id: string) => { setEditId(id); setModalOpen(true); };
  const openNew = () => { setEditId(null); setModalOpen(true); };
  const openCollab = (id: string) => { setEditingId(id); navigate('/collab'); };

  const handleSave = (data: Partial<CaseData>) => {
    if (editId) {
      updateCase(editId, data);
    } else {
      const now = new Date().toISOString();
      addCase({
        id: 'case-' + Date.now(),
        name: '', region: '', area: '', houseCondition: '中古屋', designStyle: '',
        stage: '接案', shootStatus: '未安排', shootable: '可',
        designer: '', photographer: '', editor: '', ownerName: '',
        createdBy: '管理員', updatedBy: '管理員', createdAt: now, updatedAt: now,
        problem: '', highlight: '', beforeAfter: '普通', beforeAfterNote: '',
        beforeImage: null, afterImage: null, mustShoot: '', designerExplain: '',
        masterExplain: '', ownerStory: '', materialColor: '', specialCraft: '',
        addrVisible: '需確認', ownerVisible: '可', budgetMention: '不可',
        floorplanVisible: '可', brandVisible: '需確認', commercialLicense: '需確認',
        brandRestrict: '', otherRestrict: '', designerSuggest: [], grade: null,
        ...data,
      });
    }
    setModalOpen(false); setEditId(null);
  };

  const stages: CaseStage[] = ['接案', '丈量', '設計中', '施工中', '完工'];

  return (
    <div className="max-w-screen-xl mx-auto px-8 py-7">
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-serif text-xl">案例管理</h2>
        <div className="flex gap-3">
          <Combobox items={['所有階段', ...stages]} value={filterStage === 'all' ? '所有階段' : filterStage} onChange={v => setFilterStage(v === '所有階段' ? 'all' : v)} className="w-32" />
          <button className="btn btn-primary" onClick={openNew}>＋ 新案場</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => {
          const g = computeGrade(c);
          return (
            <div key={c.id} className="card p-5 cursor-pointer hover:border-olive-400 transition-colors" onClick={() => openCollab(c.id)}>
              <div className="font-semibold text-sm mb-1">{c.name || '未命名案場'}</div>
              <div className="text-xs text-gray-400 flex gap-3 flex-wrap">
                <span>{c.designer || '未指定'}</span>
                <span>{c.stage}</span>
                <span>{c.region}</span>
                <span>{c.area}坪</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={`badge badge-${g.grade.toLowerCase()}`}>{g.grade} {g.label}</span>
                <span className="badge bg-olive-50 text-olive-600">{c.shootable}拍</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="btn btn-sm" onClick={e => { e.stopPropagation(); openEdit(c.id); }}>編輯</button>
                <button className="btn btn-sm btn-danger" onClick={e => { e.stopPropagation(); if (confirm('刪除？')) deleteCase(c.id); }}>刪除</button>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">尚無案場，點擊「＋ 新案場」開始建立。</div>
      )}

      {modalOpen && <CaseModal editId={editId} onSave={handleSave} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
