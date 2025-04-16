// API service for client-server communication

/**
 * Base API URL
 */
const API_BASE_URL = '/api';

/**
 * Fetch API wrapper with error handling
 * @param {string} endpoint - API endpoint to call
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
export const fetchApi = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('/') 
    ? endpoint
    : `${API_BASE_URL}/${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
};

/**
 * User authentication methods
 */
export const auth = {
  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data
   */
  login: async (email, password) => {
    return fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  
  /**
   * Register new user
   * @param {string} name - User name
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data
   */
  register: async (name, email, password) => {
    return fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  },
  
  /**
   * Logout current user
   * @returns {Promise<Object>} Logout result
   */
  logout: async () => {
    return fetchApi('/auth/logout', {
      method: 'POST'
    });
  },
  
  /**
   * Get current user data
   * @returns {Promise<Object>} User data
   */
  getCurrentUser: async () => {
    return fetchApi('/auth/me');
  }
};

/**
 * Project methods
 */
export const projects = {
  /**
   * Get all projects
   * @returns {Promise<Array>} List of projects
   */
  getAll: async () => {
    return fetchApi('/projects');
  },
  
  /**
   * Get project by ID
   * @param {string} id - Project ID
   * @returns {Promise<Object>} Project data
   */
  getById: async (id) => {
    return fetchApi(`/projects/${id}`);
  },
  
  /**
   * Create new project
   * @param {Object} project - Project data
   * @returns {Promise<Object>} Created project
   */
  create: async (project) => {
    return fetchApi('/projects', {
      method: 'POST',
      body: JSON.stringify(project)
    });
  },
  
  /**
   * Update project
   * @param {string} id - Project ID
   * @param {Object} project - Project data
   * @returns {Promise<Object>} Updated project
   */
  update: async (id, project) => {
    return fetchApi(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project)
    });
  },
  
  /**
   * Delete project
   * @param {string} id - Project ID
   * @returns {Promise<Object>} Deletion result
   */
  delete: async (id) => {
    return fetchApi(`/projects/${id}`, {
      method: 'DELETE'
    });
  }
};

/**
 * Deployment methods
 */
export const deployments = {
  /**
   * Get deployments for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} List of deployments
   */
  getForProject: async (projectId) => {
    return fetchApi(`/deployments?projectId=${projectId}`);
  },
  
  /**
   * Create new deployment
   * @param {Object} deployment - Deployment data
   * @returns {Promise<Object>} Created deployment
   */
  create: async (deployment) => {
    return fetchApi('/deployments', {
      method: 'POST',
      body: JSON.stringify(deployment)
    });
  },
  
  /**
   * Get deployment logs
   * @param {string} deploymentId - Deployment ID
   * @returns {Promise<Object>} Deployment logs
   */
  getLogs: async (deploymentId) => {
    return fetchApi(`/deployments/${deploymentId}/logs`);
  }
};

/**
 * Database methods
 */
export const database = {
  /**
   * Connect to database
   * @param {Object} connectionData - Database connection data
   * @returns {Promise<Object>} Connection result
   */
  connect: async (connectionData) => {
    return fetchApi('/database/connect', {
      method: 'POST',
      body: JSON.stringify(connectionData)
    });
  },
  
  /**
   * Get collections for a database
   * @param {string} databaseName - Database name
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Collections data
   */
  getCollections: async (databaseName, projectId) => {
    return fetchApi(`/database/${databaseName}/collections?projectId=${projectId}`);
  },
  
  /**
   * Get documents from a collection
   * @param {string} databaseName - Database name
   * @param {string} collectionName - Collection name
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Documents data
   */
  getDocuments: async (databaseName, collectionName, projectId) => {
    return fetchApi(`/database/${databaseName}/collection/${collectionName}/documents?projectId=${projectId}`);
  }
};
