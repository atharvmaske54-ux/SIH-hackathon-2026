const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const sosRoutes = require('./routes/sosRoutes');
const fakeCallRoutes = require('./routes/fakeCallRoutes');
const companionRoutes = require('./routes/companionRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const mapRoutes = require('./routes/mapRoutes');
const riskRoutes = require('./routes/riskRoutes');
const alertRoutes = require('./routes/alertRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend and mobile apps
app.use(cors());

// Parse JSON and urlencoded body payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file hosting for evidence uploads (photos, videos, audio)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Core API Route Integration
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sos', sosRoutes);
app.use('/api/v1/fake-call', fakeCallRoutes);
app.use('/api/v1/companion', companionRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/map', mapRoutes);
app.use('/api/v1/risk', riskRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/admin', adminRoutes);

// System Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    system: 'SafeRoute & GuardianX Enterprise Women Safety API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[SafeRoute API Error]:', err.stack || err.message || err);
  res.status(err.status || 500).json({
    success: false,
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred on the safety system server.'
  });
});

// 404 Route Fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `API endpoint '${req.originalUrl}' does not exist.`
  });
});

const { connectDB, isMongoDBConnected } = require('./config/db');
const { spawn } = require('child_process');

// Connect to MongoDB Atlas
connectDB();

// Auto-launch Python AI Microservice child process so no separate terminal is needed
let aiProcess = null;
const startAIService = () => {
  const aiServicePath = path.join(__dirname, 'ai-service/app.py');
  try {
    aiProcess = spawn('python', [aiServicePath], {
      stdio: 'ignore',
      detached: false
    });
    console.log('[SafeRoute AI Engine] Auto-launched Python AI microservice (Port 5001)');

    aiProcess.on('error', (err) => {
      console.log('[SafeRoute AI Engine] Notice:', err.message);
    });
  } catch (err) {
    console.log('[SafeRoute AI Engine] Running in intelligent embedded Node fallback mode');
  }
};

app.listen(PORT, () => {
  console.log(`[SafeRoute Enterprise Backend] Running on port ${PORT}`);
  console.log(`[SafeRoute API Docs] Base URL: http://localhost:${PORT}/api/v1`);
  startAIService();
});

module.exports = app;

