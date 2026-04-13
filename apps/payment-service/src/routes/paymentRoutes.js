const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createOrder, captureOrder, getPaymentByAppointment, getMyPayments } = require('../controllers/paymentController');

router.post('/create-order', protect, createOrder);
router.post('/capture/:orderId', protect, captureOrder);
router.get('/my', protect, getMyPayments);
router.get('/appointment/:appointmentId', protect, getPaymentByAppointment);

module.exports = router;
