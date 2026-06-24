import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive, BriefcaseBusiness, Download, Home, LayoutDashboard,
  PenTool, Search, Settings, ShieldCheck, Sparkles, Bell, LogOut,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const tabs = [
  { to: '/', label: '總覽', Icon: Home },
  { to: '/cases', label: '案例管理', Icon: BriefcaseBusiness },
  { to: '/collab', label: '協作板', Icon: LayoutDashboard },
  { to: '/production', label: '製片工具', Icon: PenTool },
  { to: '/library', label: '素材庫', Icon: Archive },
  { to: '/export', label: '輸出中心', Icon: Download },
  { to: '/brand', label: '品牌設定', Icon: ShieldCheck },
  { to: '/settings', label: '系統設定', Icon: Settings },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-[#faf8f4]">
      {/* Mobile overlay */}
      {menuOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMenuOpen(false)} />}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-56
        bg-[#151922] text-white flex flex-col
        transition-transform duration-200
        ${menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-2.5 px-4 py-4 border-b border-white/8" onClick={() => setMenuOpen(false)}>
          <span className="w-8 h-8 rounded-lg bg-olive-600 flex items-center justify-center text-sm font-bold">安</span>
          <div>
            <div className="font-serif font-semibold text-sm tracking-wide">安心整合</div>
            <div className="text-[0.6rem] text-white/40">設計協作板</div>
          </div>
        </NavLink>

        {/* Search */}
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/6 text-white/40 text-xs">
            <Search size={14} />
            <span>搜尋案件...</span>
          </div>
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
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all duration-150 ${
                  isActive ? 'bg-white/12 text-white font-semibold' : 'text-white/55 hover:text-white hover:bg-white/6'
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
          <button className="relative p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-colors">
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-12 bg-[#151922] flex items-center px-4 gap-3">
        <button className="text-white/80 hover:text-white" onClick={() => setMenuOpen(true)}>
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="1" y1="1" x2="17" y2="1" /><line x1="1" y1="7" x2="17" y2="7" /><line x1="1" y1="13" x2="17" y2="13" />
          </svg>
        </button>
        <span className="w-7 h-7 rounded-lg bg-olive-600 flex items-center justify-center text-xs font-bold text-white">安</span>
        <span className="font-serif font-semibold text-sm text-white">安心整合</span>
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0 mt-12 lg:mt-0">
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
