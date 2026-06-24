'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthProvider'
import { Mic, MicOff, X, Download, HelpCircle, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface Props {
  data: any
  categoria: string
  setCategoria: (v: string) => void
  categories: any[]
}

type ViewType = 'posiciones' | 'goleadores' | 'pendientes' | 'sanciones' | 'multas' | 'indisciplinado' | 'proximo' | 'ayuda' | null

export default function VoiceAssistant({ data, categoria, setCategoria, categories }: Props) {
  const { token } = useAuth()
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [activeView, setActiveView] = useState<ViewType>(null)
  const [feedback, setFeedback] = useState('')
  const recognitionRef = useRef<any>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const [extraData, setExtraData] = useState<any>(null)
  const [loadingExtra, setLoadingExtra] = useState(false)

  const commands: Record<string, { view: ViewType; action?: () => void; label: string }> = {
    posiciones: { view: 'posiciones', label: 'Tabla de posiciones' },
    tabla: { view: 'posiciones', label: 'Tabla de posiciones' },
    clasificacion: { view: 'posiciones', label: 'Tabla de posiciones' },
    goleadores: { view: 'goleadores', label: 'Máximos goleadores' },
    goleador: { view: 'goleadores', label: 'Máximos goleadores' },
    goles: { view: 'goleadores', label: 'Máximos goleadores' },
    pendientes: { view: 'pendientes', label: 'Partidos pendientes' },
    sanciones: { view: 'sanciones', label: 'Sanciones y tarjetas' },
    tarjetas: { view: 'sanciones', label: 'Sanciones y tarjetas' },
    multas: { view: 'multas', label: 'Multas sin pagar' },
    indisciplinado: { view: 'indisciplinado', label: 'Equipo más indisciplinado' },
    proximo: { view: 'proximo', label: 'Próximo partido' },
    ayuda: { view: 'ayuda', label: 'Comandos disponibles' },
    comandos: { view: 'ayuda', label: 'Comandos disponibles' },
  }

  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const findCommand = (text: string): { view: ViewType; label: string } | null => {
    const t = norm(text)

    if (t.includes('export') || t.includes('descarg') || t.includes('gener')) {
      if (activeView && activeView !== 'ayuda') {
        exportViewToPDF()
        return { view: activeView, label: 'Exportando PDF...' }
      }
      return null
    }

    if (t.includes('dama') || (t.includes('mostrar') && t.includes('dama')) || (t.includes('filtr') && t.includes('dama'))) {
      const cat = categories.find(c => norm(c.nombre).includes('dama'))
      if (cat) setCategoria(String(cat.id))
      return { view: null, label: 'Filtrando por Damas' }
    }

    if (t.includes('varon') || (t.includes('mostrar') && t.includes('varon')) || (t.includes('filtr') && t.includes('varon'))) {
      const cat = categories.find(c => norm(c.nombre).includes('varon'))
      if (cat) setCategoria(String(cat.id))
      return { view: null, label: 'Filtrando por Varones' }
    }

    if (t.includes('todas') || t.includes('todo') || (t.includes('sin') && t.includes('filtro'))) {
      setCategoria('todas')
      return { view: null, label: 'Mostrando todas las categorías' }
    }

    for (const [key, cmd] of Object.entries(commands)) {
      if (t.includes(key)) {
        return { view: cmd.view, label: cmd.label }
      }
    }

    return null
  }

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setFeedback('Tu navegador no soporta reconocimiento de voz. Usa Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'es-BO'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setListening(true)
      setFeedback('Escuchando...')
      setTranscript('')
    }

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript
      setTranscript(text)
      const result = findCommand(text)
      if (result) {
        setFeedback(result.label)
        setActiveView(result.view)
        if (result.view) fetchExtraData(result.view)
      } else {
        setFeedback(`No entendí: "${text}". Decí "ayuda" para ver comandos.`)
      }
    }

    recognition.onerror = (event: any) => {
      setListening(false)
      setFeedback(`Error: ${event.error === 'not-allowed' ? 'Permiso de micrófono denegado' : event.error}`)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [categoria, activeView, data])

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const fetchExtraData = async (view: ViewType) => {
    if (!view || view === 'ayuda') return
    setLoadingExtra(true)
    try {
      if (view === 'posiciones') {
        const res = await fetch('/api/teams/positions', { headers: { Authorization: `Bearer ${token}` } })
        setExtraData(await res.json())
      } else if (view === 'sanciones') {
        const res = await fetch('/api/cards', { headers: { Authorization: `Bearer ${token}` } })
        setExtraData(await res.json())
      } else if (view === 'multas') {
        const res = await fetch('/api/cards/multas', { headers: { Authorization: `Bearer ${token}` } })
        setExtraData(await res.json())
      } else {
        setExtraData(null)
      }
    } catch {
      setExtraData(null)
    } finally {
      setLoadingExtra(false)
    }
  }

  const renderView = () => {
    if (!activeView) return null

    switch (activeView) {
      case 'posiciones':
        return renderPosiciones()
      case 'goleadores':
        return renderGoleadores()
      case 'pendientes':
        return renderPendientes()
      case 'sanciones':
        return renderSanciones()
      case 'multas':
        return renderMultas()
      case 'indisciplinado':
        return renderIndisciplinado()
      case 'proximo':
        return renderProximo()
      case 'ayuda':
        return renderAyuda()
      default:
        return null
    }
  }

  const renderPosiciones = () => {
    if (!extraData) return <p className="text-gray-400">Cargando...</p>
    return (
      <div ref={exportRef} className="space-y-6">
        {['damas', 'varones'].map(cat => {
          const equipos = extraData[cat] || []
          const sorted = [...equipos].sort((a, b) => b.puntos - a.puntos || b.dg - a.dg)
          return (
            <div key={cat}>
              <h3 className={`text-sm font-semibold mb-2 ${cat === 'damas' ? 'text-pink-600' : 'text-green-600'}`}>{cat === 'damas' ? 'DAMAS' : 'VARONES'}</h3>
              <table className="w-full text-xs">
                <thead><tr className="text-gray-500 border-b"><th className="text-left py-1">#</th><th className="text-left">Equipo</th><th className="text-center">PJ</th><th className="text-center">PG</th><th className="text-center">PE</th><th className="text-center">PP</th><th className="text-center">GF</th><th className="text-center">GC</th><th className="text-center">DG</th><th className="text-center">Pts</th></tr></thead>
                <tbody>{sorted.map((t: any, i: number) => (
                  <tr key={t.id} className="border-b border-gray-50"><td className="py-1 font-bold">{i + 1}</td><td className="py-1">{t.nombre}</td><td className="text-center">{t.pj}</td><td className="text-center">{t.pg}</td><td className="text-center">{t.pe}</td><td className="text-center">{t.pp}</td><td className="text-center">{t.gf}</td><td className="text-center">{t.gc}</td><td className="text-center font-medium">{t.dg}</td><td className="text-center font-bold">{t.puntos}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )
        })}
      </div>
    )
  }

  const renderGoleadores = () => {
    const { topGoleadores } = data
    if (!topGoleadores) return <p className="text-gray-400">Sin datos</p>
    return (
      <div ref={exportRef} className="space-y-4">
        {['damas', 'varones'].map(cat => {
          const goleadores = topGoleadores[cat] || []
          return (
            <div key={cat}>
              <h3 className={`text-sm font-semibold mb-2 ${cat === 'damas' ? 'text-pink-600' : 'text-green-600'}`}>{cat === 'damas' ? 'DAMAS' : 'VARONES'}</h3>
              {goleadores.length === 0 ? <p className="text-xs text-gray-400">Sin goles registrados</p> : (
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-500 border-b"><th className="text-left py-1">#</th><th className="text-left">Jugador</th><th className="text-left">Equipo</th><th className="text-center">Goles</th></tr></thead>
                  <tbody>{goleadores.map((g: any, i: number) => (
                    <tr key={i} className="border-b border-gray-50"><td className="py-1 font-bold">{i + 1}</td><td className="py-1">{g.nombre}</td><td className="py-1">{g.equipo}</td><td className="text-center font-bold">{g.goles}</td></tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderPendientes = () => {
    if (!data.alertas?.partidosSinResultado) return <p className="text-gray-400">Sin datos</p>
    const pendientes = data.alertas.partidosSinResultado
    return (
      <div ref={exportRef} className="space-y-2">
        {pendientes.length === 0 ? <p className="text-sm text-gray-400">No hay partidos pendientes</p> : (
          pendientes.map((m: any) => (
            <div key={m.id} className="text-sm border-b border-gray-50 pb-2">
              <span className="text-gray-400 text-xs">J{m.jornada?.numero}</span>{' '}
              <span className="font-medium">{m.local?.nombre}</span> vs <span className="font-medium">{m.visitante?.nombre}</span>
              <span className={`ml-2 text-xs ${m.categoria?.nombre === 'Damas' ? 'text-pink-500' : 'text-green-500'}`}>{m.categoria?.nombre}</span>
            </div>
          ))
        )}
      </div>
    )
  }

  const renderSanciones = () => {
    if (loadingExtra) return <p className="text-gray-400">Cargando...</p>
    if (!extraData) return <p className="text-gray-400">Sin datos</p>
    const cards = extraData as any[]
    const agrupadas: Record<string, { nombre: string; equipo: string; amarillas: number; rojas: number }> = {}
    cards.forEach((c: any) => {
      const id = c.jugadorId
      if (!agrupadas[id]) agrupadas[id] = { nombre: c.jugador?.nombre || '?', equipo: c.jugador?.equipo?.nombre || '?', amarillas: 0, rojas: 0 }
      if (c.tipo === 'Amarilla') agrupadas[id].amarillas++
      else agrupadas[id].rojas++
    })
    const lista = Object.values(agrupadas).sort((a, b) => (b.amarillas + b.rojas) - (a.amarillas + a.rojas))
    return (
      <div ref={exportRef}>
        {lista.length === 0 ? <p className="text-sm text-gray-400">Sin tarjetas registradas</p> : (
          <table className="w-full text-xs">
            <thead><tr className="text-gray-500 border-b"><th className="text-left py-1">Jugador</th><th className="text-left">Equipo</th><th className="text-center">🟡</th><th className="text-center">🔴</th></tr></thead>
            <tbody>{lista.map((p: any, i: number) => (
              <tr key={i} className="border-b border-gray-50"><td className="py-1">{p.nombre}</td><td className="py-1">{p.equipo}</td><td className="text-center">{p.amarillas}</td><td className="text-center">{p.rojas}</td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
    )
  }

  const renderMultas = () => {
    if (loadingExtra) return <p className="text-gray-400">Cargando...</p>
    if (!extraData) return <p className="text-gray-400">Sin datos</p>
    const multas = extraData as any[]
    return (
      <div ref={exportRef}>
        {multas.length === 0 ? <p className="text-sm text-gray-400">No hay multas sin pagar</p> : (
          <table className="w-full text-xs">
            <thead><tr className="text-gray-500 border-b"><th className="text-left py-1">Jugador</th><th className="text-left">Equipo</th><th className="text-center">Motivo</th><th className="text-right">Monto</th></tr></thead>
            <tbody>{multas.map((m: any) => (
              <tr key={m.id} className="border-b border-gray-50"><td className="py-1">{m.jugador?.nombre}</td><td className="py-1">{m.jugador?.equipo?.nombre}</td><td className="text-center">{m.motivo}</td><td className="text-right font-medium">${m.monto.toFixed(2)}</td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
    )
  }

  const renderIndisciplinado = () => {
    const { masIndisciplinado } = data
    if (!masIndisciplinado) return <p className="text-gray-400">Sin datos</p>
    return (
      <div ref={exportRef} className="space-y-2">
        {masIndisciplinado.damas && <p className="text-sm"><span className="text-pink-600 font-medium">Damas:</span> {masIndisciplinado.damas.equipo} ({masIndisciplinado.damas.total} tarjetas)</p>}
        {masIndisciplinado.varones && <p className="text-sm"><span className="text-green-600 font-medium">Varones:</span> {masIndisciplinado.varones.equipo} ({masIndisciplinado.varones.total} tarjetas)</p>}
        {!masIndisciplinado.damas && !masIndisciplinado.varones && <p className="text-sm text-gray-400">Sin datos de indisciplina</p>}
      </div>
    )
  }

  const renderProximo = () => {
    const { proximoPartido } = data
    if (!proximoPartido) return <p className="text-gray-400">No hay partidos programados</p>
    return (
      <div ref={exportRef} className="space-y-1">
        <p className="text-sm font-semibold">{proximoPartido.local?.nombre} vs {proximoPartido.visitante?.nombre}</p>
        <p className="text-xs text-gray-500">{proximoPartido.categoria?.nombre} • Jornada {proximoPartido.jornada?.numero}</p>
        {proximoPartido.hora && <p className="text-xs text-gray-500">Hora: {proximoPartido.hora}</p>}
        {proximoPartido.cancha && <p className="text-xs text-gray-500">Cancha: {proximoPartido.cancha}</p>}
      </div>
    )
  }

  const renderAyuda = () => (
    <div ref={exportRef} className="space-y-2 text-sm">
      <p className="font-semibold">Comandos disponibles:</p>
      <ul className="space-y-1 text-gray-600">
        <li>• <strong>"Mostrar posiciones"</strong> — Tabla de posiciones</li>
        <li>• <strong>"Mostrar goleadores"</strong> — Máximos goleadores</li>
        <li>• <strong>"Mostrar damas/varones"</strong> — Filtrar por categoría</li>
        <li>• <strong>"Mostrar todas"</strong> — Quitar filtro</li>
        <li>• <strong>"Mostrar pendientes"</strong> — Partidos sin jugar</li>
        <li>• <strong>"Mostrar sanciones"</strong> — Tarjetas amarillas/rojas</li>
        <li>• <strong>"Mostrar multas"</strong> — Multas sin pagar</li>
        <li>• <strong>"Mostrar próximo"</strong> — Próximo partido</li>
        <li>• <strong>"Exportar PDF"</strong> — Exportar vista actual</li>
        <li>• <strong>"Ayuda"</strong> — Esta ayuda</li>
      </ul>
    </div>
  )

  const exportViewToPDF = () => {
    if (!activeView || activeView === 'ayuda') return
    const label = Object.values(commands).find(c => c.view === activeView)?.label || 'Reporte'
    const doc = new jsPDF('l', 'mm', 'a4')
    doc.setFontSize(16)
    doc.text(label, 14, 20)
    doc.setFontSize(10)
    doc.text(`Generado el ${new Date().toLocaleDateString('es-BO')}`, 14, 28)

    let y = 35
    if (activeView === 'posiciones' && extraData) {
      for (const cat of ['damas', 'varones']) {
        const equipos = (extraData[cat] || []).sort((a: any, b: any) => b.puntos - a.puntos || b.dg - a.dg)
        if (equipos.length === 0) continue
        if (y > 35) { doc.addPage(); y = 20 }
        doc.setFontSize(12); doc.text(cat.toUpperCase(), 14, y); y += 8
        ;(doc as any).autoTable({
          head: [[ '#', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'Pts' ]],
          body: equipos.map((t: any, i: number) => [ String(i + 1), t.nombre, String(t.pj), String(t.pg), String(t.pe), String(t.pp), String(t.gf), String(t.gc), String(t.dg), String(t.puntos) ]),
          startY: y, theme: 'striped', headStyles: { fillColor: cat === 'damas' ? [190, 30, 120] : [22, 163, 74] }
        })
        y = (doc as any).lastAutoTable.finalY + 10
      }
    } else if (activeView === 'goleadores') {
      for (const cat of ['damas', 'varones']) {
        const goleadores = (data.topGoleadores?.[cat] || [])
        if (goleadores.length === 0) continue
        if (y > 35) { doc.addPage(); y = 20 }
        doc.setFontSize(12); doc.text(`${cat.toUpperCase()} - Goleadores`, 14, y); y += 8
        ;(doc as any).autoTable({
          head: [[ '#', 'Jugador', 'Equipo', 'Goles' ]],
          body: goleadores.map((g: any, i: number) => [ String(i + 1), g.nombre, g.equipo, String(g.goles) ]),
          startY: y, theme: 'striped', headStyles: { fillColor: cat === 'damas' ? [190, 30, 120] : [22, 163, 74] }
        })
        y = (doc as any).lastAutoTable.finalY + 10
      }
    } else if (activeView === 'sanciones' && extraData) {
      const agrupadas: Record<string, any> = {}
      ;(extraData as any[]).forEach((c: any) => {
        if (!agrupadas[c.jugadorId]) agrupadas[c.jugadorId] = { nombre: c.jugador?.nombre || '?', equipo: c.jugador?.equipo?.nombre || '?', amarillas: 0, rojas: 0 }
        if (c.tipo === 'Amarilla') agrupadas[c.jugadorId].amarillas++
        else agrupadas[c.jugadorId].rojas++
      })
      const lista = Object.values(agrupadas).sort((a: any, b: any) => (b.amarillas + b.rojas) - (a.amarillas + a.rojas))
      ;(doc as any).autoTable({
        head: [[ 'Jugador', 'Equipo', 'Amarillas', 'Rojas' ]],
        body: lista.map((p: any) => [ p.nombre, p.equipo, String(p.amarillas), String(p.rojas) ]),
        startY: y, theme: 'striped', headStyles: { fillColor: [200, 100, 0] }
      })
    } else if (activeView === 'multas' && extraData) {
      const multas = extraData as any[]
      ;(doc as any).autoTable({
        head: [[ 'Jugador', 'Equipo', 'Motivo', 'Monto' ]],
        body: multas.map((m: any) => [ m.jugador?.nombre || '?', m.jugador?.equipo?.nombre || '?', m.motivo, `$${m.monto.toFixed(2)}` ]),
        startY: y, theme: 'striped', headStyles: { fillColor: [200, 60, 60] }
      })
    } else if (activeView === 'pendientes') {
      const pendientes = data.alertas?.partidosSinResultado || []
      if (pendientes.length > 0) {
        ;(doc as any).autoTable({
          head: [[ 'Jornada', 'Local', 'Visitante', 'Categoría' ]],
          body: pendientes.map((m: any) => [ String(m.jornada?.numero || ''), m.local?.nombre || '', m.visitante?.nombre || '', m.categoria?.nombre || '' ]),
          startY: y, theme: 'striped'
        })
      } else {
        doc.text('No hay partidos pendientes', 14, y)
      }
    } else if (activeView === 'indisciplinado') {
      const mi = data.masIndisciplinado || {}
      if (mi.damas) doc.text(`Damas: ${mi.damas.equipo} (${mi.damas.total} tarjetas)`, 14, y)
      if (mi.varones) doc.text(`Varones: ${mi.varones.equipo} (${mi.varones.total} tarjetas)`, 14, y + 7)
    } else if (activeView === 'proximo') {
      const pp = data.proximoPartido
      if (pp) {
        doc.text(`${pp.local?.nombre} vs ${pp.visitante?.nombre}`, 14, y)
        doc.text(`${pp.categoria?.nombre} - Jornada ${pp.jornada?.numero}`, 14, y + 7)
        if (pp.hora) doc.text(`Hora: ${pp.hora}`, 14, y + 14)
        if (pp.cancha) doc.text(`Cancha: ${pp.cancha}`, 14, y + 21)
      }
    }

    doc.save(`voz-${activeView}.pdf`)
  }

  return (
    <>
      {/* Floating mic button */}
      <button
        onClick={listening ? stopListening : startListening}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 ${
          listening ? 'bg-red-500 scale-110 animate-pulse' : 'bg-gradient-to-r from-purple-600 to-pink-500 hover:scale-105'
        } text-white`}
        title="Comando por voz"
      >
        {listening ? <MicOff size={24} /> : <Mic size={24} />}
      </button>

      {/* Feedback toast */}
      {feedback && (
        <div className={`fixed bottom-24 right-6 z-50 px-4 py-2 rounded-lg shadow-lg text-sm max-w-xs ${
          feedback.includes('No entendí') || feedback.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
        }`}>
          <p className="flex items-center gap-2">
            {listening && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            {feedback}
          </p>
          {transcript && <p className="text-xs text-gray-400 mt-1">Dijiste: "{transcript}"</p>}
        </div>
      )}

      {/* Modal */}
      {activeView && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-40">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                {activeView === 'ayuda' && <HelpCircle size={20} className="text-purple-500" />}
                {commands[Object.keys(commands).find(k => commands[k].view === activeView)?.toLowerCase() || '']?.label || 'Resultado'}
              </h3>
              <div className="flex items-center gap-2">
                {activeView !== 'ayuda' && (
                  <button onClick={exportViewToPDF} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Exportar PDF">
                    <FileText size={18} />
                  </button>
                )}
                <button onClick={() => { setActiveView(null); setFeedback('') }} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                  <X size={20} />
                </button>
              </div>
            </div>
            {renderView()}
          </div>
        </div>
      )}
    </>
  )
}
