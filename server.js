/**
 * TI Inventario — servidor Express + Prisma + PostgreSQL
 */

'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const categoriesRoutes = require('./routes/categories');
const itemsRoutes = require('./routes/items');
const employeesRoutes = require('./routes/employees');
const loansRoutes = require('./routes/loans');
const movementsRoutes = require('./routes/movements');
const computersRoutes = require('./routes/computers');
const recursosRoutes = require('./routes/recursos');
const maintenanceRoutes = require('./routes/maintenance');
const bajasRoutes = require('./routes/bajas');
const qrRoutes = require('./routes/qr');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname));

app.use('/api', authRoutes);
app.use('/api', dataRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/movements', movementsRoutes);
app.use('/api/computers', computersRoutes);
app.use('/api/recursos', recursosRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/bajas', bajasRoutes);
app.use(qrRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅  TI Inventario corriendo en http://localhost:${PORT}`);
});
