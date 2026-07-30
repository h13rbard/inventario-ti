'use strict';

const express = require('express');
const prisma = require('../src/prisma');
const { requireAuth, getBranch } = require('../src/middleware/auth');
const { serializeRecurso } = require('../src/serializers');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const branch = getBranch(req);
    const type = req.query.type;
    const where = type ? { branch, type } : { branch };
    const rows = await prisma.recurso.findMany({ where });
    if (type) {
      return res.json({ ok: true, data: rows.map(serializeRecurso) });
    }
    const recursos = {};
    for (const row of rows) {
      if (!recursos[row.type]) recursos[row.type] = [];
      recursos[row.type].push(serializeRecurso(row));
    }
    res.json({ ok: true, data: recursos });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/:type/:id', async (req, res) => {
  try {
    const branch = getBranch(req);
    const row = await prisma.recurso.findUnique({
      where: {
        branch_type_id: { branch, type: req.params.type, id: req.params.id },
      },
    });
    if (!row) return res.status(404).json({ ok: false, error: 'Recurso no encontrado' });
    res.json({ ok: true, data: serializeRecurso(row) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/:type', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    const type = req.params.type;
    const body = req.body || {};
    const { id, ...fields } = body;
    if (!id) return res.status(400).json({ ok: false, error: 'id es requerido' });
    const row = await prisma.recurso.create({
      data: { id, branch, type, data: fields },
    });
    res.status(201).json({ ok: true, data: serializeRecurso(row) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.put('/:type/:id', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    const { id: _ignore, ...fields } = req.body || {};
    const row = await prisma.recurso.update({
      where: {
        branch_type_id: { branch, type: req.params.type, id: req.params.id },
      },
      data: { data: fields },
    });
    res.json({ ok: true, data: serializeRecurso(row) });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'Recurso no encontrado' });
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.delete('/:type/:id', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    await prisma.recurso.delete({
      where: {
        branch_type_id: { branch, type: req.params.type, id: req.params.id },
      },
    });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'Recurso no encontrado' });
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
