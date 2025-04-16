const http = require('http');
const fs = require('fs');
const path = require('path');

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Simple routing
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Basic HTTP Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>Welcome to the Basic HTTP Server</h1>
        <div class="card">
          <h2>Server Status</h2>
          <p>✅ The server is running correctly.</p>
          <p>This minimal HTTP server demonstrates that basic web serving is working.</p>
        </div>
        <div class="card">
          <h2>Current Time</h2>
          <p>${new Date().toLocaleString()}</p>
        </div>
        <div class="card">
          <h2>Server Info</h2>
          <p>Node.js Version: ${process.version}</p>
          <p>Platform: ${process.platform}</p>
        </div>
      </body>
      </html>
    `);
  } else if (req.url === '/api/status') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({
      status: 'ok',
      time: new Date().toISOString(),
      nodejs: process.version
    }));
  } else {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('404 Not Found');
  }
});

// Start server on port 5000
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Basic HTTP Server running at http://localhost:${PORT}`);
});