const pool = require('../db');

const updateUser = async (req, res) => {
    const { userId } = req.params; // The ID of the user being updated
    const { fullName, role, isActive } = req.body;
    const requestingUser = req.user; // The person performing the action (from Token)

    try {
        // 1. Fetch Target User (to check which tenant they belong to)
        const targetUserRes = await pool.query(
            "SELECT id, tenant_id, role FROM users WHERE id = $1",
            [userId]
        );

        if (targetUserRes.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        const targetUser = targetUserRes.rows[0];

        // 2. AUTHORIZATION CHECK 🛡️
        // Case A: Updating Self (Allowed, but restricted fields later)
        const isSelfUpdate = requestingUser.userId === userId;

        // Case B: Tenant Admin updating an employee (Must be same tenant)
        const isTenantAdmin = requestingUser.role === 'tenant_admin' && 
                              requestingUser.tenantId === targetUser.tenant_id;

        // Case C: Super Admin (Can update anyone)
        const isSuperAdmin = requestingUser.role === 'super_admin';

        if (!isSelfUpdate && !isTenantAdmin && !isSuperAdmin) {
            return res.status(403).json({ error: "Access denied. You cannot update this user." });
        }

        // 3. RESTRICTED FIELDS CHECK
        // If you are just a normal user updating yourself, you CANNOT change role or status
        if (isSelfUpdate && !isTenantAdmin && !isSuperAdmin) {
            if (role || isActive !== undefined) {
                return res.status(403).json({ 
                    error: "Permission denied. You cannot change your own role or active status." 
                });
            }
        }

        // 4. Build Dynamic Query
        let fields = [];
        let values = [];
        let index = 1;

        if (fullName) {
            fields.push(`full_name = $${index++}`);
            values.push(fullName);
        }
        
        // Only Admins can update Role & Status
        if (isTenantAdmin || isSuperAdmin) {
            if (role) {
                fields.push(`role = $${index++}`);
                values.push(role);
            }
            if (isActive !== undefined) {
                fields.push(`is_active = $${index++}`);
                values.push(isActive);
            }
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: "No valid fields provided for update" });
        }

        // Add userId as the last parameter for WHERE clause
        values.push(userId);
        
        const query = `
            UPDATE users 
            SET ${fields.join(', ')} 
            WHERE id = $${index} 
            RETURNING id, full_name, role, is_active, created_at
        `;

        const result = await pool.query(query, values);
        const updatedUser = result.rows[0];

        // 5. LOG TO AUDIT TABLE
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) 
             VALUES ($1, $2, $3, $4, $5)`,
            [targetUser.tenant_id, requestingUser.userId, 'UPDATE_USER', 'USER', userId]
        );

        // 6. SUCCESS RESPONSE
        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: {
                id: updatedUser.id,
                fullName: updatedUser.full_name,
                role: updatedUser.role,
                isActive: updatedUser.is_active, // Frontend needs this to show "Active/Inactive" badge
                updatedAt: new Date()
            }
        });

    } catch (error) {
        console.error("Update User Error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { updateUser };