import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, PlusCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { myOrders, type Order } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import UserLayout from '../components/UserLayout'

const statusLabel: Record<string, string> = { pending: '審査中', approved: '承認済', rejected: '却下' }
const statusClass: Record<string, string> = {
  pending: 'badge-pending',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
}

export default function UserDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    myOrders().then(({ data }) => setOrders(data)).finally(() => setLoading(false))
  }, [])

  const counts = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    approved: orders.filter((o) => o.status === 'approved').length,
    rejected: orders.filter((o) => o.status === 'rejected').length,
  }

  return (
    <UserLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-[#c9a227] uppercase tracking-widest font-sans mb-1">Dashboard</p>
          <h2 className="font-serif text-3xl text-[#0f1a33]">こんにちは、{user?.name} さん</h2>
          <p className="text-sm text-gray-500 mt-1 font-sans">{user?.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: '総注文数', value: counts.total, icon: ClipboardList, color: 'text-[#0f1a33]' },
            { label: '審査中', value: counts.pending, icon: Clock, color: 'text-amber-600' },
            { label: '承認済', value: counts.approved, icon: CheckCircle, color: 'text-emerald-600' },
            { label: '却下', value: counts.rejected, icon: XCircle, color: 'text-red-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 font-sans">{label}</p>
                <Icon size={16} className={color} />
              </div>
              <p className={`font-serif text-3xl ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mb-8">
          <Link
            to="/orders/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c9a227] text-white text-sm font-medium rounded-lg hover:bg-[#a8841f] active:scale-[0.98] transition-all duration-150"
          >
            <PlusCircle size={16} />
            新しい注文を作成
          </Link>
        </div>

        {/* Recent orders */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-serif text-lg text-[#0f1a33]">最近の注文</h3>
            <Link to="/orders" className="text-xs text-[#c9a227] hover:underline font-sans">すべて見る →</Link>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400 font-sans">読み込み中...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center">
              <ClipboardList size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-sans">注文はまだありません</p>
              <Link to="/orders/new" className="text-xs text-[#c9a227] hover:underline mt-1 inline-block font-sans">最初の注文を作成する →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#0f1a33] font-sans">{o.item_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-sans">{new Date(o.created_at).toLocaleDateString('ja-JP')}</p>
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
    </UserLayout>
  )
}
