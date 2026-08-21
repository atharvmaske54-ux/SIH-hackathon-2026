const dataStore = require('../store/dataStore');

const getIncidents = (req, res) => {
  const { collegeId, campusId, category, status, workflowStage, isAnonymous } = req.query;
  let incidents = dataStore.get('incidents');

  if (collegeId) {
    incidents = incidents.filter(i => i.collegeId === collegeId);
  }
  if (campusId) {
    incidents = incidents.filter(i => i.campusId === campusId);
  }
  if (category) {
    incidents = incidents.filter(i => i.type.toLowerCase() === category.toLowerCase());
  }
  if (status) {
    incidents = incidents.filter(i => i.status.toLowerCase() === status.toLowerCase());
  }
  if (workflowStage) {
    incidents = incidents.filter(i => i.workflowStage.toLowerCase() === workflowStage.toLowerCase());
  }
  if (isAnonymous !== undefined) {
    const isAnon = isAnonymous === 'true';
    incidents = incidents.filter(i => i.isAnonymous === isAnon);
  }

  res.json({
    success: true,
    count: incidents.length,
    data: incidents
  });
};

const getMyReports = (req, res) => {
  const userId = req.user?.id || 'usr-student-001';
  const myIncidents = dataStore.filter('incidents', i => i.reporterId === userId || i.reporterId === 'usr-student-001');

  res.json({
    success: true,
    count: myIncidents.length,
    data: myIncidents
  });
};

const getIncidentById = (req, res) => {
  const { id } = req.params;
  const incident = dataStore.find('incidents', i => i.id === id);

  if (!incident) {
    return res.status(404).json({ success: false, message: 'Incident report not found' });
  }

  res.json({ success: true, data: incident });
};

const createIncident = (req, res) => {
  try {
    const userId = req.user?.id || 'usr-student-001';
    const userName = req.user?.name || 'Jane Student';
    const userContact = req.user?.email || req.user?.phone || 'student@saferoute.edu';

    const {
      type,
      description,
      location,
      latitude,
      longitude,
      isAnonymous,
      collegeId,
      collegeName,
      campusId,
      campusName
    } = req.body;

    const isAnon = isAnonymous === true || isAnonymous === 'true';

    // Handle file evidence uploads if present
    const photoFiles = req.files && req.files.photo ? req.files.photo.map(f => `/uploads/incidents/${f.filename}`) : [];
    const videoFiles = req.files && req.files.video ? req.files.video.map(f => `/uploads/incidents/${f.filename}`) : [];
    const audioFiles = req.files && req.files.audio ? req.files.audio.map(f => `/uploads/incidents/${f.filename}`) : [];

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const incidentId = `INC-${todayStr}-${randomCode}`;

    // Cryptographic Anonymity Token Generation
    const cryptoAuthToken = `ENC-AUTH-TOKEN[${Buffer.from(userContact).toString('base64')}]`;

    const college = dataStore.find('colleges', c => c.id === collegeId) || dataStore.get('colleges')[0];

    const initHistoryEntry = {
      id: `HIST-${Date.now()}-INIT`,
      timestamp: new Date().toLocaleString(),
      stage: 'Submitted',
      actionName: 'Report Registered',
      performedBy: isAnon ? 'Anonymous Citizen' : userName,
      remarks: 'Incident report submitted via SafeRoute User Mobile App.'
    };

    const newIncident = {
      id: incidentId,
      type: type || 'General Safety Hazard',
      description: description || 'No detailed description provided',
      location: location || 'Campus Location',
      latitude: parseFloat(latitude) || 18.9298,
      longitude: parseFloat(longitude) || 72.8335,
      dateTime: new Date().toLocaleString(),
      isAnonymous: isAnon,
      reporterId: userId,
      reporterName: isAnon ? 'Anonymous Citizen' : userName,
      authorityEncryptedIdentity: isAnon ? cryptoAuthToken : userContact,
      collegeId: collegeId || (college ? college.id : 'col-uom'),
      collegeName: collegeName || (college ? college.name : 'University of Mumbai'),
      campusId: campusId || 'camp-uom-fort',
      campusName: campusName || 'Fort Heritage Campus',
      status: 'Pending',
      workflowStage: 'Submitted',
      assignedAuthority: 'Campus Security Central Desk',
      responseStatus: 'Not Started',
      media: {
        photos: photoFiles,
        videos: videoFiles,
        audio: audioFiles
      },
      history: [initHistoryEntry],
      createdAt: new Date().toISOString()
    };

    dataStore.push('incidents', newIncident);

    // Auto generate community alert if high severity incident category
    if (['Sexual Harassment', 'Stalking', 'Physical Threat'].includes(type)) {
      dataStore.push('alerts', {
        id: `ALERT-INC-${Date.now()}`,
        title: `🚨 Incident Reported: ${type}`,
        category: 'Verified Incidents',
        channel: 'incident',
        desc: `New report near ${newIncident.location}. Campus security team notified.`,
        type: 'danger',
        severity: 'High',
        time: 'Just now',
        createdAt: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Incident report submitted successfully',
      data: newIncident
    });
  } catch (err) {
    console.error('[IncidentController.createIncident] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to create incident report' });
  }
};

const updateIncidentWorkflow = (req, res) => {
  const { id } = req.params;
  const {
    stage,
    workflowStage,
    actionName,
    remarks,
    assignedTo,
    assignedSecuritySquad,
    assignedPersonOrTeam,
    requestedInfo,
    responseStatus,
    responseNotes,
    actionTaken,
    resolutionDetails,
    performedBy
  } = req.body;

  const targetStage = stage || workflowStage;
  const targetAssigned = assignedTo || assignedSecuritySquad || assignedPersonOrTeam;
  const targetUser = performedBy || req.user?.name || 'Authority Command Desk';

  const incident = dataStore.find('incidents', i => i.id === id);
  if (!incident) {
    return res.status(404).json({ success: false, message: 'Incident not found' });
  }

  const updatedIncident = dataStore.update(
    'incidents',
    i => i.id === id,
    i => {
      const historyLog = [...(i.history || [])];
      let newOverallStatus = i.status;

      if (targetStage || responseStatus) {
        if (targetStage === 'Verified') newOverallStatus = 'Verified';
        else if (targetStage === 'Resolved' || responseStatus === 'Resolved') newOverallStatus = 'Resolved';
        else if (targetStage === 'Rejected') newOverallStatus = 'Pending';
        else if (targetStage === 'Action Taken') newOverallStatus = 'Verified';

        const nowTs = new Date().toLocaleString();
        historyLog.push({
          id: `HIST-${Date.now()}`,
          timestamp: nowTs,
          stage: targetStage || i.workflowStage || 'Under Review',
          actionName: actionName || (responseStatus ? `Response: ${responseStatus}` : `Workflow: ${targetStage}`),
          performedBy: targetUser,
          remarks: remarks || responseNotes || actionTaken || `Updated by ${targetUser}`,
          assignedTo: targetAssigned || i.assignedPersonOrTeam,
          requestedInfo: requestedInfo || i.requestedInfoNote
        });
      }

      return {
        ...i,
        status: newOverallStatus,
        workflowStage: targetStage || i.workflowStage,
        assignedPersonOrTeam: targetAssigned || i.assignedPersonOrTeam,
        assignedAuthority: targetAssigned || i.assignedAuthority,
        responseStatus: responseStatus || i.responseStatus,
        responseNotes: responseNotes || i.responseNotes,
        actionTaken: actionTaken || i.actionTaken,
        resolutionDetails: resolutionDetails || i.resolutionDetails,
        resolutionDate: (targetStage === 'Resolved' || responseStatus === 'Resolved') ? new Date().toLocaleString() : i.resolutionDate,
        remarks: remarks || i.remarks,
        requestedInfoNote: requestedInfo || i.requestedInfoNote,
        history: historyLog
      };
    }
  );

  // If incident is verified, ensure broadcast community alert exists
  if (targetStage === 'Verified') {
    const existingAlert = dataStore.find('alerts', a => a.reportId === id || (a.id && a.id.includes(id)));
    if (!existingAlert) {
      dataStore.push('alerts', {
        id: `ALERT-INC-${id}`,
        title: `🟢 Verified Alert: ${updatedIncident.type}`,
        category: updatedIncident.type,
        channel: 'incident',
        desc: `Verified incident near ${updatedIncident.location}.${targetAssigned ? ` Assigned Unit: ${targetAssigned}` : ''}`,
        type: 'danger',
        severity: 'High',
        time: 'Just now',
        reportId: id,
        collegeId: updatedIncident.collegeId,
        createdAt: new Date().toISOString()
      });
    }
  }

  res.json({
    success: true,
    message: 'Incident workflow stage updated successfully',
    data: updatedIncident
  });
};

module.exports = {
  getIncidents,
  getMyReports,
  getIncidentById,
  createIncident,
  updateIncidentWorkflow
};
