import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { to: '/dashboard', icon: '🏠', label: 'ダッシュボード' },
  { to: '/matches', icon: '⚽', label: '試合一覧' },
  { to: '/my-bets', icon: '🎯', label: 'マイベット' },
  { to: '/ranking', icon: '🏆', label: 'ランキング' },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0e1a' }}>
      <aside className="w-60 flex-shrink-0 flex flex-col"
             style={{ background: '#111827', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-5 py-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                 style={{ background: 'linear-gradient(135deg, #f0b429, #d97706)' }}>⚽</div>
            <span className="font-bold text-sm tracking-wider"
                  style={{ fontFamily: 'Rajdhani, sans-serif', color: '#f0b429' }}>
              SPORT BET SIM
            </span>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="px-3 py-2.5 rounded-lg mb-2" style={{ background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.15)' }}>
            <p className="text-xs text-slate-500 mb-0.5">保有ポイント</p>
            <p className="text-xl font-bold" style={{ color: '#f0b429', fontFamily: 'Rajdhani, sans-serif' }}>
              {user?.balance?.toLocaleString() ?? '-'} <span className="text-sm font-normal">pt</span>
            </p>
          </div>
          <div className="px-3 py-2 rounded-lg flex items-center justify-between"
               style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-300 truncate">{user?.name}</p>
              <p className="text-xs text-slate-600 truncate">{user?.email}</p>
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
