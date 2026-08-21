const mongoose = require('mongoose');

const historyEntrySchema = new mongoose.Schema({
  id: String,
  timestamp: String,
  stage: String,
  actionName: String,
  performedBy: String,
  remarks: String,
  assignedTo: String,
  requestedInfo: String
}, { _id: false });

const incidentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  latitude: { type: Number, default: 18.9298 },
  longitude: { type: Number, default: 72.8335 },
  dateTime: { type: String, default: () => new Date().toLocaleString() },
  isAnonymous: { type: Boolean, default: true },
  reporterId: { type: String, default: 'usr-student-001' },
  reporterName: { type: String, default: 'Anonymous Citizen' },
  authorityEncryptedIdentity: { type: String },
  collegeId: { type: String, default: 'col-uom' },
  collegeName: { type: String, default: 'University of Mumbai' },
  campusId: { type: String, default: 'camp-uom-fort' },
  campusName: { type: String, default: 'Fort Heritage Campus' },
  status: { type: String, enum: ['Pending', 'Verified', 'Resolved', 'Rejected'], default: 'Pending' },
  workflowStage: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Verified', 'Rejected', 'Action Taken', 'Resolved'],
    default: 'Submitted'
  },
  assignedAuthority: { type: String, default: 'Campus Security Central Desk' },
  assignedPersonOrTeam: { type: String },
  responseStatus: {
    type: String,
    enum: ['Not Started', 'In Progress', 'On Scene', 'Action Completed', 'Resolved'],
    default: 'Not Started'
  },
  responseNotes: { type: String },
  actionTaken: { type: String },
  resolutionDetails: { type: String },
  resolutionDate: { type: String },
  remarks: { type: String },
  requestedInfoNote: { type: String },
  media: {
    photos: [String],
    videos: [String],
    audio: [String]
  },
  history: [historyEntrySchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Incident', incidentSchema);
