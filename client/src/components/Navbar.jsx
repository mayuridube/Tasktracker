import React from 'react';
import { fetchApi } from '../services/api';

function Navbar({ project, isConnected, collaborators }) {
  const handleSaveProject = async () => {
    try {
      await fetchApi('/api/projects/save', {
        method: 'POST',
        body: JSON.stringify({ project }),
      });
      alert('Project saved successfully!');
    } catch (error) {
      alert('Failed to save project: ' + error.message);
    }
  };

  const handleShareProject = () => {
    const shareUrl = `${window.location.origin}/collaborate?projectId=${project.id}`;
    // Create a temporary input to copy the URL
    const tempInput = document.createElement('input');
    document.body.appendChild(tempInput);
    tempInput.value = shareUrl;
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    alert('Collaboration link copied to clipboard!');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>VibeCode</h1>
      </div>
      
      <div className="project-info">
        <div className="project-name">
          <span>Project: </span>
          <input 
            type="text" 
            value={project.name} 
            readOnly 
          />
        </div>
        
        <div className="project-tech">
          <span className="tech-badge">{project.framework}</span>
          <span className="tech-badge">{project.backend}</span>
          <span className="tech-badge">{project.database}</span>
        </div>
      </div>
      
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        <span className="collaborator-count">
          {collaborators.length} active {collaborators.length === 1 ? 'collaborator' : 'collaborators'}
        </span>
      </div>
      
      <div className="navbar-actions">
        <button onClick={handleSaveProject} className="btn-save">
          Save Project
        </button>
        <button onClick={handleShareProject} className="btn-share">
          Share
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
