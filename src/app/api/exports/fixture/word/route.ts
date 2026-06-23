import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken, unauthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!getUserIdFromToken(request)) return unauthorized()
  try {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType } = await import('docx')

    const jornadas = await prisma.jornada.findMany({
      orderBy: { numero: 'asc' },
      include: {
        partidos: {
          include: { local: { select: { nombre: true } }, visitante: { select: { nombre: true } }, categoria: true },
          orderBy: { id: 'asc' },
        },
      },
    })

    const children: any[] = []
    children.push(
      new Paragraph({ children: [new TextRun({ text: 'CAMPEONATO DE FÚTBOL MIXTO', bold: true, size: 28 })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: 'FIXTURE COMPLETO', size: 22 })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
    )

    const mkRow = (m: any) => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun(m.local.nombre)] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun(m.visitante.nombre)] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun(m.jugado ? `${m.golesLocal} - ${m.golesVisit}` : 'Pendiente')] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun(m.hora || '-')] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun(m.cancha || '-')] })] }),
      ],
    })

    for (const j of jornadas) {
      const dm = j.partidos.filter(p => p.categoria.nombre === 'Damas')
      const vm = j.partidos.filter(p => p.categoria.nombre === 'Varones')

      if (dm.length > 0) {
        children.push(new Paragraph({ children: [new TextRun({ text: `Jornada ${j.numero} - DAMAS`, bold: true, color: 'EC4899', size: 20 })], spacing: { before: 300, after: 100 } }))
        const header = new TableRow({
          tableHeader: true,
          children: ['Local', 'Visitante', 'Resultado', 'Hora', 'Cancha'].map(h => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })),
        })
        children.push(new Table({ rows: [header, ...dm.map(mkRow)] }))
      }
      if (vm.length > 0) {
        children.push(new Paragraph({ children: [new TextRun({ text: `Jornada ${j.numero} - VARONES`, bold: true, color: '3B82F6', size: 20 })], spacing: { before: 300, after: 100 } }))
        const header = new TableRow({
          tableHeader: true,
          children: ['Local', 'Visitante', 'Resultado', 'Hora', 'Cancha'].map(h => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })),
        })
        children.push(new Table({ rows: [header, ...vm.map(mkRow)] }))
      }
    }

    const doc = new Document({ sections: [{ children }] })
    const buf = await Packer.toBuffer(doc)
    return new NextResponse(new Uint8Array(buf), {
      headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': 'attachment; filename=fixture-completo.docx' },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al generar Word' }, { status: 500 })
  }
}
