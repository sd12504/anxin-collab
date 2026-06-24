import { useState } from 'react';
import type { CaseData, CaseStage, HouseCondition, ShootStatus, Shootable, Visibility } from '../types';
import { useStore } from '../hooks/useStore';
import { motion } from 'framer-motion';
import { DropdownSelect } from './ui/DropdownSelect';

interface Props {
  editId: string | null;
  onSave: (data: Partial<CaseData>) => void;
  onClose: () => void;
}

const caseStages: CaseStage[] = ['接案', '丈量', '設計中', '施工中', '完工'];
const shootStatuses: ShootStatus[] = ['企劃中', '拍攝前置', '拍攝中', '後期製作', '已完成'];
const houseConditions: HouseCondition[] = ['新成屋', '中古屋', '老屋', '商空'];
const shootableOptions: Shootable[] = ['可露出', '未確認', '不建議'];
const visibilityOptions: Visibility[] = ['可露出', '需遮蔽', '不可露出', '未確認'];

export default function CaseModal({ editId, onSave, onClose }: Props) {
  const { cases } = useStore();
  const existing = editId ? cases.find(c => c.id === editId) : null;

  const [name, setName] = useState(existing?.name || '');
  const [designer, setDesigner] = useState(existing?.designer || '');
  const [region, setRegion] = useState(existing?.region || '');
  const [area, setArea] = useState(existing?.area || '');
  const [coverImage, setCoverImage] = useState<string | null>(existing?.coverImage || null);
  const [houseCondition, setHouseCondition] = useState<HouseCondition>(existing?.houseCondition || '中古屋');
  const [designStyle, setDesignStyle] = useState(existing?.designStyle || '');
  const [stage, setStage] = useState<CaseStage>(existing?.stage || '接案');
  const [shootStatus, setShootStatus] = useState<ShootStatus>(existing?.shootStatus || '企劃中');
  const [shootable, setShootable] = useState<Shootable>(existing?.shootable || '可露出');
  const [photographer, setPhotographer] = useState(existing?.photographer || '');
  const [editor, setEditor] = useState(existing?.editor || '');
  const [ownerName, setOwnerName] = useState(existing?.ownerName || '');
  const [addrVisible, setAddrVisible] = useState<Visibility>(existing?.addrVisible || '未確認');
  const [ownerVisible, setOwnerVisible] = useState<Visibility>(existing?.ownerVisible || '可露出');
  const [budgetMention, setBudgetMention] = useState<'可露出' | '不可露出'>(existing?.budgetMention || '不可露出');
  const [floorplanVisible, setFloorplanVisible] = useState<Visibility>(existing?.floorplanVisible || '可露出');
  const [brandVisible, setBrandVisible] = useState<Visibility>(existing?.brandVisible || '未確認');
  const [commercialLicense, setCommercialLicense] = useState<Visibility>(existing?.commercialLicense || '未確認');
  const [brandRestrict, setBrandRestrict] = useState(existing?.brandRestrict || '');
  const [otherRestrict, setOtherRestrict] = useState(existing?.otherRestrict || '');

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCoverImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      designer: designer.trim(),
      region: region.trim(),
      area: area.trim(),
      coverImage,
      houseCondition,
      designStyle: designStyle.trim(),
      stage,
      shootStatus,
      shootable,
      photographer: photographer.trim(),
      editor: editor.trim(),
      ownerName: ownerName.trim(),
      addrVisible,
      ownerVisible,
      budgetMention,
      floorplanVisible,
      brandVisible,
      commercialLicense,
      brandRestrict: brandRestrict.trim(),
      otherRestrict: otherRestrict.trim(),
    });
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className="bg-[#faf8f4] rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <form onSubmit={handleSubmit} className="p-5 lg:p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h3 className="font-serif text-xl font-semibold">{editId ? '編輯案場' : '新增案場'}</h3>
              <p className="text-sm text-gray-500 mt-1">這裡和協作板案件詳情使用同一套欄位。</p>
            </div>
            <button type="button" className="text-gray-400 hover:text-gray-600 text-2xl leading-none" onClick={onClose}>&times;</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 mb-5">
            <div className="rounded-lg overflow-hidden bg-gray-100 border border-warm-200">
              <div className="aspect-[4/3] relative">
                {coverImage ? (
                  <img src={coverImage} alt={name || '案場圖片'} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-gray-400 bg-warm-50">
                    <div className="text-sm font-medium">尚未設定圖片</div>
                    <div className="text-xs">新增案場時可先留空</div>
                  </div>
                )}
                <label className="absolute right-3 bottom-3 btn btn-sm bg-white/90 hover:bg-white cursor-pointer">
                  {coverImage ? '更換圖片' : '上傳圖片'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageChange} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
              <EditableText label="案件名稱" value={name} onChange={setName} required />
              <EditableSelect label="案件階段" value={stage} options={caseStages} onChange={v => setStage(v as CaseStage)} />
              <EditableSelect label="拍攝進度" value={shootStatus} options={shootStatuses} onChange={v => setShootStatus(v as ShootStatus)} />
              <EditableSelect label="是否適合拍攝" value={shootable} options={shootableOptions} onChange={v => setShootable(v as Shootable)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <EditableText label="地區" value={region} onChange={setRegion} placeholder="例：台北市" />
            <EditableText label="坪數" value={area} onChange={setArea} placeholder="例：32" />
            <EditableSelect label="屋況" value={houseCondition} options={houseConditions} onChange={v => setHouseCondition(v as HouseCondition)} />
            <EditableText label="設計風格" value={designStyle} onChange={setDesignStyle} placeholder="例：現代簡約" />
            <EditableText label="設計師" value={designer} onChange={setDesigner} />
            <EditableText label="攝影" value={photographer} onChange={setPhotographer} />
            <EditableText label="剪輯" value={editor} onChange={setEditor} />
            <EditableText label="屋主" value={ownerName} onChange={setOwnerName} />
            <EditableSelect label="地址入鏡" value={addrVisible} options={visibilityOptions} onChange={v => setAddrVisible(v as Visibility)} />
            <EditableSelect label="屋主入鏡" value={ownerVisible} options={visibilityOptions} onChange={v => setOwnerVisible(v as Visibility)} />
            <EditableSelect label="預算提及" value={budgetMention} options={['可露出', '不可露出']} onChange={v => setBudgetMention(v as '可露出' | '不可露出')} />
            <EditableSelect label="平面圖露出" value={floorplanVisible} options={visibilityOptions} onChange={v => setFloorplanVisible(v as Visibility)} />
            <EditableSelect label="品牌露出" value={brandVisible} options={visibilityOptions} onChange={v => setBrandVisible(v as Visibility)} />
            <EditableSelect label="商用授權" value={commercialLicense} options={visibilityOptions} onChange={v => setCommercialLicense(v as Visibility)} />
            <EditableText label="品牌限制" value={brandRestrict} onChange={setBrandRestrict} />
            <EditableText label="其他限制" value={otherRestrict} onChange={setOtherRestrict} />
          </div>

          <div className="flex justify-end gap-3 pt-5">
            <button type="button" className="btn" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary">儲存</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function EditableText({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="rounded-lg border border-warm-200 bg-white/80 p-3 block">
      <span className="text-xs text-gray-400 mb-1 block">{label}</span>
      <input
        className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || '未填'}
        required={required}
      />
    </label>
  );
}

function EditableSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-lg border border-warm-200 bg-white/80 p-3 block">
      <span className="text-xs text-gray-400 mb-1 block">{label}</span>
      <DropdownSelect
        value={value}
        options={options}
        onChange={onChange}
        ariaLabel={label}
      />
    </div>
  );
}
