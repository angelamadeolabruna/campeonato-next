'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { useDialog } from './ConfirmDialog'

export default function PlayersContent() {
  const { token } = useAuth()
  const dialog = useDialog()
  const [players, setPlayers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'damas' | 'varones'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ nombre: '', numero: 1, equipoId: 0, foto: '' })

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const load = async () => {
    const [p, t] = await Promise.all([
      fetch('/api/players', { headers }).then(r => r.json()),
      fetch('/api/teams', { headers }).then(r => r.json()),
    ])
    setPlayers(p)
    setTeams(t)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = players.filter(p => {
    if (filter === 'damas') return p.equipo?.categoria?.nombre === 'Damas'
    if (filter === 'varones') return p.equipo?.categoria?.nombre === 'Varones'
    return true
  })

  const handleSave = async () => {
    const r = await fetch(`/api/players${editing ? `/${editing.id}` : ''}`, {
      method: editing ? 'PUT' : 'POST',
      headers, body: JSON.stringify(form),
    })
    if (!r.ok) { dialog.alert({ title: 'Error', message: await r.text() }); return }
    setShowModal(false); setEditing(null); setForm({ nombre: '', numero: 1, equipoId: 0, foto: '' }); load()
  }

  const handleDelete = async (id: number) => {
    dialog.confirm({
      title: 'Eliminar Jugador',
      message: '¿Eliminar jugador? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        const r = await fetch(`/api/players/${id}`, { method: 'DELETE', headers })
        if (!r.ok) { dialog.alert({ title: 'Error', message: await r.text() }); return }
        load()
      }
    })
  }

  const ec = (estado: string) => {
    switch (estado) {
      case 'Suspendido': return 'bg-red-100 text-red-700'
      case 'Inhabilitado': return 'bg-orange-100 text-orange-700'
      default: return 'bg-green-100 text-green-700'
    }
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Jugadores</h1>
        <button onClick={() => { setEditing(null); setForm({ nombre: '', numero: 1, equipoId: teams[0]?.id || 0, foto: '' }); setShowModal(true) }}
          className="bg-yellow-500 text-green-950 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-yellow-600 flex items-center gap-2"><Plus size={16} /> Nuevo Jugador</button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'damas', 'varones'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm ${filter === f ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f === 'all' ? 'Todos' : f === 'damas' ? 'Damas' : 'Varones'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="text-left px-3 py-3">#</th>
                <th className="text-left px-3 py-3">Nombre</th>
                <th className="text-left px-3 py-3">Equipo</th>
                <th className="text-left px-3 py-3">Cat.</th>
                <th className="text-center px-3 py-3">Estado</th>
                <th className="text-center px-3 py-3">Amar.</th>
                <th className="text-center px-3 py-3">Rojas</th>
                <th className="text-right px-3 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium">{p.numero}</td>
                  <td className="px-3 py-3">{p.nombre}</td>
                  <td className="px-3 py-3">{p.equipo?.nombre}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs font-medium ${p.equipo?.categoria?.nombre === 'Damas' ? 'text-pink-600' : 'text-green-600'}`}>{p.equipo?.categoria?.nombre}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ec(p.estado)}`}>{p.estado}</span>
                  </td>
                  <td className="px-3 py-3 text-center">{p.amarillas}</td>
                  <td className="px-3 py-3 text-center">{p.rojas}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    <button onClick={() => { setEditing(p); setForm({ nombre: p.nombre, numero: p.numero, equipoId: p.equipoId, foto: p.foto || '' }); setShowModal(true) }}
                      className="p-1.5 text-gray-400 hover:text-yellow-600 inline-block"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 inline-block"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-md">
            <h3 className="font-bold text-lg mb-4">{editing ? 'Editar Jugador' : 'Nuevo Jugador'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Nombre completo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input type="number" value={form.numero} onChange={e => setForm({ ...form, numero: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>
                <select value={form.equipoId} onChange={e => setForm({ ...form, equipoId: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2.5 text-sm">
                  {teams.map(t => <option key={t.id} value={t.id}>{t.nombre} ({t.categoria?.nombre})</option>)}
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
