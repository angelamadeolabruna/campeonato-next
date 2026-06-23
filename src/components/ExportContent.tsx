'use client'

import { useState } from 'react'
import { FileText, FileDown } from 'lucide-react'
import { useAuth } from './AuthProvider'

export default function ExportContent() {
  const { token } = useAuth()
  const [loading, setLoading] = useState({ pdf: false, word: false })
  const [message, setMessage] = useState('')

  const handleExport = async (format: 'pdf' | 'word') => {
    setLoading({ ...loading, [format]: true })
    setMessage('')
    try {
      const res = await fetch(`/api/exports/fixture/${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { setMessage(`Error al generar ${format.toUpperCase()}`); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `campeonato.${format === 'pdf' ? 'pdf' : 'docx'}`
      a.click()
      URL.revokeObjectURL(url)
      setMessage(`${format.toUpperCase()} generado exitosamente`)
    } catch {
      setMessage(`Error al generar ${format.toUpperCase()}`)
    } finally {
      setLoading({ ...loading, [format]: false })
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Exportar Datos</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <button
          onClick={() => handleExport('pdf')}
          disabled={loading.pdf}
          className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-green-950 rounded-xl p-6 flex flex-col items-center gap-3 transition"
        >
          <FileText size={40} />
          <span className="font-semibold">{loading.pdf ? 'Generando...' : 'Exportar PDF'}</span>
          <span className="text-xs text-green-800">Documento completo del campeonato</span>
        </button>

        <button
          onClick={() => handleExport('word')}
          disabled={loading.word}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-xl p-6 flex flex-col items-center gap-3 transition"
        >
          <FileDown size={40} />
          <span className="font-semibold">{loading.word ? 'Generando...' : 'Exportar Word'}</span>
          <span className="text-xs text-green-100">Documento editable en Microsoft Word</span>
        </button>
      </div>

      {message && (
        <div className={`mt-6 p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="mt-10 bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Vista Previa del Contenido a Exportar</h2>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• Tabla de posiciones (Damas y Varones)</li>
          <li>• Fixture completo del campeonato</li>
          <li>• Resultados de todos los partidos</li>
          <li>• Estadísticas de jugadores</li>
          <li>• Reporte de tarjetas (amarillas y rojas)</li>
        </ul>
      </div>
    </div>
  )
}
