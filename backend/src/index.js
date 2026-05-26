// ─────────────────────────────────────────────────────────
// EcoConnect — Express API Server
// ─────────────────────────────────────────────────────────

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const professionalRoutes = require('./routes/professionals');
const organizationRoutes = require('./routes/organizations');
const appointmentRoutes = require('./routes/appointments');
const objectiveRoutes = require('./routes/objectives');
const logRoutes = require('./routes/logs');
const contactRoutes = require('./routes/contact');

const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security middleware ────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Rate limiting ──────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Please try again later.' },
});

app.use(limiter);

// ── Logging & parsing ──────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EcoConnect API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ── API Routes ─────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/objectives', objectiveRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/contact', contactRoutes);

// ── Error handlers ─────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start server ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌿 EcoConnect API running`);
  console.log(`   Port:        ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Health:      http://localhost:${PORT}/health\n`);
});

module.exports = app;
