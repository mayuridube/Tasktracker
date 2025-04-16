/**
 * Entry point for the VibeCode application
 * Starts both frontend and backend servers
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if required packages are installed
const requiredPackages = ['express', 'cors', 'ws', 'uuid', 'vite'];
const missingPackages = [];

requiredPackages.forEach(pkg => {
  try {
    require.resolve(pkg);
  } catch (e) {
    missingPackages.push(pkg);
  }
});

if (missingPackages.length > 0) {
  console.error(`Missing required packages: ${missingPackages.join(', ')}`);
  console.error('Please install them with:');
  console.error(`npm install ${missingPackages.join(' ')}`);
  process.exit(1);
}

/**
 * Starts the backend server
 */
function startBackendServer() {
  const serverPath = path.join(__dirname, 'server', 'server.js');
  
  // Check if server.js exists
  if (!fs.existsSync(serverPath)) {
    console.error('Backend server file not found:', serverPath);
    return;
  }
  
  console.log('Starting backend server...');
  
  const backendServer = spawn('node', [serverPath], {
    env: { ...process.env, PORT: 3000 },
    stdio: 'pipe'
  });
  
  backendServer.stdout.on('data', (data) => {
    console.log(`[Backend] ${data.toString().trim()}`);
  });
  
  backendServer.stderr.on('data', (data) => {
    console.error(`[Backend Error] ${data.toString().trim()}`);
  });
  
  backendServer.on('close', (code) => {
    console.log(`Backend server exited with code ${code}`);
    process.exit(code);
  });
  
  return backendServer;
}

/**
 * Starts the frontend development server with Vite
 */
function startFrontendServer() {
  console.log('Starting frontend server...');
  
  const frontendServer = spawn('npx', ['vite', '--config', './vite.config.js'], {
    env: { ...process.env },
    stdio: 'pipe'
  });
  
  frontendServer.stdout.on('data', (data) => {
    console.log(`[Frontend] ${data.toString().trim()}`);
  });
  
  frontendServer.stderr.on('data', (data) => {
    console.error(`[Frontend Error] ${data.toString().trim()}`);
  });
  
  frontendServer.on('close', (code) => {
    console.log(`Frontend server exited with code ${code}`);
    // Don't exit the process here as the backend may still be running
  });
  
  return frontendServer;
}

// Start both servers
const backendServer = startBackendServer();
const frontendServer = startFrontendServer();

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down servers gracefully...');
  backendServer && backendServer.kill();
  frontendServer && frontendServer.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down servers gracefully...');
  backendServer && backendServer.kill();
  frontendServer && frontendServer.kill();
  process.exit(0);
});

console.log(`
🚀 VibeCode is starting up!
📂 Backend API: http://localhost:3000/api
🌐 Frontend: http://localhost:5000
`);
