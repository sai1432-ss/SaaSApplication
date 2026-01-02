const pool = require('../db');

/**
 * GET /api/admin/tenantdet
 * Returns all client organizations with their actual usage counts and subscription plans.
 */
const getTenantDetailsList = async (req, res) => {
    // 1. Authorization: Only 'super_admin' can access global system data
    const { role } = req.user; 
    
    if (role !== 'super_admin') {
        return res.status(403).json({ 
            success: false, 
            error: "Access Denied. System Administrator only." 
        });
    }

    try {
        // 2. Optimized Query Logic:
        // - Selects core tenant details
        // - Uses Subqueries to count Users and Projects per tenant
        // - Filters to ensure only organizations with a 'tenant_admin' are shown (hides Super Admin)
        const query = `
            SELECT DISTINCT ON (t.id)
                t.id, 
                t.name, 
                t.subdomain, 
                t.subscription_plan, 
                t.max_users, 
                t.max_projects,
                (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) AS "current_users_count",
                (SELECT COUNT(*) FROM projects p WHERE p.tenant_id = t.id) AS "current_projects_count"
            FROM tenants t
            INNER JOIN users u ON t.id = u.tenant_id
            WHERE u.role = 'tenant_admin'
            ORDER BY t.id, t.created_at DESC
        `;

        const result = await pool.query(query);

        // 3. Response: Maps the data to the keys used in your frontend table
        res.status(200).json({
            success: true,
            data: {
                tenants: result.rows
            }
        });

    } catch (error) {
        console.error("Super Admin Registry Error:", error.message);
        res.status(500).json({ 
            success: false, 
            error: "Internal server error fetching organization details" 
        });
    }
};

module.exports = { getTenantDetailsList };