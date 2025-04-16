// WebSocket service for client communication

/**
 * Initializes a WebSocket connection to the server
 * @returns {WebSocket} The WebSocket instance
 */
export const initWebSocket = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  const socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log('WebSocket connection established');
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  socket.onclose = (event) => {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    
    // Attempt to reconnect after a delay
    setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      initWebSocket();
    }, 5000);
  };
  
  return socket;
};

/**
 * Sends a message through the WebSocket connection
 * @param {WebSocket} socket - The WebSocket instance
 * @param {string} type - The type of message
 * @param {Object} data - The data to send
 * @returns {boolean} Whether the message was sent successfully
 */
export const sendMessage = (socket, type, data) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('WebSocket is not connected');
    return false;
  }
  
  const message = JSON.stringify({
    type,
    ...data,
    timestamp: new Date().toISOString()
  });
  
  socket.send(message);
  return true;
};

/**
 * Creates a heartbeat interval to keep the WebSocket connection alive
 * @param {WebSocket} socket - The WebSocket instance
 * @returns {number} The interval ID
 */
export const createHeartbeat = (socket) => {
  return setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'heartbeat' }));
    }
  }, 30000); // Send heartbeat every 30 seconds
};
