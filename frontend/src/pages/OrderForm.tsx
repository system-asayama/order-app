import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Send } from 'lucide-react'
import { createOrder, listOrderItems, type OrderItem } from '../lib/api'
import UserLayout from '../components/UserLayout'

export default function OrderForm() {
  const navigate = useNavigate()
  const [masterItems, setMasterItems] = useState<OrderItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('')
  const [itemName, setItemName] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listOrderItems(true).then(({ data }) => setMasterItems(data)).catch(() => {})
  }, [])

  // Auto-fill when master item selected
  const handleMasterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value === '' ? '' : Number(e.target.value)
    setSelectedItemId(id)
    if (id !== '') {
      const item = masterItems.find((m) => m.id === id)
      if (item) {
        setItemName(item.name)
        if (item.default_amount != null) setAmount(String(item.default_amount))
      }
    } else {
      setItemName('')
      setAmount('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!itemName.trim()) { setError('品目名を入力してください'); return }
    const amt = parseFloat(amount)
    if (!amount || isNaN(amt) || amt <= 0) { setError('正しい金額を入力してください'); return }

    setSubmitting(true)
    try {
      await createOrder({
        order_item_id: selectedItemId !== '' ? selectedItemId : undefined,
        item_name: itemName.trim(),
        amount: amt,
        memo: memo.trim() || undefined,
      })
      navigate('/orders')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail || '注文の送信に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <UserLayout>
      <div className="p-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-[#c9a227] uppercase tracking-widest font-sans mb-1">New Order</p>
          <h2 className="font-serif text-3xl text-[#0f1a33]">注文を作成</h2>
          <p className="text-sm text-gray-500 mt-1 font-sans">品目マスターから選択するか、直接入力してください</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          {/* Master select */}
          {masterItems.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 font-sans">品目マスターから選択（任意）</label>
              <div className="relative">
                <select
                  value={selectedItemId}
                  onChange={handleMasterSelect}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 transition-all font-sans"
                >
                  <option value="">-- マスターから選択 --</option>
                  {masterItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.category ? `[${item.category}] ` : ''}{item.name}
                      {item.default_amount != null ? ` — ¥${Number(item.default_amount).toLocaleString()}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-400 mt-1 font-sans">選択すると品目名・金額が自動入力されます</p>
            </div>
          )}

          {/* Divider */}
          {masterItems.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-sans">または直接入力</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
          )}

          {/* Item name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 font-sans">
              品目名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="例：オフィス用品、交通費など"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 transition-all font-sans"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 font-sans">
              金額（円） <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-sans">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="1"
                step="1"
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 transition-all font-sans"
              />
            </div>
          </div>

          {/* Memo */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 font-sans">メモ（任意）</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              placeholder="備考・詳細など"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 transition-all resize-none font-sans"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-sans">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#c9a227] text-white text-sm font-medium rounded-lg hover:bg-[#a8841f] active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
            >
              <Send size={14} />
              {submitting ? '送信中...' : '注文を送信'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="px-4 py-2.5 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-all duration-150 font-sans"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </UserLayout>
  )
}
