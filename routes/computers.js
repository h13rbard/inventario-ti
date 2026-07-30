'use strict';

const express = require('express');
const prisma = require('../src/prisma');
const { requireAuth, getBranch } = require('../src/middleware/auth');
const { serializeComputer } = require('../src/serializers');

const router = express.Router();

function computerCreateData(body, branch) {
  return {
    id: body.id,
    branch,
    idNum: body.idNum || '',
    tipo: body.tipo || 'Laptop',
    marca: body.marca || '',
    modelo: body.modelo || '',
    serie: body.serie || '',
    hostname: body.hostname || '',
    ram: body.ram || '',
    rom: body.rom || '',
    so: body.so || '',
    asignado: body.asignado || '',
    puesto: body.puesto || '',
    departamento: body.departamento || '',
    ubicacion: body.ubicacion || '',
    fechaCompra: body.fechaCompra || '',
    garantia: body.garantia || '',
    factura: body.factura || '',
    monitor: body.monitor || '',
    serieMonitor: body.serieMonitor || '',
    garantiaMonitor: body.garantiaMonitor || '',
    estado: body.estado || 'ACTIVO',
    verificado: body.verificado || '',
    comentarios: body.comentarios || '',
    assignmentHistory: body.assignmentHistory || [],
  };
}

router.get('/', async (req, res) => {
  try {
    const branch = getBranch(req);
    const rows = await prisma.computer.findMany({ where: { branch } });
    res.json({ ok: true, data: rows.map(serializeComputer) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const branch = getBranch(req);
    const row = await prisma.computer.findUnique({
      where: { branch_id: { branch, id: req.params.id } },
    });
    if (!row) return res.status(404).json({ ok: false, error: 'Equipo no encontrado' });
    res.json({ ok: true, data: serializeComputer(row) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    const body = req.body || {};
    if (!body.id || !body.serie) {
      return res.status(400).json({ ok: false, error: 'id y serie son requeridos' });
    }
    const row = await prisma.computer.create({ data: computerCreateData(body, branch) });
    res.status(201).json({ ok: true, data: serializeComputer(row) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    const body = req.body || {};
    const existing = await prisma.computer.findUnique({
      where: { branch_id: { branch, id: req.params.id } },
    });
    if (!existing) return res.status(404).json({ ok: false, error: 'Equipo no encontrado' });

    const history = Array.isArray(existing.assignmentHistory) ? [...existing.assignmentHistory] : [];
    const nextAsignado = body.asignado !== undefined ? body.asignado : existing.asignado;
    const nextPuesto = body.puesto !== undefined ? body.puesto : existing.puesto;
    if (
      body.trackAssignment !== false &&
      (existing.asignado !== nextAsignado || existing.puesto !== nextPuesto)
    ) {
      history.push({
        fecha: new Date().toISOString(),
        de: existing.asignado || '—',
        puestoDe: existing.puesto || '—',
        a: nextAsignado || '—',
        puestoA: nextPuesto || '—',
      });
    }

    const fields = [
      'idNum', 'tipo', 'marca', 'modelo', 'serie', 'hostname', 'ram', 'rom', 'so',
      'asignado', 'puesto', 'departamento', 'ubicacion', 'fechaCompra', 'garantia',
      'factura', 'monitor', 'serieMonitor', 'garantiaMonitor', 'estado', 'verificado', 'comentarios',
    ];
    const data = {};
    for (const f of fields) {
      if (body[f] !== undefined) data[f] = body[f] ?? '';
    }
    if (body.assignmentHistory !== undefined) {
      data.assignmentHistory = body.assignmentHistory;
    } else {
      data.assignmentHistory = history;
    }

    const row = await prisma.computer.update({
      where: { branch_id: { branch, id: req.params.id } },
      data,
    });
    res.json({ ok: true, data: serializeComputer(row) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const branch = getBranch(req);
    await prisma.computer.delete({
      where: { branch_id: { branch, id: req.params.id } },
    });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'Equipo no encontrado' });
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
