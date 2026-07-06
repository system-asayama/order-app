import { useState, useEffect, useCallback } from 'react'
import { getMe, type User } from '../lib/api'

interface AuthState {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
}

export function useAuth(): AuthState & { refetch: () => void } {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, isAuthenticated: false })

  const fetch = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setState({ user: null, loading: false, isAuthenticated: false })
      return
    }
    try {
      const { data } = await getMe()
      setState({ user: data, loading: false, isAuthenticated: true })
    } catch {
      localStorage.removeItem('token')
      setState({ user: null, loading: false, isAuthenticated: false })
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { ...state, refetch: fetch }
}
