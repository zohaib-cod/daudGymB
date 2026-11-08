const mongoose = require("mongoose");

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return true;
  }

  if (isConnecting) {
    return false;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found in environment variables");
    return false;
  }

  isConnecting = true;
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    isConnecting = false;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnecting = false;
    console.warn(`[MongoDB Notice] Database connection error: ${error.message}`);
    return false;
  }
};

const getDBStatus = () => {
  return {
    isConnected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
  };
};

module.exports = { connectDB, getDBStatus };
