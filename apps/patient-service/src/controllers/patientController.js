const Patient = require('../models/Patient');
const MedicalReport = require('../models/MedicalReport');
const Prescription = require('../models/Prescription');

const getProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password;
    delete updates.role;
    const patient = await Patient.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadReport = async (req, res) => {
  try {
    const { title, description, reportDate, doctorName, reportType } = req.body;
    const report = await MedicalReport.create({
      patientId: req.user.id,
      title,
      description,
      reportDate,
      doctorName,
      reportType: reportType || 'other',
      fileName: req.file ? req.file.originalname : null,
      fileUrl: req.file ? `/uploads/${req.file.filename}` : null,
      fileType: req.file ? req.file.mimetype : null,
    });
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await MedicalReport.find({ patientId: req.user.id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user.id }).sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPrescription = async (req, res) => {
  try {
    const { patientId, appointmentId, doctorId, doctorName, diagnosis, medications, notes, validUntil } = req.body;
    const prescription = await Prescription.create({
      patientId, appointmentId, doctorId, doctorName, diagnosis, medications, notes, validUntil
    });
    res.status(201).json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = search ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] } : {};
    const patients = await Patient.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await Patient.countDocuments(query);
    res.json({ patients, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const togglePatientStatus = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    patient.isActive = !patient.isActive;
    await patient.save();
    res.json({ message: `Patient ${patient.isActive ? 'activated' : 'deactivated'}`, patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfile, updateProfile, uploadReport, getReports,
  getPrescriptions, createPrescription, getPatientById,
  getAllPatients, togglePatientStatus
};
