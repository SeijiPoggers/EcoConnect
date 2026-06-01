// ── Rotas de Instituições ─────────────────────────────
// Substituem Organization para novos dados.
// Requer Modo Instituição ativo no perfil do profissional.

const router = require('express').Router();
const { z }  = require('zod');
const { PrismaClient } = require('@prisma/client');
const { auth, requirePro } = require('../middleware/auth');

const prisma = new PrismaClient();
const MAX_INSTITUTIONS = 3;

// ── Guard: requer Modo Instituição ───────────────────
async function requireInstitutionMode(req, res, next) {
  const pro = await prisma.professionalProfile.findUnique({
    where: { userId: req.user.id },
    select: { institutionMode: true },
  });
  if (!pro?.institutionMode) {
    return res.status(403).json({
      error: 'Modo Instituição não está ativo. Ative nas configurações do seu perfil.',
    });
  }
  next();
}

// ── Guard: requer ser ADMIN da instituição ───────────
async function requireInstitutionAdmin(req, res, next) {
  const member = await prisma.institutionMember.findUnique({
    where: {
      institutionId_professionalId: {
        institutionId:  req.params.id,
        professionalId: req.user.professionalProfile.id,
      },
    },
  });
  if (!member || member.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Apenas administradores da instituição podem realizar esta ação.' });
  }
  next();
}

// ══════════════════════════════════════════════════════
//  ROTAS PÚBLICAS (listagem para pacientes)
// ══════════════════════════════════════════════════════

// GET /api/institutions  — lista instituições ativas
router.get('/', async (req, res) => {
  const { tag, q, city } = req.query;

  const where = { isActive: true };
  if (city) where.city = { contains: city, mode: 'insensitive' };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { city: { contains: q, mode: 'insensitive' } },
      { type: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (tag && tag !== 'Todos') {
    where.tags = { some: { tag } };
  }

  const institutions = await prisma.institution.findMany({
    where,
    include: {
      tags: true,
      members: {
        where: { professional: { user: { isActive: true } } },
        include: {
          professional: {
            select: {
              id: true, specialty: true, bio: true,
              experience: true, education: true, approaches: true,
              user: { select: { name: true, avatar: true } },
            },
          },
        },
      },
    },
    orderBy: { rating: 'desc' },
  });

  res.json(institutions.map(i => ({
    ...i,
    slots: Math.max(0, i.slotsTotal - i.slotsUsed),
    professionals: i.members.map(m => m.professional),
  })));
});

// GET /api/institutions/:id
router.get('/:id', async (req, res) => {
  const inst = await prisma.institution.findUnique({
    where: { id: req.params.id },
    include: {
      tags: true,
      members: {
        include: {
          professional: {
            select: {
              id: true, specialty: true, bio: true,
              experience: true, education: true, approaches: true,
              role: true,
              user: { select: { name: true, avatar: true, email: true } },
            },
          },
        },
      },
    },
  });
  if (!inst) return res.status(404).json({ error: 'Instituição não encontrada.' });
  res.json({ ...inst, slots: Math.max(0, inst.slotsTotal - inst.slotsUsed) });
});

// ══════════════════════════════════════════════════════
//  ROTAS AUTENTICADAS — MODO INSTITUIÇÃO
// ══════════════════════════════════════════════════════

// GET /api/institutions/my/list  — minhas instituições (como admin)
router.get('/my/list', auth, requirePro, async (req, res) => {
  const proId = req.user.professionalProfile.id;
  const memberships = await prisma.institutionMember.findMany({
    where: { professionalId: proId },
    include: {
      institution: {
        include: {
          tags: true,
          members: {
            include: {
              professional: {
                select: {
                  id: true, specialty: true, bio: true, experience: true,
                  user: { select: { name: true, avatar: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  // Also return current institutionMode and count
  const pro = await prisma.professionalProfile.findUnique({
    where: { id: proId },
    select: { institutionMode: true, institutionCount: true },
  });

  res.json({
    institutionMode: pro?.institutionMode || false,
    institutionCount: pro?.institutionCount || 0,
    maxAllowed: MAX_INSTITUTIONS,
    memberships: memberships.map(m => ({
      role: m.role,
      joinedAt: m.joinedAt,
      institution: {
        ...m.institution,
        slots: Math.max(0, m.institution.slotsTotal - m.institution.slotsUsed),
        memberCount: m.institution.members.length,
        professionals: m.institution.members.map(mb => mb.professional),
      },
    })),
  });
});

// POST /api/institutions  — criar instituição
router.post('/', auth, requirePro, requireInstitutionMode, async (req, res) => {
  const proId = req.user.professionalProfile.id;

  // Verifica limite
  const pro = await prisma.professionalProfile.findUnique({
    where: { id: proId },
    select: { institutionCount: true },
  });
  if ((pro?.institutionCount || 0) >= MAX_INSTITUTIONS) {
    return res.status(422).json({
      error: `Limite de ${MAX_INSTITUTIONS} instituições por conta atingido.`,
    });
  }

  const schema = z.object({
    name:        z.string().min(2, 'Nome obrigatório'),
    type:        z.string().min(2, 'Tipo obrigatório'),
    description: z.string().optional(),
    city:        z.string().min(2, 'Cidade obrigatória'),
    state:       z.string().length(2).optional(),
    address:     z.string().optional(),
    phone:       z.string().optional(),
    email:       z.string().email().optional().or(z.literal('')),
    website:     z.string().url().optional().or(z.literal('')),
    slotsTotal:  z.number().int().positive().optional(),
    emoji:       z.string().optional(),
    tags:        z.array(z.string()).optional(),
  });

  const { tags, ...data } = schema.parse(req.body);

  // Transação: cria instituição + vincula criador como ADMIN + incrementa contador
  const [institution] = await prisma.$transaction([
    prisma.institution.create({
      data: {
        ...data,
        createdById: proId,
        tags: tags?.length ? { create: tags.map(t => ({ tag: t })) } : undefined,
        members: {
          create: { professionalId: proId, role: 'ADMIN' },
        },
      },
      include: { tags: true, members: { include: { professional: { select: { id: true, user: { select: { name: true } } } } } } },
    }),
    prisma.professionalProfile.update({
      where: { id: proId },
      data: { institutionCount: { increment: 1 } },
    }),
  ]);

  res.status(201).json({ ...institution, slots: institution.slotsTotal });
});

// PATCH /api/institutions/:id  — editar instituição (admin only)
router.patch('/:id', auth, requirePro, requireInstitutionAdmin, async (req, res) => {
  const schema = z.object({
    name:        z.string().optional(),
    type:        z.string().optional(),
    description: z.string().optional(),
    city:        z.string().optional(),
    state:       z.string().length(2).optional(),
    address:     z.string().optional(),
    phone:       z.string().optional(),
    email:       z.string().email().optional().or(z.literal('')),
    website:     z.string().url().optional().or(z.literal('')),
    slotsTotal:  z.number().int().positive().optional(),
    emoji:       z.string().optional(),
    tags:        z.array(z.string()).optional(),
  });

  const { tags, ...data } = schema.parse(req.body);

  const updated = await prisma.institution.update({
    where: { id: req.params.id },
    data: {
      ...data,
      ...(tags && {
        tags: { deleteMany: {}, create: tags.map(t => ({ tag: t })) },
      }),
    },
    include: { tags: true },
  });

  res.json(updated);
});

// DELETE /api/institutions/:id  — excluir instituição (admin only)
router.delete('/:id', auth, requirePro, requireInstitutionAdmin, async (req, res) => {
  const inst = await prisma.institution.findUnique({ where: { id: req.params.id } });
  if (!inst) return res.status(404).json({ error: 'Instituição não encontrada.' });

  // Soft delete e decrementa contador do criador
  await prisma.$transaction([
    prisma.institution.update({
      where: { id: req.params.id },
      data:  { isActive: false },
    }),
    prisma.professionalProfile.update({
      where: { id: inst.createdById },
      data:  { institutionCount: { decrement: 1 } },
    }),
  ]);

  res.json({ ok: true, message: 'Instituição desativada com sucesso.' });
});

// ── Membros ───────────────────────────────────────────

// GET /api/institutions/:id/members  — lista membros
router.get('/:id/members', auth, requirePro, async (req, res) => {
  const members = await prisma.institutionMember.findMany({
    where: { institutionId: req.params.id },
    include: {
      professional: {
        select: {
          id: true, specialty: true, bio: true, experience: true,
          education: true, approaches: true,
          user: { select: { name: true, avatar: true, email: true } },
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });
  res.json(members);
});

// POST /api/institutions/:id/members  — vincular profissional (admin only)
router.post('/:id/members', auth, requirePro, requireInstitutionAdmin, async (req, res) => {
  const schema = z.object({
    professionalId: z.string().uuid('ID inválido'),
    role: z.enum(['ADMIN', 'MEMBER']).optional(),
  });
  const { professionalId, role } = schema.parse(req.body);

  // Verifica se profissional existe
  const pro = await prisma.professionalProfile.findUnique({ where: { id: professionalId } });
  if (!pro) return res.status(404).json({ error: 'Profissional não encontrado.' });

  // Verifica se já é membro
  const existing = await prisma.institutionMember.findUnique({
    where: { institutionId_professionalId: { institutionId: req.params.id, professionalId } },
  });
  if (existing) return res.status(409).json({ error: 'Profissional já é membro desta instituição.' });

  const member = await prisma.institutionMember.create({
    data: { institutionId: req.params.id, professionalId, role: role || 'MEMBER' },
    include: {
      professional: {
        select: { id: true, specialty: true, user: { select: { name: true, avatar: true } } },
      },
    },
  });

  res.status(201).json(member);
});

// DELETE /api/institutions/:id/members/:proId  — desvincular profissional (admin only)
router.delete('/:id/members/:proId', auth, requirePro, requireInstitutionAdmin, async (req, res) => {
  // Não permite remover o único admin
  const admins = await prisma.institutionMember.count({
    where: { institutionId: req.params.id, role: 'ADMIN' },
  });
  const target = await prisma.institutionMember.findUnique({
    where: { institutionId_professionalId: { institutionId: req.params.id, professionalId: req.params.proId } },
  });
  if (target?.role === 'ADMIN' && admins <= 1) {
    return res.status(422).json({ error: 'A instituição precisa de ao menos um administrador.' });
  }

  await prisma.institutionMember.delete({
    where: { institutionId_professionalId: { institutionId: req.params.id, professionalId: req.params.proId } },
  });

  res.json({ ok: true });
});

// PATCH /api/institutions/:id/members/:proId/role  — mudar papel (admin only)
router.patch('/:id/members/:proId/role', auth, requirePro, requireInstitutionAdmin, async (req, res) => {
  const { role } = z.object({ role: z.enum(['ADMIN', 'MEMBER']) }).parse(req.body);

  const updated = await prisma.institutionMember.update({
    where: { institutionId_professionalId: { institutionId: req.params.id, professionalId: req.params.proId } },
    data:  { role },
  });

  res.json(updated);
});

// ── Modo Instituição ──────────────────────────────────

// PATCH /api/institutions/mode/toggle  — ativar/desativar Modo Instituição
router.patch('/mode/toggle', auth, requirePro, async (req, res) => {
  const pro = await prisma.professionalProfile.findUnique({
    where: { userId: req.user.id },
    select: { institutionMode: true, institutionCount: true },
  });

  // Não permite desativar se tiver instituições ativas
  if (pro.institutionMode && pro.institutionCount > 0) {
    return res.status(422).json({
      error: 'Exclua ou transfira suas instituições antes de desativar o Modo Instituição.',
    });
  }

  const updated = await prisma.professionalProfile.update({
    where: { userId: req.user.id },
    data:  { institutionMode: !pro.institutionMode },
    select: { institutionMode: true, institutionCount: true },
  });

  res.json({ institutionMode: updated.institutionMode, institutionCount: updated.institutionCount });
});

module.exports = router;
