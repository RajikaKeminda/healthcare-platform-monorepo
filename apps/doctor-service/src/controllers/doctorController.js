const axios = require('axios');
const Doctor = require('../models/Doctor');
const Prescription = require('../models/Prescription');

const getProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password;
    delete updates.role;
    delete updates.isVerified;
    const doctor = await Doctor.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(req.user.id, { availability }, { new: true });
    res.json({ message: 'Availability updated', doctor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const issuePrescription = async (req, res) => {
  try {
    const { patientId, patientName, appointmentId, diagnosis, medications, notes, validUntil } = req.body;
    const prescription = await Prescription.create({
      doctorId: req.user.id,
      patientId,
      patientName,
      appointmentId,
      diagnosis,
      medications,
      notes,
      validUntil
    });

    const patientServiceUrl = process.env.PATIENT_SERVICE_URL || 'http://localhost:3001';
    try {
      await axios.post(`${patientServiceUrl}/api/patients/prescriptions`, {
        patientId,
        appointmentId,
        doctorId: req.user.id,
        doctorName: req.user.name,
        diagnosis,
        medications,
        notes,
        validUntil
      });
    } catch (err) {
      console.error('Failed to sync prescription to patient service:', err.message);
    }

    res.status(201).json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctorId: req.user.id }).sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('-password');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchDoctors = async (req, res) => {
  try {
    const { specialty, name, page = 1, limit = 20 } = req.query;
    const query = { isActive: true, isVerified: true };
    if (specialty) query.specialization = new RegExp(specialty, 'i');
    if (name) query.name = new RegExp(name, 'i');
    const doctors = await Doctor.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ rating: -1 });
    const total = await Doctor.countDocuments(query);
    res.json({ doctors, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllDoctors = async (req, res) => {
  try {
    const { page = 1, limit = 20, verified } = req.query;
    const query = {};
    if (verified !== undefined) query.isVerified = verified === 'true';
    const doctors = await Doctor.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await Doctor.countDocuments(query);
    res.json({ doctors, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).select('-password');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ message: 'Doctor verified successfully', doctor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleDoctorStatus = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    doctor.isActive = !doctor.isActive;
    await doctor.save();
    res.json({ message: `Doctor ${doctor.isActive ? 'activated' : 'deactivated'}`, doctor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfile, updateProfile, setAvailability, issuePrescription,
  getPrescriptions, getDoctorById, searchDoctors,
  getAllDoctors, verifyDoctor, toggleDoctorStatus
};
