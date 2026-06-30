import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Archive,
  ClipboardList,
  PenLine,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { DropdownSelect } from '../components/ui/DropdownSelect';
import { computeGrade, getCompletion } from '../utils/grading';
import type { CaseData, CaseStage, HouseCondition, ShootStatus, Shootable, Visibility } from '../types';

const caseStages: CaseStage[] = ['接案', '丈量', '設計中', '施工中', '完工'];
const shootStatuses: ShootStatus[] = ['企劃中', '拍攝前置', '拍攝中', '後期製作', '已完成'];
const houseConditions: HouseCondition[] = ['新成屋', '中古屋', '老屋', '商空'];
const shootableOptions: Shootable[] = ['可露出', '未確認', '不建議'];
const visibilityOptions: Visibility[] = ['可露出', '需遮蔽', '不可露出', '未確認'];

export default function CollabBoard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cases, editingId, setEditingId, updateCase } = useStore();
  const caseIdFromUrl = searchParams.get('caseId');
  const currentId = caseIdFromUrl || editingId;
  const current = currentId ? cases.find(c => c.id === currentId) : cases[0] || null;
  const [detailOpen, setDetailOpen] = useState<'case' | 'questions' | null>(null);

  useEffect(() => {
    if (cases.length === 0) return;

    const urlCase = caseIdFromUrl ? cases.find(c => c.id === caseIdFromUrl) : null;
    if (urlCase) {
      if (editingId !== urlCase.id) setEditingId(urlCase.id);
      return;
    }

    const stateCase = editingId ? cases.find(c => c.id === editingId) : null;
    const fallbackId = stateCase?.id || cases[0].id;
    if (editingId !== fallbackId) setEditingId(fallbackId);
    setSearchParams({ caseId: fallbackId }, { replace: true });
  }, [cases, editingId, caseIdFromUrl, setEditingId, setSearchParams]);

  const selectCase = (id: string) => {
    setEditingId(id);
    setSearchParams({ caseId: id });
  };

  if (!current) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-10 text-center text-gray-400">
        尚無案件，請先至「案例管理」新增案件。
      </div>
    );
  }

  const grade = computeGrade(current);
  const completion = getCompletion(current);

  const update = (patch: Partial<CaseData>) => updateCase(current.id, patch);

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ coverImage: reader.result as string });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-gray-900">協作板</h1>
          <p className="text-sm text-gray-500 mt-1">從案件盤點、引導問題到素材管理，一次看清楚下一步。</p>
        </div>
        <DropdownSelect
          className="lg:w-72"
          buttonClassName="input"
          value={current.id}
          options={cases.map(c => ({ value: c.id, label: c.name || '未命名' }))}
          onChange={selectCase}
          ariaLabel="選擇案件"
        />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr_0.85fr] gap-4 mb-4">
        <WorkflowCard
          step="1"
          title="目前案件總覽"
          description={`${current.region} · ${current.area}坪 · 案件階段：${current.stage} · 拍攝進度：${current.shootStatus}`}
          Icon={ClipboardList}
          accent="bg-olive-600"
          className="lg:row-span-2"
          actionLabel="查看詳情"
          onAction={() => setDetailOpen('case')}
        >
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg font-semibold text-gray-900">{current.name}</h2>
              <p className="text-xs text-gray-500 mt-1">{current.designer || '未指定設計師'} · {current.houseCondition}</p>
            </div>
            <span className="badge badge-a whitespace-nowrap">{grade.grade} {grade.label}</span>
          </div>
        </WorkflowCard>

        <WorkflowCard
          step="2"
          title="設計師引導問題"
          description={`已完成 ${completion.done} / ${completion.total}`}
          Icon={PenLine}
          accent="bg-rose-400"
          actionLabel="繼續填寫"
          onAction={() => setDetailOpen('questions')}
        >
          <ProgressBar value={completion.pct} />
        </WorkflowCard>

        <WorkflowCard
          step="3"
          title="素材庫"
          description="管理圖片、影片與設計圖面"
          Icon={Archive}
          accent="bg-amber-400"
          actionLabel="前往素材庫"
          onAction={() => navigate('/library')}
        />
      </section>

      {detailOpen === 'case' && (
        <Modal
          title="案件詳情"
          subtitle="這裡只看案場基本資訊；要補拍攝內容請到「設計師引導問題」。"
          onClose={() => setDetailOpen(null)}
          action={
            <button className="btn btn-sm" onClick={() => navigate('/cases')}>到案例管理</button>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 mb-5">
            <div className="rounded-lg overflow-hidden bg-gray-100 border border-warm-200">
              <div className="aspect-[4/3] relative">
                {current.coverImage ? (
                  <img src={current.coverImage} alt={`${current.name} 案件圖片`} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-gray-400 bg-warm-50">
                    <div className="text-sm font-medium">尚未設定圖片</div>
                    <div className="text-xs">上傳後會同步到協作板</div>
                  </div>
                )}
                <label className="absolute right-3 bottom-3 btn btn-sm bg-white/90 hover:bg-white cursor-pointer">
                  {current.coverImage ? '更換圖片' : '上傳圖片'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageChange} />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
              <EditableText label="案件名稱" value={current.name} onChange={value => update({ name: value })} />
              <EditableSelect label="案件階段" value={current.stage} options={caseStages} onChange={value => update({ stage: value as CaseStage })} />
              <EditableSelect label="拍攝進度" value={current.shootStatus} options={shootStatuses} onChange={value => update({ shootStatus: value as ShootStatus })} />
              <DetailItem label="拍攝建議" value={`${grade.grade} ${grade.label}`} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <EditableText label="地區" value={current.region} onChange={value => update({ region: value })} />
            <EditableText label="坪數" value={current.area} onChange={value => update({ area: value })} />
            <EditableSelect label="屋況" value={current.houseCondition} options={houseConditions} onChange={value => update({ houseCondition: value as HouseCondition })} />
            <EditableText label="設計風格" value={current.designStyle} onChange={value => update({ designStyle: value })} />
            <EditableText label="設計師" value={current.designer} onChange={value => update({ designer: value })} />
            <EditableText label="屋主" value={current.ownerName} onChange={value => update({ ownerName: value })} />
            <EditableSelect label="是否適合拍攝" value={current.shootable} options={shootableOptions} onChange={value => update({ shootable: value as Shootable })} />
            <EditableSelect label="屋主入鏡" value={current.ownerVisible} options={visibilityOptions} onChange={value => update({ ownerVisible: value as Visibility })} />
            <EditableSelect label="預算提及" value={current.budgetMention} options={['可露出', '不可露出']} onChange={value => update({ budgetMention: value as '可露出' | '不可露出' })} />
            <EditableSelect label="平面圖露出" value={current.floorplanVisible} options={visibilityOptions} onChange={value => update({ floorplanVisible: value as Visibility })} />
          </div>
        </Modal>
      )}

      {detailOpen === 'questions' && (
        <Modal
          title="設計師引導問題"
          subtitle="把案件最值得拍的地方整理清楚，企劃書會同步更新。"
          onClose={() => setDetailOpen(null)}
          action={
            <span className="text-xs text-gray-400">{completion.pct}% 完成</span>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="1. 屋主原本遇到什麼問題？" value={current.problem} onChange={v => update({ problem: v })} />
            <Field label="2. 這個案子最值得被看到的是什麼？" value={current.highlight} onChange={v => update({ highlight: v })} />
            <Field label="3. 哪些畫面一定要拍？" value={current.mustShoot} onChange={v => update({ mustShoot: v })} />
            <Field label="4. 設計師可以怎麼解釋？" value={current.designerExplain} onChange={v => update({ designerExplain: v })} />
            <Field label="5. 工法或師傅細節" value={current.masterExplain} onChange={v => update({ masterExplain: v })} />
            <Field label="6. 屋主故事或使用情境" value={current.ownerStory} onChange={v => update({ ownerStory: v })} />
            <Field label="7. 材質與色彩重點" value={current.materialColor} onChange={v => update({ materialColor: v })} />
            <Field label="8. 特殊工法或注意事項" value={current.specialCraft} onChange={v => update({ specialCraft: v })} />
            <Field
              label="9. Before / After 反差說明"
              value={current.beforeAfterNote}
              onChange={v => update({ beforeAfterNote: v, beforeAfter: v.trim() ? '有' : '普通' })}
              placeholder="例：拆除前壁癌嚴重、動線卡；完工後採光變好、收納增加、浴室乾濕分離。"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  subtitle,
  action,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-gray-900/35 px-3 py-4 sm:px-6 lg:px-8 flex items-start justify-center overflow-y-auto" onClick={onClose}>
      <section className="w-full max-w-5xl rounded-xl border border-warm-200 bg-[#faf8f4] p-5 lg:p-6 my-4 shadow-2xl" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="collab-modal-title">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <h2 className="font-serif text-lg font-semibold">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {action}
            <button className="w-9 h-9 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 inline-flex items-center justify-center transition-colors" onClick={onClose} aria-label="關閉">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="max-h-[calc(100vh-9rem)] overflow-y-auto pr-1">
          {children}
        </div>
      </section>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-warm-200 bg-white/60 p-3">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-800 break-words">{value || '未填'}</div>
    </div>
  );
}

function EditableText({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="rounded-lg border border-warm-200 bg-white/60 p-3 block">
      <span className="text-xs text-gray-400 mb-1 block">{label}</span>
      <input className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="未填" />
    </label>
  );
}

function EditableSelect({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <div className="rounded-lg border border-warm-200 bg-white/60 p-3 block">
      <span className="text-xs text-gray-400 mb-1 block">{label}</span>
      <DropdownSelect value={value} options={options} onChange={onChange} ariaLabel={label} />
    </div>
  );
}

function WorkflowCard({
  step,
  title,
  description,
  Icon,
  accent,
  actionLabel,
  onAction,
  disabled,
  children,
  className = '',
}: {
  step: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  accent: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={`card p-5 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-9 h-9 rounded-full ${accent} text-white flex items-center justify-center text-sm font-bold flex-shrink-0`}>
            {step}
          </span>
          <div className="min-w-0">
            <h3 className="font-serif text-base font-semibold text-gray-900 truncate">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
        </div>
        <Icon size={22} className="text-olive-600 flex-shrink-0" />
      </div>
      {children}
      <button className="btn btn-sm mt-5" onClick={onAction} disabled={disabled}>
        {actionLabel}
      </button>
    </article>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-5">
      <div className="h-2 bg-warm-200 rounded-full overflow-hidden">
        <div className="h-full bg-olive-500 rounded-full transition-all" style={{ width: `${value}%` }} />
      </div>
      <div className="text-right text-xs text-gray-400 mt-2">{value}%</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <textarea className="input min-h-[88px]" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}
