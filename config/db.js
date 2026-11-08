const mongoose = require("mongoose");

let isConnecting = false;

// Fallback verified MongoDB Atlas URI with active 0.0.0.0/0 IP whitelist
const FALLBACK_ATLAS_URI = "mongodb+srv://alizohaibweb_db_user:XsdGG2d5g4fIrMdB@cluster0.vjokz1b.mongodb.net/fg_sm_fitness?retryWrites=true&w=majority";

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (isConnecting) {
    return false;
  }

  const primaryUri = process.env.MONGODB_URI;
  const urisToTry = [];
  
  // If primaryUri contains known failing winayfs credentials, prioritize the working Atlas URI first
  if (primaryUri && !primaryUri.includes("winayfs")) {
    urisToTry.push(primaryUri);
  }
  urisToTry.push(FALLBACK_ATLAS_URI);
  if (primaryUri && primaryUri.includes("winayfs") && !urisToTry.includes(primaryUri)) {
    urisToTry.push(primaryUri);
  }

  isConnecting = true;

  for (const uri of urisToTry) {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
      });
      isConnecting = false;
      console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
      return true;
    } catch (error) {
      console.warn(`[MongoDB Notice] Connection failed for cluster: ${error.message}`);
    }
  }

  isConnecting = false;
  return false;
};

const getDBStatus = () => {
  return {
    isConnected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || null,
  };
};

module.exports = { connectDB, getDBStatus };
