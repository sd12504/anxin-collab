import { useStore } from '../hooks/useStore';
import { computeGrade } from '../utils/grading';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Clapperboard, Clock3, Layers3, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { cases, setEditingId } = useStore();
  const navigate = useNavigate();

  const openCollabCase = (id: string) => {
    setEditingId(id);
    navigate(`/collab?caseId=${encodeURIComponent(id)}`);
  };

  const shootCounts = { '企劃中': 0, '拍攝前置': 0, '拍攝中': 0, '後期製作': 0, '已完成': 0 } as Record<string, number>;
  cases.forEach(c => { if (shootCounts[c.shootStatus] !== undefined) shootCounts[c.shootStatus]++; });
  const total = cases.length;
  const doneCount = shootCounts['已完成'];
  const activeCount = total - doneCount;
  const completionPct = total ? Math.round((doneCount / total) * 100) : 0;

  const recent = [...cases].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <header className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-olive-700 mb-2">安心整合工作台</p>
            <h1 className="font-serif text-2xl lg:text-3xl font-semibold text-gray-950">今天的案場進度</h1>
            <p className="text-sm text-gray-500 mt-2">快速掌握拍攝狀態、完成率與最近更新的案件。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => cases[0] ? openCollabCase(cases[0].id) : navigate('/cases')}>
              <Clapperboard size={16} />
              進入協作板
            </button>
            <button className="btn" onClick={() => navigate('/cases')}>
              <BriefcaseBusiness size={16} />
              管理案件
            </button>
          </div>
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 lg:gap-4 mb-6">
        <KpiCard label="總案件數" value={total} color="text-gray-800" icon={<Layers3 size={17} />} />
        <KpiCard label="進行中" value={activeCount} color="text-olive-700" icon={<Clock3 size={17} />} />
        <KpiCard label="企劃中" value={shootCounts['企劃中']} color="text-amber-600" />
        <KpiCard label="拍攝前置" value={shootCounts['拍攝前置']} color="text-blue-600" />
        <KpiCard label="後期製作" value={shootCounts['後期製作']} color="text-purple-600" />
        <KpiCard label="已完成" value={doneCount} color="text-emerald-600" icon={<CheckCircle2 size={17} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_0.85fr] gap-6 mb-6">
        {/* Progress ring */}
        <div className="card p-6 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-5">
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#f0ebe0" strokeWidth="5" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#6B8343" strokeWidth="5"
                strokeDasharray={`${total ? (doneCount / total) * 88 : 0} 88`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold font-serif text-olive-700">{completionPct}%</span>
              <span className="text-[0.65rem] text-gray-400">完成率</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-olive-50 px-3 py-1 text-xs font-semibold text-olive-700 mb-3">
              <Sparkles size={14} />
              拍攝管線
            </div>
            <h2 className="font-serif text-lg font-semibold text-gray-950">已完成 {doneCount} 件，進行中 {activeCount} 件</h2>
            <p className="text-sm text-gray-500 mt-2">保持每個案件的素材、訪談和限制條件同步，輸出時會更穩。</p>
          </div>
        </div>

        {/* Stage distribution */}
        <div className="card p-6">
          <div className="font-semibold text-sm mb-4">拍攝進度分佈</div>
          <div className="space-y-3">
            {[
              { label: '企劃中', count: shootCounts['企劃中'], color: 'bg-amber-400' },
              { label: '拍攝前置', count: shootCounts['拍攝前置'], color: 'bg-blue-400' },
              { label: '拍攝中', count: shootCounts['拍攝中'], color: 'bg-olive-500' },
              { label: '後期製作', count: shootCounts['後期製作'], color: 'bg-purple-400' },
              { label: '已完成', count: shootCounts['已完成'], color: 'bg-emerald-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">{item.label}</span><span>{item.count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color} transition-all`}
                    style={{ width: `${total ? (item.count / total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card p-6">
          <div className="font-semibold text-sm mb-4">快速操作</div>
          <div className="space-y-2">
            <button className="btn btn-primary w-full text-sm justify-between" onClick={() => { if (cases[0]) openCollabCase(cases[0].id); }}>
              進入協作板
              <ArrowRight size={15} />
            </button>
            <button className="btn w-full text-sm justify-between" onClick={() => navigate('/cases')}>
              案例管理
              <ArrowRight size={15} />
            </button>
            <button className="btn w-full text-sm justify-between" onClick={() => navigate('/export')}>
              輸出中心
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Recent cases */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-sm">近期案件</div>
            <div className="text-xs text-gray-400 mt-0.5">依更新時間排序</div>
          </div>
          <button className="btn btn-sm hidden sm:inline-flex" onClick={() => navigate('/cases')}>查看全部</button>
        </div>
        <div className="divide-y divide-gray-50">
          {recent.length ? recent.map(c => {
            const g = computeGrade(c);
            const bClass = g.grade === 'A' ? 'badge-a' : g.grade === 'B' ? 'badge-b' : g.grade === 'C' ? 'badge-c' : 'badge-d';
            return (
              <div key={c.id} className="px-5 py-3 flex items-center gap-4 hover:bg-white/50 cursor-pointer text-sm transition-colors"
                onClick={() => openCollabCase(c.id)}>
                <span className="w-9 h-9 rounded-lg bg-olive-50 text-olive-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {c.name?.charAt(0) || '?'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-gray-400">{c.region} · {c.area}坪 · {c.stage} · {c.shootStatus}</div>
                </div>
                <span className={`badge ${bClass} flex-shrink-0`}>{g.grade} {g.label}</span>
                <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:inline">{new Date(c.updatedAt).toLocaleDateString('zh-TW')}</span>
              </div>
            );
          }) : (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">尚無案場</div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color, icon }: { label: string; value: number; color: string; icon?: React.ReactNode }) {
  return (
    <div className="card p-4 lg:p-5">
      <div className="text-xs text-gray-400 mb-1 flex items-center justify-between gap-2">
        <span>{label}</span>
        {icon && <span className="text-olive-600">{icon}</span>}
      </div>
      <div className={`text-2xl lg:text-3xl font-bold font-serif ${color}`}>{value}</div>
    </div>
  );
}
