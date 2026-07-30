'use strict';

const express = require('express');
const prisma = require('../src/prisma');
const { requireAuth, getBranch } = require('../src/middleware/auth');
const { serializeLoan } = require('../src/serializers');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const branch = getBranch(req);
    const rows = await prisma.loan.findMany({ where: { branch } });
    res.json({ ok: true, data: rows.map(serializeLoan) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const branch = getBranch(req);
    const row = await prisma.loan.findUnique({
      where: { branch_id: { branch, id: req.params.id } },
    });
    if (!row) return res.status(404).json({ ok: false, error: 'Préstamo no encontrado' });
    res.json({ ok: true, data: serializeLoan(row) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    const body = req.body || {};
    if (!body.id || !body.itemId || !body.employeeId) {
      return res.status(400).json({ ok: false, error: 'id, itemId y employeeId son requeridos' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: { branch_id: { branch, id: body.itemId } },
      });
      if (!item || item.qty < 1) throw Object.assign(new Error('Sin stock disponible'), { status: 400 });

      const loan = await tx.loan.create({
        data: {
          id: body.id,
          branch,
          itemId: body.itemId,
          employeeId: body.employeeId,
          dateOut: body.dateOut || '',
          dateDue: body.dateDue || null,
          dateReturned: body.dateReturned || null,
          notes: body.notes || '',
        },
      });

      await tx.item.update({
        where: { branch_id: { branch, id: body.itemId } },
        data: { qty: item.qty - 1 },
      });

      if (body.movementId) {
        const emp = await tx.employee.findUnique({
          where: { branch_id: { branch, id: body.employeeId } },
        });
        await tx.movement.create({
          data: {
            id: body.movementId,
            branch,
            itemId: body.itemId,
            type: 'loan',
            qty: 1,
            date: body.dateOut || new Date().toISOString().split('T')[0],
            notes: body.movementNotes || `Préstamo a ${emp?.name || ''}`,
          },
        });
      }

      return loan;
    });

    res.status(201).json({ ok: true, data: serializeLoan(result) });
  } catch (e) {
    res.status(e.status || 500).json({ ok: false, error: e.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    const body = req.body || {};
    const existing = await prisma.loan.findUnique({
      where: { branch_id: { branch, id: req.params.id } },
    });
    if (!existing) return res.status(404).json({ ok: false, error: 'Préstamo no encontrado' });

    const returning = !existing.dateReturned && body.dateReturned;

    const row = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.update({
        where: { branch_id: { branch, id: req.params.id } },
        data: {
          ...(body.dateOut !== undefined && { dateOut: body.dateOut }),
          ...(body.dateDue !== undefined && { dateDue: body.dateDue }),
          ...(body.dateReturned !== undefined && { dateReturned: body.dateReturned }),
          ...(body.notes !== undefined && { notes: body.notes || '' }),
        },
      });

      if (returning) {
        const item = await tx.item.findUnique({
          where: { branch_id: { branch, id: existing.itemId } },
        });
        if (item) {
          await tx.item.update({
            where: { branch_id: { branch, id: existing.itemId } },
            data: { qty: item.qty + 1 },
          });
        }
        if (body.movementId) {
          await tx.movement.create({
            data: {
              id: body.movementId,
              branch,
              itemId: existing.itemId,
              type: 'ret',
              qty: 1,
              date: body.dateReturned,
              notes: body.movementNotes || 'Devolución de préstamo',
            },
          });
        }
      }

      return loan;
    });

    res.json({ ok: true, data: serializeLoan(row) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    await prisma.loan.delete({
      where: { branch_id: { branch, id: req.params.id } },
    });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'Préstamo no encontrado' });
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
