'use client'

import { useEffect, useState } from 'react'
import { Edit2, Trash2, Plus } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { useDialog } from './ConfirmDialog'

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
      onConfirm: async () => {
        await fetch('/api/fixture', { method: 'DELETE', headers })
        load()
      }
    })
  }

  const handleSaveMatch = async () => {
    if (editMatch) {
      await fetch(`/api/fixture/partido/${editMatch.id}`, { method: 'PUT', headers, body: JSON.stringify(form) })
      setShowEditModal(false)
      setEditMatch(null)
      load()
    }
  }

  const handleAddManualMatch = async () => {
    if (!addForm.jornadaNumero || !addForm.categoriaId || !addForm.localId || !addForm.visitanteId) {
      dialog.alert({ title: 'Campos incompletos', message: 'Por favor completa todos los campos' })
      return
    }
    if (addForm.localId === addForm.visitanteId) {
      dialog.alert({ title: 'Equipo inválido', message: 'Un equipo no puede jugar contra sí mismo' })
      return
    }
    
    const res = await fetch('/api/fixture/partido', { method: 'POST', headers, body: JSON.stringify(addForm) })
    if (!res.ok) {
      const data = await res.json()
      dialog.alert({ title: 'Error', message: data.error || 'Error al guardar el partido' })
      return
    }
    
    setShowAddModal(false)
    setAddForm({ jornadaNumero: 1, categoriaId: '', localId: '', visitanteId: '' })
    load()
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>

  const filteredTeams = teams.filter(t => t.categoriaId === Number(addForm.categoriaId))

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Fixture</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <Plus size={16} /> Agregar Partido Manual
          </button>
          <button onClick={handleGeneratePrimera} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
            Generar Primera Rueda
          </button>
          <button onClick={handleGenerateSegunda} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            Generar Segunda Rueda
          </button>
          <button onClick={handleClear} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 flex items-center gap-2">
            <Trash2 size={16} /> Limpiar Todo
          </button>
        </div>
      </div>

      {jornadas.map(j => {
        const dm = j.partidos.filter((p: any) => p.categoria?.nombre === 'Damas')
        const vm = j.partidos.filter((p: any) => p.categoria?.nombre === 'Varones')

        const equiposEnPartidoDamas = new Set(dm.flatMap((p: any) => [p.localId, p.visitanteId]))
        const equiposEnPartidoVarones = new Set(vm.flatMap((p: any) => [p.localId, p.visitanteId]))
        const descansanDamas = teams.filter((t: any) => t.categoria?.nombre === 'Damas' && !equiposEnPartidoDamas.has(t.id))
        const descansanVarones = teams.filter((t: any) => t.categoria?.nombre === 'Varones' && !equiposEnPartidoVarones.has(t.id))

        return (
          <div key={j.id} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Jornada {j.numero} {j.fecha && <span className="text-sm font-normal text-gray-400">({j.fecha})</span>} {j.descripcion && <span className="text-xs font-normal text-gray-400 ml-1">- {j.descripcion}</span>}</h2>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-pink-600 mb-2">DAMAS</h3>
              {dm.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead><tr className="bg-pink-50 text-pink-700">
                        <th className="text-left px-3 py-2">Local</th><th className="text-center px-3 py-2">vs</th>
                        <th className="text-left px-3 py-2">Visitante</th><th className="text-center px-3 py-2">Resultado</th>
                        <th className="text-center px-3 py-2">Goles</th>
                        <th className="text-center px-3 py-2">Hora</th><th className="text-center px-3 py-2">Cancha</th><th className="text-center px-3 py-2"></th>
                      </tr></thead>
                      <tbody>{dm.flatMap((m: any) => {
                        const golesLocal = m.goles?.filter((g: any) => g.equipoId === m.localId) || []
                        const golesVisit = m.goles?.filter((g: any) => g.equipoId === m.visitanteId) || []
                        const tarjetas = m.tarjetas || []
                        const isExpanded = expandedId === m.id
                        const total = golesLocal.length + golesVisit.length
                        return [
                          <tr key={m.id} className="border-t border-gray-50">
                            <td className="px-3 py-2 font-medium">{m.local?.nombre}</td>
                            <td className="px-3 py-2 text-center text-gray-400">vs</td>
                            <td className="px-3 py-2">{m.visitante?.nombre}</td>
                            <td className="px-3 py-2 text-center font-medium">{m.jugado ? `${m.golesLocal} - ${m.golesVisit}` : '-'}</td>
                            <td className="px-3 py-2 text-center">
                              {m.jugado ? (
                                <button onClick={() => setExpandedId(isExpanded ? null : m.id)} className="text-xs text-gray-500 hover:text-gray-700 underline">
                                  {isExpanded ? 'Ocultar' : `${total} gol(es)`}
                                </button>
                              ) : '-'}
                            </td>
                            <td className="px-3 py-2 text-center">{m.hora || '-'}</td>
                            <td className="px-3 py-2 text-center">{m.cancha || '-'}</td>
                            <td className="px-3 py-2 text-center">
                              {!m.jugado && <button onClick={() => { setEditMatch(m); setForm({ hora: m.hora || '', cancha: m.cancha || '', arbitro: m.arbitro || '' }); setShowEditModal(true) }} className="p-1 text-yellow-600 hover:text-yellow-700"><Edit2 size={14} /></button>}
                            </td>
                          </tr>,
                          isExpanded ? (
                            <tr key={`${m.id}-detalle`}>
                              <td colSpan={8} className="px-3 pb-3">
                                <div className="bg-pink-50 rounded-lg p-3 text-xs space-y-1">
                                  {golesLocal.length > 0 && (
                                    <div><span className="font-semibold text-gray-700">{m.local?.nombre}: </span>{golesLocal.map((g: any, i: number) => (
                                      <span key={i} className="text-gray-600">{g.jugador?.nombre}{g.cantidad > 1 ? ` (${g.cantidad})` : ''}{i < golesLocal.length - 1 ? ', ' : ''}</span>
                                    ))}</div>
                                  )}
                                  {golesVisit.length > 0 && (
                                    <div><span className="font-semibold text-gray-700">{m.visitante?.nombre}: </span>{golesVisit.map((g: any, i: number) => (
                                      <span key={i} className="text-gray-600">{g.jugador?.nombre}{g.cantidad > 1 ? ` (${g.cantidad})` : ''}{i < golesVisit.length - 1 ? ', ' : ''}</span>
                                    ))}</div>
                                  )}
                                  {tarjetas.length > 0 && (
                                    <div><span className="font-semibold text-gray-700">Tarjetas: </span>{tarjetas.map((c: any, i: number) => (
                                      <span key={i} className={c.tipo === 'Roja' ? 'text-red-600' : 'text-yellow-600'}>
                                        {c.tipo === 'Amarilla' ? '🟡' : '🔴'} {c.jugador?.nombre}{c.jugador?.equipo?.nombre ? ` (${c.jugador.equipo.nombre})` : ''}{i < tarjetas.length - 1 ? ' | ' : ''}
                                      </span>
                                    ))}</div>
                                  )}
                                  {total === 0 && tarjetas.length === 0 && (
                                    <p className="text-gray-400 italic">Sin goles ni tarjetas</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ) : null,
                        ]
                      })}</tbody>
                    </table>
                  </div>
                </div>
              ) : descansanDamas.length > 0 ? (
                <div className="bg-pink-50 rounded-xl border border-pink-200 p-3 mb-2">
                  <p className="text-xs text-pink-500 italic font-medium">Jornada de descanso colectivo</p>
                  <p className="text-xs text-pink-400 italic">Descansan: {descansanDamas.map((t: any) => t.nombre).join(', ')}</p>
                </div>
              ) : null}
              {dm.length > 0 && descansanDamas.length > 0 && (
                <p className="text-xs text-pink-400 italic">Descansan: {descansanDamas.map((t: any) => t.nombre).join(', ')}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-green-600 mb-2">VARONES</h3>
              {vm.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead><tr className="bg-green-50 text-green-700">
                        <th className="text-left px-3 py-2">Local</th><th className="text-center px-3 py-2">vs</th>
                        <th className="text-left px-3 py-2">Visitante</th><th className="text-center px-3 py-2">Resultado</th>
                        <th className="text-center px-3 py-2">Goles</th>
                        <th className="text-center px-3 py-2">Hora</th><th className="text-center px-3 py-2">Cancha</th><th className="text-center px-3 py-2"></th>
                      </tr></thead>
                      <tbody>{vm.flatMap((m: any) => {
                        const golesLocal = m.goles?.filter((g: any) => g.equipoId === m.localId) || []
                        const golesVisit = m.goles?.filter((g: any) => g.equipoId === m.visitanteId) || []
                        const tarjetas = m.tarjetas || []
                        const isExpanded = expandedId === m.id
                        const total = golesLocal.length + golesVisit.length
                        return [
                          <tr key={m.id} className="border-t border-gray-50">
                            <td className="px-3 py-2 font-medium">{m.local?.nombre}</td>
                            <td className="px-3 py-2 text-center text-gray-400">vs</td>
                            <td className="px-3 py-2">{m.visitante?.nombre}</td>
                            <td className="px-3 py-2 text-center font-medium">{m.jugado ? `${m.golesLocal} - ${m.golesVisit}` : '-'}</td>
                            <td className="px-3 py-2 text-center">
                              {m.jugado ? (
                                <button onClick={() => setExpandedId(isExpanded ? null : m.id)} className="text-xs text-gray-500 hover:text-gray-700 underline">
                                  {isExpanded ? 'Ocultar' : `${total} gol(es)`}
                                </button>
                              ) : '-'}
                            </td>
                            <td className="px-3 py-2 text-center">{m.hora || '-'}</td>
                            <td className="px-3 py-2 text-center">{m.cancha || '-'}</td>
                            <td className="px-3 py-2 text-center">
                              {!m.jugado && <button onClick={() => { setEditMatch(m); setForm({ hora: m.hora || '', cancha: m.cancha || '', arbitro: m.arbitro || '' }); setShowEditModal(true) }} className="p-1 text-yellow-600 hover:text-yellow-700"><Edit2 size={14} /></button>}
                            </td>
                          </tr>,
                          isExpanded ? (
                            <tr key={`${m.id}-detalle`}>
                              <td colSpan={8} className="px-3 pb-3">
                                <div className="bg-green-50 rounded-lg p-3 text-xs space-y-1">
                                  {golesLocal.length > 0 && (
                                    <div><span className="font-semibold text-gray-700">{m.local?.nombre}: </span>{golesLocal.map((g: any, i: number) => (
                                      <span key={i} className="text-gray-600">{g.jugador?.nombre}{g.cantidad > 1 ? ` (${g.cantidad})` : ''}{i < golesLocal.length - 1 ? ', ' : ''}</span>
                                    ))}</div>
                                  )}
                                  {golesVisit.length > 0 && (
                                    <div><span className="font-semibold text-gray-700">{m.visitante?.nombre}: </span>{golesVisit.map((g: any, i: number) => (
                                      <span key={i} className="text-gray-600">{g.jugador?.nombre}{g.cantidad > 1 ? ` (${g.cantidad})` : ''}{i < golesVisit.length - 1 ? ', ' : ''}</span>
                                    ))}</div>
                                  )}
                                  {tarjetas.length > 0 && (
                                    <div><span className="font-semibold text-gray-700">Tarjetas: </span>{tarjetas.map((c: any, i: number) => (
                                      <span key={i} className={c.tipo === 'Roja' ? 'text-red-600' : 'text-yellow-600'}>
                                        {c.tipo === 'Amarilla' ? '🟡' : '🔴'} {c.jugador?.nombre}{c.jugador?.equipo?.nombre ? ` (${c.jugador.equipo.nombre})` : ''}{i < tarjetas.length - 1 ? ' | ' : ''}
                                      </span>
                                    ))}</div>
                                  )}
                                  {total === 0 && tarjetas.length === 0 && (
                                    <p className="text-gray-400 italic">Sin goles ni tarjetas</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ) : null,
                        ]
                      })}</tbody>
                    </table>
                  </div>
                </div>
              ) : descansanVarones.length > 0 ? (
                <div className="bg-green-50 rounded-xl border border-green-200 p-3 mb-2">
                  <p className="text-xs text-green-500 italic font-medium">Jornada de descanso colectivo</p>
                  <p className="text-xs text-green-400 italic">Descansan: {descansanVarones.map((t: any) => t.nombre).join(', ')}</p>
                </div>
              ) : null}
              {vm.length > 0 && descansanVarones.length > 0 && (
                <p className="text-xs text-green-400 italic">Descansan: {descansanVarones.map((t: any) => t.nombre).join(', ')}</p>
              )}
            </div>
          </div>
        )
      })}

      {/* Modal Editar Horarios */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-md">
            <h3 className="font-bold text-lg mb-4">Editar Partido</h3>
            <p className="text-sm text-gray-500 mb-3">{editMatch?.local?.nombre} vs {editMatch?.visitante?.nombre}</p>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Hora</label><input value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="10:00" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Cancha</label><input value={form.cancha} onChange={e => setForm({ ...form, cancha: e.target.value })} className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Cancha Principal" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Árbitro</label><input value={form.arbitro} onChange={e => setForm({ ...form, arbitro: e.target.value })} className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Nombre del árbitro" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={handleSaveMatch} className="px-4 py-2 text-sm bg-yellow-500 text-green-950 font-semibold rounded-lg hover:bg-yellow-600">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Partido Manual */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-md">
            <h3 className="font-bold text-lg mb-4">Agregar Partido Manual</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jornada</label>
                <input type="number" min="1" value={addForm.jornadaNumero} onChange={e => setAddForm({ ...addForm, jornadaNumero: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select value={addForm.categoriaId} onChange={e => setAddForm({ ...addForm, categoriaId: e.target.value, localId: '', visitanteId: '' })} className="w-full border rounded-lg px-3 py-2.5 text-sm">
                  <option value="">Seleccione una categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              {addForm.categoriaId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                    <select value={addForm.localId} onChange={e => setAddForm({ ...addForm, localId: e.target.value })} className="w-full border rounded-lg px-3 py-2.5 text-sm">
                      <option value="">Seleccione equipo local</option>
                      {filteredTeams.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visitante</label>
                    <select value={addForm.visitanteId} onChange={e => setAddForm({ ...addForm, visitanteId: e.target.value })} className="w-full border rounded-lg px-3 py-2.5 text-sm">
                      <option value="">Seleccione equipo visitante</option>
                      {filteredTeams.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={handleAddManualMatch} className="px-4 py-2 text-sm bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Guardar Partido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

