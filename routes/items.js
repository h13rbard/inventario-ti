'use strict';

const express = require('express');
const prisma = require('../src/prisma');
const { requireAuth, getBranch } = require('../src/middleware/auth');
const { serializeItem } = require('../src/serializers');

const router = express.Router();

function itemData(body, branch) {
  return {
    id: body.id,
    branch,
    name: body.name || '',
    categoryId: body.categoryId,
    qty: Number(body.qty) || 0,
    minQty: Number(body.minQty) || 0,
    location: body.location || '',
    serial: body.serial || '',
    dateAdded: body.dateAdded || '',
    notes: body.notes || '',
    assignedTo: body.assignedTo ?? null,
  };
}

router.get('/', async (req, res) => {
  try {
    const branch = getBranch(req);
    const rows = await prisma.item.findMany({ where: { branch } });
    res.json({ ok: true, data: rows.map(serializeItem) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const branch = getBranch(req);
    const row = await prisma.item.findUnique({
      where: { branch_id: { branch, id: req.params.id } },
    });
    if (!row) return res.status(404).json({ ok: false, error: 'Ítem no encontrado' });
    res.json({ ok: true, data: serializeItem(row) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    const body = req.body || {};
    if (!body.id || !body.name || !body.categoryId) {
      return res.status(400).json({ ok: false, error: 'id, name y categoryId son requeridos' });
    }
    const row = await prisma.item.create({ data: itemData(body, branch) });
    res.status(201).json({ ok: true, data: serializeItem(row) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    const body = req.body || {};
    const row = await prisma.item.update({
      where: { branch_id: { branch, id: req.params.id } },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.qty !== undefined && { qty: Number(body.qty) || 0 }),
        ...(body.minQty !== undefined && { minQty: Number(body.minQty) || 0 }),
        ...(body.location !== undefined && { location: body.location || '' }),
        ...(body.serial !== undefined && { serial: body.serial || '' }),
        ...(body.dateAdded !== undefined && { dateAdded: body.dateAdded || '' }),
        ...(body.notes !== undefined && { notes: body.notes || '' }),
        ...(body.assignedTo !== undefined && { assignedTo: body.assignedTo }),
      },
    });
    res.json({ ok: true, data: serializeItem(row) });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'Ítem no encontrado' });
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    const id = req.params.id;
    await prisma.$transaction([
      prisma.loan.deleteMany({ where: { branch, itemId: id } }),
      prisma.movement.deleteMany({ where: { branch, itemId: id } }),
      prisma.item.delete({ where: { branch_id: { branch, id } } }),
    ]);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'Ítem no encontrado' });
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
