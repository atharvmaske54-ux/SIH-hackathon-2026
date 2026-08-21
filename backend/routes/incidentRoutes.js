const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const { verifyAuth } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/rbacMiddleware');
const upload = require('../middleware/uploadMiddleware');

const uploadFields = upload.fields([
  { name: 'photo', maxCount: 5 },
  { name: 'video', maxCount: 2 },
  { name: 'audio', maxCount: 3 }
]);

router.get('/', getIncidentsHandler);
router.get('/my-reports', verifyAuth, checkPermission('track_own_reports'), incidentController.getMyReports);
router.get('/:id', getIncidentByIdHandler);

router.post('/', verifyAuth, checkPermission('report_incident'), uploadFields, incidentController.createIncident);
router.patch('/:id/workflow', verifyAuth, checkPermission('verify_reports'), incidentController.updateIncidentWorkflow);

function getIncidentsHandler(req, res) {
  incidentController.getIncidents(req, res);
}

function getIncidentByIdHandler(req, res) {
  incidentController.getIncidentById(req, res);
}

module.exports = router;
