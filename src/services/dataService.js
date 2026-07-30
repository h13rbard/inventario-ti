'use strict';

const prisma = require('../prisma');
const {
  serializeCategory,
  serializeItem,
  serializeEmployee,
  serializeLoan,
  serializeMovement,
  serializeComputer,
  serializeRecurso,
} = require('../serializers');

async function loadBranchData(branch) {
  const [categories, items, employees, loans, movements, computers, recursosRows] = await Promise.all([
    prisma.category.findMany({ where: { branch }, orderBy: { name: 'asc' } }),
    prisma.item.findMany({ where: { branch } }),
    prisma.employee.findMany({ where: { branch }, orderBy: { name: 'asc' } }),
    prisma.loan.findMany({ where: { branch } }),
    prisma.movement.findMany({ where: { branch }, orderBy: { date: 'desc' } }),
    prisma.computer.findMany({ where: { branch } }),
    prisma.recurso.findMany({ where: { branch } }),
  ]);

  const recursos = {};
  for (const row of recursosRows) {
    if (!recursos[row.type]) recursos[row.type] = [];
    recursos[row.type].push(serializeRecurso(row));
  }

  return {
    categories: categories.map(serializeCategory),
    items: items.map(serializeItem),
    employees: employees.map(serializeEmployee),
    loans: loans.map(serializeLoan),
    movements: movements.map(serializeMovement),
    computers: computers.map(serializeComputer),
    recursos,
  };
}

async function replaceBranchData(branch, data) {
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const items = Array.isArray(data.items) ? data.items : [];
  const employees = Array.isArray(data.employees) ? data.employees : [];
  const loans = Array.isArray(data.loans) ? data.loans : [];
  const movements = Array.isArray(data.movements) ? data.movements : [];
  const computers = Array.isArray(data.computers) ? data.computers : [];
  const recursosObj = data.recursos && typeof data.recursos === 'object' ? data.recursos : {};

  await prisma.$transaction(async (tx) => {
    await tx.loan.deleteMany({ where: { branch } });
    await tx.movement.deleteMany({ where: { branch } });
    await tx.item.deleteMany({ where: { branch } });
    await tx.employee.deleteMany({ where: { branch } });
    await tx.category.deleteMany({ where: { branch } });
    await tx.computer.deleteMany({ where: { branch } });
    await tx.recurso.deleteMany({ where: { branch } });

    if (categories.length) {
      await tx.category.createMany({
        data: categories.map((c) => ({
          id: c.id,
          branch,
          name: c.name || '',
          icon: c.icon || '📦',
          color: c.color || '#94a3b8',
        })),
      });
    }

    if (employees.length) {
      await tx.employee.createMany({
        data: employees.map((e) => ({
          id: e.id,
          branch,
          name: e.name || '',
          area: e.area || '',
          email: e.email || '',
        })),
      });
    }

    if (items.length) {
      await tx.item.createMany({
        data: items.map((i) => ({
          id: i.id,
          branch,
          name: i.name || '',
          categoryId: i.categoryId,
          qty: Number(i.qty) || 0,
          minQty: Number(i.minQty) || 0,
          location: i.location || '',
          serial: i.serial || '',
          dateAdded: i.dateAdded || '',
          notes: i.notes || '',
          assignedTo: i.assignedTo ?? null,
        })),
      });
    }

    if (loans.length) {
      await tx.loan.createMany({
        data: loans.map((l) => ({
          id: l.id,
          branch,
          itemId: l.itemId,
          employeeId: l.employeeId,
          dateOut: l.dateOut || '',
          dateDue: l.dateDue || null,
          dateReturned: l.dateReturned || null,
          notes: l.notes || '',
        })),
      });
    }

    if (movements.length) {
      await tx.movement.createMany({
        data: movements.map((m) => ({
          id: m.id,
          branch,
          itemId: m.itemId,
          type: m.type || 'in',
          qty: Number(m.qty) || 0,
          date: m.date || '',
          notes: m.notes || '',
        })),
      });
    }

    if (computers.length) {
      await tx.computer.createMany({
        data: computers.map((c) => ({
          id: c.id,
          branch,
          idNum: c.idNum || '',
          tipo: c.tipo || 'Laptop',
          marca: c.marca || '',
          modelo: c.modelo || '',
          serie: c.serie || '',
          hostname: c.hostname || '',
          ram: c.ram || '',
          rom: c.rom || '',
          so: c.so || '',
          asignado: c.asignado || '',
          puesto: c.puesto || '',
          departamento: c.departamento || '',
          ubicacion: c.ubicacion || '',
          fechaCompra: c.fechaCompra || '',
          garantia: c.garantia || '',
          factura: c.factura || '',
          monitor: c.monitor || '',
          serieMonitor: c.serieMonitor || '',
          garantiaMonitor: c.garantiaMonitor || '',
          estado: c.estado || 'ACTIVO',
          verificado: c.verificado || '',
          comentarios: c.comentarios || '',
          assignmentHistory: c.assignmentHistory || [],
        })),
      });
    }

    const recursoRows = [];
    for (const [type, list] of Object.entries(recursosObj)) {
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        const { id, ...fields } = item;
        if (!id) continue;
        recursoRows.push({ id, branch, type, data: fields });
      }
    }
    if (recursoRows.length) {
      await tx.recurso.createMany({ data: recursoRows });
    }
  });
}

module.exports = { loadBranchData, replaceBranchData };
