const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');

router.get('/heatmap', mapController.getHeatmapData);
router.get('/geofences', mapController.getGeofences);
router.post('/safe-route', mapController.calculateSafeRoute);

module.exports = router;
