const pool = require('../db');

const listProjects = async (req, res) => {
    // 0. Extract role and tenantId from the verified token
    const { tenantId, role } = req.user; 

    try {
        // 1. Parse Query Parameters
        let { page, limit, search, status } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 20;
        if (limit > 100) limit = 100; 
        const offset = (page - 1) * limit;

        // 2. Build Dynamic Query
        let whereClauses = [];
        let values = [];
        let index = 1; 

        // --- SUPER ADMIN LOGIC ---
        // Only filter by tenant_id if the user is NOT a super_admin
        if (role !== 'super_admin') {
            whereClauses.push(`p.tenant_id = $${index++}`);
            values.push(tenantId);
        }

        // Search Filter
        if (search) {
            whereClauses.push(`p.name ILIKE $${index++}`);
            values.push(`%${search}%`);
        }

        // Status Filter
        if (status) {
            whereClauses.push(`p.status = $${index++}`);
            values.push(status);
        }

        // Finalize WHERE string
        const whereString = whereClauses.length > 0 
            ? `WHERE ${whereClauses.join(' AND ')}` 
            : '';

        // 3. Get Total Count
        const countQuery = `SELECT COUNT(*) FROM projects p ${whereString}`;
        const countResult = await pool.query(countQuery, values);
        const totalProjects = parseInt(countResult.rows[0].count);

        // 4. Fetch Data with Join
        // Added 't.name' as 'organization_name' so Super Admin knows which company owns the project
        const dataQuery = `
            SELECT 
                p.id, 
                p.name, 
                p.description, 
                p.status, 
                p.created_at,
                u.id as creator_id,
                u.full_name as creator_name,
                ten.name as organization_name
            FROM projects p
            LEFT JOIN users u ON p.created_by = u.id
            LEFT JOIN tenants ten ON p.tenant_id = ten.id
            ${whereString}
            ORDER BY p.created_at DESC
            LIMIT $${index++} OFFSET $${index}
        `;

        // Add limit and offset to values array
        values.push(limit, offset);

        const result = await pool.query(dataQuery, values);

        // 5. Format Response
        const projects = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            status: row.status,
            organization: row.organization_name, // Useful for Super Admin view
            createdBy: {
                id: row.creator_id,
                fullName: row.creator_name
            },
            taskCount: 0,
            completedTaskCount: 0,
            createdAt: row.created_at
        }));

        res.status(200).json({
            success: true,
            data: {
                projects: projects,
                total: totalProjects,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalProjects / limit),
                    totalItems: totalProjects,
                    limit: limit
                }
            }
        });

    } catch (error) {
        console.error("List Projects Error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { listProjects };