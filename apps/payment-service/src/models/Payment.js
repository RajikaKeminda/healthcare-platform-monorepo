const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true },
  patientId: { type: String, required: true },
  doctorId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  method: { type: String, default: 'paypal' },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paypalOrderId: { type: String },
  paypalCaptureId: { type: String },
  paypalPayerId: { type: String },
  description: { type: String },
  refundedAt: { type: Date },
  refundId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
