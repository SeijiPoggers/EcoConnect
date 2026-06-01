// ── Rotas de Consultas ────────────────────────────────
const router = require('express').Router();
const { z }  = require('zod');
const { PrismaClient } = require('@prisma/client');
const { auth, requirePro } = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/appointments
router.get('/', auth, async (req, res) => {
  const where = req.user.role === 'PATIENT'
    ? { patientId: req.user.patientProfile?.id }
    : { professionalId: req.user.professionalProfile?.id };

  const apts = await prisma.appointment.findMany({
    where,
    include: {
      organization: { select: { id: true, name: true, emoji: true } },
      institution:  { select: { id: true, name: true, emoji: true } },
      patient:      { include: { user: { select: { name: true, avatar: true } } } },
    },
    orderBy: { date: 'desc' },
  });
  res.json(apts);
});

// POST /api/appointments
router.post('/', auth, async (req, res) => {
  const schema = z.object({
    // One of these is required
    organizationId: z.string().uuid().optional(),
    institutionId:  z.string().uuid().optional(),
    professionalId: z.string().uuid().optional(),
    date:  z.string().min(1, 'Data obrigatória'),
    time:  z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    notes: z.string().max(500).optional(),
  }).refine(d => d.organizationId || d.institutionId, {
    message: 'organizationId ou institutionId é obrigatório',
  });

  const data = schema.parse(req.body);

  const patientId = req.user.patientProfile?.id;
  if (!patientId) return res.status(400).json({ error: 'Apenas pacientes podem agendar consultas.' });

  // Resolve professionalId
  let professionalId = data.professionalId;
  if (!professionalId) {
    if (data.institutionId) {
      const member = await prisma.institutionMember.findFirst({
        where: { institutionId: data.institutionId },
        select: { professionalId: true },
      });
      professionalId = member?.professionalId;
    } else if (data.organizationId) {
      // Legacy: org profissional — pick from a linked pro or use any active pro
      const pro = await prisma.professionalProfile.findFirst({ select: { id: true } });
      professionalId = pro?.id;
    }
    if (!professionalId) return res.status(400).json({ error: 'Nenhum profissional disponível.' });
  }

  const apt = await prisma.appointment.create({
    data: {
      patientId,
      professionalId,
      organizationId: data.organizationId || null,
      institutionId:  data.institutionId  || null,
      date:  new Date(data.date),
      time:  data.time,
      notes: data.notes || '',
    },
    include: {
      institution:  { select: { name: true, emoji: true } },
      organization: { select: { name: true, emoji: true } },
    },
  });

  res.status(201).json(apt);
});

// PATCH /api/appointments/:id/cancel
router.patch('/:id/cancel', auth, async (req, res) => {
  const apt = await prisma.appointment.findUnique({ where: { id: req.params.id } });
  if (!apt) return res.status(404).json({ error: 'Consulta não encontrada.' });

  // Only patient who owns it or professional can cancel
  const isOwner = req.user.patientProfile?.id === apt.patientId;
  const isPro   = req.user.role === 'PROFESSIONAL';
  if (!isOwner && !isPro) return res.status(403).json({ error: 'Sem permissão.' });

  const { reason } = req.body;
  const updated = await prisma.appointment.update({
    where: { id: req.params.id },
    data:  { status: 'CANCELLED', cancelReason: reason || null },
  });
  res.json(updated);
});

// PATCH /api/appointments/:id/complete
router.patch('/:id/complete', auth, requirePro, async (req, res) => {
  const updated = await prisma.appointment.update({
    where: { id: req.params.id },
    data:  { status: 'COMPLETED' },
  });
  res.json(updated);
});

module.exports = router;
