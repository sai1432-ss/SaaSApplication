const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bodyParser = require('body-parser'); // <--- IMPORT THIS

// Import Controllers
const { registerTenant } = require('./controllers/registerController');
const { loginUser } = require('./controllers/loginController');
const authMiddleware = require('./middleware/authMiddleware'); // <--- IMPORT MIDDLEWARE
const { getCurrentUser } = require('./controllers/userController');
const { logoutUser } = require('./controllers/logoutController');
const { getTenantDetails } = require('./controllers/tenantController');
const { updateTenant } = require('./controllers/updatetenantController');
const { listAllTenants } = require('./controllers/listTenantsController');
const { addUserToTenant } = require('./controllers/addUserController');
const { listTenantUsers } = require('./controllers/listUsersController');
const { updateUser } = require('./controllers/updateUserController');
const { deleteUser } = require('./controllers/deleteUserController');
const { createProject } = require('./controllers/createProjectController');
const { listProjects } = require('./controllers/listProjectsController');
const { updateProject } = require('./controllers/updateProjectController');
const { deleteProject } = require('./controllers/deleteProjectController');
const { createTask } = require('./controllers/createTaskController');
const { listProjectTasks } = require('./controllers/listTasksController');
const { updateTaskStatus } = require('./controllers/updateTaskStatusController');
const { updateTask } = require('./controllers/updateTaskController');
const { getSubscription, updateSubscription } = require('./controllers/subscriptionController');
const { updateTenantName, deleteTenantAction } = require('./controllers/deletetenetcontroller');
const { getProjectStats } = require('./controllers/projectStatsController');
const { getIndividualProjectTaskCounts } = require('./controllers/projectTaskCountController');
const { deleteTask } = require('./controllers/deleteTaskController');
const { getTenantDetailsList } = require('./controllers/superAdminController');

require('dotenv').config();

const app = express();
const PORT = 5000;

// ===================================================
// 1. MIDDLEWARE (The Order Matters!)
// ===================================================
app.use(cors());

// Force Express to parse JSON, no matter what
// FORCE JSON parsing even if the header says text/plain
app.use(bodyParser.json({ type: '*/*' })); 
app.use(bodyParser.urlencoded({ extended: true }));

// ===================================================
// 2. DEBUGGING TOOL (Shows us what is arriving)
// ===================================================
app.use((req, res, next) => {
    console.log(`\n🔹 Incoming ${req.method} Request to: ${req.path}`);
    console.log("   Headers 'Content-Type':", req.headers['content-type']); // CHECK THIS LOG
    console.log("   Body Received:", req.body);
    
    // If body is still undefined, we manually initialize it to avoid crashing
    if (!req.body) req.body = {}; 
    next();
});

// ===================================================
// 3. ROUTES
// ===================================================

// Health Check
app.get('/', (req, res) => res.send('✅ Backend is running and Body-Parser is Active!'));

// Auth Routes
app.post('/api/auth/register-tenant', registerTenant);
app.post('/api/auth/login', loginUser);
// API 4: Logout (Protected 🔒)
app.post('/api/auth/logout', authMiddleware, logoutUser);
app.get('/api/auth/me', authMiddleware, getCurrentUser);
// API 5: Get Tenant Details (Protected 🔒)
// The ":tenantId" part is a variable parameter
app.get('/api/tenants/:tenantId', authMiddleware, getTenantDetails);
// API 6: Update Tenant (Protected 🔒)
app.put('/api/tenants/:tenantId', authMiddleware, updateTenant);
// API 7: List All Tenants (Protected & Super Admin Only 🔒)
app.get('/api/tenants', authMiddleware, listAllTenants);
// API 8: Add User to Tenant (Protected & Tenant Admin Only 🔒)
app.post('/api/tenants/:tenantId/users', authMiddleware, addUserToTenant);
// API 9: List Tenant Users (Protected 🔒)
// Note: It uses the same URL structure as API 8, but with GET method
app.get('/api/tenants/:tenantId/users', authMiddleware, listTenantUsers);
// API 10: Update User (Protected 🔒)
app.put('/api/users/:userId', authMiddleware, updateUser);
// API 11: Delete User (Protected & Admin Only 🔒)
app.delete('/api/users/:userId', authMiddleware, deleteUser);
// API 12: Create Project (Protected 🔒)
app.post('/api/projects', authMiddleware, createProject);
// API 13: List Projects (Protected 🔒)
app.get('/api/projects', authMiddleware, listProjects);
// API 14: Update Project (Protected 🔒)
app.put('/api/projects/:projectId', authMiddleware, updateProject);
// API 15: Delete Project (Protected 🔒)
app.delete('/api/projects/:projectId', authMiddleware, deleteProject);
// API 16: Create Task (Protected 🔒)
app.post('/api/projects/:projectId/tasks', authMiddleware, createTask);
// API 17: List Project Tasks (Protected 🔒)
app.get('/api/projects/:projectId/tasks', authMiddleware, listProjectTasks);
// API 18: Update Task Status (Protected 🔒)
// Note: We use PATCH because we are only modifying one field
app.patch('/api/tasks/:taskId/status', authMiddleware, updateTaskStatus); 
// API 19: Update Task Details (Protected 🔒)
// Note: Use PUT as per requirements 
app.put('/api/tasks/:taskId', authMiddleware, updateTask);
     

// API 20: Subscription Management
app.get('/api/subscription', authMiddleware, getSubscription);
app.put('/api/subscription', authMiddleware, updateSubscription);


app.put('/api/tenants/settings', authMiddleware, updateTenantName);

// Permanently delete organization
app.delete('/api/tenants/settings', authMiddleware, deleteTenantAction);


app.get('/api/stats/dashboard', authMiddleware, getProjectStats);
app.get('/api/stats/project-tasks', authMiddleware, getIndividualProjectTaskCounts);

app.delete('/api/tasks/:taskId', authMiddleware, deleteTask);
app.get('/api/admin/tenantdet', authMiddleware, getTenantDetailsList);


// Test DB Route
app.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'UP', 
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ===================================================
// 4. START SERVER
// ===================================================
app.listen(PORT, () => {
    console.log(`\n🚀 SERVER RUNNING IN ${process.env.NODE_ENV || 'development'} MODE`);
    console.log(`🔗 Accessible at: http://localhost:${PORT}`);
    console.log(`👉 CORS allowed from: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);
});