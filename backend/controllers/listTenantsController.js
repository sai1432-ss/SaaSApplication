const pool = require('../db');

const listAllTenants = async (req, res) => {
    try {
        const { role } = req.user;
        
        // 1. AUTHORIZATION CHECK (Strictly Super Admin Only)
        if (role !== 'super_admin') {
            return res.status(403).json({ error: "Access denied. Super Admins only." });
        }

        // 2. Parse Query Parameters (with defaults)
        let { page, limit, status, subscriptionPlan } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const offset = (page - 1) * limit;

        // 3. Build Dynamic Query
        let whereClauses = [];
        let values = [];
        let index = 1;

        if (status) {
            whereClauses.push(`status = $${index++}`);
            values.push(status);
        }
        if (subscriptionPlan) {
            whereClauses.push(`subscription_plan = $${index++}`);
            values.push(subscriptionPlan);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // 4. Get Total Count (For Pagination Metadata)
        const countQuery = `SELECT COUNT(*) FROM tenants ${whereString}`;
        const countResult = await pool.query(countQuery, values);
        const totalTenants = parseInt(countResult.rows[0].count);

        // 5. Fetch Tenants with Stats
        // We use a Subquery to count users for each tenant efficiently
        const dataQuery = `
            SELECT 
                t.id, t.name, t.subdomain, t.status, t.subscription_plan, t.created_at,
                (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) as total_users
            FROM tenants t
            ${whereString}
            ORDER BY t.created_at DESC
            LIMIT $${index++} OFFSET $${index}
        `;
        
        // Add limit and offset to values array
        values.push(limit, offset);

        const result = await pool.query(dataQuery, values);

        // 6. Format Response
        const tenants = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            subdomain: row.subdomain,
            status: row.status,
            subscriptionPlan: row.subscription_plan,
            totalUsers: parseInt(row.total_users), // Real User Count
            totalProjects: 0, // Placeholder (until Module 2)
            createdAt: row.created_at
        }));

        res.status(200).json({
            success: true,
            data: {
                tenants: tenants,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalTenants / limit),
                    totalTenants: totalTenants,
                    limit: limit
                }
            }
        });

    } catch (error) {
        console.error("List Tenants Error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { listAllTenants };