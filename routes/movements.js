'use strict';

const express = require('express');
const prisma = require('../src/prisma');
const { requireAuth, getBranch } = require('../src/middleware/auth');
const { serializeMovement } = require('../src/serializers');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const branch = getBranch(req);
    const rows = await prisma.movement.findMany({ where: { branch }, orderBy: { date: 'desc' } });
    res.json({ ok: true, data: rows.map(serializeMovement) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const branch = getBranch(req);
    const row = await prisma.movement.findUnique({
      where: { branch_id: { branch, id: req.params.id } },
    });
    if (!row) return res.status(404).json({ ok: false, error: 'Movimiento no encontrado' });
    res.json({ ok: true, data: serializeMovement(row) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    const body = req.body || {};
    if (!body.id || !body.itemId || !body.type) {
      return res.status(400).json({ ok: false, error: 'id, itemId y type son requeridos' });
    }
    const qty = Number(body.qty) || 0;
    if (qty < 1) return res.status(400).json({ ok: false, error: 'Cantidad inválida' });

    const row = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: { branch_id: { branch, id: body.itemId } },
      });
      if (!item) throw Object.assign(new Error('Ítem no encontrado'), { status: 404 });

      if ((body.type === 'out' || body.type === 'loan') && item.qty < qty) {
        throw Object.assign(new Error(`Stock insuficiente (disponible: ${item.qty})`), { status: 400 });
      }

      let nextQty = item.qty;
      if (body.type === 'in' || body.type === 'ret') nextQty += qty;
      else if (body.type === 'out' || body.type === 'loan') nextQty -= qty;

      if (body.updateStock !== false) {
        await tx.item.update({
          where: { branch_id: { branch, id: body.itemId } },
          data: { qty: nextQty },
        });
      }

      return tx.movement.create({
        data: {
          id: body.id,
          branch,
          itemId: body.itemId,
          type: body.type,
          qty,
          date: body.date || '',
          notes: body.notes || '',
        },
      });
    });

    res.status(201).json({ ok: true, data: serializeMovement(row) });
  } catch (e) {
    res.status(e.status || 500).json({ ok: false, error: e.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    const body = req.body || {};
    const row = await prisma.movement.update({
      where: { branch_id: { branch, id: req.params.id } },
      data: {
        ...(body.type !== undefined && { type: body.type }),
        ...(body.qty !== undefined && { qty: Number(body.qty) || 0 }),
        ...(body.date !== undefined && { date: body.date || '' }),
        ...(body.notes !== undefined && { notes: body.notes || '' }),
        ...(body.itemId !== undefined && { itemId: body.itemId }),
      },
    });
    res.json({ ok: true, data: serializeMovement(row) });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'Movimiento no encontrado' });
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    await prisma.movement.delete({
      where: { branch_id: { branch, id: req.params.id } },
    });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'Movimiento no encontrado' });
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
