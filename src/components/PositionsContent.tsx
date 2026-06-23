'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'

export default function PositionsContent() {
  const { token } = useAuth()
  const [damas, setDamas] = useState<any[]>([])
  const [varones, setVarones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetch('/api/teams/positions', { headers })
      .then(r => r.json())
      .then((data) => {
        setDamas((data.damas || []).sort((a: any, b: any) => b.puntos - a.puntos || (b.dg - a.dg)))
        setVarones((data.varones || []).sort((a: any, b: any) => b.puntos - a.puntos || (b.dg - a.dg)))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const renderTable = (data: any[], title: string, color: string) => (
    <div className="mb-8">
      <h2 className={`text-lg font-semibold ${color} mb-3`}>{title}</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-center px-2 py-3 w-10">#</th>
                <th className="text-left px-3 py-3">Equipo</th>
                <th className="text-center px-3 py-3">PJ</th>
                <th className="text-center px-3 py-3">PG</th>
                <th className="text-center px-3 py-3">PE</th>
                <th className="text-center px-3 py-3">PP</th>
                <th className="text-center px-3 py-3">GF</th>
                <th className="text-center px-3 py-3">GC</th>
                <th className="text-center px-3 py-3">DG</th>
                <th className="text-center px-3 py-3 font-bold">PTS</th>
              </tr>
            </thead>
            <tbody>
              {data.map((e, i) => (
                <tr key={e.id} className="border-t border-gray-50">
                  <td className="px-2 py-3 text-center font-bold text-gray-400">{i + 1}</td>
                  <td className="px-3 py-3 font-medium">{e.nombre}</td>
                  <td className="px-3 py-3 text-center">{e.pj}</td>
                  <td className="px-3 py-3 text-center">{e.pg}</td>
                  <td className="px-3 py-3 text-center">{e.pe}</td>
                  <td className="px-3 py-3 text-center">{e.pp}</td>
                  <td className="px-3 py-3 text-center">{e.gf}</td>
                  <td className="px-3 py-3 text-center">{e.gc}</td>
                  <td className="px-3 py-3 text-center">{e.dg > 0 ? `+${e.dg}` : e.dg}</td>
                  <td className="px-3 py-3 text-center font-bold text-lg">{e.puntos}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={10} className="text-center py-6 text-gray-400">Sin datos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  if (loading) return <p className="text-gray-500">Cargando...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tabla de Posiciones</h1>
      {renderTable(damas, 'DAMAS', 'text-pink-600')}
      {renderTable(varones, 'VARONES', 'text-green-600')}
    </div>
  )
}
