const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAuth } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/rbacMiddleware');

router.get('/colleges', verifyAuth, adminController.getColleges);
router.post('/colleges', verifyAuth, checkPermission('manage_colleges'), adminController.createCollege);
router.post('/colleges/:collegeId/campuses', verifyAuth, checkPermission('manage_colleges'), adminController.addCampus);
router.get('/telemetry', verifyAuth, checkPermission('monitor_system'), adminController.getSystemTelemetry);

module.exports = router;
