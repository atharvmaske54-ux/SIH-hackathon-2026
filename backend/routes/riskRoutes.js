const express = require('express');
const router = express.Router();
const riskController = require('../controllers/riskController');

router.post('/evaluate', riskController.evaluateRisk);
router.get('/zones', riskController.getRiskZones);
router.post('/chat', riskController.chat);

module.exports = router;

