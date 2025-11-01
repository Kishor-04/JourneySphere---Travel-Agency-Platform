const express = require('express');
const Booking = require('../Models/Booking.js');
const Package = require('../Models/Package.js');
const validate = require('../middleware/validate.js');
const { createBookingSchema } = require('../schemas/bookingSchema.js');
const { requireAuth, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();

// create booking (user must be authenticated)
router.post('/', requireAuth, validate(createBookingSchema), async (req, res) => {
  const { packageId, name, email, phone, travellers, startDate } = req.validated;
  const pkg = await Package.findById(packageId);
  if (!pkg) return res.status(404).json({ message: 'Package not found' });

  const booking = await Booking.create({
    packageId: pkg._id,
    packageTitle: pkg.title,
    userId: req.user.id,
    userEmail: email,
    name, phone, travellers,
    startDate: new Date(startDate)
  });
  res.status(201).json(booking);
});

// user bookings
router.get('/mine', requireAuth, async (req, res) => {
  const b = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(b);
});

// admin view all bookings
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const b = await Booking.find().sort({ createdAt: -1 }).populate('packageId').populate('userId');
  res.json(b);
});

module.exports = router;
