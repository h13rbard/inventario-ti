'use strict';

const express = require('express');
const prisma = require('../src/prisma');
const { requireAuth, getBranch } = require('../src/middleware/auth');

const router = express.Router();

function parseDate(value) {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function serializeMaintenance(row) {
  return {
    id: row.id,
    equipoId: row.equipoId,
    tipoEquipo: row.tipoEquipo,
    fecha: row.fecha ? row.fecha.toISOString() : null,
    tipo: row.tipo,
    descripcion: row.descripcion,
    tecnico: row.tecnico || '',
    costo: row.costo,
    proximaFch: row.proximaFch ? row.proximaFch.toISOString() : null,
  };
}

router.get('/', async (req, res) => {
  try {
    const branch = getBranch(req);
    const where = { branch };
    if (req.query.equipoId) where.equipoId = req.query.equipoId;
    if (req.query.tipoEquipo) where.tipoEquipo = req.query.tipoEquipo;

    const rows = await prisma.maintenance.findMany({
      where,
      orderBy: { fecha: 'desc' },
    });
    res.json({ ok: true, data: rows.map(serializeMaintenance) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await prisma.maintenance.findUnique({ where: { id: req.params.id } });
    if (!row || row.branch !== getBranch(req)) {
      return res.status(404).json({ ok: false, error: 'Mantenimiento no encontrado' });
    }
    res.json({ ok: true, data: serializeMaintenance(row) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    const body = req.body || {};
    const { equipoId, tipoEquipo, tipo, descripcion } = body;

    if (!equipoId || !tipoEquipo || !tipo || !descripcion) {
      return res.status(400).json({
        ok: false,
        error: 'equipoId, tipoEquipo, tipo y descripcion son requeridos',
      });
    }

    if (!['Computer', 'Item'].includes(tipoEquipo)) {
      return res.status(400).json({ ok: false, error: 'tipoEquipo debe ser Computer o Item' });
    }

    const fecha = parseDate(body.fecha) || new Date();
    const proximaFch = parseDate(body.proximaFch);

    const row = await prisma.maintenance.create({
      data: {
        branch,
        equipoId,
        tipoEquipo,
        fecha,
        tipo,
        descripcion,
        tecnico: body.tecnico || '',
        costo: body.costo != null && body.costo !== '' ? Number(body.costo) : null,
        proximaFch,
      },
    });

    res.status(201).json({ ok: true, data: serializeMaintenance(row) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
