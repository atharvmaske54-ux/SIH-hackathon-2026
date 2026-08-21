# 🛡️ SafeRoute & GuardianX: Comprehensive System & Engineering Report

**Platform Name:** SafeRoute / GuardianX Enterprise Women Safety System  
**Version:** 1.0.0 Production Integration  
**Architecture:** Full-Stack Enterprise Monorepo (`women-safety-system`)  
**Date:** August 19, 2026  

---

## 📑 Table of Contents
1. [Executive Summary & System Overview](#1-executive-summary--system-overview)
2. [Complete Feature Catalog (All Modules)](#2-complete-feature-catalog-all-modules)
3. [Chronological Log of All Changes Implemented to Date](#3-chronological-log-of-all-changes-implemented-to-date)
4. [Functional & Utility Software Reference](#4-functional--utility-software-reference)
5. [Role-Based Access Control (RBAC) Security Architecture](#5-role-based-access-control-rbac-security-architecture)
6. [Technical Stack, APIs & Map Integration Specs](#6-technical-stack-apis--map-integration-specs)
7. [Enterprise Repository Architecture (`women-safety-system`)](#7-enterprise-repository-architecture-women-safety-system)

---

## 1. Executive Summary & System Overview

**SafeRoute (GuardianX)** is an AI-powered, multi-platform Women Safety and Emergency Response Platform designed for general communities, college campuses, and institutional security authorities.

The platform combines real-time hardware GPS tracking, community-based incident reporting, automated AI area risk detection (0–100 risk scoring), interactive geofence safety heatmaps, Turn-by-Turn Safe Routing, emergency SOS broadcasting, and an end-to-end **Authority Incident Command Portal** powered by strict **Role-Based Access Control (RBAC)**.

---

## 2. Complete Feature Catalog (All Modules)

### 1. 🆘 One-Tap Emergency SOS & Distress Signal
- **Instant SOS Trigger**: Prominent animated SOS button that triggers instant emergency dispatch.
- **Silent SOS**: Discrete alert activation for high-danger situations without alerting perpetrators.
- **Voice-Activated SOS**: Hands-free voice trigger mechanism.
- **Emergency Broadcast**: Automatically dispatches device GPS location, timestamp, and user profile to trusted contacts and college security desks.

### 2. 📞 Fake Call Simulation
- **Discreet Intrusion Evading**: Simulates incoming calls with customizable caller identity (*e.g., Mom, Campus Security Desk, Hostel Warden*).
- **Interactive Call Screen**: Realistic audio UI with Accept/Decline options to provide a safe exit strategy from suspicious or unsafe environments.

### 3. ⏱️ Companion Check-In Timer & Live Location Sharing
- **Safety Timer**: Countdown timer (*15 mins, 30 mins, 1 hr*) requiring periodic safety verification. Auto-triggers SOS if unverified upon expiry.
- **Live Location Broadcast**: Share live GPS coordinates with designated trusted emergency contacts.

### 4. 📢 Incident Reporting & Cryptographic Anonymity
- **Categorized Reporting**: 8 distinct incident categories (*Harassment, Poor Lighting, Suspicious Activity, Sexual Harassment, Stalking, Infrastructure Hazard, Physical Threat, Unsafe Transport*).
- **Media Evidence Attachments**: Supports photo capturing, video uploading, and voice memo evidence clips.
- **Cryptographic Anonymity**: Secures reporter identity using `ENC-AUTH-TOKEN[...]`. Reporter names are hidden from public view while permitting authority verification under authorized roles.
- **Auto-GPS Geocoding**: Automatically fetches high-accuracy GPS coordinates and reverse geocodes street address.

### 5. 🗺️ Upgraded Safety Map & Safe Routing
- **Dual Display Modes**: Native Google/Apple Maps view and interactive Web fallback.
- **Dynamic Heatmaps**: Visual representation of incident density and spatial risk.
- **Geofence Hotspots**: Circular safety boundaries around campus zones (*Powai, Fort, Kalina, VJTI*) displaying active incident counts.
- **Turn-by-Turn Safe Routing**: Integrates OSRM (Open Source Routing Machine) API to compute the safest path vs. fastest path based on historical safety scores.

### 6. 🧠 AI Community-Based Risk Detection
- **Pattern Analysis**: Detects spatial clusters of multiple reports in close proximity (<300m radius).
- **Temporal & Severity Risk Score**: Computes 0–100 Area Risk Score based on incident frequency, night-time factor, and category severity.
- **Risk Level Classification**: Classifies zones into *Low (0–34)*, *Medium (35–59)*, *High (60–74)*, and *Critical (75–100)*.

### 7. 🏛️ Authority Command Dashboard
- **Incident Monitoring Center**: Centralized table & grid list with instant search, category filters, campus filters, date sorting, and unresolved incident counters.
- **Incident Verification Lifecycle**: 5-Stage verification state machine:
  $$\text{Submitted} \longrightarrow \text{Under Review} \longrightarrow \text{Verified / Rejected} \longrightarrow \text{Action Taken} \longrightarrow \text{Resolved}$$
- **Security Squad Assignment**: Direct dispatch of incidents to security patrol teams (*e.g., Fort Alpha Patrol, Powai Night Squad*).
- **Response Management**: Log real-time response notes, change response status (*Not Started, In Progress, On Scene, Action Completed, Resolved*), and record resolution timestamps.

### 8. 📊 Incident Analytics & Telemetry
- **Campus Safety Score**: Real-time calculated safety index (0–100%) for monitored campuses.
- **Dynamic Visual Charts**: Displays Incidents by Location, Incidents by Category, Time-of-Day distribution, and Pending vs. Resolved completion rates.

### 9. 🔔 Community Safety Alerts & Notification Center
- **5 Alert Broadcast Channels**:
  1. *🚨 New Verified Incidents*
  2. *⚠️ High-Risk Area Clusters*
  3. *⚡ Temporary Hazards*
  4. *📢 Official Campus Safety Announcements*
  5. *🛡️ Safety Advisories*
- **Notification Drawer**: Unread badge counters and detail inspection popups.

### 10. 🏢 College & University Administration
- **Institutional Management**: CRUD capabilities for Colleges, Campuses, Departments, Security Squads, Authorized Officers, Emergency Hotlines, and Safety Geofences.

---

## 3. Chronological Log of All Changes Implemented to Date

| # | Improvement / Work Completed | Component Files Affected | Functional Impact |
| :- | :--- | :--- | :--- |
| **1** | **Incident Monitoring Implementation** | `authority-dashboard.tsx` | Added incident table, detail modal, location tracking, evidence preview, date/time log, and filtering by category, status, and campus. |
| **2** | **Verification Workflow Lifecycle** | `AppContext.tsx`, `authority-dashboard.tsx` | Added 5-stage lifecycle state machine (`Submitted → Under Review → Verified/Rejected → Action Taken → Resolved`) with immutable verification history log. |
| **3** | **Authority Response Management** | `authority-dashboard.tsx` | Added security patrol squad assignment, real-time response notes, status tracking (*In Progress, On Scene, Resolved*), and resolution timestamps. |
| **4** | **Upgraded Safety Map Integration** | `src/app/(tabs)/map.tsx` | Added community vs. verified incident overlays, campus geofences, heatmap toggles, high-risk area markers, and safer routing options. |
| **5** | **Community Risk Detection Engine** | `src/utils/riskDetection.ts` | Created automated pattern analysis algorithm calculating 0–100 Area Risk Scores and classifying zones into *Low, Medium, High, Critical*. |
| **6** | **Incident Analytics Dashboard** | `authority-dashboard.tsx` | Integrated dynamic Campus Safety Score calculations, incidents by category/location charts, and pending vs. resolved telemetry. |
| **7** | **Report Status Tracking for Reporters** | `report-incident.tsx` | Added real-time tracking tab for reporters to view verification stages, authority remarks, assigned squads, and resolution details while maintaining anonymity. |
| **8** | **Community Safety Alerts Center** | `alerts.tsx` | Integrated dynamic alert generators across 5 broadcast channels with unread badge indicators and category filter drawers. |
| **9** | **College & University Management** | `authority-dashboard.tsx`, `AppContext.tsx` | Added full institutional CRUD management for Colleges, Campuses, Departments, Security Squads, Hotlines, and Safety Geofences. |
| **10** | **Role-Based Access Control (RBAC)** | `src/utils/rbac.ts`, `AppContext.tsx`, `settings.tsx`, `authority-dashboard.tsx` | Defined 4 core roles (*Student, Authority, Patrol, Admin*), permission matrix, interactive role switcher in settings, and `protectApiCall` backend guard wrappers. |
| **11** | **Full Integration Pass** | `report-incident.tsx`, `map.tsx`, `alerts.tsx` | Removed static `COLLEGES_DATA` duplications; linked all 15 modules directly to `AppContext` dynamic state; verified type safety (`tsc` exit 0). |
| **12** | **Enterprise Architecture Setup** | `women-safety-system/` | Created standardized 5-tier monorepo (`frontend/`, `backend/`, `ai-service/`, `database/`, `uploads/`, `docs/`) with Node.js API, Python Flask AI microservice, and SQL schemas. |

---

## 4. Functional & Utility Software Reference

### Core Utility Functions (`src/utils/`)

1. `hasPermission(role: UserRole, permission: Permission): boolean`
   - Evaluates whether a specified user role possesses the requested permission in the master permissions matrix.

2. `canAccessRoute(role: UserRole, routePath: string): boolean`
   - Validates if a user role is authorized to navigate to a target application path.

3. `protectApiCall<T>(role: UserRole, requiredPermission: Permission, apiHandler: () => Promise<T>): Promise<T>`
   - Simulated server middleware that enforces backend authorization, throwing `403 Forbidden` on access violations.

4. `computeAreaRiskAnalysis(reports: IncidentReport[]): AreaRiskAnalysis[]`
   - Analyzes report spatial density (<300m radius), repeat incident frequency, night-time factors, and severity weights to calculate 0–100 Area Risk Scores.

5. `getRiskLevelColor(level: RiskLevel): string`
   - Returns token color mappings (`#10B981` Low, `#F59E0B` Medium, `#EF4444` High, `#7F1D1D` Critical).

6. `addReport(reportData: Partial<IncidentReport>): Promise<IncidentReport>`
   - Appends a new incident report to global `AppContext` state and persists to `AsyncStorage`.

7. `updateIncidentWorkflow(id: string, stage: string, remarks?: string): Promise<void>`
   - Advances report lifecycle stage and records an immutable log entry with actor and timestamp.

---

## 5. Role-Based Access Control (RBAC) Security Architecture

### Permission Matrix

| Role Key | Role Name | Granted Permissions |
| :--- | :--- | :--- |
| `student` | 🎓 Student / User | • `report_incident`<br>• `anonymous_reporting`<br>• `view_safety_map`<br>• `receive_alerts`<br>• `trigger_sos`<br>• `track_own_reports` |
| `college_authority` | 🏛️ College Authority | • `view_reports`<br>• `verify_reports`<br>• `monitor_incidents`<br>• `assign_actions`<br>• `update_status` |
| `security_team` | 🛡️ Security Patrol Squad | • `view_assigned_incidents`<br>• `respond_to_incidents`<br>• `update_response_status`<br>• `mark_resolved` |
| `super_admin` | 👑 Super Admin | • `manage_colleges`<br>• `manage_users`<br>• `manage_authorities`<br>• `monitor_system`<br>• `manage_risk_zones` |

---

## 6. Technical Stack, APIs & Map Integration Specs

### Technical Stack
- **Frontend Core**: React Native 0.85, Expo SDK 56, Expo Router 56 (File-based navigation)
- **Styling & UI**: Vanilla StyleSheet API with glassmorphism overlays and dark/light design system
- **State Management**: React Context API (`AppContext.tsx`) with `@react-native-async-storage/async-storage` persistence
- **Backend Server**: Node.js & Express (`backend/server.js`) on Port 5000
- **AI Microservice**: Python Flask (`ai-service/app.py`) on Port 5001 with scikit-learn Random Forest model
- **Database Engine**: PostgreSQL (`database/schemas/*.sql`) & MongoDB (`seed_data.js`)

### Map & Geolocation APIs
1. **`react-native-maps`** (`v1.27.2`): Renders native map views, markers, geofences, and polylines.
2. **`expo-location`** (`v56.0.15`): Device GPS coordinate fetching and reverse geocoding.
3. **OSRM (Open Source Routing Machine API)**: `https://router.project-osrm.org/route/v1/driving/...` for route calculation.
4. **OpenStreetMap Nominatim API**: `https://nominatim.openstreetmap.org/reverse` for web reverse geocoding.
5. **Google Maps Protocol**: `https://maps.google.com/?saddr=...&daddr=...` for launching native voice navigation.

---

## 7. Enterprise Repository Architecture (`women-safety-system`)

```
women-safety-system/
├── frontend/                         # React Client UI & SafeRoute App
├── backend/                          # Express REST API (Auth, Incidents, Admin, Risk)
├── ai-service/                       # Python Flask Microservice & Risk Predictor
├── database/                         # SQL Schemas (01_users.sql, 02_incidents.sql) & Seeders
├── uploads/                          # Evidence File Storage (images/, videos/, audio/)
└── docs/                             # System Architecture & API Specs
```
