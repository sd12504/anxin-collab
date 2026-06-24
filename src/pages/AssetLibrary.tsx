import { useRef, useState } from 'react';
import { FileText, Pencil, Trash2, Upload, X } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { DropdownSelect } from '../components/ui/DropdownSelect';
import type { Asset, AssetType } from '../types';

const assetTypes: AssetType[] = ['Before', '施工中', '完工', '設計圖', '參考圖', '訪談素材', '可剪Shorts片段'];

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

  const filtered = assets.filter(a => {
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

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const targetCaseId = uploadCaseId || cases[0]?.id || '';
    setUploading(true);
    try {
      for (const [index, file] of Array.from(files).entries()) {
        const type = getUploadType(file);
        const canPreview = file.type.startsWith('image/') || file.type.startsWith('video/');
        const previewUrl = canPreview ? await readFileAsDataUrl(file) : null;
        await addAsset({
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

  const confirmRemoveAsset = async () => {
    const asset = pendingDeleteAsset;
    if (!asset) return;
    try {
      await deleteAsset(asset.id);
    } catch (err) {
      alert('刪除失敗：' + (err as Error).message);
    }
    setPendingDeleteAsset(null);
  };

  const openEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setEditName(asset.name);
    setEditCaseId(asset.caseId);
    setEditType(asset.type);
  };

  const saveEditingAsset = async () => {
    if (!editingAsset) return;
    try {
      await updateAsset(editingAsset.id, {
        name: editName.trim() || editingAsset.name,
        caseId: editCaseId,
        type: editType,
      });
    } catch (err) {
      alert('儲存失敗：' + (err as Error).message);
    }
    setEditingAsset(null);
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-5 lg:py-7">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="font-serif text-xl font-semibold">素材庫</h2>
          <p className="text-sm text-gray-500 mt-1">所有案件上傳的圖片、影片與設計檔。</p>
        </div>
        <button
          className="btn btn-primary btn-sm flex items-center gap-2"
          onClick={() => {
            setUploadCaseId(cases[0]?.id || '');
            setUploadOpen(true);
          }}
        >
          <Upload size={14} /> 上傳素材
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-1 flex-wrap">
          {['all', ...assetTypes].map(t => (
            <button
              key={t}
              className={`btn btn-sm whitespace-nowrap ${filterType === t ? 'bg-olive-100 border-olive-400 text-olive-700' : ''}`}
              onClick={() => setFilterType(t as AssetType | 'all')}
            >
              {t === 'all' ? '全部素材' : t}
            </button>
          ))}
        </div>
        {cases.length > 0 && (
          <DropdownSelect
            value={filterCase}
            options={[{ value: 'all', label: '所有案件' }, ...cases.map(c => ({ value: c.id, label: c.name || '未命名' }))]}
            onChange={setFilterCase}
            ariaLabel="選擇案件"
          />
        )}
        <input
          className="input flex-1 min-w-[180px] max-w-xs"
          placeholder="搜尋素材名稱"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <FileText size={32} className="mx-auto mb-3 opacity-40" />
          <p>尚無素材</p>
          <p className="text-xs mt-1">上傳圖片、影片或設計圖面，會依案件與類型自動分類。</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(asset => (
            <div key={asset.id} className="card p-2 group">
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 mb-2 relative">
                {asset.previewUrl ? (
                  asset.previewUrl.startsWith('data:video') ? (
                    <video src={asset.previewUrl} className="h-full w-full object-cover" controls />
                  ) : (
                    <img src={asset.previewUrl} alt={asset.name} className="h-full w-full object-cover" />
                  )
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-300">
                    <FileText size={28} />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                  <button
                    className="w-7 h-7 rounded bg-white/90 text-gray-600 hover:text-olive-700 inline-flex items-center justify-center"
                    onClick={() => openEditAsset(asset)}
                    title="編輯"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    className="w-7 h-7 rounded bg-white/90 text-gray-600 hover:text-red-500 inline-flex items-center justify-center"
                    onClick={() => setPendingDeleteAsset(asset)}
                    title="刪除"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div className="text-xs font-medium truncate">{asset.name}</div>
              <div className="text-[0.6rem] text-gray-400 mt-0.5">
                <span className="badge bg-warm-100 text-gray-500">{asset.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/35 px-4 py-6 flex items-center justify-center" onClick={() => setUploadOpen(false)}>
          <div className="card w-full max-w-sm p-5 shadow-2xl" onClick={e => e.stopPropagation()} role="dialog">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-semibold">上傳素材</h3>
              <button className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 inline-flex items-center justify-center" onClick={() => setUploadOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              {cases.length > 0 && (
                <div>
                  <span className="text-xs text-gray-500 mb-1 block">歸屬案件</span>
                  <DropdownSelect
                    value={uploadCaseId || cases[0]?.id || ''}
                    options={cases.map(c => ({ value: c.id, label: c.name || '未命名' }))}
                    onChange={setUploadCaseId}
                    ariaLabel="歸屬案件"
                  />
                </div>
              )}
              <div>
                <span className="text-xs text-gray-500 mb-1 block">素材類型</span>
                <DropdownSelect
                  value={uploadType}
                  options={assetTypes}
                  onChange={v => setUploadType(v as AssetType)}
                  ariaLabel="素材類型"
                />
              </div>
              <label className="block">
                <span className="text-xs text-gray-500 mb-1 block">選擇檔案</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf"
                  className="input w-full"
                  onChange={e => handleUpload(e.target.files)}
                />
              </label>
              {uploading && <p className="text-sm text-olive-600">上傳中...</p>}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 bg-gray-900/35 px-4 py-6 flex items-center justify-center" onClick={() => setEditingAsset(null)}>
          <div className="card w-full max-w-sm p-5 shadow-2xl" onClick={e => e.stopPropagation()} role="dialog">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-semibold">編輯素材</h3>
              <button className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 inline-flex items-center justify-center" onClick={() => setEditingAsset(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs text-gray-500 mb-1 block">素材名稱</span>
                <input className="input w-full" value={editName} onChange={e => setEditName(e.target.value)} />
              </label>
              <div>
                <span className="text-xs text-gray-500 mb-1 block">歸屬案件</span>
                <DropdownSelect
                  value={editCaseId}
                  options={cases.map(c => ({ value: c.id, label: c.name || '未命名' }))}
                  onChange={setEditCaseId}
                  ariaLabel="歸屬案件"
                />
              </div>
              <div>
                <span className="text-xs text-gray-500 mb-1 block">素材類型</span>
                <DropdownSelect
                  value={editType}
                  options={assetTypes}
                  onChange={v => setEditType(v as AssetType)}
                  ariaLabel="素材類型"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button className="btn btn-sm" onClick={() => setEditingAsset(null)}>取消</button>
                <button className="btn btn-primary btn-sm" onClick={saveEditingAsset}>儲存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {pendingDeleteAsset && (
        <div className="fixed inset-0 z-50 bg-gray-900/35 px-4 py-6 flex items-center justify-center" onClick={() => setPendingDeleteAsset(null)}>
          <section className="card w-full max-w-sm p-5 shadow-2xl" role="dialog" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-serif text-lg font-semibold text-gray-900">刪除素材</h2>
                <p className="text-sm text-gray-500 mt-1">此操作無法復原。</p>
              </div>
              <button className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 inline-flex items-center justify-center" onClick={() => setPendingDeleteAsset(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="rounded-lg border border-warm-200 bg-warm-50/60 p-3 mb-5">
              <div className="text-xs text-gray-400 mb-1">素材名稱</div>
              <div className="text-sm font-semibold text-gray-800 break-words">{pendingDeleteAsset.name}</div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-sm" onClick={() => setPendingDeleteAsset(null)}>取消</button>
              <button className="btn btn-sm bg-red-500 border-red-500 text-white hover:bg-red-600" onClick={confirmRemoveAsset}>
                刪除素材
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
