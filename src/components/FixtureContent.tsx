'use client'

import { useEffect, useState } from 'react'
import { Edit2, Trash2, Plus, Calendar } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { useDialog } from './ConfirmDialog'
import { motion, AnimatePresence } from 'framer-motion'

export default function FixtureContent({ initialJornadas, initialCategories, initialTeams }: { initialJornadas?: any[], initialCategories?: any[], initialTeams?: any[] }) {
  const { token } = useAuth()
  const dialog = useDialog()
  const [jornadas, setJornadas] = useState<any[]>(initialJornadas || [])
  const [categories, setCategories] = useState<any[]>(initialCategories || [])
  const [teams, setTeams] = useState<any[]>(initialTeams || [])
  const [loading, setLoading] = useState(!initialJornadas)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editMatch, setEditMatch] = useState<any>(null)
  const [form, setForm] = useState({ hora: '', cancha: '', arbitro: '' })
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ jornadaNumero: 1, categoriaId: '', localId: '', visitanteId: '' })

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const load = () => {
    Promise.all([
      fetch('/api/fixture', { headers }).then(r => r.json()),
      fetch('/api/categories', { headers }).then(r => r.json()),
      fetch('/api/teams', { headers }).then(r => r.json())
    ])
    .then(([fixt, cats, tms]) => {
      setJornadas(Array.isArray(fixt) ? fixt : [])
      setCategories(Array.isArray(cats) ? cats : [])
      setTeams(Array.isArray(tms) ? tms : [])
    })
    .catch(console.error)
    .finally(() => setLoading(false))
  }

  useEffect(() => { if (!initialJornadas) load() }, [])

  const handleGeneratePrimera = async () => {
    dialog.confirm({
      title: 'Generar Primera Rueda',
      message: '¿Generar los partidos pendientes de la Primera Rueda (ida)?',
      confirmText: 'Generar',
      onConfirm: async () => {
        const res = await fetch('/api/fixture/generar?rueda=primera', { method: 'POST', headers })
        const data = await res.json()
        if (data.error) dialog.alert({ title: 'Error', message: data.error })
        load()
      }
    })
  }

  const handleGenerateSegunda = async () => {
    dialog.confirm({
      title: 'Generar Segunda Rueda',
      message: '¿Generar los partidos pendientes de la Segunda Rueda (vuelta)?',
      confirmText: 'Generar',
      onConfirm: async () => {
        const res = await fetch('/api/fixture/generar?rueda=segunda', { method: 'POST', headers })
        const data = await res.json()
        if (data.error) dialog.alert({ title: 'Error', message: data.error })
        load()
      }
    })
  }

  const handleClear = async () => {
    dialog.confirm({
      title: 'Limpiar Todo',
      message: '¿ESTÁS SEGURO? Esto borrará TODOS los partidos y jornadas existentes.',
      confirmText: 'Eliminar Todo',
      onConfirm: async () => { await fetch('/api/fixture', { method: 'DELETE', headers }); load() }
    })
  }

  const handleSaveMatch = async () => {
    if (editMatch) {
      await fetch(`/api/fixture/partido/${editMatch.id}`, { method: 'PUT', headers, body: JSON.stringify(form) })
      setShowEditModal(false); setEditMatch(null); load()
    }
  }

  const handleAddManualMatch = async () => {
    if (!addForm.jornadaNumero || !addForm.categoriaId || !addForm.localId || !addForm.visitanteId) {
      dialog.alert({ title: 'Campos incompletos', message: 'Por favor completa todos los campos' }); return
    }
    if (addForm.localId === addForm.visitanteId) {
      dialog.alert({ title: 'Equipo inválido', message: 'Un equipo no puede jugar contra sí mismo' }); return
    }
    const res = await fetch('/api/fixture/partido', { method: 'POST', headers, body: JSON.stringify(addForm) })
    if (!res.ok) { const data = await res.json(); dialog.alert({ title: 'Error', message: data.error || 'Error al guardar' }); return }
    setShowAddModal(false); setAddForm({ jornadaNumero: 1, categoriaId: '', localId: '', visitanteId: '' }); load()
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-7 w-32" />
      <div className="bg-white rounded-xl border border-border p-5 space-y-5">
        {Array.from({ length: 3 }).map((_, i) => <div key={i}><div className="skeleton h-5 w-44 mb-3" /><div className="skeleton h-16 w-full" /></div>)}
      </div>
    </div>
  )

  const filteredTeams = teams.filter(t => t.categoriaId === Number(addForm.categoriaId))

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Calendar size={22} className="text-amber-accent" />
        <h1 className="text-xl font-extrabold text-stone-800 tracking-tight">Fixture</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm flex items-center gap-2">
          <Plus size={15} /> Agregar Partido
        </button>
        <button onClick={handleGeneratePrimera} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm">
          Generar Primera Rueda
        </button>
        <button onClick={handleGenerateSegunda} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm">
          Generar Segunda Rueda
        </button>
        <button onClick={handleClear} className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-sm flex items-center gap-2">
          <Trash2 size={15} /> Limpiar Todo
        </button>
      </div>

      {jornadas.map((j, jIdx) => {
        const dm = j.partidos.filter((p: any) => p.categoria?.nombre === 'Damas')
        const vm = j.partidos.filter((p: any) => p.categoria?.nombre === 'Varones')
        const equiposEnPartidoDamas = new Set(dm.flatMap((p: any) => [p.localId, p.visitanteId]))
        const equiposEnPartidoVarones = new Set(vm.flatMap((p: any) => [p.localId, p.visitanteId]))
        const descansanDamas = teams.filter((t: any) => t.categoria?.nombre === 'Damas' && !equiposEnPartidoDamas.has(t.id))
        const descansanVarones = teams.filter((t: any) => t.categoria?.nombre === 'Varones' && !equiposEnPartidoVarones.has(t.id))

        return (
          <motion.div key={j.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: jIdx * 0.05 }} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-accent to-amber-deep flex items-center justify-center text-xs font-bold text-sidebar shadow-sm shadow-amber-500/20">{j.numero}</div>
              <h2 className="text-sm font-bold text-stone-700">
                Jornada {j.numero}
                {j.fecha && <span className="text-sm font-normal text-muted ml-1.5">({j.fecha})</span>}
                {j.descripcion && <span className="text-xs font-normal text-muted ml-1.5">- {j.descripcion}</span>}
              </h2>
            </div>

            <div className="mb-4">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-pink-500 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500" />DAMAS
              </h3>
              {dm.length > 0 ? (
                <div className="bg-white rounded-xl border border-border overflow-hidden card-shadow-hover">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[550px]">
                      <thead><tr className="bg-pink-50/50 text-[11px] font-semibold uppercase tracking-wider text-pink-600">
                        <th className="text-left px-4 py-2.5 font-medium">Local</th><th className="text-center px-3 py-2.5 font-medium">vs</th>
                        <th className="text-left px-4 py-2.5 font-medium">Visitante</th><th className="text-center px-3 py-2.5 font-medium">Resultado</th>
                        <th className="text-center px-3 py-2.5 font-medium">Goles</th><th className="text-center px-3 py-2.5 font-medium">Hora</th>
                        <th className="text-center px-3 py-2.5 font-medium">Cancha</th><th className="text-center px-3 py-2.5 font-medium"></th>
                      </tr></thead>
                      <tbody>{dm.flatMap((m: any, mIdx: number) => {
                        const golesLocal = m.goles?.filter((g: any) => g.equipoId === m.localId) || []
                        const golesVisit = m.goles?.filter((g: any) => g.equipoId === m.visitanteId) || []
                        const tarjetas = m.tarjetas || []
                        const isExpanded = expandedId === m.id
                        const total = golesLocal.length + golesVisit.length
                        return [
                          <tr key={m.id} className={`border-t border-border transition-colors hover:bg-pink-50/20 ${mIdx % 2 === 1 ? 'bg-stone-50/30' : ''}`}>
                            <td className="px-4 py-2.5 font-semibold text-stone-800">{m.local?.nombre}</td>
                            <td className="px-3 py-2.5 text-center text-muted font-medium text-xs">vs</td>
                            <td className="px-4 py-2.5 font-semibold text-stone-800">{m.visitante?.nombre}</td>
                            <td className="px-3 py-2.5 text-center font-extrabold">{m.jugado ? `${m.golesLocal} - ${m.golesVisit}` : <span className="text-stone-300">-</span>}</td>
                            <td className="px-3 py-2.5 text-center">
                              {m.jugado ? (
                                <button onClick={() => setExpandedId(isExpanded ? null : m.id)} className={`text-xs underline underline-offset-2 ${isExpanded ? 'text-stone-500' : 'text-muted hover:text-stone-600'}`}>
                                  {isExpanded ? 'Ocultar' : `${total} gol(es)`}
                                </button>
                              ) : <span className="text-stone-300">-</span>}
                            </td>
                            <td className="px-3 py-2.5 text-center text-stone-600 text-xs">{m.hora || <span className="text-stone-300">-</span>}</td>
                            <td className="px-3 py-2.5 text-center text-stone-600 text-xs">{m.cancha || <span className="text-stone-300">-</span>}</td>
                            <td className="px-3 py-2.5 text-center">
                              {!m.jugado && <button onClick={() => { setEditMatch(m); setForm({ hora: m.hora || '', cancha: m.cancha || '', arbitro: m.arbitro || '' }); setShowEditModal(true) }} className="p-1 text-amber-accent hover:text-amber-deep transition-colors"><Edit2 size={14} /></button>}
                            </td>
                          </tr>,
                          isExpanded ? (
                            <tr key={`${m.id}-detalle`}>
                              <td colSpan={8} className="px-4 pb-3">
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-pink-50/50 rounded-xl p-3 text-xs space-y-1 border border-pink-100">
                                  {golesLocal.length > 0 && <div><span className="font-bold text-stone-700">{m.local?.nombre}: </span>{golesLocal.map((g: any, i: number) => (<span key={i} className="text-stone-600">{g.jugador?.nombre}{g.cantidad > 1 ? ` (${g.cantidad})` : ''}{i < golesLocal.length - 1 ? ', ' : ''}</span>))}</div>}
                                  {golesVisit.length > 0 && <div><span className="font-bold text-stone-700">{m.visitante?.nombre}: </span>{golesVisit.map((g: any, i: number) => (<span key={i} className="text-stone-600">{g.jugador?.nombre}{g.cantidad > 1 ? ` (${g.cantidad})` : ''}{i < golesVisit.length - 1 ? ', ' : ''}</span>))}</div>}
                                  {tarjetas.length > 0 && <div><span className="font-bold text-stone-700">Tarjetas: </span>{tarjetas.map((c: any, i: number) => (<span key={i} className={c.tipo === 'Roja' ? 'text-red-500' : 'text-amber-600'}>{c.tipo === 'Amarilla' ? '🟡' : '🔴'} {c.jugador?.nombre}{c.jugador?.equipo?.nombre ? ` (${c.jugador.equipo.nombre})` : ''}{i < tarjetas.length - 1 ? ' | ' : ''}</span>))}</div>}
                                  {total === 0 && tarjetas.length === 0 && <p className="text-muted italic">Sin goles ni tarjetas</p>}
                                </motion.div>
                              </td>
                            </tr>
                          ) : null,
                        ]
                      })}</tbody>
                    </table>
                  </div>
                </div>
              ) : descansanDamas.length > 0 ? (
                <div className="bg-pink-50/50 rounded-xl border border-pink-200 p-4 mb-2">
                  <p className="text-xs font-bold text-pink-600">Jornada de descanso colectivo</p>
                  <p className="text-[11px] text-pink-400 mt-0.5">Descansan: {descansanDamas.map((t: any) => t.nombre).join(', ')}</p>
                </div>
              ) : null}
              {dm.length > 0 && descansanDamas.length > 0 && (
                <p className="text-[11px] text-pink-400 mt-1">Descansan: {descansanDamas.map((t: any) => t.nombre).join(', ')}</p>
              )}
            </div>

            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />VARONES
              </h3>
              {vm.length > 0 ? (
                <div className="bg-white rounded-xl border border-border overflow-hidden card-shadow-hover">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[550px]">
                      <thead><tr className="bg-emerald-50/50 text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                        <th className="text-left px-4 py-2.5 font-medium">Local</th><th className="text-center px-3 py-2.5 font-medium">vs</th>
                        <th className="text-left px-4 py-2.5 font-medium">Visitante</th><th className="text-center px-3 py-2.5 font-medium">Resultado</th>
                        <th className="text-center px-3 py-2.5 font-medium">Goles</th><th className="text-center px-3 py-2.5 font-medium">Hora</th>
                        <th className="text-center px-3 py-2.5 font-medium">Cancha</th><th className="text-center px-3 py-2.5 font-medium"></th>
                      </tr></thead>
                      <tbody>{vm.flatMap((m: any, mIdx: number) => {
                        const golesLocal = m.goles?.filter((g: any) => g.equipoId === m.localId) || []
                        const golesVisit = m.goles?.filter((g: any) => g.equipoId === m.visitanteId) || []
                        const tarjetas = m.tarjetas || []
                        const isExpanded = expandedId === m.id
                        const total = golesLocal.length + golesVisit.length
                        return [
                          <tr key={m.id} className={`border-t border-border transition-colors hover:bg-emerald-50/20 ${mIdx % 2 === 1 ? 'bg-stone-50/30' : ''}`}>
                            <td className="px-4 py-2.5 font-semibold text-stone-800">{m.local?.nombre}</td>
                            <td className="px-3 py-2.5 text-center text-muted font-medium text-xs">vs</td>
                            <td className="px-4 py-2.5 font-semibold text-stone-800">{m.visitante?.nombre}</td>
                            <td className="px-3 py-2.5 text-center font-extrabold">{m.jugado ? `${m.golesLocal} - ${m.golesVisit}` : <span className="text-stone-300">-</span>}</td>
                            <td className="px-3 py-2.5 text-center">
                              {m.jugado ? (
                                <button onClick={() => setExpandedId(isExpanded ? null : m.id)} className={`text-xs underline underline-offset-2 ${isExpanded ? 'text-stone-500' : 'text-muted hover:text-stone-600'}`}>
                                  {isExpanded ? 'Ocultar' : `${total} gol(es)`}
                                </button>
                              ) : <span className="text-stone-300">-</span>}
                            </td>
                            <td className="px-3 py-2.5 text-center text-stone-600 text-xs">{m.hora || <span className="text-stone-300">-</span>}</td>
                            <td className="px-3 py-2.5 text-center text-stone-600 text-xs">{m.cancha || <span className="text-stone-300">-</span>}</td>
                            <td className="px-3 py-2.5 text-center">
                              {!m.jugado && <button onClick={() => { setEditMatch(m); setForm({ hora: m.hora || '', cancha: m.cancha || '', arbitro: m.arbitro || '' }); setShowEditModal(true) }} className="p-1 text-amber-accent hover:text-amber-deep transition-colors"><Edit2 size={14} /></button>}
                            </td>
                          </tr>,
                          isExpanded ? (
                            <tr key={`${m.id}-detalle`}>
                              <td colSpan={8} className="px-4 pb-3">
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-emerald-50/50 rounded-xl p-3 text-xs space-y-1 border border-emerald-100">
                                  {golesLocal.length > 0 && <div><span className="font-bold text-stone-700">{m.local?.nombre}: </span>{golesLocal.map((g: any, i: number) => (<span key={i} className="text-stone-600">{g.jugador?.nombre}{g.cantidad > 1 ? ` (${g.cantidad})` : ''}{i < golesLocal.length - 1 ? ', ' : ''}</span>))}</div>}
                                  {golesVisit.length > 0 && <div><span className="font-bold text-stone-700">{m.visitante?.nombre}: </span>{golesVisit.map((g: any, i: number) => (<span key={i} className="text-stone-600">{g.jugador?.nombre}{g.cantidad > 1 ? ` (${g.cantidad})` : ''}{i < golesVisit.length - 1 ? ', ' : ''}</span>))}</div>}
                                  {tarjetas.length > 0 && <div><span className="font-bold text-stone-700">Tarjetas: </span>{tarjetas.map((c: any, i: number) => (<span key={i} className={c.tipo === 'Roja' ? 'text-red-500' : 'text-amber-600'}>{c.tipo === 'Amarilla' ? '🟡' : '🔴'} {c.jugador?.nombre}{c.jugador?.equipo?.nombre ? ` (${c.jugador.equipo.nombre})` : ''}{i < tarjetas.length - 1 ? ' | ' : ''}</span>))}</div>}
                                  {total === 0 && tarjetas.length === 0 && <p className="text-muted italic">Sin goles ni tarjetas</p>}
                                </motion.div>
                              </td>
                            </tr>
                          ) : null,
                        ]
                      })}</tbody>
                    </table>
                  </div>
                </div>
              ) : descansanVarones.length > 0 ? (
                <div className="bg-emerald-50/50 rounded-xl border border-emerald-200 p-4 mb-2">
                  <p className="text-xs font-bold text-emerald-600">Jornada de descanso colectivo</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5">Descansan: {descansanVarones.map((t: any) => t.nombre).join(', ')}</p>
                </div>
              ) : null}
              {vm.length > 0 && descansanVarones.length > 0 && (
                <p className="text-[11px] text-emerald-400 mt-1">Descansan: {descansanVarones.map((t: any) => t.nombre).join(', ')}</p>
              )}
            </div>
          </motion.div>
        )
      })}

      <AnimatePresence>
        {showEditModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-extrabold text-lg text-stone-800 mb-1">Editar Partido</h3>
              <p className="text-xs text-muted mb-4 font-semibold uppercase tracking-wider">{editMatch?.local?.nombre} vs {editMatch?.visitante?.nombre}</p>
              <div className="space-y-3">
                <div><label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Hora</label><input value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-stone-50/50 focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none transition-all" placeholder="10:00" /></div>
                <div><label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Cancha</label><input value={form.cancha} onChange={e => setForm({ ...form, cancha: e.target.value })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-stone-50/50 focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none transition-all" placeholder="Cancha Principal" /></div>
                <div><label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Árbitro</label><input value={form.arbitro} onChange={e => setForm({ ...form, arbitro: e.target.value })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-stone-50/50 focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none transition-all" placeholder="Nombre del árbitro" /></div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-semibold text-stone-500 hover:bg-stone-100 rounded-xl transition-colors">Cancelar</button>
                <button onClick={handleSaveMatch} className="px-5 py-2 text-sm bg-gradient-to-r from-amber-accent to-amber-deep text-sidebar font-bold rounded-xl hover:from-amber-400 hover:to-amber-600 transition-all shadow-sm shadow-amber-500/20">Guardar</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-extrabold text-lg text-stone-800 mb-4">Agregar Partido Manual</h3>
              <div className="space-y-3">
                <div><label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Jornada</label><input type="number" min="1" value={addForm.jornadaNumero} onChange={e => setAddForm({ ...addForm, jornadaNumero: Number(e.target.value) })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-stone-50/50 focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none transition-all" /></div>
                <div><label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Categoría</label>
                  <select value={addForm.categoriaId} onChange={e => setAddForm({ ...addForm, categoriaId: e.target.value, localId: '', visitanteId: '' })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none transition-all">
                    <option value="">Seleccione</option>{categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                {addForm.categoriaId && (
                  <>
                    <div><label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Local</label>
                      <select value={addForm.localId} onChange={e => setAddForm({ ...addForm, localId: e.target.value })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none transition-all">
                        <option value="">Seleccione</option>{filteredTeams.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Visitante</label>
                      <select value={addForm.visitanteId} onChange={e => setAddForm({ ...addForm, visitanteId: e.target.value })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none transition-all">
                        <option value="">Seleccione</option>{filteredTeams.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-semibold text-stone-500 hover:bg-stone-100 rounded-xl transition-colors">Cancelar</button>
                <button onClick={handleAddManualMatch} className="px-5 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm">Guardar Partido</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}