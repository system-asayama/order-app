import { useEffect, useState } from 'react';
import UserLayout from '../components/UserLayout';
import { useAuth } from '../hooks/useAuth';
import { api, type Match, type Sport, type Bet, BET_RESULT_LABELS, BET_RESULT_COLORS, MATCH_STATUS_LABELS, MATCH_STATUS_COLORS } from '../lib/api';

interface BetModalProps {
  match: Match;
  onClose: () => void;
  onSuccess: () => void;
}

// ハンデ付きチームのラベルを取得
function getHandicapInfo(match: Match): { teamName: string; isHome: boolean } | null {
  if (!match.handicap || Number(match.handicap) === 0) return null;
  if (match.handicap_team === 'team2') {
    return { teamName: match.away_team, isHome: false };
  }
  return { teamName: match.home_team, isHome: true };
}

function BetModal({ match, onClose, onSuccess }: BetModalProps) {
  const { user, refreshUser } = useAuth();
  const [side, setSide] = useState<'home' | 'away'>('home');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handicapInfo = getHandicapInfo(match);

  const handleBet = async () => {
    const amt = parseInt(amount);
    if (!amt || amt <= 0) { setError('ポイントを入力してください'); return; }
    if (amt > (user?.balance ?? 0)) { setError('残高が不足しています'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/bets', { match_id: match.id, side, amount: amt });
      await refreshUser();
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || 'ベットに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const winAmount = Math.floor(parseInt(amount || '0') * 1.9);
  const lossAmount = parseInt(amount || '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 animate-fade-in"
           style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">ベットを置く</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xl">×</button>
        </div>

        {/* Match info */}
        <div className="rounded-xl p-4 mb-5 text-center"
             style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs text-slate-500 mb-2">{match.sport?.name} · {new Date(match.match_date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <span className="text-white font-bold text-lg">{match.home_team}</span>
              {handicapInfo?.isHome && (
                <div className="mt-0.5">
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                    -{match.handicap}
                  </span>
                </div>
              )}
            </div>
            <span className="text-slate-600 font-bold">vs</span>
            <div className="text-center">
              <span className="text-white font-bold text-lg">{match.away_team}</span>
              {handicapInfo && !handicapInfo.isHome && (
                <div className="mt-0.5">
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                    -{match.handicap}
                  </span>
                </div>
              )}
            </div>
          </div>
          {handicapInfo && (
            <p className="text-xs mt-2 text-slate-500">
              <span style={{ color: '#f0b429' }}>{handicapInfo.teamName}</span> が -{match.handicap} のハンデを背負います
            </p>
          )}
        </div>

        {/* Side selection */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {(['home', 'away'] as const).map(s => {
            const isHandicapSide = (s === 'home' && handicapInfo?.isHome) || (s === 'away' && handicapInfo && !handicapInfo.isHome);
            const teamName = s === 'home' ? match.home_team : match.away_team;
            return (
              <button key={s} onClick={() => setSide(s)}
                      className="py-3 px-3 rounded-xl font-semibold text-sm transition-all"
                      style={side === s
                        ? { background: 'rgba(240,180,41,0.15)', border: '2px solid #f0b429', color: '#f0b429' }
                        : { background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                <span className="block">{s === 'home' ? '🏠' : '✈️'} {teamName}</span>
                {isHandicapSide && (
                  <span className="text-xs mt-0.5 block opacity-70">ハンデ -{match.handicap}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-1.5">ベットポイント</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                 placeholder="例: 1000" min="1" max={user?.balance}
                 className="input-dark" />
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-slate-600">残高: {user?.balance?.toLocaleString()} pt</span>
            <div className="flex gap-1">
              {[500, 1000, 3000, 5000].map(v => (
                <button key={v} onClick={() => setAmount(String(Math.min(v, user?.balance ?? 0)))}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: 'rgba(240,180,41,0.1)', color: '#f0b429' }}>
                  {v >= 1000 ? `${v/1000}k` : v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payout preview */}
        {parseInt(amount) > 0 && (
          <div className="rounded-xl p-3 mb-4 grid grid-cols-2 gap-2 text-center"
               style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">勝ち時の払い戻し</p>
              <p className="font-bold text-emerald-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                +{winAmount.toLocaleString()} pt
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">負け時の損失</p>
              <p className="font-bold text-red-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                -{lossAmount.toLocaleString()} pt
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg text-sm text-red-300"
               style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <button onClick={handleBet} disabled={loading || !amount}
                className="btn-gold w-full py-3">
          {loading ? '処理中...' : `${parseInt(amount || '0').toLocaleString()} pt をベット`}
        </button>
      </div>
    </div>
  );
}

export default function MatchList() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [myBets, setMyBets] = useState<Bet[]>([]);
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('upcoming');
  const [betMatch, setBetMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (selectedStatus) params.status = selectedStatus;
      if (selectedSport) params.sport_id = selectedSport;
      const [matchRes, sportRes, betRes] = await Promise.all([
        api.get<Match[]>('/matches', { params }),
        api.get<Sport[]>('/sports'),
        api.get<Bet[]>('/bets/my'),
      ]);
      setMatches(matchRes.data);
      setSports(sportRes.data);
      setMyBets(betRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [selectedSport, selectedStatus]);

  const myBetMap = new Map(myBets.filter(b => b.result === 'pending').map(b => [b.match_id, b]));

  return (
    <UserLayout>
      <div className="p-6 max-w-4xl mx-auto animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">試合一覧</h1>
          <p className="text-slate-500 text-sm">試合を選んでベットを置こう</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-1 rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { value: 'upcoming', label: '受付中' },
              { value: 'closed', label: '締め切り' },
              { value: 'finished', label: '精算済み' },
              { value: '', label: 'すべて' },
            ].map(opt => (
              <button key={opt.value} onClick={() => setSelectedStatus(opt.value)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                      style={selectedStatus === opt.value
                        ? { background: '#f0b429', color: '#0a0e1a' }
                        : { color: '#64748b' }}>
                {opt.label}
              </button>
            ))}
          </div>

          {sports.length > 0 && (
            <div className="flex gap-1 rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setSelectedSport(null)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                      style={!selectedSport ? { background: '#f0b429', color: '#0a0e1a' } : { color: '#64748b' }}>
                全スポーツ
              </button>
              {sports.map(s => (
                <button key={s.id} onClick={() => setSelectedSport(s.id)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                        style={selectedSport === s.id ? { background: '#f0b429', color: '#0a0e1a' } : { color: '#64748b' }}>
                  {s.icon} {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Match cards */}
        {loading ? (
          <div className="text-center py-16 text-slate-600">読み込み中...</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-16 text-slate-600">該当する試合はありません</div>
        ) : (
          <div className="space-y-3">
            {matches.map(match => {
              const myBet = myBetMap.get(match.id);
              const handicapInfo = getHandicapInfo(match);
              return (
                <div key={match.id} className="rounded-xl p-5 transition-all"
                     style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`badge text-xs ${MATCH_STATUS_COLORS[match.status]}`}>
                        {MATCH_STATUS_LABELS[match.status]}
                      </span>
                      {match.sport && (
                        <span className="text-xs text-slate-500">{match.sport.icon} {match.sport.name}</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-600">
                      {new Date(match.match_date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 text-right">
                      <p className="text-lg font-bold text-white">{match.home_team}</p>
                      <p className="text-xs text-slate-500">ホーム</p>
                      {handicapInfo?.isHome && (
                        <span className="inline-block text-xs px-1.5 py-0.5 rounded mt-0.5 font-medium"
                              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                          -{match.handicap}
                        </span>
                      )}
                    </div>
                    <div className="px-6 text-center">
                      {match.status === 'finished' ? (
                        <div>
                          <p className="text-2xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif', color: '#f0b429' }}>
                            {match.home_score} - {match.away_score}
                          </p>
                          <p className="text-xs text-slate-600">最終スコア</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-slate-600 font-bold text-lg">vs</p>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-white">{match.away_team}</p>
                      <p className="text-xs text-slate-500">アウェイ</p>
                      {handicapInfo && !handicapInfo.isHome && (
                        <span className="inline-block text-xs px-1.5 py-0.5 rounded mt-0.5 font-medium"
                              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                          -{match.handicap}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* My bet info */}
                  {myBet && (
                    <div className="rounded-lg px-4 py-2 mb-3 flex items-center justify-between"
                         style={{ background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.15)' }}>
                      <span className="text-xs text-yellow-400">
                        🎯 {myBet.side === 'home' ? match.home_team : match.away_team} に {myBet.amount.toLocaleString()} pt ベット済み
                      </span>
                      <span className={`text-xs font-semibold ${BET_RESULT_COLORS[myBet.result]}`}>
                        {BET_RESULT_LABELS[myBet.result]}
                      </span>
                    </div>
                  )}

                  {/* Settled bets */}
                  {match.status === 'finished' && (() => {
                    const settledBet = myBets.find(b => b.match_id === match.id && b.result !== 'pending');
                    if (!settledBet) return null;
                    return (
                      <div className="rounded-lg px-4 py-2 mb-3 flex items-center justify-between"
                           style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="text-xs text-slate-400">
                          {settledBet.side === 'home' ? match.home_team : match.away_team} に {settledBet.amount.toLocaleString()} pt
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${BET_RESULT_COLORS[settledBet.result]}`}>
                            {BET_RESULT_LABELS[settledBet.result]}
                          </span>
                          {settledBet.payout != null && (
                            <span className={`text-xs font-bold ${settledBet.payout >= settledBet.amount ? 'text-emerald-400' : 'text-red-400'}`}>
                              {settledBet.payout >= settledBet.amount ? '+' : ''}{(settledBet.payout - settledBet.amount).toLocaleString()} pt
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Bet button */}
                  {match.status === 'upcoming' && !myBet && (
                    <button onClick={() => setBetMatch(match)} className="btn-gold w-full py-2.5 text-sm">
                      ベットを置く
                    </button>
                  )}
                  {match.status === 'upcoming' && myBet && (
                    <div className="text-center text-xs text-slate-500 py-1">ベット済み（1試合1ベット）</div>
                  )}
                  {match.status === 'closed' && (
                    <div className="text-center text-xs text-amber-400 py-1">⏰ ベット締め切り済み</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {betMatch && (
        <BetModal match={betMatch} onClose={() => setBetMatch(null)} onSuccess={loadData} />
      )}
    </UserLayout>
  );
}
