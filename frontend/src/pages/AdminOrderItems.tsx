import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import {
  listOrderItems, createOrderItem, updateOrderItem, deleteOrderItem,
  type OrderItem,
} from '../lib/api'
import AdminLayout from '../components/AdminLayout'

interface FormState {
  name: string
  description: string
  default_amount: string
  category: string
}

const emptyForm: FormState = { name: '', description: '', default_amount: '', category: '' }

export default function AdminOrderItems() {
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    listOrderItems(false).then(({ data }) => setItems(data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setEditId(null); setForm(emptyForm); setError(''); setShowForm(true) }
  const openEdit = (item: OrderItem) => {
    setEditId(item.id)
    setForm({
      name: item.name,
      description: item.description ?? '',
      default_amount: item.default_amount != null ? String(item.default_amount) : '',
      category: item.category ?? '',
    })
    setError('')
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditId(null) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('品目名を入力してください'); return }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        default_amount: form.default_amount ? parseFloat(form.default_amount) : undefined,
        category: form.category.trim() || undefined,
      }
      if (editId) {
        await updateOrderItem(editId, payload)
      } else {
        await createOrderItem(payload)
      }
      closeForm()
      load()
    } catch {
      setError('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (item: OrderItem) => {
    await updateOrderItem(item.id, { is_active: !item.is_active })
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('この品目を削除（無効化）しますか？')) return
    await deleteOrderItem(id)
    load()
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-[#c9a227] uppercase tracking-widest font-sans mb-1">Master Data</p>
            <h2 className="font-serif text-3xl text-[#0f1a33]">品目マスター管理</h2>
            <p className="text-sm text-gray-500 mt-1 font-sans">注文フォームで選択できる品目を管理します</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-[#c9a227] text-white text-sm font-medium rounded-lg hover:bg-[#a8841f] active:scale-[0.98] transition-all duration-150"
          >
            <Plus size={15} />
            品目を追加
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="card p-6 mb-6">
            <h3 className="font-serif text-lg text-[#0f1a33] mb-4">{editId ? '品目を編集' : '新しい品目を追加'}</h3>
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 font-sans">品目名 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例：交通費"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 font-sans">カテゴリ</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="例：経費、消耗品"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 font-sans">デフォルト金額（円）</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
                  <input
                    type="number"
                    value={form.default_amount}
                    onChange={(e) => setForm({ ...form, default_amount: e.target.value })}
                    placeholder="0"
                    min="0"
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 transition-all font-sans"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 font-sans">説明</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="品目の説明（任意）"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 transition-all font-sans"
                />
              </div>

              {error && (
                <div className="md:col-span-2">
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-sans">{error}</p>
                </div>
              )}

              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-[#c9a227] text-white text-sm font-medium rounded-lg hover:bg-[#a8841f] transition-all disabled:opacity-50"
                >
                  <Check size={14} />
                  {saving ? '保存中...' : '保存'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-all font-sans"
                >
                  <X size={14} />
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="card">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400 font-sans">読み込み中...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-400 font-sans">品目マスターはまだ登録されていません</p>
              <button onClick={openNew} className="text-xs text-[#c9a227] hover:underline mt-2 inline-block font-sans">最初の品目を追加する →</button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 font-sans">品目名</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 font-sans">カテゴリ</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 font-sans">デフォルト金額</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 font-sans">説明</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 font-sans">状態</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 font-sans">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors ${!item.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 text-sm font-medium text-[#0f1a33] font-sans">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-sans">{item.category || '—'}</td>
                    <td className="px-6 py-4 text-sm text-right text-[#0f1a33] font-sans">
                      {item.default_amount != null ? `¥${Number(item.default_amount).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-sans max-w-xs truncate">{item.description || '—'}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(item)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${
                          item.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {item.is_active ? '有効' : '無効'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-gray-400 hover:text-[#c9a227] hover:bg-[#c9a227]/10 rounded-lg transition-all"
                          title="編集"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="削除"
                        >
                          <Trash2 size={14} />
                        </button>
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
