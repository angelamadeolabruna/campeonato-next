'use client'

import { useAuth } from './AuthProvider'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, UserCircle, Calendar, Swords,
  Trophy, CreditCard, FileDown, LogOut, Menu, X, Goal,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/equipos', label: 'Equipos', icon: Users },
  { to: '/jugadores', label: 'Jugadores', icon: UserCircle },
  { to: '/fixture', label: 'Fixture', icon: Calendar },
  { to: '/partidos', label: 'Resultados', icon: Swords },
  { to: '/posiciones', label: 'Tabla', icon: Trophy },
  { to: '/tarjetas', label: 'Sanciones', icon: CreditCard },
  { to: '/exportar', label: 'Exportar', icon: FileDown },
]

const bottomNav = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard },
  { to: '/equipos', label: 'Equipos', icon: Users },
  { to: '/partidos', label: 'Pendientes', icon: Swords },
  { to: '/posiciones', label: 'Tabla', icon: Trophy },
  { to: '/tarjetas', label: 'Multas', icon: CreditCard },
]

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15, ease: 'easeOut' as const } },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, token, logout, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { if (!loading && !token) router.push('/login') }, [loading, token, router])

  if (loading) return (
    <div className="flex h-dvh items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-amber-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-muted text-sm">Cargando...</p>
      </div>
    </div>
  )
  if (!token) return null

  const initials = user?.nombre?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'AD'

  return (
    <div className="flex h-dvh bg-surface">
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-sidebar text-white transition-transform duration-300 ease-out flex flex-col`}>
        <div className="px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-accent to-amber-deep flex items-center justify-center text-lg shadow-lg shadow-amber-500/20">
                <Goal size={22} className="text-sidebar" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-amber-accent leading-tight tracking-tight">CAMPEONATO</h1>
                <p className="text-[10px] text-stone-500 leading-tight tracking-widest uppercase">2026</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-stone-500 hover:text-white p-1 rounded-lg hover:bg-sidebar-hover transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="mx-4 mb-3 px-3 py-2.5 rounded-xl bg-sidebar-hover border border-stone-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-sidebar shadow-lg shadow-amber-500/10 shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-stone-200 truncate leading-tight">{user?.nombre || 'Admin'}</p>
              <p className="text-[10px] text-stone-500 leading-tight">Administrador</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {navItems.map(item => {
            const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
            return (
              <button key={item.to} onClick={() => { router.push(item.to); setSidebarOpen(false) }} onMouseEnter={() => router.prefetch(item.to)}
                className={`group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-150 overflow-hidden ${isActive
                  ? 'text-amber-accent font-semibold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-sidebar-hover'}`}>
                {isActive && (
                  <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-amber-accent/10 rounded-lg" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                )}
                <div className={`relative z-10 flex items-center gap-3 w-full`}>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-accent rounded-full shadow-sm shadow-amber-500/50" />}
                  <item.icon size={18} className={`shrink-0 ${isActive ? 'text-amber-accent' : 'text-stone-500 group-hover:text-stone-300'}`} />
                  <span className="relative">{item.label}</span>
                </div>
              </button>
            )
          })}
        </nav>

        <div className="p-3 border-t border-stone-800/50 shrink-0">
          <button onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150">
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3 lg:hidden shrink-0 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-stone-600 p-2 -ml-2 hover:bg-stone-100 rounded-lg transition-colors">
            <Menu size={22} />
          </button>
          <h1 className="text-sm font-bold text-stone-700 flex items-center gap-2">
            <Goal size={16} className="text-amber-accent" /> Campeonato 2026
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-7 pb-22 lg:pb-7">
          <motion.div key={pathname} variants={pageVariants} initial="initial" animate="animate">
            {children}
          </motion.div>
        </main>
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-lg border-t border-border flex justify-around items-center px-1 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          {bottomNav.map(item => {
            const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
            return (
              <button key={item.to} onClick={() => router.push(item.to)} onMouseEnter={() => router.prefetch(item.to)}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] min-w-0 transition-colors relative ${isActive ? 'text-amber-accent font-semibold' : 'text-stone-400 hover:text-stone-600'}`}>
                {isActive && <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-amber-accent rounded-full" />}
                <item.icon size={20} className={isActive ? 'text-amber-accent' : ''} />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}