const pool = require('../db');

const getTenantDetails = async (req, res) => {
    const { tenantId } = req.params;
    const requestingUser = req.user; // Comes from authMiddleware

    // 1. AUTHORIZATION CHECK 🛡️
    // Rule: You can only see your OWN tenant, unless you are a Super Admin.
    if (requestingUser.role !== 'super_admin' && requestingUser.tenantId !== tenantId) {
        return res.status(403).json({ error: "Unauthorized access to this tenant" });
    }

    try {
        // 2. Fetch Basic Tenant Info
        const tenantQuery = `
            SELECT id, name, subdomain, status, subscription_plan, created_at 
            FROM tenants WHERE id = $1
        `;
        const tenantRes = await pool.query(tenantQuery, [tenantId]);

        if (tenantRes.rowCount === 0) {
            return res.status(404).json({ error: "Tenant not found" });
        }
        const tenant = tenantRes.rows[0];

        // 3. Calculate Stats (Business Logic)
        // We count users from the DB. 
        // Note: Projects/Tasks are set to 0 for now because we haven't built those tables yet.
        const userCountRes = await pool.query(
            'SELECT COUNT(*) FROM users WHERE tenant_id = $1', 
            [tenantId]
        );
        const totalUsers = parseInt(userCountRes.rows[0].count);

        // 4. Send Response (Matches Requirement Image)
        res.status(200).json({
            success: true,
            data: {
                id: tenant.id,
                name: tenant.name,
                subdomain: tenant.subdomain,
                status: tenant.status,
                subscriptionPlan: tenant.subscription_plan,
                maxUsers: 10,       // Default limit (logic can be improved later)
                maxProjects: 20,    // Default limit
                createdAt: tenant.created_at,
                stats: {
                    totalUsers: totalUsers,
                    totalProjects: 0, // Placeholder until Module 2 is built
                    totalTasks: 0     // Placeholder until Module 2 is built
                }
            }
        });

    } catch (error) {
        console.error("Get Tenant Details Error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { getTenantDetails };