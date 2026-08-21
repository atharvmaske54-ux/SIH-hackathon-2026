const mongoose = require('mongoose');

const companionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userName: { type: String },
  destination: { type: String },
  durationMinutes: { type: Number, default: 15 },
  startTime: { type: String },
  expectedEndTime: { type: String },
  status: { type: String, enum: ['ACTIVE', 'CHECKED_IN', 'COMPLETED', 'EXPIRED', 'ALARM'], default: 'ACTIVE' },
  lastLocation: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Companion', companionSchema);
