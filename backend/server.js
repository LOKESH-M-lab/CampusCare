/**
 * CampusCare – Student Complaint & Request Management System
 * Backend Server Entry Point
 * 
 * Technologies:
 *  - Node.js & Express.js
 *  - MongoDB & Mongoose
 *  - CORS & Dotenv
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campuscare';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

// =========================================================================
// MIDDLEWARE CONFIGURATION
// =========================================================================

// Enable Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: CLIENT_ORIGIN === '*' ? true : CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parsers for JSON and URL-encoded requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files directly from the Express server
// This enables visiting http://localhost:5000 to use the full application seamlessly
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath, { index: false }));

// Request logging middleware for debugging during development
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// =========================================================================
// DATABASE CONNECTION (MongoDB via Mongoose)
// =========================================================================

console.log('Connecting to MongoDB at:', MONGODB_URI);

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000 // Fast failure detection if MongoDB is stopped
  })
  .then(() => {
    console.log('--------------------------------------------------');
    console.log('✅ Connected to MongoDB database successfully: campuscare');
    console.log('--------------------------------------------------');
  })
  .catch((err) => {
    console.error('--------------------------------------------------');
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('👉 Please make sure MongoDB service is running:');
    console.error('   Windows command: net start MongoDB');
    console.error('   Or configure your cloud MongoDB Atlas URI in backend/.env');
    console.error('--------------------------------------------------');
  });

// =========================================================================
// API ROUTES
// =========================================================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  res.status(200).json({
    status: 'online',
    appName: 'CampusCare API',
    version: '1.0.0',
    database: states[dbState] || 'Unknown',
    uptime: process.uptime() + 's'
  });
});

// Complaint management routes
const complaintRoutes = require('./routes/complaintRoutes');
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);

// Explicit route fallbacks for the frontend HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'student-login.html'));
});

app.get('/student-login', (req, res) => {
  res.sendFile(path.join(frontendPath, 'student-login.html'));
});

app.get('/student-login.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'student-login.html'));
});

app.get('/student-register', (req, res) => {
  res.sendFile(path.join(frontendPath, 'student-register.html'));
});

app.get('/student-register.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'student-register.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(frontendPath, 'home.html'));
});

app.get('/home.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'home.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'home.html'));
});

app.get('/student', (req, res) => {
  res.sendFile(path.join(frontendPath, 'student.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

// 404 Handler for API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// =========================================================================
// START SERVER
// =========================================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log(`🚀 CampusCare Server is running on port: ${PORT}`);
  console.log(`🌐 Local Application URL: http://localhost:${PORT}`);
  console.log(`📡 API Endpoints:        http://localhost:${PORT}/api/complaints`);
  console.log(`🩺 Health Check:          http://localhost:${PORT}/api/health`);
  console.log('====================================================');
});
// ADD THIS LINE:
module.exports = app;