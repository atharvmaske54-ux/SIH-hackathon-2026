const dataStore = require('../store/dataStore');

const getAlerts = (req, res) => {
  const { channel, severity, type } = req.query;
  let alerts = dataStore.get('alerts');

  if (channel) {
    alerts = alerts.filter(a => a.channel === channel || a.category.toLowerCase().includes(channel.toLowerCase()));
  }
  if (severity) {
    alerts = alerts.filter(a => a.severity.toLowerCase() === severity.toLowerCase());
  }
  if (type) {
    alerts = alerts.filter(a => a.type.toLowerCase() === type.toLowerCase());
  }

  res.json({
    success: true,
    count: alerts.length,
    alerts
  });
};

const createAlert = (req, res) => {
  const { title, category, channel, desc, type, severity } = req.body;

  if (!title || !desc) {
    return res.status(400).json({ success: false, message: 'Title and description are required for safety alerts.' });
  }

  const newAlert = {
    id: `ALERT-${Date.now()}`,
    title,
    category: category || 'Official Campus Safety Announcement',
    channel: channel || 'announcement',
    desc,
    type: type || 'info', // 'info' | 'warning' | 'danger'
    severity: severity || 'Medium',
    time: 'Just now',
    createdAt: new Date().toISOString()
  };

  dataStore.push('alerts', newAlert);

  res.status(201).json({
    success: true,
    message: 'Safety alert broadcasted to community.',
    alert: newAlert
  });
};

const markAsRead = (req, res) => {
  const { alertId } = req.body;
  res.json({
    success: true,
    message: `Alert ${alertId || 'all'} marked as read.`
  });
};

module.exports = {
  getAlerts,
  createAlert,
  markAsRead
};
