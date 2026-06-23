'use client'

import { useEffect, useState } from 'react'
import { Edit2, Trash2, Plus } from 'lucide-react'
import { useAuth } from './AuthProvider'

export default function FixtureContent() {
  const { token } = useAuth()
  const [jornadas, setJornadas] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
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
  
  useEffect(() => { load() }, [])

  const handleGenerate = async () => {
    if (!confirm('¿Generar fixture para las siguientes jornadas?')) return
    await fetch('/api/fixture/generar', { method: 'POST', headers })
    load()
  }

  const handleClear = async () => {
    if (!confirm('¿ESTÁS SEGURO? Esto borrará TODOS los partidos y jornadas existentes.')) return
    await fetch('/api/fixture', { method: 'DELETE', headers })
    load()
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
      alert('Por favor completa todos los campos')
      return
    }
    if (addForm.localId === addForm.visitanteId) {
      alert('Un equipo no puede jugar contra sí mismo')
      return
    }
    
    const res = await fetch('/api/fixture/partido', { method: 'POST', headers, body: JSON.stringify(addForm) })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || 'Error al guardar el partido')
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
          <button onClick={handleGenerate} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
            Generar Siguientes Jornadas
          </button>
          <button onClick={handleClear} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 flex items-center gap-2">
            <Trash2 size={16} /> Limpiar Todo
          </button>
        </div>
      </div>

      {jornadas.map(j => {
        const dm = j.partidos.filter((p: any) => p.categoria?.nombre === 'Damas')
        const vm = j.partidos.filter((p: any) => p.categoria?.nombre === 'Varones')
        return (
          <div key={j.id} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Jornada {j.numero} {j.fecha && <span className="text-sm font-normal text-gray-400">({j.fecha})</span>}</h2>
            {dm.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-pink-600 mb-2">DAMAS</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead><tr className="bg-pink-50 text-pink-700">
                        <th className="text-left px-3 py-2">Local</th><th className="text-center px-3 py-2">vs</th>
                        <th className="text-left px-3 py-2">Visitante</th><th className="text-center px-3 py-2">Resultado</th>
                        <th className="text-center px-3 py-2">Hora</th><th className="text-center px-3 py-2">Cancha</th><th className="text-center px-3 py-2"></th>
                      </tr></thead>
                      <tbody>{dm.map((m: any) => (
                        <tr key={m.id} className="border-t border-gray-50">
                          <td className="px-3 py-2 font-medium">{m.local?.nombre}</td>
                          <td className="px-3 py-2 text-center text-gray-400">vs</td>
                          <td className="px-3 py-2">{m.visitante?.nombre}</td>
                          <td className="px-3 py-2 text-center font-medium">{m.jugado ? `${m.golesLocal} - ${m.golesVisit}` : '-'}</td>
                          <td className="px-3 py-2 text-center">{m.hora || '-'}</td>
                          <td className="px-3 py-2 text-center">{m.cancha || '-'}</td>
                          <td className="px-3 py-2 text-center">
                            {!m.jugado && <button onClick={() => { setEditMatch(m); setForm({ hora: m.hora || '', cancha: m.cancha || '', arbitro: m.arbitro || '' }); setShowEditModal(true) }} className="p-1 text-yellow-600 hover:text-yellow-700"><Edit2 size={14} /></button>}
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {vm.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-green-600 mb-2">VARONES</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead><tr className="bg-green-50 text-green-700">
                        <th className="text-left px-3 py-2">Local</th><th className="text-center px-3 py-2">vs</th>
                        <th className="text-left px-3 py-2">Visitante</th><th className="text-center px-3 py-2">Resultado</th>
                        <th className="text-center px-3 py-2">Hora</th><th className="text-center px-3 py-2">Cancha</th><th className="text-center px-3 py-2"></th>
                      </tr></thead>
                      <tbody>{vm.map((m: any) => (
                        <tr key={m.id} className="border-t border-gray-50">
                          <td className="px-3 py-2 font-medium">{m.local?.nombre}</td>
                          <td className="px-3 py-2 text-center text-gray-400">vs</td>
                          <td className="px-3 py-2">{m.visitante?.nombre}</td>
                          <td className="px-3 py-2 text-center font-medium">{m.jugado ? `${m.golesLocal} - ${m.golesVisit}` : '-'}</td>
                          <td className="px-3 py-2 text-center">{m.hora || '-'}</td>
                          <td className="px-3 py-2 text-center">{m.cancha || '-'}</td>
                          <td className="px-3 py-2 text-center">
                            {!m.jugado && <button onClick={() => { setEditMatch(m); setForm({ hora: m.hora || '', cancha: m.cancha || '', arbitro: m.arbitro || '' }); setShowEditModal(true) }} className="p-1 text-yellow-600 hover:text-yellow-700"><Edit2 size={14} /></button>}
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
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

