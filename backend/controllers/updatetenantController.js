const pool = require('../db');

const updateTenant = async (req, res) => {
    const { tenantId } = req.params;
    const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;
    const requestingUser = req.user; // From Middleware

    // 1. AUTHORIZATION CHECK
    if (requestingUser.role !== 'super_admin' && requestingUser.tenantId !== tenantId) {
        return res.status(403).json({ error: "Unauthorized access" });
    }

    // 2. RESTRICTED FIELDS CHECK
    if (requestingUser.role !== 'super_admin') {
        if (status || subscriptionPlan || maxUsers || maxProjects) {
            return res.status(403).json({ 
                error: "Permission denied. Only Super Admins can update status or plans." 
            });
        }
    }

    try {
        // 3. Build Dynamic Query
        let fields = [];
        let values = [];
        let index = 1;

        if (name) { fields.push(`name = $${index++}`); values.push(name); }
        if (status) { fields.push(`status = $${index++}`); values.push(status); }
        if (subscriptionPlan) { fields.push(`subscription_plan = $${index++}`); values.push(subscriptionPlan); }

        if (fields.length === 0) {
            return res.status(400).json({ error: "No fields provided for update" });
        }

        values.push(tenantId);
        
        const query = `
            UPDATE tenants 
            SET ${fields.join(', ')} 
            WHERE id = $${index} 
            RETURNING id, name, status, subscription_plan
        `;

        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Tenant not found" });
        }

        // 4. LOG TO AUDIT TABLE
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) 
             VALUES ($1, $2, $3, $4, $5)`,
            [tenantId, requestingUser.userId, 'UPDATE_TENANT', 'TENANT', tenantId]
        );

        res.status(200).json({
            success: true,
            message: "Tenant updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Update Tenant Error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { updateTenant };