import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../services/api';

function TerminalConsole({ project }) {
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [command, setCommand] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('terminal'); // 'terminal' or 'logs'
  const [logs, setLogs] = useState([]);
  const [socket, setSocket] = useState(null);
  const terminalRef = useRef(null);
  
  useEffect(() => {
    if (project.id) {
      // Connect to WebSocket for terminal and logs
      connectTerminalSocket();
      fetchLogs();
    }
    
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [project.id]);
  
  const connectTerminalSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/terminal/${project.id}`;
    
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      setIsConnected(true);
      addTerminalLine('Connected to terminal.');
    };
    
    newSocket.onclose = () => {
      setIsConnected(false);
      addTerminalLine('Disconnected from terminal.');
    };
    
    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'terminal') {
          addTerminalLine(data.output);
        } else if (data.type === 'logs') {
          setLogs(prevLogs => [...prevLogs, data.log]);
        }
      } catch (error) {
        console.error('Error parsing terminal message:', error);
      }
    };
    
    setSocket(newSocket);
  };
  
  const fetchLogs = async () => {
    try {
      const response = await fetchApi(`/api/projects/${project.id}/logs`);
      if (response.logs) {
        setLogs(response.logs);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };
  
  const addTerminalLine = (line) => {
    setTerminalOutput(prev => [...prev, line]);
    
    // Scroll to bottom of terminal
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 0);
  };
  
  const handleCommandSubmit = (e) => {
    e.preventDefault();
    
    if (!command.trim()) return;
    
    // Add command to terminal with prompt
    addTerminalLine(`$ ${command}`);
    
    // Send command to server
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'command',
        command,
        projectId: project.id
      }));
    } else {
      addTerminalLine('Error: Not connected to terminal.');
    }
    
    setCommand('');
  };
  
  const clearTerminal = () => {
    setTerminalOutput([]);
  };
  
  const clearLogs = () => {
    setLogs([]);
  };
  
  const formatLogEntry = (log) => {
    const { timestamp, level, message, source } = log;
    const date = new Date(timestamp);
    const formattedTime = date.toLocaleTimeString();
    
    return (
      <div className={`log-entry log-${level.toLowerCase()}`}>
        <span className="log-time">{formattedTime}</span>
        <span className="log-source">[{source}]</span>
        <span className="log-level">{level}</span>
        <span className="log-message">{message}</span>
      </div>
    );
  };

  return (
    <div className="terminal-console">
      <div className="terminal-tabs">
        <button 
          className={activeTab === 'terminal' ? 'active' : ''}
          onClick={() => setActiveTab('terminal')}
        >
          <i data-feather="terminal"></i> Terminal
        </button>
        <button 
          className={activeTab === 'logs' ? 'active' : ''}
          onClick={() => setActiveTab('logs')}
        >
          <i data-feather="file-text"></i> Logs
        </button>
      </div>
      
      <div className="terminal-actions">
        {activeTab === 'terminal' && (
          <button onClick={clearTerminal} className="btn-clear">
            Clear Terminal
          </button>
        )}
        
        {activeTab === 'logs' && (
          <button onClick={clearLogs} className="btn-clear">
            Clear Logs
          </button>
        )}
        
        <div className="connection-status">
          <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      <div className="terminal-content">
        {activeTab === 'terminal' && (
          <>
            <div className="terminal-output" ref={terminalRef}>
              {terminalOutput.map((line, index) => (
                <div key={index} className="terminal-line">{line}</div>
              ))}
            </div>
            
            <form onSubmit={handleCommandSubmit} className="terminal-input-form">
              <div className="input-prompt">$</div>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter command..."
                disabled={!isConnected}
                className="terminal-input"
              />
            </form>
          </>
        )}
        
        {activeTab === 'logs' && (
          <div className="logs-output">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index}>
                  {formatLogEntry(log)}
                </div>
              ))
            ) : (
              <div className="no-logs">
                <p>No logs to display.</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="terminal-footer">
        <p>
          <i data-feather="info"></i>
          {activeTab === 'terminal' 
            ? 'Terminal commands are executed in the context of your project container.' 
            : 'Logs display output from your application and services.'}
        </p>
      </div>
    </div>
  );
}

export default TerminalConsole;
