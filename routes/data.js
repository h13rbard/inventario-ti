'use strict';

const express = require('express');
const { requireAuth, getBranch } = require('../src/middleware/auth');
const { loadBranchData, replaceBranchData } = require('../src/services/dataService');

const router = express.Router();

router.get('/data', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    const branch = getBranch(req);
    const data = await loadBranchData(branch);
    res.json({ ok: true, data });
  } catch (e) {
    console.error('GET /api/data:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/data', requireAuth, async (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ ok: false, error: 'Payload inválido' });
    }
    const branch = getBranch(req);
    await replaceBranchData(branch, data);
    res.json({ ok: true });
  } catch (e) {
    console.error('POST /api/data:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
