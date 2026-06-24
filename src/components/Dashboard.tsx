'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import VoiceAssistant from './VoiceAssistant'

interface DashboardData {
  kpis: any; golesPorFecha: any[]; tarjetas: any
  topGoleadores: { damas: any[]; varones: any[] }
  tablaPosiciones: { damas: any[]; varones: any[] }
  masIndisciplinado: any; proximoPartido: any; alertas: any
}

export default function Dashboard() {
  const { token: authToken } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categoria, setCategoria] = useState('todas')

  useEffect(() => {
    fetch('/api/categories', { headers: { Authorization: `Bearer ${authToken}` } })
      .then(r => r.json()).then(setCategories).catch(() => {})
  }, [authToken])

  useEffect(() => {
    if (!authToken) return
    setLoading(true)
    const params = new URLSearchParams()
    if (categoria !== 'todas') params.set('categoria', categoria)
    fetch(`/api/dashboard?${params}`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json() }).then(setData).catch(console.error).finally(() => setLoading(false))
  }, [categoria, authToken])

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando dashboard...</div>
  if (!data) return <div className="text-center py-12 text-red-500">Error al cargar datos</div>

  const { kpis, golesPorFecha, tarjetas, topGoleadores, tablaPosiciones, masIndisciplinado, proximoPartido, alertas } = data

  const KpiCard = ({ label, value, color, sublabel }: { label: string; value: string | number; color?: string; sublabel?: string }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <p className="text-xs sm:text-sm text-gray-500">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold ${color || 'text-gray-800'}`}>{value}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  )

  const AlertBanner = ({ type, message }: { type: 'red' | 'yellow' | 'green'; message: string }) => {
    const colors = { red: 'bg-red-50 border-red-200 text-red-700', yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700', green: 'bg-green-50 border-green-200 text-green-700' }
    return <div className={`${colors[type]} border rounded-lg px-4 py-2 text-sm flex items-center gap-2`}><span>{type === 'red' ? '🔴' : type === 'yellow' ? '🟡' : '🟢'}</span>{message}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600">Categoría:</label>
        <select value={categoria} onChange={e => setCategoria(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
          <option value="todas">Todas</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Equipos Damas" value={kpis.equiposDamas} color="text-pink-500" />
        <KpiCard label="Equipos Varones" value={kpis.equiposVarones} color="text-green-600" />
        <KpiCard label="Jugadoras Damas" value={kpis.jugadoresDamas} color="text-pink-500" />
        <KpiCard label="Jugadores Varones" value={kpis.jugadoresVarones} color="text-green-600" />
        <KpiCard label="Partidos Jugados" value={kpis.partidosJugados} sublabel={`${kpis.partidosPendientes} pendientes`} />
        <KpiCard label="Goles Totales" value={kpis.golesDamas + kpis.golesVarones} sublabel={`D:${kpis.golesDamas} V:${kpis.golesVarones}`} />
        <KpiCard label="Suspendidos" value={`D:${kpis.suspendidosDamas} V:${kpis.suspendidosVarones}`} color="text-red-500" />
        <KpiCard label="Multas Pendientes" value={`D:${kpis.multasDamas} V:${kpis.multasVarones}`} color="text-orange-500" />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">Alertas</h2>
        {alertas.jugadores2Amarillas?.length > 0 && <AlertBanner type="red" message={`${alertas.jugadores2Amarillas.length} jugador(es) con 2 amarillas (riesgo de suspensión)`} />}
        {alertas.jugadoresMultasSinPagar?.length > 0 && <AlertBanner type="red" message={`${alertas.jugadoresMultasSinPagar.length} jugador(es) con multas sin pagar`} />}
        {alertas.partidosSinResultado?.length > 0 && <AlertBanner type="yellow" message={`${alertas.partidosSinResultado.length} partido(s) sin resultado ingresado`} />}
        {alertas.proximaJornada && <AlertBanner type="green" message={`Próxima fecha: ${alertas.proximaJornada.descripcion || `Jornada ${alertas.proximaJornada.numero}`}`} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Goles por Jornada</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={golesPorFecha}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="jornada" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="damas" name="Damas" fill="#ec4899" />
              <Bar dataKey="varones" name="Varones" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Tarjetas</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-pink-600 mb-2">Damas</p>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={[{ name: 'Amarillas', value: tarjetas.damas.amarillas }, { name: 'Rojas', value: tarjetas.damas.rojas }]} cx="50%" cy="50%" innerRadius={30} outerRadius={60} dataKey="value">
                    <Cell fill="#fbbf24" /><Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-xs text-center text-gray-500">A: {tarjetas.damas.amarillas} R: {tarjetas.damas.rojas}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-green-600 mb-2">Varones</p>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={[{ name: 'Amarillas', value: tarjetas.varones.amarillas }, { name: 'Rojas', value: tarjetas.varones.rojas }]} cx="50%" cy="50%" innerRadius={30} outerRadius={60} dataKey="value">
                    <Cell fill="#fbbf24" /><Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-xs text-center text-gray-500">A: {tarjetas.varones.amarillas} R: {tarjetas.varones.rojas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Goleadoras - Damas</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topGoleadores.damas} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="nombre" type="category" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="goles" fill="#ec4899" name="Goles" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Goleadores - Varones</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topGoleadores.varones} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="nombre" type="category" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="goles" fill="#22c55e" name="Goles" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top 3 - Damas</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-pink-600 border-b"><th className="text-left py-2">#</th><th className="text-left">Equipo</th><th className="text-center">PJ</th><th className="text-center">Pts</th></tr></thead>
            <tbody>{tablaPosiciones.damas.map((t: any, i: number) => (
              <tr key={i} className="border-b border-gray-50"><td className="py-2 font-bold">{i + 1}</td><td>{t.equipo}</td><td className="text-center">{t.pj}</td><td className="text-center font-bold">{t.pts}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top 3 - Varones</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-green-600 border-b"><th className="text-left py-2">#</th><th className="text-left">Equipo</th><th className="text-center">PJ</th><th className="text-center">Pts</th></tr></thead>
            <tbody>{tablaPosiciones.varones.map((t: any, i: number) => (
              <tr key={i} className="border-b border-gray-50"><td className="py-2 font-bold">{i + 1}</td><td>{t.equipo}</td><td className="text-center">{t.pj}</td><td className="text-center font-bold">{t.pts}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Equipo Más Indisciplinado</h2>
          {masIndisciplinado.damas && <p className="text-pink-600 text-sm"><span className="font-medium">Damas:</span> {masIndisciplinado.damas.equipo} ({masIndisciplinado.damas.total} tarjetas)</p>}
          {masIndisciplinado.varones && <p className="text-green-600 text-sm"><span className="font-medium">Varones:</span> {masIndisciplinado.varones.equipo} ({masIndisciplinado.varones.total} tarjetas)</p>}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Próximo Partido</h2>
          {proximoPartido ? (
            <div>
              <p className="font-medium text-gray-800 text-sm">{proximoPartido.local?.nombre} vs {proximoPartido.visitante?.nombre}</p>
              <p className="text-xs text-gray-500">{proximoPartido.categoria?.nombre} • Jornada {proximoPartido.jornada?.numero}</p>
              {proximoPartido.hora && <p className="text-xs text-gray-500">Hora: {proximoPartido.hora}</p>}
              {proximoPartido.cancha && <p className="text-xs text-gray-500">Cancha: {proximoPartido.cancha}</p>}
            </div>
          ) : <p className="text-gray-400 text-sm">No hay partidos programados</p>}
        </div>
      </div>

      <VoiceAssistant
        data={data}
        categoria={categoria}
        setCategoria={setCategoria}
        categories={categories}
      />
    </div>
  )
}
