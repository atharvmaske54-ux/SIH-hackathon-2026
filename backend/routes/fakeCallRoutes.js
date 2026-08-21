const express = require('express');
const router = express.Router();
const fakeCallController = require('../controllers/fakeCallController');
const { verifyAuth } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/rbacMiddleware');

router.get('/presets', verifyAuth, fakeCallController.getPresets);
router.post('/schedule', verifyAuth, checkPermission('schedule_fake_call'), fakeCallController.triggerFakeCall);
router.post('/trigger', verifyAuth, checkPermission('schedule_fake_call'), fakeCallController.triggerFakeCall);

module.exports = router;
