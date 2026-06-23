'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'

export default function CardsContent() {
  const { token } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetch('/api/cards', { headers })
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const amarillas = data.filter(c => c.tipo === 'Amarilla')
  const rojas = data.filter(c => c.tipo === 'Roja')

  if (loading) return <p className="text-gray-500">Cargando...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tarjetas</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="bg-yellow-50">
                <th className="text-left px-3 py-3">Jugador</th>
                <th className="text-left px-3 py-3">Equipo</th>
                <th className="text-center px-3 py-3">🟡 Amarillas</th>
                <th className="text-center px-3 py-3">🔴 Rojas</th>
                <th className="text-center px-3 py-3">Total</th>
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
                  <tr key={i} className="border-t border-gray-50">
                    <td className="px-3 py-3 font-medium">{g.jugador?.nombre || '?'} {g.jugador?.numero && <span className="text-gray-400">#{g.jugador.numero}</span>}</td>
                    <td className="px-3 py-3">{g.equipo?.nombre || '?'}</td>
                    <td className="px-3 py-3 text-center">{g.amarillas}</td>
                    <td className="px-3 py-3 text-center">{g.rojas}</td>
                    <td className="px-3 py-3 text-center font-bold">{g.amarillas + g.rojas}</td>
                  </tr>
                ))
              })()}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-semibold text-yellow-600 mb-3">Tarjetas Amarillas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[300px]">
              <thead><tr className="bg-yellow-50">
                <th className="text-left px-2 py-2">Jugador</th><th className="text-left px-2 py-2">Equipo</th><th className="text-center px-2 py-2">Jornada</th>
              </tr></thead>
              <tbody>
                {amarillas.map((c, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="px-2 py-2">{c.jugador?.nombre}</td>
                    <td className="px-2 py-2 text-xs text-gray-500">{c.jugador?.equipo?.nombre}</td>
                    <td className="px-2 py-2 text-center text-xs">{c.partido?.jornada?.numero}</td>
                  </tr>
                ))}
                {amarillas.length === 0 && <tr><td colSpan={3} className="text-center py-4 text-gray-400 text-sm">Sin tarjetas amarillas</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-semibold text-red-600 mb-3">Tarjetas Rojas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[300px]">
              <thead><tr className="bg-red-50">
                <th className="text-left px-2 py-2">Jugador</th><th className="text-left px-2 py-2">Equipo</th><th className="text-center px-2 py-2">Jornada</th>
              </tr></thead>
              <tbody>
                {rojas.map((c, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="px-2 py-2">{c.jugador?.nombre}</td>
                    <td className="px-2 py-2 text-xs text-gray-500">{c.jugador?.equipo?.nombre}</td>
                    <td className="px-2 py-2 text-center text-xs">{c.partido?.jornada?.numero}</td>
                  </tr>
                ))}
                {rojas.length === 0 && <tr><td colSpan={3} className="text-center py-4 text-gray-400 text-sm">Sin tarjetas rojas</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
