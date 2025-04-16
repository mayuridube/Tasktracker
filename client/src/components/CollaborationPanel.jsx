import React, { useState, useEffect } from 'react';

function CollaborationPanel({ collaborators, socket, project }) {
  // Define WebSocket ready states to avoid reference errors
  const WebSocket = {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  };
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentUser, setCurrentUser] = useState({
    id: 'user-' + Math.floor(Math.random() * 1000),
    name: 'User ' + Math.floor(Math.random() * 100),
    color: getRandomColor()
  });
  
  useEffect(() => {
    if (!socket) return;
    
    // Join the collaboration room
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'join_collaboration',
        projectId: project.id,
        user: currentUser
      }));
    }
    
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chat_message') {
          addMessage(data.user, data.message, data.timestamp);
        } else if (data.type === 'user_joined') {
          addSystemMessage(`${data.user.name} joined the collaboration.`);
        } else if (data.type === 'user_left') {
          addSystemMessage(`${data.user.name} left the collaboration.`);
        } else if (data.type === 'cursor_position') {
          // Handle cursor position updates
          // This would be implemented for showing other users' cursors
        }
      } catch (error) {
        console.error('Error parsing collaboration message:', error);
      }
    };
    
    socket.addEventListener('message', handleMessage);
    
    return () => {
      socket.removeEventListener('message', handleMessage);
      
      // Leave the collaboration when component unmounts
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'leave_collaboration',
          projectId: project.id,
          user: currentUser
        }));
      }
    };
  }, [socket, project.id, currentUser]);
  
  const addMessage = (user, text, timestamp) => {
    setMessages(prevMessages => [
      ...prevMessages,
      {
        id: Date.now(),
        user,
        text,
        timestamp: timestamp || new Date().toISOString()
      }
    ]);
  };
  
  const addSystemMessage = (text) => {
    setMessages(prevMessages => [
      ...prevMessages,
      {
        id: Date.now(),
        system: true,
        text,
        timestamp: new Date().toISOString()
      }
    ]);
  };
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!message.trim() || !socket) return;
    
    // Send message to server
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'chat_message',
        projectId: project.id,
        user: currentUser,
        message: message.trim(),
        timestamp: new Date().toISOString()
      }));
      
      // Add message to local state
      addMessage(currentUser, message.trim());
      
      // Clear input
      setMessage('');
    }
  };
  
  function getRandomColor() {
    const colors = [
      '#2196F3', // Blue
      '#FF5722', // Deep Orange
      '#9C27B0', // Purple
      '#4CAF50', // Green
      '#FFC107', // Amber
      '#E91E63', // Pink
      '#00BCD4', // Cyan
      '#8BC34A', // Light Green
      '#FF9800', // Orange
      '#673AB7'  // Deep Purple
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`collaboration-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div 
        className="panel-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3>
          <i data-feather="users"></i> Collaboration
        </h3>
        <button className="btn-toggle">
          <i data-feather={isExpanded ? 'chevron-right' : 'chevron-left'}></i>
        </button>
      </div>
      
      {isExpanded && (
        <>
          <div className="collaborators-list">
            <h4>Active Collaborators</h4>
            <div className="collaborator current-user">
              <div 
                className="avatar"
                style={{ backgroundColor: currentUser.color }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <span className="name">{currentUser.name} (You)</span>
            </div>
            
            {collaborators.map(user => (
              user.id !== currentUser.id && (
                <div key={user.id} className="collaborator">
                  <div 
                    className="avatar"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="name">{user.name}</span>
                </div>
              )
            ))}
            
            {collaborators.length === 0 && (
              <div className="no-collaborators">
                <p>No other collaborators online.</p>
              </div>
            )}
          </div>
          
          <div className="chat-container">
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div 
                    key={msg.id}
                    className={`chat-message ${msg.system ? 'system-message' : (msg.user.id === currentUser.id ? 'own-message' : '')}`}
                  >
                    {!msg.system && (
                      <div 
                        className="message-avatar"
                        style={{ backgroundColor: msg.user.color }}
                      >
                        {msg.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="message-content">
                      {!msg.system && (
                        <div className="message-header">
                          <span className="message-sender">{msg.user.id === currentUser.id ? 'You' : msg.user.name}</span>
                          <span className="message-time">{formatTimestamp(msg.timestamp)}</span>
                        </div>
                      )}
                      <div className="message-text">
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={handleSendMessage} className="chat-input-form">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={!socket || socket.readyState !== WebSocket.OPEN}
              />
              <button 
                type="submit"
                disabled={!socket || socket.readyState !== WebSocket.OPEN}
              >
                <i data-feather="send"></i>
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default CollaborationPanel;
