// ── Rotas de Usuários / Perfis ────────────────────────
const router = require('express').Router();
const { z }  = require('zod');
const { PrismaClient } = require('@prisma/client');
const { auth, requirePro } = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/users/patient/me
router.get('/patient/me', auth, async (req, res) => {
  const patient = await prisma.patientProfile.findUnique({
    where: { userId: req.user.id },
    include: {
      professional: {
        include: { user: { select: { name: true, avatar: true, email: true } } },
      },
    },
  });
  if (!patient) return res.status(404).json({ error: 'Perfil de paciente não encontrado.' });
  res.json(patient);
});

// GET /api/users/patients  — lista pacientes vinculados ao profissional
router.get('/patients', auth, requirePro, async (req, res) => {
  const patients = await prisma.patientProfile.findMany({
    where: { professionalId: req.user.professionalProfile.id },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(patients);
});

// GET /api/users/patients/:id
router.get('/patients/:id', auth, requirePro, async (req, res) => {
  const patient = await prisma.patientProfile.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });
  if (!patient) return res.status(404).json({ error: 'Paciente não encontrado.' });
  res.json(patient);
});

// PATCH /api/users/patient/me — atualiza perfil do paciente
router.patch('/patient/me', auth, async (req, res) => {
  const schema = z.object({
    condition:      z.enum(['TEA','ADHD','DYSLEXIA','DYSPRAXIA','OTHER','UNSPECIFIED']).optional(),
    conditionNotes: z.string().optional(),
  });
  const data = schema.parse(req.body);
  const updated = await prisma.patientProfile.update({
    where: { userId: req.user.id },
    data,
  });
  res.json(updated);
});

// GET /api/users/professional/me
router.get('/professional/me', auth, requirePro, async (req, res) => {
  const pro = await prisma.professionalProfile.findUnique({
    where: { userId: req.user.id },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });
  res.json(pro);
});

// PATCH /api/users/professional/me
router.patch('/professional/me', auth, requirePro, async (req, res) => {
  const schema = z.object({
    specialty:  z.string().optional(),
    bio:        z.string().optional(),
    experience: z.string().optional(),
    education:  z.string().optional(),
    crp:        z.string().optional(),
    photoUrl:   z.string().url().optional().or(z.literal('')),
    approaches: z.array(z.string()).optional(),
    languages:  z.array(z.string()).optional(),
  });
  const data = schema.parse(req.body);
  const updated = await prisma.professionalProfile.update({
    where: { userId: req.user.id },
    data,
    include: { user: { select: { name: true, avatar: true } } },
  });
  res.json(updated);
});

// GET /api/users/professional/stats
router.get('/professional/stats', auth, requirePro, async (req, res) => {
  const proId    = req.user.professionalProfile.id;
  const patients = await prisma.patientProfile.findMany({ where: { professionalId: proId } });
  const ids      = patients.map(p => p.id);

  const today    = new Date();
  const todayStart = new Date(today.setHours(0,0,0,0));
  const todayEnd   = new Date(today.setHours(23,59,59,999));

  const [objDone, todayApts, totalLogs] = await Promise.all([
    prisma.objective.count({ where: { patientId: { in: ids }, done: true } }),
    prisma.appointment.count({
      where: { status: 'SCHEDULED', date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.log.count({ where: { patientId: { in: ids } } }),
  ]);

  const avgXp = patients.length > 0
    ? patients.reduce((a, p) => a + p.xp, 0) / patients.length
    : 0;

  res.json({
    totalPatients:       patients.length,
    consultasHoje:       todayApts,
    objetivosConcluidos: objDone,
    taxaProgresso:       Math.round(Math.min(100, avgXp)),
    totalLogs,
  });
});

// POST /api/users/patients/invite  — associa paciente ao profissional (via e-mail)
router.post('/patients/invite', auth, requirePro, async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { patientProfile: true },
  });

  if (!user) return res.status(404).json({ error: 'Paciente com este e-mail não encontrado.' });
  if (user.role !== 'PATIENT') return res.status(422).json({ error: 'Este usuário não é um paciente.' });
  if (!user.patientProfile) return res.status(422).json({ error: 'Perfil de paciente não encontrado.' });
  if (user.patientProfile.professionalId) {
    return res.status(409).json({ error: 'Paciente já está vinculado a outro profissional.' });
  }

  const updated = await prisma.patientProfile.update({
    where: { id: user.patientProfile.id },
    data:  { professionalId: req.user.professionalProfile.id },
    include: { user: { select: { name: true, email: true, avatar: true } } },
  });

  res.json({ ok: true, patient: updated });
});

// DELETE /api/users/patients/:id/unlink  — desvincula paciente
router.delete('/patients/:id/unlink', auth, requirePro, async (req, res) => {
  const patient = await prisma.patientProfile.findUnique({ where: { id: req.params.id } });
  if (!patient) return res.status(404).json({ error: 'Paciente não encontrado.' });
  if (patient.professionalId !== req.user.professionalProfile.id) {
    return res.status(403).json({ error: 'Este paciente não está vinculado a você.' });
  }
  await prisma.patientProfile.update({
    where: { id: req.params.id },
    data:  { professionalId: null },
  });
  res.json({ ok: true });
});

module.exports = router;
