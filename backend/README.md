# Women Safety System & SafeRoute Platform 🛡️

A comprehensive, full-stack, enterprise-grade Women Safety & Institutional Emergency Response System.

---

## 🏗️ Architecture Overview

```
women-safety-system/
├── frontend/                         # React / React Native Client Application
├── backend/                          # Node.js + Express REST API Server
├── ai-service/                       # Python Flask ML Risk Prediction Microservice
├── database/                         # Relational SQL Schemas & MongoDB Seed Data
├── uploads/                          # Incident Evidence Storage (Images, Audio, Video)
└── docs/                             # System Architecture, API Specs & Setup Guides
```

---

## 🚀 Quick Start Guide

### 1. Backend Server Setup
```bash
cd backend
npm install
npm run dev
```

### 2. AI Risk Scoring Microservice Setup
```bash
cd ai-service
pip install -r requirements.txt
python app.py
```

### 3. Frontend Client Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Key Features
- **Community-Based Risk Detection**: Heatmaps and AI Area Risk Score computation (0–100).
- **Incident Verification Lifecycle**: `Submitted → Under Review → Verified → Action Taken → Resolved`.
- **Role-Based Access Control (RBAC)**: Student, College Authority, Security Patrol Squad, Super Admin.
- **Institutional Management**: Multi-Campus, Department, and Security Patrol Squad Administration.
