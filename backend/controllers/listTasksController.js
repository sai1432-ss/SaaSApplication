const pool = require('../db');

const listProjectTasks = async (req, res) => {
    const { projectId } = req.params;
    const { tenantId, role } = req.user; // Get both tenantId and role from the token

    try {
        // 1. Parse Query Parameters
        let { page, limit, search, status, priority, assignedTo } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 50;
        if (limit > 100) limit = 100;
        const offset = (page - 1) * limit;

        // 2. VERIFY PROJECT ACCESS (Conditional Security Check)
        // If the user is a super_admin, we skip the tenant_id ownership check.
        if (role !== 'super_admin') {
            const projectCheck = await pool.query(
                "SELECT id FROM projects WHERE id = $1 AND tenant_id = $2",
                [projectId, tenantId]
            );
            if (projectCheck.rowCount === 0) {
                return res.status(404).json({ error: "Project not found in your organization" });
            }
        }

        // 3. Build Dynamic Query
        let whereClauses = [`t.project_id = $1`];
        let values = [projectId];
        let index = 2; // Parameters start from $2 now

        // --- SUPER ADMIN LOGIC ---
        // Only add the strict tenant filter if the user is NOT a super_admin
        if (role !== 'super_admin') {
            whereClauses.push(`t.tenant_id = $${index++}`);
            values.push(tenantId);
        }

        // Search Filter
        if (search) {
            whereClauses.push(`t.title ILIKE $${index++}`);
            values.push(`%${search}%`);
        }

        // Status Filter
        if (status) {
            whereClauses.push(`t.status = $${index++}`);
            values.push(status);
        }

        // Priority Filter
        if (priority) {
            whereClauses.push(`t.priority = $${index++}`);
            values.push(priority);
        }

        // Assigned User Filter
        if (assignedTo) {
            whereClauses.push(`t.assigned_to = $${index++}`);
            values.push(assignedTo);
        }

        const whereString = `WHERE ${whereClauses.join(' AND ')}`;

        // 4. Get Total Count
        const countQuery = `SELECT COUNT(*) FROM tasks t ${whereString}`;
        const countResult = await pool.query(countQuery, values);
        const totalTasks = parseInt(countResult.rows[0].count);

        // 5. Fetch Data with Join
        const dataQuery = `
            SELECT 
                t.id, 
                t.title, 
                t.description, 
                t.status, 
                t.priority, 
                t.due_date,
                t.created_at,
                u.id as assignee_id,
                u.full_name as assignee_name,
                u.email as assignee_email
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            ${whereString}
            ORDER BY t.priority DESC, t.due_date ASC
            LIMIT $${index++} OFFSET $${index}
        `;

        values.push(limit, offset);

        const result = await pool.query(dataQuery, values);

        // 6. Format Response
        const tasks = result.rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            status: row.status,
            priority: row.priority,
            assignedTo: row.assignee_id ? {
                id: row.assignee_id,
                fullName: row.assignee_name,
                email: row.assignee_email
            } : null,
            dueDate: row.due_date,
            createdAt: row.created_at
        }));

        res.status(200).json({
            success: true,
            data: {
                tasks: tasks,
                total: totalTasks,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalTasks / limit),
                    totalTasks: totalTasks,
                    limit: limit
                }
            }
        });

    } catch (error) {
        console.error("List Tasks Error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { listProjectTasks };