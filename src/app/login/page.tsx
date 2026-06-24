'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { LogIn, User, Lock, Goal } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const { login, token } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (token) router.push('/') }, [token, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try { await login(username, password); router.push('/') }
    catch (err: any) { setError(err.message); setLoading(false) }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-sidebar via-stone-900 to-stone-950 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.06),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(245,158,11,0.03),transparent_60%)]" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, ease: 'easeOut' }}
        className="bg-white rounded-2xl shadow-2xl shadow-black/10 p-8 sm:p-10 w-full max-w-md relative border border-border">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-accent to-amber-deep flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/20">
            <Goal size={32} className="text-sidebar" />
          </div>
          <h1 className="text-xl font-extrabold text-stone-800 tracking-tight">Campeonato 2026</h1>
          <p className="text-muted text-sm mt-1">Cooperativa Las Américas</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Sistema de Administración</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </motion.div>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">Usuario</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none text-sm transition-all bg-stone-50/50 text-stone-700" placeholder="admin" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">Contraseña</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none text-sm transition-all bg-stone-50/50 text-stone-700" placeholder="admin123" required />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-amber-accent to-amber-deep text-sidebar font-extrabold py-2.5 rounded-xl hover:from-amber-400 hover:to-amber-600 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-amber-500/20 active:scale-[0.98] flex items-center justify-center gap-2 text-sm tracking-wide">
            {loading ? (
              <><div className="w-4 h-4 border-2 border-sidebar/30 border-t-sidebar rounded-full animate-spin" /> Ingresando...</>
            ) : (
              <><LogIn size={16} /> Ingresar</>
            )}
          </button>
        </form>
        <p className="text-[11px] text-stone-400 text-center mt-6">Demo: <span className="font-medium text-stone-500">admin</span> / <span className="font-medium text-stone-500">admin123</span></p>
      </motion.div>
    </div>
  )
}