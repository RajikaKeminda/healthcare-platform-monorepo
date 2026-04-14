const express = require('express');
const router = express.Router();
const { protect, adminOnly, doctorOnly } = require('../middleware/auth');
const {
  getProfile, updateProfile, setAvailability, issuePrescription,
  getPrescriptions, getDoctorById, searchDoctors,
  getAllDoctors, verifyDoctor, toggleDoctorStatus
} = require('../controllers/doctorController');

// Named/specific routes must come before /:id wildcard
router.get('/search', searchDoctors);

// Doctor authenticated routes (before /:id wildcard)
router.get('/profile/me', protect, getProfile);
router.put('/profile/me', protect, updateProfile);
router.put('/availability', protect, doctorOnly, setAvailability);
router.post('/prescriptions', protect, doctorOnly, issuePrescription);
router.get('/prescriptions/my', protect, doctorOnly, getPrescriptions);

// Admin routes (before /:id wildcard)
router.get('/admin/all', protect, adminOnly, getAllDoctors);
router.put('/admin/:id/verify', protect, adminOnly, verifyDoctor);
router.put('/admin/:id/toggle-status', protect, adminOnly, toggleDoctorStatus);

// Public wildcard route last
router.get('/:id', getDoctorById);

module.exports = router;
