const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, default: 'General Safety' },
  channel: { type: String, default: 'incident' },
  desc: { type: String, required: true },
  type: { type: String, enum: ['danger', 'warning', 'info', 'success'], default: 'danger' },
  severity: { type: String, enum: ['High', 'Medium', 'Low', 'Critical'], default: 'High' },
  time: { type: String, default: 'Just now' },
  reportId: { type: String },
  collegeId: { type: String },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);
