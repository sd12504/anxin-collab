import { useMemo, useRef, useState } from 'react';
import { FileText, Pencil, Trash2, Upload, X } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import type { Asset, AssetType } from '../types';

const assetTypes: AssetType[] = ['Before', '施工中', '完工', '設計圖', '參考圖', '訪談素材', '可剪Shorts片段'];

const demoImages = [
  '/assets/cases/A1_MaBro_leak_01.jpg',
  '/assets/cases/A1_MaBro_leak_02.jpg',
  '/assets/cases/A1_MaBro_leak_03.jpg',
  '/assets/cases/A1_MaBro_leak_04.jpg',
  '/assets/cases/A1_MaBro_leak_05.jpg',
  '/assets/cases/A1_MaBro_leak_06.jpg',
  '/assets/cases/A1_MaBro_leak_07.jpg',
  '/assets/cases/A1_MaBro_leak_08.jpg',
];
const HIDDEN_DEMO_ASSETS_KEY = 'anxin_hidden_demo_assets_v1';

export default function AssetLibrary() {
  const { cases, assets, addAsset, updateAsset, deleteAsset } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all');
  const [filterCase, setFilterCase] = useState('all');
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadCaseId, setUploadCaseId] = useState('');
  const [uploadType, setUploadType] = useState<AssetType>('參考圖');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editName, setEditName] = useState('');
  const [editCaseId, setEditCaseId] = useState('');
  const [editType, setEditType] = useState<AssetType>('參考圖');
  const [pendingDeleteAsset, setPendingDeleteAsset] = useState<Asset | null>(null);
  const [hiddenDemoAssetIds, setHiddenDemoAssetIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(HIDDEN_DEMO_ASSETS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const demoAssets = useMemo<Asset[]>(() => {
    if (!cases.length) return [];
    return demoImages.map((previewUrl, index) => {
      const c = cases[index % cases.length];
      const type = assetTypes[index % assetTypes.length];
      return {
        id: `demo-asset-${index + 1}`,
        caseId: c.id,
        type,
        name: `${c.name} - ${type}`,
        previewUrl,
        uploadDate: new Date(Date.now() - index * 86400000).toISOString(),
        tags: [c.name, type],
        used: index % 3 === 0,
        note: '',
      };
    });
  }, [cases]);

  const visibleDemoAssets = demoAssets.filter(a => !hiddenDemoAssetIds.includes(a.id));
  const allAssets = [...visibleDemoAssets, ...assets];
  const filtered = allAssets.filter(a => {
    if (filterCase !== 'all' && a.caseId !== filterCase) return false;
    if (filterType !== 'all' && a.type !== filterType) return false;
    if (query.trim() && !a.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
    return true;
  });

  const getUploadType = (file: File): AssetType => {
    if (uploadType) return uploadType;
    if (file.type.startsWith('video/')) return '訪談素材';
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return '設計圖';
    return '參考圖';
  };

  const openUploadDialog = () => {
    setUploadCaseId(filterCase === 'all' ? cases[0]?.id || '' : filterCase);
    setUploadType(filterType === 'all' ? '參考圖' : filterType);
    setUploadOpen(true);
  };

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    const targetCaseId = uploadCaseId;
    if (!targetCaseId) {
      alert('請先選擇案件，再上傳素材。');
      return;
    }

    setUploading(true);
    try {
      for (const [index, file] of files.entries()) {
        const type = getUploadType(file);
        const canPreview = file.type.startsWith('image/') || file.type.startsWith('video/');
        const previewUrl = canPreview ? await readFileAsDataUrl(file) : null;
        addAsset({
          id: `asset-${Date.now()}-${index}`,
          caseId: targetCaseId,
          type,
          name: file.name.replace(/\.[^.]+$/, '') || file.name,
          previewUrl,
          uploadDate: new Date().toISOString(),
          tags: [type, file.type || 'file'],
          used: false,
          note: file.name,
        });
      }
    } catch {
      alert('檔案上傳失敗。若檔案很大，請先壓縮後再試一次。');
    } finally {
      setUploading(false);
      setUploadOpen(false);
    }
  };

  const confirmRemoveAsset = () => {
    const asset = pendingDeleteAsset;
    if (!asset) return;
    if (asset.id.startsWith('demo-asset-')) {
      setHiddenDemoAssetIds(prev => {
        const next = [...new Set([...prev, asset.id])];
        localStorage.setItem(HIDDEN_DEMO_ASSETS_KEY, JSON.stringify(next));
        return next;
      });
      setPendingDeleteAsset(null);
      return;
    }
    deleteAsset(asset.id);
    setPendingDeleteAsset(null);
  };

  const openEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setEditName(asset.name);
    setEditCaseId(asset.caseId);
    setEditType(asset.type);
  };

  const saveEditingAsset = () => {
    if (!editingAsset || editingAsset.id.startsWith('demo-asset-')) return;
    updateAsset(editingAsset.id, {
      name: editName.trim() || editingAsset.name,
      caseId: editCaseId,
      type: editType,
      tags: [...new Set([editType, ...editingAsset.tags.filter(tag => !assetTypes.includes(tag as AssetType))])],
    });
    setEditingAsset(null);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-0px)]">
      <aside className="w-full lg:w-60 bg-white/60 border-b lg:border-b-0 lg:border-r border-gray-100 p-4 flex flex-col">
        <h1 className="font-serif font-semibold text-xl mb-4">素材庫</h1>
        <label className="label" htmlFor="asset-case">案件</label>
        <select id="asset-case" className="input text-xs mb-3" value={filterCase} onChange={e => setFilterCase(e.target.value)}>
          <option value="all">所有案件</option>
          {cases.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
          {[{ label: '全部素材', value: 'all' as const }, ...assetTypes.map(t => ({ label: t, value: t }))].map(item => (
            <button
              key={item.value}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                filterType === item.value ? 'bg-olive-50 text-olive-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
              }`}
              onClick={() => setFilterType(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <input
              className="input sm:max-w-sm"
              placeholder="搜尋素材名稱"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <select className="input sm:max-w-[180px]" value={filterType} onChange={e => setFilterType(e.target.value as AssetType | 'all')}>
              <option value="all">全部類型</option>
              {assetTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button
            className="btn btn-primary flex items-center justify-center gap-2"
            onClick={openUploadDialog}
            disabled={uploading}
          >
            <Upload size={16} />
            {uploading ? '上傳中' : '上傳素材'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {filtered.map(a => {
            const c = cases.find(item => item.id === a.caseId);
            return (
              <article key={a.id} className="card overflow-hidden group relative">
                <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  {!a.id.startsWith('demo-asset-') && (
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg bg-white/90 border border-white/80 text-gray-500 shadow-sm flex items-center justify-center hover:text-olive-700 hover:bg-olive-50"
                      onClick={() => openEditAsset(a)}
                      aria-label={`編輯 ${a.name}`}
                      title="編輯素材"
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="w-8 h-8 rounded-lg bg-white/90 border border-white/80 text-red-500 shadow-sm flex items-center justify-center hover:bg-red-50"
                    onClick={() => setPendingDeleteAsset(a)}
                    aria-label={`移除 ${a.name}`}
                    title="移除素材"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="aspect-[4/3] bg-gray-100">
                  {a.previewUrl?.startsWith('data:video/') ? (
                    <video src={a.previewUrl} className="w-full h-full object-cover" controls muted playsInline />
                  ) : a.previewUrl ? (
                    <img src={a.previewUrl} alt={a.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
                      <FileText size={34} />
                      <span className="text-sm">檔案</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-sm font-semibold truncate">{a.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{c?.name || '未指定案件'}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="badge bg-olive-50 text-olive-600 text-[0.65rem]">{a.type}</span>
                    <span className="text-[0.65rem] text-gray-400">{new Date(a.uploadDate).toLocaleDateString('zh-TW')}</span>
                  </div>
                </div>
              </article>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-400 text-sm">尚無符合條件的素材</div>
          )}
        </div>
      </main>

      {editingAsset && (
        <div className="fixed inset-0 z-50 bg-gray-900/35 px-4 py-6 flex items-center justify-center" onClick={() => setEditingAsset(null)}>
          <section className="card w-full max-w-md p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="edit-asset-title" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 id="edit-asset-title" className="font-serif text-lg font-semibold text-gray-900">編輯素材</h2>
                <p className="text-sm text-gray-500 mt-1">調整素材名稱、歸屬案件與類型。</p>
              </div>
              <button className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 inline-flex items-center justify-center transition-colors" onClick={() => setEditingAsset(null)} aria-label="關閉">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="label">素材名稱</span>
                <input className="input" value={editName} onChange={e => setEditName(e.target.value)} />
              </label>
              <label className="block">
                <span className="label">對應案件</span>
                <select className="input" value={editCaseId} onChange={e => setEditCaseId(e.target.value)}>
                  {cases.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="label">素材類型</span>
                <select className="input" value={editType} onChange={e => setEditType(e.target.value as AssetType)}>
                  {assetTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button className="btn btn-sm" onClick={() => setEditingAsset(null)}>取消</button>
              <button className="btn btn-primary btn-sm" onClick={saveEditingAsset} disabled={!editCaseId}>儲存變更</button>
            </div>
          </section>
        </div>
      )}

      {uploadOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/35 px-4 py-6 flex items-center justify-center" onClick={() => setUploadOpen(false)}>
          <section className="card w-full max-w-md p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="upload-asset-title" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 id="upload-asset-title" className="font-serif text-lg font-semibold text-gray-900">上傳素材</h2>
                <p className="text-sm text-gray-500 mt-1">先選擇素材要歸到哪個案件與類型。</p>
              </div>
              <button className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 inline-flex items-center justify-center transition-colors" onClick={() => setUploadOpen(false)} aria-label="關閉">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="label">對應案件</span>
                <select className="input" value={uploadCaseId} onChange={e => setUploadCaseId(e.target.value)}>
                  <option value="" disabled>請選擇案件</option>
                  {cases.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="label">素材類型</span>
                <select className="input" value={uploadType} onChange={e => setUploadType(e.target.value as AssetType)}>
                  {assetTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,application/pdf"
                multiple
                className="hidden"
                onChange={handleUploadFiles}
              />
              <button
                className="btn btn-primary w-full flex items-center justify-center gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !uploadCaseId}
              >
                <Upload size={16} />
                {uploading ? '上傳中' : '選擇檔案並上傳'}
              </button>
            </div>
          </section>
        </div>
      )}

      {pendingDeleteAsset && (
        <div className="fixed inset-0 z-50 bg-gray-900/35 px-4 py-6 flex items-center justify-center" onClick={() => setPendingDeleteAsset(null)}>
          <section className="card w-full max-w-sm p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="delete-asset-title" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 id="delete-asset-title" className="font-serif text-lg font-semibold text-gray-900">移除素材</h2>
                <p className="text-sm text-gray-500 mt-1">這個素材會從素材庫中移除。</p>
              </div>
              <button className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 inline-flex items-center justify-center transition-colors" onClick={() => setPendingDeleteAsset(null)} aria-label="關閉">
                <X size={18} />
              </button>
            </div>
            <div className="rounded-lg border border-warm-200 bg-warm-50/60 p-3 mb-5">
              <div className="text-xs text-gray-400 mb-1">素材名稱</div>
              <div className="text-sm font-semibold text-gray-800 break-words">{pendingDeleteAsset.name}</div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-sm" onClick={() => setPendingDeleteAsset(null)}>取消</button>
              <button className="btn btn-sm bg-red-500 border-red-500 text-white hover:bg-red-600 hover:border-red-600" onClick={confirmRemoveAsset}>
                移除素材
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
