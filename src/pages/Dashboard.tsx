import { useStore } from '../hooks/useStore';
import { computeGrade } from '../utils/grading';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { cases, setEditingId } = useStore();
  const navigate = useNavigate();
  const grades = cases.map(c => computeGrade(c));
  const aCount = grades.filter(g => g.grade === 'A').length;
  const bCount = grades.filter(g => g.grade === 'B').length;
  const pendingCount = cases.filter(c => !c.problem || c.problem.trim().length < 5).length;

  const recent = [...cases].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 6);

  const openCase = (id: string) => {
    setEditingId(id);
    navigate('/collab');
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-5 lg:py-7">
      {/* KPI cards: 2-col mobile, 4-col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5 lg:mb-7">
        <div className="card p-4 lg:p-5">
          <div className="text-[0.7rem] lg:text-xs text-gray-400">進行中案場</div>
          <div className="text-2xl lg:text-3xl font-bold font-serif mt-0.5">{cases.length}</div>
          <div className="text-[0.65rem] lg:text-xs text-gray-400 mt-0.5">含待填寫與拍攝中</div>
        </div>
        <div className="card p-4 lg:p-5">
          <div className="text-[0.7rem] lg:text-xs text-gray-400">A 旗艦版</div>
          <div className="text-2xl lg:text-3xl font-bold font-serif text-olive-600 mt-0.5">{aCount}</div>
          <div className="text-[0.65rem] lg:text-xs text-gray-400 mt-0.5">品牌代表案例</div>
        </div>
        <div className="card p-4 lg:p-5">
          <div className="text-[0.7rem] lg:text-xs text-gray-400">B 專業版</div>
          <div className="text-2xl lg:text-3xl font-bold font-serif text-olive-500 mt-0.5">{bCount}</div>
          <div className="text-[0.65rem] lg:text-xs text-gray-400 mt-0.5">故事敘事 + 設計細節</div>
        </div>
        <div className="card p-4 lg:p-5">
          <div className="text-[0.7rem] lg:text-xs text-gray-400">待補拍素材</div>
          <div className="text-2xl lg:text-3xl font-bold font-serif text-amber-600 mt-0.5">{pendingCount}</div>
          <div className="text-[0.65rem] lg:text-xs text-gray-400 mt-0.5">Before / 施工中 / 特寫</div>
        </div>
      </div>

      {/* Recent cases */}
      <div className="card overflow-hidden">
        <div className="px-4 lg:px-5 py-3 lg:py-4 border-b border-warm-200 font-semibold text-sm">最近案場</div>

        {/* Desktop: table */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-warm-100">
                <th className="px-5 py-2.5 font-medium">案場</th>
                <th className="px-5 py-2.5 font-medium">設計師</th>
                <th className="px-5 py-2.5 font-medium">階段</th>
                <th className="px-5 py-2.5 font-medium">拍攝等級</th>
                <th className="px-5 py-2.5 font-medium">更新時間</th>
              </tr>
            </thead>
            <tbody>
              {recent.length ? recent.map(c => {
                const g = computeGrade(c);
                return (
                  <tr key={c.id} className="border-b border-warm-100 last:border-0 hover:bg-olive-50 cursor-pointer" onClick={() => openCase(c.id)}>
                    <td className="px-5 py-3 font-medium">{c.name}</td>
                    <td className="px-5 py-3">{c.designer}</td>
                    <td className="px-5 py-3">{c.stage}</td>
                    <td className="px-5 py-3"><span className={`badge badge-${g.grade.toLowerCase()}`}>{g.grade} {g.label}</span></td>
                    <td className="px-5 py-3 text-xs text-gray-400">{new Date(c.updatedAt).toLocaleDateString('zh-TW')}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={5} className="px-5 py-7 text-center text-gray-400">尚無案場資料</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile: cards */}
        <div className="md:hidden divide-y divide-warm-100">
          {recent.length ? recent.map(c => {
            const g = computeGrade(c);
            return (
              <button
                key={c.id}
                className="w-full text-left px-4 py-3 hover:bg-olive-50 transition-colors block"
                onClick={() => openCase(c.id)}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-semibold text-sm truncate">{c.name}</span>
                  <span className={`badge badge-${g.grade.toLowerCase()} flex-shrink-0`}>{g.grade} {g.label}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                  <span>{c.designer}</span>
                  <span>·</span>
                  <span>{c.stage}</span>
                  <span>·</span>
                  <span>{new Date(c.updatedAt).toLocaleDateString('zh-TW')}</span>
                </div>
              </button>
            );
          }) : (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">尚無案場資料</div>
          )}
        </div>
      </div>
    </div>
  );
}
