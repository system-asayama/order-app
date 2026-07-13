import { useEffect, useState } from 'react';
import UserLayout from '../components/UserLayout';
import { useAuth } from '../hooks/useAuth';
import { api, type RankingEntry } from '../lib/api';

export default function Ranking() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<RankingEntry[]>('/ranking')
      .then(r => setRanking(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const myRank = ranking.find(r => r.user_id === user?.id);

  const medalColors = ['#f0b429', '#94a3b8', '#cd7f32'];
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <UserLayout>
      <div className="p-6 max-w-3xl mx-auto animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">🏆 ランキング</h1>
          <p className="text-slate-500 text-sm">保有ポイント順位</p>
        </div>

        {/* My rank */}
        {myRank && (
          <div className="rounded-xl p-4 mb-6 flex items-center justify-between"
               style={{ background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.2)' }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold" style={{ color: '#f0b429', fontFamily: 'Rajdhani, sans-serif' }}>
                #{myRank.rank}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">あなたの順位</p>
                <p className="text-xs text-slate-500">{myRank.total_bets} ベット · 勝率 {myRank.win_rate}%</p>
              </div>
            </div>
            <p className="text-xl font-bold" style={{ color: '#f0b429', fontFamily: 'Rajdhani, sans-serif' }}>
              {myRank.balance.toLocaleString()} pt
            </p>
          </div>
        )}

        {/* Ranking table */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="font-semibold text-white text-sm">総合ランキング</h2>
          </div>
          {loading ? (
            <div className="p-12 text-center text-slate-600">読み込み中...</div>
          ) : ranking.length === 0 ? (
            <div className="p-12 text-center text-slate-600">データがありません</div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {ranking.map((entry, i) => {
                const isMe = entry.user_id === user?.id;
                return (
                  <div key={entry.user_id}
                       className="px-5 py-4 flex items-center gap-4 transition-colors"
                       style={isMe ? { background: 'rgba(240,180,41,0.05)' } : {}}>
                    {/* Rank */}
                    <div className="w-10 text-center flex-shrink-0">
                      {i < 3 ? (
                        <span className="text-xl">{medals[i]}</span>
                      ) : (
                        <span className="text-sm font-bold"
                              style={{ color: '#475569', fontFamily: 'Rajdhani, sans-serif' }}>
                          #{entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                         style={{
                           background: i < 3 ? `${medalColors[i]}20` : 'rgba(255,255,255,0.06)',
                           color: i < 3 ? medalColors[i] : '#64748b',
                           border: `1px solid ${i < 3 ? `${medalColors[i]}40` : 'rgba(255,255,255,0.08)'}`,
                         }}>
                      {entry.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: isMe ? '#f0b429' : '#e2e8f0' }}>
                        {entry.name} {isMe && <span className="text-xs text-yellow-400">(あなた)</span>}
                      </p>
                      <p className="text-xs text-slate-600">
                        {entry.total_bets} ベット · 勝率 {entry.win_rate}%
                      </p>
                    </div>

                    {/* Balance */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold" style={{
                        color: i < 3 ? medalColors[i] : '#e2e8f0',
                        fontFamily: 'Rajdhani, sans-serif',
                        fontSize: i < 3 ? '1.125rem' : '1rem',
                      }}>
                        {entry.balance.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-600">pt</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
