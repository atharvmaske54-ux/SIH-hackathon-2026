const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}
dns.setDefaultResultOrder('ipv4first');

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../../models/User');
const Incident = require('../../models/Incident');
const Alert = require('../../models/Alert');
const College = require('../../models/College');
const SOS = require('../../models/SOS');
const Companion = require('../../models/Companion');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://atharvmaske54_db_user:O3FBWxGtrjDKYQLS@cluster0.f1aduhb.mongodb.net/women_safety_db?retryWrites=true&w=majority&appName=Cluster0';

const SEED_USERS = [
  {
    id: 'usr-student-001',
    name: 'Ananya Sharma',
    email: 'ananya@student.uom.edu',
    password: '$2a$10$e85S.sW.MockPasswordHashForDemo1234567890',
    phone: '+91 98200 11223',
    role: 'student',
    collegeId: 'col-uom',
    collegeName: 'University of Mumbai',
    campusId: 'camp-uom-fort',
    campusName: 'Fort Heritage Campus',
    emergencyContacts: [
      { id: 'cnt-101', name: 'Sunita Sharma (Mother)', phone: '+91 98201 11222', relation: 'Mother' },
      { id: 'cnt-102', name: 'Rajesh Sharma (Father)', phone: '+91 98201 11223', relation: 'Father' }
    ]
  },
  {
    id: 'usr-auth-001',
    name: 'Dr. M. Kulkarni',
    email: 'cso@uom.edu',
    password: '$2a$10$e85S.sW.MockPasswordHashForDemo1234567890',
    phone: '+91 98200 99887',
    role: 'college_authority',
    collegeId: 'col-uom',
    collegeName: 'University of Mumbai',
    campusId: 'camp-uom-fort'
  },
  {
    id: 'usr-patrol-001',
    name: 'Captain R. Verma',
    email: 'patrol.alpha@uom.edu',
    password: '$2a$10$e85S.sW.MockPasswordHashForDemo1234567890',
    phone: '+91 98200 55443',
    role: 'security_team',
    collegeId: 'col-uom',
    assignedTeam: 'Fort Alpha Patrol'
  },
  {
    id: 'usr-admin-001',
    name: 'Super Administrator',
    email: 'admin@saferoute.org',
    password: '$2a$10$e85S.sW.MockPasswordHashForDemo1234567890',
    phone: '+91 99999 00000',
    role: 'super_admin'
  }
];

const SEED_INCIDENTS = [
  {
    id: 'INC-20260819-1021',
    type: 'Harassment',
    description: 'Verbal harassment reported near library south exit during evening hours.',
    location: 'Fort Campus, Near Main Library',
    latitude: 18.9298,
    longitude: 72.8335,
    dateTime: '2026-08-19 18:30',
    isAnonymous: true,
    reporterId: 'usr-student-001',
    reporterName: 'Anonymous Citizen',
    authorityEncryptedIdentity: 'ENC-AUTH-TOKEN[YW5hbnlhQHN0dWRlbnQudW9tLmVkdQ==]',
    collegeId: 'col-uom',
    collegeName: 'University of Mumbai',
    campusId: 'camp-uom-fort',
    campusName: 'Fort Heritage Campus',
    status: 'Pending',
    workflowStage: 'Under Review',
    assignedAuthority: 'Fort Campus Security Desk',
    assignedPersonOrTeam: 'Fort Alpha Patrol',
    responseStatus: 'In Progress',
    responseNotes: 'Officer V. Kadam reviewing CCTV feeds from library south exit.',
    actionTaken: 'Security desk initiated video analysis and increased foot patrols.',
    remarks: 'Initial review initiated by campus security team.',
    media: { photos: ['/uploads/incidents/demo_photo1.jpg'], videos: [], audio: ['/uploads/incidents/demo_audio1.mp3'] },
    history: [
      { id: 'HIST-101', timestamp: '2026-08-19 18:30', stage: 'Submitted', actionName: 'Report Logged', performedBy: 'Anonymous Citizen', remarks: 'Report registered via SafeRoute Mobile App.' },
      { id: 'HIST-102', timestamp: '2026-08-19 18:45', stage: 'Under Review', actionName: 'Placed Under Review', performedBy: 'Officer V. Kadam (Fort Security)', remarks: 'Initial review initiated.', assignedTo: 'Fort Alpha Patrol' }
    ]
  },
  {
    id: 'INC-20260819-3042',
    type: 'Poor Lighting',
    description: 'Streetlights unlit along walkway behind Gymkhana leading to hostel lane.',
    location: 'Kalina Campus, Gymkhana Path',
    latitude: 19.0735,
    longitude: 72.8660,
    dateTime: '2026-08-19 19:15',
    isAnonymous: false,
    reporterId: 'usr-student-001',
    reporterName: 'Ananya Sharma',
    authorityEncryptedIdentity: 'ananya@student.uom.edu',
    collegeId: 'col-uom',
    collegeName: 'University of Mumbai',
    campusId: 'camp-uom-kalina',
    campusName: 'Kalina Vidyanagari Campus',
    status: 'Verified',
    workflowStage: 'Verified',
    assignedAuthority: 'Electrical & Facilities Maintenance Dept',
    assignedPersonOrTeam: 'Kalina Campus Patrol',
    responseStatus: 'In Progress',
    responseNotes: 'Maintenance team dispatched with temporary LED floodlight units.',
    actionTaken: 'Temporary LED floodlights deployed along walkway.',
    remarks: 'Verified by patrol officer on duty.',
    media: { photos: [], videos: [], audio: [] },
    history: [
      { id: 'HIST-201', timestamp: '2026-08-19 19:15', stage: 'Submitted', actionName: 'Report Submitted', performedBy: 'Ananya Sharma' },
      { id: 'HIST-202', timestamp: '2026-08-19 19:40', stage: 'Verified', actionName: 'Report Verified', performedBy: 'CSO M. Kulkarni', remarks: 'Verified by patrol officer on duty.' }
    ]
  },
  {
    id: 'INC-20260819-4891',
    type: 'Suspicious Activity',
    description: 'Unidentified individuals loitering near Powai Lake gate after 9 PM.',
    location: 'Powai Main Campus, Lake View Road',
    latitude: 19.1340,
    longitude: 72.9140,
    dateTime: '2026-08-19 21:00',
    isAnonymous: true,
    reporterId: 'usr-student-002',
    reporterName: 'Anonymous Citizen',
    authorityEncryptedIdentity: 'ENC-AUTH-TOKEN[c3R1ZGVudDJAaWl0Yi5hYy5pbg==]',
    collegeId: 'col-iitb',
    collegeName: 'Indian Institute of Technology Bombay',
    campusId: 'camp-iitb-powai',
    campusName: 'Powai Main Campus',
    status: 'Pending',
    workflowStage: 'Submitted',
    responseStatus: 'Not Started',
    media: { photos: [], videos: [], audio: [] },
    history: [
      { id: 'HIST-301', timestamp: '2026-08-19 21:00', stage: 'Submitted', actionName: 'Report Logged', performedBy: 'Anonymous Citizen', remarks: 'Report registered via SafeRoute Mobile App.' }
    ]
  }
];

const SEED_ALERTS = [
  {
    id: 'ALERT-101',
    title: '📢 Night Escort Safety Patrol Active',
    category: 'Campus Announcement',
    channel: 'announcement',
    desc: 'Campus security mobile escort patrols are active across Fort & Kalina campuses between 7 PM and 6 AM.',
    type: 'info',
    severity: 'Low',
    time: 'Just now'
  },
  {
    id: 'ALERT-102',
    title: '⚠️ Caution: Poor Lighting on Gymkhana Path',
    category: 'High-Risk Area Cluster',
    channel: 'hazard',
    desc: 'Multiple reports of unlit streetlights near Kalina Gymkhana. Maintenance dispatched.',
    type: 'warning',
    severity: 'Medium',
    time: '15 mins ago'
  },
  {
    id: 'ALERT-103',
    title: '🚨 Verified Security Patrol Update: Hostel 3 Gate',
    category: 'Verified Incidents',
    channel: 'incident',
    desc: 'Chief Security Officer verified report near Hostel 3. Patrol Alpha squad stationed in area.',
    type: 'danger',
    severity: 'High',
    time: '1 hour ago'
  }
];

const SEED_COLLEGES = [
  {
    id: 'col-uom',
    name: 'University of Mumbai',
    shortName: 'UoM',
    city: 'Mumbai',
    color: '#1E40AF',
    icon: 'university',
    campuses: [
      { id: 'camp-uom-fort', name: 'Fort Heritage Campus', location: 'Fort, South Mumbai', latitude: 18.9298, longitude: 72.8333, radius: 800 },
      { id: 'camp-uom-kalina', name: 'Kalina Vidyanagari Campus', location: 'Kalina, Santacruz East, Mumbai', latitude: 19.0734, longitude: 72.8631, radius: 1200 }
    ],
    departments: [
      { id: 'dept-uom-law', name: 'Faculty of Law' },
      { id: 'dept-uom-sci', name: 'School of Science & Tech' }
    ],
    securityTeams: [
      { id: 'sec-uom-1', name: 'Fort Alpha Patrol', leader: 'Officer R. Sharma', contact: '+91 98200 11223' },
      { id: 'sec-uom-2', name: 'Kalina Night Squad', leader: 'Officer S. Patil', contact: '+91 98200 44556' }
    ],
    emergencyHotlines: [
      { title: 'Campus Emergency Helpline', phone: '+91 98200 00911', available: '24/7' },
      { title: 'Women Safety Cell', phone: '+91 98200 001091', available: '24/7' }
    ]
  },
  {
    id: 'col-iitb',
    name: 'Indian Institute of Technology Bombay',
    shortName: 'IITB',
    city: 'Mumbai',
    color: '#047857',
    icon: 'academic',
    campuses: [
      { id: 'camp-iitb-powai', name: 'Powai Main Campus', location: 'Powai, Mumbai', latitude: 19.1334, longitude: 72.9133, radius: 1500 }
    ],
    departments: [
      { id: 'dept-iitb-cs', name: 'Computer Science & Eng' }
    ],
    securityTeams: [
      { id: 'sec-iitb-1', name: 'Powai Quick Response Squad', leader: 'Chief K. Singh', contact: '+91 98200 77889' }
    ],
    emergencyHotlines: [
      { title: 'IITB Security Control Room', phone: '+91 22 2576 1100', available: '24/7' }
    ]
  }
];

async function seedMongoDB() {
  try {
    console.log(`📡 Connecting to MongoDB Atlas: ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Atlas Connection Established!');

    // Seed Users
    await User.deleteMany({});
    await User.insertMany(SEED_USERS);
    console.log(`👤 Seeded ${SEED_USERS.length} Users into MongoDB Atlas`);

    // Seed Incidents
    await Incident.deleteMany({});
    await Incident.insertMany(SEED_INCIDENTS);
    console.log(`🚨 Seeded ${SEED_INCIDENTS.length} Incident Reports into MongoDB Atlas`);

    // Seed Alerts
    await Alert.deleteMany({});
    await Alert.insertMany(SEED_ALERTS);
    console.log(`📢 Seeded ${SEED_ALERTS.length} Alerts into MongoDB Atlas`);

    // Seed Colleges
    await College.deleteMany({});
    await College.insertMany(SEED_COLLEGES);
    console.log(`🏫 Seeded ${SEED_COLLEGES.length} Colleges into MongoDB Atlas`);

    console.log('🎉 MongoDB Atlas Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ MongoDB Atlas Seeding Error:', err);
    process.exit(1);
  }
}

seedMongoDB();
