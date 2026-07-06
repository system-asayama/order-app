import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { allOrders, updateOrderStatus, type Order, type OrderStatus } from '../lib/api'
import AdminLayout from '../components/AdminLayout'

const statusLabel: Record<string, string> = { pending: '審査中', approved: '承認済', rejected: '却下' }
const statusClass: Record<string, string> = {
  pending: 'badge-pending',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')
  const [updating, setUpdating] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    allOrders().then(({ data }) => setOrders(data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleStatus = async (id: number, status: OrderStatus) => {
    setUpdating(id)
    try {
      await updateOrderStatus(id, status)
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
    } finally {
      setUpdating(null)
    }
  }

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    approved: orders.filter((o) => o.status === 'approved').length,
    rejected: orders.filter((o) => o.status === 'rejected').length,
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <p className="text-xs text-[#c9a227] uppercase tracking-widest font-sans mb-1">Order Management</p>
          <h2 className="font-serif text-3xl text-[#0f1a33]">全注文一覧</h2>
          <p className="text-sm text-gray-500 mt-1 font-sans">ユーザーから送信された全注文を管理します</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`card p-4 text-left transition-all ${filter === s ? 'ring-2 ring-[#c9a227]' : 'hover:shadow-md'}`}
            >
              <p className="text-xs text-gray-500 font-sans mb-1">
                {s === 'all' ? '全注文' : statusLabel[s]}
              </p>
              <p className={`font-serif text-2xl ${s === 'pending' ? 'text-amber-600' : s === 'approved' ? 'text-emerald-600' : s === 'rejected' ? 'text-red-500' : 'text-[#0f1a33]'}`}>
                {counts[s]}
              </p>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400 font-sans">読み込み中...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-400 font-sans">該当する注文はありません</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 font-sans">品目名</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 font-sans">申請者</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 font-sans">金額</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 font-sans">メモ</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 font-sans">日時</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 font-sans">ステータス</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 font-sans">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#0f1a33] font-sans">{o.item_name}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#0f1a33] font-sans">{o.user_name}</p>
                      <p className="text-xs text-gray-400 font-sans">{o.user_email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-[#0f1a33] font-sans">¥{Number(o.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-sans max-w-xs truncate">{o.memo || '—'}</td>
                    <td className="px-6 py-4 text-xs text-gray-400 font-sans whitespace-nowrap">
                      {new Date(o.created_at).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={statusClass[o.status]}>{statusLabel[o.status]}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <select
                          value={o.status}
                          onChange={(e) => handleStatus(o.id, e.target.value as OrderStatus)}
                          disabled={updating === o.id}
                          className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#c9a227] transition-all font-sans disabled:opacity-50"
                        >
                          <option value="pending">審査中</option>
                          <option value="approved">承認済</option>
                          <option value="rejected">却下</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
