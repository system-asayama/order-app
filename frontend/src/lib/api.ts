import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ===== Types =====
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
  balance: number;
  is_active: boolean;
  created_at: string;
}

export interface Sport {
  id: number;
  name: string;
  icon: string;
  is_active: boolean;
}

export type MatchStatus = 'upcoming' | 'closed' | 'finished' | 'cancelled';

export interface Match {
  id: number;
  sport_id: number;
  sport?: Sport;
  home_team: string;
  away_team: string;
  match_date: string;
  handicap: number;
  handicap_team: string;  // "team1" or "team2"
  home_score?: number;
  away_score?: number;
  status: MatchStatus;
  notes?: string;
  created_at: string;
}

export type BetSide = 'home' | 'away';
export type BetResult =
  | 'win' | 'partial_win_75' | 'partial_win_50'
  | 'push'
  | 'partial_loss_50' | 'partial_loss_75' | 'loss'
  | 'pending' | 'cancelled';

export interface Bet {
  id: number;
  user_id: number;
  match_id: number;
  match?: Match;
  side: BetSide;
  amount: number;
  result: BetResult;
  payout?: number;
  created_at: string;
  settled_at?: string;
}

export interface PointTransaction {
  id: number;
  amount: number;
  balance_after: number;
  transaction_type: string;
  description?: string;
  created_at: string;
}

export interface RankingEntry {
  rank: number;
  user_id: number;
  name: string;
  balance: number;
  total_bets: number;
  wins: number;
  win_rate: number;
}

export const BET_RESULT_LABELS: Record<BetResult, string> = {
  win: '勝ち',
  partial_win_75: '3分勝ち',
  partial_win_50: '歩勝ち',
  push: '引き分け（返還）',
  partial_loss_50: '歩負け',
  partial_loss_75: '3分負け',
  loss: '負け',
  pending: '未確定',
  cancelled: 'キャンセル',
};

export const BET_RESULT_COLORS: Record<BetResult, string> = {
  win: 'text-emerald-400',
  partial_win_75: 'text-emerald-300',
  partial_win_50: 'text-teal-300',
  push: 'text-slate-400',
  partial_loss_50: 'text-amber-300',
  partial_loss_75: 'text-orange-400',
  loss: 'text-red-400',
  pending: 'text-slate-400',
  cancelled: 'text-slate-500',
};

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  upcoming: 'ベット受付中',
  closed: '締め切り',
  finished: '精算済み',
  cancelled: '中止',
};

export const MATCH_STATUS_COLORS: Record<MatchStatus, string> = {
  upcoming: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  closed: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  finished: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  cancelled: 'bg-red-500/20 text-red-300 border border-red-500/30',
};
