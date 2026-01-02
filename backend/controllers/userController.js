const pool = require('../db');

const getCurrentUser = async (req, res) => {
    try {
        console.log("\n👤 GET USER CONTROLLER HIT");
        const { userId, tenantId } = req.user; 
        console.log(`   Looking for User ID: ${userId}, Tenant ID: ${tenantId}`);

        // 1. Fetch User
        const query = `
            SELECT 
                u.id, u.email, u.full_name, u.role, u.is_active,
                t.id as tenant_id, t.name as tenant_name, t.subdomain, t.subscription_plan
            FROM users u
            JOIN tenants t ON u.tenant_id = t.id
            WHERE u.id = $1 AND t.id = $2
        `;
        
        const result = await pool.query(query, [userId, tenantId]);
        console.log(`   Database found ${result.rowCount} rows.`);

        if (result.rowCount === 0) {
            console.log("   ❌ ERROR: User/Tenant combo not found in DB.");
            return res.status(404).json({ error: "User not found" });
        }

        const rawData = result.rows[0];
        console.log("   ✅ SUCCESS: Sending Data...");

        const responseData = {
            success: true,
            data: {
                id: rawData.id,
                email: rawData.email,
                fullName: rawData.full_name,
                role: rawData.role,
                isActive: rawData.is_active,
                tenant: {
                    id: rawData.tenant_id,
                    name: rawData.tenant_name,
                    subdomain: rawData.subdomain,
                    subscriptionPlan: rawData.subscription_plan
                }
            }
        };

        res.json(responseData);

    } catch (error) {
        console.error("   🔥 SERVER ERROR:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
};

module.exports = { getCurrentUser };