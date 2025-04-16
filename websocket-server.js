/**
 * Standalone WebSocket Server
 * A simple WebSocket-based chat application
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { generateWebsite } = require('./gemini-service');
const fileService = require('./file-service');

// Create Express application
const app = express();
const server = http.createServer(app);

// Set port to 8000 to use Replit's default port mapping
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!require('fs').existsSync(publicDir)) {
  require('fs').mkdirSync(publicDir, { recursive: true });
}

// Create a simple index.html file for the chat interface
const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VibeCode AI Website Generator</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        
        .main-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .container {
            display: flex;
            gap: 20px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px;
        }
        
        .left-panel {
            flex: 1;
        }
        
        .right-panel {
            flex: 0 0 250px;
            border-left: 1px solid #ddd;
            padding-left: 20px;
        }
        
        #connectionStatus {
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 10px;
        }
        
        .connected {
            background-color: #d4edda;
            color: #155724;
        }
        
        .disconnected {
            background-color: #f8d7da;
            color: #721c24;
        }
        
        #chatMessages {
            height: 400px;
            border: 1px solid #ddd;
            overflow-y: auto;
            margin-bottom: 15px;
            padding: 15px;
            border-radius: 4px;
            background-color: #fcfcfc;
        }
        
        .message {
            margin-bottom: 12px;
            padding: 10px;
            border-radius: 6px;
            line-height: 1.4;
        }
        
        .message .sender {
            font-weight: bold;
            margin-bottom: 4px;
        }
        
        .message .time {
            font-size: 0.8em;
            color: #666;
            margin-top: 5px;
            text-align: right;
        }
        
        .system-message {
            background-color: #e2e3e5;
            color: #383d41;
            border-left: 4px solid #adb5bd;
        }
        
        .user-message {
            background-color: #d1ecf1;
            color: #0c5460;
            border-left: 4px solid #0c5460;
        }
        
        .my-message {
            background-color: #d4edda;
            color: #155724;
            text-align: right;
            border-right: 4px solid #155724;
        }
        
        .error-message {
            background-color: #f8d7da;
            color: #721c24;
            border-left: 4px solid #721c24;
        }
        
        .success-message {
            background-color: #d4edda;
            color: #155724;
            border-left: 4px solid #155724;
        }
        
        .message a {
            color: #007bff;
            text-decoration: none;
        }
        
        .message a:hover {
            text-decoration: underline;
        }
        
        .message-form {
            display: flex;
            gap: 10px;
        }
        
        #messageInput {
            flex: 1;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
        }
        
        button {
            padding: 10px 16px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            transition: background-color 0.3s;
        }
        
        button:hover {
            background-color: #0056b3;
        }
        
        #nameInput {
            width: 100%;
            padding: 10px;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        #clientList {
            list-style: none;
            padding: 0;
        }
        
        #clientList li {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        
        #pingCounter {
            margin-top: 20px;
            font-size: 0.9em;
            color: #666;
        }

        header {
            background-color: #007bff;
            color: white;
            padding: 30px;
            margin-bottom: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        header h1 {
            margin: 0;
            font-size: 2.2rem;
        }

        header p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 1.2rem;
        }
        
        .website-generator {
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .website-generator h2 {
            margin-top: 0;
            color: #007bff;
        }
        
        .website-generator form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .website-generator textarea {
            width: 100%;
            height: 100px;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: inherit;
            font-size: 1rem;
            resize: vertical;
        }
        
        .website-generator button {
            align-self: flex-end;
            padding: 12px 24px;
        }
        
        .generated-websites {
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .generated-websites h2 {
            margin-top: 0;
            color: #007bff;
        }
        
        .websites-list {
            list-style: none;
            padding: 0;
        }
        
        .website-item {
            border-bottom: 1px solid #eee;
            padding: 15px 0;
        }
        
        .website-item:last-child {
            border-bottom: none;
        }
        
        .website-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .website-description {
            margin-bottom: 10px;
            color: #555;
        }
        
        .website-link {
            color: #007bff;
            text-decoration: none;
        }
        
        .website-link:hover {
            text-decoration: underline;
        }
        
        .instructions {
            background-color: #e9f7fe;
            border-left: 4px solid #007bff;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
        }
        
        .instructions h3 {
            margin-top: 0;
            color: #007bff;
        }
        
        .instructions ul {
            margin-bottom: 0;
            padding-left: 20px;
        }
        
        .instructions li {
            margin-bottom: 5px;
        }
        
        .instructions code {
            background-color: #f8f9fa;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: monospace;
        }
        
        .tab-container {
            margin-bottom: 20px;
        }
        
        .tab-buttons {
            display: flex;
            margin-bottom: 15px;
            border-bottom: 1px solid #ddd;
        }
        
        .tab-button {
            padding: 10px 20px;
            background-color: transparent;
            color: #333;
            border: none;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            transition: all 0.3s;
        }
        
        .tab-button.active {
            color: #007bff;
            border-bottom: 3px solid #007bff;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
    </style>
</head>
<body>
    <header>
        <h1>VibeCode AI Website Generator</h1>
        <p>Create websites instantly with AI using Gemini - powered by Google's Generative AI</p>
    </header>
    
    <div id="connectionStatus" class="disconnected">
        Disconnected
    </div>
    
    <div class="main-container">
        <div class="tab-container">
            <div class="tab-buttons">
                <button id="generatorTabButton" class="tab-button active">Website Generator</button>
                <button id="chatTabButton" class="tab-button">Chat</button>
            </div>
            
            <div id="generatorTab" class="tab-content active">
                <div class="instructions">
                    <h3>How to Generate a Website</h3>
                    <p>Describe the website you want to create in detail. The more specific you are, the better the result.</p>
                    <ul>
                        <li>Specify the purpose and content of the website</li>
                        <li>Describe the design style you prefer</li>
                        <li>Mention any specific features you want included</li>
                        <li>Example: "Create a personal portfolio website for a photographer with a dark theme, image gallery, and contact form"</li>
                    </ul>
                </div>
                
                <div class="website-generator">
                    <h2>Generate a New Website</h2>
                    <form id="websiteForm">
                        <textarea id="websitePrompt" placeholder="Describe the website you want to create..."></textarea>
                        <button type="submit" id="generateButton">Generate Website</button>
                    </form>
                    <div id="progressTracker" style="display: none; margin-top: 15px;">
                        <div class="progress-container" style="width: 100%; height: 20px; background-color: #f0f0f0; border-radius: 10px; overflow: hidden; margin-bottom: 10px;">
                            <div id="progressBar" style="width: 0%; height: 100%; background-color: #4CAF50; transition: width 0.3s;"></div>
                        </div>
                        <div id="progressStatus" style="text-align: center; font-size: 14px; color: #555;">Preparing...</div>
                    </div>
                </div>
                
                <div class="generated-websites">
                    <h2>Your Generated Websites</h2>
                    <p>Your previously generated websites will appear here.</p>
                    <ul id="websitesList" class="websites-list">
                        <!-- Generated websites will be listed here -->
                    </ul>
                </div>
                
                <div id="websiteEditor" class="website-editor" style="display: none;">
                    <div class="editor-header">
                        <h2 id="editorTitle">Edit Website</h2>
                        <div class="editor-controls">
                            <button id="backButton">Back to List</button>
                            <button id="newFileButton">New File</button>
                            <button id="runButton" class="primary-button">Run Website</button>
                        </div>
                    </div>
                    
                    <div class="editor-container">
                        <div class="file-explorer">
                            <h3>Files</h3>
                            <ul id="filesList"></ul>
                        </div>
                        
                        <div class="code-editor-container">
                            <div class="file-tabs" id="fileTabs">
                                <!-- File tabs will be added here -->
                            </div>
                            
                            <div class="code-editor">
                                <textarea id="codeEditor"></textarea>
                            </div>
                            
                            <div class="editor-status-bar">
                                <span id="fileStatus">No file selected</span>
                                <button id="saveButton" disabled>Save Changes</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="preview-container">
                        <div class="preview-header">
                            <h3>Preview</h3>
                            <button id="refreshPreviewButton">Refresh</button>
                        </div>
                        
                        <iframe id="previewFrame" sandbox="allow-scripts allow-same-origin"></iframe>
                    </div>
                    
                    <div class="console-container">
                        <div class="console-header">
                            <h3>Console</h3>
                            <button id="clearConsoleButton">Clear</button>
                        </div>
                        
                        <div id="consoleOutput" class="console-output"></div>
                    </div>
                </div>
            </div>
            
            <div id="chatTab" class="tab-content">
                <div class="container">
                    <div class="left-panel">
                        <div class="instructions">
                            <h3>Chat Commands</h3>
                            <p>You can also generate websites directly from the chat:</p>
                            <ul>
                                <li>Type <code>/generate [your website description]</code> to create a new website</li>
                                <li>Example: <code>/generate Create a landing page for a coffee shop with a menu and contact information</code></li>
                            </ul>
                        </div>
                    
                        <div id="chatMessages"></div>
                        
                        <form id="messageForm" class="message-form">
                            <input type="text" id="messageInput" placeholder="Type a message or use /generate command..." autocomplete="off">
                            <button type="submit">Send</button>
                        </form>
                    </div>
                    
                    <div class="right-panel">
                        <h3>Your Profile</h3>
                        <input type="text" id="nameInput" placeholder="Your name">
                        <button id="setNameButton">Set Name</button>
                        
                        <h3>Online Users</h3>
                        <ul id="clientList"></ul>
                        
                        <div id="pingCounter">
                            WebSocket Latency: --ms
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // DOM elements
        const connectionStatus = document.getElementById('connectionStatus');
        const chatMessages = document.getElementById('chatMessages');
        const messageForm = document.getElementById('messageForm');
        const messageInput = document.getElementById('messageInput');
        const nameInput = document.getElementById('nameInput');
        const setNameButton = document.getElementById('setNameButton');
        const clientList = document.getElementById('clientList');
        const pingCounter = document.getElementById('pingCounter');
        const websiteForm = document.getElementById('websiteForm');
        const websitePrompt = document.getElementById('websitePrompt');
        const websitesList = document.getElementById('websitesList');
        const generatorTabButton = document.getElementById('generatorTabButton');
        const chatTabButton = document.getElementById('chatTabButton');
        const generatorTab = document.getElementById('generatorTab');
        const chatTab = document.getElementById('chatTab');
        
        // Client state
        let socket;
        let clientId = null;
        let pingInterval;
        let pingStart;
        let generatedWebsites = [];
        
        // Tab switching
        generatorTabButton.addEventListener('click', () => {
            generatorTabButton.classList.add('active');
            chatTabButton.classList.remove('active');
            generatorTab.classList.add('active');
            chatTab.classList.remove('active');
        });
        
        chatTabButton.addEventListener('click', () => {
            chatTabButton.classList.add('active');
            generatorTabButton.classList.remove('active');
            chatTab.classList.add('active');
            generatorTab.classList.remove('active');
        });
        
        // Connect to the WebSocket server
        function connectWebSocket() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = \`\${protocol}//\${window.location.host}/ws\`;
            
            socket = new WebSocket(wsUrl);
            
            socket.onopen = () => {
                connectionStatus.textContent = 'Connected';
                connectionStatus.className = 'connected';
                
                // Start ping interval to measure latency
                pingInterval = setInterval(sendPing, 10000);
                
                addSystemMessage('Connected to server');
                
                // Fetch generated websites
                fetchWebsites();
            };
            
            socket.onclose = () => {
                connectionStatus.textContent = 'Disconnected';
                connectionStatus.className = 'disconnected';
                
                clearInterval(pingInterval);
                
                // Try to reconnect after 5 seconds
                setTimeout(connectWebSocket, 5000);
                
                addSystemMessage('Disconnected from server. Attempting to reconnect...');
            };
            
            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                addSystemMessage('Error: Could not connect to server');
            };
            
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleMessage(data);
            };
        }
        
        // Handle incoming WebSocket messages
        function handleMessage(data) {
            console.log('Received message:', data);
            
            switch (data.type) {
                case 'welcome':
                    clientId = data.clientId;
                    addSystemMessage(data.message);
                    break;
                    
                case 'chat':
                    addChatMessage(data);
                    break;
                    
                case 'clientList':
                    updateClientList(data.clients);
                    break;
                    
                case 'pong':
                    const latency = Date.now() - pingStart;
                    pingCounter.textContent = \`WebSocket Latency: \${latency}ms\`;
                    break;
                    
                case 'systemMessage':
                    addSystemMessage(data.message);
                    break;
                    
                case 'error':
                    addErrorMessage(data.message);
                    // Reset progress bar on error
                    resetProgressTracker();
                    break;
                    
                case 'websiteGenerated':
                    addSuccessMessage(\`Website generated successfully! <a href="\${data.url}" target="_blank">Click here to view it</a>\`);
                    fetchWebsites(); // Refresh the websites list
                    // Complete progress bar
                    completeProgressTracker();
                    break;
                    
                default:
                    console.log('Unknown message type:', data.type);
            }
        }
        
        // Add a system message to the chat
        function addSystemMessage(text) {
            const message = document.createElement('div');
            message.className = 'message system-message';
            
            message.innerHTML = \`
                <div class="content">\${text}</div>
                <div class="time">\${new Date().toLocaleTimeString()}</div>
            \`;
            
            chatMessages.appendChild(message);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        // Add an error message to the chat
        function addErrorMessage(text) {
            const message = document.createElement('div');
            message.className = 'message error-message';
            
            message.innerHTML = \`
                <div class="content"><strong>Error:</strong> \${text}</div>
                <div class="time">\${new Date().toLocaleTimeString()}</div>
            \`;
            
            chatMessages.appendChild(message);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        // Add a success message to the chat
        function addSuccessMessage(text) {
            const message = document.createElement('div');
            message.className = 'message success-message';
            
            message.innerHTML = \`
                <div class="content"><strong>Success:</strong> \${text}</div>
                <div class="time">\${new Date().toLocaleTimeString()}</div>
            \`;
            
            chatMessages.appendChild(message);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        // Add a chat message to the display
        function addChatMessage(data) {
            const message = document.createElement('div');
            
            // Determine if this message is from current user
            if (data.senderId === clientId) {
                message.className = 'message my-message';
            } else {
                message.className = 'message user-message';
            }
            
            message.innerHTML = \`
                <div class="sender">\${data.senderName}</div>
                <div class="content">\${data.text}</div>
                <div class="time">\${new Date(data.timestamp).toLocaleTimeString()}</div>
            \`;
            
            chatMessages.appendChild(message);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        // Update the client list display
        function updateClientList(clients) {
            clientList.innerHTML = '';
            
            clients.forEach(client => {
                const li = document.createElement('li');
                
                // Highlight current user
                if (client.id === clientId) {
                    li.innerHTML = \`<strong>\${client.name} (You)</strong>\`;
                } else {
                    li.textContent = client.name;
                }
                
                clientList.appendChild(li);
            });
        }
        
        // Fetch generated websites
        async function fetchWebsites() {
            try {
                const response = await fetch('/api/websites');
                if (response.ok) {
                    const websites = await response.json();
                    generatedWebsites = websites;
                    updateWebsitesList();
                }
            } catch (error) {
                console.error('Error fetching websites:', error);
            }
        }
        
        // Update the websites list display
        function updateWebsitesList() {
            websitesList.innerHTML = '';
            
            if (generatedWebsites.length === 0) {
                websitesList.innerHTML = '<p>No websites generated yet. Create your first one!</p>';
                return;
            }
            
            // Sort websites by creation date, newest first
            generatedWebsites.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            generatedWebsites.forEach(website => {
                const li = document.createElement('li');
                li.className = 'website-item';
                
                const createdDate = new Date(website.createdAt).toLocaleString();
                
                li.innerHTML = \`
                    <div class="website-title">\${website.description.substring(0, 50)}...</div>
                    <div class="website-description">Created on \${createdDate}</div>
                    <a href="\${website.publicUrl}" target="_blank" class="website-link">View Website</a>
                \`;
                
                websitesList.appendChild(li);
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
        
        // Generate a website
        function generateWebsite(prompt) {
            if (!socket || socket.readyState !== WebSocket.OPEN || !prompt.trim()) {
                return;
            }
            
            // Show progress tracker
            const progressTracker = document.getElementById('progressTracker');
            const progressBar = document.getElementById('progressBar');
            const progressStatus = document.getElementById('progressStatus');
            const generateButton = document.getElementById('generateButton');
            
            progressTracker.style.display = 'block';
            progressBar.style.width = '10%';
            progressStatus.textContent = 'Initializing generation process...';
            generateButton.disabled = true;
            
            // Start progress animation
            let progress = 10;
            const progressInterval = setInterval(function() {
                if (progress < 90) {
                    progress += 5;
                    progressBar.style.width = progress + '%';
                    
                    // Update status message based on progress
                    if (progress < 30) {
                        progressStatus.textContent = 'Analyzing your request...';
                    } else if (progress < 50) {
                        progressStatus.textContent = 'Designing website structure...';
                    } else if (progress < 70) {
                        progressStatus.textContent = 'Generating HTML and CSS...';
                    } else {
                        progressStatus.textContent = 'Adding interactive JavaScript...';
                    }
                }
            }, 1000);
            
            // Store the interval ID to clear it later
            window.currentProgressInterval = progressInterval;
            
            const message = {
                type: 'generateWebsite',
                prompt: prompt.trim()
            };
            
            socket.send(JSON.stringify(message));
            addSystemMessage('Generating your website... This may take a few moments.');
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
            addSystemMessage(\`You changed your name to \${name.trim()}\`);
        }
        
        // Send a ping to measure latency
        function sendPing() {
            if (!socket || socket.readyState !== WebSocket.OPEN) {
                return;
            }
            
            pingStart = Date.now();
            socket.send(JSON.stringify({ type: 'ping' }));
        }
        
        // Event listeners
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendChatMessage(messageInput.value);
        });
        
        websiteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            generateWebsite(websitePrompt.value);
            websitePrompt.value = '';
        });
        
        setNameButton.addEventListener('click', () => {
            setUserName(nameInput.value);
        });
        
        // Reset progress tracker
        function resetProgressTracker() {
            if (window.currentProgressInterval) {
                clearInterval(window.currentProgressInterval);
                window.currentProgressInterval = null;
            }
            
            const progressTracker = document.getElementById('progressTracker');
            const progressBar = document.getElementById('progressBar');
            const progressStatus = document.getElementById('progressStatus');
            const generateButton = document.getElementById('generateButton');
            
            progressTracker.style.display = 'none';
            progressBar.style.width = '0%';
            progressStatus.textContent = '';
            generateButton.disabled = false;
        }
        
        // Complete progress tracker animation
        function completeProgressTracker() {
            if (window.currentProgressInterval) {
                clearInterval(window.currentProgressInterval);
                window.currentProgressInterval = null;
            }
            
            const progressTracker = document.getElementById('progressTracker');
            const progressBar = document.getElementById('progressBar');
            const progressStatus = document.getElementById('progressStatus');
            const generateButton = document.getElementById('generateButton');
            
            progressBar.style.width = '100%';
            progressStatus.textContent = 'Website generated successfully!';
            generateButton.disabled = false;
            
            // Hide progress bar after 3 seconds
            setTimeout(function() {
                progressTracker.style.display = 'none';
            }, 3000);
        }
        
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

// Route to view a generated website
app.get('/view/:websiteId', (req, res) => {
  const websiteId = req.params.websiteId;
  const website = fileService.getWebsite(websiteId);
  
  if (!website) {
    return res.status(404).send('Website not found');
  }
  
  const htmlContent = fileService.getWebsiteFile(websiteId, 'index.html');
  if (!htmlContent) {
    return res.status(404).send('Website HTML file not found');
  }
  
  res.send(htmlContent);
});

// Serve website CSS file
app.get('/view/:websiteId/styles.css', (req, res) => {
  const websiteId = req.params.websiteId;
  const cssContent = fileService.getWebsiteFile(websiteId, 'styles.css');
  
  if (!cssContent) {
    return res.status(404).send('/* CSS file not found */');
  }
  
  res.type('text/css').send(cssContent);
});

// Serve website JavaScript file
app.get('/view/:websiteId/script.js', (req, res) => {
  const websiteId = req.params.websiteId;
  const jsContent = fileService.getWebsiteFile(websiteId, 'script.js');
  
  if (!jsContent) {
    return res.status(404).send('// JavaScript file not found');
  }
  
  res.type('text/javascript').send(jsContent);
});

// API endpoint to list all generated websites
app.get('/api/websites', (req, res) => {
  res.json(fileService.getAllWebsites());
});

// API endpoints for website file operations
app.get('/api/websites/:websiteId/files', (req, res) => {
  const websiteId = req.params.websiteId;
  const files = fileService.getWebsiteFiles(websiteId);
  res.json(files);
});

app.get('/api/websites/:websiteId/files/:filename', (req, res) => {
  const websiteId = req.params.websiteId;
  const filename = req.params.filename;
  const content = fileService.getWebsiteFile(websiteId, filename);
  
  if (content === null) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.json({ content });
});

app.put('/api/websites/:websiteId/files/:filename', (req, res) => {
  const websiteId = req.params.websiteId;
  const filename = req.params.filename;
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  const success = fileService.updateWebsiteFile(websiteId, filename, content);
  
  if (!success) {
    return res.status(404).json({ error: 'File not found or cannot be updated' });
  }
  
  res.json({ success: true });
});

app.post('/api/websites/:websiteId/files', (req, res) => {
  const websiteId = req.params.websiteId;
  const { filename, content } = req.body;
  
  if (!filename || !content) {
    return res.status(400).json({ error: 'Filename and content are required' });
  }
  
  const success = fileService.createWebsiteFile(websiteId, filename, content);
  
  if (!success) {
    return res.status(400).json({ error: 'File already exists or cannot be created' });
  }
  
  res.status(201).json({ success: true });
});

app.delete('/api/websites/:websiteId/files/:filename', (req, res) => {
  const websiteId = req.params.websiteId;
  const filename = req.params.filename;
  
  const success = fileService.deleteWebsiteFile(websiteId, filename);
  
  if (!success) {
    return res.status(400).json({ error: 'File not found or cannot be deleted' });
  }
  
  res.json({ success: true });
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
          // Check if it's a website generation command
          if (message.text.startsWith('/generate ')) {
            handleWebsiteGeneration(clientInfo, message.text.substring(10));
          } else {
            // Regular chat message
            broadcastMessage(clientInfo, message.text);
          }
          break;
          
        case 'generateWebsite':
          // Direct website generation request
          handleWebsiteGeneration(clientInfo, message.prompt);
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

// Handle website generation request
async function handleWebsiteGeneration(client, prompt) {
  // Send a progress message to the client
  const progressMessage = JSON.stringify({
    type: 'systemMessage',
    message: 'Generating your website... This may take a few moments.',
    timestamp: new Date().toISOString()
  });
  
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(progressMessage);
  }
  
  try {
    console.log(`Generating website for ${client.id} with prompt: ${prompt}`);
    
    // Generate website using Gemini API
    const { generateWebsite } = require('./gemini-service');
    const generatedWebsite = await generateWebsite(prompt);
    
    // Save the generated website files
    const websiteInfo = fileService.saveWebsite(generatedWebsite);
    
    // Send success message with website info
    const successMessage = JSON.stringify({
      type: 'websiteGenerated',
      websiteId: websiteInfo.id,
      url: `${process.env.PUBLIC_URL || `http://localhost:${PORT}`}${websiteInfo.publicUrl}`,
      description: websiteInfo.description,
      timestamp: new Date().toISOString()
    });
    
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(successMessage);
    }
    
    // Also send a chat message to all clients
    broadcastMessage({
      id: 'system',
      name: 'System'
    }, `${client.name} just generated a new website: ${websiteInfo.description}. View it here: ${websiteInfo.publicUrl}`);
    
  } catch (error) {
    console.error('Error generating website:', error);
    
    // Send error message to client
    const errorMessage = JSON.stringify({
      type: 'error',
      message: `Failed to generate website: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(errorMessage);
    }
  }
}

// Start the server
server.listen(PORT, () => {
  console.log(`WebSocket Server running on port ${PORT}`);
  console.log(`WebSocket endpoint available at ws://localhost:${PORT}/ws`);
  console.log(`Access the chat interface at http://localhost:${PORT}`);
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