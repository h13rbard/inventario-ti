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

function serializeBaja(row) {
  return {
    id: row.id,
    equipoId: row.equipoId,
    tipoEquipo: row.tipoEquipo,
    fecha: row.fecha ? row.fecha.toISOString() : null,
    motivo: row.motivo,
    autorizadoPor: row.autorizadoPor || '',
    destinoFinal: row.destinoFinal,
    formatoUrl: row.formatoUrl || '',
    notas: row.notas || '',
  };
}

router.get('/', async (req, res) => {
  try {
    const branch = getBranch(req);
    const where = { branch };
    if (req.query.equipoId) where.equipoId = req.query.equipoId;
    if (req.query.tipoEquipo) where.tipoEquipo = req.query.tipoEquipo;

    const rows = await prisma.baja.findMany({
      where,
      orderBy: { fecha: 'desc' },
    });
    res.json({ ok: true, data: rows.map(serializeBaja) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await prisma.baja.findUnique({ where: { id: req.params.id } });
    if (!row || row.branch !== getBranch(req)) {
      return res.status(404).json({ ok: false, error: 'Baja no encontrada' });
    }
    res.json({ ok: true, data: serializeBaja(row) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    const body = req.body || {};
    const { equipoId, tipoEquipo, motivo, destinoFinal } = body;

    if (!equipoId || !tipoEquipo || !motivo || !destinoFinal) {
      return res.status(400).json({
        ok: false,
        error: 'equipoId, tipoEquipo, motivo y destinoFinal son requeridos',
      });
    }

    if (!['Computer', 'Item'].includes(tipoEquipo)) {
      return res.status(400).json({ ok: false, error: 'tipoEquipo debe ser Computer o Item' });
    }

    const fecha = parseDate(body.fecha) || new Date();

    const result = await prisma.$transaction(async (tx) => {
      if (tipoEquipo === 'Computer') {
        const comp = await tx.computer.findUnique({
          where: { branch_id: { branch, id: equipoId } },
        });
        if (!comp) throw Object.assign(new Error('Equipo de cómputo no encontrado'), { status: 404 });
        await tx.computer.update({
          where: { branch_id: { branch, id: equipoId } },
          data: { estado: 'BAJA' },
        });
      } else if (tipoEquipo === 'Item') {
        const item = await tx.item.findUnique({
          where: { branch_id: { branch, id: equipoId } },
        });
        if (!item) throw Object.assign(new Error('Ítem no encontrado'), { status: 404 });
        // Item no tiene campo estado; se registra la baja y se deja stock en 0
        await tx.item.update({
          where: { branch_id: { branch, id: equipoId } },
          data: { qty: 0, notes: [item.notes, `[BAJA] ${motivo}`].filter(Boolean).join(' · ') },
        });
      }

      return tx.baja.create({
        data: {
          branch,
          equipoId,
          tipoEquipo,
          fecha,
          motivo,
          autorizadoPor: body.autorizadoPor || '',
          destinoFinal,
          formatoUrl: body.formatoUrl || '',
          notas: body.notas || '',
        },
      });
    });

    res.status(201).json({ ok: true, data: serializeBaja(result) });
  } catch (e) {
    res.status(e.status || 500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
