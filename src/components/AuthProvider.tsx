'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User { id: number; username: string; nombre: string }

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const lsToken = localStorage.getItem('token')
    const cookieToken = document.cookie.split('; ').find(c => c.startsWith('token='))?.split('=')[1]
    const t = lsToken || cookieToken
    if (t) {
      setToken(t)
      if (!lsToken) localStorage.setItem('token', t)
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } })
        .then(r => { if (!r.ok) throw new Error('Token inválido'); return r.json() })
        .then(u => { setUser(u); setLoading(false) })
        .catch(() => { localStorage.removeItem('token'); document.cookie = 'token=; path=/; max-age=0'; setToken(null); setLoading(false) })
    } else setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
    if (!r.ok) { const d = await r.json(); throw new Error(d.error) }
    const data = await r.json()
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    document.cookie = 'token=; path=/; max-age=0'
    setToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, token, login, logout, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
