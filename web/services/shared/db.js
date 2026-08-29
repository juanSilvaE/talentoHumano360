// ─── Shared DB Pool + JWT Middleware ─────────────────────────────────────────
// Usado por todos los microservicios. Copiar en cada servicio o como shared lib.
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

function createPool() {
  return new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME     || 'talento360',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || 'admin123',
  });
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token de autenticación requerido.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'talento360_secret_2026');
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

function canEdit(role) {
  if (!role) return false;
  const r = role.toLowerCase();
  return r.includes('administrador') || r.includes('coordinador');
}

module.exports = { createPool, authMiddleware, canEdit };
