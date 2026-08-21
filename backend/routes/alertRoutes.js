const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { verifyAuth } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/rbacMiddleware');

router.get('/', alertController.getAlerts);
router.post('/read', verifyAuth, alertController.markAsRead);
router.post('/', verifyAuth, checkPermission('broadcast_alerts'), alertController.createAlert);

module.exports = router;
