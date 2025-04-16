/**
 * Database Connector Service for VibeCode
 * Handles database connections and operations
 */

// Map to store database connections by connection string
const databaseConnections = new Map();

// Mock data for simulation
const mockDatabases = {
  mongodb: ['vibecodedb', 'testdb', 'admindb'],
  postgresql: ['postgres', 'vibecodedb', 'testdb'],
  mysql: ['mysql', 'vibecodedb', 'test']
};

const mockCollections = {
  vibecodedb: ['users', 'projects', 'deployments', 'containers'],
  testdb: ['products', 'orders', 'customers'],
  admindb: ['users', 'settings', 'logs']
};

const mockDocuments = {
  users: [
    { _id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' },
    { _id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'developer' },
    { _id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'viewer' }
  ],
  projects: [
    { _id: '1', name: 'E-commerce Website', framework: 'react', backend: 'express', status: 'active' },
    { _id: '2', name: 'Blog Platform', framework: 'vue', backend: 'django', status: 'development' },
    { _id: '3', name: 'Admin Dashboard', framework: 'angular', backend: 'fastapi', status: 'completed' }
  ],
  products: [
    { _id: '1', name: 'Laptop', price: 999.99, category: 'Electronics', inStock: true },
    { _id: '2', name: 'Headphones', price: 149.99, category: 'Electronics', inStock: true },
    { _id: '3', name: 'Desk Chair', price: 249.99, category: 'Furniture', inStock: false }
  ],
  customers: [
    { _id: '1', name: 'Alice Brown', email: 'alice@example.com', status: 'active' },
    { _id: '2', name: 'Charlie Davis', email: 'charlie@example.com', status: 'inactive' }
  ]
};

/**
 * Connects to a database
 * @param {string} connectionString - Database connection string
 * @param {string} databaseType - Type of database (mongodb, postgresql, mysql)
 * @returns {Object} Connection result
 */
async function connectToDatabase(connectionString, databaseType) {
  try {
    // For the prototype, we'll simulate database connections
    // In a real implementation, this would use the appropriate database driver
    
    // Validate connection string format
    if (!isValidConnectionString(connectionString, databaseType)) {
      return {
        success: false,
        message: 'Invalid connection string format'
      };
    }
    
    // Check if we're already connected to this database
    if (databaseConnections.has(connectionString)) {
      return {
        success: true,
        message: 'Already connected to this database'
      };
    }
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Store the connection
    databaseConnections.set(connectionString, {
      type: databaseType,
      connected: true,
      connectedAt: new Date().toISOString()
    });
    
    return {
      success: true,
      message: `Connected to ${databaseType} database successfully`
    };
  } catch (error) {
    console.error('Database connection error:', error);
    return {
      success: false,
      message: `Failed to connect to database: ${error.message}`
    };
  }
}

/**
 * Lists databases for a connection
 * @param {string} databaseType - Type of database
 * @param {string} connectionString - Database connection string
 * @returns {Array} List of databases
 */
async function listDatabases(databaseType, connectionString) {
  try {
    // Check if we're connected
    if (!databaseConnections.has(connectionString)) {
      throw new Error('Not connected to this database');
    }
    
    // Return mock databases for the given type
    return mockDatabases[databaseType] || [];
  } catch (error) {
    console.error('Error listing databases:', error);
    return [];
  }
}

/**
 * Lists collections for a database
 * @param {string} database - Database name
 * @returns {Array} List of collections
 */
async function listCollections(database) {
  try {
    // Return mock collections for the given database
    return mockCollections[database] || [];
  } catch (error) {
    console.error('Error listing collections:', error);
    return [];
  }
}

/**
 * Gets documents from a collection
 * @param {string} database - Database name
 * @param {string} collection - Collection name
 * @param {Object} query - Query parameters
 * @returns {Array} List of documents
 */
async function getDocuments(database, collection, query = {}) {
  try {
    // Return mock documents for the given collection
    return mockDocuments[collection] || [];
  } catch (error) {
    console.error('Error getting documents:', error);
    return [];
  }
}

/**
 * Inserts a document into a collection
 * @param {string} database - Database name
 * @param {string} collection - Collection name
 * @param {Object} document - Document to insert
 * @returns {Object} Insertion result
 */
async function insertDocument(database, collection, document) {
  try {
    // In a real implementation, this would insert a document into the database
    return {
      success: true,
      insertedId: `mock-${Date.now()}`
    };
  } catch (error) {
    console.error('Error inserting document:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Updates a document in a collection
 * @param {string} database - Database name
 * @param {string} collection - Collection name
 * @param {string} documentId - Document ID
 * @param {Object} updates - Document updates
 * @returns {Object} Update result
 */
async function updateDocument(database, collection, documentId, updates) {
  try {
    // In a real implementation, this would update a document in the database
    return {
      success: true,
      modifiedCount: 1
    };
  } catch (error) {
    console.error('Error updating document:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Deletes a document from a collection
 * @param {string} database - Database name
 * @param {string} collection - Collection name
 * @param {string} documentId - Document ID
 * @returns {Object} Deletion result
 */
async function deleteDocument(database, collection, documentId) {
  try {
    // In a real implementation, this would delete a document from the database
    return {
      success: true,
      deletedCount: 1
    };
  } catch (error) {
    console.error('Error deleting document:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Checks if a connection string is valid for a database type
 * @param {string} connectionString - Database connection string
 * @param {string} databaseType - Type of database
 * @returns {boolean} Whether the connection string is valid
 */
function isValidConnectionString(connectionString, databaseType) {
  switch (databaseType) {
    case 'mongodb':
      return connectionString.startsWith('mongodb://') || connectionString.startsWith('mongodb+srv://');
    case 'postgresql':
      return connectionString.startsWith('postgresql://');
    case 'mysql':
      return connectionString.startsWith('mysql://');
    default:
      return false;
  }
}

/**
 * Disconnects from a database
 * @param {string} connectionString - Database connection string
 * @returns {Object} Disconnection result
 */
async function disconnectFromDatabase(connectionString) {
  try {
    if (!databaseConnections.has(connectionString)) {
      return {
        success: false,
        message: 'Not connected to this database'
      };
    }
    
    // Remove the connection
    databaseConnections.delete(connectionString);
    
    return {
      success: true,
      message: 'Disconnected from database successfully'
    };
  } catch (error) {
    console.error('Database disconnection error:', error);
    return {
      success: false,
      message: `Failed to disconnect from database: ${error.message}`
    };
  }
}

module.exports = {
  connectToDatabase,
  listDatabases,
  listCollections,
  getDocuments,
  insertDocument,
  updateDocument,
  deleteDocument,
  disconnectFromDatabase
};
