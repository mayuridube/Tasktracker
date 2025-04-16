/**
 * Deployment Service for VibeCode
 * Handles project deployment operations
 */

// Store deployments by id
const deployments = new Map();

// Store deployments by project id
const projectDeployments = new Map();

/**
 * Creates a new deployment
 * @param {Object} deployment - Deployment data
 * @returns {Object} Created deployment
 */
async function createDeployment(deployment) {
  // Store the deployment
  deployments.set(deployment.id, deployment);
  
  // Add to project deployments
  if (!projectDeployments.has(deployment.projectId)) {
    projectDeployments.set(deployment.projectId, new Map());
  }
  
  projectDeployments.get(deployment.projectId).set(deployment.id, deployment);
  
  // Simulate deployment logs
  generateDeploymentLogs(deployment.id);
  
  return deployment;
}

/**
 * Gets a deployment by ID
 * @param {string} deploymentId - Deployment ID
 * @returns {Object|null} Deployment or null if not found
 */
function getDeployment(deploymentId) {
  return deployments.get(deploymentId) || null;
}

/**
 * Gets deployments for a project
 * @param {string} projectId - Project ID
 * @returns {Array} List of deployments
 */
function getDeploymentsByProjectId(projectId) {
  if (!projectDeployments.has(projectId)) {
    return [];
  }
  
  // Convert map to array and sort by timestamp (newest first)
  return Array.from(projectDeployments.get(projectId).values())
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Gets logs for a deployment
 * @param {string} deploymentId - Deployment ID
 * @returns {Array} Deployment logs
 */
async function getDeploymentLogs(deploymentId) {
  const deployment = deployments.get(deploymentId);
  
  if (!deployment) {
    return [];
  }
  
  // Return logs (if they exist) or generate mock logs
  return deployment.logs || generateDeploymentLogs(deploymentId);
}

/**
 * Updates a deployment status
 * @param {string} deploymentId - Deployment ID
 * @param {string} status - New status
 * @returns {boolean} Whether the update was successful
 */
async function updateDeploymentStatus(deploymentId, status) {
  const deployment = deployments.get(deploymentId);
  
  if (!deployment) {
    return false;
  }
  
  deployment.status = status;
  deployment.updatedAt = new Date().toISOString();
  
  return true;
}

/**
 * Generates mock logs for a deployment
 * @param {string} deploymentId - Deployment ID
 * @returns {Array} Generated logs
 */
function generateDeploymentLogs(deploymentId) {
  const deployment = deployments.get(deploymentId);
  
  if (!deployment) {
    return [];
  }
  
  // If logs already exist, return them
  if (deployment.logs) {
    return deployment.logs;
  }
  
  const logs = [];
  const startTime = new Date(deployment.timestamp);
  
  // Generate logs based on deployment environment and components
  logs.push({
    timestamp: startTime.toISOString(),
    level: 'INFO',
    message: `Starting deployment ${deploymentId} for project ${deployment.projectId}`,
    service: 'deployment'
  });
  
  logs.push({
    timestamp: new Date(startTime.getTime() + 500).toISOString(),
    level: 'INFO',
    message: `Environment: ${deployment.environment}`,
    service: 'deployment'
  });
  
  if (deployment.deployFrontend) {
    logs.push({
      timestamp: new Date(startTime.getTime() + 1000).toISOString(),
      level: 'INFO',
      message: 'Building frontend application...',
      service: 'frontend'
    });
    
    logs.push({
      timestamp: new Date(startTime.getTime() + 3000).toISOString(),
      level: 'INFO',
      message: 'Frontend built successfully',
      service: 'frontend'
    });
    
    logs.push({
      timestamp: new Date(startTime.getTime() + 4000).toISOString(),
      level: 'INFO',
      message: 'Deploying frontend assets...',
      service: 'frontend'
    });
    
    logs.push({
      timestamp: new Date(startTime.getTime() + 5000).toISOString(),
      level: 'INFO',
      message: 'Frontend deployed successfully',
      service: 'frontend'
    });
  }
  
  if (deployment.deployBackend) {
    logs.push({
      timestamp: new Date(startTime.getTime() + 2000).toISOString(),
      level: 'INFO',
      message: 'Building backend application...',
      service: 'backend'
    });
    
    logs.push({
      timestamp: new Date(startTime.getTime() + 4000).toISOString(),
      level: 'INFO',
      message: 'Backend built successfully',
      service: 'backend'
    });
    
    logs.push({
      timestamp: new Date(startTime.getTime() + 6000).toISOString(),
      level: 'INFO',
      message: `Creating ${deployment.replicas} replica(s)...`,
      service: 'backend'
    });
    
    logs.push({
      timestamp: new Date(startTime.getTime() + 7000).toISOString(),
      level: 'INFO',
      message: 'Backend containers deployed successfully',
      service: 'backend'
    });
  }
  
  if (deployment.domain) {
    logs.push({
      timestamp: new Date(startTime.getTime() + 8000).toISOString(),
      level: 'INFO',
      message: `Configuring custom domain: ${deployment.domain}`,
      service: 'deployment'
    });
  }
  
  logs.push({
    timestamp: new Date(startTime.getTime() + 9000).toISOString(),
    level: 'INFO',
    message: `Deployment URL: ${deployment.url}`,
    service: 'deployment'
  });
  
  const finalStatus = deployment.status || 'success';
  
  if (finalStatus === 'failed') {
    logs.push({
      timestamp: new Date(startTime.getTime() + 10000).toISOString(),
      level: 'ERROR',
      message: 'Deployment failed: An error occurred during deployment',
      service: 'deployment'
    });
  } else {
    logs.push({
      timestamp: new Date(startTime.getTime() + 10000).toISOString(),
      level: 'INFO',
      message: 'Deployment completed successfully',
      service: 'deployment'
    });
  }
  
  // Store logs with the deployment
  deployment.logs = logs;
  
  return logs;
}

module.exports = {
  createDeployment,
  getDeployment,
  getDeploymentsByProjectId,
  getDeploymentLogs,
  updateDeploymentStatus
};
