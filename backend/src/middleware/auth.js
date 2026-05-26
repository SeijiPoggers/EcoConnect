const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ── Verify JWT token ───────────────────────────────────
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true, email: true, name: true, avatar: true,
        role: true, isActive: true,
        patientProfile: true,
        professionalProfile: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

// ── Require PROFESSIONAL role ──────────────────────────
function requireProfessional(req, res, next) {
  if (req.user?.role !== 'PROFESSIONAL') {
    return res.status(403).json({ error: 'Acesso restrito a profissionais' });
  }
  next();
}

// ── Require PATIENT role ───────────────────────────────
function requirePatient(req, res, next) {
  if (req.user?.role !== 'PATIENT') {
    return res.status(403).json({ error: 'Acesso restrito a pacientes' });
  }
  next();
}

module.exports = { authenticate, requireProfessional, requirePatient };
