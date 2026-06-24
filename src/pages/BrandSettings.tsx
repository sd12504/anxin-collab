import { useStore } from '../hooks/useStore';

const forbiddenWords = ['最低價', '保證完美', '絕對', '第一名', '史上最強', '只有我們會', '比一般師傅好太多', '超簡單', '0 難度'];

export default function BrandSettings() {
  const { brandSettings, updateBrandSettings } = useStore();

  const update = (field: string, value: string) => updateBrandSettings({ [field]: value });

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <h2 className="font-serif text-xl mb-5">品牌設定</h2>

      <div className="card p-5 lg:p-6 mb-5">
        <h3 className="font-serif font-semibold mb-4">品牌核心</h3>
        <div className="space-y-4">
          <div>
            <label className="label">核心價值</label>
            <input className="input" value={brandSettings.coreValues} onChange={e => update('coreValues', e.target.value)} />
          </div>
          <div>
            <label className="label">品牌語氣</label>
            <textarea className="input" rows={2} value={brandSettings.tone} onChange={e => update('tone', e.target.value)} />
          </div>
          <div>
            <label className="label">常用詞與金句</label>
            <textarea className="input" rows={2} value={brandSettings.commonPhrases} onChange={e => update('commonPhrases', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card p-5 lg:p-6 mb-5">
        <h3 className="font-serif font-semibold mb-4">禁用詞</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {forbiddenWords.map(w => (
            <span key={w} className="badge badge-d">{w}</span>
          ))}
        </div>
        <div>
          <label className="label">自訂禁用詞（逗號分隔）</label>
          <textarea className="input" rows={2} value={brandSettings.forbiddenWords} onChange={e => update('forbiddenWords', e.target.value)} />
        </div>
      </div>

      <div className="card p-5 lg:p-6">
        <h3 className="font-serif font-semibold mb-4">內容語氣</h3>
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
