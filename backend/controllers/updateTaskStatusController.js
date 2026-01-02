const pool = require('../db');

const updateTaskStatus = async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body;
    const { tenantId } = req.user; // From Middleware

    if (!status) {
        return res.status(400).json({ error: "Status is required" });
    }

    try {
        // 1. VERIFY TASK EXISTS & BELONGS TO TENANT
        // We don't need to check if the user is the assignee or admin. 
        // Requirement says "Any user in tenant can update status".
        const taskCheck = await pool.query(
            "SELECT id, tenant_id FROM tasks WHERE id = $1",
            [taskId]
        );

        if (taskCheck.rowCount === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        const task = taskCheck.rows[0];

        if (task.tenant_id !== tenantId) {
            return res.status(404).json({ error: "Task not found in your organization" });
        }

        // 2. UPDATE STATUS
        // We also update 'updated_at' to the current time
        const updateQuery = `
            UPDATE tasks 
            SET status = $1, updated_at = NOW() 
            WHERE id = $2 
            RETURNING id, status, updated_at
        `;

        const result = await pool.query(updateQuery, [status, taskId]);
        const updatedTask = result.rows[0];

        // 3. SUCCESS RESPONSE
        res.status(200).json({
            success: true,
            data: {
                id: updatedTask.id,
                status: updatedTask.status,
                updatedAt: updatedTask.updated_at
            }
        });

    } catch (error) {
        console.error("Update Task Status Error:", error.message);
        // specific error for invalid enum values (e.g., sending "garbage" instead of "todo")
        if (error.code === '22P02' || error.message.includes("enum")) {
            return res.status(400).json({ error: "Invalid status value for this task" });
        }
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { updateTaskStatus };