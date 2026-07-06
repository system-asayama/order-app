import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, ClipboardList, BookOpen, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/users', icon: Users, label: 'ユーザー管理' },
  { to: '/admin/order-items', icon: BookOpen, label: '品目マスター' },
  { to: '/admin/orders', icon: ClipboardList, label: '注文管理' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#faf8f3]">
      {/* Sidebar */}
      <aside className="w-60 bg-[#080e1f] flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={16} className="text-[#c9a227]" />
            <h1 className="font-serif text-xl text-[#c9a227] tracking-widest uppercase">Admin</h1>
          </div>
          <p className="text-xs text-white/40 font-sans">Order Management System</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans transition-all duration-150 ${
                  active
                    ? 'bg-[#c9a227]/20 text-[#e8c060]'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={16} strokeWidth={active ? 2 : 1.5} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#c9a227]/20 flex items-center justify-center">
              <ShieldCheck size={14} className="text-[#c9a227]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-white/40 truncate">Administrator</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-150"
          >
            <LogOut size={13} />
            ログアウト
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
