const pool = require('../db');

/**
 * GET /api/stats/project-tasks
 * Returns task counts mapped to project IDs for the Recent Projects table
 */
const getIndividualProjectTaskCounts = async (req, res) => {
    const { tenantId, role } = req.user;

    try {
        let query;
        let values = [];

        // --- SUPER ADMIN LOGIC ---
        // Allow counting tasks for all projects across all tenants
        if (role === 'super_admin') {
            query = `
                SELECT 
                    project_id as id, 
                    COUNT(*) as "taskCount"
                FROM tasks 
                GROUP BY project_id
            `;
        } else {
            // REGULAR TENANT: Filter by organization
            query = `
                SELECT 
                    project_id as id, 
                    COUNT(*) as "taskCount"
                FROM tasks 
                WHERE tenant_id = $1
                GROUP BY project_id
            `;
            values.push(tenantId);
        }

        const result = await pool.query(query, values);

        res.status(200).json({
            success: true,
            data: result.rows 
        });
    } catch (error) {
        console.error("Individual Counts Error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { getIndividualProjectTaskCounts };