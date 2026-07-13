import { useEffect, useState } from 'react';
import UserLayout from '../components/UserLayout';
import { api, type Bet, BET_RESULT_LABELS, BET_RESULT_COLORS, MATCH_STATUS_LABELS } from '../lib/api';

export default function MyBets() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Bet[]>('/bets/my')
      .then(r => setBets(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalBet = bets.reduce((s, b) => s + b.amount, 0);
  const totalPayout = bets.filter(b => b.payout != null).reduce((s, b) => s + (b.payout ?? 0), 0);
  const settledBets = bets.filter(b => b.result !== 'pending' && b.result !== 'cancelled');
  const wins = settledBets.filter(b => ['win','partial_win_75','partial_win_50'].includes(b.result)).length;
  const winRate = settledBets.length > 0 ? Math.round((wins / settledBets.length) * 100) : 0;

  return (
    <UserLayout>
      <div className="p-6 max-w-4xl mx-auto animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">マイベット</h1>
          <p className="text-slate-500 text-sm">あなたのベット履歴</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: '総ベット数', value: String(bets.length), color: '#e2e8f0' },
            { label: '総ベット額', value: `${totalBet.toLocaleString()} pt`, color: '#f0b429' },
            { label: '総払い戻し', value: `${totalPayout.toLocaleString()} pt`, color: '#10b981' },
            { label: '勝率', value: `${winRate}%`, color: winRate >= 50 ? '#10b981' : '#ef4444' },
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

        {/* Bet list */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="font-semibold text-white text-sm">ベット履歴</h2>
          </div>
          {loading ? (
            <div className="p-12 text-center text-slate-600">読み込み中...</div>
          ) : bets.length === 0 ? (
            <div className="p-12 text-center text-slate-600">まだベットがありません</div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {bets.map(bet => (
                <div key={bet.id} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {bet.match ? `${bet.match.home_team} vs ${bet.match.away_team}` : `Match #${bet.match_id}`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {bet.match?.sport && (
                          <span className="text-xs text-slate-600">{bet.match.sport.icon} {bet.match.sport.name}</span>
                        )}
                        {bet.match && (
                          <span className="text-xs text-slate-600">
                            {MATCH_STATUS_LABELS[bet.match.status]}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${BET_RESULT_COLORS[bet.result]}`}>
                      {BET_RESULT_LABELS[bet.result]}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-xs">
                        <span className="text-slate-500">選択: </span>
                        <span className="text-slate-300 font-medium">
                          {bet.side === 'home'
                            ? `🏠 ${bet.match?.home_team ?? 'ホーム'}`
                            : `✈️ ${bet.match?.away_team ?? 'アウェイ'}`}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-500">ベット: </span>
                        <span className="text-slate-300 font-medium">{bet.amount.toLocaleString()} pt</span>
                      </div>
                      {bet.match?.handicap !== undefined && (
                        <div className="text-xs">
                          <span className="text-slate-500">ハンデ: </span>
                          <span style={{ color: '#f0b429' }}>{bet.match.handicap}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      {bet.payout != null ? (
                        <div>
                          <span className={`text-sm font-bold ${bet.payout >= bet.amount ? 'text-emerald-400' : 'text-red-400'}`}>
                            {bet.payout >= bet.amount ? '+' : ''}{(bet.payout - bet.amount).toLocaleString()} pt
                          </span>
                          <p className="text-xs text-slate-600">払い戻し: {bet.payout.toLocaleString()} pt</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">
                          {new Date(bet.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score if finished */}
                  {bet.match?.status === 'finished' && bet.match.home_score != null && (
                    <div className="mt-2 text-xs text-slate-600">
                      最終スコア: {bet.match.home_team} {bet.match.home_score} - {bet.match.away_score} {bet.match.away_team}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
