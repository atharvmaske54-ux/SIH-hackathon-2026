const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userName: { type: String },
  userPhone: { type: String },
  latitude: { type: Number, default: 18.9298 },
  longitude: { type: Number, default: 72.8335 },
  locationName: { type: String },
  status: { type: String, enum: ['ACTIVE', 'DISPATCHED', 'RESOLVED', 'CANCELLED'], default: 'ACTIVE' },
  timestamp: { type: String, default: () => new Date().toLocaleString() },
  history: [mongoose.Schema.Types.Mixed],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SOS', sosSchema);
