import React, { useState } from 'react';
import { fetchApi } from '../services/api';

function ProjectSettings({ project, setProject }) {
  const [name, setName] = useState(project.name || '');
  const [framework, setFramework] = useState(project.framework || 'react');
  const [backend, setBackend] = useState(project.backend || 'express');
  const [database, setDatabase] = useState(project.database || 'mongodb');
  const [isPrivate, setIsPrivate] = useState(project.isPrivate || false);
  const [customDomain, setCustomDomain] = useState(project.customDomain || '');

  const frontendOptions = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'angular', label: 'Angular' },
    { value: 'html', label: 'HTML/CSS/JS' }
  ];

  const backendOptions = [
    { value: 'express', label: 'Express (Node.js)' },
    { value: 'fastapi', label: 'FastAPI (Python)' },
    { value: 'django', label: 'Django (Python)' },
    { value: 'none', label: 'No Backend' }
  ];

  const databaseOptions = [
    { value: 'mongodb', label: 'MongoDB' },
    { value: 'postgresql', label: 'PostgreSQL' },
    { value: 'mysql', label: 'MySQL' },
    { value: 'none', label: 'No Database' }
  ];

  const handleSaveSettings = async () => {
    try {
      const updatedProject = {
        ...project,
        name,
        framework,
        backend,
        database,
        isPrivate,
        customDomain
      };
      
      if (project.id) {
        await fetchApi(`/api/projects/${project.id}`, {
          method: 'PUT',
          body: JSON.stringify(updatedProject)
        });
      }
      
      setProject(updatedProject);
      alert('Project settings saved successfully!');
    } catch (error) {
      alert('Failed to save project settings: ' + error.message);
    }
  };

  return (
    <div className="project-settings">
      <h2>Project Settings</h2>
      
      <div className="settings-form">
        <div className="form-group">
          <label htmlFor="project-name">Project Name</label>
          <input
            id="project-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter project name"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="frontend-framework">Frontend Framework</label>
          <select
            id="frontend-framework"
            value={framework}
            onChange={(e) => setFramework(e.target.value)}
          >
            {frontendOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="backend-framework">Backend Framework</label>
          <select
            id="backend-framework"
            value={backend}
            onChange={(e) => setBackend(e.target.value)}
          >
            {backendOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="database">Database</label>
          <select
            id="database"
            value={database}
            onChange={(e) => setDatabase(e.target.value)}
          >
            {databaseOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="visibility">Project Visibility</label>
          <div className="toggle-container">
            <span>Public</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
            <span>Private</span>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="custom-domain">Custom Domain (optional)</label>
          <input
            id="custom-domain"
            type="text"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="e.g., myproject.com"
          />
          <small>
            Enter a custom domain to use for your deployed project. 
            You'll need to configure DNS settings separately.
          </small>
        </div>
        
        <div className="form-actions">
          <button 
            className="btn-save-settings"
            onClick={handleSaveSettings}
          >
            Save Settings
          </button>
        </div>
      </div>
      
      <div className="danger-zone">
        <h3>Danger Zone</h3>
        <div className="danger-actions">
          <button className="btn-danger">Delete Project</button>
          <button className="btn-danger">Reset Project</button>
        </div>
      </div>
    </div>
  );
}

export default ProjectSettings;
