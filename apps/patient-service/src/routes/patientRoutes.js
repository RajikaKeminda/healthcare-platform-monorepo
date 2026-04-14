const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, adminOnly, doctorOrAdmin } = require('../middleware/auth');
const {
  getProfile, updateProfile, uploadReport, getReports,
  getPrescriptions, createPrescription, getPatientById,
  getPatientReportsById, getAllPatients, togglePatientStatus
} = require('../controllers/patientController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Named routes must come before /:id wildcard
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/reports', protect, upload.single('file'), uploadReport);
router.get('/reports', protect, getReports);
router.get('/prescriptions', protect, getPrescriptions);
router.post('/prescriptions', createPrescription); // called internally by doctor-service

// Admin routes (before /:id wildcard)
router.get('/admin/patients', protect, adminOnly, getAllPatients);
router.put('/admin/patients/:id/toggle-status', protect, adminOnly, togglePatientStatus);

// Doctor/admin can view a specific patient's reports (e.g. from appointment context)
router.get('/:id/reports', protect, doctorOrAdmin, getPatientReportsById);

// Wildcard route last
router.get('/:id', protect, getPatientById);

module.exports = router;
