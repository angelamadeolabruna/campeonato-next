'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { useDialog } from './ConfirmDialog'

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
    } catch (e) {
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

  if (loading) return <p className="text-gray-500">Cargando...</p>

  const pendientes = matches.filter(m => !m.jugado)
  const jugados = matches.filter(m => m.jugado)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Resultados de Partidos</h1>

      <h2 className="text-lg font-semibold text-yellow-600 mb-3">Pendientes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {pendientes.map(m => (
          <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">{m.categoria?.nombre} • Jornada {m.jornada?.numero} {m.hora && `• ${m.hora}`}</p>
            <p className="font-semibold">{m.local?.nombre} vs {m.visitante?.nombre}</p>
            <button onClick={() => openResultado(m)} className="mt-2 text-sm bg-yellow-500 text-green-950 font-semibold px-3 py-1.5 rounded-lg hover:bg-yellow-600">Ingresar Resultado</button>
          </div>
        ))}
        {pendientes.length === 0 && <p className="text-gray-400 text-sm">No hay partidos pendientes</p>}
      </div>

      <h2 className="text-lg font-semibold text-green-600 mb-3">Jugados</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-3">Jornada</th>
                <th className="text-left px-3 py-3">Local</th>
                <th className="text-center px-3 py-3">Resultado</th>
                <th className="text-left px-3 py-3">Visitante</th>
                <th className="text-center px-3 py-3">Cat.</th>
                <th className="text-center px-3 py-3">Goles</th>
                <th className="text-right px-3 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {jugados.map(m => {
                const golesLocal = m.goles?.filter((g: any) => g.equipoId === m.localId) || []
                const golesVisit = m.goles?.filter((g: any) => g.equipoId === m.visitanteId) || []
                const tarjetas = m.tarjetas || []
                const isExpanded = expandedId === m.id
                return [
                  <tr key={m.id} className="border-t border-gray-50">
                    <td className="px-3 py-3">{m.jornada?.numero}</td>
                    <td className="px-3 py-3">{m.local?.nombre}</td>
                    <td className="px-3 py-3 text-center font-bold whitespace-nowrap">{m.golesLocal} - {m.golesVisit}</td>
                    <td className="px-3 py-3">{m.visitante?.nombre}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs font-medium ${m.categoria?.nombre === 'Damas' ? 'text-pink-600' : 'text-green-600'}`}>{m.categoria?.nombre}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button onClick={() => setExpandedId(isExpanded ? null : m.id)} className="text-xs text-gray-500 hover:text-gray-700 underline">
                        {isExpanded ? 'Ocultar' : `${golesLocal.length + golesVisit.length} gol(es)`}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => openResultado(m)} className="text-yellow-600 hover:text-yellow-800 text-xs font-medium">Editar</button>
                    </td>
                  </tr>,
                  isExpanded ? (
                    <tr key={`${m.id}-detalle`}>
                      <td colSpan={7} className="px-3 pb-3">
                        <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-2">
                          {golesLocal.length > 0 && (
                            <div>
                              <span className="font-semibold text-gray-700">{m.local?.nombre}: </span>
                              {golesLocal.map((g: any, i: number) => (
                                <span key={i} className="text-gray-600">
                                  {g.jugador?.nombre}{g.cantidad > 1 ? ` (${g.cantidad})` : ''}{i < golesLocal.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          )}
                          {golesVisit.length > 0 && (
                            <div>
                              <span className="font-semibold text-gray-700">{m.visitante?.nombre}: </span>
                              {golesVisit.map((g: any, i: number) => (
                                <span key={i} className="text-gray-600">
                                  {g.jugador?.nombre}{g.cantidad > 1 ? ` (${g.cantidad})` : ''}{i < golesVisit.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          )}
                          {tarjetas.length > 0 && (
                            <div>
                              <span className="font-semibold text-gray-700">Tarjetas: </span>
                              {tarjetas.map((c: any, i: number) => (
                                <span key={i} className={c.tipo === 'Roja' ? 'text-red-600' : 'text-yellow-600'}>
                                  {c.tipo === 'Amarilla' ? '🟡' : '🔴'} {c.jugador?.nombre}
                                  {c.jugador?.equipo?.nombre ? ` (${c.jugador.equipo.nombre})` : ''}{i < tarjetas.length - 1 ? ' | ' : ''}
                                </span>
                              ))}
                            </div>
                          )}
                          {golesLocal.length === 0 && golesVisit.length === 0 && tarjetas.length === 0 && (
                            <p className="text-gray-400 italic">Sin goles ni tarjetas registrados</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : null,
                ]
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && currentMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-2">{currentMatch.local?.nombre} vs {currentMatch.visitante?.nombre}</h3>
            <p className="text-sm text-gray-400 mb-4">Jornada {currentMatch.jornada?.numero} • {currentMatch.categoria?.nombre}</p>

            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{saveError}</div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Goles Local ({currentMatch.local?.nombre})</label>
                <input type="number" value={form.golesLocal} onChange={e => setForm({ ...form, golesLocal: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2.5 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Goles Visitante ({currentMatch.visitante?.nombre})</label>
                <input type="number" value={form.golesVisit} onChange={e => setForm({ ...form, golesVisit: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2.5 text-sm" /></div>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Goleadores</p>
              <p className="text-xs text-gray-400 mb-2">Seleccioná un equipo, luego un jugador, la cantidad de goles, y presioná "+". Repetí para cada goleador de AMBOS equipos.</p>
              <div className="flex flex-wrap gap-2 mb-2">
                <select value={golInput.equipoId} onChange={e => setGolInput({ ...golInput, equipoId: Number(e.target.value), jugadorId: 0 })} className="border rounded px-2 py-1 text-xs flex-1 min-w-[100px]">
                  <option value={0}>Equipo</option>
                  <option value={currentMatch.localId}>{currentMatch.local?.nombre}</option>
                  <option value={currentMatch.visitanteId}>{currentMatch.visitante?.nombre}</option>
                </select>
                <select value={golInput.jugadorId} onChange={e => setGolInput({ ...golInput, jugadorId: Number(e.target.value) })} className="border rounded px-2 py-1 text-xs flex-1 min-w-[100px]">
                  <option value={0}>Jugador</option>
                  {golInput.equipoId > 0 && equipoJugadores(golInput.equipoId).map((j: any) => (
                    <option key={j.id} value={j.id}>{j.nombre} (#{j.numero})</option>
                  ))}
                </select>
                <input type="number" value={golInput.cantidad} onChange={e => setGolInput({ ...golInput, cantidad: Number(e.target.value) })} className="border rounded px-2 py-1 text-xs w-16" min={1} />
                <button onClick={addGol} className="bg-yellow-500 text-green-950 font-semibold px-3 py-1 rounded text-xs">+</button>
              </div>
              {form.goleadores.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-500 mb-1">Goleadores agregados ({form.goleadores.length}):</p>
                  {form.goleadores.map((g, i) => {
                    const nombre = equipoJugadores(g.equipoId).find((j: any) => j.id === g.jugadorId)?.nombre || '?'
                    const equipo = g.equipoId === currentMatch.localId ? currentMatch.local?.nombre : currentMatch.visitante?.nombre
                    return (
                      <div key={i} className="text-xs text-gray-600 mb-1 flex items-center gap-2">
                        <span>• {nombre} ({equipo}) - {g.cantidad} gol(es)</span>
                        <button onClick={() => setForm({ ...form, goleadores: form.goleadores.filter((_, j) => j !== i) })} className="text-red-500 hover:text-red-700">x</button>
                      </div>
                    )
                  })}
                </div>
              )}
              {form.goleadores.length === 0 && (
                <p className="text-xs text-gray-400 italic">No hay goleadores agregados todavía</p>
              )}
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Tarjetas</p>
              <div className="flex flex-wrap gap-2 mb-2">
                <select value={tarjInput.jugadorId} onChange={e => setTarjInput({ ...tarjInput, jugadorId: Number(e.target.value) })} className="border rounded px-2 py-1 text-xs flex-1 min-w-[100px]">
                  <option value={0}>Jugador</option>
                  {[...(currentMatch.local.jugadores || []), ...(currentMatch.visitante.jugadores || [])].map((j: any) => (
                    <option key={j.id} value={j.id}>{j.nombre} - {(j.equipoId === currentMatch.localId ? currentMatch.local?.nombre : currentMatch.visitante?.nombre)}</option>
                  ))}
                </select>
                <select value={tarjInput.tipo} onChange={e => setTarjInput({ ...tarjInput, tipo: e.target.value })} className="border rounded px-2 py-1 text-xs">
                  <option value="Amarilla">Amarilla</option>
                  <option value="Roja">Roja</option>
                </select>
                <button onClick={addTarjeta} className="bg-orange-600 text-white px-3 py-1 rounded text-xs">+</button>
              </div>
              {form.tarjetas.map((c, i) => (
                <div key={i} className="text-xs text-gray-600 mb-1">
                  • {c.tipo === 'Amarilla' ? '🟡' : '🔴'} {[...(currentMatch.local.jugadores || []), ...(currentMatch.visitante.jugadores || [])].find((j: any) => j.id === c.jugadorId)?.nombre || '?'}
                  <button onClick={() => setForm({ ...form, tarjetas: form.tarjetas.filter((_, j) => j !== i) })} className="text-red-500 ml-2">x</button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Guardar Resultado</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
