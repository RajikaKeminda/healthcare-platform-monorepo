require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const symptomRoutes = require('./routes/symptomRoutes');

const app = express();
const PORT = process.env.PORT || 3007;

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/symptoms', symptomRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ai-symptom-checker' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => console.log(`AI Symptom Checker running on port ${PORT}`));
