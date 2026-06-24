'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, UserCircle } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { useDialog } from './ConfirmDialog'
import { motion, AnimatePresence } from 'framer-motion'

export default function PlayersContent({ initialPlayers, initialTeams }: { initialPlayers?: any[], initialTeams?: any[] }) {
  const { token } = useAuth()
  const dialog = useDialog()
  const [players, setPlayers] = useState<any[]>(initialPlayers || [])
  const [teams, setTeams] = useState<any[]>(initialTeams || [])
  const [loading, setLoading] = useState(!initialPlayers)
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
    setPlayers(p); setTeams(t); setLoading(false)
  }

  useEffect(() => { if (!initialPlayers) load() }, [])

  const filtered = players.filter(p => {
    if (filter === 'damas') return p.equipo?.categoria?.nombre === 'Damas'
    if (filter === 'varones') return p.equipo?.categoria?.nombre === 'Varones'
    return true
  })

  const handleSave = async () => {
    const r = await fetch(`/api/players${editing ? `/${editing.id}` : ''}`, {
      method: editing ? 'PUT' : 'POST', headers, body: JSON.stringify(form),
    })
    if (!r.ok) { dialog.alert({ title: 'Error', message: await r.text() }); return }
    setShowModal(false); setEditing(null); setForm({ nombre: '', numero: 1, equipoId: 0, foto: '' }); load()
  }

  const handleDelete = async (id: number) => {
    dialog.confirm({
      title: 'Eliminar Jugador', message: '¿Eliminar jugador? Esta acción no se puede deshacer.', confirmText: 'Eliminar',
      onConfirm: async () => {
        const r = await fetch(`/api/players/${id}`, { method: 'DELETE', headers })
        if (!r.ok) { dialog.alert({ title: 'Error', message: await r.text() }); return }; load()
      }
    })
  }

  const ec = (estado: string) => {
    switch (estado) {
      case 'Suspendido': return 'bg-red-100 text-red-700'
      case 'Inhabilitado': return 'bg-orange-100 text-orange-700'
      default: return 'bg-emerald-100 text-emerald-700'
    }
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-7 w-32" />
      <div className="bg-white rounded-xl border border-border p-5"><div className="skeleton h-[220px] w-full" /></div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <UserCircle size={22} className="text-amber-accent" />
        <h1 className="text-xl font-extrabold text-stone-800 tracking-tight">Jugadores</h1>
        <button onClick={() => { setEditing(null); setForm({ nombre: '', numero: 1, equipoId: teams[0]?.id || 0, foto: '' }); setShowModal(true) }}
          className="ml-auto bg-gradient-to-r from-amber-accent to-amber-deep text-sidebar font-bold px-4 py-2 rounded-xl text-sm hover:from-amber-400 hover:to-amber-600 transition-all shadow-sm shadow-amber-500/20 flex items-center gap-2">
          <Plus size={15} /> Nuevo Jugador
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'damas', 'varones'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === f ? 'bg-stone-800 text-white shadow-sm' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
            {f === 'all' ? 'Todos' : f === 'damas' ? 'Damas' : 'Varones'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden card-shadow-hover">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[650px]">
            <thead>
              <tr className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                <th className="text-left px-4 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 font-medium">Equipo</th>
                <th className="text-left px-4 py-3 font-medium">Cat.</th>
                <th className="text-center px-3 py-3 font-medium">Estado</th>
                <th className="text-center px-3 py-3 font-medium">Amar.</th>
                <th className="text-center px-3 py-3 font-medium">Rojas</th>
                <th className="text-right px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr key={p.id} className={`border-t border-border transition-colors hover:bg-stone-50/50 ${idx % 2 === 1 ? 'bg-stone-50/30' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-stone-800">{p.numero}</td>
                  <td className="px-4 py-3 font-medium text-stone-800">{p.nombre}</td>
                  <td className="px-4 py-3 text-stone-500">{p.equipo?.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={p.equipo?.categoria?.nombre === 'Damas' ? 'badge-damas' : 'badge-varones'}>{p.equipo?.categoria?.nombre}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${ec(p.estado)}`}>{p.estado}</span>
                  </td>
                  <td className="px-3 py-3 text-center text-stone-600">{p.amarillas}</td>
                  <td className="px-3 py-3 text-center text-stone-600">{p.rojas}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => { setEditing(p); setForm({ nombre: p.nombre, numero: p.numero, equipoId: p.equipoId, foto: p.foto || '' }); setShowModal(true) }}
                      className="p-1.5 text-stone-400 hover:text-amber-accent transition-colors inline-block"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-stone-400 hover:text-red-500 transition-colors inline-block"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-extrabold text-lg text-stone-800 mb-4">{editing ? 'Editar Jugador' : 'Nuevo Jugador'}</h3>
              <div className="space-y-3">
                <div><label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Nombre</label>
                  <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-stone-50/50 focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none transition-all" placeholder="Nombre completo" /></div>
                <div><label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Número</label>
                  <input type="number" value={form.numero} onChange={e => setForm({ ...form, numero: Number(e.target.value) })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-stone-50/50 focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none transition-all" /></div>
                <div><label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Equipo</label>
                  <select value={form.equipoId} onChange={e => setForm({ ...form, equipoId: Number(e.target.value) })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none transition-all">
                    {teams.map(t => <option key={t.id} value={t.id}>{t.nombre} ({t.categoria?.nombre})</option>)}
                  </select></div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-semibold text-stone-500 hover:bg-stone-100 rounded-xl transition-colors">Cancelar</button>
                <button onClick={handleSave} className="px-5 py-2 text-sm bg-gradient-to-r from-amber-accent to-amber-deep text-sidebar font-bold rounded-xl hover:from-amber-400 hover:to-amber-600 transition-all shadow-sm shadow-amber-500/20">Guardar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}