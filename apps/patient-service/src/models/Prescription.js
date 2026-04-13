const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointmentId: { type: String },
  doctorId: { type: String },
  doctorName: { type: String },
  diagnosis: { type: String },
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String },
    frequency: { type: String },
    duration: { type: String },
    instructions: { type: String },
  }],
  notes: { type: String },
  issuedAt: { type: Date, default: Date.now },
  validUntil: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
