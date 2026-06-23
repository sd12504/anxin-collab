import { useState, useEffect } from 'react';
import type { CaseData, CaseStage, Shootable, HouseCondition, ShootStatus } from '../types';
import { useStore } from '../hooks/useStore';
import { Combobox } from './ui/Combobox';
import { motion } from 'framer-motion';

interface Props {
  editId: string | null;
  onSave: (data: Partial<CaseData>) => void;
  onClose: () => void;
}

export default function CaseModal({ editId, onSave, onClose }: Props) {
  const { cases } = useStore();
  const existing = editId ? cases.find(c => c.id === editId) : null;

  const [name, setName] = useState(existing?.name || '');
  const [designer, setDesigner] = useState(existing?.designer || '');
  const [region, setRegion] = useState(existing?.region || '');
  const [area, setArea] = useState(existing?.area || '');
  const [houseCondition, setHouseCondition] = useState<HouseCondition>(existing?.houseCondition || '中古屋');
  const [designStyle, setDesignStyle] = useState(existing?.designStyle || '');
  const [stage, setStage] = useState<CaseStage>(existing?.stage || '接案');
  const [shootStatus, setShootStatus] = useState<ShootStatus>(existing?.shootStatus || '未安排');
  const [shootable, setShootable] = useState<Shootable>(existing?.shootable || '可');
  const [photographer, setPhotographer] = useState(existing?.photographer || '');
  const [editor, setEditor] = useState(existing?.editor || '');
  const [ownerName, setOwnerName] = useState(existing?.ownerName || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      designer: designer.trim(),
      region: region.trim(),
      area: area.trim(),
      houseCondition,
      designStyle: designStyle.trim(),
      stage,
      shootStatus,
      shootable,
      photographer: photographer.trim(),
      editor: editor.trim(),
      ownerName: ownerName.trim(),
    });
  };

  const houseConditions: HouseCondition[] = ['新成屋', '中古屋', '老屋', '商空'];
  const stages: CaseStage[] = ['接案', '丈量', '設計中', '施工中', '完工'];
  const shootStatuses: ShootStatus[] = ['未安排', '準備中', '拍攝中', '已拍攝', '剪輯中', '已完成'];

  return (
    <motion.div
      className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className="bg-white rounded-lg p-7 max-w-lg w-[90%] max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-serif text-lg">{editId ? '編輯案場' : '新增案場'}</h3>
          <button className="text-gray-400 hover:text-gray-600 text-xl" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">案場名稱</label><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="例：三重陳宅老屋翻新" required /></div>
            <div><label className="label">設計師</label><input className="input" value={designer} onChange={e => setDesigner(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">地區</label><input className="input" value={region} onChange={e => setRegion(e.target.value)} placeholder="例：新北市三重區" /></div>
            <div><label className="label">坪數</label><input className="input" value={area} onChange={e => setArea(e.target.value)} placeholder="例：32" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">屋況</label><Combobox items={houseConditions} value={houseCondition} onChange={v => setHouseCondition(v as HouseCondition)} /></div>
            <div><label className="label">設計風格</label><input className="input" value={designStyle} onChange={e => setDesignStyle(e.target.value)} placeholder="例：現代簡約" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">案件階段</label><Combobox items={stages} value={stage} onChange={v => setStage(v as CaseStage)} /></div>
            <div><label className="label">拍攝狀態</label><Combobox items={shootStatuses} value={shootStatus} onChange={v => setShootStatus(v as ShootStatus)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">攝影</label><input className="input" value={photographer} onChange={e => setPhotographer(e.target.value)} /></div>
            <div><label className="label">剪輯</label><input className="input" value={editor} onChange={e => setEditor(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">屋主稱呼</label><input className="input" value={ownerName} onChange={e => setOwnerName(e.target.value)} /></div>
            <div>
              <label className="label">可否拍攝</label>
              <div className="flex gap-4 pt-1">
                {(['可', '需確認', '不可'] as Shootable[]).map(v => (
                  <label key={v} className="flex items-center gap-1 text-sm cursor-pointer">
                    <input type="radio" name="shootable" value={v} checked={shootable === v} onChange={() => setShootable(v)} /> {v}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary">儲存</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
