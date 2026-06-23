import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/', label: '總覽' },
  { to: '/cases', label: '案例管理' },
  { to: '/collab', label: '協作板' },
  { to: '/production', label: '製片工具' },
  { to: '/library', label: '素材庫' },
  { to: '/export', label: '輸出中心' },
  { to: '/brand', label: '品牌設定' },
  { to: '/settings', label: '系統設定' },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== Top Nav ===== */}
      <nav className="sticky top-0 z-50 h-[52px] bg-white border-b border-warm-300 flex items-center justify-between px-4 lg:px-7">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-2 flex-shrink-0" onClick={() => setMenuOpen(false)}>
          <span className="font-serif font-semibold text-[1.05rem] lg:text-[1.1rem] text-olive-500 tracking-wide">安心整合</span>
          <span className="text-[0.7rem] lg:text-xs text-gray-400 hidden sm:inline">設計協作板</span>
        </NavLink>

        {/* Desktop tabs */}
        <div className="hidden lg:flex gap-0.5">
          {tabs.map(t => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-olive-100 text-olive-500 font-semibold'
                    : 'text-gray-500 hover:text-olive-500 hover:bg-olive-50'
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop user */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-gray-400">
          <span>攝影剪輯</span>
          <span className="w-7 h-7 rounded-full bg-olive-100 text-olive-500 flex items-center justify-center font-semibold text-xs">攝</span>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded hover:bg-olive-50 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? '關閉選單' : '開啟選單'}
          aria-expanded={menuOpen}
        >
          <svg width="20" height="16" viewBox="0 0 20 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? (
              <>
                <line x1="3" y1="3" x2="17" y2="13" />
                <line x1="17" y1="3" x2="3" y2="13" />
              </>
            ) : (
              <>
                <line x1="2" y1="2" x2="18" y2="2" />
                <line x1="2" y1="8" x2="18" y2="8" />
                <line x1="2" y1="14" x2="18" y2="14" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* ===== Mobile Menu Overlay ===== */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 top-[52px] z-40 bg-black/30" onClick={() => setMenuOpen(false)} />
      )}

      {/* ===== Mobile Menu Panel ===== */}
      <div
        className={`lg:hidden fixed top-[52px] right-0 z-40 w-56 bg-white border-l border-warm-300 h-[calc(100vh-52px)] overflow-y-auto shadow-lg transition-transform duration-200 ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="py-3">
          {tabs.map(t => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block px-5 py-3 text-sm transition-colors border-l-3 ${
                  isActive
                    ? 'bg-olive-50 text-olive-500 font-semibold border-l-olive-500'
                    : 'text-gray-600 hover:bg-olive-50 border-l-transparent'
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>
        <div className="border-t border-warm-200 mx-4 pt-3 text-xs text-gray-400 flex items-center gap-2 px-1">
          <span className="w-7 h-7 rounded-full bg-olive-100 text-olive-500 flex items-center justify-center font-semibold text-xs">攝</span>
          <span>攝影剪輯</span>
        </div>
      </div>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
