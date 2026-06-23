import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!getUserIdFromToken(request)) return unauthorized()
  try {
    const { jsPDF } = await import('jspdf')
    await import('jspdf-autotable')

    const jornadas = await prisma.jornada.findMany({
      orderBy: { numero: 'asc' },
      include: {
        partidos: {
          include: { local: { select: { nombre: true } }, visitante: { select: { nombre: true } }, categoria: true },
          orderBy: { id: 'asc' },
        },
      },
    })

    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth()

    doc.setFontSize(18)
    doc.text('CAMPEONATO DE FÚTBOL MIXTO', pw / 2, 20, { align: 'center' })
    doc.setFontSize(14)
    doc.text('FIXTURE COMPLETO', pw / 2, 28, { align: 'center' })
    doc.setFontSize(10)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-BO')}`, pw / 2, 34, { align: 'center' })

    let y = 42
    for (const j of jornadas) {
      if (y > 250) { doc.addPage(); y = 20 }
      const dm = j.partidos.filter(p => p.categoria.nombre === 'Damas')
      const vm = j.partidos.filter(p => p.categoria.nombre === 'Varones')

      if (dm.length > 0) {
        if (y > 240) { doc.addPage(); y = 20 }
        doc.setFontSize(11)
        doc.setTextColor(236, 72, 153)
        doc.text(`Jornada ${j.numero} - DAMAS`, 14, y)
        y += 6
        ;(doc as any).autoTable({
          startY: y,
          head: [['Local', 'Visitante', 'Resultado', 'Hora', 'Cancha']],
          body: dm.map(m => [m.local.nombre, m.visitante.nombre, m.jugado ? `${m.golesLocal} - ${m.golesVisit}` : 'Pendiente', m.hora || '-', m.cancha || '-']),
          theme: 'grid',
          headStyles: { fillColor: [236, 72, 153], textColor: 255 },
          styles: { fontSize: 8 },
        })
        y = (doc as any).lastAutoTable.finalY + 8
      }
      if (vm.length > 0) {
        if (y > 240) { doc.addPage(); y = 20 }
        doc.setFontSize(11)
        doc.setTextColor(59, 130, 246)
        doc.text(`Jornada ${j.numero} - VARONES`, 14, y)
        y += 6
        ;(doc as any).autoTable({
          startY: y,
          head: [['Local', 'Visitante', 'Resultado', 'Hora', 'Cancha']],
          body: vm.map(m => [m.local.nombre, m.visitante.nombre, m.jugado ? `${m.golesLocal} - ${m.golesVisit}` : 'Pendiente', m.hora || '-', m.cancha || '-']),
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246], textColor: 255 },
          styles: { fontSize: 8 },
        })
        y = (doc as any).lastAutoTable.finalY + 8
      }
    }

    const buf = Buffer.from(doc.output('arraybuffer'))
    return new NextResponse(new Uint8Array(buf), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=fixture-completo.pdf' },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 })
  }
}
