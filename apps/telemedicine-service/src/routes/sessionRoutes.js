const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getOrCreateSession, endSession, getSession, generateToken } = require('../controllers/sessionController');

router.post('/token', protect, generateToken);
router.get('/:appointmentId', protect, getSession);
router.post('/:appointmentId/join', protect, getOrCreateSession);
router.put('/:appointmentId/end', protect, endSession);

module.exports = router;
