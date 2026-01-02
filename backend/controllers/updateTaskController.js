const pool = require('../db');

const updateTask = async (req, res) => {
    const { taskId } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;
    const { tenantId, userId } = req.user; // From Middleware

    try {
        // 1. VERIFY TASK EXISTS & BELONGS TO TENANT
        const taskCheck = await pool.query(
            "SELECT id, tenant_id FROM tasks WHERE id = $1",
            [taskId]
        );

        if (taskCheck.rowCount === 0) {
            return res.status(404).json({ error: "Task not found" });
        }
        if (taskCheck.rows[0].tenant_id !== tenantId) {
            return res.status(404).json({ error: "Task not found in your organization" });
        }

        // 2. VERIFY ASSIGNEE (If provided and not null)
        if (assignedTo) {
            const userCheck = await pool.query(
                "SELECT id FROM users WHERE id = $1 AND tenant_id = $2",
                [assignedTo, tenantId]
            );
            if (userCheck.rowCount === 0) {
                return res.status(400).json({ error: "Assigned user does not belong to this organization" });
            }
        }

        // 3. BUILD DYNAMIC UPDATE QUERY
        let fields = [];
        let values = [];
        let index = 1;

        if (title) { fields.push(`title = $${index++}`); values.push(title); }
        if (description !== undefined) { fields.push(`description = $${index++}`); values.push(description); }
        if (status) { fields.push(`status = $${index++}`); values.push(status); }
        if (priority) { fields.push(`priority = $${index++}`); values.push(priority); }
        if (dueDate !== undefined) { fields.push(`due_date = $${index++}`); values.push(dueDate); }
        
        // Handle assignedTo specifically (it can be NULL)
        if (assignedTo !== undefined) {
            fields.push(`assigned_to = $${index++}`);
            values.push(assignedTo);
        }

        // Always update 'updated_at'
        fields.push(`updated_at = NOW()`);

        if (fields.length === 1) { // Only updated_at was pushed
            return res.status(400).json({ error: "No fields provided for update" });
        }

        values.push(taskId); // Add taskId as the last parameter

        const updateQuery = `
            UPDATE tasks 
            SET ${fields.join(', ')} 
            WHERE id = $${index}
        `;

        await pool.query(updateQuery, values);

        // 4. LOG TO AUDIT TABLE
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) 
             VALUES ($1, $2, $3, $4, $5)`,
            [tenantId, userId, 'UPDATE_TASK', 'TASK', taskId]
        );

        // 5. FETCH FINAL DATA (With User Join)
        // We need this second query to get the assignee's name/email for the response
        const finalQuery = `
            SELECT 
                t.id, t.title, t.description, t.status, t.priority, t.due_date, t.updated_at,
                u.id as assignee_id, u.full_name, u.email
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.id = $1
        `;
        const finalRes = await pool.query(finalQuery, [taskId]);
        const updatedTask = finalRes.rows[0];

        // 6. SUCCESS RESPONSE
        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            data: {
                id: updatedTask.id,
                title: updatedTask.title,
                description: updatedTask.description,
                status: updatedTask.status,
                priority: updatedTask.priority,
                assignedTo: updatedTask.assignee_id ? {
                    id: updatedTask.assignee_id,
                    fullName: updatedTask.full_name,
                    email: updatedTask.email
                } : null,
                dueDate: updatedTask.due_date,
                updatedAt: updatedTask.updated_at
            }
        });

    } catch (error) {
        console.error("Update Task Error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { updateTask };