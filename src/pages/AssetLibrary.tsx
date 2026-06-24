import { useMemo, useRef, useState } from 'react';
import { FileText, Trash2, Upload, X } from 'lucide-react';
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
  const { cases, assets, addAsset, deleteAsset } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all');
  const [filterCase, setFilterCase] = useState('all');
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
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
    if (filterType !== 'all') return filterType;
    if (file.type.startsWith('video/')) return '訪談素材';
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return '設計圖';
    return '參考圖';
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

    const targetCaseId = filterCase === 'all' ? cases[0]?.id : filterCase;
    if (!targetCaseId) {
      alert('請先新增案件，再上傳素材。');
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,application/pdf"
            multiple
            className="hidden"
            onChange={handleUploadFiles}
          />
          <button
            className="btn btn-primary flex items-center justify-center gap-2"
            onClick={() => fileInputRef.current?.click()}
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
                <button
                  type="button"
                  className="absolute right-2 top-2 z-10 w-8 h-8 rounded-lg bg-white/90 border border-white/80 text-red-500 shadow-sm flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  onClick={() => setPendingDeleteAsset(a)}
                  aria-label={`移除 ${a.name}`}
                  title="移除素材"
                >
                  <Trash2 size={15} />
                </button>
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
