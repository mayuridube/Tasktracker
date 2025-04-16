import React from 'react';

function Sidebar({ activeView, setActiveView }) {
  const menuItems = [
    { id: 'code-editor', label: 'Code Editor', icon: 'code' },
    { id: 'portal-builder', label: 'Portal Builder', icon: 'layout' },
    { id: 'database', label: 'Database', icon: 'database' },
    { id: 'preview', label: 'Live Preview', icon: 'eye' },
    { id: 'terminal', label: 'Terminal', icon: 'terminal' },
    { id: 'deployment', label: 'Deployment', icon: 'upload-cloud' },
    { id: 'settings', label: 'Settings', icon: 'settings' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-nav">
        {menuItems.map(item => (
          <div 
            key={item.id}
            className={`sidebar-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <i data-feather={item.icon}></i>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            <i data-feather="user"></i>
          </div>
          <span className="user-name">User</span>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
