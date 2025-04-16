import React, { useState } from 'react';

function PortalBuilder({ project, socket }) {
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [layout, setLayout] = useState('grid'); // 'grid', 'flex', 'custom'
  
  const componentLibrary = [
    { type: 'header', name: 'Header', icon: 'layout' },
    { type: 'navigation', name: 'Navigation', icon: 'menu' },
    { type: 'hero', name: 'Hero Banner', icon: 'image' },
    { type: 'card', name: 'Card', icon: 'square' },
    { type: 'form', name: 'Form', icon: 'edit-3' },
    { type: 'table', name: 'Table', icon: 'grid' },
    { type: 'footer', name: 'Footer', icon: 'layout' },
    { type: 'button', name: 'Button', icon: 'button' },
    { type: 'text', name: 'Text Block', icon: 'type' },
    { type: 'image', name: 'Image', icon: 'image' },
    { type: 'container', name: 'Container', icon: 'box' }
  ];
  
  const addComponent = (type) => {
    const newComponent = {
      id: `component-${Date.now()}`,
      type,
      props: getDefaultPropsForType(type)
    };
    
    setComponents([...components, newComponent]);
    
    // Notify collaborators of the new component
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'component_added',
        projectId: project.id,
        component: newComponent
      }));
    }
  };
  
  const removeComponent = (id) => {
    setComponents(components.filter(component => component.id !== id));
    
    if (selectedComponent && selectedComponent.id === id) {
      setSelectedComponent(null);
    }
    
    // Notify collaborators of the component removal
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'component_removed',
        projectId: project.id,
        componentId: id
      }));
    }
  };
  
  const selectComponent = (component) => {
    setSelectedComponent(component);
  };
  
  const updateComponentProps = (id, updatedProps) => {
    const updatedComponents = components.map(component => {
      if (component.id === id) {
        return {
          ...component,
          props: {
            ...component.props,
            ...updatedProps
          }
        };
      }
      return component;
    });
    
    setComponents(updatedComponents);
    
    // Update selected component if it was the one modified
    if (selectedComponent && selectedComponent.id === id) {
      const updated = updatedComponents.find(c => c.id === id);
      setSelectedComponent(updated);
    }
    
    // Notify collaborators of the component update
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'component_updated',
        projectId: project.id,
        componentId: id,
        props: updatedProps
      }));
    }
  };
  
  const getDefaultPropsForType = (type) => {
    switch (type) {
      case 'header':
        return { title: 'Website Title', backgroundColor: '#ffffff', color: '#000000' };
      case 'navigation':
        return { items: ['Home', 'About', 'Contact'], orientation: 'horizontal' };
      case 'hero':
        return { 
          title: 'Welcome to My Website', 
          subtitle: 'A great place to find what you need', 
          backgroundImage: '' 
        };
      case 'card':
        return { 
          title: 'Card Title', 
          content: 'Card content goes here', 
          image: '',
          width: '300px' 
        };
      case 'form':
        return { 
          fields: [
            { type: 'text', label: 'Name', placeholder: 'Enter your name' },
            { type: 'email', label: 'Email', placeholder: 'Enter your email' }
          ],
          submitLabel: 'Submit' 
        };
      case 'table':
        return { 
          headers: ['ID', 'Name', 'Email'],
          rows: [
            ['1', 'John Doe', 'john@example.com'],
            ['2', 'Jane Smith', 'jane@example.com']
          ]
        };
      case 'footer':
        return { 
          copyright: '© 2023 My Website', 
          links: ['Privacy Policy', 'Terms of Service'] 
        };
      case 'button':
        return { 
          label: 'Click Me', 
          type: 'primary', 
          onClick: 'alert("Button clicked")' 
        };
      case 'text':
        return { 
          content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
          fontSize: '16px',
          color: '#000000'
        };
      case 'image':
        return { 
          src: '', 
          alt: 'Image description',
          width: '100%' 
        };
      case 'container':
        return { 
          width: '100%', 
          padding: '20px',
          backgroundColor: 'transparent',
          children: []
        };
      default:
        return {};
    }
  };
  
  const renderComponentPreview = (component) => {
    const { type, props } = component;
    
    switch (type) {
      case 'header':
        return (
          <div 
            className="preview-header"
            style={{ backgroundColor: props.backgroundColor, color: props.color }}
          >
            <h1>{props.title}</h1>
          </div>
        );
      case 'navigation':
        return (
          <nav className={`preview-navigation ${props.orientation}`}>
            <ul>
              {props.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </nav>
        );
      case 'hero':
        return (
          <div 
            className="preview-hero"
            style={{ backgroundImage: props.backgroundImage ? `url(${props.backgroundImage})` : null }}
          >
            <h1>{props.title}</h1>
            <h3>{props.subtitle}</h3>
          </div>
        );
      case 'card':
        return (
          <div className="preview-card" style={{ width: props.width }}>
            {props.image && <img src={props.image} alt="Card" />}
            <div className="card-content">
              <h3>{props.title}</h3>
              <p>{props.content}</p>
            </div>
          </div>
        );
      case 'form':
        return (
          <form className="preview-form">
            {props.fields.map((field, index) => (
              <div key={index} className="form-field">
                <label>{field.label}</label>
                <input type={field.type} placeholder={field.placeholder} />
              </div>
            ))}
            <button type="button">{props.submitLabel}</button>
          </form>
        );
      // Add more component previews as needed
      default:
        return <div>Unsupported component type: {type}</div>;
    }
  };
  
  const renderPropertyEditor = () => {
    if (!selectedComponent) return null;
    
    const { type, props } = selectedComponent;
    
    return (
      <div className="property-editor">
        <h3>Edit {type} Properties</h3>
        
        {type === 'header' && (
          <>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={props.title}
                onChange={(e) => updateComponentProps(selectedComponent.id, { title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Background Color</label>
              <input
                type="color"
                value={props.backgroundColor}
                onChange={(e) => updateComponentProps(selectedComponent.id, { backgroundColor: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Text Color</label>
              <input
                type="color"
                value={props.color}
                onChange={(e) => updateComponentProps(selectedComponent.id, { color: e.target.value })}
              />
            </div>
          </>
        )}
        
        {type === 'navigation' && (
          <>
            <div className="form-group">
              <label>Navigation Items (comma-separated)</label>
              <input
                type="text"
                value={props.items.join(', ')}
                onChange={(e) => updateComponentProps(selectedComponent.id, { 
                  items: e.target.value.split(',').map(item => item.trim()) 
                })}
              />
            </div>
            <div className="form-group">
              <label>Orientation</label>
              <select
                value={props.orientation}
                onChange={(e) => updateComponentProps(selectedComponent.id, { orientation: e.target.value })}
              >
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
            </div>
          </>
        )}
        
        {/* Add more property editors for other component types */}
      </div>
    );
  };

  return (
    <div className="portal-builder">
      <div className="component-library">
        <h3>Component Library</h3>
        <div className="component-list">
          {componentLibrary.map((component, index) => (
            <div 
              key={index}
              className="component-item"
              onClick={() => addComponent(component.type)}
            >
              <i data-feather={component.icon}></i>
              <span>{component.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="builder-workspace">
        <div className="workspace-header">
          <h3>Portal Preview</h3>
          <div className="layout-selector">
            <button 
              className={layout === 'grid' ? 'active' : ''} 
              onClick={() => setLayout('grid')}
            >
              <i data-feather="grid"></i> Grid
            </button>
            <button 
              className={layout === 'flex' ? 'active' : ''} 
              onClick={() => setLayout('flex')}
            >
              <i data-feather="layout"></i> Flex
            </button>
            <button 
              className={layout === 'custom' ? 'active' : ''} 
              onClick={() => setLayout('custom')}
            >
              <i data-feather="edit"></i> Custom
            </button>
          </div>
        </div>
        
        <div className={`portal-canvas ${layout}`}>
          {components.length === 0 ? (
            <div className="empty-canvas">
              <p>Drag components from the library to start building your portal</p>
            </div>
          ) : (
            components.map(component => (
              <div 
                key={component.id}
                className={`portal-component ${selectedComponent && selectedComponent.id === component.id ? 'selected' : ''}`}
                onClick={() => selectComponent(component)}
              >
                {renderComponentPreview(component)}
                <div className="component-actions">
                  <button 
                    className="btn-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeComponent(component.id);
                    }}
                  >
                    <i data-feather="trash-2"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="properties-panel">
        <h3>Properties</h3>
        {selectedComponent ? (
          renderPropertyEditor()
        ) : (
          <div className="no-selection">
            <p>Select a component to edit its properties</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PortalBuilder;
