const { GoogleGenerativeAI } = require('@google/generative-ai');
const SymptomCheck = require('../models/SymptomCheck');

// ─── Built-in fallback (used when GEMINI_API_KEY is absent) ─────────────────

const getBuiltinAnalysis = (symptoms) => {
  const symptomMap = {
    fever:               { conditions: ['Common Cold', 'Flu', 'COVID-19', 'Infection'],             specialties: ['General Practice', 'Internal Medicine'] },
    headache:            { conditions: ['Tension Headache', 'Migraine', 'Sinusitis'],               specialties: ['Neurology', 'General Practice'] },
    chest_pain:          { conditions: ['Angina', 'GERD', 'Anxiety'],                               specialties: ['Cardiology', 'Emergency Medicine'], urgency: 'high' },
    cough:               { conditions: ['Common Cold', 'Bronchitis', 'Asthma', 'COVID-19'],         specialties: ['Pulmonology', 'General Practice'] },
    shortness_of_breath: { conditions: ['Asthma', 'COPD', 'Heart Failure'],                        specialties: ['Pulmonology', 'Cardiology'], urgency: 'high' },
    abdominal_pain:      { conditions: ['Gastritis', 'Appendicitis', 'IBS'],                        specialties: ['Gastroenterology', 'General Practice'] },
    rash:                { conditions: ['Allergic Reaction', 'Eczema', 'Psoriasis'],                specialties: ['Dermatology', 'Allergy & Immunology'] },
    joint_pain:          { conditions: ['Arthritis', 'Gout', 'Fibromyalgia'],                       specialties: ['Rheumatology', 'Orthopedics'] },
    dizziness:           { conditions: ['Vertigo', 'Low Blood Pressure', 'Inner Ear Issue'],        specialties: ['Neurology', 'ENT'] },
    fatigue:             { conditions: ['Anemia', 'Depression', 'Thyroid Issues', 'Diabetes'],      specialties: ['Internal Medicine', 'Endocrinology'] },
    nausea:              { conditions: ['Gastroenteritis', 'Food Poisoning', 'Migraine'],           specialties: ['Gastroenterology', 'General Practice'] },
    back_pain:           { conditions: ['Muscle Strain', 'Herniated Disc', 'Kidney Issues'],        specialties: ['Orthopedics', 'General Practice'] },
    sore_throat:         { conditions: ['Pharyngitis', 'Tonsillitis', 'Strep Throat'],              specialties: ['ENT', 'General Practice'] },
    runny_nose:          { conditions: ['Common Cold', 'Allergic Rhinitis', 'Sinusitis'],           specialties: ['General Practice', 'Allergy & Immunology'] },
    swelling:            { conditions: ['Edema', 'Injury', 'Infection', 'Allergic Reaction'],      specialties: ['General Practice', 'Cardiology'] },
  };

  const conditions = new Set();
  const specialties = new Set();
  let maxUrgency = 'low';

  symptoms.forEach(symptom => {
    const key = symptom.toLowerCase().replace(/\s+/g, '_');
    const match = symptomMap[key];
    if (match) {
      match.conditions.forEach(c => conditions.add(c));
      match.specialties.forEach(s => specialties.add(s));
      if (match.urgency === 'high') maxUrgency = 'high';
      else if (match.urgency === 'medium' && maxUrgency === 'low') maxUrgency = 'medium';
    }
  });

  if (conditions.size === 0) {
    conditions.add('General Health Concern');
    specialties.add('General Practice');
  }

  return {
    possibleConditions: Array.from(conditions),
    recommendedSpecialties: Array.from(specialties),
    urgencyLevel: maxUrgency,
    generalAdvice: maxUrgency === 'high'
      ? 'Your symptoms suggest a potentially serious condition. Please seek immediate medical attention.'
      : 'Please consult a doctor for a proper diagnosis. Do not self-medicate.',
    disclaimer: 'This is a preliminary rule-based assessment only and should not replace professional medical advice. Always consult a qualified healthcare provider.',
  };
};

// ─── Gemini helper ───────────────────────────────────────────────────────────

const buildPrompt = (symptoms, age, gender, additionalInfo) => `
You are a medical assistant AI. Analyze the following patient symptoms and provide a structured health assessment.

Patient Information:
- Age: ${age || 'Not provided'}
- Gender: ${gender || 'Not provided'}
- Symptoms: ${symptoms.join(', ')}
- Additional Information: ${additionalInfo || 'None'}

Respond ONLY with a valid JSON object — no markdown fences, no extra text — in this exact shape:
{
  "possibleConditions": ["condition1", "condition2", "condition3"],
  "recommendedSpecialties": ["specialty1", "specialty2"],
  "urgencyLevel": "low" | "medium" | "high" | "emergency",
  "generalAdvice": "concise actionable advice for the patient",
  "disclaimer": "standard medical disclaimer"
}

Rules:
- urgencyLevel must be one of: low, medium, high, emergency
- List 2–5 possible conditions ordered by likelihood
- List 1–3 recommended medical specialties
- generalAdvice should be 1–2 sentences, practical and caring
- Always include a disclaimer reminding that this is not a substitute for professional medical advice
- IMPORTANT: This is for educational purposes only. Always recommend consulting a real doctor.
`.trim();

const callGemini = async (symptoms, age, gender, additionalInfo) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key') return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const result = await model.generateContent(buildPrompt(symptoms, age, gender, additionalInfo));
  const text = result.response.text().trim();

  // Strip markdown code fences if Gemini wraps the JSON
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Gemini returned no parseable JSON');

  const parsed = JSON.parse(jsonMatch[0]);

  // Validate required fields
  const urgencyOptions = ['low', 'medium', 'high', 'emergency'];
  if (!Array.isArray(parsed.possibleConditions) || !Array.isArray(parsed.recommendedSpecialties)) {
    throw new Error('Gemini response missing required arrays');
  }
  if (!urgencyOptions.includes(parsed.urgencyLevel)) {
    parsed.urgencyLevel = 'low';
  }

  return parsed;
};

// ─── Controllers ─────────────────────────────────────────────────────────────

const checkSymptoms = async (req, res) => {
  try {
    const { symptoms, additionalInfo, age, gender } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ message: 'Please provide at least one symptom' });
    }

    let analysis = null;

    try {
      analysis = await callGemini(symptoms, age, gender, additionalInfo);
      if (analysis) {
        console.log('✅ Gemini AI analysis completed');
      }
    } catch (geminiError) {
      console.error('Gemini error, falling back to built-in analysis:', geminiError.message);
    }

    if (!analysis) {
      analysis = getBuiltinAnalysis(symptoms);
      console.log('ℹ️  Using built-in fallback analysis');
    }

    const record = await SymptomCheck.create({
      patientId: req.user?.id,
      symptoms,
      additionalInfo,
      age,
      gender,
      response: analysis,
      rawResponse: JSON.stringify(analysis),
    });

    res.json({ checkId: record._id, analysis, symptoms, timestamp: record.createdAt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSymptomHistory = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    const history = await SymptomCheck.find({ patientId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { checkSymptoms, getSymptomHistory };
