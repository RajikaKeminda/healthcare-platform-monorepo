const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  title: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String },
  fileName: { type: String },
  fileType: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  reportDate: { type: Date },
  doctorName: { type: String },
  reportType: { type: String, enum: ['lab_result', 'radiology', 'prescription', 'other'], default: 'other' },
}, { timestamps: true });

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
