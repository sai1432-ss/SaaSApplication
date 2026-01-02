const pool = require('../db');

const listTenantUsers = async (req, res) => {
    const { tenantId } = req.params;
    const requestingUser = req.user; // From Middleware

    // 1. AUTHORIZATION CHECK
    // You can only view users if you belong to this tenant (or are a super_admin)
    if (requestingUser.tenantId !== tenantId && requestingUser.role !== 'super_admin') {
        return res.status(403).json({ error: "Access denied. You cannot view users of another tenant." });
    }

    try {
        // 2. Parse Query Parameters (Defaults: Page 1, Limit 50)
        let { page, limit, search, role } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 50;
        if (limit > 100) limit = 100; // Cap max limit
        const offset = (page - 1) * limit;

        // 3. Build Dynamic Query
        let whereClauses = [`tenant_id = $1`]; // Always filter by tenant!
        let values = [tenantId];
        let index = 2; // $1 is tenantId, start others at $2

        // Search Filter (Case-insensitive check on Name OR Email)
        if (search) {
            whereClauses.push(`(full_name ILIKE $${index} OR email ILIKE $${index})`);
            values.push(`%${search}%`);
            index++;
        }

        // Role Filter
        if (role) {
            whereClauses.push(`role = $${index}`);
            values.push(role);
            index++;
        }

        const whereString = `WHERE ${whereClauses.join(' AND ')}`;

        // 4. Get Total Count (For Pagination Metadata)
        const countQuery = `SELECT COUNT(*) FROM users ${whereString}`;
        const countResult = await pool.query(countQuery, values);
        const totalUsers = parseInt(countResult.rows[0].count);

        // 5. Fetch Data (Exclude Password Hash!)
        const dataQuery = `
            SELECT id, email, full_name, role, is_active, created_at
            FROM users 
            ${whereString}
            ORDER BY created_at DESC
            LIMIT $${index} OFFSET $${index + 1}
        `;
        
        // Add limit and offset to values array
        values.push(limit, offset);

        const result = await pool.query(dataQuery, values);

        // 6. Send Response
        res.status(200).json({
            success: true,
            data: {
                users: result.rows.map(user => ({
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    isActive: user.is_active,
                    createdAt: user.created_at
                })),
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalUsers / limit),
                    totalUsers: totalUsers,
                    limit: limit
                }
            }
        });

    } catch (error) {
        console.error("List Users Error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { listTenantUsers };