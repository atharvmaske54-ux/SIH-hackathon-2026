const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['student', 'college_authority', 'security_team', 'super_admin'],
    default: 'student'
  },
  collegeId: { type: String, default: 'col-uom' },
  collegeName: { type: String, default: 'University of Mumbai' },
  campusId: { type: String, default: 'camp-uom-fort' },
  campusName: { type: String, default: 'Fort Heritage Campus' },
  departmentId: { type: String },
  assignedTeam: { type: String },
  emergencyContacts: [
    {
      id: String,
      name: String,
      phone: String,
      relation: String
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
