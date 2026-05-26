function errorHandler(err, req, res, next) {
  console.error(`[Error] ${err.message}`);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Registro duplicado. Verifique os dados.' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro não encontrado.' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token inválido.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Dados inválidos.',
      details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? 'Erro interno do servidor.' : err.message,
  });
}

function notFound(req, res) {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
