const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { createOrder, captureOrder, getPaymentByAppointment, getMyPayments, getAllPayments } = require('../controllers/paymentController');

router.get('/admin/all', protect, adminOnly, getAllPayments);
router.post('/create-order', protect, createOrder);
router.post('/capture/:orderId', protect, captureOrder);
router.get('/my', protect, getMyPayments);
router.get('/appointment/:appointmentId', protect, getPaymentByAppointment);

module.exports = router;
