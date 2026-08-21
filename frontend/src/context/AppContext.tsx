import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setGlobalTheme } from '../constants/Colors';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { Alert } from 'react-native';
import {
  College,
  Campus,
  Department,
  SecurityTeam,
  AuthorizedAuthority,
  EmergencyContact,
  CampusSafetyZone,
  COLLEGES_DATA,
} from '../constants/Colleges';
import { UserRole } from '../utils/rbac';

export type Contact = {
  id: string;
  name: string;
  phone: string;
  relation: string;
};

export type User = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  role: UserRole;
  collegeId?: string;
  collegeName?: string;
  campusId?: string;
  badgeNumber?: string;
  departmentId?: string;
  assignedTeam?: string;
};

export type VerificationHistoryEntry = {
  id: string;
  timestamp: string;
  stage: 'Submitted' | 'Under Review' | 'Verified' | 'Rejected' | 'Action Taken' | 'Resolved';
  actionName: string;
  performedBy: string;
  remarks?: string;
  assignedTo?: string;
  requestedInfo?: string;
};

export type IncidentReport = {
  id: string;
  type: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  dateTime: string;
  photoUri?: string | null;
  videoUri?: string | null;
  audioUri?: string | null;
  isAnonymous?: boolean;
  reporterName?: string;
  authorityEncryptedIdentity?: string;
  collegeId?: string;
  collegeName?: string;
  campusId?: string;
  campusName?: string;
  status: 'Pending' | 'Verified' | 'Resolved';
  workflowStage?: 'Submitted' | 'Under Review' | 'Verified' | 'Rejected' | 'Action Taken' | 'Resolved';
  assignedAuthority?: string;
  assignedPersonOrTeam?: string;
  responseStatus?: 'Not Started' | 'In Progress' | 'On Scene' | 'Action Completed' | 'Resolved';
  responseNotes?: string;
  actionTaken?: string;
  resolutionDetails?: string;
  resolutionDate?: string;
  remarks?: string;
  requestedInfoNote?: string;
  history?: VerificationHistoryEntry[];
  createdAt: string;
};

type AppContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  switchUserRole: (newRole: UserRole) => Promise<void>;
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id'>) => void;
  editContact: (id: string, contact: Omit<Contact, 'id'>) => void;
  removeContact: (id: string) => void;
  reports: IncidentReport[];
  addReport: (reportData: Omit<IncidentReport, 'id' | 'createdAt' | 'status'>) => Promise<IncidentReport>;
  updateReportStatus: (id: string, status: 'Pending' | 'Verified' | 'Resolved') => Promise<void>;
  updateVerificationWorkflow: (
    reportId: string,
    payload: {
      stage: 'Submitted' | 'Under Review' | 'Verified' | 'Rejected' | 'Action Taken' | 'Resolved';
      actionName: string;
      remarks?: string;
      assignedTo?: string;
      requestedInfo?: string;
      performedBy?: string;
    }
  ) => Promise<void>;
  updateAuthorityResponse: (
    reportId: string,
    payload: {
      assignedPersonOrTeam?: string;
      responseStatus?: 'Not Started' | 'In Progress' | 'On Scene' | 'Action Completed' | 'Resolved';
      responseNotes?: string;
      actionTaken?: string;
      resolutionDetails?: string;
      performedBy?: string;
    }
  ) => Promise<void>;
  selectedCollegeId: string | null;
  setSelectedCollegeId: (id: string | null) => void;
  selectedCampusId: string | null;
  setSelectedCampusId: (id: string | null) => void;
  
  colleges: College[];
  addCollege: (collegeData: Omit<College, 'id' | 'campuses'>) => Promise<College>;
  addCampus: (collegeId: string, campusData: Omit<Campus, 'id' | 'collegeId'>) => Promise<void>;
  addDepartment: (collegeId: string, deptData: Omit<Department, 'id'>) => Promise<void>;
  addSecurityTeam: (collegeId: string, teamData: Omit<SecurityTeam, 'id'>) => Promise<void>;
  addAuthorizedAuthority: (collegeId: string, authority: Omit<AuthorizedAuthority, 'id'>) => Promise<void>;
  addEmergencyContact: (collegeId: string, contactData: Omit<EmergencyContact, 'id'>) => Promise<void>;
  addCampusSafetyZone: (collegeId: string, zoneData: Omit<CampusSafetyZone, 'id'>) => Promise<void>;

  theme: 'light' | 'dark';
  toggleTheme: () => void;
  triggerSOS: () => Promise<void>;
  checkInEndTime: number | null;
  startCheckIn: (durationMinutes: number) => void;
  cancelCheckIn: () => void;
  liveSharingEndTime: number | null;
  liveSharingLink: string | null;
  startLiveSharing: (durationMinutes: number) => string;
  stopLiveSharing: () => void;
};

const DEFAULT_INITIAL_USER: User = {
  id: 'usr-student-001',
  name: 'Jane Student',
  email: 'jane.student@mu.ac.in',
  phone: '+91 98765 43210',
  role: 'student',
  collegeId: 'mu',
  collegeName: 'University of Mumbai',
};

const INITIAL_MOCK_REPORTS: IncidentReport[] = [];

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:5000/api/v1';

const fetchBackendIncidents = async (): Promise<IncidentReport[] | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/incidents`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        return data.data as IncidentReport[];
      }
    }
  } catch (err) {
    // API server offline or network unavailable - fallback to local storage
  }
  return null;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_INITIAL_USER);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [reports, setReports] = useState<IncidentReport[]>(INITIAL_MOCK_REPORTS);
  const [colleges, setColleges] = useState<College[]>(COLLEGES_DATA);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string | null>(null);
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [checkInEndTime, setCheckInEndTime] = useState<number | null>(null);
  const [liveSharingEndTime, setLiveSharingEndTime] = useState<number | null>(null);
  const [liveSharingLink, setLiveSharingLink] = useState<string | null>(null);
  
  const timerIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedContacts = await AsyncStorage.getItem('contacts');
        const storedReports = await AsyncStorage.getItem('incident_reports');
        const storedColleges = await AsyncStorage.getItem('managed_colleges');
        const storedTheme = await AsyncStorage.getItem('appTheme') as 'light' | 'dark';
        
        if (storedUser) {
          const parsedU = JSON.parse(storedUser);
          if (parsedU) setUser({ ...DEFAULT_INITIAL_USER, ...parsedU });
        }
        if (storedContacts) setContacts(JSON.parse(storedContacts));

        let localReports: IncidentReport[] = INITIAL_MOCK_REPORTS;
        if (storedReports) {
          const parsed = JSON.parse(storedReports);
          if (parsed && parsed.length > 0) localReports = parsed;
        }

        // Real-Time Sync on initial load with Backend DataStore
        const remoteIncidents = await fetchBackendIncidents();
        if (remoteIncidents && remoteIncidents.length > 0) {
          const remoteMap = new Map(remoteIncidents.map(i => [i.id, i]));
          localReports.forEach(l => {
            if (!remoteMap.has(l.id)) {
              remoteMap.set(l.id, l);
            }
          });
          const merged = Array.from(remoteMap.values());
          setReports(merged);
          await AsyncStorage.setItem('incident_reports', JSON.stringify(merged));
        } else {
          setReports(localReports);
        }

        if (storedColleges) {
          const parsedC = JSON.parse(storedColleges);
          if (parsedC && parsedC.length > 0) setColleges(parsedC);
        }
        
        if (storedTheme) {
          setTheme(storedTheme);
          setGlobalTheme(storedTheme);
        } else {
          setGlobalTheme('dark');
        }
      } catch (e) {
        console.error('Failed to load data', e);
      }
    };
    loadData();

    // Background Real-Time Synchronization Polling (every 4 seconds)
    const syncInterval = setInterval(async () => {
      const remoteIncidents = await fetchBackendIncidents();
      if (remoteIncidents && remoteIncidents.length > 0) {
        setReports(prevReports => {
          const remoteMap = new Map(remoteIncidents.map(i => [i.id, i]));
          prevReports.forEach(l => {
            if (!remoteMap.has(l.id)) {
              remoteMap.set(l.id, l);
            }
          });
          const merged = Array.from(remoteMap.values());
          if (JSON.stringify(merged) !== JSON.stringify(prevReports)) {
            AsyncStorage.setItem('incident_reports', JSON.stringify(merged));
            return merged;
          }
          return prevReports;
        });
      }
    }, 4000);

    return () => clearInterval(syncInterval);
  }, []);

  const saveUser = async (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
    } else {
      await AsyncStorage.removeItem('user');
    }
  };

  const switchUserRole = async (newRole: UserRole) => {
    const current = user || DEFAULT_INITIAL_USER;
    let newName = current.name;
    let newEmail = current.email;

    if (newRole === 'college_authority') {
      newName = 'Dr. M. Kulkarni (CSO Desk)';
      newEmail = 'cso@mu.ac.in';
    } else if (newRole === 'security_team') {
      newName = 'Fort Alpha Security Patrol Squad';
      newEmail = 'patrol.alpha@mu.ac.in';
    } else if (newRole === 'super_admin') {
      newName = 'System Super Admin';
      newEmail = 'admin@saferoute.edu';
    } else if (newRole === 'student') {
      newName = 'Jane Student';
      newEmail = 'jane.student@mu.ac.in';
    }

    const updatedUser: User = {
      ...current,
      name: newName,
      email: newEmail,
      role: newRole,
      assignedTeam: newRole === 'security_team' ? 'Fort Alpha Patrol' : undefined,
    };

    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const addContact = async (contactInfo: Omit<Contact, 'id'>) => {
    const newContact = { ...contactInfo, id: Date.now().toString() };
    const updated = [...contacts, newContact];
    setContacts(updated);
    await AsyncStorage.setItem('contacts', JSON.stringify(updated));
  };

  const removeContact = async (id: string) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    await AsyncStorage.setItem('contacts', JSON.stringify(updated));
  };

  const editContact = async (id: string, contactInfo: Omit<Contact, 'id'>) => {
    const updated = contacts.map(c => c.id === id ? { ...contactInfo, id } : c);
    setContacts(updated);
    await AsyncStorage.setItem('contacts', JSON.stringify(updated));
  };

  const addReport = async (reportData: Omit<IncidentReport, 'id' | 'createdAt' | 'status'>) => {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const newId = `INC-${todayStr}-${randomCode}`;
    
    const isAnon = reportData.isAnonymous !== false;
    const actualUserName = user?.name || 'Verified User';
    const actualContact = user?.email || user?.phone || 'ID-78219';
    
    const initHistory: VerificationHistoryEntry = {
      id: `HIST-${Date.now()}-INIT`,
      timestamp: new Date().toLocaleString(),
      stage: 'Submitted',
      actionName: 'Report Logged',
      performedBy: isAnon ? 'Anonymous Citizen' : actualUserName,
      remarks: 'Report registered in system.',
    };

    const localReport: IncidentReport = {
      ...reportData,
      id: newId,
      isAnonymous: isAnon,
      reporterName: isAnon ? 'Anonymous Citizen' : actualUserName,
      authorityEncryptedIdentity: isAnon 
        ? `ENC-AUTH-TOKEN[${btoa?.(actualContact) || 'SECURE_HASH_' + randomCode}]` 
        : actualContact,
      status: 'Pending',
      workflowStage: 'Submitted',
      responseStatus: 'Not Started',
      history: [initHistory],
      createdAt: new Date().toISOString(),
    };

    let finalReport = localReport;

    // Send POST request to existing backend API
    try {
      const res = await fetch(`${API_BASE_URL}/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || 'student',
        },
        body: JSON.stringify(localReport),
      });

      if (res.ok) {
        const body = await res.json();
        if (body && body.success && body.data) {
          finalReport = body.data;
        }
      }
    } catch (e) {
      console.warn('[AppContext.addReport] Backend sync fallback to local store');
    }

    setReports(prev => {
      const updated = [finalReport, ...prev.filter(r => r.id !== finalReport.id)];
      AsyncStorage.setItem('incident_reports', JSON.stringify(updated));
      return updated;
    });

    return finalReport;
  };

  const updateReportStatus = async (id: string, status: 'Pending' | 'Verified' | 'Resolved') => {
    await updateVerificationWorkflow(id, {
      stage: status === 'Verified' ? 'Verified' : status === 'Resolved' ? 'Resolved' : 'Under Review',
      actionName: `Status updated to ${status}`,
    });
  };

  const updateVerificationWorkflow = async (
    reportId: string,
    payload: {
      stage: 'Submitted' | 'Under Review' | 'Verified' | 'Rejected' | 'Action Taken' | 'Resolved';
      actionName: string;
      remarks?: string;
      assignedTo?: string;
      requestedInfo?: string;
      performedBy?: string;
    }
  ) => {
    // Sync with backend API endpoint
    try {
      await fetch(`${API_BASE_URL}/incidents/${reportId}/workflow`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || 'college_authority',
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn('[AppContext.updateVerificationWorkflow] Backend PATCH failed, using local update');
    }

    const timestamp = new Date().toLocaleString();
    const newHistEntry: VerificationHistoryEntry = {
      id: `HIST-${Date.now()}`,
      timestamp,
      stage: payload.stage,
      actionName: payload.actionName,
      performedBy: payload.performedBy || 'Campus Security Command',
      remarks: payload.remarks,
      assignedTo: payload.assignedTo,
      requestedInfo: payload.requestedInfo,
    };

    setReports(prev => {
      const updated = prev.map(r => {
        if (r.id !== reportId) return r;

        const currentHist = r.history || [];
        const newHist = [...currentHist, newHistEntry];

        let newOverallStatus: 'Pending' | 'Verified' | 'Resolved' = r.status;
        if (payload.stage === 'Verified') newOverallStatus = 'Verified';
        else if (payload.stage === 'Resolved') newOverallStatus = 'Resolved';
        else if (payload.stage === 'Rejected') newOverallStatus = 'Pending';

        return {
          ...r,
          status: newOverallStatus,
          workflowStage: payload.stage,
          assignedAuthority: payload.assignedTo || r.assignedAuthority,
          assignedPersonOrTeam: payload.assignedTo || r.assignedPersonOrTeam,
          remarks: payload.remarks || r.remarks,
          requestedInfoNote: payload.requestedInfo || r.requestedInfoNote,
          history: newHist,
        };
      });

      AsyncStorage.setItem('incident_reports', JSON.stringify(updated));
      return updated;
    });
  };

  const updateAuthorityResponse = async (
    reportId: string,
    payload: {
      assignedPersonOrTeam?: string;
      responseStatus?: 'Not Started' | 'In Progress' | 'On Scene' | 'Action Completed' | 'Resolved';
      responseNotes?: string;
      actionTaken?: string;
      resolutionDetails?: string;
      performedBy?: string;
    }
  ) => {
    // Sync with backend API endpoint
    try {
      await fetch(`${API_BASE_URL}/incidents/${reportId}/workflow`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || 'security_team',
        },
        body: JSON.stringify({
          stage: payload.responseStatus === 'Resolved' ? 'Resolved' : 'Action Taken',
          responseStatus: payload.responseStatus,
          responseNotes: payload.responseNotes,
          actionTaken: payload.actionTaken,
          resolutionDetails: payload.resolutionDetails,
          assignedPersonOrTeam: payload.assignedPersonOrTeam,
          performedBy: payload.performedBy,
        }),
      });
    } catch (e) {
      console.warn('[AppContext.updateAuthorityResponse] Backend PATCH failed, using local update');
    }

    const timestamp = new Date().toLocaleString();
    setReports(prev => {
      const updated = prev.map(r => {
        if (r.id !== reportId) return r;

        const currentHist = r.history || [];
        const histEntry: VerificationHistoryEntry = {
          id: `HIST-RESP-${Date.now()}`,
          timestamp,
          stage: payload.responseStatus === 'Resolved' ? 'Resolved' : r.workflowStage || 'Action Taken',
          actionName: `Response Update: ${payload.responseStatus || 'In Progress'}`,
          performedBy: payload.performedBy || 'Command Desk Officer',
          remarks: payload.actionTaken || payload.responseNotes || 'Authority action logged.',
          assignedTo: payload.assignedPersonOrTeam,
        };

        let newStatus = r.status;
        let newStage = r.workflowStage;
        if (payload.responseStatus === 'Resolved') {
          newStatus = 'Resolved';
          newStage = 'Resolved';
        }

        return {
          ...r,
          status: newStatus,
          workflowStage: newStage,
          assignedPersonOrTeam: payload.assignedPersonOrTeam || r.assignedPersonOrTeam,
          responseStatus: payload.responseStatus || r.responseStatus,
          responseNotes: payload.responseNotes || r.responseNotes,
          actionTaken: payload.actionTaken || r.actionTaken,
          resolutionDetails: payload.resolutionDetails || r.resolutionDetails,
          resolutionDate: payload.responseStatus === 'Resolved' ? timestamp : r.resolutionDate,
          history: [...currentHist, histEntry],
        };
      });

      AsyncStorage.setItem('incident_reports', JSON.stringify(updated));
      return updated;
    });
  };

  const saveCollegesToStorage = async (updatedList: College[]) => {
    setColleges(updatedList);
    await AsyncStorage.setItem('managed_colleges', JSON.stringify(updatedList));
  };

  const addCollege = async (collegeData: Omit<College, 'id' | 'campuses'>) => {
    const newId = `col-${Date.now().toString(36)}`;
    const newCollege: College = {
      ...collegeData,
      id: newId,
      campuses: [],
      departments: [],
      securityTeams: [],
      authorizedAuthorities: [],
      emergencyContacts: [],
      campusSafetyZones: [],
    };
    const updated = [...colleges, newCollege];
    await saveCollegesToStorage(updated);
    return newCollege;
  };

  const addCampus = async (collegeId: string, campusData: Omit<Campus, 'id' | 'collegeId'>) => {
    const newId = `cmp-${Date.now().toString(36)}`;
    const newCampus: Campus = {
      ...campusData,
      id: newId,
      collegeId,
    };
    const updated = colleges.map(col => {
      if (col.id !== collegeId) return col;
      return {
        ...col,
        campuses: [...(col.campuses || []), newCampus],
      };
    });
    await saveCollegesToStorage(updated);
  };

  const addDepartment = async (collegeId: string, deptData: Omit<Department, 'id'>) => {
    const newId = `dept-${Date.now().toString(36)}`;
    const newDept: Department = { ...deptData, id: newId };
    const updated = colleges.map(col => {
      if (col.id !== collegeId) return col;
      return {
        ...col,
        departments: [...(col.departments || []), newDept],
      };
    });
    await saveCollegesToStorage(updated);
  };

  const addSecurityTeam = async (collegeId: string, teamData: Omit<SecurityTeam, 'id'>) => {
    const newId = `sec-${Date.now().toString(36)}`;
    const newTeam: SecurityTeam = { ...teamData, id: newId };
    const updated = colleges.map(col => {
      if (col.id !== collegeId) return col;
      return {
        ...col,
        securityTeams: [...(col.securityTeams || []), newTeam],
      };
    });
    await saveCollegesToStorage(updated);
  };

  const addAuthorizedAuthority = async (collegeId: string, authData: Omit<AuthorizedAuthority, 'id'>) => {
    const newId = `auth-${Date.now().toString(36)}`;
    const newAuth: AuthorizedAuthority = { ...authData, id: newId };
    const updated = colleges.map(col => {
      if (col.id !== collegeId) return col;
      return {
        ...col,
        authorizedAuthorities: [...(col.authorizedAuthorities || []), newAuth],
      };
    });
    await saveCollegesToStorage(updated);
  };

  const addEmergencyContact = async (collegeId: string, contactData: Omit<EmergencyContact, 'id'>) => {
    const newId = `em-${Date.now().toString(36)}`;
    const newContact: EmergencyContact = { ...contactData, id: newId };
    const updated = colleges.map(col => {
      if (col.id !== collegeId) return col;
      return {
        ...col,
        emergencyContacts: [...(col.emergencyContacts || []), newContact],
      };
    });
    await saveCollegesToStorage(updated);
  };

  const addCampusSafetyZone = async (collegeId: string, zoneData: Omit<CampusSafetyZone, 'id'>) => {
    const newId = `zone-${Date.now().toString(36)}`;
    const newZone: CampusSafetyZone = { ...zoneData, id: newId };
    const updated = colleges.map(col => {
      if (col.id !== collegeId) return col;
      return {
        ...col,
        campusSafetyZones: [...(col.campusSafetyZones || []), newZone],
      };
    });
    await saveCollegesToStorage(updated);
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setGlobalTheme(newTheme);
    await AsyncStorage.setItem('appTheme', newTheme);
  };

  const triggerSOS = async () => {
    if (contacts.length === 0) {
      Alert.alert('No Emergency Contacts', 'Please add emergency contacts first.');
      return;
    }

    try {
      let locationString = 'Location unavailable';
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        locationString = `https://maps.google.com/?q=${loc.coords.latitude},${loc.coords.longitude}`;
      }

      const message = `EMERGENCY! I need help. My current location: ${locationString}`;
      const phoneNumbers = contacts.map(c => c.phone);
      
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(phoneNumbers, message);
      } else {
        Alert.alert('SOS Triggered', 'Location obtained, but SMS is not available on this device.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to send SOS');
    }
  };

  const startCheckIn = (durationMinutes: number) => {
    const endTime = Date.now() + durationMinutes * 60 * 1000;
    setCheckInEndTime(endTime);
    Alert.alert('Check-In Started', `Timer set for ${durationMinutes} minutes. If not cancelled, SOS will trigger automatically.`);
  };

  const cancelCheckIn = () => {
    setCheckInEndTime(null);
    Alert.alert('Check-In Cancelled', 'Your safety timer has been stopped.');
  };

  const startLiveSharing = (durationMinutes: number) => {
    const endTime = Date.now() + durationMinutes * 60 * 1000;
    setLiveSharingEndTime(endTime);
    const linkId = Math.random().toString(36).substring(2, 10);
    const link = `https://saferoute.app/track/${linkId}`;
    setLiveSharingLink(link);
    return link;
  };

  const stopLiveSharing = () => {
    setLiveSharingEndTime(null);
    setLiveSharingLink(null);
  };

  useEffect(() => {
    if (checkInEndTime || liveSharingEndTime) {
      timerIntervalRef.current = setInterval(() => {
        const now = Date.now();
        
        if (checkInEndTime && now >= checkInEndTime) {
          setCheckInEndTime(null);
          triggerSOS();
        }
        
        if (liveSharingEndTime && now >= liveSharingEndTime) {
          setLiveSharingEndTime(null);
          setLiveSharingLink(null);
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [checkInEndTime, liveSharingEndTime, contacts]);

  return (
    <AppContext.Provider value={{ 
      user, setUser: saveUser, switchUserRole,
      contacts, addContact, editContact, removeContact, 
      reports, addReport, updateReportStatus, updateVerificationWorkflow, updateAuthorityResponse,
      selectedCollegeId, setSelectedCollegeId,
      selectedCampusId, setSelectedCampusId,
      colleges, addCollege, addCampus, addDepartment, addSecurityTeam, addAuthorizedAuthority, addEmergencyContact, addCampusSafetyZone,
      theme, toggleTheme,
      triggerSOS, checkInEndTime, startCheckIn, cancelCheckIn,
      liveSharingEndTime, liveSharingLink, startLiveSharing, stopLiveSharing
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
