const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');

const generateToken = (doctor) => {
  return jwt.sign(
    { id: doctor._id, email: doctor.email, role: doctor.role, name: doctor.name, phone: doctor.phone || '' },
    process.env.JWT_SECRET || 'healthcare_jwt_secret_2026',
    { expiresIn: '7d' }
  );
};

const register = async (req, res) => {
  try {
    const { name, email, password, phone, specialization, qualifications, experience, consultationFee, bio, licenseNumber, hospitalAffiliation } = req.body;
    const existing = await Doctor.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const doctor = await Doctor.create({
      name, email, password, phone, specialization,
      qualifications: qualifications || [],
      experience, consultationFee, bio, licenseNumber, hospitalAffiliation
    });
    const token = generateToken(doctor);
    res.status(201).json({ token, doctor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ email });
    if (!doctor || !(await doctor.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!doctor.isActive) return res.status(403).json({ message: 'Account is deactivated' });
    const token = generateToken(doctor);
    res.json({ token, doctor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login };
