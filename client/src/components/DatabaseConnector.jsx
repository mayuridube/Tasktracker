import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';

function DatabaseConnector({ project }) {
  const [databases, setDatabases] = useState([]);
  const [activeDatabase, setActiveDatabase] = useState(null);
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionString, setConnectionString] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    if (project.database && project.database !== 'none') {
      // If the project has a database configuration, try to load saved connections
      loadSavedConnections();
    }
  }, [project]);
  
  const loadSavedConnections = async () => {
    try {
      setIsLoading(true);
      const response = await fetchApi(`/api/database/connections?projectId=${project.id}`);
      if (response.connections && response.connections.length > 0) {
        setDatabases(response.connections);
        setIsConnected(true);
      }
      setIsLoading(false);
    } catch (error) {
      setError('Failed to load database connections: ' + error.message);
      setIsLoading(false);
    }
  };
  
  const connectToDatabase = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetchApi('/api/database/connect', {
        method: 'POST',
        body: JSON.stringify({
          projectId: project.id,
          connectionString,
          databaseType: project.database
        })
      });
      
      if (response.success) {
        setIsConnected(true);
        setDatabases(response.databases || []);
        
        if (response.databases && response.databases.length > 0) {
          setActiveDatabase(response.databases[0]);
        }
      } else {
        setError(response.message || 'Failed to connect to database');
      }
      
      setIsLoading(false);
    } catch (error) {
      setError('Connection failed: ' + error.message);
      setIsLoading(false);
    }
  };
  
  const loadDatabaseCollections = async (dbName) => {
    try {
      setIsLoading(true);
      const response = await fetchApi(`/api/database/${dbName}/collections?projectId=${project.id}`);
      
      if (response.collections) {
        setCollections(response.collections);
        setActiveCollection(null); // Reset active collection
        setDocuments([]); // Clear documents
      }
      
      setIsLoading(false);
    } catch (error) {
      setError('Failed to load collections: ' + error.message);
      setIsLoading(false);
    }
  };
  
  const loadCollectionDocuments = async (collectionName) => {
    if (!activeDatabase) return;
    
    try {
      setIsLoading(true);
      const response = await fetchApi(`/api/database/${activeDatabase}/collection/${collectionName}/documents?projectId=${project.id}`);
      
      if (response.documents) {
        setDocuments(response.documents);
      }
      
      setIsLoading(false);
    } catch (error) {
      setError('Failed to load documents: ' + error.message);
      setIsLoading(false);
    }
  };
  
  const handleDatabaseSelect = (dbName) => {
    setActiveDatabase(dbName);
    setActiveCollection(null);
    setDocuments([]);
    loadDatabaseCollections(dbName);
  };
  
  const handleCollectionSelect = (collectionName) => {
    setActiveCollection(collectionName);
    loadCollectionDocuments(collectionName);
  };

  return (
    <div className="database-connector">
      {!isConnected ? (
        <div className="database-connect-form">
          <h3>Connect to {project.database.toUpperCase()} Database</h3>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label>Connection String</label>
            <input
              type="text"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              placeholder={`mongodb://username:password@hostname:port/database`}
            />
            <small>
              {project.database === 'mongodb' && 'Example: mongodb://username:password@hostname:port/database'}
              {project.database === 'postgresql' && 'Example: postgresql://username:password@hostname:port/database'}
              {project.database === 'mysql' && 'Example: mysql://username:password@hostname:port/database'}
            </small>
          </div>
          
          <button 
            onClick={connectToDatabase}
            disabled={isLoading || !connectionString}
            className="btn-connect"
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>
          
          <div className="helper-text">
            <p>
              You can also use environment variables for database connection:
              <code>DB_URI</code> in your backend code.
            </p>
          </div>
        </div>
      ) : (
        <div className="database-explorer">
          <div className="database-sidebar">
            <div className="database-list">
              <h3>Databases</h3>
              <ul>
                {databases.map((db, index) => (
                  <li 
                    key={index}
                    className={activeDatabase === db ? 'active' : ''}
                    onClick={() => handleDatabaseSelect(db)}
                  >
                    {db}
                  </li>
                ))}
              </ul>
            </div>
            
            {activeDatabase && (
              <div className="collections-list">
                <h3>Collections</h3>
                {isLoading ? (
                  <div className="loading">Loading collections...</div>
                ) : (
                  <ul>
                    {collections.map((collection, index) => (
                      <li 
                        key={index}
                        className={activeCollection === collection ? 'active' : ''}
                        onClick={() => handleCollectionSelect(collection)}
                      >
                        {collection}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          
          <div className="database-content">
            {activeCollection ? (
              <div className="document-viewer">
                <h3>Documents in {activeCollection}</h3>
                
                {isLoading ? (
                  <div className="loading">Loading documents...</div>
                ) : (
                  <div className="documents-table">
                    {documents.length > 0 ? (
                      <table>
                        <thead>
                          <tr>
                            {Object.keys(documents[0]).map((key, index) => (
                              <th key={index}>{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {documents.map((doc, rowIndex) => (
                            <tr key={rowIndex}>
                              {Object.values(doc).map((value, colIndex) => (
                                <td key={colIndex}>
                                  {typeof value === 'object' 
                                    ? JSON.stringify(value)
                                    : String(value)
                                  }
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="no-documents">
                        No documents found in this collection.
                      </div>
                    )}
                  </div>
                )}
                
                <div className="document-actions">
                  <button className="btn-new-document">
                    Add Document
                  </button>
                  <button className="btn-query">
                    Query
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-collection">
                <p>Select a collection to view documents</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DatabaseConnector;
