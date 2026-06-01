// ═══════════════════════════════════════════════════════
//  EcoConnect API v3 — Servidor de Produção
// ═══════════════════════════════════════════════════════
'use strict';

require('dotenv').config();
require('express-async-errors');

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

// Validate required env vars on startup
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`❌ Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}`);
  console.error('   Copie .env.example para .env e configure os valores.');
  process.exit(1);
}

const authRoutes        = require('./routes/auth');
const userRoutes        = require('./routes/users');
const institutionRoutes = require('./routes/institutions');
const aptRoutes         = require('./routes/appointments');
const objRoutes         = require('./routes/objectives');
const logRoutes         = require('./routes/logs');
const contactRoutes     = require('./routes/contact');

const app  = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;
const isProd = process.env.NODE_ENV === 'production';

// ── Trust proxy (Render, Railway, Heroku) ─────────────
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: isProd ? undefined : false,
}));

// ── CORS ─────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin) || !isProd) return cb(null, true);
    cb(new Error(`Origem não permitida por CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ─────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || (isProd ? 100 : 1000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
  skip: (req) => req.path === '/health',
});
app.use(limiter);

// Stricter limit on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Body parsing ──────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ── Logging ───────────────────────────────────────────
if (!isProd) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Health check ──────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'EcoConnect API v3',
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
    version: '3.0.0',
  });
});

// ── API Routes ────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/appointments', aptRoutes);
app.use('/api/objectives',   objRoutes);
app.use('/api/logs',         logRoutes);
app.use('/api/contact',      contactRoutes);

// ── 404 ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.path}` });
});

// ── Global error handler ──────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (!isProd) {
    console.error(`\n❌ [${new Date().toISOString()}] ${err.message}`);
    if (err.stack) console.error(err.stack);
  } else {
    // In production, log only non-user errors
    if (!err.statusCode || err.statusCode >= 500) {
      console.error(`[ERROR] ${new Date().toISOString()} ${req.method} ${req.path}:`, err.message);
    }
  }

  // Prisma errors
  if (err.code === 'P2002') return res.status(409).json({ error: 'Este registro já existe.' });
  if (err.code === 'P2025') return res.status(404).json({ error: 'Registro não encontrado.' });
  if (err.code === 'P2003') return res.status(409).json({ error: 'Operação viola restrição de integridade.' });

  // JWT errors
  if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Token de acesso inválido.' });
  if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Dados inválidos.',
      fields: err.errors.map(e => ({ campo: e.path.join('.'), mensagem: e.message })),
    });
  }

  // CORS error
  if (err.message?.includes('CORS')) return res.status(403).json({ error: err.message });

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: status === 500
      ? 'Erro interno do servidor. Tente novamente em instantes.'
      : (err.message || 'Erro desconhecido'),
  });
});

// ── Graceful shutdown ─────────────────────────────────
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

process.on('SIGTERM', async () => {
  console.log('⚡ SIGTERM recebido. Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// ── Start ─────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🌿 EcoConnect API v3
   Porta:     ${PORT}
   Ambiente:  ${process.env.NODE_ENV || 'development'}
   Health:    http://localhost:${PORT}/health
   CORS:      ${allowedOrigins.join(', ')}
  `);
});

module.exports = app;
