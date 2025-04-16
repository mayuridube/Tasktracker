/**
 * Main API router for VibeCode
 * Centralizes all sub-routes for different platform features
 */

const express = require('express');
const router = express.Router();

// Import sub-routers
const projectsRouter = require('./projects');
const deploymentRouter = require('./deployment');
const databaseRouter = require('./database');

// Register all routes
router.use('/projects', projectsRouter);
router.use('/deployments', deploymentRouter);
router.use('/database', databaseRouter);

// Auth endpoints - simplified for the prototype
let mockUsers = [
  { id: 'user1', name: 'Demo User', email: 'demo@vibecode.dev', password: 'password123' }
];

// Authentication routes
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = mockUsers.find(user => user.email === email && user.password === password);
  
  if (user) {
    const { password, ...userData } = user;
    res.json({
      success: true,
      user: userData,
      token: 'mock-jwt-token-' + Date.now() // In a real app, use JWT
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

router.post('/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  
  if (mockUsers.some(user => user.email === email)) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }
  
  const newUser = {
    id: 'user' + (mockUsers.length + 1),
    name,
    email,
    password
  };
  
  mockUsers.push(newUser);
  
  const { password: _, ...userData } = newUser;
  
  res.status(201).json({
    success: true,
    user: userData,
    token: 'mock-jwt-token-' + Date.now()
  });
});

router.get('/auth/me', (req, res) => {
  // In a real app, verify JWT from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  // Mock authenticated user
  res.json({
    success: true,
    user: {
      id: 'user1',
      name: 'Demo User',
      email: 'demo@vibecode.dev'
    }
  });
});

router.post('/auth/logout', (req, res) => {
  // In a real app, invalidate JWT or session
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Root API route for testing
router.get('/', (req, res) => {
  res.json({
    message: 'VibeCode API is working',
    version: '1.0.0'
  });
});

module.exports = router;
