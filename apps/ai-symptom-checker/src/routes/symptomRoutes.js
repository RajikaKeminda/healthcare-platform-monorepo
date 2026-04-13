const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { checkSymptoms, getSymptomHistory } = require('../controllers/symptomController');

router.post('/check', optionalAuth, checkSymptoms);
router.get('/history', optionalAuth, getSymptomHistory);

module.exports = router;
