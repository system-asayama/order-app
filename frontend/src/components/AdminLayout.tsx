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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0e1a' }}>
      <aside className="w-60 flex-shrink-0 flex flex-col"
             style={{ background: '#111827', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-5 py-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button onClick={() => navigate('/admin')} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                 style={{ background: 'linear-gradient(135deg, #f0b429, #d97706)' }}>⚽</div>
            <div>
              <span className="font-bold text-sm tracking-wider block"
                    style={{ fontFamily: 'Rajdhani, sans-serif', color: '#f0b429' }}>
                SPORT BET SIM
              </span>
              <span className="text-xs text-slate-500">管理者パネル</span>
            </div>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="px-3 py-2 rounded-lg flex items-center justify-between"
               style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="badge text-xs" style={{ background: 'rgba(240,180,41,0.15)', color: '#f0b429' }}>管理者</span>
              </div>
              <p className="text-xs font-medium text-slate-300 truncate">{user?.name}</p>
            </div>
            <button onClick={logout}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded ml-2 flex-shrink-0">
              ログアウト
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
