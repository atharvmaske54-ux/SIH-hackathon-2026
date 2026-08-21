import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
  Linking,
  Platform,
  Switch,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppContext, IncidentReport, VerificationHistoryEntry } from '../context/AppContext';
import { INCIDENT_CATEGORIES } from '../constants/Categories';
import {
  College,
  Campus,
  Department,
  SecurityTeam,
  AuthorizedAuthority,
  EmergencyContact,
  CampusSafetyZone,
} from '../constants/Colleges';
import { UserRole, hasPermission, ROLE_DETAILS, protectApiCall } from '../utils/rbac';

export default function AuthorityDashboardScreen() {
  const styles = getStyles();
  const router = useRouter();
  const {
    user,
    switchUserRole,
    reports,
    updateReportStatus,
    updateVerificationWorkflow,
    updateAuthorityResponse,
    colleges,
    addCollege,
    addCampus,
    addDepartment,
    addSecurityTeam,
    addAuthorizedAuthority,
    addEmergencyContact,
    addCampusSafetyZone,
    selectedCollegeId,
    setSelectedCollegeId,
    selectedCampusId,
    setSelectedCampusId,
    isAdminAuthenticated,
    logoutAdmin,
  } = useAppContext();

  useEffect(() => {
    if (!isAdminAuthenticated) {
      router.replace('/');
    }
  }, [isAdminAuthenticated]);

  const userRole: UserRole = user?.role || 'student';
  const roleMeta = ROLE_DETAILS[userRole] || ROLE_DETAILS.student;

  // Portal Mode State: 'monitoring' | 'security_response' | 'college_admin'
  const [portalMode, setPortalMode] = useState<'monitoring' | 'security_response' | 'college_admin'>('monitoring');

  // Role Protection State
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean>(userRole === 'super_admin');
  const [showAuthPasscodeModal, setShowAuthPasscodeModal] = useState<boolean>(false);
  const [adminPasscode, setAdminPasscode] = useState<string>('');

  // Scope & Main Dashboard Filters
  const [activeCollegeFilter, setActiveCollegeFilter] = useState<string>(selectedCollegeId || 'all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'Pending' | 'Verified' | 'Resolved'>('all');
  
  // Advanced Monitoring Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | 'older'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'severity'>('newest');
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');

  // Modal inspection & verification workflow states
  const [selectedReportForDecrypt, setSelectedReportForDecrypt] = useState<IncidentReport | null>(null);
  const [decryptedIdentity, setDecryptedIdentity] = useState<string | null>(null);
  const [detailModalReport, setDetailModalReport] = useState<IncidentReport | null>(null);

  // Verification Workflow Form State
  const [workflowActionType, setWorkflowActionType] = useState<
    'under_review' | 'verify' | 'reject' | 'request_info' | 'action_taken' | 'resolve' | 'assign' | null
  >(null);
  const [authorityRemarks, setAuthorityRemarks] = useState('');
  const [assignedAuthorityUnit, setAssignedAuthorityUnit] = useState('');
  const [requestedInfoText, setRequestedInfoText] = useState('');

  // Authority Action & Response Management Form State
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [respPersonOrTeam, setRespPersonOrTeam] = useState('');
  const [respStatus, setRespStatus] = useState<'Not Started' | 'In Progress' | 'On Scene' | 'Action Completed' | 'Resolved'>('In Progress');
  const [respNotes, setRespNotes] = useState('');
  const [respActionTaken, setRespActionTaken] = useState('');
  const [respResolutionDetails, setRespResolutionDetails] = useState('');

  // Analytics Tab State
  const [analyticsTab, setAnalyticsTab] = useState<'overview' | 'categories' | 'locations' | 'time' | 'lifecycle'>('overview');

  // COLLEGE MANAGEMENT PORTAL STATES
  const [selectedColMgmtId, setSelectedColMgmtId] = useState<string>('mu');
  const [colMgmtSubTab, setColMgmtSubTab] = useState<
    'campuses' | 'departments' | 'security_teams' | 'authorities' | 'emergency_contacts' | 'safety_zones'
  >('campuses');

  // Management Add Modals
  const [showRegisterCollegeModal, setShowRegisterCollegeModal] = useState<boolean>(false);
  const [showAddCampusModal, setShowAddCampusModal] = useState<boolean>(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState<boolean>(false);
  const [showAddSecurityTeamModal, setShowAddSecurityTeamModal] = useState<boolean>(false);
  const [showAddAuthModal, setShowAddAuthModal] = useState<boolean>(false);
  const [showAddEmergencyContactModal, setShowAddEmergencyContactModal] = useState<boolean>(false);
  const [showAddSafetyZoneModal, setShowAddSafetyZoneModal] = useState<boolean>(false);

  // Form Inputs for College Management
  const [colName, setColName] = useState('');
  const [colShortName, setColShortName] = useState('');
  const [colCode, setColCode] = useState('');
  const [colIcon, setColIcon] = useState('university');
  const [colColor, setColColor] = useState('#3B82F6');

  const [cmpName, setCmpName] = useState('');
  const [cmpLocation, setCmpLocation] = useState('');
  const [cmpLat, setCmpLat] = useState('19.0728');
  const [cmpLon, setCmpLon] = useState('72.8652');
  const [cmpRadius, setCmpRadius] = useState('1000');
  const [cmpDesc, setCmpDesc] = useState('');

  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHeadName, setDeptHeadName] = useState('');
  const [deptPhone, setDeptPhone] = useState('');
  const [deptEmail, setDeptEmail] = useState('');

  const [secTeamName, setSecTeamName] = useState('');
  const [secShift, setSecShift] = useState<'Day' | 'Night' | '24x7'>('24x7');
  const [secLeaderName, setSecLeaderName] = useState('');
  const [secPhone, setSecPhone] = useState('');
  const [secZone, setSecZone] = useState('');

  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState<'Super Admin' | 'Chief Security Officer' | 'Campus Security Supervisor' | 'Maintenance Lead'>('Campus Security Supervisor');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authBadge, setAuthBadge] = useState('');

  const [emTitle, setEmTitle] = useState('');
  const [emPhone, setEmPhone] = useState('');
  const [emCategory, setEmCategory] = useState<'Police' | 'Medical' | 'Fire' | 'Campus Security' | 'Women Helpline'>('Campus Security');
  const [em24x7, setEm24x7] = useState<boolean>(true);

  const [zoneName, setZoneName] = useState('');
  const [zoneRiskLevel, setZoneRiskLevel] = useState<'Safe' | 'Moderate' | 'High' | 'Critical'>('Safe');
  const [zoneRadius, setZoneRadius] = useState('500');
  const [zoneStatus, setZoneStatus] = useState<'Active Surveillance' | 'Patrol Deployed' | 'Hazard Area'>('Active Surveillance');

  // Currently managed college object
  const activeManagedCollege = useMemo(() => {
    return colleges.find(c => c.id === selectedColMgmtId) || colleges[0] || null;
  }, [colleges, selectedColMgmtId]);

  // Helper for Severity rating
  const getSeverity = (type: string): 'high' | 'medium' | 'low' => {
    const t = type.toLowerCase();
    if (t.includes('threat') || t.includes('sexual') || t.includes('violence') || t.includes('harassment')) {
      return 'high';
    }
    if (t.includes('stalking') || t.includes('suspicious') || t.includes('unsafe')) {
      return 'medium';
    }
    return 'low';
  };

  // Filter reports based on selected college/campus scope
  const scopedReports = useMemo(() => {
    if (activeCollegeFilter === 'all') return reports;
    return reports.filter(r => r.collegeId === activeCollegeFilter);
  }, [reports, activeCollegeFilter]);

  // Security Patrol Team Assigned Reports
  const securitySquadAssignedReports = useMemo(() => {
    if (userRole === 'super_admin' || userRole === 'college_authority') return scopedReports;
    const squadName = user?.assignedTeam || 'Fort Alpha Patrol';
    return scopedReports.filter(r => {
      const assigned = (r.assignedPersonOrTeam || r.assignedAuthority || '').toLowerCase();
      return assigned.includes(squadName.toLowerCase()) || assigned.includes('patrol') || r.status === 'Pending';
    });
  }, [scopedReports, userRole, user]);

  // Statistics connected directly to live reports state
  const totalReportsCount = scopedReports.length;
  const now = Date.now();
  const newReportsCount = scopedReports.filter(r => {
    const reportTime = new Date(r.createdAt || Date.now()).getTime();
    return now - reportTime <= 24 * 60 * 60 * 1000;
  }).length;

  const pendingReportsCount = scopedReports.filter(r => r.status === 'Pending').length;
  const verifiedReportsCount = scopedReports.filter(r => r.status === 'Verified').length;
  const resolvedReportsCount = scopedReports.filter(r => r.status === 'Resolved').length;
  const unresolvedReportsCount = pendingReportsCount + verifiedReportsCount;

  // High-Risk Areas aggregation
  const locationMap: { [location: string]: { count: number; college: string; types: string[] } } = {};
  scopedReports.forEach(r => {
    const locKey = r.location || 'General Campus';
    if (!locationMap[locKey]) {
      locationMap[locKey] = { count: 0, college: r.collegeName || 'General Area', types: [] };
    }
    locationMap[locKey].count += 1;
    if (!locationMap[locKey].types.includes(r.type)) {
      locationMap[locKey].types.push(r.type);
    }
  });

  const highRiskAreas = Object.keys(locationMap)
    .map(loc => ({
      location: loc,
      count: locationMap[loc].count,
      college: locationMap[loc].college,
      types: locationMap[loc].types,
      riskLevel: locationMap[loc].count >= 2 ? 'High Risk' : 'Watchlist',
    }))
    .sort((a: { count: number }, b: { count: number }) => b.count - a.count);

  // Campus Safety Score Calculation (0-100)
  const campusSafetyScore = useMemo(() => {
    if (scopedReports.length === 0) {
      return { score: 100, grade: 'Excellent (Safe Campus)', color: '#10B981', resolutionRate: 100 };
    }
    let score = 100;
    const unresolvedHigh = scopedReports.filter(r => r.status !== 'Resolved' && getSeverity(r.type) === 'high').length;
    const unresolvedMedium = scopedReports.filter(r => r.status !== 'Resolved' && getSeverity(r.type) === 'medium').length;
    const pendingCount = scopedReports.filter(r => r.status === 'Pending').length;

    score -= (unresolvedHigh * 12);
    score -= (unresolvedMedium * 6);
    score -= (pendingCount * 3);
    score -= (highRiskAreas.filter(a => a.count >= 2).length * 8);

    const resRate = Math.round((resolvedReportsCount / scopedReports.length) * 100);
    if (resRate >= 80) score += 10;
    else if (resRate >= 60) score += 5;

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));

    let grade = 'Excellent (Safe Campus)';
    let color = '#10B981';
    if (finalScore < 50) { grade = 'Critical Safety Risk'; color = '#EF4444'; }
    else if (finalScore < 75) { grade = 'Moderate Risk Level'; color = '#F59E0B'; }
    else if (finalScore < 90) { grade = 'Good (Active Guarding)'; color = '#3B82F6'; }

    return { score: finalScore, grade, color, resolutionRate: resRate };
  }, [scopedReports, resolvedReportsCount, highRiskAreas]);

  // Incidents by Category
  const categoryAnalytics = useMemo(() => {
    const map: { [cat: string]: number } = {};
    scopedReports.forEach(r => { map[r.type] = (map[r.type] || 0) + 1; });
    const total = scopedReports.length || 1;
    return INCIDENT_CATEGORIES.map((cat: { label: string }) => {
      const count = map[cat.label] || 0;
      return { ...cat, count, percentage: Math.round((count / total) * 100) };
    }).sort((a: { count: number }, b: { count: number }) => b.count - a.count);
  }, [scopedReports]);

  // Incidents by Location
  const locationAnalytics = useMemo(() => {
    const map: { [loc: string]: { count: number; campus: string; types: { [t: string]: number } } } = {};
    scopedReports.forEach(r => {
      const loc = r.location || 'General Campus';
      if (!map[loc]) map[loc] = { count: 0, campus: r.campusName || r.collegeName || 'Main', types: {} };
      map[loc].count += 1;
      map[loc].types[r.type] = (map[loc].types[r.type] || 0) + 1;
    });

    const total = scopedReports.length || 1;
    return Object.keys(map)
      .map(loc => {
        const topType = Object.keys(map[loc].types).sort((a, b) => map[loc].types[b] - map[loc].types[a])[0] || 'Incident';
        return {
          location: loc,
          count: map[loc].count,
          campus: map[loc].campus,
          topType,
          percentage: Math.round((map[loc].count / total) * 100),
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [scopedReports]);

  // Filtered & Sorted Incidents List for Monitoring
  const monitoredIncidents = useMemo(() => {
    const targetPool = userRole === 'security_team' ? securitySquadAssignedReports : scopedReports;
    return targetPool.filter(r => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = r.id.toLowerCase().includes(q);
        const matchesType = r.type.toLowerCase().includes(q);
        const matchesLoc = r.location.toLowerCase().includes(q);
        const matchesDesc = r.description.toLowerCase().includes(q);
        const matchesReporter = (r.reporterName || '').toLowerCase().includes(q);
        const matchesAssigned = (r.assignedPersonOrTeam || r.assignedAuthority || '').toLowerCase().includes(q);
        if (!matchesId && !matchesType && !matchesLoc && !matchesDesc && !matchesReporter && !matchesAssigned) {
          return false;
        }
      }

      if (statusFilter === 'unresolved') {
        if (r.status === 'Resolved') return false;
      } else if (statusFilter !== 'all') {
        if (r.status !== statusFilter) return false;
      }

      if (categoryFilter !== 'all') {
        if (r.type.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      }

      if (campusFilter !== 'all') {
        if (r.campusId !== campusFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      return 0;
    });
  }, [scopedReports, securitySquadAssignedReports, userRole, searchQuery, statusFilter, categoryFilter, campusFilter, sortBy]);

  // Open modal with report & populate forms
  const openModalWithReport = (report: IncidentReport) => {
    setDetailModalReport(report);
    setRespPersonOrTeam(report.assignedPersonOrTeam || report.assignedAuthority || '');
    setRespStatus(report.responseStatus || 'In Progress');
    setRespNotes(report.responseNotes || '');
    setRespActionTaken(report.actionTaken || '');
    setRespResolutionDetails(report.resolutionDetails || '');
    setShowResponseForm(false);
    setWorkflowActionType(null);
  };

  // Submit Verification Workflow Action with Backend API Protection
  const handleSubmitWorkflowAction = async () => {
    if (!detailModalReport || !workflowActionType) return;

    // Backend API Authorization Protection Check
    const authResult = await protectApiCall(userRole, 'verify_reports', async () => {
      let stage: 'Submitted' | 'Under Review' | 'Verified' | 'Rejected' | 'Action Taken' | 'Resolved' = 'Under Review';
      let actionName = 'Status Modified';

      switch (workflowActionType) {
        case 'under_review': stage = 'Under Review'; actionName = 'Under Review'; break;
        case 'verify': stage = 'Verified'; actionName = 'Verified Report'; break;
        case 'reject': stage = 'Rejected'; actionName = 'Rejected Report'; break;
        case 'request_info': stage = detailModalReport.workflowStage || 'Under Review'; actionName = 'Requested Information'; break;
        case 'action_taken': stage = 'Action Taken'; actionName = 'Deployed Action'; break;
        case 'resolve': stage = 'Resolved'; actionName = 'Case Closed & Resolved'; break;
        case 'assign': stage = detailModalReport.workflowStage || 'Under Review'; actionName = `Assigned to ${assignedAuthorityUnit || 'Security Desk'}`; break;
      }

      await updateVerificationWorkflow(detailModalReport.id, {
        stage,
        actionName,
        remarks: authorityRemarks || undefined,
        assignedTo: assignedAuthorityUnit || undefined,
        requestedInfo: requestedInfoText || undefined,
        performedBy: `${roleMeta.label} (${user?.name || 'Authority Desk'})`,
      });
      return actionName;
    });

    if (!authResult.success) {
      Alert.alert('RBAC Access Denied', authResult.error);
      return;
    }

    const updatedRecord = reports.find(r => r.id === detailModalReport.id);
    if (updatedRecord) setDetailModalReport(updatedRecord);

    setWorkflowActionType(null);
    setAuthorityRemarks('');
    setAssignedAuthorityUnit('');
    setRequestedInfoText('');

    Alert.alert('Workflow Executed', `Action "${authResult.data}" logged under ${roleMeta.label} credentials.`);
  };

  // Submit Authority Action & Security Response Management Form
  const handleSubmitAuthorityResponse = async () => {
    if (!detailModalReport) return;

    // Check Security Team / Authority response permission
    const requiredPermission = userRole === 'security_team' ? 'respond_to_incidents' : 'assign_actions';
    const authResult = await protectApiCall(userRole, requiredPermission, async () => {
      await updateAuthorityResponse(detailModalReport.id, {
        assignedPersonOrTeam: respPersonOrTeam || undefined,
        responseStatus: respStatus,
        responseNotes: respNotes || undefined,
        actionTaken: respActionTaken || undefined,
        resolutionDetails: respResolutionDetails || undefined,
        performedBy: `${roleMeta.label} (${user?.name || 'Security Team'})`,
      });
      return respStatus;
    });

    if (!authResult.success) {
      Alert.alert('RBAC Access Denied', authResult.error);
      return;
    }

    const updatedRecord = reports.find(r => r.id === detailModalReport.id);
    if (updatedRecord) setDetailModalReport(updatedRecord);

    setShowResponseForm(false);
    Alert.alert('Security Response Recorded', `Updated incident response status to "${respStatus}".`);
  };

  // Decrypt Identity simulation
  const handleDecryptIdentity = (report: IncidentReport) => {
    setSelectedReportForDecrypt(report);
    if (!report.isAnonymous) {
      setDecryptedIdentity(`Public User: ${report.reporterName || 'Registered User'}`);
    } else {
      const rawEnc = report.authorityEncryptedIdentity || '';
      if (rawEnc.includes('ENC-AUTH-TOKEN[')) {
        const tokenContent = rawEnc.replace('ENC-AUTH-TOKEN[', '').replace(']', '');
        try {
          const decoded = atob(tokenContent);
          setDecryptedIdentity(`🔓 Decrypted Identity Contact: ${decoded}`);
        } catch {
          setDecryptedIdentity(`🔓 Verified Identity Token: ${tokenContent}`);
        }
      } else {
        setDecryptedIdentity(`🔓 Verified Identity Token: ${rawEnc}`);
      }
    }
  };

  // HANDLERS FOR REGISTERING COLLEGE & SUB-ENTITIES (Super Admin / Authority Protected)
  const handleRegisterCollege = async () => {
    const res = await protectApiCall(userRole, 'manage_colleges', async () => {
      if (!colName.trim() || !colCode.trim()) throw new Error('College name and code are required');
      return await addCollege({
        name: colName.trim(),
        shortName: colShortName.trim() || colName.trim(),
        code: colCode.trim().toUpperCase(),
        icon: colIcon || 'university',
        color: colColor || '#3B82F6',
      });
    });

    if (!res.success) {
      Alert.alert('RBAC Authorization Error', res.error);
      return;
    }

    setSelectedColMgmtId(res.data!.id);
    setShowRegisterCollegeModal(false);
    setColName(''); setColShortName(''); setColCode('');
    Alert.alert('College Registered', `Registered "${res.data!.name}" in institution registry.`);
  };

  const handleAddCampus = async () => {
    if (!cmpName.trim() || !activeManagedCollege) return;
    const res = await protectApiCall(userRole, 'manage_colleges', async () => {
      await addCampus(activeManagedCollege.id, {
        name: cmpName.trim(),
        location: cmpLocation.trim() || 'Campus Center',
        latitude: parseFloat(cmpLat) || 19.0728,
        longitude: parseFloat(cmpLon) || 72.8652,
        radius: parseInt(cmpRadius, 10) || 1000,
        description: cmpDesc.trim() || 'Main Campus Area',
      });
    });

    if (!res.success) { Alert.alert('RBAC Error', res.error); return; }
    setShowAddCampusModal(false); setCmpName(''); setCmpLocation('');
    Alert.alert('Campus Added', `Added campus "${cmpName}".`);
  };

  const handleAddDepartment = async () => {
    if (!deptName.trim() || !activeManagedCollege) return;
    const res = await protectApiCall(userRole, 'manage_colleges', async () => {
      await addDepartment(activeManagedCollege.id, {
        name: deptName.trim(),
        code: deptCode.trim().toUpperCase() || 'DEPT',
        headName: deptHeadName.trim() || 'Head of Department',
        phone: deptPhone.trim() || '022-12345678',
        email: deptEmail.trim() || 'dept@college.ac.in',
      });
    });

    if (!res.success) { Alert.alert('RBAC Error', res.error); return; }
    setShowAddDeptModal(false); setDeptName('');
    Alert.alert('Department Added', `Added department "${deptName}".`);
  };

  const handleAddSecurityTeam = async () => {
    if (!secTeamName.trim() || !activeManagedCollege) return;
    const res = await protectApiCall(userRole, 'manage_colleges', async () => {
      await addSecurityTeam(activeManagedCollege.id, {
        teamName: secTeamName.trim(),
        shift: secShift,
        leaderName: secLeaderName.trim() || 'Security Officer',
        contactPhone: secPhone.trim() || '022-99998888',
        activePatrolZone: secZone.trim() || 'Entire Campus',
      });
    });

    if (!res.success) { Alert.alert('RBAC Error', res.error); return; }
    setShowAddSecurityTeamModal(false); setSecTeamName('');
    Alert.alert('Security Squad Added', `Added squad "${secTeamName}".`);
  };

  const handleAddAuthorityOfficer = async () => {
    if (!authName.trim() || !activeManagedCollege) return;
    const res = await protectApiCall(userRole, 'manage_authorities', async () => {
      await addAuthorizedAuthority(activeManagedCollege.id, {
        name: authName.trim(),
        role: authRole,
        email: authEmail.trim() || 'officer@college.ac.in',
        phone: authPhone.trim() || '+91 99999 00000',
        badgeNumber: authBadge.trim() || `SEC-${Math.floor(100 + Math.random() * 900)}`,
        active: true,
      });
    });

    if (!res.success) { Alert.alert('RBAC Error', res.error); return; }
    setShowAddAuthModal(false); setAuthName('');
    Alert.alert('Officer Registered', `Authorized officer "${authName}".`);
  };

  const handleAddEmergencyContact = async () => {
    if (!emTitle.trim() || !activeManagedCollege) return;
    const res = await protectApiCall(userRole, 'manage_colleges', async () => {
      await addEmergencyContact(activeManagedCollege.id, {
        title: emTitle.trim(),
        phone: emPhone.trim() || '100',
        category: emCategory,
        is24x7: em24x7,
      });
    });

    if (!res.success) { Alert.alert('RBAC Error', res.error); return; }
    setShowAddEmergencyContactModal(false); setEmTitle('');
    Alert.alert('Hotline Added', `Registered hotline "${emTitle}".`);
  };

  const handleAddSafetyZone = async () => {
    if (!zoneName.trim() || !activeManagedCollege) return;
    const res = await protectApiCall(userRole, 'manage_risk_zones', async () => {
      await addCampusSafetyZone(activeManagedCollege.id, {
        zoneName: zoneName.trim(),
        riskLevel: zoneRiskLevel,
        radiusMeters: parseInt(zoneRadius, 10) || 500,
        status: zoneStatus,
      });
    });

    if (!res.success) { Alert.alert('RBAC Error', res.error); return; }
    setShowAddSafetyZoneModal(false); setZoneName('');
    Alert.alert('Safety Zone Added', `Registered geofence zone "${zoneName}".`);
  };

  // Helper Stage Badge
  const renderStageBadge = (stage?: string) => {
    const st = stage || 'Submitted';
    let color = Colors.medium;
    let bg = Colors.mediumLight;
    let label = st;

    if (st === 'Submitted') { color = Colors.primary; bg = Colors.primaryLight; }
    else if (st === 'Under Review') { color = '#F59E0B'; bg = '#FEF3C7'; label = '🔍 Under Review'; }
    else if (st === 'Verified') { color = '#3B82F6'; bg = '#DBEAFE'; label = '🛡️ Verified'; }
    else if (st === 'Rejected') { color = Colors.danger; bg = Colors.dangerLight; label = '❌ Rejected'; }
    else if (st === 'Action Taken') { color = '#8B5CF6'; bg = '#EDE9FE'; label = '⚡ Action Taken'; }
    else if (st === 'Resolved') { color = Colors.safe; bg = Colors.safeLight; label = '✅ Resolved'; }

    return (
      <View style={[styles.stageBadge, { backgroundColor: bg, borderColor: color }]}>
        <Text style={[styles.stageBadgeText, { color }]}>{label}</Text>
      </View>
    );
  };

  // Helper Response Status Badge
  const renderResponseStatusBadge = (status?: string) => {
    const st = status || 'Not Started';
    let color = Colors.textSecondary;
    let bg = Colors.border;

    if (st === 'Not Started') { color = Colors.danger; bg = Colors.dangerLight; }
    else if (st === 'In Progress') { color = '#F59E0B'; bg = '#FEF3C7'; }
    else if (st === 'On Scene') { color = '#3B82F6'; bg = '#DBEAFE'; }
    else if (st === 'Action Completed') { color = '#8B5CF6'; bg = '#EDE9FE'; }
    else if (st === 'Resolved') { color = Colors.safe; bg = Colors.safeLight; }

    return (
      <View style={[styles.respStatusPill, { backgroundColor: bg }]}>
        <FontAwesome5 name="clock" size={10} color={color} style={{ marginRight: 4 }} />
        <Text style={[styles.respStatusPillText, { color }]}>{st}</Text>
      </View>
    );
  };

  // IF USER IS STUDENT/USER: SHOW RBAC ROLE PROTECTION GUARD
  if (userRole === 'student') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.rbacGuardCard}>
          <View style={styles.rbacGuardIconCircle}>
            <FontAwesome5 name="user-lock" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.rbacGuardTitle}>🔒 Role-Protected Administrative Console</Text>
          <Text style={styles.rbacGuardSub}>
            The College Authority & Security Command Portal is restricted to College Authorities, Security Patrol Squads, and Super Admins.
          </Text>

          <View style={styles.rbacRoleInfoBox}>
            <Text style={styles.rbacCurrentRoleText}>Your Active Role: <Text style={{ fontWeight: 'bold', color: roleMeta.color }}>{roleMeta.label}</Text></Text>
            <Text style={styles.rbacRoleDescText}>{roleMeta.description}</Text>
          </View>

          <Text style={styles.rbacSwitchHeader}>Switch Active Role to Access Portal:</Text>

          <View style={{ width: '100%', gap: 8, marginVertical: 10 }}>
            {(['college_authority', 'security_team', 'super_admin'] as UserRole[]).map(roleKey => {
              const meta = ROLE_DETAILS[roleKey];
              return (
                <TouchableOpacity
                  key={roleKey}
                  style={[styles.rbacSwitchBtn, { borderColor: meta.color }]}
                  onPress={async () => {
                    await switchUserRole(roleKey);
                    Alert.alert('Role Switched', `Logged in as ${meta.label}. Portal unlocked!`);
                  }}
                >
                  <FontAwesome5 name={meta.icon} size={14} color={meta.color} style={{ marginRight: 8 }} />
                  <Text style={[styles.rbacSwitchBtnText, { color: meta.color }]}>
                    Switch to {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => router.back()}>
            <Text style={styles.modalBtnSecondaryText}>← Return to Student View</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Portal Title with Active RBAC Role Badge */}
      <View style={styles.headerCard}>
        <View style={[styles.headerIconCircle, { backgroundColor: roleMeta.color + '20' }]}>
          <FontAwesome5 name={roleMeta.icon} size={22} color={roleMeta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Authority Command Center</Text>
            <View style={[styles.roleBadgePill, { backgroundColor: roleMeta.color + '20', borderColor: roleMeta.color }]}>
              <FontAwesome5 name={roleMeta.icon} size={9} color={roleMeta.color} style={{ marginRight: 4 }} />
              <Text style={[styles.roleBadgePillText, { color: roleMeta.color }]}>{roleMeta.label}</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            Logged as: {user?.name || 'Authority Officer'} ({user?.email})
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutHeaderBtn}
          onPress={async () => {
            await logoutAdmin();
            router.replace('/');
          }}
        >
          <FontAwesome5 name="sign-out-alt" size={13} color="#EF4444" style={{ marginRight: 6 }} />
          <Text style={styles.logoutHeaderBtnText}>Log Out / Main Page</Text>
        </TouchableOpacity>
      </View>

      {/* TOP PORTAL MODE TAB SWITCHER (FILTERED BY RBAC PERMISSIONS) */}
      <View style={styles.portalTabBar}>
        <TouchableOpacity
          style={[styles.portalTabBtn, portalMode === 'monitoring' && styles.portalTabBtnActive]}
          onPress={() => setPortalMode('monitoring')}
        >
          <FontAwesome5 name="chart-bar" size={12} color={portalMode === 'monitoring' ? Colors.white : Colors.textSecondary} style={{ marginRight: 5 }} />
          <Text style={[styles.portalTabText, portalMode === 'monitoring' && styles.portalTabTextActive]}>
            Monitoring & Verification
          </Text>
        </TouchableOpacity>

        {hasPermission(userRole, 'respond_to_incidents') && (
          <TouchableOpacity
            style={[styles.portalTabBtn, portalMode === 'security_response' && styles.portalTabBtnActive]}
            onPress={() => setPortalMode('security_response')}
          >
            <FontAwesome5 name="shield-alt" size={12} color={portalMode === 'security_response' ? Colors.white : Colors.textSecondary} style={{ marginRight: 5 }} />
            <Text style={[styles.portalTabText, portalMode === 'security_response' && styles.portalTabTextActive]}>
              Security Patrol Squad
            </Text>
          </TouchableOpacity>
        )}

        {(hasPermission(userRole, 'manage_colleges') || hasPermission(userRole, 'manage_authorities')) && (
          <TouchableOpacity
            style={[styles.portalTabBtn, portalMode === 'college_admin' && styles.portalTabBtnActive]}
            onPress={() => setPortalMode('college_admin')}
          >
            <FontAwesome5 name="university" size={12} color={portalMode === 'college_admin' ? Colors.white : Colors.textSecondary} style={{ marginRight: 5 }} />
            <Text style={[styles.portalTabText, portalMode === 'college_admin' && styles.portalTabTextActive]}>
              University Admin
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* PORTAL MODE 2: COLLEGE & UNIVERSITY MANAGEMENT CONSOLE */}
      {portalMode === 'college_admin' ? (
        <View style={{ marginTop: 6 }}>
          {!isAdminAuthorized && userRole !== 'super_admin' ? (
            <View style={styles.roleLockCard}>
              <FontAwesome5 name="lock" size={24} color={Colors.danger} style={{ marginBottom: 6 }} />
              <Text style={styles.roleLockTitle}>🔒 Super Admin Credentials Required</Text>
              <Text style={styles.roleLockSub}>
                University and college registry management operations require Super Admin passcode authorization.
              </Text>
              <TouchableOpacity style={styles.unlockBtn} onPress={() => setShowAuthPasscodeModal(true)}>
                <FontAwesome5 name="key" size={12} color={Colors.white} style={{ marginRight: 6 }} />
                <Text style={styles.unlockBtnText}>Authorize Super Admin PIN</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* Authorized Status Indicator & College Register Bar */}
              <View style={styles.mgmtHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mgmtTitle}>🏛️ Institution & Campus Directory</Text>
                  <Text style={styles.mgmtSub}>Manage colleges, departments, security squads & authority officers.</Text>
                </View>

                {hasPermission(userRole, 'manage_colleges') && (
                  <TouchableOpacity style={styles.registerCollegeBtn} onPress={() => setShowRegisterCollegeModal(true)}>
                    <FontAwesome5 name="plus-circle" size={11} color={Colors.white} style={{ marginRight: 5 }} />
                    <Text style={styles.registerCollegeBtnText}>Register College</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* College Selection Chip Scroll */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8, gap: 6 }}>
                {colleges.map(col => {
                  const isSelected = col.id === selectedColMgmtId;
                  return (
                    <TouchableOpacity
                      key={col.id}
                      style={[styles.colChipBtn, isSelected && { backgroundColor: col.color, borderColor: col.color }]}
                      onPress={() => setSelectedColMgmtId(col.id)}
                    >
                      <FontAwesome5 name={col.icon || 'university'} size={11} color={isSelected ? Colors.white : col.color} style={{ marginRight: 5 }} />
                      <Text style={[styles.colChipBtnText, isSelected && { color: Colors.white, fontWeight: 'bold' }]}>
                        {col.shortName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Selected College Overview Card */}
              {activeManagedCollege && (
                <View style={styles.activeColOverviewCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.colIconBox, { backgroundColor: activeManagedCollege.color + '20' }]}>
                      <FontAwesome5 name={activeManagedCollege.icon} size={18} color={activeManagedCollege.color} />
                    </View>
                    <View>
                      <Text style={styles.activeColName}>{activeManagedCollege.name}</Text>
                      <Text style={styles.activeColCode}>Code: {activeManagedCollege.code} • ID: {activeManagedCollege.id}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* 6 MANAGEMENT SUB-TABS */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabBar}>
                {(
                  [
                    { id: 'campuses', label: 'Campuses', icon: 'map-marked-alt' },
                    { id: 'departments', label: 'Departments', icon: 'building' },
                    { id: 'security_teams', label: 'Security Squads', icon: 'user-shield' },
                    { id: 'authorities', label: 'Officers', icon: 'id-badge' },
                    { id: 'emergency_contacts', label: 'Hotlines', icon: 'phone-alt' },
                    { id: 'safety_zones', label: 'Safety Zones', icon: 'shield-virus' },
                  ] as const
                ).map(tab => (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.subTabBtn, colMgmtSubTab === tab.id && styles.subTabBtnActive]}
                    onPress={() => setColMgmtSubTab(tab.id)}
                  >
                    <FontAwesome5 name={tab.icon} size={11} color={colMgmtSubTab === tab.id ? Colors.white : Colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.subTabText, colMgmtSubTab === tab.id && styles.subTabTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* SUB-TAB 1: CAMPUSES MANAGEMENT */}
              {colMgmtSubTab === 'campuses' && (
                <View style={styles.mgmtSectionBox}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.mgmtSectionTitle}>📍 Registered Campuses</Text>
                    <TouchableOpacity style={styles.addBtnMini} onPress={() => setShowAddCampusModal(true)}>
                      <FontAwesome5 name="plus" size={10} color={Colors.white} style={{ marginRight: 4 }} />
                      <Text style={styles.addBtnMiniText}>Add Campus</Text>
                    </TouchableOpacity>
                  </View>

                  {(activeManagedCollege?.campuses || []).map((campus: Campus) => (
                    <View key={campus.id} style={styles.itemCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text style={styles.itemTitle}>{campus.name}</Text>
                        <View style={styles.geofencePill}>
                          <Text style={styles.geofencePillText}>{campus.radius}m Radius</Text>
                        </View>
                      </View>
                      <Text style={styles.itemSub}>📍 {campus.location}</Text>
                      <Text style={styles.itemDesc}>{campus.description}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* SUB-TAB 2: DEPARTMENTS MANAGEMENT */}
              {colMgmtSubTab === 'departments' && (
                <View style={styles.mgmtSectionBox}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.mgmtSectionTitle}>🏢 Departments</Text>
                    <TouchableOpacity style={styles.addBtnMini} onPress={() => setShowAddDeptModal(true)}>
                      <FontAwesome5 name="plus" size={10} color={Colors.white} style={{ marginRight: 4 }} />
                      <Text style={styles.addBtnMiniText}>Add Dept</Text>
                    </TouchableOpacity>
                  </View>

                  {(activeManagedCollege?.departments || []).map((dept: Department) => (
                    <View key={dept.id} style={styles.itemCard}>
                      <Text style={styles.itemTitle}>{dept.name} ({dept.code})</Text>
                      <Text style={styles.itemSub}>👤 Head: {dept.headName}</Text>
                      <Text style={styles.itemDesc}>📞 Ext: {dept.phone} • ✉️ {dept.email}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* SUB-TAB 3: SECURITY TEAMS MANAGEMENT */}
              {colMgmtSubTab === 'security_teams' && (
                <View style={styles.mgmtSectionBox}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.mgmtSectionTitle}>🛡️ Security Patrol Squads</Text>
                    <TouchableOpacity style={styles.addBtnMini} onPress={() => setShowAddSecurityTeamModal(true)}>
                      <FontAwesome5 name="plus" size={10} color={Colors.white} style={{ marginRight: 4 }} />
                      <Text style={styles.addBtnMiniText}>Add Squad</Text>
                    </TouchableOpacity>
                  </View>

                  {(activeManagedCollege?.securityTeams || []).map((team: SecurityTeam) => (
                    <View key={team.id} style={styles.itemCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.itemTitle}>{team.teamName}</Text>
                        <View style={styles.shiftBadge}>
                          <Text style={styles.shiftBadgeText}>Shift: {team.shift}</Text>
                        </View>
                      </View>
                      <Text style={styles.itemSub}>👮 Leader: {team.leaderName} (📞 {team.contactPhone})</Text>
                      <Text style={styles.itemDesc}>📍 Patrol Zone: {team.activePatrolZone}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* SUB-TAB 4: AUTHORIZED AUTHORITIES MANAGEMENT */}
              {colMgmtSubTab === 'authorities' && (
                <View style={styles.mgmtSectionBox}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.mgmtSectionTitle}>👮 Authorized Security Officers</Text>
                    <TouchableOpacity style={styles.addBtnMini} onPress={() => setShowAddAuthModal(true)}>
                      <FontAwesome5 name="plus" size={10} color={Colors.white} style={{ marginRight: 4 }} />
                      <Text style={styles.addBtnMiniText}>Register Officer</Text>
                    </TouchableOpacity>
                  </View>

                  {(activeManagedCollege?.authorizedAuthorities || []).map((auth: AuthorizedAuthority) => (
                    <View key={auth.id} style={styles.itemCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.itemTitle}>{auth.name}</Text>
                        <View style={styles.badgePill}>
                          <Text style={styles.badgePillText}>{auth.badgeNumber}</Text>
                        </View>
                      </View>
                      <Text style={styles.itemSub}>🛡️ Role: {auth.role}</Text>
                      <Text style={styles.itemDesc}>✉️ {auth.email} • 📞 {auth.phone}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* SUB-TAB 5: EMERGENCY CONTACTS MANAGEMENT */}
              {colMgmtSubTab === 'emergency_contacts' && (
                <View style={styles.mgmtSectionBox}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.mgmtSectionTitle}>📞 Campus Hotlines</Text>
                    <TouchableOpacity style={styles.addBtnMini} onPress={() => setShowAddEmergencyContactModal(true)}>
                      <FontAwesome5 name="plus" size={10} color={Colors.white} style={{ marginRight: 4 }} />
                      <Text style={styles.addBtnMiniText}>Add Hotline</Text>
                    </TouchableOpacity>
                  </View>

                  {(activeManagedCollege?.emergencyContacts || []).map((em: EmergencyContact) => (
                    <View key={em.id} style={styles.itemCard}>
                      <Text style={styles.itemTitle}>{em.title}</Text>
                      <Text style={styles.itemSub}>📞 Phone: {em.phone}</Text>
                      <Text style={styles.itemDesc}>Category: {em.category} • 24x7: {em.is24x7 ? 'Yes' : 'No'}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* SUB-TAB 6: CAMPUS SAFETY ZONES MANAGEMENT */}
              {colMgmtSubTab === 'safety_zones' && (
                <View style={styles.mgmtSectionBox}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.mgmtSectionTitle}>📍 Campus Safety Geofences</Text>
                    <TouchableOpacity style={styles.addBtnMini} onPress={() => setShowAddSafetyZoneModal(true)}>
                      <FontAwesome5 name="plus" size={10} color={Colors.white} style={{ marginRight: 4 }} />
                      <Text style={styles.addBtnMiniText}>Add Zone</Text>
                    </TouchableOpacity>
                  </View>

                  {(activeManagedCollege?.campusSafetyZones || []).map((zone: CampusSafetyZone) => (
                    <View key={zone.id} style={styles.itemCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.itemTitle}>{zone.zoneName}</Text>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: Colors.primary }}>{zone.riskLevel} Risk</Text>
                      </View>
                      <Text style={styles.itemSub}>Radius: {zone.radiusMeters}m Geofence</Text>
                      <Text style={styles.itemDesc}>Status: {zone.status}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      ) : (
        /* PORTAL MODE 1: INCIDENT MONITORING & ANALYTICS */
        <View>
          {/* Scope Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Institution Scope:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              <TouchableOpacity
                style={[styles.scopeChip, activeCollegeFilter === 'all' && styles.scopeChipActive]}
                onPress={() => {
                  setActiveCollegeFilter('all');
                  setSelectedCollegeId(null);
                  setSelectedCampusId(null);
                }}
              >
                <FontAwesome5 name="globe" size={12} color={activeCollegeFilter === 'all' ? Colors.white : Colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.scopeChipText, activeCollegeFilter === 'all' && styles.scopeChipTextActive]}>
                  All Institutions ({reports.length})
                </Text>
              </TouchableOpacity>

              {colleges.map(col => {
                const isSelected = activeCollegeFilter === col.id;
                const count = reports.filter(r => r.collegeId === col.id).length;
                return (
                  <TouchableOpacity
                    key={col.id}
                    style={[
                      styles.scopeChip,
                      isSelected && { backgroundColor: col.color, borderColor: col.color }
                    ]}
                    onPress={() => {
                      setActiveCollegeFilter(col.id);
                      setSelectedCollegeId(col.id);
                    }}
                  >
                    <FontAwesome5 name={col.icon} size={12} color={isSelected ? Colors.white : col.color} style={{ marginRight: 6 }} />
                    <Text style={[styles.scopeChipText, isSelected && { color: Colors.white, fontWeight: 'bold' }]}>
                      {col.shortName} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Active Safety Alerts Broadcast Banner */}
          <View style={styles.alertBannerCard}>
            <View style={styles.alertBannerHeader}>
              <View style={styles.alertPulseDot} />
              <Text style={styles.alertBannerTitle}>ACTIVE SAFETY COMMAND BROADCAST</Text>
            </View>
            <Text style={styles.alertBannerBody}>
              {unresolvedReportsCount > 0
                ? `⚠️ ${unresolvedReportsCount} unresolved incident report(s) (${pendingReportsCount} Pending, ${verifiedReportsCount} Verified) require action assignment.`
                : '✅ All reported campus incidents are currently resolved and monitored.'}
            </Text>
          </View>

          {/* Dashboard Summary Statistics Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconBox}>
                <FontAwesome5 name="clipboard-list" size={14} color={Colors.primary} />
              </View>
              <Text style={styles.statNumber}>{totalReportsCount}</Text>
              <Text style={styles.statLabel}>Total Reports</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: Colors.primaryLight }]}>
                <FontAwesome5 name="bolt" size={14} color={Colors.primary} />
              </View>
              <Text style={styles.statNumber}>{newReportsCount}</Text>
              <Text style={styles.statLabel}>New (24h)</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
                <FontAwesome5 name="clock" size={14} color="#D97706" />
              </View>
              <Text style={[styles.statNumber, { color: '#D97706' }]}>{pendingReportsCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: '#DBEAFE' }]}>
                <FontAwesome5 name="user-shield" size={14} color="#2563EB" />
              </View>
              <Text style={[styles.statNumber, { color: '#2563EB' }]}>{verifiedReportsCount}</Text>
              <Text style={styles.statLabel}>Verified</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: Colors.safeLight }]}>
                <FontAwesome5 name="check-circle" size={14} color={Colors.safe} />
              </View>
              <Text style={[styles.statNumber, { color: Colors.safe }]}>{resolvedReportsCount}</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: '#FEE2E2' }]}>
                <FontAwesome5 name="fire" size={14} color={Colors.danger} />
              </View>
              <Text style={[styles.statNumber, { color: Colors.danger }]}>{highRiskAreas.length}</Text>
              <Text style={styles.statLabel}>Risk Areas</Text>
            </View>
          </View>

          {/* INCIDENT MONITORING LIST & DETAIL SEARCH */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome5 name="search" size={14} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>Incident Monitoring Center ({monitoredIncidents.length})</Text>
              </View>
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchInputBox}>
              <FontAwesome5 name="search" size={14} color={Colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by ID, type, location, reporter..."
                placeholderTextColor={Colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Monitored Incidents Cards List */}
            {monitoredIncidents.map(report => (
              <TouchableOpacity key={report.id} style={styles.incidentCard} onPress={() => openModalWithReport(report)}>
                <View style={styles.incidentHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.incidentId}>{report.id}</Text>
                      {renderStageBadge(report.workflowStage || report.status)}
                    </View>
                    <Text style={styles.incidentType}>{report.type}</Text>
                  </View>
                  {renderResponseStatusBadge(report.responseStatus)}
                </View>

                <Text style={styles.incidentLoc}>📍 {report.location}</Text>
                <Text style={styles.incidentDesc} numberOfLines={2}>{report.description}</Text>

                {report.assignedPersonOrTeam && (
                  <View style={styles.assignedBoxMini}>
                    <FontAwesome5 name="user-shield" size={10} color={Colors.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.assignedBoxText}>Assigned: {report.assignedPersonOrTeam}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* MODAL 1: PASSCODE AUTHENTICATION MODAL */}
      {showAuthPasscodeModal && (
        <Modal visible={showAuthPasscodeModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentSmall}>
              <Text style={styles.modalTitle}>🔒 Authorize Super Admin Credentials</Text>
              <Text style={styles.modalSub}>Enter Super Admin Passcode (Default PIN: ADMIN2026)</Text>

              <TextInput
                style={styles.passcodeInput}
                placeholder="Enter PIN (e.g. ADMIN2026)"
                placeholderTextColor={Colors.textSecondary}
                secureTextEntry
                value={adminPasscode}
                onChangeText={setAdminPasscode}
              />

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity style={[styles.modalBtnSecondary, { flex: 1 }]} onPress={() => setShowAuthPasscodeModal(false)}>
                  <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtnPrimary, { flex: 1 }]}
                  onPress={() => {
                    if (adminPasscode === 'ADMIN2026' || adminPasscode === 'CSO') {
                      setIsAdminAuthorized(true);
                      setShowAuthPasscodeModal(false);
                      setAdminPasscode('');
                      Alert.alert('Access Granted', 'Super Admin authorization verified successfully.');
                    } else {
                      Alert.alert('Access Denied', 'Invalid passcode. Please enter ADMIN2026.');
                    }
                  }}
                >
                  <Text style={styles.modalBtnPrimaryText}>Unlock Access</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* MODAL 2: REGISTER COLLEGE MODAL */}
      {showRegisterCollegeModal && (
        <Modal visible={showRegisterCollegeModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>🏛️ Register New College</Text>
              <TextInput style={styles.modalInput} placeholder="University Full Name" value={colName} onChangeText={setColName} />
              <TextInput style={styles.modalInput} placeholder="Institution Code (e.g. MU)" value={colCode} onChangeText={setColCode} />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity style={[styles.modalBtnSecondary, { flex: 1 }]} onPress={() => setShowRegisterCollegeModal(false)}>
                  <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtnPrimary, { flex: 1 }]} onPress={handleRegisterCollege}>
                  <Text style={styles.modalBtnPrimaryText}>Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* MODAL 3: REPORT DETAIL & ACTION RESPONSE */}
      {detailModalReport && (
        <Modal visible={!!detailModalReport} transparent animationType="slide" onRequestClose={() => setDetailModalReport(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalReportId}>{detailModalReport.id}</Text>
                  <Text style={styles.modalReportType}>{detailModalReport.type}</Text>
                </View>
                <TouchableOpacity onPress={() => setDetailModalReport(null)}>
                  <FontAwesome5 name="times-circle" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalDesc}>{detailModalReport.description}</Text>
                <Text style={styles.modalLoc}>📍 Location: {detailModalReport.location}</Text>

                {/* Identity decrypt button */}
                <TouchableOpacity style={styles.decryptBtn} onPress={() => handleDecryptIdentity(detailModalReport)}>
                  <FontAwesome5 name="user-secret" size={12} color={Colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.decryptBtnText}>
                    {detailModalReport.isAnonymous ? 'Decrypt Reporter Identity (Authority Only)' : 'View Reporter Contact'}
                  </Text>
                </TouchableOpacity>

                {/* Verification Actions (Authority / Admin Only) */}
                {hasPermission(userRole, 'verify_reports') && (
                  <View style={{ marginVertical: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: Colors.text, marginBottom: 6 }}>Verification Actions:</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      <TouchableOpacity
                        style={[styles.filterChip, workflowActionType === 'verify' && styles.filterChipActive]}
                        onPress={() => setWorkflowActionType('verify')}
                      >
                        <Text style={[styles.filterChipText, workflowActionType === 'verify' && styles.filterChipTextActive]}>🛡️ Verify Report</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.filterChip, workflowActionType === 'reject' && styles.filterChipActive]}
                        onPress={() => setWorkflowActionType('reject')}
                      >
                        <Text style={[styles.filterChipText, workflowActionType === 'reject' && styles.filterChipTextActive]}>❌ Reject Report</Text>
                      </TouchableOpacity>
                    </View>

                    {workflowActionType && (
                      <View style={{ marginTop: 8 }}>
                        <TextInput
                          style={styles.modalInput}
                          placeholder="Add authority remarks..."
                          value={authorityRemarks}
                          onChangeText={setAuthorityRemarks}
                        />
                        <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleSubmitWorkflowAction}>
                          <Text style={styles.modalBtnPrimaryText}>Apply Verification Action</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {/* Response Action Management Section (Security Team / Authority) */}
                {(hasPermission(userRole, 'respond_to_incidents') || hasPermission(userRole, 'assign_actions')) && (
                  <View style={{ marginVertical: 8 }}>
                    <TouchableOpacity style={styles.toggleResponseFormBtn} onPress={() => setShowResponseForm(!showResponseForm)}>
                      <FontAwesome5 name="cogs" size={12} color={Colors.white} style={{ marginRight: 6 }} />
                      <Text style={styles.toggleResponseFormBtnText}>
                        {showResponseForm ? 'Close Security Response Form' : 'Update Response & Squad Assignment'}
                      </Text>
                    </TouchableOpacity>

                    {showResponseForm && (
                      <View style={styles.responseFormBox}>
                        <Text style={styles.inputLabel}>Assigned Patrol Squad:</Text>
                        <TextInput style={styles.modalInput} value={respPersonOrTeam} onChangeText={setRespPersonOrTeam} placeholder="e.g. Fort Alpha Patrol" />

                        <Text style={styles.inputLabel}>Response Status:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 6 }}>
                          {(['In Progress', 'On Scene', 'Action Completed', 'Resolved'] as const).map(st => (
                            <TouchableOpacity
                              key={st}
                              style={[styles.filterChip, respStatus === st && styles.filterChipActive]}
                              onPress={() => setRespStatus(st)}
                            >
                              <Text style={[styles.filterChipText, respStatus === st && styles.filterChipTextActive]}>{st}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>

                        <Text style={styles.inputLabel}>Action Taken Details:</Text>
                        <TextInput style={styles.modalInput} value={respActionTaken} onChangeText={setRespActionTaken} placeholder="e.g. Deployed patrol unit & escorted student" />

                        <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleSubmitAuthorityResponse}>
                          <Text style={styles.modalBtnPrimaryText}>Save Response Log</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setDetailModalReport(null)}>
                <Text style={styles.modalCloseBtnText}>Close Modal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const getStyles = () => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },

  headerCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    padding: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
  },
  headerIconCircle: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  headerSubtitle: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

  roleBadgePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
  roleBadgePillText: { fontSize: 9, fontWeight: 'bold' },

  rbacGuardCard: {
    backgroundColor: Colors.card, borderRadius: 18, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, marginVertical: 30,
  },
  rbacGuardIconCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  rbacGuardTitle: { fontSize: 17, fontWeight: 'bold', color: Colors.text, textAlign: 'center' },
  rbacGuardSub: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginVertical: 10, lineHeight: 17 },
  rbacRoleInfoBox: {
    backgroundColor: Colors.background, width: '100%', padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, marginVertical: 10,
  },
  rbacCurrentRoleText: { fontSize: 12, color: Colors.text },
  rbacRoleDescText: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  rbacSwitchHeader: { fontSize: 12, fontWeight: 'bold', color: Colors.text, marginTop: 10, alignSelf: 'flex-start' },
  rbacSwitchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1,
  },
  rbacSwitchBtnText: { fontSize: 12, fontWeight: 'bold' },

  portalTabBar: {
    flexDirection: 'row', backgroundColor: Colors.card, padding: 4, borderRadius: 14, marginVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  portalTabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 10 },
  portalTabBtnActive: { backgroundColor: Colors.primary },
  portalTabText: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
  portalTabTextActive: { color: Colors.white, fontWeight: 'bold' },

  roleLockCard: {
    backgroundColor: Colors.card, padding: 20, borderRadius: 14, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, marginVertical: 16,
  },
  roleLockTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.text },
  roleLockSub: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', marginVertical: 6 },
  unlockBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, marginTop: 4,
  },
  unlockBtnText: { color: Colors.white, fontSize: 12, fontWeight: 'bold' },

  mgmtHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  mgmtTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.text },
  mgmtSub: { fontSize: 10, color: Colors.textSecondary },
  registerCollegeBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
  },
  registerCollegeBtnText: { color: Colors.white, fontSize: 11, fontWeight: 'bold' },

  colChipBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  colChipBtnText: { fontSize: 10, fontWeight: '600', color: Colors.text },

  activeColOverviewCard: {
    backgroundColor: Colors.card, padding: 10, borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  colIconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  activeColName: { fontSize: 13, fontWeight: 'bold', color: Colors.text },
  activeColCode: { fontSize: 10, color: Colors.textSecondary },

  subTabBar: { gap: 4, paddingVertical: 4 },
  subTabBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  subTabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  subTabText: { fontSize: 10, fontWeight: '600', color: Colors.text },
  subTabTextActive: { color: Colors.white, fontWeight: 'bold' },

  mgmtSectionBox: { backgroundColor: Colors.card, padding: 12, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: Colors.border },
  mgmtSectionTitle: { fontSize: 13, fontWeight: 'bold', color: Colors.text },
  addBtnMini: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  addBtnMiniText: { fontSize: 9, fontWeight: 'bold', color: Colors.white },

  itemCard: { backgroundColor: Colors.background, padding: 10, borderRadius: 10, marginTop: 6, borderWidth: 1, borderColor: Colors.border },
  itemTitle: { fontSize: 12, fontWeight: 'bold', color: Colors.text },
  itemSub: { fontSize: 10, fontWeight: 'bold', color: Colors.primary, marginTop: 2 },
  itemDesc: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },

  geofencePill: { backgroundColor: Colors.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  geofencePillText: { fontSize: 9, fontWeight: 'bold', color: Colors.primary },
  shiftBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  shiftBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#D97706' },
  badgePill: { backgroundColor: Colors.safeLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgePillText: { fontSize: 9, fontWeight: 'bold', color: Colors.safe },

  section: { backgroundColor: Colors.card, padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: Colors.text },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chipScroll: { gap: 6 },
  scopeChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
  },
  scopeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  scopeChipText: { fontSize: 11, fontWeight: '600', color: Colors.text },
  scopeChipTextActive: { color: Colors.white, fontWeight: 'bold' },

  alertBannerCard: { backgroundColor: '#FEE2E2', padding: 10, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#EF4444' },
  alertBannerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  alertPulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#DC2626', marginRight: 4 },
  alertBannerTitle: { fontSize: 10, fontWeight: 'bold', color: '#DC2626' },
  alertBannerBody: { fontSize: 11, color: Colors.text },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  statCard: { width: '31%', backgroundColor: Colors.card, padding: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statIconBox: { width: 24, height: 24, borderRadius: 6, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  statNumber: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  statLabel: { fontSize: 9, color: Colors.textSecondary, textAlign: 'center' },

  searchInputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 12, color: Colors.text },

  incidentCard: { backgroundColor: Colors.background, padding: 10, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  incidentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  incidentId: { fontSize: 10, fontWeight: 'bold', color: Colors.primary },
  incidentType: { fontSize: 13, fontWeight: 'bold', color: Colors.text, marginTop: 1 },
  stageBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  stageBadgeText: { fontSize: 9, fontWeight: 'bold' },
  respStatusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  respStatusPillText: { fontSize: 9, fontWeight: 'bold' },
  incidentLoc: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, marginBottom: 2 },
  incidentDesc: { fontSize: 11, color: Colors.text, lineHeight: 15 },
  assignedBoxMini: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, padding: 4, borderRadius: 6, marginTop: 4 },
  assignedBoxText: { fontSize: 9, color: Colors.textSecondary },

  filterChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 10, fontWeight: '600', color: Colors.text },
  filterChipTextActive: { color: Colors.white, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 },
  modalContent: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  modalContentSmall: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.text, marginBottom: 2 },
  modalSub: { fontSize: 10, color: Colors.textSecondary, marginBottom: 8 },
  modalReportId: { fontSize: 10, fontWeight: 'bold', color: Colors.primary },
  modalReportType: { fontSize: 15, fontWeight: 'bold', color: Colors.text },
  modalDesc: { fontSize: 12, color: Colors.text, lineHeight: 16 },
  modalLoc: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  modalInput: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 8, fontSize: 12, color: Colors.text, marginBottom: 6 },
  inputLabel: { fontSize: 10, fontWeight: 'bold', color: Colors.textSecondary, marginBottom: 2, marginTop: 4 },
  passcodeInput: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, fontSize: 13, color: Colors.text, marginVertical: 8 },

  decryptBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryLight, padding: 8, borderRadius: 8, marginVertical: 8 },
  decryptBtnText: { fontSize: 10, fontWeight: 'bold', color: Colors.primary },

  toggleResponseFormBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 8, borderRadius: 8, marginVertical: 4 },
  toggleResponseFormBtnText: { color: Colors.white, fontSize: 11, fontWeight: 'bold' },

  responseFormBox: { backgroundColor: Colors.background, padding: 10, borderRadius: 10, marginVertical: 6, borderWidth: 1, borderColor: Colors.border },

  modalBtnPrimary: { backgroundColor: Colors.primary, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  modalBtnPrimaryText: { color: Colors.white, fontSize: 11, fontWeight: 'bold' },
  modalBtnSecondary: { backgroundColor: Colors.background, paddingVertical: 9, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  modalBtnSecondaryText: { color: Colors.text, fontSize: 11, fontWeight: 'bold' },
  modalCloseBtn: { backgroundColor: Colors.primary, paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  modalCloseBtnText: { color: Colors.white, fontSize: 12, fontWeight: 'bold' },
  logoutHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF444415',
    borderWidth: 1,
    borderColor: '#EF444440',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  logoutHeaderBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
});
