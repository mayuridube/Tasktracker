/**
 * Container Manager Service for VibeCode
 * Simulates Docker container management for project backends
 */

// Map to track running containers
const containers = new Map();

/**
 * Initializes the container manager
 */
function initializeContainerManager() {
  console.log('Container Manager initialized');
  
  // Monitor the health of containers
  setInterval(monitorContainers, 30000);
}

/**
 * Starts a container for a project
 * @param {Object} project - Project data
 * @returns {Object} Container information
 */
async function startContainer(project) {
  const containerId = `vibecode-${project.id}-${Date.now()}`;
  const port = getAvailablePort();
  
  const containerInfo = {
    id: containerId,
    projectId: project.id,
    status: 'starting',
    startTime: new Date().toISOString(),
    logs: [],
    port: port,
    backend: project.backend || 'express',
    environment: project.environment || 'development'
  };
  
  // Add container to the tracking map
  containers.set(containerId, containerInfo);
  
  // Simulate container startup
  setTimeout(() => {
    containerInfo.status = 'running';
    
    // Add some initial logs
    addContainerLog(containerId, 'info', 'Container started successfully');
    addContainerLog(containerId, 'info', `Listening on port ${port}`);
    
    // For Express backend, add typical startup logs
    if (project.backend === 'express') {
      addContainerLog(containerId, 'info', 'Express server initialized');
      addContainerLog(containerId, 'info', 'Connected to database');
      addContainerLog(containerId, 'info', 'Routes registered');
    }
  }, 2000);
  
  return containerInfo;
}

/**
 * Stops a container
 * @param {string} containerId - Container ID
 * @returns {boolean} Whether the operation was successful
 */
async function stopContainer(containerId) {
  if (!containers.has(containerId)) {
    return false;
  }
  
  const containerInfo = containers.get(containerId);
  containerInfo.status = 'stopping';
  
  // Simulate container stopping
  setTimeout(() => {
    containerInfo.status = 'stopped';
    addContainerLog(containerId, 'info', 'Container stopped gracefully');
    
    // Remove container after a while
    setTimeout(() => {
      containers.delete(containerId);
    }, 5000);
  }, 1000);
  
  return true;
}

/**
 * Restarts a container
 * @param {string} containerId - Container ID
 * @returns {boolean} Whether the operation was successful
 */
async function restartContainer(containerId) {
  if (!containers.has(containerId)) {
    return false;
  }
  
  const containerInfo = containers.get(containerId);
  containerInfo.status = 'restarting';
  
  // Simulate container restart
  setTimeout(() => {
    containerInfo.status = 'running';
    addContainerLog(containerId, 'info', 'Container restarted successfully');
  }, 3000);
  
  return true;
}

/**
 * Gets containers for a project
 * @param {string} projectId - Project ID
 * @returns {Array} List of containers
 */
function getContainersForProject(projectId) {
  const projectContainers = [];
  
  containers.forEach((container) => {
    if (container.projectId === projectId) {
      projectContainers.push(container);
    }
  });
  
  return projectContainers;
}

/**
 * Gets container information
 * @param {string} containerId - Container ID
 * @returns {Object|null} Container information or null if not found
 */
function getContainerInfo(containerId) {
  return containers.get(containerId) || null;
}

/**
 * Gets container logs
 * @param {string} containerId - Container ID
 * @returns {Array} Container logs
 */
function getContainerLogs(containerId) {
  if (!containers.has(containerId)) {
    return [];
  }
  
  return containers.get(containerId).logs;
}

/**
 * Adds a log entry to a container
 * @param {string} containerId - Container ID
 * @param {string} level - Log level (info, warn, error, debug)
 * @param {string} message - Log message
 */
function addContainerLog(containerId, level, message) {
  if (!containers.has(containerId)) {
    return;
  }
  
  const container = containers.get(containerId);
  
  container.logs.push({
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    source: 'container'
  });
  
  // Limit log size to prevent memory issues
  if (container.logs.length > 1000) {
    container.logs.shift();
  }
}

/**
 * Executes a command in a container
 * @param {string} containerId - Container ID
 * @param {string} command - Command to execute
 * @returns {Object} Command execution result
 */
async function executeCommand(containerId, command) {
  if (!containers.has(containerId)) {
    return {
      success: false,
      output: 'Container not found'
    };
  }
  
  // Add a log for the command execution
  addContainerLog(containerId, 'info', `Executing command: ${command}`);
  
  // Simulate command execution
  let output;
  
  if (command.startsWith('ls')) {
    output = 'node_modules/\npackage.json\nserver.js\nsrc/\n.env';
  } else if (command.startsWith('cat')) {
    const file = command.split(' ')[1];
    output = `Simulated content of ${file}`;
  } else if (command.startsWith('npm')) {
    output = `> npm ${command.substring(4)}\n> Simulated npm command output...`;
  } else if (command.startsWith('node')) {
    output = 'Simulated Node.js process output...';
  } else {
    output = `Command executed: ${command}`;
  }
  
  return {
    success: true,
    output
  };
}

/**
 * Monitors containers for health and resource usage
 */
function monitorContainers() {
  containers.forEach((container, containerId) => {
    if (container.status === 'running') {
      // Simulate monitoring by adding periodic logs
      if (Math.random() > 0.7) {
        addContainerLog(containerId, 'info', `Memory usage: ${Math.floor(Math.random() * 500)}MB`);
      }
      
      if (Math.random() > 0.9) {
        addContainerLog(containerId, 'warn', 'High CPU usage detected');
      }
    }
  });
}

/**
 * Gets an available port for a new container
 * @returns {number} Available port
 */
function getAvailablePort() {
  // Start from port 8001 (8000 is the main server)
  const usedPorts = new Set(Array.from(containers.values()).map(c => c.port));
  let port = 8001;
  
  while (usedPorts.has(port)) {
    port++;
  }
  
  return port;
}

module.exports = {
  initializeContainerManager,
  startContainer,
  stopContainer,
  restartContainer,
  getContainersForProject,
  getContainerInfo,
  getContainerLogs,
  executeCommand
};
