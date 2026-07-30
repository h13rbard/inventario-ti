'use strict';

const express = require('express');
const prisma = require('../src/prisma');
const { requireAuth, getBranch } = require('../src/middleware/auth');
const { serializeCategory } = require('../src/serializers');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const branch = getBranch(req);
    const rows = await prisma.category.findMany({ where: { branch }, orderBy: { name: 'asc' } });
    res.json({ ok: true, data: rows.map(serializeCategory) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const branch = getBranch(req);
    const row = await prisma.category.findUnique({
      where: { branch_id: { branch, id: req.params.id } },
    });
    if (!row) return res.status(404).json({ ok: false, error: 'Categoría no encontrada' });
    res.json({ ok: true, data: serializeCategory(row) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    const { id, name, icon, color } = req.body || {};
    if (!id || !name) return res.status(400).json({ ok: false, error: 'id y name son requeridos' });
    const row = await prisma.category.create({
      data: {
        id,
        branch,
        name,
        icon: icon || '📦',
        color: color || '#94a3b8',
      },
    });
    res.status(201).json({ ok: true, data: serializeCategory(row) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    const { name, icon, color } = req.body || {};
    const row = await prisma.category.update({
      where: { branch_id: { branch, id: req.params.id } },
      data: {
        ...(name !== undefined && { name }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
      },
    });
    res.json({ ok: true, data: serializeCategory(row) });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'Categoría no encontrada' });
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    await prisma.category.delete({
      where: { branch_id: { branch, id: req.params.id } },
    });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'Categoría no encontrada' });
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
