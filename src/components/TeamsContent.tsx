'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Users } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { getFlag } from '@/lib/flags'
import { useDialog } from './ConfirmDialog'
import { motion, AnimatePresence } from 'framer-motion'

export default function TeamsContent({ initialTeams, initialCategories }: { initialTeams?: any[], initialCategories?: any[] }) {
  const { token } = useAuth()
  const dialog = useDialog()
  const [teams, setTeams] = useState<any[]>(initialTeams || [])
  const [categories, setCategories] = useState<any[]>(initialCategories || [])
  const [loading, setLoading] = useState(!initialTeams)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ nombre: '', categoriaId: initialCategories?.[0]?.id || 1, logo: '' })

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const load = async () => {
    const [t, c] = await Promise.all([
      fetch('/api/teams', { headers }).then(r => r.json()),
      fetch('/api/categories', { headers }).then(r => r.json()),
    ])
    setTeams(t); setCategories(c)
    if (c.length > 0) setForm(f => ({ ...f, categoriaId: c[0].id }))
    setLoading(false)
  }

  useEffect(() => { if (!initialTeams) load() }, [])

  const handleSave = async () => {
    const res = await fetch(`/api/teams${editing ? `/${editing.id}` : ''}`, {
      method: editing ? 'PUT' : 'POST', headers, body: JSON.stringify(form),
    })
    if (!res.ok) { dialog.alert({ title: 'Error al guardar', message: await res.text() }); return }
    setShowModal(false); setEditing(null); setForm({ nombre: '', categoriaId: 1, logo: '' }); load()
  }

  const handleDelete = async (id: number) => {
    dialog.confirm({
      title: 'Eliminar Equipo', message: '¿Eliminar equipo? Se borrarán todos sus datos.', confirmText: 'Eliminar',
      onConfirm: async () => {
        const r = await fetch(`/api/teams/${id}`, { method: 'DELETE', headers })
        if (!r.ok) { dialog.alert({ title: 'Error', message: await r.text() }); return }; load()
      }
    })
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-7 w-32" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-white rounded-xl border border-border p-5"><div className="skeleton h-5 w-36" /><div className="skeleton h-3 w-20 mt-2" /></div>)}
      </div>
    </div>
  )

  const d = teams.filter(t => t.categoria?.nombre === 'Damas')
  const v = teams.filter(t => t.categoria?.nombre === 'Varones')

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Users size={22} className="text-amber-accent" />
        <h1 className="text-xl font-extrabold text-stone-800 tracking-tight">Equipos</h1>
        <button onClick={() => { setEditing(null); setForm({ nombre: '', categoriaId: categories[0]?.id || 1, logo: '' }); setShowModal(true) }}
          className="ml-auto bg-gradient-to-r from-amber-accent to-amber-deep text-sidebar font-bold px-4 py-2 rounded-xl text-sm hover:from-amber-400 hover:to-amber-600 transition-all shadow-sm shadow-amber-500/20 flex items-center gap-2">
          <Plus size={15} /> Nuevo Equipo
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-pink-500 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />Damas
        </h2>
        <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } }}} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {d.map(team => (
            <motion.div key={team.id} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 }}} className="bg-white rounded-xl border border-border p-5 card-shadow-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 to-pink-500 opacity-40" />
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-stone-800">{getFlag(team.nombre)} {team.nombre}</h3>
                  <p className="text-xs text-muted mt-0.5">{team._count?.jugadores || 0} jugadoras</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditing(team); setForm({ nombre: team.nombre, categoriaId: team.categoriaId, logo: team.logo || '' }); setShowModal(true) }}
                    className="p-1.5 text-stone-400 hover:text-amber-accent transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(team.id)} className="p-1.5 text-stone-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Varones
        </h2>
        <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } }}} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {v.map(team => (
            <motion.div key={team.id} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 }}} className="bg-white rounded-xl border border-border p-5 card-shadow-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-500 opacity-40" />
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-stone-800">{getFlag(team.nombre)} {team.nombre}</h3>
                  <p className="text-xs text-muted mt-0.5">{team._count?.jugadores || 0} jugadores</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditing(team); setForm({ nombre: team.nombre, categoriaId: team.categoriaId, logo: team.logo || '' }); setShowModal(true) }}
                    className="p-1.5 text-stone-400 hover:text-amber-accent transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(team.id)} className="p-1.5 text-stone-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-extrabold text-lg text-stone-800 mb-4">{editing ? 'Editar Equipo' : 'Nuevo Equipo'}</h3>
              <div className="space-y-3">
                <div><label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Nombre</label>
                  <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-stone-50/50 focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none transition-all" placeholder="Nombre del equipo" /></div>
                <div><label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Categoría</label>
                  <select value={form.categoriaId} onChange={e => setForm({ ...form, categoriaId: Number(e.target.value) })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-amber-accent/20 focus:border-amber-accent outline-none transition-all">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
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