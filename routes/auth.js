'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../src/prisma');
const { signToken } = require('../src/middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { user, pass } = req.body || {};
    if (!user || !pass) {
      return res.status(400).json({ ok: false, error: 'Credenciales incompletas' });
    }

    const dbUser = await prisma.user.findUnique({ where: { username: user } });
    if (!dbUser) {
      return res.status(401).json({ ok: false, error: 'Usuario o contraseña incorrectos' });
    }

    const valid = await bcrypt.compare(pass, dbUser.passwordHash);
    if (!valid) {
      return res.status(401).json({ ok: false, error: 'Usuario o contraseña incorrectos' });
    }

    const token = signToken(dbUser.username);
    res.json({ ok: true, token, user: dbUser.username });
  } catch (e) {
    console.error('Login error:', e.message);
    res.status(500).json({ ok: false, error: 'Error interno de autenticación' });
  }
});

module.exports = router;
