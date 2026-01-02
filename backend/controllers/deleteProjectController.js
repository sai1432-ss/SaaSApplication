const pool = require('../db');

const deleteProject = async (req, res) => {
    const { projectId } = req.params;
    const { tenantId, userId, role } = req.user; // From Middleware

    try {
        // 1. Fetch Target Project (to check ownership and tenant)
        const targetProjectRes = await pool.query(
            "SELECT id, tenant_id, created_by, name FROM projects WHERE id = $1",
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
                error: "Access denied. Only the Project Creator or Tenant Admin can delete this." 
            });
        }

        // 4. LOG TO AUDIT TABLE (Before deletion)
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) 
             VALUES ($1, $2, $3, $4, $5)`,
            [tenantId, userId, 'DELETE_PROJECT', 'PROJECT', projectId]
        );

        // 5. PERFORM DELETION
        // Note: If you have tasks linked to this project later, 
        // they will auto-delete if you set up "ON DELETE CASCADE" in your DB schema.
        await pool.query("DELETE FROM projects WHERE id = $1", [projectId]);

        // 6. SUCCESS RESPONSE
        res.status(200).json({
            success: true,
            message: "Project deleted successfully"
        });

    } catch (error) {
        console.error("Delete Project Error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { deleteProject };