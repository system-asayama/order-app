import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { api, type Match, type Bet, MATCH_STATUS_LABELS, MATCH_STATUS_COLORS, BET_RESULT_LABELS, BET_RESULT_COLORS } from '../lib/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [recentBets, setRecentBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState({ totalMatches: 0, upcoming: 0, finished: 0, totalBets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [matchRes, betRes] = await Promise.all([
          api.get<Match[]>('/matches'),
          api.get<Bet[]>('/bets'),
        ]);
        const ms = matchRes.data;
        const bs = betRes.data;
        setMatches(ms.slice(0, 5));
        setRecentBets(bs.slice(0, 5));
        setStats({
          totalMatches: ms.length,
          upcoming: ms.filter(m => m.status === 'upcoming').length,
          finished: ms.filter(m => m.status === 'finished').length,
          totalBets: bs.length,
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const statCards = [
    { label: '総試合数', value: String(stats.totalMatches), color: '#e2e8f0', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
    { label: '受付中', value: String(stats.upcoming), color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    { label: '精算済み', value: String(stats.finished), color: '#94a3b8', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
    { label: '総ベット数', value: String(stats.totalBets), color: '#f0b429', bg: 'rgba(240,180,41,0.08)', border: 'rgba(240,180,41,0.2)' },
  ];

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">管理者ダッシュボード</h1>
          <p className="text-slate-500 text-sm">システム全体の概要</p>
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
        <div className="flex gap-3 mb-8">
          <button onClick={() => navigate('/admin/matches')} className="btn-gold px-5 py-2.5 text-sm">＋ 試合を追加</button>
          <button onClick={() => navigate('/admin/sports')}
                  className="px-5 py-2.5 text-sm rounded-lg font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }}>
            スポーツ管理
          </button>
          <button onClick={() => navigate('/admin/users')}
                  className="px-5 py-2.5 text-sm rounded-lg font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }}>
            ユーザー管理
          </button>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-xl overflow-hidden" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="font-semibold text-white text-sm">最近の試合</h2>
              <button onClick={() => navigate('/admin/matches')} className="text-xs text-slate-500 hover:text-yellow-400 transition-colors">管理する →</button>
            </div>
            <div>
              {loading ? <div className="p-8 text-center text-slate-600 text-sm">読み込み中...</div>
               : matches.length === 0 ? <div className="p-8 text-center text-slate-600 text-sm">試合がありません</div>
               : matches.map(match => (
                <div key={match.id} className="px-5 py-3.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-200 font-medium">{match.home_team} vs {match.away_team}</span>
                    <span className={`badge text-xs ${MATCH_STATUS_COLORS[match.status]}`}>{MATCH_STATUS_LABELS[match.status]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">ハンデ: {match.handicap}</span>
                    <span className="text-xs text-slate-600">{new Date(match.match_date).toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="font-semibold text-white text-sm">最近のベット</h2>
              <button onClick={() => navigate('/admin/bets')} className="text-xs text-slate-500 hover:text-yellow-400 transition-colors">すべて見る →</button>
            </div>
            <div>
              {loading ? <div className="p-8 text-center text-slate-600 text-sm">読み込み中...</div>
               : recentBets.length === 0 ? <div className="p-8 text-center text-slate-600 text-sm">ベットがありません</div>
               : recentBets.map(bet => (
                <div key={bet.id} className="px-5 py-3.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-300 font-medium">
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
    </AdminLayout>
  );
}
