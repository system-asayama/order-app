import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { Role } from '../lib/api'

interface Props {
  children: React.ReactNode
  requiredRole?: Role
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f3]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#c9a227', borderTopColor: 'transparent' }} />
          <p className="text-sm text-gray-500 font-sans">認証確認中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  return <>{children}</>
}
