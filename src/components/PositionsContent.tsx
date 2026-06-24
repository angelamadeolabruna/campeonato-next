'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'

export default function PositionsContent({ initialDamas, initialVarones, initialTopDamas, initialTopVarones }: { initialDamas?: any[], initialVarones?: any[], initialTopDamas?: any[], initialTopVarones?: any[] }) {
  const { token } = useAuth()
  const [damas, setDamas] = useState<any[]>(initialDamas || [])
  const [varones, setVarones] = useState<any[]>(initialVarones || [])
  const [topDamas, setTopDamas] = useState<any[]>(initialTopDamas || [])
  const [topVarones, setTopVarones] = useState<any[]>(initialTopVarones || [])
  const [loading, setLoading] = useState(!initialDamas)

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (initialDamas) return
    Promise.all([
      fetch('/api/teams/positions', { headers }).then(r => r.json()),
      fetch('/api/dashboard', { headers }).then(r => r.json()),
    ])
      .then(([pos, dash]) => {
        setDamas((pos.damas || []).sort((a: any, b: any) => b.puntos - a.puntos || (b.dg - a.dg)))
        setVarones((pos.varones || []).sort((a: any, b: any) => b.puntos - a.puntos || (b.dg - a.dg)))
        setTopDamas(dash.topGoleadores?.damas || [])
        setTopVarones(dash.topGoleadores?.varones || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const renderGoleadores = (data: any[], title: string, color: string) => (
    <div className="mb-8">
      <h2 className={`text-xs font-bold uppercase tracking-wider ${color} mb-3 flex items-center gap-2`}>
        <span className={`w-1.5 h-1.5 rounded-full ${color.includes('pink') ? 'bg-pink-500' : 'bg-emerald-500'}`} />Goleadoras - {title}
      </h2>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-border overflow-hidden card-shadow-hover">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[300px]">
            <thead>
              <tr className={`${color.includes('pink') ? 'bg-pink-50/50' : 'bg-emerald-50/50'} text-[11px] font-semibold uppercase tracking-wider text-stone-500`}>
                <th className="text-center px-3 py-3 font-medium w-10">#</th>
                <th className="text-left px-4 py-3 font-medium">Jugadora</th>
                <th className="text-left px-4 py-3 font-medium">Equipo</th>
                <th className="text-center px-4 py-3 font-medium">Goles</th>
              </tr>
            </thead>
            <tbody>
              {data.map((g: any, i: number) => (
                <tr key={i} className={`border-t border-border transition-colors hover:bg-stone-50/50 ${i % 2 === 1 ? 'bg-stone-50/30' : ''}`}>
                  <td className="px-3 py-3 text-center font-bold text-muted text-xs">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-stone-800">{g.nombre}</td>
                  <td className="px-4 py-3 text-stone-500">{g.equipo}</td>
                  <td className="px-4 py-3 text-center font-extrabold text-lg text-stone-800">{g.goles}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-muted text-sm">Sin goles registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )

  const renderTable = (data: any[], title: string, color: string) => (
    <div className="mb-8">
      <h2 className={`text-xs font-bold uppercase tracking-wider ${color} mb-3 flex items-center gap-2`}>
        <span className={`w-1.5 h-1.5 rounded-full ${color.includes('pink') ? 'bg-pink-500' : 'bg-emerald-500'}`} />{title}
      </h2>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-border overflow-hidden card-shadow-hover">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[550px]">
            <thead>
              <tr className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                <th className="text-center px-3 py-3 font-medium w-10">#</th>
                <th className="text-left px-4 py-3 font-medium">Equipo</th>
                <th className="text-center px-3 py-3 font-medium">PJ</th>
                <th className="text-center px-3 py-3 font-medium">PG</th>
                <th className="text-center px-3 py-3 font-medium">PE</th>
                <th className="text-center px-3 py-3 font-medium">PP</th>
                <th className="text-center px-3 py-3 font-medium">GF</th>
                <th className="text-center px-3 py-3 font-medium">GC</th>
                <th className="text-center px-3 py-3 font-medium">DG</th>
                <th className="text-center px-3 py-3 font-bold">PTS</th>
              </tr>
            </thead>
            <tbody>
              {data.map((e, i) => (
                <tr key={e.id} className={`border-t border-border transition-colors hover:bg-stone-50/50 ${i % 2 === 1 ? 'bg-stone-50/30' : ''}`}>
                  <td className="px-3 py-3 text-center font-bold text-muted text-xs">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-stone-800">{e.nombre}</td>
                  <td className="px-3 py-3 text-center text-stone-600">{e.pj}</td>
                  <td className="px-3 py-3 text-center text-stone-600">{e.pg}</td>
                  <td className="px-3 py-3 text-center text-stone-600">{e.pe}</td>
                  <td className="px-3 py-3 text-center text-stone-600">{e.pp}</td>
                  <td className="px-3 py-3 text-center text-stone-600">{e.gf}</td>
                  <td className="px-3 py-3 text-center text-stone-600">{e.gc}</td>
                  <td className={`px-3 py-3 text-center font-semibold ${e.dg > 0 ? 'text-emerald-600' : e.dg < 0 ? 'text-red-500' : 'text-stone-600'}`}>{e.dg > 0 ? `+${e.dg}` : e.dg}</td>
                  <td className="px-3 py-3 text-center font-extrabold text-base text-stone-800">{e.puntos}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={10} className="text-center py-8 text-muted text-sm">Sin datos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-7 w-48" />
      <div className="bg-white rounded-xl border border-border p-5"><div className="skeleton h-[220px] w-full" /></div>
      <div className="bg-white rounded-xl border border-border p-5"><div className="skeleton h-[220px] w-full" /></div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={22} className="text-amber-accent" />
        <h1 className="text-xl font-extrabold text-stone-800 tracking-tight">Tabla de Posiciones</h1>
      </div>
      {renderTable(damas, 'DAMAS', 'text-pink-500')}
      {renderTable(varones, 'VARONES', 'text-emerald-500')}

      <h2 className="text-base font-extrabold text-stone-800 mb-4 mt-2 tracking-tight">Goleadoras</h2>
      {renderGoleadores(topDamas, 'Damas', 'text-pink-500')}
      {renderGoleadores(topVarones, 'Varones', 'text-emerald-500')}
    </div>
  )
}