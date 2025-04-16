import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';

function DeploymentPanel({ project }) {
  const [deployments, setDeployments] = useState([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentError, setDeploymentError] = useState(null);
  const [deploymentSettings, setDeploymentSettings] = useState({
    environment: 'development',
    replicas: 1,
    domain: project.customDomain || '',
    deployBackend: true,
    deployFrontend: true,
    autoScale: false
  });
  
  useEffect(() => {
    if (project.id) {
      fetchDeployments();
    }
  }, [project.id]);
  
  const fetchDeployments = async () => {
    try {
      const response = await fetchApi(`/api/deployments?projectId=${project.id}`);
      if (response.deployments) {
        setDeployments(response.deployments);
      }
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
    }
  };
  
  const handleDeployProject = async () => {
    try {
      setIsDeploying(true);
      setDeploymentError(null);
      
      const response = await fetchApi('/api/deployments', {
        method: 'POST',
        body: JSON.stringify({
          projectId: project.id,
          ...deploymentSettings
        })
      });
      
      if (response.success) {
        // Add the new deployment to the list
        setDeployments([
          {
            id: response.deploymentId,
            status: 'in_progress',
            environment: deploymentSettings.environment,
            timestamp: new Date().toISOString(),
            url: response.url
          },
          ...deployments
        ]);
        
        alert('Deployment initiated successfully!');
      } else {
        setDeploymentError(response.message || 'Deployment failed');
      }
      
      setIsDeploying(false);
    } catch (error) {
      setDeploymentError('Deployment failed: ' + error.message);
      setIsDeploying(false);
    }
  };
  
  const handleSettingChange = (setting, value) => {
    setDeploymentSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'success':
        return 'status-success';
      case 'failed':
        return 'status-failed';
      case 'in_progress':
        return 'status-in-progress';
      default:
        return 'status-pending';
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="deployment-panel">
      <h2>Deployment</h2>
      
      <div className="deployment-settings">
        <h3>Deployment Settings</h3>
        
        {deploymentError && (
          <div className="error-message">
            {deploymentError}
          </div>
        )}
        
        <div className="form-group">
          <label>Environment</label>
          <select
            value={deploymentSettings.environment}
            onChange={(e) => handleSettingChange('environment', e.target.value)}
          >
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Number of Replicas</label>
          <input
            type="number"
            min="1"
            max="10"
            value={deploymentSettings.replicas}
            onChange={(e) => handleSettingChange('replicas', parseInt(e.target.value))}
          />
        </div>
        
        <div className="form-group">
          <label>Custom Domain (optional)</label>
          <input
            type="text"
            value={deploymentSettings.domain}
            onChange={(e) => handleSettingChange('domain', e.target.value)}
            placeholder="e.g., myapp.com"
          />
        </div>
        
        <div className="form-group">
          <label>Components to Deploy</label>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={deploymentSettings.deployFrontend}
                onChange={(e) => handleSettingChange('deployFrontend', e.target.checked)}
              />
              Frontend
            </label>
            <label>
              <input
                type="checkbox"
                checked={deploymentSettings.deployBackend}
                onChange={(e) => handleSettingChange('deployBackend', e.target.checked)}
              />
              Backend/API
            </label>
          </div>
        </div>
        
        <div className="form-group">
          <label>Auto-Scaling</label>
          <div className="toggle-container">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={deploymentSettings.autoScale}
                onChange={(e) => handleSettingChange('autoScale', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
            <span>{deploymentSettings.autoScale ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            className="btn-deploy"
            onClick={handleDeployProject}
            disabled={isDeploying}
          >
            {isDeploying ? 'Deploying...' : 'Deploy Project'}
          </button>
        </div>
      </div>
      
      <div className="deployment-history">
        <h3>Deployment History</h3>
        
        {deployments.length > 0 ? (
          <table className="deployments-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Environment</th>
                <th>Status</th>
                <th>Date</th>
                <th>URL</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deployments.map(deployment => (
                <tr key={deployment.id}>
                  <td>{deployment.id.substring(0, 8)}</td>
                  <td>{deployment.environment}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(deployment.status)}`}>
                      {deployment.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{formatDate(deployment.timestamp)}</td>
                  <td>
                    {deployment.url && (
                      <a href={deployment.url} target="_blank" rel="noopener noreferrer">
                        {deployment.url}
                      </a>
                    )}
                  </td>
                  <td>
                    <button className="btn-view-logs">
                      <i data-feather="file-text"></i>
                    </button>
                    <button className="btn-redeploy">
                      <i data-feather="refresh-cw"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-deployments">
            <p>No deployments found for this project.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeploymentPanel;
