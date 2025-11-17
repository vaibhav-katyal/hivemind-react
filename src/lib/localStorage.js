// Local storage utilities for HiveMind

// User type definition for reference
// { id, email, password, name, avatar, bio, points, badges, joinedDate }

// Badge type definition for reference
// { id, name, description, icon, earnedDate }

// Project type definition for reference
// { id, name, description, githubLink, leaderId, teamMembers, status, progress, createdDate, completedDate, tags, isPublic, likes, comments, contributionRequests }

// TeamMember type definition for reference
// { userId, role }

// Task type definition for reference
// { id, projectId, title, description, assignedTo, status, deadline, createdDate, completedDate, points, extensionRequests }

// ExtensionRequest type definition for reference
// { id, requestedDate, newDeadline, reason, status }

// Comment type definition for reference
// { id, userId, content, createdDate }

// ContributionRequest type definition for reference
// { id, userId, message, status, createdDate }

// Storage keys
const USERS_KEY = 'hivemind_users';
const PROJECTS_KEY = 'hivemind_projects';
const TASKS_KEY = 'hivemind_tasks';
const CURRENT_USER_KEY = 'hivemind_current_user';

// Users
export const getUsers = () => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const saveUser = (user) => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getUserById = (id) => {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
};

export const getUserByEmail = (email) => {
  const users = getUsers();
  return users.find(u => u.email === email) || null;
};

// Current user (session)
export const setCurrentUser = (userId) => {
  localStorage.setItem(CURRENT_USER_KEY, userId);
};

export const getCurrentUser = () => {
  const userId = localStorage.getItem(CURRENT_USER_KEY);
  return userId ? getUserById(userId) : null;
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Projects
export const getProjects = () => {
  const projects = localStorage.getItem(PROJECTS_KEY);
  return projects ? JSON.parse(projects) : [];
};

export const saveProject = (project) => {
  const projects = getProjects();
  const existingIndex = projects.findIndex(p => p.id === project.id);
  if (existingIndex >= 0) {
    projects[existingIndex] = project;
  } else {
    projects.push(project);
  }
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
};

export const getProjectById = (id) => {
  const projects = getProjects();
  return projects.find(p => p.id === id) || null;
};

export const getProjectsByUser = (userId) => {
  const projects = getProjects();
  return projects.filter(p => 
    p.leaderId === userId || p.teamMembers.some(tm => tm.userId === userId)
  );
};

export const getPublicProjects = () => {
  const projects = getProjects();
  return projects.filter(p => p.isPublic);
};

// Tasks
export const getTasks = () => {
  const tasks = localStorage.getItem(TASKS_KEY);
  return tasks ? JSON.parse(tasks) : [];
};

export const saveTask = (task) => {
  const tasks = getTasks();
  const existingIndex = tasks.findIndex(t => t.id === task.id);
  if (existingIndex >= 0) {
    tasks[existingIndex] = task;
  } else {
    tasks.push(task);
  }
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

export const getTaskById = (id) => {
  const tasks = getTasks();
  return tasks.find(t => t.id === id) || null;
};

export const getTasksByProject = (projectId) => {
  const tasks = getTasks();
  return tasks.filter(t => t.projectId === projectId);
};

export const getTasksByUser = (userId) => {
  const tasks = getTasks();
  return tasks.filter(t => t.assignedTo === userId);
};

// Initialize with demo data if empty
export const initializeDemoData = () => {
  const users = getUsers();
  if (users.length === 0) {
    const demoUsers = [
      {
        id: '1',
        email: 'demo@hivemind.com',
        password: 'demo123',
        name: 'Demo User',
        bio: 'Passionate project leader and team player',
        points: 1250,
        badges: [
          { id: 'b1', name: 'Team Leader', description: 'Led 5 successful projects', icon: '👑', earnedDate: new Date().toISOString() },
          { id: 'b2', name: 'Collaborator', description: 'Worked on 10+ projects', icon: '🤝', earnedDate: new Date().toISOString() },
        ],
        joinedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(demoUsers));
  }
};
