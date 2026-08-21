const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://atharvmaske54_db_user:O3FBWxGtrjDKYQLS@cluster0.f1aduhb.mongodb.net/women_safety_db?retryWrites=true&w=majority&appName=Cluster0';

let isConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    isConnected = true;
    console.log(`[MongoDB Atlas Connected ✅]: Host = ${conn.connection.host}, Database = ${conn.connection.name}`);
    return conn;
  } catch (error) {
    isConnected = false;
    console.warn(`[MongoDB Atlas Notice]: ${error.message}`);
    console.log(`[DataStore Fallback]: Operating local persistent store db_store.json.`);
    return null;
  }
};

const isMongoDBConnected = () => isConnected && mongoose.connection.readyState === 1;

module.exports = {
  connectDB,
  isMongoDBConnected,
  MONGO_URI
};


