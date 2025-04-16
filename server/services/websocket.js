/**
 * WebSocket service for real-time collaboration
 * Manages WebSocket connections and message routing
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Store active collaborators by project ID
const collaborators = new Map();

// Store active terminal sessions by project ID
const terminalSessions = new Map();

/**
 * Sets up the WebSocket server
 * @param {WebSocket.Server} wss - WebSocket server instance
 */
function setupWebSocketServer(wss) {
  wss.on('connection', (ws, req) => {
    // Extract path from request to determine the context
    const path = req.url;
    const socketId = uuidv4();
    
    // Assign ID to socket for tracking
    ws.id = socketId;
    
    console.log(`WebSocket connection established: ${socketId} at ${path}`);
    
    // Handle terminal-specific connections
    if (path.startsWith('/ws/terminal/')) {
      // Extract project ID from path
      const projectId = path.split('/').pop();
      handleTerminalConnection(ws, projectId);
    } else {
      // Handle regular collaboration connections
      handleCollaborationConnection(ws);
    }
    
    // Set up ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);
    
    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleMessage(ws, data);
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        sendErrorToClient(ws, 'Failed to process message');
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log(`WebSocket connection closed: ${socketId}`);
      clearInterval(pingInterval);
      
      // Clean up collaborator if this was a collaboration connection
      removeCollaborator(ws);
      
      // Clean up terminal session if this was a terminal connection
      for (const [projectId, sessions] of terminalSessions.entries()) {
        if (sessions.has(socketId)) {
          terminalSessions.get(projectId).delete(socketId);
          console.log(`Terminal session removed for project ${projectId}`);
          break;
        }
      }
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for ${socketId}:`, error);
    });
  });
  
  // Broadcast server status every minute
  setInterval(() => {
    broadcastServerStatus(wss);
  }, 60000);
  
  console.log('WebSocket server initialized');
}

/**
 * Handles a terminal connection
 * @param {WebSocket} ws - WebSocket connection
 * @param {string} projectId - Project ID
 */
function handleTerminalConnection(ws, projectId) {
  if (!terminalSessions.has(projectId)) {
    terminalSessions.set(projectId, new Map());
  }
  
  // Store the terminal session
  terminalSessions.get(projectId).set(ws.id, ws);
  
  // Send a welcome message
  ws.send(JSON.stringify({
    type: 'terminal',
    output: `Connected to terminal for project ${projectId}.\nType 'help' for available commands.`
  }));
}

/**
 * Handles a collaboration connection
 * @param {WebSocket} ws - WebSocket connection
 */
function handleCollaborationConnection(ws) {
  // Initial connection setup - no specific handling needed yet
  // User will identify themselves via a message later
}

/**
 * Handles incoming messages
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} data - Message data
 */
function handleMessage(ws, data) {
  const { type, projectId } = data;
  
  if (!type) {
    return sendErrorToClient(ws, 'Message type is required');
  }
  
  switch (type) {
    case 'heartbeat':
      // Respond to heartbeat with pong
      ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      break;
      
    case 'join_collaboration':
      if (!projectId || !data.user) {
        return sendErrorToClient(ws, 'Project ID and user data are required');
      }
      addCollaborator(ws, projectId, data.user);
      break;
      
    case 'leave_collaboration':
      if (!projectId) {
        return sendErrorToClient(ws, 'Project ID is required');
      }
      removeCollaborator(ws);
      break;
      
    case 'chat_message':
      if (!projectId || !data.user || !data.message) {
        return sendErrorToClient(ws, 'Project ID, user data, and message are required');
      }
      broadcastChatMessage(projectId, data.user, data.message, data.timestamp);
      break;
      
    case 'file_change':
      if (!projectId || !data.fileName || data.content === undefined) {
        return sendErrorToClient(ws, 'Project ID, file name, and content are required');
      }
      broadcastFileChange(ws, projectId, data.fileName, data.content);
      break;
      
    case 'cursor_position':
      if (!projectId || !data.user || !data.position) {
        return sendErrorToClient(ws, 'Project ID, user data, and cursor position are required');
      }
      broadcastCursorPosition(ws, projectId, data.user, data.position);
      break;
      
    case 'component_added':
    case 'component_removed':
    case 'component_updated':
      if (!projectId) {
        return sendErrorToClient(ws, 'Project ID is required');
      }
      broadcastComponentAction(ws, type, projectId, data);
      break;
      
    case 'command':
      if (!projectId || !data.command) {
        return sendErrorToClient(ws, 'Project ID and command are required');
      }
      handleTerminalCommand(ws, projectId, data.command);
      break;
      
    default:
      sendErrorToClient(ws, `Unknown message type: ${type}`);
  }
}

/**
 * Adds a collaborator to a project
 * @param {WebSocket} ws - WebSocket connection
 * @param {string} projectId - Project ID
 * @param {Object} user - User data
 */
function addCollaborator(ws, projectId, user) {
  // Initialize project collaborators if needed
  if (!collaborators.has(projectId)) {
    collaborators.set(projectId, new Map());
  }
  
  const projectCollaborators = collaborators.get(projectId);
  
  // Store user data with this socket
  ws.user = user;
  ws.projectId = projectId;
  
  // Add to collaborators map
  projectCollaborators.set(ws.id, { ws, user });
  
  // Notify other collaborators about new user
  projectCollaborators.forEach((collaborator, id) => {
    if (id !== ws.id && collaborator.ws.readyState === WebSocket.OPEN) {
      collaborator.ws.send(JSON.stringify({
        type: 'user_joined',
        user,
        timestamp: new Date().toISOString()
      }));
    }
  });
  
  // Send the current list of collaborators to the new user
  const currentCollaborators = Array.from(projectCollaborators.values())
    .map(c => c.user)
    .filter(u => u.id !== user.id);
  
  ws.send(JSON.stringify({
    type: 'collaborators_list',
    collaborators: currentCollaborators,
    timestamp: new Date().toISOString()
  }));
  
  console.log(`User ${user.name} (${ws.id}) joined project ${projectId}`);
}

/**
 * Removes a collaborator
 * @param {WebSocket} ws - WebSocket connection
 */
function removeCollaborator(ws) {
  const { projectId, user } = ws;
  
  if (projectId && collaborators.has(projectId)) {
    const projectCollaborators = collaborators.get(projectId);
    
    // Remove from collaborators map
    projectCollaborators.delete(ws.id);
    
    // If the user object exists, notify other collaborators
    if (user) {
      projectCollaborators.forEach((collaborator) => {
        if (collaborator.ws.readyState === WebSocket.OPEN) {
          collaborator.ws.send(JSON.stringify({
            type: 'user_left',
            user,
            timestamp: new Date().toISOString()
          }));
        }
      });
      
      console.log(`User ${user.name} (${ws.id}) left project ${projectId}`);
    }
    
    // Clean up if this was the last collaborator
    if (projectCollaborators.size === 0) {
      collaborators.delete(projectId);
      console.log(`No more collaborators for project ${projectId}`);
    }
  }
}

/**
 * Broadcasts a chat message to all collaborators on a project
 * @param {string} projectId - Project ID
 * @param {Object} user - User who sent the message
 * @param {string} message - Message content
 * @param {string} timestamp - Message timestamp
 */
function broadcastChatMessage(projectId, user, message, timestamp) {
  if (!collaborators.has(projectId)) return;
  
  const messageData = {
    type: 'chat_message',
    user,
    message,
    timestamp: timestamp || new Date().toISOString()
  };
  
  const projectCollaborators = collaborators.get(projectId);
  
  projectCollaborators.forEach((collaborator) => {
    if (collaborator.ws.readyState === WebSocket.OPEN) {
      collaborator.ws.send(JSON.stringify(messageData));
    }
  });
}

/**
 * Broadcasts a file change to all collaborators on a project
 * @param {WebSocket} sender - WebSocket of the sender
 * @param {string} projectId - Project ID
 * @param {string} fileName - Name of the changed file
 * @param {string} content - New file content
 */
function broadcastFileChange(sender, projectId, fileName, content) {
  if (!collaborators.has(projectId)) return;
  
  const changeData = {
    type: 'file_change',
    projectId,
    fileName,
    content,
    timestamp: new Date().toISOString()
  };
  
  const projectCollaborators = collaborators.get(projectId);
  
  projectCollaborators.forEach((collaborator, id) => {
    // Don't send back to the sender
    if (id !== sender.id && collaborator.ws.readyState === WebSocket.OPEN) {
      collaborator.ws.send(JSON.stringify(changeData));
    }
  });
}

/**
 * Broadcasts a cursor position to all collaborators on a project
 * @param {WebSocket} sender - WebSocket of the sender
 * @param {string} projectId - Project ID
 * @param {Object} user - User data
 * @param {Object} position - Cursor position data
 */
function broadcastCursorPosition(sender, projectId, user, position) {
  if (!collaborators.has(projectId)) return;
  
  const positionData = {
    type: 'cursor_position',
    user,
    position,
    timestamp: new Date().toISOString()
  };
  
  const projectCollaborators = collaborators.get(projectId);
  
  projectCollaborators.forEach((collaborator, id) => {
    // Don't send back to the sender
    if (id !== sender.id && collaborator.ws.readyState === WebSocket.OPEN) {
      collaborator.ws.send(JSON.stringify(positionData));
    }
  });
}

/**
 * Broadcasts a component action to all collaborators on a project
 * @param {WebSocket} sender - WebSocket of the sender
 * @param {string} actionType - Type of component action
 * @param {string} projectId - Project ID
 * @param {Object} data - Action data
 */
function broadcastComponentAction(sender, actionType, projectId, data) {
  if (!collaborators.has(projectId)) return;
  
  const projectCollaborators = collaborators.get(projectId);
  
  projectCollaborators.forEach((collaborator, id) => {
    // Don't send back to the sender
    if (id !== sender.id && collaborator.ws.readyState === WebSocket.OPEN) {
      collaborator.ws.send(JSON.stringify({
        ...data,
        type: actionType,
        timestamp: new Date().toISOString()
      }));
    }
  });
}

/**
 * Handles a terminal command
 * @param {WebSocket} ws - WebSocket connection
 * @param {string} projectId - Project ID
 * @param {string} command - Command to execute
 */
function handleTerminalCommand(ws, projectId, command) {
  // Simulate terminal command execution
  let output;
  
  switch (command.trim()) {
    case 'help':
      output = `
Available commands:
  help              - Show this help message
  ls                - List files
  cd <dir>          - Change directory
  mkdir <dir>       - Create directory
  cat <file>        - Show file contents
  echo <text>       - Print text
  npm <command>     - Run npm commands
  docker <command>  - Simulate docker commands
  clear             - Clear terminal
`;
      break;
      
    case 'ls':
      output = 'index.html\nstyles.css\napp.js\npackage.json\nnode_modules/';
      break;
      
    case 'clear':
      // Special case for clear - client should handle this
      output = '<CLEAR>';
      break;
      
    default:
      if (command.startsWith('cd ')) {
        output = `Changed directory to ${command.substring(3)}`;
      } else if (command.startsWith('mkdir ')) {
        output = `Created directory ${command.substring(6)}`;
      } else if (command.startsWith('cat ')) {
        const file = command.substring(4);
        output = `Simulated content of ${file}:\n\n# This is a simulated file content`;
      } else if (command.startsWith('echo ')) {
        output = command.substring(5);
      } else if (command.startsWith('npm ')) {
        output = `Executing npm command: ${command.substring(4)}\n\n> VibeCode@1.0.0 ${command.substring(4)}\n> Simulated npm output...`;
      } else if (command.startsWith('docker ')) {
        output = `Simulating docker command: ${command.substring(7)}\nSimulated docker output...`;
      } else {
        output = `Command not found: ${command}\nType 'help' for available commands.`;
      }
  }
  
  // Send output back to the client
  ws.send(JSON.stringify({
    type: 'terminal',
    output
  }));
  
  // If running a simulated service, send periodic logs
  if (command.includes('start') || command.includes('run')) {
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'terminal',
          output: `[${new Date().toLocaleTimeString()}] Simulated log output from your application...`
        }));
      } else {
        clearInterval(interval);
      }
    }, 3000);
    
    // Clear after a while to avoid filling the terminal
    setTimeout(() => {
      clearInterval(interval);
    }, 15000);
  }
}

/**
 * Sends an error message to a client
 * @param {WebSocket} ws - WebSocket connection
 * @param {string} message - Error message
 */
function sendErrorToClient(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'error',
      message,
      timestamp: new Date().toISOString()
    }));
  }
}

/**
 * Broadcasts server status to all clients
 * @param {WebSocket.Server} wss - WebSocket server
 */
function broadcastServerStatus(wss) {
  const status = {
    type: 'server_status',
    clients: wss.clients.size,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
    timestamp: new Date().toISOString()
  };
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(status));
    }
  });
}

module.exports = {
  setupWebSocketServer,
  addCollaborator,
  removeCollaborator,
  broadcastChatMessage,
  broadcastFileChange
};
