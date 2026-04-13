const OpenAI = require('openai');
const SymptomCheck = require('../models/SymptomCheck');

const getBuiltinAnalysis = (symptoms) => {
  const symptomMap = {
    fever: { conditions: ['Common Cold', 'Flu', 'COVID-19', 'Infection'], specialties: ['General Practice', 'Internal Medicine'] },
    headache: { conditions: ['Tension Headache', 'Migraine', 'Sinusitis'], specialties: ['Neurology', 'General Practice'] },
    chest_pain: { conditions: ['Angina', 'GERD', 'Anxiety'], specialties: ['Cardiology', 'Emergency Medicine'], urgency: 'high' },
    cough: { conditions: ['Common Cold', 'Bronchitis', 'Asthma', 'COVID-19'], specialties: ['Pulmonology', 'General Practice'] },
    shortness_of_breath: { conditions: ['Asthma', 'COPD', 'Heart Failure'], specialties: ['Pulmonology', 'Cardiology'], urgency: 'high' },
    abdominal_pain: { conditions: ['Gastritis', 'Appendicitis', 'IBS'], specialties: ['Gastroenterology', 'General Practice'] },
    rash: { conditions: ['Allergic Reaction', 'Eczema', 'Psoriasis'], specialties: ['Dermatology', 'Allergy & Immunology'] },
    joint_pain: { conditions: ['Arthritis', 'Gout', 'Fibromyalgia'], specialties: ['Rheumatology', 'Orthopedics'] },
    dizziness: { conditions: ['Vertigo', 'Low Blood Pressure', 'Inner Ear Issue'], specialties: ['Neurology', 'ENT'] },
    fatigue: { conditions: ['Anemia', 'Depression', 'Thyroid Issues', 'Diabetes'], specialties: ['Internal Medicine', 'Endocrinology'] },
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
    disclaimer: 'This is an AI-generated preliminary assessment only and should not replace professional medical advice. Always consult a qualified healthcare provider for diagnosis and treatment.',
  };
};

const checkSymptoms = async (req, res) => {
  try {
    const { symptoms, additionalInfo, age, gender } = req.body;
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ message: 'Please provide at least one symptom' });
    }

    let aiResponse = null;

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key') {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const prompt = `You are a medical assistant AI. Analyze the following symptoms and provide a structured health assessment.

Patient Information:
- Age: ${age || 'Not provided'}
- Gender: ${gender || 'Not provided'}
- Symptoms: ${symptoms.join(', ')}
- Additional Information: ${additionalInfo || 'None'}

Provide a JSON response with:
{
  "possibleConditions": ["condition1", "condition2"],
  "recommendedSpecialties": ["specialty1", "specialty2"],
  "urgencyLevel": "low|medium|high|emergency",
  "generalAdvice": "brief advice",
  "disclaimer": "medical disclaimer"
}

IMPORTANT: This is for educational purposes only. Always recommend consulting a real doctor.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
        });

        const content = completion.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiResponse = JSON.parse(jsonMatch[0]);
        }
      } catch (aiError) {
        console.error('OpenAI error, falling back to built-in:', aiError.message);
      }
    }

    const analysis = aiResponse || getBuiltinAnalysis(symptoms);

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
    const history = await SymptomCheck.find({ patientId: req.user.id }).sort({ createdAt: -1 }).limit(20);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { checkSymptoms, getSymptomHistory };
