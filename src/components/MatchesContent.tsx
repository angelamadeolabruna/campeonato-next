'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { useDialog } from './ConfirmDialog'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords } from 'lucide-react'

export default function MatchesContent({ initialMatches }: { initialMatches?: any[] }) {
  const { token } = useAuth()
  const dialog = useDialog()
  const [matches, setMatches] = useState<any[]>(initialMatches || [])
  const [loading, setLoading] = useState(!initialMatches)
  const [showModal, setShowModal] = useState(false)
  const [currentMatch, setCurrentMatch] = useState<any>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [saveError, setSaveError] = useState('')
  const [form, setForm] = useState({ golesLocal: 0, golesVisit: 0, goleadores: [] as any[], tarjetas: [] as any[] })
  const [golInput, setGolInput] = useState({ jugadorId: 0, equipoId: 0, cantidad: 1 })
  const [tarjInput, setTarjInput] = useState({ jugadorId: 0, tipo: 'Amarilla' })

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const load = () => fetch('/api/matches', { headers }).then(r => r.json()).then(setMatches).catch(console.error).finally(() => setLoading(false))
  useEffect(() => { if (!initialMatches) load() }, [])

  const openResultado = async (m: any) => {
    setSaveError('')
    try {
      const res = await fetch(`/api/matches/${m.id}`, { headers })
      if (!res.ok) { dialog.alert({ title: 'Error', message: 'No se pudo cargar el partido' }); return }
      const full = await res.json()
      if (!full.local?.jugadores?.length && !full.visitante?.jugadores?.length) {
        dialog.alert({ title: 'Sin jugadores', message: 'Ningún equipo tiene jugadores registrados. Agregá jugadores en la página de Jugadores primero.' })
        return
      }
      setCurrentMatch(full)
      setForm({
        golesLocal: full.golesLocal, golesVisit: full.golesVisit,
        goleadores: full.goles.map((g: any) => ({ jugadorId: g.jugadorId, equipoId: g.equipoId, cantidad: g.cantidad })),
        tarjetas: full.tarjetas.map((c: any) => ({ jugadorId: c.jugadorId, tipo: c.tipo })),
      })
      setShowModal(true)
    } catch {
      dialog.alert({ title: 'Error', message: 'Error al cargar el partido' })
    }
  }

  const addGol = () => {
    if (golInput.jugadorId && golInput.equipoId) {
      setForm({ ...form, goleadores: [...form.goleadores, { ...golInput }] })
      setGolInput({ jugadorId: 0, equipoId: 0, cantidad: 1 })
    }
  }

  const addTarjeta = () => {
    if (tarjInput.jugadorId) {
      setForm({ ...form, tarjetas: [...form.tarjetas, { ...tarjInput }] })
      setTarjInput({ jugadorId: 0, tipo: 'Amarilla' })
    }
  }

  const handleSave = async () => {
    if (!currentMatch) return
    setSaveError('')
    try {
      const res = await fetch(`/api/matches/${currentMatch.id}/resultado`, { method: 'PUT', headers, body: JSON.stringify(form) })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSaveError(data.error || 'Error al guardar resultado')
        return
      }
      setShowModal(false)
      load()
    } catch (e: any) {
      setSaveError(e.message || 'Error de conexión')
    }
  }

  const equipoJugadores = (equipoId: number) => {
    if (!currentMatch) return []
    if (currentMatch.localId === equipoId) return currentMatch.local.jugadores || []
    if (currentMatch.visitanteId === equipoId) return currentMatch.visitante.jugadores || []
    return []
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-7 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white rounded-xl border border-border p-5 space-y-2"><div className="skeleton h-3 w-32" /><div className="skeleton h-5 w-44" /><div className="skeleton h-8 w-32" /></div>)}
      </div>
    </div>
  )

  const pendientes = matches.filter(m => !m.jugado)
  const jugados = matches.filter(m => m.jugado)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Swords size={22} className="text-amber-accent" />
        <h1 className="text-xl font-extrabold text-stone-800 tracking-tight">Resultados de Partidos</h1>
      </div>

      <h2 className="text-xs font-bold uppercase tracking-wider text-amber-accent mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-accent" />Pendientes
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <AnimatePresence>
          {pendientes.map(m => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-border p-5 card-shadow-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-accent to-amber-deep opacity-40" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">{m.categoria?.nombre} • Jornada {m.jornada?.numero} {m.hora && `• ${m.hora}`}</p>
              <p className="font-bold text-stone-800">{m.local?.nombre} vs {m.visitante?.nombre}</p>
              <button onClick={() => openResultado(m)} className="mt-3 text-sm bg-gradient-to-r from-amber-accent to-amber-deep text-sidebar font-bold px-4 py-1.5 rounded-lg hover:from-amber-400 hover:to-amber-600 transition-all shadow-sm shadow-amber-500/20">
                Ingresar Resultado
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {pendientes.length === 0 && <p className="text-muted text-sm col-span-2">No hay partidos pendientes</p>}
      </div>

      <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Jugados
      </h2>
      <div className="bg-white rounded-xl border border-border overflow-hidden card-shadow-hover">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[550px]">
            <thead>
              <tr className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                <th className="text-left px-4 py-3 font-medium">Jornada</th>
                <th className="text-left px-4 py-3 font-medium">Local</th>
                <th className="text-center px-4 py-3 font-medium">Resultado</th>
                <th className="text-left px-4 py-3 font-medium">Visitante</th>
                <th className="text-center px-4 py-3 font-medium">Cat.</th>
                <th className="text-center px-4 py-3 font-medium">Goles</th>
                <th className="text-right px-4 py-3 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {jugados.map((m, idx) => {
                const golesLocal = m.goles?.filter((g: any) => g.equipoId === m.localId) || []
                const golesVisit = m.goles?.filter((g: any) => g.equipoId === m.visitanteId) || []
                const tarjetas = m.tarjetas || []
                const isExpanded = expandedId === m.id
                return [
                  <tr key={m.id} className={`border-t border-border transition-colors hover:bg-stone-50/50 ${idx % 2 === 1 ? 'bg-stone-50/30' : ''}`}>
                    <td className="px-4 py-3 text-stone-600 text-xs">{m.jornada?.numero}</td>
                    <td className="px-4 py-3 font-semibold text-stone-800">{m.local?.nombre}</td>
                    <td className="px-4 py-3 text-center font-extrabold text-stone-800 whitespace-nowrap">{m.golesLocal} - {m.golesVisit}</td>
                    <td className="px-4 py-3 font-semibold text-stone-800">{m.visitante?.nombre}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={m.categoria?.nombre === 'Damas' ? 'badge-damas' : 'badge-varones'}>{m.categoria?.nombre}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setExpandedId(isExpanded ? null : m.id)} className={`text-xs underline underline-offset-2 ${isExpanded ? 'text-stone-500' : 'text-muted hover:text-stone-600'}`}>
                        {isExpanded ? 'Ocultar' : `${golesLocal.length + golesVisit.length} gol(es)`}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openResultado(m)} className="text-amber-accent hover:text-amber-deep text-xs font-semibold underline underline-offset-2">Editar</button>
                    </td>
                  </tr>,
                  isExpanded ? (
                    <tr key={`${m.id}-detalle`}>
                      <td colSpan={7} className="px-4 pb-3">
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-stone-50 rounded-xl p-4 text-xs space-y-2 border border-border">
                          {golesLocal.length > 0 && (
                            <div><span className="font-bold text-stone-700">{m.local?.nombre}: </span>{golesLocal.map((g: any, i: number) => (
                              <span key={i} className="text-stone-600">{g.jugador?.nombre}{g.cantidad > 1 ? ` (${g.cantidad})` : ''}{i < golesLocal.length - 1 ? ', ' : ''}</span>
                            ))}</div>
                          )}
                          {golesVisit.length > 0 && (
                            <div><span className="font-bold text-stone-700">{m.visitante?.nombre}: </span>{golesVisit.map((g: any, i: number) => (
                              <span key={i} className="text-stone-600">{g.jugador?.nombre}{g.cantidad > 1 ? ` (${g.cantidad})` : ''}{i < golesVisit.length - 1 ? ', ' : ''}</span>
                            ))}</div>
                          )}
                          {tarjetas.length > 0 && (
                            <div><span className="font-bold text-stone-700">Tarjetas: </span>{tarjetas.map((c: any, i: number) => (
                              <span key={i} className={c.tipo === 'Roja' ? 'text-red-500' : 'text-amber-600'}>
                                {c.tipo === 'Amarilla' ? '🟡' : '🔴'} {c.jugador?.nombre}{c.jugador?.equipo?.nombre ? ` (${c.jugador.equipo.nombre})` : ''}{i < tarjetas.length - 1 ? ' | ' : ''}
                              </span>
                            ))}</div>
                          )}
                          {golesLocal.length === 0 && golesVisit.length === 0 && tarjetas.length === 0 && (
                            <p className="text-muted italic">Sin goles ni tarjetas registrados</p>
                          )}
                        </motion.div>
                      </td>
                    </tr>
                  ) : null,
                ]
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && currentMatch && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-extrabold text-lg text-stone-800 mb-1">{currentMatch.local?.nombre} vs {currentMatch.visitante?.nombre}</h3>
              <p className="text-xs text-muted mb-5 font-semibold uppercase tracking-wider">Jornada {currentMatch.jornada?.numero} • {currentMatch.categoria?.nombre}</p>

              {saveError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />{saveError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Goles Local</label>
                  <input type="number" value={form.golesLocal} onChange={e => setForm({ ...form, golesLocal: Number(e.target.value) })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-stone-50/50 focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none transition-all" /></div>
                <div><label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Goles Visitante</label>
                  <input type="number" value={form.golesVisit} onChange={e => setForm({ ...form, golesVisit: Number(e.target.value) })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-stone-50/50 focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none transition-all" /></div>
              </div>

              <div className="mb-4 p-4 bg-stone-50 rounded-xl border border-border">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">Goleadores</p>
                <p className="text-[11px] text-muted mb-3">Seleccioná equipo, jugador, cantidad y presioná <strong>+</strong>. Repetí para cada goleador de AMBOS equipos.</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <select value={golInput.equipoId} onChange={e => setGolInput({ ...golInput, equipoId: Number(e.target.value), jugadorId: 0 })} className="border border-border rounded-xl px-2 py-1.5 text-xs flex-1 min-w-[100px] bg-white focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none">
                    <option value={0}>Equipo</option>
                    <option value={currentMatch.localId}>{currentMatch.local?.nombre}</option>
                    <option value={currentMatch.visitanteId}>{currentMatch.visitante?.nombre}</option>
                  </select>
                  <select value={golInput.jugadorId} onChange={e => setGolInput({ ...golInput, jugadorId: Number(e.target.value) })} className="border border-border rounded-xl px-2 py-1.5 text-xs flex-1 min-w-[100px] bg-white focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none">
                    <option value={0}>Jugador</option>
                    {golInput.equipoId > 0 && equipoJugadores(golInput.equipoId).map((j: any) => (
                      <option key={j.id} value={j.id}>{j.nombre} (#{j.numero})</option>
                    ))}
                  </select>
                  <input type="number" value={golInput.cantidad} onChange={e => setGolInput({ ...golInput, cantidad: Number(e.target.value) })} className="border border-border rounded-xl px-2 py-1.5 text-xs w-16 bg-white focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none" min={1} />
                  <button onClick={addGol} className="bg-gradient-to-r from-amber-accent to-amber-deep text-sidebar font-bold px-3 py-1.5 rounded-xl text-xs hover:from-amber-400 hover:to-amber-600 transition-all shadow-sm">+</button>
                </div>
                {form.goleadores.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-muted mb-1">Goleadores ({form.goleadores.length}):</p>
                    {form.goleadores.map((g, i) => {
                      const nombre = equipoJugadores(g.equipoId).find((j: any) => j.id === g.jugadorId)?.nombre || '?'
                      const equipo = g.equipoId === currentMatch.localId ? currentMatch.local?.nombre : currentMatch.visitante?.nombre
                      return (
                        <div key={i} className="text-xs text-stone-600 mb-1 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-stone-400" />
                          <span>{nombre} ({equipo}) - {g.cantidad} gol(es)</span>
                          <button onClick={() => setForm({ ...form, goleadores: form.goleadores.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600 ml-auto font-bold">×</button>
                        </div>
                      )
                    })}
                  </div>
                )}
                {form.goleadores.length === 0 && <p className="text-[11px] text-muted italic">No hay goleadores agregados todavía</p>}
              </div>

              <div className="mb-4 p-4 bg-stone-50 rounded-xl border border-border">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">Tarjetas</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <select value={tarjInput.jugadorId} onChange={e => setTarjInput({ ...tarjInput, jugadorId: Number(e.target.value) })} className="border border-border rounded-xl px-2 py-1.5 text-xs flex-1 min-w-[100px] bg-white focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none">
                    <option value={0}>Jugador</option>
                    {[...(currentMatch.local.jugadores || []), ...(currentMatch.visitante.jugadores || [])].map((j: any) => (
                      <option key={j.id} value={j.id}>{j.nombre} - {(j.equipoId === currentMatch.localId ? currentMatch.local?.nombre : currentMatch.visitante?.nombre)}</option>
                    ))}
                  </select>
                  <select value={tarjInput.tipo} onChange={e => setTarjInput({ ...tarjInput, tipo: e.target.value })} className="border border-border rounded-xl px-2 py-1.5 text-xs bg-white focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none">
                    <option value="Amarilla">🟡 Amarilla</option>
                    <option value="Roja">🔴 Roja</option>
                  </select>
                  <button onClick={addTarjeta} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm">+</button>
                </div>
                {form.tarjetas.map((c, i) => (
                  <div key={i} className="text-xs text-stone-600 mb-1 flex items-center gap-1.5">
                    <span>{c.tipo === 'Amarilla' ? '🟡' : '🔴'}</span>
                    <span>{[...(currentMatch.local.jugadores || []), ...(currentMatch.visitante.jugadores || [])].find((j: any) => j.id === c.jugadorId)?.nombre || '?'}</span>
                    <button onClick={() => setForm({ ...form, tarjetas: form.tarjetas.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600 ml-auto font-bold">×</button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-semibold text-stone-500 hover:bg-stone-100 rounded-xl transition-colors">Cancelar</button>
                <button onClick={handleSave} className="px-5 py-2 text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm shadow-emerald-500/20">Guardar Resultado</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}