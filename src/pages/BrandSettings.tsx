import { useStore } from '../hooks/useStore';

export default function BrandSettings() {
  const { brandSettings, updateBrandSettings } = useStore();

  const update = (field: string, value: string) => {
    updateBrandSettings({ [field]: value });
  };

  return (
    <div className="max-w-screen-lg mx-auto px-8 py-7">
      <h2 className="font-serif text-xl mb-5">品牌設定</h2>

      <div className="card p-6 mb-5">
        <h3 className="font-serif font-semibold mb-4">品牌核心</h3>
        <div className="space-y-4">
          <div>
            <label className="label">品牌核心價值</label>
            <input className="input" value={brandSettings.coreValues} onChange={e => update('coreValues', e.target.value)} />
            <div className="text-xs text-gray-400 mt-1">用逗號分隔，例：安心、專業、真誠、透明</div>
          </div>
          <div>
            <label className="label">品牌語氣</label>
            <textarea className="input" rows={2} value={brandSettings.tone} onChange={e => update('tone', e.target.value)} />
            <div className="text-xs text-gray-400 mt-1">描述品牌對外溝通的基本語氣</div>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-5">
        <h3 className="font-serif font-semibold mb-4">用詞規則</h3>
        <div className="space-y-4">
          <div>
            <label className="label">常用詞與金句</label>
            <textarea className="input" rows={2} value={brandSettings.commonPhrases} onChange={e => update('commonPhrases', e.target.value)} />
          </div>
          <div>
            <label className="label">禁用詞</label>
            <textarea className="input" rows={2} value={brandSettings.forbiddenWords} onChange={e => update('forbiddenWords', e.target.value)} />
            <div className="text-xs text-gray-400 mt-1">用逗號分隔，AI mock 產出時將避免使用這些詞</div>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-5">
        <h3 className="font-serif font-semibold mb-4">內容語氣設定</h3>
        <div className="space-y-4">
          <div>
            <label className="label">標題風格</label>
            <input className="input" value={brandSettings.titleStyle} onChange={e => update('titleStyle', e.target.value)} />
          </div>
          <div>
            <label className="label">腳本語氣</label>
            <input className="input" value={brandSettings.scriptTone} onChange={e => update('scriptTone', e.target.value)} />
          </div>
          <div>
            <label className="label">社群文案語氣</label>
            <input className="input" value={brandSettings.socialCopyTone} onChange={e => update('socialCopyTone', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
