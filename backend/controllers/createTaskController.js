const pool = require('../db');

const createTask = async (req, res) => {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority, dueDate, status } = req.body;
    const { tenantId } = req.user; // From Middleware

    if (!title) {
        return res.status(400).json({ error: "Task title is required" });
    }

    try {
        // 1. VERIFY PROJECT BELONGS TO TENANT
        const projectCheck = await pool.query(
            "SELECT id FROM projects WHERE id = $1 AND tenant_id = $2",
            [projectId, tenantId]
        );

        if (projectCheck.rowCount === 0) {
            return res.status(403).json({ error: "Project not found or does not belong to your organization" });
        }

        // 2. VERIFY ASSIGNED USER (If provided)
        if (assignedTo) {
            const userCheck = await pool.query(
                "SELECT id FROM users WHERE id = $1 AND tenant_id = $2",
                [assignedTo, tenantId]
            );
            if (userCheck.rowCount === 0) {
                return res.status(400).json({ error: "Assigned user not found in this organization" });
            }
        }

        // 3. INSERT TASK (Matching your Schema)
        // Note: We use NOW() for both created_at and updated_at
        const insertQuery = `
            INSERT INTO tasks (
                project_id, 
                tenant_id, 
                title, 
                description, 
                assigned_to, 
                priority, 
                status,
                due_date,
                created_at,
                updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            RETURNING id, project_id, title, description, status, priority, assigned_to, due_date, created_at, updated_at
        `;

        const result = await pool.query(insertQuery, [
            projectId,
            tenantId,
            title,
            description || '',
            assignedTo || null,
            priority || 'medium', // Ensure this matches your 'task_priority' enum values
            status || 'todo',     // Ensure this matches your 'task_status' enum values
            dueDate || null
        ]);

        const newTask = result.rows[0];

        // 4. LOG TO AUDIT TABLE
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) 
             VALUES ($1, $2, $3, $4, $5)`,
            [tenantId, req.user.userId, 'CREATE_TASK', 'TASK', newTask.id]
        );

        // 5. SUCCESS RESPONSE
        res.status(201).json({
            success: true,
            data: {
                id: newTask.id,
                projectId: newTask.project_id,
                title: newTask.title,
                description: newTask.description,
                status: newTask.status,
                priority: newTask.priority,
                assignedTo: newTask.assigned_to,
                dueDate: newTask.due_date,
                createdAt: newTask.created_at,
                updatedAt: newTask.updated_at
            }
        });

    } catch (error) {
        console.error("Create Task Error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { createTask };