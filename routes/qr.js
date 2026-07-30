'use strict';

const express = require('express');
const prisma = require('../src/prisma');
const { getBranch } = require('../src/middleware/auth');
const { serializeComputer, serializeItem, serializeCategory, serializeRecurso } = require('../src/serializers');

const router = express.Router();

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

router.get('/equipo/:id', async (req, res) => {
  try {
    const branch = getBranch(req);
    const row = await prisma.computer.findUnique({
      where: { branch_id: { branch, id: req.params.id } },
    });
    if (!row) {
      return res.status(404).send('<h2 style="font-family:sans-serif;padding:2rem">Equipo no encontrado</h2>');
    }
    const comp = serializeComputer(row);

    const rowHtml = (icon, label, val) =>
      val && val !== '-' && val !== 'N/A' && val !== 'NA'
        ? `<div class="row"><div class="lbl">${icon} ${label}</div><div class="val">${esc(val)}</div></div>`
        : '';

    const statusCls = { ACTIVO: 'green', BAJA: 'red', PERDIDO: 'orange', ROBADA: 'red' };
    const stCls = statusCls[comp.estado] || 'gray';

    res.send(`<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(comp.hostname || comp.serie)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,-apple-system,Arial,sans-serif;background:#0d1117;color:#e6edf3;min-height:100vh;padding:16px;display:flex;align-items:flex-start;justify-content:center}
  .card{background:#161b22;border:1px solid #30363d;border-radius:16px;padding:20px;max-width:400px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.6);margin:12px 0}
  .header{display:flex;align-items:center;gap:14px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid #30363d}
  .icon{font-size:2.2rem;line-height:1}
  .meta{flex:1}
  .hostname{font-size:1.1rem;font-weight:800;letter-spacing:.5px}
  .brand{font-size:.82rem;color:#7d8590;margin-top:3px}
  .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:.72rem;font-weight:700;margin-top:6px;
         background:${stCls === 'green' ? '#1a3a1a' : stCls === 'red' ? '#3a1a1a' : '#3a2a0a'};
         color:${stCls === 'green' ? '#3fb950' : stCls === 'red' ? '#f85149' : '#d29922'};
         border:1px solid ${stCls === 'green' ? '#238636' : stCls === 'red' ? '#da3633' : '#9e6a03'}}
  .row{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid #21262d;align-items:flex-start}
  .row:last-child{border-bottom:none}
  .lbl{font-size:.72rem;color:#7d8590;min-width:100px;padding-top:1px}
  .val{font-size:.83rem;word-break:break-word}
  .section{margin-top:14px;padding-top:14px;border-top:1px solid #30363d;font-size:.7rem;color:#7d8590;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
  .footer{text-align:center;font-size:.68rem;color:#484f58;margin-top:16px;padding-top:12px;border-top:1px solid #21262d}
</style></head><body><div class="card">
  <div class="header">
    <div class="icon">🖥️</div>
    <div class="meta">
      <div class="hostname">${esc(comp.hostname || comp.serie)}</div>
      <div class="brand">${esc(comp.marca || '')} ${esc(comp.modelo || '')}</div>
      <div><span class="badge">${esc(comp.estado || 'ACTIVO')}</span></div>
    </div>
  </div>

  <div class="section">Identificación</div>
  ${rowHtml('🔢', 'Serie', comp.serie)}
  ${rowHtml('🏷️', 'Tipo', comp.tipo)}
  ${rowHtml('✅', 'Verificado', comp.verificado)}

  <div class="section">Hardware</div>
  ${rowHtml('🧠', 'RAM', comp.ram)}
  ${rowHtml('💾', 'Almacenamiento', comp.rom)}
  ${rowHtml('🖥️', 'Sistema Op.', comp.so)}

  <div class="section">Asignación</div>
  ${rowHtml('👤', 'Asignado a', comp.asignado)}
  ${rowHtml('💼', 'Puesto', comp.puesto)}
  ${rowHtml('🏢', 'Departamento', comp.departamento)}
  ${rowHtml('📍', 'Ubicación', comp.ubicacion)}

  <div class="section">Compra y Garantía</div>
  ${rowHtml('📅', 'Fecha compra', comp.fechaCompra)}
  ${rowHtml('🛡️', 'Garantía', comp.garantia)}
  ${rowHtml('📄', 'Factura', comp.factura)}

  ${comp.monitor ? `<div class="section">Monitor</div>
  ${rowHtml('🖥️', 'Monitor', comp.monitor)}
  ${rowHtml('🔢', 'N/S Monitor', comp.serieMonitor)}
  ${rowHtml('🛡️', 'Garantía', comp.garantiaMonitor)}` : ''}

  ${comp.comentarios ? `<div class="section">Comentarios</div>
  <div class="row"><div class="val" style="font-size:.8rem;font-style:italic;color:#c9d1d9">${esc(comp.comentarios)}</div></div>` : ''}

  <div class="footer">TI Inventario · Sistema de Gestión</div>
</div></body></html>`);
  } catch (e) {
    console.error('GET /equipo:', e.message);
    res.status(500).send('Error del servidor');
  }
});

router.get('/item/:id', async (req, res) => {
  try {
    const branch = getBranch(req);
    const row = await prisma.item.findUnique({
      where: { branch_id: { branch, id: req.params.id } },
    });
    if (!row) {
      return res.status(404).send('<h2 style="font-family:sans-serif;padding:2rem">Ítem no encontrado</h2>');
    }
    const item = serializeItem(row);
    let cat = null;
    if (item.categoryId) {
      const catRow = await prisma.category.findUnique({
        where: { branch_id: { branch, id: item.categoryId } },
      });
      cat = catRow ? serializeCategory(catRow) : null;
    }

    const rowHtml = (icon, label, val) =>
      val !== undefined && val !== null && val !== ''
        ? `<div class="row"><div class="lbl">${icon} ${label}</div><div class="val">${esc(String(val))}</div></div>`
        : '';

    res.send(`<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(item.name)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,-apple-system,Arial,sans-serif;background:#0d1117;color:#e6edf3;min-height:100vh;padding:16px;display:flex;align-items:flex-start;justify-content:center}
  .card{background:#161b22;border:1px solid #30363d;border-radius:16px;padding:20px;max-width:400px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.6);margin:12px 0}
  .header{margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid #30363d}
  .icon{font-size:2rem;margin-bottom:6px}
  .name{font-size:1.15rem;font-weight:800}
  .cat{font-size:.8rem;margin-top:4px;padding:2px 8px;border-radius:12px;display:inline-block;background:#161b22;border:1px solid #30363d}
  .row{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid #21262d;align-items:flex-start}
  .row:last-child{border-bottom:none}
  .lbl{font-size:.72rem;color:#7d8590;min-width:90px}
  .val{font-size:.83rem}
  .stock{font-size:1.6rem;font-weight:800;color:${(item.qty || 0) > (item.minQty || 0) ? '#3fb950' : '#f85149'}}
  .footer{text-align:center;font-size:.68rem;color:#484f58;margin-top:16px;padding-top:12px;border-top:1px solid #21262d}
</style></head><body><div class="card">
  <div class="header">
    <div class="icon">${esc(cat?.icon || '📦')}</div>
    <div class="name">${esc(item.name)}</div>
    ${cat ? `<span class="cat">${esc(cat.name)}</span>` : ''}
  </div>
  <div class="row"><div class="lbl">📦 Stock</div><div class="stock">${item.qty ?? 0}</div></div>
  ${rowHtml('📍', 'Ubicación', item.location)}
  ${rowHtml('🔢', 'N/S', item.serial)}
  ${rowHtml('📅', 'Alta', item.dateAdded)}
  ${item.notes ? `<div class="row"><div class="lbl">📝 Notas</div><div class="val" style="font-style:italic">${esc(item.notes)}</div></div>` : ''}
  <div class="footer">TI Inventario · Sistema de Gestión</div>
</div></body></html>`);
  } catch (e) {
    console.error('GET /item:', e.message);
    res.status(500).send('Error del servidor');
  }
});

router.get('/recurso/:type/:id', async (req, res) => {
  try {
    const branch = getBranch(req);
    const row = await prisma.recurso.findUnique({
      where: {
        branch_type_id: { branch, type: req.params.type, id: req.params.id },
      },
    });
    if (!row) {
      return res.status(404).send('<h2 style="font-family:sans-serif;padding:2rem">Recurso no encontrado</h2>');
    }
    const item = serializeRecurso(row);
    const type = req.params.type;
    const nameStr = item.nombre || item.id;
    const icons = { impresoras: '🖨️', camaras: '📹', licencias: '🔑', wifi: '📶', telefonos: '📱' };
    const icon = icons[type] || '⚙️';

    let fieldsHtml = '';
    for (const [k, v] of Object.entries(item)) {
      if (k === 'id' || k === 'nombre' || v === '' || v === null || v === undefined) continue;
      const lbl = k.charAt(0).toUpperCase() + k.slice(1);
      fieldsHtml += `<div class="row"><div class="lbl">📍 ${esc(lbl)}</div><div class="val"><strong>${esc(String(v))}</strong></div></div>`;
    }

    res.send(`<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(nameStr)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,-apple-system,Arial,sans-serif;background:#0d1117;color:#e6edf3;min-height:100vh;padding:16px;display:flex;align-items:flex-start;justify-content:center}
  .card{background:#161b22;border:1px solid #30363d;border-radius:16px;padding:20px;max-width:400px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.6);margin:12px 0}
  .header{margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid #30363d}
  .icon{font-size:2rem;margin-bottom:6px}
  .name{font-size:1.15rem;font-weight:800}
  .cat{font-size:.8rem;color:#4f9cf9;margin-top:4px;padding:2px 8px;border-radius:12px;display:inline-block;background:#161b22;border:1px solid #30363d;text-transform:capitalize}
  .row{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid #21262d;align-items:flex-start}
  .row:last-child{border-bottom:none}
  .lbl{font-size:.72rem;color:#7d8590;min-width:100px}
  .val{font-size:.83rem;word-break:break-word}
  .footer{text-align:center;font-size:.68rem;color:#484f58;margin-top:16px;padding-top:12px;border-top:1px solid #21262d}
</style></head><body><div class="card">
  <div class="header">
    <div class="icon">${icon}</div>
    <div class="name">${esc(nameStr)}</div>
    <div><span class="cat">${esc(type)}</span></div>
  </div>
  ${fieldsHtml}
  <div class="footer">TI Inventario · Sistema de Gestión</div>
</div></body></html>`);
  } catch (e) {
    console.error('GET /recurso:', e.message);
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;
