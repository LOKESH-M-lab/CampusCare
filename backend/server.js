/**
 * CampusCare – Student Complaint & Request Management System
 * Backend Server Entry Point
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

// =========================================================================
// SERVERLESS MONGOOSE CONNECTION HANDLER
// =========================================================================

let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is missing.');
  }

  // Connect and reuse existing connection across serverless invocations
  cachedConnection = await mongoose.connect(MONGODB_URI, {
    bufferCommands: false, // Prevents queries from hanging for 10 seconds if disconnected
    serverSelectionTimeoutMS: 5000
  });

  return cachedConnection;
}

// =========================================================================
// MIDDLEWARE CONFIGURATION
// =========================================================================

app.use(
  cors({
    origin: CLIENT_ORIGIN === '*' ? true : CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath, { index: false }));

// Database connection gate: ensures DB is fully ready before any route runs
app.use(async (req, res, next) => {
  // Allow health endpoint to respond even during connection check
  if (req.path === '/api/health') return next();

  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error('Database connection error on route:', req.path, err.message);
    res.status(500).json({
      success: false,
      message: 'Database connection failed. Please verify MongoDB Atlas credentials and IP access.'
    });
  }
});

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// =========================================================================
// API ROUTES
// =========================================================================

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await connectToDatabase();
  } catch (err) {
    console.warn('Health check DB connect attempt:', err.message);
  }

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

const complaintRoutes = require('./routes/complaintRoutes');
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);

// Explicit frontend route fallbacks
app.get('/', (req, res) => res.sendFile(path.join(frontendPath, 'home.html')));
app.get('/home', (req, res) => res.sendFile(path.join(frontendPath, 'home.html')));
app.get('/home.html', (req, res) => res.sendFile(path.join(frontendPath, 'home.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(frontendPath, 'home.html')));
app.get('/student-login', (req, res) => res.sendFile(path.join(frontendPath, 'student-login.html')));
app.get('/student-login.html', (req, res) => res.sendFile(path.join(frontendPath, 'student-login.html')));
app.get('/student-register', (req, res) => res.sendFile(path.join(frontendPath, 'student-register.html')));
app.get('/student-register.html', (req, res) => res.sendFile(path.join(frontendPath, 'student-register.html')));
app.get('/student', (req, res) => res.sendFile(path.join(frontendPath, 'student.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(frontendPath, 'admin.html')));
app.get('/login', (req, res) => res.sendFile(path.join(frontendPath, 'login.html')));

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

// Start local listener only when run directly (not inside Vercel serverless functions)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CampusCare Server running on port: ${PORT}`);
  });
}

module.exports = app;