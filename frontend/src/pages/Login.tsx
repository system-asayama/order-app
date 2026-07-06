import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, getMe } from '../lib/api'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    getMe().then(({ data }) => {
      navigate(data.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    }).catch(() => localStorage.removeItem('token'))
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await login(email, password)
      localStorage.setItem('token', data.access_token)
      const { data: me } = await getMe()
      navigate(me.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0f1a33] flex-col justify-between p-12">
        <div>
          <h1 className="font-serif text-3xl text-[#c9a227] tracking-widest uppercase">Order App</h1>
          <p className="text-white/40 text-xs mt-1 font-sans tracking-wider">Management System</p>
        </div>
        <div>
          <div className="w-12 h-px bg-[#c9a227] mb-6" />
          <h2 className="font-serif text-4xl text-white leading-tight mb-4">
            Welcome<br />
            <span className="text-[#c9a227]">Back</span>
          </h2>
          <p className="text-white/50 text-sm font-sans leading-relaxed max-w-xs">
            ロールベースのアクセス制御と品目マスター管理を備えた注文管理システムです。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Administrator', desc: 'Full system access & management' },
            { label: 'User', desc: 'Personal orders & profile' },
          ].map((r) => (
            <div key={r.label} className="border border-white/10 rounded-lg p-3">
              <p className="text-xs font-medium text-white/80 font-sans">{r.label}</p>
              <p className="text-xs text-white/40 mt-0.5 font-sans">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#faf8f3]">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-serif text-3xl text-[#0f1a33] mb-1">Sign In</h2>
            <p className="text-sm text-gray-500 font-sans">アカウント情報を入力してください</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 font-sans">メールアドレス</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 font-sans">パスワード</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-sans">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#c9a227] text-white text-sm font-medium rounded-lg hover:bg-[#a8841f] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? '認証中...' : 'ログイン'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-white border border-gray-100 rounded-xl">
            <p className="text-xs font-medium text-gray-500 mb-2 font-sans">デモアカウント</p>
            <div className="space-y-1">
              <p className="text-xs text-gray-600 font-sans">管理者: <span className="font-medium text-[#0f1a33]">admin@example.com</span> / admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
