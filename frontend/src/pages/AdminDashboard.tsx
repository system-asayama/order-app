import { useEffect, useState } from 'react'
import { Users, ClipboardList, CheckCircle, Clock } from 'lucide-react'
import { listUsers, allOrders, type User, type Order } from '../lib/api'
import AdminLayout from '../components/AdminLayout'

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listUsers(), allOrders()])
      .then(([u, o]) => { setUsers(u.data); setOrders(o.data) })
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: '登録ユーザー', value: users.length, icon: Users, color: 'text-[#0f1a33]' },
    { label: '総注文数', value: orders.length, icon: ClipboardList, color: 'text-[#0f1a33]' },
    { label: '審査中', value: orders.filter((o) => o.status === 'pending').length, icon: Clock, color: 'text-amber-600' },
    { label: '承認済', value: orders.filter((o) => o.status === 'approved').length, icon: CheckCircle, color: 'text-emerald-600' },
  ]

  const statusLabel: Record<string, string> = { pending: '審査中', approved: '承認済', rejected: '却下' }
  const statusClass: Record<string, string> = {
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <p className="text-xs text-[#c9a227] uppercase tracking-widest font-sans mb-1">Admin Portal</p>
          <h2 className="font-serif text-3xl text-[#0f1a33]">Overview</h2>
          <p className="text-sm text-gray-500 mt-1 font-sans">システム全体の状況を確認できます</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 font-sans">{label}</p>
                <Icon size={16} className={color} />
              </div>
              <p className={`font-serif text-3xl ${color}`}>{loading ? '—' : value}</p>
            </div>
          ))}
        </div>

        {/* Recent orders */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-serif text-lg text-[#0f1a33]">最近の注文</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400 font-sans">読み込み中...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400 font-sans">注文はまだありません</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {orders.slice(0, 8).map((o) => (
                <div key={o.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#0f1a33] font-sans">{o.item_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-sans">{o.user_name} · {new Date(o.created_at).toLocaleDateString('ja-JP')}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-medium text-[#0f1a33] font-sans">¥{Number(o.amount).toLocaleString()}</p>
                    <span className={statusClass[o.status]}>{statusLabel[o.status]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
