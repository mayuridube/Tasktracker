import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CodeEditor from './components/CodeEditor';
import ProjectSettings from './components/ProjectSettings';
import PortalBuilder from './components/PortalBuilder';
import DatabaseConnector from './components/DatabaseConnector';
import LivePreview from './components/LivePreview';
import TerminalConsole from './components/TerminalConsole';
import CollaborationPanel from './components/CollaborationPanel';
import DeploymentPanel from './components/DeploymentPanel';
import { initWebSocket } from './services/websocket';

function App() {
  const [activeView, setActiveView] = useState('code-editor');
  const [project, setProject] = useState({
    id: null,
    name: 'My New Project',
    framework: 'react',
    backend: 'express',
    database: 'mongodb',
    files: {}
  });
  const [collaborators, setCollaborators] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = initWebSocket();
    
    newSocket.onopen = () => {
      console.log('WebSocket connected!');
      setIsConnected(true);
      setSocket(newSocket);
    };
    
    newSocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };
    
    // Clean up on unmount
    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);
  
  const renderActiveView = () => {
    switch(activeView) {
      case 'code-editor':
        return <CodeEditor project={project} socket={socket} />;
      case 'portal-builder':
        return <PortalBuilder project={project} socket={socket} />;
      case 'database':
        return <DatabaseConnector project={project} />;
      case 'preview':
        return <LivePreview project={project} />;
      case 'terminal':
        return <TerminalConsole project={project} />;
      case 'deployment':
        return <DeploymentPanel project={project} />;
      case 'settings':
        return <ProjectSettings project={project} setProject={setProject} />;
      default:
        return <CodeEditor project={project} socket={socket} />;
    }
  };

  return (
    <div className="app-container">
      <Navbar 
        project={project} 
        isConnected={isConnected} 
        collaborators={collaborators} 
      />
      <div className="main-content">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <div className="content-area">
          {renderActiveView()}
        </div>
        <CollaborationPanel 
          collaborators={collaborators} 
          socket={socket} 
          project={project} 
        />
      </div>
    </div>
  );
}

export default App;
