import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!getUserIdFromToken(request)) return unauthorized()
  try {
    const { jsPDF } = await import('jspdf')
    await import('jspdf-autotable')

    const { searchParams } = new URL(request.url)
    const where = searchParams.get('categoriaId') ? { categoriaId: Number(searchParams.get('categoriaId')) } : {}
    const teams = await prisma.team.findMany({ where, include: { categoria: true } })
    const allMatches = await prisma.match.findMany({ where: { jugado: true } })

    const posiciones = teams.map(team => {
      const tm = allMatches.filter(m => m.localId === team.id || m.visitanteId === team.id)
      const pj = tm.length
      const pg = tm.filter(m => (m.localId === team.id && m.golesLocal > m.golesVisit) || (m.visitanteId === team.id && m.golesVisit > m.golesLocal)).length
      const pe = tm.filter(m => m.golesLocal === m.golesVisit).length
      const pp = pj - pg - pe
      const gf = tm.reduce((s, m) => s + (m.localId === team.id ? m.golesLocal : m.golesVisit), 0)
      const gc = tm.reduce((s, m) => s + (m.localId === team.id ? m.golesVisit : m.golesLocal), 0)
      return [team.nombre, pj, pg, pe, pp, gf, gc, gf - gc, pg * 3 + pe]
    }).sort((a: any, b: any) => b[8] - a[8])

    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('TABLA DE POSICIONES', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' })
    doc.setFontSize(10)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-BO')}`, doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' })
    ;(doc as any).autoTable({
      startY: 36,
      head: [['#', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'Pts']],
      body: posiciones.map((r: any, i: number) => [i + 1, ...r]),
      theme: 'grid',
      headStyles: { fillColor: [30, 30, 30], textColor: 255 },
      styles: { fontSize: 8 },
    })

    const buf = Buffer.from(doc.output('arraybuffer'))
    return new NextResponse(new Uint8Array(buf), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=tabla-posiciones.pdf' },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 })
  }
}
