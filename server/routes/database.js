/**
 * Database API router for VibeCode
 * Handles database connection and operations
 */

const express = require('express');
const router = express.Router();
const { connectToDatabase, listDatabases, listCollections, getDocuments } = require('../services/databaseConnector');

// Connect to a database
router.post('/connect', async (req, res) => {
  try {
    const { projectId, connectionString, databaseType } = req.body;
    
    if (!projectId || !connectionString || !databaseType) {
      return res.status(400).json({
        success: false,
        message: 'Project ID, connection string, and database type are required'
      });
    }
    
    // For the prototype, we'll support simulated database connections
    const connection = await connectToDatabase(connectionString, databaseType);
    
    if (!connection.success) {
      return res.status(400).json({
        success: false,
        message: connection.message || 'Failed to connect to database'
      });
    }
    
    // Get a list of databases
    const databases = await listDatabases(databaseType, connectionString);
    
    res.json({
      success: true,
      message: 'Connected to database successfully',
      databases
    });
  } catch (error) {
    console.error('Error connecting to database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to database',
      error: error.message
    });
  }
});

// Get saved database connections for a project
router.get('/connections', async (req, res) => {
  try {
    const { projectId } = req.query;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }
    
    // In a real implementation, this would fetch saved connections from a database
    // For the prototype, we'll return mock data
    const connections = [
      'vibecodedb',
      'testdb'
    ];
    
    res.json({
      success: true,
      connections
    });
  } catch (error) {
    console.error('Error fetching database connections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch database connections',
      error: error.message
    });
  }
});

// Get collections for a database
router.get('/:database/collections', async (req, res) => {
  try {
    const { database } = req.params;
    const { projectId } = req.query;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }
    
    // For the prototype, we'll return mock collections
    const collections = await listCollections(database);
    
    res.json({
      success: true,
      collections
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collections',
      error: error.message
    });
  }
});

// Get documents for a collection
router.get('/:database/collection/:collection/documents', async (req, res) => {
  try {
    const { database, collection } = req.params;
    const { projectId } = req.query;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }
    
    // For the prototype, we'll return mock documents
    const documents = await getDocuments(database, collection);
    
    res.json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: error.message
    });
  }
});

// Create document in a collection
router.post('/:database/collection/:collection/documents', async (req, res) => {
  try {
    const { database, collection } = req.params;
    const { document, projectId } = req.body;
    
    if (!projectId || !document) {
      return res.status(400).json({
        success: false,
        message: 'Project ID and document data are required'
      });
    }
    
    // In a real implementation, this would insert a document into the database
    // For the prototype, we'll just return success
    
    res.json({
      success: true,
      message: 'Document created successfully',
      documentId: 'mock-doc-' + Date.now()
    });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create document',
      error: error.message
    });
  }
});

// Update document in a collection
router.put('/:database/collection/:collection/documents/:documentId', async (req, res) => {
  try {
    const { database, collection, documentId } = req.params;
    const { document, projectId } = req.body;
    
    if (!projectId || !document) {
      return res.status(400).json({
        success: false,
        message: 'Project ID and document data are required'
      });
    }
    
    // In a real implementation, this would update a document in the database
    // For the prototype, we'll just return success
    
    res.json({
      success: true,
      message: 'Document updated successfully'
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document',
      error: error.message
    });
  }
});

// Delete document from a collection
router.delete('/:database/collection/:collection/documents/:documentId', async (req, res) => {
  try {
    const { database, collection, documentId } = req.params;
    const { projectId } = req.query;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }
    
    // In a real implementation, this would delete a document from the database
    // For the prototype, we'll just return success
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
});

module.exports = router;
