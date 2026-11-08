const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB, getDBStatus } = require("./config/db");
const memberRoutes = require("./routes/memberRoutes");

// Load Environment Variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Database on startup
connectDB();

// Middleware: Auto ensure DB connection for serverless invocations (e.g., Vercel cold starts)
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (e) {
    // Non-blocking, fallback will handle if needed
  }
  next();
});

// Middleware: CORS for local development and deployed frontend (e.g. Vercel)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Body parsers with 25MB limit to comfortably accept high-res base64 pictures
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Health Check & Root Endpoints
const healthHandler = (req, res) => {
  const dbStatus = getDBStatus();
  res.json({
    status: "online",
    service: "FG & S.M Fitness Gym Backend API",
    owners: ["Saqib Mehmood", "Ali Daud"],
    database: dbStatus.isConnected ? "Connected to MongoDB Atlas" : "Local Fallback Ready",
    time: new Date().toISOString(),
  });
};

app.get("/", healthHandler);
app.get("/api", healthHandler);
app.get("/api/health", healthHandler);
app.get("/health", healthHandler);

// API Routes mounted on both /api/members and /members for Vercel rewrites compatibility
app.use("/api/members", memberRoutes);
app.use("/members", memberRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled backend error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// Only listen locally or when not hosted as a serverless function
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🏋️‍♂️  FG & S.M Fitness Gym - Backend API Server`);
    console.log(`🚀  Server running on http://localhost:${PORT}`);
    console.log(`👑  Owners: Saqib Mehmood & Ali Daud`);
    console.log(`📡  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`==================================================\n`);
  });
}

module.exports = app;
