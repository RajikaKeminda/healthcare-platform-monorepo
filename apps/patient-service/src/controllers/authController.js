const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');

const generateToken = (patient) => {
  return jwt.sign(
    { id: patient._id, email: patient.email, role: patient.role, name: patient.name },
    process.env.JWT_SECRET || 'healthcare_jwt_secret_2026',
    { expiresIn: '7d' }
  );
};

const register = async (req, res) => {
  try {
    const { name, email, password, phone, dateOfBirth, gender } = req.body;
    const existing = await Patient.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const patient = await Patient.create({ name, email, password, phone, dateOfBirth, gender });
    const token = generateToken(patient);
    res.status(201).json({ token, patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const patient = await Patient.findOne({ email });
    if (!patient || !(await patient.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!patient.isActive) return res.status(403).json({ message: 'Account is deactivated' });
    const token = generateToken(patient);
    res.json({ token, patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login };
