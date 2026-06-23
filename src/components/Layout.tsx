import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import {
  Archive,
  BriefcaseBusiness,
  Download,
  Home,
  LayoutDashboard,
  PenTool,
  Settings,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

type NavItem = {
  to: string;
  label: string;
  Icon: LucideIcon;
};

const tabs: NavItem[] = [
  { to: '/', label: '總覽', Icon: Home },
  { to: '/cases', label: '案例管理', Icon: BriefcaseBusiness },
  { to: '/collab', label: '協作板', Icon: LayoutDashboard },
  { to: '/production', label: '製片工具', Icon: PenTool },
  { to: '/library', label: '素材庫', Icon: Archive },
  { to: '/export', label: '輸出中心', Icon: Download },
  { to: '/brand', label: '品牌設定', Icon: ShieldCheck },
  { to: '/settings', label: '系統設定', Icon: Settings },
];

const sidebarVariants: Variants = {
  closed: {
    x: '-100%',
    transition: { type: 'spring', stiffness: 260, damping: 32 },
  },
  open: {
    x: 0,
    transition: { type: 'spring', stiffness: 260, damping: 30 },
  },
};

const itemVariants: Variants = {
  closed: { x: -18, opacity: 0 },
  open: (index: number) => ({
    x: 0,
    opacity: 1,
    transition: {
      delay: 0.08 + index * 0.035,
      type: 'spring',
      stiffness: 280,
      damping: 24,
    },
  }),
};

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-shell min-h-screen flex">
      <div className="app-grid-bg" aria-hidden="true" />

      <aside className="hidden lg:flex fixed top-0 left-0 z-40 h-screen w-60 flex-col bg-sidebar-500 text-white shadow-[18px_0_50px_rgba(18,24,35,0.18)]">
        <SidebarContent onNavigate={() => setMenuOpen(false)} />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-sidebar-500/95 backdrop-blur flex items-center px-4 gap-3 shadow-lg">
        <button
          className="group h-9 w-9 rounded-lg bg-white/10 text-white/85 hover:text-white hover:bg-white/15 inline-flex items-center justify-center"
          onClick={() => setMenuOpen(true)}
          aria-label="開啟選單"
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="1" y1="1" x2="17" y2="1" />
            <line x1="1" y1="7" x2="17" y2="7" />
            <line x1="1" y1="13" x2="17" y2="13" />
          </svg>
        </button>
        <span className="h-8 w-8 rounded-lg bg-olive-600 text-white inline-flex items-center justify-center text-sm font-bold">安</span>
        <div className="min-w-0">
          <div className="font-serif font-semibold text-sm text-white tracking-wide">安心整合</div>
          <div className="text-[0.65rem] text-white/45">設計協作板</div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              className="lg:hidden fixed top-0 left-0 z-50 h-screen w-72 max-w-[82vw] flex flex-col bg-sidebar-500 text-white shadow-2xl"
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              drag="x"
              dragConstraints={{ left: -280, right: 0 }}
              dragElastic={0.16}
              onDragEnd={(_, info) => {
                if (info.offset.x < -90) setMenuOpen(false);
              }}
            >
              <button
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 text-white/70 hover:bg-white/15 hover:text-white inline-flex items-center justify-center"
                onClick={() => setMenuOpen(false)}
                aria-label="關閉選單"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="2" y1="2" x2="14" y2="14" />
                  <line x1="14" y1="2" x2="2" y2="14" />
                </svg>
              </button>
              <SidebarContent onNavigate={() => setMenuOpen(false)} animated />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex-1 min-w-0 mt-14 lg:mt-0 lg:ml-60">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function SidebarContent({ onNavigate, animated = false }: { onNavigate: () => void; animated?: boolean }) {
  return (
    <>
      <NavLink
        to="/"
        className="flex items-center gap-3 px-5 py-5 border-b border-white/10 flex-shrink-0"
        onClick={onNavigate}
      >
        <span className="w-9 h-9 rounded-lg bg-olive-600 flex items-center justify-center text-sm font-bold shadow-[0_10px_30px_rgba(85,105,52,0.35)]">安</span>
        <div>
          <div className="font-serif font-semibold text-sm tracking-wide">安心整合</div>
          <div className="text-[0.65rem] text-white/45">室內設計影像企劃平台</div>
        </div>
      </NavLink>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {tabs.map((tab, index) => {
          const content = (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-all ${
                  isActive
                    ? 'bg-white/12 text-white font-semibold shadow-inner'
                    : 'text-white/58 hover:text-white hover:bg-white/7'
                }`
              }
            >
              <span className="w-8 h-8 rounded-lg bg-white/7 group-hover:bg-olive-600/90 inline-flex items-center justify-center transition-colors">
                <tab.Icon size={17} strokeWidth={1.8} />
              </span>
              {tab.label}
            </NavLink>
          );

          return animated ? (
            <motion.div key={tab.to} custom={index} variants={itemVariants} initial="closed" animate="open">
              {content}
            </motion.div>
          ) : content;
        })}
      </nav>

      <div className="px-5 py-4 border-t border-white/10 flex items-center gap-3 flex-shrink-0">
        <span className="w-9 h-9 rounded-full bg-beige-200 text-sidebar-500 flex items-center justify-center">
          <Sparkles size={16} />
        </span>
        <div>
          <div className="text-xs font-medium">攝影剪輯</div>
          <div className="text-[0.65rem] text-white/40">目前使用者</div>
        </div>
      </div>
    </>
  );
}
