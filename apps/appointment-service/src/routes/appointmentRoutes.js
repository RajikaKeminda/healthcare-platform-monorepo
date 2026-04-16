const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createAppointment, getAppointmentById, getPatientAppointments,
  getDoctorAppointments, updateAppointmentStatus, cancelAppointment,
  updatePaymentStatus, getAllAppointments
} = require('../controllers/appointmentController');

router.post('/', protect, createAppointment);
router.get('/patient/my', protect, getPatientAppointments);
router.get('/doctor/my', protect, getDoctorAppointments);
router.get('/admin/all', protect, adminOnly, getAllAppointments);
router.get('/:id', protect, getAppointmentById);
router.put('/:id/status', protect, updateAppointmentStatus);
router.put('/:id/cancel', protect, cancelAppointment);
router.put('/:id/payment', updatePaymentStatus); // called internally by payment-service

module.exports = router;
