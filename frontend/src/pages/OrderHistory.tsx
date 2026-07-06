import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, PlusCircle } from 'lucide-react'
import { myOrders, type Order } from '../lib/api'
import UserLayout from '../components/UserLayout'

const statusLabel: Record<string, string> = { pending: '審査中', approved: '承認済', rejected: '却下' }
const statusClass: Record<string, string> = {
  pending: 'badge-pending',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    myOrders().then(({ data }) => setOrders(data)).finally(() => setLoading(false))
  }, [])

  return (
    <UserLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-[#c9a227] uppercase tracking-widest font-sans mb-1">My Orders</p>
            <h2 className="font-serif text-3xl text-[#0f1a33]">注文履歴</h2>
          </div>
          <Link
            to="/orders/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#c9a227] text-white text-sm font-medium rounded-lg hover:bg-[#a8841f] active:scale-[0.98] transition-all duration-150"
          >
            <PlusCircle size={15} />
            新規注文
          </Link>
        </div>

        <div className="card">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400 font-sans">読み込み中...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardList size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-sans">注文はまだありません</p>
              <Link to="/orders/new" className="text-xs text-[#c9a227] hover:underline mt-2 inline-block font-sans">最初の注文を作成する →</Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 font-sans">品目名</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 font-sans">金額</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 font-sans">メモ</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 font-sans">日時</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 font-sans">ステータス</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#0f1a33] font-sans">{o.item_name}</td>
                    <td className="px-6 py-4 text-sm text-right text-[#0f1a33] font-sans">¥{Number(o.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-sans max-w-xs truncate">{o.memo || '—'}</td>
                    <td className="px-6 py-4 text-xs text-gray-400 font-sans whitespace-nowrap">
                      {new Date(o.created_at).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={statusClass[o.status]}>{statusLabel[o.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </UserLayout>
  )
}
