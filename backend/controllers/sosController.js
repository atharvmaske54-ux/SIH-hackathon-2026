const dataStore = require('../store/dataStore');

const triggerSOS = (req, res) => {
  try {
    const userId = req.user?.id || 'usr-student-001';
    const userName = req.user?.name || 'Authorized User';
    const userPhone = req.user?.phone || '+91 98200 11223';
    const collegeId = req.user?.collegeId || 'col-uom';

    const {
      mode, // 'instant' | 'silent' | 'voice'
      latitude,
      longitude,
      locationAddress,
      batteryLevel,
      audioClip,
      automatedSms
    } = req.body;

    const lat = latitude || 18.9298;
    const lon = longitude || 72.8335;
    const addr = locationAddress || `GPS (${lat.toFixed(4)}, ${lon.toFixed(4)}) - Monitored Safety Zone`;

    // Fetch user emergency contacts
    const userContacts = dataStore.filter('contacts', c => c.userId === userId || c.userId === 'usr-student-001');
    
    const broadcastList = userContacts.map(c => ({
      name: c.name,
      phone: c.phone,
      status: 'Sent',
      timestamp: new Date().toLocaleTimeString()
    }));

    if (broadcastList.length === 0) {
      broadcastList.push(
        { name: 'Primary Guardian Contact', phone: '+91 98201 11222', status: 'Sent', timestamp: new Date().toLocaleTimeString() },
        { name: 'Hostel Security Control', phone: '+91 98200 88776', status: 'Sent', timestamp: new Date().toLocaleTimeString() }
      );
    }

    const sosId = `SOS-${Date.now()}`;
    const newSosSession = {
      id: sosId,
      userId,
      userName,
      userPhone,
      collegeId,
      mode: mode || 'instant',
      status: 'active', // 'active' | 'resolved' | 'cancelled'
      latitude: lat,
      longitude: lon,
      locationAddress: addr,
      batteryLevel: batteryLevel || '85%',
      audioClipUrl: audioClip || null,
      contactsNotified: broadcastList,
      authorityAlerted: 'Campus Security Incident Control Room',
      trackingUrl: `https://saferoute.app/track/sos-${sosId}`,
      hotlines: [
        { title: 'National Emergency', phone: '112' },
        { title: 'Women Helpline', phone: '1091' },
        { title: 'Campus CSO Control Room', phone: '+91 98200 00911' }
      ],
      triggeredAt: new Date().toISOString(),
      locationHistory: [
        { latitude: lat, longitude: lon, timestamp: new Date().toISOString() }
      ]
    };

    dataStore.push('sosSessions', newSosSession);

    // Also auto-generate an urgent incident alert in system alerts
    dataStore.push('alerts', {
      id: `ALERT-SOS-${Date.now()}`,
      title: `🚨 EMERGENCY SOS ACTIVATED (${(mode || 'INSTANT').toUpperCase()})`,
      category: 'Emergency SOS Broadcast',
      channel: 'incident',
      desc: `Distress alert triggered by user near ${addr}. Security patrol dispatched.`,
      type: 'danger',
      severity: 'Critical',
      time: 'Just now',
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Emergency SOS distress broadcast dispatched successfully.',
      sosSession: newSosSession
    });
  } catch (err) {
    console.error('[SOSController.triggerSOS] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to dispatch SOS alert' });
  }
};

const updateLiveLocation = (req, res) => {
  const userId = req.user?.id || 'usr-student-001';
  const { sosId, latitude, longitude, address } = req.body;

  let activeSession = null;
  if (sosId) {
    activeSession = dataStore.find('sosSessions', s => s.id === sosId);
  } else {
    activeSession = dataStore.find('sosSessions', s => s.userId === userId && s.status === 'active');
  }

  if (!activeSession) {
    return res.status(404).json({ success: false, message: 'No active SOS session found to update.' });
  }

  const updatedSession = dataStore.update(
    'sosSessions',
    s => s.id === activeSession.id,
    s => {
      const locHist = s.locationHistory || [];
      locHist.push({ latitude, longitude, timestamp: new Date().toISOString() });
      return {
        ...s,
        latitude: latitude || s.latitude,
        longitude: longitude || s.longitude,
        locationAddress: address || s.locationAddress,
        locationHistory: locHist,
        lastUpdatedAt: new Date().toISOString()
      };
    }
  );

  res.json({
    success: true,
    message: 'Live location updated for SOS distress tracking',
    sosSession: updatedSession
  });
};

const cancelSOS = (req, res) => {
  const userId = req.user?.id || 'usr-student-001';
  const { sosId, reason, cancelPin } = req.body;

  let activeSession = null;
  if (sosId) {
    activeSession = dataStore.find('sosSessions', s => s.id === sosId);
  } else {
    activeSession = dataStore.find('sosSessions', s => s.userId === userId && s.status === 'active');
  }

  if (!activeSession) {
    return res.status(404).json({ success: false, message: 'No active SOS session found.' });
  }

  const updatedSession = dataStore.update(
    'sosSessions',
    s => s.id === activeSession.id,
    s => ({
      ...s,
      status: 'resolved',
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason || 'User deactivated SOS safely',
      resolutionNotes: 'User confirmed safe and deactivated distress alarm.'
    })
  );

  res.json({
    success: true,
    message: 'SOS distress session deactivated safely.',
    sosSession: updatedSession
  });
};

const getActiveSOS = (req, res) => {
  const userId = req.user?.id || 'usr-student-001';
  const activeSession = dataStore.find('sosSessions', s => s.userId === userId && s.status === 'active');

  res.json({
    success: true,
    hasActiveSOS: !!activeSession,
    sosSession: activeSession || null
  });
};

const getSOSHistory = (req, res) => {
  const userId = req.user?.id || 'usr-student-001';
  const history = dataStore.filter('sosSessions', s => s.userId === userId || req.user?.role === 'super_admin');
  res.json({ success: true, count: history.length, data: history });
};

module.exports = {
  triggerSOS,
  updateLiveLocation,
  cancelSOS,
  getActiveSOS,
  getSOSHistory
};
