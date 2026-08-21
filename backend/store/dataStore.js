const fs = require('fs');
const path = require('path');

const STORE_FILE = path.join(__dirname, '../database/db_store.json');

// Default initial state seeded with rich, realistic enterprise data
const INITIAL_STORE = {
  users: [
    {
      id: 'usr-student-001',
      name: 'Ananya Sharma',
      email: 'ananya@student.uom.edu',
      passwordHash: '$2a$10$e85S.sW.MockPasswordHashForDemo1234567890', // bcrypt hash placeholder
      phone: '+91 98200 11223',
      role: 'student',
      collegeId: 'col-uom',
      collegeName: 'University of Mumbai',
      campusId: 'camp-uom-fort',
      campusName: 'Fort Heritage Campus',
      homeAddress: 'Hostel 3, Kalina Campus, Mumbai',
      createdAt: '2026-08-01T10:00:00.000Z'
    },
    {
      id: 'usr-auth-001',
      name: 'Dr. M. Kulkarni',
      email: 'cso@uom.edu',
      passwordHash: '$2a$10$e85S.sW.MockPasswordHashForDemo1234567890',
      phone: '+91 98200 99887',
      role: 'college_authority',
      collegeId: 'col-uom',
      collegeName: 'University of Mumbai',
      campusId: 'camp-uom-fort',
      badgeNumber: 'AUTH-CSO-901',
      createdAt: '2026-08-01T10:00:00.000Z'
    },
    {
      id: 'usr-patrol-001',
      name: 'Captain R. Verma',
      email: 'patrol.alpha@uom.edu',
      passwordHash: '$2a$10$e85S.sW.MockPasswordHashForDemo1234567890',
      phone: '+91 98200 55443',
      role: 'security_team',
      collegeId: 'col-uom',
      assignedTeam: 'Fort Alpha Patrol',
      createdAt: '2026-08-01T10:00:00.000Z'
    },
    {
      id: 'usr-admin-001',
      name: 'Super Administrator',
      email: 'admin@saferoute.org',
      passwordHash: '$2a$10$e85S.sW.MockPasswordHashForDemo1234567890',
      phone: '+91 99999 00000',
      role: 'super_admin',
      createdAt: '2026-08-01T10:00:00.000Z'
    }
  ],
  contacts: [
    {
      id: 'cnt-101',
      userId: 'usr-student-001',
      name: 'Sunita Sharma (Mother)',
      phone: '+91 98201 11222',
      relation: 'Mother',
      isPrimary: true
    },
    {
      id: 'cnt-102',
      userId: 'usr-student-001',
      name: 'Rajesh Sharma (Father)',
      phone: '+91 98201 11223',
      relation: 'Father',
      isPrimary: false
    },
    {
      id: 'cnt-103',
      userId: 'usr-student-001',
      name: 'Hostel 3 Warden Desk',
      phone: '+91 98200 88776',
      relation: 'Campus Warden',
      isPrimary: false
    }
  ],
  incidents: [
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
      media: {
        photos: ['/uploads/incidents/demo_photo1.jpg'],
        videos: [],
        audio: ['/uploads/incidents/demo_audio1.mp3']
      },
      history: [
        {
          id: 'HIST-101',
          timestamp: '2026-08-19 18:30',
          stage: 'Submitted',
          actionName: 'Report Logged',
          performedBy: 'Anonymous Citizen',
          remarks: 'Report registered via SafeRoute Mobile App.'
        },
        {
          id: 'HIST-102',
          timestamp: '2026-08-19 18:45',
          stage: 'Under Review',
          actionName: 'Placed Under Review',
          performedBy: 'Officer V. Kadam (Fort Security)',
          remarks: 'Initial review initiated. Security desk reviewing CCTV footage.',
          assignedTo: 'Fort Alpha Patrol'
        }
      ],
      createdAt: '2026-08-19T13:00:00.000Z'
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
        {
          id: 'HIST-201',
          timestamp: '2026-08-19 19:15',
          stage: 'Submitted',
          actionName: 'Report Submitted',
          performedBy: 'Ananya Sharma'
        },
        {
          id: 'HIST-202',
          timestamp: '2026-08-19 19:40',
          stage: 'Verified',
          actionName: 'Report Verified',
          performedBy: 'CSO M. Kulkarni',
          remarks: 'Verified by patrol officer on duty.'
        }
      ],
      createdAt: '2026-08-19T13:45:00.000Z'
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
        {
          id: 'HIST-301',
          timestamp: '2026-08-19 21:00',
          stage: 'Submitted',
          actionName: 'Report Logged',
          performedBy: 'Anonymous Citizen',
          remarks: 'Report registered via SafeRoute Mobile App.'
        }
      ],
      createdAt: '2026-08-19T15:30:00.000Z'
    }
  ],
  sosSessions: [
    {
      id: 'SOS-20260821-001',
      userId: 'usr-student-001',
      userName: 'Ananya Sharma',
      userPhone: '+91 98200 11223',
      collegeId: 'col-uom',
      mode: 'instant',
      status: 'resolved',
      latitude: 18.9298,
      longitude: 72.8335,
      locationAddress: 'Fort Campus, Near Main Library',
      batteryLevel: '78%',
      contactsNotified: [
        { name: 'Sunita Sharma (Mother)', phone: '+91 98201 11222', status: 'Sent' },
        { name: 'Rajesh Sharma (Father)', phone: '+91 98201 11223', status: 'Sent' }
      ],
      authorityAlerted: 'Fort Campus Patrol Desk',
      triggeredAt: '2026-08-20T21:15:00.000Z',
      resolvedAt: '2026-08-20T21:25:00.000Z',
      resolutionNotes: 'User confirmed safe after security squad reached site.'
    }
  ],
  companionJourneys: [],
  alerts: [
    {
      id: 'ALERT-101',
      title: '📢 Night Escort Safety Patrol Active',
      category: 'Campus Announcement',
      channel: 'announcement',
      desc: 'Campus security mobile escort patrols are active across Fort & Kalina campuses between 7 PM and 6 AM. Request escort via app.',
      type: 'info',
      severity: 'Low',
      time: 'Just now',
      createdAt: new Date().toISOString()
    },
    {
      id: 'ALERT-102',
      title: '⚠️ Caution: Poor Lighting on Gymkhana Path',
      category: 'High-Risk Area Cluster',
      channel: 'hazard',
      desc: 'Multiple reports of unlit streetlights near Kalina Gymkhana. Maintenance dispatched. Use main illuminated road.',
      type: 'warning',
      severity: 'Medium',
      time: '15 mins ago',
      createdAt: new Date().toISOString()
    },
    {
      id: 'ALERT-103',
      title: '🚨 Verified Security Patrol Update: Hostel 3 Gate',
      category: 'Verified Incidents',
      channel: 'incident',
      desc: 'Chief Security Officer verified report near Hostel 3. Patrol Alpha squad stationed in area.',
      type: 'danger',
      severity: 'High',
      time: '1 hour ago',
      createdAt: new Date().toISOString()
    }
  ],
  colleges: [
    {
      id: 'col-uom',
      name: 'University of Mumbai',
      shortName: 'UoM',
      city: 'Mumbai',
      state: 'Maharashtra',
      icon: 'university',
      color: '#1E40AF',
      campuses: [
        {
          id: 'camp-uom-fort',
          name: 'Fort Heritage Campus',
          location: 'Fort, South Mumbai',
          latitude: 18.9298,
          longitude: 72.8333,
          radius: 800
        },
        {
          id: 'camp-uom-kalina',
          name: 'Kalina Vidyanagari Campus',
          location: 'Kalina, Santacruz East, Mumbai',
          latitude: 19.0734,
          longitude: 72.8631,
          radius: 1200
        }
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
      state: 'Maharashtra',
      icon: 'academic',
      color: '#047857',
      campuses: [
        {
          id: 'camp-iitb-powai',
          name: 'Powai Main Campus',
          location: 'Powai, Mumbai',
          latitude: 19.1334,
          longitude: 72.9133,
          radius: 1500
        }
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
  ]
};

const User = require('../models/User');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');
const College = require('../models/College');
const SOS = require('../models/SOS');
const Companion = require('../models/Companion');
const { isMongoDBConnected } = require('../config/db');

const MODEL_MAP = {
  users: User,
  incidents: Incident,
  alerts: Alert,
  colleges: College,
  sosSessions: SOS,
  companionJourneys: Companion
};

class DataStore {
  constructor() {
    this.data = this.loadStore();
    this.initMongoSync();
  }

  loadStore() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[DataStore] Failed to load JSON file, falling back to initial store:', err.message);
    }
    return INITIAL_STORE;
  }

  saveStore() {
    try {
      const dir = path.dirname(STORE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('[DataStore] Failed to persist data to file:', err.message);
    }
  }

  async initMongoSync() {
    try {
      setTimeout(async () => {
        if (isMongoDBConnected()) {
          console.log('[DataStore]: Syncing existing memory store to MongoDB Atlas...');
          for (const [colName, Model] of Object.entries(MODEL_MAP)) {
            const items = this.data[colName] || [];
            for (const item of items) {
              if (item && item.id) {
                await Model.findOneAndUpdate({ id: item.id }, item, { upsert: true, new: true }).catch(() => {});
              }
            }
          }
          console.log('[DataStore]: MongoDB Atlas initial sync completed! ✅');
        }
      }, 2000);
    } catch (e) {}
  }

  get(collectionName) {
    return this.data[collectionName] || [];
  }

  set(collectionName, items) {
    this.data[collectionName] = items;
    this.saveStore();
    this.syncMongoBatch(collectionName, items);
  }

  find(collectionName, predicate) {
    return (this.data[collectionName] || []).find(predicate);
  }

  filter(collectionName, predicate) {
    return (this.data[collectionName] || []).filter(predicate);
  }

  push(collectionName, item) {
    if (!this.data[collectionName]) {
      this.data[collectionName] = [];
    }
    this.data[collectionName].unshift(item);
    this.saveStore();
    this.syncMongoItem(collectionName, item);
    return item;
  }

  update(collectionName, predicate, updateFn) {
    let updatedItem = null;
    if (this.data[collectionName]) {
      this.data[collectionName] = this.data[collectionName].map(item => {
        if (predicate(item)) {
          updatedItem = updateFn(item);
          return updatedItem;
        }
        return item;
      });
      this.saveStore();
      if (updatedItem) {
        this.syncMongoItem(collectionName, updatedItem);
      }
    }
    return updatedItem;
  }

  delete(collectionName, predicate) {
    if (this.data[collectionName]) {
      const toDelete = this.data[collectionName].filter(predicate);
      this.data[collectionName] = this.data[collectionName].filter(item => !predicate(item));
      this.saveStore();
      
      const Model = MODEL_MAP[collectionName];
      if (Model && isMongoDBConnected()) {
        toDelete.forEach(item => {
          if (item && item.id) {
            Model.deleteOne({ id: item.id }).catch(() => {});
          }
        });
      }
    }
  }

  async syncMongoItem(collectionName, item) {
    try {
      const Model = MODEL_MAP[collectionName];
      if (Model && isMongoDBConnected() && item && item.id) {
        await Model.findOneAndUpdate({ id: item.id }, item, { upsert: true, new: true }).catch(() => {});
      }
    } catch (e) {}
  }

  async syncMongoBatch(collectionName, items) {
    try {
      const Model = MODEL_MAP[collectionName];
      if (Model && isMongoDBConnected() && Array.isArray(items)) {
        for (const item of items) {
          if (item && item.id) {
            await Model.findOneAndUpdate({ id: item.id }, item, { upsert: true }).catch(() => {});
          }
        }
      }
    } catch (e) {}
  }
}

module.exports = new DataStore();

