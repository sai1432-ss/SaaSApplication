const pool = require('../db');

/**
 * Updates the Organization (Tenant) Name
 * Only accessible by tenant_admin
 */
const updateTenantName = async (req, res) => {
    const { tenantId, role } = req.user;
    const { name } = req.body;

    if (role !== 'tenant_admin') {
        return res.status(403).json({ error: "Access denied. Only Admins can update settings." });
    }

    if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: "A valid organization name is required." });
    }

    try {
        await pool.query(
            "UPDATE tenants SET name = $1, updated_at = NOW() WHERE id = $2",
            [name.trim(), tenantId]
        );

        res.status(200).json({ 
            success: true, 
            message: "Organization name updated successfully." 
        });
    } catch (error) {
        console.error("Update Tenant Name Error:", error);
        res.status(500).json({ error: "Failed to update organization name." });
    }
};

/**
 * Deletes the entire Organization (Tenant)
 * This relies on ON DELETE CASCADE for users, projects, and tasks
 */
const deleteTenantAction = async (req, res) => {
    const { tenantId, role } = req.user;

    if (role !== 'tenant_admin') {
        return res.status(403).json({ error: "Access denied. Only Admins can delete the organization." });
    }

    try {
        // Deleting the tenant will trigger cascade deletes for users, projects, tasks, and audit logs
        const result = await pool.query("DELETE FROM tenants WHERE id = $1", [tenantId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Organization not found." });
        }
        
        res.status(200).json({ 
            success: true, 
            message: "Organization and all associated data have been permanently deleted." 
        });
    } catch (error) {
        console.error("Delete Tenant Error:", error);
        res.status(500).json({ error: "Failed to delete organization. Ensure all database constraints allow cascading." });
    }
};

module.exports = { updateTenantName, deleteTenantAction };