const pool = require('../db');

const updateProject = async (req, res) => {
    const { projectId } = req.params;
    const { name, description, status } = req.body;
    const { tenantId, userId, role } = req.user; // From Middleware

    try {
        // 1. Fetch Target Project (to check ownership and tenant)
        const targetProjectRes = await pool.query(
            "SELECT id, tenant_id, created_by FROM projects WHERE id = $1",
            [projectId]
        );

        if (targetProjectRes.rowCount === 0) {
            return res.status(404).json({ error: "Project not found" });
        }
        const targetProject = targetProjectRes.rows[0];

        // 2. TENANT CHECK 🛡️
        // Ensure the project belongs to the requesting user's tenant
        if (targetProject.tenant_id !== tenantId) {
            return res.status(404).json({ error: "Project not found in your organization" });
        }

        // 3. AUTHORIZATION CHECK 🛡️
        // Allow if User is the Creator OR User is a Tenant Admin
        const isCreator = targetProject.created_by === userId;
        const isAdmin = role === 'tenant_admin';

        if (!isCreator && !isAdmin) {
            return res.status(403).json({ 
                error: "Access denied. Only the Project Creator or Tenant Admin can update this." 
            });
        }

        // 4. Build Dynamic Query
        let fields = [];
        let values = [];
        let index = 1;

        if (name) {
            fields.push(`name = $${index++}`);
            values.push(name);
        }
        if (description) {
            fields.push(`description = $${index++}`);
            values.push(description);
        }
        if (status) {
            fields.push(`status = $${index++}`);
            values.push(status);
        }

        // Always update 'updated_at'
        fields.push(`updated_at = NOW()`);

        if (fields.length === 1) { // Only updated_at was pushed, meaning no body fields
            return res.status(400).json({ error: "No fields provided for update" });
        }

        // Add projectId as the last parameter
        values.push(projectId);
        
        const query = `
            UPDATE projects 
            SET ${fields.join(', ')} 
            WHERE id = $${index} 
            RETURNING id, name, description, status, updated_at
        `;

        const result = await pool.query(query, values);
        const updatedProject = result.rows[0];

        // 5. LOG TO AUDIT TABLE
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) 
             VALUES ($1, $2, $3, $4, $5)`,
            [tenantId, userId, 'UPDATE_PROJECT', 'PROJECT', projectId]
        );

        // 6. SUCCESS RESPONSE
        res.status(200).json({
            success: true,
            message: "Project updated successfully",
            data: {
                id: updatedProject.id,
                name: updatedProject.name,
                description: updatedProject.description,
                status: updatedProject.status,
                updatedAt: updatedProject.updated_at
            }
        });

    } catch (error) {
        console.error("Update Project Error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { updateProject };