const express = require('express');
const router = express.Router();
const sosController = require('../controllers/sosController');
const { verifyAuth } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/rbacMiddleware');

router.post('/trigger', verifyAuth, checkPermission('trigger_sos'), sosController.triggerSOS);
router.post('/location-update', verifyAuth, sosController.updateLiveLocation);
router.post('/cancel', verifyAuth, sosController.cancelSOS);

router.get('/active', verifyAuth, sosController.getActiveSOS);
router.get('/history', verifyAuth, sosController.getSOSHistory);

module.exports = router;
