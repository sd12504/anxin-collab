import { useStore } from '../hooks/useStore';
import { computeGrade } from '../utils/grading';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { cases, setEditingId } = useStore();
  const navigate = useNavigate();

  const shootCounts = { '企劃中': 0, '拍攝前置': 0, '拍攝中': 0, '後期製作': 0, '已完成': 0 } as Record<string, number>;
  cases.forEach(c => { if (shootCounts[c.shootStatus] !== undefined) shootCounts[c.shootStatus]++; });
  const total = cases.length;
  const doneCount = shootCounts['已完成'];

  const recent = [...cases].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 6);

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <h2 className="font-serif text-xl mb-5">總覽</h2>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 mb-6">
        <KpiCard label="總案件數" value={total} color="text-gray-700" />
        <KpiCard label="企劃中" value={shootCounts['企劃中']} color="text-amber-600" />
        <KpiCard label="拍攝前置" value={shootCounts['拍攝前置']} color="text-blue-600" />
        <KpiCard label="拍攝中" value={shootCounts['拍攝中']} color="text-olive-600" />
        <KpiCard label="後期製作" value={shootCounts['後期製作']} color="text-purple-600" />
        <KpiCard label="已完成" value={shootCounts['已完成']} color="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Progress ring */}
        <div className="card p-6 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 mb-4">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#f0ebe0" strokeWidth="5" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#6B8343" strokeWidth="5"
                strokeDasharray={`${total ? (doneCount / total) * 88 : 0} 88`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold font-serif text-olive-600">{doneCount}</span>
            </div>
          </div>
          <div className="text-sm font-semibold">已完成案件</div>
          <div className="text-xs text-gray-400 mt-1">{total ? Math.round((doneCount / total) * 100) : 0}% 完成率</div>
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
            <button className="btn btn-primary w-full text-sm" onClick={() => { if (cases[0]) { setEditingId(cases[0].id); navigate('/collab'); } }}>進入協作板</button>
            <button className="btn w-full text-sm" onClick={() => navigate('/cases')}>案例管理</button>
            <button className="btn w-full text-sm" onClick={() => navigate('/export')}>輸出中心</button>
          </div>
        </div>
      </div>

      {/* Recent cases */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 font-semibold text-sm">近期案件</div>
        <div className="divide-y divide-gray-50">
          {recent.length ? recent.map(c => {
            const g = computeGrade(c);
            const bClass = g.grade === 'A' ? 'badge-a' : g.grade === 'B' ? 'badge-b' : g.grade === 'C' ? 'badge-c' : 'badge-d';
            return (
              <div key={c.id} className="px-5 py-3 flex items-center gap-4 hover:bg-white/40 cursor-pointer text-sm"
                onClick={() => { setEditingId(c.id); navigate('/collab'); }}>
                <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
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

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card p-4 lg:p-5">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl lg:text-3xl font-bold font-serif ${color}`}>{value}</div>
    </div>
  );
}
