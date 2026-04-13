const express = require('express');
const router = express.Router();
const {
  sendAppointmentNotification, sendCustomEmail, sendCustomSMS, getUserNotifications
} = require('../controllers/notificationController');

router.post('/appointment', sendAppointmentNotification);
router.post('/email', sendCustomEmail);
router.post('/sms', sendCustomSMS);
router.get('/user/:userId', getUserNotifications);

module.exports = router;
