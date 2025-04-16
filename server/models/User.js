/**
 * User Model for VibeCode
 * Handles user data storage and retrieval
 */

// In a production environment, this would use a real database
// For the prototype, we'll use an in-memory store
const usersStore = new Map();

/**
 * Get a user by ID
 * @param {string} id - User ID
 * @returns {Object|null} User data or null if not found
 */
async function getUserById(id) {
  return usersStore.get(id) || null;
}

/**
 * Get a user by email
 * @param {string} email - User email
 * @returns {Object|null} User data or null if not found
 */
async function getUserByEmail(email) {
  const users = Array.from(usersStore.values());
  return users.find(user => user.email === email) || null;
}

/**
 * Get all users
 * @returns {Array} Array of users
 */
async function getAllUsers() {
  return Array.from(usersStore.values());
}

/**
 * Create a new user
 * @param {Object} user - User data
 * @returns {Object} Created user
 */
async function createUser(user) {
  if (!user.id) {
    throw new Error('User ID is required');
  }
  
  if (!user.email) {
    throw new Error('User email is required');
  }
  
  // Check if email already exists
  const existingUser = await getUserByEmail(user.email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  usersStore.set(user.id, user);
  return user;
}

/**
 * Update a user
 * @param {string} id - User ID
 * @param {Object} updates - User updates
 * @returns {Object} Updated user
 */
async function updateUser(id, updates) {
  const user = await getUserById(id);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // If updating email, check if new email already exists
  if (updates.email && updates.email !== user.email) {
    const existingUser = await getUserByEmail(updates.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
  }
  
  const updatedUser = {
    ...user,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  usersStore.set(id, updatedUser);
  return updatedUser;
}

/**
 * Delete a user
 * @param {string} id - User ID
 * @returns {boolean} Whether the operation was successful
 */
async function deleteUser(id) {
  const exists = usersStore.has(id);
  
  if (!exists) {
    throw new Error('User not found');
  }
  
  return usersStore.delete(id);
}

/**
 * Authenticate a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object|null} User data or null if authentication fails
 */
async function authenticateUser(email, password) {
  const user = await getUserByEmail(email);
  
  if (!user || user.password !== password) {
    return null;
  }
  
  // Don't return the password
  const { password: _, ...userData } = user;
  return userData;
}

// Add some demo users for testing
function addDemoUsers() {
  const demoUsers = [
    {
      id: 'user-1',
      name: 'Demo User',
      email: 'demo@vibecode.dev',
      password: 'password123',
      role: 'admin',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()  // 10 days ago
    },
    {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@vibecode.dev',
      password: 'password456',
      role: 'developer',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()   // 5 days ago
    }
  ];
  
  demoUsers.forEach(user => {
    usersStore.set(user.id, user);
  });
}

// Add demo users when module is loaded
addDemoUsers();

module.exports = {
  getUserById,
  getUserByEmail,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  authenticateUser
};
