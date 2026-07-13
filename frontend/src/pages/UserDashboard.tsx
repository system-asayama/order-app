import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import { useAuth } from '../hooks/useAuth';
import { api, type Match, type Bet, BET_RESULT_LABELS, BET_RESULT_COLORS, MATCH_STATUS_LABELS, MATCH_STATUS_COLORS } from '../lib/api';

export default function UserDashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [recentBets, setRecentBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState({ total: 0, wins: 0, losses: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [matchRes, betRes, allBetRes] = await Promise.all([
          api.get<Match[]>('/matches?status=upcoming&limit=5'),
          api.get<Bet[]>('/bets/my?limit=5'),
          api.get<Bet[]>('/bets/my'),
        ]);
        setUpcomingMatches(matchRes.data);
        setRecentBets(betRes.data);
        const bets = allBetRes.data;
        const wins = bets.filter(b => ['win','partial_win_75','partial_win_50'].includes(b.result)).length;
        const losses = bets.filter(b => ['loss','partial_loss_75','partial_loss_50'].includes(b.result)).length;
        const pending = bets.filter(b => b.result === 'pending').length;
        setStats({ total: bets.length, wins, losses, pending });
      } catch (e) { console.error(e); }
      finally { setLoading(false); refreshUser(); }
    };
    load();
  }, []);

  const statCards = [
    { label: '保有ポイント', value: `${user?.balance?.toLocaleString() ?? '-'} pt`, color: '#f0b429', bg: 'rgba(240,180,41,0.08)', border: 'rgba(240,180,41,0.2)' },
    { label: '総ベット数', value: String(stats.total), color: '#e2e8f0', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
    { label: '勝ち', value: String(stats.wins), color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    { label: '負け', value: String(stats.losses), color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  ];

  return (
    <UserLayout>
      <div className="p-6 max-w-5xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            こんにちは、<span style={{ color: '#f0b429' }}>{user?.name}</span> さん
          </h1>
          <p className="text-slate-500 text-sm">今日も楽しいシミュレーションを！</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(card => (
            <div key={card.label} className="rounded-xl p-4"
                 style={{ background: card.bg, border: `1px solid ${card.border}` }}>
              <p className="text-xs text-slate-500 mb-1">{card.label}</p>
              <p className="text-2xl font-bold" style={{ color: card.color, fontFamily: 'Rajdhani, sans-serif' }}>
                {loading ? '...' : card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-xl overflow-hidden" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="font-semibold text-white text-sm">受付中の試合</h2>
              <button onClick={() => navigate('/matches')} className="text-xs text-slate-500 hover:text-yellow-400 transition-colors">すべて見る →</button>
            </div>
            <div>
              {loading ? <div className="p-8 text-center text-slate-600 text-sm">読み込み中...</div>
               : upcomingMatches.length === 0 ? <div className="p-8 text-center text-slate-600 text-sm">受付中の試合はありません</div>
               : upcomingMatches.map(match => (
                <div key={match.id} className="px-5 py-3.5 border-b cursor-pointer hover:bg-white/2 transition-colors"
                     style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                     onClick={() => navigate('/matches')}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`badge text-xs ${MATCH_STATUS_COLORS[match.status]}`}>{MATCH_STATUS_LABELS[match.status]}</span>
                    <span className="text-xs text-slate-600">{new Date(match.match_date).toLocaleDateString('ja-JP')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-200 font-medium flex-1 text-right">{match.home_team}</span>
                    <span className="text-slate-600 text-xs px-2">vs</span>
                    <span className="text-slate-200 font-medium flex-1">{match.away_team}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 text-center">ハンデ: {match.handicap}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="font-semibold text-white text-sm">最近のベット</h2>
              <button onClick={() => navigate('/my-bets')} className="text-xs text-slate-500 hover:text-yellow-400 transition-colors">すべて見る →</button>
            </div>
            <div>
              {loading ? <div className="p-8 text-center text-slate-600 text-sm">読み込み中...</div>
               : recentBets.length === 0 ? <div className="p-8 text-center text-slate-600 text-sm">まだベットがありません</div>
               : recentBets.map(bet => (
                <div key={bet.id} className="px-5 py-3.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-300 font-medium truncate max-w-[180px]">
                      {bet.match ? `${bet.match.home_team} vs ${bet.match.away_team}` : `Match #${bet.match_id}`}
                    </span>
                    <span className={`text-xs font-semibold ${BET_RESULT_COLORS[bet.result]}`}>{BET_RESULT_LABELS[bet.result]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{bet.side === 'home' ? '🏠 ホーム' : '✈️ アウェイ'} · {bet.amount.toLocaleString()} pt</span>
                    {bet.payout != null && (
                      <span className={`text-xs font-medium ${bet.payout >= bet.amount ? 'text-emerald-400' : 'text-red-400'}`}>
                        {bet.payout >= bet.amount ? '+' : ''}{(bet.payout - bet.amount).toLocaleString()} pt
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
