const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../Models/User.js');
const validate = require('../middleware/validate.js');
const { signupSchema, loginSchema } = require('../schemas/authSchema.js');

const router = express.Router();

router.post('/signup', validate(signupSchema), async (req, res) => {
  const { name, email, password } = req.validated;
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const user = await User.createWithPassword({ name, email, password, role: 'user' });
  const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.validated;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

module.exports = router;
