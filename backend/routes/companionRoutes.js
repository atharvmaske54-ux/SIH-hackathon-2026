const express = require('express');
const router = express.Router();
const companionController = require('../controllers/companionController');
const { verifyAuth } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/rbacMiddleware');

router.post('/start', verifyAuth, checkPermission('start_companion'), companionController.startCompanionJourney);
router.post('/check-in', verifyAuth, companionController.checkIn);
router.post('/complete', verifyAuth, companionController.completeJourney);
router.post('/cancel', verifyAuth, companionController.completeJourney);
router.post('/expire', verifyAuth, companionController.expireJourney);

router.get('/status', verifyAuth, companionController.getStatus);

module.exports = router;
