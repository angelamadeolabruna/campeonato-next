import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!getUserIdFromToken(request)) return unauthorized()
  try {
    const { jsPDF } = await import('jspdf')
    await import('jspdf-autotable')

    const multas = await prisma.fine.findMany({
      where: { pagado: false },
      include: { jugador: { include: { equipo: { include: { categoria: true } } } }, match: { include: { jornada: { select: { numero: true } } } } },
      orderBy: { creadoEn: 'desc' },
    })

    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('REPORTE DE SANCIONES Y MULTAS', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' })
    doc.setFontSize(10)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-BO')}`, doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' })
    ;(doc as any).autoTable({
      startY: 36,
      head: [['Jugador', 'Equipo', 'Categoría', 'Motivo', 'Monto', 'Estado', 'Jornada']],
      body: multas.map(m => [m.jugador.nombre, m.jugador.equipo.nombre, m.jugador.equipo.categoria.nombre, m.motivo, `Bs. ${m.monto.toFixed(2)}`, m.pagado ? 'Pagado' : 'Pendiente', m.match?.jornada?.numero || '-']),
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], textColor: 255 },
      styles: { fontSize: 7 },
    })

    const buf = Buffer.from(doc.output('arraybuffer'))
    return new NextResponse(new Uint8Array(buf), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=sanciones-multas.pdf' },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 })
  }
}
