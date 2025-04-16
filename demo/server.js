const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Create Express application
const app = express();
const server = http.createServer(app);

// Set port (5000 - serving everything from one port)
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'WebSocket Demo server is running' });
});

// Serve main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });

// Store active clients
const clients = new Map();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  const clientId = uuidv4();
  const clientInfo = {
    id: clientId,
    name: `User-${clientId.substr(0, 4)}`,
    ws
  };
  
  // Add to clients map
  clients.set(clientId, clientInfo);
  
  console.log(`New client connected: ${clientId}`);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    clientId,
    message: `Welcome! You are connected as ${clientInfo.name}`,
    timestamp: new Date().toISOString()
  }));
  
  // Broadcast updated client list to all clients
  broadcastClientList();
  
  // Handle incoming messages
  ws.on('message', (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage);
      
      // Log received message
      console.log(`Message from ${clientId}: ${message.type}`);
      
      // Handle different message types
      switch (message.type) {
        case 'chat':
          // Broadcast chat message to all clients
          broadcastMessage(clientInfo, message.text);
          break;
          
        case 'setName':
          // Update client name
          clientInfo.name = message.name;
          broadcastClientList();
          break;
          
        case 'ping':
          // Respond with pong
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    console.log(`Client disconnected: ${clientId}`);
    clients.delete(clientId);
    broadcastClientList();
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for ${clientId}:`, error);
  });
});

// Broadcast the list of connected clients to all clients
function broadcastClientList() {
  const clientList = Array.from(clients.values()).map(client => ({
    id: client.id,
    name: client.name
  }));
  
  const message = JSON.stringify({
    type: 'clientList',
    clients: clientList,
    timestamp: new Date().toISOString()
  });
  
  broadcast(message);
}

// Broadcast a chat message to all clients
function broadcastMessage(sender, text) {
  const message = JSON.stringify({
    type: 'chat',
    senderId: sender.id,
    senderName: sender.name,
    text,
    timestamp: new Date().toISOString()
  });
  
  broadcast(message);
}

// Send a message to all connected clients
function broadcast(message) {
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket Demo server running on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket endpoint available at ws://0.0.0.0:${PORT}/ws`);
});