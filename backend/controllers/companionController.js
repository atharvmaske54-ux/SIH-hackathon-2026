const dataStore = require('../store/dataStore');

const startCompanionJourney = (req, res) => {
  const userId = req.user?.id || 'usr-student-001';
  const userName = req.user?.name || 'Ananya Sharma';

  const {
    destinationName,
    startLocationName,
    durationMinutes,
    latitude,
    longitude,
    shareWithContacts
  } = req.body;

  const duration = parseInt(durationMinutes, 10) || 30;
  const startTime = new Date();
  const expectedEndTime = new Date(startTime.getTime() + duration * 60 * 1000);
  const linkId = Math.random().toString(36).substring(2, 10);
  const liveShareUrl = `https://saferoute.app/track/${linkId}`;

  const journeyId = `JOURNEY-${Date.now()}`;
  const newJourney = {
    id: journeyId,
    userId,
    userName,
    destinationName: destinationName || 'Target Destination',
    startLocationName: startLocationName || 'Current Location',
    durationMinutes: duration,
    startTime: startTime.toISOString(),
    expectedEndTime: expectedEndTime.toISOString(),
    status: 'active', // 'active' | 'completed' | 'sos_triggered'
    liveShareUrl,
    shareWithContacts: !!shareWithContacts,
    lastCheckIn: startTime.toISOString(),
    startCoordinates: { latitude: latitude || 18.9298, longitude: longitude || 72.8333 }
  };

  dataStore.push('companionJourneys', newJourney);

  res.status(201).json({
    success: true,
    message: `Companion safety timer started for ${duration} minutes.`,
    journey: newJourney
  });
};

const checkIn = (req, res) => {
  const userId = req.user?.id || 'usr-student-001';
  const { journeyId, extendMinutes } = req.body;

  let journey = null;
  if (journeyId) {
    journey = dataStore.find('companionJourneys', j => j.id === journeyId);
  } else {
    journey = dataStore.find('companionJourneys', j => j.userId === userId && j.status === 'active');
  }

  if (!journey) {
    return res.status(404).json({ success: false, message: 'No active companion journey found.' });
  }

  const extension = parseInt(extendMinutes, 10) || 0;
  const currentEnd = new Date(journey.expectedEndTime);
  const newEndTime = new Date(currentEnd.getTime() + extension * 60 * 1000);

  const updated = dataStore.update(
    'companionJourneys',
    j => j.id === journey.id,
    j => ({
      ...j,
      lastCheckIn: new Date().toISOString(),
      expectedEndTime: newEndTime.toISOString(),
      durationMinutes: j.durationMinutes + extension
    })
  );

  res.json({
    success: true,
    message: 'Safety check-in verified. Timer extended.',
    journey: updated
  });
};

const completeJourney = (req, res) => {
  const userId = req.user?.id || 'usr-student-001';
  const { journeyId } = req.body;

  let journey = null;
  if (journeyId) {
    journey = dataStore.find('companionJourneys', j => j.id === journeyId);
  } else {
    journey = dataStore.find('companionJourneys', j => j.userId === userId && j.status === 'active');
  }

  if (!journey) {
    return res.status(404).json({ success: false, message: 'No active journey found to complete.' });
  }

  const updated = dataStore.update(
    'companionJourneys',
    j => j.id === journey.id,
    j => ({
      ...j,
      status: 'completed',
      completedAt: new Date().toISOString()
    })
  );

  res.json({
    success: true,
    message: 'Safely arrived at destination! Companion timer stopped.',
    journey: updated
  });
};

const expireJourney = (req, res) => {
  const userId = req.user?.id || 'usr-student-001';
  const { journeyId } = req.body;

  let journey = null;
  if (journeyId) {
    journey = dataStore.find('companionJourneys', j => j.id === journeyId);
  } else {
    journey = dataStore.find('companionJourneys', j => j.userId === userId && j.status === 'active');
  }

  if (!journey) {
    return res.status(404).json({ success: false, message: 'No active journey found.' });
  }

  // Auto trigger SOS for expired timer
  dataStore.update(
    'companionJourneys',
    j => j.id === journey.id,
    j => ({
      ...j,
      status: 'sos_triggered',
      expiredAt: new Date().toISOString()
    })
  );

  // Push emergency SOS session
  const sosId = `SOS-EXPIRED-${Date.now()}`;
  const sosSession = {
    id: sosId,
    userId,
    userName: journey.userName,
    mode: 'timer_expired',
    status: 'active',
    latitude: journey.startCoordinates?.latitude || 18.9298,
    longitude: journey.startCoordinates?.longitude || 72.8335,
    locationAddress: `Timer Expired En-Route to ${journey.destinationName}`,
    authorityAlerted: 'Campus Emergency Dispatch Control',
    triggeredAt: new Date().toISOString()
  };

  dataStore.push('sosSessions', sosSession);

  res.status(201).json({
    success: true,
    message: 'Companion timer expired without check-in! Emergency SOS triggered automatically.',
    sosSession
  });
};

const getStatus = (req, res) => {
  const userId = req.user?.id || 'usr-student-001';
  const activeJourney = dataStore.find('companionJourneys', j => j.userId === userId && j.status === 'active');

  res.json({
    success: true,
    hasActiveJourney: !!activeJourney,
    journey: activeJourney || null
  });
};

module.exports = {
  startCompanionJourney,
  checkIn,
  completeJourney,
  expireJourney,
  getStatus
};
