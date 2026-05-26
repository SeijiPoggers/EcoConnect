// ─────────────────────────────────────────────────────────
// EcoConnect — All API Routes
// ─────────────────────────────────────────────────────────
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireProfessional } = require('../middleware/auth');

const prisma = new PrismaClient();

// ── PATIENTS ───────────────────────────────────────────
const patientsRouter = express.Router();
patientsRouter.use(authenticate);

// GET /api/patients/me — current patient profile
patientsRouter.get('/me', async (req, res, next) => {
  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        professional: { include: { user: { select: { name: true, avatar: true, email: true } } } },
      },
    });
    if (!patient) return res.status(404).json({ error: 'Perfil de paciente não encontrado' });
    res.json(patient);
  } catch (e) { next(e); }
});

// GET /api/patients — list (professional only)
patientsRouter.get('/', requireProfessional, async (req, res, next) => {
  try {
    const patients = await prisma.patientProfile.findMany({
      where: { professionalId: req.user.professionalProfile.id },
      include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(patients);
  } catch (e) { next(e); }
});

// GET /api/patients/:id — single patient (professional only)
patientsRouter.get('/:id', requireProfessional, async (req, res, next) => {
  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
    });
    if (!patient) return res.status(404).json({ error: 'Paciente não encontrado' });
    res.json(patient);
  } catch (e) { next(e); }
});

module.exports.patientsRouter = patientsRouter;

// ── PROFESSIONALS ──────────────────────────────────────
const professionalsRouter = express.Router();
professionalsRouter.use(authenticate, requireProfessional);

// GET /api/professionals/me
professionalsRouter.get('/me', async (req, res, next) => {
  try {
    const pro = await prisma.professionalProfile.findUnique({
      where: { userId: req.user.id },
      include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
    });
    res.json(pro);
  } catch (e) { next(e); }
});

// GET /api/professionals/stats
professionalsRouter.get('/stats', async (req, res, next) => {
  try {
    const proId = req.user.professionalProfile.id;
    const patients = await prisma.patientProfile.findMany({ where: { professionalId: proId } });
    const patientIds = patients.map(p => p.id);
    const objectives = await prisma.objective.findMany({ where: { patientId: { in: patientIds } } });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const todayApts = await prisma.appointment.count({
      where: { professionalId: proId, date: { gte: today, lt: tomorrow }, status: 'SCHEDULED' },
    });
    const avgXp = patients.length > 0 ? patients.reduce((a, p) => a + p.xp, 0) / patients.length : 0;
    res.json({
      totalPatients: patients.length,
      consultasHoje: todayApts,
      objetivosConcluidos: objectives.filter(o => o.done).length,
      taxaProgresso: Math.round(Math.min(100, (avgXp / 100) * 100)),
    });
  } catch (e) { next(e); }
});

module.exports.professionalsRouter = professionalsRouter;

// ── ORGANIZATIONS ──────────────────────────────────────
const orgsRouter = express.Router();

// GET /api/organizations
orgsRouter.get('/', async (req, res, next) => {
  try {
    const { tag, q } = req.query;
    const where = { isActive: true };
    if (tag && tag !== 'Todos') where.tags = { some: { tag } };
    if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { city: { contains: q, mode: 'insensitive' } }];
    const orgs = await prisma.organization.findMany({
      where,
      include: { tags: true },
      orderBy: { rating: 'desc' },
    });
    res.json(orgs.map(o => ({ ...o, slots: o.slotsTotal - o.slotsUsed })));
  } catch (e) { next(e); }
});

module.exports.orgsRouter = orgsRouter;

// ── APPOINTMENTS ───────────────────────────────────────
const appointmentsRouter = express.Router();
appointmentsRouter.use(authenticate);

// GET /api/appointments
appointmentsRouter.get('/', async (req, res, next) => {
  try {
    const where = req.user.role === 'PATIENT'
      ? { patientId: req.user.patientProfile?.id }
      : { professionalId: req.user.professionalProfile?.id };

    const apts = await prisma.appointment.findMany({
      where,
      include: {
        organization: { include: { tags: true } },
        patient: { include: { user: { select: { name: true, avatar: true } } } },
      },
      orderBy: { date: 'desc' },
    });
    res.json(apts);
  } catch (e) { next(e); }
});

// POST /api/appointments
appointmentsRouter.post('/', async (req, res, next) => {
  try {
    const { organizationId, professionalId, date, time, notes } = req.body;
    if (!organizationId || !date || !time) {
      return res.status(400).json({ error: 'Campos obrigatórios: organizationId, date, time' });
    }
    const patientId = req.user.role === 'PATIENT'
      ? req.user.patientProfile?.id
      : req.body.patientId;
    if (!patientId) return res.status(400).json({ error: 'patientId necessário' });

    // Find a professional for the org if not provided
    let proId = professionalId;
    if (!proId) {
      const org = await prisma.organization.findUnique({ where: { id: organizationId }, include: { professionals: true } });
      proId = org?.professionals[0]?.id;
    }

    const apt = await prisma.appointment.create({
      data: {
        patientId,
        organizationId,
        professionalId: proId,
        date: new Date(date),
        time,
        notes: notes || '',
        status: 'SCHEDULED',
      },
      include: { organization: { include: { tags: true } } },
    });
    res.status(201).json(apt);
  } catch (e) { next(e); }
});

// PATCH /api/appointments/:id/cancel
appointmentsRouter.patch('/:id/cancel', async (req, res, next) => {
  try {
    const apt = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED', cancelReason: req.body.reason },
    });
    res.json(apt);
  } catch (e) { next(e); }
});

module.exports.appointmentsRouter = appointmentsRouter;

// ── OBJECTIVES ─────────────────────────────────────────
const objectivesRouter = express.Router();
objectivesRouter.use(authenticate);

// GET /api/objectives?patientId=...
objectivesRouter.get('/', async (req, res, next) => {
  try {
    const patientId = req.query.patientId || req.user.patientProfile?.id;
    const where = { patientId };
    // Patients only see visible objectives
    if (req.user.role === 'PATIENT') where.isVisible = true;
    const objs = await prisma.objective.findMany({
      where, orderBy: [{ done: 'asc' }, { createdAt: 'desc' }],
    });
    res.json(objs);
  } catch (e) { next(e); }
});

// POST /api/objectives
objectivesRouter.post('/', requireProfessional, async (req, res, next) => {
  try {
    const { patientId, text, xpReward, deadline, isVisible } = req.body;
    if (!patientId || !text) return res.status(400).json({ error: 'patientId e text obrigatórios' });
    const obj = await prisma.objective.create({
      data: { patientId, text, xpReward: xpReward || 15, deadline: deadline ? new Date(deadline) : null, isVisible: isVisible !== false, createdById: req.user.id },
    });
    res.status(201).json(obj);
  } catch (e) { next(e); }
});

// PATCH /api/objectives/:id/toggle
objectivesRouter.patch('/:id/toggle', requireProfessional, async (req, res, next) => {
  try {
    const obj = await prisma.objective.findUnique({ where: { id: req.params.id } });
    if (!obj) return res.status(404).json({ error: 'Objetivo não encontrado' });
    const newDone = !obj.done;
    const updated = await prisma.objective.update({
      where: { id: req.params.id },
      data: { done: newDone, doneAt: newDone ? new Date() : null },
    });
    // Update patient XP
    await prisma.patientProfile.update({
      where: { id: obj.patientId },
      data: {
        xp: { increment: newDone ? obj.xpReward : -obj.xpReward },
      },
    });
    // Recalculate level
    const patient = await prisma.patientProfile.findUnique({ where: { id: obj.patientId } });
    await prisma.patientProfile.update({
      where: { id: obj.patientId },
      data: { level: Math.floor(Math.max(0, patient.xp) / 25) + 1 },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

// DELETE /api/objectives/:id
objectivesRouter.delete('/:id', requireProfessional, async (req, res, next) => {
  try {
    await prisma.objective.delete({ where: { id: req.params.id } });
    res.json({ message: 'Objetivo removido' });
  } catch (e) { next(e); }
});

module.exports.objectivesRouter = objectivesRouter;

// ── LOGS ───────────────────────────────────────────────
const logsRouter = express.Router();
logsRouter.use(authenticate);

// GET /api/logs?patientId=...
logsRouter.get('/', async (req, res, next) => {
  try {
    const patientId = req.query.patientId || req.user.patientProfile?.id;
    const where = { patientId };
    if (req.user.role === 'PATIENT') where.isVisible = true;
    const logs = await prisma.log.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { name: true, avatar: true } } },
    });
    res.json(logs);
  } catch (e) { next(e); }
});

// POST /api/logs
logsRouter.post('/', requireProfessional, async (req, res, next) => {
  try {
    const { patientId, type, title, content, isVisible } = req.body;
    if (!patientId || !title || !content) {
      return res.status(400).json({ error: 'patientId, title e content obrigatórios' });
    }
    const log = await prisma.log.create({
      data: { patientId, type: type || 'OBSERVATION', title, content, isVisible: isVisible !== false, createdById: req.user.id },
      include: { createdBy: { select: { name: true, avatar: true } } },
    });
    res.status(201).json(log);
  } catch (e) { next(e); }
});

// PATCH /api/logs/:id/visibility
logsRouter.patch('/:id/visibility', requireProfessional, async (req, res, next) => {
  try {
    const log = await prisma.log.findUnique({ where: { id: req.params.id } });
    if (!log) return res.status(404).json({ error: 'Log não encontrado' });
    const updated = await prisma.log.update({
      where: { id: req.params.id },
      data: { isVisible: !log.isVisible },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

module.exports.logsRouter = logsRouter;

// ── CONTACT ────────────────────────────────────────────
const contactRouter = express.Router();

contactRouter.post('/', async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'name, email e message obrigatórios' });
    }
    const msg = await prisma.contactMessage.create({ data: { name, email, message } });
    res.status(201).json({ message: 'Mensagem recebida com sucesso!', id: msg.id });
  } catch (e) { next(e); }
});

module.exports.contactRouter = contactRouter;
