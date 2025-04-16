const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Base directory for storing generated websites
const websitesDir = path.join(__dirname, 'generated-websites');

// Ensure the websites directory exists
if (!fs.existsSync(websitesDir)) {
  fs.mkdirSync(websitesDir, { recursive: true });
}

/**
 * Save generated website files to disk
 * @param {Object} website - Object containing html, css, and js code
 * @returns {Object} - Website information including ID and file paths
 */
function saveWebsite(website) {
  const websiteId = uuidv4();
  const websiteDir = path.join(websitesDir, websiteId);
  
  // Create directory for this website
  fs.mkdirSync(websiteDir, { recursive: true });
  
  // Write the files
  fs.writeFileSync(path.join(websiteDir, 'index.html'), website.html);
  fs.writeFileSync(path.join(websiteDir, 'styles.css'), website.css);
  
  if (website.js && website.js.trim() !== '') {
    fs.writeFileSync(path.join(websiteDir, 'script.js'), website.js);
  }
  
  // Save metadata
  const metadata = {
    id: websiteId,
    createdAt: new Date().toISOString(),
    description: website.description || 'Generated website'
  };
  
  fs.writeFileSync(
    path.join(websiteDir, 'metadata.json'), 
    JSON.stringify(metadata, null, 2)
  );
  
  return {
    id: websiteId,
    publicUrl: `/view/${websiteId}`,
    ...metadata
  };
}

/**
 * Get information about a saved website
 * @param {string} websiteId - Website ID
 * @returns {Object|null} - Website information or null if not found
 */
function getWebsite(websiteId) {
  const websiteDir = path.join(websitesDir, websiteId);
  
  if (!fs.existsSync(websiteDir)) {
    return null;
  }
  
  try {
    const metadataPath = path.join(websiteDir, 'metadata.json');
    
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      return {
        ...metadata,
        publicUrl: `/view/${websiteId}`
      };
    }
    
    // If no metadata, return basic info
    return {
      id: websiteId,
      publicUrl: `/view/${websiteId}`,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error reading website metadata for ${websiteId}:`, error);
    return null;
  }
}

/**
 * Get all saved websites
 * @returns {Array} - Array of website information
 */
function getAllWebsites() {
  try {
    return fs.readdirSync(websitesDir)
      .map(dir => getWebsite(dir))
      .filter(website => website !== null);
  } catch (error) {
    console.error('Error reading websites directory:', error);
    return [];
  }
}

/**
 * Get website file content
 * @param {string} websiteId - Website ID
 * @param {string} filename - File name (index.html, styles.css, or script.js)
 * @returns {string|null} - File content or null if not found
 */
function getWebsiteFile(websiteId, filename) {
  const allowedFiles = ['index.html', 'styles.css', 'script.js', 'metadata.json'];
  
  if (!allowedFiles.includes(filename)) {
    return null;
  }
  
  const filePath = path.join(websitesDir, websiteId, filename);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filename} for website ${websiteId}:`, error);
    return null;
  }
}

/**
 * Update website file content
 * @param {string} websiteId - Website ID
 * @param {string} filename - File name (index.html, styles.css, or script.js)
 * @param {string} content - New file content
 * @returns {boolean} - Whether the operation was successful
 */
function updateWebsiteFile(websiteId, filename, content) {
  const allowedFiles = ['index.html', 'styles.css', 'script.js'];
  
  if (!allowedFiles.includes(filename)) {
    return false;
  }
  
  const websiteDir = path.join(websitesDir, websiteId);
  
  if (!fs.existsSync(websiteDir)) {
    return false;
  }
  
  const filePath = path.join(websiteDir, filename);
  
  try {
    fs.writeFileSync(filePath, content);
    
    // Update the modified timestamp in metadata
    const metadataPath = path.join(websiteDir, 'metadata.json');
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      metadata.modifiedAt = new Date().toISOString();
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating file ${filename} for website ${websiteId}:`, error);
    return false;
  }
}

/**
 * Get all files in a website directory
 * @param {string} websiteId - Website ID
 * @returns {Array} - Array of filenames
 */
function getWebsiteFiles(websiteId) {
  const websiteDir = path.join(websitesDir, websiteId);
  
  if (!fs.existsSync(websiteDir)) {
    return [];
  }
  
  try {
    return fs.readdirSync(websiteDir);
  } catch (error) {
    console.error(`Error reading directory for website ${websiteId}:`, error);
    return [];
  }
}

/**
 * Create a new file in the website directory
 * @param {string} websiteId - Website ID
 * @param {string} filename - New file name
 * @param {string} content - File content
 * @returns {boolean} - Whether the operation was successful
 */
function createWebsiteFile(websiteId, filename, content) {
  // Don't allow overwriting existing files
  if (filename === 'metadata.json') {
    return false;
  }
  
  const websiteDir = path.join(websitesDir, websiteId);
  
  if (!fs.existsSync(websiteDir)) {
    return false;
  }
  
  const filePath = path.join(websiteDir, filename);
  
  if (fs.existsSync(filePath)) {
    return false;
  }
  
  try {
    fs.writeFileSync(filePath, content);
    
    // Update the modified timestamp in metadata
    const metadataPath = path.join(websiteDir, 'metadata.json');
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      metadata.modifiedAt = new Date().toISOString();
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    }
    
    return true;
  } catch (error) {
    console.error(`Error creating file ${filename} for website ${websiteId}:`, error);
    return false;
  }
}

/**
 * Delete a file from the website directory
 * @param {string} websiteId - Website ID
 * @param {string} filename - File to delete
 * @returns {boolean} - Whether the operation was successful
 */
function deleteWebsiteFile(websiteId, filename) {
  // Don't allow deleting core files
  const protectedFiles = ['index.html', 'styles.css', 'metadata.json'];
  if (protectedFiles.includes(filename)) {
    return false;
  }
  
  const websiteDir = path.join(websitesDir, websiteId);
  
  if (!fs.existsSync(websiteDir)) {
    return false;
  }
  
  const filePath = path.join(websiteDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  try {
    fs.unlinkSync(filePath);
    
    // Update the modified timestamp in metadata
    const metadataPath = path.join(websiteDir, 'metadata.json');
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      metadata.modifiedAt = new Date().toISOString();
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting file ${filename} for website ${websiteId}:`, error);
    return false;
  }
}

module.exports = {
  saveWebsite,
  getWebsite,
  getAllWebsites,
  getWebsiteFile,
  updateWebsiteFile,
  getWebsiteFiles,
  createWebsiteFile,
  deleteWebsiteFile
};