// ─────────────────────────────────────────────────────────
// EcoConnect — Database Seed
// Populates the database with test data
// Run: npm run db:seed
// ─────────────────────────────────────────────────────────

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding EcoConnect database...\n');

  // ── Clean existing data ──────────────────────────────
  await prisma.contactMessage.deleteMany();
  await prisma.log.deleteMany();
  await prisma.objective.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.organizationTag.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.professionalProfile.deleteMany();
  await prisma.user.deleteMany();

  const hash = (p) => bcrypt.hashSync(p, 10);

  // ── Create Professional Users ────────────────────────
  console.log('👨‍⚕️ Creating professional users...');

  const pauloUser = await prisma.user.create({
    data: {
      email: 'paulo@ecoconnect.com',
      password: hash('admin123'),
      name: 'Dr. Paulo Henrique',
      avatar: 'PH',
      role: 'PROFESSIONAL',
      professionalProfile: {
        create: {
          crp: 'CRP 06/123456',
          specialty: 'Neuropsicólogo',
          bio: 'Especialista em TEA e TDAH com 12 anos de experiência.',
        },
      },
    },
    include: { professionalProfile: true },
  });

  const beatrizUser = await prisma.user.create({
    data: {
      email: 'beatriz@ecoconnect.com',
      password: hash('admin123'),
      name: 'Dra. Ana Beatriz',
      avatar: 'AB',
      role: 'PROFESSIONAL',
      professionalProfile: {
        create: {
          crp: 'CRP 06/654321',
          specialty: 'Terapeuta Ocupacional',
          bio: 'Especialista em integração sensorial e desenvolvimento infantil.',
        },
      },
    },
    include: { professionalProfile: true },
  });

  // ── Create Organizations ─────────────────────────────
  console.log('🏢 Creating organizations...');

  const org1 = await prisma.organization.create({
    data: {
      name: 'Instituto NeuroMente',
      type: 'Neuropsicologia',
      city: 'São Paulo',
      state: 'SP',
      address: 'Av. Paulista, 1000 — Sala 204',
      phone: '(11) 3000-1000',
      email: 'contato@neuromente.com.br',
      rating: 4.9,
      slotsTotal: 10,
      slotsUsed: 7,
      emoji: '🧠',
      tags: { create: [{ tag: 'TEA' }, { tag: 'TDAH' }, { tag: 'Terapia ABA' }] },
      professionals: { connect: [{ id: pauloUser.professionalProfile.id }] },
    },
  });

  const org2 = await prisma.organization.create({
    data: {
      name: 'Centro Plural TEA',
      type: 'Terapia Ocupacional',
      city: 'São Paulo',
      state: 'SP',
      address: 'Rua Augusta, 500 — Sala 10',
      phone: '(11) 3000-2000',
      rating: 4.7,
      slotsTotal: 8,
      slotsUsed: 7,
      emoji: '🌈',
      tags: { create: [{ tag: 'TEA' }, { tag: 'Integração Sensorial' }] },
      professionals: { connect: [{ id: beatrizUser.professionalProfile.id }] },
    },
  });

  const org3 = await prisma.organization.create({
    data: {
      name: 'Espaço Inclusão',
      type: 'Pedagogia Especializada',
      city: 'Rio de Janeiro',
      state: 'RJ',
      address: 'Av. Rio Branco, 200',
      phone: '(21) 3000-3000',
      rating: 4.8,
      slotsTotal: 15,
      slotsUsed: 10,
      emoji: '📚',
      tags: { create: [{ tag: 'Dislexia' }, { tag: 'TDAH' }] },
      professionals: { connect: [{ id: pauloUser.professionalProfile.id }] },
    },
  });

  const org4 = await prisma.organization.create({
    data: {
      name: 'NeuroEspaço',
      type: 'Psicoterapia',
      city: 'Belo Horizonte',
      state: 'MG',
      rating: 4.6,
      slotsTotal: 12,
      slotsUsed: 10,
      emoji: '💆',
      tags: { create: [{ tag: 'TDAH' }, { tag: 'Ansiedade' }] },
      professionals: { connect: [{ id: beatrizUser.professionalProfile.id }] },
    },
  });

  // ── Create Patient Users ─────────────────────────────
  console.log('👤 Creating patient users...');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const mariaUser = await prisma.user.create({
    data: {
      email: 'maria@email.com',
      password: hash('123456'),
      name: 'Maria Clara Santos',
      avatar: 'MC',
      role: 'PATIENT',
      patientProfile: {
        create: {
          condition: 'TEA',
          xp: 68,
          level: 3,
          professionalId: pauloUser.professionalProfile.id,
        },
      },
    },
    include: { patientProfile: true },
  });

  const joaoUser = await prisma.user.create({
    data: {
      email: 'joao@email.com',
      password: hash('123456'),
      name: 'João Pedro Silva',
      avatar: 'JS',
      role: 'PATIENT',
      patientProfile: {
        create: {
          condition: 'ADHD',
          xp: 42,
          level: 2,
          professionalId: pauloUser.professionalProfile.id,
        },
      },
    },
    include: { patientProfile: true },
  });

  const anaUser = await prisma.user.create({
    data: {
      email: 'ana@email.com',
      password: hash('123456'),
      name: 'Ana Luísa Lima',
      avatar: 'AL',
      role: 'PATIENT',
      patientProfile: {
        create: {
          condition: 'DYSLEXIA',
          xp: 95,
          level: 4,
          professionalId: beatrizUser.professionalProfile.id,
        },
      },
    },
    include: { patientProfile: true },
  });

  // ── Create Objectives ────────────────────────────────
  console.log('🎯 Creating objectives...');

  await prisma.objective.createMany({
    data: [
      { patientId: mariaUser.patientProfile.id, createdById: pauloUser.id, text: 'Manter rotina de sono consistente', done: true, xpReward: 15, doneAt: new Date('2024-03-28'), isVisible: true },
      { patientId: mariaUser.patientProfile.id, createdById: pauloUser.id, text: 'Diário emocional por 7 dias', done: true, xpReward: 20, doneAt: new Date('2024-03-25'), isVisible: true },
      { patientId: mariaUser.patientProfile.id, createdById: pauloUser.id, text: 'Técnicas de respiração (3x por semana)', done: true, xpReward: 18, doneAt: new Date('2024-03-20'), isVisible: true },
      { patientId: mariaUser.patientProfile.id, createdById: pauloUser.id, text: 'Participar do grupo de suporte', done: false, xpReward: 15, deadline: new Date('2024-04-10'), isVisible: true },
      { patientId: mariaUser.patientProfile.id, createdById: pauloUser.id, text: 'Exercícios de coordenação motora', done: false, xpReward: 20, deadline: new Date('2024-04-15'), isVisible: true },
      { patientId: joaoUser.patientProfile.id, createdById: pauloUser.id, text: 'Agenda semanal estruturada', done: true, xpReward: 20, doneAt: new Date('2024-03-22'), isVisible: true },
      { patientId: joaoUser.patientProfile.id, createdById: pauloUser.id, text: 'Técnicas de foco (Pomodoro)', done: false, xpReward: 22, deadline: new Date('2024-04-12'), isVisible: true },
      { patientId: anaUser.patientProfile.id, createdById: beatrizUser.id, text: 'Leitura guiada 20min/dia', done: true, xpReward: 25, doneAt: new Date('2024-03-15'), isVisible: true },
      { patientId: anaUser.patientProfile.id, createdById: beatrizUser.id, text: 'Jogos de consciência fonológica', done: true, xpReward: 20, doneAt: new Date('2024-03-18'), isVisible: true },
      { patientId: anaUser.patientProfile.id, createdById: beatrizUser.id, text: 'Escrita criativa semanal', done: true, xpReward: 30, doneAt: new Date('2024-03-25'), isVisible: true },
    ],
  });

  // ── Create Logs ──────────────────────────────────────
  console.log('📝 Creating clinical logs...');

  await prisma.log.createMany({
    data: [
      { patientId: mariaUser.patientProfile.id, createdById: pauloUser.id, type: 'OBSERVATION', title: 'Melhora na concentração', content: 'Maria apresentou melhora significativa na concentração. Conseguiu manter foco por 40min durante atividade estruturada. Recomendo aumentar gradualmente o tempo.', isVisible: true },
      { patientId: mariaUser.patientProfile.id, createdById: pauloUser.id, type: 'SESSION', title: 'Sessão de habilidades sociais', content: 'Trabalhamos habilidades sociais com jogo de papéis. Paciente demonstrou engajamento acima da média. Próxima sessão: foco em transições de rotina.', isVisible: true, createdAt: new Date('2024-03-28T14:00:00Z') },
      { patientId: mariaUser.patientProfile.id, createdById: pauloUser.id, type: 'PROGRESS', title: 'Objetivo concluído — Diário Emocional', content: "Objetivo 'Diário Emocional' marcado como concluído. +20 XP enviados ao paciente. Excelente adesão ao longo de 7 dias consecutivos.", isVisible: true, createdAt: new Date('2024-03-25T10:15:00Z') },
      { patientId: joaoUser.patientProfile.id, createdById: pauloUser.id, type: 'OBSERVATION', title: 'Resistência inicial às técnicas', content: 'João demonstrou resistência inicial, mas ao final da sessão houve boa receptividade às técnicas de regulação. Planejar abordagem lúdica para próxima vez.', isVisible: false, createdAt: new Date('2024-03-20T16:00:00Z') },
      { patientId: anaUser.patientProfile.id, createdById: beatrizUser.id, type: 'SESSION', title: 'Leitura guiada excelente', content: 'Ana leu 3 páginas sem dificuldade aparente. Progresso notável desde o início do tratamento. A estratégia de cores no texto está funcionando muito bem.', isVisible: true, createdAt: new Date('2024-03-22T11:00:00Z') },
    ],
  });

  // ── Create Appointments ──────────────────────────────
  console.log('📅 Creating appointments...');

  await prisma.appointment.createMany({
    data: [
      { patientId: mariaUser.patientProfile.id, organizationId: org1.id, professionalId: pauloUser.professionalProfile.id, date: tomorrow, time: '14:00', status: 'SCHEDULED', notes: 'Tenho dificuldade com transições de rotina' },
      { patientId: mariaUser.patientProfile.id, organizationId: org2.id, professionalId: beatrizUser.professionalProfile.id, date: new Date('2024-03-20'), time: '10:00', status: 'COMPLETED' },
      { patientId: joaoUser.patientProfile.id, organizationId: org1.id, professionalId: pauloUser.professionalProfile.id, date: tomorrow, time: '09:00', status: 'SCHEDULED' },
      { patientId: anaUser.patientProfile.id, organizationId: org3.id, professionalId: beatrizUser.professionalProfile.id, date: new Date('2024-03-15'), time: '15:00', status: 'COMPLETED' },
    ],
  });

  // ── Create Contact Messages ──────────────────────────
  await prisma.contactMessage.createMany({
    data: [
      { name: 'Carlos Souza', email: 'carlos@email.com', message: 'Olá! Gostaria de saber mais sobre o processo de agendamento.' },
      { name: 'Fernanda Lima', email: 'fernanda@email.com', message: 'Minha filha tem TEA. Como posso cadastrá-la na plataforma?' },
    ],
  });

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Test accounts:');
  console.log('   Patient:      maria@email.com      / 123456');
  console.log('   Patient:      joao@email.com       / 123456');
  console.log('   Patient:      ana@email.com        / 123456');
  console.log('   Professional: paulo@ecoconnect.com  / admin123');
  console.log('   Professional: beatriz@ecoconnect.com / admin123');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
