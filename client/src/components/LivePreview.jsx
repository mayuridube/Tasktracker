import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../services/api';

function LivePreview({ project }) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewportSize, setViewportSize] = useState('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const iframeRef = useRef(null);
  
  useEffect(() => {
    if (project.id) {
      generatePreview();
    }
  }, [project.id]);
  
  const generatePreview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetchApi(`/api/projects/${project.id}/preview`);
      
      if (response.previewUrl) {
        setPreviewUrl(response.previewUrl);
      } else {
        setError('Failed to generate preview: ' + (response.message || 'Unknown error'));
      }
      
      setIsLoading(false);
    } catch (error) {
      setError('Failed to generate preview: ' + error.message);
      setIsLoading(false);
    }
  };
  
  const refreshPreview = () => {
    // Increment refresh key to force iframe refresh
    setRefreshKey(prevKey => prevKey + 1);
    
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };
  
  const getViewportClass = () => {
    switch (viewportSize) {
      case 'mobile':
        return 'mobile-viewport';
      case 'tablet':
        return 'tablet-viewport';
      case 'desktop':
      default:
        return 'desktop-viewport';
    }
  };
  
  // Function to get preview content when no actual preview URL is available
  const getDefaultPreviewContent = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${project.name || 'VibeCode Project'}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 {
            color: #333;
          }
          .tech-badge {
            display: inline-block;
            background-color: #e0e0e0;
            border-radius: 4px;
            padding: 5px 10px;
            margin-right: 10px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${project.name || 'My VibeCode Project'}</h1>
          <p>This is a preview of your project.</p>
          <div>
            <span class="tech-badge">${project.framework || 'react'}</span>
            <span class="tech-badge">${project.backend || 'express'}</span>
            <span class="tech-badge">${project.database || 'mongodb'}</span>
          </div>
          <div style="margin-top: 30px; color: #666;">
            <p>To see your actual content, make changes to your project files and rebuild the preview.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="live-preview">
      <div className="preview-header">
        <h3>Live Preview</h3>
        
        <div className="viewport-controls">
          <button 
            className={viewportSize === 'mobile' ? 'active' : ''}
            onClick={() => setViewportSize('mobile')}
          >
            <i data-feather="smartphone"></i>
          </button>
          <button 
            className={viewportSize === 'tablet' ? 'active' : ''}
            onClick={() => setViewportSize('tablet')}
          >
            <i data-feather="tablet"></i>
          </button>
          <button 
            className={viewportSize === 'desktop' ? 'active' : ''}
            onClick={() => setViewportSize('desktop')}
          >
            <i data-feather="monitor"></i>
          </button>
        </div>
        
        <div className="preview-actions">
          <button onClick={refreshPreview} className="btn-refresh">
            <i data-feather="refresh-cw"></i> Refresh
          </button>
          <button onClick={generatePreview} className="btn-rebuild" disabled={isLoading}>
            <i data-feather="play"></i> {isLoading ? 'Building...' : 'Rebuild'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="preview-error">
          <p>{error}</p>
        </div>
      )}
      
      <div className={`preview-container ${getViewportClass()}`}>
        {previewUrl ? (
          <iframe 
            key={refreshKey}
            ref={iframeRef}
            src={previewUrl} 
            title="Project Preview"
            className="preview-iframe"
          ></iframe>
        ) : (
          <iframe 
            key={refreshKey}
            ref={iframeRef}
            srcDoc={getDefaultPreviewContent()}
            title="Project Preview"
            className="preview-iframe"
          ></iframe>
        )}
      </div>
      
      <div className="preview-info">
        {previewUrl && (
          <div className="preview-url">
            <span>Preview URL: </span>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              {previewUrl}
            </a>
          </div>
        )}
        
        <div className="preview-note">
          <p>
            <i data-feather="info"></i>
            This is a live preview of your project. Changes to your code will be reflected here after rebuilding.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LivePreview;
