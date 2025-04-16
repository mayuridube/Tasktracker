const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Initialize express app and create HTTP server
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
require('fs').mkdirSync(publicDir, { recursive: true });

// Create a minimal HTML page
const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebSocket Chat</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        #chat { height: 300px; overflow-y: scroll; border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; }
        #users { float: right; width: 150px; height: 300px; overflow-y: scroll; border: 1px solid #ccc; padding: 10px; }
        .message { margin-bottom: 5px; }
        .system { color: #888; }
        form { display: flex; }
        input[type="text"] { flex: 1; padding: 5px; }
        button { padding: 5px 10px; background: #007bff; color: white; border: none; }
    </style>
</head>
<body>
    <h1>WebSocket Chat</h1>
    
    <div id="users">
        <h3>Online Users</h3>
        <ul id="usersList"></ul>
    </div>
    
    <div id="chat"></div>
    
    <form id="messageForm">
        <input type="text" id="messageInput" placeholder="Type a message..." autocomplete="off">
        <button type="submit">Send</button>
    </form>
    
    <p>
        <input type="text" id="nameInput" placeholder="Your name">
        <button id="setNameButton">Set Name</button>
    </p>
    
    <script>
        const chat = document.getElementById('chat');
        const usersList = document.getElementById('usersList');
        const messageForm = document.getElementById('messageForm');
        const messageInput = document.getElementById('messageInput');
        const nameInput = document.getElementById('nameInput');
        const setNameButton = document.getElementById('setNameButton');
        
        let socket;
        
        // Connect to WebSocket server
        function connectWebSocket() {
            // Use the correct WebSocket URL (ws:// or wss:// protocol)
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = protocol + '//' + window.location.host + '/ws';
            
            socket = new WebSocket(wsUrl);
            
            // Connection opened
            socket.addEventListener('open', (event) => {
                addSystemMessage('Connected to server');
            });
            
            // Listen for messages
            socket.addEventListener('message', (event) => {
                const message = JSON.parse(event.data);
                
                switch (message.type) {
                    case 'welcome':
                        addSystemMessage(message.message);
                        break;
                        
                    case 'chat':
                        addChatMessage(message.senderName, message.text);
                        break;
                        
                    case 'systemMessage':
                        addSystemMessage(message.message);
                        break;
                        
                    case 'clientList':
                        updateUsersList(message.clients);
                        break;
                }
            });
            
            // Connection closed
            socket.addEventListener('close', (event) => {
                addSystemMessage('Disconnected from server. Trying to reconnect...');
                
                // Try to reconnect after 3 seconds
                setTimeout(connectWebSocket, 3000);
            });
            
            // Connection error
            socket.addEventListener('error', (event) => {
                console.error('WebSocket error:', event);
            });
        }
        
        // Add a chat message
        function addChatMessage(sender, text) {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.textContent = sender + ': ' + text;
            chat.appendChild(messageElement);
            chat.scrollTop = chat.scrollHeight;
        }
        
        // Add a system message
        function addSystemMessage(text) {
            const messageElement = document.createElement('div');
            messageElement.className = 'message system';
            messageElement.textContent = '🔔 ' + text;
            chat.appendChild(messageElement);
            chat.scrollTop = chat.scrollHeight;
        }
        
        // Update the users list
        function updateUsersList(clients) {
            usersList.innerHTML = '';
            
            clients.forEach(client => {
                const li = document.createElement('li');
                li.textContent = client.name;
                usersList.appendChild(li);
            });
        }
        
        // Send a chat message
        function sendChatMessage(text) {
            if (!socket || socket.readyState !== WebSocket.OPEN || !text.trim()) {
                return;
            }
            
            const message = {
                type: 'chat',
                text: text.trim()
            };
            
            socket.send(JSON.stringify(message));
            messageInput.value = '';
        }
        
        // Set the user's name
        function setUserName(name) {
            if (!socket || socket.readyState !== WebSocket.OPEN || !name.trim()) {
                return;
            }
            
            const message = {
                type: 'setName',
                name: name.trim()
            };
            
            socket.send(JSON.stringify(message));
            addSystemMessage('You changed your name to ' + name.trim());
        }
        
        // Event listeners
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendChatMessage(messageInput.value);
        });
        
        setNameButton.addEventListener('click', () => {
            setUserName(nameInput.value);
        });
        
        // Initialize WebSocket connection
        connectWebSocket();
    </script>
</body>
</html>
`;

// Write the index.html file
require('fs').writeFileSync(path.join(publicDir, 'index.html'), indexHtml);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'WebSocket Server is running' });
});

// Serve main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
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
    name: 'User-' + clientId.substr(0, 4),
    ws
  };
  
  // Add to clients map
  clients.set(clientId, clientInfo);
  
  console.log('New client connected: ' + clientId);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    clientId,
    message: 'Welcome! You are connected as ' + clientInfo.name,
    timestamp: new Date().toISOString()
  }));
  
  // Broadcast updated client list to all clients
  broadcastClientList();
  
  // Handle incoming messages
  ws.on('message', (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage);
      
      // Log received message
      console.log('Message from ' + clientId + ': ' + message.type);
      
      // Handle different message types
      switch (message.type) {
        case 'chat':
          // Regular chat message
          broadcastMessage(clientInfo, message.text);
          break;
          
        case 'setName':
          // Update client name
          clientInfo.name = message.name;
          broadcastClientList();
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
    console.log('Client disconnected: ' + clientId);
    clients.delete(clientId);
    broadcastClientList();
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error for ' + clientId + ':', error);
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
  console.log('WebSocket Server running on port ' + PORT);
  console.log('WebSocket endpoint available at ws://localhost:' + PORT + '/ws');
  console.log('Access the chat interface at http://localhost:' + PORT);
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