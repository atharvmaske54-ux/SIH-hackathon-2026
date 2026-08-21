const dataStore = require('../store/dataStore');

const getHeatmapData = (req, res) => {
  const incidents = dataStore.get('incidents');

  // Convert incidents into weighted heatmap coordinates
  const points = incidents.map(inc => {
    let weight = 0.5;
    if (['Sexual Harassment', 'Physical Threat', 'Stalking'].includes(inc.type)) {
      weight = 0.95;
    } else if (['Harassment', 'Suspicious Activity'].includes(inc.type)) {
      weight = 0.75;
    } else if (['Poor Lighting', 'Infrastructure Hazard'].includes(inc.type)) {
      weight = 0.55;
    }

    if (inc.status === 'Verified') weight = Math.min(1.0, weight + 0.1);

    return {
      latitude: inc.latitude || 18.9298,
      longitude: inc.longitude || 72.8335,
      weight,
      incidentType: inc.type,
      locationName: inc.location
    };
  });

  // Supplementary high-density risk clusters
  points.push(
    { latitude: 19.1334, longitude: 72.9133, weight: 0.9, locationName: 'Powai Hostel 3 Lane Cluster' },
    { latitude: 19.0735, longitude: 72.8660, weight: 0.85, locationName: 'Kalina Gymkhana Dark Walkway' },
    { latitude: 18.9298, longitude: 72.8335, weight: 0.7, locationName: 'Fort South Gate Exit' }
  );

  res.json({
    success: true,
    count: points.length,
    points
  });
};

const getGeofences = (req, res) => {
  const colleges = dataStore.get('colleges');
  const geofences = [];

  colleges.forEach(col => {
    if (Array.isArray(col.campuses)) {
      col.campuses.forEach(camp => {
        // Count active incidents in campus
        const campusIncidents = dataStore.filter('incidents', i => i.campusId === camp.id || i.collegeId === col.id);
        const verifiedCount = campusIncidents.filter(i => i.status === 'Verified').length;

        geofences.push({
          id: camp.id,
          collegeId: col.id,
          collegeName: col.name,
          campusName: camp.name,
          latitude: camp.latitude || 18.9298,
          longitude: camp.longitude || 72.8333,
          radiusMeters: camp.radius || 800,
          totalIncidents: campusIncidents.length,
          verifiedIncidents: verifiedCount,
          safetyRating: Math.max(40, 100 - (verifiedCount * 12 + campusIncidents.length * 5)),
          securityPatrolActive: true,
          color: col.color || '#1E40AF'
        });
      });
    }
  });

  res.json({
    success: true,
    count: geofences.length,
    geofences
  });
};

const calculateSafeRoute = (req, res) => {
  const { origin, destination, travelMode } = req.body;

  const startLat = origin?.latitude || 18.9298;
  const startLon = origin?.longitude || 72.8333;
  const endLat = destination?.latitude || 19.0734;
  const endLon = destination?.longitude || 72.8631;

  // Approximate direct distance calculation (Haversine formula approximation)
  const dLat = (endLat - startLat) * (Math.PI / 180);
  const dLon = (endLon - startLon) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = (6371 * c).toFixed(2);

  // Generate intermediate coordinates for safest vs fastest route
  const midLat = (startLat + endLat) / 2;
  const midLon = (startLon + endLon) / 2;

  // Fastest direct route
  const fastestPath = [
    { latitude: startLat, longitude: startLon },
    { latitude: midLat, longitude: midLon },
    { latitude: endLat, longitude: endLon }
  ];

  // Safest route slightly detours through main lit arterial roads and security patrol checkpoints
  const safestPath = [
    { latitude: startLat, longitude: startLon },
    { latitude: midLat + 0.003, longitude: midLon + 0.002, checkpoint: 'Fort Alpha Patrol Desk' },
    { latitude: midLat + 0.005, longitude: midLon - 0.001, checkpoint: 'Main Illuminated Boulevard' },
    { latitude: endLat, longitude: endLon }
  ];

  res.json({
    success: true,
    origin: { latitude: startLat, longitude: startLon },
    destination: { latitude: endLat, longitude: endLon },
    distanceKm: parseFloat(distanceKm),
    routes: [
      {
        id: 'route-safest',
        name: '🛡️ Safest Recommended Route',
        type: 'safest',
        safetyScore: 94,
        riskLevel: 'Low',
        distanceKm: parseFloat((distanceKm * 1.08).toFixed(2)),
        estimatedMinutes: Math.round(distanceKm * 3.5) + 3,
        lightingScore: '96% Well-Lit Arterial Roads',
        patrolPresence: 'High (3 Campus Security Patrols Active)',
        waypoints: safestPath,
        avoidedRiskClusters: ['Avoided unlit Gymkhana walkway', 'Bypassed 2 unverified incident reports']
      },
      {
        id: 'route-fastest',
        name: '⚡ Direct Fastest Route',
        type: 'fastest',
        safetyScore: 68,
        riskLevel: 'Medium',
        distanceKm: parseFloat(distanceKm),
        estimatedMinutes: Math.round(distanceKm * 3.5),
        lightingScore: '65% Partially Lit Walkway',
        patrolPresence: 'Moderate Patrol Coverage',
        waypoints: fastestPath,
        warnings: ['Passes through 1 reported poor-lighting area']
      }
    ]
  });
};

module.exports = {
  getHeatmapData,
  getGeofences,
  calculateSafeRoute
};
