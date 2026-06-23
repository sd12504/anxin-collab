import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import type { Asset, AssetType } from '../types';

const assetTypes: AssetType[] = ['Before', '施工中', '完工', '設計圖', '參考圖', '訪談素材', '可剪Shorts片段'];

export default function AssetLibrary() {
  const { cases, editingId, setEditingId, assets, addAsset } = useStore();
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCase, setFilterCase] = useState<string>(editingId || 'all');

  const filteredByCase = filterCase === 'all' ? assets : assets.filter(a => a.caseId === filterCase);
  const filtered = filterType === 'all' ? filteredByCase : filteredByCase.filter(a => a.type === filterType);

  const currentCase = filterCase !== 'all' ? cases.find(c => c.id === filterCase) : null;

  const handleAddMock = () => {
    if (filterCase === 'all') return;
    const now = new Date().toISOString();
    const types: AssetType[] = ['Before', '施工中', '完工', '設計圖'];
    addAsset({
      id: 'asset-' + Date.now(),
      caseId: filterCase,
      type: types[Math.floor(Math.random() * types.length)],
      name: `${currentCase?.name || '素材'} ${new Date().toLocaleDateString('zh-TW')}`,
      previewUrl: null,
      uploadDate: now,
      tags: [],
      used: false,
      note: '',
    });
  };

  return (
    <div className="max-w-screen-xl mx-auto px-8 py-7">
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-serif text-xl">素材庫</h2>
        <div className="flex gap-3">
          <select className="input w-auto" value={filterCase} onChange={e => setFilterCase(e.target.value)}>
            <option value="all">所有案件</option>
            {cases.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input w-auto" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">所有類型</option>
            {assetTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {filterCase !== 'all' && <button className="btn btn-primary btn-sm" onClick={handleAddMock}>＋ 新增素材</button>}
        </div>
      </div>

      {cases.length === 0 && (
        <div className="text-center py-12 text-gray-400">尚無案場。素材庫會在建立案場後自動產生對應資料夾結構。</div>
      )}

      {cases.length > 0 && filterCase === 'all' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {cases.map(c => (
            assetTypes.map(t => (
              <div key={`${c.id}-${t}`} className="card p-4 text-center cursor-pointer hover:border-olive-400 transition-colors" onClick={() => { setFilterCase(c.id); setFilterType(t); }}>
                <div className="text-2xl mb-2">📁</div>
                <div className="font-semibold text-xs">{t}</div>
                <div className="text-xs text-gray-400 mt-1">{c.name}</div>
              </div>
            ))
          ))}
        </div>
      )}

      {filterCase !== 'all' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map(a => (
            <div key={a.id} className="card p-4">
              <div className="text-3xl text-center mb-2">{a.previewUrl ? <img src={a.previewUrl} alt={a.name} className="w-full h-32 object-cover rounded" /> : '🖼️'}</div>
              <div className="font-semibold text-xs">{a.name}</div>
              <div className="text-xs text-gray-400 flex gap-2 mt-1">
                <span className="badge bg-olive-50 text-olive-600">{a.type}</span>
                <span>{new Date(a.uploadDate).toLocaleDateString('zh-TW')}</span>
              </div>
              <div className="mt-2 flex gap-2">
                <span className={`badge ${a.used ? 'badge-a' : 'bg-stone-100 text-stone-500'}`}>{a.used ? '已使用' : '未使用'}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="col-span-full text-center py-8 text-gray-400">此案件尚無素材。點擊「＋ 新增素材」開始建立。</div>}
        </div>
      )}
    </div>
  );
}
