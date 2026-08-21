# 🛡️ SafeRoute & GuardianX Women Safety Platform

> **Comprehensive Full-Stack Safety System**: Mobile Application, Admin Command Dashboard, Node.js + Express API Backend, Python AI Microservice, and MongoDB Atlas Integration.

---

## 📁 Repository Directory Structure

```text
final_year_project/
├── admin-frontend/         # React / Expo Web Admin & Authority Command Center
├── backend/                # Node.js + Express API & Microservice Hub
│   ├── ai-service/         # Python Flask AI Risk Analysis & Chatbot Engine
│   ├── config/             # Database & Server Configuration
│   ├── controllers/        # Express Route Controllers (Auth, SOS, Incidents, Maps, Admin)
│   ├── database/           # Mongoose Models & Data Handlers
│   ├── middleware/         # Auth, Role-Based Access Control (RBAC), File Uploads
│   ├── models/             # Mongoose Schemas (User, Incident, SOSAlert, Zone, AuditLog)
│   ├── routes/             # RESTful API Route Definitions
│   ├── store/              # File System Fallback Data Store
│   ├── uploads/            # Evidence & Audio File Storage
│   └── server.js           # Server Entry Point & Process Manager
├── docs/                   # System Documentation & Reports
│   ├── SafeRoute.docx                                  # Project Documentation Manual
│   ├── SafeRoute_Structure.md                          # Technical Architecture Breakdown
│   ├── comprehensive_system_report.md                 # Full System Analysis & Audit Report
│   ├── full_safety_modules_integration_walkthrough.md # Module Integration Walkthrough
│   └── gaurdianX_report.pdf                            # GuardianX System Specification Report
├── frontend/               # React Native + Expo User Mobile Application
├── uploads/                # Root Upload Directory
├── .gitignore              # Repository Git Ignore Specifications
├── LICENSE                 # MIT License
├── package.json            # Root Orchestrator Scripts
└── README.md               # Master Project Manual
```

---

## 🚀 Getting Started & Startup Commands

Run all commands from the repository root:

### 1. Installation
Install root dependencies:
```bash
npm install
```

### 2. Available NPM Scripts

| Component | Command | Description |
| :--- | :--- | :--- |
| **Backend API** | `npm run start:backend` | Starts Node.js + Express Server (`http://localhost:5000`) |
| **User Mobile App** | `npm run start:frontend` | Launches Expo Metro Bundler for User Mobile App |
| **Admin Dashboard** | `npm run start:admin` | Launches Admin Command & Telemetry Web Application |
| **AI Microservice** | `npm run start:ai` | Starts Python Flask AI Risk & Chatbot Engine (`http://localhost:5001`) |
| **Backend Test Suite** | `npm run test:backend` | Runs E2E API Verification Suite |
| **MongoDB Seeder** | `npm run seed:mongodb` | Seeds MongoDB database with initial sample dataset |

---

## ⚙️ Environment Configuration

1. Copy `backend/.env.example` to `backend/.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Update the environment variables in `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/women_safety_db?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret_key_here
   ADMIN_PASSCODE=YOUR_ADMIN_PASSCODE_HERE
   AI_SERVICE_URL=http://localhost:5001
   ```

---

## 🗄️ Architecture & Module Summary

### 1. User Mobile App (`frontend/`)
- **Technology**: React Native, Expo Router, TypeScript, React Context.
- **Key Features**:
  - One-Touch SOS Signal Broadcast.
  - Interactive Safe Navigation Heatmaps & Safe Zone Overlays.
  - Incident Reporting with Audio & Image Attachment Uploads.
  - Companion Walk Check-in Timer with Auto-Escalation.
  - Floating 6-Petal AI Safety Assistant Chatbot.

### 2. Admin & Authority Command Center (`admin-frontend/`)
- **Technology**: React Native Web, Expo, Custom Dashboard Widgets.
- **Key Features**:
  - Live Emergency SOS Dispatcher & Real-Time Telemetry Cards.
  - 5-Stage Incident Verification Workflow (`Submitted` ➔ `Under Review` ➔ `Verified` ➔ `Action Taken` ➔ `Resolved`).
  - Patrol Alpha Dispatch & Security Asset Management.
  - Broadcast Emergency Alerts to Campus / Community Users.

### 3. Express API & MongoDB Backend (`backend/`)
- **Technology**: Node.js, Express.js, Mongoose ORM, MongoDB Atlas.
- **Key Features**:
  - Secure JWT Authentication & Role-Based Access Control (`User`, `Admin`, `Responder`).
  - Auto-Spawning / Monitoring of Embedded Python Flask AI Engine.
  - Seamless Failover between Cloud Database and Local File Data Store.

### 4. AI Risk Engine (`backend/ai-service/`)
- **Technology**: Python 3, Flask, Custom Heuristic Risk Scoring.
- **Key Features**:
  - Real-time Location Safety Assessment (Heatmaps & Risk Indexing).
  - Contextual Safety Advisory AI Assistant.

---

## 📄 Documentation Directory (`docs/`)

The `docs/` folder contains complete project reports, architecture documents, and walkthrough guides:
- [SafeRoute Structure Guide](docs/SafeRoute_Structure.md)
- [Comprehensive System Report](docs/comprehensive_system_report.md)
- [Full Integration Walkthrough](docs/full_safety_modules_integration_walkthrough.md)
- [SafeRoute Word Manual](docs/SafeRoute.docx)
- [GuardianX PDF Report](docs/gaurdianX_report.pdf)

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
