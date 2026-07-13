import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { api, type User } from '../lib/api';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', name: '', password: '', role: 'user', initial_balance: '10000' });
  const [balanceModal, setBalanceModal] = useState<User | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api.get<User[]>('/users').then(r => setUsers(r.data)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!createForm.email || !createForm.name || !createForm.password) { setError('メール・名前・パスワードは必須です'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/users', { email: createForm.email, name: createForm.name, password: createForm.password, role: createForm.role, initial_balance: parseInt(createForm.initial_balance) || 10000 });
      setCreateForm({ email: '', name: '', password: '', role: 'user', initial_balance: '10000' });
      setShowCreate(false); load();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'ユーザー作成に失敗しました');
    } finally { setSaving(false); }
  };

  const handleRoleChange = async (userId: number, role: string) => {
    try { await api.put(`/users/${userId}`, { role }); load(); } catch (e) { console.error(e); }
  };

  const handleToggleActive = async (userId: number, isActive: boolean) => {
    try { await api.put(`/users/${userId}`, { is_active: !isActive }); load(); } catch (e) { console.error(e); }
  };

  const handleBalanceAdjust = async () => {
    if (!balanceModal) return;
    const amt = parseInt(balanceAmount);
    if (isNaN(amt)) { setError('金額を入力してください'); return; }
    setSaving(true); setError('');
    try {
      await api.post(`/users/${balanceModal.id}/adjust-balance`, { amount: amt, reason: balanceReason || '管理者による調整' });
      setBalanceModal(null); setBalanceAmount(''); setBalanceReason(''); load();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || '残高調整に失敗しました');
    } finally { setSaving(false); }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">ユーザー管理</h1>
            <p className="text-slate-500 text-sm">ユーザーの作成・ロール・残高管理</p>
          </div>
          <button onClick={() => { setShowCreate(true); setError(''); }} className="btn-gold px-5 py-2.5 text-sm">＋ ユーザーを追加</button>
        </div>

        {showCreate && (
          <div className="rounded-xl p-5 mb-6 animate-fade-in" style={{ background: '#111827', border: '1px solid rgba(240,180,41,0.2)' }}>
            <h3 className="text-sm font-semibold text-white mb-4">新しいユーザーを追加</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="block text-xs text-slate-400 mb-1.5">メールアドレス *</label><input value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="user@example.com" className="input-dark" /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">名前 *</label><input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="山田 太郎" className="input-dark" /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">パスワード *</label><input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" className="input-dark" /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">初期ポイント</label><input type="number" value={createForm.initial_balance} onChange={e => setCreateForm(f => ({ ...f, initial_balance: e.target.value }))} className="input-dark" /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">ロール</label><select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))} className="input-dark"><option value="user">ユーザー</option><option value="admin">管理者</option></select></div>
            </div>
            {error && <div className="mb-3 px-3 py-2 rounded-lg text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 text-sm rounded-lg font-semibold" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>キャンセル</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 btn-gold py-2 text-sm">{saving ? '作成中...' : '作成'}</button>
            </div>
          </div>
        )}

        <div className="rounded-xl overflow-hidden" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="font-semibold text-white text-sm">ユーザー一覧 ({users.length}人)</h2>
          </div>
          {loading ? <div className="p-12 text-center text-slate-600">読み込み中...</div>
           : users.length === 0 ? <div className="p-12 text-center text-slate-600">ユーザーがいません</div>
           : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {users.map(user => (
                <div key={user.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(240,180,41,0.1)', color: '#f0b429', border: '1px solid rgba(240,180,41,0.2)' }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white">{user.name}</p>
                          <span className={`badge text-xs ${user.role === 'admin' ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20' : 'text-slate-400 bg-slate-400/10 border border-slate-400/20'}`}>{user.role === 'admin' ? '管理者' : 'ユーザー'}</span>
                          {!user.is_active && <span className="badge text-xs text-red-400 bg-red-400/10 border border-red-400/20">無効</span>}
                        </div>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold" style={{ color: '#f0b429', fontFamily: 'Rajdhani, sans-serif' }}>{user.balance.toLocaleString()} pt</p>
                      <button onClick={() => { setBalanceModal(user); setBalanceAmount(''); setBalanceReason(''); setError(''); }} className="px-3 py-1.5 text-xs rounded-lg" style={{ background: 'rgba(240,180,41,0.1)', color: '#f0b429', border: '1px solid rgba(240,180,41,0.2)' }}>残高調整</button>
                      <select value={user.role} onChange={e => handleRoleChange(user.id, e.target.value)} className="text-xs rounded-lg px-2 py-1.5" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <option value="user">ユーザー</option>
                        <option value="admin">管理者</option>
                      </select>
                      <button onClick={() => handleToggleActive(user.id, user.is_active)} className="px-3 py-1.5 text-xs rounded-lg" style={user.is_active ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' } : { background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                        {user.is_active ? '無効化' : '有効化'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {balanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 animate-fade-in" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">残高調整</h3>
              <button onClick={() => setBalanceModal(null)} className="text-slate-500 hover:text-white text-xl">×</button>
            </div>
            <div className="rounded-xl p-3 mb-4 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-sm font-semibold text-white">{balanceModal.name}</p>
              <p className="text-xs text-slate-500">現在: {balanceModal.balance.toLocaleString()} pt</p>
            </div>
            <div className="space-y-3 mb-4">
              <div><label className="block text-xs text-slate-400 mb-1.5">調整額（+で付与、-で減算）</label><input type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} placeholder="例: 5000 または -1000" className="input-dark" /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">理由（任意）</label><input value={balanceReason} onChange={e => setBalanceReason(e.target.value)} placeholder="例: 初期付与、ボーナス" className="input-dark" /></div>
            </div>
            {error && <div className="mb-4 px-3 py-2 rounded-lg text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
            <div className="flex gap-3">
              <button onClick={() => setBalanceModal(null)} className="flex-1 py-2.5 text-sm rounded-lg font-semibold" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>キャンセル</button>
              <button onClick={handleBalanceAdjust} disabled={saving} className="flex-1 btn-gold py-2.5 text-sm">{saving ? '処理中...' : '調整する'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
