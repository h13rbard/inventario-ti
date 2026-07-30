'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'CH4_INVENTARIO_SECURE_KEY_2024';

function signToken(username) {
  return jwt.sign({ user: username }, JWT_SECRET, { expiresIn: '12h' });
}

function verifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ ok: false, error: 'Acceso denegado o sesión expirada' });
  }
  req.user = payload.user;
  next();
}

function getBranch(req) {
  return req.query.branch || req.body?.branch || 'main';
}

module.exports = { signToken, verifyToken, requireAuth, getBranch, JWT_SECRET };
