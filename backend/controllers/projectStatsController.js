const pool = require('../db');

/**
 * GET /api/stats/dashboard
 * Fetches global counts for the Dashboard Statistics Cards
 */
const getProjectStats = async (req, res) => {
    // 0. Extract role and tenantId from the token
    const { tenantId, role } = req.user; 

    try {
        let statsQuery;
        let values = [];

        // --- SUPER ADMIN LOGIC ---
        // If system admin, remove the tenant_id restriction to get global counts
        if (role === 'super_admin') {
            statsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM projects) AS "totalProjects",
                    COUNT(t.id) AS "totalTasks",
                    COUNT(t.id) FILTER (WHERE t.status = 'completed') AS "completedTasks",
                    COUNT(t.id) FILTER (WHERE t.status != 'completed') AS "pendingTasks"
                FROM tasks t
            `;
        } else {
            // REGULAR TENANT: Only see their own organization's data
            statsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM projects WHERE tenant_id = $1) AS "totalProjects",
                    COUNT(t.id) AS "totalTasks",
                    COUNT(t.id) FILTER (WHERE t.status = 'completed') AS "completedTasks",
                    COUNT(t.id) FILTER (WHERE t.status != 'completed') AS "pendingTasks"
                FROM tasks t
                WHERE t.tenant_id = $1
            `;
            values.push(tenantId);
        }

        const result = await pool.query(statsQuery, values);
        const stats = result.rows[0];

        res.status(200).json({
            success: true,
            data: {
                totalProjects: parseInt(stats.totalProjects) || 0,
                totalTasks: parseInt(stats.totalTasks) || 0,
                completedTasks: parseInt(stats.completedTasks) || 0,
                pendingTasks: parseInt(stats.pendingTasks) || 0
            }
        });
    } catch (error) {
        console.error("Stats API Error:", error.message);
        res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
};

module.exports = { getProjectStats };