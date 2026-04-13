require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();
const PORT = process.env.PORT || 3004;

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/sessions', sessionRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'telemedicine-service' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => console.log(`Telemedicine Service running on port ${PORT}`));
