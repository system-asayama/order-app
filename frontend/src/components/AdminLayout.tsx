import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { to: '/admin', icon: '📊', label: 'ダッシュボード', exact: true },
  { to: '/admin/matches', icon: '⚽', label: '試合管理' },
  { to: '/admin/bets', icon: '🎯', label: 'ベット一覧' },
  { to: '/admin/sports', icon: '🏅', label: 'スポーツ管理' },
  { to: '/admin/users', icon: '👥', label: 'ユーザー管理' },
  { to: '/ranking', icon: '🏆', label: 'ランキング' },
];

const SIDEBAR_BG = '#111827';
const BORDER = '1px solid rgba(255,255,255,0.06)';
const GOLD = '#f0b429';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const SidebarInner = ({ onNav }: { onNav?: () => void }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '20px', borderBottom: BORDER }}>
        <button onClick={() => { navigate('/admin'); onNav?.(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#f0b429,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚽</div>
          <div>
            <span style={{ fontFamily: 'Rajdhani, sans-serif', color: GOLD, fontWeight: 700, fontSize: 14, letterSpacing: 2, display: 'block' }}>SPORT BET SIM</span>
            <span style={{ fontSize: 11, color: '#64748b' }}>管理者パネル</span>
          </div>
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.exact} onClick={onNav}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px', borderTop: BORDER }}>
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(240,180,41,0.15)', color: GOLD }}>管理者</span>
            </div>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e1', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
          </div>
          <button onClick={logout} style={{ fontSize: 12, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', marginLeft: 8, flexShrink: 0 }}>
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a' }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside style={{ width: 240, flexShrink: 0, background: SIDEBAR_BG, borderRight: BORDER }}>
          <SidebarInner />
        </aside>
      )}

      {/* Mobile overlay */}
      {isMobile && drawerOpen && (
        <div onClick={() => setDrawerOpen(false)}
             style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.65)' }} />
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <aside style={{
          position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 50,
          width: 260, background: SIDEBAR_BG, borderRight: BORDER,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.23,1,0.32,1)',
        }}>
          <button onClick={() => setDrawerOpen(false)}
                  style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          <SidebarInner onNav={() => setDrawerOpen(false)} />
        </aside>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile top bar */}
        {isMobile && (
          <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: SIDEBAR_BG, borderBottom: BORDER, flexShrink: 0 }}>
            <button onClick={() => setDrawerOpen(true)}
                    style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 6, background: 'none', border: 'none', cursor: 'pointer' }}>
              <span style={{ display: 'block', width: 20, height: 2, background: GOLD, borderRadius: 1 }} />
              <span style={{ display: 'block', width: 20, height: 2, background: GOLD, borderRadius: 1 }} />
              <span style={{ display: 'block', width: 20, height: 2, background: GOLD, borderRadius: 1 }} />
            </button>
            <span style={{ fontFamily: 'Rajdhani, sans-serif', color: GOLD, fontWeight: 700, fontSize: 14, letterSpacing: 2 }}>SPORT BET SIM</span>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(240,180,41,0.15)', color: GOLD }}>管理者</span>
            </div>
          </header>
        )}
        <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
      </div>
    </div>
  );
}
