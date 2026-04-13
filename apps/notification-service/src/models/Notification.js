const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['email', 'sms', 'both'], default: 'email' },
  category: {
    type: String,
    enum: ['booking_confirmed', 'appointment_confirmed', 'appointment_cancelled', 'consultation_completed', 'general'],
    default: 'general'
  },
  subject: { type: String },
  message: { type: String, required: true },
  recipient: { type: String },
  status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'pending' },
  appointmentId: { type: String },
  error: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
