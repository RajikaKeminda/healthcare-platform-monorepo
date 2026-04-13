const mongoose = require('mongoose');

const symptomCheckSchema = new mongoose.Schema({
  patientId: { type: String },
  symptoms: [{ type: String }],
  additionalInfo: { type: String },
  age: { type: Number },
  gender: { type: String },
  response: {
    possibleConditions: [String],
    recommendedSpecialties: [String],
    urgencyLevel: { type: String, enum: ['low', 'medium', 'high', 'emergency'] },
    generalAdvice: String,
    disclaimer: String,
  },
  rawResponse: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('SymptomCheck', symptomCheckSchema);
