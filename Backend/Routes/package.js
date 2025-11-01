const express = require('express');
const Package = require('../Models/Package.js');
const validate = require('../middleware/validate.js');
const { createPackageSchema } = require('../schemas/packageSchema.js');
const { requireAuth, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();

// public listing & search
router.get('/', async (req, res) => {
  // simple filters via query params (title, location, maxPrice, days)
  const q = {};
  if (req.query.title) q.title = new RegExp(req.query.title, 'i');
  if (req.query.location) q.location = new RegExp(req.query.location, 'i');
  if (req.query.maxPrice) q.price = { $lte: Number(req.query.maxPrice) };
  const list = await Package.find(q).sort({ createdAt: -1 });
  res.json(list);
});

// admin create
router.post('/', requireAuth, requireAdmin, validate(createPackageSchema), async (req, res) => {
  const p = await Package.create(req.validated);
  res.status(201).json(p);
});

// admin update
router.put('/:id', requireAuth, requireAdmin, validate(createPackageSchema), async (req, res) => {
  const updated = await Package.findByIdAndUpdate(req.params.id, req.validated, { new: true });
  if (!updated) return res.status(404).json({ message: 'Package not found' });
  res.json(updated);
});

// admin delete
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  await Package.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
