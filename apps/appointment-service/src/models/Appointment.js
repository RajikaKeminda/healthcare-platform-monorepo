const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  patientEmail: { type: String },
  doctorId: { type: String, required: true },
  doctorName: { type: String, required: true },
  doctorSpecialization: { type: String },
  appointmentDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String },
  duration: { type: Number, default: 30 }, // in minutes
  type: { type: String, enum: ['in-person', 'telemedicine'], default: 'telemedicine' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'pending'
  },
  reason: { type: String },
  notes: { type: String },
  consultationFee: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  paymentId: { type: String },
  meetingId: { type: String }, // Agora channel name
  cancelledBy: { type: String },
  cancellationReason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
