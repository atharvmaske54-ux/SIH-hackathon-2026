const dataStore = require('../store/dataStore');

const getColleges = (req, res) => {
  const colleges = dataStore.get('colleges');
  res.json({
    success: true,
    count: colleges.length,
    data: colleges
  });
};

const createCollege = (req, res) => {
  const { name, shortName, city, state, icon, color } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'College name is required.' });
  }

  const newCollege = {
    id: `col-${Date.now().toString(36)}`,
    name,
    shortName: shortName || name.slice(0, 4).toUpperCase(),
    city: city || 'Mumbai',
    state: state || 'Maharashtra',
    icon: icon || 'university',
    color: color || '#1E40AF',
    campuses: [],
    departments: [],
    securityTeams: [],
    emergencyHotlines: []
  };

  dataStore.push('colleges', newCollege);

  res.status(201).json({
    success: true,
    message: 'College institution registered successfully',
    data: newCollege
  });
};

const addCampus = (req, res) => {
  const { collegeId } = req.params;
  const { name, location, latitude, longitude, radius } = req.body;

  const college = dataStore.find('colleges', c => c.id === collegeId);
  if (!college) {
    return res.status(404).json({ success: false, message: 'College not found' });
  }

  const newCampus = {
    id: `camp-${Date.now().toString(36)}`,
    name,
    location: location || 'Campus Area',
    latitude: parseFloat(latitude) || 18.9298,
    longitude: parseFloat(longitude) || 72.8333,
    radius: parseInt(radius, 10) || 800
  };

  dataStore.update(
    'colleges',
    c => c.id === collegeId,
    c => ({
      ...c,
      campuses: [...(c.campuses || []), newCampus]
    })
  );

  res.status(201).json({
    success: true,
    message: 'Campus safety zone added',
    campus: newCampus
  });
};

const getSystemTelemetry = (req, res) => {
  const users = dataStore.get('users');
  const incidents = dataStore.get('incidents');
  const sosSessions = dataStore.get('sosSessions');
  const colleges = dataStore.get('colleges');

  const pendingCount = incidents.filter(i => i.status === 'Pending').length;
  const verifiedCount = incidents.filter(i => i.status === 'Verified').length;
  const resolvedCount = incidents.filter(i => i.status === 'Resolved').length;

  res.json({
    success: true,
    metrics: {
      totalUsers: users.length,
      totalIncidents: incidents.length,
      pendingIncidents: pendingCount,
      verifiedIncidents: verifiedCount,
      resolvedIncidents: resolvedCount,
      activeSOS: sosSessions.filter(s => s.status === 'active').length,
      monitoredColleges: colleges.length,
      systemHealth: '100% Operational'
    }
  });
};

module.exports = {
  getColleges,
  createCollege,
  addCampus,
  getSystemTelemetry
};
