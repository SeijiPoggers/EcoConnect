// ── Middleware de autenticação ─────────────────────────
const jwt         = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Verifica o token JWT e anexa o usuário em req.user
async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acesso necessário.' });
  }

  try {
    const token   = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true, name: true, email: true, avatar: true,
        role: true, isActive: true,
        patientProfile:      { select: { id: true, xp: true, level: true, condition: true, professionalId: true } },
        professionalProfile: { select: { id: true, crp: true, specialty: true } },
      },
    });

    if (!user)          return res.status(401).json({ error: 'Usuário não encontrado.' });
    if (!user.isActive) return res.status(403).json({ error: 'Conta desativada.' });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

// Exige que o usuário seja profissional
function requirePro(req, res, next) {
  if (req.user?.role !== 'PROFESSIONAL') {
    return res.status(403).json({ error: 'Acesso restrito a profissionais.' });
  }
  next();
}

// Exige que o usuário seja paciente
function requirePatient(req, res, next) {
  if (req.user?.role !== 'PATIENT') {
    return res.status(403).json({ error: 'Acesso restrito a pacientes.' });
  }
  next();
}

module.exports = { auth, requirePro, requirePatient };
