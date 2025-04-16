/**
 * Project Model for VibeCode
 * Handles project data storage and retrieval
 */

// In a production environment, this would use a real database
// For the prototype, we'll use an in-memory store
const projectsStore = new Map();

/**
 * Get a project by ID
 * @param {string} id - Project ID
 * @returns {Object|null} Project data or null if not found
 */
async function getProjectById(id) {
  return projectsStore.get(id) || null;
}

/**
 * Get all projects
 * @returns {Array} Array of projects
 */
async function getAllProjects() {
  return Array.from(projectsStore.values());
}

/**
 * Create a new project
 * @param {Object} project - Project data
 * @returns {Object} Created project
 */
async function createProject(project) {
  if (!project.id) {
    throw new Error('Project ID is required');
  }
  
  projectsStore.set(project.id, project);
  return project;
}

/**
 * Update a project
 * @param {string} id - Project ID
 * @param {Object} updates - Project updates
 * @returns {Object} Updated project
 */
async function updateProject(id, updates) {
  const project = await getProjectById(id);
  
  if (!project) {
    throw new Error('Project not found');
  }
  
  const updatedProject = {
    ...project,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  projectsStore.set(id, updatedProject);
  return updatedProject;
}

/**
 * Delete a project
 * @param {string} id - Project ID
 * @returns {boolean} Whether the operation was successful
 */
async function deleteProject(id) {
  const exists = projectsStore.has(id);
  
  if (!exists) {
    throw new Error('Project not found');
  }
  
  return projectsStore.delete(id);
}

/**
 * Search for projects
 * @param {Object} criteria - Search criteria
 * @returns {Array} Array of matching projects
 */
async function searchProjects(criteria = {}) {
  const { name, framework, backend, database } = criteria;
  let results = Array.from(projectsStore.values());
  
  if (name) {
    results = results.filter(project => 
      project.name.toLowerCase().includes(name.toLowerCase())
    );
  }
  
  if (framework) {
    results = results.filter(project => project.framework === framework);
  }
  
  if (backend) {
    results = results.filter(project => project.backend === backend);
  }
  
  if (database) {
    results = results.filter(project => project.database === database);
  }
  
  return results;
}

// Add some demo projects for testing
function addDemoProjects() {
  const demoProjects = [
    {
      id: 'demo-project-1',
      name: 'E-commerce Website',
      framework: 'react',
      backend: 'express',
      database: 'mongodb',
      isPrivate: false,
      customDomain: '',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      files: {
        'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <title>E-commerce Website</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <div id="root"></div>\n  <script src="app.js"></script>\n</body>\n</html>',
        'styles.css': 'body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n}',
        'app.js': 'import React from "react";\nimport ReactDOM from "react-dom";\n\nfunction App() {\n  return (\n    <div>\n      <h1>E-commerce Website</h1>\n      <p>Welcome to our store!</p>\n    </div>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById("root"));'
      }
    },
    {
      id: 'demo-project-2',
      name: 'Personal Blog',
      framework: 'vue',
      backend: 'express',
      database: 'mongodb',
      isPrivate: true,
      customDomain: 'blog.example.com',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      files: {
        'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <title>Personal Blog</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <div id="app"></div>\n  <script src="app.js"></script>\n</body>\n</html>',
        'styles.css': 'body {\n  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;\n  line-height: 1.6;\n  color: #333;\n  margin: 0;\n  padding: 20px;\n}',
        'app.js': 'import Vue from "vue";\n\nnew Vue({\n  el: "#app",\n  data: {\n    title: "My Personal Blog"\n  },\n  template: `\n    <div>\n      <h1>{{ title }}</h1>\n      <p>Welcome to my blog!</p>\n    </div>\n  `\n});'
      }
    }
  ];
  
  demoProjects.forEach(project => {
    projectsStore.set(project.id, project);
  });
}

// Add demo projects when module is loaded
addDemoProjects();

module.exports = {
  getProjectById,
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  searchProjects
};
