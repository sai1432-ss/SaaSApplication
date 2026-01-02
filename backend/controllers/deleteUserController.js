const pool = require('../db');

const deleteUser = async (req, res) => {
    const { userId } = req.params; // ID of user to delete
    const requestingUser = req.user; // ID of admin doing the deleting

    try {
        // 1. Fetch Target User (to check which tenant they belong to)
        const targetUserRes = await pool.query(
            "SELECT id, tenant_id, role, email FROM users WHERE id = $1",
            [userId]
        );

        if (targetUserRes.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        const targetUser = targetUserRes.rows[0];

        // 2. AUTHORIZATION CHECK 🛡️
        // You must be a 'tenant_admin' belonging to the SAME tenant
        if (requestingUser.role !== 'tenant_admin' || requestingUser.tenantId !== targetUser.tenant_id) {
            return res.status(403).json({ error: "Access denied. Only Tenant Admins can delete users." });
        }

        // 3. SELF-DELETION CHECK (Critical Safety Rule)
        if (requestingUser.userId === targetUser.id) {
            return res.status(403).json({ error: "Operation failed. You cannot delete yourself." });
        }

        // 4. LOG TO AUDIT TABLE (Before deletion, so we have a record)
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) 
             VALUES ($1, $2, $3, $4, $5)`,
            [targetUser.tenant_id, requestingUser.userId, 'DELETE_USER', 'USER', userId]
        );

        // 5. PERFORM DELETION
        // Note: In a real app with Projects/Tasks, you might want to "Soft Delete" (is_active = false)
        // instead of "Hard Delete". But your requirements say DELETE, so we will remove the row.
        await pool.query("DELETE FROM users WHERE id = $1", [userId]);

        // 6. SUCCESS RESPONSE
        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });

    } catch (error) {
        console.error("Delete User Error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { deleteUser };