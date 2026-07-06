import { useEffect, useState } from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import { listUsers, createUser, updateUser, type User, type Role } from '../lib/api'
import AdminLayout from '../components/AdminLayout'
import { useAuth } from '../hooks/useAuth'

export default function AdminUsers() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'user' as Role })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    listUsers().then(({ data }) => setUsers(data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.name || !form.password) { setError('全項目を入力してください'); return }
    setSaving(true)
    try {
      await createUser(form)
      setShowForm(false)
      setForm({ email: '', name: '', password: '', role: 'user' })
      setError('')
      load()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail || 'ユーザーの作成に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleRoleChange = async (id: number, role: Role) => {
    setUpdating(id)
    try {
      await updateUser(id, { role })
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
    } finally {
      setUpdating(null)
    }
  }

  const handleToggleActive = async (user: User) => {
    setUpdating(user.id)
    try {
      await updateUser(user.id, { is_active: !user.is_active })
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: !user.is_active } : u)))
    } finally {
      setUpdating(null)
    }
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-[#c9a227] uppercase tracking-widest font-sans mb-1">User Management</p>
            <h2 className="font-serif text-3xl text-[#0f1a33]">ユーザー管理</h2>
            <p className="text-sm text-gray-500 mt-1 font-sans">ユーザーの登録・ロール変更・有効/無効を管理します</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setError('') }}
            className="flex items-center gap-2 px-4 py-2 bg-[#c9a227] text-white text-sm font-medium rounded-lg hover:bg-[#a8841f] active:scale-[0.98] transition-all duration-150"
          >
            <Plus size={15} />
            ユーザーを追加
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="card p-6 mb-6">
            <h3 className="font-serif text-lg text-[#0f1a33] mb-4">新しいユーザーを追加</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 font-sans">メールアドレス <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 transition-all font-sans" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 font-sans">名前 <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="山田 太郎"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 transition-all font-sans" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 font-sans">パスワード <span className="text-red-500">*</span></label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="6文字以上"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 transition-all font-sans" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 font-sans">ロール</label>
                <div className="relative">
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                    className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 transition-all font-sans">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              {error && (
                <div className="md:col-span-2">
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-sans">{error}</p>
                </div>
              )}
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" disabled={saving}
                  className="px-5 py-2 bg-[#c9a227] text-white text-sm font-medium rounded-lg hover:bg-[#a8841f] transition-all disabled:opacity-50">
                  {saving ? '作成中...' : 'ユーザーを作成'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-all font-sans">
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
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 font-sans">名前</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 font-sans">メール</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 font-sans">ロール</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 font-sans">状態</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 font-sans">登録日</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#0f1a33] font-sans">{u.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-sans">{u.email}</td>
                    <td className="px-6 py-4">
                      {u.id === me?.id ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#c9a227]/10 text-[#c9a227] border border-[#c9a227]/30">
                          {u.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      ) : (
                        <div className="relative inline-block">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                            disabled={updating === u.id}
                            className="appearance-none pl-3 pr-7 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#c9a227] transition-all font-sans disabled:opacity-50"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.id === me?.id ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">有効</span>
                      ) : (
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={updating === u.id}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${
                            u.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {u.is_active ? '有効' : '無効'}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400 font-sans">
                      {new Date(u.created_at).toLocaleDateString('ja-JP')}
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
