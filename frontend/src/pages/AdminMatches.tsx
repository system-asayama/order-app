import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { api, type Match, type Sport, MATCH_STATUS_LABELS, MATCH_STATUS_COLORS } from '../lib/api';

interface MatchFormData {
  home_team: string;
  away_team: string;
  sport_id: string;
  match_date: string;
  handicap: string;
  description: string;
}

interface ResultFormData {
  home_score: string;
  away_score: string;
}

const emptyForm: MatchFormData = {
  home_team: '', away_team: '', sport_id: '', match_date: '', handicap: '0', description: ''
};

export default function AdminMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [form, setForm] = useState<MatchFormData>(emptyForm);
  const [resultModal, setResultModal] = useState<Match | null>(null);
  const [resultForm, setResultForm] = useState<ResultFormData>({ home_score: '', away_score: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      const [mRes, sRes] = await Promise.all([
        api.get<Match[]>('/matches', { params }),
        api.get<Sport[]>('/sports'),
      ]);
      setMatches(mRes.data);
      setSports(sRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const openCreate = () => {
    setEditMatch(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  };

  const openEdit = (m: Match) => {
    setEditMatch(m);
    const dt = new Date(m.match_date);
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setForm({
      home_team: m.home_team,
      away_team: m.away_team,
      sport_id: String(m.sport_id),
      match_date: local,
      handicap: String(m.handicap),
      description: m.notes ?? '',
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.home_team || !form.away_team || !form.match_date) {
      setError('チーム名と試合日時は必須です');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        home_team: form.home_team,
        away_team: form.away_team,
        sport_id: form.sport_id ? parseInt(form.sport_id) : null,
        match_date: new Date(form.match_date).toISOString(),
        handicap: parseFloat(form.handicap) || 0,
        notes: form.description || null,
      };
      if (editMatch) {
        await api.put(`/matches/${editMatch.id}`, payload);
      } else {
        await api.post('/matches', payload);
      }
      setShowForm(false);
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (id: number) => {
    if (!confirm('ベットを締め切りますか？')) return;
    await api.post(`/matches/${id}/close`);
    await load();
  };

  const handleCancel = async (id: number) => {
    if (!confirm('試合を中止しますか？ベットは全額返金されます。')) return;
    await api.post(`/matches/${id}/cancel`);
    await load();
  };

  const handleResult = async () => {
    if (!resultModal) return;
    const hs = parseInt(resultForm.home_score);
    const as_ = parseInt(resultForm.away_score);
    if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) {
      setError('スコアを正しく入力してください');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post(`/matches/${resultModal.id}/result`, { home_score: hs, away_score: as_ });
      setResultModal(null);
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || '結果入力に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">試合管理</h1>
            <p className="text-slate-500 text-sm">試合の追加・編集・結果入力</p>
          </div>
          <button onClick={openCreate} className="btn-gold px-5 py-2.5 text-sm">＋ 試合を追加</button>
        </div>

        {/* Filter */}
        <div className="flex gap-1 rounded-lg p-1 mb-6 w-fit"
             style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { value: '', label: 'すべて' },
            { value: 'upcoming', label: '受付中' },
            { value: 'closed', label: '締め切り' },
            { value: 'finished', label: '精算済み' },
            { value: 'cancelled', label: '中止' },
          ].map(opt => (
            <button key={opt.value} onClick={() => setFilterStatus(opt.value)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                    style={filterStatus === opt.value
                      ? { background: '#f0b429', color: '#0a0e1a' }
                      : { color: '#64748b' }}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Match list */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
          {loading ? (
            <div className="p-12 text-center text-slate-600">読み込み中...</div>
          ) : matches.length === 0 ? (
            <div className="p-12 text-center text-slate-600">試合がありません</div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {matches.map(match => (
                <div key={match.id} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge text-xs ${MATCH_STATUS_COLORS[match.status]}`}>
                          {MATCH_STATUS_LABELS[match.status]}
                        </span>
                        {match.sport && <span className="text-xs text-slate-600">{match.sport.icon} {match.sport.name}</span>}
                      </div>
                      <p className="text-base font-semibold text-white">
                        {match.home_team} <span className="text-slate-600">vs</span> {match.away_team}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-slate-500">
                          {new Date(match.match_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-xs" style={{ color: '#f0b429' }}>ハンデ: {match.handicap}</span>
                        {match.status === 'finished' && match.home_score != null && (
                          <span className="text-xs text-emerald-400 font-semibold">
                            {match.home_score} - {match.away_score}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {match.status === 'upcoming' && (
                        <>
                          <button onClick={() => openEdit(match)}
                                  className="px-3 py-1.5 text-xs rounded-lg transition-all"
                                  style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
                            編集
                          </button>
                          <button onClick={() => handleClose(match.id)}
                                  className="px-3 py-1.5 text-xs rounded-lg transition-all"
                                  style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                            締め切り
                          </button>
                        </>
                      )}
                      {match.status === 'closed' && (
                        <>
                          <button onClick={() => { setResultModal(match); setResultForm({ home_score: '', away_score: '' }); setError(''); }}
                                  className="px-3 py-1.5 text-xs rounded-lg transition-all"
                                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                            結果入力
                          </button>
                          <button onClick={() => handleCancel(match.id)}
                                  className="px-3 py-1.5 text-xs rounded-lg transition-all"
                                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                            中止
                          </button>
                        </>
                      )}
                      {match.status === 'upcoming' && (
                        <button onClick={() => handleCancel(match.id)}
                                className="px-3 py-1.5 text-xs rounded-lg transition-all"
                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                          中止
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 animate-fade-in"
               style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">{editMatch ? '試合を編集' : '試合を追加'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white text-xl">×</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">ホームチーム *</label>
                  <input value={form.home_team} onChange={e => setForm(f => ({ ...f, home_team: e.target.value }))}
                         placeholder="例: 浦和レッズ" className="input-dark" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">アウェイチーム *</label>
                  <input value={form.away_team} onChange={e => setForm(f => ({ ...f, away_team: e.target.value }))}
                         placeholder="例: 鹿島アントラーズ" className="input-dark" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">スポーツ</label>
                  <select value={form.sport_id} onChange={e => setForm(f => ({ ...f, sport_id: e.target.value }))}
                          className="input-dark">
                    <option value="">選択なし</option>
                    {sports.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">ハンデ</label>
                  <input type="number" step="0.25" value={form.handicap}
                         onChange={e => setForm(f => ({ ...f, handicap: e.target.value }))}
                         placeholder="例: 1.25" className="input-dark" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">試合日時 *</label>
                <input type="datetime-local" value={form.match_date}
                       onChange={e => setForm(f => ({ ...f, match_date: e.target.value }))}
                       className="input-dark" />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">説明（任意）</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                       placeholder="リーグ名、会場など" className="input-dark" />
              </div>
            </div>

            {error && (
              <div className="mt-4 px-3 py-2 rounded-lg text-sm text-red-300"
                   style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)}
                      className="flex-1 py-2.5 text-sm rounded-lg font-semibold"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
                キャンセル
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 btn-gold py-2.5 text-sm">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-fade-in"
               style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">結果を入力</h3>
              <button onClick={() => setResultModal(null)} className="text-slate-500 hover:text-white text-xl">×</button>
            </div>

            <div className="text-center mb-5 p-4 rounded-xl"
                 style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white font-semibold">{resultModal.home_team} vs {resultModal.away_team}</p>
              <p className="text-xs text-slate-500 mt-1">ハンデ: {resultModal.handicap}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 text-center">{resultModal.home_team}</label>
                <input type="number" min="0" value={resultForm.home_score}
                       onChange={e => setResultForm(f => ({ ...f, home_score: e.target.value }))}
                       placeholder="0" className="input-dark text-center text-xl font-bold" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 text-center">{resultModal.away_team}</label>
                <input type="number" min="0" value={resultForm.away_score}
                       onChange={e => setResultForm(f => ({ ...f, away_score: e.target.value }))}
                       placeholder="0" className="input-dark text-center text-xl font-bold" />
              </div>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg text-sm text-red-300"
                   style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setResultModal(null)}
                      className="flex-1 py-2.5 text-sm rounded-lg font-semibold"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
                キャンセル
              </button>
              <button onClick={handleResult} disabled={saving} className="flex-1 btn-gold py-2.5 text-sm">
                {saving ? '処理中...' : '精算する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
