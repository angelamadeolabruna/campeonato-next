'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { getFlag } from '@/lib/flags'
import { useDialog } from './ConfirmDialog'

export default function TeamsContent() {
  const { token } = useAuth()
  const dialog = useDialog()
  const [teams, setTeams] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ nombre: '', categoriaId: 1, logo: '' })

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const load = async () => {
    const [t, c] = await Promise.all([
      fetch('/api/teams', { headers }).then(r => r.json()),
      fetch('/api/categories', { headers }).then(r => r.json()),
    ])
    setTeams(t)
    setCategories(c)
    if (c.length > 0) setForm(f => ({ ...f, categoriaId: c[0].id }))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    const res = await fetch(`/api/teams${editing ? `/${editing.id}` : ''}`, {
      method: editing ? 'PUT' : 'POST',
      headers, body: JSON.stringify(form),
    })
    if (!res.ok) { dialog.alert({ title: 'Error al guardar', message: await res.text() }); return }
    setShowModal(false)
    setEditing(null)
    setForm({ nombre: '', categoriaId: 1, logo: '' })
    load()
  }

  const handleDelete = async (id: number) => {
    dialog.confirm({
      title: 'Eliminar Equipo',
      message: '¿Eliminar equipo? Se borrarán todos sus datos (jugadores, partidos, estadísticas).',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        const r = await fetch(`/api/teams/${id}`, { method: 'DELETE', headers })
        if (!r.ok) { dialog.alert({ title: 'Error al eliminar', message: await r.text() }); return }
        load()
      }
    })
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>

  const d = teams.filter(t => t.categoria?.nombre === 'Damas')
  const v = teams.filter(t => t.categoria?.nombre === 'Varones')

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Equipos</h1>
        <button onClick={() => { setEditing(null); setForm({ nombre: '', categoriaId: categories[0]?.id || 1, logo: '' }); setShowModal(true) }}
          className="bg-yellow-500 text-green-950 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-yellow-600 flex items-center gap-2">
          <Plus size={16} /> Nuevo Equipo
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-pink-600 mb-3 border-b border-pink-200 pb-2">⚽ DAMAS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {d.map(team => (
            <div key={team.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{getFlag(team.nombre)} {team.nombre}</h3>
                  <p className="text-xs text-gray-400">{team._count?.jugadores || 0} jugadoras</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditing(team); setForm({ nombre: team.nombre, categoriaId: team.categoriaId, logo: team.logo || '' }); setShowModal(true) }}
                    className="p-1.5 text-gray-400 hover:text-yellow-600"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(team.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-green-600 mb-3 border-b border-green-200 pb-2">⚽ VARONES</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {v.map(team => (
            <div key={team.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{getFlag(team.nombre)} {team.nombre}</h3>
                  <p className="text-xs text-gray-400">{team._count?.jugadores || 0} jugadores</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditing(team); setForm({ nombre: team.nombre, categoriaId: team.categoriaId, logo: team.logo || '' }); setShowModal(true) }}
                    className="p-1.5 text-gray-400 hover:text-yellow-600"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(team.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-md">
            <h3 className="font-bold text-lg mb-4">{editing ? 'Editar Equipo' : 'Nuevo Equipo'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Nombre del equipo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select value={form.categoriaId} onChange={e => setForm({ ...form, categoriaId: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2.5 text-sm">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-yellow-500 text-green-950 font-semibold rounded-lg hover:bg-yellow-600">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
