/**
 * Projects API router for VibeCode
 * Handles project CRUD operations and file management
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { getProjectById, getAllProjects, createProject, updateProject, deleteProject } = require('../models/Project');

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await getAllProjects();
    res.json({ success: true, projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch projects',
      error: error.message 
    });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await getProjectById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }
    
    res.json({ success: true, project });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch project',
      error: error.message 
    });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const projectData = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Create default files for the project based on the framework
    const defaultFiles = createDefaultFiles(projectData.framework);
    projectData.files = defaultFiles;
    
    const project = await createProject(projectData);
    res.status(201).json({ success: true, project });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create project',
      error: error.message 
    });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const existingProject = await getProjectById(projectId);
    
    if (!existingProject) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }
    
    const updatedProject = {
      ...existingProject,
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await updateProject(projectId, updatedProject);
    res.json({ success: true, project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update project',
      error: error.message 
    });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const existingProject = await getProjectById(projectId);
    
    if (!existingProject) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }
    
    await deleteProject(projectId);
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete project',
      error: error.message 
    });
  }
});

// Get project files
router.get('/:id/files', async (req, res) => {
  try {
    const project = await getProjectById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }
    
    res.json({ success: true, files: project.files || {} });
  } catch (error) {
    console.error('Error fetching project files:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch project files',
      error: error.message 
    });
  }
});

// Update a specific file
router.put('/:id/files/:filename', async (req, res) => {
  try {
    const { id, filename } = req.params;
    const { content } = req.body;
    
    const project = await getProjectById(id);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }
    
    // Update the file
    const updatedFiles = {
      ...project.files,
      [filename]: content
    };
    
    await updateProject(id, {
      ...project,
      files: updatedFiles,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      message: 'File updated successfully' 
    });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update file',
      error: error.message 
    });
  }
});

// Delete a specific file
router.delete('/:id/files/:filename', async (req, res) => {
  try {
    const { id, filename } = req.params;
    
    const project = await getProjectById(id);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }
    
    // Create a copy of the files object without the deleted file
    const { [filename]: deletedFile, ...updatedFiles } = project.files;
    
    await updateProject(id, {
      ...project,
      files: updatedFiles,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      message: 'File deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete file',
      error: error.message 
    });
  }
});

// Generate preview URL for a project
router.get('/:id/preview', async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await getProjectById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }
    
    // In a real implementation, this would generate a live preview
    // For the prototype, we'll return a mock URL
    const previewUrl = `/preview/${projectId}`;
    
    res.json({ 
      success: true, 
      previewUrl 
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate preview',
      error: error.message 
    });
  }
});

// Get project logs
router.get('/:id/logs', async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await getProjectById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }
    
    // Mock logs for the prototype
    const logs = [
      { timestamp: new Date().toISOString(), level: 'INFO', message: 'Application started successfully', source: 'app' },
      { timestamp: new Date(Date.now() - 10000).toISOString(), level: 'DEBUG', message: 'Connected to database', source: 'database' },
      { timestamp: new Date(Date.now() - 30000).toISOString(), level: 'INFO', message: 'API server initialized on port 8000', source: 'server' },
      { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'WARN', message: 'High memory usage detected', source: 'system' }
    ];
    
    res.json({ 
      success: true, 
      logs 
    });
  } catch (error) {
    console.error('Error fetching project logs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch project logs',
      error: error.message 
    });
  }
});

// Save project (used by the frontend)
router.post('/save', async (req, res) => {
  try {
    const { project } = req.body;
    
    if (!project) {
      return res.status(400).json({
        success: false,
        message: 'Project data is required'
      });
    }
    
    let existingProject = null;
    
    if (project.id) {
      existingProject = await getProjectById(project.id);
    }
    
    if (existingProject) {
      // Update existing project
      const updatedProject = {
        ...existingProject,
        ...project,
        updatedAt: new Date().toISOString()
      };
      
      await updateProject(project.id, updatedProject);
      res.json({ 
        success: true, 
        message: 'Project saved successfully',
        project: updatedProject
      });
    } else {
      // Create new project
      const newProject = {
        id: uuidv4(),
        ...project,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await createProject(newProject);
      res.json({ 
        success: true, 
        message: 'Project saved successfully',
        project: newProject
      });
    }
  } catch (error) {
    console.error('Error saving project:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save project',
      error: error.message 
    });
  }
});

// Helper function to create default files based on framework
function createDefaultFiles(framework) {
  switch (framework) {
    case 'react':
      return {
        'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <title>React App</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script src="index.js"></script>\n</body>\n</html>',
        'index.js': 'import React from "react";\nimport ReactDOM from "react-dom";\nimport App from "./App";\n\nReactDOM.render(<App />, document.getElementById("root"));',
        'App.js': 'import React from "react";\n\nfunction App() {\n  return (\n    <div className="App">\n      <h1>Hello from VibeCode!</h1>\n      <p>Edit App.js to get started.</p>\n    </div>\n  );\n}\n\nexport default App;',
        'styles.css': 'body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n}\n\n.App {\n  text-align: center;\n}'
      };
    case 'vue':
      return {
        'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <title>Vue App</title>\n</head>\n<body>\n  <div id="app"></div>\n  <script src="index.js"></script>\n</body>\n</html>',
        'index.js': 'import { createApp } from "vue";\nimport App from "./App.vue";\n\ncreateApp(App).mount("#app");',
        'App.vue': '<template>\n  <div class="App">\n    <h1>Hello from VibeCode!</h1>\n    <p>Edit App.vue to get started.</p>\n  </div>\n</template>\n\n<script>\nexport default {\n  name: "App"\n};\n</script>\n\n<style>\n.App {\n  text-align: center;\n}\n</style>'
      };
    case 'angular':
      return {
        'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <title>Angular App</title>\n</head>\n<body>\n  <app-root></app-root>\n  <script src="main.ts"></script>\n</body>\n</html>',
        'main.ts': 'import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";\nimport { AppModule } from "./app/app.module";\n\nplatformBrowserDynamic().bootstrapModule(AppModule);',
        'app/app.component.ts': 'import { Component } from "@angular/core";\n\n@Component({\n  selector: "app-root",\n  template: `\n    <div class="App">\n      <h1>Hello from VibeCode!</h1>\n      <p>Edit app.component.ts to get started.</p>\n    </div>\n  `,\n  styles: [`\n    .App {\n      text-align: center;\n    }\n  `]\n})\nexport class AppComponent {}'
      };
    default: // HTML/CSS/JS
      return {
        'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Project</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <div id="app">\n    <h1>Hello from VibeCode!</h1>\n    <p>Edit index.html to get started.</p>\n  </div>\n  <script src="app.js"></script>\n</body>\n</html>',
        'styles.css': 'body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n}\n\n#app {\n  text-align: center;\n}',
        'app.js': 'document.addEventListener("DOMContentLoaded", () => {\n  console.log("VibeCode application loaded!");\n});'
      };
  }
}

module.exports = router;
