'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { motion } from 'framer-motion'
import { Users, UserCircle, Goal, Swords, AlertTriangle, Trophy, Clock, Ban, DollarSign } from 'lucide-react'
import VoiceAssistant from './VoiceAssistant'

interface DashboardData {
  kpis: any; golesPorFecha: any[]; tarjetas: any
  topGoleadores: { damas: any[]; varones: any[] }
  tablaPosiciones: { damas: any[]; varones: any[] }
  masIndisciplinado: any; proximoPartido: any; alertas: any
}

function SkeletonCard() {
  return <div className="bg-white rounded-xl border border-border p-5 space-y-3"><div className="skeleton h-3 w-24" /><div className="skeleton h-7 w-32" /><div className="skeleton h-2 w-20" /></div>
}

function SkeletonChart() {
  return <div className="bg-white rounded-xl border border-border p-5 space-y-4"><div className="skeleton h-4 w-36" /><div className="skeleton h-[220px] w-full" /></div>
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

const kpiConfig = [
  { key: 'equiposDamas', label: 'Equipos Damas', icon: Users, color: 'text-pink-500', bg: 'bg-pink-50' },
  { key: 'equiposVarones', label: 'Equipos Varones', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { key: 'jugadoresDamas', label: 'Jugadoras Damas', icon: UserCircle, color: 'text-pink-500', bg: 'bg-pink-50' },
  { key: 'jugadoresVarones', label: 'Jugadores Varones', icon: UserCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
]

export default function Dashboard({ initialData, initialCategories }: { initialData?: DashboardData | null, initialCategories?: any[] }) {
  const { token: authToken } = useAuth()
  const [data, setData] = useState<DashboardData | null>(initialData || null)
  const [categories, setCategories] = useState<any[]>(initialCategories || [])
  const [loading, setLoading] = useState(!initialData)
  const [categoria, setCategoria] = useState('todas')

  useEffect(() => {
    if (initialCategories?.length) return
    fetch('/api/categories', { headers: { Authorization: `Bearer ${authToken}` } })
      .then(r => r.json()).then(setCategories).catch(() => {})
  }, [authToken, initialCategories])

  useEffect(() => {
    if (!authToken) return
    setLoading(true)
    const params = new URLSearchParams()
    if (categoria !== 'todas') params.set('categoria', categoria)
    fetch(`/api/dashboard?${params}`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json() }).then(setData).catch(console.error).finally(() => setLoading(false))
  }, [categoria, authToken])

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart /><SkeletonChart />
      </div>
    </div>
  )
  if (!data) return <div className="text-center py-12 text-red-500">Error al cargar datos</div>

  const { kpis, golesPorFecha, tarjetas, topGoleadores, tablaPosiciones, masIndisciplinado, proximoPartido, alertas } = data

  const KpiCard = ({ label, value, icon: Icon, color, sublabel }: { label: string; value: string | number; icon: any; color?: string; sublabel?: string }) => (
    <motion.div variants={itemVariants} className="bg-white rounded-xl border border-border p-5 card-shadow-hover relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-accent to-amber-deep opacity-60" />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
          <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${color || 'text-stone-800'}`}>{value}</p>
          {sublabel && <p className="text-[11px] text-muted">{sublabel}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl ${color?.replace('text', 'bg').replace('-500', '-50') || 'bg-stone-50'} flex items-center justify-center shrink-0`}>
          <Icon size={20} className={color || 'text-stone-500'} />
        </div>
      </div>
    </motion.div>
  )

  const AlertBanner = ({ type, message }: { type: 'red' | 'yellow' | 'green'; message: string }) => {
    const colors = { red: 'bg-red-50 border-red-200 text-red-700', yellow: 'bg-amber-50 border-amber-200 text-amber-700', green: 'bg-emerald-50 border-emerald-200 text-emerald-700' }
    const icons = { red: AlertTriangle, yellow: AlertTriangle, green: Clock }
    const Icon = icons[type]
    return (
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`${colors[type]} border rounded-lg px-4 py-3 text-sm flex items-center gap-3`}>
        <Icon size={16} className="shrink-0" />
        <span>{message}</span>
      </motion.div>
    )
  }

  const extraKpis = [
    { label: 'Partidos Jugados', value: kpis.partidosJugados, icon: Swords, sublabel: `${kpis.partidosPendientes} pendientes` },
    { label: 'Goles Totales', value: kpis.golesDamas + kpis.golesVarones, icon: Goal, sublabel: `D:${kpis.golesDamas} V:${kpis.golesVarones}` },
    { label: 'Suspendidos', value: `D:${kpis.suspendidosDamas} V:${kpis.suspendidosVarones}`, icon: Ban, color: 'text-red-500' },
    { label: 'Multas Pendientes', value: `D:${kpis.multasDamas} V:${kpis.multasVarones}`, icon: DollarSign, color: 'text-orange-500' },
  ]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold text-stone-800 tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted">Categoría:</label>
          <select value={categoria} onChange={e => setCategoria(e.target.value)} className="border border-border rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none transition-all text-stone-700">
            <option value="todas">Todas</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiConfig.map(k => (
          <KpiCard key={k.key} label={k.label} value={kpis[k.key]} icon={k.icon} color={k.color} />
        ))}
        {extraKpis.map(k => (
          <KpiCard key={k.label} label={k.label} value={k.value} icon={k.icon} color={k.color} sublabel={k.sublabel} />
        ))}
      </motion.div>

      {alertas && (alertas.jugadores2Amarillas?.length > 0 || alertas.jugadoresMultasSinPagar?.length > 0 || alertas.partidosSinResultado?.length > 0 || alertas.proximaJornada) && (
        <motion.div variants={itemVariants} className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2">Alertas</h2>
          {alertas.jugadores2Amarillas?.length > 0 && <AlertBanner type="red" message={`${alertas.jugadores2Amarillas.length} jugador(es) con 2 amarillas (riesgo de suspensión)`} />}
          {alertas.jugadoresMultasSinPagar?.length > 0 && <AlertBanner type="red" message={`${alertas.jugadoresMultasSinPagar.length} jugador(es) con multas sin pagar`} />}
          {alertas.partidosSinResultado?.length > 0 && <AlertBanner type="yellow" message={`${alertas.partidosSinResultado.length} partido(s) sin resultado ingresado`} />}
          {alertas.proximaJornada && <AlertBanner type="green" message={`Próxima fecha: ${alertas.proximaJornada.descripcion || `Jornada ${alertas.proximaJornada.numero}`}`} />}
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-5 card-shadow-hover">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-5">Goles por Jornada</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={golesPorFecha}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" strokeWidth={0.5} />
              <XAxis dataKey="jornada" tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={{ stroke: '#e7e5e4' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e7e5e4', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="damas" name="Damas" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="varones" name="Varones" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 card-shadow-hover">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-5">Tarjetas</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-pink-500 mb-3">Damas</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={[{ name: 'Amarillas', value: tarjetas.damas.amarillas }, { name: 'Rojas', value: tarjetas.damas.rojas }]} cx="50%" cy="50%" innerRadius={32} outerRadius={62} dataKey="value" startAngle={90} endAngle={-270}>
                    <Cell fill="#f59e0b" /><Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e7e5e4' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2 text-xs">
                <span><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" /> {tarjetas.damas.amarillas}</span>
                <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" /> {tarjetas.damas.rojas}</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-3">Varones</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={[{ name: 'Amarillas', value: tarjetas.varones.amarillas }, { name: 'Rojas', value: tarjetas.varones.rojas }]} cx="50%" cy="50%" innerRadius={32} outerRadius={62} dataKey="value" startAngle={90} endAngle={-270}>
                    <Cell fill="#f59e0b" /><Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e7e5e4' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2 text-xs">
                <span><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" /> {tarjetas.varones.amarillas}</span>
                <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" /> {tarjetas.varones.rojas}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 card-shadow-hover">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-5">Top 5 Goleadoras - Damas</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topGoleadores.damas} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" strokeWidth={0.5} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="nombre" type="category" width={110} tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e7e5e4', fontSize: 12 }} />
              <Bar dataKey="goles" fill="#ec4899" name="Goles" radius={[0, 4, 4, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 card-shadow-hover">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-5">Top 5 Goleadores - Varones</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topGoleadores.varones} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" strokeWidth={0.5} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="nombre" type="category" width={110} tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e7e5e4', fontSize: 12 }} />
              <Bar dataKey="goles" fill="#10b981" name="Goles" radius={[0, 4, 4, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-5 card-shadow-hover">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-4"><Trophy size={14} className="inline mr-1.5 text-amber-accent" />Top 3 - Damas</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-pink-500 text-[11px] uppercase tracking-wider font-semibold border-b border-border"><th className="text-left pb-2 font-medium">#</th><th className="text-left font-medium">Equipo</th><th className="text-center font-medium">PJ</th><th className="text-center font-medium">Pts</th></tr></thead>
            <tbody>{tablaPosiciones.damas.map((t: any, i: number) => (
              <tr key={i} className="border-b border-stone-100 last:border-0"><td className="py-2.5 font-bold text-muted text-xs">{i + 1}</td><td className="py-2.5 text-sm font-medium text-stone-700">{t.equipo}</td><td className="py-2.5 text-center text-stone-500">{t.pj}</td><td className="py-2.5 text-center font-extrabold text-stone-800">{t.pts}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 card-shadow-hover">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-4"><Trophy size={14} className="inline mr-1.5 text-amber-accent" />Top 3 - Varones</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-emerald-500 text-[11px] uppercase tracking-wider font-semibold border-b border-border"><th className="text-left pb-2 font-medium">#</th><th className="text-left font-medium">Equipo</th><th className="text-center font-medium">PJ</th><th className="text-center font-medium">Pts</th></tr></thead>
            <tbody>{tablaPosiciones.varones.map((t: any, i: number) => (
              <tr key={i} className="border-b border-stone-100 last:border-0"><td className="py-2.5 font-bold text-muted text-xs">{i + 1}</td><td className="py-2.5 text-sm font-medium text-stone-700">{t.equipo}</td><td className="py-2.5 text-center text-stone-500">{t.pj}</td><td className="py-2.5 text-center font-extrabold text-stone-800">{t.pts}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-5 card-shadow-hover">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">Equipo Más Indisciplinado</h2>
          <div className="space-y-1.5">
            {masIndisciplinado.damas && <p className="text-sm text-stone-700"><span className="text-pink-500 font-semibold">Damas:</span> {masIndisciplinado.damas.equipo} <span className="text-muted">({masIndisciplinado.damas.total} tarjetas)</span></p>}
            {masIndisciplinado.varones && <p className="text-sm text-stone-700"><span className="text-emerald-500 font-semibold">Varones:</span> {masIndisciplinado.varones.equipo} <span className="text-muted">({masIndisciplinado.varones.total} tarjetas)</span></p>}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 card-shadow-hover">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">Próximo Partido</h2>
          {proximoPartido ? (
            <div>
              <p className="font-bold text-stone-800">{proximoPartido.local?.nombre} <span className="text-muted font-normal">vs</span> {proximoPartido.visitante?.nombre}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted">
                <span>{proximoPartido.categoria?.nombre} • Jornada {proximoPartido.jornada?.numero}</span>
                {proximoPartido.hora && <span>🕐 {proximoPartido.hora}</span>}
                {proximoPartido.cancha && <span>🏟️ {proximoPartido.cancha}</span>}
              </div>
            </div>
          ) : <p className="text-muted text-sm">No hay partidos programados</p>}
        </div>
      </motion.div>

      <VoiceAssistant data={data} categoria={categoria} setCategoria={setCategoria} categories={categories} />
    </motion.div>
  )
}