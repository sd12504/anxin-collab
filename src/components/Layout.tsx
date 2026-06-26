import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive, BriefcaseBusiness, Download, Home, LayoutDashboard,
  Search, Settings, ShieldCheck, Bell, LogOut, Menu, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../hooks/useStore';

const tabs = [
  { to: '/', label: '總覽', Icon: Home },
  { to: '/cases', label: '案例管理', Icon: BriefcaseBusiness },
  { to: '/collab', label: '協作板', Icon: LayoutDashboard },
  { to: '/library', label: '素材庫', Icon: Archive },
  { to: '/export', label: '輸出中心', Icon: Download },
  { to: '/brand', label: '品牌設定', Icon: ShieldCheck },
  { to: '/settings', label: '系統設定', Icon: Settings },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [caseQuery, setCaseQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cases, setEditingId } = useStore();
  const normalizedQuery = caseQuery.trim().toLowerCase();
  const caseResults = normalizedQuery
    ? cases.filter(c => {
      const haystack = [c.name, c.region, c.designer, c.stage, c.shootStatus]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    }).slice(0, 5)
    : [];
  const showCaseResults = searchFocused && caseQuery.trim().length > 0;

  const openCase = (id: string) => {
    setEditingId(id);
    setCaseQuery('');
    setSearchFocused(false);
    setMenuOpen(false);
    navigate(`/collab?caseId=${encodeURIComponent(id)}`);
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {menuOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMenuOpen(false)} />}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-60
        bg-sidebar-500 text-white flex flex-col
        transition-transform duration-200 shadow-2xl shadow-sidebar-900/20
        ${menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-3 px-4 py-4 border-b border-white/8" onClick={() => setMenuOpen(false)}>
          <span className="w-9 h-9 rounded-lg bg-olive-500 flex items-center justify-center text-sm font-bold shadow-lg shadow-olive-900/20">安</span>
          <div>
            <div className="font-serif font-semibold text-base tracking-wide">安心整合</div>
            <div className="text-[0.65rem] text-white/45">Design Ops Workspace</div>
          </div>
        </NavLink>

        {/* Search */}
        <div className="px-3 py-3 relative">
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/7 text-white/45 text-xs border border-white/8 focus-within:border-olive-400/60 focus-within:text-white/80 transition-colors">
            <Search size={14} />
            <input
              className="w-full min-w-0 bg-transparent outline-none placeholder:text-white/35"
              placeholder="搜尋案件..."
              aria-label="搜尋案件"
              value={caseQuery}
              onChange={e => setCaseQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
              onKeyDown={e => {
                if (e.key === 'Enter' && caseResults[0]) openCase(caseResults[0].id);
                if (e.key === 'Escape') {
                  setCaseQuery('');
                  setSearchFocused(false);
                }
              }}
            />
          </label>
          {showCaseResults && (
            <div className="absolute left-3 right-3 top-[3.35rem] z-50 overflow-hidden rounded-lg border border-white/10 bg-sidebar-400 shadow-2xl shadow-sidebar-900/35">
              {caseResults.length > 0 ? (
                <div className="max-h-72 overflow-y-auto py-1">
                  {caseResults.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full px-3 py-2.5 text-left hover:bg-white/8 focus:bg-white/8 focus:outline-none transition-colors"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => openCase(c.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 text-sm font-semibold text-white truncate">{c.name || '未命名案件'}</span>
                        <ArrowRight size={14} className="text-white/35 flex-shrink-0" />
                      </div>
                      <div className="mt-1 text-[0.68rem] text-white/45 truncate">
                        {[c.region, c.designer, c.shootStatus].filter(Boolean).join(' · ') || '尚無補充資訊'}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-3 text-xs text-white/45">找不到符合的案件</div>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-3">
          {tabs.map(t => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-all duration-150 ${
                  isActive ? 'bg-white/12 text-white font-semibold shadow-[inset_3px_0_0_rgba(132,158,92,0.95)]' : 'text-white/58 hover:text-white hover:bg-white/7'
                }`
              }
            >
              <t.Icon size={17} strokeWidth={1.8} />
              {t.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom bar: notification + user */}
        <div className="px-4 py-3 border-t border-white/8 flex items-center gap-3">
          <button className="relative p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-colors" aria-label="通知">
            <Bell size={16} />
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-rose-400" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-olive-500 to-olive-700 flex items-center justify-center text-[0.6rem] font-bold flex-shrink-0">
              {(user?.displayName || user?.username || '管').charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate">{user?.displayName || user?.username || '管理員'}</div>
              <div className="text-[0.55rem] text-white/35">{user?.role || '使用者'}</div>
            </div>
          </div>
          <button
            className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-white/8 transition-colors"
            onClick={() => { logout(); navigate('/login', { replace: true }); }}
            title="登出"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-sidebar-500 flex items-center px-4 gap-3 shadow-lg shadow-sidebar-900/15">
        <button className="w-9 h-9 rounded-lg text-white/80 hover:text-white hover:bg-white/8 inline-flex items-center justify-center" onClick={() => setMenuOpen(true)} aria-label="開啟選單">
          <Menu size={20} />
        </button>
        <span className="w-8 h-8 rounded-lg bg-olive-500 flex items-center justify-center text-xs font-bold text-white">安</span>
        <span className="font-serif font-semibold text-sm text-white">安心整合</span>
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0 mt-14 lg:mt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
