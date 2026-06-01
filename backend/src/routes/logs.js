// ── Rotas de Logs Clínicos ────────────────────────────
const router = require('express').Router();
const { z }  = require('zod');
const { PrismaClient } = require('@prisma/client');
const { auth, requirePro } = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/logs?patientId=...
router.get('/', auth, async (req, res) => {
  const patientId = req.query.patientId || req.user.patientProfile?.id;
  if (!patientId) return res.status(400).json({ error: 'patientId necessário.' });

  const where = { patientId };
  if (req.user.role === 'PATIENT') where.isVisible = true;

  const logs = await prisma.log.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { name: true, avatar: true } } },
  });
  res.json(logs);
});

// POST /api/logs
router.post('/', auth, requirePro, async (req, res) => {
  const schema = z.object({
    patientId:  z.string().uuid(),
    type:       z.enum(['OBSERVATION','SESSION','PROGRESS','NOTE']).optional(),
    title:      z.string().min(2, 'Título obrigatório'),
    content:    z.string().min(5, 'Conteúdo obrigatório'),
    isVisible:  z.boolean().optional(),
  });

  const data = schema.parse(req.body);
  const log = await prisma.log.create({
    data: { ...data, type: data.type || 'OBSERVATION', isVisible: data.isVisible || false, createdById: req.user.id },
    include: { createdBy: { select: { name: true, avatar: true } } },
  });
  res.status(201).json(log);
});

// PATCH /api/logs/:id/visibility
router.patch('/:id/visibility', auth, requirePro, async (req, res) => {
  const log = await prisma.log.findUnique({ where: { id: req.params.id } });
  if (!log) return res.status(404).json({ error: 'Log não encontrado.' });
  const updated = await prisma.log.update({ where: { id: req.params.id }, data: { isVisible: !log.isVisible } });
  res.json(updated);
});

// DELETE /api/logs/:id
router.delete('/:id', auth, requirePro, async (req, res) => {
  await prisma.log.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
