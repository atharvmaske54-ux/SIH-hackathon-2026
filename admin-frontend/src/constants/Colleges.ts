export interface Campus {
  id: string;
  collegeId: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  radius: number; // radius in meters for safety geofencing
  description: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headName: string;
  phone: string;
  email: string;
}

export interface SecurityTeam {
  id: string;
  teamName: string;
  shift: 'Day' | 'Night' | '24x7';
  leaderName: string;
  contactPhone: string;
  activePatrolZone: string;
}

export interface AuthorizedAuthority {
  id: string;
  name: string;
  role: 'Super Admin' | 'Chief Security Officer' | 'Campus Security Supervisor' | 'Maintenance Lead';
  email: string;
  phone: string;
  badgeNumber: string;
  active: boolean;
}

export interface EmergencyContact {
  id: string;
  title: string;
  phone: string;
  category: 'Police' | 'Medical' | 'Fire' | 'Campus Security' | 'Women Helpline';
  is24x7: boolean;
}

export interface CampusSafetyZone {
  id: string;
  zoneName: string;
  riskLevel: 'Safe' | 'Moderate' | 'High' | 'Critical';
  radiusMeters: number;
  status: 'Active Surveillance' | 'Patrol Deployed' | 'Hazard Area';
}

export interface College {
  id: string;
  name: string;
  shortName: string;
  code: string;
  icon: string;
  color: string;
  campuses: Campus[];
  departments?: Department[];
  securityTeams?: SecurityTeam[];
  authorizedAuthorities?: AuthorizedAuthority[];
  emergencyContacts?: EmergencyContact[];
  campusSafetyZones?: CampusSafetyZone[];
}

export const COLLEGES_DATA: College[] = [
  {
    id: 'mu',
    name: 'University of Mumbai',
    shortName: 'Mumbai Univ',
    code: 'MU',
    icon: 'university',
    color: '#3B82F6',
    campuses: [
      {
        id: 'mu-kalina',
        collegeId: 'mu',
        name: 'Kalina Vidyanagari Campus',
        location: 'Santacruz East, Mumbai',
        latitude: 19.0728,
        longitude: 72.8652,
        radius: 1200,
        description: 'Main Academic & Research Complex, Santacruz East',
      },
      {
        id: 'mu-fort',
        collegeId: 'mu',
        name: 'Fort Heritage Campus',
        location: 'Fort, South Mumbai',
        latitude: 18.9297,
        longitude: 72.8315,
        radius: 800,
        description: 'Administrative Headquarters & Rajabai Clock Tower',
      },
    ],
    departments: [
      { id: 'dept-mu-1', name: 'Computer Science & IT', code: 'CSIT', headName: 'Dr. R. Sharma', phone: '+91 98200 11223', email: 'csit@mu.ac.in' },
      { id: 'dept-mu-2', name: 'Law & Jurisprudence', code: 'LAW', headName: 'Prof. A. Deshmukh', phone: '+91 98200 22334', email: 'law@mu.ac.in' },
    ],
    securityTeams: [
      { id: 'sec-mu-1', teamName: 'Fort Alpha Patrol', shift: 'Night', leaderName: 'Officer V. Kadam', contactPhone: '+91 91234 56789', activePatrolZone: 'Rajabai & South Gate' },
      { id: 'sec-mu-2', teamName: 'Kalina Campus Squad', shift: '24x7', leaderName: 'Insp. S. Patil', contactPhone: '+91 91234 98765', activePatrolZone: 'Library Promenade' },
    ],
    authorizedAuthorities: [
      { id: 'auth-mu-1', name: 'Dr. M. K. Kulkarni', role: 'Chief Security Officer', email: 'cso@mu.ac.in', phone: '+91 99887 76655', badgeNumber: 'MU-SEC-001', active: true },
      { id: 'auth-mu-2', name: 'Officer V. Kadam', role: 'Campus Security Supervisor', email: 'vkadam@mu.ac.in', phone: '+91 91234 56789', badgeNumber: 'MU-SEC-042', active: true },
    ],
    emergencyContacts: [
      { id: 'em-mu-1', title: 'MU Fort Security Control Room', phone: '022-22652825', category: 'Campus Security', is24x7: true },
      { id: 'em-mu-2', title: 'Kalina Campus Emergency Medical Desk', phone: '022-26543000', category: 'Medical', is24x7: true },
      { id: 'em-mu-3', title: 'Women Safety Helpline (Fort Jurisdiction)', phone: '1091', category: 'Women Helpline', is24x7: true },
    ],
    campusSafetyZones: [
      { id: 'zone-mu-1', zoneName: 'Clock Tower Walkway', riskLevel: 'Safe', radiusMeters: 300, status: 'Active Surveillance' },
      { id: 'zone-mu-2', zoneName: 'Back Bay Promenade (Hostel Gate)', riskLevel: 'Moderate', radiusMeters: 450, status: 'Patrol Deployed' },
    ],
  },
  {
    id: 'iitb',
    name: 'Indian Institute of Technology Bombay',
    shortName: 'IIT Bombay',
    code: 'IITB',
    icon: 'graduation-cap',
    color: '#8B5CF6',
    campuses: [
      {
        id: 'iitb-powai',
        collegeId: 'iitb',
        name: 'Powai Main Campus',
        location: 'Powai, Mumbai',
        latitude: 19.1334,
        longitude: 72.9133,
        radius: 1800,
        description: 'Main Residential & Academic Campus, Powai Lake',
      },
    ],
    departments: [
      { id: 'dept-iitb-1', name: 'Computer Science & Engineering', code: 'CSE', headName: 'Prof. U. Bellur', phone: '+91 22 2576 7901', email: 'head@cse.iitb.ac.in' },
      { id: 'dept-iitb-2', name: 'Electrical Engineering', code: 'EE', headName: 'Prof. S. Chaudhuri', phone: '+91 22 2576 7401', email: 'head@ee.iitb.ac.in' },
    ],
    securityTeams: [
      { id: 'sec-iitb-1', teamName: 'Powai Main Gate Quick Response', shift: '24x7', leaderName: 'Capt. R. Mehta', contactPhone: '+91 22 2576 9999', activePatrolZone: 'Main Gate & Lakeside' },
    ],
    authorizedAuthorities: [
      { id: 'auth-iitb-1', name: 'Capt. R. Mehta', role: 'Chief Security Officer', email: 'cso@iitb.ac.in', phone: '+91 22 2576 9999', badgeNumber: 'IITB-SEC-01', active: true },
    ],
    emergencyContacts: [
      { id: 'em-iitb-1', title: 'IIT Bombay Quick Response Control Room', phone: '022-25769999', category: 'Campus Security', is24x7: true },
      { id: 'em-iitb-2', title: 'IIT Hospital Emergency Desk', phone: '022-25767555', category: 'Medical', is24x7: true },
    ],
    campusSafetyZones: [
      { id: 'zone-iitb-1', zoneName: 'Infinite Corridor & Academic Block', riskLevel: 'Safe', radiusMeters: 600, status: 'Active Surveillance' },
    ],
  },
  {
    id: 'vjti',
    name: 'Veermata Jijabai Technological Institute',
    shortName: 'VJTI Mumbai',
    code: 'VJTI',
    icon: 'cogs',
    color: '#EC4899',
    campuses: [
      {
        id: 'vjti-matunga',
        collegeId: 'vjti',
        name: 'Matunga Engineering Campus',
        location: 'Matunga West, Mumbai',
        latitude: 19.0222,
        longitude: 72.8561,
        radius: 1000,
        description: 'Historic Engineering Campus, Matunga',
      },
    ],
  },
  {
    id: 'kjsieit',
    name: 'K.J. Somaiya College of Engineering',
    shortName: 'Somaiya Engg',
    code: 'KJSIEIT',
    icon: 'laptop-code',
    color: '#10B981',
    campuses: [
      {
        id: 'kjsieit-vidyavihar',
        collegeId: 'kjsieit',
        name: 'Vidyavihar Knowledge City Campus',
        location: 'Vidyavihar East, Mumbai',
        latitude: 19.0732,
        longitude: 72.8997,
        radius: 1500,
        description: '60-Acre Integrated Education Complex',
      },
    ],
  },
  {
    id: 'sndt',
    name: "SNDT Women's University",
    shortName: 'SNDT Univ',
    code: 'SNDT',
    icon: 'female',
    color: '#F59E0B',
    campuses: [
      {
        id: 'sndt-churchgate',
        collegeId: 'sndt',
        name: 'Churchgate Campus',
        location: 'Churchgate, South Mumbai',
        latitude: 18.9324,
        longitude: 72.8277,
        radius: 700,
        description: 'First Women University Campus, Marine Lines',
      },
      {
        id: 'sndt-juhu',
        collegeId: 'sndt',
        name: 'Juhu Campus',
        location: 'Juhu Tara Road, Mumbai',
        latitude: 19.0964,
        longitude: 72.8306,
        radius: 1000,
        description: 'Academic & Technology Complex, Juhu',
      },
    ],
  },
];
