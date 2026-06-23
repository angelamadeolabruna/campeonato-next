import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Limpiar datos existentes
  await prisma.fine.deleteMany();
  await prisma.card.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.match.deleteMany();
  await prisma.jornada.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Admin
  const hashed = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: { username: 'admin', password: hashed, nombre: 'Administrador' }
  });

  // Categorías
  const damas = await prisma.category.create({
    data: { nombre: 'Damas', color: '#ec4899' }
  });
  const varones = await prisma.category.create({
    data: { nombre: 'Varones', color: '#3b82f6' }
  });

  // Equipos DAMAS
  const dTeams = [
    { nombre: 'Las Estrellas', categoriaId: damas.id },
    { nombre: 'Fénix FC', categoriaId: damas.id },
    { nombre: 'Valquirias', categoriaId: damas.id },
    { nombre: 'Amazonas United', categoriaId: damas.id },
  ];

  const dTeamRecords = [];
  for (const t of dTeams) {
    dTeamRecords.push(await prisma.team.create({ data: t }));
  }

  // Equipos VARONES
  const vTeams = [
    { nombre: 'Los Gladiadores', categoriaId: varones.id },
    { nombre: 'Titanes FC', categoriaId: varones.id },
    { nombre: 'Rayos X', categoriaId: varones.id },
    { nombre: 'Dragones Rojos', categoriaId: varones.id },
  ];

  const vTeamRecords = [];
  for (const t of vTeams) {
    vTeamRecords.push(await prisma.team.create({ data: t }));
  }

  // Jugadores DAMAS
  const dPlayers = [];
  const dNames = [
    ['María García', 'Ana López', 'Carmen Rodríguez', 'Laura Martínez', 'Sofía Hernández'],
    ['Valentina Díaz', 'Camila Torres', 'Isabella Ramírez', 'Luna Castillo', 'Emilia Morales'],
    ['Martina Ortiz', 'Lucía Vega', 'Zoe Campos', 'Abril Rivas', 'Renata Delgado'],
    ['Amanda Flores', 'Bárbara Pereyra', 'Carla Méndez', 'Daniela Ríos', 'Elena Silva'],
  ];

  for (let i = 0; i < dTeamRecords.length; i++) {
    for (let j = 0; j < dNames[i].length; j++) {
      dPlayers.push(await prisma.player.create({
        data: {
          nombre: dNames[i][j],
          numero: j + 1,
          equipoId: dTeamRecords[i].id
        }
      }));
    }
  }

  // Jugadores VARONES
  const vPlayers = [];
  const vNames = [
    ['Pedro Gutiérrez', 'Juan Pérez', 'Diego Flores', 'Carlos Ruiz', 'Luis Vargas'],
    ['Andrés Mendoza', 'Mateo Castillo', 'Santiago Ríos', 'Gabriel López', 'Nicolás Díaz'],
    ['Felipe Torres', 'Sebastián Vega', 'Emilio Campos', 'Joaquín Rivas', 'Maximiliano Silva'],
    ['Leonardo Ortiz', 'Tomás Herrera', 'Benjamín Muñoz', 'Samuel Delgado', 'Daniel Paredes'],
  ];

  for (let i = 0; i < vTeamRecords.length; i++) {
    for (let j = 0; j < vNames[i].length; j++) {
      vPlayers.push(await prisma.player.create({
        data: {
          nombre: vNames[i][j],
          numero: j + 1,
          equipoId: vTeamRecords[i].id
        }
      }));
    }
  }

  // Jornadas
  const j1 = await prisma.jornada.create({
    data: { numero: 1, fecha: '2026-05-20', descripcion: 'Fecha 1 - Apertura' }
  });
  const j2 = await prisma.jornada.create({
    data: { numero: 2, fecha: '2026-05-27', descripcion: 'Fecha 2' }
  });
  const j3 = await prisma.jornada.create({
    data: { numero: 3, fecha: '2026-06-03', descripcion: 'Fecha 3' }
  });

  // Partidos Jornada 1 - DAMAS
  const m1 = await prisma.match.create({
    data: {
      jornadaId: j1.id, localId: dTeamRecords[0].id, visitanteId: dTeamRecords[1].id,
      categoriaId: damas.id, golesLocal: 3, golesVisit: 1, jugado: true,
      hora: '10:00', cancha: 'Cancha Principal', arbitro: 'Carlos Méndez'
    }
  });
  const m2 = await prisma.match.create({
    data: {
      jornadaId: j1.id, localId: dTeamRecords[2].id, visitanteId: dTeamRecords[3].id,
      categoriaId: damas.id, golesLocal: 2, golesVisit: 2, jugado: true,
      hora: '11:30', cancha: 'Cancha Principal', arbitro: 'Roberto Vargas'
    }
  });

  // Partidos Jornada 1 - VARONES
  const m3 = await prisma.match.create({
    data: {
      jornadaId: j1.id, localId: vTeamRecords[0].id, visitanteId: vTeamRecords[1].id,
      categoriaId: varones.id, golesLocal: 4, golesVisit: 2, jugado: true,
      hora: '13:00', cancha: 'Cancha Principal', arbitro: 'Luis Flores'
    }
  });
  const m4 = await prisma.match.create({
    data: {
      jornadaId: j1.id, localId: vTeamRecords[2].id, visitanteId: vTeamRecords[3].id,
      categoriaId: varones.id, golesLocal: 1, golesVisit: 3, jugado: true,
      hora: '14:30', cancha: 'Cancha Principal', arbitro: 'Pedro Ríos'
    }
  });

  // Goles J1 Damas
  await prisma.goal.create({ data: { matchId: m1.id, jugadorId: dPlayers[0].id, equipoId: dTeamRecords[0].id, cantidad: 2 } });
  await prisma.goal.create({ data: { matchId: m1.id, jugadorId: dPlayers[3].id, equipoId: dTeamRecords[0].id, cantidad: 1 } });
  await prisma.goal.create({ data: { matchId: m1.id, jugadorId: dPlayers[5].id, equipoId: dTeamRecords[1].id, cantidad: 1 } });
  await prisma.goal.create({ data: { matchId: m2.id, jugadorId: dPlayers[10].id, equipoId: dTeamRecords[2].id, cantidad: 1 } });
  await prisma.goal.create({ data: { matchId: m2.id, jugadorId: dPlayers[12].id, equipoId: dTeamRecords[2].id, cantidad: 1 } });
  await prisma.goal.create({ data: { matchId: m2.id, jugadorId: dPlayers[15].id, equipoId: dTeamRecords[3].id, cantidad: 2 } });

  // Goles J1 Varones
  await prisma.goal.create({ data: { matchId: m3.id, jugadorId: vPlayers[0].id, equipoId: vTeamRecords[0].id, cantidad: 2 } });
  await prisma.goal.create({ data: { matchId: m3.id, jugadorId: vPlayers[3].id, equipoId: vTeamRecords[0].id, cantidad: 1 } });
  await prisma.goal.create({ data: { matchId: m3.id, jugadorId: vPlayers[4].id, equipoId: vTeamRecords[0].id, cantidad: 1 } });
  await prisma.goal.create({ data: { matchId: m3.id, jugadorId: vPlayers[6].id, equipoId: vTeamRecords[1].id, cantidad: 2 } });
  await prisma.goal.create({ data: { matchId: m4.id, jugadorId: vPlayers[10].id, equipoId: vTeamRecords[2].id, cantidad: 1 } });
  await prisma.goal.create({ data: { matchId: m4.id, jugadorId: vPlayers[15].id, equipoId: vTeamRecords[3].id, cantidad: 2 } });
  await prisma.goal.create({ data: { matchId: m4.id, jugadorId: vPlayers[16].id, equipoId: vTeamRecords[3].id, cantidad: 1 } });

  // Tarjetas J1
  await prisma.card.create({ data: { matchId: m1.id, jugadorId: dPlayers[2].id, tipo: 'Amarilla' } });
  await prisma.card.create({ data: { matchId: m1.id, jugadorId: dPlayers[6].id, tipo: 'Amarilla' } });
  await prisma.card.create({ data: { matchId: m3.id, jugadorId: vPlayers[1].id, tipo: 'Amarilla' } });
  await prisma.card.create({ data: { matchId: m3.id, jugadorId: vPlayers[7].id, tipo: 'Roja' } });
  await prisma.card.create({ data: { matchId: m4.id, jugadorId: vPlayers[11].id, tipo: 'Amarilla' } });

  // Multas J1
  await prisma.fine.create({ data: { jugadorId: dPlayers[2].id, monto: 20, motivo: 'Amarilla', matchId: m1.id, pagado: true } });
  await prisma.fine.create({ data: { jugadorId: dPlayers[6].id, monto: 20, motivo: 'Amarilla', matchId: m1.id, pagado: false } });
  await prisma.fine.create({ data: { jugadorId: vPlayers[1].id, monto: 20, motivo: 'Amarilla', matchId: m3.id, pagado: true } });
  await prisma.fine.create({ data: { jugadorId: vPlayers[7].id, monto: 50, motivo: 'Roja', matchId: m3.id, pagado: false } });
  await prisma.fine.create({ data: { jugadorId: vPlayers[11].id, monto: 20, motivo: 'Amarilla', matchId: m4.id, pagado: false } });

  // Actualizar contadores de jugadores
  await prisma.player.update({ where: { id: dPlayers[2].id }, data: { amarillas: 1 } });
  await prisma.player.update({ where: { id: dPlayers[6].id }, data: { amarillas: 1 } });
  await prisma.player.update({ where: { id: vPlayers[1].id }, data: { amarillas: 1 } });
  await prisma.player.update({ where: { id: vPlayers[7].id }, data: { rojas: 1, estado: 'Suspendido' } });
  await prisma.player.update({ where: { id: vPlayers[11].id }, data: { amarillas: 1 } });

  // Partidos Jornada 2 - DAMAS
  const m5 = await prisma.match.create({
    data: {
      jornadaId: j2.id, localId: dTeamRecords[0].id, visitanteId: dTeamRecords[2].id,
      categoriaId: damas.id, golesLocal: 1, golesVisit: 1, jugado: true,
      hora: '10:00', cancha: 'Cancha Principal', arbitro: 'Ana Flores'
    }
  });
  const m6 = await prisma.match.create({
    data: {
      jornadaId: j2.id, localId: dTeamRecords[1].id, visitanteId: dTeamRecords[3].id,
      categoriaId: damas.id, golesLocal: 2, golesVisit: 0, jugado: true,
      hora: '11:30', cancha: 'Cancha Secundaria', arbitro: 'Marta Ríos'
    }
  });

  // Partidos Jornada 2 - VARONES
  const m7 = await prisma.match.create({
    data: {
      jornadaId: j2.id, localId: vTeamRecords[0].id, visitanteId: vTeamRecords[2].id,
      categoriaId: varones.id, golesLocal: 3, golesVisit: 0, jugado: true,
      hora: '13:00', cancha: 'Cancha Principal', arbitro: 'Jorge Díaz'
    }
  });
  const m8 = await prisma.match.create({
    data: {
      jornadaId: j2.id, localId: vTeamRecords[1].id, visitanteId: vTeamRecords[3].id,
      categoriaId: varones.id, golesLocal: 1, golesVisit: 2, jugado: true,
      hora: '14:30', cancha: 'Cancha Secundaria', arbitro: 'Marcos López'
    }
  });

  // Goles J2 Damas
  await prisma.goal.create({ data: { matchId: m5.id, jugadorId: dPlayers[1].id, equipoId: dTeamRecords[0].id, cantidad: 1 } });
  await prisma.goal.create({ data: { matchId: m5.id, jugadorId: dPlayers[10].id, equipoId: dTeamRecords[2].id, cantidad: 1 } });
  await prisma.goal.create({ data: { matchId: m6.id, jugadorId: dPlayers[6].id, equipoId: dTeamRecords[1].id, cantidad: 1 } });
  await prisma.goal.create({ data: { matchId: m6.id, jugadorId: dPlayers[8].id, equipoId: dTeamRecords[1].id, cantidad: 1 } });

  // Goles J2 Varones
  await prisma.goal.create({ data: { matchId: m7.id, jugadorId: vPlayers[0].id, equipoId: vTeamRecords[0].id, cantidad: 1 } });
  await prisma.goal.create({ data: { matchId: m7.id, jugadorId: vPlayers[3].id, equipoId: vTeamRecords[0].id, cantidad: 1 } });
  await prisma.goal.create({ data: { matchId: m7.id, jugadorId: vPlayers[4].id, equipoId: vTeamRecords[0].id, cantidad: 1 } });
  await prisma.goal.create({ data: { matchId: m8.id, jugadorId: vPlayers[7].id, equipoId: vTeamRecords[1].id, cantidad: 1 } });
  await prisma.goal.create({ data: { matchId: m8.id, jugadorId: vPlayers[16].id, equipoId: vTeamRecords[3].id, cantidad: 1 } });
  await prisma.goal.create({ data: { matchId: m8.id, jugadorId: vPlayers[17].id, equipoId: vTeamRecords[3].id, cantidad: 1 } });

  // Tarjetas J2
  await prisma.card.create({ data: { matchId: m5.id, jugadorId: dPlayers[3].id, tipo: 'Amarilla' } });
  await prisma.card.create({ data: { matchId: m5.id, jugadorId: dPlayers[12].id, tipo: 'Amarilla' } });
  await prisma.card.create({ data: { matchId: m7.id, jugadorId: vPlayers[2].id, tipo: 'Amarilla' } });
  await prisma.card.create({ data: { matchId: m8.id, jugadorId: vPlayers[12].id, tipo: 'Amarilla' } });

  // Multas J2
  await prisma.fine.create({ data: { jugadorId: dPlayers[3].id, monto: 20, motivo: 'Amarilla', matchId: m5.id, pagado: false } });
  await prisma.fine.create({ data: { jugadorId: dPlayers[12].id, monto: 20, motivo: 'Amarilla', matchId: m5.id, pagado: true } });
  await prisma.fine.create({ data: { jugadorId: vPlayers[2].id, monto: 20, motivo: 'Amarilla', matchId: m7.id, pagado: false } });
  await prisma.fine.create({ data: { jugadorId: vPlayers[12].id, monto: 20, motivo: 'Amarilla', matchId: m8.id, pagado: false } });

  // Actualizar contadores J2
  await prisma.player.update({ where: { id: dPlayers[3].id }, data: { amarillas: 1 } });
  await prisma.player.update({ where: { id: dPlayers[12].id }, data: { amarillas: 1 } });
  await prisma.player.update({ where: { id: vPlayers[2].id }, data: { amarillas: 1 } });
  await prisma.player.update({ where: { id: vPlayers[12].id }, data: { amarillas: 1 } });

  // Partidos Jornada 3 - DAMAS (distribuidos manualmente)
  const m9 = await prisma.match.create({
    data: {
      jornadaId: j3.id, localId: dTeamRecords[0].id, visitanteId: dTeamRecords[3].id,
      categoriaId: damas.id, golesLocal: 0, golesVisit: 0, jugado: false,
      hora: '10:00', cancha: 'Cancha Principal', arbitro: 'Ana Flores'
    }
  });
  const m10 = await prisma.match.create({
    data: {
      jornadaId: j3.id, localId: dTeamRecords[1].id, visitanteId: dTeamRecords[2].id,
      categoriaId: damas.id, golesLocal: 0, golesVisit: 0, jugado: false,
      hora: '11:30', cancha: 'Cancha Secundaria', arbitro: 'Marta Ríos'
    }
  });

  // Partidos Jornada 3 - VARONES
  const m11 = await prisma.match.create({
    data: {
      jornadaId: j3.id, localId: vTeamRecords[0].id, visitanteId: vTeamRecords[3].id,
      categoriaId: varones.id, golesLocal: 0, golesVisit: 0, jugado: false,
      hora: '13:00', cancha: 'Cancha Principal', arbitro: 'Jorge Díaz'
    }
  });
  const m12 = await prisma.match.create({
    data: {
      jornadaId: j3.id, localId: vTeamRecords[1].id, visitanteId: vTeamRecords[2].id,
      categoriaId: varones.id, golesLocal: 0, golesVisit: 0, jugado: false,
      hora: '14:30', cancha: 'Cancha Secundaria', arbitro: 'Marcos López'
    }
  });

  console.log('✅ Seed completado exitosamente');
  console.log(`  - 1 administrador`);
  console.log(`  - 2 categorías (Damas, Varones)`);
  console.log(`  - ${dTeamRecords.length + vTeamRecords.length} equipos`);
  console.log(`  - ${dPlayers.length + vPlayers.length} jugadores`);
  console.log(`  - 3 jornadas (2 jugadas, 1 programada)`);
  console.log(`  - 12 partidos`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
