import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || 'メールアドレスまたはパスワードが正しくありません');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1526 50%, #0a0e1a 100%)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5"
             style={{ background: 'radial-gradient(circle, #f0b429, transparent)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-5"
             style={{ background: 'radial-gradient(circle, #10b981, transparent)', filter: 'blur(60px)' }} />
      </div>

      <div className="w-full max-w-md px-6 animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
               style={{ background: 'linear-gradient(135deg, #f0b429, #d97706)', boxShadow: '0 0 30px rgba(240,180,41,0.3)' }}>
            <span className="text-2xl">⚽</span>
          </div>
          <h1 className="text-3xl font-bold mb-1"
              style={{ fontFamily: 'Rajdhani, sans-serif', color: '#f0b429', letterSpacing: '0.05em' }}>
            SPORT BET SIM
          </h1>
          <p className="text-slate-500 text-sm">スポーツベッティングシミュレーター</p>
        </div>

        <div className="rounded-2xl p-8"
             style={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
          <h2 className="text-xl font-semibold text-white mb-6">ログイン</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm text-red-300"
                 style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">メールアドレス</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                     required placeholder="your@email.com" className="input-dark" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">パスワード</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                     required placeholder="••••••••" className="input-dark" />
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full mt-2 py-3 text-base">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ログイン中...
                </span>
              ) : 'ログイン'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-xs text-slate-600 text-center mb-2">デモアカウント</p>
            <p className="text-xs text-slate-500 text-center">
              管理者: <span className="text-slate-300">admin@example.com</span> / admin123
            </p>
            <p className="text-xs text-slate-600 text-center mt-3">
              このシステムはシミュレーション専用です。実際の金銭は一切関与しません。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
