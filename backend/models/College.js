const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  shortName: { type: String, required: true },
  city: { type: String },
  color: { type: String, default: '#E11D48' },
  icon: { type: String, default: 'university' },
  campuses: [mongoose.Schema.Types.Mixed],
  departments: [mongoose.Schema.Types.Mixed],
  securityTeams: [mongoose.Schema.Types.Mixed],
  authorities: [mongoose.Schema.Types.Mixed],
  emergencyHotlines: [mongoose.Schema.Types.Mixed],
  safetyZones: [mongoose.Schema.Types.Mixed],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('College', collegeSchema);
