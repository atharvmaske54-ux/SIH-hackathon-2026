const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { connectDB } = require('../config/db');

async function purgeAllData() {
  console.log('[SafeRoute Purge System] Initiating database sanitization...');

  // 1. Clean local persistent store db_store.json
  const dbStorePath = path.join(__dirname, 'db_store.json');
  if (fs.existsSync(dbStorePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(dbStorePath, 'utf8'));
      data.incidents = [];
      data.contacts = [];
      data.sosSessions = [];
      data.alerts = [];
      fs.writeFileSync(dbStorePath, JSON.stringify(data, null, 2), 'utf8');
      console.log('[Local Store Purge ✅]: Wiped all dummy incidents, contacts, and SOS sessions from db_store.json.');
    } catch (err) {
      console.error('Failed to clean db_store.json:', err);
    }
  }

  // 2. Connect & Clean MongoDB Atlas Collections
  try {
    const conn = await connectDB();
    if (conn && mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;

      // List all collections
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);

      console.log(`[MongoDB Atlas] Found collections: ${collectionNames.join(', ')}`);

      // Collections to purge
      const targetCollections = ['incidents', 'sossessions', 'sos_sessions', 'sos', 'emergency_contacts', 'alerts', 'companions'];

      for (const colName of collectionNames) {
        if (targetCollections.includes(colName.toLowerCase())) {
          await db.collection(colName).deleteMany({});
          console.log(`[MongoDB Atlas Purge ✅]: Cleared all documents from '${colName}'.`);
        }
      }

      console.log('[MongoDB Atlas Purge ✅]: Database successfully sanitized.');
    }
  } catch (err) {
    console.error('Error purging MongoDB Atlas:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('[SafeRoute Purge System] Complete.');
    process.exit(0);
  }
}

purgeAllData();
