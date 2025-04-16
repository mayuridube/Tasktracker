/**
 * Deployment API router for VibeCode
 * Handles project deployment operations
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getProjectById } = require('../models/Project');
const { createDeployment, getDeploymentsByProjectId, getDeploymentLogs } = require('../services/deploymentService');

// Get all deployments for a project
router.get('/', async (req, res) => {
  try {
    const { projectId } = req.query;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }
    
    const deployments = await getDeploymentsByProjectId(projectId);
    res.json({ success: true, deployments });
  } catch (error) {
    console.error('Error fetching deployments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deployments',
      error: error.message
    });
  }
});

// Create a new deployment
router.post('/', async (req, res) => {
  try {
    const {
      projectId,
      environment,
      replicas,
      domain,
      deployBackend,
      deployFrontend,
      autoScale
    } = req.body;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }
    
    const project = await getProjectById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Create a new deployment
    const deploymentId = uuidv4();
    const deployment = {
      id: deploymentId,
      projectId,
      environment: environment || 'development',
      replicas: replicas || 1,
      domain: domain || '',
      deployBackend: deployBackend !== false,
      deployFrontend: deployFrontend !== false,
      autoScale: autoScale || false,
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
    
    // Generate a URL for the deployment
    const subdomain = project.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let url;
    
    if (domain) {
      url = `https://${domain}`;
    } else {
      url = `https://${subdomain}-${environment}.vibecode.example.com`;
    }
    
    deployment.url = url;
    
    // Start the deployment process
    await createDeployment(deployment);
    
    // Simulate deployment process
    setTimeout(async () => {
      // Update deployment status after a delay
      // In a real implementation, this would be event-driven
      const updatedDeployment = { ...deployment, status: 'success' };
      await createDeployment(updatedDeployment);
    }, 5000);
    
    res.json({
      success: true,
      message: 'Deployment initiated',
      deploymentId,
      url
    });
  } catch (error) {
    console.error('Error creating deployment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create deployment',
      error: error.message
    });
  }
});

// Get deployment by ID
router.get('/:id', async (req, res) => {
  try {
    const deploymentId = req.params.id;
    const deployment = await getDeployment(deploymentId);
    
    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found'
      });
    }
    
    res.json({ success: true, deployment });
  } catch (error) {
    console.error('Error fetching deployment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deployment',
      error: error.message
    });
  }
});

// Get logs for a deployment
router.get('/:id/logs', async (req, res) => {
  try {
    const deploymentId = req.params.id;
    const logs = await getDeploymentLogs(deploymentId);
    
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching deployment logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deployment logs',
      error: error.message
    });
  }
});

// Redeploy an existing deployment
router.post('/:id/redeploy', async (req, res) => {
  try {
    const deploymentId = req.params.id;
    // In a real implementation, this would retrieve the original deployment
    // and start a new deployment process with the same settings
    
    res.json({
      success: true,
      message: 'Redeployment initiated',
      deploymentId: uuidv4() // New deployment ID
    });
  } catch (error) {
    console.error('Error redeploying:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to redeploy',
      error: error.message
    });
  }
});

module.exports = router;
