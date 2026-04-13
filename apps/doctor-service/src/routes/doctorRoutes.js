const express = require('express');
const router = express.Router();
const { protect, adminOnly, doctorOnly } = require('../middleware/auth');
const {
  getProfile, updateProfile, setAvailability, issuePrescription,
  getPrescriptions, getDoctorById, searchDoctors,
  getAllDoctors, verifyDoctor, toggleDoctorStatus
} = require('../controllers/doctorController');

// Public routes
router.get('/search', searchDoctors);
router.get('/:id', getDoctorById);

// Doctor routes
router.get('/profile/me', protect, getProfile);
router.put('/profile/me', protect, updateProfile);
router.put('/availability', protect, doctorOnly, setAvailability);
router.post('/prescriptions', protect, doctorOnly, issuePrescription);
router.get('/prescriptions/my', protect, doctorOnly, getPrescriptions);

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllDoctors);
router.put('/admin/:id/verify', protect, adminOnly, verifyDoctor);
router.put('/admin/:id/toggle-status', protect, adminOnly, toggleDoctorStatus);

module.exports = router;
