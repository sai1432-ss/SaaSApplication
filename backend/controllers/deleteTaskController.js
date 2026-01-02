const pool = require('../db');

/**
 * DELETE /api/tasks/:taskId
 * Deletes a specific task if it belongs to the user's tenant
 */
const deleteTask = async (req, res) => {
    const { taskId } = req.params;
    const { tenantId } = req.user; // Securely get tenantId from Token

    try {
        // Filter by BOTH taskId and tenantId for security
        const result = await pool.query(
            "DELETE FROM tasks WHERE id = $1 AND tenant_id = $2",
            [taskId, tenantId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ 
                error: "Task not found or you don't have permission to delete it." 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: "Task deleted successfully." 
        });

    } catch (error) {
        console.error("Delete Task Error:", error.message);
        res.status(500).json({ error: "Server error during task deletion." });
    }
};

module.exports = { deleteTask };