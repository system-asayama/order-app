import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { api, type Bet, BET_RESULT_LABELS, BET_RESULT_COLORS } from '../lib/api';

export default function AdminBets() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMatchId, setFilterMatchId] = useState('');

  const load = () => {
    const params: Record<string, string> = {};
    if (filterMatchId) params.match_id = filterMatchId;
    api.get<Bet[]>('/bets', { params })
      .then(r => setBets(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterMatchId]);

  const totalBet = bets.reduce((s, b) => s + b.amount, 0);
  const totalPayout = bets.filter(b => b.payout != null).reduce((s, b) => s + (b.payout ?? 0), 0);

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">ベット管理</h1>
          <p className="text-slate-500 text-sm">全ユーザーのベット一覧</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: '総ベット数', value: String(bets.length), color: '#e2e8f0' },
            { label: '総ベット額', value: `${totalBet.toLocaleString()} pt`, color: '#f0b429' },
            { label: '総払い戻し', value: `${totalPayout.toLocaleString()} pt`, color: '#10b981' },
            { label: '未精算', value: String(bets.filter(b => b.result === 'pending').length), color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4"
                 style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className="text-xl font-bold" style={{ color: s.color, fontFamily: 'Rajdhani, sans-serif' }}>
                {loading ? '...' : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-6">
          <input value={filterMatchId} onChange={e => setFilterMatchId(e.target.value)}
                 placeholder="試合IDでフィルター" className="input-dark" style={{ maxWidth: '200px' }} />
          {filterMatchId && (
            <button onClick={() => setFilterMatchId('')}
                    className="text-xs text-slate-500 hover:text-white transition-colors">
              クリア
            </button>
          )}
        </div>

        {/* Bet table */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="font-semibold text-white text-sm">ベット一覧 ({bets.length}件)</h2>
          </div>
          {loading ? (
            <div className="p-12 text-center text-slate-600">読み込み中...</div>
          ) : bets.length === 0 ? (
            <div className="p-12 text-center text-slate-600">ベットがありません</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['ID', '試合', 'ユーザー', '選択', 'ベット額', '結果', '払い戻し', '日時'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-slate-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bets.map(bet => (
                    <tr key={bet.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-4 py-3 text-slate-600 text-xs">#{bet.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-slate-200 text-xs font-medium">
                          {bet.match ? `${bet.match.home_team} vs ${bet.match.away_team}` : `#${bet.match_id}`}
                        </p>
                        {bet.match?.handicap !== undefined && (
                          <p className="text-xs" style={{ color: '#f0b429' }}>H: {bet.match.handicap}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">#{bet.user_id}</td>
                      <td className="px-4 py-3 text-xs text-slate-300">
                        {bet.side === 'home' ? '🏠 ホーム' : '✈️ アウェイ'}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium" style={{ color: '#f0b429' }}>
                        {bet.amount.toLocaleString()} pt
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${BET_RESULT_COLORS[bet.result]}`}>
                          {BET_RESULT_LABELS[bet.result]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {bet.payout != null ? (
                          <span className={bet.payout >= bet.amount ? 'text-emerald-400' : 'text-red-400'}>
                            {bet.payout.toLocaleString()} pt
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {new Date(bet.created_at).toLocaleDateString('ja-JP')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
