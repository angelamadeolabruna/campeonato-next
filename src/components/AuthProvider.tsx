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
    const t = localStorage.getItem('token')
    if (t) {
      setToken(t)
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } })
        .then(r => { if (!r.ok) throw new Error('Token inválido'); return r.json() })
        .then(u => { setUser(u); setLoading(false) })
        .catch(() => { localStorage.removeItem('token'); setToken(null); setLoading(false) })
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
    setToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, token, login, logout, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
