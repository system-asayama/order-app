import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { api, type Sport } from '../lib/api';

export default function AdminSports() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '⚽' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api.get<Sport[]>('/sports')
      .then(r => setSports(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name) { setError('スポーツ名を入力してください'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post('/sports', { name: form.name, icon: form.icon });
      setForm({ name: '', icon: '⚽' });
      setShowForm(false);
      load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || '作成に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このスポーツを削除しますか？')) return;
    try {
      await api.delete(`/sports/${id}`);
      load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      alert(msg || '削除に失敗しました');
    }
  };

  const COMMON_ICONS = ['⚽', '🏀', '⚾', '🏈', '🎾', '🏐', '🏉', '🎱', '🏒', '🏓', '🥊', '🏊', '🚴', '🏇', '🎽'];

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">スポーツ管理</h1>
            <p className="text-slate-500 text-sm">スポーツ種目のマスター管理</p>
          </div>
          <button onClick={() => { setShowForm(true); setError(''); }} className="btn-gold px-5 py-2.5 text-sm">
            ＋ スポーツを追加
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="rounded-xl p-5 mb-6 animate-fade-in"
               style={{ background: '#111827', border: '1px solid rgba(240,180,41,0.2)' }}>
            <h3 className="text-sm font-semibold text-white mb-4">新しいスポーツを追加</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">スポーツ名 *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                       placeholder="例: サッカー" className="input-dark" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">アイコン</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {COMMON_ICONS.map(icon => (
                    <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                            className="w-9 h-9 rounded-lg text-lg transition-all"
                            style={form.icon === icon
                              ? { background: 'rgba(240,180,41,0.2)', border: '2px solid #f0b429' }
                              : { background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.08)' }}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && (
              <div className="mt-3 px-3 py-2 rounded-lg text-sm text-red-300"
                   style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowForm(false)}
                      className="flex-1 py-2 text-sm rounded-lg font-semibold"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
                キャンセル
              </button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 btn-gold py-2 text-sm">
                {saving ? '追加中...' : '追加'}
              </button>
            </div>
          </div>
        )}

        {/* Sports list */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="font-semibold text-white text-sm">登録済みスポーツ ({sports.length})</h2>
          </div>
          {loading ? (
            <div className="p-12 text-center text-slate-600">読み込み中...</div>
          ) : sports.length === 0 ? (
            <div className="p-12 text-center text-slate-600">スポーツが登録されていません</div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {sports.map(sport => (
                <div key={sport.id} className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sport.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{sport.name}</p>
                      <p className="text-xs text-slate-600">ID: {sport.id}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(sport.id)}
                          className="px-3 py-1.5 text-xs rounded-lg transition-all"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
