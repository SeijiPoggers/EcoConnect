const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ── POST /api/auth/login ───────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email('E-mail inválido'),
      password: z.string().min(1, 'Senha obrigatória'),
      role: z.enum(['PATIENT', 'PROFESSIONAL'], { required_error: 'Role obrigatório' }),
    });

    const { email, password, role } = schema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { patientProfile: true, professionalProfile: true },
    });

    if (!user || user.role !== role) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Conta desativada. Entre em contato com o suporte.' });
    }

    const token = signToken(user.id);
    const { password: _, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/register ────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email('E-mail inválido'),
      password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
      name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
      condition: z.enum(['TEA', 'ADHD', 'DYSLEXIA', 'DYSPRAXIA', 'OTHER', 'UNSPECIFIED']).optional(),
      conditionDetail: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const avatar = data.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const password = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password,
        name: data.name,
        avatar,
        role: 'PATIENT',
        patientProfile: {
          create: {
            condition: data.condition || 'UNSPECIFIED',
            conditionDetail: data.conditionDetail,
            xp: 0,
            level: 1,
          },
        },
      },
      include: { patientProfile: true },
    });

    const token = signToken(user.id);
    const { password: _, ...safeUser } = user;

    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/me ───────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// ── POST /api/auth/logout ──────────────────────────────
router.post('/logout', authenticate, (req, res) => {
  // JWT is stateless; client deletes the token
  res.json({ message: 'Logout realizado com sucesso' });
});

module.exports = router;
