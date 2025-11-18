// API utilities for HiveMind using json-server

const API_URL = 'http://localhost:3001';

// Helper function to handle API errors
const handleError = (error) => {
  console.error('API Error:', error);
  throw error;
};

// =====================
// Users
// =====================

export const getUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  } catch (error) {
    handleError(error);
  }
};

export const saveUser = async (user) => {
  try {
    // Check if user exists
    if (user.id) {
      const response = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    } else {
      // Create new user
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    }
  } catch (error) {
    handleError(error);
  }
};

export const getUserById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/users/${id}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    handleError(error);
  }
};

export const getUserByEmail = async (email) => {
  try {
    const response = await fetch(`${API_URL}/users?email=${email}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    const users = await response.json();
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    handleError(error);
  }
};

export const updateUser = async (userId, updates) => {
  try {
    const user = await getUserById(userId);
    if (!user) throw new Error('User not found');
    const updatedUser = { ...user, ...updates };
    return saveUser(updatedUser);
  } catch (error) {
    handleError(error);
  }
};

// =====================
// Current User (Session)
// =====================
export const setCurrentUser = async (userId) => {
  try {
    // Check existing currentUser resource
    const res = await fetch(`${API_URL}/currentUser`);
    if (!res.ok) throw new Error('Failed to fetch current user resource');
    const arr = await res.json();

    if (Array.isArray(arr) && arr.length > 0) {
      // Update first entry
      const existing = arr[0];
      const response = await fetch(`${API_URL}/currentUser/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...existing, userId }),
      });
      if (!response.ok) throw new Error('Failed to update current user');
      return response.json();
    } else {
      // Create new entry
      const response = await fetch(`${API_URL}/currentUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to set current user');
      return response.json();
    }
  } catch (error) {
    handleError(error);
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await fetch(`${API_URL}/currentUser`);
    if (!response.ok) return null;
    const arr = await response.json();
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const entry = arr[0];
    if (!entry || !entry.userId) return null;
    return getUserById(entry.userId);
  } catch (error) {
    handleError(error);
  }
};

export const logout = async () => {
  try {
    const res = await fetch(`${API_URL}/currentUser`);
    if (!res.ok) throw new Error('Failed to fetch current user resource');
    const arr = await res.json();
    if (Array.isArray(arr) && arr.length > 0) {
      const existing = arr[0];
      const response = await fetch(`${API_URL}/currentUser/${existing.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to logout');
      return true;
    }
    return true;
  } catch (error) {
    handleError(error);
  }
};

// =====================
// Projects
// =====================

export const getProjects = async () => {
  try {
    const response = await fetch(`${API_URL}/projects`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  } catch (error) {
    handleError(error);
  }
};

export const saveProject = async (project) => {
  try {
    if (project.id) {
      const response = await fetch(`${API_URL}/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (!response.ok) throw new Error('Failed to update project');
      return response.json();
    } else {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (!response.ok) throw new Error('Failed to create project');
      return response.json();
    }
  } catch (error) {
    handleError(error);
  }
};

export const getProjectById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/projects/${id}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    handleError(error);
  }
};

export const getProjectsByUser = async (userId) => {
  try {
    const projects = await getProjects();
    return projects.filter(p => 
      p.leaderId === userId || p.teamMembers.some(tm => tm.userId === userId)
    );
  } catch (error) {
    handleError(error);
  }
};

export const getPublicProjects = async () => {
  try {
    const response = await fetch(`${API_URL}/projects?isPublic=true`);
    if (!response.ok) throw new Error('Failed to fetch public projects');
    return response.json();
  } catch (error) {
    handleError(error);
  }
};

export const deleteProject = async (id) => {
  try {
    const response = await fetch(`${API_URL}/projects/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete project');
    return response.json();
  } catch (error) {
    handleError(error);
  }
};

// =====================
// Tasks
// =====================

export const getTasks = async () => {
  try {
    const response = await fetch(`${API_URL}/tasks`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  } catch (error) {
    handleError(error);
  }
};

export const saveTask = async (task) => {
  try {
    if (task.id) {
      const response = await fetch(`${API_URL}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (!response.ok) throw new Error('Failed to update task');
      return response.json();
    } else {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (!response.ok) throw new Error('Failed to create task');
      return response.json();
    }
  } catch (error) {
    handleError(error);
  }
};

export const getTaskById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/tasks/${id}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    handleError(error);
  }
};

export const getTasksByProject = async (projectId) => {
  try {
    const response = await fetch(`${API_URL}/tasks?projectId=${projectId}`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  } catch (error) {
    handleError(error);
  }
};

export const getTasksByUser = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/tasks?assignedTo=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  } catch (error) {
    handleError(error);
  }
};

export const deleteTask = async (id) => {
  try {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete task');
    return response.json();
  } catch (error) {
    handleError(error);
  }
};

// =====================
// Initialization
// =====================

export const initializeDemoData = async () => {
  // Data is already initialized in db.json
  console.log('Database already initialized with demo data');
};
