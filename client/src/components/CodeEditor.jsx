import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../services/api';

function CodeEditor({ project, socket }) {
  const [files, setFiles] = useState({});
  const [activeFile, setActiveFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [language, setLanguage] = useState('javascript');
  const editorRef = useRef(null);
  
  // Load Monaco editor
  useEffect(() => {
    let script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.30.1/min/vs/loader.min.js';
    script.async = true;
    document.body.appendChild(script);
    
    script.onload = () => {
      window.require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.30.1/min/vs' }});
      window.require(['vs/editor/editor.main'], () => {
        if (!editorRef.current) return;
        
        const editor = window.monaco.editor.create(editorRef.current, {
          value: fileContent,
          language: language,
          theme: 'vs-dark',
          automaticLayout: true
        });
        
        editor.onDidChangeModelContent(() => {
          const content = editor.getValue();
          setFileContent(content);
          
          // Send updates to collaborators if connected
          if (socket && socket.readyState === WebSocket.OPEN && activeFile) {
            socket.send(JSON.stringify({
              type: 'file_change',
              projectId: project.id,
              fileName: activeFile,
              content: content
            }));
          }
        });
        
        return () => editor.dispose();
      });
    };
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  // Update editor content when active file changes
  useEffect(() => {
    if (window.monaco && activeFile) {
      const model = window.monaco.editor.getModels()[0];
      if (model) {
        model.setValue(fileContent);
        
        // Set language based on file extension
        const extension = activeFile.split('.').pop();
        let lang = 'javascript';
        
        if (extension === 'html') lang = 'html';
        else if (extension === 'css') lang = 'css';
        else if (extension === 'js') lang = 'javascript';
        else if (extension === 'jsx') lang = 'javascript';
        else if (extension === 'ts') lang = 'typescript';
        else if (extension === 'tsx') lang = 'typescript';
        else if (extension === 'json') lang = 'json';
        
        setLanguage(lang);
        window.monaco.editor.setModelLanguage(model, lang);
      }
    }
  }, [activeFile, fileContent]);
  
  // Listen for file changes from other collaborators
  useEffect(() => {
    if (!socket) return;
    
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'file_change' && data.projectId === project.id) {
          // Update file content if it's the active file
          if (data.fileName === activeFile) {
            setFileContent(data.content);
          }
          
          // Update the file in the files state
          setFiles(prevFiles => ({
            ...prevFiles,
            [data.fileName]: data.content
          }));
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };
    
    socket.addEventListener('message', handleMessage);
    
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, activeFile, project.id]);
  
  // Fetch project files
  useEffect(() => {
    const loadProjectFiles = async () => {
      if (!project.id) {
        // Create a default file structure for new projects
        const defaultFiles = {
          'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Project</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <div id="app"></div>\n  <script src="app.js"></script>\n</body>\n</html>',
          'styles.css': 'body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n}',
          'app.js': 'document.addEventListener("DOMContentLoaded", () => {\n  const app = document.getElementById("app");\n  app.innerHTML = "<h1>Hello from VibeCode!</h1>";\n});'
        };
        
        setFiles(defaultFiles);
        setActiveFile('index.html');
        setFileContent(defaultFiles['index.html']);
        return;
      }
      
      try {
        const response = await fetchApi(`/api/projects/${project.id}/files`);
        if (response.files) {
          setFiles(response.files);
          const firstFile = Object.keys(response.files)[0];
          if (firstFile) {
            setActiveFile(firstFile);
            setFileContent(response.files[firstFile]);
          }
        }
      } catch (error) {
        console.error('Failed to load project files:', error);
      }
    };
    
    loadProjectFiles();
  }, [project.id]);
  
  const createNewFile = () => {
    const fileName = prompt('Enter new file name:');
    if (!fileName) return;
    
    setFiles(prevFiles => ({
      ...prevFiles,
      [fileName]: ''
    }));
    
    setActiveFile(fileName);
    setFileContent('');
  };
  
  const deleteFile = (fileName) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;
    
    const newFiles = { ...files };
    delete newFiles[fileName];
    setFiles(newFiles);
    
    if (activeFile === fileName) {
      const firstRemaining = Object.keys(newFiles)[0];
      if (firstRemaining) {
        setActiveFile(firstRemaining);
        setFileContent(newFiles[firstRemaining]);
      } else {
        setActiveFile(null);
        setFileContent('');
      }
    }
  };

  return (
    <div className="code-editor">
      <div className="editor-sidebar">
        <div className="file-explorer">
          <div className="file-explorer-header">
            <h3>Files</h3>
            <button onClick={createNewFile} className="btn-new-file">
              <i data-feather="plus"></i>
            </button>
          </div>
          
          <div className="file-list">
            {Object.keys(files).map(fileName => (
              <div 
                key={fileName}
                className={`file-item ${activeFile === fileName ? 'active' : ''}`}
                onClick={() => {
                  setActiveFile(fileName);
                  setFileContent(files[fileName]);
                }}
              >
                <span className="file-name">{fileName}</span>
                <button 
                  className="btn-delete-file"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(fileName);
                  }}
                >
                  <i data-feather="trash-2"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="editor-main">
        {activeFile ? (
          <>
            <div className="editor-header">
              <h3>{activeFile}</h3>
              <span className="language-badge">{language}</span>
            </div>
            <div className="monaco-editor-container" ref={editorRef}></div>
          </>
        ) : (
          <div className="no-file-selected">
            <p>No file selected. Create a new file or select one from the list.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CodeEditor;
