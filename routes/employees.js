'use strict';

const express = require('express');
const prisma = require('../src/prisma');
const { requireAuth, getBranch } = require('../src/middleware/auth');
const { serializeEmployee } = require('../src/serializers');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const branch = getBranch(req);
    const rows = await prisma.employee.findMany({ where: { branch }, orderBy: { name: 'asc' } });
    res.json({ ok: true, data: rows.map(serializeEmployee) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const branch = getBranch(req);
    const row = await prisma.employee.findUnique({
      where: { branch_id: { branch, id: req.params.id } },
    });
    if (!row) return res.status(404).json({ ok: false, error: 'Empleado no encontrado' });
    res.json({ ok: true, data: serializeEmployee(row) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    const { id, name, area, email } = req.body || {};
    if (!id || !name) return res.status(400).json({ ok: false, error: 'id y name son requeridos' });
    const row = await prisma.employee.create({
      data: { id, branch, name, area: area || '', email: email || '' },
    });
    res.status(201).json({ ok: true, data: serializeEmployee(row) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    const { name, area, email } = req.body || {};
    const row = await prisma.employee.update({
      where: { branch_id: { branch, id: req.params.id } },
      data: {
        ...(name !== undefined && { name }),
        ...(area !== undefined && { area: area || '' }),
        ...(email !== undefined && { email: email || '' }),
      },
    });
    res.json({ ok: true, data: serializeEmployee(row) });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'Empleado no encontrado' });
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    const active = await prisma.loan.count({
      where: { branch, employeeId: req.params.id, dateReturned: null },
    });
    if (active > 0) {
      return res.status(400).json({ ok: false, error: 'Empleado tiene préstamos activos' });
    }
    await prisma.employee.delete({
      where: { branch_id: { branch, id: req.params.id } },
    });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'Empleado no encontrado' });
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
