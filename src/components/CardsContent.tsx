'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { motion } from 'framer-motion'
import { CreditCard } from 'lucide-react'

export default function CardsContent({ initialData }: { initialData?: any[] }) {
  const { token } = useAuth()
  const [data, setData] = useState<any[]>(initialData || [])
  const [loading, setLoading] = useState(!initialData)

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (initialData) return
    fetch('/api/cards', { headers }).then(r => r.json()).then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  const amarillas = data.filter(c => c.tipo === 'Amarilla')
  const rojas = data.filter(c => c.tipo === 'Roja')

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-7 w-32" />
      <div className="bg-white rounded-xl border border-border p-5"><div className="skeleton h-[220px] w-full" /></div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <CreditCard size={22} className="text-amber-accent" />
        <h1 className="text-xl font-extrabold text-stone-800 tracking-tight">Tarjetas</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-border overflow-hidden card-shadow-hover mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[550px]">
            <thead>
              <tr className="bg-amber-50/50 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                <th className="text-left px-4 py-3 font-medium">Jugador</th>
                <th className="text-left px-4 py-3 font-medium">Equipo</th>
                <th className="text-center px-3 py-3 font-medium">🟡 Amarillas</th>
                <th className="text-center px-3 py-3 font-medium">🔴 Rojas</th>
                <th className="text-center px-3 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const grouped: Record<number, { jugador: any, equipo: any, amarillas: number, rojas: number }> = {}
                data.forEach(c => {
                  if (!grouped[c.jugadorId]) grouped[c.jugadorId] = { jugador: c.jugador, equipo: c.jugador?.equipo, amarillas: 0, rojas: 0 }
                  if (c.tipo === 'Amarilla') grouped[c.jugadorId].amarillas++
                  if (c.tipo === 'Roja') grouped[c.jugadorId].rojas++
                })
                return Object.values(grouped).sort((a, b) => (b.amarillas + b.rojas) - (a.amarillas + a.rojas)).map((g, i) => (
                  <tr key={i} className={`border-t border-border transition-colors hover:bg-stone-50/50 ${i % 2 === 1 ? 'bg-stone-50/30' : ''}`}>
                    <td className="px-4 py-3 font-semibold text-stone-800">{g.jugador?.nombre || '?'} {g.jugador?.numero && <span className="text-muted text-xs">#{g.jugador.numero}</span>}</td>
                    <td className="px-4 py-3 text-stone-500">{g.equipo?.nombre || '?'}</td>
                    <td className="px-3 py-3 text-center text-stone-600">{g.amarillas}</td>
                    <td className="px-3 py-3 text-center text-stone-600">{g.rojas}</td>
                    <td className="px-3 py-3 text-center font-extrabold text-stone-800">{g.amarillas + g.rojas}</td>
                  </tr>
                ))
              })()}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-xl border border-border p-5 card-shadow-hover">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-accent mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-accent" />Tarjetas Amarillas
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[300px]">
              <thead><tr className="bg-amber-50/50 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                <th className="text-left px-3 py-2 font-medium">Jugador</th><th className="text-left px-3 py-2 font-medium">Equipo</th><th className="text-center px-3 py-2 font-medium">Jornada</th>
              </tr></thead>
              <tbody>
                {amarillas.map((c, i) => (
                  <tr key={i} className={`border-t border-border transition-colors hover:bg-stone-50/50 ${i % 2 === 1 ? 'bg-stone-50/30' : ''}`}>
                    <td className="px-3 py-2 text-stone-700">{c.jugador?.nombre}</td>
                    <td className="px-3 py-2 text-xs text-muted">{c.jugador?.equipo?.nombre}</td>
                    <td className="px-3 py-2 text-center text-xs text-stone-500">{c.partido?.jornada?.numero}</td>
                  </tr>
                ))}
                {amarillas.length === 0 && <tr><td colSpan={3} className="text-center py-6 text-muted text-sm">Sin tarjetas amarillas</td></tr>}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-border p-5 card-shadow-hover">
          <h2 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />Tarjetas Rojas
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[300px]">
              <thead><tr className="bg-red-50/50 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                <th className="text-left px-3 py-2 font-medium">Jugador</th><th className="text-left px-3 py-2 font-medium">Equipo</th><th className="text-center px-3 py-2 font-medium">Jornada</th>
              </tr></thead>
              <tbody>
                {rojas.map((c, i) => (
                  <tr key={i} className={`border-t border-border transition-colors hover:bg-stone-50/50 ${i % 2 === 1 ? 'bg-stone-50/30' : ''}`}>
                    <td className="px-3 py-2 text-stone-700">{c.jugador?.nombre}</td>
                    <td className="px-3 py-2 text-xs text-muted">{c.jugador?.equipo?.nombre}</td>
                    <td className="px-3 py-2 text-center text-xs text-stone-500">{c.partido?.jornada?.numero}</td>
                  </tr>
                ))}
                {rojas.length === 0 && <tr><td colSpan={3} className="text-center py-6 text-muted text-sm">Sin tarjetas rojas</td></tr>}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}