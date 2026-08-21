const dataStore = require('../store/dataStore');

const evaluateRisk = async (req, res) => {
  try {
    const { latitude, longitude, incidentsCount, timeOfDay } = req.body;

    const lat = parseFloat(latitude) || 18.9298;
    const lon = parseFloat(longitude) || 72.8335;
    const currentHour = new Date().getHours();
    const computedTimeOfDay = timeOfDay || (currentHour >= 20 || currentHour < 6 ? 'night' : 'day');

    // Query nearby incidents within ~300m radius
    const allIncidents = dataStore.get('incidents');
    const nearbyIncidents = allIncidents.filter(inc => {
      const iLat = inc.latitude || 18.9298;
      const iLon = inc.longitude || 72.8335;
      const dist = Math.sqrt(Math.pow(iLat - lat, 2) + Math.pow(iLon - lon, 2));
      return dist <= 0.003; // approx 300 meters
    });

    const count = incidentsCount !== undefined ? parseInt(incidentsCount, 10) : nearbyIncidents.length;

    // Try attempting connection to Python AI Microservice (Port 5001)
    let aiResponse = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout for microservice call

      const response = await fetch('http://127.0.0.1:5001/predict-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          incidents_count: count,
          time_of_day: computedTimeOfDay
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        aiResponse = await response.json();
      }
    } catch (err) {
      // Python AI service is offline or unreachable - standard fallback below
    }

    if (aiResponse && aiResponse.status === 'success') {
      return res.json({
        success: true,
        source: 'Python AI Microservice (RandomForest Model)',
        location: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        riskScore: aiResponse.risk_score,
        riskLevel: aiResponse.risk_level,
        factors: aiResponse.factors,
        nearbyIncidentsCount: count
      });
    }

    // Node-side algorithmic Risk Evaluation fallback
    let score = count * 22;
    if (computedTimeOfDay === 'night' || computedTimeOfDay === 'late_night') {
      score += 25;
    }

    const verifiedCount = nearbyIncidents.filter(i => i.status === 'Verified').length;
    score += verifiedCount * 10;

    score = Math.min(100, Math.max(10, score));

    let level = 'Low';
    if (score >= 75) level = 'Critical';
    else if (score >= 55) level = 'High';
    else if (score >= 35) level = 'Medium';

    const factors = [];
    if (count > 0) factors.push(`${count} incident report(s) logged in 300m radius`);
    if (verifiedCount > 0) factors.push(`${verifiedCount} authority-verified incident(s) near zone`);
    if (computedTimeOfDay === 'night') factors.push('Night-time elevated vulnerability factor (+25)');
    if (factors.length === 0) factors.push('Normal campus activity density, no recent high-severity reports');

    res.json({
      success: true,
      source: 'SafeRoute Algorithmic Risk Engine',
      location: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      riskScore: score,
      riskLevel: level,
      factors,
      nearbyIncidentsCount: count
    });
  } catch (err) {
    console.error('[RiskController.evaluateRisk] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to evaluate risk score' });
  }
};

const getRiskZones = (req, res) => {
  const incidents = dataStore.get('incidents');
  const riskZones = [
    {
      id: 'ZONE-POWAI-01',
      name: 'Powai Hostel 3 Lane',
      center: { latitude: 19.1334, longitude: 72.9133 },
      riskScore: 82,
      riskLevel: 'Critical',
      activeIncidents: 3,
      reason: 'Harassment activity & poor lighting reports'
    },
    {
      id: 'ZONE-KALINA-02',
      name: 'Kalina Gymkhana Pathway',
      center: { latitude: 19.0735, longitude: 72.8660 },
      riskScore: 65,
      riskLevel: 'High',
      activeIncidents: 2,
      reason: 'Unlit streetlights along walkway'
    },
    {
      id: 'ZONE-FORT-03',
      name: 'Fort Heritage Library Walk',
      center: { latitude: 18.9298, longitude: 72.8335 },
      riskScore: 42,
      riskLevel: 'Medium',
      activeIncidents: 1,
      reason: 'Isolated exit path after library hours'
    }
  ];

  res.json({
    success: true,
    count: riskZones.length,
    zones: riskZones
  });
};

const chat = async (req, res) => {
  try {
    const { message, latitude, longitude } = req.body;
    let aiResponse = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch('http://127.0.0.1:5001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, latitude, longitude }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        aiResponse = await response.json();
      }
    } catch (err) {
      // Python microservice offline - proceed with node fallback
    }

    if (aiResponse && aiResponse.status === 'success') {
      return res.json({
        success: true,
        source: 'Python Flask AI Microservice',
        title: aiResponse.title,
        reply: aiResponse.reply,
        actions: aiResponse.actions
      });
    }

    // Node-side AI response fallback
    const msg = (message || '').toLowerCase();
    if (msg.includes('sos') || msg.includes('danger') || msg.includes('unsafe') || msg.includes('help') || msg.includes('following')) {
      return res.json({
        success: true,
        source: 'SafeRoute AI Assistant',
        title: '🚨 Emergency Guidance',
        reply: 'If you feel threatened or unsafe:\n1. Tap the RED SOS button on the bottom menu to alert contacts & campus desk.\n2. Trigger a Fake Call to deter stalkers.\n3. Move toward a well-lit store or security checkpoint.\n4. Emergency Helpline: Call 112.',
        actions: [
          { label: 'Trigger SOS', action: 'sos' },
          { label: 'Start Fake Call', action: 'fake_call' },
          { label: 'Call 112', action: 'call_112' }
        ]
      });
    }

    res.json({
      success: true,
      source: 'SafeRoute AI Assistant',
      title: '🤖 SafeRoute AI Guard',
      reply: `I'm your 24/7 AI Safety Companion. You can ask me about safe walking routes, reporting hazards anonymously, or emergency SOS features.`,
      actions: [
        { label: 'Is my path safe?', action: 'check_risk' },
        { label: 'Report Hazard', action: 'open_report' },
        { label: 'Emergency Contacts', action: 'contacts' }
      ]
    });
  } catch (err) {
    console.error('[RiskController.chat] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to process AI chat query' });
  }
};

module.exports = {
  evaluateRisk,
  getRiskZones,
  chat
};

