const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, unique: true },
  channelName: { type: String, required: true },
  patientId: { type: String, required: true },
  doctorId: { type: String, required: true },
  status: {
    type: String,
    enum: ['waiting', 'active', 'ended'],
    default: 'waiting'
  },
  startedAt: { type: Date },
  endedAt: { type: Date },
  durationMinutes: { type: Number },
  patientJoinedAt: { type: Date },
  doctorJoinedAt: { type: Date },
  recordingUrl: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
