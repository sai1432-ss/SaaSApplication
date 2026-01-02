const pool = require('../db');

const logoutUser = async (req, res) => {
    try {
        // Get user info from the token (Middleware provides this)
        const { userId, tenantId } = req.user;

        // 1. Log the action into your EXISTING table structure
        // We map "details" to "entity_type" since 'details' column doesn't exist
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) 
             VALUES ($1, $2, $3, $4, $5)`,
            [
                tenantId,      // $1 -> Matches your 'tenant_id' column
                userId,        // $2 -> Matches your 'user_id' column
                'LOGOUT',      // $3 -> Matches your 'action' column
                'AUTH',        // $4 -> Matches 'entity_type' (Categorizing this as an Auth event)
                userId         // $5 -> Matches 'entity_id' (The entity being acted upon is the user)
            ]
        );

        // 2. Send Success Response
        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (error) {
        console.error("Logout Error:", error.message);
        res.status(500).json({ error: "Server error during logout" });
    }
};

module.exports = { logoutUser };