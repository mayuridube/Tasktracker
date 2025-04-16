/**
 * Main server file for VibeCode Platform
 * Sets up Express server with WebSocket support for real-time collaboration
 */

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const WebSocket = require('ws');
const { setupWebSocketServer } = require('./services/websocket');
const { initializeContainerManager } = require('./services/containerManager');
const apiRoutes = require('./routes/api');

// Create Express application
const app = express();
const server = http.createServer(app);

// Set port (3000 for the backend)
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRoutes);

// Initialize WebSocket server for real-time collaboration
const wss = new WebSocket.Server({ server, path: '/ws' });
setupWebSocketServer(wss);

// Initialize container manager
initializeContainerManager();

// If in production, serve static files from client/dist
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // For any route not matched by our API, send the index.html
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist/index.html'));
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'VibeCode server is running' });
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`VibeCode Server running on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket server running on ws://0.0.0.0:${PORT}/ws`);
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server };
