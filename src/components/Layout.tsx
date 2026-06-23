'use client'

import { useAuth } from './AuthProvider'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, UserCircle, Calendar, Swords,
  Trophy, CreditCard, FileDown, LogOut, Menu,
} from 'lucide-react'
import { useState, useEffect } from 'react'

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

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, token, logout, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { if (!loading && !token) router.push('/login') }, [loading, token, router])

  if (loading) return <div className="flex h-dvh items-center justify-center text-gray-500">Cargando...</div>
  if (!token) return null

  return (
    <div className="flex h-dvh bg-gray-50">
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-green-950 text-white transition-transform duration-200 flex flex-col`}>
        <div className="p-4 border-b border-yellow-700 shrink-0">
          <h1 className="text-lg font-bold text-yellow-400">⚽ Campeonato 2026</h1>
          <p className="text-xs text-yellow-200/70 mt-1">Bienvenida, {user?.nombre}</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems.map(item => {
            const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
            return (
              <button key={item.to} onClick={() => { router.push(item.to); setSidebarOpen(false) }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${isActive ? 'bg-yellow-500 text-green-950 font-semibold' : 'text-yellow-100/70 hover:bg-green-900 hover:text-yellow-200'}`}>
                <item.icon size={18} /> {item.label}
              </button>
            )
          })}
        </nav>
        <div className="p-3 border-t border-green-800 shrink-0">
          <button onClick={logout} className="flex items-center gap-2 text-sm text-yellow-200/50 hover:text-yellow-300 w-full px-3 py-2.5 rounded-lg hover:bg-green-900 transition-colors">
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-yellow-500 border-b border-yellow-600 px-4 py-3 flex items-center gap-3 lg:hidden shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-green-900 p-2 -ml-2"><Menu size={24} /></button>
          <h1 className="text-base font-semibold text-green-900">⚽ Campeonato</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-yellow-50 border-t border-yellow-200 flex justify-around items-center px-1 pb-safe">
          {bottomNav.map(item => {
            const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
            return (
              <button key={item.to} onClick={() => router.push(item.to)}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-2 text-[10px] min-w-0 ${isActive ? 'text-green-700 font-semibold' : 'text-yellow-800/60'}`}>
                <item.icon size={20} /> <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
